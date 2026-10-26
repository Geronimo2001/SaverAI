# Pipeline, compilación y quality gate

## Alcance y referencia inicial

Se evalúa el backend `server/**/*.ts`. La referencia fija es `cf5cc7d7184c79f32acfd22ecaa8b9dca8ca96c1`, HEAD al comenzar el TP y revisión principal de GitHub verificada antes de publicar esta etapa. Los cambios locales previos relevados eran de la interfaz; los archivos del backend coincidían con ese commit.

El gate lee las líneas ejecutables y sus ejecuciones de `coverage/unit/lcov.info` y compara cada archivo actual con esa referencia mediante `git diff --no-index --unified=0`:

- Existentes: líneas ejecutables actuales que no aparecen agregadas/modificadas en la comparación.
- Nuevas: líneas ejecutables agregadas/modificadas; un archivo nuevo cuenta íntegramente como nuevo.
- Líneas eliminadas: no forman parte del código actual ni de su denominador.
- Líneas movidas a un archivo nuevo cuentan como nuevas. Es una regla explícita, no detección semántica de renombres.
- Comentarios, espacios, tipos y otras líneas sin entrada ejecutable LCOV no se agregan artificialmente al denominador.
- Sin líneas en un grupo: porcentaje nulo/no aplicable; no se afirma 100 % de cobertura.

Los conteos se comparan sin redondeo. Cada archivo del backend debe aparecer en los reportes. Una referencia ausente o un reporte faltante/incompatible hace fallar el gate. El ejecutor limpia sus salidas regenerables antes de correr para evitar aprobar con reportes de otra ejecución.

Esto resuelve la separación de cobertura **del módulo**. La aceptación por la cátedra de ese alcance, en lugar de toda la app, sigue pendiente.

## Herramientas y reglas

- Compilador TypeScript: `tsconfig.build.json` genera JavaScript y source maps en `dist/server/`. Es una compilación efectiva, distinta de `--noEmit`.
- ESLint 10, TypeScript ESLint y perfil recomendado de SonarJS: análisis de los archivos del backend, con reporte JSON.
- jscpd 5: clones exactos con mínimo de 5 líneas y 50 tokens, modo mild. El porcentaje y esos parámetros se publican juntos; no es un porcentaje universal independiente del detector.
- Vitest y V8: pruebas y cobertura, incluyendo archivos sin pruebas.
- Gate propio: reglas explícitas en `quality.config.json`, con pruebas de límites 50/80 y de clasificación de cambios.
- GitHub Actions: PostgreSQL 15 efímero y Node 24; dependencias instaladas con el lockfile. La base CI se crea con los mismos controles de aislamiento locales.

El gate rechaza cobertura existente menor al 50 %, nueva menor al 80 %, duplicación mayor al 5 %, cualquier error o advertencia de ESLint y cualquier suite fallida, omitida o sin casos. El runner además falla si no pasa compilación o comprobación de tipos. Se adopta una política de cero errores de análisis, más estricta que bloquear solo bugs críticos detectados. **SonarJS en ESLint no es un servidor SonarQube ni usa su clasificación de severidades**; cero errores del analizador no demuestra ausencia de todos los bugs o vulnerabilidades del sistema. El gate no audita dependencias npm en esta etapa.

## Ejecución

```bash
npm run quality:check
```

Requiere `.env.test.local` o `TEST_DATABASE_URL` para la base aislada y PostgreSQL activo. Ejecuta todas las etapas, guarda sus códigos de salida y devuelve error si falla cualquiera:

1. Tipos de app, backend y pruebas.
2. Compilación del backend.
3. Análisis estático.
4. Duplicación.
5. Unitarias con cobertura.
6. Integración SQL y HTTP.
7. Gate y resumen automático.

Las salidas se regeneran en `reports/`, `coverage/unit/` y `dist/server/`. `reports/pipeline-local.json` contiene tiempos y estados de cada etapa; `quality-gate.json` contiene umbrales, conteos y detalle por archivo; `summary.md` resume el resultado y se publica también como resumen del job en Actions.

El workflow `.github/workflows/quality.yml` se dispara por PR, push a `main` o ramas `codex/**` y ejecución manual. Siempre intenta archivar reportes, cobertura y compilación, incluso cuando falla. No realiza un despliegue ni configura protección de ramas; para impedir merges desde la interfaz de GitHub se deberá exigir el check `quality` en las reglas del repositorio.

## Resultado local del 26 de octubre de 2026

| Control | Medición | Exigencia | Resultado |
| --- | --- | --- | --- |
| Líneas existentes del backend | 199/228 = 87,28 % | ≥ 50 % | Satisfactorio |
| Líneas nuevas/modificadas | 47/50 = 94 % | ≥ 80 % | Satisfactorio |
| Duplicación | 0/915 líneas = 0 % | ≤ 5 % | Satisfactorio |
| Análisis estático | 0 errores y 0 advertencias | 0 | Satisfactorio |
| Pruebas | 121 unitarias + 26 integración = 147 | Todas satisfactorias | Satisfactorio |
| Tipos y compilación | Tres verificaciones de tipos y compilación | Sin errores | Satisfactorio |

Cobertura global del backend: 88,48 % de líneas (246/278), 88,92 % de sentencias (265/298) y 98,21 % de ramas (165/168). No es cobertura de toda la app.

Se corrigieron dos alertas de mantenibilidad por expresiones condicionales anidadas, en el parser de monto y en la selección de respuesta HTTP, conservando los resultados verificados por las regresiones.

Evidencia local: [gate](evidencias/etapa-4/gate-local.json), [ejecución completa](evidencias/etapa-4/pipeline-local.json), [cobertura](evidencias/etapa-4/cobertura-local.json), [análisis](evidencias/etapa-4/analisis-local.json) y [duplicación](evidencias/etapa-4/duplicacion-local.json).

## Evidencia remota

Pendiente de completar con URLs y estados reales de GitHub Actions. Para demostrar el fallo requerido se utilizará una reproducción controlada y explícita del comportamiento anterior de DEF-001 en una rama de trabajo, seguida de su corrección, conservando las mismas pruebas. No se presentará esa reproducción como un descubrimiento nuevo ni se fusionará la versión defectuosa a `main`.

Referencias: [GitHub Actions para Node](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs), [SonarJS](https://github.com/SonarSource/SonarJS), [jscpd](https://github.com/kucherenko/jscpd).
