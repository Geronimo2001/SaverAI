# Entorno de pruebas y primeros resultados

## Preparación

Se incorporaron Vitest 5.0.5 y su proveedor de cobertura V8 con versiones resueltas en `package-lock.json`. Entorno observado: Node.js 24.15.0. Instalar dependencias con `npm ci`.

Las unitarias se ejecutan sin PostgreSQL ni credenciales. Las pruebas SQL requieren PostgreSQL local activo y permisos para crear una base, si aún no existe.

1. Copiar `.env.test.example` a `.env.test.local`.
2. Configurar `TEST_DATABASE_URL` apuntando exclusivamente a `capsaai_quality_test` en localhost; agregar credenciales locales si hacen falta. No versionar ese archivo.
3. Ejecutar `npm run test:integration`; prepara la base y corre los casos SQL.

Durante esta implementación se creó `.env.test.local` a partir de la configuración local existente, cambiando exclusivamente el destino a la base de pruebas y sin imprimir credenciales.

## Aislamiento

- `capsaai`: base existente de la tesis; no se utiliza para migraciones ni fixtures de estas pruebas.
- `capsaai_quality_test`: base exclusiva del TP. Preparación mediante `scripts/prepare-test-db.ts`.
- El comando no toma `DATABASE_URL` como fallback. Requiere `TEST_DATABASE_URL`, host local explícito, nombre exacto y URL sin parámetros adicionales.
- La base de pruebas se identifica con un comentario propio. Si ese nombre ya existe sin la marca, la preparación se detiene sin modificarla.
- Antes de migrar o crear fixtures se comprueba la identidad efectiva de la base conectada y su marca.
- La migración se aplica en una transacción. Sus seis categorías son datos sintéticos de referencia que permanecen en la base de pruebas.
- Cada prueba SQL abre una transacción para sus usuarios, medios de pago y gastos sintéticos y la revierte al terminar. Las secuencias pueden avanzar aunque se reviertan las filas; no se supone que los IDs sean consecutivos.
- No se ejecuta `DROP DATABASE`, `TRUNCATE` ni limpieza sobre la base existente.

En una máquina sin permiso para crear bases, el administrador debe aprovisionar la instancia de prueba y su marca siguiendo el contrato del script; no usar una base de la tesis como sustituto. Los errores de preparación hacen fallar el comando, no omiten silenciosamente la integración.

## Comandos

| Comando | Resultado |
| --- | --- |
| `npm test` o `npm run test:unit` | Unitarias de validación y protección del destino; no usa base |
| `npm run test:coverage` | Unitarias y cobertura V8 del backend completo `server/**/*.ts` |
| `npm run test:db:prepare` | Crear/verificar exclusivamente la base de prueba y aplicar migración |
| `npm run test:integration` | Preparación y siete pruebas del contrato SQL real |
| `npm run test:all` | Unitarias y SQL, en secuencia; requiere configuración local de prueba |
| `npm run test:typecheck` | Comprobación de tipos de pruebas, scripts y configuración |
| `npm run server:typecheck` | Comprobación de tipos del backend |
| `npm run typecheck` | Comprobación de tipos de la app |

Reportes regenerables: `reports/unit-results.json`, `reports/integration-results.json`, `coverage/unit/index.html`, `coverage/unit/lcov.info` y `coverage/unit/coverage-summary.json`. Se excluyen de Git; en el paso de CI se publicarán como artefactos.

Las evidencias históricas rojo/verde de DEF-001 se conservan en `evidencias/def-001`. Su grabador impide sobrescribirlas. Ejecutar `npm test` para verificar el código actual; el comando rojo histórico ahora no reproduciría el fallo sin volver a la versión anterior documentada por el parche y el hash.

## Resultados de esta etapa

- Antes de la corrección: 58 unitarias, 55 satisfactorias y 3 fallidas por DEF-001.
- Después: 58 unitarias satisfactorias, sin cambiar la suite entre la ejecución roja y verde.
- PostgreSQL: 7 casos satisfactorios sobre la base aislada, incluyendo repetición de la migración, alta/consulta SQL, rechazo de cero, FK de categoría, unicidad de mensaje, rollback y cascada.
- Verificaciones de tipos de app, backend y pruebas: satisfactorias.
- [Reporte SQL de esta etapa](evidencias/postgres-etapa-2.json): siete casos satisfactorios.
- [Verificación posterior de aislamiento](evidencias/aislamiento-etapa-2.json): `capsaai` conserva las cantidades observadas inicialmente; la base de pruebas termina sin usuarios, medios de pago, gastos ni mensajes sintéticos, y conserva las seis categorías de referencia.

Las pruebas SQL comprueban el esquema y el comportamiento directo de PostgreSQL. **No demuestran aún que el repositorio, sus transacciones ni las rutas HTTP usen correctamente ese contrato**: esas pruebas son el siguiente paso.

| Métrica de cobertura unitaria | Backend `server/**/*.ts` | Validador de gastos |
| --- | ---: | ---: |
| Sentencias | 24,73 % (70/283) | 100 % (70/70) |
| Líneas | 23,39 % (62/265) | 100 % (62/62) |
| Ramas | 37,12 % (62/167) | 98,41 % (62/63) |
| Funciones | 24 % (12/50) | 100 % (12/12) |

Fuente: `npm run test:coverage`, snapshot en [cobertura inicial](evidencias/cobertura-etapa-2.json). Los archivos aún sin pruebas se incluyen como no cubiertos. Los scripts de protección de pruebas no se incorporan al denominador del backend.

Esta es cobertura global del módulo con las unitarias actuales, **no cobertura del sistema completo ni cobertura diferencial de código nuevo**. El mínimo de 50 % todavía no está cumplido; el 80 % incremental y el quality gate tampoco están configurados. La ejecución SQL separada no agrega cobertura de código TypeScript a este reporte.

## Pendiente

Pruebas del repositorio con dobles y PostgreSQL, API, autenticación/autorización de lecturas, smoke, compilación, análisis estático, gate, CI, carga, matriz de elección de herramienta y PDF final. La adopción de Vitest registrada aquí no sustituye el proceso de cinco pasos de una herramienta nueva solicitado por la guía.

Referencias técnicas: [cobertura de Vitest](https://vitest.dev/guide/coverage.html) y [reportes](https://vitest.dev/guide/reporters).
