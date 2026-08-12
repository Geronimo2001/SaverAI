-- Rename tables to Spanish
ALTER TABLE "users" RENAME TO "usuarios";
ALTER TABLE "user_preferences" RENAME TO "preferencias_usuario";
ALTER TABLE "whatsapp_accounts" RENAME TO "cuentas_whatsapp";
ALTER TABLE "cards" RENAME TO "tarjetas";
ALTER TABLE "categories" RENAME TO "categorias";
ALTER TABLE "merchants" RENAME TO "comercios";
ALTER TABLE "merchant_aliases" RENAME TO "alias_comercios";
ALTER TABLE "merchant_locations" RENAME TO "ubicaciones_comercios";
ALTER TABLE "transactions" RENAME TO "transacciones";
ALTER TABLE "transaction_items" RENAME TO "items_transacciones";
ALTER TABLE "transaction_attachments" RENAME TO "adjuntos_transacciones";
ALTER TABLE "ingestion_jobs" RENAME TO "ingestas";
ALTER TABLE "ingestion_events" RENAME TO "eventos_ingesta";
ALTER TABLE "budgets" RENAME TO "presupuestos";
ALTER TABLE "subscriptions" RENAME TO "suscripciones";
ALTER TABLE "promotion_sources" RENAME TO "fuentes_promociones";
ALTER TABLE "scraper_runs" RENAME TO "ejecuciones_scraper";
ALTER TABLE "promotions" RENAME TO "promociones";
ALTER TABLE "recommendations" RENAME TO "recomendaciones";
ALTER TABLE "notifications" RENAME TO "notificaciones";
ALTER TABLE "user_location_snapshots" RENAME TO "ubicaciones_usuario";
ALTER TABLE "groups" RENAME TO "grupos";
ALTER TABLE "group_members" RENAME TO "miembros_grupos";
ALTER TABLE "shared_expenses" RENAME TO "gastos_compartidos";
ALTER TABLE "shared_expense_splits" RENAME TO "divisiones_gastos_compartidos";

-- usuarios
ALTER TABLE "usuarios" RENAME COLUMN "email" TO "correo";
ALTER TABLE "usuarios" RENAME COLUMN "passwordHash" TO "hash_contrasena";
ALTER TABLE "usuarios" RENAME COLUMN "fullName" TO "nombre_completo";
ALTER TABLE "usuarios" RENAME COLUMN "phoneE164" TO "telefono_e164";
ALTER TABLE "usuarios" RENAME COLUMN "country" TO "pais";
ALTER TABLE "usuarios" RENAME COLUMN "currency" TO "moneda";
ALTER TABLE "usuarios" RENAME COLUMN "timezone" TO "zona_horaria";
ALTER TABLE "usuarios" RENAME COLUMN "status" TO "estado";
ALTER TABLE "usuarios" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "usuarios" RENAME COLUMN "updatedAt" TO "actualizado_en";
ALTER TABLE "usuarios" RENAME COLUMN "deletedAt" TO "eliminado_en";

-- preferencias_usuario
ALTER TABLE "preferencias_usuario" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "notificationChannels" TO "canales_notificacion";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "alertThresholdPercent" TO "porcentaje_umbral_alerta";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "locationPromosEnabled" TO "promos_ubicacion_activadas";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "patternAlertsEnabled" TO "alertas_patron_activadas";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "duplicateDetectionEnabled" TO "deteccion_duplicados_activada";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "whatsappIngestionEnabled" TO "ingesta_whatsapp_activada";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "whatsappConfirmEveryCharge" TO "confirmar_cada_gasto_whatsapp";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "dataRetentionDays" TO "dias_retencion_datos";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "preferencias_usuario" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- cuentas_whatsapp
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "provider" TO "proveedor";
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "phoneE164" TO "telefono_e164";
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "providerUserId" TO "usuario_proveedor_id";
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "displayName" TO "nombre_visible";
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "isVerified" TO "verificada";
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "linkedAt" TO "vinculada_en";
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "cuentas_whatsapp" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- tarjetas
ALTER TABLE "tarjetas" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "tarjetas" RENAME COLUMN "issuerBank" TO "banco_emisor";
ALTER TABLE "tarjetas" RENAME COLUMN "brand" TO "marca";
ALTER TABLE "tarjetas" RENAME COLUMN "cardType" TO "tipo_tarjeta";
ALTER TABLE "tarjetas" RENAME COLUMN "lastFour" TO "ultimos_cuatro";
ALTER TABLE "tarjetas" RENAME COLUMN "creditLimitCents" TO "limite_credito_centavos";
ALTER TABLE "tarjetas" RENAME COLUMN "active" TO "activa";
ALTER TABLE "tarjetas" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "tarjetas" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- categorias
ALTER TABLE "categorias" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "categorias" RENAME COLUMN "key" TO "clave";
ALTER TABLE "categorias" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "categorias" RENAME COLUMN "icon" TO "icono";
ALTER TABLE "categorias" RENAME COLUMN "isEssential" TO "es_esencial";
ALTER TABLE "categorias" RENAME COLUMN "parentId" TO "categoria_padre_id";
ALTER TABLE "categorias" RENAME COLUMN "active" TO "activa";
ALTER TABLE "categorias" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "categorias" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- comercios
ALTER TABLE "comercios" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "comercios" RENAME COLUMN "slug" TO "identificador";
ALTER TABLE "comercios" RENAME COLUMN "rawNames" TO "nombres_crudos";
ALTER TABLE "comercios" RENAME COLUMN "categoryId" TO "categoria_id";
ALTER TABLE "comercios" RENAME COLUMN "country" TO "pais";
ALTER TABLE "comercios" RENAME COLUMN "websiteUrl" TO "sitio_web_url";
ALTER TABLE "comercios" RENAME COLUMN "source" TO "origen";
ALTER TABLE "comercios" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "comercios" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- alias_comercios
ALTER TABLE "alias_comercios" RENAME COLUMN "merchantId" TO "comercio_id";
ALTER TABLE "alias_comercios" RENAME COLUMN "source" TO "origen";
ALTER TABLE "alias_comercios" RENAME COLUMN "createdAt" TO "creado_en";

-- ubicaciones_comercios
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "merchantId" TO "comercio_id";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "country" TO "pais";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "province" TO "provincia";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "city" TO "ciudad";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "addressLine" TO "direccion";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "latitude" TO "latitud";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "externalPlaceId" TO "lugar_externo_id";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "source" TO "origen";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "active" TO "activa";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "ubicaciones_comercios" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- transacciones
ALTER TABLE "transacciones" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "transacciones" RENAME COLUMN "cardId" TO "tarjeta_id";
ALTER TABLE "transacciones" RENAME COLUMN "categoryId" TO "categoria_id";
ALTER TABLE "transacciones" RENAME COLUMN "merchantId" TO "comercio_id";
ALTER TABLE "transacciones" RENAME COLUMN "merchantLocationId" TO "ubicacion_comercio_id";
ALTER TABLE "transacciones" RENAME COLUMN "ingestionJobId" TO "ingesta_id";
ALTER TABLE "transacciones" RENAME COLUMN "amountCents" TO "monto_centavos";
ALTER TABLE "transacciones" RENAME COLUMN "currency" TO "moneda";
ALTER TABLE "transacciones" RENAME COLUMN "occurredAt" TO "ocurrida_en";
ALTER TABLE "transacciones" RENAME COLUMN "description" TO "descripcion";
ALTER TABLE "transacciones" RENAME COLUMN "notes" TO "notas";
ALTER TABLE "transacciones" RENAME COLUMN "source" TO "origen";
ALTER TABLE "transacciones" RENAME COLUMN "status" TO "estado";
ALTER TABLE "transacciones" RENAME COLUMN "confidence" TO "confianza";
ALTER TABLE "transacciones" RENAME COLUMN "duplicateOfId" TO "duplicado_de_id";
ALTER TABLE "transacciones" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "transacciones" RENAME COLUMN "updatedAt" TO "actualizado_en";
ALTER TABLE "transacciones" RENAME COLUMN "deletedAt" TO "eliminado_en";

-- items_transacciones
ALTER TABLE "items_transacciones" RENAME COLUMN "transactionId" TO "transaccion_id";
ALTER TABLE "items_transacciones" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "items_transacciones" RENAME COLUMN "quantity" TO "cantidad";
ALTER TABLE "items_transacciones" RENAME COLUMN "unitAmountCents" TO "monto_unitario_centavos";
ALTER TABLE "items_transacciones" RENAME COLUMN "totalAmountCents" TO "monto_total_centavos";
ALTER TABLE "items_transacciones" RENAME COLUMN "rawText" TO "texto_crudo";
ALTER TABLE "items_transacciones" RENAME COLUMN "createdAt" TO "creado_en";

-- adjuntos_transacciones
ALTER TABLE "adjuntos_transacciones" RENAME COLUMN "transactionId" TO "transaccion_id";
ALTER TABLE "adjuntos_transacciones" RENAME COLUMN "fileUrl" TO "archivo_url";
ALTER TABLE "adjuntos_transacciones" RENAME COLUMN "mimeType" TO "tipo_mime";
ALTER TABLE "adjuntos_transacciones" RENAME COLUMN "fileSizeBytes" TO "tamano_bytes";
ALTER TABLE "adjuntos_transacciones" RENAME COLUMN "source" TO "origen";
ALTER TABLE "adjuntos_transacciones" RENAME COLUMN "createdAt" TO "creado_en";

-- ingestas
ALTER TABLE "ingestas" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "ingestas" RENAME COLUMN "channel" TO "canal";
ALTER TABLE "ingestas" RENAME COLUMN "inputType" TO "tipo_entrada";
ALTER TABLE "ingestas" RENAME COLUMN "rawText" TO "texto_crudo";
ALTER TABLE "ingestas" RENAME COLUMN "fileUrl" TO "archivo_url";
ALTER TABLE "ingestas" RENAME COLUMN "rawPayload" TO "payload_crudo";
ALTER TABLE "ingestas" RENAME COLUMN "extractedPayload" TO "payload_extraido";
ALTER TABLE "ingestas" RENAME COLUMN "normalizedPayload" TO "payload_normalizado";
ALTER TABLE "ingestas" RENAME COLUMN "modelName" TO "modelo_nombre";
ALTER TABLE "ingestas" RENAME COLUMN "modelVersion" TO "modelo_version";
ALTER TABLE "ingestas" RENAME COLUMN "modelConfidence" TO "modelo_confianza";
ALTER TABLE "ingestas" RENAME COLUMN "status" TO "estado";
ALTER TABLE "ingestas" RENAME COLUMN "errorMessage" TO "mensaje_error";
ALTER TABLE "ingestas" RENAME COLUMN "receivedAt" TO "recibido_en";
ALTER TABLE "ingestas" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "ingestas" RENAME COLUMN "updatedAt" TO "actualizado_en";
ALTER TABLE "ingestas" RENAME COLUMN "processedAt" TO "procesado_en";

-- eventos_ingesta
ALTER TABLE "eventos_ingesta" RENAME COLUMN "ingestionJobId" TO "ingesta_id";
ALTER TABLE "eventos_ingesta" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "eventos_ingesta" RENAME COLUMN "detail" TO "detalle";
ALTER TABLE "eventos_ingesta" RENAME COLUMN "createdAt" TO "creado_en";

-- presupuestos
ALTER TABLE "presupuestos" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "presupuestos" RENAME COLUMN "categoryId" TO "categoria_id";
ALTER TABLE "presupuestos" RENAME COLUMN "cardId" TO "tarjeta_id";
ALTER TABLE "presupuestos" RENAME COLUMN "transactionId" TO "transaccion_id";
ALTER TABLE "presupuestos" RENAME COLUMN "budgetType" TO "tipo_presupuesto";
ALTER TABLE "presupuestos" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "presupuestos" RENAME COLUMN "period" TO "periodo";
ALTER TABLE "presupuestos" RENAME COLUMN "limitCents" TO "limite_centavos";
ALTER TABLE "presupuestos" RENAME COLUMN "alertThresholdPercent" TO "porcentaje_umbral_alerta";
ALTER TABLE "presupuestos" RENAME COLUMN "active" TO "activo";
ALTER TABLE "presupuestos" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "presupuestos" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- suscripciones
ALTER TABLE "suscripciones" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "suscripciones" RENAME COLUMN "merchantId" TO "comercio_id";
ALTER TABLE "suscripciones" RENAME COLUMN "cardId" TO "tarjeta_id";
ALTER TABLE "suscripciones" RENAME COLUMN "transactionId" TO "transaccion_id";
ALTER TABLE "suscripciones" RENAME COLUMN "amountCents" TO "monto_centavos";
ALTER TABLE "suscripciones" RENAME COLUMN "currency" TO "moneda";
ALTER TABLE "suscripciones" RENAME COLUMN "frequency" TO "frecuencia";
ALTER TABLE "suscripciones" RENAME COLUMN "nextExpectedAt" TO "proximo_esperado_en";
ALTER TABLE "suscripciones" RENAME COLUMN "status" TO "estado";
ALTER TABLE "suscripciones" RENAME COLUMN "confidence" TO "confianza";
ALTER TABLE "suscripciones" RENAME COLUMN "note" TO "nota";
ALTER TABLE "suscripciones" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "suscripciones" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- fuentes_promociones
ALTER TABLE "fuentes_promociones" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "fuentes_promociones" RENAME COLUMN "sourceType" TO "tipo_fuente";
ALTER TABLE "fuentes_promociones" RENAME COLUMN "baseUrl" TO "url_base";
ALTER TABLE "fuentes_promociones" RENAME COLUMN "active" TO "activa";
ALTER TABLE "fuentes_promociones" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "fuentes_promociones" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- ejecuciones_scraper
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "sourceId" TO "fuente_id";
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "status" TO "estado";
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "startedAt" TO "iniciado_en";
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "finishedAt" TO "finalizado_en";
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "itemsFound" TO "elementos_encontrados";
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "itemsCreated" TO "elementos_creados";
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "itemsUpdated" TO "elementos_actualizados";
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "errorMessage" TO "mensaje_error";
ALTER TABLE "ejecuciones_scraper" RENAME COLUMN "rawSummary" TO "resumen_crudo";

-- promociones
ALTER TABLE "promociones" RENAME COLUMN "sourceId" TO "fuente_id";
ALTER TABLE "promociones" RENAME COLUMN "merchantId" TO "comercio_id";
ALTER TABLE "promociones" RENAME COLUMN "merchantLocationId" TO "ubicacion_comercio_id";
ALTER TABLE "promociones" RENAME COLUMN "categoryId" TO "categoria_id";
ALTER TABLE "promociones" RENAME COLUMN "title" TO "titulo";
ALTER TABLE "promociones" RENAME COLUMN "issuerBank" TO "banco_emisor";
ALTER TABLE "promociones" RENAME COLUMN "cardBrand" TO "marca_tarjeta";
ALTER TABLE "promociones" RENAME COLUMN "cardType" TO "tipo_tarjeta";
ALTER TABLE "promociones" RENAME COLUMN "benefitType" TO "tipo_beneficio";
ALTER TABLE "promociones" RENAME COLUMN "benefitValue" TO "valor_beneficio";
ALTER TABLE "promociones" RENAME COLUMN "capCents" TO "tope_centavos";
ALTER TABLE "promociones" RENAME COLUMN "minPurchaseCents" TO "compra_minima_centavos";
ALTER TABLE "promociones" RENAME COLUMN "validFrom" TO "valida_desde";
ALTER TABLE "promociones" RENAME COLUMN "validUntil" TO "valida_hasta";
ALTER TABLE "promociones" RENAME COLUMN "weekdays" TO "dias_semana";
ALTER TABLE "promociones" RENAME COLUMN "conditions" TO "condiciones";
ALTER TABLE "promociones" RENAME COLUMN "sourceUrl" TO "origen_url";
ALTER TABLE "promociones" RENAME COLUMN "externalId" TO "externo_id";
ALTER TABLE "promociones" RENAME COLUMN "rawPayload" TO "payload_crudo";
ALTER TABLE "promociones" RENAME COLUMN "status" TO "estado";
ALTER TABLE "promociones" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "promociones" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- recomendaciones
ALTER TABLE "recomendaciones" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "recomendaciones" RENAME COLUMN "promotionId" TO "promocion_id";
ALTER TABLE "recomendaciones" RENAME COLUMN "type" TO "tipo";
ALTER TABLE "recomendaciones" RENAME COLUMN "title" TO "titulo";
ALTER TABLE "recomendaciones" RENAME COLUMN "detail" TO "detalle";
ALTER TABLE "recomendaciones" RENAME COLUMN "estimatedSavingCents" TO "ahorro_estimado_centavos";
ALTER TABLE "recomendaciones" RENAME COLUMN "score" TO "puntaje";
ALTER TABLE "recomendaciones" RENAME COLUMN "status" TO "estado";
ALTER TABLE "recomendaciones" RENAME COLUMN "metadata" TO "metadatos";
ALTER TABLE "recomendaciones" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "recomendaciones" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- notificaciones
ALTER TABLE "notificaciones" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "notificaciones" RENAME COLUMN "recommendationId" TO "recomendacion_id";
ALTER TABLE "notificaciones" RENAME COLUMN "channel" TO "canal";
ALTER TABLE "notificaciones" RENAME COLUMN "status" TO "estado";
ALTER TABLE "notificaciones" RENAME COLUMN "title" TO "titulo";
ALTER TABLE "notificaciones" RENAME COLUMN "body" TO "cuerpo";
ALTER TABLE "notificaciones" RENAME COLUMN "providerMessageId" TO "mensaje_proveedor_id";
ALTER TABLE "notificaciones" RENAME COLUMN "errorMessage" TO "mensaje_error";
ALTER TABLE "notificaciones" RENAME COLUMN "scheduledAt" TO "programada_en";
ALTER TABLE "notificaciones" RENAME COLUMN "sentAt" TO "enviada_en";
ALTER TABLE "notificaciones" RENAME COLUMN "createdAt" TO "creado_en";

-- ubicaciones_usuario
ALTER TABLE "ubicaciones_usuario" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "ubicaciones_usuario" RENAME COLUMN "latitude" TO "latitud";
ALTER TABLE "ubicaciones_usuario" RENAME COLUMN "accuracyMeters" TO "precision_metros";
ALTER TABLE "ubicaciones_usuario" RENAME COLUMN "city" TO "ciudad";
ALTER TABLE "ubicaciones_usuario" RENAME COLUMN "source" TO "origen";
ALTER TABLE "ubicaciones_usuario" RENAME COLUMN "capturedAt" TO "capturada_en";
ALTER TABLE "ubicaciones_usuario" RENAME COLUMN "retentionUntil" TO "retener_hasta";

-- grupos
ALTER TABLE "grupos" RENAME COLUMN "ownerUserId" TO "usuario_dueno_id";
ALTER TABLE "grupos" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "grupos" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "grupos" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- miembros_grupos
ALTER TABLE "miembros_grupos" RENAME COLUMN "groupId" TO "grupo_id";
ALTER TABLE "miembros_grupos" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "miembros_grupos" RENAME COLUMN "role" TO "rol";
ALTER TABLE "miembros_grupos" RENAME COLUMN "status" TO "estado";
ALTER TABLE "miembros_grupos" RENAME COLUMN "createdAt" TO "creado_en";

-- gastos_compartidos
ALTER TABLE "gastos_compartidos" RENAME COLUMN "groupId" TO "grupo_id";
ALTER TABLE "gastos_compartidos" RENAME COLUMN "transactionId" TO "transaccion_id";
ALTER TABLE "gastos_compartidos" RENAME COLUMN "paidByUserId" TO "pagado_por_usuario_id";
ALTER TABLE "gastos_compartidos" RENAME COLUMN "splitMethod" TO "metodo_division";
ALTER TABLE "gastos_compartidos" RENAME COLUMN "createdAt" TO "creado_en";
ALTER TABLE "gastos_compartidos" RENAME COLUMN "updatedAt" TO "actualizado_en";

-- divisiones_gastos_compartidos
ALTER TABLE "divisiones_gastos_compartidos" RENAME COLUMN "sharedExpenseId" TO "gasto_compartido_id";
ALTER TABLE "divisiones_gastos_compartidos" RENAME COLUMN "userId" TO "usuario_id";
ALTER TABLE "divisiones_gastos_compartidos" RENAME COLUMN "amountCents" TO "monto_centavos";
ALTER TABLE "divisiones_gastos_compartidos" RENAME COLUMN "percentage" TO "porcentaje";
ALTER TABLE "divisiones_gastos_compartidos" RENAME COLUMN "settledAt" TO "saldado_en";
