import { afterEach, beforeAll } from "vitest"
import { sql } from "drizzle-orm"
import { db } from "@/db"
import {
  emailResumoItens,
  emailResumosDiarios,
  avaliacoesHistorico,
  avaliacoes,
  matriculas,
  turmaMetas,
  metas,
  turmas,
  alunos,
} from "@/db/schema"

beforeAll(async () => {
  await db.execute(sql`SELECT 1`)
})

afterEach(async () => {
  // Delete in FK-safe order (deepest children first)
  await db.delete(emailResumoItens)
  await db.delete(emailResumosDiarios)
  await db.delete(avaliacoesHistorico)
  await db.delete(avaliacoes)
  await db.delete(matriculas)
  await db.delete(turmaMetas)
  await db.delete(metas)
  await db.delete(turmas)
  await db.delete(alunos)
})
