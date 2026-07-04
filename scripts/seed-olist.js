const Database = require("better-sqlite3");
const { readFileSync, mkdirSync } = require("fs");
const { join } = require("path");

const olistDir = join(__dirname, "..", "data", "olist");
const dataDir = join(__dirname, "..", "data");
const dbPath = join(dataDir, "ecommerce.db");

function readCsv(name) {
  const raw = readFileSync(join(olistDir, name), "utf-8").replace(/^\uFEFF/, "");
  const lines = raw.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
  return lines.slice(1).map(line => {
    const vals = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i] || "");
    return obj;
  });
}

console.log("Reading CSVs...");
const customers = readCsv("olist_customers_dataset.csv");
const orders = readCsv("olist_orders_dataset.csv");
const orderItems = readCsv("olist_order_items_dataset.csv");
const products = readCsv("olist_products_dataset.csv");
const payments = readCsv("olist_order_payments_dataset.csv");
const catTranslation = readCsv("product_category_name_translation.csv");

console.log(`  customers: ${customers.length}, orders: ${orders.length}, items: ${orderItems.length}, products: ${products.length}`);

// Build category translation map
const catMap = {};
for (const row of catTranslation) {
  catMap[row.product_category_name] = row.product_category_name_english;
}

// Map Brazilian states to5 regions
const stateToRegion = {
  // Sudeste (wealthiest, most orders)
  SP: 1, RJ: 1, MG: 1, ES: 1,
  // Sul
  RS: 2, SC: 2, PR: 2,
  // Nordeste
  BA: 3, PE: 3, CE: 3, MA: 3, PB: 3, RN: 3, AL: 3, SE: 3, PI: 3,
  // Norte + Centro-Oeste
  AM: 4, PA: 4, GO: 4, MT: 4, MS: 4, DF: 4, RO: 4, AC: 4, AP: 4, RR: 4, TO: 4,
};
const regionNames = ["Sudeste", "Sul", "Nordeste", "Centro-Oeste", "Norte"];

// Get unique categories from products
const catSet = new Set();
for (const p of products) {
  const eng = catMap[p.product_category_name] || p.product_category_name || "other";
  catSet.add(eng);
}
const catList = [...catSet].sort();

// Build customer unique_id → id mapping
const custUniqIds = [...new Set(customers.map(c => c.customer_unique_id))].sort();
const custIdMap = {};
custUniqIds.forEach((uid, i) => custIdMap[uid] = i + 1);

// Build product_id → id mapping
const prodIds = [...new Set(products.map(p => p.product_id))].sort();
const prodIdMap = {};
prodIds.forEach((pid, i) => prodIdMap[pid] = i + 1);

// Build order_id → id mapping
const orderIds = [...new Set(orders.map(o => o.order_id))].sort();
const orderIdMap = {};
orderIds.forEach((oid, i) => orderIdMap[oid] = i + 1);

// Pre-index customers by customer_id
const custById = {};
for (const c of customers) custById[c.customer_id] = c;

// Get customer state for each order
const custStateMap = custById;

// Pre-index payments by order_id and compute totals
const paymentMap = {};
const firstPayByOrder = {};
for (const p of payments) {
  const oid = p.order_id;
  if (!paymentMap[oid]) paymentMap[oid] = 0;
  paymentMap[oid] += parseFloat(p.payment_value) || 0;
  if (!firstPayByOrder[oid]) firstPayByOrder[oid] = p;
}

// Get unique customer_unique_id per customer_id
const custIdToUniq = {};
for (const c of customers) {
  custIdToUniq[c.customer_id] = c.customer_unique_id;
}

// Status mapping
const statusMap = {
  delivered: "completed",
  shipped: "shipped",
  canceled: "refunded",
  unavailable: "refunded",
  invoiced: "shipped",
  processing: "shipped",
  approved: "shipped",
  created: "shipped",
};

// Channel mapping (use payment_type)
const channelMap = {
  credit_card: "Cartão de Crédito",
  boleto: "Boleto",
  voucher: "Voucher",
  debit_card: "Cartão de Débito",
};

mkdirSync(dataDir, { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  DROP TABLE IF EXISTS order_items;
  DROP TABLE IF EXISTS orders;
  DROP TABLE IF EXISTS products;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS categories;
  DROP TABLE IF EXISTS regions;

  CREATE TABLE regions (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT DEFAULT 'Brazil');
  CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, parent_id INTEGER REFERENCES categories(id));
  CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category_id INTEGER NOT NULL REFERENCES categories(id), sku TEXT UNIQUE NOT NULL, unit_cost REAL NOT NULL, unit_price REAL NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, region_id INTEGER NOT NULL REFERENCES regions(id), segment TEXT DEFAULT 'regular', registered_at TEXT NOT NULL);
  CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), region_id INTEGER NOT NULL REFERENCES regions(id), order_date TEXT NOT NULL, status TEXT DEFAULT 'completed', total_amount REAL NOT NULL, channel TEXT NOT NULL);
  CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL, unit_price REAL NOT NULL, discount REAL DEFAULT 0);

  CREATE INDEX idx_products_category_id ON products(category_id);
  CREATE INDEX idx_users_region_id ON users(region_id);
  CREATE INDEX idx_orders_user_id ON orders(user_id);
  CREATE INDEX idx_orders_region_id ON orders(region_id);
  CREATE INDEX idx_orders_order_date ON orders(order_date);
  CREATE INDEX idx_order_items_order_id ON order_items(order_id);
  CREATE INDEX idx_order_items_product_id ON order_items(product_id);
`);

const insertRegion = db.prepare("INSERT INTO regions (id, name, country) VALUES (?, ?, ?)");
const insertCategory = db.prepare("INSERT INTO categories (id, name, parent_id) VALUES (?, ?, ?)");
const insertProduct = db.prepare("INSERT INTO products (id, name, category_id, sku, unit_cost, unit_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
const insertUser = db.prepare("INSERT INTO users (id, name, email, region_id, segment, registered_at) VALUES (?, ?, ?, ?, ?, ?)");
const insertOrder = db.prepare("INSERT INTO orders (id, user_id, region_id, order_date, status, total_amount, channel) VALUES (?, ?, ?, ?, ?, ?, ?)");
const insertOrderItem = db.prepare("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, discount) VALUES (?, ?, ?, ?, ?, ?)");

const seed = db.transaction(() => {
  // Regions
  regionNames.forEach((name, i) => insertRegion.run(i + 1, name, "Brazil"));

  // Categories
  catList.forEach((name, i) => insertCategory.run(i + 1, name, null));

  // Build category name → id map
  const catIdMap = {};
  catList.forEach((name, i) => catIdMap[name] = i + 1);

  // Products
  for (const p of products) {
    const id = prodIdMap[p.product_id];
    const engCat = catMap[p.product_category_name] || p.product_category_name || "other";
    const catId = catIdMap[engCat];
    const price = parseFloat(p.product_name_lenght) || 0; // placeholder, we'll use actual price from order_items
    const weight = parseFloat(p.product_weight_g) || 500;
    // Estimate unit_cost as ~60% of median price (we'll fix with actual data)
    const unitPrice = Math.max(10, weight * 0.05 + Math.random() * 50);
    const unitCost = unitPrice * 0.55;
    insertProduct.run(id, `${engCat.replace(/_/g, " ")} #${id}`, catId, `SKU-${String(catId).padStart(2, "0")}-${String(id).padStart(5, "0")}`, +unitCost.toFixed(2), +unitPrice.toFixed(2), "2016-01-01");
  }

  // Users (from customer_unique_id)
  for (const uid of custUniqIds) {
    const id = custIdMap[uid];
    const cust = customers.find(c => c.customer_unique_id === uid);
    const state = cust ? cust.customer_state : "SP";
    const regionId = stateToRegion[state] || 1;
    const city = cust ? cust.customer_city : "unknown";
    const segments = ["regular", "regular", "regular", "vip", "new", "enterprise"];
    const segment = segments[id % segments.length];
    insertUser.run(id, `Customer ${id}`, `user${id}@olist.com.br`, regionId, segment, "2016-01-01");
  }

  // Pre-index order_items by order_id
  const itemsByOrder = {};
  for (const item of orderItems) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }

  // Orders
  let oiId = 1;
  for (const o of orders) {
    const id = orderIdMap[o.order_id];
    const cust = custIdToUniq[o.customer_id];
    const userId = custIdMap[cust] || 1;
    const custInfo = custStateMap[o.customer_id];
    const state = custInfo ? custInfo.customer_state : "SP";
    const regionId = stateToRegion[state] || 1;
    const orderDate = o.order_purchase_timestamp ? o.order_purchase_timestamp.split(" ")[0] : "2017-01-01";
    const status = statusMap[o.order_status] || "shipped";
    const totalAmount = paymentMap[o.order_id] || 0;

    // Get payment type for channel
    const pay = firstPayByOrder[o.order_id];
    const channel = channelMap[pay ? pay.payment_type : "credit_card"] || "Cartão de Crédito";

    insertOrder.run(id, userId, regionId, orderDate, status, +totalAmount.toFixed(2), channel);

    // Order items for this order
    const items = itemsByOrder[o.order_id] || [];
    for (const item of items) {
      const prodId = prodIdMap[item.product_id] || 1;
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.order_item_id) || 1;
      insertOrderItem.run(oiId++, id, prodId, qty, +price.toFixed(2), 0);
    }
  }
});

console.log("Seeding database...");
try {
  seed();
  const countRows = (t) => Number(db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c);
  console.log("Done!");
  console.table({
    regions: countRows("regions"),
    categories: countRows("categories"),
    products: countRows("products"),
    users: countRows("users"),
    orders: countRows("orders"),
    order_items: countRows("order_items"),
  });
} finally {
  db.close();
}
