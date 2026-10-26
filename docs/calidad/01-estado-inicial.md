# Estado inicial y alcance

Fecha del relevamiento: **25 de octubre de 2026** (Argentina).

## Objeto de evaluación

**Aseguramiento de la calidad del módulo de persistencia de gastos de CapsaAI y su integración con PostgreSQL.**

Recorrido: solicitud de gasto confirmado → validación → comprobación de referencias → transacción de almacenamiento → consulta → deshacer el gasto.

Se incluye `server/`: configuración, acceso a PostgreSQL, validadores, repositorio, rutas HTTP, migración y preparación de datos sintéticos. La firma del webhook se prueba como condición de entrada a las escrituras; no es necesario conectarse a WhatsApp real para verificar este contrato.

La interfaz Expo, la autenticación SQLite, la normalización conversacional y las demás funciones de la tesis se describen como contexto. Su exclusión del módulo no implica que cumplan calidad ni que desaparezcan de la cobertura exigida para el sistema completo. **El alcance académico del módulo y el denominador de cobertura deben quedar explícitos; su aceptación por la cátedra está pendiente.**

## Arquitectura observada

| Parte | Implementación observada | Límite de lo comprobado |
| --- | --- | --- |
| Interfaz | React Native / Expo y TypeScript | Verificación de tipos satisfactoria; no se verificó ejecución visual |
| Datos de la interfaz | Gastos, tarjetas y presupuestos en memoria en `src/data/capsa-api.ts` | No equivale a persistencia en PostgreSQL |
| Autenticación local | SQLite en `src/auth/LocalAuthContext.tsx` | No se probó el flujo de login en este relevamiento |
| Backend | Servidor HTTP Node.js, TypeScript y cliente `pg` | Verificación de tipos satisfactoria |
| PostgreSQL | Base `capsaai`, `localhost:5432`, PostgreSQL 15.17 (Homebrew) | Conexión y consultas de solo lectura satisfactorias |
| Migración del módulo | `server/migrations/001_init.sql` | Su existencia no demuestra que una base vacía migre correctamente |
| Salud del servidor | `GET /health` responde `status: ok` sin consultar PostgreSQL | No demuestra disponibilidad de la base |

La conexión está configurada mediante `DATABASE_URL` en `.env`. No se incorpora su contenido a la documentación.

## Base existente

Consultas de solo lectura realizadas durante el relevamiento:

| Tabla del módulo | Cantidad observada |
| --- | ---: |
| `app_users` | 1 |
| `expense_categories` | 6 |
| `payment_methods` | 3 |
| `expenses` | 1 |
| `whatsapp_processed_messages` | 3 |

Estas cantidades son una fotografía del relevamiento, no fixtures ni resultados del pipeline. Existen otras tablas de la tesis, incluidas `usuarios`, `transacciones`, `presupuestos`, `promociones`, `suscripciones` y `_prisma_migrations`. No deben recrearse ni limpiarse para ejecutar este TP.

PostgreSQL está en un proceso separado del backend, pero es local. La guía menciona una base de datos como servicio como ejemplo de sistema externo. **La aceptación de esta instancia local como integración externa académica no está confirmada.** La alternativa, si se exige, será una instancia de prueba como servicio conservando el mismo contrato.

## Línea de base de código y métricas

HEAD observado: `cf5cc7d7184c79f32acfd22ecaa8b9dca8ca96c1`.

Había modificaciones locales previas en `App.tsx`, `src/components/Icon.tsx`, `src/data/capsa-api.ts`, `src/data/capsa-data.ts`, las pantallas `BudgetsScreen`, `ExpensesScreen`, `HomeScreen`, `ManualExpenseScreen`, `ProfileScreen`, y un directorio `src/integrations/` sin seguimiento. No se atribuyen estos cambios al TP ni se los descarta. Antes de medir código nuevo debe fijarse una referencia reproducible que contemple este estado.

| Indicador | Estado inicial |
| --- | --- |
| `npm run typecheck` | Satisfactorio en el relevamiento |
| `npm run server:typecheck` | Satisfactorio en el relevamiento |
| Compilación / empaquetado | No ejecutado |
| Pruebas automatizadas | No se encontró suite ni comando configurado |
| Cobertura existente y nueva | No medida; no corresponde informar 0 % sin ejecutar una medición |
| Análisis estático de bugs y duplicación | No configurado; TypeScript no sustituye este análisis |
| Pipeline CI | No se encontró configuración versionada |
| Stress y esfuerzo sostenido | No ejecutados |
| Defecto observado | `DEF-001`: validación acepta un monto que se convierte en cero |

## Contingencia propuesta

Ante una caída de PostgreSQL, no confirmar persistencia ni guardar parcialmente el gasto. Devolver una respuesta de indisponibilidad controlada, registrar el incidente sin información sensible y permitir reintento con el mismo identificador de mensaje para evitar duplicación. No ofrecer almacenamiento offline como si ya existiera.

La respuesta HTTP actual ante excepciones generales es 500. Un error controlado de disponibilidad, los tiempos de espera y el comportamiento de reintentos deben especificarse y probarse en los siguientes pasos. Esta contingencia es una meta, no una función verificada.
