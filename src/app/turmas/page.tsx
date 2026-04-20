import { db } from "@/db"
import { turmas } from "@/db/schema"
import { asc, ilike } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function TurmasPage({ searchParams }: Props) {
  const { q } = await searchParams

  const rows = await db
    .select()
    .from(turmas)
    .where(q ? ilike(turmas.topico, `%${q}%`) : undefined)
    .orderBy(asc(turmas.ano), asc(turmas.semestre), asc(turmas.topico))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turmas</h1>
          <p className="text-muted-foreground text-sm">{rows.length} turma(s)</p>
        </div>
        <Button asChild>
          <Link href="/turmas/nova">Nova turma</Link>
        </Button>
      </div>

      <form method="GET" className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por tópico…"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">Buscar</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/turmas">Limpar</Link>
          </Button>
        )}
      </form>

      <div className="grid gap-3">
        {rows.map((turma) => (
          <div
            key={String(turma.id)}
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="font-medium">{turma.topico}</p>
              <p className="text-sm text-muted-foreground">
                {turma.ano} — {turma.semestre}º semestre
              </p>
              {turma.descricao && (
                <p className="text-xs text-muted-foreground mt-1">{turma.descricao}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={turma.ativa ? "success" : "muted"}>
                {turma.ativa ? "Ativa" : "Inativa"}
              </Badge>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/turmas/${turma.id}`}>Ver detalhe →</Link>
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {q ? `Nenhuma turma encontrada para "${q}".` : "Nenhuma turma cadastrada."}
          </p>
        )}
      </div>
    </div>
  )
}
