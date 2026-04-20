import { db } from "@/db"
import { emailResumosDiarios, alunos } from "@/db/schema"
import { desc, eq, ilike, or } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificacoesTable } from "@/components/notificacoes/NotificacoesTable"

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>
}

const STATUS_OPTIONS = ["PENDENTE", "ENVIADO", "ERRO", "CANCELADO"] as const

export default async function NotificacoesPage({ searchParams }: Props) {
  const { status, q } = await searchParams

  const rows = await db.query.emailResumosDiarios.findMany({
    with: { aluno: true },
    orderBy: [desc(emailResumosDiarios.geradoEm)],
    limit: 200,
  })

  const filtered = rows.filter((r) => {
    const matchStatus = !status || r.status === status
    const matchQ = !q || r.aluno.nome.toLowerCase().includes(q.toLowerCase()) || r.aluno.email.toLowerCase().includes(q.toLowerCase())
    return matchStatus && matchQ
  })

  const counts = {
    PENDENTE: rows.filter((r) => r.status === "PENDENTE").length,
    ENVIADO: rows.filter((r) => r.status === "ENVIADO").length,
    ERRO: rows.filter((r) => r.status === "ERRO").length,
    CANCELADO: rows.filter((r) => r.status === "CANCELADO").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground text-sm">Fila de envio de emails diários</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={status === s ? "/notificacoes" : `/notificacoes?status=${s}`}
            className={`border rounded-lg p-3 text-center transition-colors hover:bg-muted/30 ${status === s ? "bg-muted" : ""}`}
          >
            <p className="text-xl font-bold">{counts[s]}</p>
            <p className="text-xs text-muted-foreground capitalize">{s.toLowerCase()}</p>
          </Link>
        ))}
      </div>

      <form method="GET" className="flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou email…"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">Buscar</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href={status ? `/notificacoes?status=${status}` : "/notificacoes"}>
              Limpar
            </Link>
          </Button>
        )}
      </form>

      <NotificacoesTable rows={filtered} />
    </div>
  )
}
