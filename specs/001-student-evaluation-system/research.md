# Research: Sistema de Gerenciamento de Alunos e Avaliações

**Branch**: `001-student-evaluation-system` | **Date**: 2026-04-19

---

## 1. Grade de avaliações: rendering e interatividade

**Decision**: Server Component para carga inicial + Client Component isolado para edição interativa

**Rationale**: A grade precisa ser SSR para SEO/performance (TTFB ≤ 200ms), mas
requer estado local durante a edição. O padrão correto em Next.js 16 / React 19 é:
- `GradePageRSC` (Server Component) busca `turma`, `metas`, `matrículas` e
  `avaliacões` atuais via `await db.query.*` e passa como props.
- `GradeEditorClient` (`"use client"`) recebe os dados via props, mantém um mapa
  de mudanças `Map<cellKey, conceito>` em `useState`, e submete via Server Action.
- Nenhum `useEffect` é necessário porque os dados chegam como props do servidor.

**Alternatives considered**:
- Route Handler + useQuery: adiciona latência de round-trip desnecessária para dados
  iniciais; RSC é estritamente mais eficiente aqui.
- Full Client + useQuery: viola o Princípio IV da constituição para carga inicial.

---

## 2. Salvamento em lote atômico (Server Action + Drizzle transaction)

**Decision**: Single `db.transaction(async tx => { ... })` dentro de Server Action

**Rationale**: Drizzle expõe `db.transaction()` que mapeia diretamente para
`BEGIN/COMMIT/ROLLBACK`. Dentro da transação:
1. Para cada célula alterada: buscar conceito atual (para `conceito_anterior`).
2. `upsert` na tabela `avaliacoes` via `.onConflictDoUpdate`.
3. `insert` em `avaliacoes_historico` com `processado_email = false` e
   `data_referencia = CURRENT_DATE`.
4. Se qualquer operação falhar, o Drizzle faz rollback automático — nenhuma mudança
   parcial persiste (SC-002).

**Key insight**: O `upsert` resolve tanto criação quanto atualização de conceito sem
lógica condicional no código da aplicação. Drizzle gera:
```sql
INSERT INTO avaliacoes ... ON CONFLICT (matricula_id, turma_meta_id)
DO UPDATE SET conceito = EXCLUDED.conceito, updated_at = now()
```

**Alternatives considered**:
- Operações individuais fora de transação: viola RNF03 e SC-002.
- `Promise.all` paralelo dentro da transação: Drizzle não suporta paralelismo dentro
  de uma única transação PostgreSQL (conexão única).

---

## 3. Consolidação de emails: idempotência via constraint de banco

**Decision**: `INSERT ... ON CONFLICT DO NOTHING` + flag `processado_email` no histórico

**Rationale**: A regra RN10 ("no máximo um resumo diário por aluno/data") é garantida
em dois níveis:
1. **Banco de dados**: `UNIQUE (aluno_id, data_referencia)` em `email_resumos_diarios`
   faz o banco rejeitar duplicatas mesmo sob concorrência.
2. **Aplicação**: `onConflictDoNothing()` do Drizzle retorna `[]` quando a linha já
   existe, fazendo o código pular o processamento silenciosamente.
3. **Flag de processamento**: `processado_email = true` em `avaliacoes_historico`
   garante que re-execuções não reprocessem itens já incluídos em resumos.

**Consolidation algorithm** (order of operations inside a transaction):
```
1. SELECT aluno_id, data_referencia FROM avaliacoes_historico
   WHERE processado_email = false AND data_referencia = :date
   GROUP BY aluno_id, data_referencia

2. For each (aluno_id, data_referencia) group:
   a. INSERT INTO email_resumos_diarios ... ON CONFLICT DO NOTHING RETURNING id
   b. If returning is empty → already processed, skip
   c. Else: INSERT INTO email_resumo_itens (one row per historico item)
   d. UPDATE avaliacoes_historico SET processado_email = true WHERE aluno_id = ... AND data_referencia = ...
```

**Alternatives considered**:
- Application-level `SELECT` before `INSERT`: subject to race condition under
  concurrent cron executions; DB constraint is the safe guard.
- Separate transaction per aluno: acceptable but one outer transaction + savepoints
  is more efficient.

---

## 4. Trigger da rotina de consolidação

**Decision**: Next.js Route Handler (`/api/cron/consolidate-emails/route.ts`) protegido
por `CRON_SECRET` header, chamado por cron externo (Vercel Cron, GitHub Actions, etc.)

**Rationale**: A consolidação é disparada por processo externo (não é uma mutação de
usuário), então um Route Handler é a peça correta — não viola o Princípio II porque
não é uma chamada de cliente browser. A função de consolidação em si vive em
`src/lib/consolidacao.ts` (servidor-only) e pode ser testada independentemente do
HTTP handler.

**Security**: O header `Authorization: Bearer $CRON_SECRET` previne chamadas não
autorizadas. O secret é armazenado como `SECRET_CRON_TOKEN` (prefixo `SECRET_`
conforme constituição).

**Alternatives considered**:
- Server Action chamada por UI: não faz sentido — consolidação não é iniciada por
  usuário.
- Next.js built-in cron (Vercel Cron Jobs via `vercel.json`): válido para deploy na
  Vercel; o Route Handler suporta ambos os casos.

---

## 5. Envio de email: abstração sobre provedor

**Decision**: Módulo `src/lib/email.ts` com interface `EmailProvider` abstraindo Nodemailer
(SMTP) ou Resend/SendGrid (API) conforme variável de ambiente `EMAIL_PROVIDER`

**Rationale**: O escopo cobre apenas geração, enfileiramento e rastreamento (spec
assumption). A abstração permite trocar o provedor sem alterar a lógica de
consolidação. O módulo é `server-only`.

---

## 6. Autenticação

**Decision**: Fora do escopo desta versão (spec assumption confirmada)

**Rationale**: A spec assume um único Professor autenticado. A constituição exige
validação de sessão em Server Actions, então uma verificação de placeholder
`assertAuthenticated()` deve ser inserida em todas as actions como
forward-compatibility hook — sem lógica real de autenticação nesta versão.

---

## 7. Filtros e busca

**Decision**: `useQuery` (TanStack Query) com query string params para filtros client-side;
busca full-text simples via `ilike` do Drizzle no servidor

**Rationale**: Filtros precisam ser reativos (usuário digita → resultado atualiza)
sem recarregar a página. `useQuery` + URL search params (via `useSearchParams`) é o
padrão correto: RSC renderiza o estado inicial, `useQuery` refaz a busca
client-side após mudança de filtro. `staleTime: 30_000` para listas.

---

## 8. Testes de integração para Server Actions

**Decision**: Vitest + PostgreSQL de teste via `docker-compose.test.yml`; cada teste usa
transação rollback após execução

**Rationale**: A constituição proíbe mocks do DB em testes de Server Actions. O padrão
de "transação por teste" (usar `db.transaction` no setup e fazer rollback no teardown)
garante isolamento sem custo de recriação de schema. Biblioteca `@testcontainers/postgresql`
é alternativa para CI sem Docker Compose.
