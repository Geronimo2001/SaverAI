# TP Integrador de Calidad de Software — CapsaAI

Nivel declarado: **1 — inicial**. Fecha de presentación indicada en la guía: **26 de octubre de 2026**.

Este directorio reúne la documentación versionada del trabajo. Una actividad planificada no cuenta como ejecutada: los resultados deben estar respaldados por ejecuciones del proyecto.

## Paso a paso

| Paso | Resultado esperado | Estado |
| --- | --- | --- |
| 1. Alcance y diagnóstico | Estado inicial, requisitos, riesgos y criterios de aceptación | Documentado; criterios propuestos para el módulo |
| 2. Preparación de pruebas | Comando de pruebas y entorno PostgreSQL aislado | Preparado; suite priorizada actual: 94 unitarias y 27 de integración satisfactorias |
| 3. Defecto y regresión | Prueba roja, corrección, prueba verde y registro vinculado | Cuatro defectos corregidos con regresión e issues #7 a #10; CI roja/verde de DEF-001; aportes individuales pendientes |
| 4. Pruebas por niveles | Unitarias, API, integración con dobles y PostgreSQL de prueba | Ejecutadas; regresiones y smoke; demostración nueva de copia desplegada localmente ejecutada |
| 5. CI y métricas | Compilación, análisis, cobertura, gate y reportes automáticos | Completado para el backend: CI roja/verde conservada; 60,09 % existente y 90 % nuevo |
| 6. Carga y herramienta nueva | Stress, esfuerzo sostenido y evaluación en cinco pasos | Completado: k6 con cinco pasos; load/stress/soak locales y reportes de load/stress verificados en CI |
| 7. Entrega y defensa | PDF, ejecuciones CI roja/verde y demostración de despliegue | PDF de 12 páginas revisado, demo local ejecutada y guion preparado; aceptación académica y evidencia individual pendientes |

## Documentos

- [Estado inicial y alcance](01-estado-inicial.md).
- [Plan de pruebas, trazabilidad, riesgos y modelo de calidad](02-plan-de-pruebas.md).
- [Casos de prueba detallados](13-casos-de-prueba.md).
- [Registro de defectos](03-defectos.md).
- [Entorno, comandos y primeros resultados](04-entorno-de-pruebas.md).
- [Contrato de integración y resultados de API/repositorio](05-contrato-y-resultados.md).
- [Pipeline y quality gate](06-pipeline-y-gate.md).
- [Suite priorizada y estado actual del paso 5](07-ajuste-nivel-1.md).
- [Cierre del paso 5: evidencia CI roja y verde](08-evidencia-ci-roja-verde.md).
- [Smoke manual del backend compilado](09-smoke-test.md).
- [Plan de carga y criterios previos](10-plan-de-carga.md).
- [Evaluación de herramienta en cinco pasos](11-herramienta-de-carga.md).
- [Resultados y estado del paso 6](12-resultados-de-carga.md).
- [Cierre técnico, PDF y pendientes declarados](13-cierre-tecnico.md).
- [Tareas, integrantes y aporte conjunto](14-registro-de-entrega.md).
- [Guion de demostración y defensa](15-guion-de-defensa.md).
- [Informe PDF](../../output/pdf/Informe_Calidad_Nivel1_CapsaAI.pdf).

## Reglas de trabajo

- La base existente `capsaai` no es un entorno de pruebas destructivas. Usar otra base, con datos sintéticos y una configuración explícita de pruebas.
- No publicar `.env`, credenciales, números de teléfono reales ni cargas originales de usuarios en reportes.
- Conservar los cambios de trabajo existentes y registrar aportes individuales mediante commits, tareas y evidencias reales. No asignar autorías ficticias.
- Mantener consistencia entre informe, reportes del pipeline y herramienta de análisis.
- No reducir el alcance de cobertura silenciosamente: informar exactamente qué archivos se midieron y qué quedó fuera.
- El código existente se identifica a partir de una referencia inicial y un inventario del árbol de trabajo. El commit por sí solo no incluye los cambios locales presentes al comenzar.

## Mínimos de nivel 1

- Pipeline: compilación, pruebas, análisis estático, cobertura, quality gate y reporte automático.
- Gate: bloquear bugs críticos, duplicación mayor al 5 % y cobertura de código nuevo menor al 80 %.
- Cobertura mínima del código existente: 50 %.
- Plan versionado, criterios de entrada/salida, riesgos y trazabilidad requisito → caso → defecto.
- Integración externa: contrato y pruebas con dobles.
- Smoke: definido y ejecutable manualmente.
- Carga: plan y un script ejecutado. Entregar también los scripts de stress y esfuerzo sostenido solicitados en los entregables.
- Herramienta nueva: requisitos, mercado, prueba de concepto, matriz de decisión y despliegue incremental.
- Al menos una ejecución completa verde y una fallida por un problema real en CI; reportes automáticos de cobertura, análisis y carga.
- Informe PDF, registro de defectos y demostración con un despliegue nuevo.

La guía también contiene requisitos generales más amplios sobre automatización por despliegue. Se adopta el mínimo específico del nivel 1 para smoke, con automatización posterior como mejora. La ejecución local no sustituye la evidencia de CI ni la demostración de despliegue.
