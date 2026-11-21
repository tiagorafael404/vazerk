CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY NOT NULL,
    uid TEXT NOT NULL,
    firebase_project_id TEXT NOT NULL,
    status TEXT NOT NULL,
    currency TEXT NOT NULL,
    total INTEGER NOT NULL CHECK (total >= 0),
    items_json TEXT NOT NULL,
    payment_intent_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_user_date_idx
    ON orders (uid, firebase_project_id, created_at DESC);
