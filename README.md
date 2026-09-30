# ✂️ Servix

**Servix** é uma plataforma **SaaS de agendamento e gestão** para barbearias, salões de beleza e negócios de estética. Centraliza agenda, profissionais, serviços, clientes e pagamentos em um único sistema, com agendamento online 24/7, cobrança via Stripe, sincronização com Google Calendar e notificações automáticas no WhatsApp.

> Repositório relacionado: **servix-whatsapp-server** (microsserviço Node/Fastify/Baileys que conecta o WhatsApp de cada profissional).

---

## 📌 O que o sistema faz

- **Agendamento online 24/7** por página pública da loja (`/{slug}`) ou por profissional (`/agendar/{professionalId}`).
- **Multi-perfil com controle de acesso (RBAC):** `admin`, `support`, `owner`, `professional` e `client`, cada um com seu dashboard.
- **Assinaturas SaaS** para o dono do estabelecimento (planos Solo, Equipe e Profissional) cobradas via **Stripe Billing**.
- **Pagamento dos clientes** com cartão via **Stripe Checkout** + **Stripe Connect (Express)**: o valor cai direto na conta do profissional e a plataforma retém uma taxa.
- **Pagar após o serviço:** o profissional pode aceitar pagamento presencial (dinheiro, PIX externo, maquininha) e marcar como recebido.
- **Agenda inteligente:** expediente por dia da semana, intervalo de almoço, serviços simultâneos (agenda corrida) e 3 modos de visualização (`DEFAULT`, `RECENT`, `CONTINUOUS`).
- **Google Calendar:** cria/remove eventos na agenda do profissional e do cliente, com recorrência (semanal, mensal, anual) e webhook que cancela o booking se o evento for apagado no Google.
- **WhatsApp:** envia a agenda do dia para o **grupo** do profissional a cada agendamento/cancelamento e diariamente às 07:00 (BRT).
- **Assistente de IA (Agenda.ai):** chat que permite ao cliente consultar horários e agendar por conversa (Gemini via Vercel AI SDK).
- **Suporte integrado:** chat com IA + escalonamento para atendentes humanos, tickets, auditoria e convite de equipe de suporte.
- **Painel admin:** usuários, planos, taxas da plataforma, contas Stripe conectadas, ativação manual e configurações.

## 🎯 Qual problema resolve

| Problema | Como o Servix resolve |
|---|---|
| Agenda no caderno/WhatsApp gera conflito de horário | Slots calculados em tempo real, com bloqueio de choque e regras de expediente |
| Clientes faltam sem avisar | Lembretes automáticos por WhatsApp (1h e 30min antes)* |
| Profissional não vê o dia organizado | Agenda enviada ao grupo do WhatsApp dele |
| Receber pagamento é manual e sem controle | Checkout online, divisão automática e histórico de pagamentos |
| Donos de barbearia com equipe não sabem o desempenho | Comissão por profissional, relatórios e ranking (planos superiores) |
| Cobrar mensalidade e limitar recursos por plano | Assinatura Stripe + limites de lojas, profissionais e serviços por plano |

\* Veja a seção [Pontos de atenção](#️-pontos-de-atenção-encontrados-no-código): esse fluxo depende de rotas que ainda não existem no whatsapp-server.

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, `output: standalone`) + **React 19** |
| Linguagem | **TypeScript** |
| UI | **Tailwind CSS 4** + **shadcn/ui** (Radix) + lucide-react + sonner |
| Banco | **PostgreSQL** (Neon recomendado) + **Prisma 7** com `@prisma/adapter-pg` |
| Auth | **Better Auth** (Google OAuth + plugin `admin` com roles) |
| Server Actions | **next-safe-action** + **Zod 4** + react-hook-form |
| Estado/dados | TanStack Query |
| Pagamentos | **Stripe** (Billing + Checkout + Connect Express) |
| IA | Google Gemini (`@ai-sdk/google`, `@google/generative-ai`) |
| Integrações | Google Calendar API (`googleapis`), microsserviço WhatsApp |
| Datas | date-fns + date-fns-tz (fuso `America/Sao_Paulo`) |
| Gerenciador | **pnpm** |

---

## 🗂️ Estrutura do projeto

```
servix/
├── app/
│   ├── [slug]/                 # Página pública da loja
│   ├── agendar/[professionalId]/
│   ├── barbershops/            # Listagem e detalhe de lojas
│   ├── bookings/               # Agendamentos do cliente
│   ├── auth/                   # Callback e seleção de tipo de conta
│   ├── onboarding/             # Fluxos de owner e professional (+ retorno Stripe)
│   ├── dashboard/
│   │   ├── admin/              # Usuários, planos, taxas, contas conectadas, suporte, WhatsApp
│   │   ├── owner/              # Lojas, profissionais, serviços, assinatura
│   │   ├── professional/       # Agenda, agendamentos, pagamentos, configurações
│   │   ├── support/            # Tickets e contas conectadas
│   │   └── client/
│   └── api/                    # Route handlers (veja tabela abaixo)
├── actions/                    # Server Actions (bookings, professionals, services, subscriptions, admin…)
├── components/                 # Componentes de domínio + components/ui (shadcn)
├── data/                       # Camada de consultas ao banco
├── lib/                        # auth, prisma, stripe, stripe-connect, google-calendar, whatsapp, ai, planos, taxas…
├── prisma/                     # schema.prisma e seed.ts
├── generated/prisma/           # Client gerado pelo Prisma
├── scripts/                    # Utilitários (set-admin, setup-owner, sync-subscription…)
├── docs/                       # Guia de configuração do Stripe
├── proxy.ts                    # Proxy do Next 16: proteção de rotas, CSRF, contexto de loja
└── prisma.config.ts
```

## 👥 Perfis e permissões

| Role | Acesso |
|---|---|
| `admin` | Gestão total da plataforma (`/dashboard/admin`) |
| `support` | Atendimento de tickets e consulta de contas (`/dashboard/support`) |
| `owner` | Lojas, equipe, serviços e assinatura (`/dashboard/owner`); também atua como profissional |
| `professional` | Agenda, pagamentos, WhatsApp e Stripe (`/dashboard/professional`) |
| `client` | Agenda serviços, vê seus agendamentos e usa o chat de IA |

O `proxy.ts` valida o cookie de sessão do Better Auth, consulta o papel do usuário e redireciona quem tenta acessar um dashboard que não é seu. Requisições mutáveis à `/api/*` passam por checagem de **origem (CSRF)** contra `NEXT_PUBLIC_APP_URL`.

## 💳 Planos

Definidos em `prisma/seed.ts` e armazenados na tabela `plan_config`:

| Plano | Preço | Lojas | Profissionais | Serviços |
|---|---|:---:|:---:|:---:|
| **Solo** (`BASIC`) | R$ 39,90/mês | 1 | 1 | 10 |
| **Equipe** (`STANDARD`) | R$ 79,90/mês | 1 | 5 | 30 |
| **Profissional** (`PROFESSIONAL`) | R$ 129,90/mês | 1 | 20 | 100 |

O plano `ENTERPRISE` (Rede) existe no enum, mas está **comentado** no seed.

**Taxa da plataforma** sobre pagamentos online (`lib/platform-fee.ts`): 0% nos primeiros 90 dias, depois sobe 1% ao mês até o teto de 10%. O admin pode fixar uma taxa manual por loja (override).

---

## 🔌 Rotas de API

| Rota | Função | Proteção |
|---|---|---|
| `/api/auth/[...all]` | Better Auth (login Google, sessão) | Pública |
| `/api/chat` | Assistente de IA de agendamento (streaming) | Sessão, role `client` |
| `/api/support/chat` · `/messages` · `/events` | Chat de suporte com IA, mensagens e SSE | Sessão + rate limit |
| `/api/admin/support/*` | Tickets: listar, atribuir, responder, resolver, convidar equipe | Sessão admin/support |
| `/api/whatsapp/[professionalId]/connect` · `connect-phone` · `status` · `disconnect` | Proxy autenticado para o whatsapp-server | Sessão (owner dono ou o próprio profissional) |
| `/api/whatsapp/booking` | Lista serviços e cria agendamento a partir do WhatsApp | Header `x-api-key` (`WHATSAPP_SERVICE_API_KEY`) |
| `/api/stripe/webhook` | Assinaturas, checkout, pagamentos e reembolsos | Assinatura Stripe |
| `/api/stripe/connect/webhook` | Contas conectadas dos profissionais | Assinatura Stripe |
| `/api/calendar/webhook` | Notificações do Google Calendar (evento apagado → cancela booking) | Header do Google |
| `/api/cron/daily-schedule` | Envia a agenda do dia às 07:00 BRT | `Bearer CRON_SECRET` |
| `/api/cron/whatsapp-reminders` | Lembretes 1h e 30min antes | `Bearer CRON_SECRET` |
| `/api/cron/renew-calendar-watch` | Renova canais do Google Calendar (expiram em 7 dias) | `Bearer CRON_SECRET` |
| `/api/cron/cleanup` | Limpeza de logs, tickets, uploads, sessões e eventos antigos | `Bearer CRON_SECRET` |
| `/api/upload` · `/api/uploads/[id]` | Upload e leitura de imagens (armazenadas no Postgres) | Sessão / pública para leitura |
| `/api/services/[id]` · `/api/user/*` · `/api/store/exit` · `/api/logout` | Serviços auxiliares | Sessão |

Os eventos Stripe tratados estão documentados em `docs/Guia configuracao stripe.md`.

---

## ⚙️ Variáveis de ambiente

```bash
cp .env.example .env
```

| Variável | Obrig. | Descrição |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Connection string do PostgreSQL. Ex.: `postgresql://user:pass@host/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | ✅ | Segredo de sessão. Gere com `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | URL base do app (ex.: `http://localhost:3319`). Também usada pelo `proxy.ts` para validar a sessão |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública do app. Usada em CORS/CSRF, links do WhatsApp e webhook do Calendar |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth Google (login + Calendar) |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth Google |
| `STRIPE_SECRET_KEY` | ✅ | Chave secreta do Stripe (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Chave pública do Stripe |
| `STRIPE_WEBHOOK_SECRET_KEY` | ✅ | Secret do webhook principal (`whsec_...`) |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | ✅ | Secret do webhook Connect (`whsec_...`, diferente do anterior) |
| `CRON_SECRET` | ✅ | Token Bearer exigido pelas rotas `/api/cron/*` |
| `WHATSAPP_SERVICE_URL` | ✅* | URL do servidor WhatsApp (sem barra final) |
| `WHATSAPP_SERVICE_API_KEY` | ✅* | Mesmo valor de `API_KEY` do whatsapp-server |
| `AI_API_KEY` | ✅* | Chave do provedor de IA (Gemini) |
| `AI_PROVIDER` | ❌ | `gemini` (padrão), `openai` ou `anthropic` — vale só para o chat de suporte |
| `AI_MODEL` | ❌ | Padrão: `gemini-2.5-flash-lite` |

\* Sem WhatsApp o app funciona, mas sem notificações. Sem `AI_API_KEY` os chats de IA falham.

**Gerar segredos:**

```bash
openssl rand -base64 32     # BETTER_AUTH_SECRET, CRON_SECRET
openssl rand -hex 32        # WHATSAPP_SERVICE_API_KEY
```

### Exemplo de `.env` local

```env
DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/servix?sslmode=require&channel_binding=require'

BETTER_AUTH_SECRET='...'
BETTER_AUTH_URL='http://localhost:3319'
NEXT_PUBLIC_APP_URL='http://localhost:3319'

GOOGLE_CLIENT_ID='...apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET='...'

AI_PROVIDER='gemini'
AI_API_KEY='...'
AI_MODEL='gemini-2.5-flash-lite'

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_test_...'
STRIPE_SECRET_KEY='sk_test_...'
STRIPE_WEBHOOK_SECRET_KEY='whsec_...'
STRIPE_CONNECT_WEBHOOK_SECRET='whsec_...'

WHATSAPP_SERVICE_URL='http://localhost:8080'
WHATSAPP_SERVICE_API_KEY='mesma_chave_do_whatsapp_server'

CRON_SECRET='...'
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- **Node.js 20+** e **pnpm** (`corepack enable`)
- Banco **PostgreSQL** (local, Docker ou [Neon](https://neon.tech))
- Projeto no **Google Cloud** com OAuth configurado
- Conta **Stripe** em modo de teste e [Stripe CLI](https://docs.stripe.com/stripe-cli)
- (Opcional) whatsapp-server rodando para as notificações

### 1. Instalar

```bash
pnpm install     # o postinstall já roda "prisma generate"
```

### 2. Configurar o Google OAuth

1. No [Google Cloud Console](https://console.cloud.google.com/), crie credenciais **OAuth 2.0 (Web)**.
2. Em **Authorized redirect URIs**, adicione: `http://localhost:3319/api/auth/callback/google`
3. Ative a **Google Calendar API** e configure a tela de consentimento com os escopos `calendar` e `calendar.events`.
4. Copie `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` para o `.env`.

### 3. Banco de dados e seed

```bash
pnpm prisma migrate dev --name init   # cria as tabelas
pnpm prisma generate
pnpm prisma db seed                   # ou: pnpm exec tsx prisma/seed.ts
```

O seed **cria os planos no banco e também cria/atualiza produtos e preços no Stripe**, gravando o `stripePriceId` real. Por isso precisa de `STRIPE_SECRET_KEY` válida antes de rodar.

> Para recomeçar do zero: `rm -rf prisma/migrations` → `pnpm prisma migrate dev --name init` → `pnpm prisma generate` → seed.

### 4. Webhooks do Stripe (dois terminais)

O `dev` roda na porta **3319**:

```bash
# Webhook principal (assinaturas e pagamentos)
stripe listen --forward-to localhost:3319/api/stripe/webhook
# copie o whsec_... para STRIPE_WEBHOOK_SECRET_KEY

# Webhook Connect (contas dos profissionais)
stripe listen --forward-to localhost:3319/api/stripe/connect/webhook \
  --events account.updated,account.application.deauthorized,account.external_account.created,payout.paid,payout.failed
# copie o whsec_... para STRIPE_CONNECT_WEBHOOK_SECRET
```

Em produção crie os dois endpoints no Dashboard do Stripe (detalhes e lista de eventos em `docs/Guia configuracao stripe.md`). Ative também o **Stripe Connect** com contas **Express**.

### 5. Subir o app

```bash
pnpm dev        # http://localhost:3319
```

### 6. Criar o primeiro admin

Faça login uma vez com Google e então:

```bash
pnpm tsx scripts/set-admin.ts seu-email@exemplo.com
```

Acesse `/dashboard/admin`.

### Build de produção

```bash
pnpm build
pnpm start      # porta 3319
```

---

## 🛠️ Scripts utilitários

| Comando | O que faz |
|---|---|
| `pnpm tsx scripts/set-admin.ts <email>` | Promove um usuário a `admin` |
| `pnpm tsx scripts/setup-owner.ts <email>` | Vira `owner` e cria loja, profissional, agenda e serviços de exemplo (dev) |
| `pnpm tsx scripts/setup-professional.ts <email>` | Vira `professional` numa loja existente com agenda Seg–Sáb (dev) |
| `pnpm tsx scripts/check-subscription.ts` | Lista assinaturas, clientes Stripe e lojas |
| `pnpm tsx scripts/sync-subscription.ts` | Sincroniza manualmente uma assinatura do Stripe com o banco |

> Esses scripts carregam o `.env` de forma diferente entre si; se algum não achar `DATABASE_URL`, rode com `pnpm tsx --env-file=.env scripts/<arquivo>.ts`.

---

## ⏰ Agendamento dos crons

O projeto **não inclui** `vercel.json` nem workflow de cron; você precisa agendar as chamadas (Vercel Cron, Railway, cron-job.org, GitHub Actions…). Todas usam `GET` com `Authorization: Bearer <CRON_SECRET>`:

| Rota | Frequência sugerida | Observação |
|---|---|---|
| `/api/cron/daily-schedule` | A cada 5 min | Só executa entre **07:00 e 07:10 BRT** e no máximo uma vez por dia por profissional |
| `/api/cron/whatsapp-reminders` | A cada 5–10 min | Janelas de ±7 min em torno de 60 e 30 min |
| `/api/cron/renew-calendar-watch` | 1x ao dia | Renova canais que expiram em menos de 24h |
| `/api/cron/cleanup` | 1x ao dia | Remove dados antigos (60/90 dias) |

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://seuapp.com/api/cron/cleanup
```

---

## 📲 Integração com o WhatsApp (whatsapp-server)

O Servix **nunca** fala direto com o WhatsApp: tudo passa pelo microsserviço, autenticado com `x-api-key`.

```
Navegador ──▶ /api/whatsapp/[professionalId]/* ──▶ lib/whatsapp.ts ──▶ whatsapp-server ──▶ WhatsApp
             (valida sessão e dono)                  (x-api-key)
```

**Como ativar:**

1. Suba o whatsapp-server e defina `API_KEY` nele.
2. No Servix, preencha `WHATSAPP_SERVICE_URL` e `WHATSAPP_SERVICE_API_KEY` (mesmo valor da `API_KEY`).
3. No Painel Profissional → configurações de WhatsApp, o profissional conecta por **QR Code** ou **código de pareamento** e informa o **nome do grupo**, que deve ser **idêntico** ao nome do grupo no WhatsApp.
4. A partir daí a agenda é enviada ao grupo em: novo agendamento pago (webhook Stripe), cancelamento, reembolso e no cron diário.

`lib/whatsapp.ts` usa `redirect: "error"`, valida o UUID do profissional e confere a origem da URL antes de cada chamada.

---

## ⚠️ Pontos de atenção encontrados no código

Coisas que descobri ao mapear o projeto e que valem correção ou ao menos ciência:

1. **Lembretes por WhatsApp não funcionam com o whatsapp-server atual.** `lib/whatsapp-reminder.ts` chama `POST /send-direct`, e as rotas de admin chamam `/reminders/connect|status|disconnect`. **Nenhuma dessas rotas existe** no whatsapp-server. Como o `fetch` não lança erro em respostas 404, o cron marca o lembrete como enviado mesmo sem ter enviado.
2. **`/api/whatsapp/booking` fica bloqueada pelo `proxy.ts`.** `/api/whatsapp` está em `PROTECTED_ROUTES`, que exige cookie de sessão; uma chamada server-to-server só com `x-api-key` recebe 401 antes de chegar na rota. Para uso pelo bot, inclua essa rota nas exceções.
3. **Agendamentos "pagar após o serviço" não disparam a agenda no WhatsApp.** `create-booking.ts` não chama `sendDailyScheduleToGroup` (só o webhook Stripe, o cancelamento e o cron chamam).
4. **Limites de plano divergem entre fontes.** O seed define Solo com 10 serviços, Equipe com 30 e Profissional com 100. O `docs/Guia configuracao stripe.md` (3/20/50/…) e o prompt do bot no whatsapp-server (4/20/50) estão desatualizados.
5. **O Guia do Stripe cita coisas que não existem:** o script `scripts/create-stripe-prices.ts` (quem cria os preços é o `prisma/seed.ts`) e a variável `PLATFORM_FEE_PERCENTAGE` (a taxa vem de `lib/platform-fee.ts`). O guia também usa a porta 3000, mas o app roda na **3319**.
6. **`AI_PROVIDER` só vale para o chat de suporte** (`lib/ai.ts`). O `/api/chat` (Agenda.ai) usa Gemini fixo via `@ai-sdk/google`.
7. **`next.config.ts` exige `output: "standalone"` "para o Dockerfile"**, mas o repositório não inclui Dockerfile. Na Vercel isso é ignorado sem problemas; para Docker é preciso criar um.
8. **Scripts `setup-*` têm um e-mail padrão fixo** no código quando você não passa argumento. Sempre informe o e-mail explicitamente ou remova o valor padrão.
9. **Rate limit em memória** (`lib/rate-limit.ts`): funciona por instância, então não é global em ambientes serverless com várias instâncias.
10. **Uploads ficam no Postgres** (coluna `Bytes`). Simples para começar, mas pesa no banco em escala; considere S3/R2/UploadThing depois.

---

## 🗄️ Modelo de dados (resumo)

`User` · `Session` · `Account` · `Verification` (Better Auth) · `Barbershop` · `Professional` · `ProfessionalSchedule` · `BarbershopService` · `Booking` · `Payment` · `PlanConfig` · `Subscription` · `PlanHistory` · `PlatformFeeHistory` · `StripeEvent` (idempotência de webhooks) · `SupportTicket` · `SupportMessage` · `SupportAuditLog` · `SupportInvite` · `Notification` · `Upload` · `ManualActivationLog`

Schema completo em `prisma/schema.prisma`. Datas de booking usam `Timestamptz` e o fuso padrão do sistema é `America/Sao_Paulo`.

---

## 🚢 Deploy

**Vercel (recomendado para o app):**

1. Importe o repositório e configure todas as variáveis de ambiente.
2. Rode as migrations contra o banco de produção (`pnpm prisma migrate deploy`) e o seed uma vez.
3. Crie os dois webhooks do Stripe apontando para `https://seudominio.com/api/stripe/webhook` e `/api/stripe/connect/webhook`.
4. Adicione `https://seudominio.com/api/auth/callback/google` nos redirects do OAuth.
5. Configure os crons (seção acima).

O whatsapp-server é publicado à parte (ex.: Railway com volume persistente) — veja o README dele.

---

## 👨‍💻 Desenvolvedor

**Warley Coutinho**
Desenvolvedor Full Stack

- 💼 LinkedIn: [linkedin.com/in/coutinho-warley](https://www.linkedin.com/in/coutinho-warley)
- 🌐 Portfólio: [warley-portfolio.vercel.app](https://warley-portfolio.vercel.app/)
