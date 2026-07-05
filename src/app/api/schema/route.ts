import { NextResponse } from "next/server";

const schema = {
  tables: [
    {
      name: "regions",
      columns: [
        { name: "id", type: "INTEGER" },
        { name: "name", type: "TEXT" },
        { name: "country", type: "TEXT" },
      ],
    },
    {
      name: "categories",
      columns: [
        { name: "id", type: "INTEGER" },
        { name: "name", type: "TEXT" },
        { name: "parent_id", type: "INTEGER" },
      ],
    },
    {
      name: "products",
      columns: [
        { name: "id", type: "INTEGER" },
        { name: "name", type: "TEXT" },
        { name: "category_id", type: "INTEGER" },
        { name: "sku", type: "TEXT" },
        { name: "unit_cost", type: "REAL" },
        { name: "unit_price", type: "REAL" },
        { name: "created_at", type: "TEXT" },
      ],
    },
    {
      name: "users",
      columns: [
        { name: "id", type: "INTEGER" },
        { name: "name", type: "TEXT" },
        { name: "region_id", type: "INTEGER" },
        { name: "segment", type: "TEXT" },
        { name: "registered_at", type: "TEXT" },
      ],
    },
    {
      name: "orders",
      columns: [
        { name: "id", type: "INTEGER" },
        { name: "user_id", type: "INTEGER" },
        { name: "region_id", type: "INTEGER" },
        { name: "order_date", type: "TEXT" },
        { name: "status", type: "TEXT" },
        { name: "total_amount", type: "REAL" },
        { name: "channel", type: "TEXT" },
      ],
    },
    {
      name: "order_items",
      columns: [
        { name: "id", type: "INTEGER" },
        { name: "order_id", type: "INTEGER" },
        { name: "product_id", type: "INTEGER" },
        { name: "quantity", type: "INTEGER" },
        { name: "unit_price", type: "REAL" },
        { name: "discount", type: "REAL" },
      ],
    },
  ],
} as const;

export async function GET() {
  return NextResponse.json(schema);
}
