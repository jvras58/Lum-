import { db } from "@/db"
import { alunos } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { AlunoForm } from "@/components/alunos/AlunoForm"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AlunoEditPage({ params }: Props) {
  const { id } = await params

  if (id === "novo") {
    return (
      <div className="max-w-md space-y-6">
        <div>
          <Link
            href="/alunos"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Alunos
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-3">Novo aluno</h1>
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
        <Link
          href="/alunos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Alunos
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-3">Editar aluno</h1>
      </div>
      <AlunoForm aluno={aluno} />
    </div>
  )
}
