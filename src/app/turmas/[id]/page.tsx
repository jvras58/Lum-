import { db } from "@/db"
import { turmas, turmaMetas, matriculas } from "@/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, GraduationCap, Users, Target, LayoutGrid, Pencil } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function TurmaDetailPage({ params }: Props) {
  const { id } = await params
  const turmaId = BigInt(id)

  const turma = await db.query.turmas.findFirst({ where: eq(turmas.id, turmaId) })
  if (!turma) notFound()

  const [enrolled, assigned] = await Promise.all([
    db.query.matriculas.findMany({
      where: eq(matriculas.turmaId, turmaId),
      with: { aluno: true },
      orderBy: [asc(matriculas.id)],
    }),
    db.query.turmaMetas.findMany({
      where: and(eq(turmaMetas.turmaId, turmaId), eq(turmaMetas.ativa, true)),
      with: { meta: true },
      orderBy: [asc(turmaMetas.ordemExibicao)],
    }),
  ])

  const activeEnrolled = enrolled.filter((m) => m.status === "ATIVA")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/turmas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Turmas
        </Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-primary" />
              {turma.topico}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {turma.ano} — {turma.semestre}º semestre
            </p>
          </div>
          <Badge variant={turma.ativa ? "success" : "muted"} className="mt-1">
            {turma.ativa ? "Ativa" : "Inativa"}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        <Button asChild className="gap-2">
          <Link href={`/turmas/${id}/avaliacoes`}>
            <LayoutGrid className="h-4 w-4" />
            Abrir grade de avaliações
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/turmas/${id}/editar`}>
            <Pencil className="h-4 w-4" />
            Editar turma
          </Link>
        </Button>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Alunos matriculados
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {activeEnrolled.length} ativo{activeEnrolled.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground">Nome</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolled.map((m) => (
                  <TableRow key={String(m.id)} className="hover:bg-muted/20">
                    <TableCell className="text-sm">{m.aluno.nome}</TableCell>
                    <TableCell>
                      <Badge variant={m.status === "ATIVA" ? "success" : "muted"}>
                        {m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {enrolled.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum aluno matriculado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Metas da turma
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {assigned.length} meta{assigned.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16 font-semibold text-foreground">Ordem</TableHead>
                  <TableHead className="font-semibold text-foreground">Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assigned.map((tm) => (
                  <TableRow key={String(tm.id)} className="hover:bg-muted/20">
                    <TableCell>
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {tm.ordemExibicao}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{tm.meta.nome}</TableCell>
                  </TableRow>
                ))}
                {assigned.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhuma meta associada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
