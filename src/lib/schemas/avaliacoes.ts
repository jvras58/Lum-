import { z } from "zod"

export const conceitoSchema = z.enum(["MANA", "MPA", "MA"])

export const saveBatchSchema = z.object({
  turmaId: z.coerce.bigint(),
  items: z
    .array(
      z.object({
        matriculaId: z.coerce.bigint(),
        turmaMetaId: z.coerce.bigint(),
        conceito:    conceitoSchema,
      })
    )
    .min(1, "Ao menos uma avaliação é necessária")
    .max(500, "Máximo de 500 avaliações por lote"),
})

export type SaveBatchInput = z.infer<typeof saveBatchSchema>
