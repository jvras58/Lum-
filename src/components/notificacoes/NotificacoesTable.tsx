"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { cancelarResumo } from "@/actions/notificacoes"
import type { EmailResumoDiario, Aluno } from "@/db/schema"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Bell } from "lucide-react"

type Row = EmailResumoDiario & { aluno: Aluno }

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  PENDENTE: "warning",
  ENVIADO: "success",
  ERRO: "error",
  CANCELADO: "muted",
}

function CancelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleCancel = () => {
    if (!confirm("Cancelar este envio?")) return
    startTransition(async () => {
      const result = await cancelarResumo(id)
      if (result.success) {
        toast.success("Resumo cancelado.")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancel}
      disabled={isPending}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      {isPending ? "…" : "Cancelar"}
    </Button>
  )
}

interface Props {
  rows: Row[]
}

export function NotificacoesTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-14 text-center">
        <Bell className="h-8 w-8 text-muted-foreground/25 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Nenhuma notificação encontrada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="font-semibold text-foreground">Aluno</TableHead>
            <TableHead className="font-semibold text-foreground">Data ref.</TableHead>
            <TableHead className="font-semibold text-foreground">Status</TableHead>
            <TableHead className="font-semibold text-foreground text-center">Tentativas</TableHead>
            <TableHead className="font-semibold text-foreground">Gerado em</TableHead>
            <TableHead className="font-semibold text-foreground">Enviado em</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={String(row.id)} className="hover:bg-muted/20">
              <TableCell>
                <p className="font-medium text-sm">{row.aluno.nome}</p>
                <p className="text-xs text-muted-foreground">{row.aluno.email}</p>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {String(row.dataReferencia)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
                  {row.status}
                </Badge>
                {row.status === "ERRO" && row.erroUltimoEnvio && (
                  <p
                    className="text-xs text-destructive mt-1 max-w-xs truncate"
                    title={row.erroUltimoEnvio}
                  >
                    {row.erroUltimoEnvio}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-center tabular-nums">{row.tentativas}</TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {row.geradoEm ? new Date(row.geradoEm).toLocaleString("pt-BR") : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {row.enviadoEm ? new Date(row.enviadoEm).toLocaleString("pt-BR") : "—"}
              </TableCell>
              <TableCell className="text-right">
                {(row.status === "PENDENTE" || row.status === "ERRO") && (
                  <CancelButton id={String(row.id)} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
