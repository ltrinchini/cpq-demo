import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Next.js loads `.env` itself; this covers scripts and tests run outside it
// (mirrors the same check in drizzle.config.ts).
if (existsSync(".env")) {
  process.loadEnvFile();
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set (see .env.example)");
}

export const db = drizzle(postgres(url), { schema });
