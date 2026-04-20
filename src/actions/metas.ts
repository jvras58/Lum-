"use server"
import "server-only"
import { db } from "@/db"
import { metas, turmaMetas } from "@/db/schema"
import { metaSchema } from "@/lib/schemas/metas"
import { assertAuthenticated } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { and, eq, inArray } from "drizzle-orm"
import type { ActionResult } from "@/lib/types"
import type { Meta } from "@/db/schema"

export async function createMeta(raw: unknown): Promise<ActionResult<Meta>> {
  assertAuthenticated()
  const parsed = metaSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors.map((e) => e.message).join("; ") }

  try {
    const [row] = await db.insert(metas).values(parsed.data).returning()
    revalidatePath("/metas")
    return { success: true, data: row! }
  } catch (err) {
    const msg = err instanceof Error && err.message.includes("uq_metas_codigo")
      ? "Código de meta já utilizado"
      : "Erro ao criar meta"
    return { success: false, error: msg }
  }
}

export async function updateMeta(id: bigint, raw: unknown): Promise<ActionResult<Meta>> {
  assertAuthenticated()
  const parsed = metaSchema.partial().safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors.map((e) => e.message).join("; ") }

  const [row] = await db.update(metas).set({ ...parsed.data, updatedAt: new Date() }).where(eq(metas.id, id)).returning()
  if (!row) return { success: false, error: "Meta não encontrada" }
  revalidatePath("/metas")
  return { success: true, data: row }
}

export async function toggleMetaAtiva(id: bigint): Promise<ActionResult<Meta>> {
  assertAuthenticated()
  const current = await db.query.metas.findFirst({ where: eq(metas.id, id) })
  if (!current) return { success: false, error: "Meta não encontrada" }
  const [row] = await db.update(metas).set({ ativa: !current.ativa, updatedAt: new Date() }).where(eq(metas.id, id)).returning()
  revalidatePath("/metas")
  return { success: true, data: row! }
}

export async function reorderMetas(turmaId: bigint, orderedMetaIds: bigint[]): Promise<ActionResult<void>> {
  assertAuthenticated()
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedMetaIds.length; i++) {
      await tx
        .update(turmaMetas)
        .set({ ordemExibicao: i + 1, updatedAt: new Date() })
        .where(and(eq(turmaMetas.turmaId, turmaId), eq(turmaMetas.metaId, orderedMetaIds[i]!)))
    }
  })
  revalidatePath(`/turmas/${turmaId}`)
  return { success: true, data: undefined }
}
