# GUIA COMPLETO - CONFIGURAÇÃO STRIPE PASSO A PASSO

## PASSO 1: ACESSAR O STRIPE DASHBOARD

### 1.1 - Login no Stripe

1. Acesse: https://dashboard.stripe.com/
2. Faça login com sua conta
3. **IMPORTANTE**: Certifique-se de estar em **modo de teste** (canto superior direito deve mostrar "Test mode")

---

## PASSO 2: OBTER AS CHAVES API

### 2.1 - Chaves Publicáveis e Secretas

1. No Stripe Dashboard, clique em **Developers** (menu superior)
2. Clique em **API keys** (menu lateral esquerdo)
3. Você verá duas chaves:

**Chave Publicável (Publishable key):**

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

## PASSO 3: CRIAR PRODUTOS E PREÇOS (ASSINATURAS)

### 3.1 - Criar Produto de Assinatura

1. No Stripe Dashboard, vá em **Products** (menu superior)
2. Clique em **+ Add product**
3. Preencha:
   - **Name**: `Plano Básico - Barbershop SaaS`
   - **Description**: `Plano básico para proprietários de barbearias`
4. Em **Pricing**:
   - **Pricing model**: Selecione `Standard pricing`
   - **Price**: `49.90`
   - **Billing period**: Selecione `Monthly`
   - **Currency**: `BRL - Brazilian Real`
5. Marque a opção: ✅ **Recurring**
6. Clique em **Add product**

### 3.2 - Obter o Price ID

1. Após criar o produto, você será redirecionado para a página do produto
2. Na seção **Pricing**, você verá algo como:

```
R$49.90 / month
price_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. **Copie esse Price ID** (começa com `price_`)
4. Adicione no `.env`:

```env
STRIPE_SUBSCRIPTION_PRICE_ID="price_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3.3 - (Opcional) Criar Mais Planos

Repita o processo acima para criar outros planos:

**Plano Profissional:**

- Name: `Plano Profissional - Barbershop SaaS`
- Price: `99.90`
- Billing period: `Monthly`

**Plano Empresarial:**

- Name: `Plano Empresarial - Barbershop SaaS`
- Price: `199.90`
- Billing period: `Monthly`

---

## PASSO 4: ATIVAR STRIPE CONNECT

### 4.1 - Habilitar Connect

1. No Stripe Dashboard, vá em **Connect** (menu superior)
2. Se for a primeira vez, clique em **Get started**
3. Preencha as informações da sua plataforma:
   - **Platform name**: `Barbershop SaaS`
   - **Support email**: seu email
   - **Platform website**: `http://localhost:3000` (ou seu domínio)

### 4.2 - Configurar Connect Settings

1. Vá em **Connect** → **Settings**
2. Em **Branding**:
   - **Brand name**: `Barbershop SaaS`
   - **Brand icon**: (opcional) faça upload de um logo
   - **Brand color**: escolha uma cor (ex: `#4F46E5`)
3. Clique em **Save**

### 4.3 - Configurar Account Types

1. Em **Connect** → **Settings** → **Account types**
2. Certifique-se de que **Express** está habilitado
3. Configure:
   - ✅ **Individual accounts**
   - ✅ **Company accounts**

---

## PASSO 5: CONFIGURAR WEBHOOKS

### 5.1 - Criar Webhook Endpoint Principal

1. Vá em **Developers** → **Webhooks**
2. Clique em **+ Add endpoint**
3. Preencha:
   - **Endpoint URL**: `http://localhost:3000/api/webhooks/stripe`
   - **Description**: `Main webhook handler`
4. Em **Select events to listen to**, escolha:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`

**OU** selecione **Select all events** (mais fácil para desenvolvimento)

5. Clique em **Add endpoint**

### 5.2 - Obter Webhook Secret (Principal)

1. Após criar o webhook, clique nele
2. Na seção **Signing secret**, clique em **Reveal**
3. **Copie o secret** (começa com `whsec_`)
4. Adicione no `.env`:

```env
STRIPE_WEBHOOK_SECRET_KEY="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 5.3 - Criar Webhook para Connect (Opcional)

1. Repita os passos acima, mas agora:
   - **Endpoint URL**: `http://localhost:3000/api/webhooks/stripe/connect`
   - **Description**: `Connect webhook handler`
2. Eventos:
   - ✅ `account.updated`
   - ✅ `account.external_account.created`
   - ✅ `account.external_account.updated`
3. Copie o signing secret e adicione:

```env
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## PASSO 6: INSTALAR STRIPE CLI (TESTE LOCAL)

### 6.1 - Instalar Stripe CLI

**macOS:**

```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**

```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin
```

### 6.2 - Login no Stripe CLI

```bash
stripe login
```

Isso abrirá o navegador para autenticar. Confirme o acesso.

### 6.3 - Testar Webhooks Localmente

Em um terminal separado, execute:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Você verá algo como:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**COPIE esse signing secret** e **substitua** temporariamente no `.env` durante desenvolvimento local:

```env
STRIPE_WEBHOOK_SECRET_KEY="whsec_xxxxxxxxxxxxx"
```

---

## PASSO 7: CONFIGURAR .ENV COMPLETO

Seu arquivo `.env` deve ficar assim:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/barbershop_saas"

# Better Auth
BETTER_AUTH_SECRET="USZFLpuozxsYxmU7Mgv4sFRwQDARtRlx"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET_KEY="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# Stripe Connect (opcional, se criou webhook separado)
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# Stripe Product IDs (após criar os produtos)
STRIPE_SUBSCRIPTION_PRICE_ID="price_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# AI (opcional)
GOOGLE_GENERATIVE_AI_API_KEY=""
OPENAI_API_KEY=""
```

---

## PASSO 8: EXECUTAR SCRIPT DE SETUP

### 8.1 - Criar Script de Setup de Produtos

Crie o arquivo `scripts/setup-stripe-products.ts`:

```typescript
// scripts/setup-stripe-products.ts
import { stripe } from "../src/lib/stripe";
import { prisma } from "../src/lib/prisma";

const PLANS = [
  {Serviços ilimitados
    key: "BASIC",
    name: "Básico",
    price: 49.9,
    maxBarbershops: 1,
    maxProfessionals: 3,
    features: ["1 Barbearia", "Até 3 Profissionais", "Suporte por Email"],
  },
  {
    key: "PROFESSIONAL",
    name: "Profissional",
    price: 99.9,
    maxBarbershops: 1,
    maxProfessionals: 10,
    features: [
      "1 Barbearia",
      "Até 10 Profissionais",
      "Analytics",
      "Suporte Prioritário",
    ],
  },
  {
    key: "ENTERPRISE",
    name: "Empresarial",
    price: 199.9,
    maxBarbershops: 5,
    maxProfessionals: 50,
    features: ["5 Barbearias", "50 Profissionais", "White Label", "API"],
  },
];

async function main() {
  console.log("🚀 Criando produtos no Stripe...\n");

  for (const plan of PLANS) {
    try {
      // Verificar se já existe
      const existing = await prisma.subscriptionPlan.findFirst({
        where: { name: plan.name },
      });

      if (existing) {
        console.log(`⚠️  Plano "${plan.name}" já existe, pulando...\n`);
        continue;
      }

      // 1. Criar produto
      const product = await stripe.products.create({
        name: `Plano ${plan.name}`,
        description: plan.features.join(" • "),
      });

      console.log(`✅ Produto criado: ${product.name}`);

      // 2. Criar preço
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price * 100),
        currency: "brl",
        recurring: {
          interval: "month",
          trial_period_days: 14,
        },
      });

      console.log(`✅ Preço criado: R$ ${plan.price}`);

      // 3. Salvar no banco
      await prisma.subscriptionPlan.create({
        data: {
          name: plan.name,
          stripePriceId: price.id,
          stripeProductId: product.id,
          price: plan.price,
          currency: "BRL",
          interval: "MONTHLY",
          maxBarbershops: plan.maxBarbershops,
          maxProfessionals: plan.maxProfessionals,
          features: plan.features,
          isActive: true,
          isPopular: plan.key === "PROFESSIONAL",
        },
      });

      console.log(`✅ Salvo no banco\n`);
    } catch (error: any) {
      console.error(`❌ Erro ao criar ${plan.name}:`, error.message);
    }
  }

  console.log("✅ Setup concluído!");
}

main()
  .catch(console.error)
  .finally(() => process.exit());
```

### 8.2 - Executar Script

```bash
npx tsx scripts/setup-stripe-products.ts
```

Você deve ver:

```
🚀 Criando produtos no Stripe...

✅ Produto criado: Plano Básico
✅ Preço criado: R$ 49.9
✅ Salvo no banco

✅ Produto criado: Plano Profissional
✅ Preço criado: R$ 99.9
✅ Salvo no banco

✅ Produto criado: Plano Empresarial
✅ Preço criado: R$ 199.9
✅ Salvo no banco

✅ Setup concluído!
```

---

## PASSO 9: TESTAR WEBHOOKS LOCALMENTE

### 9.1 - Iniciar Servidor Next.js

Terminal 1:

```bash
pnpm dev
```

### 9.2 - Iniciar Stripe CLI

Terminal 2:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 9.3 - Testar Evento

Terminal 3:

```bash
stripe trigger checkout.session.completed
```

Você deve ver no Terminal 2:

```
2024-02-03 10:30:15   --> checkout.session.completed [evt_xxxxx]
2024-02-03 10:30:15  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
```

E no console do Next.js (Terminal 1):

```
📨 Webhook: checkout.session.completed
✅ Assinatura ativada: owner_xxxxx
```

---

## PASSO 10: CONFIGURAR CUSTOMER PORTAL

### 10.1 - Ativar Customer Portal

1. No Stripe Dashboard, vá em **Settings** → **Billing** → **Customer portal**
2. Clique em **Activate test link**
3. Configure:
   - ✅ **Allow customers to update subscription**: Ativado
   - ✅ **Allow customers to cancel subscription**: Ativado
   - ✅ **Allow customers to update payment methods**: Ativado
4. Em **Business information**:
   - **Business name**: `Barbershop SaaS`
   - **Support email**: seu email
   - **Support phone**: (opcional)
5. Clique em **Save**

---

## PASSO 11: TESTAR FLUXO COMPLETO

### 11.1 - Criar Conta de Proprietário

1. Acesse: `http://localhost:3000/register`
2. Selecione **Proprietário**
3. Preencha os dados e crie a conta

### 11.2 - Assinar um Plano

1. Vá para: `http://localhost:3000/dashboard/owner/subscription`
2. Clique em **Assinar** em um dos planos
3. Você será redirecionado para o Stripe Checkout

### 11.3 - Pagar com Cartão de Teste

Use os seguintes dados de teste:

**Cartão de Sucesso:**

- Número: `4242 4242 4242 4242`
- Data: Qualquer data futura (ex: `12/25`)
- CVC: Qualquer 3 dígitos (ex: `123`)
- CEP: Qualquer (ex: `12345-678`)

**Cartão que Falha:**

- Número: `4000 0000 0000 0002`

### 11.4 - Verificar Webhooks

Após o pagamento, verifique:

1. Terminal do Stripe CLI mostra eventos recebidos
2. Console do Next.js mostra processamento
3. Banco de dados atualizado:

```bash
npx prisma studio
```

Abra a tabela `Owner` e verifique:

- `subscriptionStatus`: `ACTIVE`
- `stripeSubscriptionId`: preenchido
- `currentPeriodEnd`: data futura

---

## PASSO 12: CONFIGURAR STRIPE CONNECT PARA PROFISSIONAIS

### 12.1 - Criar Conta de Profissional (Teste)

1. Vá em **Connect** → **Accounts**
2. Clique em **+ New**
3. Selecione **Express**
4. Preencha dados de teste:
   - **Email**: `professional@test.com`
   - **Country**: `Brazil`
5. Complete o onboarding de teste

### 12.2 - Testar Criação de Conta via API

```bash
curl -X POST http://localhost:3000/api/professionals/connect/create-account \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

Você receberá:

```json
{
  "accountId": "acct_xxxxxxxxxxxxx",
  "onboardingUrl": "https://connect.stripe.com/setup/c/xxxxx"
}
```

---

## PASSO 13: CHECKLIST FINAL

Antes de iniciar o desenvolvimento, verifique:

### ✅ Stripe Dashboard

- [ ] Modo de teste ativado
- [ ] Produtos criados
- [ ] Preços configurados
- [ ] Stripe Connect ativado
- [ ] Webhooks configurados
- [ ] Customer Portal ativado

### ✅ Variáveis de Ambiente

- [ ] `STRIPE_SECRET_KEY` configurada
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurada
- [ ] `STRIPE_WEBHOOK_SECRET_KEY` configurada
- [ ] `STRIPE_SUBSCRIPTION_PRICE_ID` configurada (opcional)

### ✅ Banco de Dados

- [ ] Migrations executadas (`npx prisma migrate dev`)
- [ ] Tabela `SubscriptionPlan` populada
- [ ] Prisma Studio funcionando (`npx prisma studio`)

### ✅ Desenvolvimento Local

- [ ] Next.js rodando (`pnpm dev`)
- [ ] Stripe CLI instalado e autenticado
- [ ] Webhooks sendo recebidos localmente

---

## PASSO 14: COMANDOS ÚTEIS

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

### Testar Eventos Específicos

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

### Listar Preços

```bash
stripe prices list
```

---

## TROUBLESHOOTING COMUM

### ❌ Webhook não recebe eventos

**Solução:**

```bash
# Verifique se Stripe CLI está rodando
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Teste manualmente
stripe trigger payment_intent.succeeded
```

### ❌ Erro: "No such price"

**Solução:**

- Verifique se o `STRIPE_SUBSCRIPTION_PRICE_ID` no `.env` está correto
- Liste os preços: `stripe prices list`

### ❌ Erro: "Invalid API Key"

**Solução:**

- Certifique-se de estar usando a chave de **teste** (`sk_test_`)
- Verifique se não há espaços no `.env`

### ❌ Connect Account não cria

**Solução:**

- Verifique se Stripe Connect está ativado no Dashboard
- Certifique-se de que sua conta Stripe foi verificada

---

## PRÓXIMOS PASSOS

Agora você está pronto para:

1. ✅ Desenvolver as páginas de assinatura
2. ✅ Implementar o onboarding de profissionais
3. ✅ Criar o sistema de pagamentos de serviços
4. ✅ Desenvolver os dashboards

**Começar a desenvolver:**

```bash
pnpm dev
```

Acesse: `http://localhost:3000`

---

**Está tudo configurado! Precisa de ajuda com algum passo específico?** 🚀
exit
