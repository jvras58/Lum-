# Server Action Contracts

**Branch**: `001-student-evaluation-system` | **Date**: 2026-04-19

All Server Actions live in `src/actions/` and follow this convention:
- `"use server"` at file top
- `import "server-only"` to prevent browser bundle inclusion
- Return type: `ActionResult<T>` = `{ success: true; data: T } | { success: false; error: string }`
- Call `revalidatePath(...)` on success
- Log `{ action, duration, success }` at `info` level

```typescript
// src/lib/types.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

---

## Alunos (`src/actions/alunos.ts`)

| Action | Input | Returns | Revalidates |
|--------|-------|---------|-------------|
| `createAluno(input)` | `{ nome, cpf, email }` | `ActionResult<Aluno>` | `/alunos` |
| `updateAluno(id, input)` | `bigint, { nome?, email? }` | `ActionResult<Aluno>` | `/alunos`, `/alunos/[id]` |
| `deactivateAluno(id)` | `bigint` | `ActionResult<void>` | `/alunos` |

**Constraints**: CPF é normalizado (remove non-digits) antes de persistir. `deactivateAluno`
define `ativo = false`; exclusão física é bloqueada se houver matrículas.

---

## Turmas (`src/actions/turmas.ts`)

| Action | Input | Returns | Revalidates |
|--------|-------|---------|-------------|
| `createTurma(input)` | `{ topico, ano, semestre, descricao? }` | `ActionResult<Turma>` | `/turmas` |
| `updateTurma(id, input)` | `bigint, Partial<TurmaInput>` | `ActionResult<Turma>` | `/turmas`, `/turmas/[id]` |
| `deactivateTurma(id)` | `bigint` | `ActionResult<void>` | `/turmas` |

---

## Metas (`src/actions/metas.ts`)

| Action | Input | Returns | Revalidates |
|--------|-------|---------|-------------|
| `createMeta(input)` | `{ codigo, nome, descricao? }` | `ActionResult<Meta>` | `/metas` |
| `updateMeta(id, input)` | `bigint, Partial<MetaInput>` | `ActionResult<Meta>` | `/metas` |
| `toggleMetaAtiva(id)` | `bigint` | `ActionResult<Meta>` | `/metas` |
| `reorderMetas(turmaId, order)` | `bigint, bigint[]` | `ActionResult<void>` | `/turmas/[id]` |

---

## Matrículas (`src/actions/matriculas.ts`)

| Action | Input | Returns | Revalidates |
|--------|-------|---------|-------------|
| `matricularAluno(turmaId, alunoId)` | `bigint, bigint` | `ActionResult<Matricula>` | `/turmas/[id]` |
| `desmatricularAluno(matriculaId)` | `bigint` | `ActionResult<void>` | `/turmas/[id]` |
| `associarMetaTurma(turmaId, metaId, ordem)` | `bigint, bigint, number` | `ActionResult<TurmaMeta>` | `/turmas/[id]` |
| `desassociarMetaTurma(turmaMetaId)` | `bigint` | `ActionResult<void>` | `/turmas/[id]` |

**Constraints**: `matricularAluno` verifica unicidade antes de inserir (fallback além
da constraint do banco). `desmatricularAluno` verifica que não existem avaliações
pendentes — se existirem, define status `CANCELADA` e preserva os dados.

---

## Avaliações (`src/actions/avaliacoes.ts`)

### `saveBatchAvaliacoes`

```typescript
export async function saveBatchAvaliacoes(
  turmaId: bigint,
  items: Array<{
    matriculaId: bigint
    turmaMetaId: bigint
    conceito:    "MANA" | "MPA" | "MA"
  }>
): Promise<ActionResult<{ saved: number }>>
```

**Behavior** (all inside `db.transaction()`):
1. Validate `items` length ≥ 1 and ≤ 500.
2. Verify all `matriculaId` values belong to `turmaId` with status `ATIVA`.
3. Verify all `turmaMetaId` values belong to `turmaId` with `ativa = true`.
4. For each item:
   a. Fetch current `conceito` from `avaliacoes` (null if first time).
   b. Upsert into `avaliacoes` (insert or update `conceito`, `ultimaAlteracaoEm`, `updatedAt`).
   c. Insert into `avaliacoes_historico` with:
      - `conceitoAnterior` = previous value (or null)
      - `conceitoNovo` = new value
      - `dataReferencia` = `CURRENT_DATE`
      - `processadoEmail` = false
5. Return `{ success: true, data: { saved: items.length } }`.
6. Call `revalidatePath(\`/turmas/${turmaId}/avaliacoes\`)`.

**Error cases**:
- Invalid `conceito` value → Zod parse error, `{ success: false, error: "..." }`
- Matrícula not active in turma → `{ success: false, error: "Matrícula inativa: ..." }`
- DB constraint violation (unique, FK) → caught, mapped to human-readable error
- Any DB error inside transaction → automatic rollback, `{ success: false, error: "..." }`

---

## Notificações (`src/actions/notificacoes.ts`)

| Action | Input | Returns | Revalidates |
|--------|-------|---------|-------------|
| `cancelarResumo(resumoId)` | `bigint` | `ActionResult<void>` | `/notificacoes` |

Read operations (listing, filters) use `useQuery` pointing to RSC page params —
no Server Actions needed for reads.

---

## Cron API Route (`src/app/api/cron/consolidate-emails/route.ts`)

```typescript
// Method: POST
// Auth: Authorization: Bearer $SECRET_CRON_TOKEN
// Body: { date?: string }  // ISO date; defaults to today

// Response 200: { consolidated: number, skipped: number }
// Response 401: { error: "Unauthorized" }
// Response 500: { error: string }
```

This route calls `consolidarEmailsDiarios(date)` from `src/lib/consolidacao.ts`
and `enviarEmailsPendentes(date)` from `src/lib/email.ts`.
It is **not** a Server Action — it is an HTTP Route Handler for external cron callers.
