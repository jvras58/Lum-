import { db } from "@/db"
import { alunos } from "@/db/schema"
import { eq, ilike, or } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, UserPlus, Search } from "lucide-react"

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function AlunosPage({ searchParams }: Props) {
  const { q } = await searchParams

  const rows = await db
    .select()
    .from(alunos)
    .where(
      q
        ? or(
            ilike(alunos.nome, `%${q}%`),
            ilike(alunos.cpf, `%${q.replace(/\D/g, "")}%`)
          )
        : eq(alunos.ativo, true)
    )
    .orderBy(alunos.nome)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-primary" />
            Alunos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rows.length} resultado{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/alunos/novo">
            <UserPlus className="h-4 w-4" />
            Novo aluno
          </Link>
        </Button>
      </div>

      <form method="GET" className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou CPF…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Buscar</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/alunos">Limpar</Link>
          </Button>
        )}
      </form>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">CPF</TableHead>
              <TableHead className="font-semibold text-foreground">Email</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((aluno) => (
              <TableRow key={String(aluno.id)} className="hover:bg-muted/20">
                <TableCell className="font-medium">{aluno.nome}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {aluno.cpf}
                </TableCell>
                <TableCell className="text-sm">{aluno.email}</TableCell>
                <TableCell>
                  <Badge variant={aluno.ativo ? "success" : "muted"}>
                    {aluno.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/alunos/${aluno.id}`}>Editar</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-14">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Nenhum aluno encontrado.</p>
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
