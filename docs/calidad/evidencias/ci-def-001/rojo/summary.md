# Calidad del backend — RECHAZADO

| Etapa | Resultado |
| --- | --- |
| typecheck | OK |
| server:typecheck | OK |
| test:typecheck | OK |
| build:server | OK |
| lint:report | OK |
| duplication | OK |
| test:coverage | FALLO |
| test:integration | OK |
| quality:gate | FALLO |

```json
{
  "passed": false,
  "error": "ENOENT: no such file or directory, open 'coverage/unit/lcov.info'"
}
```

Alcance: backend server/**/*.ts; no es cobertura de toda la app.
