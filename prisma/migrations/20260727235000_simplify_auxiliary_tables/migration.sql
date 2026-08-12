-- Move low-value auxiliary entities into JSON columns for the MVP.
ALTER TABLE "transacciones" ADD COLUMN "items" JSONB;
ALTER TABLE "transacciones" ADD COLUMN "adjuntos" JSONB;
ALTER TABLE "ingestas" ADD COLUMN "eventos" JSONB;

UPDATE "transacciones" AS t
SET "items" = item_rows.items
FROM (
  SELECT
    "transaccion_id",
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', "id",
          'nombre', "nombre",
          'cantidad', "cantidad",
          'monto_unitario_centavos', "monto_unitario_centavos",
          'monto_total_centavos', "monto_total_centavos",
          'texto_crudo', "texto_crudo",
          'creado_en', "creado_en"
        )
      )
      ORDER BY "creado_en", "id"
    ) AS items
  FROM "items_transacciones"
  GROUP BY "transaccion_id"
) AS item_rows
WHERE t."id" = item_rows."transaccion_id";

UPDATE "transacciones" AS t
SET "adjuntos" = attachment_rows.adjuntos
FROM (
  SELECT
    "transaccion_id",
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', "id",
          'archivo_url', "archivo_url",
          'tipo_mime', "tipo_mime",
          'tamano_bytes', "tamano_bytes",
          'origen', "origen",
          'creado_en', "creado_en"
        )
      )
      ORDER BY "creado_en", "id"
    ) AS adjuntos
  FROM "adjuntos_transacciones"
  GROUP BY "transaccion_id"
) AS attachment_rows
WHERE t."id" = attachment_rows."transaccion_id";

UPDATE "ingestas" AS i
SET "eventos" = event_rows.eventos
FROM (
  SELECT
    "ingesta_id",
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', "id",
          'nombre', "nombre",
          'detalle', "detalle",
          'creado_en', "creado_en"
        )
      )
      ORDER BY "creado_en", "id"
    ) AS eventos
  FROM "eventos_ingesta"
  GROUP BY "ingesta_id"
) AS event_rows
WHERE i."id" = event_rows."ingesta_id";

DROP TABLE "alias_comercios";
DROP TABLE "items_transacciones";
DROP TABLE "adjuntos_transacciones";
DROP TABLE "eventos_ingesta";
