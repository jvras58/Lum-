# Data Model: Sistema de Gerenciamento de Alunos e Avaliações

**Branch**: `001-student-evaluation-system` | **Date**: 2026-04-19

---

## Entity Relationship Overview

```
alunos ──────────────────── matriculas ─────────────────── turmas
  │                              │                            │
  │ (1:N)                        │ (1:N)               (1:N) │
  │                         avaliacoes                turma_metas
  │                              │                       │
  │                              └── avaliacoes_historico │ (N:1)
  │                                        │            metas
  │                                        │
  └── email_resumos_diarios ── email_resumo_itens
```

---

## Drizzle Schema (`src/db/schema.ts`)

```typescript
import "server-only"
import {
  pgTable, bigserial, varchar, char, boolean, smallint,
  timestamp, date, text, uniqueIndex, index, check,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ─── alunos ──────────────────────────────────────────────────────────────────

export const alunos = pgTable(
  "alunos",
  {
    id:        bigserial("id", { mode: "bigint" }).primaryKey(),
    nome:      varchar("nome", { length: 150 }).notNull(),
    cpf:       char("cpf", { length: 11 }).notNull(),
    email:     varchar("email", { length: 255 }).notNull(),
    ativo:     boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_alunos_cpf").on(t.cpf),
    uniqueIndex("uq_alunos_email").on(t.email),
    check("ck_alunos_cpf_formato", sql`char_length(${t.cpf}) = 11`),
  ]
)

export type Aluno    = typeof alunos.$inferSelect
export type NewAluno = typeof alunos.$inferInsert

// ─── turmas ──────────────────────────────────────────────────────────────────

export const turmas = pgTable(
  "turmas",
  {
    id:        bigserial("id", { mode: "bigint" }).primaryKey(),
    topico:    varchar("topico", { length: 150 }).notNull(),
    descricao: varchar("descricao", { length: 500 }),
    ano:       smallint("ano").notNull(),
    semestre:  smallint("semestre").notNull(),
    ativa:     boolean("ativa").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_turmas_topico_periodo").on(t.topico, t.ano, t.semestre),
    index("ix_turmas_periodo").on(t.ano, t.semestre),
    check("ck_turmas_ano", sql`${t.ano} between 2000 and 2100`),
    check("ck_turmas_semestre", sql`${t.semestre} in (1, 2)`),
  ]
)

export type Turma    = typeof turmas.$inferSelect
export type NewTurma = typeof turmas.$inferInsert

// ─── metas ───────────────────────────────────────────────────────────────────

export const metas = pgTable(
  "metas",
  {
    id:        bigserial("id", { mode: "bigint" }).primaryKey(),
    codigo:    varchar("codigo", { length: 30 }).notNull(),
    nome:      varchar("nome", { length: 100 }).notNull(),
    descricao: varchar("descricao", { length: 500 }),
    ativa:     boolean("ativa").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_metas_codigo").on(t.codigo),
    uniqueIndex("uq_metas_nome").on(t.nome),
  ]
)

export type Meta    = typeof metas.$inferSelect
export type NewMeta = typeof metas.$inferInsert

// ─── turma_metas ─────────────────────────────────────────────────────────────

export const turmaMetas = pgTable(
  "turma_metas",
  {
    id:             bigserial("id", { mode: "bigint" }).primaryKey(),
    turmaId:        bigserial("turma_id", { mode: "bigint" }).notNull().references(() => turmas.id),
    metaId:         bigserial("meta_id", { mode: "bigint" }).notNull().references(() => metas.id),
    ordemExibicao:  smallint("ordem_exibicao").notNull().default(1),
    ativa:          boolean("ativa").notNull().default(true),
    createdAt:      timestamp("created_at").notNull().defaultNow(),
    updatedAt:      timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_turma_metas_turma_meta").on(t.turmaId, t.metaId),
    index("ix_turma_metas_turma_ordem").on(t.turmaId, t.ordemExibicao),
    check("ck_turma_metas_ordem", sql`${t.ordemExibicao} > 0`),
  ]
)

export type TurmaMeta    = typeof turmaMetas.$inferSelect
export type NewTurmaMeta = typeof turmaMetas.$inferInsert

// ─── matriculas ──────────────────────────────────────────────────────────────

export const matriculas = pgTable(
  "matriculas",
  {
    id:               bigserial("id", { mode: "bigint" }).primaryKey(),
    turmaId:          bigserial("turma_id", { mode: "bigint" }).notNull().references(() => turmas.id),
    alunoId:          bigserial("aluno_id", { mode: "bigint" }).notNull().references(() => alunos.id),
    status:           varchar("status", { length: 20 }).notNull().default("ATIVA"),
    matriculadoEm:    timestamp("matriculado_em").notNull().defaultNow(),
    desmatriculadoEm: timestamp("desmatriculado_em"),
    observacao:       varchar("observacao", { length: 500 }),
    createdAt:        timestamp("created_at").notNull().defaultNow(),
    updatedAt:        timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_matriculas_turma_aluno").on(t.turmaId, t.alunoId),
    index("ix_matriculas_aluno").on(t.alunoId),
    index("ix_matriculas_turma_status").on(t.turmaId, t.status),
    check("ck_matriculas_status", sql`${t.status} in ('ATIVA', 'CANCELADA', 'CONCLUIDA')`),
  ]
)

export type Matricula    = typeof matriculas.$inferSelect
export type NewMatricula = typeof matriculas.$inferInsert

// ─── avaliacoes ──────────────────────────────────────────────────────────────

export const avaliacoes = pgTable(
  "avaliacoes",
  {
    id:               bigserial("id", { mode: "bigint" }).primaryKey(),
    turmaId:          bigserial("turma_id", { mode: "bigint" }).notNull().references(() => turmas.id),
    alunoId:          bigserial("aluno_id", { mode: "bigint" }).notNull().references(() => alunos.id),
    matriculaId:      bigserial("matricula_id", { mode: "bigint" }).notNull().references(() => matriculas.id),
    turmaMetaId:      bigserial("turma_meta_id", { mode: "bigint" }).notNull().references(() => turmaMetas.id),
    conceito:         varchar("conceito", { length: 4 }).notNull(),
    observacao:       varchar("observacao", { length: 500 }),
    ultimaAlteracaoEm: timestamp("ultima_alteracao_em").notNull().defaultNow(),
    createdAt:        timestamp("created_at").notNull().defaultNow(),
    updatedAt:        timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_avaliacoes_matricula_meta").on(t.matriculaId, t.turmaMetaId),
    index("ix_avaliacoes_turma_aluno").on(t.turmaId, t.alunoId),
    index("ix_avaliacoes_turma_meta").on(t.turmaMetaId),
    check("ck_avaliacoes_conceito", sql`${t.conceito} in ('MANA', 'MPA', 'MA')`),
  ]
)

export type Avaliacao    = typeof avaliacoes.$inferSelect
export type NewAvaliacao = typeof avaliacoes.$inferInsert

// ─── avaliacoes_historico ────────────────────────────────────────────────────

export const avaliacoesHistorico = pgTable(
  "avaliacoes_historico",
  {
    id:               bigserial("id", { mode: "bigint" }).primaryKey(),
    avaliacaoId:      bigserial("avaliacao_id", { mode: "bigint" }).notNull().references(() => avaliacoes.id),
    alunoId:          bigserial("aluno_id", { mode: "bigint" }).notNull().references(() => alunos.id),
    turmaId:          bigserial("turma_id", { mode: "bigint" }).notNull().references(() => turmas.id),
    metaId:           bigserial("meta_id", { mode: "bigint" }).notNull().references(() => metas.id),
    conceitoAnterior: varchar("conceito_anterior", { length: 4 }),
    conceitoNovo:     varchar("conceito_novo", { length: 4 }).notNull(),
    alteradoEm:       timestamp("alterado_em").notNull().defaultNow(),
    dataReferencia:   date("data_referencia").notNull(),
    processadoEmail:  boolean("processado_email").notNull().default(false),
    createdAt:        timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ix_historico_aluno_data").on(t.alunoId, t.dataReferencia, t.processadoEmail),
    index("ix_historico_turma_data").on(t.turmaId, t.dataReferencia),
    check("ck_historico_conceito_anterior", sql`${t.conceitoAnterior} is null or ${t.conceitoAnterior} in ('MANA', 'MPA', 'MA')`),
    check("ck_historico_conceito_novo", sql`${t.conceitoNovo} in ('MANA', 'MPA', 'MA')`),
  ]
)

export type AvaliacaoHistorico    = typeof avaliacoesHistorico.$inferSelect
export type NewAvaliacaoHistorico = typeof avaliacoesHistorico.$inferInsert

// ─── email_resumos_diarios ───────────────────────────────────────────────────

export const emailResumosDiarios = pgTable(
  "email_resumos_diarios",
  {
    id:               bigserial("id", { mode: "bigint" }).primaryKey(),
    alunoId:          bigserial("aluno_id", { mode: "bigint" }).notNull().references(() => alunos.id),
    dataReferencia:   date("data_referencia").notNull(),
    status:           varchar("status", { length: 20 }).notNull().default("PENDENTE"),
    assunto:          varchar("assunto", { length: 255 }).notNull(),
    corpo:            text("corpo").notNull(),
    tentativas:       smallint("tentativas").notNull().default(0),
    geradoEm:         timestamp("gerado_em").notNull().defaultNow(),
    enviadoEm:        timestamp("enviado_em"),
    erroUltimoEnvio:  text("erro_ultimo_envio"),
    createdAt:        timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_email_resumos_aluno_data").on(t.alunoId, t.dataReferencia),
    index("ix_email_resumos_status_data").on(t.status, t.dataReferencia),
    check("ck_email_resumos_status", sql`${t.status} in ('PENDENTE', 'ENVIADO', 'ERRO', 'CANCELADO')`),
    check("ck_email_resumos_tentativas", sql`${t.tentativas} >= 0`),
  ]
)

export type EmailResumoDiario    = typeof emailResumosDiarios.$inferSelect
export type NewEmailResumoDiario = typeof emailResumosDiarios.$inferInsert

// ─── email_resumo_itens ──────────────────────────────────────────────────────

export const emailResumoItens = pgTable(
  "email_resumo_itens",
  {
    id:                    bigserial("id", { mode: "bigint" }).primaryKey(),
    emailResumoId:         bigserial("email_resumo_id", { mode: "bigint" }).notNull().references(() => emailResumosDiarios.id),
    avaliacaoHistoricoId:  bigserial("avaliacao_historico_id", { mode: "bigint" }).notNull().references(() => avaliacoesHistorico.id),
    turmaId:               bigserial("turma_id", { mode: "bigint" }).notNull().references(() => turmas.id),
    metaId:                bigserial("meta_id", { mode: "bigint" }).notNull().references(() => metas.id),
    conceitoAnterior:      varchar("conceito_anterior", { length: 4 }),
    conceitoNovo:          varchar("conceito_novo", { length: 4 }).notNull(),
    createdAt:             timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_email_resumo_itens_historico").on(t.avaliacaoHistoricoId),
    check("ck_resumo_item_conceito_anterior", sql`${t.conceitoAnterior} is null or ${t.conceitoAnterior} in ('MANA', 'MPA', 'MA')`),
    check("ck_resumo_item_conceito_novo", sql`${t.conceitoNovo} in ('MANA', 'MPA', 'MA')`),
  ]
)

export type EmailResumoItem    = typeof emailResumoItens.$inferSelect
export type NewEmailResumoItem = typeof emailResumoItens.$inferInsert
```

---

## State Transitions

### matriculas.status
```
ATIVA ──(desmatricular)──► CANCELADA
ATIVA ──(encerrar turma)──► CONCLUIDA
```
- Avaliações só podem ser lançadas para matrículas com status `ATIVA`.
- Histórico e avaliações existentes são preservados ao cancelar/concluir.

### email_resumos_diarios.status
```
PENDENTE ──(envio OK)──► ENVIADO
PENDENTE ──(falha)──────► ERRO
ERRO     ──(retry OK)───► ENVIADO
ERRO     ──(cancelar)───► CANCELADO
```

---

## Validation Rules (Zod Schemas — `src/lib/schemas/`)

```typescript
// alunos.ts
export const alunoSchema = z.object({
  nome:  z.string().min(1).max(150),
  cpf:   z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos numéricos"),
  email: z.string().email().max(255),
})

// turmas.ts
export const turmaSchema = z.object({
  topico:    z.string().min(1).max(150),
  descricao: z.string().max(500).optional(),
  ano:       z.number().int().min(2000).max(2100),
  semestre:  z.enum(["1", "2"]).transform(Number),
})

// metas.ts
export const metaSchema = z.object({
  codigo:    z.string().min(1).max(30),
  nome:      z.string().min(1).max(100),
  descricao: z.string().max(500).optional(),
})

// avaliacoes.ts
export const conceitoEnum = z.enum(["MANA", "MPA", "MA"])

export const saveBatchSchema = z.object({
  turmaId: z.coerce.bigint(),
  items:   z.array(z.object({
    matriculaId: z.coerce.bigint(),
    turmaMetaId: z.coerce.bigint(),
    conceito:    conceitoEnum,
  })).min(1).max(500),
})
```

---

## Key Query Patterns

### Grade de avaliações (RSC)
```typescript
// Todas as matrículas ativas da turma
const enrollments = await db.query.matriculas.findMany({
  where: and(eq(matriculas.turmaId, turmaId), eq(matriculas.status, "ATIVA")),
  with: { aluno: true },
  orderBy: [asc(alunos.nome)],
})

// Todas as metas da turma, ordenadas
const columns = await db.query.turmaMetas.findMany({
  where: and(eq(turmaMetas.turmaId, turmaId), eq(turmaMetas.ativa, true)),
  with: { meta: true },
  orderBy: [asc(turmaMetas.ordemExibicao)],
})

// Avaliacões existentes para montar o mapa inicial
const existing = await db.select().from(avaliacoes)
  .where(eq(avaliacoes.turmaId, turmaId))
// Transform to Map<`${matriculaId}:${turmaMetaId}`, conceito>
```

### Consolidação (batch — `src/lib/consolidacao.ts`)
```typescript
// Step 1: Grupos pendentes
const grupos = await db
  .selectDistinct({ alunoId: avaliacoesHistorico.alunoId })
  .from(avaliacoesHistorico)
  .where(and(
    eq(avaliacoesHistorico.dataReferencia, dataRef),
    eq(avaliacoesHistorico.processadoEmail, false),
  ))

// Step 2: Por grupo, dentro de db.transaction()
const [resumo] = await tx
  .insert(emailResumosDiarios)
  .values({ alunoId, dataReferencia, status: "PENDENTE", assunto, corpo })
  .onConflictDoNothing()
  .returning({ id: emailResumosDiarios.id })

if (!resumo) return // idempotent skip

const itens = await tx.select().from(avaliacoesHistorico).where(...)
await tx.insert(emailResumoItens).values(itens.map(...))
await tx.update(avaliacoesHistorico)
  .set({ processadoEmail: true })
  .where(and(
    eq(avaliacoesHistorico.alunoId, alunoId),
    eq(avaliacoesHistorico.dataReferencia, dataRef),
    eq(avaliacoesHistorico.processadoEmail, false),
  ))
```
