"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { alunoSchema, type AlunoInput } from "@/lib/schemas/alunos"
import { createAluno, updateAluno } from "@/actions/alunos"
import type { Aluno } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface AlunoFormProps {
  aluno?: Aluno
  onSuccess?: () => void
}

export function AlunoForm({ aluno, onSuccess }: AlunoFormProps) {
  const form = useForm<AlunoInput>({
    resolver: zodResolver(alunoSchema),
    defaultValues: aluno
      ? { nome: aluno.nome, cpf: aluno.cpf, email: aluno.email }
      : { nome: "", cpf: "", email: "" },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    const result = aluno
      ? await updateAluno(aluno.id, data)
      : await createAluno(data)

    if (!result.success) {
      form.setError("root", { message: result.error })
      toast.error(result.error)
      return
    }

    toast.success(aluno ? "Aluno atualizado com sucesso." : "Aluno criado com sucesso.")
    onSuccess?.()
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
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Somente números (11 dígitos)"
                  maxLength={11}
                  disabled={!!aluno}
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting
            ? "Salvando…"
            : aluno
            ? "Salvar alterações"
            : "Criar aluno"}
        </Button>
      </form>
    </Form>
  )
}
