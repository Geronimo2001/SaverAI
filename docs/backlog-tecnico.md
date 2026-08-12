# Backlog tecnico - CapsaAI

Este backlog separa las tareas que se pueden avanzar sin terceros de las que requieren decisiones, credenciales o contratos externos.

## Estado de alcance

| Tipo | Estado |
| --- | --- |
| Tareas que se pueden hacer ahora | Arquitectura, modelo de datos, contratos, UI mockeada, reglas locales, dashboard con datos internos. |
| Tareas parcialmente bloqueadas | OCR, audio, email, ubicacion, notificaciones, scrapers de promociones. |
| Tareas bloqueadas por usuario/proveedor | WhatsApp API, cuentas cloud, permisos OAuth, fuentes oficiales de bancos/comercios. |

## Epica 1 - Base de producto

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| P-01 | Definir entidades principales del dominio. | Ninguna | Alta |
| P-02 | Definir estados de transacciones e ingestas. | Ninguna | Alta |
| P-03 | Definir modelo de permisos por usuario y grupo. | Ninguna | Alta |
| P-04 | Definir categorias base para Argentina. | Ninguna | Alta |
| P-05 | Definir contratos de API para mobile y workers. | Ninguna | Alta |

## Epica 2 - Usuarios y seguridad

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| U-01 | Registro de usuario con email y password. | Backend real | Alta |
| U-02 | Login y cierre de sesion. | Backend real | Alta |
| U-03 | Hash de password y sesiones/JWT. | Backend real | Alta |
| U-04 | Middleware de autorizacion por user_id. | Backend real | Alta |
| U-05 | Baja de cuenta y retencion de datos. | Politica de datos | Media |
| U-06 | Consentimiento para email, ubicacion y WhatsApp. | Definir textos legales | Media |

## Epica 3 - Gastos

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| G-01 | Crear gasto manual. | Backend real | Alta |
| G-02 | Editar gasto. | Backend real | Alta |
| G-03 | Eliminar gasto. | Backend real | Alta |
| G-04 | Listar y filtrar gastos. | Backend real | Alta |
| G-05 | Asociar gasto a tarjeta, categoria y comercio. | Modelo de datos | Alta |
| G-06 | Detectar duplicados simples por monto, fecha y comercio. | Datos reales | Media |
| G-07 | Marcar gastos como pendientes de confirmacion. | Worker ingesta | Alta |

## Epica 4 - Tarjetas

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| T-01 | Alta de tarjeta. | Backend real | Alta |
| T-02 | Edicion y baja de tarjeta. | Backend real | Alta |
| T-03 | Relacionar tarjeta con banco y marca. | Catalogo bancos | Alta |
| T-04 | Usar tarjetas para matching de promociones. | Promociones | Media |

## Epica 5 - Dashboard y presupuesto

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| D-01 | Calcular gasto mensual acumulado. | Gastos reales | Alta |
| D-02 | Calcular gasto por categoria. | Gastos reales | Alta |
| D-03 | Calcular evolucion temporal. | Gastos reales | Alta |
| D-04 | Configurar presupuesto mensual. | Backend real | Alta |
| D-05 | Configurar limites por categoria. | Backend real | Media |
| D-06 | Alertar desvio contra presupuesto. | Reglas locales | Alta |
| D-07 | Mostrar calendario de gastos. | Gastos reales | Media |

## Epica 6 - Ingesta por WhatsApp

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| W-01 | Elegir proveedor WhatsApp. | Usuario/proveedor | Alta |
| W-02 | Crear cuenta y numero autorizado. | Usuario/proveedor | Alta |
| W-03 | Configurar webhook entrante. | Proveedor WhatsApp | Alta |
| W-04 | Identificar usuario por telefono. | Backend real | Alta |
| W-05 | Parsear texto simple de gasto. | Ninguna | Alta |
| W-06 | Responder con gasto detectado y pedir confirmacion. | Proveedor WhatsApp | Alta |
| W-07 | Procesar imagen/audio recibido por WhatsApp. | OCR/audio | Media |

## Epica 7 - Comprobantes, audio y email

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| I-01 | Definir tabla ingestion_jobs. | Modelo de datos | Alta |
| I-02 | Subir comprobantes a storage. | Storage externo o local | Alta |
| I-03 | Extraer datos de imagen/PDF con OCR. | Proveedor OCR | Media |
| I-04 | Transcribir audio. | Proveedor speech-to-text | Media |
| I-05 | Crear gasto pendiente de confirmacion. | Worker ingesta | Alta |
| I-06 | Conectar Gmail/Outlook con OAuth. | Credenciales OAuth | Baja/MVP2 |
| I-07 | Detectar consumos desde emails. | Email conectado | Baja/MVP2 |

## Epica 8 - Promociones

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| PR-01 | Definir modelo de promocion normalizada. | Ninguna | Alta |
| PR-02 | Definir catalogo de bancos, tarjetas y rubros. | Ninguna | Alta |
| PR-03 | Crear importador manual/CSV de promociones. | Ninguna | Alta |
| PR-04 | Crear primer scraper de una fuente publica. | Elegir fuente | Media |
| PR-05 | Matching promocion contra tarjetas del usuario. | Tarjetas | Alta |
| PR-06 | Expirar promociones vencidas. | Worker promociones | Alta |
| PR-07 | Agregar geolocalizacion de comercios. | Proveedor mapas | Media |

## Epica 9 - Recomendaciones y patrones

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| R-01 | Detectar gastos recurrentes. | Gastos reales | Alta |
| R-02 | Detectar suscripciones posibles. | Gastos reales | Alta |
| R-03 | Proyectar gasto mensual. | Gastos reales | Alta |
| R-04 | Detectar categorias con desvio. | Historial | Alta |
| R-05 | Recomendar promociones por tarjeta. | Promociones | Alta |
| R-06 | Recomendar comercios alternativos. | Promociones + comercios frecuentes | Media |
| R-07 | Crear scoring de recomendaciones. | Reglas locales | Media |
| R-08 | Aprender de recomendaciones descartadas/aplicadas. | Datos de uso | Baja |

## Epica 10 - Grupos

| ID | Tarea | Dependencia | Prioridad |
| --- | --- | --- | --- |
| GR-01 | Crear grupo. | Backend real | Media |
| GR-02 | Invitar miembros. | Usuarios reales | Media |
| GR-03 | Registrar gasto compartido. | Gastos reales | Media |
| GR-04 | Dividir por partes iguales. | Modelo de datos | Media |
| GR-05 | Dividir por porcentajes o montos manuales. | Modelo de datos | Baja |
| GR-06 | Calcular saldos entre miembros. | Gastos compartidos | Media |
| GR-07 | Asegurar visibilidad solo para miembros. | Seguridad | Alta |

## Orden recomendado de implementacion

1. Backend base: usuarios, auth, gastos, tarjetas, categorias y presupuestos.
2. Reemplazar datos mockeados del dashboard por API real.
3. Reglas locales: proyeccion, desvio de presupuesto, suscripciones y duplicados.
4. Worker de ingesta generico con estado pendiente/confirmado.
5. WhatsApp por texto simple.
6. Promociones con importacion manual o CSV.
7. Matching promociones-tarjetas y notificaciones.
8. OCR/audio para comprobantes.
9. Grupos y gastos compartidos.
10. Ubicacion y promociones cercanas.

## Tareas que quedan a un lado por ahora

Estas tareas no conviene ejecutarlas sin decisiones del usuario:

- Alta de cuenta en Meta WhatsApp Cloud API o proveedor alternativo.
- Seleccion de numero de WhatsApp.
- Configuracion de webhooks publicos.
- Credenciales OAuth para Gmail/Outlook.
- Eleccion de proveedor OCR/audio.
- Eleccion de proveedor de mapas.
- Decidir fuentes de promociones: bancos, comercios, scraping o carga manual.
- Textos legales de consentimiento y politica de privacidad.

