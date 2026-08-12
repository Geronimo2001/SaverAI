# Contratos de API iniciales - CapsaAI

Estos contratos son una primera version para alinear app mobile, panel web, backend y workers. Los nombres se pueden ajustar al framework elegido, pero conviene mantener la separacion de recursos.

## Convenciones

- Base path sugerido: `/api/v1`.
- Todas las respuestas usan JSON.
- Todos los endpoints privados requieren usuario autenticado.
- Todo recurso financiero debe estar aislado por `user_id` tomado de la sesion, no del body.
- Los montos se expresan en centavos con campos `amountCents` o `limitCents`.
- La moneda por defecto es `ARS`.

## Auth

### POST `/auth/register`

Crea un usuario.

```json
{
  "email": "user@example.com",
  "password": "password-segura",
  "fullName": "Geronimo"
}
```

### POST `/auth/login`

Inicia sesion.

```json
{
  "email": "user@example.com",
  "password": "password-segura"
}
```

### POST `/auth/logout`

Cierra sesion actual.

## Usuarios y preferencias

### GET `/me`

Devuelve perfil, preferencias y configuracion basica.

### PATCH `/me`

Actualiza datos editables del usuario.

```json
{
  "fullName": "Geronimo",
  "phoneE164": "+5493510000000"
}
```

### PATCH `/me/preferences`

Actualiza preferencias.

```json
{
  "alertThresholdPercent": 85,
  "locationPromosEnabled": true,
  "patternAlertsEnabled": true,
  "duplicateDetectionEnabled": true,
  "notificationChannels": ["push", "whatsapp"]
}
```

## Tarjetas

### GET `/cards`

Lista tarjetas del usuario.

### POST `/cards`

Crea tarjeta.

```json
{
  "issuerBank": "Galicia",
  "brand": "Visa",
  "cardType": "credit",
  "lastFour": "4582",
  "alias": "Visa Galicia"
}
```

### PATCH `/cards/{cardId}`

Edita tarjeta.

### DELETE `/cards/{cardId}`

Baja logica de tarjeta.

## Categorias

### GET `/categories`

Lista categorias globales y personalizadas.

### POST `/categories`

Crea categoria personalizada.

```json
{
  "name": "Cafe",
  "color": "#f5c542",
  "icon": "Coffee"
}
```

## Gastos

### GET `/transactions`

Filtros sugeridos:

- `from`
- `to`
- `categoryId`
- `cardId`
- `merchantId`
- `status`
- `source`

### POST `/transactions`

Crea gasto manual.

```json
{
  "amountCents": 2450000,
  "currency": "ARS",
  "occurredAt": "2026-04-15T14:32:00-03:00",
  "description": "Compra en Mercado Libre",
  "merchantName": "Mercado Libre",
  "categoryId": "category-id",
  "cardId": "card-id"
}
```

### PATCH `/transactions/{transactionId}`

Edita gasto.

### DELETE `/transactions/{transactionId}`

Baja logica.

### POST `/transactions/{transactionId}/confirm`

Confirma un gasto creado por ingesta automatica.

### POST `/transactions/{transactionId}/reject`

Rechaza un gasto detectado automaticamente.

## Ingesta

### POST `/ingestion/jobs`

Crea un job de ingesta desde texto, imagen, PDF o audio.

```json
{
  "channel": "whatsapp",
  "inputType": "text",
  "rawText": "gaste 4500 en cafe con visa",
  "receivedAt": "2026-04-15T10:40:00-03:00"
}
```

### GET `/ingestion/jobs/{jobId}`

Consulta estado del job.

Respuesta esperada:

```json
{
  "id": "job-id",
  "status": "processed",
  "extractedPayload": {
    "amountCents": 450000,
    "merchantName": "Cafe",
    "categoryKey": "cafe",
    "confidence": 0.76
  },
  "transactionId": "transaction-id"
}
```

## Dashboard

### GET `/dashboard/summary?period=2026-04`

Devuelve resumen mensual.

### GET `/dashboard/trend?period=2026-04`

Devuelve gasto acumulado real y proyectado.

### GET `/dashboard/categories?period=2026-04`

Devuelve gasto por categoria.

### GET `/dashboard/calendar?period=2026-04`

Devuelve dias con gastos y detalle agregado.

## Presupuestos

### GET `/budgets?period=2026-04`

Lista presupuestos del periodo.

### PUT `/budgets/monthly`

Configura presupuesto mensual.

```json
{
  "period": "2026-04",
  "limitCents": 34000000,
  "alertThresholdPercent": 85
}
```

### PUT `/budgets/categories/{categoryId}`

Configura presupuesto por categoria.

## Promociones

### GET `/promotions`

Filtros sugeridos:

- `bank`
- `brand`
- `categoryId`
- `merchantId`
- `nearLat`
- `nearLng`

### POST `/promotions/import`

Endpoint administrativo para carga manual o CSV.

### GET `/promotions/matches`

Devuelve promociones compatibles con las tarjetas del usuario.

## Recomendaciones y alertas

### GET `/recommendations`

Lista recomendaciones.

### POST `/recommendations/{recommendationId}/view`

Marca como vista.

### POST `/recommendations/{recommendationId}/apply`

Marca como aplicada.

### POST `/recommendations/{recommendationId}/dismiss`

Marca como descartada.

### GET `/alerts`

Lista alertas priorizadas.

## Grupos

### GET `/groups`

Lista grupos del usuario.

### POST `/groups`

Crea grupo.

```json
{
  "name": "Casa"
}
```

### POST `/groups/{groupId}/members`

Invita miembro.

### POST `/groups/{groupId}/shared-expenses`

Crea gasto compartido.

```json
{
  "transactionId": "transaction-id",
  "splitMethod": "equal",
  "memberIds": ["member-1", "member-2"]
}
```

### GET `/groups/{groupId}/balances`

Devuelve saldos entre miembros.

## Webhooks

### POST `/webhooks/whatsapp`

Recibe mensajes de WhatsApp. Queda bloqueado hasta elegir proveedor.

### POST `/webhooks/email`

Recibe eventos de email si se usa suscripcion push. Queda para fase posterior.

## Estados comunes

### TransactionStatus

```json
["pending_confirmation", "confirmed", "rejected"]
```

### IngestionStatus

```json
["received", "processing", "processed", "failed"]
```

### RecommendationStatus

```json
["new", "viewed", "applied", "dismissed"]
```

### RecommendationType

```json
[
  "budget_alert",
  "promo_match",
  "habit_change",
  "subscription",
  "cheaper_option"
]
```

