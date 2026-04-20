import { db } from "@/db"
import { turmas, turmaMetas, metas } from "@/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { TurmaForm } from "@/components/turmas/TurmaForm"
import { TurmaMetasManager } from "@/components/turmas/TurmaMetasManager"

interface Props {
  params: Promise<{ id: string }>
}

export default async function TurmaEditPage({ params }: Props) {
  const { id } = await params
  const turmaId = BigInt(id)

  const [turma, assigned, allMetas] = await Promise.all([
    db.query.turmas.findFirst({ where: eq(turmas.id, turmaId) }),
    db.query.turmaMetas.findMany({
      where: eq(turmaMetas.turmaId, turmaId),
      with: { meta: true },
      orderBy: [asc(turmaMetas.ordemExibicao)],
    }),
    db.select().from(metas).where(eq(metas.ativa, true)).orderBy(asc(metas.nome)),
  ])

  if (!turma) notFound()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href={`/turmas/${id}`} className="text-sm text-muted-foreground hover:underline">← Turma</Link>
        <h1 className="text-2xl font-bold mt-2">Editar turma</h1>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Dados gerais</h2>
        <TurmaForm turma={turma} />
      </div>

      <hr />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Metas da turma</h2>
        <TurmaMetasManager turmaId={turmaId} assigned={assigned} available={allMetas} />
      </div>
    </div>
  )
}
