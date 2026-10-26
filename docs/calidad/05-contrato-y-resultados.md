# Contrato de integración y resultados de API/repositorio

## Alcance de esta etapa

Se probó el recorrido HTTP → validación → repositorio → PostgreSQL → respuesta sobre `capsaai_quality_test`, con datos sintéticos y un servidor en un puerto temporal de `127.0.0.1`. No se ejecutó WhatsApp real ni la interfaz móvil.

Se separó el manejador y la fábrica del servidor en `server/app.ts`. `server/server.ts` conserva el arranque y las señales de cierre. Importar la aplicación para probarla ya no inicia un servidor ni registra señales; la dependencia PostgreSQL sigue configurándose al importar `db.ts`, por lo que el entorno de prueba se fija y verifica antes de importar estos módulos.

## Dependencia PostgreSQL

- Cliente: `pg`, consultas parametrizadas y transacciones mediante `withTransaction`.
- Entorno real verificado: PostgreSQL 15.17 local. El entorno de pruebas conserva la validación de nombre y marca de la etapa anterior.
- Datos del módulo: usuarios, categorías, medios de pago, gastos y mensajes procesados. La migración es `server/migrations/001_init.sql`.
- Alta: verificar referencias, escribir gasto y registrar mensajes dentro de una misma transacción. Un fallo se propaga, se intenta rollback y se libera el cliente.
- Idempotencia: normalizar mensajes de origen incluyendo el principal y sin repetidos. Adquirir locks de transacción por las claves hash de todos esos mensajes en un orden consistente, antes de buscar duplicados. Al terminar la transacción PostgreSQL libera esos locks.
- Un mensaje procesado del mismo usuario produce duplicado. Si corresponde a otro usuario, responder `message_conflict` sin incluir el gasto.
- Las inserciones de mensajes ya no ignoran conflictos de unicidad; un conflicto inesperado hace fallar y revertir el alta.
- Los demás escritores deben respetar el protocolo: un advisory lock es cooperativo. Las restricciones SQL siguen siendo una defensa adicional. Falta medir el impacto de la espera por locks bajo carga y establecer límites de espera operativos.

La selección de locks por transacción sigue el comportamiento documentado en [PostgreSQL 15](https://www.postgresql.org/docs/15/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS); adquirir múltiples locks en un orden consistente evita invertir el orden entre solicitudes. [Documentación de bloqueo](https://www.postgresql.org/docs/15/explicit-locking.html#ADVISORY-LOCKS).

## Contrato HTTP actual

Las escrituras usan `x-capsa-signature`, HMAC-SHA256 del cuerpo original, con el secreto del backend. Se acepta digest hexadecimal con o sin prefijo `sha256=`. Las lecturas actuales no autentican al solicitante: el filtro `userId` **no equivale a autorización**.

| Ruta | Entrada / comportamiento | Respuestas verificadas |
| --- | --- | --- |
| `GET /health` | Comprueba que el manejador responde; no consulta PostgreSQL | 200 `ok` |
| `POST /webhooks/whatsapp/expenses/confirmed` | Cuerpo firmado con `userId`, `messageId`, mensajes de origen y gasto; valida monto/fecha/campos/referencias | 201 creado; 200 duplicado propio; 401 firma inválida/ausente; 400 JSON inválido; 422 validación/referencias/conflicto de mensaje; 500 excepción de persistencia |
| `GET /expenses?userId=...&period=YYYY-MM` | `userId` obligatorio. `period` opcional; si está presente debe ser año 0001–9999 y mes 01–12. Devuelve hasta 500 gastos, por fecha e ID descendentes | 200 lista filtrada; 400 `missing_user_id` o `invalid_period` |
| `GET /categories` | Catálogo ordenado por etiqueta | 200 categorías |
| `GET /payment-methods?userId=...` | Medios activos del usuario indicado | 200 lista; 400 sin usuario |
| `POST /webhooks/whatsapp/expenses/deleted` | Cuerpo firmado con `userId` y `externalMessageId`; borrado acotado a ambos valores; cascada de mensajes | 200 eliminado; 401 firma inválida/ausente; 400 cuerpo inválido; 404 gasto inexistente o ajeno |
| `OPTIONS` | Preflight de lectura con CORS | 204 |
| Ruta no reconocida | Sin operación de datos | 404 |

Ejemplo sintético de cuerpo de alta (la firma se calcula sobre los bytes exactos enviados):

```json
{
  "userId": "quality-user",
  "messageId": "quality-confirm",
  "sourceMessageIds": ["quality-origin", "quality-confirm"],
  "expense": {
    "amount": 1500,
    "merchant": "Comercio sintetico",
    "category": "super",
    "card": "9999",
    "date": "2026-10-20"
  }
}
```

## Resultados y trazabilidad

| Casos | Evidencia ejecutada | Límite de la evidencia |
| --- | --- | --- |
| CP-001 a CP-008 | Validación, límites y equivalencias unitarias; alta HTTP real | No valida utilidad de la interfaz |
| CP-009 | Usuario/categoría inexistentes, medio ajeno/inactivo con dobles y PostgreSQL | No sustituye autenticación |
| CP-010 | Reintento devuelve mismo ID y queda un solo gasto; unicidad SQL | Mensajes globales según contrato del proveedor |
| CP-011 | Cuatro reintentos simultáneos y dos altas con un mensaje de origen compartido | Concurrencia funcional pequeña; no es stress |
| CP-012/013 | Commit/rollback/liberación con dobles; `withTransaction` revierte escritura real antes de un fallo posterior | Caso de rollback fallido verifica liberación, no recuperación de conexión |
| CP-014/015 | Dos usuarios y períodos; parámetros separados del SQL; períodos inválidos rechazados antes de consultar | No se midió paginación ni volumen de más de 500 registros |
| CP-016/017 | Borrado propio, ajeno, inexistente y cascada, por API y SQL | Sin prueba de carreras entre borrado y alta |
| CP-018 | Firma válida, ausente, alterada y cuerpo alterado; rechazo sin persistencia | Sin proveedor WhatsApp real |
| CP-019 | Fallos de conexión/consulta con dobles; error SQL real no deja gasto ni mensajes | La API sigue devolviendo 500 genérico; no hay política completa de reintentos ni timeout operativo |
| CP-020 | Preparación y repetición de migración sobre base de prueba | El ejecutable productivo de migración no está cubierto por unitarias |
| CP-021 | Health probado como componente | Smoke de despliegue completo aún pendiente |
| CP-022 | Reutilizar un mensaje ajeno no devuelve datos del gasto original | Las lecturas siguen sin autenticación |

## Tabla de decisión de referencias e idempotencia

| Mensaje previo | Usuario registrado | Categoría válida | Medio propio y activo | Resultado esperado y verificado |
| --- | --- | --- | --- | --- |
| No | Sí | Sí | Sí | Crear |
| No | No | — | — | Rechazar usuario, sin escrituras |
| No | Sí | No | Sí | Rechazar categoría, sin escrituras |
| No | Sí | Sí | No (ajeno) | Rechazar medio, sin escrituras |
| No | Sí | Sí | No (inactivo) | Rechazar medio, sin escrituras |
| Sí, propio | Sí | Sí | Sí | Devolver duplicado, sin nueva alta |
| Sí, ajeno | Sí | Sí | Sí | Rechazar conflicto, sin revelar gasto |
| No, dos solicitudes con origen común | Sí | Sí | Sí | Un creado y un duplicado; una sola fila |

La combinación de categoría y medio inválidos a la vez también se verifica con dobles y acumula ambos errores. Esta tabla selecciona combinaciones por riesgo; no pretende ser una enumeración exhaustiva de todas las entradas.

## Métricas reales

- Unitarias y API con dobles: **116 satisfactorias** en siete archivos.
- Integración SQL/HTTP: **26 satisfactorias** en dos archivos (7 de esquema y 19 de backend).
- Verificaciones de tipos de app, backend y pruebas: satisfactorias.
- En la primera ejecución de integración: **7 fallos reales de 26 casos**; en la misma suite después de corregir: **26 satisfactorios**. El hash de `tests/integration/backend.test.ts` coincide entre ambas ejecuciones.

| Cobertura unitaria de `server/**/*.ts` | Etapa anterior | Actual |
| --- | ---: | ---: |
| Líneas | 23,39 % (62/265) | 88,40 % (244/276) |
| Sentencias | 24,73 % (70/283) | 88,77 % (261/294) |
| Ramas | 37,12 % (62/167) | 98,25 % (169/172) |
| Funciones | 24 % (12/50) | 82,69 % (43/52) |

La medición incluye todos los `.ts` de `server`, sin excluir arranque, migración o seed sin cubrir. El denominador cambió por la extracción del manejador y las correcciones. Es cobertura global del módulo; todavía no está calculada por separado la de código existente y nuevo, ni la de toda la app. Superar el 50 % global del módulo no permite afirmar cumplimiento académico completo de ambos umbrales.

Evidencias archivadas:

- [Integración roja](evidencias/etapa-3/integracion-rojo.json) y [verde](evidencias/etapa-3/integracion-verde.json).
- [Hashes anteriores](evidencias/etapa-3/rojo-metadata.json) y [posteriores](evidencias/etapa-3/verde-metadata.json).
- [Correcciones](evidencias/etapa-3/correcciones.patch), [unitarias actuales](evidencias/etapa-3/unitarias-verde.json), [cobertura](evidencias/etapa-3/cobertura.json) y [estado final](evidencias/etapa-3/estado-final.json).
- [Verificación de aislamiento posterior](evidencias/etapa-3/aislamiento.json): la base original conserva las cantidades relevadas y la de prueba termina sin usuarios, medios, gastos ni mensajes sintéticos; solo permanecen las categorías de referencia.

Son ejecuciones locales, no evidencias de CI. Los reportes regenerables siguen en `reports/` y `coverage/unit/`; ejecutar los comandos documentados en el entorno de pruebas.

## Próximo paso

Compilación, análisis estático, quality gate y pipeline con reportes. También faltan smoke de despliegue, carga, proceso de elección de herramienta, trazabilidad de aportes/defectos en la herramienta de seguimiento y PDF. La aceptación académica del alcance del módulo y de PostgreSQL local como sistema externo sigue pendiente.
