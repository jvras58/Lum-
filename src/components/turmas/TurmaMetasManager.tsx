"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { associarMetaTurma, desassociarMetaTurma } from "@/actions/matriculas"
import { reorderMetas } from "@/actions/metas"
import type { Meta } from "@/db/schema"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronUp, ChevronDown } from "lucide-react"

interface AssignedMeta {
  id: bigint
  metaId: bigint
  ordemExibicao: number
  meta: Meta
}

interface Props {
  turmaId: bigint
  assigned: AssignedMeta[]
  available: Meta[]
}

export function TurmaMetasManager({ turmaId, assigned, available }: Props) {
  const [isPending, startTransition] = useTransition()

  const [localOrder, setLocalOrder] = useState<AssignedMeta[]>(() =>
    [...assigned].sort((a, b) => a.ordemExibicao - b.ordemExibicao)
  )

  const assignedIds = new Set(localOrder.map((a) => String(a.metaId)))
  const unassigned = available.filter((m) => !assignedIds.has(String(m.id)))

  const handleAssociar = (metaId: bigint) => {
    startTransition(async () => {
      const result = await associarMetaTurma(turmaId, metaId, localOrder.length + 1)
      if (result.success) {
        toast.success("Meta associada.")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDesassociar = (turmaMetaId: bigint) => {
    startTransition(async () => {
      const result = await desassociarMetaTurma(turmaMetaId)
      if (result.success) {
        toast.success("Meta removida da turma.")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= localOrder.length) return

    const prev = [...localOrder]
    const next = [...localOrder]
    ;[next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!]

    setLocalOrder(next)

    startTransition(async () => {
      const result = await reorderMetas(
        turmaId,
        next.map((a) => a.metaId)
      )
      if (!result.success) {
        setLocalOrder(prev)
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Metas associadas
        </h3>
        {localOrder.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
            Nenhuma meta associada ainda.
          </p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ordem</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localOrder.map((tm, index) => (
                  <TableRow key={String(tm.id)}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <span className="font-medium">{tm.meta.nome}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {tm.meta.codigo}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending || index === 0}
                          onClick={() => handleMove(index, "up")}
                          aria-label="Mover para cima"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending || index === localOrder.length - 1}
                          onClick={() => handleMove(index, "down")}
                          aria-label="Mover para baixo"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDesassociar(tm.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {unassigned.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Adicionar meta
          </h3>
          <div className="border rounded-md">
            <Table>
              <TableBody>
                {unassigned.map((meta) => (
                  <TableRow key={String(meta.id)}>
                    <TableCell>
                      <span className="font-medium">{meta.nome}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {meta.codigo}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleAssociar(meta.id)}
                      >
                        Associar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {isPending && (
        <p className="text-xs text-muted-foreground">Atualizando…</p>
      )}
    </div>
  )
}
