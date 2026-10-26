# Suite priorizada de nivel 1 y estado del paso 5

Fecha: 26 de octubre de 2026. El equipo solicitó reducir la cobertura existente hacia el 60 % y concentrar las pruebas en los riesgos principales.

## Cambios y criterio de selección

Se conservaron las regresiones de los cuatro defectos: montos que se redondean a cero, duplicados concurrentes, respuesta de un mensaje ajeno y períodos inválidos. También se conservaron montos y fechas límite, firmas, errores de persistencia, commit/rollback, liberación del cliente y protección del destino de pruebas.

Se eliminaron las unitarias de configuración de arranque y casos secundarios de descripción y fecha de confirmación opcionales. Las pruebas del manejador HTTP ahora aíslan lectura y borrado con dobles en lugar de repetir consultas, mapeos y borrados completos; esos recorridos siguen probándose con HTTP y PostgreSQL reales. El caso unitario de usuario desconocido se eliminó por estar probado en integración. Se mantiene el doble de referencias inválidas de categoría/medio de pago y de fallo del proveedor.

La integración conserva alta, lectura, borrado, cascada, referencias inexistentes/ajenas/inactivas, aislamiento de usuarios, reintentos, concurrencia, rollback y restricciones SQL. La comprobación de firma ausente se aplica ahora tanto a alta como a borrado.

La cobertura publicada sigue siendo **unitaria del backend**, no cobertura combinada con integración. Por eso las rutas reales de consulta y borrado pueden tener poca cobertura en ese reporte y a la vez estar verificadas en la suite de integración. Se informa esa diferencia, sin afirmar que los reportes combinan ambas ejecuciones.

No se modificó el código del backend, la referencia inicial, el conjunto de archivos medidos ni los mínimos del gate. No se agregaron exclusiones de cobertura ni pruebas omitidas. El ajuste se hizo seleccionando y aislando los casos de prueba; no representa una mejora de calidad ni más cobertura que la suite anterior.

## Resultado vigente

| Control | Antes del ajuste | Después | Mínimo / regla |
| --- | ---: | ---: | --- |
| Cobertura existente | 199/228 = 87,28 % | 137/228 = **60,09 %** | ≥ 50 % |
| Cobertura nueva | 47/50 = 94 % | 45/50 = **90 %** | ≥ 80 % |
| Unitarias | 121 | **94** | Todas satisfactorias |
| Integración | 26 | **27** | Todas satisfactorias |
| Total de pruebas | 147 | **121** | Todas satisfactorias |
| Errores/advertencias de análisis | 0 / 0 | 0 / 0 | 0 / 0 |
| Duplicación | 0 % | 0 % | ≤ 5 % |

El objetivo cercano al 60 % se aplica al **código existente**, que era la cifra discutida con el equipo. El porcentaje global combina código existente y nuevo; no debe confundirse con ese 60,09 %. Tampoco son porcentajes de avance del TP. El 90 % de código nuevo se conserva por encima del mínimo requerido.

`npm run quality:check` completó todas las etapas satisfactoriamente con la suite reducida: tipos de app/backend/pruebas, compilación, análisis, duplicación, unitarias con cobertura, integración SQL/HTTP y gate.

Evidencia de esta ejecución local: [gate](evidencias/ajuste-nivel-1/gate.json), [etapas](evidencias/ajuste-nivel-1/pipeline-local.json), [cobertura](evidencias/ajuste-nivel-1/cobertura.json), [94 unitarias](evidencias/ajuste-nivel-1/unitarias.json) y [27 de integración](evidencias/ajuste-nivel-1/integracion.json).

## Dónde estamos

Estamos en el **paso 5: pipeline y métricas**. La compilación, el análisis, los reportes y el gate ya están implementados. La primera versión pasó en [GitHub Actions](https://github.com/Geronimo2001/SaverAI/actions/runs/40263110386). Esa ejecución corresponde a la suite anterior, no a esta reducción.

Para cerrar el paso 5:

1. Publicar y verificar esta revisión con la suite reducida, archivando los reportes reales de la nueva ejecución verde.
2. Obtener y conservar una ejecución CI fallida que detecte un defecto real; las evidencias rojas actuales son locales. Si se recrea uno ya corregido, declararlo como reproducción histórica controlada.

Después siguen el smoke de despliegue, el paso 6 (plan y scripts de carga/stress/esfuerzo sostenido, resultados y herramienta nueva en cinco pasos) y el paso 7 (PDF, conclusiones y demostración). La aceptación académica del alcance del backend y de PostgreSQL local como integración externa continúa pendiente.
