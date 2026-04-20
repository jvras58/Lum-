"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createTurma, updateTurma } from "@/actions/turmas"
import type { Turma } from "@/db/schema"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const turmaFormSchema = z.object({
  topico: z.string().min(2, "Mínimo 2 caracteres").max(150),
  descricao: z.string().max(500).optional(),
  ano: z.coerce.number().int().min(2000).max(2100),
  semestre: z.union([z.literal(1), z.literal(2)]),
})

type TurmaFormValues = z.infer<typeof turmaFormSchema>

interface Props {
  turma?: Turma
}

export function TurmaForm({ turma }: Props) {
  const router = useRouter()

  const form = useForm<TurmaFormValues, unknown, TurmaFormValues>({
    resolver: zodResolver(turmaFormSchema),
    defaultValues: turma
      ? {
          topico: turma.topico,
          descricao: turma.descricao ?? "",
          ano: turma.ano,
          semestre: turma.semestre as 1 | 2,
        }
      : {
          topico: "",
          descricao: "",
          ano: new Date().getFullYear(),
          semestre: 1,
        },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const result = turma
      ? await updateTurma(turma.id, values)
      : await createTurma(values)

    if (!result.success) {
      form.setError("root", { message: result.error })
      toast.error(result.error)
      return
    }

    toast.success(turma ? "Turma atualizada com sucesso." : "Turma criada com sucesso.")
    router.push("/turmas")
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
          name="topico"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tópico *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Matemática Básica" {...field} />
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
                <Textarea placeholder="Descrição opcional da turma" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ano"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano *</FormLabel>
                <FormControl>
                  <Input type="number" min={2000} max={2100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="semestre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Semestre *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v) as 1 | 2)}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1º semestre</SelectItem>
                    <SelectItem value="2">2º semestre</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Salvando…"
              : turma
              ? "Salvar alterações"
              : "Criar turma"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
