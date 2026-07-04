TASK: Create the current QueryForge database layer for a Next.js hackathon project.

FILE 1: `src/lib/db.ts`
- Import `better-sqlite3`.
- Connect to `./data/ecommerce.db`.
- Export a `getDb()` function that returns the database instance.
- Open the database in readonly mode where appropriate for query execution.

FILE 2: `scripts/seed-olist.js`
- Load Kaggle Olist Brazilian E-Commerce CSV files from `data/olist/`.
- Create normalized tables: `regions`, `categories`, `products`, `users`, `orders`, `order_items`.
- Map Brazilian state codes into regions: `Sudeste`, `Sul`, `Nordeste`, `Centro-Oeste`, `Norte`.
- Map payment types into display channels: `Cartão de Crédito`, `Boleto`, `Voucher`, `Cartão de Débito`.
- Import roughly 99K orders and related users, products, categories, payments, and items.
- Keep query fields aligned with the app schema used by `/api/query` and the agent prompt.
- Run `VACUUM` after import so the SQLite file does not retain obsolete page content.

Validation:
- `select count(*) from orders` returns `99,441`.
- `select round(sum(total_amount), 2) from orders` returns `16008872.12`.
- `select name from regions order by id` returns the five Brazilian region names above.
- Channel counts match the Olist payment mapping used in the dashboard.
