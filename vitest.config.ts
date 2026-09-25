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
