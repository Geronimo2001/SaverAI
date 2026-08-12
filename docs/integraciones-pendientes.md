# Integraciones pendientes - CapsaAI

Estas tareas quedan separadas porque requieren cuentas, permisos, credenciales, decisiones de proveedor o validacion legal.

## WhatsApp

Estado: bloqueada hasta elegir proveedor y configurar cuenta.

Opciones:

- Meta WhatsApp Cloud API.
- Twilio WhatsApp.
- Zenvia u otro BSP regional.

Datos necesarios:

- Numero de telefono a usar.
- Cuenta Meta Business o proveedor elegido.
- Webhook publico del backend.
- Token de acceso.
- Verify token.
- Plantillas aprobadas si se enviaran mensajes iniciados por el sistema.

Decisiones pendientes:

- Si WhatsApp sera solo canal de carga o tambien de notificaciones.
- Si el usuario confirma cada gasto por WhatsApp o desde la app.
- Limite de mensajes por dia para evitar spam.

## Email

Estado: pendiente para una segunda fase.

Opciones:

- Gmail API.
- Microsoft Graph para Outlook/Hotmail.

Datos necesarios:

- Proyecto OAuth.
- Client ID y Client Secret.
- Scopes minimos.
- Politica de privacidad visible.
- Flujo de revocacion de permisos.

Riesgos:

- Leer emails financieros requiere consentimiento muy claro.
- Hay que evitar guardar contenido completo de correos si solo se necesita el consumo.

## OCR y comprobantes

Estado: parcialmente bloqueada por eleccion de proveedor.

Opciones:

- Google Vision.
- AWS Textract.
- Azure Document Intelligence.
- OCR open source como Tesseract para pruebas.

Decision recomendada:

- Para MVP, usar proveedor externo.
- Guardar imagen original solo si el usuario lo permite.
- Crear gasto como `pending_confirmation` si la confianza es baja.

## Audio a texto

Estado: parcialmente bloqueada por proveedor.

Opciones:

- OpenAI Whisper API.
- Google Speech-to-Text.
- Modelo local si se necesita bajar costo despues.

Uso esperado:

- Mensajes de WhatsApp.
- Audios subidos desde la app.

## Promociones y scrapers

Estado: depende de fuentes.

Fuentes posibles:

- Paginas publicas de bancos argentinos.
- Paginas publicas de comercios.
- Carga manual/CSV administrada.
- APIs no oficiales si existen y son estables.

Decision recomendada para MVP:

1. Crear modelo de promociones.
2. Permitir carga manual o CSV.
3. Implementar un scraper de prueba para una fuente concreta.
4. Medir estabilidad antes de depender del scraper.

Datos a normalizar:

- Banco.
- Marca de tarjeta.
- Tipo de tarjeta.
- Comercio.
- Rubro.
- Beneficio.
- Tope.
- Dias aplicables.
- Vigencia.
- Condiciones.
- Ubicacion si aplica.

## Ubicacion

Estado: bloqueada por permisos mobile y proveedor de mapas.

Opciones:

- Google Maps.
- Mapbox.
- OpenStreetMap.

Decisiones pendientes:

- Si se usa ubicacion en tiempo real o solo ubicacion aproximada.
- Si las notificaciones cercanas se calculan en servidor o en app.
- Frecuencia maxima de evaluacion.

Recomendacion:

- Pedir ubicacion solo cuando el usuario active promociones cercanas.
- No guardar historial de ubicacion salvo que sea estrictamente necesario.
- Guardar solo consentimiento y ultima ubicacion aproximada si alcanza.

## Push notifications

Estado: pendiente de plataforma mobile.

Opciones:

- Firebase Cloud Messaging.
- Expo Push Notifications si la app usa Expo.

Eventos candidatos:

- Presupuesto superado.
- Proyeccion mensual en riesgo.
- Gasto duplicado probable.
- Suscripcion detectada.
- Promocion compatible con tarjeta.
- Promocion cercana.

Reglas anti-spam:

- Maximo diario por canal.
- No repetir misma recomendacion.
- Horarios permitidos.
- Preferencias por tipo de alerta.

## Legal y privacidad

Estado: requiere decision del proyecto.

Pendientes:

- Terminos y condiciones.
- Politica de privacidad.
- Consentimiento para lectura de email.
- Consentimiento para ubicacion.
- Consentimiento para WhatsApp.
- Politica de borrado de datos.
- Definir si se almacenan comprobantes originales.

## Variables de entorno esperadas

```bash
DATABASE_URL=
JWT_SECRET=
APP_BASE_URL=

WHATSAPP_PROVIDER=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

OCR_PROVIDER=
OCR_API_KEY=

SPEECH_TO_TEXT_PROVIDER=
SPEECH_TO_TEXT_API_KEY=

EMAIL_GOOGLE_CLIENT_ID=
EMAIL_GOOGLE_CLIENT_SECRET=
EMAIL_MICROSOFT_CLIENT_ID=
EMAIL_MICROSOFT_CLIENT_SECRET=

PUSH_PROVIDER=
PUSH_SERVER_KEY=

MAPS_PROVIDER=
MAPS_API_KEY=

STORAGE_PROVIDER=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

