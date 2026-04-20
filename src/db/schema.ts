import {
  pgTable,
  bigserial,
  varchar,
  char,
  boolean,
  smallint,
  timestamp,
  date,
  text,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core"
import { sql, relations } from "drizzle-orm"

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

export const alunosRelations = relations(alunos, ({ many }) => ({
  matriculas: many(matriculas),
  emailResumosDiarios: many(emailResumosDiarios),
}))

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

export const turmasRelations = relations(turmas, ({ many }) => ({
  turmaMetas: many(turmaMetas),
  matriculas: many(matriculas),
  avaliacoes: many(avaliacoes),
}))

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

export const metasRelations = relations(metas, ({ many }) => ({
  turmaMetas: many(turmaMetas),
}))

export type Meta    = typeof metas.$inferSelect
export type NewMeta = typeof metas.$inferInsert

// ─── turma_metas ─────────────────────────────────────────────────────────────

export const turmaMetas = pgTable(
  "turma_metas",
  {
    id:            bigserial("id", { mode: "bigint" }).primaryKey(),
    turmaId:       bigserial("turma_id", { mode: "bigint" }).notNull().references(() => turmas.id),
    metaId:        bigserial("meta_id", { mode: "bigint" }).notNull().references(() => metas.id),
    ordemExibicao: smallint("ordem_exibicao").notNull().default(1),
    ativa:         boolean("ativa").notNull().default(true),
    createdAt:     timestamp("created_at").notNull().defaultNow(),
    updatedAt:     timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_turma_metas_turma_meta").on(t.turmaId, t.metaId),
    index("ix_turma_metas_turma_ordem").on(t.turmaId, t.ordemExibicao),
    check("ck_turma_metas_ordem", sql`${t.ordemExibicao} > 0`),
  ]
)

export const turmaMetasRelations = relations(turmaMetas, ({ one, many }) => ({
  turma:     one(turmas, { fields: [turmaMetas.turmaId], references: [turmas.id] }),
  meta:      one(metas,  { fields: [turmaMetas.metaId],  references: [metas.id] }),
  avaliacoes: many(avaliacoes),
}))

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

export const matriculasRelations = relations(matriculas, ({ one, many }) => ({
  turma:     one(turmas, { fields: [matriculas.turmaId], references: [turmas.id] }),
  aluno:     one(alunos, { fields: [matriculas.alunoId], references: [alunos.id] }),
  avaliacoes: many(avaliacoes),
}))

export type Matricula    = typeof matriculas.$inferSelect
export type NewMatricula = typeof matriculas.$inferInsert

// ─── avaliacoes ──────────────────────────────────────────────────────────────

export const avaliacoes = pgTable(
  "avaliacoes",
  {
    id:                bigserial("id", { mode: "bigint" }).primaryKey(),
    turmaId:           bigserial("turma_id", { mode: "bigint" }).notNull().references(() => turmas.id),
    alunoId:           bigserial("aluno_id", { mode: "bigint" }).notNull().references(() => alunos.id),
    matriculaId:       bigserial("matricula_id", { mode: "bigint" }).notNull().references(() => matriculas.id),
    turmaMetaId:       bigserial("turma_meta_id", { mode: "bigint" }).notNull().references(() => turmaMetas.id),
    conceito:          varchar("conceito", { length: 4 }).notNull(),
    observacao:        varchar("observacao", { length: 500 }),
    ultimaAlteracaoEm: timestamp("ultima_alteracao_em").notNull().defaultNow(),
    createdAt:         timestamp("created_at").notNull().defaultNow(),
    updatedAt:         timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_avaliacoes_matricula_meta").on(t.matriculaId, t.turmaMetaId),
    index("ix_avaliacoes_turma_aluno").on(t.turmaId, t.alunoId),
    index("ix_avaliacoes_turma_meta").on(t.turmaMetaId),
    check("ck_avaliacoes_conceito", sql`${t.conceito} in ('MANA', 'MPA', 'MA')`),
  ]
)

export const avaliacoesRelations = relations(avaliacoes, ({ one, many }) => ({
  turma:     one(turmas,     { fields: [avaliacoes.turmaId],     references: [turmas.id] }),
  aluno:     one(alunos,     { fields: [avaliacoes.alunoId],     references: [alunos.id] }),
  matricula: one(matriculas, { fields: [avaliacoes.matriculaId], references: [matriculas.id] }),
  turmaMeta: one(turmaMetas, { fields: [avaliacoes.turmaMetaId], references: [turmaMetas.id] }),
  historico: many(avaliacoesHistorico),
}))

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
    check("ck_hist_conceito_anterior", sql`${t.conceitoAnterior} is null or ${t.conceitoAnterior} in ('MANA', 'MPA', 'MA')`),
    check("ck_hist_conceito_novo", sql`${t.conceitoNovo} in ('MANA', 'MPA', 'MA')`),
  ]
)

export const avaliacoesHistoricoRelations = relations(avaliacoesHistorico, ({ one, many }) => ({
  avaliacao: one(avaliacoes, { fields: [avaliacoesHistorico.avaliacaoId], references: [avaliacoes.id] }),
  aluno:     one(alunos,     { fields: [avaliacoesHistorico.alunoId],     references: [alunos.id] }),
  turma:     one(turmas,     { fields: [avaliacoesHistorico.turmaId],     references: [turmas.id] }),
  meta:      one(metas,      { fields: [avaliacoesHistorico.metaId],      references: [metas.id] }),
  emailItens: many(emailResumoItens),
}))

export type AvaliacaoHistorico    = typeof avaliacoesHistorico.$inferSelect
export type NewAvaliacaoHistorico = typeof avaliacoesHistorico.$inferInsert

// ─── email_resumos_diarios ───────────────────────────────────────────────────

export const emailResumosDiarios = pgTable(
  "email_resumos_diarios",
  {
    id:              bigserial("id", { mode: "bigint" }).primaryKey(),
    alunoId:         bigserial("aluno_id", { mode: "bigint" }).notNull().references(() => alunos.id),
    dataReferencia:  date("data_referencia").notNull(),
    status:          varchar("status", { length: 20 }).notNull().default("PENDENTE"),
    assunto:         varchar("assunto", { length: 255 }).notNull(),
    corpo:           text("corpo").notNull(),
    tentativas:      smallint("tentativas").notNull().default(0),
    geradoEm:        timestamp("gerado_em").notNull().defaultNow(),
    enviadoEm:       timestamp("enviado_em"),
    erroUltimoEnvio: text("erro_ultimo_envio"),
    createdAt:       timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_email_resumos_aluno_data").on(t.alunoId, t.dataReferencia),
    index("ix_email_resumos_status_data").on(t.status, t.dataReferencia),
    check("ck_email_resumos_status", sql`${t.status} in ('PENDENTE', 'ENVIADO', 'ERRO', 'CANCELADO')`),
    check("ck_email_resumos_tentativas", sql`${t.tentativas} >= 0`),
  ]
)

export const emailResumosDiariosRelations = relations(emailResumosDiarios, ({ one, many }) => ({
  aluno: one(alunos, { fields: [emailResumosDiarios.alunoId], references: [alunos.id] }),
  itens: many(emailResumoItens),
}))

export type EmailResumoDiario    = typeof emailResumosDiarios.$inferSelect
export type NewEmailResumoDiario = typeof emailResumosDiarios.$inferInsert

// ─── email_resumo_itens ──────────────────────────────────────────────────────

export const emailResumoItens = pgTable(
  "email_resumo_itens",
  {
    id:                   bigserial("id", { mode: "bigint" }).primaryKey(),
    emailResumoId:        bigserial("email_resumo_id", { mode: "bigint" }).notNull().references(() => emailResumosDiarios.id),
    avaliacaoHistoricoId: bigserial("avaliacao_historico_id", { mode: "bigint" }).notNull().references(() => avaliacoesHistorico.id),
    turmaId:              bigserial("turma_id", { mode: "bigint" }).notNull().references(() => turmas.id),
    metaId:               bigserial("meta_id", { mode: "bigint" }).notNull().references(() => metas.id),
    conceitoAnterior:     varchar("conceito_anterior", { length: 4 }),
    conceitoNovo:         varchar("conceito_novo", { length: 4 }).notNull(),
    createdAt:            timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_email_resumo_itens_historico").on(t.avaliacaoHistoricoId),
    check("ck_resumo_item_conc_anterior", sql`${t.conceitoAnterior} is null or ${t.conceitoAnterior} in ('MANA', 'MPA', 'MA')`),
    check("ck_resumo_item_conc_novo", sql`${t.conceitoNovo} in ('MANA', 'MPA', 'MA')`),
  ]
)

export const emailResumoItensRelations = relations(emailResumoItens, ({ one }) => ({
  emailResumo:        one(emailResumosDiarios,  { fields: [emailResumoItens.emailResumoId],        references: [emailResumosDiarios.id] }),
  avaliacaoHistorico: one(avaliacoesHistorico,  { fields: [emailResumoItens.avaliacaoHistoricoId], references: [avaliacoesHistorico.id] }),
  turma:              one(turmas,               { fields: [emailResumoItens.turmaId],              references: [turmas.id] }),
  meta:               one(metas,                { fields: [emailResumoItens.metaId],               references: [metas.id] }),
}))

export type EmailResumoItem    = typeof emailResumoItens.$inferSelect
export type NewEmailResumoItem = typeof emailResumoItens.$inferInsert
