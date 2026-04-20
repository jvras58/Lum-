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
      className="text-destructive hover:text-destructive"
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
      <div className="border rounded-md py-8 text-center text-muted-foreground text-sm">
        Nenhuma notificação encontrada.
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Data ref.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Tentativas</TableHead>
            <TableHead>Gerado em</TableHead>
            <TableHead>Enviado em</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={String(row.id)}>
              <TableCell>
                <p className="font-medium">{row.aluno.nome}</p>
                <p className="text-xs text-muted-foreground">{row.aluno.email}</p>
              </TableCell>
              <TableCell className="font-mono text-xs">
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
              <TableCell className="text-center">{row.tentativas}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {row.geradoEm ? new Date(row.geradoEm).toLocaleString("pt-BR") : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
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
