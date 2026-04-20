import { NextRequest, NextResponse } from "next/server"
import { consolidarEmailsDiarios } from "@/lib/consolidacao"
import { enviarEmailsPendentes } from "@/lib/email"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = process.env.SECRET_CRON_TOKEN

  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { created } = await consolidarEmailsDiarios()
    const { sent, errors } = await enviarEmailsPendentes()

    logger.info({ action: "cron:consolidate-emails", created, sent, errors })

    return NextResponse.json({ ok: true, created, sent, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ action: "cron:consolidate-emails:error", error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
