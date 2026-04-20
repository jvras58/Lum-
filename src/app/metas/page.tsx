import { db } from "@/db"
import { metas } from "@/db/schema"
import { asc } from "drizzle-orm"
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

export default async function MetasPage() {
  const rows = await db.select().from(metas).orderBy(asc(metas.codigo))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-muted-foreground text-sm">Catálogo de metas avaliativas</p>
        </div>
        <Button asChild>
          <Link href="/metas/nova">Nova meta</Link>
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((meta) => (
              <TableRow key={String(meta.id)}>
                <TableCell className="font-mono text-xs">{meta.codigo}</TableCell>
                <TableCell className="font-medium">{meta.nome}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {meta.descricao ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={meta.ativa ? "success" : "muted"}>
                    {meta.ativa ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/metas/${meta.id}`}>Editar</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma meta cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
