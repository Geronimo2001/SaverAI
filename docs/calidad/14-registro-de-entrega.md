# Registro de entrega, tareas y aportes

## Integrantes y forma de trabajo

- Geronimo Crostelli.
- Baltasar Lopez Villagra.
- Facundo Ortea.

Declaración del equipo en esta conversación: el trabajo se realizó en conjunto y no se puede identificar con precisión un reparto individual retrospectivo. Se registra esa modalidad colaborativa. La asistencia de IA para scripts, pruebas y documentos está permitida por la guía y debe ser comprendida y revisada por el grupo.

Los commits, PRs y reportes prueban cambios y ejecuciones; no prueban por sí solos quién comprendió o escribió cada parte. No se atribuyen tiempos, porcentajes ni responsabilidades individuales ficticias.

## Seguimiento versionado

| Tarea | Resultado y evidencia | Estado |
| --- | --- | --- |
| CAL-01 Alcance/aceptación/riesgos | Documentos 01 y 02; REQ-01 a REQ-13 | Documentado; aceptación académica del alcance pendiente |
| CAL-02 Ambiente de prueba | Guards y base marcada; integración real | Verificado |
| CAL-03 DEF-001 | REQ-01 → CP-003 → DEF-001; rojo/verde local y CI | Corregido y regresión ejecutada |
| CAL-04 DEF-002 | REQ-05 → CP-011 → DEF-002; concurrencia y transacción | Corregido y regresión ejecutada |
| CAL-05 DEF-003 | REQ-13 → CP-022 → DEF-003; conflicto sin revelar gasto | Corregido y regresión ejecutada |
| CAL-06 DEF-004 | REQ-07 → CP-015 → DEF-004; rechazo de períodos | Corregido y regresión ejecutada |
| CAL-07 Gate y protección | Job quality, PR #6 y main protegido | Verificado; regla no exige rama actualizada |
| CAL-08 Smoke | CP-021 y reportes de smoke | Verificado localmente |
| CAL-09 Cargas y herramienta | Documentos 10–12, k6, CI y soak corto | Verificado con límites publicados |
| CAL-10 Informe y demo | PDF, guion y artefacto desplegado localmente | Demo local ejecutada; PDF de 12 páginas preparado y revisado |
| CAL-11 Aporte individual | Declaración conjunta y demostración individual futura | Pendiente de registrar ejecuciones personales |
| CAL-12 Tracker | GitHub Issues #7, #8, #9 y #10 vinculados en el documento 03 | Registros retrospectivos cerrados con evidencia de corrección previa |

El seguimiento está en [GitHub Issues #7 a #10](https://github.com/Geronimo2001/SaverAI/issues?q=is%3Aissue+DEF-00). Se crearon después de corregir los defectos, con reproducción, esperado/obtenido, casos, commits y CI. La apertura/cierre del issue no se usa como tiempo de resolución ni como prueba de autoría individual. Se conserva una copia de sus metadatos en evidencias/entrega/issues/.

## Preparación individual de defensa

Cada integrante puede trabajar y revisar con los demás. Para dejar aporte verificable desde ahora, registrar para cada ejecución personal: nombre, fecha real, comando, commit, resultado y archivo de evidencia; no completar esta tabla con acciones que todavía no ocurrieron.

| Integrante | Ejecución y explicación personal | Evidencia |
| --- | --- | --- |
| Geronimo Crostelli | Por registrar por el integrante | Pendiente |
| Baltasar Lopez Villagra | Por registrar por el integrante | Pendiente |
| Facundo Ortea | Por registrar por el integrante | Pendiente |

Propuesta de práctica, sin atribuir autoría: recorrer el PR/checks y la cobertura; reproducir un defecto y explicar rojo/verde; ejecutar el smoke y explicar la base aislada; interpretar una carga y sus limitaciones. Todos deben poder explicar el conjunto, como pide la guía.
