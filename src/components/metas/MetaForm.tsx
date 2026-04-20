"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createMeta, updateMeta } from "@/actions/metas"
import type { Meta } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const metaSchema = z.object({
  codigo: z.string().min(1).max(30),
  nome: z.string().min(2).max(100),
  descricao: z.string().max(500).optional(),
})

type MetaFormValues = z.infer<typeof metaSchema>

interface Props {
  meta?: Meta
}

export function MetaForm({ meta }: Props) {
  const router = useRouter()

  const form = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: meta
      ? { codigo: meta.codigo, nome: meta.nome, descricao: meta.descricao ?? "" }
      : { codigo: "", nome: "", descricao: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const result = meta
      ? await updateMeta(meta.id, values)
      : await createMeta(values)

    if (!result.success) {
      form.setError("root", { message: result.error })
      toast.error(result.error)
      return
    }

    toast.success(meta ? "Meta atualizada com sucesso." : "Meta criada com sucesso.")
    router.push("/metas")
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        {form.formState.errors.root && (
          <p className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {form.formState.errors.root.message}
          </p>
        )}

        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: META-01"
                  disabled={!!meta}
                  className="font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome da meta avaliativa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição opcional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Salvando…"
              : meta
              ? "Salvar alterações"
              : "Criar meta"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
