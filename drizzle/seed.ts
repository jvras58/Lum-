import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "../src/db/schema"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL environment variable. Copy .env.example to .env and set DATABASE_URL before running pnpm db:seed."
  )
}

const pool = new Pool({ connectionString: databaseUrl })
const db = drizzle(pool, { schema })

async function seed() {
  console.log("Seeding database…")

  // Metas
  const [metaP1, metaP2, metaP3] = await db
    .insert(schema.metas)
    .values([
      { codigo: "P1", nome: "Participação", descricao: "Engajamento e presença nas aulas" },
      { codigo: "P2", nome: "Trabalhos", descricao: "Entrega e qualidade dos trabalhos" },
      { codigo: "P3", nome: "Prova Final", descricao: "Avaliação escrita final" },
    ])
    .onConflictDoNothing()
    .returning()

  console.log(`Metas: ${[metaP1, metaP2, metaP3].filter(Boolean).length} inseridas`)

  // Turmas
  const [turma] = await db
    .insert(schema.turmas)
    .values([{ topico: "Matemática Básica", ano: 2026, semestre: 1 }])
    .onConflictDoNothing()
    .returning()

  if (!turma) {
    console.log("Turma já existente, pulando restante do seed.")
    await pool.end()
    return
  }

  console.log(`Turma: ${turma.topico}`)

  // Buscar metas inseridas
  const metasRows = await db.select().from(schema.metas).limit(3)
  if (metasRows.length === 0) {
    console.log("Nenhuma meta encontrada para associar.")
    await pool.end()
    return
  }

  // TurmaMetas
  await db.insert(schema.turmaMetas).values(
    metasRows.map((m, i) => ({
      turmaId: turma.id,
      metaId: m.id,
      ordemExibicao: i + 1,
    }))
  ).onConflictDoNothing()

  // Alunos
  const alunosData = [
    { nome: "Ana Silva", cpf: "11122233344", email: "ana@example.com" },
    { nome: "Bruno Costa", cpf: "22233344455", email: "bruno@example.com" },
    { nome: "Carla Mendes", cpf: "33344455566", email: "carla@example.com" },
  ]

  const insertedAlunos = await db
    .insert(schema.alunos)
    .values(alunosData)
    .onConflictDoNothing()
    .returning()

  console.log(`Alunos: ${insertedAlunos.length} inseridos`)

  // Matrículas
  const alunosRows = await db.select().from(schema.alunos).limit(3)
  for (const aluno of alunosRows) {
    await db.insert(schema.matriculas).values({
      turmaId: turma.id,
      alunoId: aluno.id,
      status: "ATIVA",
    }).onConflictDoNothing()
  }

  console.log("Seed concluído.")
  await pool.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
