import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import z from "zod";
import { prisma, safeQuery } from "@/lib/prisma";
import { getAvailableSlots } from "@/actions/schedules/get-available-slots";
import { createBooking } from "@/actions/create-booking";
import { createBookingCheckoutSession } from "@/actions/create-booking-checkout-session";
import { formatBrt } from "@/lib/timezone";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function getAIModel() {
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash-lite";
  const apiKey = process.env.AI_API_KEY;

  return createGoogleGenerativeAI({ apiKey })(model);
}

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

  if (session.user.role !== "client") {
    return new Response(JSON.stringify({ error: "Acesso restrito a clientes" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = await request.json();

  try {
  const result = streamText({
    model: getAIModel(),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    system: `Você é o Agenda.ai, assistente virtual de agendamento do Servix — plataforma SaaS para barbearias, salões de beleza e estética.

    DATA ATUAL: Hoje é ${formatBrt(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")} (${formatBrt(new Date(), "yyyy-MM-dd")})

    SOBRE O SERVIX:
    O Servix é uma plataforma completa de gestão e agendamento online para negócios de beleza. Os clientes podem agendar serviços 24/7 pelo site, escolher profissional e horário, e pagar online (cartão via Stripe) ou presencialmente após o serviço.

    Seu objetivo é ajudar os usuários a:
    - Encontrar barbearias/salões (por nome ou todos disponíveis)
    - Listar profissionais disponíveis
    - Verificar disponibilidade de horários
    - Fornecer informações sobre serviços e preços
    - Criar agendamentos

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
    1. "Pagar agora" - Cartão de crédito via plataforma (pagamento online seguro pelo Stripe)
    2. "Pagar após o serviço" - dinheiro, PIX externo ou cartão na maquininha (pagamento presencial)
    Nota: nem todos os profissionais aceitam todas as formas. Verifique acceptsPix, acceptsCard e acceptsPayAfterService retornados pela tool getProfessionalsForBarbershop.

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
    - SEMPRE pergunte a forma de pagamento antes de criar a reserva - NUNCA pule esta etapa
    - Se o usuário perguntar algo sobre o Servix (planos, como configurar, etc.), responda brevemente e redirecione para o chat de suporte ou o manual do sistema`,
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
          const trimmed = name?.trim();

          if (!trimmed) {
            const { data: barbershops, error } = await safeQuery(
              () =>
                prisma.barbershop.findMany({
                  where: { isActive: true },
                  include: { services: true },
                }),
              []
            );
            if (error) {
              return { error: "Não foi possível buscar as barbearias. Por favor, tente novamente." };
            }
            return barbershops;
          }

          const words = trimmed.split(/\s+/);
          const searchConditions = words.flatMap((word) => [
            { name: { contains: word, mode: "insensitive" as const } },
            { name: { startsWith: word, mode: "insensitive" as const } },
          ]);

          const { data: barbershops, error } = await safeQuery(
            () =>
              prisma.barbershop.findMany({
                where: {
                  isActive: true,
                  OR: searchConditions,
                },
                include: { services: true },
              }),
            []
          );

          if (error) {
            return { error: "Não foi possível buscar as barbearias. Por favor, tente novamente." };
          }

          if (barbershops.length > 0) {
            return barbershops;
          }

          // Fallback: busca todas e filtra por similaridade (fuzzy)
          const { data: allBarbershops, error: allError } = await safeQuery(
            () =>
              prisma.barbershop.findMany({
                where: { isActive: true },
                include: { services: true },
              }),
            []
          );

          if (allError) {
            return { error: "Não foi possível buscar as barbearias. Por favor, tente novamente." };
          }

          const normalize = (s: string) =>
            s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          const normalizedSearch = normalize(trimmed);
          const fuzzyResults = allBarbershops.filter((b) => {
            const normalizedName = normalize(b.name);
            // Checa se alguma palavra do nome começa com o termo buscado ou vice-versa
            const nameWords = normalizedName.split(/\s+/);
            return (
              normalizedName.includes(normalizedSearch) ||
              normalizedSearch.includes(normalizedName) ||
              nameWords.some(
                (w) => w.startsWith(normalizedSearch) || normalizedSearch.startsWith(w)
              ) ||
              words.some((searchWord) => {
                const nw = normalize(searchWord);
                return nameWords.some(
                  (w) => w.startsWith(nw) || nw.startsWith(w) || levenshtein(w, nw) <= 2
                );
              })
            );
          });

          return fuzzyResults;
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
  } catch (error) {
    console.error("Chat AI error:", error);

    const isRateLimit =
      error instanceof Error &&
      (error.message?.includes("429") ||
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.message?.includes("quota"));

    if (isRateLimit) {
      return new Response(
        JSON.stringify({
          error:
            "Nosso assistente está temporariamente indisponível devido ao alto número de atendimentos. " +
            "Mas não se preocupe! Você pode agendar normalmente pela plataforma: " +
            "acesse o menu 'Barbearias e salões', escolha o estabelecimento, selecione o profissional e horário desejado. " +
            "É rápido e fácil! 😊",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        error:
          "Ops! Ocorreu um erro no assistente. Tente novamente em alguns instantes ou agende pelo modo convencional " +
          "acessando 'Barbearias e salões' no menu.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
