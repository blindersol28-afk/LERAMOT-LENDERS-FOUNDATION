# CLAUDE.md — Leramot Lenders Foundation

## Project Overview

Leramot Lenders Foundation is a full-stack fintech platform for instant M-PESA microloans targeting the Kenyan market. It consists of a React SPA frontend, an Express.js REST API backend, and a SQLite database — all in a single TypeScript monorepo.

**Key user flows:**
1. Applicant fills a multi-step loan application form and pays an insurance fee via M-PESA STK push
2. Admin monitors and manages loans through the Payhero Portal
3. User tracks and repays loans via the Loan Center dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v6 (HashRouter), TypeScript |
| Backend | Express.js 5, TypeScript via `tsx` |
| Database | SQLite — `better-sqlite3` (synchronous API) |
| Build (frontend) | Vite 6 — dev server on port 3000 |
| Build (backend) | esbuild 0.28 — bundles to `dist/server.cjs` |
| Styling | Tailwind CSS (CDN in `index.html`), lucide-react icons, motion animations |
| HTTP client | axios |
| Payments | Payhero API (M-PESA STK push gateway) |

---

## Repository Structure

```
/
├── App.tsx               # React root — HashRouter + all page routes
├── index.tsx             # ReactDOM entry point
├── index.html            # HTML shell (Tailwind CDN, Google Fonts, brand theme)
├── server.ts             # Express server — all 15+ API endpoints (~700 lines)
├── database.ts           # SQLite schema init + db singleton export
├── types.ts              # Shared enums (LoanPurpose, FundingSource) & interfaces
├── vite.config.ts        # Vite config: port 3000, path alias @/*, GEMINI_API_KEY inject
├── tsconfig.json         # TS: ES2022 target, JSX preserve, path alias @/*
├── .env.example          # All required environment variables with descriptions
├── leramot.db            # SQLite database file (do not delete in dev)
├── components/           # Reusable UI components
│   ├── Header.tsx            # Navigation bar + mobile menu
│   ├── Footer.tsx            # Footer navigation
│   ├── Hero.tsx              # Landing hero section
│   ├── LoanCalculator.tsx    # Interactive EMI calculator
│   ├── ProductTabs.tsx       # Loan product comparison tabs
│   └── TestimonialCarousel.tsx
└── pages/                # Route-level page components
    ├── Home.tsx                  # Landing page
    ├── ApplicationFunnel.tsx     # Multi-step loan application (1040 lines) + STK push
    ├── LoanCenter.tsx            # User loan dashboard + repayment (898 lines)
    ├── PayheroPortal.tsx         # Admin payment gateway config panel (649 lines)
    ├── ProductPage.tsx           # Loan product detail pages (personal/business/auto)
    ├── Reviews.tsx               # Customer testimonials page
    └── Resources.tsx             # Educational resources/guides
```

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm

### Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
PAYHERO_API_KEY=          # Payhero API key
PAYHERO_CHANNEL_ID=8786   # Payhero channel ID
PAYHERO_USERNAME=         # Organisation name registered with Payhero
APP_URL=                  # Public URL for M-PESA webhook callbacks
PAYHERO_MODE=test         # 'test' for sandbox, 'live' for production
GEMINI_API_KEY=           # Optional — Google AI features
```

### Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (tsx server.ts) → http://localhost:3000
npm run build        # vite build (frontend) + esbuild (backend) → dist/
npm run start        # Run production build: node dist/server.cjs
npm run lint         # TypeScript type-check without emitting (tsc --noEmit)
npm run preview      # Preview vite production build locally
```

In development, `server.ts` uses Vite middleware to serve the React app at `/` and proxies API routes under `/api/*`.

---

## Database Schema

Managed by `database.ts`, which exports a singleton `db` (better-sqlite3 instance).

```sql
-- Loan applications
CREATE TABLE applications (
  id TEXT PRIMARY KEY,          -- UUID generated server-side
  purpose TEXT,                 -- LoanPurpose enum value
  amount REAL,
  fundingSource TEXT,           -- FundingSource enum value
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  birthday TEXT,
  email TEXT,
  phoneNumber TEXT NOT NULL,    -- Stored as 254XXXXXXXXX
  guarantorNumber TEXT,
  idNumber TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | approved | rejected | disbursed
  autoPay INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- M-PESA payment transactions
CREATE TABLE payments (
  checkoutRequestID TEXT PRIMARY KEY,
  applicationId TEXT,
  amount REAL,
  status TEXT DEFAULT 'pending',   -- pending | completed | failed
  paymentType TEXT DEFAULT 'insurance_fee',
  mpesaReceiptNumber TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicationId) REFERENCES applications(id)
);

-- Runtime key-value config (Payhero credentials stored here at runtime)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Pattern:** Use `db.prepare(sql).run(params)` for writes, `db.prepare(sql).get(params)` / `.all(params)` for reads. Use `db.transaction(() => { ... })()` for multi-statement atomicity.

---

## API Endpoints

All endpoints are defined in `server.ts`. Error responses follow `{ error: "message" }` with standard HTTP status codes.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Server health check |
| POST | `/api/applications` | Submit a loan application |
| POST | `/api/loans/submit` | Dashboard loan submission |
| GET | `/api/loans/search` | Search applications by ID or phone number |
| POST | `/api/loans/update-status` | Update application status |
| POST | `/api/loans/toggle-autopay` | Enable/disable autopay for a loan |
| POST | `/api/loans/repay` | Initiate a repayment M-PESA STK push |
| POST | `/api/payhero/stkpush` | Initiate insurance fee M-PESA STK push |
| POST | `/api/payhero/callback` | Payhero webhook receiver (M-PESA callback) |
| GET | `/api/payhero/status/:checkoutRequestID` | Poll M-PESA payment status |
| POST | `/api/payhero/simulate-callback` | Simulate callback for sandbox testing |
| GET | `/api/payhero/config` | Read saved Payhero credentials from DB |
| POST | `/api/payhero/config` | Save Payhero credentials to DB settings table |
| POST | `/api/payhero/config/clear` | Clear all saved Payhero credentials |
| GET | `/api/payhero/payments` | List historical payment transactions |

---

## Key Conventions

### Naming

- **React component files:** PascalCase — `ApplicationFunnel.tsx`, `LoanCalculator.tsx`
- **Variables and functions:** camelCase — `loanAmount`, `handleSubmit`
- **Constants:** UPPER_SNAKE_CASE — `MIN_LOAN`, `MAX_LOAN`, `MONTHLY_RATE`
- **API routes:** kebab-case — `/api/payhero/stkpush`, `/api/loans/update-status`

### Frontend Patterns

- Functional components only; hooks used: `useState`, `useEffect`, `useNavigate`, `useLocation`
- HashRouter — all client routing uses hash (`/#/apply`, `/#/loan-center`); no server-side routing required
- Local component state only — no Redux, no Context API, no Zustand
- All styling via Tailwind utility classes; no CSS modules or styled-components
- Brand colors: `#006D77` (teal primary) and `#FF8C42` (orange accent)
- Pass data between pages via React Router location state: `navigate('/path', { state: { key: value } })` and receive with `useLocation().state`

### Backend Patterns

- `better-sqlite3` is **synchronous** — never wrap DB calls in `async/await`
- All Payhero API calls wrapped in try-catch; server attempts multiple API auth schemes (username:api_key then channel_id:api_key) and multiple API versions (v1 then v2) for resilience
- Phone numbers must be normalized to `254XXXXXXXXX` format before M-PESA calls; strip leading `0` or `+254`
- Payhero credentials are read from the `settings` DB table first (runtime-configured), falling back to `.env` values
- Sandbox mode is active when `PAYHERO_MODE=test` or when no live credentials are present

### TypeScript

- Path alias `@/*` maps to the repo root — use `import { Foo } from '@/types'` instead of relative paths where practical
- Shared types live in `types.ts` — add new enums/interfaces there, not inline in components
- `vite-env.d.ts` declares `import.meta.env` types for Vite-injected variables

---

## Payhero / M-PESA Integration Notes

`server.ts` contains the full Payhero integration. Key behaviours:

1. **STK Push flow:** Client calls `POST /api/payhero/stkpush` → server calls Payhero API → Payhero initiates STK push on user's phone → user approves → Payhero calls `POST /api/payhero/callback` → server updates `payments` table
2. **Polling:** Client polls `GET /api/payhero/status/:id` every few seconds until payment status is `completed` or `failed`
3. **Credential priority:** Settings DB → `.env` → sandbox fallback
4. **Phone format:** Always `254XXXXXXXXX` (no `+`, no leading `0`)

---

## Testing & Quality

- **No test framework** — Jest, Vitest, and React Testing Library are not configured
- **No CI/CD pipeline** — no `.github/workflows/` or equivalent
- **Type checking:** `npm run lint` (`tsc --noEmit`) is the only automated quality gate — run before committing
- Manual testing: start dev server with `npm run dev` and exercise flows in browser

---

## Git Workflow

- Default development branch: `claude/claude-md-docs-4jioX`
- Commit messages follow conventional format: `feat:`, `fix:`, `chore:`, `refactor:`
- The `leramot.db` and `leramot.db-wal` files should not be committed (SQLite state)
- `dist/` is build output and is git-ignored
