import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/nexusai.db');

import fs from 'fs';
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    plan TEXT DEFAULT 'free',
    plan_expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    tool_id TEXT,
    used_at TEXT DEFAULT (date('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    amount REAL,
    status TEXT DEFAULT 'pending',
    payment_session_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export function getOrCreateUser(userId) {
  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    db.prepare('INSERT INTO users (id, plan) VALUES (?, ?)').run(userId, 'free');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }
  return user;
}

export function getDailyUsageCount(userId) {
  const row = db
    .prepare(
      `SELECT COUNT(*) as count FROM usage 
       WHERE user_id = ? AND used_at = date('now')`
    )
    .get(userId);
  return row?.count ?? 0;
}

export function recordUsage(userId, toolId) {
  db.prepare('INSERT INTO usage (user_id, tool_id) VALUES (?, ?)').run(userId, toolId);
}

export function setUserPlan(userId, plan, expiresAt = null) {
  db.prepare(
    `UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?`
  ).run(plan, expiresAt, userId);
}

export function createOrder(orderId, userId, planType, amount, sessionId) {
  db.prepare(
    `INSERT INTO orders (order_id, user_id, plan_type, amount, payment_session_id, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`
  ).run(orderId, userId, planType, amount, sessionId);
}

export function getOrder(orderId) {
  return db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
}

export function updateOrderStatus(orderId, status) {
  db.prepare('UPDATE orders SET status = ? WHERE order_id = ?').run(status, orderId);
}

export default db;
