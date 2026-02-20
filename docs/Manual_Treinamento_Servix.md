# SERVIX — Manual do Proprietário

Bem-vindo ao Servix! Este guia vai te ajudar a configurar tudo do zero de forma simples e rápida.

---

## Índice

1. [Primeiro Acesso e Login](#1-primeiro-acesso-e-login)
2. [Criando sua Loja](#2-criando-sua-loja)
3. [Ativando seu Plano](#3-ativando-seu-plano)
4. [Gerenciando Profissionais](#4-gerenciando-profissionais)
5. [Configurando o Perfil do Profissional](#5-configurando-o-perfil-do-profissional)
6. [Configurações do Profissional (Pagamento e WhatsApp)](#6-configurações-do-profissional-pagamento-e-whatsapp)
7. [Cadastrando Serviços](#7-cadastrando-serviços)
8. [Configurando Horários e Intervalo de Almoço](#8-configurando-horários-e-intervalo-de-almoço)
9. [Painel Profissional e Stripe](#9-painel-profissional-e-stripe)
10. [Checklist Final](#10-checklist-final)

> Os seus serviços só aparecem para os clientes quando há pelo menos um profissional **ativo** configurado.

---

## 1. Primeiro Acesso e Login

Abra o link que foi enviado para você e toque no ícone de menu **≡** no canto superior direito.

Toque em **Login** → **Entrar com Google** → autorize o acesso.

Na primeira vez, o sistema vai perguntar se você é **Cliente** ou **Proprietário**. Escolha **Proprietário** e toque em **Continuar**.

---

## 2. Criando sua Loja

Preencha os dados do seu negócio com suas informações reais:

| Campo | Exemplo |
|-------|---------|
| **Nome do Negócio** ✱ | Barbearia do João / Salão da Ana |
| **Endereço** ✱ | Rua das Flores, 123 — Centro |
| **Cidade** ✱ | Anápolis |
| **Estado** ✱ | GO |
| **Telefone** ✱ | (62) 99999-9999 |
| **CPF** ✱ | 000.000.000-00 |
| **Descrição** ✱ | O que você oferece e seus diferenciais |
| **Foto do Negócio** | Opcional, mas recomendado! |

✱ Campo obrigatório

> A **Cidade** e o **Estado** são obrigatórios e são usados para que os clientes encontrem sua loja ao filtrar por localização na página inicial.

> Uma boa descrição ajuda muito os clientes a te encontrarem. Fale sobre seus serviços, como você atende e o que te diferencia.

Após salvar, você vai para o **Dashboard** — a tela principal da sua loja.

---

## 3. Ativando seu Plano

Sem plano ativo, o sistema fica bloqueado. Para assinar, toque na **mensagem amarela** no Dashboard ou vá em **menu ≡ → Assinatura**.

**Planos disponíveis:**

| Plano | Preço | Profissionais | Serviços |
|-------|-------|:---:|:---:|
| **Básico** | R$ 39,90/mês | 1 | 3 |
| **Padrão** | R$ 79,90/mês | 3 | 10 |
| **Profissional** | R$ 129,90/mês | 20 | 50 |

Escolha o plano, clique em **Assinar**, preencha os dados do cartão e confirme. Pronto — assinatura ativa na hora!

> No Plano Básico, você é o dono e também o único profissional da loja.

---

## 4. Gerenciando Profissionais

### No Plano Básico
Você mesmo é o profissional. Configure seu perfil em **menu ≡ → Profissionais → Gerenciar**.

Para dados da loja: **menu ≡ → Estabelecimentos**
Para dados de profissionais: **menu ≡ → Profissionais**

### No Plano Padrão ou Profissional
Você pode adicionar outros profissionais. Vá em **Profissionais → Adicionar profissional** e informe:

- Nome do profissional
- E-mail (o mesmo que ele usa no Google)
- Nome do grupo do WhatsApp da agenda dele

**Depois é só enviar o link da sua loja para ele!**

Quando o profissional abrir o link e fazer login com o Google usando o e-mail que você cadastrou, o sistema já o reconhece automaticamente como profissional da sua loja — sem precisar aprovar nada. Ele segue o próprio cadastro a partir daí.

> Cada profissional configura apenas o próprio perfil: conta bancária, horários e agendamentos são dele.

**Como dono, você acompanha:**
- A agenda e os agendamentos de cada profissional
- O desempenho da equipe
- O status do Stripe de cada um

---

## 5. Configurando o Perfil do Profissional

**Para o proprietário:** Acesse **menu ≡ → Profissionais → Gerenciar**

Aqui o proprietário pode editar os dados básicos do profissional:
- **Nome de Exibição** — como vai aparecer para os clientes
- **Email** — email de acesso do profissional
- **Biografia** — experiência e especialidades (opcional)
- **Nome do Grupo WhatsApp** — nome exato do grupo de notificações

O proprietário também visualiza o **status do Stripe** e pode **ativar/desativar** o profissional.

Toque em **Salvar Alterações**.

---

## 6. Configurações do Profissional (Pagamento e WhatsApp)

> As configurações de formas de pagamento e WhatsApp são de responsabilidade do **profissional**. O proprietário não precisa configurar isso.

**Para o profissional:** Acesse **Painel Profissional → menu ≡ → Configurações**

### Formas de Pagamento

| Forma | Status | Como funciona |
|-------|:------:|--------------|
| **Cartão de Crédito** | Já vem ativo | Cliente paga online na hora do agendamento |
| **Pagar após o serviço** | Desativado | Ative se quiser cobrar presencialmente |
| **PIX** | Em breve | Ainda em desenvolvimento |

**Quer receber presencialmente (maquininha, PIX, dinheiro)?**
Mantenha o cartão ativo **e** ative também "Pagar após o serviço". O cliente agenda sem pagar, você atende, recebe o pagamento e marca o atendimento como **Finalizado** no sistema.

> Sempre marque como **Finalizado** — isso atualiza o histórico de vocês dois.

Na mesma tela, configure o **Nome do Grupo WhatsApp** — o nome exato do grupo onde as notificações de agendamento serão enviadas.

Toque em **Salvar Configurações**.

### Conectando o WhatsApp

O Servix envia notificações de agendamento automaticamente para um grupo do WhatsApp. Após cada agendamento ou cancelamento (em qualquer data), a agenda atualizada é enviada ao grupo.

> O nome do grupo no sistema precisa ser **idêntico** ao nome do grupo no WhatsApp — letra por letra, incluindo maiúsculas e espaços.

> Coloque o grupo como **"Somente admins enviam mensagens"** para as notificações ficarem organizadas.

**Opção A — QR Code:**
Na tela de Configurações, toque em **QR Code** → abra o WhatsApp → **Dispositivos Conectados → Conectar dispositivo** → escaneie o código.

**Opção B — Número de telefone:**
Toque em **Número do Celular** → digite seu número → toque em **Conectar** → use o código de pareamento no WhatsApp (**Dispositivos Conectados → Conectar com número de telefone**).

Quando aparecer **"Conectado"**, está funcionando!

> Se o QR Code expirar ou a tela abrir e fechar rapidamente, basta solicitar novamente — o sistema automaticamente limpa a sessão anterior antes de criar uma nova.

---

## 7. Cadastrando Serviços

Acesse: **menu ≡ → Serviços → + Novo Serviço**

Preencha:
- **Nome** — ex: Corte Masculino
- **Descrição** — o que está incluso
- **Preço** — ex: 50,00
- **Duração** — ex: 30 minutos (controla os horários disponíveis)
- **Foto** — opcional, mas aumenta muito as reservas!

Toque em **Criar Serviço**. Pronto!

> No Plano Básico você cadastra até 3 serviços. O contador aparece no topo da tela.

---

## 8. Configurando Horários e Intervalo de Almoço

Acesse pelo **Painel Profissional → Minha Agenda**.

> A configuração de horários está disponível exclusivamente no painel do profissional.

### Horários de Trabalho
Para cada dia da semana, configure:
- **Ativar/desativar o dia** — marque os dias em que você trabalha
- **Horário de início e fim** — defina seu expediente (ex: 08:00 às 18:00)

### Intervalo de Almoço
Para cada dia, você pode ativar o **intervalo de almoço**:
- Ative o botão "Intervalo de almoço"
- Defina o horário de início e fim (ex: 12:00 às 13:00)
- Os horários de almoço serão **automaticamente removidos** da agenda disponível para o cliente

**Exemplo:** Se você trabalha das 08:00 às 18:00 com almoço das 12:00 às 13:00, o cliente verá slots das 08:00 às 12:00 e das 13:00 às 18:00.

### Proteção de Agendamentos
Se você tentar alterar o horário de almoço e já existir um agendamento confirmado naquele horário, o sistema vai bloquear a alteração e informar qual agendamento está em conflito (data, horário e nome do cliente).

### Sincronização com WhatsApp
Qualquer alteração nos horários de trabalho ou intervalo de almoço é refletida imediatamente:
- Na agenda disponível para o cliente
- Nas mensagens enviadas ao grupo do WhatsApp

Toque em **Salvar Alterações** após configurar.

---

## 9. Painel Profissional e Stripe

### Painel Profissional
Acesse pelo **menu ≡ → Painel Profissional**. Aqui você acompanha agendamentos do dia, do mês, seus ganhos e o status do Stripe.

### Configurando o Stripe — Receber pagamentos online

O Stripe é a plataforma de pagamentos do Servix. Você configura uma única vez para começar a receber pelo cartão direto na sua conta bancária.

**Antes de começar, tenha em mãos:**
- RG ou CNH
- CPF
- Dados bancários (banco, agência, conta)
- Comprovante de endereço dos últimos 3 meses (conta de água, luz, internet etc.)

**Para iniciar:** No Painel Profissional, toque no aviso amarelo → **Configurar** → **Configurar conta Stripe**.

> O link do Stripe tem prazo de validade. Se der erro, basta recarregar a página (F5) para gerar um novo.

---

### Passo 1 — "Vamos começar"
Informe seu **e-mail** e **telefone** com DDD (ex: +55 62 99999-9999) e toque em **Enviar**.

---

### Passo 2 — Dados da Empresa
Preencha os 3 campos:

**Setor:** Toque no campo e selecione:
> **Serviços pessoais → Salões de beleza ou barbearias**
> Digite "salão" ou "barbearia" na busca para achar rápido.

**Renda mensal:** Escolha a faixa que representa seu faturamento.

**Descrição:** 2 a 3 frases sobre seu negócio.
> Ex: *"Barbearia especializada em cortes masculinos e barba. Atendo por agendamento pelo Servix e presencialmente. Cobro via cartão ou após o serviço."*

Toque em **Continuar**.

---

### Passo 3 — Dados Pessoais
Preencha nome completo, e-mail, data de nascimento, endereço, telefone e CPF.

Na pergunta sobre **cargo governamental**, selecione **Não** (a menos que se aplique à sua situação).

Toque em **Continuar**.

---

### Passo 4 — Verificação de Identidade
Selecione o tipo de documento (RG, CNH ou Passaporte) e toque em **Digitalizar identificação com foto**. Siga as instruções na tela.

> Se der erro "Documento não legível": tire a foto em local bem iluminado, com o documento inteiro visível e sem reflexo.

---

### Passo 5 — Conta Bancária
Escolha seu banco, informe a agência e o número da conta.

> A conta precisa estar no mesmo CPF informado no cadastro.

---

### Passo 6 — Comprovante de Endereço (se solicitado)
Documentos aceitos (dos últimos 12 meses): conta de água, luz, internet, telefone fixo, extrato bancário, contrato de locação, IRPF, documento do INSS, IPTU ou IPVA.

> Print de tela não é aceito.

---

### Passo 7 — Revisão Final
O Stripe mostra um resumo de tudo. Se aparecer **"Inválido"** em alguma seção, toque em **Editar** e corrija. Quando estiver tudo certo, toque em **Concordar e enviar**.

---

### Pronto!
Você verá a mensagem **"Conta integrada"** — o cadastro foi enviado!

Se aparecer **"Configuração pendente"**, é normal. O Stripe está analisando. Toque em **"Ir para o Dashboard"** e aguarde — quando aprovado, o status muda automaticamente de **Pendente** para **Ativo** no seu Painel Profissional.

---

## 10. Checklist Final

| # | Quem faz | O que fazer | Feito? |
|---|---------|-------------|:------:|
| 1 | Proprietário | Login com Google e selecionar perfil Proprietário | |
| 2 | Proprietário | Criar a loja (nome, endereço, cidade, estado, CPF, descrição, foto) | |
| 3 | Proprietário | Ativar o plano de assinatura | |
| 4 | Proprietário | Cadastrar profissionais (nome, email) | |
| 5 | Proprietário | Cadastrar os serviços (nome, preço, duração, foto) | |
| 6 | Profissional | Configurar perfil (nome, biografia) | |
| 7 | Profissional | Definir formas de pagamento e nome do grupo WhatsApp (Configurações) | |
| 8 | Profissional | Conectar o WhatsApp (Configurações) | |
| 9 | Profissional | Configurar horários de atendimento e intervalo de almoço | |
| 10 | Profissional | Configurar conta Stripe no Painel Profissional | |

---

> **Tudo pronto! Sua loja está no ar.**
> Os clientes já podem te encontrar e fazer agendamentos pelo Servix. Boas vendas!

---
*Servix — Gestão Profissional para Negócios de Beleza*
