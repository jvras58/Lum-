import { db } from "@/db"
import { alunos } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { AlunoForm } from "@/components/alunos/AlunoForm"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AlunoEditPage({ params }: Props) {
  const { id } = await params

  if (id === "novo") {
    return (
      <div className="max-w-md space-y-6">
        <div>
          <Link href="/alunos" className="text-sm text-muted-foreground hover:underline">← Alunos</Link>
          <h1 className="text-2xl font-bold mt-2">Novo aluno</h1>
        </div>
        <AlunoForm />
      </div>
    )
  }

  const aluno = await db.query.alunos.findFirst({ where: eq(alunos.id, BigInt(id)) })
  if (!aluno) notFound()

  return (
    <div className="max-w-md space-y-6">
      <div>
        <Link href="/alunos" className="text-sm text-muted-foreground hover:underline">← Alunos</Link>
        <h1 className="text-2xl font-bold mt-2">Editar aluno</h1>
      </div>
      <AlunoForm aluno={aluno} />
    </div>
  )
}
