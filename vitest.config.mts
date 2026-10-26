import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    reporters: ["default", "json"],
    outputFile: { json: "reports/unit-results.json" },
    coverage: {
      provider: "v8",
      include: ["server/**/*.ts"],
      reportsDirectory: "coverage/unit",
      reporter: ["text", "html", "lcov", "json-summary"],
      // Incluir también archivos sin pruebas. El gate se incorpora en el paso de CI.
    },
  },
})
