import "server-only"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailMessage {
  to: string
  subject: string
  html: string
}

async function send(message: EmailMessage): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "no-reply@example.com",
    to: message.to,
    subject: message.subject,
    html: message.html,
  })
  if (error) throw new Error(error.message)
}

export async function enviarEmailsPendentes(): Promise<{ sent: number; errors: number }> {
  const { db } = await import("@/db")
  const { emailResumosDiarios } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")
  const { logger } = await import("@/lib/logger")

  const pendentes = await db.query.emailResumosDiarios.findMany({
    where: eq(emailResumosDiarios.status, "PENDENTE"),
    with: { aluno: true },
  })

  let sent = 0
  let errors = 0

  for (const resumo of pendentes) {
    try {
      await send({
        to: resumo.aluno.email,
        subject: resumo.assunto,
        html: resumo.corpo,
      })

      await db
        .update(emailResumosDiarios)
        .set({ status: "ENVIADO", enviadoEm: new Date(), tentativas: resumo.tentativas + 1 })
        .where(eq(emailResumosDiarios.id, resumo.id))

      sent++
      logger.info({ action: "email:sent", resumoId: String(resumo.id), alunoId: String(resumo.alunoId) })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await db
        .update(emailResumosDiarios)
        .set({
          status: "ERRO",
          tentativas: resumo.tentativas + 1,
          erroUltimoEnvio: errMsg,
        })
        .where(eq(emailResumosDiarios.id, resumo.id))

      errors++
      logger.error({ action: "email:error", resumoId: String(resumo.id), error: errMsg })
    }
  }

  return { sent, errors }
}
