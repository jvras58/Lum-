---
description: "Task list for Sistema de Gerenciamento de Alunos e Avaliações"
---

# Tasks: Sistema de Gerenciamento de Alunos e Avaliações

**Input**: Design documents from `specs/001-student-evaluation-system/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: Not explicitly requested — test tasks omitted. Add test tasks if TDD is desired.

**Organization**: Tasks grouped by user story to enable independent implementation and
delivery of each increment.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared state)
- **[Story]**: US1 = Grade de avaliações, US2 = Cadastros, US3 = Notificações, US4 = Monitor

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create the project skeleton and install all dependencies defined in plan.md.

- [x] T001 Initialize Next.js 16 project with TypeScript `strict: true`, App Router, and `src/` directory at repository root
- [x] T002 [P] Configure Docker Compose with PostgreSQL 16 service in `docker-compose.yml` (dev + test databases)
- [x] T003 [P] Install Drizzle ORM dependencies: `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg` in `package.json`
- [x] T004 [P] Initialize Shadcn UI with `npx shadcn@latest init`, configure theme in `src/app/globals.css`
- [x] T005 [P] Install TanStack Query v5: `@tanstack/react-query` and `@tanstack/react-query-devtools` in `package.json`
- [x] T006 [P] Install form dependencies: `react-hook-form`, `@hookform/resolvers`, `zod` in `package.json`
- [x] T007 Create `.env.example` with all required variables per `specs/001-student-evaluation-system/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story is started.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T008 Create `ActionResult<T>` discriminated union type and `ConceitoEnum` in `src/lib/types.ts`
- [x] T009 Create PostgreSQL singleton connection with `import "server-only"` in `src/db/index.ts` (module-level pool via `drizzle(pool)`)
- [x] T010 Create complete Drizzle schema with all 9 tables, unique indexes, check constraints, and inferred types in `src/db/schema.ts` (reference: `specs/001-student-evaluation-system/data-model.md`)
- [x] T011 Configure `drizzle-kit` in `drizzle/drizzle.config.ts`, run `pnpm drizzle-kit generate` to produce initial migration in `drizzle/migrations/`
- [x] T012 [P] Create Zod validation schemas for all entities in `src/lib/schemas/alunos.ts`, `src/lib/schemas/turmas.ts`, `src/lib/schemas/metas.ts`, and `src/lib/schemas/avaliacoes.ts` (including `saveBatchSchema`)
- [x] T013 Create root layout `src/app/layout.tsx` with `QueryClientProvider` (staleTime ≥ 60 000 ms default), root error boundary `src/app/error.tsx`, and `next/font` for web fonts
- [x] T014 [P] Create root `src/app/loading.tsx` with full-page skeleton using Shadcn `Skeleton` component
- [x] T015 [P] Add `pnpm` scripts to `package.json`: `dev`, `build`, `lint`, `db:migrate`, `db:seed`, `test:integration`, `test:components`

**Checkpoint**: Schema migrated, connection verified with `pnpm drizzle-kit check`. Foundation ready.

---

## Phase 3: User Story 1 — Lançar e Editar Avaliações em Grade (Priority: P1) 🎯 MVP

**Goal**: Professor acessa a grade de uma turma, edita conceitos célula a célula e salva
em lote de forma atômica, com histórico registrado automaticamente.

**Independent Test**: Seed turma + 2 alunos + 2 metas → abrir `/turmas/[id]/avaliacoes` →
editar 3 células → salvar → verificar `avaliacoes` e `avaliacoes_historico` no banco.

### Implementation for User Story 1

- [x] T016 [US1] Create `saveBatchAvaliacoes` Server Action in `src/actions/avaliacoes.ts`: validate input with `saveBatchSchema`, run `db.transaction()` that upserts `avaliacoes` and inserts `avaliacoes_historico` (with `processadoEmail: false`, `dataReferencia: today`) for each item, call `revalidatePath`, return `ActionResult<{ saved: number }>`
- [x] T017 [P] [US1] Add `assertAuthenticated()` placeholder function in `src/lib/auth.ts` (no-op for v1, called at top of every Server Action)
- [x] T018 [US1] Create `GradeEditorClient` component in `src/components/avaliacoes/GradeEditorClient.tsx`: `"use client"`, receives `initialData` (matriculas × metas × avaliacoes) as props, maintains `Map<cellKey, conceito>` in `useState`, renders table with Shadcn `Select` per cell (MANA/MPA/MA), dirty-state tracking, "Salvar" button calling `saveBatchAvaliacoes`, unsaved-changes navigation guard
- [x] T019 [US1] Create grade page RSC in `src/app/turmas/[id]/avaliacoes/page.tsx`: fetch turma, active `turmaMetas` (ordered), active `matriculas` with aluno, existing `avaliacoes` — pass all as props to `GradeEditorClient`
- [x] T020 [P] [US1] Create `src/app/turmas/[id]/avaliacoes/loading.tsx` skeleton matching the grade table layout using Shadcn `Skeleton`

**Checkpoint**: Grade renders with seeded data, batch save persists all changes atomically, rollback confirmed on simulated error.

---

## Phase 4: User Story 2 — Gerenciar Cadastros e Matrículas (Priority: P2)

**Goal**: Professor mantém cadastro completo de alunos, turmas, metas e controla matrículas
e associações de metas a turmas.

**Independent Test**: Create aluno → create turma → create meta → associate meta to turma →
matriculate aluno → verify aluno appears in `/turmas/[id]` and meta appears as column in grade.

### Alunos

- [x] T021 [P] [US2] Create `createAluno`, `updateAluno`, `deactivateAluno` Server Actions in `src/actions/alunos.ts` (CPF normalized to 11 digits, unique constraint mapped to user-friendly error)
- [x] T022 [P] [US2] Create `AlunoForm` client component in `src/components/alunos/AlunoForm.tsx`: `react-hook-form` + `alunoSchema` resolver, submit calls `createAluno`/`updateAluno`, disables submit while `isSubmitting`, shows field errors via `formState.errors`
- [x] T023 [P] [US2] ~~Create `AlunoTable` client component with `useQuery`~~ **[Arch Decision — see T056]** Replaced by RSC server-side filtering in `src/app/alunos/page.tsx` via `searchParams`; constitution §IV compliant (RSC pattern preferred over `useQuery` for initial page data)
- [x] T024 [US2] Create alunos list page RSC in `src/app/alunos/page.tsx`: fetch alunos with `ilike` filter from `searchParams.q`, render table with search form, add "Novo aluno" button linking to `/alunos/novo`
- [x] T025 [US2] Create aluno edit page RSC in `src/app/alunos/[id]/page.tsx`: fetch aluno by id, render `AlunoForm` pre-populated for edit

### Turmas

- [x] T026 [P] [US2] Create `createTurma`, `updateTurma`, `deactivateTurma` Server Actions in `src/actions/turmas.ts` (unique topico+ano+semestre constraint mapped to error)
- [x] T027 [P] [US2] Create `TurmaForm` client component in `src/components/turmas/TurmaForm.tsx`: `react-hook-form` + `turmaSchema`, semestre as `Select` (1 or 2)
- [x] T028 [US2] Create turmas list page RSC in `src/app/turmas/page.tsx`: fetch all turmas, render list with link to detail, "Nova turma" button
- [x] T029 [US2] Create turma detail page RSC in `src/app/turmas/[id]/page.tsx`: fetch turma, enrolled students (matriculas + aluno), assigned metas (turmaMetas + meta); render enrollment section and metas section with links to grade

### Metas e Associações

- [x] T030 [P] [US2] Create `createMeta`, `updateMeta`, `toggleMetaAtiva`, `reorderMetas` Server Actions in `src/actions/metas.ts`
- [x] T031 [P] [US2] Create `matricularAluno`, `desmatricularAluno`, `associarMetaTurma`, `desassociarMetaTurma` Server Actions in `src/actions/matriculas.ts` (block duplicate enrollment, preserve avaliacoes on desmatricula by setting status CANCELADA)
- [x] T032 [P] [US2] Create `TurmaMetasManager` client component in `src/components/turmas/TurmaMetasManager.tsx`: list available metas, associate/disassociate with turma, drag-and-drop order (or up/down buttons) calling `reorderMetas`
- [x] T033 [US2] Create metas list page RSC in `src/app/metas/page.tsx`: fetch all metas, toggle active/inactive, edit form in Dialog
- [x] T034 [US2] Update dashboard RSC in `src/app/page.tsx` with real Drizzle queries: total alunos ativos, total turmas ativas, total notificações pendentes

**Checkpoint**: Full CRUD flow works. Aluno can be enrolled in a class, meta associated to class, and grade loads the correct grid.

---

## Phase 5: User Story 3 — Notificação Diária de Alterações de Avaliação (Priority: P3)

**Goal**: Rotina consolidada gera no máximo um email por aluno por dia com todas as
alterações do dia em todas as turmas (idempotente, transacional).

**Independent Test**: After `saveBatchAvaliacoes` creates historico records, POST to
`/api/cron/consolidate-emails` → verify `email_resumos_diarios` + `email_resumo_itens`
created, `processadoEmail = true` on historico. Run again → verify no duplicates.

### Implementation for User Story 3

- [x] T035 [US3] Create `EmailProvider` interface and SMTP/Resend adapters in `src/lib/email.ts`: `send(to, subject, body)` method, selects adapter from `EMAIL_PROVIDER` env var, all secrets prefixed `SECRET_`
- [x] T036 [US3] Create `consolidarEmailsDiarios(dateRef: string)` in `src/lib/consolidacao.ts`: query `avaliacoes_historico` grouped by `alunoId`/`dataReferencia` where `processadoEmail = false`; for each group run `db.transaction()` → `insert(emailResumosDiarios).onConflictDoNothing().returning()` → if empty skip (idempotent) → else bulk insert `emailResumoItens` + update `processadoEmail = true`
- [x] T037 [US3] Create `enviarEmailsPendentes(dateRef: string)` in `src/lib/email.ts`: fetch `email_resumos_diarios` where `status = PENDENTE`, send via `EmailProvider`, update to `ENVIADO`/`ERRO` + increment `tentativas` + log `erroUltimoEnvio`
- [x] T038 [P] [US3] Create `cancelarResumo` Server Action in `src/actions/notificacoes.ts`: set status `CANCELADO` on a given `emailResumoDiario`
- [x] T039 [US3] Create cron Route Handler in `src/app/api/cron/consolidate-emails/route.ts`: validate `Authorization: Bearer $SECRET_CRON_TOKEN`, call `consolidarEmailsDiarios(date)` then `enviarEmailsPendentes(date)`, return `{ consolidated, sent, errors }`

**Checkpoint**: POST to cron endpoint generates resumo diário, links items, marks historico processed. Second POST same day = no new records.

---

## Phase 6: User Story 4 — Monitorar Fila de Notificações (Priority: P4)

**Goal**: Professor vê status da fila de emails diários com filtro por status e detalhe
de falhas.

**Independent Test**: With PENDENTE, ENVIADO, ERRO records in DB, `/notificacoes` renders
all three, filter by ERRO shows only error records with `erroUltimoEnvio` visible.

### Implementation for User Story 4

- [x] T040 [US4] Create notificacoes list page RSC in `src/app/notificacoes/page.tsx`: fetch initial `email_resumos_diarios` with aluno name joined, pass to `<Suspense>` wrapping `NotificacoesTable`
- [x] T041 [US4] Create `NotificacoesTable` client component in `src/components/notificacoes/NotificacoesTable.tsx`: `useQuery` with `staleTime: 15_000`, filter by status and `dataReferencia`, Shadcn `Table`, expandable row for `erroUltimoEnvio`, "Cancelar" action calling `cancelarResumo`

**Checkpoint**: Monitor shows correct status per email. Filtering by ERRO isolates failed sends.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Navigation, DX tooling, performance, and observability improvements.

- [x] T042 [P] Add navigation sidebar component to `src/app/layout.tsx` using Shadcn `NavigationMenu` with links to Dashboard, Alunos, Turmas, Metas, Notificações
- [x] T043 Add development seed script in `drizzle/seed.ts`: creates 3 turmas, 10 alunos, 5 metas, assigns metas to turmas, enrolls alunos; run via `pnpm db:seed`
- [x] T044 [P] Add structured JSON logging helper in `src/lib/logger.ts` and wire into all Server Actions (`{ action, duration, success }` at info level)
- [x] T045 [P] Add ESLint rule to prohibit `useEffect` with fetch deps: configure `no-restricted-syntax` in `.eslintrc`
- [ ] T046 Run `pnpm tsc --noEmit` + `pnpm lint` + `pnpm drizzle-kit check` and fix all errors to zero
- [ ] T047 Validate end-to-end happy path per `specs/001-student-evaluation-system/quickstart.md`: setup → seed → grade edit → batch save → cron trigger → verify email queue

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational — no dependency on US2/US3/US4
- **US2 (Phase 4)**: Depends on Foundational — independent of US1 (different files)
- **US3 (Phase 5)**: Depends on Foundational (schema) — independent of US1/US2 implementation (needs DB data to test)
- **US4 (Phase 6)**: Depends on US3 (requires email records to exist)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — test with seeded data, no CRUD UI needed
- **US2 (P2)**: Can start after Foundational — runs in parallel with US1 (different files)
- **US3 (P3)**: Can start after Foundational — test with seeded historico records
- **US4 (P4)**: Depends on US3 — requires email records to demonstrate monitor

### Within Each User Story

- Server Actions before Client Components (components call actions via import)
- Schema/Zod schemas before actions (actions import schemas)
- RSC page after client component (page wraps client component)
- All [P] tasks within a phase can run simultaneously

### Parallel Opportunities

```bash
# Phase 1 — all [P] tasks after T001:
T002 (docker-compose) || T003 (drizzle deps) || T004 (shadcn) || T005 (tanstack) || T006 (react-hook-form)

# Phase 2 — after T010 (schema):
T011 (migrations) || T012 (zod schemas) || T013 (layout) || T014 (skeleton) || T015 (package scripts)

# Phase 4 (US2) — all Server Actions and Client Components within same phase:
T021 (alunos actions) || T022 (AlunoForm) || T023 (AlunoTable)
T026 (turmas actions) || T027 (TurmaForm)
T030 (metas actions) || T031 (matriculas actions) || T032 (TurmaMetasManager)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 (grade + batch save + historico)
4. **STOP AND VALIDATE**: Seed data → edit grade → save → inspect DB → confirm historico records
5. Demo to stakeholder if ready

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Grade funcional com seed data → **MVP!**
3. Phase 4 (US2) → CRUD completo → grade pode ser testada sem seed manual
4. Phase 5 (US3) → Notificações funcionais
5. Phase 6 (US4) → Monitor operacional
6. Phase 7 → Sistema polish e pronto para produção

### Parallel Team Strategy

With multiple developers:
1. Team completes Phase 1 + 2 together
2. Developer A: US1 (grade editor — T016–T020)
3. Developer B: US2 (CRUD forms — T021–T034) — same DB, different component files
4. After A+B: Developer C: US3 (email consolidation — T035–T039)
5. US4 + Polish in sequence

---

## Notes

- `[P]` tasks = operate on different files, no cross-task state dependency
- Story labels map to spec.md user stories: US1=P1, US2=P2, US3=P3, US4=P4
- T016 (`saveBatchAvaliacoes`) is the architectural centerpiece — implement and review carefully
- T036 (`consolidarEmailsDiarios`) is the email idempotency guarantee — integration test recommended
- All Server Actions must import `assertAuthenticated` from `src/lib/auth.ts` (T017) even though it's a no-op in v1
- Shadcn components needed: `Button`, `Dialog`, `Form`, `Input`, `Select`, `Table`, `Skeleton`, `Badge`, `NavigationMenu`, `Tooltip`

---

## Phase 8: Spec Remediation (Post-Analysis Fixes)

**Purpose**: Address CRITICAL and HIGH issues found by `/speckit.analyze`. Required for constitution compliance.

### C1 — Integration & Component Tests (Constitution MUST)

- [x] T048 [P] Create `vitest.config.ts` (jsdom, component tests) and `vitest.integration.config.ts` (node, integration tests with TEST_DATABASE_URL env override) in repo root; create `tests/mocks/server-only.ts` empty mock; update `package.json` test scripts to use explicit config files
- [x] T049 Create `tests/integration/setup.ts` with `beforeAll` DB connection check and `afterEach` FK-ordered table cleanup; create `tests/integration/helpers.ts` with `seedAluno`, `seedTurma`, `seedMeta`, `seedTurmaMeta`, `seedMatricula` helpers
- [x] T050 [P] Write integration tests for `saveBatchAvaliacoes` in `tests/integration/actions/avaliacoes.test.ts`: persist + historico, conceitoAnterior tracking, atomicity/rollback, multi-cell batch
- [x] T051 [P] Write integration tests for `consolidarEmailsDiarios` in `tests/integration/actions/consolidacao.test.ts`: single email creation, idempotency, multi-turma consolidation, processadoEmail flag, per-aluno separation
- [x] T052 [P] Create `tests/components/setup.ts` with `@testing-library/jest-dom` import; write component tests for `AlunoForm` in `tests/components/AlunoForm.test.tsx`: field rendering, CPF validation, server action mock, error display, onSuccess callback
- [x] T053 [P] Write component tests for `GradeEditorClient` in `tests/components/GradeEditorClient.test.tsx`: empty state, grade rendering, dirty state tracking, save action call, error toast + state preservation

### E1 — Turmas Filter (FR-015 gap)

- [x] T054 Add `searchParams: Promise<{ q?: string }>` to `src/app/turmas/page.tsx`; add `ilike(turmas.topico, '%q%')` filter and search form with Input + Buscar/Limpar buttons, matching the pattern in `src/app/alunos/page.tsx`

### E2 — Meta Reorder UI (FR-005 gap)

- [x] T055 Add optimistic up/down reorder buttons (ChevronUp/ChevronDown) to `src/components/turmas/TurmaMetasManager.tsx` using `useState` for local order; call `reorderMetas` from `@/actions/metas`; fix `reorderMetas` WHERE clause to filter by both `turmaId` AND `metaId` (was filtering by `metaId` only — bug affecting multi-turma setups)

### U1 — AlunoTable Architecture Decision

- [x] T056 [Arch Decision] Accept RSC approach for alunos listing: `src/app/alunos/page.tsx` implements server-side filtering via `searchParams` with `ilike` — no `AlunoTable.tsx` client component created. This is constitution §IV compliant (RSC with `async/await` preferred for initial page data). T023 updated with this note.

**Checkpoint**: `pnpm tsc --noEmit` passes. `pnpm test:components` passes. `pnpm test:integration` passes against local PostgreSQL (requires `TEST_DATABASE_URL` pointing to `lum_test` database).
