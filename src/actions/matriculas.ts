"use server"
import "server-only"
import { db } from "@/db"
import { matriculas, avaliacoes, turmaMetas } from "@/db/schema"
import { assertAuthenticated } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import type { ActionResult } from "@/lib/types"
import type { Matricula, TurmaMeta } from "@/db/schema"

export async function matricularAluno(turmaId: bigint, alunoId: bigint): Promise<ActionResult<Matricula>> {
  assertAuthenticated()
  try {
    const [row] = await db.insert(matriculas).values({ turmaId, alunoId, status: "ATIVA" }).returning()
    revalidatePath(`/turmas/${turmaId}`)
    return { success: true, data: row! }
  } catch (err) {
    const msg = err instanceof Error && err.message.includes("uq_matriculas_turma_aluno")
      ? "Aluno já matriculado nesta turma"
      : "Erro ao matricular aluno"
    return { success: false, error: msg }
  }
}

export async function desmatricularAluno(matriculaId: bigint): Promise<ActionResult<void>> {
  assertAuthenticated()
  const mat = await db.query.matriculas.findFirst({ where: eq(matriculas.id, matriculaId) })
  if (!mat) return { success: false, error: "Matrícula não encontrada" }

  // Soft-cancel: preserves avaliacoes for audit
  await db.update(matriculas).set({
    status: "CANCELADA",
    desmatriculadoEm: new Date(),
    updatedAt: new Date(),
  }).where(eq(matriculas.id, matriculaId))

  revalidatePath(`/turmas/${mat.turmaId}`)
  return { success: true, data: undefined }
}

export async function associarMetaTurma(turmaId: bigint, metaId: bigint, ordem: number): Promise<ActionResult<TurmaMeta>> {
  assertAuthenticated()
  try {
    const [row] = await db.insert(turmaMetas).values({ turmaId, metaId, ordemExibicao: ordem }).returning()
    revalidatePath(`/turmas/${turmaId}`)
    return { success: true, data: row! }
  } catch (err) {
    const msg = err instanceof Error && err.message.includes("uq_turma_metas_turma_meta")
      ? "Meta já associada a esta turma"
      : "Erro ao associar meta"
    return { success: false, error: msg }
  }
}

export async function desassociarMetaTurma(turmaMetaId: bigint): Promise<ActionResult<void>> {
  assertAuthenticated()
  const tm = await db.query.turmaMetas.findFirst({ where: eq(turmaMetas.id, turmaMetaId) })
  if (!tm) return { success: false, error: "Associação não encontrada" }
  await db.update(turmaMetas).set({ ativa: false, updatedAt: new Date() }).where(eq(turmaMetas.id, turmaMetaId))
  revalidatePath(`/turmas/${tm.turmaId}`)
  return { success: true, data: undefined }
}
