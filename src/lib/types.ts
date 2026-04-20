export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type Conceito = "MANA" | "MPA" | "MA"
export const CONCEITOS = ["MANA", "MPA", "MA"] as const satisfies readonly Conceito[]

export type MatriculaStatus = "ATIVA" | "CANCELADA" | "CONCLUIDA"
export const MATRICULA_STATUSES = ["ATIVA", "CANCELADA", "CONCLUIDA"] as const satisfies readonly MatriculaStatus[]

export type EmailStatus = "PENDENTE" | "ENVIADO" | "ERRO" | "CANCELADO"
export const EMAIL_STATUSES = ["PENDENTE", "ENVIADO", "ERRO", "CANCELADO"] as const satisfies readonly EmailStatus[]
