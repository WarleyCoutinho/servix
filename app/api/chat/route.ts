import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import z from "zod";
import { prisma, safeQuery } from "@/lib/prisma";
import { getAvailableSlots } from "@/actions/schedules/get-available-slots";
import { createBooking } from "@/actions/create-booking";
import { createBookingCheckoutSession } from "@/actions/create-booking-checkout-session";
import { formatBrt } from "@/lib/timezone";

export const POST = async (request: Request) => {
  const { auth: authLib } = await import("@/lib/auth");
  const { headers } = await import("next/headers");
  const session = await authLib.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = await request.json();
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    system: `Você é o Agenda.ai, um assistente virtual de agendamento de barbearias.

    DATA ATUAL: Hoje é ${formatBrt(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")} (${formatBrt(new Date(), "yyyy-MM-dd")})

    Seu objetivo é ajudar os usuários a:
    - Encontrar barbearias (por nome ou todas disponíveis)
    - Listar profissionais disponíveis de uma barbearia
    - Verificar disponibilidade de horários para um profissional específico
    - Fornecer informações sobre serviços e preços

    Fluxo de atendimento:

    CENÁRIO 1 - Usuário menciona data/horário na primeira mensagem (ex: "quero um corte pra hoje", "preciso cortar o cabelo amanhã", "quero marcar para sexta"):
    1. Use a ferramenta searchBarbershops para buscar barbearias
    2. Para cada barbearia, use getProfessionalsForBarbershop para listar os profissionais
    3. Para cada profissional, use getAvailableTimeSlotsForProfessional para verificar disponibilidade
    4. Apresente APENAS as barbearias/profissionais que têm horários disponíveis, mostrando:
       - Nome da barbearia
       - Endereço
       - Nome do profissional
       - Serviços oferecidos com preços
       - Alguns horários disponíveis (4-5 opções espaçadas)
    5. Quando o usuário escolher, forneça o resumo final

    CENÁRIO 2 - Usuário não menciona data/horário inicialmente:
    1. Use a ferramenta searchBarbershops para buscar barbearias
    2. Apresente as barbearias encontradas com:
       - Nome da barbearia
       - Endereço
       - Serviços oferecidos com preços
    3. Quando o usuário demonstrar interesse em uma barbearia, use getProfessionalsForBarbershop para listar profissionais
    4. Pergunte qual profissional e data desejada
    5. Use getAvailableTimeSlotsForProfessional passando barbershopId, professionalId e data
    6. Apresente os horários disponíveis (4-5 opções espaçadas)

    Resumo final (quando o usuário escolher):
    - Nome da barbearia
    - Endereço
    - Profissional escolhido
    - Serviço escolhido
    - Data e horário escolhido
    - Preço

    Forma de pagamento (OBRIGATÓRIO - sempre perguntar ANTES de criar a reserva):
    Após apresentar o resumo final e o usuário confirmar a escolha, SEMPRE pergunte como deseja pagar:
    1. "Pagar agora" - PIX ou cartão via plataforma (pagamento online seguro)
    2. "Pagar após o serviço" - dinheiro, PIX externo ou cartão na maquininha (pagamento presencial)

    Criação da reserva:
    - Só use a tool createBooking APÓS o usuário escolher a forma de pagamento
    - Parâmetros necessários:
      * serviceId: ID do serviço escolhido
      * professionalId: ID do profissional escolhido
      * date: Data e horário no formato ISO (YYYY-MM-DDTHH:mm:ss) - exemplo: "2025-11-05T10:00:00"
      * paymentMethod: "online" se o usuário escolheu pagar agora, "pay_after_service" se escolheu pagar após o serviço
    - Se a criação for bem-sucedida:
      * Para pagamento online (success: true e checkoutUrl presente): informe que a reserva foi pré-criada e forneça o link de pagamento para o usuário finalizar. Diga algo como "Clique no link abaixo para realizar o pagamento e confirmar sua reserva"
      * Para pagamento após o serviço (success: true): informe que a reserva foi confirmada com sucesso e que o pagamento será feito presencialmente
    - Se houver erro (success: false), explique o erro ao usuário:
      * Se o erro for "User must be logged in", informe que é necessário fazer login para criar uma reserva
      * Para outros erros, informe que houve um problema e peça para tentar novamente

    Importante:
    - NUNCA mostre informações técnicas ao usuário (barbershopId, serviceId, professionalId, formatos ISO de data, etc.)
    - Seja sempre educado, prestativo e use uma linguagem informal e amigável
    - Não liste TODOS os horários disponíveis, sugira apenas 4-5 opções espaçadas ao longo do dia
    - Se não houver horários disponíveis, sugira uma data alternativa
    - Quando o usuário mencionar "hoje", "amanhã", "depois de amanhã" ou dias da semana, calcule a data correta automaticamente
    - SEMPRE passe pela etapa de seleção de profissional antes de verificar horários
    - SEMPRE pergunte a forma de pagamento antes de criar a reserva - NUNCA pule esta etapa`,
    tools: {
      searchBarbershops: tool({
        description:
          "Pesquisa barbearias pelo nome. Se nenhum nome é passado, retorna todas as barbearias.",
        inputSchema: z.object({
          name: z
            .string()
            .optional()
            .describe(
              "O nome da barbearia a ser pesquisada. Se nenhum nome é passado, retorna todas as barbearias.",
            ),
        }),
        execute: async ({ name }) => {
          console.log("searchBarbershops", name);
          const { data: barbershops, error } = await safeQuery(
            () =>
              prisma.barbershop.findMany({
                where: name?.trim()
                  ? {
                      name: {
                        contains: name,
                        mode: "insensitive",
                      },
                    }
                  : undefined,
                include: {
                  services: true,
                },
              }),
            []
          );

          if (error) {
            return { error: "Não foi possível buscar as barbearias. Por favor, tente novamente." };
          }

          return barbershops;
        },
      }),
      getProfessionalsForBarbershop: tool({
        description:
          "Lista os profissionais ativos de uma barbearia específica.",
        inputSchema: z.object({
          barbershopId: z.string().uuid(),
        }),
        execute: async ({ barbershopId }) => {
          console.log("getProfessionalsForBarbershop", barbershopId);
          const { data: professionals, error } = await safeQuery(
            () =>
              prisma.professional.findMany({
                where: {
                  barbershopId,
                  isActive: true,
                },
                include: {
                  user: {
                    select: { name: true, image: true },
                  },
                },
                orderBy: { displayName: "asc" },
              }),
            []
          );

          if (error) {
            return { error: "Não foi possível buscar os profissionais." };
          }

          return professionals.map((p) => ({
            id: p.id,
            name: p.displayName ?? p.user.name,
            acceptsPix: p.acceptsPix,
            acceptsCard: p.acceptsCard,
            acceptsPayAfterService: p.acceptsPayAfterService,
          }));
        },
      }),
      getAvailableTimeSlotsForProfessional: tool({
        description:
          "Obtém os horários disponíveis para um profissional específico em uma data.",
        inputSchema: z.object({
          barbershopId: z.string().uuid(),
          professionalId: z.string().uuid(),
          date: z
            .string()
            .describe(
              "A data no formato ISO (YYYY-MM-DD) para a qual você deseja verificar os horários disponíveis.",
            ),
        }),
        execute: async ({ barbershopId, professionalId, date }) => {
          console.log("getAvailableTimeSlotsForProfessional", barbershopId, professionalId, date);
          const result = await getAvailableSlots({
            barbershopId,
            professionalId,
            date: new Date(date),
          });
          return {
            barbershopId,
            professionalId,
            date,
            availableTimeSlots: result?.data?.slots ?? [],
            message: result?.data?.message,
          };
        },
      }),
      createBooking: tool({
        description:
          "Cria um novo agendamento para um serviço e profissional específico em uma data. Sempre inclua o paymentMethod escolhido pelo usuário.",
        inputSchema: z.object({
          serviceId: z.uuid(),
          professionalId: z.uuid(),
          date: z
            .string()
            .describe(
              "A data e hora no formato ISO (YYYY-MM-DDTHH:mm:ss) para o agendamento.",
            ),
          paymentMethod: z
            .enum(["online", "pay_after_service"])
            .describe(
              "Forma de pagamento: 'online' para PIX/cartão via Stripe, 'pay_after_service' para pagamento presencial após o serviço.",
            ),
        }),
        execute: async ({ serviceId, professionalId, date, paymentMethod }) => {
          console.log("createBooking", serviceId, professionalId, date, paymentMethod);
          try {
            if (paymentMethod === "pay_after_service") {
              await createBooking({
                serviceId,
                professionalId,
                date: new Date(date),
                payAfterService: true,
              });
              return {
                success: true,
                paymentMethod: "pay_after_service",
              };
            }

            const result = await createBookingCheckoutSession({
              serviceId,
              professionalId,
              date: new Date(date),
            });

            if (result?.data?.url) {
              return {
                success: true,
                paymentMethod: "online",
                checkoutUrl: result.data.url,
              };
            }

            return {
              success: false,
              error: "Não foi possível gerar o link de pagamento.",
            };
          } catch (error) {
            console.error("createBooking error", error);
            return {
              success: false,
            };
          }
        },
      }),
    },
  });
  return result.toUIMessageStreamResponse();
};
