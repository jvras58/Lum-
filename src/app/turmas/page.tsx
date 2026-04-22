import { db } from "@/db"
import { turmas } from "@/db/schema"
import { asc, ilike } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, BookPlus, Search, Calendar, ArrowRight } from "lucide-react"

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
            Turmas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rows.length} turma{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/turmas/nova">
            <BookPlus className="h-4 w-4" />
            Nova turma
          </Link>
        </Button>
      </div>

      <form method="GET" className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por tópico…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Buscar</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/turmas">Limpar</Link>
          </Button>
        )}
      </form>

      <div className="grid gap-2.5">
        {rows.map((turma) => (
          <div
            key={String(turma.id)}
            className="rounded-lg border border-border/60 bg-card px-5 py-4 flex items-center justify-between transition-colors hover:bg-muted/20 group"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{turma.topico}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {turma.ano} — {turma.semestre}º semestre
                </p>
                {turma.descricao && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm line-clamp-1">
                    {turma.descricao}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={turma.ativa ? "success" : "muted"}>
                {turma.ativa ? "Ativa" : "Inativa"}
              </Badge>
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link href={`/turmas/${turma.id}`}>
                  Ver detalhe
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/25 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {q ? `Nenhuma turma encontrada para "${q}".` : "Nenhuma turma cadastrada."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
