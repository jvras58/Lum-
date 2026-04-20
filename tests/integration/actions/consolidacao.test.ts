import { describe, it, expect, vi } from "vitest"
import { eq } from "drizzle-orm"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock("@/lib/auth", () => ({ assertAuthenticated: vi.fn() }))
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))

import { consolidarEmailsDiarios } from "@/lib/consolidacao"
import { saveBatchAvaliacoes } from "@/actions/avaliacoes"
import { db } from "@/db"
import {
  avaliacoesHistorico,
  emailResumosDiarios,
  emailResumoItens,
} from "@/db/schema"
import { seedAluno, seedTurma, seedMeta, seedTurmaMeta, seedMatricula } from "../helpers"

const TODAY = new Date().toISOString().split("T")[0]!

describe("consolidarEmailsDiarios — integration", () => {
  it("creates email resumo with items linked to historico", async () => {
    const aluno = await seedAluno()
    const turma = await seedTurma()
    const meta = await seedMeta()
    const tm = await seedTurmaMeta(turma.id, meta.id)
    const mat = await seedMatricula(turma.id, aluno.id)

    await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat.id, turmaMetaId: tm.id, conceito: "MANA" },
    ])

    const { created } = await consolidarEmailsDiarios(TODAY)
    expect(created).toBe(1)

    const [resumo] = await db
      .select()
      .from(emailResumosDiarios)
      .where(eq(emailResumosDiarios.alunoId, aluno.id))
    expect(resumo?.status).toBe("PENDENTE")
    expect(resumo?.dataReferencia).toBe(TODAY)

    const itens = await db
      .select()
      .from(emailResumoItens)
      .where(eq(emailResumoItens.emailResumoId, resumo!.id))
    expect(itens).toHaveLength(1)
    expect(itens[0]?.conceitoNovo).toBe("MANA")
  })

  it("is idempotent — second run on the same date produces zero new records", async () => {
    const aluno = await seedAluno()
    const turma = await seedTurma()
    const meta = await seedMeta()
    const tm = await seedTurmaMeta(turma.id, meta.id)
    const mat = await seedMatricula(turma.id, aluno.id)

    await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat.id, turmaMetaId: tm.id, conceito: "MPA" },
    ])

    await consolidarEmailsDiarios(TODAY)
    const { created } = await consolidarEmailsDiarios(TODAY)

    expect(created).toBe(0)

    const resumos = await db
      .select()
      .from(emailResumosDiarios)
      .where(eq(emailResumosDiarios.alunoId, aluno.id))
    expect(resumos).toHaveLength(1) // exactly one, never duplicated
  })

  it("consolidates changes from multiple turmas into one email per aluno", async () => {
    const aluno = await seedAluno()

    const turma1 = await seedTurma()
    const meta1 = await seedMeta()
    const tm1 = await seedTurmaMeta(turma1.id, meta1.id)
    const mat1 = await seedMatricula(turma1.id, aluno.id)

    const turma2 = await seedTurma()
    const meta2 = await seedMeta()
    const tm2 = await seedTurmaMeta(turma2.id, meta2.id)
    const mat2 = await seedMatricula(turma2.id, aluno.id)

    await saveBatchAvaliacoes(turma1.id, [
      { matriculaId: mat1.id, turmaMetaId: tm1.id, conceito: "MANA" },
    ])
    await saveBatchAvaliacoes(turma2.id, [
      { matriculaId: mat2.id, turmaMetaId: tm2.id, conceito: "MA" },
    ])

    const { created } = await consolidarEmailsDiarios(TODAY)

    expect(created).toBe(1) // one email for the aluno, not two

    const resumos = await db
      .select()
      .from(emailResumosDiarios)
      .where(eq(emailResumosDiarios.alunoId, aluno.id))
    expect(resumos).toHaveLength(1)

    const itens = await db
      .select()
      .from(emailResumoItens)
      .where(eq(emailResumoItens.emailResumoId, resumos[0]!.id))
    expect(itens).toHaveLength(2) // both turmas' changes in one email
  })

  it("marks all processed historico records as processadoEmail=true", async () => {
    const aluno = await seedAluno()
    const turma = await seedTurma()
    const meta = await seedMeta()
    const tm = await seedTurmaMeta(turma.id, meta.id)
    const mat = await seedMatricula(turma.id, aluno.id)

    await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat.id, turmaMetaId: tm.id, conceito: "MA" },
    ])

    await consolidarEmailsDiarios(TODAY)

    const historico = await db.select().from(avaliacoesHistorico)
    expect(historico.every((h) => h.processadoEmail === true)).toBe(true)
  })

  it("generates separate emails for different alunos on the same day", async () => {
    const aluno1 = await seedAluno()
    const aluno2 = await seedAluno()
    const turma = await seedTurma()
    const meta = await seedMeta()
    const tm = await seedTurmaMeta(turma.id, meta.id)
    const mat1 = await seedMatricula(turma.id, aluno1.id)
    const mat2 = await seedMatricula(turma.id, aluno2.id)

    await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat1.id, turmaMetaId: tm.id, conceito: "MANA" },
      { matriculaId: mat2.id, turmaMetaId: tm.id, conceito: "MPA" },
    ])

    const { created } = await consolidarEmailsDiarios(TODAY)

    expect(created).toBe(2) // one per aluno
  })
})
