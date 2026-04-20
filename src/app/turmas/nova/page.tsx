import { TurmaForm } from "@/components/turmas/TurmaForm"
import Link from "next/link"

export default function NovaTurmaPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link href="/turmas" className="text-sm text-muted-foreground hover:underline">← Turmas</Link>
        <h1 className="text-2xl font-bold mt-2">Nova turma</h1>
      </div>
      <TurmaForm />
    </div>
  )
}
