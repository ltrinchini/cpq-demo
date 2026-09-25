import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// In development the URL comes from `.env`; in deployment, from the environment.
if (existsSync(".env")) {
  process.loadEnvFile();
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set (see .env.example)");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
