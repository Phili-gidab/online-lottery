# HahuPlay — Updating the Live Site (hahuplay.com)

How to deploy changes after the initial launch. The initial-install guide
(database, PHP, first upload, installer) is `deploy-package/DEPLOY-HAHUPLAY.md`
on the development PC — this document covers everything **after** that.

---

## The routine (any change)

**1. Make and test the change locally.**
The local site runs at `http://localhost:8000` (`php artisan serve` in
`backend-php/`, using `tools/php/php.exe`).

**2. Build the update packages — one command from the project folder:**

```powershell
powershell -ExecutionPolicy Bypass -File deploy-hahuplay.ps1
```

This rebuilds the frontend with production settings (same-origin API,
`https://hahuplay.com` metadata) and writes two zips to `deploy-package\`:

| Zip | Upload when | Extract where |
|---|---|---|
| `update-public_html.zip` (~2.6 MB) | Any **frontend** change — design, text, pages, images | Inside `public_html` |
| `update-app.zip` (~15 MB) | Any **backend** change — API, admin panel, models, routes | In the **home** folder (`/home/hahuplng`) |

A frontend-only change needs only the small zip. A backend change usually
needs only `update-app.zip` — upload both when unsure.

**3. Upload & extract in cPanel** (File Manager → Upload → right-click →
Extract → delete the zip). Extraction overwrites code files only.

**4. Hard-refresh the site** (`Ctrl+Shift+R`) and click through what changed.

### Why extracting over the live site is safe

The update zips deliberately **exclude**:
- `.env` (database password, app key stay untouched)
- `storage/` (player receipts, logs)
- the one-time installer

So the worst case of a bad deploy is broken code — never lost data or
secrets. Re-extract a good zip to roll back.

---

## Special cases

### A database migration was added
The zips carry the migration *file* but nothing executes it. Two options:

- **cPanel Terminal** (check the Advanced section): `cd ~/app && php artisan migrate --force`
- **No terminal**: ask Claude for a one-time `migrate-hahu.php` (token-protected,
  like the original installer). Upload it to `public_html`, visit it once,
  **delete it**.

Run the migration **after** extracting `update-app.zip`.

### Only one or two backend files changed
Skip the zips — edit or re-upload just those files under `~/app/...` in
File Manager. Faster than a 15 MB upload.

### Composer dependencies changed (rare)
`update-app.zip` includes `vendor/`, so the normal routine covers it — the
upload is just slower.

---

## Git is not deployment

`git push` keeps GitHub (`Phili-gidab/online-lottery`) as backup and history —
shared hosting does **not** auto-deploy from it. The zips are the deployment;
push to git as well after every change so the two never drift.

`deploy-package/` is gitignored on purpose: the original install zip contains
the production APP_KEY.

---

## Day-to-day operations (no deployment needed)

Everything content-related happens at **https://hahuplay.com/admin** and is
live instantly — no build, no upload:

| Task | Where |
|---|---|
| New campaign / prizes / prices / payment instructions | Lotteries + Draws |
| Approve or reject entries (receipt viewer built in) | Tickets |
| Run a draw (one-click, publishes the winner) | Draws → Run draw |
| Export all tickets to CSV (NLA record-keeping) | Tickets → Export CSV |
| Upload prize photos / ad banners | Draw or Ad form image field |
| Change admin password / email | Avatar (top-right) → Profile |

## Pre-launch / pre-draw checklist

- [ ] Real payment details (CBE / Telebirr) in the lottery's payment instructions
- [ ] Real contact details in the site footer (needs a frontend deploy)
- [ ] SMS live: in `~/app/.env` set `SMS_DRIVER=afromessage`, `SMS_TOKEN=...`,
      `SMS_IDENTIFIER=...` (from afromessage.com) — until then messages only
      go to the log
- [ ] Before every draw day: download a database export
      (cPanel → phpMyAdmin → `hahuplng_lottery` → Export)
- [ ] NLA licensing status confirmed before public ticket sales
