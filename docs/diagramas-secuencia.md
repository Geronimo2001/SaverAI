# Diagramas de secuencia - CapsaAI

Estos diagramas representan los flujos actuales de la app. La implementacion usa componentes de Next.js y datos locales desde `lib/capsa-data.ts`; no hay API externa ni base de datos en el estado actual del proyecto.

## 1. Carga del inicio

```mermaid
sequenceDiagram
    actor Usuario
    participant Browser as Navegador
    participant Home as app/page.tsx
    participant Data as lib/capsa-data.ts
    participant Chart as ChartContainer/Recharts
    participant Nav as BottomNav

    Usuario->>Browser: Abre /
    Browser->>Home: Solicita pantalla Inicio
    Home->>Data: Lee spendingSummary, spendingTrend, categorySpend, linkedCards y subscriptions
    Data-->>Home: Devuelve datos mockeados
    Home->>Chart: Renderiza linea temporal de gasto real vs proyectado
    Home->>Nav: Renderiza navegacion con Inicio activo
    Home-->>Browser: Devuelve UI del dashboard
    Browser-->>Usuario: Muestra resumen, categorias, tarjetas y suscripciones
```

## 2. Filtrar suscripciones por tarjeta

```mermaid
sequenceDiagram
    actor Usuario
    participant Home as HomePage
    participant State as Estado React
    participant Data as subscriptions / linkedCards
    participant UI as Lista de suscripciones

    Usuario->>Home: Toca una tarjeta vinculada
    Home->>State: setSelectedCardLastFour(ultimos 4 digitos)
    State-->>Home: Re-render con tarjeta seleccionada
    Home->>Data: Filtra subscriptions por numero de tarjeta
    Data-->>Home: Devuelve suscripciones coincidentes
    Home->>UI: Actualiza total mensual y lista filtrada
    UI-->>Usuario: Muestra suscripciones de esa tarjeta

    alt Usuario toca "Ver todas" o la misma tarjeta
        Usuario->>Home: Quita filtro
        Home->>State: setSelectedCardLastFour(null)
        State-->>Home: Re-render sin filtro
        Home->>UI: Muestra todas las suscripciones
    end
```

## 3. Consulta de gastos y calendario

```mermaid
sequenceDiagram
    actor Usuario
    participant Browser as Navegador
    participant Gastos as app/gastos/page.tsx
    participant Data as lib/capsa-data.ts
    participant Heatmap as CalendarHeatmap

    Usuario->>Browser: Navega a /gastos
    Browser->>Gastos: Solicita pantalla Gastos
    Gastos->>Data: Lee calendarDays, linkedCards, transactions, categories y spendingSummary
    Data-->>Gastos: Devuelve dias, transacciones y categorias
    Gastos->>Gastos: Calcula dia con mayor gasto
    Gastos->>Heatmap: Envia mes, anio, dias y tarjetas
    Heatmap->>Heatmap: Calcula intensidad de cada dia
    Gastos-->>Browser: Renderiza resumen, calendario, categorias y transacciones
    Browser-->>Usuario: Muestra vista de gastos
```

## 4. Filtros y seleccion de dia en calendario

```mermaid
sequenceDiagram
    actor Usuario
    participant Heatmap as CalendarHeatmap
    participant State as Estado React
    participant Memo as useMemo(filteredDays)
    participant UI as Calendario y detalle

    Usuario->>Heatmap: Activa categoria o tarjeta
    Heatmap->>State: Actualiza activeCategories o activeCards
    State-->>Heatmap: Re-render con filtros activos
    Heatmap->>Memo: Recalcula dias filtrados
    Memo-->>Heatmap: Devuelve montos y transacciones filtradas
    Heatmap->>UI: Actualiza total, intensidad y grilla
    UI-->>Usuario: Muestra calendario filtrado

    Usuario->>Heatmap: Selecciona un dia
    Heatmap->>State: setSelectedDayDate(dia)
    State-->>Heatmap: Re-render con dia seleccionado
    Heatmap->>UI: Muestra detalle de transacciones del dia
    UI-->>Usuario: Ve monto y movimientos del dia
```

## 5. Revision de alertas

```mermaid
sequenceDiagram
    actor Usuario
    participant Home as app/page.tsx
    participant Browser as Navegador
    participant Alertas as app/alertas/page.tsx
    participant Data as lib/capsa-data.ts
    participant Gastos as app/gastos/page.tsx

    Usuario->>Home: Toca icono de alertas
    Home->>Browser: Navega a /alertas
    Browser->>Alertas: Solicita pantalla Alertas
    Alertas->>Data: Lee alerts
    Data-->>Alertas: Devuelve alertas con severidad, detalle e icono
    Alertas-->>Browser: Renderiza listado priorizado
    Browser-->>Usuario: Muestra alertas de gasto

    opt Usuario quiere revisar movimientos
        Usuario->>Alertas: Toca "Revisar transacciones"
        Alertas->>Browser: Navega a /gastos
        Browser->>Gastos: Carga detalle de gastos
    end
```

## 6. Promociones cercanas

```mermaid
sequenceDiagram
    actor Usuario
    participant Home as app/page.tsx
    participant Browser as Navegador
    participant Cerca as app/cerca/page.tsx
    participant Data as lib/capsa-data.ts

    Usuario->>Home: Toca "Promos cerca"
    Home->>Browser: Navega a /cerca
    Browser->>Cerca: Solicita pantalla Cerca
    Cerca->>Data: Lee nearbyPromos
    Data-->>Cerca: Devuelve promociones detectadas
    Cerca->>Cerca: Selecciona nearbyPromos[0] como mejor promocion
    Cerca-->>Browser: Renderiza mejor decision y lista de promos
    Browser-->>Usuario: Muestra comercio, beneficio, tarjeta recomendada y ahorro estimado
```

## 7. Perfil, presupuesto y preferencias

```mermaid
sequenceDiagram
    actor Usuario
    participant Browser as Navegador
    participant Perfil as app/perfil/page.tsx
    participant Data as lib/capsa-data.ts

    Usuario->>Browser: Navega a /perfil
    Browser->>Perfil: Solicita pantalla Perfil
    Perfil->>Data: Lee profileSettings, linkedCards y spendingSummary
    Data-->>Perfil: Devuelve presupuesto, tarjetas y preferencias
    Perfil->>Perfil: Calcula avance del gasto sobre presupuesto mensual
    Perfil-->>Browser: Renderiza perfil, presupuesto, tarjetas y privacidad
    Browser-->>Usuario: Muestra configuracion actual de la cuenta
```

