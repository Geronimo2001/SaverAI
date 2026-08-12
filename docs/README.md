# Documentacion tecnica - CapsaAI

Indice de documentos para pasar de la maqueta actual a una arquitectura implementable.

## Estado actual

- [Diagrama de componentes](./diagrama-componentes.md): estructura actual de la app Next.js.
- [Diagramas de casos de uso](./diagramas-casos-uso.md): casos cubiertos por la maqueta.
- [Diagramas de secuencia](./diagramas-secuencia.md): flujos actuales con datos mockeados.

## Arquitectura objetivo

- [Arquitectura objetivo](./arquitectura-objetivo.md): backend, workers, base de datos, servicios externos y flujos.
- [Modelo de datos inicial](./modelo-datos.md): entidades principales para PostgreSQL.
- [Backlog tecnico](./backlog-tecnico.md): epicas, tareas y orden recomendado.
- [Contratos de API](./contratos-api.md): endpoints iniciales para mobile, web y workers.
- [Integraciones pendientes](./integraciones-pendientes.md): WhatsApp, email, OCR, audio, mapas, push y privacidad.
- [Migracion a React Native](./migracion-react-native.md): estructura mobile Expo y pendientes del port.

## Prioridad recomendada

1. Implementar backend base: usuarios, auth, gastos, tarjetas, categorias y presupuestos.
2. Conectar el dashboard actual a API real.
3. Agregar reglas locales de proyeccion, alertas, duplicados y suscripciones.
4. Agregar worker de ingesta generico.
5. Integrar WhatsApp por texto simple cuando esten listas las credenciales.
6. Agregar promociones con carga manual/CSV antes de depender de scrapers.
