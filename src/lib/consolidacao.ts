import "server-only"
import { db } from "@/db"
import {
  avaliacoesHistorico,
  emailResumosDiarios,
  emailResumoItens,
  alunos,
  turmas,
  metas,
} from "@/db/schema"
import { and, eq, isNull, inArray, sql } from "drizzle-orm"
import { logger } from "@/lib/logger"

function buildEmailHtml(alunoNome: string, dataReferencia: string, itens: ConsolidacaoItem[]): string {
  const rows = itens
    .map(
      (item) => `
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb">${item.turmaNome}</td>
      <td style="padding:8px;border:1px solid #e5e7eb">${item.metaNome}</td>
      <td style="padding:8px;border:1px solid #e5e7eb">${item.conceitoAnterior ?? "—"}</td>
      <td style="padding:8px;border:1px solid #e5e7eb"><strong>${item.conceitoNovo}</strong></td>
    </tr>`
    )
    .join("")

  return `
    <h2>Resumo de avaliações — ${dataReferencia}</h2>
    <p>Olá, ${alunoNome}. Seguem as alterações de avaliação registradas em ${dataReferencia}:</p>
    <table style="border-collapse:collapse;width:100%">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Turma</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Meta</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Anterior</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Novo</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

interface ConsolidacaoItem {
  historicoId: bigint
  turmaId: bigint
  turmaNome: string
  metaId: bigint
  metaNome: string
  conceitoAnterior: string | null
  conceitoNovo: string
}

export async function consolidarEmailsDiarios(dataReferencia?: string): Promise<{ created: number }> {
  const refDate = dataReferencia ?? new Date().toISOString().split("T")[0]

  const pendentes = await db
    .select({
      id: avaliacoesHistorico.id,
      alunoId: avaliacoesHistorico.alunoId,
      turmaId: avaliacoesHistorico.turmaId,
      metaId: avaliacoesHistorico.metaId,
      conceitoAnterior: avaliacoesHistorico.conceitoAnterior,
      conceitoNovo: avaliacoesHistorico.conceitoNovo,
      alunoNome: alunos.nome,
      alunoEmail: alunos.email,
      turmaNome: turmas.topico,
      metaNome: metas.nome,
    })
    .from(avaliacoesHistorico)
    .innerJoin(alunos, eq(alunos.id, avaliacoesHistorico.alunoId))
    .innerJoin(turmas, eq(turmas.id, avaliacoesHistorico.turmaId))
    .innerJoin(metas, eq(metas.id, avaliacoesHistorico.metaId))
    .where(
      and(
        eq(avaliacoesHistorico.dataReferencia, refDate),
        eq(avaliacoesHistorico.processadoEmail, false)
      )
    )

  if (pendentes.length === 0) return { created: 0 }

  // Group by aluno
  const byAluno = new Map<
    string,
    { alunoId: bigint; alunoNome: string; alunoEmail: string; itens: ConsolidacaoItem[] }
  >()

  for (const row of pendentes) {
    const key = String(row.alunoId)
    if (!byAluno.has(key)) {
      byAluno.set(key, {
        alunoId: row.alunoId,
        alunoNome: row.alunoNome,
        alunoEmail: row.alunoEmail,
        itens: [],
      })
    }
    byAluno.get(key)!.itens.push({
      historicoId: row.id,
      turmaId: row.turmaId,
      turmaNome: row.turmaNome,
      metaId: row.metaId,
      metaNome: row.metaNome,
      conceitoAnterior: row.conceitoAnterior,
      conceitoNovo: row.conceitoNovo,
    })
  }

  let created = 0

  for (const { alunoId, alunoNome, alunoEmail, itens } of byAluno.values()) {
    try {
      await db.transaction(async (tx) => {
        const assunto = `Suas avaliações foram atualizadas — ${refDate}`
        const corpo = buildEmailHtml(alunoNome, refDate, itens)

        // Idempotent: skip if resumo already exists for this aluno+data
        const [inserted] = await tx
          .insert(emailResumosDiarios)
          .values({
            alunoId,
            dataReferencia: refDate,
            status: "PENDENTE",
            assunto,
            corpo,
            tentativas: 0,
          })
          .onConflictDoNothing()
          .returning({ id: emailResumosDiarios.id })

        if (!inserted) return // already consolidated for this aluno/date

        await tx.insert(emailResumoItens).values(
          itens.map((item) => ({
            emailResumoId: inserted.id,
            avaliacaoHistoricoId: item.historicoId,
            turmaId: item.turmaId,
            metaId: item.metaId,
            conceitoAnterior: item.conceitoAnterior,
            conceitoNovo: item.conceitoNovo,
          }))
        )

        // Mark historico records as processed
        await tx
          .update(avaliacoesHistorico)
          .set({ processadoEmail: true })
          .where(
            inArray(
              avaliacoesHistorico.id,
              itens.map((i) => i.historicoId)
            )
          )

        created++
      })
    } catch (err) {
      logger.error({
        action: "consolidacao:error",
        alunoId: String(alunoId),
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  logger.info({ action: "consolidacao:done", dataReferencia: refDate, created })
  return { created }
}
