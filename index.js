// ============================================================
// AI BOS - Express API Server
// ============================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { masterReply, runModule, MODULES } = require('./ai');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'aibos-dev-secret-change-in-prod';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Helpers ----------
function audit(userId, action, detail, req) {
  try {
    db.prepare('INSERT INTO audit_log (user_id,action,detail,ip) VALUES (?,?,?,?)')
      .run(userId, action, detail || '', (req && req.ip) || '');
  } catch (e) { /* noop */ }
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Role-based access control
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}

const sign = (u) => jwt.sign({ id: u.id, name: u.name, email: u.email, role: u.role, company: u.company }, JWT_SECRET, { expiresIn: '7d' });

// ============================================================
// AUTH
// ============================================================
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, company } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name,email,password,role,company) VALUES (?,?,?,?,?)')
    .run(name, email.toLowerCase(), hash, 'owner', company || '');
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  audit(user.id, 'register', email, req);
  res.json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email=?').get((email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  audit(user.id, 'login', email, req);
  res.json({ token: sign(user), user: publicUser(user), mfa: !!user.mfa_enabled });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, company: u.company, mfa_enabled: !!u.mfa_enabled };
}

// ============================================================
// DASHBOARD OVERVIEW
// ============================================================
app.get('/api/dashboard', auth, (req, res) => {
  const uid = req.user.id;
  const g = (sql, ...p) => db.prepare(sql).get(uid, ...p);
  const pendingPosts = g("SELECT COUNT(*) c FROM posts WHERE user_id=? AND status='pending_approval'").c;
  const pendingMsgs = g("SELECT COUNT(*) c FROM messages WHERE user_id=? AND status='pending_approval'").c;
  const flagged = g('SELECT COUNT(*) c FROM transactions WHERE user_id=? AND flagged=1').c;
  const openTasks = g("SELECT COUNT(*) c FROM tasks WHERE user_id=? AND status!='done'").c;
  const unreadNotifs = g('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read=0').c;
  const csat = g('SELECT ROUND(AVG(rating),1) v FROM feedback WHERE user_id=?').v || 0;

  res.json({
    kpis: [
      { label: 'Monthly Revenue', value: '$84.2k', delta: '+6.4%', up: true },
      { label: 'Active Users', value: '51,340', delta: '+9.0%', up: true },
      { label: 'CSAT Score', value: `${csat}/5`, delta: '+0.2', up: true },
      { label: 'Website Health', value: '82/100', delta: '-3', up: false },
    ],
    counters: { pendingApprovals: pendingPosts + pendingMsgs, flagged, openTasks, unreadNotifs },
    revenueTrend: [62, 65, 63, 70, 74, 78, 81, 84],
    engagementTrend: [40, 52, 48, 60, 66, 72, 70, 78],
    modules: Object.entries(MODULES).map(([k, v]) => ({ key: k, name: v })),
  });
});

// ============================================================
// AI CHAT (Master AI)
// ============================================================
app.post('/api/ai/chat', auth, (req, res) => {
  const uid = req.user.id;
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message is required' });

  db.prepare('INSERT INTO chat_history (user_id,role,content) VALUES (?,?,?)').run(uid, 'user', message);

  const pendingApprovals = db.prepare("SELECT (SELECT COUNT(*) FROM posts WHERE user_id=? AND status='pending_approval')+(SELECT COUNT(*) FROM messages WHERE user_id=? AND status='pending_approval') n").get(uid, uid).n;
  const alerts = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read=0 AND level IN ('alert','warning')").get(uid).c;

  const reply = masterReply(message, { name: req.user.name, pendingApprovals, alerts });
  db.prepare('INSERT INTO chat_history (user_id,role,content) VALUES (?,?,?)').run(uid, 'assistant', reply.text);
  audit(uid, 'ai_chat', message.slice(0, 120), req);
  res.json(reply);
});

app.get('/api/ai/history', auth, (req, res) => {
  const rows = db.prepare('SELECT role,content,created_at FROM chat_history WHERE user_id=? ORDER BY id DESC LIMIT 40').all(req.user.id);
  res.json({ history: rows.reverse() });
});

// Run a specific co-worker module directly
app.post('/api/ai/module/:key', auth, (req, res) => {
  const { key } = req.params;
  if (!MODULES[key]) return res.status(404).json({ error: 'Unknown module' });
  const out = runModule(key, (req.body && req.body.prompt) || '');
  audit(req.user.id, 'module_run', key, req);
  res.json({ module: key, name: MODULES[key], ...out });
});

// ============================================================
// GENERIC CRUD for module resources
// ============================================================
function listFor(table) {
  return (req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE user_id=? ORDER BY id DESC`).all(req.user.id);
    res.json({ items: rows });
  };
}

// ---- Tasks ----
app.get('/api/tasks', auth, listFor('tasks'));
app.post('/api/tasks', auth, (req, res) => {
  const { title, priority, module, due } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title required' });
  const info = db.prepare('INSERT INTO tasks (user_id,title,priority,module,due) VALUES (?,?,?,?,?)')
    .run(req.user.id, title, priority || 'medium', module || '', due || '');
  audit(req.user.id, 'task_create', title, req);
  res.json(db.prepare('SELECT * FROM tasks WHERE id=?').get(info.lastInsertRowid));
});
app.patch('/api/tasks/:id', auth, (req, res) => {
  const { status } = req.body || {};
  db.prepare('UPDATE tasks SET status=? WHERE id=? AND user_id=?').run(status, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/tasks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ---- Posts (content) ----
app.get('/api/posts', auth, listFor('posts'));
app.post('/api/posts', auth, (req, res) => {
  const { platform, content, scheduled_for } = req.body || {};
  if (!platform || !content) return res.status(400).json({ error: 'Platform and content required' });
  const status = scheduled_for ? 'scheduled' : 'pending_approval';
  const info = db.prepare('INSERT INTO posts (user_id,platform,content,status,scheduled_for) VALUES (?,?,?,?,?)')
    .run(req.user.id, platform, content, status, scheduled_for || null);
  audit(req.user.id, 'post_create', platform, req);
  res.json(db.prepare('SELECT * FROM posts WHERE id=?').get(info.lastInsertRowid));
});
// Approval gate — only owner/manager can publish
app.post('/api/posts/:id/approve', auth, requireRole('owner', 'manager'), (req, res) => {
  db.prepare("UPDATE posts SET status='published', engagement=ABS(RANDOM()%2000) WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
  audit(req.user.id, 'post_publish', `post#${req.params.id}`, req);
  res.json({ ok: true, status: 'published' });
});
app.post('/api/posts/:id/reject', auth, (req, res) => {
  db.prepare("UPDATE posts SET status='rejected' WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
  res.json({ ok: true, status: 'rejected' });
});

// ---- Messages (communication) ----
app.get('/api/messages', auth, listFor('messages'));
app.post('/api/messages/:id/send', auth, requireRole('owner', 'manager'), (req, res) => {
  db.prepare("UPDATE messages SET status='sent' WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
  audit(req.user.id, 'message_send', `msg#${req.params.id}`, req);
  res.json({ ok: true, status: 'sent' });
});
app.post('/api/messages', auth, (req, res) => {
  const { channel, customer, subject, body } = req.body || {};
  const info = db.prepare('INSERT INTO messages (user_id,channel,customer,subject,body,status,direction) VALUES (?,?,?,?,?,?,?)')
    .run(req.user.id, channel || 'email', customer || '', subject || '', body || '', 'pending_approval', 'outbound');
  res.json(db.prepare('SELECT * FROM messages WHERE id=?').get(info.lastInsertRowid));
});

// ---- Transactions (escrow) ----
app.get('/api/transactions', auth, listFor('transactions'));
app.post('/api/transactions/:id/action', auth, requireRole('owner'), (req, res) => {
  const { action } = req.body || {}; // hold | release | flag | complete
  const map = { hold: 'held', release: 'released', flag: 'flagged', complete: 'completed' };
  const status = map[action] || 'pending';
  const flagged = action === 'flag' ? 1 : 0;
  db.prepare('UPDATE transactions SET status=?, flagged=? WHERE id=? AND user_id=?')
    .run(status, action === 'release' || action === 'complete' ? 0 : flagged, req.params.id, req.user.id);
  audit(req.user.id, 'txn_' + action, `txn#${req.params.id}`, req);
  res.json({ ok: true, status });
});

// ---- Feedback ----
app.get('/api/feedback', auth, (req, res) => {
  const items = db.prepare('SELECT * FROM feedback WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  const dist = { positive: 0, neutral: 0, negative: 0 };
  items.forEach((f) => { dist[f.sentiment] = (dist[f.sentiment] || 0) + 1; });
  const csat = items.length ? +(items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1) : 0;
  res.json({ items, dist, csat });
});

// ---- Watchlist (market) ----
app.get('/api/watchlist', auth, listFor('watchlist'));
app.post('/api/watchlist', auth, (req, res) => {
  const { symbol, name, alert } = req.body || {};
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });
  const price = +(Math.random() * 500 + 50).toFixed(2);
  const change = +((Math.random() * 6) - 3).toFixed(2);
  const info = db.prepare('INSERT INTO watchlist (user_id,symbol,name,price,change,alert) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, symbol.toUpperCase(), name || symbol.toUpperCase(), price, change, alert || price * 1.1);
  res.json(db.prepare('SELECT * FROM watchlist WHERE id=?').get(info.lastInsertRowid));
});
app.delete('/api/watchlist/:id', auth, (req, res) => {
  db.prepare('DELETE FROM watchlist WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ---- Notifications ----
app.get('/api/notifications', auth, listFor('notifications'));
app.post('/api/notifications/read-all', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
});

// ---- Audit log ----
app.get('/api/audit', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM audit_log WHERE user_id=? ORDER BY id DESC LIMIT 100').all(req.user.id);
  res.json({ items: rows });
});

// ---- Security/settings ----
app.post('/api/security/mfa', auth, (req, res) => {
  const { enabled } = req.body || {};
  db.prepare('UPDATE users SET mfa_enabled=? WHERE id=?').run(enabled ? 1 : 0, req.user.id);
  audit(req.user.id, 'mfa_toggle', String(!!enabled), req);
  res.json({ ok: true, mfa_enabled: !!enabled });
});

// SPA fallback (Express 5 wildcard syntax)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ⚡ AI BOS server running → http://localhost:${PORT}`);
  console.log(`  🔐 Demo login: demo@aibos.app / demo1234\n`);
});
