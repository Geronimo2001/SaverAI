# Evidencia de CI roja y verde — DEF-001

## Objetivo y procedimiento

Comprobar que el pipeline detecta el defecto real DEF-001 y acepta su corrección con las mismas pruebas. Es una **reproducción histórica controlada**, no un defecto nuevo descubierto en esta etapa.

Se partió de la suite priorizada del commit `27cb1bf3968c160fb62fabb1de1e39e317ba5aa0`. En la rama independiente `codex/evidencia-ci-def001` se retiró únicamente la condición `roundedAmount <= 0` del validador. Una vez finalizada la ejecución roja se restauró exactamente el archivo corregido. El código defectuoso no se incorporó a `main` ni a `codex/calidad-nivel-1`.

Requisito → caso → defecto: **REQ-01 → CP-003 → DEF-001**. Los tests, sus expectativas, el workflow, el baseline y los umbrales se conservaron entre ambas ejecuciones. Los identificadores Git del manifiesto permiten comprobarlo.

## Ejecución roja

- Commit: `aa0685e5f2739dca4c8107674d872f2769335374`.
- [GitHub Actions 40265714889](https://github.com/Geronimo2001/SaverAI/actions/runs/40265714889): **failure**.
- Unitarias: **90 satisfactorias y 4 fallidas de 94**.
- Integración: **27 satisfactorias de 27**.
- Tipos, compilación, análisis estático y duplicación finalizaron satisfactoriamente.

Fallaron los tres casos del validador con `0.1`, `0.49` y `"0,1"`, y el caso del manejador HTTP que exige rechazar el monto antes de persistir. Sin la condición, el validador acepta un monto final de cero. La prueba HTTP usa un doble de persistencia; no se presenta como un intento de escritura real en PostgreSQL.

La etapa unitaria devolvió error por esas aserciones. Vitest no generó LCOV en esta ejecución fallida y el gate rechazó también la ausencia de ese reporte. Por eso **no hay porcentajes de cobertura de la ejecución roja**: el motivo primario documentado es el fallo de las cuatro pruebas, y el error adicional del gate es la falta de cobertura. No se sustituyó el reporte ausente por el de una ejecución anterior.

## Ejecución verde

- Commit: `dc5debe7fbb1626af3286a781b2a02bdaa9653bb`.
- [GitHub Actions 40265838359](https://github.com/Geronimo2001/SaverAI/actions/runs/40265838359): **success**.
- Unitarias: **94/94**; integración: **27/27**; total: **121/121**.
- Cobertura existente: **137/228 = 60,09 %**; nueva: **45/50 = 90 %**.
- Duplicación: **0 %**; análisis: **0 errores y 0 advertencias**.
- Todas las etapas y el gate satisfactorios.

La corrección vuelve a exigir que el monto redondeado sea positivo. El árbol completo del commit verde coincide con el de la revisión inicial de esta demostración; no se añadieron tests ni se modificó su alcance para lograr el verde.

Evidencia: [manifiesto de integridad](evidencias/ci-def-001/manifest.json), [parche de corrección](evidencias/ci-def-001/correccion.patch), [unitarias rojas](evidencias/ci-def-001/rojo/unit-results.json), [pipeline rojo](evidencias/ci-def-001/rojo/pipeline-local.json), [unitarias verdes](evidencias/ci-def-001/verde/unit-results.json), [pipeline verde](evidencias/ci-def-001/verde/pipeline-local.json) y [gate verde](evidencias/ci-def-001/verde/quality-gate.json).

## Conservación y límites

Los reportes se descargan de los artefactos de Actions y se conservan en `evidencias/ci-def-001/`, con los metadatos y commits de cada ejecución. La política del workflow conserva artefactos remotos durante 30 días; las copias versionadas permiten consultar la evidencia después.

Esta demostración verifica el bloqueo del pipeline ante una regresión conocida. No configura protección de ramas ni realiza un despliegue. Tampoco reemplaza el smoke, la carga, la evaluación de herramienta ni el PDF pendientes.

## Estado del trabajo

**Paso 5 cerrado para el alcance declarado del backend**: compilación, pruebas, análisis, cobertura separada, gate, reportes automáticos y contraste CI rojo/verde verificados. La aceptación académica de ese alcance y de la integración elegida sigue pendiente.

El próximo bloque es completar el smoke de nivel 1 y el paso 6: plan de carga, scripts de stress y esfuerzo sostenido, ejecución y reportes, con la evaluación de herramienta en cinco pasos. Luego resta el paso 7: informe PDF y demostración de un despliegue nuevo.
