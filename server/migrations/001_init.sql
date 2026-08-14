CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  whatsapp_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  last_four TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, last_four)
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'ARS',
  merchant TEXT NOT NULL,
  category_code TEXT NOT NULL REFERENCES expense_categories(code),
  payment_method_id BIGINT NOT NULL REFERENCES payment_methods(id),
  spent_at DATE NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'whatsapp',
  external_message_id TEXT NOT NULL UNIQUE,
  source_message_ids TEXT[] NOT NULL DEFAULT '{}',
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_processed_messages (
  message_id TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expense_id BIGINT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO expense_categories (code, label)
VALUES
  ('super', 'Super'),
  ('comida', 'Comida'),
  ('transporte', 'Transporte'),
  ('servicios', 'Servicios'),
  ('cafe', 'Cafe'),
  ('compras', 'Compras')
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label;
