"use server"
import "server-only"
import { db } from "@/db"
import { avaliacoes, avaliacoesHistorico, matriculas, turmaMetas } from "@/db/schema"
import { saveBatchSchema } from "@/lib/schemas/avaliacoes"
import { assertAuthenticated } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { and, eq, inArray } from "drizzle-orm"
import type { ActionResult } from "@/lib/types"

export async function saveBatchAvaliacoes(
  rawTurmaId: string | bigint,
  rawItems: Array<{ matriculaId: string | bigint; turmaMetaId: string | bigint; conceito: string }>
): Promise<ActionResult<{ saved: number }>> {
  assertAuthenticated()
  const start = Date.now()

  const parsed = saveBatchSchema.safeParse({ turmaId: rawTurmaId, items: rawItems })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join("; ") }
  }

  const { turmaId, items } = parsed.data
  const today = new Date().toISOString().split("T")[0]!

  try {
    await db.transaction(async (tx) => {
      // Verify all matriculaIds belong to this turma and are ATIVA
      const matriculaIds = [...new Set(items.map((i) => i.matriculaId))]
      const validMatriculas = await tx
        .select({ id: matriculas.id })
        .from(matriculas)
        .where(
          and(
            inArray(matriculas.id, matriculaIds),
            eq(matriculas.turmaId, turmaId),
            eq(matriculas.status, "ATIVA")
          )
        )
      const validMatriculaSet = new Set(validMatriculas.map((m) => m.id))
      for (const item of items) {
        if (!validMatriculaSet.has(item.matriculaId)) {
          throw new Error(`Matrícula inativa ou não pertence à turma: ${item.matriculaId}`)
        }
      }

      // Verify all turmaMetaIds belong to this turma and are ativas
      const turmaMetaIds = [...new Set(items.map((i) => i.turmaMetaId))]
      const validMetas = await tx
        .select({ id: turmaMetas.id })
        .from(turmaMetas)
        .where(
          and(
            inArray(turmaMetas.id, turmaMetaIds),
            eq(turmaMetas.turmaId, turmaId),
            eq(turmaMetas.ativa, true)
          )
        )
      const validMetaSet = new Set(validMetas.map((m) => m.id))
      for (const item of items) {
        if (!validMetaSet.has(item.turmaMetaId)) {
          throw new Error(`Meta inativa ou não pertence à turma: ${item.turmaMetaId}`)
        }
      }

      for (const item of items) {
        // Fetch current conceito for historico
        const existing = await tx
          .select({ id: avaliacoes.id, conceito: avaliacoes.conceito, alunoId: avaliacoes.alunoId, metaId: turmaMetas.metaId })
          .from(avaliacoes)
          .innerJoin(turmaMetas, eq(avaliacoes.turmaMetaId, turmaMetas.id))
          .where(
            and(
              eq(avaliacoes.matriculaId, item.matriculaId),
              eq(avaliacoes.turmaMetaId, item.turmaMetaId)
            )
          )
          .limit(1)

        const currentConceito = existing[0]?.conceito ?? null

        // Upsert avaliacao
        const [upserted] = await tx
          .insert(avaliacoes)
          .values({
            turmaId,
            alunoId: (
              await tx
                .select({ alunoId: matriculas.alunoId })
                .from(matriculas)
                .where(eq(matriculas.id, item.matriculaId))
                .limit(1)
            )[0]!.alunoId,
            matriculaId:      item.matriculaId,
            turmaMetaId:      item.turmaMetaId,
            conceito:         item.conceito,
            ultimaAlteracaoEm: new Date(),
          })
          .onConflictDoUpdate({
            target: [avaliacoes.matriculaId, avaliacoes.turmaMetaId],
            set: {
              conceito:          item.conceito,
              ultimaAlteracaoEm: new Date(),
              updatedAt:         new Date(),
            },
          })
          .returning()

        // Insert historico
        await tx.insert(avaliacoesHistorico).values({
          avaliacaoId:      upserted!.id,
          alunoId:          upserted!.alunoId,
          turmaId,
          metaId:           (await tx.select({ metaId: turmaMetas.metaId }).from(turmaMetas).where(eq(turmaMetas.id, item.turmaMetaId)).limit(1))[0]!.metaId,
          conceitoAnterior: currentConceito,
          conceitoNovo:     item.conceito,
          dataReferencia:   today,
          processadoEmail:  false,
        })
      }
    })

    revalidatePath(`/turmas/${turmaId}/avaliacoes`)
    logger.info({ action: "saveBatchAvaliacoes", duration: Date.now() - start, success: true, saved: items.length })
    return { success: true, data: { saved: items.length } }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar avaliações"
    logger.error({ action: "saveBatchAvaliacoes", duration: Date.now() - start, error: message })
    return { success: false, error: message }
  }
}
