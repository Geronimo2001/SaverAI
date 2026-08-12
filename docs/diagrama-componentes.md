# Diagrama de componentes - CapsaAI

Este diagrama muestra la organizacion actual de la app: paginas de Next.js, componentes compartidos y fuente de datos local.

```mermaid
flowchart TB
    Usuario[Usuario]
    Browser[Navegador]

    subgraph App[Next.js App Router]
        Layout[app/layout.tsx]
        Inicio[app/page.tsx<br/>Inicio]
        Gastos[app/gastos/page.tsx<br/>Gastos]
        Cerca[app/cerca/page.tsx<br/>Cerca]
        Alertas[app/alertas/page.tsx<br/>Alertas]
        Perfil[app/perfil/page.tsx<br/>Perfil]
    end

    subgraph Dashboard[Componentes de dashboard]
        BottomNav[BottomNav]
        CalendarHeatmap[CalendarHeatmap]
    end

    subgraph UI[Componentes UI compartidos]
        Chart[ChartContainer / ChartTooltip]
        Cards[Card, Button, Badge, Input, etc.]
    end

    subgraph Data[Datos y utilidades]
        CapsaData[lib/capsa-data.ts]
        Utils[lib/utils.ts]
    end

    subgraph External[Dependencias externas]
        Recharts[Recharts]
        Lucide[Lucide React]
        NextLink[Next Link]
        Tailwind[Tailwind CSS]
    end

    Usuario --> Browser
    Browser --> Layout
    Layout --> Inicio
    Layout --> Gastos
    Layout --> Cerca
    Layout --> Alertas
    Layout --> Perfil

    Inicio --> BottomNav
    Gastos --> BottomNav
    Cerca --> BottomNav
    Alertas --> BottomNav
    Perfil --> BottomNav

    Gastos --> CalendarHeatmap
    Inicio --> Chart
    Inicio --> Cards
    Gastos --> Cards
    Cerca --> Cards
    Alertas --> Cards
    Perfil --> Cards

    Inicio --> CapsaData
    Gastos --> CapsaData
    Cerca --> CapsaData
    Alertas --> CapsaData
    Perfil --> CapsaData
    Cards --> Utils

    Chart --> Recharts
    BottomNav --> Lucide
    CalendarHeatmap --> Lucide
    Inicio --> Lucide
    Gastos --> Lucide
    Cerca --> Lucide
    Alertas --> Lucide
    Perfil --> Lucide
    BottomNav --> NextLink
    Inicio --> NextLink
    Alertas --> NextLink
    App --> Tailwind
    Dashboard --> Tailwind
    UI --> Tailwind
```

## Responsabilidades principales

| Componente | Responsabilidad |
| --- | --- |
| `app/page.tsx` | Dashboard inicial: resumen mensual, proyeccion, categorias, tarjetas, suscripciones y accesos rapidos. |
| `app/gastos/page.tsx` | Vista de gastos: estadisticas, calendario, categorias y transacciones recientes. |
| `components/dashboard/calendar-heatmap.tsx` | Calendario interactivo con filtros por categoria/tarjeta y detalle diario. |
| `app/alertas/page.tsx` | Listado de alertas priorizadas y acceso a revision de transacciones. |
| `app/cerca/page.tsx` | Promociones cercanas y recomendacion de tarjeta. |
| `app/perfil/page.tsx` | Presupuesto, tarjetas vinculadas, preferencias y privacidad. |
| `components/dashboard/bottom-nav.tsx` | Navegacion principal entre secciones. |
| `lib/capsa-data.ts` | Datos mockeados, categorias y funciones de formateo. |

