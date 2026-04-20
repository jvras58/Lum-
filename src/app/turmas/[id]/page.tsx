import { db } from "@/db"
import { turmas, turmaMetas, matriculas } from "@/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href="/turmas">← Turmas</Link>
        </Button>
        <h1 className="text-2xl font-bold">{turma.topico}</h1>
        <p className="text-muted-foreground text-sm">
          {turma.ano} — {turma.semestre}º semestre
        </p>
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/turmas/${id}/avaliacoes`}>Abrir grade de avaliações</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/turmas/${id}/editar`}>Editar turma</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Alunos matriculados</h2>
            <span className="text-sm text-muted-foreground">
              {activeEnrolled.length} ativo(s)
            </span>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolled.map((m) => (
                  <TableRow key={String(m.id)}>
                    <TableCell>{m.aluno.nome}</TableCell>
                    <TableCell>
                      <Badge variant={m.status === "ATIVA" ? "success" : "muted"}>
                        {m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {enrolled.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                      Nenhum aluno
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Metas da turma</h2>
            <span className="text-sm text-muted-foreground">
              {assigned.length} meta(s)
            </span>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ordem</TableHead>
                  <TableHead>Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assigned.map((tm) => (
                  <TableRow key={String(tm.id)}>
                    <TableCell className="text-muted-foreground">{tm.ordemExibicao}</TableCell>
                    <TableCell>{tm.meta.nome}</TableCell>
                  </TableRow>
                ))}
                {assigned.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                      Nenhuma meta
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
