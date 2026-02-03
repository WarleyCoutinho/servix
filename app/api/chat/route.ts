import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import z from "zod";
import { prisma } from "@/lib/prisma";
import { getDateAvailableTimeSlots } from "@/actions/get-date-available-time-slots";
import { createBooking } from "@/actions/create-booking";

export const POST = async (request: Request) => {
  const { messages } = await request.json();
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    system: `Você é o Agenda.ai, um assistente virtual de agendamento de barbearias.

    DATA ATUAL: Hoje é ${new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })} (${new Date().toISOString().split("T")[0]})
chat/r
    Seu objetivo é ajudar os usuários a:
    - Encontrar barbearias (por nome ou todas disponíveis)
    - Verificar disponibilidade de horários para barbearias específicas
    - Fornecer informações sobre serviços e preços

    Fluxo de atendimento:

    CENÁRIO 1 - Usuário menciona data/horário na primeira mensagem (ex: "quero um corte pra hoje", "preciso cortar o cabelo amanhã", "quero marcar para sexta"):
    1. Use a ferramenta searchBarbershops para buscar barbearias
    2. IMEDIATAMENTE após receber as barbearias, use a ferramenta getAvailableTimeSlotsForBarbershop para CADA barbearia retornada, passando a data mencionada pelo usuário
    3. Apresente APENAS as barbearias que têm horários disponíveis, mostrando:
       - Nome da barbearia
       - Endereço
       - Serviços oferecidos com preços
       - Alguns horários disponíveis (4-5 opções espaçadas)
    4. Quando o usuário escolher, forneça o resumo final

    CENÁRIO 2 - Usuário não menciona data/horário inicialmente:
    1. Use a ferramenta searchBarbershops para buscar barbearias
    2. Apresente as barbearias encontradas com:
       - Nome da barbearia
       - Endereço
       - Serviços oferecidos com preços
    3. Quando o usuário demonstrar interesse em uma barbearia específica ou mencionar uma data, pergunte a data desejada (se ainda não foi informada)
    4. Use a ferramenta getAvailableTimeSlotsForBarbershop passando o barbershopId e a data
    5. Apresente os horários disponíveis (liste alguns horários, não todos - sugira 4-5 opções espaçadas)

    Resumo final (quando o usuário escolher):
    - Nome da barbearia
    - Endereço
    - Serviço escolhido
    - Data e horário escolhido
    - Preço

    Criação da reserva:
    - Após o usuário confirmar explicitamente a escolha (ex: "confirmo", "pode agendar", "quero esse horário"), use a tool createBooking
    - Parâmetros necessários:
      * serviceId: ID do serviço escolhido
      * date: Data e horário no formato ISO (YYYY-MM-DDTHH:mm:ss) - exemplo: "2025-11-05T10:00:00"
    - Se a criação for bem-sucedida (success: true), informe ao usuário que a reserva foi confirmada com sucesso
    - Se houver erro (success: false), explique o erro ao usuário:
      * Se o erro for "User must be logged in", informe que é necessário fazer login para criar uma reserva
      * Para outros erros, informe que houve um problema e peça para tentar novamente

    Importante:
    - NUNCA mostre informações técnicas ao usuário (barbershopId, serviceId, formatos ISO de data, etc.)
    - Seja sempre educado, prestativo e use uma linguagem informal e amigável
    - Não liste TODOS os horários disponíveis, sugira apenas 4-5 opções espaçadas ao longo do dia
    - Se não houver horários disponíveis, sugira uma data alternativa
    - Quando o usuário mencionar "hoje", "amanhã", "depois de amanhã" ou dias da semana, calcule a data correta automaticamente`,
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
          if (!name?.trim()) {
            const barbershops = await prisma.barbershop.findMany({
              include: {
                services: true,
              },
            });
            return barbershops;
          }
          const barbershops = await prisma.barbershop.findMany({
            where: {
              name: {
                contains: name,
                mode: "insensitive",
              },
            },
            include: {
              services: true,
            },
          });
          return barbershops;
        },
      }),
      getAvailableTimeSlotsForBarbershop: tool({
        description:
          "Obtém os horários disponíveis para uma barbearia específica.",
        inputSchema: z.object({
          barbershopId: z.string().uuid(),
          date: z
            .string()
            .describe(
              "A data no formato ISO (YYYY-MM-DD) para a qual você deseja verificar os horários disponíveis.",
            ),
        }),
        execute: async ({ barbershopId, date }) => {
          console.log("getAvailableTimeSlotsForBarbershop", barbershopId, date);
          const availableTimeSlots = await getDateAvailableTimeSlots({
            barbershopId,
            date: new Date(date),
          });
          return {
            barbershopId,
            date,
            availableTimeSlots,
          };
        },
      }),
      createBooking: tool({
        description:
          "Cria um novo agendamento para um serviço específico em uma data específica.",
        inputSchema: z.object({
          serviceId: z.uuid(),
          date: z
            .string()
            .describe(
              "A data no formato ISO (YYYY-MM-DD) para a qual você deseja criar o agendamento.",
            ),
        }),
        execute: async ({ serviceId, date }) => {
          console.log("createBooking", serviceId, date);
          try {
            await createBooking({
              serviceId,
              date: new Date(date),
            });
            return {
              success: true,
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
