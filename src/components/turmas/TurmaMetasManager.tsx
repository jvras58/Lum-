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
import { ChevronUp, ChevronDown, Target, Plus, Loader2 } from "lucide-react"

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
      {/* Metas associadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Metas associadas
          </h3>
          {isPending && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Atualizando…
            </span>
          )}
        </div>

        {localOrder.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center">
            <Target className="h-6 w-6 text-muted-foreground/25 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma meta associada ainda.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16 font-semibold text-foreground">Ordem</TableHead>
                  <TableHead className="font-semibold text-foreground">Meta</TableHead>
                  <TableHead className="w-36 text-right font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localOrder.map((tm, index) => (
                  <TableRow key={String(tm.id)} className="hover:bg-muted/20">
                    <TableCell>
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{tm.meta.nome}</span>
                      <span className="ml-2 font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {tm.meta.codigo}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={isPending || index === 0}
                          onClick={() => handleMove(index, "up")}
                          aria-label="Mover para cima"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={isPending || index === localOrder.length - 1}
                          onClick={() => handleMove(index, "down")}
                          aria-label="Mover para baixo"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDesassociar(tm.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-1"
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

      {/* Metas disponíveis para adicionar */}
      {unassigned.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            Adicionar meta
          </h3>
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableBody>
                {unassigned.map((meta) => (
                  <TableRow key={String(meta.id)} className="hover:bg-muted/20">
                    <TableCell>
                      <span className="font-medium text-sm">{meta.nome}</span>
                      <span className="ml-2 font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {meta.codigo}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleAssociar(meta.id)}
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
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
    </div>
  )
}
