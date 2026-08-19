# Bot de WhatsApp (canal de carga de gastos)

El bot **no carga gastos**: es el canal. Recibe el audio, lo transcribe, arma el
gasto conversando con el usuario y, cuando el usuario confirma, se lo manda
firmado al backend. **El backend decide si se publica o no.**

```
audio de WhatsApp
      -> bot: transcribe (Whisper)
      -> bot: normaliza (src/data/expense-normalizer.ts + ayuda opcional de IA)
      -> bot: pregunta lo que falta y pide confirmacion
      -> POST firmado /webhooks/whatsapp/expenses/confirmed
      -> backend: valida sus reglas y publica (o rechaza)
```

## Piezas

| Archivo | Rol |
| --- | --- |
| `bot/server.ts` | Webhook de Meta: verificacion (GET) y mensajes entrantes (POST). |
| `bot/meta.ts` | Cliente de la Graph API: firma, descarga de audio, envio de texto. |
| `bot/transcribe.ts` | Whisper (Groq por defecto, OpenAI opcional). |
| `bot/session.ts` | Conversacion: completar campos faltantes y confirmar. |
| `bot/extract.ts` | Ayuda opcional de IA para deducir campos del mismo mensaje. |
| `bot/backend.ts` | POST firmado con HMAC al backend. |
| `bot/context.ts` | **Catalogo fijo** de categorias y tarjetas (ver limitaciones). |
| `bot/vincular-usuario.ts` | Alta del usuario de WhatsApp y sus tarjetas en la base. |

## Conversacion

Al usuario se le piden **solo tres datos**: monto, categoria y comercio.

> **Usuario:** pagué 5000 en comida en Tepanyaki
> **Bot:** ✅ Registré $5.000 en Tepanyaki (comida).

Si falta alguno, el bot pregunta ese campo puntual y sigue:

> **Usuario:** gasté 1000 en Tepanyaki
> **Bot:** ¿Qué categoría? Opciones: super, comida, transporte, servicios, cafe, compras
> **Usuario:** comida
> **Bot:** ✅ Registré $1.000 en Tepanyaki (comida).

Cuando el bot pregunta por un campo puntual toma la respuesta tal cual. Eso
permite cargar comercios que el normalizador por reglas no conoce (solo tiene
una lista fija de ~18 comercios).

### Campos que NO se preguntan

El backend exige tambien fecha y medio de pago (`payment_method_id` es
obligatorio en la tabla `expenses`), asi que el bot los completa solo:

| Campo | Como se completa |
| --- | --- |
| `date` | La fecha que se mencione en el mensaje ("ayer"), o el dia de hoy. |
| `card` | `BOT_DEFAULT_CARD` si esta seteada; si no, la primera tarjeta del usuario. |

Si el usuario no tiene ningun medio de pago cargado, el bot lo avisa en lugar
de mandar un gasto que el backend va a rechazar.

### Confirmacion

Esta **desactivada**: el gasto se publica apenas estan los tres datos. Para
volver al paso de "¿lo confirmo? SI / NO", poner `REQUIRE_CONFIRMATION = true`
al principio de `bot/session.ts`. El comando de cancelar ("no", "cancelar")
sigue funcionando mientras el bot este preguntando algo.

## Variables de entorno

```
# WhatsApp (Meta Cloud API)
WHATSAPP_ACCESS_TOKEN=...        # token del panel de Meta (el temporal dura 24 h)
WHATSAPP_PHONE_NUMBER_ID=...     # id del numero de prueba
WHATSAPP_VERIFY_TOKEN=...        # lo elegis vos; se carga igual en el panel de Meta
WHATSAPP_APP_SECRET=             # opcional: valida la firma de Meta
WHATSAPP_GRAPH_VERSION=v21.0     # opcional

# Backend
BACKEND_URL=http://localhost:4010
WHATSAPP_WEBHOOK_SECRET=...      # el MISMO que usa el backend para verificar la firma
BOT_PORT=4020
BOT_DEFAULT_CARD=                 # opcional: tarjeta a usar siempre (si no, la primera del usuario)

# IA
AI_PROVIDER=groq                 # groq (gratis) | openai | custom
GROQ_API_KEY=...
```

## Puesta en marcha

```bash
npm run server:migrate            # crea las tablas
npm run server:dev                # backend en :4010
npx tsx bot/vincular-usuario.ts +549XXXXXXXXXX   # alta del usuario y sus tarjetas
npm run bot:dev                   # bot en :4020
cloudflared tunnel --url http://localhost:4020   # URL publica para Meta
```

En el panel de Meta, el webhook apunta a `https://TU-TUNEL/webhooks/whatsapp/inbound`
con el `WHATSAPP_VERIFY_TOKEN`, y hay que suscribirse al campo `messages`.

## Logs, debug y pruebas

- **Logs limpios por defecto:** una linea por gasto (`✔ $5.000 en Tepanyaki (comida) — whatsapp:+549...`),
  mas warnings/errores. Para ver el detalle paso a paso (cada request, transcripcion, etc.) se corre con
  `BOT_DEBUG=1 npm run bot:dev`.
- **Probar el audio sin Meta:** `npm run bot:audio -- <archivo.ogg>` transcribe un audio local y muestra
  que gasto sacaria el bot, sin tocar la base ni WhatsApp. Tambien acepta texto directo:
  `npm run bot:audio -- --texto "gaste 5000 en comida en tepanyaki"`.

## Manejo de errores (mensajes al usuario)

- Audio que no se puede bajar (token vencido) o transcribir → avisa y sugiere mandar texto.
- Backend caido → "Entendí tu gasto pero no pude guardarlo (el servidor no responde)".
- Backend rechaza (422) → muestra el detalle de la regla que fallo.
- Sin medio de pago cargado → avisa que corra `bot:vincular`.

## Estado en memoria (limites del prototipo)

- **Anti-duplicados:** `Set` de `message.id` acotado a 1000 (evita reproceso si Meta reintenta). La
  idempotencia REAL la garantiza el backend (`external_message_id UNIQUE`).
- **Conversaciones:** en memoria, con expiracion a los 15 min de inactividad. Se pierden si el bot se
  reinicia y no se comparten entre instancias. Para produccion: Redis o una tabla.

## Limitaciones conocidas (para el capitulo de alcance)

- ~~Catalogo fijo~~ **resuelto**: `bot/context.ts` ahora lee las categorias y
  tarjetas del backend (`GET /categories` y `GET /payment-methods`), con una
  lista fija de respaldo por si el backend no responde. Ver
  `docs/api-backend-lectura.md`.
- **Sesiones en memoria.** La conversacion se pierde si el bot se reinicia, y no
  soporta varias instancias.
- **Anti-reproceso en memoria** en el bot; la idempotencia real la garantiza el
  backend (`external_message_id UNIQUE` + `whatsapp_processed_messages`).
- **Token temporal de Meta**: dura 24 h salvo que se genere uno permanente con un
  System User.
- La transcripcion depende de un servicio externo (Groq/OpenAI).
