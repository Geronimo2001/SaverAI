# Casos de prueba — nivel 1

Este documento formaliza los casos de prueba del módulo de persistencia de
gastos. Cada caso tiene un identificador estable (`CP-*`) que se utiliza en el
código, los reportes y la trazabilidad con requisitos y defectos.

## Convenciones

- **Unitario:** prueba una función o componente aislado, normalmente con
  dobles.
- **API/integración:** recorre HTTP, validación, repositorio y, cuando se
  indica, PostgreSQL de prueba.
- **Smoke:** prueba el artefacto compilado en un proceso real.
- Los casos unitarios siguen **Arrange–Act–Assert**: preparar datos, ejecutar
  la operación y verificar el resultado.
- El resultado esperado se fija antes de ejecutar. Una ejecución satisfactoria
  no demuestra que no existan otros defectos fuera del alcance.

## Resumen y trazabilidad

| ID | Requisito | Nivel | Técnica de caja negra | Resultado esperado | Defecto |
|---|---|---|---|---|---|
| CP-001 | REQ-01 | Unitaria / integración | Equivalencia válida | Aceptar un gasto completo y conservar el importe válido. | — |
| CP-002 | REQ-01 | Unitaria | Equivalencia inválida | Rechazar cero, negativos, valores no numéricos, infinitos o vacíos. | — |
| CP-003 | REQ-01 | Unitaria / API / PostgreSQL | Valor límite y equivalencia | Rechazar valores positivos que se redondean a cero y no intentar persistirlos. | DEF-001 |
| CP-004 | REQ-01 | Unitaria | Valores límite | Aceptar los límites válidos y rechazar un importe superior al máximo. | — |
| CP-005 | REQ-02 | Unitaria | Equivalencia inválida | Rechazar cuerpos incompletos, identificadores, referencias o fechas de confirmación inválidas. | — |
| CP-006 | REQ-02 | Unitaria | Valores límite | Aceptar comercios de 2 a 80 caracteres, rechazar 1 y 81, y normalizar espacios. | — |
| CP-007 | REQ-03 | Unitaria | Valores límite | Aceptar hoy y ayer; rechazar fechas futuras o inexistentes. | — |
| CP-008 | REQ-03 | Unitaria | Equivalencia y valores límite | Rechazar formatos incorrectos y fechas inválidas, incluyendo días inexistentes. | — |
| CP-009 | REQ-04 | API / integración | Tabla de decisión | Rechazar usuario, categoría o medio ajeno/inactivo sin escribir datos. | — |
| CP-010 | REQ-05 | API / integración | Tabla de decisión | Un reintento devuelve el gasto original o duplicado y no crea otra fila. | — |
| CP-011 | REQ-05 | Integración | Tabla de decisión y concurrencia | Solicitudes simultáneas con mensajes solapados producen una sola alta. | DEF-002 |
| CP-012 | REQ-06 | Unitaria con dobles / PostgreSQL | Tabla de decisión | Una transacción exitosa confirma las escrituras y libera el cliente. | — |
| CP-013 | REQ-06 | Unitaria con dobles / integración | Equivalencia de error | Un fallo revierte todas las escrituras, propaga el error y libera el cliente. | — |
| CP-014 | REQ-07 | API / integración | Tabla de decisión | Consultar devuelve solo gastos del usuario y período solicitado. | — |
| CP-015 | REQ-07 | Unitaria / API / integración | Valores límite y equivalencia inválida | Períodos inválidos responden 400 antes de consultar PostgreSQL. | DEF-004 |
| CP-016 | REQ-08 | API / integración / PostgreSQL | Escenario y tabla de decisión | Borrar el gasto propio elimina también sus mensajes asociados. | — |
| CP-017 | REQ-08 | API / integración | Tabla de decisión | No se puede borrar un gasto ajeno o inexistente; se devuelve 404. | — |
| CP-018 | REQ-09 | Unitaria / API / integración | Equivalencia válida e inválida | Firma válida permite la operación; firma ausente, alterada o cuerpo alterado se rechaza. | — |
| CP-019 | REQ-10 | Unitaria con dobles / integración | Equivalencia de error | Una caída o falla de PostgreSQL no confirma el alta ni deja registros parciales. | — |
| CP-020 | REQ-11 | Integración / PostgreSQL | Escenario de repetición | La migración funciona sobre la base aislada y puede repetirse. | — |
| CP-021 | REQ-12 | Smoke | Escenario de extremo a extremo | El backend compilado inicia y completa salud, catálogo, alta, consulta, borrado y limpieza. | — |
| CP-022 | REQ-13 | API / integración | Tabla de decisión | Un mensaje de otro usuario devuelve conflicto sin revelar su gasto. | DEF-003 |

## Fichas de los casos

### CP-001 — Alta válida

- **Objetivo:** comprobar que un gasto completo se acepta y que también puede
  persistirse y consultarse.
- **Datos:** usuario, categoría, medio de pago, comercio y fecha válidos;
  importe `1500`.
- **Arrange:** preparar un payload sintético válido y, en integración, las
  referencias en la base aislada.
- **Act:** ejecutar el validador o enviar el alta HTTP firmada.
- **Assert:** resultado válido; en integración, respuesta de creación y una
  fila consultable.
- **Evidencia:** `tests/unit/confirmed-expense-validation.test.ts`,
  `tests/integration/backend.test.ts` y `tests/integration/postgres.test.ts`.

### CP-002 — Importes inválidos

- **Objetivo:** rechazar entradas que no representan un importe válido.
- **Datos:** `0`, `-1`, `"no-numero"`, `null`, `undefined`, `Infinity`, `NaN`,
  objeto y cadena vacía.
- **Resultado esperado:** `valid: false`, con error
  `expense.amount/invalid_amount`.
- **Evidencia:** `tests/unit/confirmed-expense-validation.test.ts`.

### CP-003 — Importe que se redondea a cero

- **Objetivo:** impedir que un valor positivo termine convertido en cero,
  incompatible con la restricción de PostgreSQL.
- **Datos:** `0.1`, `0.49` y `"0,1"`.
- **Resultado esperado:** rechazo antes de persistir, con
  `invalid_amount`.
- **Defecto:** DEF-001.
- **Evidencia:** `tests/unit/confirmed-expense-validation.test.ts`,
  `tests/unit/api.test.ts` y `tests/integration/postgres.test.ts`; contraste
  rojo/verde en `docs/calidad/evidencias/def-001/` y
  `docs/calidad/evidencias/ci-def-001/`.

### CP-004 — Límites del importe

- **Objetivo:** verificar los límites inferior y superior de la regla.
- **Datos:** `1`, `100.000.000` y `100.000.001`.
- **Resultado esperado:** los dos primeros se aceptan; el último se rechaza.
- **Evidencia:** `tests/unit/confirmed-expense-validation.test.ts`.

### CP-005 — Campos obligatorios y cuerpo incompleto

- **Objetivo:** rechazar payloads incompletos sin lanzar excepciones.
- **Datos:** `null`, arreglos, texto, objetos vacíos, identificadores vacíos,
  categoría o medio ausentes y `confirmedAt` inválido.
- **Resultado esperado:** respuesta inválida con errores de campo; no se
  intenta persistir.
- **Evidencia:** `tests/unit/confirmed-expense-validation.test.ts`.

### CP-006 — Límites y normalización del comercio

- **Objetivo:** verificar la longitud permitida y la normalización.
- **Datos:** comercios de 1, 2, 80 y 81 caracteres; texto con espacios
  externos y repetidos.
- **Resultado esperado:** 2 y 80 son válidos; 1 y 81 son inválidos; los
  espacios se normalizan.
- **Evidencia:** `tests/unit/confirmed-expense-validation.test.ts`.

### CP-007 — Fechas válidas y futuras

- **Objetivo:** aceptar fechas permitidas y rechazar fechas futuras.
- **Datos:** hoy `2026-10-25`, ayer `2026-10-24` y mañana `2026-10-26`,
  usando un reloj de referencia fijo.
- **Resultado esperado:** hoy y ayer válidos; mañana inválida.
- **Evidencia:** `tests/unit/confirmed-expense-validation.test.ts`.

### CP-008 — Fechas inexistentes y formatos incorrectos

- **Objetivo:** rechazar fechas que no existen o no respetan el contrato.
- **Datos:** `2024-02-29`, `2025-02-29`, `2026-13-01`, `2026-04-31`,
  `25/10/2026` y cadena vacía.
- **Resultado esperado:** solo el 29 de febrero de un año bisiesto es válido.
- **Evidencia:** `tests/unit/confirmed-expense-validation.test.ts`.

### CP-009 — Referencias inválidas

- **Objetivo:** asegurar que el alta use referencias existentes y permitidas.
- **Datos:** usuario inexistente, categoría inexistente, medio de pago ajeno
  y medio inactivo.
- **Resultado esperado:** rechazo sin insertar gasto ni mensajes.
- **Evidencia:** `tests/integration/backend.test.ts`,
  `tests/integration/postgres.test.ts` y
  `tests/unit/expenses-repository.test.ts`.

### CP-010 — Reintento e idempotencia

- **Objetivo:** evitar que el mismo mensaje cree dos gastos.
- **Datos:** primer alta válida y repetición del mismo mensaje; también listas
  con mensajes vacíos, repetidos o no textuales.
- **Resultado esperado:** una sola fila; el reintento devuelve el gasto
  original o un resultado de duplicado.
- **Evidencia:** `tests/integration/backend.test.ts`,
  `tests/integration/postgres.test.ts` y
  `tests/unit/expenses-repository.test.ts`.

### CP-011 — Concurrencia con mensajes solapados

- **Objetivo:** verificar la idempotencia cuando llegan solicitudes
  simultáneas.
- **Datos:** cuatro reintentos simultáneos y dos altas con un mensaje de
  origen compartido.
- **Resultado esperado:** una solicitud crea el gasto y las restantes
  responden duplicado; queda una sola fila.
- **Defecto:** DEF-002.
- **Evidencia:** `tests/integration/backend.test.ts` y
  `docs/calidad/evidencias/etapa-3/`.

### CP-012 — Commit y liberación

- **Objetivo:** comprobar el camino exitoso de una transacción.
- **Datos:** cliente PostgreSQL doble con operaciones exitosas.
- **Resultado esperado:** se ejecuta `COMMIT` y el cliente se libera.
- **Evidencia:** `tests/unit/db.test.ts` y
  `tests/integration/postgres.test.ts`.

### CP-013 — Rollback ante fallo

- **Objetivo:** impedir escrituras parciales cuando una operación falla.
- **Datos:** una escritura válida seguida de un error provocado.
- **Resultado esperado:** `ROLLBACK`, propagación del error, liberación del
  cliente y ausencia de gasto y mensajes persistidos.
- **Evidencia:** `tests/unit/db.test.ts`,
  `tests/integration/backend.test.ts` y
  `tests/integration/postgres.test.ts`.

### CP-014 — Consulta filtrada

- **Objetivo:** devolver solo los gastos correspondientes al usuario y
  período solicitado.
- **Datos:** dos usuarios y más de un período.
- **Resultado esperado:** la respuesta contiene únicamente las filas que
  coinciden con ambos filtros.
- **Evidencia:** `tests/integration/backend.test.ts`.

### CP-015 — Período inválido

- **Objetivo:** validar el período antes de ejecutar SQL.
- **Datos:** `2026-13`, `2026-00`, `0000-01`, `texto` y cadena vacía.
- **Resultado esperado:** HTTP 400 con `invalid_period`, sin consulta a
  PostgreSQL.
- **Defecto:** DEF-004.
- **Evidencia:** `tests/unit/read-routes.test.ts`,
  `tests/integration/backend.test.ts` y
  `tests/unit/api.test.ts`.

### CP-016 — Borrado propio y cascada

- **Objetivo:** borrar un gasto propio y sus mensajes asociados.
- **Datos:** gasto existente con mensajes relacionados.
- **Resultado esperado:** HTTP 200; el gasto, sus mensajes y la consulta
  posterior quedan eliminados.
- **Evidencia:** `tests/integration/backend.test.ts` y
  `tests/integration/postgres.test.ts`.

### CP-017 — Borrado ajeno o inexistente

- **Objetivo:** impedir que un usuario borre un gasto que no le pertenece.
- **Datos:** identificador de gasto ajeno o inexistente.
- **Resultado esperado:** HTTP 404 y ningún cambio en la base.
- **Evidencia:** `tests/integration/backend.test.ts`.

### CP-018 — Firma HMAC

- **Objetivo:** verificar la autenticidad de las escrituras.
- **Datos:** firma válida, ausente, alterada, con prefijo `sha256=` y cuerpo
  modificado.
- **Resultado esperado:** la firma válida permite continuar; las demás se
  rechazan antes de acceder al repositorio.
- **Evidencia:** `tests/unit/http.test.ts`,
  `tests/unit/api.test.ts` y `tests/integration/backend.test.ts`.

### CP-019 — Caída o error de PostgreSQL

- **Objetivo:** evitar confirmaciones falsas y escrituras parciales.
- **Datos:** fallo de conexión, error de consulta y error durante la
  transacción.
- **Resultado esperado:** error controlado, sin gasto ni mensajes confirmados.
- **Evidencia:** `tests/unit/db.test.ts`,
  `tests/unit/expenses-repository.test.ts` y
  `tests/integration/backend.test.ts`.

### CP-020 — Migración repetible

- **Objetivo:** comprobar que el entorno aislado se puede preparar más de una
  vez.
- **Datos:** base de pruebas vacía y segunda ejecución de la migración.
- **Resultado esperado:** preparación satisfactoria y repetible, sin usar la
  base productiva `capsaai`.
- **Evidencia:** `tests/integration/postgres.test.ts` y los reportes de
  aislamiento en `docs/calidad/evidencias/`.

### CP-021 — Smoke del backend compilado

- **Objetivo:** verificar el artefacto compilado en un proceso real.
- **Datos:** backend compilado, PostgreSQL aislado y datos sintéticos.
- **Resultado esperado:** arranque, salud, catálogo, alta, consulta, borrado y
  limpieza satisfactorios.
- **Comando:** `npm run test:smoke`.
- **Evidencia:** `tests/smoke/backend.smoke.ts`,
  `docs/calidad/09-smoke-test.md` y
  `docs/calidad/evidencias/smoke/`.

### CP-022 — Mensaje perteneciente a otro usuario

- **Objetivo:** evitar revelar un gasto cuando se reutiliza un mensaje ajeno.
- **Datos:** gasto registrado por el usuario A y solicitud posterior del
  usuario B con el mismo mensaje.
- **Resultado esperado:** HTTP 422 `message_conflict`, sin objeto `expense`,
  identificador ni datos del usuario A.
- **Defecto:** DEF-003.
- **Evidencia:** `tests/integration/backend.test.ts`,
  `tests/unit/expenses-repository.test.ts` y
  `docs/calidad/evidencias/etapa-3/`.

## Comandos de ejecución

```bash
# Unitarias con cobertura
npm run test:coverage

# Integración con PostgreSQL aislado
npm run test:integration

# Smoke del artefacto compilado
npm run test:smoke

# Pipeline completo de calidad
npm run quality:check
```

La suite de integración requiere PostgreSQL y `TEST_DATABASE_URL` apuntando a
`capsaai_quality_test`. Los reportes generados por las ejecuciones se
conservan en `docs/calidad/evidencias/` cuando se copian como evidencia de
entrega.

## Plantilla para nuevos casos

```text
ID y requisito:
Objetivo y nivel:
Técnica de diseño:
Precondiciones y datos sintéticos:
Arrange:
Act:
Resultado esperado:
Resultado obtenido y estado:
Comando, entorno y versión:
Evidencia:
Defecto vinculado:
```
