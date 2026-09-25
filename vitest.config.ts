import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    passWithNoTests: true,
    // Integration tests share one real Postgres database (`lib/db/*.test.ts`,
    // `lib/actions.test.ts`) and each wipes the visitors table in
    // `beforeEach`: file-level parallelism would let them race each other.
    fileParallelism: false,
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["lib/pricing/**"],
      reporter: ["text", "html"],
      thresholds: {
        "lib/pricing/**": { 100: true },
      },
    },
  },
});
