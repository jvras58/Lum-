import { db } from "@/db"
import { metas } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { MetaForm } from "@/components/metas/MetaForm"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function MetaEditPage({ params }: Props) {
  const { id } = await params
  const meta = await db.query.metas.findFirst({ where: eq(metas.id, BigInt(id)) })
  if (!meta) notFound()

  return (
    <div className="max-w-md space-y-6">
      <div>
        <Link href="/metas" className="text-sm text-muted-foreground hover:underline">← Metas</Link>
        <h1 className="text-2xl font-bold mt-2">Editar meta</h1>
      </div>
      <MetaForm meta={meta} />
    </div>
  )
}
