import { db } from "@/db"
import { alunos, turmas, emailResumosDiarios } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    { label: "Alunos ativos",         value: stats.alunos,    href: "/alunos" },
    { label: "Turmas ativas",          value: stats.turmas,    href: "/turmas" },
    { label: "Notificações pendentes", value: stats.pendentes, href: "/notificacoes" },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão operacional do sistema</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {cards.map(({ label, value, href }) => (
          <Link key={label} href={href} className="block">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{value.toString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
