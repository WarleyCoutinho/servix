# GUIA COMPLETO - CONFIGURACAO STRIPE 2025-2026

## VISAO GERAL DO SISTEMA

O Servix utiliza o Stripe para dois tipos de pagamentos:

| Tipo | Metodos Aceitos | Descricao |
|------|-----------------|-----------|
| **Assinaturas** | Cartao | Planos mensais para proprietarios |
| **Agendamentos** | Cartao + PIX | Servicos pagos pelos clientes |

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

| Plano | Preco | Max Estabelecimentos | Max Profissionais | Max Servicos |
|-------|-------|----------------------|-------------------|--------------|
| Basico | R$ 39,90/mes | 1 | 1 | 3 |
| Padrao | R$ 59,90/mes | 1 | 3 | 10 |
| Profissional | R$ 99,90/mes | 1 | 10 | 30 |
| Empresarial | R$ 249,90/mes | 5 | 50 | Ilimitado |

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

### 5.1 - Criar Webhook Principal (Assinaturas + Agendamentos)

1. Va em **Developers** > **Webhooks**
2. Clique em **+ Add endpoint**
3. Preencha:
   - **Endpoint URL**: `https://seudominio.com/api/stripe/webhook`
   - **Description**: `Main webhook - subscriptions and bookings`
4. Em **Select events to listen to**, escolha:

**Eventos de Assinatura:**
- [x] `checkout.session.completed`
- [x] `customer.subscription.created`
- [x] `customer.subscription.updated`
- [x] `customer.subscription.deleted`
- [x] `invoice.paid`
- [x] `invoice.payment_failed`

**Eventos de Pagamento (Agendamentos):**
- [x] `payment_intent.payment_failed`
- [x] `charge.refunded`

5. Clique em **Add endpoint**

### 5.2 - Obter Webhook Secret (Principal)

1. Apos criar o webhook, clique nele
2. Na secao **Signing secret**, clique em **Reveal**
3. **Copie o secret** (comeca com `whsec_`)
4. Adicione no `.env`:

```env
STRIPE_WEBHOOK_SECRET_KEY="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 5.3 - Criar Webhook para Connect (Profissionais)

1. Repita os passos acima, mas agora:
   - **Endpoint URL**: `https://seudominio.com/api/stripe/connect/webhook`
   - **Description**: `Connect webhook - professional accounts`
2. Marque a opcao **Listen to events on Connected accounts**
3. Eventos:
   - [x] `account.updated`
   - [x] `account.application.deauthorized`
   - [x] `payout.paid`
   - [x] `payout.failed`

4. Copie o signing secret e adicione:

```env
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

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

Para Connect webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/connect/webhook --events account.updated,account.application.deauthorized,payout.paid,payout.failed
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
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"

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

### Fluxo 2: Agendamento de Servico (Cliente)

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
Webhook: checkout.session.completed
        |
        v
Cria Booking + Payment no banco
```

---

## WEBHOOKS - EVENTOS PROCESSADOS

### Webhook Principal (`/api/stripe/webhook`)

| Evento | Acao |
|--------|------|
| `checkout.session.completed` (subscription) | Sincroniza assinatura |
| `checkout.session.completed` (payment) | Cria Booking e Payment |
| `customer.subscription.created` | Atualiza plano do proprietario |
| `customer.subscription.updated` | Upgrade/Downgrade de plano |
| `customer.subscription.deleted` | Cancela assinatura |
| `invoice.paid` | Confirma pagamento da assinatura |
| `invoice.payment_failed` | Marca falha no pagamento |
| `payment_intent.payment_failed` | Marca pagamento de agendamento como falho |
| `charge.refunded` | Processa reembolso |

### Webhook Connect (`/api/stripe/connect/webhook`)

| Evento | Acao |
|--------|------|
| `account.updated` | Atualiza status do profissional |
| `account.application.deauthorized` | Desativa conta do profissional |
| `payout.paid` | Registra pagamento ao profissional |
| `payout.failed` | Registra falha no pagamento |

---

## TROUBLESHOOTING

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

### Erro: Taxa da plataforma nao sendo cobrada

**Solucao:**
1. Verifique `PLATFORM_FEE_PERCENTAGE` no `.env`
2. Verifique se o profissional tem Stripe Connect ativo
3. Verifique os logs do webhook

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

### Codigo
- [ ] Remover logs de debug
- [ ] Testar todos os fluxos em ambiente de staging
- [ ] Configurar monitoramento de erros (Sentry, etc.)

### Banco de Dados
- [ ] Executar migrations em producao
- [ ] Executar seed dos planos
- [ ] Executar script de criacao de precos no Stripe

---

## RESUMO DE METODOS DE PAGAMENTO

| Fluxo | Cartao | PIX | Motivo |
|-------|--------|-----|--------|
| **Assinaturas** | Sim | Nao | PIX nao suporta cobranca recorrente |
| **Agendamentos** | Sim | Sim | Pagamento unico |

---

**Ultima atualizacao:** Fevereiro 2026
