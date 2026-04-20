import { db } from "@/db"
import { alunos, turmas, metas, turmaMetas, matriculas } from "@/db/schema"

let _seq = 0
const seq = () => String(++_seq).padStart(11, "0")

export async function seedAluno(overrides?: Partial<{ nome: string; cpf: string; email: string }>) {
  const s = seq()
  const [row] = await db
    .insert(alunos)
    .values({
      nome: overrides?.nome ?? `Aluno ${s}`,
      cpf: overrides?.cpf ?? s,
      email: overrides?.email ?? `aluno${s}@test.com`,
    })
    .returning()
  return row!
}

export async function seedTurma(
  overrides?: Partial<{ topico: string; ano: number; semestre: 1 | 2 }>
) {
  const s = seq()
  const [row] = await db
    .insert(turmas)
    .values({
      topico: overrides?.topico ?? `Turma ${s}`,
      ano: overrides?.ano ?? 2026,
      semestre: overrides?.semestre ?? 1,
    })
    .returning()
  return row!
}

export async function seedMeta(overrides?: Partial<{ codigo: string; nome: string }>) {
  const s = seq()
  const [row] = await db
    .insert(metas)
    .values({
      codigo: overrides?.codigo ?? `M${s}`,
      nome: overrides?.nome ?? `Meta ${s}`,
    })
    .returning()
  return row!
}

export async function seedTurmaMeta(turmaId: bigint, metaId: bigint, ordem = 1) {
  const [row] = await db
    .insert(turmaMetas)
    .values({ turmaId, metaId, ordemExibicao: ordem })
    .returning()
  return row!
}

export async function seedMatricula(turmaId: bigint, alunoId: bigint) {
  const [row] = await db
    .insert(matriculas)
    .values({ turmaId, alunoId, status: "ATIVA" })
    .returning()
  return row!
}
