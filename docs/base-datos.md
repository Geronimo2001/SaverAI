# Base de datos - CapsaAI

La base de datos operativa queda definida en `prisma/schema.prisma`. Ese archivo es la fuente de verdad para migraciones, tipos y seed.

Los modelos internos de Prisma se mantienen en ingles para no romper el codigo TypeScript, pero las tablas y columnas fisicas de PostgreSQL estan mapeadas en español con `@@map` y `@map`.

## Stack

- PostgreSQL como base relacional.
- Prisma 7 para esquema, migraciones y cliente TypeScript.
- `@prisma/adapter-pg` para la conexion desde runtime Node.

## Comandos

```bash
cp .env.example .env
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run db:studio
```

`DATABASE_URL` debe apuntar a una base PostgreSQL disponible. El seed crea un usuario demo, categorias, tarjetas, comercios, gastos, presupuestos, suscripciones, promociones y recomendaciones equivalentes al estado actual de la app.

## Decisiones de modelo

- Los montos se guardan en centavos (`BigInt`) para evitar errores decimales.
- Las tarjetas guardan solo banco, marca, tipo y ultimos cuatro digitos; nunca PAN completo.
- Las transacciones pueden venir de `MANUAL`, `WHATSAPP`, `RECEIPT`, `EMAIL`, `IMPORT` o `API`.
- WhatsApp entra por `ingestas`: se conserva el texto original, el payload extraido por el modelo, el payload normalizado y la transaccion creada.
- Las promociones se separan en `fuentes_promociones`, `ejecuciones_scraper` y `promociones` para auditar scrapers y normalizacion.
- La geolocalizacion se guarda como snapshots con `retentionUntil`; sirve para promos cercanas sin convertir la app en historial permanente de ubicacion.
- Las recomendaciones y notificaciones quedan persistidas para evitar repetir alertas y para medir si el usuario las vio, aplico o descarto.

## Tablas principales

| Dominio | Tabla fisica |
| --- | --- |
| Usuarios | `usuarios` |
| Preferencias | `preferencias_usuario` |
| WhatsApp | `cuentas_whatsapp` |
| Tarjetas | `tarjetas` |
| Categorias | `categorias` |
| Comercios | `comercios`, `ubicaciones_comercios` |
| Transacciones | `transacciones` con `items` y `adjuntos` JSON |
| Ingesta/modelo | `ingestas` con `eventos` JSON |
| Presupuestos | `presupuestos` |
| Suscripciones | `suscripciones` |
| Promociones/scrapers | `fuentes_promociones`, `ejecuciones_scraper`, `promociones` |
| Alertas | `recomendaciones`, `notificaciones` |
| Ubicacion | `ubicaciones_usuario` |
| Grupos | `grupos`, `miembros_grupos`, `gastos_compartidos`, `divisiones_gastos_compartidos` |

## Reemplazo de mocks

| Mock actual | Tablas nuevas |
| --- | --- |
| `categories` | `categorias` |
| `linkedCards` | `tarjetas` |
| `transactions`, `calendarDays`, `spendingTrend`, `categorySpend` | `transacciones`, agregaciones por fecha/categoria/tarjeta |
| `budgets` y `profileSettings` | `presupuestos`, `preferencias_usuario` |
| `subscriptions` | `suscripciones`, `comercios`, `tarjetas` |
| `nearbyPromos` | `promociones`, `ubicaciones_comercios`, `ubicaciones_usuario`, `recomendaciones` |
| `alerts` | `recomendaciones`, `notificaciones` |

## Flujo WhatsApp

1. Llega un mensaje por webhook del proveedor.
2. Se busca `cuentas_whatsapp` por telefono.
3. Se crea `ingestas` con `canal = WHATSAPP` y el texto/audio/imagen recibido.
4. El worker llama al modelo y guarda `payload_extraido`, `payload_normalizado`, `modelo_nombre`, `modelo_version` y `modelo_confianza`.
5. Si la confianza es suficiente crea `transacciones` en `CONFIRMED`; si no, en `PENDING_CONFIRMATION`.
6. El usuario confirma o corrige desde WhatsApp o desde la app.

## Flujo promociones

1. Cada scraper crea una fila en `ejecuciones_scraper`.
2. Las promociones crudas se normalizan contra `comercios`, `ubicaciones_comercios`, `categorias`, banco y tarjeta.
3. Se hace upsert en `promociones` con vigencia, dias aplicables, topes y condiciones.
4. El motor de recomendaciones cruza tarjetas, ubicacion opcional, presupuesto e historial para crear `recomendaciones`.
