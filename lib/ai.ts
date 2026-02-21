import { GoogleGenerativeAI } from "@google/generative-ai";

type AIProvider = "gemini" | "openai" | "anthropic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "gemini") as AIProvider;
  if (!["gemini", "openai", "anthropic"].includes(provider)) {
    throw new Error(
      `AI_PROVIDER "${provider}" não suportado. Use: gemini, openai ou anthropic`,
    );
  }
  return provider;
}

function getApiKey(): string {
  const key = process.env.AI_API_KEY;
  if (!key) {
    throw new Error("AI_API_KEY não configurada");
  }
  return key;
}

function getModel(): string {
  return process.env.AI_MODEL ?? "gemini-2.5-flash-lite";
}

async function responderGemini(
  messages: ChatMessage[],
  systemPrompt: string,
  maxTokens: number,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: getModel(),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: maxTokens,
    },
  });

  const history = messages.slice(-10).map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  const historyForChat = history.slice(0, -1);
  const firstUserIndex = historyForChat.findIndex((m) => m.role === "user");
  const sanitizedHistory =
    firstUserIndex > 0 ? historyForChat.slice(firstUserIndex) : historyForChat;

  const chat = model.startChat({
    history: sanitizedHistory,
    systemInstruction: systemPrompt,
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

async function responderOpenAI(
  messages: ChatMessage[],
  systemPrompt: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function responderAnthropic(
  messages: ChatMessage[],
  systemPrompt: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export async function responder(
  messages: ChatMessage[],
  systemPrompt: string,
  maxTokens = 800,
): Promise<string> {
  const provider = getProvider();

  switch (provider) {
    case "gemini":
      return responderGemini(messages, systemPrompt, maxTokens);
    case "openai":
      return responderOpenAI(messages, systemPrompt, maxTokens);
    case "anthropic":
      return responderAnthropic(messages, systemPrompt, maxTokens);
  }
}

export const SERVIX_SUPPORT_PROMPT = `Você é o assistente de suporte do Servix, uma plataforma SaaS de agendamento para barbearias, salões de beleza e estética.

REGRAS OBRIGATÓRIAS:
- Responda SEMPRE em português brasileiro
- Seja educado, objetivo e prestativo
- NUNCA invente informações sobre planos, preços ou funcionalidades
- Use apenas os dados oficiais abaixo
- Se não souber a resposta, oriente o usuário a entrar em contato com o suporte humano

PLANOS SERVIX:
1. Solo (BASIC) — R$ 39,90/mês
   - 1 loja, 1 profissional, até 4 serviços
   - Agendamento online 24/7, página pública do negócio
   - Pagamentos online integrados (cartão via Stripe)
   - Suporte via chat IA

2. Equipe (STANDARD) — R$ 79,90/mês
   - 1 loja, até 5 profissionais, até 20 serviços
   - Tudo do Solo +
   - Agendamento por profissional individual
   - Comissão automática por profissional
   - Relatórios de faturamento
   - Suporte via chat

3. Profissional (PROFESSIONAL) — R$ 129,90/mês
   - 1 loja, até 20 profissionais, até 50 serviços
   - Tudo do Equipe +
   - Relatórios avançados por unidade
   - Ranking de desempenho por profissional
   - Histórico completo de clientes
   - Suporte prioritário direto (WhatsApp + e-mail)

FUNCIONALIDADES PRINCIPAIS:
- Agendamento online 24/7: clientes agendam a qualquer hora pelo site
- Notificações WhatsApp: agenda atualizada enviada automaticamente ao grupo do profissional após cada agendamento ou cancelamento
- Pagamento online com cartão de crédito via Stripe
- Pagamento presencial: opção "Pagar após o serviço" (dinheiro, PIX externo ou maquininha)
- Controle de horários: expediente, intervalo de almoço, dias de folga por profissional
- Gestão de equipe: agenda e ganhos de cada profissional em tempo real
- Login com Google, configuração em menos de 10 minutos
- Página pública do negócio com serviços, preços e agendamento direto

FLUXO DE CONFIGURAÇÃO PARA PROPRIETÁRIOS:
1. Login com Google → escolher perfil Proprietário
2. Criar loja (nome, endereço, cidade, estado, telefone, CPF, descrição, foto)
3. Ativar plano de assinatura (escolher Solo, Equipe ou Profissional)
4. Cadastrar profissionais (nome, e-mail Google, nome do grupo WhatsApp)
5. Cadastrar serviços (nome, preço, duração, foto)
6. Profissional configura: formas de pagamento, WhatsApp, horários, Stripe

CONFIGURAÇÃO STRIPE (feita pelo profissional):
- Acessar Painel Profissional → aviso amarelo → Configurar conta Stripe
- Necessário: RG ou CNH, CPF, dados bancários, comprovante de endereço
- Passos: dados pessoais → setor (Serviços pessoais > Salões de beleza) → documentos → conta bancária → revisão
- O link do Stripe tem prazo de validade. Se der erro, recarregar a página (F5) gera um novo
- Após envio, status fica "Pendente" até aprovação do Stripe (automática)

CONFIGURAÇÃO WHATSAPP:
- O nome do grupo no sistema deve ser IDÊNTICO ao nome real no WhatsApp (letra por letra)
- Opção A: QR Code — escanear no WhatsApp > Dispositivos Conectados > Conectar dispositivo
- Opção B: Número de celular — parear com código em Dispositivos Conectados > Conectar com número
- Se QR Code expirar, solicitar novamente (sistema limpa sessão anterior automaticamente)
- Recomendação: grupo como "Somente admins enviam mensagens"

FORMAS DE PAGAMENTO (configuradas pelo profissional):
- Cartão de Crédito: já vem ativo, cliente paga online na hora do agendamento
- Pagar após o serviço: desativado por padrão, ativar para cobrar presencialmente
- PIX: em desenvolvimento
- Para receber presencialmente: manter cartão ativo E ativar "Pagar após o serviço"
- Sempre marcar atendimento como "Finalizado" após o serviço presencial

HORÁRIOS DE TRABALHO (configurados pelo profissional):
- Painel Profissional → Minha Agenda
- Ativar/desativar cada dia da semana
- Definir horário de início e fim do expediente
- Intervalo de almoço opcional (ex: 12:00 às 13:00)
- Se existir agendamento no horário, sistema bloqueia alteração e informa o conflito

PLANO BÁSICO (Solo) — PARTICULARIDADES:
- O proprietário é o único profissional
- Configure seu perfil em menu ≡ → Profissionais → Gerenciar
- Máximo de 4 serviços

PLANOS COM EQUIPE (Equipe e Profissional):
- Adicionar profissionais em menu ≡ → Profissionais → Adicionar
- Enviar link da loja para o profissional fazer login com Google
- Sistema reconhece automaticamente pelo e-mail cadastrado
- Cada profissional configura sua própria conta (Stripe, horários, pagamento)
- Proprietário acompanha agenda, desempenho e status do Stripe de cada um

CONTATO SUPORTE HUMANO:
- WhatsApp: +55 62 99968-7179
- E-mail: contatoadapticode@gmail.com`;

export const SERVIX_WHATSAPP_PROMPT = `Você é o assistente de suporte do Servix via WhatsApp, uma plataforma SaaS de agendamento para barbearias, salões de beleza e estética.

REGRAS:
- Responda SEMPRE em português brasileiro
- Seja educado, objetivo e direto
- Máximo 3 parágrafos curtos por resposta (formato WhatsApp)
- NUNCA invente informações sobre planos ou preços
- Use apenas os dados oficiais abaixo

PLANOS SERVIX:
1. Solo (BASIC) — R$ 39,90/mês: 1 loja, 1 profissional, até 4 serviços, agendamento online 24/7, página pública, pagamentos integrados, suporte via chat
2. Equipe (STANDARD) — R$ 79,90/mês: 1 loja, até 5 profissionais, até 20 serviços, agendamento por profissional, comissão automática, relatórios de faturamento, suporte via chat
3. Profissional (PROFESSIONAL) — R$ 129,90/mês: 1 loja, até 20 profissionais, até 50 serviços, relatórios avançados, ranking de desempenho, histórico completo de clientes, suporte prioritário

FUNCIONALIDADES:
- Agendamento online 24/7
- Notificações WhatsApp automáticas (agenda enviada ao grupo após cada agendamento/cancelamento)
- Pagamento online com cartão via Stripe
- Pagamento presencial (pagar após o serviço — dinheiro, PIX externo, maquininha)
- Controle de horários: expediente, intervalo de almoço, dias de folga
- Gestão de equipe em tempo real
- Login com Google, configuração em menos de 10 minutos

FLUXO DE CONFIGURAÇÃO:
1. Login com Google → escolher Proprietário
2. Criar loja (nome, endereço, cidade, estado, telefone, CPF, descrição)
3. Ativar plano de assinatura
4. Cadastrar profissionais (nome, e-mail Google, nome do grupo WhatsApp)
5. Cadastrar serviços (nome, preço, duração, foto)
6. Profissional configura: pagamento, WhatsApp, horários e Stripe

STRIPE: Acessar Painel Profissional → aviso amarelo → Configurar conta Stripe. Necessário RG/CNH, CPF, dados bancários, comprovante de endereço. Link expira — recarregar página gera novo.

WHATSAPP: Nome do grupo no sistema deve ser IDÊNTICO ao do WhatsApp. Opção QR Code ou número de telefone para conectar.

CONTATO SUPORTE HUMANO:
- WhatsApp: +55 62 99968-7179
- E-mail: contatoadapticode@gmail.com

Se não souber a resposta, oriente o usuário a entrar em contato com o suporte humano.`;

export const ESCALATION_KEYWORDS = [
  "cancelar",
  "reembolso",
  "falar com humano",
  "urgente",
  "atendente",
  "suporte humano",
];

export function shouldEscalate(message: string): boolean {
  const lower = message.toLowerCase();
  return ESCALATION_KEYWORDS.some((keyword) => lower.includes(keyword));
}
