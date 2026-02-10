# Fluxo de Receita - Servix

## Visao Geral

O Servix possui **duas fontes de receita** principais:

1. **Assinaturas de Planos** - Venda de planos mensais para proprietarios de barbearias
2. **Taxa de Transacao** - 10% sobre cada agendamento pago pelos clientes

---

## 1. Assinaturas de Planos (Receita Recorrente)

### Tabela de Planos

| Plano | Preco Mensal | Max Estabelecimentos | Max Profissionais | Max Servicos |
|-------|--------------|----------------------|-------------------|--------------|
| **BASIC** | R$ 39,90 | 1 | 1 (apenas dono) | 3 |
| **STANDARD** | R$ 59,90 | 1 | 3 | 10 |
| **PROFESSIONAL** | R$ 99,90 | 1 | 10 | 30 |
| **ENTERPRISE** | R$ 249,90 | 5 | 50 | Ilimitado |

### Fluxo de Assinatura

```
Proprietario acessa planos
        |
        v
Seleciona plano desejado
        |
        v
Stripe Checkout Session (mode: subscription)
        |
        v
Pagamento aprovado
        |
        v
Webhook: checkout.session.completed
        |
        v
Cria/Atualiza Subscription no banco
        |
        v
Proprietario tem acesso aos recursos do plano
```

### Arquivos Relacionados

- `/lib/stripe-subscriptions.ts` - Gerenciamento de assinaturas
- `/actions/subscriptions/create-subscription-checkout.ts` - Criar checkout
- `/actions/subscriptions/change-subscription-plan.ts` - Mudar plano
- `/lib/plan-limits.ts` - Limites de recursos por plano

---

## 2. Taxa de Transacao (10% por Agendamento)

### Configuracao

```env
# .env
PLATFORM_FEE_PERCENTAGE=10
```

### Calculo da Taxa

```typescript
// /lib/stripe.ts
export function calculatePlatformFee(amountInCents: number): number {
  const feePercentage = parseInt(
    process.env.PLATFORM_FEE_PERCENTAGE ?? "10",
    10,
  );
  return Math.round((amountInCents * feePercentage) / 100);
}
```

### Exemplo Pratico

```
Servico: Corte de Cabelo - R$ 50,00

Cliente paga: R$ 50,00
    |
    +-- Profissional recebe: R$ 45,00 (90%)
    |
    +-- Plataforma recebe: R$ 5,00 (10%)
```

### Fluxo de Pagamento de Agendamento

```
Cliente seleciona servico
        |
        v
Escolhe data, profissional e horario
        |
        v
Clica em "Confirmar"
        |
        v
createBookingCheckoutSession()
        |
        v
Calcula taxa da plataforma (10%)
        |
        v
Cria Stripe Checkout Session com:
  - payment_method_types: [card, pix]
  - application_fee_amount: taxa da plataforma
  - transfer_data.destination: conta do profissional
        |
        v
Cliente paga (Cartao ou PIX)
        |
        v
Stripe divide automaticamente:
  - 90% -> Conta Stripe Connect do profissional
  - 10% -> Conta da plataforma
        |
        v
Webhook: checkout.session.completed
        |
        v
Cria Booking e Payment no banco
```

### Arquivos Relacionados

- `/actions/create-booking-checkout-session.ts` - Criar sessao de pagamento
- `/lib/stripe.ts` - Calculo da taxa
- `/app/api/stripe/webhook/route.ts` - Processar pagamento

---

## 3. Stripe Connect (Profissionais) - OBRIGATORIO

### O que e?

Stripe Connect e **OBRIGATORIO** para que profissionais possam receber agendamentos. Sem Stripe Connect configurado, o profissional nao aparece como disponivel para agendamentos.

A plataforma automaticamente desconta a taxa de 10% e transfere o restante para o profissional.

### Configuracao da Conta Express

```typescript
// /lib/stripe-connect.ts
{
  type: "express",
  country: "BR",
  business_type: "individual",
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true }
  },
  settings: {
    payouts: {
      schedule: { interval: "daily" }
    }
  }
}
```

### Status da Conta

| Status | Descricao |
|--------|-----------|
| `PENDING` | Conta criada, aguardando onboarding |
| `ONBOARDING` | Profissional preenchendo dados |
| `ACTIVE` | Pronto para receber pagamentos |
| `RESTRICTED` | Precisa de informacoes adicionais |
| `DISABLED` | Conta rejeitada/fraude |

### Fluxo de Onboarding

```
Profissional clica em "Configurar Pagamentos"
        |
        v
Cria conta Express no Stripe
        |
        v
Redireciona para Stripe Onboarding
        |
        v
Profissional preenche dados bancarios
        |
        v
Webhook: account.updated
        |
        v
Atualiza status para ACTIVE
        |
        v
Profissional pode receber pagamentos
```

---

## 4. Webhooks

### Webhook Principal (`/api/stripe/webhook`)

| Evento | Acao |
|--------|------|
| `checkout.session.completed` (subscription) | Sincroniza assinatura |
| `checkout.session.completed` (payment) | Cria Booking e Payment |
| `customer.subscription.updated` | Atualiza plano, aplica limites |
| `customer.subscription.deleted` | Cancela assinatura |
| `invoice.paid` | Confirma pagamento da assinatura |
| `invoice.payment_failed` | Marca falha no pagamento |
| `charge.refunded` | Processa reembolso |

### Webhook Connect (`/api/stripe/connect/webhook`)

| Evento | Acao |
|--------|------|
| `account.updated` | Atualiza status do profissional |
| `account.application.deauthorized` | Desativa conta do profissional |
| `payout.paid` | Registra pagamento ao profissional |
| `payout.failed` | Registra falha no pagamento |

---

## 5. Modelo de Dados

### Subscription (Assinatura)

```prisma
model Subscription {
  id                   String   @id
  stripeSubscriptionId String   @unique
  stripePriceId        String
  stripeProductId      String
  plan                 Plan
  status               SubscriptionStatus
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  barbershopId         String   @unique
}
```

### Payment (Pagamento de Agendamento)

```prisma
model Payment {
  id                    String   @id
  amountInCents         Int      // Valor total
  applicationFeeInCents Int      // Taxa da plataforma (10%)
  status                PaymentStatus
  paymentMethod         String   // "card" ou "pix"
  stripePaymentIntentId String
  stripeChargeId        String?
  stripeTransferId      String?  // Transferencia pro profissional
  professionalId        String
  bookingId             String   @unique
}
```

### Professional (Profissional)

```prisma
model Professional {
  id                       String   @id
  stripeAccountId          String?  @unique
  stripeAccountStatus      StripeAccountStatus
  stripeOnboardingComplete Boolean  @default(false)
  acceptsCard              Boolean  @default(true)
  acceptsPix               Boolean  @default(true)
}
```

---

## 6. Resumo de Receitas

### Receita por Assinatura (Exemplo Mensal)

| Metrica | Valor |
|---------|-------|
| 100 clientes BASIC | R$ 3.990,00 |
| 50 clientes STANDARD | R$ 2.995,00 |
| 20 clientes PROFESSIONAL | R$ 1.998,00 |
| 5 clientes ENTERPRISE | R$ 1.249,50 |
| **Total Assinaturas** | **R$ 10.232,50/mes** |

### Receita por Transacao (Exemplo Mensal)

| Metrica | Valor |
|---------|-------|
| 1.000 agendamentos | - |
| Ticket medio: R$ 50,00 | R$ 50.000,00 |
| Taxa 10% | **R$ 5.000,00/mes** |

### Receita Total Exemplo

```
Assinaturas:  R$  8.482,50
Transacoes:   R$  5.000,00
--------------------------
TOTAL:        R$ 13.482,50/mes
```

---

## 7. Variaveis de Ambiente

```env
# Chaves Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Webhooks
STRIPE_WEBHOOK_SECRET_KEY="whsec_..."
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_..."

# Taxa da Plataforma
PLATFORM_FEE_PERCENTAGE=10
```

---

## 8. Arquivos Importantes

| Arquivo | Descricao |
|---------|-----------|
| `/lib/stripe.ts` | Instancia Stripe + calculo taxa |
| `/lib/stripe-subscriptions.ts` | Gerenciar assinaturas |
| `/lib/stripe-connect.ts` | Contas dos profissionais |
| `/lib/plan-limits.ts` | Limites por plano |
| `/app/api/stripe/webhook/route.ts` | Webhook principal |
| `/app/api/stripe/connect/webhook/route.ts` | Webhook Connect |
| `/actions/create-booking-checkout-session.ts` | Pagamento de agendamento |
| `/actions/subscriptions/*` | Acoes de assinatura |

---

## 9. Diagrama de Fluxo Completo

```
                    SERVIX - FLUXO DE RECEITA
                    =========================

    PROPRIETARIO                              CLIENTE
         |                                        |
         v                                        v
    Assina Plano                           Agenda Servico
    (R$ 29-199/mes)                        (Ex: R$ 50,00)
         |                                        |
         v                                        v
    [STRIPE BILLING]                      [STRIPE CHECKOUT]
         |                                        |
         v                                        |
    Receita Recorrente                            |
    para Plataforma                               |
                                                  v
                                          [STRIPE CONNECT]
                                                  |
                              +-------------------+-------------------+
                              |                                       |
                              v                                       v
                      Profissional                              Plataforma
                      recebe 90%                                recebe 10%
                      (R$ 45,00)                                (R$ 5,00)
```

---

## 10. Taxas do Stripe (O que voce paga)

### Taxas por Metodo de Pagamento

| Metodo | Taxa Stripe |
|--------|-------------|
| **PIX** | 1,19% por transacao |
| **Cartao Nacional** | 3,99% + R$ 0,39 por transacao |
| **Cartao Internacional** | 5,99% + R$ 0,39 por transacao |

### Exemplo Pratico - Agendamento de R$ 50,00

#### Pagamento via PIX:
```
Cliente paga:                    R$ 50,00
Taxa Stripe (1,19%):            -R$  0,60
Valor liquido:                   R$ 49,40
  |
  +-- Profissional (90%):        R$ 44,46
  +-- Voce (10%):                R$  4,94
```

#### Pagamento via Cartao:
```
Cliente paga:                    R$ 50,00
Taxa Stripe (3,99% + R$0,39):   -R$  2,39
Valor liquido:                   R$ 47,61
  |
  +-- Profissional (90%):        R$ 42,85
  +-- Voce (10%):                R$  4,76
```

### Quem Paga a Taxa do Stripe?

A taxa do Stripe e descontada do valor total ANTES da divisao entre voce e o profissional. Ou seja, ambos "dividem" o custo proporcionalmente.

### Calculo Real da sua Receita por Transacao

| Metodo | Sua Taxa Bruta (10%) | Sua Taxa Liquida |
|--------|---------------------|------------------|
| PIX | R$ 5,00 | ~R$ 4,94 |
| Cartao | R$ 5,00 | ~R$ 4,76 |

### Taxa de Assinaturas

Para assinaturas (planos mensais), as mesmas taxas se aplicam:

| Plano | Preco | Taxa Cartao | Voce Recebe |
|-------|-------|-------------|-------------|
| BASIC | R$ 39,90 | R$ 1,98 | R$ 37,92 |
| STANDARD | R$ 59,90 | R$ 2,78 | R$ 57,12 |
| PROFESSIONAL | R$ 99,90 | R$ 4,38 | R$ 95,52 |
| ENTERPRISE | R$ 249,90 | R$ 10,36 | R$ 239,54 |

### Resumo Mensal com Taxas (Exemplo)

```
RECEITA BRUTA
=============
Assinaturas (175 clientes):     R$ 10.232,50
Transacoes (1000 agendamentos): R$  5.000,00
TOTAL BRUTO:                    R$ 15.232,50

TAXAS STRIPE (estimativa)
=========================
Assinaturas (~4,5%):           -R$    460,46
Transacoes (~2% medio):        -R$    100,00
TOTAL TAXAS:                   -R$    560,46

RECEITA LIQUIDA
===============
TOTAL:                          R$ 14.672,04/mes
```

### Dica: Incentive PIX

Como PIX tem taxa menor (1,19% vs 3,99%), voce pode:
- Destacar PIX como opcao preferencial
- Oferecer pequeno desconto para PIX
- Sua margem aumenta ~2,8% por transacao

---

**Ultima atualizacao:** Fevereiro 2026
