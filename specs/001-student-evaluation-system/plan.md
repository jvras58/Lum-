# Implementation Plan: Sistema de Gerenciamento de Alunos e Avaliações

**Branch**: `001-student-evaluation-system` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-student-evaluation-system/spec.md`

## Summary

Sistema full-stack de gerenciamento de alunos, turmas e avaliações com grade interativa
de conceitos (MANA/MPA/MA), salvamento em lote atômico via Server Actions + Drizzle
transactions, histórico de auditoria e consolidação diária idempotente de emails.
Stack: Next.js 16 (App Router), React 19, Drizzle ORM + PostgreSQL, TanStack Query,
react-hook-form + Zod, Shadcn UI.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict: true`) + Next.js 16
**Primary Dependencies**: Drizzle ORM, TanStack Query v5, react-hook-form, Zod, Shadcn UI
**Storage**: PostgreSQL 16 (via Drizzle ORM — singleton pool, `server-only`)
**Testing**: Vitest + @testing-library/react + real PostgreSQL test DB (no DB mocks)
**Target Platform**: Web (desktop-first, App Router, server-rendered)
**Project Type**: Full-stack web application (Next.js monolith)
**Performance Goals**: TTFB p95 ≤ 200 ms; LCP ≤ 2.5 s; JS bundle ≤ 150 kB/route
**Constraints**: No useEffect for data fetch; no Pages Router; strict TypeScript; Server Actions for all mutations
**Scale/Scope**: ~10k records/entity; desktop only; single authenticated professor role

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify the following gates against `.specify/memory/constitution.md` (v1.0.0):

- [x] **I. App Router** — All pages use App Router; no Pages Router files introduced.
- [x] **II. Server Actions** — All mutations use `"use server"` functions; no internal API routes for writes.
      Exception: `/api/cron/consolidate-emails` is a Route Handler for external cron trigger (not a browser client call) — justified.
- [x] **III. Drizzle ORM** — Schema in `src/db/schema.ts`; migrations via `drizzle-kit`; `import "server-only"` on DB modules.
- [x] **IV. No useEffect fetch** — Initial data via RSC; reactive filters via `useQuery`; grade initialized from RSC props.
- [x] **V. Forms** — All forms use `react-hook-form` + Zod resolver + Server Action submission.
- [x] **VI. Shadcn UI** — No competing UI libraries; all primitives via `npx shadcn@latest add`.
- [x] **TypeScript strict** — `strict: true`; `any` prohibited without `// eslint-disable` + justification.
- [x] **Security** — `assertAuthenticated()` placeholder in all Server Actions; secrets prefixed `SECRET_`; no DB imports in Client Components.

**Post-design re-check**: ✅ All gates pass. Cron Route Handler exception is documented above.

## Project Structure

### Documentation (this feature)

```text
specs/001-student-evaluation-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (Drizzle schema + query patterns)
├── quickstart.md        # Phase 1 output (setup + dev workflow)
├── contracts/
│   └── server-actions.md  # Phase 1 output (all Server Action signatures)
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                # Root layout (QueryClientProvider, error boundary)
│   ├── page.tsx                  # Dashboard — RSC, totais operacionais
│   ├── loading.tsx               # Root skeleton UI
│   ├── error.tsx                 # Root error boundary (client)
│   ├── alunos/
│   │   ├── page.tsx              # Listagem paginada + filtros (RSC inicial + useQuery)
│   │   └── [id]/page.tsx         # Edição (RSC + react-hook-form Server Action)
│   ├── turmas/
│   │   ├── page.tsx              # Listagem turmas (RSC)
│   │   └── [id]/
│   │       ├── page.tsx          # Detalhe: matrículas + metas (RSC)
│   │       └── avaliacoes/
│   │           └── page.tsx      # Grade de avaliações (RSC → GradeEditorClient)
│   ├── metas/
│   │   └── page.tsx              # Catálogo de metas (RSC)
│   ├── notificacoes/
│   │   └── page.tsx              # Monitor de envios (RSC + useQuery)
│   └── api/
│       └── cron/
│           └── consolidate-emails/
│               └── route.ts      # POST — cron trigger (Route Handler)
│
├── actions/                      # Server Actions ("use server" + "server-only")
│   ├── alunos.ts                 # createAluno, updateAluno, deactivateAluno
│   ├── turmas.ts                 # createTurma, updateTurma, deactivateTurma
│   ├── metas.ts                  # createMeta, updateMeta, toggleMetaAtiva, reorderMetas
│   ├── matriculas.ts             # matricularAluno, desmatricularAluno, associarMetaTurma, desassociarMetaTurma
│   ├── avaliacoes.ts             # saveBatchAvaliacoes (critical path)
│   └── notificacoes.ts           # cancelarResumo
│
├── components/
│   ├── ui/                       # Shadcn primitives (owned copies)
│   ├── alunos/
│   │   ├── AlunoForm.tsx         # "use client" — react-hook-form + createAluno/updateAluno
│   │   └── AlunoTable.tsx        # "use client" — useQuery, filtros reativos
│   ├── turmas/
│   │   ├── TurmaForm.tsx         # "use client"
│   │   └── TurmaMetasManager.tsx # "use client" — associar/reordenar metas
│   ├── avaliacoes/
│   │   └── GradeEditorClient.tsx # "use client" — grade interativa, saveBatchAvaliacoes
│   └── notificacoes/
│       └── NotificacoesTable.tsx # "use client" — useQuery + filtro por status
│
├── db/
│   ├── index.ts                  # Singleton db = drizzle(pool) — server-only
│   └── schema.ts                 # 9 tabelas Drizzle + tipos inferidos
│
├── lib/
│   ├── consolidacao.ts           # consolidarEmailsDiarios(date) — server-only
│   ├── email.ts                  # EmailProvider abstraction — server-only
│   ├── schemas/                  # Zod schemas (isomorphic, safe for both server+client)
│   │   ├── alunos.ts
│   │   ├── turmas.ts
│   │   ├── metas.ts
│   │   └── avaliacoes.ts         # saveBatchSchema + conceitoEnum
│   └── types.ts                  # ActionResult<T>, ConceitorEnum
│
└── drizzle/
    ├── drizzle.config.ts
    └── migrations/               # drizzle-kit generated SQL files

tests/
├── integration/
│   ├── actions/
│   │   ├── avaliacoes.test.ts    # saveBatchAvaliacoes — transação, histórico, rollback
│   │   └── consolidacao.test.ts  # idempotência, multi-turma, status ENVIADO/ERRO
│   └── setup.ts                  # beforeAll: migrate; afterEach: rollback transaction
└── components/
    ├── GradeEditorClient.test.tsx # edição de células, dirty state, submit
    └── AlunoForm.test.tsx         # validação CPF, submit via Server Action mock
```

**Structure Decision**: Single Next.js monolith (App Router). No separate backend
process. All server logic in Server Actions + Route Handler for cron. Database access
exclusively in `src/db/` and `src/actions/` (server-only boundary enforced).

---

## Critical Path: Email Consolidation (User Focus)

### How Server Actions interact with Drizzle ORM to fulfill daily email consolidation

#### Step 1 — Mutation trigger (`saveBatchAvaliacoes`)

```
[GradeEditorClient] ──form.handleSubmit──► saveBatchAvaliacoes(turmaId, items)
                                               │
                                    db.transaction(async tx => {
                                      for each item:
                                        ① fetch existing conceito (tx.query)
                                        ② tx.insert(avaliacoes).onConflictDoUpdate(...)
                                        ③ tx.insert(avaliacoesHistorico, {
                                              processadoEmail: false,
                                              dataReferencia: today
                                           })
                                    })
                                               │
                                    revalidatePath(`/turmas/${id}/avaliacoes`)
                                               │
                                    return { success: true, data: { saved: N } }
```

Every save writes to `avaliacoes_historico` with `processado_email = false`, which
becomes the queue for the consolidation process.

#### Step 2 — Consolidation (`consolidarEmailsDiarios`)

```
[External cron] ──POST /api/cron/consolidate-emails──► route.ts
                                                            │
                                               consolidarEmailsDiarios(date)
                                                            │
                  ① SELECT DISTINCT aluno_id FROM avaliacoes_historico
                      WHERE data_referencia = :date AND processado_email = false
                            │
                  For each aluno_id:
                  ② db.transaction(async tx => {
                       a. tx.insert(emailResumosDiarios)
                            .onConflictDoNothing()  ◄── idempotency gate
                            .returning()
                       b. if returning is empty → SKIP (already processed)
                       c. else:
                          - tx.select from avaliacoes_historico (items for this aluno/date)
                          - tx.insert(emailResumoItens) bulk
                          - tx.update(avaliacoesHistorico)
                              .set({ processadoEmail: true })
                     })
```

#### Step 3 — Email dispatch (`enviarEmailsPendentes`)

```
[Same cron invocation, after consolidation]
  ① SELECT * FROM email_resumos_diarios WHERE status = 'PENDENTE'
  For each resumo:
  ② EmailProvider.send(aluno.email, resumo.assunto, resumo.corpo)
     ③ On success: UPDATE status = 'ENVIADO', enviado_em = now()
     ④ On failure: UPDATE status = 'ERRO', tentativas++, erro_ultimo_envio = message
```

**Idempotency guarantee**: The `UNIQUE (aluno_id, data_referencia)` constraint on
`email_resumos_diarios` + Drizzle's `.onConflictDoNothing()` ensure that re-running
the cron for the same date produces zero duplicate emails, even under concurrent
execution.

---

## Complexity Tracking

> No constitution violations. No additional justification required.

---

## Phase 0 Research Summary

See [research.md](./research.md) for full decisions. Key resolved points:

| Topic | Decision |
|-------|----------|
| Grade rendering | RSC props → GradeEditorClient (no useEffect) |
| Batch save | Single `db.transaction()` with upsert + historico insert |
| Email idempotency | `onConflictDoNothing` + `processado_email` flag |
| Cron trigger | Route Handler (not Server Action) — external caller |
| Email provider | Resend SDK — único provedor oficial (`RESEND_API_KEY`) |
| Auth | Placeholder `assertAuthenticated()` — out of scope for v1 |
| Filters/search | TanStack Query + `ilike` Drizzle queries |
| Integration tests | Vitest + real PostgreSQL + rollback per test |

## Phase 1 Design Artifacts

- [data-model.md](./data-model.md) — Drizzle schema, Zod schemas, query patterns
- [contracts/server-actions.md](./contracts/server-actions.md) — all Server Action signatures + cron route
- [quickstart.md](./quickstart.md) — setup, dev workflow, environment variables
