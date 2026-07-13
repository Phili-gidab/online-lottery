# HahuPlay — Deployment Guide (hahuplay.com)

The complete manual for deploying changes to the live site. The initial-install
guide (database creation, PHP setup, first upload, installer) lives in
`deploy-package/DEPLOY-HAHUPLAY.md` on the development PC — everything after
that first install is covered here.

---

## 1. How the live server is laid out

One cPanel account serves the whole platform:

```
/home/hahuplng/
├── app/                  Laravel backend — NOT reachable from the internet
│   ├── .env              ← production secrets: DB password, APP_KEY, SMS keys
│   ├── vendor/           PHP dependencies (shipped from the dev PC)
│   ├── app/, routes/,    application code
│   │   config/, ...
│   └── storage/          logs + PRIVATE player receipts
└── public_html/          the web root — everything the internet can see
    ├── index.html, _next/, register/, results/, ...   ← static frontend
    ├── index.php, .htaccess                            ← Laravel entry point
    └── storage/          public uploads (prize photos, ad banners)
```

- Requests for **real files** (the static site, images) are served directly.
- Everything else (`/api/...`, `/admin/...`) falls through to `index.php`,
  which boots Laravel from `../app`.
- `app/.env`, the database, receipts, and uploaded images are **state** —
  deployments must never touch them, and the packages below are built so
  they can't.

## 2. Prerequisites (once)

- cPanel login, and File Manager with **Settings → Show Hidden Files** enabled
  (needed to see `.htaccess` / `.env`).
- On the dev PC: the project at `Desktop\Lottery` with `tools\` (PHP) and
  `frontend\node_modules` installed.

## 3. The standard update procedure

### Step 1 — Build the packages (dev PC)

```powershell
cd Desktop\Lottery
powershell -ExecutionPolicy Bypass -File deploy-hahuplay.ps1
```

What it does, in order:
1. Builds the frontend with production settings (same-origin API,
   `https://hahuplay.com` metadata) — retries automatically if Windows locks
   the build folder.
2. Refreshes the local test copy in `backend-php\public`.
3. Flattens the Next.js prefetch payload files (prevents console 404s on
   static hosts).
4. Swaps in the server variant of `index.php` (which boots from `../app`).
5. Writes two zips to `deploy-package\`:

| Zip | Contents | Never contains |
|---|---|---|
| `update-public_html.zip` (~3 MB) | The built site + Laravel public files | the one-time installer |
| `update-app.zip` (~12–15 MB) | All backend code incl. `vendor/` | `.env`, `storage/`, logs, the SQLite dev database |

Because state is excluded, **extracting these over the live server can only
replace code — never data, secrets, or uploads**. That is the safety model;
don't hand-build zips that break it.

### Step 2 — Decide what to upload

| What changed | Upload |
|---|---|
| Frontend only (design, text, pages, photos in `frontend/public`) | `update-public_html.zip` only |
| Backend only (API, admin panel, models, routes, config) | `update-app.zip` only |
| Both / not sure | Both zips |

### Step 3 — Upload & extract (cPanel)

For `update-app.zip`:
1. File Manager → navigate to **`/home/hahuplng`** (the home folder — *not*
   inside `public_html`).
2. **Upload** → select the zip → wait for 100%.
3. Back in File Manager: right-click the zip → **Extract** → confirm the
   destination is `/home/hahuplng` → Extract. Files merge into `app/`.
4. Delete the zip.

For `update-public_html.zip`: same four steps, but inside **`public_html`**.

### Step 4 — Verify (2 minutes, every time)

1. Hard-refresh the homepage: **Ctrl+Shift+R** (normal refresh may show the
   old cached build).
2. Click through whatever you changed.
3. Quick health sweep:
   - `https://hahuplay.com/` shows the site
   - `https://hahuplay.com/api/lotteries` returns JSON
   - `https://hahuplay.com/admin` loads the login/panel
4. Submit nothing? Fine — but after backend changes, do one real action
   (e.g. a test registration you later reject) before announcing anything
   to players.

### Step 5 — Push to GitHub

```powershell
git add -A
git commit -m "describe the change"
git push
```

GitHub (`Phili-gidab/online-lottery`) is backup and history — the host does
**not** auto-deploy from it. Zips deploy; git remembers. Do both, always,
so they never drift.

## 4. Special cases

### A new database migration
The zip carries the migration *file*, but nothing runs it automatically.
After extracting `update-app.zip`, run the migration:

- **If cPanel has Terminal** (check the Advanced section):
  `cd ~/app && php artisan migrate --force`
- **If not**: ask Claude for a one-time `migrate-hahu.php` (token-protected,
  like the original installer). Upload to `public_html`, visit it once in the
  browser, verify it prints success, **delete it immediately**.

Order matters: extract first, migrate second, verify third.

### Changing `.env` (SMS keys, debug, database)
Never deploy `.env`. Edit it live: File Manager → `app/.env` → right-click →
Edit → Save. Takes effect on the next request. Keep a copy of the DB password
somewhere safe before editing.

### One or two backend files
Skip the zip: upload/overwrite just those files under `~/app/...`. Faster
than 12 MB. (Frontend files can't be cherry-picked — hashed filenames change
every build — always use the public_html zip for frontend changes.)

### Composer dependencies changed (rare)
Covered by the normal routine — `update-app.zip` includes `vendor/`. Just a
slower upload.

### Rollback
The zips are the rollback mechanism: re-extract the previous good pair.
Keep the last known-good pair (rename with a date, e.g.
`update-app-2026-07-13.zip`) before building new ones when deploying
something risky. Because state is never in the zips, rolling code back
cannot lose registrations.

## 5. Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| Site shows old version after deploy | Browser cache → Ctrl+Shift+R; confirm the zip actually extracted (check a changed file's Last Modified) |
| Every page = 500 error | `app/` extraction incomplete or `.env` damaged → re-extract `update-app.zip`; verify `app/.env` still has real DB values |
| Homepage redirects to /admin/login | `public_html/.htaccess` lost its `DirectoryIndex index.html index.php` first lines → re-extract public zip |
| Prize/ad images 404 | Image files must be under `public_html/storage/...`; new uploads go there automatically (config change of 2026-07-13); re-check the file exists in File Manager |
| API returns HTML instead of JSON | Request hit the static 404 → check the exact URL; `/api/...` must not have a trailing-slash typo |
| "Nº xxxxxx is already taken" during tests | Working as designed — that number is held by a pending/active ticket; reject the test ticket to free it |
| Migration error mentioning DB values | `app/.env` DB credentials wrong → fix them, re-run the migration |

## 6. Day-to-day operations (no deployment involved)

Everything content-related is instant at **https://hahuplay.com/admin**:

| Task | Where |
|---|---|
| New campaign / prizes / prices / payment instructions | Lotteries + Draws |
| Approve entries (issues or confirms the ticket number, sends SMS) | Tickets |
| Reject entries (releases a chosen number back to the pool) | Tickets |
| Run a draw — one click, publishes the winner | Draws → Run draw |
| Export all tickets to CSV (NLA records) | Tickets → Export CSV |
| Upload prize photos / ad banners | Draw or Ad form image field |
| Change admin password/email | Avatar (top-right) → Profile |

## 7. Pre-launch / pre-draw checklist

- [ ] Real payment details (CBE / Telebirr) in the campaign's payment instructions
- [ ] Real contact details in the site footer (frontend deploy)
- [ ] SMS live: `app/.env` → `SMS_DRIVER=afromessage`, `SMS_TOKEN`,
      `SMS_IDENTIFIER` (afromessage.com) — until then messages only reach the log
- [ ] Fresh database export before every draw day
      (cPanel → phpMyAdmin → `hahuplng_lottery` → Export)
- [ ] Test registration approved AND rejected once end-to-end
- [ ] NLA licensing status confirmed before public ticket sales
