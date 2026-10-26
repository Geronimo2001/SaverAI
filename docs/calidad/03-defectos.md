# Registro de defectos

## DEF-001 — Monto positivo aceptado se convierte en cero

- Estado: **corregido y verificado localmente y en CI; issue #7 vinculado; aportes individuales pendientes**.
- Fecha de detección: 25 de octubre de 2026.
- Requisito / caso: REQ-01 / CP-003 del plan de pruebas.
- Ubicación: `server/confirmed-expense-validation.ts`, función `parseAmount`.
- Severidad inicial: media; prioridad alta por afectar la integridad de entrada.
- Entorno: TypeScript ejecutado con `tsx`; no requiere conexión a PostgreSQL.

### Pasos

1. Crear un payload con usuario, mensaje, categoría y medio de pago sintéticos, comercio de al menos dos caracteres y fecha `2026-10-25`.
2. Asignar `expense.amount = 0.1`.
3. Ejecutar `validateConfirmedBotExpensePayload(payload, new Date(2026, 9, 25))`.

### Resultado esperado

El validador no debe declarar válido un payload cuyo monto final sea cero. Debe rechazarlo antes de intentar persistirlo. La política general de decimales se resolverá por separado.

### Resultado obtenido

En una ejecución durante el relevamiento se obtuvo `valid: true` y `payload.expense.amount: 0`. `parseAmount` comprueba positividad antes de aplicar `Math.round`. El esquema de `expenses` exige `CHECK (amount > 0)`.

La incompatibilidad entre el valor validado y el esquema está comprobada. No se intentó insertar este payload en la base existente y no se afirma haber observado su respuesta HTTP real.

### Corrección y decisión acotada

Se conserva el comportamiento monetario existente: entradas numéricas o texto con coma decimal se redondean al entero más cercano con `Math.round`, con máximo original de 100.000.000. Se agrega la condición de que el monto redondeado sea mayor a cero. Por ejemplo, 0.1, 0.49 y "0,1" se rechazan; 0.5 se sigue convirtiendo en 1. No se cambia la unidad monetaria ni se migra a centavos; una revisión general de esa política queda fuera de esta corrección.

La modificación aplica al validador del backend. El validador de la simulación frontend es otra implementación y no se afirma corregido por este cambio.

### Evidencia real local

- Suite: `tests/unit/confirmed-expense-validation.test.ts`, casos CP-003 / DEF-001.
- [Reporte rojo](evidencias/def-001/rojo.json): 58 pruebas ejecutadas, 55 satisfactorias y 3 fallidas, todas correspondientes a este defecto.
- [Reporte verde](evidencias/def-001/verde.json): las mismas 58 pruebas satisfactorias.
- [Metadatos rojos](evidencias/def-001/rojo-metadata.json) y [verdes](evidencias/def-001/verde-metadata.json): tiempos reales de ejecución, comando, versión de Node y hashes del código y de la prueba.
- [Parche de la corrección](evidencias/def-001/correccion.patch).
- El hash del archivo de pruebas coincide en ambas ejecuciones. Los tres casos se conservan como regresión.
- La prueba SQL adicional CP-003 confirma que la restricción de PostgreSQL rechaza cero en la base aislada.

La [reproducción histórica controlada en CI](08-evidencia-ci-roja-verde.md) conserva el contraste remoto: [rojo](https://github.com/Geronimo2001/SaverAI/actions/runs/40265714889), commit `aa0685e5f2739dca4c8107674d872f2769335374`, y [verde](https://github.com/Geronimo2001/SaverAI/actions/runs/40265838359), commit de restauración `dc5debe7fbb1626af3286a781b2a02bdaa9653bb`. Se mantuvieron exactamente las mismas pruebas. La corrección original ya estaba incluida en `471052a5237d53a6dac6ff9adaf3d3c9273e9a0e`.

Seguimiento: [GitHub Issue #7](https://github.com/Geronimo2001/SaverAI/issues/7), registro retrospectivo cerrado por corrección verificada. Pendiente: aportes humanos efectivamente realizados. La ejecución técnica fue asistida por Codex; la identidad Git configurada no demuestra por sí sola autoría individual del trabajo. No se asigna un responsable humano sin evidencia de su participación.

## DEF-002 — Altas concurrentes con origen compartido duplican gastos

- Estado: corregido y verificado localmente y en CI. Seguimiento: [Issue #8](https://github.com/Geronimo2001/SaverAI/issues/8). Corrección incluida en `471052a`; regresiones en [CI 40328308100](https://github.com/Geronimo2001/SaverAI/actions/runs/40328308100). Registro retrospectivo cerrado por corrección previa; aportes individuales pendientes.
- Requisito / caso: REQ-05 / CP-011.
- Severidad: alta por duplicar registros financieros.
- Entorno: API local y PostgreSQL 15.17, exclusivamente `capsaai_quality_test`.
- Pasos: crear usuario y medio sintéticos; enviar simultáneamente dos altas firmadas con distintos mensajes principales y un mensaje de origen común.
- Esperado: una respuesta 201 y una 200 de duplicado; un solo gasto persistido.
- Obtenido antes: ambas respuestas 201. La comprobación de duplicados ocurría antes de que la otra transacción confirmara; `ON CONFLICT DO NOTHING` ocultaba el conflicto al registrar el origen.
- Corrección: locks de transacción ordenados por las claves de los mensajes antes de comprobar duplicados; normalización de IDs; conflictos inesperados al insertar mensajes ya no se ignoran.
- Regresión: CP-011 en `tests/integration/backend.test.ts`, sin cambiar el caso entre rojo y verde. Se mantiene además el caso de cuatro reintentos del mismo mensaje.
- Evidencia: [integración roja](evidencias/etapa-3/integracion-rojo.json), [verde](evidencias/etapa-3/integracion-verde.json) y [parche](evidencias/etapa-3/correcciones.patch).
- Límite: los advisory locks son cooperativos; falta evaluar esperas bajo carga.

## DEF-003 — Respuesta de duplicado puede revelar un gasto de otro usuario

- Estado: corregido y verificado localmente y en CI. Seguimiento: [Issue #9](https://github.com/Geronimo2001/SaverAI/issues/9). Corrección incluida en `471052a`; regresiones en [CI 40328308100](https://github.com/Geronimo2001/SaverAI/actions/runs/40328308100). Registro retrospectivo cerrado por corrección previa; aportes individuales pendientes.
- Requisito / caso: REQ-13 / CP-022.
- Severidad: alta por exposición de datos de otro usuario en la respuesta.
- Entorno: API local con firma sintética válida y dos usuarios sintéticos en la base de pruebas.
- Pasos: registrar gasto del usuario A; reutilizar su mensaje en una solicitud del usuario B con medio propio.
- Esperado: rechazo 422 por conflicto, sin `expense` ni identificador/datos del usuario A.
- Obtenido antes: 200 de duplicado. La búsqueda global devolvía el gasto original sin comparar su usuario con el solicitante.
- Corrección: comprobar pertenencia antes de construir la respuesta de duplicado; conflicto genérico `message_conflict` sin objeto de gasto.
- Regresión: CP-022 en `tests/integration/backend.test.ts` y en `tests/unit/expenses-repository.test.ts`.
- Evidencia: [integración roja](evidencias/etapa-3/integracion-rojo.json), [verde](evidencias/etapa-3/integracion-verde.json) y [parche](evidencias/etapa-3/correcciones.patch).
- Límite: esta corrección no agrega autenticación a las rutas de lectura ni vincula la sesión SQLite con el backend.

## DEF-004 — Períodos inválidos provocan error de base o se ignoran

- Estado: corregido y verificado localmente y en CI. Seguimiento: [Issue #10](https://github.com/Geronimo2001/SaverAI/issues/10). Corrección incluida en `471052a`; regresiones en [CI 40328308100](https://github.com/Geronimo2001/SaverAI/actions/runs/40328308100). Registro retrospectivo cerrado por corrección previa; aportes individuales pendientes.
- Requisito / caso: REQ-07 / CP-015.
- Severidad: media por respuesta incorrecta y filtrado inesperado.
- Pasos: consultar gastos del usuario sintético con `period` igual a `2026-13`, `2026-00`, `0000-01`, `texto` o cadena vacía.
- Esperado: HTTP 400 por período inválido, sin consultar PostgreSQL.
- Obtenido antes: 500 para los tres primeros por fecha fuera de rango en SQL; 200 para texto y vacío, ignorando el filtro.
- Corrección: si `period` está presente, validar formato YYYY-MM, año distinto de 0000 y mes entre 01 y 12; responder `invalid_period` antes de acceder a la base. Sin parámetro se conserva la consulta de todos los períodos del usuario.
- Regresión: cinco entradas en integración y cinco unitarias de lectura con doble, donde también se comprueba ausencia de consulta SQL.
- Evidencia: [integración roja](evidencias/etapa-3/integracion-rojo.json), [verde](evidencias/etapa-3/integracion-verde.json) y [parche](evidencias/etapa-3/correcciones.patch).

Los siete fallos de la ejecución roja de esta etapa corresponden a un caso de DEF-002, uno de DEF-003 y cinco de DEF-004. La suite de integración completa pasa después de corregir. No son siete defectos distintos ni ejecuciones de CI.

## Plantilla de caso de prueba

- ID y requisito:
- Objetivo y nivel:
- Técnica (equivalencias, límites, decisiones):
- Precondiciones y datos sintéticos:
- Pasos / Arrange–Act–Assert:
- Resultado esperado (fijado antes de ejecutar):
- Resultado obtenido y estado:
- Comando, entorno, versión, fecha y responsable:
- Evidencia y defecto vinculado:

## Plantilla de defecto

- ID, título, requisito y caso:
- Estado, severidad, prioridad y responsable:
- Entorno y versión:
- Precondiciones y pasos para reproducir:
- Esperado / obtenido:
- Evidencia sin datos sensibles:
- Causa y corrección:
- Prueba de regresión y commit:
- Ejecuciones roja / verde:
- Fecha de apertura / cierre verificado:
