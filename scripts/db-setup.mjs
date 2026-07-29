// Aplica db/schema.sql sobre la base de Neon.
// Uso: npm run db:setup
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

dotenv.config({ path: [join(root, ".env.local"), join(root, ".env")], quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Copiá .env.example a .env.local y completalo.");
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync(join(root, "db", "schema.sql"), "utf8");

// El driver HTTP de Neon ejecuta una sentencia por vez.
const statements = schema
  .split(";")
  .map((chunk) =>
    chunk
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim()
  )
  .filter((statement) => statement.length > 0);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Esquema aplicado (${statements.length} sentencias).`);
