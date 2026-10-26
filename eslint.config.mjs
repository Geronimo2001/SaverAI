import js from "@eslint/js"
import tseslint from "typescript-eslint"
import sonarjs from "eslint-plugin-sonarjs"

export default [
  { ignores: ["node_modules/**", "dist/**", "coverage/**", "reports/**"] },
  {
    files: ["server/**/*.ts"],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: "latest", sourceType: "module" } },
    plugins: { "@typescript-eslint": tseslint.plugin, sonarjs },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.at(-1).rules,
      ...sonarjs.configs.recommended.rules,
      "no-undef": "off", // TypeScript comprueba nombres y tipos del entorno Node.
      "no-unused-vars": "off",
    },
  },
]
