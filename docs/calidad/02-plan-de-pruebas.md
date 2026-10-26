# Plan de pruebas — nivel 1 inicial

Estado: primera versión. Los criterios siguientes se fijan antes de ejecutar la suite. Salvo indicación expresa, los casos están **diseñados, no ejecutados**.

Actualización de ejecución: los resultados posteriores a este diseño se registran en [entorno inicial](04-entorno-de-pruebas.md) y [contrato y resultados actuales](05-contrato-y-resultados.md). Mantener separados criterio previsto y evidencia ejecutada.

## Objetivos medibles

| Perspectiva | Objetivo | Evidencia prevista |
| --- | --- | --- |
| Usuario | Ningún gasto inválido del conjunto de casos se persiste; un reintento no duplica el gasto | Validación, API e integración con verificación de filas |
| Equipo | Cobertura existente ≥ 50 %, nueva ≥ 80 %; regresión para cada defecto corregido | Reportes y vínculos entre caso, defecto y commit |
| Organización | Ninguna entrega supera un gate con bugs críticos o duplicación > 5 % | Pipeline bloqueante y reportes archivados |
| Continuidad | Una caída de la base no produce confirmaciones falsas ni escrituras parciales | Dobles que fallen y comprobación de rollback |

Los umbrales de latencia y carga se fijarán en el plan de rendimiento antes de ejecutarlo, indicando hardware, volumen, concurrencia y duración. No se deducirán después de observar los resultados.

## Criterios de entrada y salida

Entrada: alcance documentado; dependencias instalables; verificación de tipos satisfactoria; fixtures sintéticos; base de prueba aislada; configuración de prueba que no utilice accidentalmente `capsaai`; casos con resultado esperado; referencia de código inicial definida para cobertura incremental.

Salida: casos críticos ejecutados y satisfactorios; sin defectos críticos abiertos dentro del alcance; cobertura y gate cumplidos con denominadores publicados; scripts reproducibles; evidencias CI roja y verde; smoke y cargas ejecutados según nivel; trazabilidad actualizada; informe consistente con reportes. Lo que no se alcance se declara expresamente como incumplido.

## Contrato de integración a documentar y probar

Dependencia: PostgreSQL mediante `pg`. Configuración: variable de entorno; credenciales fuera del repositorio. Datos de prueba: dos usuarios, categorías válidas, medios de pago activos/inactivos y mensajes sintéticos.

- Las consultas usan parámetros para los datos de entrada.
- Alta atómica de `expenses` y `whatsapp_processed_messages`, con `COMMIT` o `ROLLBACK` y liberación del cliente.
- Referencias existentes y medio de pago perteneciente al usuario y activo.
- Identificadores de mensajes no duplicados en reintentos; comprobar también concurrencia.
- Lectura filtrada por usuario y período; el manejo de períodos inválidos debe definirse y verificarse.
- Borrado acotado a usuario e identificador, con cascada de mensajes asociados.
- Errores de conexión, ejecución y transacción con resultado controlado.

Los dobles verifican decisiones del código; una prueba contra PostgreSQL aislado verifica SQL, restricciones y persistencia reales. No son evidencias intercambiables.

## Requisitos y trazabilidad inicial

| Requisito | Criterio de aceptación | Casos previstos | Nivel | Defecto |
| --- | --- | --- | --- | --- |
| REQ-01 Validar monto | Todo resultado válido contiene un entero mayor a 0 y hasta 100.000.000, coherente con la persistencia | CP-001 válido; CP-002 cero/negativo/no numérico; CP-003 monto que redondea a cero; CP-004 máximo y superior | Unitaria/API | DEF-001 para CP-003 |
| REQ-02 Validar campos | IDs, comercio, categoría y medio de pago obligatorios; comercio entre 2 y 80 caracteres | CP-005 ausentes/vacíos; CP-006 longitudes 1/2/80/81 | Unitaria | — |
| REQ-03 Validar fecha | Fecha real YYYY-MM-DD y no futura respecto de un reloj fijo | CP-007 hoy/ayer/mañana; CP-008 fecha inexistente, año bisiesto y formato incorrecto | Unitaria | — |
| REQ-04 Comprobar referencias | Rechazar usuario/categoría inexistentes y medio de pago ajeno o inactivo sin insertar | CP-009 tabla de referencias | Integración/API | — |
| REQ-05 Evitar duplicados | Un mismo mensaje no produce dos gastos; el reintento obtiene resultado de duplicado | CP-010 reintento secuencial; CP-011 mensajes solapados y solicitudes simultáneas | Integración/API | DEF-002 |
| REQ-06 Guardar atómicamente | Fallo de una escritura revierte todas las escrituras del alta; cliente liberado | CP-012 commit; CP-013 fallo/rollback/liberación | Unitaria con dobles/integración | — |
| REQ-07 Consultar gastos | Devolver únicamente filas del usuario y período solicitado; período presente inválido devuelve 400 | CP-014 dos usuarios y dos períodos; CP-015 período inválido y usuario ausente | API/integración | DEF-004 |
| REQ-08 Deshacer un gasto | Borrar solo el gasto del usuario; limpiar mensajes asociados; inexistente devuelve 404 | CP-016 borrado/cascada; CP-017 ajeno/inexistente | API/integración | — |
| REQ-09 Verificar firma | Una escritura sin firma válida se rechaza antes de acceder al repositorio | CP-018 firma válida/ausente/alterada | Unitaria/API | — |
| REQ-10 Controlar caída | Una falla de base no confirma el alta ni deja registros parciales | CP-019 conexión caída y error de consulta | Integración con dobles | — |
| REQ-11 Preparar entorno | La migración funciona sobre base vacía y puede repetirse según contrato documentado | CP-020 migración y datos iniciales | Integración | — |
| REQ-12 Verificar despliegue | Backend operativo, acceso a PostgreSQL y recorrido sintético mínimo satisfactorios | CP-021 smoke | Sistema/smoke | [Smoke local ejecutado](09-smoke-test.md); demo final pendiente |
| REQ-13 Proteger respuesta de duplicado | Mensaje ya asociado a otro usuario devuelve conflicto sin exponer el gasto original | CP-022 reutilización por otro usuario | API/integración | DEF-003 |

La unidad monetaria exacta y el tratamiento de decimales requieren una decisión registrada antes de corregir DEF-001. La condición mínima ya verificable es que un resultado válido nunca entregue cero a una columna que lo prohíbe. No cambiar la política monetaria de la tesis sin documentarla.

El aislamiento funcional por `userId` no demuestra autenticación/autorización: las rutas de lectura actuales reciben ese identificador de la consulta sin autenticar al solicitante. Se registra como riesgo y limitación.

## Diseño de casos

- Equivalencias de monto: válido; no numérico; no positivo; superior al máximo; positivo que se redondea a cero.
- Límites de monto: -1, 0, 0.1, 1, 99.999.999, 100.000.000 y 100.000.001. No fijar resultados definitivos para otros decimales sin resolver la política monetaria.
- Límites de comercio: 1, 2, 80 y 81 caracteres; agregar espacios y texto vacío.
- Fechas: hoy, ayer, mañana, 29 de febrero válido/inválido, mes o día inexistente. Usar reloj fijo.
- Decisiones: usuario existente, categoría existente, medio propio/activo y mensaje ya procesado. Incluir las combinaciones críticas y publicar la tabla completa al implementar CP-009/010.
- Cada prueba unitaria separará Arrange, Act y Assert. Medir sentencias y ramas; la cobertura no demuestra por sí sola corrección.

## Riesgos iniciales

Escalas: probabilidad e impacto de 1 (bajo) a 3 (alto). Son estimaciones iniciales del análisis, no frecuencias medidas. Prioridad: 6–9 alta, 3–4 media, 1–2 baja.

| Riesgo | Prob. | Impacto | Producto | Mitigación / prueba |
| --- | ---: | ---: | ---: | --- |
| Pruebas alteran datos existentes | 2 | 3 | 6 | Base separada, fixtures sintéticos y protección del destino |
| Lectura de datos ajenos por identificación sin autenticar | 3 | 3 | 9 | Registrar límite de autorización y verificar separación; corrección a definir |
| Duplicado bajo concurrencia | 2 | 3 | 6 | CP-010/011 y restricciones reales |
| Alta parcial ante error | 2 | 3 | 6 | CP-013 y transacciones |
| Base caída o consulta bloqueada | 2 | 3 | 6 | CP-019, tiempos de espera y contingencia |
| Monto aceptado incompatible con esquema | 3 | 2 | 6 | CP-003 y DEF-001 |
| Período inválido altera consulta o provoca error | 2 | 2 | 4 | CP-015 |
| Cobertura parcial presentada como global | 2 | 3 | 6 | Publicar inclusiones/exclusiones y acordar alcance académico |
| Base local no aceptada como sistema externo | 2 | 3 | 6 | Confirmar interpretación; alternativa con instancia de servicio de prueba |

## ISO/IEC 25010: ocho características de la guía

Se utiliza el conjunto de ocho características solicitado por la cátedra; esta matriz no afirma conformidad certificada.

| Característica | Aplicación | Evidencia prevista | Estado |
| --- | --- | --- | --- |
| Adecuación funcional | Gastos correctos, referencias y consultas | CP-001 a CP-017 | Pendiente |
| Eficiencia de desempeño | Latencia, errores y estabilidad con carga | Scripts de stress y esfuerzo sostenido, reportes | Pendiente |
| Compatibilidad | Interoperabilidad backend–PostgreSQL y contrato HTTP | CP-009 a CP-020 y contrato versionado | Pendiente |
| Usabilidad | Errores comprensibles para el consumidor de la API | Casos de respuesta inválida y revisión de mensajes; interfaz fuera del módulo | Pendiente / parcial por alcance |
| Fiabilidad | Atomicidad, duplicados, recuperación ante fallas | CP-010 a CP-013 y CP-019 | Pendiente |
| Seguridad | Firma, consultas parametrizadas, separación y autorización | CP-014/017/018 y análisis de riesgo de lectura | Pendiente; limitación conocida |
| Mantenibilidad | Pruebas, tipos, complejidad y duplicación | Reportes de análisis/cobertura, revisión y gate | Tipos verificados; resto pendiente |
| Portabilidad | Entorno reproducible y migración | CP-020 y despliegue desde instrucciones | Pendiente |

Top 3: adecuación funcional (los datos deben representar el gasto), fiabilidad (no perder ni duplicar registros) y seguridad (datos financieros de usuarios). Rendimiento se evalúa también, sin desplazar los riesgos de integridad y acceso.

## Siete principios del testing aplicados

1. Las pruebas muestran defectos: un caso verde no demuestra ausencia de errores en SQL o concurrencia.
2. Probar todo es imposible: priorizar montos, referencias, atomicidad, duplicados y separación de usuarios.
3. Probar temprano: fijar aceptación y probar validación antes de persistir.
4. Los defectos se agrupan: revisar especialmente validadores, repositorio y límites entre ambos.
5. Las pruebas pierden eficacia si no evolucionan: incorporar regresiones y nuevos datos, fechas y escenarios de concurrencia.
6. El testing depende del contexto: en gastos financieros pesan integridad, trazabilidad y privacidad.
7. Ausencia de errores no garantiza utilidad: confirmar que registrar, consultar y deshacer cubre la necesidad del usuario de la tesis.

## QA, QC y métricas

QA: criterios previos, revisión de código, contrato, gestión de riesgos, política de ambientes y gate bloqueante. QC: ejecutar casos, analizar resultados, registrar defectos y verificar correcciones.

| Métrica | Tipo | Cálculo / interpretación |
| --- | --- | --- |
| Cobertura de sentencias y ramas | Producto | Reportar porcentajes, archivos incluidos y denominador; existente ≥ 50 % y nuevo ≥ 80 % según alcance publicado |
| Bugs críticos y duplicación | Producto | Gate rechaza cualquier bug crítico o duplicación > 5 %; especificar ámbito de cada regla |
| Tiempo de resolución | Proceso | Fecha de cierre verificado menos fecha de apertura; sin cierre no informar duración final |
| Requisitos verificados | Proyecto | Requisitos con casos requeridos satisfactorios / requisitos del alcance × 100 |
| Latencia p95 y tasa de errores | Producto | Medidas por escenario de carga con entorno y volumen registrados |

Mejora antes/después propuesta: CP-003 rechazando montos incompatibles y cobertura del validador antes/después de incorporar su suite. No inventar valores de cobertura iniciales.

## Próximos entregables

Mapa de herramientas (Expo, TypeScript, Node.js, PostgreSQL, Git y herramientas de pruebas/análisis/CI/carga seleccionadas); evaluación de una herramienta nueva en cinco pasos; scripts ejecutables con comandos documentados y comando agregador; reportes automáticos; tareas y aportes individuales; ejecuciones CI roja/verde; PDF y guion de demostración. La compilación debe ser una verificación independiente del chequeo de tipos.
