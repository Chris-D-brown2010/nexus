// ============================================================
// AI BOS - Database Layer (SQLite via better-sqlite3)
// ============================================================
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// DATA_DIR is configurable so cloud hosts can point it at a persistent disk
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'aibos.db'));
db.pragma('journal_mode = WAL');

// ---------- Schema ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  company TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  module TEXT,
  due TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',  -- draft | pending_approval | scheduled | published | rejected
  scheduled_for TEXT,
  engagement INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  channel TEXT NOT NULL,    -- email | whatsapp | telegram | chat
  customer TEXT,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending_approval', -- pending_approval | sent | draft
  direction TEXT DEFAULT 'outbound',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ref TEXT,
  counterparty TEXT,
  amount REAL,
  currency TEXT DEFAULT 'USD',
  type TEXT,                 -- escrow | payout | invoice | refund
  status TEXT DEFAULT 'pending', -- pending | held | released | flagged | completed
  flagged INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  customer TEXT,
  source TEXT,
  rating INTEGER,
  comment TEXT,
  sentiment TEXT,            -- positive | neutral | negative
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  symbol TEXT,
  name TEXT,
  price REAL,
  change REAL,
  alert REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,        -- user | assistant
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT,
  ip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  module TEXT,
  level TEXT DEFAULT 'info', -- info | warning | success | alert
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// ---------- Seeding ----------
function seed() {
  const count = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (count > 0) return;

  console.log('[db] Seeding demo data...');
  const hash = bcrypt.hashSync('demo1234', 10);
  const info = db.prepare(
    `INSERT INTO users (name,email,password,role,company,mfa_enabled) VALUES (?,?,?,?,?,1)`
  ).run('Alex Morgan', 'demo@aibos.app', hash, 'owner', 'Nova Ventures');
  const uid = info.lastInsertRowid;

  const tasks = [
    ['Approve Q3 marketing campaign creatives', 'todo', 'high', 'Content & Publishing'],
    ['Review flagged escrow transaction #ESC-2291', 'todo', 'high', 'Escrow & Transactions'],
    ['Respond to 3 enterprise leads', 'in_progress', 'high', 'Communication'],
    ['Publish weekly blog article', 'todo', 'medium', 'Content & Publishing'],
    ['Analyze drop in mobile conversion rate', 'in_progress', 'medium', 'Website Management'],
    ['Quarterly investor report draft', 'done', 'medium', 'Business Intelligence'],
    ['Set price alerts for tech watchlist', 'todo', 'low', 'Market & Stock'],
  ];
  const tStmt = db.prepare('INSERT INTO tasks (user_id,title,status,priority,module,due) VALUES (?,?,?,?,?,?)');
  tasks.forEach((t, i) => tStmt.run(uid, ...t, new Date(Date.now() + i * 86400000).toISOString().slice(0, 10)));

  const posts = [
    ['LinkedIn', '🚀 Excited to announce Nova Ventures crossed 50k users this quarter! Huge thanks to our community. #startup #growth', 'pending_approval', 0],
    ['X', 'Building in public update: shipped 14 features in 30 days. The AI BOS roadmap is heating up 🔥', 'scheduled', 0],
    ['Instagram', 'Behind the scenes of our product team 📸 Swipe to see how we ship fast.', 'published', 1840],
    ['Facebook', 'New case study: how Acme increased revenue 32% using our platform. Link in bio.', 'draft', 0],
    ['YouTube', 'Episode 12: The future of AI co-workers in small business operations.', 'published', 9210],
  ];
  const pStmt = db.prepare('INSERT INTO posts (user_id,platform,content,status,engagement,scheduled_for) VALUES (?,?,?,?,?,?)');
  posts.forEach((p) => pStmt.run(uid, p[0], p[1], p[2], p[3], p[2] === 'scheduled' ? new Date(Date.now() + 2 * 86400000).toISOString() : null));

  const msgs = [
    ['email', 'jordan@bigcorp.com', 'Re: Enterprise plan pricing', 'Hi Jordan,\n\nThanks for your interest! Our Enterprise plan starts at $499/mo and includes dedicated support, SSO, and all AI co-worker modules. I\'d love to schedule a 20-min demo this week.\n\nBest,\nAlex', 'pending_approval', 'outbound'],
    ['whatsapp', '+1 555-0142', null, 'Hello! Your order #4471 has shipped and will arrive Thursday. Track it here: nova.app/track', 'pending_approval', 'outbound'],
    ['email', 'support-request', 'Refund question', 'Customer asking about refund policy on annual plan.', 'draft', 'inbound'],
    ['telegram', '@maria_k', null, 'Thanks for reaching out! Yes, the API supports webhooks. Documentation is at docs.nova.app/webhooks 🙌', 'sent', 'outbound'],
  ];
  const mStmt = db.prepare('INSERT INTO messages (user_id,channel,customer,subject,body,status,direction) VALUES (?,?,?,?,?,?,?)');
  msgs.forEach((m) => mStmt.run(uid, ...m));

  const txns = [
    ['ESC-2291', 'TechBuyer LLC', 12500, 'USD', 'escrow', 'flagged', 1],
    ['ESC-2288', 'Global Imports', 4800, 'USD', 'escrow', 'held', 0],
    ['INV-9921', 'Acme Co', 2200, 'USD', 'invoice', 'completed', 0],
    ['PAY-5510', 'Freelancer Pool', 1650, 'USD', 'payout', 'pending', 0],
    ['ESC-2280', 'Bright Media', 7300, 'USD', 'escrow', 'released', 0],
    ['REF-1102', 'J. Smith', 99, 'USD', 'refund', 'completed', 0],
  ];
  const xStmt = db.prepare('INSERT INTO transactions (user_id,ref,counterparty,amount,currency,type,status,flagged) VALUES (?,?,?,?,?,?,?,?)');
  txns.forEach((x) => xStmt.run(uid, ...x));

  const fb = [
    ['Sarah L.', 'Google Reviews', 5, 'Absolutely love the platform. Customer support is incredible!', 'positive'],
    ['Mike T.', 'Trustpilot', 4, 'Great features, though onboarding took a while.', 'positive'],
    ['Anon', 'App Store', 2, 'App crashes on older Android devices. Please fix.', 'negative'],
    ['Priya S.', 'Email Survey', 5, 'The AI insights saved me hours every week.', 'positive'],
    ['David R.', 'Twitter', 3, 'Decent, but pricing is a bit high for small teams.', 'neutral'],
    ['Lina M.', 'Google Reviews', 1, 'Billing issue was not resolved quickly.', 'negative'],
  ];
  const fStmt = db.prepare('INSERT INTO feedback (user_id,customer,source,rating,comment,sentiment) VALUES (?,?,?,?,?,?)');
  fb.forEach((f) => fStmt.run(uid, ...f));

  const wl = [
    ['AAPL', 'Apple Inc.', 213.55, 1.24, 220],
    ['NVDA', 'NVIDIA Corp.', 1192.30, 3.41, 1250],
    ['MSFT', 'Microsoft', 451.20, -0.85, 470],
    ['TSLA', 'Tesla Inc.', 182.40, -2.10, 200],
    ['BTC', 'Bitcoin', 68420.00, 2.75, 75000],
  ];
  const wStmt = db.prepare('INSERT INTO watchlist (user_id,symbol,name,price,change,alert) VALUES (?,?,?,?,?,?)');
  wl.forEach((w) => wStmt.run(uid, ...w));

  const notifs = [
    ['Escrow flagged for review', 'Transaction ESC-2291 ($12,500) shows unusual buyer activity.', 'Escrow & Transactions', 'alert'],
    ['NVDA hit your alert zone', 'NVIDIA is up 3.41% today, approaching your $1,250 target.', 'Market & Stock', 'warning'],
    ['Post pending approval', 'A LinkedIn announcement is ready for your review.', 'Content & Publishing', 'info'],
    ['Conversion rate dropped 8%', 'Mobile checkout conversion fell this week. AI suggests a fix.', 'Website Management', 'warning'],
    ['Weekly report ready', 'Your Business Intelligence executive summary is available.', 'Business Intelligence', 'success'],
  ];
  const nStmt = db.prepare('INSERT INTO notifications (user_id,title,body,module,level) VALUES (?,?,?,?,?)');
  notifs.forEach((n) => nStmt.run(uid, ...n));

  console.log('[db] Seed complete. Login: demo@aibos.app / demo1234');
}

seed();

module.exports = db;
