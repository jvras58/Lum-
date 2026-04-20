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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alunos</h1>
          <p className="text-muted-foreground text-sm">{rows.length} resultado(s)</p>
        </div>
        <Button asChild>
          <Link href="/alunos/novo">Novo aluno</Link>
        </Button>
      </div>

      <form method="GET" className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou CPF…"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">Buscar</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/alunos">Limpar</Link>
          </Button>
        )}
      </form>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((aluno) => (
              <TableRow key={String(aluno.id)}>
                <TableCell className="font-medium">{aluno.nome}</TableCell>
                <TableCell className="font-mono text-xs">{aluno.cpf}</TableCell>
                <TableCell>{aluno.email}</TableCell>
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
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum aluno encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
