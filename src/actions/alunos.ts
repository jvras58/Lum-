"use server"
import "server-only"
import { db } from "@/db"
import { alunos } from "@/db/schema"
import { alunoSchema, alunoUpdateSchema } from "@/lib/schemas/alunos"
import { assertAuthenticated } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import type { ActionResult } from "@/lib/types"
import type { Aluno as AlunoRow } from "@/db/schema"

export async function createAluno(raw: unknown): Promise<ActionResult<AlunoRow>> {
  assertAuthenticated()
  const start = Date.now()
  const parsed = alunoSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors.map((e) => e.message).join("; ") }

  try {
    const [row] = await db.insert(alunos).values(parsed.data).returning()
    revalidatePath("/alunos")
    logger.info({ action: "createAluno", duration: Date.now() - start, success: true })
    return { success: true, data: row! }
  } catch (err) {
    const msg = err instanceof Error && err.message.includes("uq_alunos_cpf")
      ? "CPF já cadastrado"
      : err instanceof Error && err.message.includes("uq_alunos_email")
        ? "Email já cadastrado"
        : "Erro ao criar aluno"
    logger.error({ action: "createAluno", error: msg })
    return { success: false, error: msg }
  }
}

export async function updateAluno(id: bigint, raw: unknown): Promise<ActionResult<AlunoRow>> {
  assertAuthenticated()
  const start = Date.now()
  const parsed = alunoUpdateSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors.map((e) => e.message).join("; ") }

  try {
    const [row] = await db
      .update(alunos)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(alunos.id, id))
      .returning()
    if (!row) return { success: false, error: "Aluno não encontrado" }
    revalidatePath("/alunos")
    revalidatePath(`/alunos/${id}`)
    logger.info({ action: "updateAluno", duration: Date.now() - start, success: true })
    return { success: true, data: row }
  } catch (err) {
    const msg = err instanceof Error && err.message.includes("uq_alunos_email")
      ? "Email já cadastrado"
      : "Erro ao atualizar aluno"
    logger.error({ action: "updateAluno", error: msg })
    return { success: false, error: msg }
  }
}

export async function deactivateAluno(id: bigint): Promise<ActionResult<void>> {
  assertAuthenticated()
  await db.update(alunos).set({ ativo: false, updatedAt: new Date() }).where(eq(alunos.id, id))
  revalidatePath("/alunos")
  return { success: true, data: undefined }
}
