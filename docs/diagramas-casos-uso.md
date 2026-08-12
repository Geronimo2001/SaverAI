# Diagramas de casos de uso - CapsaAI

Estos casos de uso describen lo que puede hacer el usuario con la version actual de la app.

## 1. Vista general del sistema

```mermaid
flowchart LR
    Usuario((Usuario))

    subgraph CapsaAI[CapsaAI]
        UC1[Consultar resumen mensual]
        UC2[Analizar proyeccion de gasto]
        UC3[Ver categorias principales]
        UC4[Filtrar suscripciones por tarjeta]
        UC5[Consultar gastos]
        UC6[Filtrar calendario por categoria o tarjeta]
        UC7[Ver detalle de un dia]
        UC8[Revisar alertas]
        UC9[Revisar transacciones alertadas]
        UC10[Consultar promociones cercanas]
        UC11[Ver tarjeta recomendada]
        UC12[Consultar perfil y presupuesto]
        UC13[Ver preferencias de alertas]
    end

    Usuario --> UC1
    Usuario --> UC2
    Usuario --> UC3
    Usuario --> UC4
    Usuario --> UC5
    Usuario --> UC6
    Usuario --> UC7
    Usuario --> UC8
    Usuario --> UC10
    Usuario --> UC12

    UC8 -. incluye .-> UC9
    UC10 -. incluye .-> UC11
    UC12 -. incluye .-> UC13
    UC5 -. incluye .-> UC6
    UC6 -. extiende .-> UC7
```

## 2. Casos de uso del dashboard

```mermaid
flowchart LR
    Usuario((Usuario))

    subgraph Inicio[Inicio]
        Resumen[Consultar gasto acumulado]
        Progreso[Ver avance sobre objetivo]
        Proyeccion[Ver cierre proyectado]
        Tendencia[Analizar linea temporal]
        Categorias[Ver categorias que mueven el mes]
        Tarjetas[Ver tarjetas vinculadas]
        Suscripciones[Ver suscripciones]
        Filtro[Filtrar suscripciones por tarjeta]
        Accesos[Navegar a gastos, cerca, alertas o perfil]
    end

    Usuario --> Resumen
    Usuario --> Progreso
    Usuario --> Proyeccion
    Usuario --> Tendencia
    Usuario --> Categorias
    Usuario --> Tarjetas
    Usuario --> Suscripciones
    Usuario --> Filtro
    Usuario --> Accesos

    Resumen -. incluye .-> Progreso
    Proyeccion -. incluye .-> Tendencia
    Tarjetas -. extiende .-> Filtro
    Filtro -. actualiza .-> Suscripciones
```

## 3. Casos de uso de gastos

```mermaid
flowchart LR
    Usuario((Usuario))

    subgraph Gastos[Gastos]
        Estadisticas[Ver mayor dia y promedio diario]
        Calendario[Consultar calendario de gastos]
        FiltrarCategoria[Filtrar por categoria]
        FiltrarTarjeta[Filtrar por tarjeta]
        LimpiarFiltros[Limpiar filtros]
        SeleccionarDia[Seleccionar dia]
        DetalleDia[Ver transacciones del dia]
        Categorias[Ver categorias disponibles]
        Transacciones[Ver transacciones recientes]
    end

    Usuario --> Estadisticas
    Usuario --> Calendario
    Usuario --> FiltrarCategoria
    Usuario --> FiltrarTarjeta
    Usuario --> LimpiarFiltros
    Usuario --> SeleccionarDia
    Usuario --> Categorias
    Usuario --> Transacciones

    Calendario -. incluye .-> FiltrarCategoria
    Calendario -. incluye .-> FiltrarTarjeta
    Calendario -. incluye .-> LimpiarFiltros
    SeleccionarDia -. incluye .-> DetalleDia
    FiltrarCategoria -. actualiza .-> Calendario
    FiltrarTarjeta -. actualiza .-> Calendario
```

## 4. Casos de uso de alertas y promociones

```mermaid
flowchart LR
    Usuario((Usuario))

    subgraph Alertas[Alertas]
        VerAlertas[Ver alertas priorizadas]
        VerSeveridad[Consultar severidad]
        VerDetalle[Leer detalle de alerta]
        RevisarMovimientos[Revisar transacciones relacionadas]
    end

    subgraph Cerca[Cerca]
        VerMejorDecision[Ver mejor decision cercana]
        VerPromos[Consultar promociones detectadas]
        VerBeneficio[Ver beneficio y tarjeta recomendada]
        VerAhorro[Consultar ahorro estimado]
    end

    Usuario --> VerAlertas
    Usuario --> RevisarMovimientos
    Usuario --> VerMejorDecision
    Usuario --> VerPromos

    VerAlertas -. incluye .-> VerSeveridad
    VerAlertas -. incluye .-> VerDetalle
    RevisarMovimientos -. navega a .-> VerAlertas
    VerPromos -. incluye .-> VerBeneficio
    VerPromos -. incluye .-> VerAhorro
    VerMejorDecision -. incluye .-> VerBeneficio
```

## 5. Casos de uso de perfil

```mermaid
flowchart LR
    Usuario((Usuario))

    subgraph Perfil[Perfil]
        VerCuenta[Ver datos de cuenta]
        VerPresupuesto[Consultar objetivo mensual]
        VerAvance[Ver avance del gasto]
        VerTarjetas[Consultar tarjetas vinculadas]
        VerPreferencias[Ver preferencias]
        VerPrivacidad[Consultar estado de privacidad]
    end

    Usuario --> VerCuenta
    Usuario --> VerPresupuesto
    Usuario --> VerTarjetas
    Usuario --> VerPreferencias
    Usuario --> VerPrivacidad

    VerPresupuesto -. incluye .-> VerAvance
    VerPreferencias -. incluye .-> VerPrivacidad
```

