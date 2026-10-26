import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    reporters: ["default", "json"],
    outputFile: { json: "reports/integration-results.json" },
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
})
