import { z } from "zod"

export const alunoSchema = z.object({
  nome:  z.string().min(1, "Nome é obrigatório").max(150),
  cpf:   z.string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11, "CPF deve ter 11 dígitos numéricos"),
  email: z.string().email("Email inválido").max(255),
})

export type AlunoInput = z.infer<typeof alunoSchema>

export const alunoUpdateSchema = alunoSchema.partial().omit({ cpf: true })
export type AlunoUpdateInput = z.infer<typeof alunoUpdateSchema>
