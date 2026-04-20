"use client"

import { useState, useTransition, useCallback } from "react"
import { toast } from "sonner"
import { saveBatchAvaliacoes } from "@/actions/avaliacoes"
import type { Conceito } from "@/lib/types"
import type { Aluno, Matricula, Meta, TurmaMeta, Avaliacao } from "@/db/schema"
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

type ColumnDef = TurmaMeta & { meta: Meta }
type RowDef = Matricula & { aluno: Aluno }

interface GradeEditorClientProps {
  turmaId: bigint
  columns: ColumnDef[]
  rows: RowDef[]
  initialAvaliacoes: Avaliacao[]
}

function cellKey(matriculaId: bigint, turmaMetaId: bigint) {
  return `${matriculaId}:${turmaMetaId}`
}

const CONCEITOS: Conceito[] = ["MANA", "MPA", "MA"]

const conceitoVariant: Record<Conceito, "success" | "warning" | "error"> = {
  MANA: "success",
  MPA:  "warning",
  MA:   "error",
}

export function GradeEditorClient({
  turmaId,
  columns,
  rows,
  initialAvaliacoes,
}: GradeEditorClientProps) {
  const [isPending, startTransition] = useTransition()

  const [pendingChanges, setPendingChanges] = useState<Map<string, Conceito>>(
    () => new Map()
  )

  const initialMap = new Map<string, Conceito>(
    initialAvaliacoes.map((a) => [
      cellKey(a.matriculaId, a.turmaMetaId),
      a.conceito as Conceito,
    ])
  )

  const isDirty = pendingChanges.size > 0

  const getDisplayConceito = useCallback(
    (matriculaId: bigint, turmaMetaId: bigint): Conceito | undefined => {
      const key = cellKey(matriculaId, turmaMetaId)
      return pendingChanges.get(key) ?? initialMap.get(key)
    },
    [pendingChanges, initialMap]
  )

  function handleCellChange(matriculaId: bigint, turmaMetaId: bigint, value: string) {
    if (!CONCEITOS.includes(value as Conceito)) return
    const key = cellKey(matriculaId, turmaMetaId)
    setPendingChanges((prev) => {
      const next = new Map(prev)
      next.set(key, value as Conceito)
      return next
    })
  }

  function handleSave() {
    if (!isDirty) return

    const items = Array.from(pendingChanges.entries()).map(([key, conceito]) => {
      const [matriculaId, turmaMetaId] = key.split(":").map(BigInt)
      return { matriculaId: matriculaId!, turmaMetaId: turmaMetaId!, conceito }
    })

    startTransition(async () => {
      const result = await saveBatchAvaliacoes(turmaId, items)
      if (result.success) {
        setPendingChanges(new Map())
        toast.success(`${result.data.saved} avaliação(ões) salva(s) com sucesso.`)
      } else {
        toast.error(result.error)
      }
    })
  }

  if (columns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8 border rounded-md">
        Nenhuma meta associada a esta turma. Associe metas no detalhe da turma.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {isDirty ? (
          <p className="text-sm text-muted-foreground">
            {pendingChanges.size} alteração(ões) não salva(s)
          </p>
        ) : (
          <span />
        )}
        <Button onClick={handleSave} disabled={!isDirty || isPending}>
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Aluno</TableHead>
              {columns.map((col) => (
                <TableHead key={String(col.id)} className="text-center min-w-[130px]">
                  {col.meta.nome}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={String(row.id)}>
                <TableCell className="font-medium">{row.aluno.nome}</TableCell>
                {columns.map((col) => {
                  const conceito = getDisplayConceito(row.id, col.id)
                  const hasPending = pendingChanges.has(cellKey(row.id, col.id))
                  return (
                    <TableCell key={String(col.id)} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <select
                          value={conceito ?? ""}
                          onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border bg-background focus:outline-none focus:ring-2 focus:ring-ring ${
                            hasPending ? "border-primary ring-1 ring-primary" : "border-input"
                          }`}
                        >
                          <option value="">—</option>
                          {CONCEITOS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        {conceito && !hasPending && (
                          <Badge variant={conceitoVariant[conceito]} className="text-[10px] px-1.5">
                            {conceito}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum aluno matriculado nesta turma.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
