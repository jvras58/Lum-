import { z } from "zod"

export const turmaSchema = z.object({
  topico:    z.string().min(1, "Tópico é obrigatório").max(150),
  descricao: z.string().max(500).optional(),
  ano:       z.coerce.number().int().min(2000).max(2100),
  semestre:  z.coerce.number().int().refine((v) => v === 1 || v === 2, "Semestre deve ser 1 ou 2"),
})

export type TurmaInput = z.infer<typeof turmaSchema>
