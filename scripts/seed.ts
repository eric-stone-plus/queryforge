const { fakerZH_CN: faker } = require("@faker-js/faker") as typeof import("@faker-js/faker");
const { mkdirSync } = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");

type SqlValue = string | number | null;

type RunResult = {
  changes: number;
  lastInsertRowid: number | bigint;
};

type Statement = {
  run: (...params: SqlValue[]) => RunResult;
  get: (...params: SqlValue[]) => Record<string, SqlValue> | undefined;
};

type Database = {
  exec: (sql: string) => Database;
  prepare: (sql: string) => Statement;
  transaction: <T extends (...args: never[]) => unknown>(fn: T) => T;
  pragma: (source: string) => unknown;
  close: () => void;
};

type DatabaseConstructor = new (filename: string) => Database;

type Product = {
  id: number;
  name: string;
  categoryId: number;
  unitPrice: number;
};

const Database = require("better-sqlite3") as DatabaseConstructor;

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "ecommerce.db");

const regions = [
  "华东",
  "华南",
  "华北",
  "华中",
  "西南",
  "西北",
  "东北",
  "港澳台",
];

const categories = [
  { name: "手机数码", parentId: null },
  { name: "电脑办公", parentId: null },
  { name: "家用电器", parentId: null },
  { name: "服饰鞋包", parentId: null },
  { name: "美妆个护", parentId: null },
  { name: "食品生鲜", parentId: null },
  { name: "母婴玩具", parentId: null },
  { name: "运动户外", parentId: null },
  { name: "家居家装", parentId: null },
  { name: "图书文具", parentId: null },
  { name: "智能手机", parentId: 1 },
  { name: "影音娱乐", parentId: 1 },
  { name: "笔记本电脑", parentId: 2 },
  { name: "办公耗材", parentId: 2 },
  { name: "厨房电器", parentId: 3 },
  { name: "男装女装", parentId: 4 },
  { name: "护肤彩妆", parentId: 5 },
  { name: "休闲零食", parentId: 6 },
  { name: "儿童用品", parentId: 7 },
  { name: "健身装备", parentId: 8 },
];

const categoryProductWords: Record<number, string[]> = {
  1: ["蓝牙耳机", "移动电源", "智能手表", "手机支架", "快充套装"],
  2: ["无线鼠标", "机械键盘", "显示器", "办公椅", "扩展坞"],
  3: ["空气炸锅", "电饭煲", "扫地机器人", "净水器", "电热水壶"],
  4: ["连帽卫衣", "休闲裤", "双肩包", "运动鞋", "羊毛围巾"],
  5: ["保湿面霜", "洁面乳", "防晒霜", "精华液", "身体乳"],
  6: ["坚果礼盒", "冷萃咖啡", "酸奶", "牛肉干", "水果礼篮"],
  7: ["儿童积木", "婴儿推车", "学习桌", "安全座椅", "绘本套装"],
  8: ["瑜伽垫", "跑步机", "登山包", "运动水壶", "筋膜枪"],
  9: ["床品四件套", "护眼台灯", "收纳柜", "乳胶枕", "香薰机"],
  10: ["中性笔", "笔记本", "文件夹", "阅读灯", "打印纸"],
  11: ["旗舰手机", "折叠屏手机", "拍照手机", "游戏手机", "老人手机"],
  12: ["无线音箱", "投影仪", "降噪耳机", "家庭影院", "麦克风"],
  13: ["轻薄本", "游戏本", "平板电脑", "一体机", "便携显示器"],
  14: ["墨盒", "硒鼓", "标签机", "碎纸机", "扫描仪"],
  15: ["破壁机", "咖啡机", "电烤箱", "洗碗机", "料理锅"],
  16: ["针织开衫", "牛仔裤", "羽绒服", "衬衫", "帆布鞋"],
  17: ["口红", "粉底液", "爽肤水", "面膜", "眉笔"],
  18: ["曲奇饼干", "薯片", "巧克力", "茶饮", "蛋黄酥"],
  19: ["奶瓶套装", "儿童书包", "拼图玩具", "婴儿湿巾", "保温杯"],
  20: ["哑铃", "跳绳", "护膝", "骑行头盔", "速干衣"],
};

const brands = [
  "云启",
  "海棠",
  "星河",
  "青竹",
  "山海",
  "沐光",
  "长风",
  "橙品",
  "京选",
  "南栖",
  "北辰",
  "源木",
  "优禾",
  "晴川",
  "朴物",
];

const channels = ["天猫", "京东", "抖音", "微信小程序", "线下门店", "官网"];
const statuses = ["completed", "completed", "completed", "completed", "shipped", "refunded"];
const segments = ["regular", "regular", "regular", "vip", "new", "enterprise"];

faker.seed(20260704);
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

  CREATE TABLE regions (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT DEFAULT 'China'
  );

  CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    sku TEXT UNIQUE NOT NULL,
    unit_cost REAL NOT NULL,
    unit_price REAL NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    region_id INTEGER NOT NULL REFERENCES regions(id),
    segment TEXT DEFAULT 'regular',
    registered_at TEXT NOT NULL
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    region_id INTEGER NOT NULL REFERENCES regions(id),
    order_date TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    total_amount REAL NOT NULL,
    channel TEXT NOT NULL
  );

  CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    discount REAL DEFAULT 0
  );

  CREATE INDEX idx_products_category_id ON products(category_id);
  CREATE INDEX idx_users_region_id ON users(region_id);
  CREATE INDEX idx_orders_user_id ON orders(user_id);
  CREATE INDEX idx_orders_region_id ON orders(region_id);
  CREATE INDEX idx_orders_order_date ON orders(order_date);
  CREATE INDEX idx_order_items_order_id ON order_items(order_id);
  CREATE INDEX idx_order_items_product_id ON order_items(product_id);
`);

const insertRegion = db.prepare(
  "INSERT INTO regions (id, name, country) VALUES (?, ?, ?)",
);
const insertCategory = db.prepare(
  "INSERT INTO categories (id, name, parent_id) VALUES (?, ?, ?)",
);
const insertProduct = db.prepare(`
  INSERT INTO products (id, name, category_id, sku, unit_cost, unit_price, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertUser = db.prepare(`
  INSERT INTO users (id, name, email, region_id, segment, registered_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const insertOrder = db.prepare(`
  INSERT INTO orders (id, user_id, region_id, order_date, status, total_amount, channel)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertOrderItem = db.prepare(`
  INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, discount)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function money(value: number): number {
  return Number(value.toFixed(2));
}

function randomDateIso(from: Date, to: Date): string {
  return faker.date.between({ from, to }).toISOString();
}

function makeProductName(categoryId: number, index: number): string {
  const brand = faker.helpers.arrayElement(brands);
  const productWord = faker.helpers.arrayElement(categoryProductWords[categoryId]);
  const model = faker.string.alphanumeric({ length: 4, casing: "upper" });
  return `${brand}${productWord} ${model}-${String(index).padStart(3, "0")}`;
}

function uniqueEmail(userId: number, name: string): string {
  const normalizedName = encodeURIComponent(name).replace(/%/g, "").slice(0, 20);
  return `user${String(userId).padStart(4, "0")}.${normalizedName}@example.cn`;
}

const products: Product[] = [];
const userRegions = new Map<number, number>();

const seed = db.transaction(() => {
  regions.forEach((name, index) => {
    insertRegion.run(index + 1, name, "China");
  });

  categories.forEach((category, index) => {
    insertCategory.run(index + 1, category.name, category.parentId);
  });

  for (let id = 1; id <= 500; id += 1) {
    const categoryId = faker.number.int({ min: 1, max: categories.length });
    const unitCost = money(faker.number.float({ min: 8, max: 3200, fractionDigits: 2 }));
    const markup = faker.number.float({ min: 1.18, max: 2.8, fractionDigits: 2 });
    const unitPrice = money(unitCost * markup);
    const createdAt = randomDateIso(new Date("2023-01-01"), new Date("2026-06-30"));

    products.push({
      id,
      name: makeProductName(categoryId, id),
      categoryId,
      unitPrice,
    });

    insertProduct.run(
      id,
      products[products.length - 1].name,
      categoryId,
      `SKU-${String(categoryId).padStart(2, "0")}-${String(id).padStart(5, "0")}`,
      unitCost,
      unitPrice,
      createdAt,
    );
  }

  for (let id = 1; id <= 1000; id += 1) {
    const name = faker.person.fullName();
    const regionId = faker.number.int({ min: 1, max: regions.length });
    const registeredAt = randomDateIso(new Date("2022-01-01"), new Date("2026-06-30"));

    userRegions.set(id, regionId);

    insertUser.run(
      id,
      name,
      uniqueEmail(id, name),
      regionId,
      faker.helpers.arrayElement(segments),
      registeredAt,
    );
  }

  let orderItemId = 1;

  for (let orderId = 1; orderId <= 10000; orderId += 1) {
    const userId = faker.number.int({ min: 1, max: 1000 });
    const regionId = userRegions.get(userId) ?? faker.number.int({ min: 1, max: regions.length });
    const itemCount = ((orderId - 1) % 4) + 1;
    const lineItems: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      discount: number;
      lineTotal: number;
    }> = [];
    const usedProductIds = new Set<number>();

    while (lineItems.length < itemCount) {
      const product = faker.helpers.arrayElement(products);

      if (usedProductIds.has(product.id)) {
        continue;
      }

      usedProductIds.add(product.id);

      const quantity = faker.number.int({ min: 1, max: 5 });
      const discount = faker.helpers.arrayElement([0, 0, 0, 0.05, 0.08, 0.1, 0.15]);
      const unitPrice = money(product.unitPrice * faker.number.float({ min: 0.95, max: 1.05, fractionDigits: 3 }));
      const lineTotal = money(unitPrice * quantity * (1 - discount));

      lineItems.push({
        productId: product.id,
        quantity,
        unitPrice,
        discount,
        lineTotal,
      });
    }

    const totalAmount = money(lineItems.reduce((sum, item) => sum + item.lineTotal, 0));

    insertOrder.run(
      orderId,
      userId,
      regionId,
      randomDateIso(new Date("2024-01-01"), new Date("2026-06-30")),
      faker.helpers.arrayElement(statuses),
      totalAmount,
      faker.helpers.arrayElement(channels),
    );

    for (const item of lineItems) {
      insertOrderItem.run(
        orderItemId,
        orderId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.discount,
      );
      orderItemId += 1;
    }
  }
});

try {
  seed();

  const countRows = (tableName: string): number => {
    const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
    return Number(row?.count ?? 0);
  };

  console.log(`Seeded SQLite database at ${dbPath}`);
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
