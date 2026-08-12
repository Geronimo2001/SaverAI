# Migracion a React Native - CapsaAI

La app mobile vive en `mobile/` y usa Expo + React Native. La app web Next.js queda intacta por ahora para evitar romper la maqueta existente mientras se migra funcionalidad.

La app mobile queda fijada en Expo SDK 54 para abrir con la version de Expo Go que se esta usando en el celular. Si Expo Go muestra incompatibilidad, reiniciar Metro con cache limpia y escanear el QR nuevo desde `mobile/`.

## Decision tomada

Se creo una app mobile paralela en lugar de reemplazar directamente `app/` porque el cambio de plataforma afecta:

- Navegacion: `next/link` no existe en React Native.
- Layout: Tailwind web y CSS grid no aplican igual.
- UI kit: shadcn web no es compatible con React Native.
- Graficos: `recharts` es web; se reemplazo por una visualizacion nativa simple.
- Iconos: se usa `lucide-react-native`.
- Safe areas: se usa `react-native-safe-area-context`.

## Estructura agregada

```text
mobile/
  App.tsx
  app.json
  package.json
  tsconfig.json
  src/
    components/
    auth/
    data/
    screens/
    theme.ts
```

## Pantallas migradas

| Pantalla web | Pantalla mobile | Estado |
| --- | --- | --- |
| `/` | `HomeScreen` | Migrada con resumen, tarjetas, categorias, suscripciones y accesos. |
| `/gastos` | `ExpensesScreen` | Migrada con estadisticas, calendario, filtros y transacciones. |
| `/cerca` | `NearbyScreen` | Migrada con mejor promo cercana y listado. |
| `/alertas` | `AlertsScreen` | Migrada con alertas priorizadas y navegacion a gastos. |
| `/perfil` | `ProfileScreen` | Migrada con presupuesto, tarjetas, preferencias y privacidad. |
| Login/registro | `AuthScreen` | Login local simple con usuario y contrasena en SQLite. |
| Carga manual | `ManualExpenseScreen` | Formulario nativo con monto, comercio, dia, categoria, tarjeta y notas. |
| Presupuestos | `BudgetsScreen` | Tipos de presupuesto, monto deseado y umbral de alerta. |

## Autenticacion temporal

Clerk queda pausado mientras el proyecto esta en desarrollo temprano. La app usa `expo-sqlite` con una tabla local `users` y guarda `username` + `password` en texto plano, solo para facilitar pruebas rapidas.

La sesion queda en memoria dentro de `LocalAuthProvider`: al cerrar o recargar la app hay que iniciar sesion de nuevo, pero los usuarios creados quedan guardados en la base SQLite local del dispositivo.

Cuando se retome Clerk, el reemplazo principal queda concentrado en:

- `mobile/src/auth/LocalAuthContext.tsx`
- `mobile/src/screens/AuthScreen.tsx`
- `mobile/src/screens/ProfileScreen.tsx`

## Carga manual de gastos

La carga manual crea transacciones en estado local de la app. Cada gasto incluye:

- Monto.
- Comercio.
- Dia del mes.
- Categoria.
- Medio de pago.
- Notas opcionales.

Por ahora los gastos no persisten al cerrar la app porque todavia no hay backend/base de datos conectados para datos financieros.

## Presupuestos

Tipos implementados:

- General mensual.
- Por categoria.
- Por tarjeta.
- Esenciales.
- Variables.

Cada presupuesto define:

- Nombre.
- Tipo.
- Cantidad deseada a gastar.
- Periodo.
- Umbral de alerta.
- Categoria o tarjeta si aplica.

Los presupuestos se comparan contra los gastos locales para mostrar avance.

## Comandos

Desde la raiz del repo:

```bash
npm run mobile:start
npm run mobile:ios
npm run mobile:android
npm run mobile:typecheck
```

O desde `mobile/`:

```bash
npm run start
npm run ios
npm run android
npm run typecheck
```

## Validaciones realizadas

- `npm run typecheck --prefix mobile`
- `npx expo-doctor` desde `mobile/`
- `npx expo export --platform ios --output-dir /private/tmp/capsaai-mobile-export`
- `npx expo export --platform ios --output-dir /private/tmp/capsaai-mobile-export-auth`
- `npx expo export --platform ios --output-dir /private/tmp/capsaai-mobile-export-local-auth`
- `npx expo export --platform ios --output-dir /private/tmp/capsaai-mobile-redesign-export`
- `npx expo export --platform ios --output-dir /private/tmp/capsaai-mobile-redesign-export-final`
- `npx expo export --platform ios --output-dir /private/tmp/capsaai-mobile-sdk54-redesign-export`
- `curl -I http://localhost:8082` con Expo/Metro levantado.

## Pendientes tecnicos

- Agregar navegacion real con Expo Router o React Navigation cuando se definan auth y rutas profundas.
- Conectar datos mobile al backend cuando exista API real.
- Reemplazar autenticacion local por Clerk antes de manejar usuarios reales.
- Reemplazar el grafico nativo simple por una libreria mobile si se necesita interaccion avanzada.
- Agregar formularios de alta/edicion de gastos.
- Agregar captura de comprobantes con camara/galeria.
- Agregar permisos mobile para ubicacion y notificaciones.
- Agregar WhatsApp como canal externo, no como dependencia directa de la app mobile.
- Preparar builds con EAS cuando se quiera distribuir.
