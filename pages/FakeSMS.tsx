
import React, { useState, useEffect } from 'react';

type Folder = 'inbox' | 'outbox' | 'sent' | 'failed' | 'draft';

interface FakeMessage {
  id: string;
  folder: Folder;
  sender: string;
  contactName: string;
  avatarColor: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const FOLDERS: { key: Folder; label: string; icon: string }[] = [
  { key: 'inbox',  label: 'Inbox',   icon: '📥' },
  { key: 'outbox', label: 'Outbox',  icon: '📤' },
  { key: 'sent',   label: 'Sent',    icon: '✉️'  },
  { key: 'failed', label: 'Failed',  icon: '❌'  },
  { key: 'draft',  label: 'Draft',   icon: '📝'  },
];

const AVATAR_COLORS = [
  '#006D77', '#FF8C42', '#5C6BC0', '#26A69A', '#AB47BC',
  '#EF5350', '#42A5F5', '#66BB6A', '#FFA726', '#8D6E63',
];

const STORAGE_KEY = 'leramot_fake_sms_v1';

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatListTime = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

const localDTString = (date = new Date()) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
};

const isOutgoing = (f: Folder) => f === 'outbox' || f === 'sent' || f === 'draft';

const bubbleClass = (f: Folder) => {
  switch (f) {
    case 'inbox':  return 'bg-white text-slate-800 rounded-tl-sm shadow-sm';
    case 'outbox': return 'bg-blue-500 text-white rounded-tr-sm shadow-sm';
    case 'sent':   return 'bg-[#006D77] text-white rounded-tr-sm shadow-sm';
    case 'failed': return 'bg-white text-slate-800 border-2 border-red-300 rounded-tl-sm';
    case 'draft':  return 'bg-yellow-50 text-yellow-900 border-2 border-dashed border-yellow-300 rounded-tr-sm';
  }
};

const statusBadge = (f: Folder): { text: string; cls: string } => {
  switch (f) {
    case 'inbox':  return { text: '📥 Received',      cls: 'bg-blue-50 text-blue-700 border border-blue-100' };
    case 'outbox': return { text: '📤 In Outbox',     cls: 'bg-purple-50 text-purple-700 border border-purple-100' };
    case 'sent':   return { text: '✓✓ Delivered',     cls: 'bg-green-50 text-green-700 border border-green-100' };
    case 'failed': return { text: '✗ Failed to send', cls: 'bg-red-50 text-red-700 border border-red-100' };
    case 'draft':  return { text: '📝 Draft',          cls: 'bg-yellow-50 text-yellow-700 border border-yellow-100' };
  }
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

const ComposeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

const FakeSMS: React.FC = () => {
  const [messages, setMessages] = useState<FakeMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [activeFolder, setActiveFolder]   = useState<Folder>('inbox');
  const [selectedMsg,  setSelectedMsg]    = useState<FakeMessage | null>(null);
  const [showCompose,  setShowCompose]    = useState(false);
  const [editTarget,   setEditTarget]     = useState<FakeMessage | null>(null);
  const [dismissed,    setDismissed]      = useState(false);
  // mobile: 'list' shows folder+list; 'detail' shows bubble view
  const [mobileView,   setMobileView]     = useState<'list' | 'detail'>('list');

  // form fields
  const [fSender,   setFSender]   = useState('');
  const [fName,     setFName]     = useState('');
  const [fMsg,      setFMsg]      = useState('');
  const [fFolder,   setFFolder]   = useState<Folder>('inbox');
  const [fDateTime, setFDateTime] = useState('');
  const [fColor,    setFColor]    = useState(AVATAR_COLORS[0]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const folderMessages = [...messages]
    .filter(m => m.folder === activeFolder)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = (f: Folder) => messages.filter(m => m.folder === f && !m.isRead).length;

  const openCompose = (msg?: FakeMessage) => {
    if (msg) {
      setFSender(msg.sender);
      setFName(msg.contactName === msg.sender ? '' : msg.contactName);
      setFMsg(msg.message);
      setFFolder(msg.folder);
      setFDateTime(localDTString(new Date(msg.timestamp)));
      setFColor(msg.avatarColor);
      setEditTarget(msg);
    } else {
      setFSender('');
      setFName('');
      setFMsg('');
      setFFolder(activeFolder);
      setFDateTime(localDTString());
      setFColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setEditTarget(null);
    }
    setShowCompose(true);
  };

  const handleSave = () => {
    if (!fSender.trim() || !fMsg.trim()) return;
    const entry: FakeMessage = {
      id:          editTarget?.id ?? generateId(),
      folder:      fFolder,
      sender:      fSender.trim(),
      contactName: fName.trim() || fSender.trim(),
      avatarColor: fColor,
      message:     fMsg.trim(),
      timestamp:   fDateTime ? new Date(fDateTime).toISOString() : new Date().toISOString(),
      isRead:      false,
    };
    setMessages(prev =>
      editTarget ? prev.map(m => m.id === editTarget.id ? entry : m) : [...prev, entry]
    );
    if (editTarget && selectedMsg?.id === editTarget.id) setSelectedMsg(entry);
    setActiveFolder(fFolder);
    setShowCompose(false);
  };

  const handleDelete = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selectedMsg?.id === id) { setSelectedMsg(null); setMobileView('list'); }
  };

  const selectMsg = (msg: FakeMessage) => {
    setSelectedMsg(msg);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
    setMobileView('detail');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">

      {/* ── Disclaimer Banner ─────────────────────────────────────────────── */}
      {!dismissed && (
        <div className="bg-amber-50 border-b-2 border-amber-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-start gap-3">
            <span className="text-amber-500 text-xl flex-shrink-0 mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Entertainment Only — No Real SMS Is Ever Sent</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                All messages in this simulator are 100% fictional. Nothing is transmitted over the network,
                no real person receives any message, and no contact list or phone is accessed.
                This is a novelty tool for prank &amp; entertainment purposes only.
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-500 hover:text-amber-800 font-bold text-xl leading-none flex-shrink-0 mt-0.5"
              aria-label="Dismiss disclaimer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 font-outfit tracking-tight">SMS Simulator</h1>
            <p className="text-sm text-slate-500 mt-0.5">Compose &amp; preview fake messages — stored only on this device</p>
          </div>
          <button
            onClick={() => openCompose()}
            className="flex items-center gap-2 bg-[#006D77] text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:bg-[#065A63] transition-all hover:scale-105"
          >
            <ComposeIcon />
            Compose
          </button>
        </div>

        {/* ── Three-Column Layout ─────────────────────────────────────────── */}
        <div className="flex gap-3" style={{ height: '620px' }}>

          {/* Column 1 — Folder Sidebar */}
          <div
            className={`w-44 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden
              ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mailboxes</p>
            </div>
            <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto">
              {FOLDERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setActiveFolder(f.key); setSelectedMsg(null); setMobileView('list'); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeFolder === f.key
                      ? 'bg-[#006D77] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{f.icon}</span>
                    <span>{f.label}</span>
                  </span>
                  {unreadCount(f.key) > 0 && (
                    <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${
                      activeFolder === f.key ? 'bg-white text-[#006D77]' : 'bg-[#FF8C42] text-white'
                    }`}>
                      {unreadCount(f.key)}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Column 2 — Message List */}
          <div
            className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col
              ${mobileView === 'detail' && selectedMsg ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <span className="text-lg">{FOLDERS.find(f => f.key === activeFolder)?.icon}</span>
              <span className="font-semibold text-slate-700 text-sm capitalize">{activeFolder}</span>
              <span className="text-[10px] bg-slate-200 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                {folderMessages.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {folderMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 px-6">
                  <span className="text-6xl opacity-40">{FOLDERS.find(f => f.key === activeFolder)?.icon}</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-400">No messages</p>
                    <p className="text-xs text-slate-300 mt-1">Compose a fake message to see it here</p>
                  </div>
                  <button
                    onClick={() => openCompose()}
                    className="text-[#006D77] text-sm font-semibold border-2 border-[#006D77] px-4 py-2 rounded-full hover:bg-[#006D77] hover:text-white transition-all"
                  >
                    + Compose
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {folderMessages.map(msg => (
                    <button
                      key={msg.id}
                      onClick={() => selectMsg(msg)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                        selectedMsg?.id === msg.id ? 'bg-[#006D77]/5 border-l-2 border-[#006D77]' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: msg.avatarColor }}
                      >
                        {getInitials(msg.contactName || msg.sender)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`text-sm truncate ${!msg.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                            {msg.contactName || msg.sender}
                          </span>
                          <span className="text-[11px] text-slate-400 flex-shrink-0">{formatListTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{msg.sender}</p>
                        <p className={`text-sm truncate mt-0.5 ${!msg.isRead ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                          {msg.message}
                        </p>
                      </div>

                      {!msg.isRead && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#006D77] flex-shrink-0 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 3 — Bubble Preview */}
          <div
            className={`w-72 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col
              ${!selectedMsg && mobileView !== 'detail' ? 'hidden md:flex' : 'flex'}`}
          >
            {selectedMsg ? (
              <>
                {/* Chat Top Bar */}
                <div className="px-3 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedMsg(null); setMobileView('list'); }}
                    className="md:hidden p-1 -ml-1 text-[#006D77] hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <BackIcon />
                  </button>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: selectedMsg.avatarColor }}
                  >
                    {getInitials(selectedMsg.contactName || selectedMsg.sender)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{selectedMsg.contactName || selectedMsg.sender}</p>
                    <p className="text-[11px] text-slate-400 truncate">{selectedMsg.sender}</p>
                  </div>
                  <button
                    onClick={() => openCompose(selectedMsg)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                    title="Edit message"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMsg.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete message"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Bubbles Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex flex-col gap-3">
                  <div className={`flex items-end gap-2 ${isOutgoing(selectedMsg.folder) ? 'flex-row-reverse' : ''}`}>
                    {!isOutgoing(selectedMsg.folder) && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: selectedMsg.avatarColor }}
                      >
                        {getInitials(selectedMsg.contactName || selectedMsg.sender)}
                      </div>
                    )}
                    <div className={`max-w-[85%] flex flex-col gap-1 ${isOutgoing(selectedMsg.folder) ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${bubbleClass(selectedMsg.folder)}`}>
                        {selectedMsg.message}
                      </div>
                      <span className="text-[10px] text-slate-400 px-1">
                        {formatFullTime(selectedMsg.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex justify-center mt-1">
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusBadge(selectedMsg.folder).cls}`}>
                      {statusBadge(selectedMsg.folder).text}
                    </span>
                  </div>
                </div>

                {/* Fake Input Bar */}
                <div className="px-3 py-2.5 border-t border-slate-100 bg-white flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-xs text-slate-400 italic select-none">
                    iMessage or SMS…
                  </div>
                  <div className="w-8 h-8 bg-[#006D77] rounded-full flex items-center justify-center text-white opacity-30 cursor-not-allowed">
                    <SendIcon />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">💬</span>
                </div>
                <p className="text-sm font-medium text-slate-400">No message selected</p>
                <p className="text-xs text-slate-300">Click any message to preview it as a chat bubble</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Disclaimer ───────────────────────────────────────────── */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          ⚠️ All messages are simulated and for entertainment only. Nothing is ever transmitted to anyone.
        </p>
      </div>

      {/* ── Compose / Edit Modal ─────────────────────────────────────────── */}
      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {editTarget ? 'Edit Message' : 'New Fake Message'}
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Sender */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number / Sender <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fSender}
                  onChange={e => setFSender(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006D77] transition-colors"
                />
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Contact Name <span className="text-slate-300 font-normal normal-case">(optional — shown as avatar name)</span>
                </label>
                <input
                  type="text"
                  value={fName}
                  onChange={e => setFName(e.target.value)}
                  placeholder="John Kamau"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006D77] transition-colors"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={fMsg}
                  onChange={e => setFMsg(e.target.value)}
                  placeholder="Type the fake message content…"
                  rows={4}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006D77] transition-colors resize-none"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{fMsg.length} chars</p>
              </div>

              {/* Date/Time + Folder (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={fDateTime}
                    onChange={e => setFDateTime(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#006D77] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Save to Folder
                  </label>
                  <select
                    value={fFolder}
                    onChange={e => setFFolder(e.target.value as Folder)}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#006D77] bg-white transition-colors"
                  >
                    {FOLDERS.map(f => (
                      <option key={f.key} value={f.key}>{f.icon} {f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Avatar Color
                </label>
                <div className="flex items-center flex-wrap gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setFColor(c)}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${fColor === c ? 'ring-2 ring-offset-2 ring-slate-700 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                  {/* Live preview avatar */}
                  <div className="ml-3 flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: fColor }}
                    >
                      {getInitials(fName || fSender || '?')}
                    </div>
                    <span className="text-xs text-slate-400">Preview</span>
                  </div>
                </div>
              </div>

              {/* Mini disclaimer */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <span className="text-amber-500 flex-shrink-0">⚠️</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  This message is simulated. It is saved only in your browser's local storage and is never transmitted to anyone.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!fSender.trim() || !fMsg.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#006D77] text-white shadow-sm hover:bg-[#065A63] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editTarget ? 'Save Changes' : 'Create Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FakeSMS;
