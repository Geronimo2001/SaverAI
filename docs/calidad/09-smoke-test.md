# Smoke del backend — CP-021 / REQ-12

## Ubicación y finalidad

El script está en `tests/smoke/backend.smoke.ts`; su comando está en `package.json`. Comprueba rápidamente que el backend compilado inicia y completa el recorrido mínimo HTTP → PostgreSQL → respuesta, sin dobles. Complementa las unitarias y la integración con una comprobación del punto de arranque real `dist/server/server.js`.

Para nivel 1 se invoca manualmente. No está conectado al workflow ni a un despliegue remoto. Esta ejecución comprueba una instancia local recién iniciada del artefacto compilado; la demostración final de despliegue del TP sigue pendiente.

## Preparación y ejecución con un comando

Requisitos: dependencias instaladas con `npm ci`, PostgreSQL local activo y `.env.test.local` con `TEST_DATABASE_URL`, siguiendo [el entorno de pruebas](04-entorno-de-pruebas.md). El destino debe ser exclusivamente `capsaai_quality_test`, con la marca de base sintética verificada por los scripts existentes. No usa `DATABASE_URL` como alternativa.

```bash
npm run test:smoke
```

El comando compila el backend, prepara la base aislada y ejecuta el smoke. No hace falta iniciar el servidor a mano: el script elige un puerto libre, crea un secreto temporal y lanza el backend como otro proceso. No se necesita una URL pública.

`npm run test:all` ejecuta unitarias, integración y smoke en secuencia. El smoke no se agrega a la medición de cobertura unitaria ni al conteo histórico de 121 pruebas: es un recorrido adicional CP-021.

## Criterios fijados antes de ejecutar

| Comprobación | Resultado esperado |
| --- | --- |
| Destino y datos | Base aislada verificada; usuario y tarjeta sintéticos únicos |
| Arranque | Proceso del backend compilado inicia en menos de 10 segundos |
| Salud | `GET /health` → 200, `status: ok` |
| Acceso a base | `GET /categories` → 200, categoría `super` presente |
| Alta | POST firmado de gasto por 1500 → 201, `status: created`, monto correcto |
| Consulta | GET de gastos del usuario y enero de 2026 → 200, exactamente el gasto creado |
| Borrado | POST firmado → 200, `status: deleted`; consulta posterior vacía; mensaje asociado eliminado en SQL |
| Limpieza | Proceso detenido, usuario sintético eliminado y conexión cerrada |

Cada solicitud HTTP tiene un límite de 5 segundos; el arranque permite 10 segundos y el apagado ordenado 5 segundos. Son límites operativos del smoke, no objetivos de rendimiento. Los criterios de carga se definirán por separado.

## Resultado y limpieza

Éxito: salida `Smoke APROBADO` y código de salida 0. Cualquier comprobación o limpieza fallida produce salida no cero. Si falla la compilación o la preparación de la base, el comando se detiene antes de iniciar el smoke; en ese caso no hay un nuevo reporte del recorrido HTTP.

El script genera `reports/smoke-results.json` con fechas, duración, resultado de cada comprobación y hashes del script y punto de entrada compilado. No guarda credenciales, firmas ni el secreto temporal. El reporte se sobrescribe al repetir el smoke; `quality:check` limpia `reports/`, por lo que la evidencia para entregar se conserva por separado en la documentación.

La limpieza en `finally` borra únicamente el usuario creado por esta ejecución y sus datos asociados; no trunca tablas. Si se interrumpe a la fuerza el proceso del script o cae PostgreSQL durante la limpieza, puede quedar el usuario sintético identificado por el prefijo `smoke-`; revisar el entorno antes de repetir. La base original `capsaai` no es un destino permitido.

Este smoke no verifica la interfaz móvil, WhatsApp real, un servicio cloud ni capacidad bajo carga. `/health` por sí solo no verifica PostgreSQL: esa comprobación la aportan catálogo, alta y consulta.

## Ejecuciones registradas

Ejecutado el 26 de octubre de 2026 sobre PostgreSQL local y el backend compilado:

- [Primera ejecución](evidencias/smoke/primera-ejecucion.json): las 10 comprobaciones satisfactorias, salida 0.
- [Repetición](evidencias/smoke/repeticion.json): las mismas 10 comprobaciones satisfactorias, salida 0; incluye cierre y limpieza.
- [Destino rechazado](evidencias/smoke/destino-rechazado.json): al invocar directamente el script con `TEST_DATABASE_URL=postgresql://localhost/capsaai`, rechazó el destino antes de abrir la conexión o crear fixtures, salida 1. Es una comprobación del aislamiento, no un defecto nuevo ni la evidencia roja de CI.
- `npm run test:typecheck`: satisfactorio.

Los hashes del script coinciden en los tres reportes. La invocación manual y la generación de evidencias no modifican el alcance de cobertura del backend.
