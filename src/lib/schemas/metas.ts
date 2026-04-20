import { z } from "zod"

export const metaSchema = z.object({
  codigo:    z.string().min(1, "Código é obrigatório").max(30),
  nome:      z.string().min(1, "Nome é obrigatório").max(100),
  descricao: z.string().max(500).optional(),
})

export type MetaInput = z.infer<typeof metaSchema>
