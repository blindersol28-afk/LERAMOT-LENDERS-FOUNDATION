# Fake SMS Studio — Complete Build Prompt

Use this prompt with any AI coding assistant (Claude, ChatGPT, Cursor, etc.) to recreate the app from scratch.

---

## THE PROMPT

```
Build a full-stack "Fake SMS Studio" web app — a novelty tool that lets a user compose
fake SMS messages and display them in a simulated phone mockup on their own device.
Messages are NEVER actually sent to anyone; they only render locally. This is a harmless
prank/entertainment tool.

═══════════════════════════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════════════════════════

Backend:
  - Node.js (v18+)
  - Express 5 (latest — note: wildcard routes use '*all' not '*')
  - better-sqlite3 (synchronous SQLite, WAL mode)
  - No ORM — raw prepared statements with .run() .get() .all()
  - Port: process.env.PORT || 4000

Frontend:
  - Single HTML file — NO React, NO build step, NO bundler
  - Vanilla JavaScript (ES2020+, async/await)
  - CSS in <style> tag, JS in <script> tag — everything in one file
  - Google Fonts: Sora (headings) + DM Sans (body)
  - Zero external JS libraries — only fetch() for API calls

═══════════════════════════════════════════════════════════════════════════════════
PROJECT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════════

fake-sms-app/
├── server.js              # Express server + SQLite + REST API
├── package.json           # Dependencies: express, better-sqlite3
├── Procfile               # "web: node server.js" (for Railway/Render/Heroku)
├── railway.json           # Railway deploy config (Nixpacks builder)
├── .gitignore             # node_modules/, fake_sms.db, *.db-wal, *.db-shm
└── public/
    ├── index.html          # Complete single-file UI (HTML + CSS + JS)
    ├── manifest.json       # PWA manifest for Android/iOS install
    └── icon.svg            # App icon (dark rounded square with two chat bubbles)

═══════════════════════════════════════════════════════════════════════════════════
DATABASE SCHEMA (SQLite)
═══════════════════════════════════════════════════════════════════════════════════

File: fake_sms.db (auto-created on first run, git-ignored)

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,        -- e.g. "sms_1750000000000_a1b2c3"
  sender      TEXT NOT NULL DEFAULT 'Unknown',  -- contact name or phone number
  body        TEXT NOT NULL,           -- the fake message text
  dir         TEXT NOT NULL DEFAULT 'them',      -- 'me' or 'them'
  folder      TEXT NOT NULL DEFAULT 'Inbox',     -- Inbox|Outbox|Sent|Failed|Draft
  ts          INTEGER NOT NULL,        -- unix timestamp in milliseconds
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

Use WAL journal mode: db.pragma('journal_mode = WAL');

═══════════════════════════════════════════════════════════════════════════════════
REST API ENDPOINTS (all under /api/sms)
═══════════════════════════════════════════════════════════════════════════════════

GET    /api/sms            — List all messages (optional query param ?folder=Inbox)
                             Returns: JSON array sorted by ts ASC
POST   /api/sms            — Create a new message
                             Body: { id?, sender, body, dir, folder, ts }
                             Returns: 201 + the created message object
PUT    /api/sms/:id        — Update an existing message
                             Body: { sender, body, dir, folder, ts }
                             Returns: updated message or 404
DELETE /api/sms/:id        — Delete one message by ID
                             Returns: { success: true } or 404
DELETE /api/sms            — Clear ALL messages (admin wipe)
                             Returns: { success: true, deleted: N }
GET    /api/health         — Health check
                             Returns: { status: 'ok', messages: N }

All endpoints:
  - Use express.json() middleware
  - Validate required fields (body, folder, ts); return 400 if missing
  - Sanitize inputs with String().trim()
  - Wrap DB calls in try/catch → 500 on failure
  - Log errors to console with [METHOD] prefix

Server also:
  - Serves static files from public/ folder
  - Has SPA fallback: app.get('*all', ...) → serves index.html

═══════════════════════════════════════════════════════════════════════════════════
DESIGN SYSTEM — DARK THEME
═══════════════════════════════════════════════════════════════════════════════════

Color palette (use CSS custom properties):
  --bg:         #0e1117     (page background)
  --panel:      #161b22     (composer card)
  --panel2:     #1c2230     (input fields)
  --line:       #2a3140     (borders, dividers)
  --accent:     #4f8cff     (primary blue — buttons, active states, "me" bubbles)
  --ok:         #34c759     (green — "Delivered" status)
  --warn:       #e2b53e     (amber — "Draft" status)
  --danger:     #ff5b5b     (red — "Failed" status, delete buttons)
  --text:       #e8edf4     (primary text)
  --muted:      #8a93a3     (secondary text, labels, timestamps)
  --bub-them:   #2a313d     (received message bubble)
  --bub-me:     #4f8cff     (sent message bubble)

Background: radial-gradient(1200px 600px at 80% -10%, #1a2336 0%, #0e1117 55%)

Typography:
  - Headings: 'Sora', sans-serif — weight 600-700
  - Body/UI: 'DM Sans', sans-serif — weight 400-600
  - Labels: 12px, uppercase, letter-spacing 0.04em, muted color
  - Inputs: 14px, panel2 background, 12px border-radius, 1px border line color,
    accent border on focus

═══════════════════════════════════════════════════════════════════════════════════
PAGE LAYOUT
═══════════════════════════════════════════════════════════════════════════════════

Two-panel side-by-side layout (flexbox, wrap on mobile):

  ┌──────────────────────┐  ┌─────────────────────┐
  │   COMPOSER PANEL     │  │    PHONE MOCKUP      │
  │   (370px wide)       │  │    (340px wide)       │
  │                      │  │    sticky top: 24px   │
  │   - Title + subtitle │  │                       │
  │   - Error banner     │  │  ┌─────────────────┐ │
  │   - Sender input     │  │  │ Status bar      │ │
  │   - Message textarea │  │  │ (live clock)    │ │
  │   - Date + Time row  │  │  │─────────────────│ │
  │   - Direction select │  │  │ "Messages"      │ │
  │   - Folder pills     │  │  │ folder subtitle │ │
  │   - Add/Save button  │  │  │─────────────────│ │
  │   - Cancel Edit btn  │  │  │ 5 folder tabs   │ │
  │   - Stats + Clear    │  │  │ with counts     │ │
  │   - Disclaimer       │  │  │─────────────────│ │
  │                      │  │  │                 │ │
  └──────────────────────┘  │  │  Message bubbles │ │
                            │  │  (scrollable)    │ │
                            │  │                 │ │
                            │  │─────────────────│ │
                            │  │ Fake input bar  │ │
                            │  │ (disabled send) │ │
                            │  └─────────────────┘ │
                            └─────────────────────┘

Responsive: at max-width 780px, stack vertically (composer order:1, phone order:2),
phone becomes max-width:370px and position:static.

═══════════════════════════════════════════════════════════════════════════════════
COMPOSER PANEL — DETAILED SPECS
═══════════════════════════════════════════════════════════════════════════════════

1. HEADER
   - Title: "Fake SMS Studio" (Sora 22px bold)
   - Subtitle: "Compose novelty messages — saved to server, displayed only here."
     (DM Sans 13px, muted color)

2. ERROR BANNER (hidden by default)
   - Red-tinted background (#ff5b5b18), red border (#ff5b5b40)
   - Shows API errors, auto-hides after 5 seconds

3. FORM FIELDS (all full-width):
   a) "Contact name / number" — text input
      Placeholder: "e.g. Mom, or +254 712 345 678"
   b) "Message" — textarea, 3 rows, resizable vertically
      Placeholder: "Type the message text…"
      Below: character count on left ("0 chars"), "Ctrl+Enter to save" hint on right
   c) Date + Time — side by side in a row
      Separate <input type="date"> and <input type="time">
      Default to current date/time on page load
   d) "Direction" — <select> dropdown
      Options: "📨 Received (from them)" value="them"
               "📤 Sent (from me)" value="me"
   e) "Folder" — row of pill buttons (NOT a dropdown)
      5 pills: Inbox, Outbox, Sent, Failed, Draft
      Active pill: accent background, white text
      Inactive: panel2 background, muted text, line border
      Clicking a pill selects it (toggle active class)

4. SAVE BUTTON
   - Full width, accent blue, Sora font, 15px, weight 600
   - Label: "+ Add Message" (create mode) or "✓ Save Changes" (edit mode)
   - While saving: disabled, label "Saving…"
   - Hover: brightness(1.08), active: scale(0.98)

5. CANCEL EDIT BUTTON
   - Ghost style (transparent bg, line border), hidden by default
   - Only shown when editing a message
   - Label: "Cancel Edit"

6. FOOTER
   - Stats row: "N messages stored" on left, "Clear all" button on right
   - Clear all: clicking shows inline confirmation "Sure? [Yes] [No]"
     Yes = deletes all via API, No = reverts to Clear all button
   - Disclaimer text: "⚠️ Entertainment only. Nothing is transmitted as a real SMS.
     No contacts are accessed. Messages are stored in this app's private database.
     Do not use to deceive or misrepresent real people."

═══════════════════════════════════════════════════════════════════════════════════
PHONE MOCKUP — DETAILED SPECS
═══════════════════════════════════════════════════════════════════════════════════

Container: 340px wide, black (#000) background, border-radius 42px, padding 12px,
heavy box-shadow (0 30px 80px rgba(0,0,0,.55)), sticky positioning top:24px.

Screen: background --bg, border-radius 32px, height 680px, flex column, overflow hidden.

1. STATUS BAR
   - Flex row, space-between
   - Left: live clock (updates every 15 seconds via setInterval)
   - Right: "●●  ▮" (signal/battery indicator text)
   - Padding: 14px 24px 6px, 13px, font-weight 600

2. NAV BAR
   - "Messages" centered, Sora font, 17px bold
   - Below: current folder name as subtitle (12px, muted)
   - Bottom border 1px solid --line

3. FOLDER TABS
   - 5 equal-width buttons in a row
   - Each shows: folder name + message count below (if >0)
   - Active tab: accent color text + 2px solid accent bottom border
   - Inactive: muted text, transparent bottom border
   - Clicking a tab switches the message list view

4. MESSAGE LIST (scrollable, hidden scrollbar via ::-webkit-scrollbar width:0)
   - Messages sorted by timestamp ASC (oldest at top, newest at bottom)
   - Empty state: folder emoji icon (36px, 30% opacity) + "No messages in {folder}"
   - Loading state: "Loading…" text centered
   - Auto-scrolls to bottom after render (scrollTop = scrollHeight)

5. MESSAGE BUBBLES
   - Max-width: 78% of list
   - "them" messages: align left, dark gray bubble (#2a313d),
     bottom-left radius 4px (tail effect), sender name label above (11px muted)
   - "me" messages: align right, blue bubble (#4f8cff), white text,
     bottom-right radius 4px (tail effect), NO sender label
   - Bubble padding: 9px 13px, border-radius 18px, font-size 14px, line-height 1.4
   - When editing: bubble gets 2px accent outline, message opacity 0.7

6. META ROW (below each bubble)
   - Timestamp: formatted as "Jun 15, 2:30 PM"
   - Status label (color-coded):
     Sent folder: "· Delivered" (green)
     Outbox folder: "· Sending…" (muted)
     Failed folder: "· Not delivered" (red)
     Draft folder: "· Draft" (amber)
     Inbox folder: no status shown
   - Edit button: ✎ character, accent blue, opacity 0.75
   - Delete button: ✕ character, danger red, opacity 0.75
   - Both buttons increase opacity to 1 on hover

7. FAKE INPUT BAR (bottom of phone)
   - Dark input-shaped div (#1a1f2b), rounded 22px, "iMessage or SMS…" italic text
   - Blue send button (accent, 36px circle, 35% opacity, cursor not-allowed)
   - This is purely decorative — it doesn't do anything

═══════════════════════════════════════════════════════════════════════════════════
FEATURES & BEHAVIOR
═══════════════════════════════════════════════════════════════════════════════════

1. CREATE MESSAGE
   - Fill out form → click "+ Add Message" or press Ctrl+Enter
   - Validates: body must not be empty (shows error if empty)
   - Sender defaults to "Unknown" if left blank
   - After successful create: clears only the message field (keeps sender, date,
     time, direction, folder for quick multi-message creation from same contact)
   - Auto-switches view to the selected folder
   - Auto-scrolls message list to bottom

2. EDIT MESSAGE
   - Click ✎ on any message → form pre-fills with all fields
   - Button changes to "✓ Save Changes", "Cancel Edit" appears
   - Edited message gets accent outline in phone view
   - On mobile: auto-scrolls to top of page to show composer
   - After save: clears form completely, reverts to create mode
   - Cancel: clears form, reverts to create mode

3. DELETE MESSAGE
   - Click ✕ on any message → immediate delete via API
   - If the deleted message was being edited, cancel the edit
   - Optimistic UI: removes from local array immediately

4. CLEAR ALL
   - "Clear all" text button → inline "Sure? [Yes] [No]"
   - Yes → DELETE /api/sms → empties everything
   - No → reverts to the "Clear all" button

5. FOLDER NAVIGATION
   - Composer pills: select which folder to save INTO
   - Phone tabs: select which folder to VIEW
   - After creating/editing: view auto-switches to the compose folder
   - Each tab shows message count badge (only if > 0)

6. LIVE CLOCK
   - Status bar clock shows current time
   - Updates every 15 seconds

7. CHARACTER COUNTER
   - Shows "N chars" below the textarea
   - Updates on every keystroke

8. ERROR HANDLING
   - API failures show red error banner in composer
   - Auto-dismisses after 5 seconds
   - Button shows "Saving…" while request is in flight
   - Button is disabled during save to prevent double-submit

═══════════════════════════════════════════════════════════════════════════════════
JAVASCRIPT ARCHITECTURE (vanilla, no framework)
═══════════════════════════════════════════════════════════════════════════════════

State variables:
  - allMsgs: Msg[]         — all messages from server
  - activeCompose: string  — which folder the composer pill is set to
  - activeView: string     — which folder tab is active on the phone
  - editId: string|null    — ID of message being edited, or null

API layer:
  - api(method, path, body) — generic fetch wrapper, throws on non-OK response
  - loadMsgs() — GET all, update allMsgs, call render()
  - saveMsgApi(payload) — POST or PUT depending on editId
  - deleteMsgApi(id) — DELETE one, remove from local array
  - clearAllApi() — DELETE all

Render functions (called after any state change):
  - renderPills() — toggle .active class on composer pills
  - renderTabs() — toggle .active on phone tabs, update count badges
  - renderMessages() — rebuild message list DOM, wire edit/delete handlers
  - renderFooter() — update total count, rebuild clear-all button
  - render() — calls renderTabs + renderMessages + renderFooter

HTML escaping: create a temporary div, set textContent, read innerHTML.
Never use innerHTML with user content without escaping.

═══════════════════════════════════════════════════════════════════════════════════
PWA SUPPORT
═══════════════════════════════════════════════════════════════════════════════════

manifest.json:
  - name: "Fake SMS Studio", short_name: "SMS Studio"
  - display: standalone, background_color: #0e1117, theme_color: #0e1117
  - orientation: portrait-primary
  - icon: /icon.svg (any size, SVG)

icon.svg:
  - 512x512 viewBox, dark rounded rectangle (#0e1117), inner panel (#161b22),
    two chat bubble shapes (one dark gray left-aligned, one blue right-aligned)

index.html includes:
  - <meta name="theme-color" content="#0e1117">
  - <link rel="manifest" href="/manifest.json">
  - <link rel="icon" href="/icon.svg" type="image/svg+xml">

═══════════════════════════════════════════════════════════════════════════════════
DEPLOYMENT CONFIG
═══════════════════════════════════════════════════════════════════════════════════

railway.json:
  { "build": { "builder": "NIXPACKS" },
    "deploy": { "startCommand": "npm start",
                "restartPolicyType": "ON_FAILURE",
                "restartPolicyMaxRetries": 10 } }

Procfile: web: node server.js

package.json engines: { "node": ">=18" }

Server binds to 0.0.0.0 and reads PORT from environment variable.

═══════════════════════════════════════════════════════════════════════════════════
DISCLAIMER REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════════

Include a visible disclaimer in the composer panel footer stating:
  - Messages are for entertainment only
  - Nothing is transmitted as a real SMS
  - No contacts are accessed
  - Do not use to deceive or misrepresent real people

═══════════════════════════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════════════════════════

Provide the complete source code for all files listed in the project structure.
The app should be runnable with: npm install && npm start → opens at localhost:4000.
No build step required. No environment variables required (PORT is optional).
```

---

## QUICK COPY VERSION (shorter, for chat-based AI)

```
Build "Fake SMS Studio" — a full-stack novelty app for composing fake SMS messages
(nothing is ever actually sent).

Stack: Node.js + Express 5 + better-sqlite3 backend on port 4000. Single-file
vanilla HTML/CSS/JS frontend — no React, no build step.

DB table: messages (id TEXT PK, sender TEXT, body TEXT, dir TEXT 'me'|'them',
folder TEXT 'Inbox'|'Outbox'|'Sent'|'Failed'|'Draft', ts INTEGER ms, created_at).

API: GET/POST/PUT/DELETE on /api/sms, DELETE /api/sms/:id, GET /api/health.

UI: Dark theme (#0e1117 bg). Two panels side-by-side: (1) Composer panel 370px —
sender input, message textarea with char count + Ctrl+Enter, separate date + time
pickers, direction dropdown (received/sent), folder pill buttons, Add/Save button,
Cancel Edit, Clear All with inline confirm, disclaimer. (2) Sticky phone mockup
340px — black bezel border-radius 42px, screen with live clock status bar, "Messages"
nav, 5 folder tabs with counts, scrollable SMS bubble list (blue=me right-aligned,
dark gray=them left-aligned, sender label above "them" bubbles, timestamp + status
label + edit ✎ + delete ✕ per message), fake disabled input bar at bottom.

Features: create/edit/delete messages via API, folder navigation (pills to select
compose target, tabs to switch view), inline edit (✎ pre-fills form), clear-all
with confirmation, auto-scroll, live clock (15s interval), responsive (stacks on
mobile). Fonts: Sora headings + DM Sans body from Google Fonts. PWA manifest +
icon.svg. Railway deploy config. Entertainment disclaimer visible at all times.
```
