# Herramienta nueva: evaluación en cinco pasos

## 1. Requisitos

Para el TP de nivel 1: herramienta de carga local, scripts versionados, HTTP con HMAC SHA-256, perfiles constantes y crecientes, checks de contenido/estado, percentiles y errores, umbrales con salida no cero, reportes legibles por CI, macOS y Linux, sin cuenta cloud ni gasto obligatorio. El equipo ya usa TypeScript/JavaScript; se prioriza facilidad para explicar y repetir la prueba.

## 2. Relevamiento de mercado

| Candidata | Capacidades verificadas en documentación | Coste de incorporación en este proyecto |
| --- | --- | --- |
| Grafana k6 | Scripts JavaScript, escenarios/VUs, checks, umbrales y resumen JSON; HMAC integrado | Binario adicional; runtime propio, no Node.js |
| Artillery | Flujos YAML/JS/TS, fases de llegada, métricas HTTP, CLI | Se integra con Node; requiere configurar validaciones y reportes del flujo |
| Locust | Escenarios en Python, CLI/interfaz web, métricas exportables | Agrega Python y aprendizaje de un segundo lenguaje al flujo del equipo |

Fuentes oficiales consultadas el 26/10/2026:
[k6 instalación](https://grafana.com/docs/k6/latest/set-up/install-k6/),
[k6 umbrales](https://grafana.com/docs/k6/latest/using-k6/thresholds/),
[k6 resumen](https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/),
[k6 firma HMAC](https://grafana.com/docs/k6/latest/javascript-api/k6-crypto/hmac/),
[Artillery scripts](https://www.artillery.io/docs/reference/test-script),
[Artillery CLI](https://www.artillery.io/docs/reference/cli/run),
[Locust](https://docs.locust.io/en/stable/what-is-locust.html).

La comparación es documental. No se afirma haber ejecutado las tres herramientas ni medido su rendimiento relativo.

## 3. Prueba de concepto

Candidata inicial: k6 **2.3.0**, versión oficial fijada con SHA-256 de sus archivos de distribución para macOS/Linux. Instalación dentro de `.tools/`, ignorada por Git; sin alterar el backend ni instalar herramientas globales. El instalador y las descargas quedan reproducibles en CI.

PoC prevista: un usuario virtual completa un alta/consulta/borrado, valida resultados, genera JSON y sale con código 0. Se verificará además que un umbral incumplido produce salida no cero, sin alterar los umbrales de los perfiles reales. Resultado: PoC satisfactoria, 4 solicitudes HTTP y 4 comprobaciones correctas, 1 recorrido completo y limpieza verificada. [Reporte original](evidencias/carga/poc/poc-k6.json) y [metadatos](evidencias/carga/poc/poc-run.json).

La comprobación separada `npm run test:load:probe` agregó exclusivamente en la PoC el umbral imposible `http_reqs: count<0`: k6 terminó con código **99**, con todas las respuestas funcionales correctas. El runner de esa comprobación devuelve 0 cuando observa ese rechazo esperado; el código 99 de k6 está en el [reporte](evidencias/carga/poc/probe-summary.json). No es un defecto del backend ni reemplaza la evidencia roja real de DEF-001. Los perfiles load/stress/soak no activan ese umbral.

## 4. Matriz de decisión

Escala 1–5; pesos acordes a las necesidades del TP. Las puntuaciones son juicio técnico explícito, no un benchmark de proveedores.

| Criterio | Peso | k6 | Artillery | Locust |
| --- | ---: | ---: | ---: | ---: |
| Afinidad del equipo con scripts | 30 % | 4 | 5 | 2 |
| Umbrales y salida para CI | 25 % | 5 | 4 | 4 |
| Perfiles y métricas requeridas | 20 % | 5 | 5 | 5 |
| Firma y validaciones HTTP | 15 % | 5 | 4 | 5 |
| Instalación local/CI sin servicio cloud | 10 % | 4 | 4 | 4 |
| Total ponderado / 5 | 100 % | **4,60** | **4,50** | **3,75** |

Decisión confirmada tras la PoC: k6 por sus umbrales y escenarios explícitos; Artillery sería una alternativa cercana si se priorizara exclusivamente Node. No se exige una cuenta Grafana ni se enviarán datos a su nube.

## 5. Despliegue incremental

1. Instalar la versión fijada y ejecutar PoC.
2. Ejecutar referencia, stress acotado y esfuerzo sostenido corto sobre base aislada.
3. Incorporar referencia y stress al comando de calidad; publicar reportes automáticos en CI.
4. Mantener soak como comando manual, según nivel 1.
5. Revisar resultados y limitaciones antes de ampliar carga, duración o ejecutar en un entorno remoto.

La PoC original se conserva con sus hashes de código y entorno. Posteriormente se ajustó la coordinación del cierre de procesos/conexión; por eso su hash del runner puede diferir de la implementación final. Los resultados de perfiles y CI se conservarán por separado con los hashes correspondientes.

Estado: PoC y perfiles locales ejecutados; integración del comando de calidad implementada; verificación remota pendiente. Los resultados y límites están en [cierre del paso 6](12-resultados-de-carga.md). El equipo debe poder explicar VUs, percentiles, umbrales y diferencias entre carga/stress/esfuerzo sostenido.
