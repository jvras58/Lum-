import { db } from "@/db"
import { turmas, turmaMetas, matriculas, avaliacoes } from "@/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { GradeEditorClient } from "@/components/avaliacoes/GradeEditorClient"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AvaliacoesPage({ params }: Props) {
  const { id } = await params
  const turmaId = BigInt(id)

  const turma = await db.query.turmas.findFirst({
    where: eq(turmas.id, turmaId),
  })
  if (!turma) notFound()

  const [columns, rows, existingAvaliacoes] = await Promise.all([
    db.query.turmaMetas.findMany({
      where: and(eq(turmaMetas.turmaId, turmaId), eq(turmaMetas.ativa, true)),
      with: { meta: true },
      orderBy: [asc(turmaMetas.ordemExibicao)],
    }),
    db.query.matriculas.findMany({
      where: and(eq(matriculas.turmaId, turmaId), eq(matriculas.status, "ATIVA")),
      with: { aluno: true },
      orderBy: [asc(matriculas.id)],
    }),
    db.select().from(avaliacoes).where(eq(avaliacoes.turmaId, turmaId)),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/turmas/${id}`} className="text-muted-foreground text-sm hover:underline">
          ← {turma.topico}
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">Grade de Avaliações</h1>
        <p className="text-muted-foreground text-sm">
          {turma.topico} — {turma.ano}/{turma.semestre}º sem.
        </p>
      </div>
      <GradeEditorClient
        turmaId={turmaId}
        columns={columns}
        rows={rows}
        initialAvaliacoes={existingAvaliacoes}
      />
    </div>
  )
}
