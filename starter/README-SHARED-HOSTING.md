# Deploying on Yegara Shared Hosting (cPanel) — the low-cost stack

This variant runs the entire platform on one shared-hosting plan
(≈ 4,800–6,800 ETB/**year**): **Laravel 12 + Filament 3** replaces Strapi
(admin panel included — with a proper **"Run draw" button**), and the Next.js
frontend is compiled to **static files**. No Node.js needed on the server.

```
backend-php/   Laravel + Filament — API, admin panel, MySQL, receipts
frontend/out/  Static export of the site (npm run build)
```

Feature parity with the Node stack is 1:1: same design, same endpoints, same
security rules (private receipts, forced pending status, unique zero-padded
ticket numbers, atomic single-run draws, single-win exclusion, throttled
public endpoints, check-my-ticket, stats, results).

## One-time local build

```bash
cd frontend
set NEXT_PUBLIC_API_URL=            # empty = same-origin in production
npm run build                       # produces frontend/out/
cd ../backend-php
..\tools\php\php.exe ..\tools\composer.phar install --no-dev --optimize-autoloader
```

## cPanel deployment (one domain, one hosting account)

1. **MySQL**: cPanel → MySQL® Databases → create a database + user, grant all.
2. **Upload code**: zip `backend-php/` (including `vendor/`) and extract it to
   a folder OUTSIDE the web root, e.g. `~/app`. Yegara includes SSH — or use
   cPanel's File Manager.
3. **Point the domain's document root** at `~/app/public`
   (cPanel → Domains → Manage → Document Root). If the host won't change the
   root, instead copy the *contents* of `backend-php/public` into
   `public_html` and edit `index.php`'s two `require` paths to `../app/...`.
4. **Static site**: upload the *contents* of `frontend/out/` into the same
   document root. Laravel's `.htaccess` serves real files first, so the static
   site and `/api`, `/admin` coexist on one domain.
5. **Configure `.env`** (copy `.env.example`):
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://yourdomain.com
   APP_KEY=            ← php artisan key:generate
   DB_CONNECTION=mysql
   DB_DATABASE=... DB_USERNAME=... DB_PASSWORD=...
   SEED_DEMO=false
   ```
6. **Initialize** (via SSH, or cPanel Terminal):
   ```bash
   php artisan key:generate
   php artisan migrate --seed --force     # creates the admin user
   php artisan storage:link               # for prize/ad images
   php artisan config:cache && php artisan route:cache
   ```
   If `storage:link` is blocked, create the symlink in cPanel File Manager or
   ask Yegara support (standard request).
7. **SSL**: enable AutoSSL / Let's Encrypt in cPanel. Done.

Admin panel: `https://yourdomain.com/admin`
(seeded login `admin@example.com` / `Admin12345!` — **change it immediately**
in the panel, and set a real email).

## Daily operations

Everything happens at `/admin`:
- **Tickets** — pending queue (badge shows the count), receipt viewer,
  one-click **Approve** (auto-generates the 6-digit number) / **Reject**;
  "Register entry (WhatsApp)" button for manual registrations.
- **Draws** — **Run draw** button with confirmation; winner published
  instantly. Runs exactly once, crypto-random, excludes previous winners.
- **Lotteries** — "New lottery" for each campaign (`draft` keeps it hidden).
- **Ads** — banner uploads for the sponsored section.

## Requirements & limits of shared hosting

- PHP ≥ 8.2 with `intl`, `pdo_mysql`, `gd`/`fileinfo` (select in cPanel →
  MultiPHP / PHP Selector — Yegara supports this).
- Receipts are stored in `storage/app/receipts` (private — not web-accessible).
- **Backups**: Yegara's JetBackup covers files + DB daily; additionally
  download a DB export before every draw day.
- No queues/websockets — nothing in this build needs them. SMS notifications,
  when added, should be sent synchronously via a local gateway API (AfroMessage
  GeezSMS) right in the Approve action.

## Cost of this stack

| Item | Cost |
|---|---|
| Yegara shared hosting (Managed/Premium, cPanel) | 4,800–6,800 ETB/**year** |
| .com domain | free with the hosting plan |
| SSL, admin panel, database | included |
| **Total** | **≈ 400–570 ETB/month equivalent** |
