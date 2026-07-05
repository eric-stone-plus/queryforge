# QueryForge Database Layer

QueryForge ships with a local SQLite demo database built from the Kaggle Olist Brazilian E-Commerce Public Dataset. Olist is a reproducible demo case, not a product limitation.

## Current Tables

- `regions`
- `categories`
- `products`
- `users`
- `orders`
- `order_items`

## Runtime Behavior

- `src/lib/db.ts` opens SQLite through `better-sqlite3`.
- The connection is read-only.
- `DB_PATH` can point the desktop bundle at its packaged database.
- Local development falls back to `data/ecommerce.db`.
- The packaged desktop build checkpoints WAL state and sets `journal_mode=DELETE` for safer read-only app resources.

## Validation

- Orders: `99,441`
- Revenue: `16008872.12`
- Regions: `Sudeste`, `Sul`, `Nordeste`, `Centro-Oeste`, `Norte`
- Public query API blocks wildcard projections and the synthetic `email` column.

## Product Boundary

The local Olist database proves the harness flow: schema, controlled SQL, read-only execution, charting, result-grounded explanation, and token budget tracking. A production deployment would replace this adapter with a customer-controlled database or warehouse connection.
