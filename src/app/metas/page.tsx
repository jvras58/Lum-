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
import { Target, Plus } from "lucide-react"

export default async function MetasPage() {
  const rows = await db.select().from(metas).orderBy(asc(metas.codigo))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Target className="h-6 w-6 text-primary" />
            Metas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Catálogo de metas avaliativas</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/metas/nova">
            <Plus className="h-4 w-4" />
            Nova meta
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-foreground">Código</TableHead>
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">Descrição</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((meta) => (
              <TableRow key={String(meta.id)} className="hover:bg-muted/20">
                <TableCell>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {meta.codigo}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{meta.nome}</TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-xs">
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
                <TableCell colSpan={5} className="text-center text-muted-foreground py-14">
                  <div className="flex flex-col items-center gap-2">
                    <Target className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Nenhuma meta cadastrada.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
