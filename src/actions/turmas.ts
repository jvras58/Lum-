"use server"
import "server-only"
import { db } from "@/db"
import { turmas } from "@/db/schema"
import { turmaSchema } from "@/lib/schemas/turmas"
import { assertAuthenticated } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import type { ActionResult } from "@/lib/types"
import type { Turma } from "@/db/schema"

export async function createTurma(raw: unknown): Promise<ActionResult<Turma>> {
  assertAuthenticated()
  const parsed = turmaSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors.map((e) => e.message).join("; ") }

  try {
    const [row] = await db.insert(turmas).values(parsed.data).returning()
    revalidatePath("/turmas")
    logger.info({ action: "createTurma", success: true })
    return { success: true, data: row! }
  } catch (err) {
    const msg = err instanceof Error && err.message.includes("uq_turmas_topico_periodo")
      ? "Já existe uma turma com este tópico, ano e semestre"
      : "Erro ao criar turma"
    return { success: false, error: msg }
  }
}

export async function updateTurma(id: bigint, raw: unknown): Promise<ActionResult<Turma>> {
  assertAuthenticated()
  const parsed = turmaSchema.partial().safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors.map((e) => e.message).join("; ") }

  try {
    const [row] = await db.update(turmas).set({ ...parsed.data, updatedAt: new Date() }).where(eq(turmas.id, id)).returning()
    if (!row) return { success: false, error: "Turma não encontrada" }
    revalidatePath("/turmas")
    revalidatePath(`/turmas/${id}`)
    return { success: true, data: row }
  } catch {
    return { success: false, error: "Erro ao atualizar turma" }
  }
}

export async function deactivateTurma(id: bigint): Promise<ActionResult<void>> {
  assertAuthenticated()
  await db.update(turmas).set({ ativa: false, updatedAt: new Date() }).where(eq(turmas.id, id))
  revalidatePath("/turmas")
  return { success: true, data: undefined }
}
