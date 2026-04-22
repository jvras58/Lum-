import { db } from "@/db"
import { alunos, turmas, emailResumosDiarios } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Users, BookOpen, Bell, ArrowUpRight } from "lucide-react"

async function getDashboardStats() {
  const [totalAlunos, totalTurmas, notificacoesPendentes] = await Promise.all([
    db.select({ total: count() }).from(alunos).where(eq(alunos.ativo, true)),
    db.select({ total: count() }).from(turmas).where(eq(turmas.ativa, true)),
    db.select({ total: count() }).from(emailResumosDiarios).where(eq(emailResumosDiarios.status, "PENDENTE")),
  ])
  return {
    alunos: totalAlunos[0]?.total ?? 0,
    turmas: totalTurmas[0]?.total ?? 0,
    pendentes: notificacoesPendentes[0]?.total ?? 0,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const cards = [
    {
      label: "Alunos ativos",
      value: stats.alunos,
      href: "/alunos",
      description: "Cadastrados e ativos no sistema",
      iconClass: "h-5 w-5 text-blue-600 dark:text-blue-400",
      iconBg: "p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Turmas ativas",
      value: stats.turmas,
      href: "/turmas",
      description: "Turmas em andamento",
      iconClass: "h-5 w-5 text-violet-600 dark:text-violet-400",
      iconBg: "p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30",
    },
    {
      label: "Notificações pendentes",
      value: stats.pendentes,
      href: "/notificacoes",
      description: "Emails aguardando envio",
      iconClass: "h-5 w-5 text-amber-600 dark:text-amber-400",
      iconBg: "p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30",
    },
  ] as const

  const icons = [Users, BookOpen, Bell]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão geral</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Acompanhe os indicadores operacionais do sistema Lum.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {cards.map(({ label, value, href, description, iconClass, iconBg }, i) => {
          const Icon = icons[i]!
          return (
            <Link key={label} href={href} className="group block">
              <Card className="overflow-hidden border-border/60 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start justify-between">
                    <div className={iconBg}>
                      <Icon className={iconClass} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-4xl font-bold tracking-tight tabular-nums">
                    {value.toString()}
                  </p>
                  <p className="font-medium text-sm mt-1">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
