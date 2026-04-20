import "server-only"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL environment variable. Copy .env.example to .env and set DATABASE_URL before starting the app."
  )
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
})

export const db = drizzle(pool, { schema })
