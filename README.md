# EmbroTrack — Project Details

## What it is

EmbroTrack is a Windows desktop application (Electron + React) for managing embroidery job-work records — the kind of ledger a small embroidery unit keeps for tracking work orders (challans) given by clients (parties), the fabric/design type (qualities), payments, and worker wages. It's a single-purpose business tool, not a general SaaS product: built by Meet Savani, licensed MIT, packaged as a Windows installer via `electron-builder`.

The core idea is offline-first record keeping with optional sync to a Google Sheet acting as a lightweight cloud backend, plus a basic multi-user login layer.

## Tech stack

| Layer              | Choice                                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI                 | React 18 + TypeScript, Tailwind CSS                                                                                                                                                                               |
| Build              | Vite                                                                                                                                `                                                                              |
| Desktop shell      | Electron 44, packaged with electron-builder (NSIS installer, Windows x64)                                                                                                                                         |
| Local persistence  | Browser `localStorage`, plus an `electron-store` layer wired into the Electron main process for an `orders` store (IPC handlers exist but aren't obviously wired to the main React data model — see Observations) |
| PDF generation     | jsPDF + jspdf-autotable (challan printing)                                                                                                                                                                        |
| Icons              | lucide-react                                                                                                                                                                                                      |
| Backend/sync       | Google Apps Script web app (`google-apps-script/Code.gs`) reading/writing a Google Sheet, called over HTTP from `src/services/googleSheets.ts`                                                                    |
| Optional cloud dep | `@supabase/supabase-js` is in `package.json` but not obviously used in `src/` — likely a leftover or partially-started integration                                                                                |

## Core data model

Defined in `src/types/index.ts`:

- **EmbroideryRecord** — a job-work entry: challan number, party, quality, design number, quantity, rate, computed amount, credit/debit dates, status (`Pending` / `Partially Settled` / `Settled`), sync status.
- **Party** — the client the work is done for.
- **Quality** — the fabric/design type, with a default rate and unit.
- **Worker** — internal staff.
- **WorkerTransaction** — salary, withdrawal, or credit entries against a worker, used to compute a running balance.
- **AppSettings** — challan numbering (prefix, start number, padding), the Google Apps Script backend URL, and business name/subtitle shown in the UI.
- **BackupData** — full-state export/import shape (records, parties, qualities, workers, transactions, settings).

Every entity carries `createdAt`, `updatedAt`, `syncStatus` (`pending` / `synced` / `error` / `local`), and a soft-delete `deleted` flag — this is a deliberate offline-sync pattern, not accidental complexity.

## Features, by module

**Records** (`src/pages/records/`) — create/edit job-work entries, auto-generated sequential challan numbers (`utils/challanNumber.ts` finds the next unused number per prefix, skipping deleted records), print a challan as PDF (`PrintChallan.tsx` + `pdfService.ts`), view/filter/table with pagination.

**Parties** (`src/pages/parties/`) — client CRUD, a details view that aggregates a party's total quantity, total amount, credit, debit, and running balance (`utils/calculations.ts: calculatePartySummary`), quick-add from within the record form.

**Qualities** (`src/pages/qualities/`) — fabric/design type CRUD with default rate and per-quality quantity totals.

**Workers** (`src/pages/workers/`) — staff CRUD plus a transaction ledger (salary/withdrawal/credit) with a computed balance summary.

**Auth** (`src/context/AuthContext.tsx`, `src/pages/auth/`) — username/password login against the Google Apps Script backend if a script URL is configured; otherwise a purely local fallback. Two roles: `admin` (manages users, sees admin-only tabs) and `user` (day-to-day data entry). There's also a demo-account mode with a hard-coded 3-day expiry window.

**Admin** (`src/pages/admin/`) — add/list users, backed by the same Apps Script endpoint.

**Settings** — challan numbering config, business name, Google Script URL, sync status/trigger, backup export/import.

**Sync** (`src/services/syncService.ts`, `googleSheets.ts`) — last-write-wins merge by comparing `updatedAt` timestamps between local and remote copies of records/parties/qualities; a local sync queue tracks pending create/update/delete operations to push.

## Backend

The "server" is a Google Apps Script (`google-apps-script/Code.gs`) deployed as a web app, reading/writing named sheets (`Records`, `Parties`, `Qualities`, `Workers`, `WorkerTransactions`, `Users`) in a Google Sheet the shop owner controls. This is a deliberate zero-infrastructure-cost choice: no server to host, no database to pay for, and the "database" is a spreadsheet the owner already knows how to read.

## Notable design decisions worth flagging

- **Offline-first with manual sync**, not real-time sync. Data lives in `localStorage` first; syncing to Google Sheets is an explicit action, and conflict resolution is last-write-wins on `updatedAt`. Fine for a single shop with one or two people entering data; would silently lose data under concurrent edits from multiple devices at the same time.
- **Credentials are not handled securely.** `Code.gs` ships with a hard-coded default admin password (`admin123`) in a comment telling the deployer to change it — easy to forget. On the client side, `ManagedUser.password` is typed as a plain string and users are cached to `localStorage` as JSON, meaning any locally-cached user list stores whatever password shape the backend returns. This is acceptable for a single-shop internal tool behind physical access control; it would not hold up if this were ever exposed to the public internet or handled sensitive data.
- **The `@supabase/supabase-js` dependency and the Electron `electron-store` "orders" IPC handlers appear to be unused/orphaned relative to the current React data flow**, which itself reads/writes via `localStorage` and the Google Sheets service, not via IPC. Worth confirming with the author whether these are leftover from an earlier architecture (possibly Supabase or local Electron storage was tried before settling on Google Sheets) or are still needed for a code path I didn't see.
- **README is just a file tree**, not documentation — no setup instructions, no description of what the app does, no screenshots. The actual codebase is also ahead of the tree shown (README omits Workers, Auth, Admin — those were added later without updating the README).

## Suggested next steps if this is meant to be maintained or handed off

1. Rewrite `README.md` with an actual description, setup steps (`npm install`, `npm run electron:dev`, how to deploy the Apps Script backend), and screenshots.
2. Decide whether Supabase/electron-store IPC is dead code and remove it, or document why it's there.
3. Move the demo-password and admin-default-password handling out of source comments and into a `.env`/config step the deploy script enforces.
4. Add a `.gitignore` entry for `embrotrack-data.json` if that file is local business data rather than a fixture — it's currently 60 KB and checked into the repo root, which suggests it might be real production data.
