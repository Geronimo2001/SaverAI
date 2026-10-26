# Cierre técnico y lectura de la entrega

## Material preparado

- Informe PDF: [Informe integrador de nivel 1](../../output/pdf/Informe_Calidad_Nivel1_CapsaAI.pdf), 12 páginas, revisadas por renderizado.
- [Registro de tareas, integrantes y trabajo conjunto](14-registro-de-entrega.md).
- [Guion de demostración y defensa](15-guion-de-defensa.md).
- Comando de demostración: `npm run demo:quality`.
- Generador reproducible del PDF: `python3 scripts/generar-informe.py` (requiere `reportlab`).
- Evidencia nueva: `evidencias/entrega/demo/` y `evidencias/entrega/issues/`.

## Resultados vigentes y su procedencia

El informe distingue la medición CI de la etapa 6, los ensayos locales históricos y la demostración nueva. No reemplaza ni modifica esos reportes.

- Suite: 94 unitarias + 27 integraciones = 121 pruebas satisfactorias.
- Cobertura unitaria existente: 137/228 = 60,09 %. Nueva: 45/50 = 90 %.
- Sentencias: 194/298 = 65,10 %. Ramas V8: 114/168 = 67,85 %; no es MC/DC.
- Duplicación: 0 %; análisis sin errores/advertencias dentro del backend.
- Métrica de proceso: pipeline CI de la ejecución 40328308100, 83,081 segundos desde inicio hasta fin del runner, sin cola.
- Métrica de proyecto: 4/4 defectos corregidos con regresión conservada y ejecutada.
- Mejora funcional: 7 fallos/26 casos → 0/26 en la misma suite histórica de integración.
- Defectos: [DEF-001 #7](https://github.com/Geronimo2001/SaverAI/issues/7), [DEF-002 #8](https://github.com/Geronimo2001/SaverAI/issues/8), [DEF-003 #9](https://github.com/Geronimo2001/SaverAI/issues/9) y [DEF-004 #10](https://github.com/Geronimo2001/SaverAI/issues/10), registros retrospectivos cerrados con evidencia de corrección previa.

La primera falla del script nuevo de demo fue una incompatibilidad de top-level await con el formato CommonJS del proyecto; se corrigió antes de la demostración satisfactoria. No se presenta esa falla de preparación como un defecto nuevo de negocio ni como la CI roja exigida por la guía.

## Demostración local ejecutada

Se preparó una copia temporal nueva del backend compilado y se probaron sus procesos reales, usando dependencias ya instaladas mediante un enlace. El manifiesto registra 22 archivos compilados/mapas; no se hizo una instalación independiente de dependencias ni un despliegue cloud.

- Smoke: las 10 comprobaciones satisfactorias.
- Load: 156 ciclos, 624 solicitudes, p95 4,79 ms.
- Stress: 2120 ciclos, 8480 solicitudes, p95 4,73 ms.
- Soak: 930 ciclos, 3720 solicitudes, p95 4,39 ms.
- Todas las comprobaciones funcionales, recuperación y limpieza satisfactorias; la copia temporal fue retirada.
- También se verificó el smoke normal después de admitir un punto de entrada de artefacto configurable.

Los valores son de esta ejecución local, no de la CI anterior. La carga sigue siendo cerrada, acotada a 20 VUs máximos y soak de 2 minutos.

## Pendientes que el informe declara

1. Aceptación académica del backend como alcance y de PostgreSQL local como integración externa; no confirmada por el equipo.
2. Evidencia personal de cada integrante. El equipo declaró trabajo conjunto; no se inventó reparto retrospectivo ni commits individuales.
3. Exposición ante la cátedra y, si se exige, despliegue remoto. La copia local ya fue demostrada; no equivale a cloud.

La autenticación de lecturas, la operación completa ante caídas, las cargas prolongadas y la interfaz completa permanecen fuera de lo resuelto; el informe los incluye como límites y mejoras. Estas limitaciones no deben ocultarse al presentar las metas cumplidas.

## Flujo de Git

Se partió de main `05c0206`, que contiene el PR #6 del paso 6. Esta entrega se publica en `codex/entrega-nivel-1`. No se crea ni se fusiona un PR desde esta tarea. El equipo debe abrir el PR de esta rama hacia main y observar el check obligatorio quality; la protección exige además una aprobación.
