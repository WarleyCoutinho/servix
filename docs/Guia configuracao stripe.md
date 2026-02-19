# GUIA COMPLETO - CONFIGURACAO STRIPE 2025-2026

## VISAO GERAL DO SISTEMA

O Servix utiliza o Stripe para dois tipos de pagamentos:

| Tipo             | Metodos Aceitos | Descricao                         |
| ---------------- | --------------- | --------------------------------- |
| **Assinaturas**  | Cartao          | Planos mensais para proprietarios |
| **Agendamentos** | Cartao + PIX    | Servicos pagos pelos clientes     |

> **IMPORTANTE**: PIX nao suporta cobrancas recorrentes, por isso assinaturas usam apenas cartao.

---

## PASSO 1: ACESSAR O STRIPE DASHBOARD

### 1.1 - Login no Stripe

1. Acesse: https://dashboard.stripe.com/
2. Faca login com sua conta
3. **IMPORTANTE**: Certifique-se de estar em **modo de teste** (canto superior direito deve mostrar "Test mode")

---

## PASSO 2: OBTER AS CHAVES API

### 2.1 - Chaves Publicaveis e Secretas

1. No Stripe Dashboard, clique em **Developers** (menu superior)
2. Clique em **API keys** (menu lateral esquerdo)
3. Voce vera duas chaves:

**Chave Publicavel (Publishable key):**

```
pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Chave Secreta (Secret key):**

```
sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. **Copie ambas** e adicione no seu `.env`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## PASSO 3: CONFIGURAR PLANOS DE ASSINATURA

### 3.1 - Executar Seed dos Planos

Primeiro, execute o seed para criar os planos no banco:

```bash
npx prisma db seed
```

### 3.2 - Criar Produtos no Stripe

Execute o script para criar os produtos e precos no Stripe:

```bash
npx tsx scripts/create-stripe-prices.ts
```

Isso criara os seguintes planos:

| Plano        | Preco           | Max Estabelecimentos | Max Profissionais | Max Servicos |
| ------------ | --------------- | -------------------- | ----------------- | ------------ |
| Basico       | R$ 39,90/mes    | 1                    | 1                 | 3            |
| Padrao       | R$ 79,90,90/mes | 1                    | 5                 | 20           |
| Profissional | R$ 129,90/mes   | 1                    | 20                | 50           |
| Empresarial  | R$ 249,90/mes   | 5                    | 100               | 999          |

---

## PASSO 4: ATIVAR STRIPE CONNECT

### 4.1 - Habilitar Connect

1. No Stripe Dashboard, va em **Connect** (menu superior)
2. Se for a primeira vez, clique em **Get started**
3. Preencha as informacoes da sua plataforma:
   - **Platform name**: `Servix`
   - **Support email**: seu email
   - **Platform website**: `http://localhost:3000` (ou seu dominio)

### 4.2 - Configurar Connect Settings

1. Va em **Connect** > **Settings**
2. Em **Branding**:
   - **Brand name**: `Servix`
   - **Brand icon**: (opcional) faca upload de um logo
   - **Brand color**: escolha uma cor (ex: `#4F46E5`)
3. Clique em **Save**

### 4.3 - Configurar Account Types

1. Em **Connect** > **Settings** > **Account types**
2. Certifique-se de que **Express** esta habilitado
3. Configure:
   - [x] **Individual accounts**
   - [x] **Company accounts**

### 4.4 - Habilitar PIX para Connect

1. Va em **Settings** > **Payment methods**
2. Ative **Pix** para sua conta
3. Em **Connect** > **Settings** > **Payment methods**
4. Certifique-se de que **Pix** esta habilitado para contas conectadas

---

## PASSO 5: CONFIGURAR WEBHOOKS

> O sistema utiliza **dois webhooks separados**, cada um com seu proprio secret e eventos especificos.
> Nao reutilizar o mesmo `whsec_` entre eles — cada endpoint gera o seu proprio.

---

### 5.1 - Webhook Principal — `STRIPE_WEBHOOK_SECRET_KEY`

**Rota no sistema:** `/api/stripe/webhook`
**Responsavel por:** assinaturas dos proprietarios, pagamentos de agendamentos e revogacao de acesso de profissionais

#### Passo a passo (nova interface Dashboard):

1. Va em **Developers** > **Webhooks**
2. Clique em **+ Adicionar destino**
3. Em **"Eventos a partir de"**, selecione **"Sua conta"**
4. Adicione todos os eventos abaixo
5. Avance para **"Escolher tipo de destino"** e informe a URL
6. Em **"Configure o destino"** preencha:
   - **URL**: `https://seudominio.com/api/stripe/webhook`
   - **Description**: `Main webhook - subscriptions and bookings`
7. Conclua e salve

**Eventos de Assinatura:**

- [x] `checkout.session.completed` — finaliza checkout e sincroniza assinatura ou agendamento
- [x] `customer.subscription.created` — registra nova assinatura e ativa plano do proprietario
- [x] `customer.subscription.updated` — atualiza plano em caso de upgrade ou downgrade
- [x] `customer.subscription.deleted` — cancela assinatura e bloqueia acesso a plataforma
- [x] `customer.subscription.trial_will_end` — notifica proprietario 3 dias antes do trial expirar
- [x] `invoice.paid` — confirma pagamento da fatura e mantem assinatura ativa
- [x] `invoice.payment_failed` — registra falha, notifica proprietario e inicia fluxo de inadimplencia
- [x] `invoice.upcoming` — notifica proprietario sobre proxima cobranca

**Eventos de Pagamento (Agendamentos):**

- [x] `payment_intent.succeeded` — confirma pagamento e libera o slot do agendamento
- [x] `payment_intent.payment_failed` — registra falha e notifica cliente e profissional
- [x] `charge.refunded` — processa reembolso e atualiza status do agendamento (cartao e PIX)

#### Obter a chave (Metodo 1 — Dashboard, producao):

1. Apos criar o webhook, clique nele
2. Na secao **Signing secret**, clique em **Reveal**
3. Copie o valor que comeca com `whsec_`
4. Adicione no `.env`:

```env
STRIPE_WEBHOOK_SECRET_KEY="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Obter a chave (Metodo 2 — Stripe CLI, desenvolvimento local):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

O terminal exibira:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copie e use temporariamente no `.env` durante o desenvolvimento:

```env
STRIPE_WEBHOOK_SECRET_KEY="whsec_xxxxxxxxxxxxx"
```

---

### 5.2 - Webhook Connect — `STRIPE_CONNECT_WEBHOOK_SECRET`

**Rota no sistema:** `/api/stripe/connect/webhook`
**Responsavel por:** ativacao e gestao das contas dos profissionais (Stripe Connect)

#### Passo a passo (nova interface Dashboard):

1. Va em **Developers** > **Webhooks**
2. Clique em **+ Adicionar destino**
3. Em **"Eventos a partir de"**, selecione **"Contas conectadas e v2"**
4. Adicione todos os eventos abaixo
5. Avance para **"Escolher tipo de destino"** e informe a URL
6. Em **"Configure o destino"** preencha:
   - **URL**: `https://seudominio.com/api/stripe/connect/webhook`
   - **Description**: `Connect webhook - professional accounts`
7. Conclua e salve

**Eventos de Conta do Profissional:**

- [x] `account.updated` — verifica `charges_enabled`, `payouts_enabled` e `details_submitted` para ativar ou manter conta pendente
- [x] `account.external_account.created` — confirma que conta bancaria foi adicionada com sucesso

**Eventos de Repasse:**

- [x] `payout.paid` — registra repasse realizado com sucesso ao profissional
- [x] `payout.failed` — registra falha no repasse e notifica profissional

#### Obter a chave (Metodo 1 — Dashboard, producao):

1. Apos criar o webhook, clique nele
2. Na secao **Signing secret**, clique em **Reveal**
3. Copie o valor que comeca com `whsec_`
4. Adicione no `.env`:

```env
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Obter a chave (Metodo 2 — Stripe CLI, desenvolvimento local):

```bash
stripe listen --forward-to localhost:3000/api/stripe/connect/webhook --events account.updated,account.external_account.created,payout.paid,payout.failed
```

O terminal exibira:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copie e use temporariamente no `.env` durante o desenvolvimento:

```env
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

> **ATENCAO**: O secret gerado pelo Stripe CLI e valido apenas enquanto o comando estiver rodando.
> Para producao, sempre usar o secret gerado pelo Dashboard.

---

## PASSO 6: CONFIGURAR TAXA DA PLATAFORMA

### 6.1 - Definir Porcentagem

No arquivo `.env`, configure a taxa que voce recebe de cada agendamento:

```env
PLATFORM_FEE_PERCENTAGE=10
```

Isso significa que a cada agendamento:

- **Profissional recebe**: 90%
- **Plataforma recebe**: 10%

---

## PASSO 7: INSTALAR STRIPE CLI (TESTE LOCAL)

### 7.1 - Instalar Stripe CLI

**Linux (Fedora/RHEL):**

```bash
sudo dnf install stripe
```

**Linux (Ubuntu/Debian):**

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

**macOS:**

```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### 7.2 - Login no Stripe CLI

```bash
stripe login
```

Isso abrira o navegador para autenticar. Confirme o acesso.

### 7.3 - Encaminhar Webhooks Localmente

Em um terminal separado, execute:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Voce vera algo como:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**COPIE esse signing secret** e use temporariamente no `.env` durante desenvolvimento:

```env
STRIPE_WEBHOOK_SECRET_KEY="whsec_xxxxxxxxxxxxx"
```

---

## PASSO 8: CONFIGURAR .ENV COMPLETO

Seu arquivo `.env` deve ficar assim:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/servix"

# Better Auth
BETTER_AUTH_SECRET="sua_chave_secreta_aqui"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="seu_client_id"
GOOGLE_CLIENT_SECRET="seu_client_secret"

# Stripe - Chaves API
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# Stripe - Webhooks
STRIPE_WEBHOOK_SECRET_KEY="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# Stripe - Taxa da Plataforma (10%)
PLATFORM_FEE_PERCENTAGE=10
```

---

## PASSO 9: TESTAR FLUXOS DE PAGAMENTO

### 9.1 - Testar Assinatura (Proprietario)

1. Crie uma conta de proprietario
2. Va para `/dashboard/owner/subscription`
3. Selecione um plano e clique em **Assinar**
4. Use os dados de teste:

**Cartao de Sucesso:**

- Numero: `4242 4242 4242 4242`
- Data: Qualquer data futura (ex: `12/28`)
- CVC: Qualquer 3 digitos (ex: `123`)
- CEP: Qualquer (ex: `12345-678`)

**Cartao que Falha:**

- Numero: `4000 0000 0000 0002`

### 9.2 - Testar Agendamento com Cartao

1. Faca login como cliente
2. Selecione um servico e profissional
3. Escolha data e horario
4. No checkout, use cartao de teste

### 9.3 - Testar Agendamento com PIX

1. Faca login como cliente
2. Selecione um servico e profissional
3. Escolha data e horario
4. No checkout, selecione **Pix**
5. O Stripe gerara um QR Code de teste

---

## PASSO 10: CONFIGURAR CUSTOMER PORTAL

### 10.1 - Ativar Customer Portal

1. No Stripe Dashboard, va em **Settings** > **Billing** > **Customer portal**
2. Clique em **Activate test link**
3. Configure:
   - [x] **Allow customers to update subscription**: Ativado
   - [x] **Allow customers to cancel subscription**: Ativado
   - [x] **Allow customers to update payment methods**: Ativado
4. Em **Business information**:
   - **Business name**: `Servix`
   - **Support email**: seu email
5. Clique em **Save**

---

## FLUXO DE PAGAMENTOS

### Fluxo 1: Assinatura de Plano (Proprietario)

```
Proprietario seleciona plano
        |
        v
Checkout Session (mode: subscription)
        |
        v
Pagamento via CARTAO
        |
        v
Webhook: checkout.session.completed
        |
        v
Cria/Atualiza Subscription no banco
        |
        v
Proprietario tem acesso ao plano
        |
        v
Cobranca automatica mensal via cartao
```

### Fluxo 2: Ativacao da Conta do Profissional (Connect)

```
Profissional inicia onboarding Stripe Connect
        |
        v
Preenche dados no formulario Express do Stripe
        |
        v
Stripe envia: account.updated
        |
        v
Sistema verifica os tres campos obrigatorios:
  - charges_enabled = true
  - payouts_enabled = true
  - details_submitted = true
        |
        +-- Todos true --> Conta ATIVA no banco --> Profissional pode receber pagamentos
        |
        +-- Algum false --> Conta PENDENTE --> Notificar profissional para completar cadastro
```

> **IMPORTANTE**: A ativacao da conta depende exclusivamente do evento `account.updated`.
> Nao confiar apenas no retorno da API do onboarding — sempre aguardar o webhook para atualizar o status no banco.

### Fluxo 3: Agendamento de Servico (Cliente)

```
Cliente seleciona servico + profissional + data/hora
        |
        v
Verifica se profissional tem Stripe Connect ATIVO
        |
        v
Checkout Session (mode: payment)
        |
        v
Cliente escolhe: CARTAO ou PIX
        |
        v
Pagamento processado
        |
        v
Stripe divide automaticamente:
  - 90% -> Profissional (via Stripe Connect)
  - 10% -> Plataforma (application_fee)
        |
        v
Webhook: payment_intent.succeeded
        |
        v
Confirma pagamento e libera o slot do agendamento
        |
        v
Webhook: checkout.session.completed
        |
        v
Cria Booking + Payment no banco
```

---

## IDEMPOTENCIA - EVITAR EVENTOS DUPLICADOS

O Stripe pode reenviar o mesmo evento em caso de falha na entrega. Para evitar processar o mesmo evento duas vezes, salvar o `event.id` no banco antes de executar qualquer logica:

```typescript
// Verificar se evento ja foi processado
const alreadyProcessed = await db.stripeEvent.findUnique({
  where: { eventId: event.id },
});

if (alreadyProcessed) return reply.status(200).send({ received: true });

// Registrar evento antes de processar
await db.stripeEvent.create({ data: { eventId: event.id } });

// processar logica de negocio...
```

> Criar a tabela `StripeEvent` no schema do Prisma com os campos `eventId` (unique) e `createdAt`.

---

## TROUBLESHOOTING

### Erro: Profissional preencheu todos os dados mas conta nao ativa

**Causa provavel**: O webhook `account.updated` nao esta sendo recebido ou os campos `charges_enabled`, `payouts_enabled` e `details_submitted` nao estao sendo verificados corretamente.

**Solucao:**

1. Verifique se o webhook Connect esta configurado e apontando para a URL correta
2. Verifique nos logs se o evento `account.updated` chegou
3. Confirme que os tres campos sao verificados antes de ativar a conta:

```typescript
if (
  account.charges_enabled &&
  account.payouts_enabled &&
  account.details_submitted
) {
  // ativar conta no banco
}
```

### Erro: Webhook nao recebe eventos (desenvolvimento local)

**Solucao:**

```bash
# Verifique se Stripe CLI esta rodando
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Teste manualmente
stripe trigger checkout.session.completed
```

### Erro: "No such price"

**Solucao:**

1. Verifique se executou o script de criacao de precos
2. Liste os precos: `stripe prices list`
3. Verifique o banco: `npx prisma studio` > tabela `PlanConfig`

### Erro: "Invalid API Key"

**Solucao:**

1. Certifique-se de estar usando a chave de **teste** (`sk_test_`)
2. Verifique se nao ha espacos no `.env`
3. Reinicie o servidor: `pnpm dev`

### Erro: PIX nao aparece no checkout

**Solucao:**

1. Verifique se PIX esta ativado em **Settings** > **Payment methods**
2. Verifique se o profissional tem `acceptsPix: true`
3. PIX so funciona para contas no Brasil

### Erro: Profissional nao pode receber pagamentos

**Solucao:**

1. Verifique se o profissional completou o onboarding do Stripe Connect
2. Status deve ser `ACTIVE` no banco
3. Execute: `npx prisma studio` > tabela `Professional` > `stripeAccountStatus`
4. Verifique se os tres campos do Connect estao ativos: `charges_enabled`, `payouts_enabled`, `details_submitted`

### Erro: Taxa da plataforma nao sendo cobrada

**Solucao:**

1. Verifique `PLATFORM_FEE_PERCENTAGE` no `.env`
2. Verifique se o profissional tem Stripe Connect ativo
3. Verifique os logs do webhook

### Erro: Agendamento criado mas slot nao liberado

**Causa provavel**: O evento `payment_intent.succeeded` nao esta sendo tratado ou a logica de liberacao do slot esta apenas no `checkout.session.completed`.

**Solucao**: Garantir que a liberacao do slot esteja no handler do `payment_intent.succeeded`, que e disparado antes do `checkout.session.completed`.

---

## COMANDOS UTEIS

### Visualizar Banco de Dados

```bash
npx prisma studio
```

### Resetar Banco (cuidado!)

```bash
npx prisma migrate reset
```

### Ver Logs do Stripe

```bash
stripe logs tail
```

### Testar Eventos Especificos

```bash
# Assinatura criada
stripe trigger customer.subscription.created

# Pagamento bem-sucedido
stripe trigger payment_intent.succeeded

# Pagamento falhou
stripe trigger payment_intent.payment_failed

# Conta profissional atualizada
stripe trigger account.updated

# Reembolso
stripe trigger charge.refunded
```

### Listar Produtos

```bash
stripe products list
```

### Listar Precos

```bash
stripe prices list
```

---

## CHECKLIST DE PRODUCAO

Antes de ir para producao:

### Stripe Dashboard

- [ ] Mudar para modo **Live** (producao)
- [ ] Atualizar chaves API no `.env` para `pk_live_` e `sk_live_`
- [ ] Criar webhooks de producao com URLs reais
- [ ] Atualizar webhook secrets no `.env`
- [ ] Verificar conta Stripe (KYC completo)
- [ ] Ativar PIX em producao
- [ ] Confirmar todos os eventos de webhook configurados

### Codigo

- [ ] Remover logs de debug
- [ ] Testar todos os fluxos em ambiente de staging
- [ ] Configurar monitoramento de erros (Sentry, etc.)
- [ ] Verificar idempotencia implementada para todos os eventos
- [ ] Confirmar que `account.updated` ativa corretamente a conta do profissional

### Banco de Dados

- [ ] Executar migrations em producao
- [ ] Executar seed dos planos
- [ ] Executar script de criacao de precos no Stripe
- [ ] Confirmar tabela `StripeEvent` criada para idempotencia

---

## RESUMO DE METODOS DE PAGAMENTO

| Fluxo            | Cartao | PIX | Motivo                              |
| ---------------- | ------ | --- | ----------------------------------- |
| **Assinaturas**  | Sim    | Nao | PIX nao suporta cobranca recorrente |
| **Agendamentos** | Sim    | Sim | Pagamento unico                     |

---

**Ultima atualizacao:** Fevereiro 2026
