import "dotenv/config"
import type { Config } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL environment variable. Copy .env.example to .env and set DATABASE_URL before running drizzle commands."
  )
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config
