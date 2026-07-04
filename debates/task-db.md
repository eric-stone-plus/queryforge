TASK: Create two files for a Next.js hackathon project at ~/Public/data-agent:

FILE 1: src/lib/db.ts
- Import better-sqlite3
- Connect to ./data/ecommerce.db
- Export a getDb() function that returns the db instance
- Enable WAL mode

FILE 2: scripts/seed.ts
- Import @faker-js/faker with zh_CN locale
- Create tables: regions, categories, products, users, orders, order_items
- regions: id INTEGER PRIMARY KEY, name TEXT, country TEXT DEFAULT 'China'
- categories: id INTEGER PRIMARY KEY, name TEXT, parent_id INTEGER REFERENCES categories(id)
- products: id INTEGER PRIMARY KEY, name TEXT, category_id INTEGER, sku TEXT UNIQUE, unit_cost REAL, unit_price REAL, created_at TEXT
- users: id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, region_id INTEGER, segment TEXT DEFAULT 'regular', registered_at TEXT
- orders: id INTEGER PRIMARY KEY, user_id INTEGER, region_id INTEGER, order_date TEXT, status TEXT DEFAULT 'completed', total_amount REAL, channel TEXT
- order_items: id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price REAL, discount REAL DEFAULT 0
- Seed 8 regions (华东/华南/华北/华中/西南/西北/东北/港澳台), 20 categories, 500 products, 1000 users, 10000 orders, ~25000 order items
- Use faker for realistic Chinese e-commerce data
- Create data/ directory if not exists

Write both files. Use TypeScript.
