import { describe, it, expect, vi } from "vitest"
import { eq } from "drizzle-orm"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock("@/lib/auth", () => ({ assertAuthenticated: vi.fn() }))
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))

import { saveBatchAvaliacoes } from "@/actions/avaliacoes"
import { db } from "@/db"
import { avaliacoes, avaliacoesHistorico } from "@/db/schema"
import { seedAluno, seedTurma, seedMeta, seedTurmaMeta, seedMatricula } from "../helpers"

describe("saveBatchAvaliacoes — integration", () => {
  it("persists avaliacoes and creates historico with null conceitoAnterior", async () => {
    const aluno = await seedAluno()
    const turma = await seedTurma()
    const meta = await seedMeta()
    const tm = await seedTurmaMeta(turma.id, meta.id)
    const mat = await seedMatricula(turma.id, aluno.id)

    const result = await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat.id, turmaMetaId: tm.id, conceito: "MANA" },
    ])

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.saved).toBe(1)

    const [av] = await db.select().from(avaliacoes).where(eq(avaliacoes.matriculaId, mat.id))
    expect(av?.conceito).toBe("MANA")

    const [hist] = await db
      .select()
      .from(avaliacoesHistorico)
      .where(eq(avaliacoesHistorico.avaliacaoId, av!.id))
    expect(hist?.conceitoNovo).toBe("MANA")
    expect(hist?.conceitoAnterior).toBeNull()
    expect(hist?.processadoEmail).toBe(false)
  })

  it("records conceitoAnterior correctly on update", async () => {
    const aluno = await seedAluno()
    const turma = await seedTurma()
    const meta = await seedMeta()
    const tm = await seedTurmaMeta(turma.id, meta.id)
    const mat = await seedMatricula(turma.id, aluno.id)

    await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat.id, turmaMetaId: tm.id, conceito: "MANA" },
    ])
    await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat.id, turmaMetaId: tm.id, conceito: "MPA" },
    ])

    const hist = await db.select().from(avaliacoesHistorico)
    const update = hist.find((h) => h.conceitoAnterior === "MANA")
    expect(update?.conceitoNovo).toBe("MPA")
  })

  it("is atomic — invalid turmaMetaId causes full rollback", async () => {
    const aluno = await seedAluno()
    const turma = await seedTurma()
    const meta = await seedMeta()
    const tm = await seedTurmaMeta(turma.id, meta.id)
    const mat = await seedMatricula(turma.id, aluno.id)

    const result = await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat.id, turmaMetaId: tm.id, conceito: "MANA" },
      { matriculaId: mat.id, turmaMetaId: BigInt(999_999), conceito: "MA" }, // invalid
    ])

    expect(result.success).toBe(false)
    const rows = await db.select().from(avaliacoes)
    expect(rows).toHaveLength(0) // nothing persisted — transaction rolled back
  })

  it("saves multiple cells in a single batch", async () => {
    const aluno1 = await seedAluno()
    const aluno2 = await seedAluno()
    const turma = await seedTurma()
    const meta1 = await seedMeta()
    const meta2 = await seedMeta()
    const tm1 = await seedTurmaMeta(turma.id, meta1.id, 1)
    const tm2 = await seedTurmaMeta(turma.id, meta2.id, 2)
    const mat1 = await seedMatricula(turma.id, aluno1.id)
    const mat2 = await seedMatricula(turma.id, aluno2.id)

    const result = await saveBatchAvaliacoes(turma.id, [
      { matriculaId: mat1.id, turmaMetaId: tm1.id, conceito: "MANA" },
      { matriculaId: mat1.id, turmaMetaId: tm2.id, conceito: "MPA" },
      { matriculaId: mat2.id, turmaMetaId: tm1.id, conceito: "MA" },
    ])

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.saved).toBe(3)

    const rows = await db.select().from(avaliacoes)
    expect(rows).toHaveLength(3)
  })
})
