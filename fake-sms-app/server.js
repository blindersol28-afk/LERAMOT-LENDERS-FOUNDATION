const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// ── Database ──────────────────────────────────────────────────────────────────

const db = new Database(path.join(__dirname, 'fake_sms.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    sender      TEXT NOT NULL DEFAULT 'Unknown',
    body        TEXT NOT NULL,
    dir         TEXT NOT NULL DEFAULT 'them',
    folder      TEXT NOT NULL DEFAULT 'Inbox',
    ts          INTEGER NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── REST API ──────────────────────────────────────────────────────────────────

// GET /api/sms — list all (optional ?folder=Inbox)
app.get('/api/sms', (req, res) => {
  const { folder } = req.query;
  try {
    const rows = folder
      ? db.prepare('SELECT * FROM messages WHERE folder = ? ORDER BY ts ASC').all(String(folder))
      : db.prepare('SELECT * FROM messages ORDER BY ts ASC').all();
    res.json(rows);
  } catch (err) {
    console.error('[GET] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/sms — create
app.post('/api/sms', (req, res) => {
  const { id, sender, body, dir, folder, ts } = req.body;
  if (!body || !folder || ts === undefined) {
    return res.status(400).json({ error: 'body, folder, and ts are required' });
  }
  const msgId = id || `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safe = {
    sender: String(sender || 'Unknown').trim(),
    body:   String(body).trim(),
    dir:    String(dir || 'them'),
    folder: String(folder),
    ts:     Number(ts),
  };
  try {
    db.prepare('INSERT INTO messages (id, sender, body, dir, folder, ts) VALUES (?, ?, ?, ?, ?, ?)')
      .run(msgId, safe.sender, safe.body, safe.dir, safe.folder, safe.ts);
    res.status(201).json({ id: msgId, ...safe });
  } catch (err) {
    console.error('[POST] Error:', err.message);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// PUT /api/sms/:id — update
app.put('/api/sms/:id', (req, res) => {
  const { id } = req.params;
  const { sender, body, dir, folder, ts } = req.body;
  if (!body || !folder || ts === undefined) {
    return res.status(400).json({ error: 'body, folder, and ts are required' });
  }
  const safe = {
    sender: String(sender || 'Unknown').trim(),
    body:   String(body).trim(),
    dir:    String(dir || 'them'),
    folder: String(folder),
    ts:     Number(ts),
  };
  try {
    const info = db.prepare('UPDATE messages SET sender=?, body=?, dir=?, folder=?, ts=? WHERE id=?')
      .run(safe.sender, safe.body, safe.dir, safe.folder, safe.ts, id);
    if (info.changes === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ id, ...safe });
  } catch (err) {
    console.error('[PUT] Error:', err.message);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// DELETE /api/sms/:id — delete one
app.delete('/api/sms/:id', (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM messages WHERE id=?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE] Error:', err.message);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// DELETE /api/sms — clear all
app.delete('/api/sms', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM messages').run();
    res.json({ success: true, deleted: info.changes });
  } catch (err) {
    console.error('[DELETE ALL] Error:', err.message);
    res.status(500).json({ error: 'Failed to clear messages' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) AS n FROM messages').get();
  res.json({ status: 'ok', messages: count.n });
});

// SPA fallback
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  📱 Fake SMS Studio running at http://localhost:${PORT}\n`);
});
