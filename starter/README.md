# Lottery / Raffle Starter — Next.js + Strapi

Simplified single-company lottery platform:

- A **lottery** has up to **5 draws** (1st–5th), each with a prize category (House / Car / Phone / Cash).
- A user's **single entry = one ticket**, eligible across **all** draws of that lottery.
- **No payment gateway.** Users pay manually (bank/Telebirr), then register with name, father's name, phone, payment reference number, and a receipt screenshot.
- The ticket is `pending` until an **admin approves it in the Strapi admin panel** — approval auto-generates an exact-length ticket number (default 6 digits), or the admin types one manually.
- Admins can also register users themselves (entries received via WhatsApp).
- The public site shows the active draws and a **sponsored-ads section** at the bottom.
- "Multi-tenant, managed manually": every campaign is a `Lottery` record with a `company` field — click **Create new entry** to launch the next one.

## Architecture

```
frontend/  Next.js 15 (App Router) + Tailwind — public site + registration form
backend/   Strapi 5 — API, media uploads, and the ENTIRE admin dashboard
```

Strapi's admin panel **is** the admin dashboard: pending-ticket review (with the
receipt screenshot inline), approve/reject, manual WhatsApp registration, new
campaign creation, ad management. No custom admin UI needed.

## 1. Backend setup

```bash
# from the starter/ folder's parent
npx create-strapi-app@latest backend --js --use-npm --skip-cloud
# accept defaults (SQLite) when prompted
```

Then copy this starter's backend sources over the scaffold:

```
copy starter\backend\src\api            →  backend\src\api   (whole folder)
copy starter\backend\src\index.js       →  backend\src\index.js
copy starter\backend\config\plugins.js  →  backend\config\plugins.js
```

`src/index.js` grants the Public-role permissions automatically on boot
(idempotent), so the manual permissions table below is only a reference.
Set `SEED_DEMO=true` in `backend/.env` if you want a demo campaign seeded
on first boot.

Start it and create your admin account:

```bash
cd backend
npm run develop
# → http://localhost:1337/admin
```

### Public role permissions (required)

Settings → Users & Permissions → Roles → **Public** — enable exactly:

| Content type | Permissions |
|---|---|
| Lottery | `find`, `findOne` |
| Draw | `find`, `findOne` |
| Ad | `find`, `findOne` |
| Ticket | `create` **only** |

⚠️ **Never enable `find` on Ticket for the Public role** — tickets hold phone
numbers and receipts. The public site never reads tickets: winner name/number
are copied onto the Draw when it is executed. All PII fields on Ticket are
additionally marked `private`, so they can never leak through relation
populate either.

⚠️ **Never enable the public Media Library (upload) permission.** The receipt
image is attached server-side by the ticket create controller (with a 5 MB
size cap and an image-only allowlist) — the standalone `/api/upload` endpoint
must stay closed.

### Seed your first campaign

1. Content Manager → **Lottery** → Create: title, company, `lotteryStatus = open`,
   `ticketDigits = 6`, ticket price, and put your bank-account details in
   `paymentInstructions` (shown on the registration page).
2. Create **Draws** 1–3 (or up to 5): drawNumber, category, prizeName, image, date.
3. Optionally create **Ads** for the bottom section.

## 2. Frontend setup

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir
```

Copy this starter's frontend sources over the scaffold:

```
copy starter\frontend\app         →  frontend\app          (merge/overwrite)
copy starter\frontend\components  →  frontend\components
copy starter\frontend\lib         →  frontend\lib
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

Run it:

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

## 3. Daily operations (all in the Strapi admin panel)

| Task | How |
|---|---|
| Review a web entry | Content Manager → Ticket → open a `pending` ticket, check the receipt screenshot + reference number |
| Approve | Set `ticketStatus = active` → save. The 6-digit ticket number is **generated automatically** (or type one into `ticketNumber` before saving to assign it manually — length + uniqueness are validated) |
| Reject | Set `ticketStatus = rejected`, note the reason in `notes` |
| WhatsApp registration | Ticket → Create: fill name/phone/reference (upload their screenshot too), `source = admin`. You can save it directly as `active` (number is generated on create) or save as `pending` and flip it later |
| New campaign ("New" button) | Lottery → Create new entry |

## 4. Running a draw

Create an API token: Settings → API Tokens → Create (give it access to
`draw.execute`, or use Full access). Then:

```bash
curl -X POST http://localhost:1337/api/draws/<draw-documentId>/execute ^
  -H "Authorization: Bearer <YOUR_API_TOKEN>"
```

Response: `{ winnerTicketNumber, winnerDisplayName, eligibleTickets }`.

Rules enforced by the endpoint:

- Only `active` tickets of that draw's lottery are eligible.
- A ticket that already won a draw is **excluded from later draws** of the same
  lottery (set `allowMultipleWins = true` on the Lottery to change this).
- Winner selection uses Node's **crypto-secure RNG** (`crypto.randomInt`), not `Math.random()`.
- The winner's ticket number + display name ("Abebe K.") are stamped onto the
  Draw, which the public site displays. A draw can only be executed once.

## 5. Going to production (one VPS)

- Run both apps with **pm2**; put **Nginx** in front
  (`yourdomain.com` → Next.js :3000, `api.yourdomain.com` → Strapi :1337).
- Set real env vars in `backend/.env` (APP_KEYS, JWT secrets — generated by the
  scaffold) and `NEXT_PUBLIC_STRAPI_URL=https://api.yourdomain.com`.
- SQLite is fine at this scale, but **back up nightly**: the SQLite file
  (`backend/.tmp/data.db`) **and** `backend/public/uploads/` (receipt images).
  Switch to MySQL/Postgres later if entries grow large.
- Add Cloudflare (free) in front for SSL/DDoS if desired.

## Data model

```
Lottery (campaign; "company" field = manual multi-tenancy)
 ├─ ticketDigits (e.g. 6), ticketPrice, paymentInstructions, allowMultipleWins
 ├─ Draw ×1–5   drawNumber, category(house|car|phone|cash|other), prizeName,
 │              prizeImage, drawDate, drawStatus(scheduled|drawn),
 │              winnerTicketNumber/winnerDisplayName (denormalized for public display),
 │              winningTicket → Ticket
 └─ Ticket ×N   firstName, fatherName, phone, paymentRef, receiptScreenshot,
                ticketStatus(pending|active|rejected), ticketNumber (globally
                unique, DB constraint), source(web|admin), notes, approvedAt
Ad               image, linkUrl, sponsorName, active, order
```

Ticket numbers are zero-padded (e.g. `004521`) so they are always exactly
`ticketDigits` long, and are **globally unique across all campaigns** (backed
by a database unique constraint, so concurrent approvals can't collide). If
you prefer no leading zeros, change the range in
`backend/src/api/ticket/content-types/ticket/lifecycles.js` from
`randomInt(0, 10**digits)` to `randomInt(10**(digits-1), 10**digits)`.

Note: the schemas use `lotteryStatus` / `drawStatus` / `ticketStatus` (not
`status`) because `status` is a reserved attribute name in Strapi 5.
The frontend ships its own `app/layout.tsx` + `app/globals.css` that force a
light theme — the stock create-next-app dark-mode CSS made the forms
unreadable in OS dark mode, so let the starter files overwrite them.
