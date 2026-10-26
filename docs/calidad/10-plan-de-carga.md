# Paso 6 — Plan de carga del backend (nivel 1)

Plan y criterios definidos antes de ejecutar; resultados reales posteriores en [cierre del paso 6](12-resultados-de-carga.md). Alcance: API HTTP y PostgreSQL aislado; no interfaz, WhatsApp real ni nube.

## Objetivo, riesgos y aceptación

REQ-06/07/08/12: bajo concurrencia acotada, cada gasto se guarda, se recupera y se borra correctamente. Riesgos: errores de base/conexión, tiempos altos y datos residuales. No se busca certificar capacidad productiva ni encontrar el punto de saturación en la computadora del equipo.

Recorrido por usuario virtual: alta firmada de un gasto sintético → consulta de ese gasto → borrado firmado → consulta vacía → pausa de 250 ms. Cada usuario virtual usa una cuenta exclusiva, un mensaje único por iteración y una tarjeta sintética. No se comparten usuarios entre VUs; los duplicados simultáneos se verifican en la integración ya existente.

Criterios previos, iguales para los perfiles: 0 solicitudes HTTP fallidas; 100 % de comprobaciones funcionales correctas; al menos un recorrido completo; p95 de solicitudes menor que 500 ms y p99 menor que 1000 ms. Son objetivos iniciales del entorno de pruebas, no un SLA acordado para producción. Una iteración incorrecta o interrumpida no cuenta como éxito. También se exige que no queden gastos/mensajes de esta ejecución, que el backend responda después y que la limpieza final termine.

## Perfiles versionados

| Perfil | Concurrencia y duración programada | Propósito |
| --- | --- | --- |
| poc | 1 VU, 1 recorrido | Verificar instalación, firma, métricas y JSON antes de adoptar |
| load | 2 VUs constantes, 20 s | Línea de referencia mínima de nivel 1 |
| stress | 1→5→10→20 VUs en tramos de 10 s, mantener 20 durante 10 s, bajar a 0 en 10 s (50 s) | Incremento acotado de presión y recuperación |
| soak | 2 VUs constantes, 120 s | Esfuerzo sostenido corto y reproducible para nivel 1 |

Se permite un margen de hasta 10 s para finalizar iteraciones en curso. Cada solicitud tiene timeout de 5 s. El modelo es cerrado: los VUs esperan sus respuestas; la tasa de solicitudes resultante no es una tasa de llegada impuesta. Si el servidor se vuelve lento, la presión puede bajar. No extrapolar los resultados a una cantidad garantizada de usuarios reales.

Dos minutos no demuestran ausencia de fugas durante horas. El stress tiene un máximo deliberado de 20 VUs y no afirma haber alcanzado saturación. Los perfiles no miden CPU, memoria ni utilización de PostgreSQL: esos estudios quedan como ampliación.

## Entorno, datos y contingencia

Backend compilado ejecutado en un proceso local temporal y base `capsaai_quality_test` con marcador verificado. El runner prepara únicamente cuentas sintéticas propias y limpia sus IDs; no trunca tablas. La URL del backend se genera internamente y no puede apuntar a un servicio externo. Se conserva el guard existente de base local. No ejecutar con datos productivos.

Si falla un umbral, el comando devuelve un código no cero y conserva el reporte. Si el backend no arranca, no se inicia la carga. Si hay un fallo, el runner intenta detener ambos procesos y limpiar sus datos. Una interrupción forzada del sistema podría impedir la limpieza; identificar las cuentas con prefijo `load-` antes de repetir. No modificar umbrales para ocultar fallos.

La preparación aplica la migración de pruebas; requiere PostgreSQL local y `.env.test.local` como las integraciones. Los perfiles se ejecutan en secuencia para no competir entre sí. El generador, servidor y PostgreSQL comparten equipo: los resultados dependen del entorno y no son comparables directamente con un servicio remoto.

## Comandos y evidencia prevista

Scripts en `tests/load/`, coordinación en `tests/load/run.ts` y herramienta fijada por `scripts/install-k6.mjs`.

- `npm run test:load:poc`: prueba de concepto.
- `npm run test:load`: referencia.
- `npm run test:stress`: incremento acotado.
- `npm run test:soak`: esfuerzo sostenido corto.
- `npm run test:performance`: load, stress y soak en secuencia.
- `npm run test:all`: unitarias, integración, smoke y los tres perfiles.

Reportes por perfil: JSON original de k6, resumen interpretado, salida de consola y metadatos de entorno/limpieza. Archivar evidencia bajo `docs/calidad/evidencias/carga/`. No se agregan estas ejecuciones a los porcentajes de cobertura unitaria.

Despliegue incremental previsto: PoC local → perfiles locales → load y stress en CI con reportes automáticos; soak manual de nivel 1. El workflow existente conserva `reports/` incluso al fallar. La referencia, el stress y el soak locales ya se ejecutaron; los resultados se conservan separados de este plan.
