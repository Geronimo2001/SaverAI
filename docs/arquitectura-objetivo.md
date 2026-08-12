# Arquitectura objetivo - CapsaAI

Este documento describe la arquitectura objetivo para evolucionar la maqueta actual hacia un producto real de gestion de gastos, promociones y recomendaciones financieras para usuarios en Argentina.

## Criterio de arquitectura

Para el alcance inicial no conviene partir con microservicios completos. La escala declarada es baja: 100 usuarios y 30 transacciones por usuario por dia. La complejidad esta en la ingesta, normalizacion y recomendacion, no en el volumen.

La recomendacion es usar:

- App mobile como cliente principal.
- Backend modular con API HTTP.
- Base de datos relacional.
- Workers asincronicos para procesos lentos.
- Servicios externos aislados detras de adaptadores.

## Vista general

```mermaid
flowchart TD
    Mobile[App mobile] --> API[Backend API]
    Web[Panel web actual] --> API
    Whatsapp[WhatsApp Bot] --> API
    Email[Email autorizado] --> API

    API --> DB[(PostgreSQL)]
    API --> Storage[(Object storage)]
    API --> Queue[Cola de trabajos]

    Queue --> Ingestion[Worker de ingesta]
    Queue --> Categorization[Worker de categorizacion]
    Queue --> Promotions[Worker de promociones]
    Queue --> Recommendations[Worker de recomendaciones]
    Queue --> Notifications[Worker de notificaciones]

    Ingestion --> OCR[OCR / Speech to text]
    Promotions --> PromoSources[Scrapers / APIs comercios y bancos]
    Recommendations --> Rules[Reglas + scoring]
    Notifications --> Push[Push / WhatsApp / Email]

    Promotions --> PromoDB[(Promociones normalizadas)]
    Categorization --> DB
    Recommendations --> DB
```

## Modulos internos

| Modulo | Responsabilidad |
| --- | --- |
| Identidad y usuarios | Registro, login, perfil, baja de cuenta, consentimiento de permisos. |
| Seguridad | Autorizacion por usuario, permisos de grupos, auditoria, cifrado y retencion. |
| Gastos | Alta, edicion, baja, consulta, filtros, adjuntos y duplicados. |
| Tarjetas | Alta, edicion, baja, banco, marca, ultimos digitos, beneficios aplicables. |
| Categorias | Categorias base, reglas por comercio, aprendizaje por correcciones del usuario. |
| Presupuestos | Limites mensuales y por categoria, avance, desvio y alertas. |
| Dashboard | Resumen, evolucion temporal, categorias, tarjetas, suscripciones y proyeccion. |
| Calendario | Distribucion diaria de gastos y detalle por dia. |
| Promociones | Importacion, normalizacion, vigencia, comercio, banco, tarjeta y restricciones. |
| Recomendaciones | Oportunidades de ahorro, optimizacion de consumo, deteccion de habitos. |
| Notificaciones | Push, WhatsApp o email segun preferencias y reglas anti-spam. |
| Grupos | Gastos compartidos, miembros, saldos y liquidaciones. |

## Workers recomendados

Los workers permiten cumplir el requisito de carga menor a 3 minutos sin bloquear la app.

| Worker | Entrada | Salida |
| --- | --- | --- |
| Ingesta de comprobantes | Imagen, PDF, audio o texto | Gasto pendiente de confirmacion. |
| Categorizacion | Gasto sin categoria o categoria dudosa | Categoria sugerida y confianza. |
| Promociones | Fuente externa o scraper | Promociones normalizadas y vigentes. |
| Recomendaciones | Gastos, tarjetas, promociones, presupuestos | Recomendaciones priorizadas. |
| Notificaciones | Alertas y oportunidades | Mensajes enviados o programados. |

## Flujo de carga de gasto

```mermaid
sequenceDiagram
    actor Usuario
    participant Client as App / WhatsApp
    participant API as Backend API
    participant Queue as Cola
    participant Worker as Worker de ingesta
    participant DB as PostgreSQL

    Usuario->>Client: Carga gasto manual, texto, audio o comprobante
    Client->>API: Envia payload y adjunto si existe
    API->>DB: Crea ingestion_job en estado received
    API->>Queue: Publica job de procesamiento
    API-->>Client: Devuelve recibido
    Queue->>Worker: Ejecuta job
    Worker->>Worker: Extrae monto, fecha, comercio y medio de pago
    Worker->>DB: Crea gasto pendiente o confirmado
    Worker->>DB: Marca job como processed
    API-->>Client: El usuario ve el gasto para confirmar o editar
```

## Flujo de promociones

```mermaid
sequenceDiagram
    participant Scheduler as Scheduler
    participant Worker as Worker promociones
    participant Source as Fuente externa
    participant DB as PostgreSQL
    participant Reco as Motor recomendaciones

    Scheduler->>Worker: Ejecuta importacion programada
    Worker->>Source: Consulta API o scraper
    Source-->>Worker: Devuelve promociones crudas
    Worker->>Worker: Normaliza banco, tarjeta, comercio, rubro, vigencia y topes
    Worker->>DB: Upsert de promociones
    Worker->>Reco: Solicita recalculo de oportunidades
    Reco->>DB: Crea recomendaciones para usuarios compatibles
```

## Flujo de recomendacion

```mermaid
flowchart LR
    Tx[Gastos historicos] --> Engine[Motor de recomendaciones]
    Cards[Tarjetas del usuario] --> Engine
    Budget[Presupuesto] --> Engine
    Promos[Promociones vigentes] --> Engine
    Location[Ubicacion opcional] --> Engine

    Engine --> Score[Scoring]
    Score --> Recommendations[Recomendaciones]
    Recommendations --> Alerts[Alertas]
    Recommendations --> Dashboard[Dashboard]
    Recommendations --> Notifications[Notificaciones]
```

## Decision sobre inteligencia artificial

No es necesario entrenar un modelo de deep learning para el MVP. Con 100 usuarios no habra suficiente dato propio para entrenar un modelo robusto.

La evolucion recomendada es:

| Etapa | Tecnica | Casos cubiertos |
| --- | --- | --- |
| V1 | Reglas y estadistica | Presupuestos, alertas, recurrentes, promociones por tarjeta. |
| V2 | ML simple | Categorizacion, proyeccion, deteccion de anomalias. |
| V3 | Modelos avanzados | Optimizacion personalizada y ranking avanzado de recomendaciones. |

## Servicios externos posibles

| Necesidad | Opciones |
| --- | --- |
| WhatsApp | Meta WhatsApp Cloud API, Twilio, Zenvia. |
| OCR | Google Vision, AWS Textract, Azure Document Intelligence. |
| Audio a texto | OpenAI Whisper API, Google Speech-to-Text. |
| Email | Gmail API, Microsoft Graph. |
| Push notifications | Firebase Cloud Messaging, Expo Push. |
| Ubicacion/mapas | Google Maps, Mapbox, OpenStreetMap. |
| Storage | S3, Cloudflare R2, Google Cloud Storage. |
| Jobs/colas | BullMQ + Redis, Cloud Tasks, SQS. |

## No funcionales refinados

| Requisito | Especificacion propuesta |
| --- | --- |
| Aplicacion mobile | El cliente principal debera estar disponible en iOS y Android. |
| 100 usuarios | El sistema debera soportar al menos 100 usuarios registrados. |
| 30 transacciones por usuario por dia | El sistema debera soportar al menos 3.000 transacciones diarias totales. |
| Carga menor a 3 minutos | Toda ingesta asincronica debera pasar a estado procesado o fallido antes de 3 minutos. |
| WhatsApp como canal de carga | El sistema debera permitir registrar gastos via WhatsApp con confirmacion del usuario. |
| Datos seguros | Autenticacion segura, autorizacion por usuario, cifrado en transito, cifrado de datos sensibles en reposo, auditoria y borrado de datos. |
| Argentina | Moneda ARS, zona horaria argentina, bancos/comercios argentinos y telefono con prefijo +54. |

