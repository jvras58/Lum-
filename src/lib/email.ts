import "server-only"
import nodemailer from "nodemailer"

export interface EmailMessage {
  to: string
  subject: string
  html: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>
}

class NodemailerProvider implements EmailProvider {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "no-reply@lum.local",
      to: message.to,
      subject: message.subject,
      html: message.html,
    })
  }
}

class ConsoleProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log("[email:console]", JSON.stringify({ to: message.to, subject: message.subject }))
  }
}

export const emailProvider: EmailProvider =
  process.env.EMAIL_PROVIDER === "nodemailer" ? new NodemailerProvider() : new ConsoleProvider()

export async function enviarEmailsPendentes(): Promise<{ sent: number; errors: number }> {
  const { db } = await import("@/db")
  const { emailResumosDiarios, alunos } = await import("@/db/schema")
  const { eq, lte } = await import("drizzle-orm")
  const { logger } = await import("@/lib/logger")

  const pendentes = await db.query.emailResumosDiarios.findMany({
    where: eq(emailResumosDiarios.status, "PENDENTE"),
    with: { aluno: true },
  })

  let sent = 0
  let errors = 0

  for (const resumo of pendentes) {
    try {
      await emailProvider.send({
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
