import { db } from "@/db"
import { emailResumosDiarios } from "@/db/schema"
import { desc } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificacoesTable } from "@/components/notificacoes/NotificacoesTable"
import { Bell, Clock, CheckCircle2, XCircle, Ban, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>
}

const STATUS_CONFIG = [
  {
    key: "PENDENTE",
    label: "Pendente",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    activeBorder: "border-amber-300 dark:border-amber-700",
  },
  {
    key: "ENVIADO",
    label: "Enviado",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    activeBorder: "border-green-300 dark:border-green-700",
  },
  {
    key: "ERRO",
    label: "Erro",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    activeBorder: "border-red-300 dark:border-red-700",
  },
  {
    key: "CANCELADO",
    label: "Cancelado",
    icon: Ban,
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    activeBorder: "border-slate-300 dark:border-slate-600",
  },
] as const

export default async function NotificacoesPage({ searchParams }: Props) {
  const { status, q } = await searchParams

  const rows = await db.query.emailResumosDiarios.findMany({
    with: { aluno: true },
    orderBy: [desc(emailResumosDiarios.geradoEm)],
    limit: 200,
  })

  const filtered = rows.filter((r) => {
    const matchStatus = !status || r.status === status
    const matchQ =
      !q ||
      r.aluno.nome.toLowerCase().includes(q.toLowerCase()) ||
      r.aluno.email.toLowerCase().includes(q.toLowerCase())
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <Bell className="h-6 w-6 text-primary" />
          Notificações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Fila de envio de emails diários</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {STATUS_CONFIG.map(({ key, label, icon: Icon, color, bg, activeBorder }) => {
          const isActive = status === key
          return (
            <Link
              key={key}
              href={isActive ? "/notificacoes" : `/notificacoes?status=${key}`}
              className={cn(
                "rounded-xl border p-4 transition-all hover:shadow-sm",
                isActive
                  ? cn(bg, activeBorder)
                  : "bg-card border-border/60 hover:bg-muted/20"
              )}
            >
              <div className={cn("flex items-center justify-between mb-3", isActive ? color : "text-muted-foreground")}>
                <Icon className="h-4 w-4" />
                {isActive && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                    Filtrado
                  </span>
                )}
              </div>
              <p className={cn("text-2xl font-bold", isActive ? color : "text-foreground")}>
                {counts[key]}
              </p>
              <p className={cn("text-xs font-medium mt-0.5", isActive ? color : "text-muted-foreground")}>
                {label}
              </p>
            </Link>
          )
        })}
      </div>

      <form method="GET" className="flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou email…"
            className="pl-9"
          />
        </div>
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
