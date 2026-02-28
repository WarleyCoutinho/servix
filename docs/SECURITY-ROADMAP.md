# Roadmap de Seguranca e Performance — Sistema de Suporte

> Documento gerado em 28/02/2026 com base na auditoria de seguranca do sistema de suporte.
> Itens ja corrigidos estao marcados. Os pendentes sao melhorias futuras.

---

## Corrigidos (v96cf59d)

### CRITICAL
- [x] **IDOR** — Paginas de ticket agora validam auth + role diretamente (defense-in-depth)
- [x] **Race condition** — Double-check no `getOrCreateTicket` antes de criar ticket novo
- [x] **Validacao de existencia** — Endpoints assign/resolve/messages verificam se ticket existe antes de operar

### HIGH
- [x] **Limite de tamanho** — Mensagens limitadas a 5000 caracteres (Zod + truncamento server-side)
- [x] **imageUrl validada** — Aceita apenas paths `/api/uploads/` (upload legitimo do sistema)
- [x] **Tickets resolvidos protegidos** — Nao podem receber mensagens, ser re-resolvidos ou atribuidos
- [x] **JSON parsing seguro** — try/catch em todos os endpoints POST
- [x] **Mensagens vazias** — Rejeitadas no chat do usuario

### MEDIUM
- [x] **Status transition** — Admin sempre vai para IN_PROGRESS ao responder
- [x] **Indices compostos** — `[userId, status]` e `[ticketId, isFromAdmin, readByUser]`
- [x] **Defense-in-depth** — Paginas admin/support com auth propria alem do layout

---

## Implementados

### 1. Rate Limiting (MEDIUM — Seguranca) — DONE

**Problema:** Nenhuma rota do suporte tem rate limiting. Um usuario pode enviar spam de mensagens ou abusar do polling.

**Solucao recomendada:**
- Usar `@upstash/ratelimit` com Redis (Upstash) para limitar:
  - POST `/api/support/chat` — max 10 mensagens/minuto por usuario
  - GET `/api/support/messages` — max 20 requests/minuto por usuario
  - POST `/api/admin/support/*/messages` — max 30 mensagens/minuto por admin
- Alternativa: middleware no Next.js com `next-rate-limit`

**Arquivos afetados:**
- `app/api/support/chat/route.ts`
- `app/api/support/messages/route.ts`
- `app/api/admin/support/[ticketId]/messages/route.ts`

**Prioridade:** Media-Alta
**Esforco:** ~2h

---

### 2. Polling para SSE (MEDIUM — Performance) — DONE

**Problema:** O sistema usa polling a cada 5 segundos em ambos os lados (usuario e admin). Isso gera carga desnecessaria no banco e latencia de ate 5s nas respostas.

**Solucao recomendada:**
- Implementar Server-Sent Events (SSE) para notificacoes em tempo real
- Manter polling como fallback
- Rota SSE: `GET /api/support/events?ticketId=xxx` que envia eventos quando ha nova mensagem

**Beneficios:**
- Respostas instantaneas (< 100ms vs 5000ms)
- Menos queries no banco (evento push vs pull constante)
- Menor consumo de bandwidth

**Arquivos afetados:**
- Nova rota SSE
- `components/support-chat.tsx` — trocar setInterval por EventSource
- `app/dashboard/admin/support/[ticketId]/ticket-chat.tsx` — idem

**Prioridade:** Media
**Esforco:** ~4-6h

---

### 3. Audit Log (LOW — Observabilidade) — DONE

**Problema:** Nao ha registro de acoes administrativas no suporte (quem atribuiu, quem resolveu, mudancas de status).

**Solucao recomendada:**
- Criar model `SupportAuditLog` no Prisma:
  ```
  model SupportAuditLog {
    id        String   @id @default(uuid())
    action    String   // ASSIGN, RESOLVE, MESSAGE, STATUS_CHANGE
    ticketId  String
    userId    String
    metadata  Json?
    createdAt DateTime @default(now())
  }
  ```
- Registrar em cada endpoint: assign, resolve, messages POST
- Criar pagina admin para visualizar historico de acoes

**Arquivos afetados:**
- `prisma/schema.prisma`
- `app/api/admin/support/[ticketId]/assign/route.ts`
- `app/api/admin/support/[ticketId]/resolve/route.ts`
- `app/api/admin/support/[ticketId]/messages/route.ts`
- Nova pagina: `app/dashboard/admin/support/audit/page.tsx`

**Prioridade:** Baixa
**Esforco:** ~3h

---

### 4. Filtro de Conteudo na IA (LOW — Seguranca) — DONE

**Problema:** Respostas da IA sao salvas diretamente no banco sem revisao. A IA poderia gerar conteudo inapropriado.

**Solucao recomendada:**
- Adicionar layer de moderacao apos resposta da IA
- Opcoes:
  - OpenAI Moderation API (gratuita)
  - Filtro de palavras proibidas local
  - Flag automatico para revisao humana se score de moderacao alto

**Arquivos afetados:**
- `lib/ai.ts` — adicionar funcao `moderateContent()`
- `app/api/support/chat/route.ts` — chamar antes de salvar

**Prioridade:** Baixa
**Esforco:** ~2h

---

### 5. Deduplicacao de Mensagens no Client (LOW — UX) — DONE

**Problema:** Em condicoes de rede instavel, o polling pode entregar mensagens duplicadas no client-side.

**Solucao recomendada:**
- Usar `id` da mensagem como chave unica
- Manter Set de IDs ja exibidos
- Ignorar mensagens com ID duplicado no polling

**Arquivos afetados:**
- `components/support-chat.tsx`

**Prioridade:** Baixa
**Esforco:** ~30min

---

### 6. Reduzir Dados Sensiveis nas Respostas Admin (LOW — Seguranca) — DONE

**Problema:** As respostas dos endpoints admin incluem email, role e dados de subscription do usuario. Embora necessarios para o painel de suporte, em caso de comprometimento da conta admin, esses dados ficam expostos.

**Solucao recomendada:**
- Avaliar quais campos sao realmente necessarios por endpoint
- Remover campos nao essenciais das queries do GET messages
- Manter dados completos apenas na pagina de detalhes do ticket

**Prioridade:** Baixa
**Esforco:** ~1h

---

## Ordem de Implementacao Sugerida

1. **Rate Limiting** — Maior impacto em seguranca com menor esforco
2. **Deduplicacao de Mensagens** — Fix rapido de UX (30min)
3. **WebSocket/SSE** — Maior impacto em performance e experiencia
4. **Audit Log** — Importante para rastreabilidade
5. **Filtro de Conteudo IA** — Protecao adicional
6. **Reduzir Dados Sensiveis** — Hardening final
