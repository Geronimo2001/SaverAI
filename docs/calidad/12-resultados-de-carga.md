# Resultados y cierre del paso 6

## Qué se ejecutó

Se adoptó k6 después de documentar requisitos, alternativas, PoC, matriz de decisión y despliegue incremental. Los perfiles miden el backend compilado con PostgreSQL real y datos sintéticos en una base aislada.

La PoC y los ensayos locales se ejecutaron antes del commit de implementación: el campo `gitCommit` de sus metadatos identifica el HEAD de partida, y `sourceHashes` identifica el contenido concreto de los scripts ejecutados. No presentar ese HEAD por sí solo como si ya contuviera los archivos nuevos.

## Referencia y stress locales

Pipeline completo aprobado: tipos, compilación, análisis, duplicación, 94 unitarias, 27 integraciones, cobertura y perfiles de carga/stress.

| Perfil | Duración programada | VUs máximos | Recorridos completos | Solicitudes | p95 HTTP | p99 HTTP | Errores |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| load | 20 s | 2 | 156 | 624 | 4,52 ms | 5,31 ms | 0 % |
| stress | 50 s | 20 | 2083 | 8332 | 8,91 ms | 13,88 ms | 0 % |

Todas las comprobaciones funcionales fueron satisfactorias, cada recorrido iniciado terminó y no quedaron gastos ni mensajes de la ejecución. Se verificó acceso a categorías después de cada perfil y se eliminaron las cuentas sintéticas.

Interpretación: el p95 fue mayor con más presión, pero ambos perfiles cumplieron los límites fijados antes de ejecutar (p95 < 500 ms y p99 < 1000 ms). No se alcanzó ni se buscó certificar la saturación. La tasa de solicitudes es observada dentro de un modelo cerrado y no se traduce en usuarios reales garantizados.

La cobertura sigue siendo la unitaria del backend: 137/228 = **60,09 %** existente y 45/50 = **90 %** nueva. No se añadieron exclusiones ni se modificaron los mínimos.

Evidencia: [pipeline local](evidencias/carga/local/pipeline-local.json), [gate](evidencias/carga/local/quality-gate.json), [metadatos y limpieza](evidencias/carga/local/ci-run.json), [k6 load](evidencias/carga/local/load-k6.json), [k6 stress](evidencias/carga/local/stress-k6.json).

## Esfuerzo sostenido corto

Ejecutado el perfil soak completo de **120 segundos**, con 2 VUs: **930 recorridos**, **3720 solicitudes**, **0 % de errores**, **100 % de checks**, p95 **4,32 ms** y p99 **5,00 ms**. Cada recorrido iniciado terminó, no quedaron gastos/mensajes, el backend siguió respondiendo y la limpieza fue satisfactoria.

[Reporte original](evidencias/carga/local/soak-k6.json), [resumen](evidencias/carga/local/soak-summary.json) y [metadatos/limpieza](evidencias/carga/local/soak-run.json).

Este ensayo corto no analiza fugas de memoria ni estabilidad durante horas; eso requeriría más duración y monitoreo de recursos.

## Integración en CI y uso

`npm run quality:check` conserva las etapas anteriores y agrega `test:performance:ci`: load y stress. Un umbral fallido, recorrido incompleto, falta de reporte, problema de recuperación o limpieza hace fallar esa etapa y el job obligatorio `quality`. El gate de cobertura conserva sus propias reglas; la aprobación total del job exige también la etapa de carga.

Los resultados y resúmenes de carga/stress se generan en `reports/performance/`, se agregan al resumen de Actions y se incluyen en el artefacto ya configurado del workflow. Soak queda como comando manual; sus resultados locales se versionan como evidencia.

Verificado en [GitHub Actions 40328308100](https://github.com/Geronimo2001/SaverAI/actions/runs/40328308100), commit **10fcd2ea351e7eb5a737ada07cf9867fe1f78ef8**: **success**. Se descargó el artefacto real y se verificaron los hashes de los scripts contra la implementación.

| Perfil CI | Recorridos | Solicitudes | p95 HTTP | p99 HTTP | Errores |
| --- | ---: | ---: | ---: | ---: | ---: |
| load | 149 | 596 | 24,78 ms | 92,76 ms | 0 % |
| stress | 1849 | 7396 | 49,57 ms | 138,48 ms | 0 % |

Todas las comprobaciones, recuperación y limpieza satisfactorias; gate con 121 pruebas y coberturas 60,09 %/90 %. Los tiempos de CI son superiores a los locales y cumplen los mismos umbrales iniciales; no se presentan como un empeoramiento entre versiones porque cambian equipo y entorno. Los metadatos incluyen las versiones reales del runner, Node, PostgreSQL y k6.

Evidencia descargada: [pipeline](evidencias/carga/ci/pipeline-local.json), [gate](evidencias/carga/ci/quality-gate.json), [carga/stress y limpieza](evidencias/carga/ci/ci-run.json), [reporte k6 load](evidencias/carga/ci/load-k6.json) y [reporte k6 stress](evidencias/carga/ci/stress-k6.json).

**Paso 6 completado para nivel 1 dentro del alcance declarado**: plan, scripts ejecutables, carga/stress/esfuerzo sostenido corto ejecutados, herramienta incorporada con cinco pasos y reportes automáticos de carga/stress verificados en CI.

## Qué falta después

El paso 7: completar trazabilidad de tareas/aportes individuales y métricas del informe, PDF consistente con evidencias y demostración de un despliegue nuevo. La aceptación académica del alcance backend/PostgreSQL local continúa pendiente. Estos ensayos locales no sustituyen la demostración final de despliegue.

## Ramas y PR

La rama del paso 6 es `codex/carga-nivel-1`. Parte de la versión completa del TP, incluido el smoke, e integra el main remoto consultado al comenzar. No se publicaron cambios directamente a main ni se crearon/fusionaron PRs desde esta tarea.

El equipo debe abrir el PR hacia `main` desde GitHub y observar el check `quality`. Si main aún no recibió el ajuste de cobertura/documentación/smoke, el PR del paso 6 también contendrá esos cambios previos. El PR de la reproducción histórica `codex/evidencia-ci-def001` no es necesario para incorporar el conjunto completo.
