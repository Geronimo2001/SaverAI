-- AlterTable
ALTER TABLE "adjuntos_transacciones" RENAME CONSTRAINT "transaction_attachments_pkey" TO "adjuntos_transacciones_pkey";

-- AlterTable
ALTER TABLE "alias_comercios" RENAME CONSTRAINT "merchant_aliases_pkey" TO "alias_comercios_pkey";

-- AlterTable
ALTER TABLE "categorias" RENAME CONSTRAINT "categories_pkey" TO "categorias_pkey";

-- AlterTable
ALTER TABLE "comercios" RENAME CONSTRAINT "merchants_pkey" TO "comercios_pkey";

-- AlterTable
ALTER TABLE "cuentas_whatsapp" RENAME CONSTRAINT "whatsapp_accounts_pkey" TO "cuentas_whatsapp_pkey";

-- AlterTable
ALTER TABLE "divisiones_gastos_compartidos" RENAME CONSTRAINT "shared_expense_splits_pkey" TO "divisiones_gastos_compartidos_pkey";

-- AlterTable
ALTER TABLE "ejecuciones_scraper" RENAME CONSTRAINT "scraper_runs_pkey" TO "ejecuciones_scraper_pkey";

-- AlterTable
ALTER TABLE "eventos_ingesta" RENAME CONSTRAINT "ingestion_events_pkey" TO "eventos_ingesta_pkey";

-- AlterTable
ALTER TABLE "fuentes_promociones" RENAME CONSTRAINT "promotion_sources_pkey" TO "fuentes_promociones_pkey";

-- AlterTable
ALTER TABLE "gastos_compartidos" RENAME CONSTRAINT "shared_expenses_pkey" TO "gastos_compartidos_pkey";

-- AlterTable
ALTER TABLE "grupos" RENAME CONSTRAINT "groups_pkey" TO "grupos_pkey";

-- AlterTable
ALTER TABLE "ingestas" RENAME CONSTRAINT "ingestion_jobs_pkey" TO "ingestas_pkey";

-- AlterTable
ALTER TABLE "items_transacciones" RENAME CONSTRAINT "transaction_items_pkey" TO "items_transacciones_pkey";

-- AlterTable
ALTER TABLE "miembros_grupos" RENAME CONSTRAINT "group_members_pkey" TO "miembros_grupos_pkey";

-- AlterTable
ALTER TABLE "notificaciones" RENAME CONSTRAINT "notifications_pkey" TO "notificaciones_pkey";

-- AlterTable
ALTER TABLE "preferencias_usuario" RENAME CONSTRAINT "user_preferences_pkey" TO "preferencias_usuario_pkey";

-- AlterTable
ALTER TABLE "presupuestos" RENAME CONSTRAINT "budgets_pkey" TO "presupuestos_pkey";

-- AlterTable
ALTER TABLE "promociones" RENAME CONSTRAINT "promotions_pkey" TO "promociones_pkey";

-- AlterTable
ALTER TABLE "recomendaciones" RENAME CONSTRAINT "recommendations_pkey" TO "recomendaciones_pkey";

-- AlterTable
ALTER TABLE "suscripciones" RENAME CONSTRAINT "subscriptions_pkey" TO "suscripciones_pkey";

-- AlterTable
ALTER TABLE "tarjetas" RENAME CONSTRAINT "cards_pkey" TO "tarjetas_pkey";

-- AlterTable
ALTER TABLE "transacciones" RENAME CONSTRAINT "transactions_pkey" TO "transacciones_pkey";

-- AlterTable
ALTER TABLE "ubicaciones_comercios" RENAME CONSTRAINT "merchant_locations_pkey" TO "ubicaciones_comercios_pkey";

-- AlterTable
ALTER TABLE "ubicaciones_usuario" RENAME CONSTRAINT "user_location_snapshots_pkey" TO "ubicaciones_usuario_pkey";

-- AlterTable
ALTER TABLE "usuarios" RENAME CONSTRAINT "users_pkey" TO "usuarios_pkey";

-- RenameForeignKey
ALTER TABLE "adjuntos_transacciones" RENAME CONSTRAINT "transaction_attachments_transactionId_fkey" TO "adjuntos_transacciones_transaccion_id_fkey";

-- RenameForeignKey
ALTER TABLE "alias_comercios" RENAME CONSTRAINT "merchant_aliases_merchantId_fkey" TO "alias_comercios_comercio_id_fkey";

-- RenameForeignKey
ALTER TABLE "categorias" RENAME CONSTRAINT "categories_parentId_fkey" TO "categorias_categoria_padre_id_fkey";

-- RenameForeignKey
ALTER TABLE "comercios" RENAME CONSTRAINT "merchants_categoryId_fkey" TO "comercios_categoria_id_fkey";

-- RenameForeignKey
ALTER TABLE "cuentas_whatsapp" RENAME CONSTRAINT "whatsapp_accounts_userId_fkey" TO "cuentas_whatsapp_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "divisiones_gastos_compartidos" RENAME CONSTRAINT "shared_expense_splits_sharedExpenseId_fkey" TO "divisiones_gastos_compartidos_gasto_compartido_id_fkey";

-- RenameForeignKey
ALTER TABLE "ejecuciones_scraper" RENAME CONSTRAINT "scraper_runs_sourceId_fkey" TO "ejecuciones_scraper_fuente_id_fkey";

-- RenameForeignKey
ALTER TABLE "eventos_ingesta" RENAME CONSTRAINT "ingestion_events_ingestionJobId_fkey" TO "eventos_ingesta_ingesta_id_fkey";

-- RenameForeignKey
ALTER TABLE "gastos_compartidos" RENAME CONSTRAINT "shared_expenses_groupId_fkey" TO "gastos_compartidos_grupo_id_fkey";

-- RenameForeignKey
ALTER TABLE "gastos_compartidos" RENAME CONSTRAINT "shared_expenses_paidByUserId_fkey" TO "gastos_compartidos_pagado_por_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "gastos_compartidos" RENAME CONSTRAINT "shared_expenses_transactionId_fkey" TO "gastos_compartidos_transaccion_id_fkey";

-- RenameForeignKey
ALTER TABLE "grupos" RENAME CONSTRAINT "groups_ownerUserId_fkey" TO "grupos_usuario_dueno_id_fkey";

-- RenameForeignKey
ALTER TABLE "ingestas" RENAME CONSTRAINT "ingestion_jobs_userId_fkey" TO "ingestas_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "items_transacciones" RENAME CONSTRAINT "transaction_items_transactionId_fkey" TO "items_transacciones_transaccion_id_fkey";

-- RenameForeignKey
ALTER TABLE "miembros_grupos" RENAME CONSTRAINT "group_members_groupId_fkey" TO "miembros_grupos_grupo_id_fkey";

-- RenameForeignKey
ALTER TABLE "miembros_grupos" RENAME CONSTRAINT "group_members_userId_fkey" TO "miembros_grupos_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "notificaciones" RENAME CONSTRAINT "notifications_recommendationId_fkey" TO "notificaciones_recomendacion_id_fkey";

-- RenameForeignKey
ALTER TABLE "notificaciones" RENAME CONSTRAINT "notifications_userId_fkey" TO "notificaciones_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "preferencias_usuario" RENAME CONSTRAINT "user_preferences_userId_fkey" TO "preferencias_usuario_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "presupuestos" RENAME CONSTRAINT "budgets_cardId_fkey" TO "presupuestos_tarjeta_id_fkey";

-- RenameForeignKey
ALTER TABLE "presupuestos" RENAME CONSTRAINT "budgets_categoryId_fkey" TO "presupuestos_categoria_id_fkey";

-- RenameForeignKey
ALTER TABLE "presupuestos" RENAME CONSTRAINT "budgets_transactionId_fkey" TO "presupuestos_transaccion_id_fkey";

-- RenameForeignKey
ALTER TABLE "presupuestos" RENAME CONSTRAINT "budgets_userId_fkey" TO "presupuestos_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "promociones" RENAME CONSTRAINT "promotions_categoryId_fkey" TO "promociones_categoria_id_fkey";

-- RenameForeignKey
ALTER TABLE "promociones" RENAME CONSTRAINT "promotions_merchantId_fkey" TO "promociones_comercio_id_fkey";

-- RenameForeignKey
ALTER TABLE "promociones" RENAME CONSTRAINT "promotions_merchantLocationId_fkey" TO "promociones_ubicacion_comercio_id_fkey";

-- RenameForeignKey
ALTER TABLE "promociones" RENAME CONSTRAINT "promotions_sourceId_fkey" TO "promociones_fuente_id_fkey";

-- RenameForeignKey
ALTER TABLE "recomendaciones" RENAME CONSTRAINT "recommendations_promotionId_fkey" TO "recomendaciones_promocion_id_fkey";

-- RenameForeignKey
ALTER TABLE "recomendaciones" RENAME CONSTRAINT "recommendations_userId_fkey" TO "recomendaciones_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "suscripciones" RENAME CONSTRAINT "subscriptions_cardId_fkey" TO "suscripciones_tarjeta_id_fkey";

-- RenameForeignKey
ALTER TABLE "suscripciones" RENAME CONSTRAINT "subscriptions_merchantId_fkey" TO "suscripciones_comercio_id_fkey";

-- RenameForeignKey
ALTER TABLE "suscripciones" RENAME CONSTRAINT "subscriptions_transactionId_fkey" TO "suscripciones_transaccion_id_fkey";

-- RenameForeignKey
ALTER TABLE "suscripciones" RENAME CONSTRAINT "subscriptions_userId_fkey" TO "suscripciones_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "tarjetas" RENAME CONSTRAINT "cards_userId_fkey" TO "tarjetas_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "transacciones" RENAME CONSTRAINT "transactions_cardId_fkey" TO "transacciones_tarjeta_id_fkey";

-- RenameForeignKey
ALTER TABLE "transacciones" RENAME CONSTRAINT "transactions_categoryId_fkey" TO "transacciones_categoria_id_fkey";

-- RenameForeignKey
ALTER TABLE "transacciones" RENAME CONSTRAINT "transactions_duplicateOfId_fkey" TO "transacciones_duplicado_de_id_fkey";

-- RenameForeignKey
ALTER TABLE "transacciones" RENAME CONSTRAINT "transactions_ingestionJobId_fkey" TO "transacciones_ingesta_id_fkey";

-- RenameForeignKey
ALTER TABLE "transacciones" RENAME CONSTRAINT "transactions_merchantId_fkey" TO "transacciones_comercio_id_fkey";

-- RenameForeignKey
ALTER TABLE "transacciones" RENAME CONSTRAINT "transactions_merchantLocationId_fkey" TO "transacciones_ubicacion_comercio_id_fkey";

-- RenameForeignKey
ALTER TABLE "transacciones" RENAME CONSTRAINT "transactions_userId_fkey" TO "transacciones_usuario_id_fkey";

-- RenameForeignKey
ALTER TABLE "ubicaciones_comercios" RENAME CONSTRAINT "merchant_locations_merchantId_fkey" TO "ubicaciones_comercios_comercio_id_fkey";

-- RenameForeignKey
ALTER TABLE "ubicaciones_usuario" RENAME CONSTRAINT "user_location_snapshots_userId_fkey" TO "ubicaciones_usuario_usuario_id_fkey";

-- RenameIndex
ALTER INDEX "transaction_attachments_transactionId_idx" RENAME TO "adjuntos_transacciones_transaccion_id_idx";

-- RenameIndex
ALTER INDEX "merchant_aliases_alias_idx" RENAME TO "alias_comercios_alias_idx";

-- RenameIndex
ALTER INDEX "merchant_aliases_merchantId_alias_key" RENAME TO "alias_comercios_comercio_id_alias_key";

-- RenameIndex
ALTER INDEX "categories_key_key" RENAME TO "categorias_clave_key";

-- RenameIndex
ALTER INDEX "categories_userId_active_idx" RENAME TO "categorias_usuario_id_activa_idx";

-- RenameIndex
ALTER INDEX "merchants_categoryId_idx" RENAME TO "comercios_categoria_id_idx";

-- RenameIndex
ALTER INDEX "merchants_slug_key" RENAME TO "comercios_identificador_key";

-- RenameIndex
ALTER INDEX "whatsapp_accounts_provider_phoneE164_key" RENAME TO "cuentas_whatsapp_proveedor_telefono_e164_key";

-- RenameIndex
ALTER INDEX "whatsapp_accounts_userId_idx" RENAME TO "cuentas_whatsapp_usuario_id_idx";

-- RenameIndex
ALTER INDEX "shared_expense_splits_sharedExpenseId_userId_key" RENAME TO "divisiones_gastos_compartidos_gasto_compartido_id_usuario_i_key";

-- RenameIndex
ALTER INDEX "shared_expense_splits_userId_idx" RENAME TO "divisiones_gastos_compartidos_usuario_id_idx";

-- RenameIndex
ALTER INDEX "scraper_runs_sourceId_startedAt_idx" RENAME TO "ejecuciones_scraper_fuente_id_iniciado_en_idx";

-- RenameIndex
ALTER INDEX "scraper_runs_status_startedAt_idx" RENAME TO "ejecuciones_scraper_estado_iniciado_en_idx";

-- RenameIndex
ALTER INDEX "ingestion_events_ingestionJobId_createdAt_idx" RENAME TO "eventos_ingesta_ingesta_id_creado_en_idx";

-- RenameIndex
ALTER INDEX "promotion_sources_name_sourceType_key" RENAME TO "fuentes_promociones_nombre_tipo_fuente_key";

-- RenameIndex
ALTER INDEX "shared_expenses_groupId_createdAt_idx" RENAME TO "gastos_compartidos_grupo_id_creado_en_idx";

-- RenameIndex
ALTER INDEX "shared_expenses_paidByUserId_idx" RENAME TO "gastos_compartidos_pagado_por_usuario_id_idx";

-- RenameIndex
ALTER INDEX "shared_expenses_transactionId_key" RENAME TO "gastos_compartidos_transaccion_id_key";

-- RenameIndex
ALTER INDEX "groups_ownerUserId_idx" RENAME TO "grupos_usuario_dueno_id_idx";

-- RenameIndex
ALTER INDEX "ingestion_jobs_status_createdAt_idx" RENAME TO "ingestas_estado_creado_en_idx";

-- RenameIndex
ALTER INDEX "ingestion_jobs_userId_createdAt_idx" RENAME TO "ingestas_usuario_id_creado_en_idx";

-- RenameIndex
ALTER INDEX "transaction_items_transactionId_idx" RENAME TO "items_transacciones_transaccion_id_idx";

-- RenameIndex
ALTER INDEX "group_members_groupId_userId_key" RENAME TO "miembros_grupos_grupo_id_usuario_id_key";

-- RenameIndex
ALTER INDEX "group_members_userId_groupId_idx" RENAME TO "miembros_grupos_usuario_id_grupo_id_idx";

-- RenameIndex
ALTER INDEX "notifications_channel_status_scheduledAt_idx" RENAME TO "notificaciones_canal_estado_programada_en_idx";

-- RenameIndex
ALTER INDEX "notifications_userId_status_createdAt_idx" RENAME TO "notificaciones_usuario_id_estado_creado_en_idx";

-- RenameIndex
ALTER INDEX "user_preferences_userId_key" RENAME TO "preferencias_usuario_usuario_id_key";

-- RenameIndex
ALTER INDEX "budgets_userId_budgetType_period_idx" RENAME TO "presupuestos_usuario_id_tipo_presupuesto_periodo_idx";

-- RenameIndex
ALTER INDEX "budgets_userId_period_active_idx" RENAME TO "presupuestos_usuario_id_periodo_activo_idx";

-- RenameIndex
ALTER INDEX "promotions_categoryId_status_idx" RENAME TO "promociones_categoria_id_estado_idx";

-- RenameIndex
ALTER INDEX "promotions_issuerBank_cardBrand_cardType_idx" RENAME TO "promociones_banco_emisor_marca_tarjeta_tipo_tarjeta_idx";

-- RenameIndex
ALTER INDEX "promotions_merchantId_status_idx" RENAME TO "promociones_comercio_id_estado_idx";

-- RenameIndex
ALTER INDEX "promotions_status_validUntil_idx" RENAME TO "promociones_estado_valida_hasta_idx";

-- RenameIndex
ALTER INDEX "recommendations_type_createdAt_idx" RENAME TO "recomendaciones_tipo_creado_en_idx";

-- RenameIndex
ALTER INDEX "recommendations_userId_status_createdAt_idx" RENAME TO "recomendaciones_usuario_id_estado_creado_en_idx";

-- RenameIndex
ALTER INDEX "subscriptions_nextExpectedAt_idx" RENAME TO "suscripciones_proximo_esperado_en_idx";

-- RenameIndex
ALTER INDEX "subscriptions_userId_status_idx" RENAME TO "suscripciones_usuario_id_estado_idx";

-- RenameIndex
ALTER INDEX "cards_userId_active_idx" RENAME TO "tarjetas_usuario_id_activa_idx";

-- RenameIndex
ALTER INDEX "cards_userId_issuerBank_brand_lastFour_key" RENAME TO "tarjetas_usuario_id_banco_emisor_marca_ultimos_cuatro_key";

-- RenameIndex
ALTER INDEX "transactions_ingestionJobId_key" RENAME TO "transacciones_ingesta_id_key";

-- RenameIndex
ALTER INDEX "transactions_status_createdAt_idx" RENAME TO "transacciones_estado_creado_en_idx";

-- RenameIndex
ALTER INDEX "transactions_userId_cardId_occurredAt_idx" RENAME TO "transacciones_usuario_id_tarjeta_id_ocurrida_en_idx";

-- RenameIndex
ALTER INDEX "transactions_userId_categoryId_occurredAt_idx" RENAME TO "transacciones_usuario_id_categoria_id_ocurrida_en_idx";

-- RenameIndex
ALTER INDEX "transactions_userId_merchantId_occurredAt_idx" RENAME TO "transacciones_usuario_id_comercio_id_ocurrida_en_idx";

-- RenameIndex
ALTER INDEX "transactions_userId_occurredAt_idx" RENAME TO "transacciones_usuario_id_ocurrida_en_idx";

-- RenameIndex
ALTER INDEX "merchant_locations_latitude_longitude_idx" RENAME TO "ubicaciones_comercios_latitud_longitud_idx";

-- RenameIndex
ALTER INDEX "merchant_locations_merchantId_active_idx" RENAME TO "ubicaciones_comercios_comercio_id_activa_idx";

-- RenameIndex
ALTER INDEX "user_location_snapshots_latitude_longitude_idx" RENAME TO "ubicaciones_usuario_latitud_longitud_idx";

-- RenameIndex
ALTER INDEX "user_location_snapshots_userId_capturedAt_idx" RENAME TO "ubicaciones_usuario_usuario_id_capturada_en_idx";

-- RenameIndex
ALTER INDEX "users_email_key" RENAME TO "usuarios_correo_key";

-- RenameIndex
ALTER INDEX "users_phoneE164_key" RENAME TO "usuarios_telefono_e164_key";

-- RenameIndex
ALTER INDEX "users_status_createdAt_idx" RENAME TO "usuarios_estado_creado_en_idx";
