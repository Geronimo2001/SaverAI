# Guion de demostración y defensa

## Estado del repositorio

El PR #6 fue fusionado por el equipo a main en el commit `05c0206d247e9fb3496672b721794cbe72eccb5a`. La entrega final se prepara desde ese main en `codex/entrega-nivel-1`. No abrir ni fusionar PRs desde scripts: el equipo revisará y abrirá el próximo.

## Antes de mostrar

1. Instalar Node 24 y PostgreSQL local; `npm ci`.
2. Configurar `.env.test.local` según `.env.test.example`, sin mostrar credenciales en pantalla.
3. Revisar que `TEST_DATABASE_URL` identifica exclusivamente `capsaai_quality_test`.
4. Tener abiertos el plan, el registro de defectos, el PR #6 y las ejecuciones CI roja/verde.
5. Explicar que el objeto evaluado es el backend con PostgreSQL local; no presentar la app completa ni una integración WhatsApp real como verificadas.

## Recorrido sugerido

- Presentar nivel 1, integrantes, trabajo conjunto y alcance.
- Mostrar un requisito y su caso, por ejemplo REQ-01 → CP-003 → DEF-001. Describir entrada 0.1, resultado defectuoso cero, corrección y misma prueba en rojo/verde.
- Mostrar CI roja histórica controlada 40265714889 y verde 40265838359. Aclarar que no se descubrió de nuevo el defecto.
- Explicar el gate: existente ≥50 %, nuevo ≥80 %, duplicación ≤5 %, análisis sin hallazgos y pruebas satisfactorias; el check obligatorio también exige que pasen carga y stress.
- Mostrar 60,09 % existente y 90 % nuevo. La cobertura mide código de backend ejecutado por unitarias, no líneas de tests ni porcentaje de avance del TP.
- Mostrar la protección de main y el PR #6. El verde habilita el merge, no lo realiza. Actualmente se exige además una aprobación; no está habilitada la condición de actualizar la rama antes del merge.
- Ejecutar la demostración nueva de abajo. Mostrar cada paso y el JSON final.
- Interpretar VUs, p95, errores y la diferencia entre stress acotado y esfuerzo sostenido corto.
- Cerrar con límites reales, pendientes y conclusiones del PDF.

## Demostración de una copia recién desplegada localmente

```bash
npm run demo:quality
```

El comando compila, verifica/prepara la base sintética e instala/verifica k6. Crea un directorio temporal nuevo, copia allí el backend compilado y su package.json, enlaza las dependencias ya instaladas y registra los hashes de los archivos desplegados. No hace una instalación independiente de dependencias ni publica en internet.

Después ejecuta el smoke y los tres perfiles de carga utilizando el punto de entrada de esa copia. Los runners levantan instancias temporales del artefacto, verifican HTTP y PostgreSQL, limpian sus datos y cierran los procesos. Finalmente se retira la copia temporal. La duración nominal de carga es 20 + 50 + 120 segundos, más preparación y cierre.

Resultado esperado: todas las etapas con salida 0, `reports/demo/deployment.json` con `passed: true` y `releaseRemoved: true`, smoke satisfactorio y `performance-run.json` con perfiles completos y limpieza satisfactoria.

La carpeta nueva y los procesos temporales constituyen la demostración de despliegue **local** adoptada. No equivalen a un despliegue remoto ni a una instalación desde cero de todo el sistema. Si la cátedra exige cloud, ese requisito queda pendiente; no se cambia silenciosamente la definición.

## Comandos alternativos

- `npm run quality:check`: pipeline completo, incluye load/stress.
- `npm run test:all`: unitarias, integración, smoke y load/stress/soak.
- `npm run test:smoke`: recorrido mínimo local.
- `npm run test:stress` y `npm run test:soak`: perfiles separados.

## Si algo falla durante la defensa

Detener la demostración, conservar el reporte y describir el fallo. No borrar evidencia ni bajar umbrales para obtener verde. Si PostgreSQL está caído, no se confirma persistencia. El backend tiene respuesta 500 genérica y rollback probado; un manejo operativo completo de indisponibilidad, reintentos y tiempos de espera sigue siendo mejora pendiente.

La interrupción forzada puede impedir limpieza; revisar únicamente las cuentas sintéticas creadas por esta ejecución. No usar la base original como alternativa. Los reportes incluyen secretos omitidos; no abrir ni proyectar los archivos .env.

## Evidencia de ejecución

La demostración fue ejecutada y aprobada. Se conservan el [manifiesto del despliegue local](evidencias/entrega/demo/deployment.json), el [smoke](evidencias/entrega/demo/smoke-results.json) y las [cargas y limpieza](evidencias/entrega/demo/performance-run.json). La copia temporal fue retirada al finalizar. El commit de partida del manifiesto es main 05c0206; los scripts de demostración se prepararon en el árbol de trabajo de esta entrega antes de su commit.
