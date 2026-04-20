import { MetaForm } from "@/components/metas/MetaForm"
import Link from "next/link"

export default function NovaMetaPage() {
  return (
    <div className="max-w-md space-y-6">
      <div>
        <Link href="/metas" className="text-sm text-muted-foreground hover:underline">← Metas</Link>
        <h1 className="text-2xl font-bold mt-2">Nova meta</h1>
      </div>
      <MetaForm />
    </div>
  )
}
