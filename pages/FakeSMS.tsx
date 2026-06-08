
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

type Folder = 'Inbox' | 'Outbox' | 'Sent' | 'Failed' | 'Draft';
type Dir    = 'them' | 'me';

interface Msg {
  id:     string;
  sender: string;
  body:   string;
  dir:    Dir;
  folder: Folder;
  ts:     number; // unix ms
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FOLDERS: Folder[] = ['Inbox', 'Outbox', 'Sent', 'Failed', 'Draft'];

/** Reference-exact colour tokens */
const C = {
  bg:      '#0e1117',
  panel:   '#161b22',
  panel2:  '#1c2230',
  line:    '#2a3140',
  accent:  '#4f8cff',
  text:    '#e8edf4',
  muted:   '#8a93a3',
  bubThem: '#2a313d',
  bubMe:   '#4f8cff',
  danger:  '#ff5b5b',
  screen:  '#0b0d12',
  ok:      '#34c759',
  warn:    '#e2b53e',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad    = (n: number) => String(n).padStart(2, '0');
const nowDate = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const clockStr = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const fmtTs = (ts: number) =>
  new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const genId = () => `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function statusInfo(folder: Folder): { text: string; color: string } | null {
  switch (folder) {
    case 'Failed': return { text: 'Not delivered', color: C.danger };
    case 'Draft':  return { text: 'Draft',          color: C.warn   };
    case 'Outbox': return { text: 'Sending…',       color: C.muted  };
    case 'Sent':   return { text: 'Delivered',      color: C.ok     };
    default:       return null;
  }
}

// ─── Shared inline-style helpers ──────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', background: C.panel2, border: `1px solid ${C.line}`,
  borderRadius: 12, color: C.text, padding: '11px 13px',
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
};

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, color: C.muted,
  margin: '14px 0 6px', letterSpacing: '.04em', textTransform: 'uppercase',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FakeSMS() {
  const [allMsgs,      setAllMsgs]      = useState<Msg[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState<string | null>(null);
  const [apiError,     setApiError]     = useState('');
  const [activeCompose,setActiveCompose]= useState<Folder>('Inbox');
  const [activeView,   setActiveView]   = useState<Folder>('Inbox');
  const [clock,        setClock]        = useState(clockStr);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compose form
  const [fSender, setFSender] = useState('');
  const [fBody,   setFBody]   = useState('');
  const [fDate,   setFDate]   = useState(nowDate);
  const [fTime,   setFTime]   = useState(nowTime);
  const [fDir,    setFDir]    = useState<Dir>('them');

  const endRef = useRef<HTMLDivElement>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadMsgs = useCallback(async () => {
    try {
      const { data } = await axios.get<Msg[]>('/api/sms');
      setAllMsgs(data);
      setApiError('');
    } catch {
      setApiError('Could not reach server. Messages may not be saved yet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMsgs(); }, [loadMsgs]);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(clockStr()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMsgs, activeView]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const viewMsgs   = [...allMsgs].filter(m => m.folder === activeView).sort((a, b) => a.ts - b.ts);
  const folderCnt  = (f: Folder) => allMsgs.filter(m => m.folder === f).length;

  // ── Actions ─────────────────────────────────────────────────────────────────

  const startEdit = (m: Msg) => {
    const d = new Date(m.ts);
    setFSender(m.sender);
    setFBody(m.body);
    setFDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
    setFTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    setFDir(m.dir);
    setActiveCompose(m.folder);
    setEditId(m.id);
    setApiError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setFSender(''); setFBody('');
    setFDate(nowDate()); setFTime(nowTime());
    setFDir('them'); setEditId(null);
    setApiError('');
  };

  const handleSave = async () => {
    if (!fBody.trim()) { setApiError('Please write a message first.'); return; }
    setSaving(true);
    setApiError('');

    const ts      = new Date(`${fDate}T${fTime || '00:00'}`).getTime() || Date.now();
    const payload = {
      id:     editId ?? genId(),
      sender: fSender.trim() || 'Unknown',
      body:   fBody.trim(),
      dir:    fDir,
      folder: activeCompose,
      ts,
    };

    try {
      if (editId) {
        await axios.put(`/api/sms/${editId}`, payload);
        cancelEdit();
      } else {
        await axios.post('/api/sms', payload);
        setFBody('');           // keep sender/date/dir for quick multi-add
      }
      await loadMsgs();
      setActiveView(activeCompose);
    } catch {
      setApiError('Server error — message not saved. Is the server running?');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await axios.delete(`/api/sms/${id}`);
      setAllMsgs(prev => prev.filter(m => m.id !== id));
      if (editId === id) cancelEdit();
    } catch {
      setApiError('Failed to delete message.');
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAll = async () => {
    try {
      await axios.delete('/api/sms');
      setAllMsgs([]);
      setShowClearConfirm(false);
    } catch {
      setApiError('Failed to clear all messages.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: `radial-gradient(1200px 600px at 80% -10%, #1a2336 0%, ${C.bg} 55%)`,
      color:       C.text,
      minHeight:   '100vh',
      padding:     '32px 16px 64px',
      display:     'flex',
      justifyContent: 'center',
      alignItems:  'flex-start',
      gap:         28,
      flexWrap:    'wrap',
      fontFamily:  "'Inter', 'DM Sans', sans-serif",
    }}>

      {/* ══════════════════════════════════════
          COMPOSER PANEL
      ══════════════════════════════════════ */}
      <div style={{ width: 360, flexShrink: 0, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 20, padding: 24 }}>

        <h1 style={{ fontFamily: "'Outfit', 'Sora', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
          Fake SMS Studio
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>
          Compose novelty messages — saved to server DB, shown only on this screen.
        </p>

        {/* Error banner */}
        {apiError && (
          <div style={{ background: '#ff5b5b18', border: `1px solid ${C.danger}40`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff8a8a', marginBottom: 16, lineHeight: 1.5 }}>
            {apiError}
          </div>
        )}

        {/* Sender */}
        <label style={lbl}>Contact name / number</label>
        <input
          style={inp}
          value={fSender}
          onChange={e => setFSender(e.target.value)}
          placeholder="e.g. Mom, or +254 712 345 678"
        />

        {/* Body */}
        <label style={lbl}>Message</label>
        <textarea
          style={{ ...inp, resize: 'vertical', minHeight: 72 }}
          rows={3}
          value={fBody}
          onChange={e => setFBody(e.target.value)}
          placeholder="Type the message text…"
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave(); }}
        />
        <div style={{ textAlign: 'right', fontSize: 11, color: C.muted, marginTop: 4 }}>{fBody.length} chars · Ctrl+Enter to save</div>

        {/* Date + Time */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Date</label>
            <input style={inp} type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Time</label>
            <input style={inp} type="time" value={fTime} onChange={e => setFTime(e.target.value)} />
          </div>
        </div>

        {/* Direction */}
        <label style={lbl}>Direction</label>
        <select style={{ ...inp, cursor: 'pointer' }} value={fDir} onChange={e => setFDir(e.target.value as Dir)}>
          <option value="them">📨  Received  (from them)</option>
          <option value="me">📤  Sent  (from me)</option>
        </select>

        {/* Folder pills */}
        <label style={lbl}>Folder</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
          {FOLDERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveCompose(f)}
              style={{
                padding: '7px 14px', borderRadius: 999,
                border:  `1px solid ${activeCompose === f ? C.accent : C.line}`,
                background: activeCompose === f ? C.accent : C.panel2,
                color: activeCompose === f ? '#fff' : C.muted,
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Save / Add button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', marginTop: 22, padding: 13, borderRadius: 12,
            border: 'none',
            background: saving ? '#3358a0' : C.accent,
            color: '#fff',
            fontFamily: "'Outfit', 'Sora', sans-serif",
            fontWeight: 600, fontSize: 15,
            cursor: saving ? 'wait' : 'pointer',
            transition: 'background .15s',
          }}
        >
          {saving ? 'Saving…' : editId ? '✓  Save Changes' : '+  Add Message'}
        </button>

        {/* Cancel edit */}
        {editId && (
          <button
            onClick={cancelEdit}
            style={{
              width: '100%', marginTop: 8, padding: '10px', borderRadius: 12,
              border: `1px solid ${C.line}`, background: 'transparent',
              color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel Edit
          </button>
        )}

        {/* Stats row */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          <span style={{ fontSize: 12, color: C.muted }}>
            {loading ? 'Loading…' : `${allMsgs.length} message${allMsgs.length !== 1 ? 's' : ''} stored`}
          </span>
          {allMsgs.length > 0 && !showClearConfirm && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{ fontSize: 11, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: 0.7 }}
            >
              Clear all
            </button>
          )}
          {showClearConfirm && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: C.muted }}>Sure?</span>
              <button onClick={handleClearAll} style={{ fontSize: 11, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Yes</button>
              <button onClick={() => setShowClearConfirm(false)} style={{ fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>No</button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p style={{ marginTop: 12, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          ⚠️ <strong style={{ color: C.muted }}>Entertainment only.</strong> Nothing is transmitted as a real SMS.
          No contacts are accessed. Messages are stored in this app's private SQLite database.
          Do not use to deceive or misrepresent real people.
        </p>
      </div>

      {/* ══════════════════════════════════════
          PHONE MOCKUP
      ══════════════════════════════════════ */}
      <div style={{ width: 340, flexShrink: 0, background: '#000', borderRadius: 42, padding: 12, boxShadow: '0 30px 80px rgba(0,0,0,.6)', position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
        <div style={{ background: C.screen, borderRadius: 32, overflow: 'hidden', height: 680, display: 'flex', flexDirection: 'column' }}>

          {/* ── Status bar ──────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px 6px', fontSize: 13, fontWeight: 600 }}>
            <span>{clock}</span>
            <span style={{ fontSize: 11, letterSpacing: 3 }}>●●  ▮</span>
          </div>

          {/* ── Nav title ───────────────────────── */}
          <div style={{ textAlign: 'center', padding: '6px 16px 12px', borderBottom: `1px solid ${C.line}`, fontFamily: "'Outfit', 'Sora', sans-serif", fontWeight: 600, fontSize: 17 }}>
            Messages
            <div style={{ color: C.muted, fontWeight: 400, fontSize: 12, marginTop: 2 }}>{activeView}</div>
          </div>

          {/* ── Folder tabs ─────────────────────── */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}` }}>
            {FOLDERS.map(f => {
              const cnt    = folderCnt(f);
              const active = activeView === f;
              return (
                <button
                  key={f}
                  onClick={() => setActiveView(f)}
                  style={{
                    flex: 1, textAlign: 'center', padding: '9px 2px',
                    fontSize: 10, lineHeight: 1.3,
                    color: active ? C.accent : C.muted,
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent',
                    background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'color .15s',
                  }}
                >
                  {f}
                  {cnt > 0 && (
                    <span style={{ display: 'block', fontSize: 9, color: active ? C.accent : '#3a4152' }}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Message list ────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loading ? (
              <LoadingDots color={C.muted} />
            ) : viewMsgs.length === 0 ? (
              <EmptyState folder={activeView} color={C.muted} />
            ) : (
              viewMsgs.map(m => {
                const isMe    = m.dir === 'me';
                const st      = statusInfo(m.folder);
                const isEditing = editId === m.id;
                const isDeleting = deleting === m.id;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex', flexDirection: 'column', maxWidth: '78%',
                      alignSelf:  isMe ? 'flex-end' : 'flex-start',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      opacity: isDeleting ? 0.3 : isEditing ? 0.75 : 1,
                      transition: 'opacity .2s',
                    }}
                  >
                    {/* Sender label (only for "them") */}
                    {!isMe && (
                      <div style={{ fontSize: 11, color: C.muted, margin: '8px 4px 3px' }}>
                        {m.sender}
                      </div>
                    )}

                    {/* Bubble */}
                    <div style={{
                      padding: '9px 13px', borderRadius: 18, fontSize: 14, lineHeight: 1.4,
                      wordBreak: 'break-word',
                      background: isMe ? C.bubMe : C.bubThem,
                      color: C.text,
                      borderBottomRightRadius: isMe ? 4 : 18,
                      borderBottomLeftRadius:  isMe ? 18 : 4,
                      outline: isEditing ? `2px solid ${C.accent}` : 'none',
                    }}>
                      {m.body}
                    </div>

                    {/* Meta row: timestamp · status · edit · delete */}
                    <div style={{ fontSize: 10, color: C.muted, margin: '3px 4px 0', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>{fmtTs(m.ts)}</span>
                      {st && <span style={{ color: st.color }}>· {st.text}</span>}
                      <button
                        onClick={() => startEdit(m)}
                        title="Edit"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent, opacity: 0.75, fontSize: 13, padding: 0, fontFamily: 'inherit', lineHeight: 1 }}
                      >✎</button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        title="Delete"
                        disabled={!!deleting}
                        style={{ background: 'none', border: 'none', cursor: deleting ? 'default' : 'pointer', color: C.danger, opacity: deleting === m.id ? 0.3 : 0.75, fontSize: 12, padding: 0, fontFamily: 'inherit', lineHeight: 1 }}
                      >✕</button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {/* ── Fake input bar ──────────────────── */}
          <div style={{ padding: '10px 14px 14px', borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, background: '#1a1f2b', borderRadius: 22, padding: '9px 14px', fontSize: 13, color: C.muted, fontStyle: 'italic', userSelect: 'none' }}>
              iMessage or SMS…
            </div>
            <div style={{ width: 36, height: 36, background: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.35, cursor: 'not-allowed' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingDots({ color }: { color: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%', background: color,
              animation: `sms-bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes sms-bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-6px);opacity:1}}`}</style>
    </div>
  );
}

function EmptyState({ folder, color }: { folder: string; color: string }) {
  const icons: Record<string, string> = {
    Inbox: '📥', Outbox: '📤', Sent: '✉️', Failed: '❌', Draft: '📝',
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <span style={{ fontSize: 36, opacity: 0.25 }}>{icons[folder] ?? '📭'}</span>
      <span style={{ fontSize: 13, color, opacity: 0.6 }}>No messages in {folder}</span>
    </div>
  );
}
