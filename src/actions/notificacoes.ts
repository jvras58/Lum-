"use server"

import { db } from "@/db"
import { emailResumosDiarios } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { assertAuthenticated } from "@/lib/auth"
import { logger } from "@/lib/logger"
import type { ActionResult } from "@/lib/types"

export async function cancelarResumo(id: string): Promise<ActionResult> {
  assertAuthenticated()

  const resumoId = BigInt(id)

  const existing = await db.query.emailResumosDiarios.findFirst({
    where: eq(emailResumosDiarios.id, resumoId),
  })

  if (!existing) return { success: false, error: "Resumo não encontrado." }
  if (existing.status === "ENVIADO") return { success: false, error: "Resumo já foi enviado e não pode ser cancelado." }
  if (existing.status === "CANCELADO") return { success: false, error: "Resumo já está cancelado." }

  await db
    .update(emailResumosDiarios)
    .set({ status: "CANCELADO" })
    .where(eq(emailResumosDiarios.id, resumoId))

  revalidatePath("/notificacoes")
  logger.info({ action: "cancelarResumo", resumoId: id })
  return { success: true, data: undefined }
}
