const http = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 18000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'ecommerce.db');

// SQLite
let Database;
try {
  Database = require('better-sqlite3');
} catch {
  try {
    Database = require(path.join(__dirname, 'node_modules', 'better-sqlite3'));
  } catch {
    console.error('better-sqlite3 not found');
    process.exit(1);
  }
}

let db;
function getDb() {
  if (!db) {
    const dbFile = fs.existsSync(DB_PATH) ? DB_PATH : path.join(__dirname, 'data', 'ecommerce.db');
    db = new Database(dbFile, { readonly: true, fileMustExist: true });
  }
  return db;
}

// SQL validation
let Parser;
try {
  Parser = require('node-sql-parser').Parser;
} catch {
  Parser = require(path.join(__dirname, 'node_modules', 'node-sql-parser')).Parser;
}
const parser = new Parser();

function validateSQL(sql) {
  const ast = parser.astify(sql, { database: 'sqlite' });
  const stmts = Array.isArray(ast) ? ast : [ast];
  if (stmts.length !== 1 || stmts[0].type !== 'select') {
    throw new Error('Only SELECT allowed');
  }
  if (!sql.toUpperCase().includes('LIMIT')) {
    return sql.replace(/;?\s*$/, ' LIMIT 500');
  }
  return sql;
}

// AI agent
const BASE_URL = process.env.MIMO_BASE_URL || 'https://token-plan-cn.xiaomimimo.com/v1';
const API_KEY = process.env.MIMO_API_KEY || '';

const SYSTEM_PROMPT = `You are a data analyst agent for a SQLite ecommerce database. Respond with a single valid JSON object only. No markdown.
JSON fields: {"thinking":"reasoning","intent":"what user wants","sql":"single valid SQLite SELECT","chart_config":{"type":"bar|line|pie|area","x_key":"column","y_key":"column","title":"Chinese title"},"explanation":"brief Chinese explanation"}
Rules: Revenue = SUM(oi.quantity*oi.unit_price*(1-oi.discount)). NEVER use orders.total_amount. SELECT only. SQLite syntax.`;

async function callLLM(query) {
  if (!API_KEY) throw new Error('API key not configured');

  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'mimo-v2.5-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) throw new Error(`LLM error: ${resp.status}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch {}
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON');
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') depth--;
    if (depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch {}
    }
  }
  throw new Error('Invalid JSON');
}

// Cached demo results
const CACHE = {
  '各地区月度销售额趋势': { sql: "SELECT r.name AS region, strftime('%Y-%m', o.order_date) AS month, SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) AS revenue FROM orders o JOIN regions r ON o.region_id = r.id JOIN order_items oi ON oi.order_id = o.id GROUP BY r.name, strftime('%Y-%m', o.order_date) ORDER BY r.name, month LIMIT 500", chartConfig: { type: 'line', x_key: 'month', y_key: 'revenue', title: '各地区月度销售额趋势' }, explanation: '各地区每月销售趋势' },
  '哪个品类利润率最高？': { sql: "SELECT c.name AS category, ROUND(AVG((p.unit_price - p.unit_cost) / p.unit_price) * 100, 2) AS margin_pct FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY margin_pct DESC LIMIT 20", chartConfig: { type: 'bar', x_key: 'category', y_key: 'margin_pct', title: '品类利润率对比' }, explanation: '各品类平均利润率' },
  'Top 10 畅销商品': { sql: "SELECT p.name AS product, SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) AS revenue FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.name ORDER BY revenue DESC LIMIT 10", chartConfig: { type: 'bar', x_key: 'product', y_key: 'revenue', title: 'Top 10 畅销商品' }, explanation: '销售额最高的商品' },
  '复购率最高的用户分析': { sql: "SELECT u.name, COUNT(DISTINCT o.id) AS order_count, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)), 2) AS total_spent FROM users u JOIN orders o ON o.user_id = u.id JOIN order_items oi ON oi.order_id = o.id GROUP BY u.name ORDER BY order_count DESC LIMIT 20", chartConfig: { type: 'bar', x_key: 'name', y_key: 'order_count', title: '复购率最高的用户' }, explanation: '购买次数最多的用户' },
};

// Serve static files
const STATIC_DIR = path.join(__dirname, '.next', 'server', 'app');

function serveStatic(req, res) {
  // Try to serve from .next static
  const staticPath = path.join(__dirname, '.next', 'static', req.url.replace('/_next/static/', ''));
  if (fs.existsSync(staticPath)) {
    const ext = path.extname(staticPath);
    const types = { '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    fs.createReadStream(staticPath).pipe(res);
    return true;
  }
  return false;
}

// Server
const server = http.createServer(async (req, res) => {
  const { pathname } = parse(req.url, true);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API: query
  if (pathname === '/api/query' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { sql } = JSON.parse(body);
        const safeSql = validateSQL(sql);
        const rows = getDb().prepare(safeSql).all();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ rows, error: null }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ rows: [], error: e.message }));
      }
    });
    return;
  }

  // API: chat
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      const encoder = new TextEncoder();
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });

      const send = (data) => res.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const { message } = JSON.parse(body);
        const cached = CACHE[message];

        if (cached) {
          send({ type: 'progress', step: 'analyzing', message: '正在分析...' });
          const rows = getDb().prepare(cached.sql).all();
          send({ type: 'result', ...cached, data: rows, _cached: true });
        } else if (API_KEY) {
          send({ type: 'progress', step: 'analyzing', message: 'AI 正在分析...' });
          const text = await callLLM(message);
          send({ type: 'progress', step: 'generating_sql', message: '生成 SQL...' });
          const obj = extractJSON(text);
          const sql = obj.sql;
          send({ type: 'progress', step: 'executing', message: '执行查询...' });

          try {
            const safeSql = validateSQL(sql);
            const rows = getDb().prepare(safeSql).all();
            send({ type: 'result', thinking: obj.thinking || '', intent: obj.intent || '', sql, data: rows, chartConfig: obj.chart_config || { type: 'bar' }, explanation: obj.explanation || '' });
          } catch (sqlErr) {
            // Self-correction
            send({ type: 'progress', step: 'correcting', message: `SQL 报错，自动修正中...` });
            try {
              const fixText = await callLLM(`Previous SQL failed: ${sql}\nError: ${sqlErr.message}\nFix and respond with same JSON format.`);
              const fixObj = extractJSON(fixText);
              const fixedSql = fixObj.sql;
              const safeFixedSql = validateSQL(fixedSql);
              const rows = getDb().prepare(safeFixedSql).all();
              send({ type: 'result', thinking: fixObj.thinking || '', intent: fixObj.intent || '', sql: fixedSql, data: rows, chartConfig: fixObj.chart_config || { type: 'bar' }, explanation: fixObj.explanation || '', corrected: true, correctionNote: `SQL 已自动修正（原始错误: ${sqlErr.message.slice(0, 80)}）` });
            } catch {
              send({ type: 'error', error: `SQL 执行失败: ${sqlErr.message}` });
            }
          }
        } else {
          send({ type: 'error', error: '未配置 API Key，请在设置中配置' });
        }
      } catch (e) {
        send({ type: 'error', error: e.message });
      }
      res.end();
    });
    return;
  }

  // API: schema
  if (pathname === '/api/schema') {
    const schema = { tables: [
      { name: 'regions', columns: [{ name: 'id', type: 'INTEGER' }, { name: 'name', type: 'TEXT' }, { name: 'country', type: 'TEXT' }] },
      { name: 'categories', columns: [{ name: 'id', type: 'INTEGER' }, { name: 'name', type: 'TEXT' }, { name: 'parent_id', type: 'INTEGER' }] },
      { name: 'products', columns: [{ name: 'id', type: 'INTEGER' }, { name: 'name', type: 'TEXT' }, { name: 'category_id', type: 'INTEGER' }, { name: 'sku', type: 'TEXT' }, { name: 'unit_cost', type: 'REAL' }, { name: 'unit_price', type: 'REAL' }] },
      { name: 'users', columns: [{ name: 'id', type: 'INTEGER' }, { name: 'name', type: 'TEXT' }, { name: 'email', type: 'TEXT' }, { name: 'region_id', type: 'INTEGER' }, { name: 'segment', type: 'TEXT' }] },
      { name: 'orders', columns: [{ name: 'id', type: 'INTEGER' }, { name: 'user_id', type: 'INTEGER' }, { name: 'region_id', type: 'INTEGER' }, { name: 'order_date', type: 'TEXT' }, { name: 'status', type: 'TEXT' }, { name: 'total_amount', type: 'REAL' }, { name: 'channel', type: 'TEXT' }] },
      { name: 'order_items', columns: [{ name: 'id', type: 'INTEGER' }, { name: 'order_id', type: 'INTEGER' }, { name: 'product_id', type: 'INTEGER' }, { name: 'quantity', type: 'INTEGER' }, { name: 'unit_price', type: 'REAL' }, { name: 'discount', type: 'REAL' }] },
    ]};
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(schema));
    return;
  }

  // Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', db: fs.existsSync(DB_PATH) }));
    return;
  }

  // Static files
  if (pathname.startsWith('/_next/')) {
    if (serveStatic(req, res)) return;
  }

  // SPA fallback: serve the main HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>QueryForge — AI 数据分析智能体</title>
<link rel="stylesheet" href="/_next/static/css/app.css"/>
<style>
:root{--bg:#fafbfc;--surface:#fff;--surface-hover:#f6f8fa;--border:#e1e4e8;--text:#24292f;--text-secondary:#656d76;--text-muted:#8b949e;--accent:#0969da;--accent-soft:#ddf4ff;--success:#1a7f37;--success-soft:#dafbe1;--warning:#9a6700;--warning-soft:#fff8c5;--error:#cf222e;--error-soft:#ffebe9}
[data-theme="dark"]{--bg:#0d1117;--surface:#161b22;--surface-hover:#1c2128;--border:#30363d;--text:#e6edf3;--text-secondary:#8b949e;--text-muted:#6e7681;--accent:#58a6ff;--accent-soft:#0d2240;--success:#3fb950;--success-soft:#0f2d16;--warning:#d29922;--warning-soft:#2e1e00;--error:#f85149;--error-soft:#3d1214}
*{box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;margin:0}
</style>
</head>
<body>
<div id="__next"><div style="display:flex;align-items:center;justify-content:center;height:100vh;background:var(--bg)"><div style="text-align:center"><div style="width:64px;height:64px;border-radius:16px;background:var(--surface);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px"><span style="font-size:28px;font-weight:bold;color:var(--accent)">Q</span></div><p style="color:var(--text-muted)">加载中...</p></div></div></div>
</body></html>`;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`QueryForge server running on http://localhost:${PORT}`);
});
