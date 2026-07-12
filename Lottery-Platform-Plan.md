# Ethiopian Online Lottery Platform — Product & Infrastructure Plan

**Model:** Multi-tenant SaaS · **Channels:** Web app + Telegram bot per client · **Market:** Ethiopia · **Draft for partner discussion — July 10, 2026**

---

## 1. At a glance

| Question | Answer |
|---|---|
| What we're building | **Lottery-as-a-Service:** a multi-tenant platform where clients (lottery operators) run their own branded lottery — web app + Telegram bot — on our software |
| Business model | Subscription (monthly fee) + revenue share or per-ticket fee, billed to clients; player money never touches us |
| Biggest gating item | Each **client** needs their own NLA lottery license; we contract as a technology provider |
| Recommended stack | Laravel + MySQL/PostgreSQL + Redis, one deployment, tenant-scoped from day one |
| Hosting (pay in birr) | **Yegara VPS 80G** — 4,450 ETB/mo (4 vCPU, 8 GB RAM, 80 GB NVMe) |
| Hosting (if we can pay in EUR/USD) | **Hetzner Cloud CX32** — ~€7/mo (~1,200 ETB) for the same specs, roughly ¼ the price |
| Infra running cost | ~5,000–7,500 ETB/month to start (dwarfed by licensing and prize liabilities) |

---

## 2. Legal & regulatory checklist

Lottery is legal for private operators in Ethiopia but tightly regulated. **The SaaS model changes who carries which obligation:** each client operates under their own license; we are the technology provider.

1. **License from the National Lottery Administration (NLA)**, under the Ministry of Finance — required for **each operator (client)**. Requirements reported as of 2025/26:
   - Ethiopian-owned registered company (foreigners may only be technology/service providers — which is exactly the platform's role)
   - Trade license, TIN certificate, proof of office
   - **Bank guarantee ≈ 1,500,000 ETB**
   - **License fee ≈ 500,000 ETB**
   - Process can take several months; get current figures directly from the NLA
2. **Revenue sharing:** licensed operators pay the NLA **15% of ticket revenue** and **15% of prize payouts**. The platform must produce these reports automatically, per tenant.
3. **Winner tax withholding:** income from games of chance is taxed at **15%** (small prizes below a threshold are exempt — Income Tax Proclamation 979/2016). Automatic withholding is built into payouts; thresholds to be confirmed with an accountant.
4. **Data protection:** Ethiopia's Personal Data Protection Proclamation (No. 1321/2024) applies — the platform holds IDs, phone numbers, and financial data for every tenant's players. Consent, breach handling, and retention policies are needed; clarify controller/processor roles in client contracts.
5. **18+ only**, with age verification at KYC.
6. Ask the NLA during the first client's licensing whether **data must be hosted in Ethiopia** — this decides the hosting question in Section 8.
7. **Client contracts:** make each tenant contractually responsible for holding a valid license, funding their prizes, and their players' payouts; the platform never holds player funds.

---

## 3. Channels (per tenant)

Every client gets their own branded instance of each channel:

| Channel | Role |
|---|---|
| **Web app** (responsive, PWA) | Full experience: registration, wallet, play, results, account — on the client's subdomain or custom domain |
| **Telegram bot** | Full play loop in chat: register, deposit, buy, get notified. In Ethiopia a large share of lottery/betting activity happens on Telegram — each client connects **their own bot** |
| **Telegram Mini App** | The client's web app opened inside Telegram via their bot — same codebase, near-zero extra cost |
| **Public Telegram channel** | Client marketing: auto-posted draw results, winner announcements, jackpot updates |
| Later (V2+) | Agent/retailer portal for cash sales, USSD (requires telecom agreement), native mobile apps |

---

## 4. SaaS model: one platform, many lottery operators

We are not building one lottery — we're building the **system that runs lotteries** and selling it to operators. Three layers:

| Layer | Who | What they do / get |
|---|---|---|
| **Platform** (us) | We operate the software | Host, maintain, onboard and bill tenants; never touch player money |
| **Tenants** (clients) | Licensed lottery operators | Their own branded lottery: domain, Telegram bot, games, players, prize payouts |
| **Players** | Each tenant's customers | Play on that tenant's web app/bot; belong to exactly one tenant |

### 4.1 Multi-tenancy architecture
- **One codebase, one deployment, shared database with a `tenant_id` on every row** (Laravel: `stancl/tenancy` or `spatie/laravel-multitenancy`). Simplest to operate on one VPS; scales to dozens of tenants.
- **Tenant resolution by domain:** each client gets `client.ourplatform.com` (wildcard DNS + wildcard SSL); custom domains (`clientlottery.com`) supported via CNAME with automated Let's Encrypt issuance.
- **Every query tenant-scoped** through global scopes, enforced by automated tests — a cross-tenant data leak is the one unforgivable bug in a SaaS.
- Upgrade path: **database-per-tenant** for premium clients who demand hard isolation (same codebase supports both modes).
- **Per-tenant Telegram bot:** the client creates a bot with BotFather and pastes the token; the platform registers one webhook per bot and routes updates to the right tenant.
- **Per-tenant payment credentials:** each client connects their **own** Chapa / SantimPay / ArifPay / Telebirr merchant account. Player deposits settle directly with the client — the platform never holds player funds (keeps us a pure technology provider).
- Per-tenant branding (logo, colors, name, T&C), SMS sender ID and quota, language defaults.
- Everything in the feature list (ledger, draw engine, fraud tools, reports) runs tenant-scoped automatically.

### 4.2 Platform admin console (our side — sits above all tenant admins)
- **Tenant lifecycle:** onboarding wizard (brand → bot token → payment keys → first game), trial period, activate, suspend, offboard with full data export
- **Subscription plans & feature flags** per plan: allowed game types, player caps, SMS quotas, custom domain, Mini App, API access
- **Billing:** monthly fee + revenue share (% of ticket sales) or per-ticket fee; usage metered automatically from the ledger; invoices in birr; overdue → warning → auto-suspend
- Cross-tenant health dashboard: sales, error rates, queue depth, draw schedule per tenant
- Support **impersonation** ("view as tenant admin") — fully audit-logged
- Platform-wide announcements to tenant admins

### 4.3 Consequences for the rest of this plan
- The admin console in Section 5 becomes the **tenant admin console**; the platform console sits above it.
- **Build tenant-aware from day one**, even if we launch with a single anchor tenant (possibly our own lottery operation). Retrofitting `tenant_id` into a live single-tenant money system later is one of the most painful migrations there is.
- Each tenant carries their own lottery license and prize liabilities; this belongs in the client contract.

---

## 5. Feature list (comprehensive — everything below is per tenant)

### 5.1 Accounts & identity
- Registration with **phone number + SMS OTP** (phone-first; email optional)
- Login: phone + password/PIN; OTP fallback; "login with Telegram" on web
- **One account across web and bot** — link Telegram to an existing account via OTP or deep-link code
- Profile: name, language, notification preferences
- **KYC tiers with limits:**
  - Tier 0 (phone verified): small deposits/plays, no withdrawals
  - Tier 1 (ID verified — Fayda national ID, kebele ID, or passport photo upload + admin review): full limits, withdrawals enabled
- Age verification (18+) at KYC; date-of-birth check at registration
- Transaction PIN and/or 2FA required for withdrawals
- Device & session management (view/revoke active sessions)
- **Responsible gaming:** self-set deposit limits, cool-off periods, self-exclusion, visible spend history
- Account closure with data-retention rules

### 5.2 Wallet & payments
- **Double-entry ledger** — every birr movement is an immutable journal entry; balances are derived, never edited directly. This is the audit backbone for the NLA, disputes, reconciliation, and SaaS usage metering
- Single wallet shared across web + bot; separate **cash balance** and **bonus balance** (with wagering rules before bonus converts to cash)
- **Deposits:**
  - Telebirr (direct via Ethio Telecom Fabric gateway, or via aggregator)
  - Chapa / ArifPay / SantimPay aggregator checkout → covers major banks, cards, CBE Birr, M-Pesa
  - **Manual bank transfer with receipt upload + admin approval** (essential fallback — widely used in Ethiopia)
  - All using the **tenant's own merchant credentials** — funds settle directly with the client
- **Withdrawals:** to Telebirr or bank account; minimum/maximum amounts; fee schedule; **admin review queue** with maker-checker approval; automatic 15% prize-tax withholding where applicable
- Idempotent payment-webhook processing (a gateway retry must never double-credit)
- Daily **reconciliation screen**: tenant ledger vs. gateway settlement reports, with mismatch flags
- Full transaction history for users (deposits, plays, wins, withdrawals, bonuses)
- Refund/void flows with audit trail

### 5.3 Games & ticketing
- **Game engine supporting multiple templates:**
  - **Draw lottery** — pick N of M numbers (e.g., 5/35), scheduled draws, prize tiers
  - **Raffle** — fixed pool of numbered tickets, one or more winners drawn from sold tickets
  - **Instant win / scratch** — predetermined prize pool, reveal on purchase
  - Daily / weekly / special-event draws
- Game configurator (tenant admin): ticket price, sales window & cutoff, prize structure (**fixed prizes** or **pari-mutuel** % of pool), max tickets per user, rollover rules
- Ticket purchase: manual number pick, **quick pick** (random), bulk buy, multi-draw subscription ("play my numbers for the next 4 draws")
- Ticket lifecycle: reserved → paid → active → won/lost → claimed/expired (unclaimed-prize policy per license terms)
- Unique ticket serials + QR code; downloadable/printable receipt
- "Check my ticket" by serial or QR scan
- Jackpot rollover and guaranteed-minimum-prize support
- Sold-ticket counter / prize-pool ticker on game pages (drives urgency, and pari-mutuel transparency)

### 5.4 Draw engine & provable fairness
Trust is the product — for players, for clients, and for the regulator.
- **CSPRNG** (cryptographically secure RNG) for all draws — never `rand()`
- **Commit–reveal scheme:** before sales close, publish the SHA-256 hash of a secret server seed; after the draw, publish the seed so anyone can verify the winning numbers were derived from it (seed + closed ticket-set hash → HMAC-based number derivation). A public "verify this draw" page recomputes it in the browser
- Draw workflow with **human approval gate:** sales cutoff → ticket set frozen & hashed → RNG executes → draw officer + second admin approve → results published everywhere simultaneously (web, bot, Telegram channel, SMS to winners)
- Automatic winner computation across all prize tiers; documented tie-handling for raffles
- **Tamper-evident audit log** — hash-chained log of every draw event
- Support for supervised/manual draws (e.g., a livestreamed physical draw for marketing) with dual-control result entry

### 5.5 Telegram bot (one per tenant)
- `/start` with **deep-link payloads** (referral codes, campaign tracking, account-link tokens)
- Registration via Telegram's **share-phone-number** button + OTP
- Browse open games, buy tickets with inline keyboards (quick pick & manual pick)
- Wallet in chat: balance, deposit (aggregator checkout link or Telebirr flow), withdrawal request
- My tickets, results lookup, transaction history
- **Push notifications:** draw reminders, results, personal win alerts ("🎉 You won 500 ETB")
- **Mini App button** that opens the tenant's web app inside Telegram
- Referral link generator with reward tracking
- Amharic/English (auto-detect from Telegram locale, user-switchable)
- FAQ/support commands with handoff to a human support inbox
- Tenant-admin **broadcast tool** with opt-out handling and rate limiting (Telegram allows ~30 msgs/sec per bot — queue broadcasts)
- Auto-posting of results & jackpot milestones to the tenant's public channel

### 5.6 Notifications & messaging
- Channels: SMS (OTP, win alerts), Telegram push, in-app inbox, optional email
- Local SMS gateway (e.g., AfroMessage or GeezSMS) — per-message cost metered against the tenant's quota; Telegram push is free
- Templated messages, multi-language, with a per-user channel-preference matrix
- Event triggers: OTP, deposit confirmed, ticket purchased, draw reminder, results, win, withdrawal status, KYC status, promos (opt-in)

### 5.7 Growth & marketing
- **Referral program:** unique codes/links (web + Telegram deep links), reward on referee's first deposit/play, anti-abuse rules
- Promo codes; first-deposit / first-play bonuses (using the bonus-balance rules in 5.2)
- Loyalty points on spend, redeemable for tickets
- CMS-managed banners, landing pages, winner stories ("social proof" page — with winner consent)
- Campaign scheduler for SMS/Telegram blasts with segmentation (inactive 30 days, big players, etc.)
- UTM/campaign attribution so the client knows which channel sells tickets

### 5.8 Tenant admin console & operations
- **Role-based access control:** owner, finance, draw officer, support, KYC reviewer, auditor (read-only)
- **Maker-checker (two-person) approval** on all sensitive actions: draw execution, withdrawal batches, manual wallet adjustments, game config changes
- Dashboard: sales today/this draw, gross gaming revenue, active users, **outstanding prize liabilities**, deposit/withdrawal volumes
- Game & draw management (create, schedule, pause, void with reason)
- Player management: search, profile, activity, KYC review queue, suspend/ban with reason, notes
- Finance: withdrawal approval queue, manual-deposit receipt review, reconciliation, adjustment journal (dual-control)
- **Fraud tools:** velocity limits, duplicate-account detection (device fingerprint, IP, ID number), watchlists, automatic holds on suspicious wins
- Content management: FAQ, terms & conditions (versioned, with user-acceptance tracking), banners
- Immutable **audit log viewer** (who did what, when, from where) with CSV/Excel export

### 5.9 Compliance & reporting (per tenant)
- **NLA remittance reports:** 15% of ticket revenue + 15% of prizes, per game/per period, exportable
- Winner tax-withholding report (15% on winnings above exemption)
- AML-style monitoring: large-transaction flags, structuring detection, KYC-tier enforcement
- Regulator access: read-only auditor account and/or periodic report exports
- Data-protection compliance: consent records, retention schedule, breach-response runbook
- Unclaimed-prize handling per license terms

### 5.10 Support & content
- Help center / FAQ (web + bot)
- Support inbox: web contact form + Telegram messages land in one queue with player context attached
- Prize-claim dispute flow with status tracking
- Public pages: how it works, past results archive, draw verification, responsible gaming, T&C, privacy policy — Amharic + English

### 5.11 Analytics
- Funnel: visitor → registered → KYC → first deposit → first play → repeat
- Retention cohorts, ARPU, game-level performance (sell-through %, margin)
- Channel split: web vs. bot vs. Mini App
- Draw-night load and conversion reporting

### 5.12 Security & non-functional requirements
- TLS everywhere; HSTS; passwords/PINs hashed with Argon2/bcrypt
- KYC documents encrypted at rest, access-logged
- **Rate limiting + CAPTCHA on OTP endpoints** (SMS-pumping fraud is a real, expensive attack)
- Idempotency keys and DB row-locking on all money operations (no double-spend under concurrent requests)
- **Tenant isolation tests in CI** — automated proof that no query crosses tenants
- Cloudflare in front: DDoS protection, WAF, caching, hides origin IP; wildcard DNS for tenant subdomains
- Daily **off-server encrypted backups**, restorable per tenant (the wallet ledgers are the business; losing them is unrecoverable)
- Monitoring: uptime checks (UptimeRobot), error tracking (Sentry), disk/CPU alerts
- Load target: comfortable when multiple tenants hit draw-night spikes simultaneously; queue-based processing absorbs bursts
- Amharic (Ge'ez script) rendering and lightweight pages for low-bandwidth mobile users
- Staging environment; penetration test before real-money launch

---

## 6. Phased rollout

| Phase | Scope | Cut line |
|---|---|---|
| **MVP (launch)** | **Multi-tenant schema from day one, operated with a single anchor tenant** (manually provisioned — possibly our own lottery operation or a committed first client). One game type (raffle **or** simple draw lottery), phone+OTP accounts, KYC tiers, wallet with **one aggregator** + manual deposit fallback, commit-reveal draw engine with approval gate, per-tenant Telegram bot, tenant admin console with RBAC + maker-checker, NLA & tax reports, referral codes, Amharic+English | Everything needed to run one honest, auditable lottery end-to-end on tenant-scoped foundations |
| **V1.5** | **Platform console: tenant onboarding wizard, subscription plans, billing & usage metering, feature flags.** Second game type (instant win), Telebirr direct integration, Mini App polish, loyalty points, campaign broadcasts, richer analytics | Sell to the second, third, fourth client without engineering work per client |
| **V2** | Custom-domain automation, database-per-tenant premium isolation, agent/retailer portal, USSD, native apps, live-draw streaming, advanced fraud scoring, public API for tenants | Scale & differentiation |

---

## 7. Recommended architecture & stack

**One backend, one database, one ledger — tenant-scoped everywhere.** Web, bot, and Mini App are three doors into the same system; tenants are rows, not deployments.

```
         Cloudflare (free) — DDoS/WAF/CDN/SSL, wildcard *.ourplatform.com
                                   │
                            Nginx on the VPS
                                   │
                Tenancy resolver (domain / bot token → tenant context)
                                   │
              ┌────────────────────┼────────────────────┐
        Tenant web apps        REST/API for         Telegram webhooks
        (PWA + Mini App,       web & Mini App       (one per tenant bot)
         white-labeled)
              └────────────────────┼────────────────────┘
                 Application (Laravel + stancl/tenancy)
                     ┌─────────┼──────────┬──────────────┐
                  MySQL/     Redis      Queue workers   Scheduler (cron)
                  Postgres  (cache,     (payments, SMS,  (draw cutoffs,
                  (tenant-   sessions,   broadcasts,      draw execution,
                   scoped    locks)      notifications)   billing metering,
                   ledger)                                reconciliation)
```

**Recommended:** Laravel 12 + MySQL or PostgreSQL + Redis
- **`stancl/tenancy`** (tenancyforlaravel.com) for multi-tenancy — supports shared-DB now, DB-per-tenant later, and per-tenant domains
- Filament for both consoles: platform admin and tenant admin (RBAC, tables, approvals — very fast to build)
- Laravel Horizon for queues; scheduler for draw automation and billing metering
- Telegram bots via webhook in the same app (Nutgram or Telegraph package), one webhook route per tenant bot
- Frontend: Livewire or Inertia+Vue with per-tenant theming; the same responsive app registers as each tenant's Telegram Mini App
- Why: largest hire-able developer pool in Ethiopia, batteries included, one deployable unit on one VPS

**Solid alternative:** Node.js — NestJS + grammY + Prisma + PostgreSQL, Next.js frontend. Choose this only if the developers we already have are stronger in TypeScript.

---

## 8. Hosting: Yegara vs. the alternatives

### The constraint that decides everything: how we pay
International providers require a Visa/Mastercard that works online in EUR/USD. From Ethiopia that means a **multi-currency prepaid card** (e.g., Dashen Mastercard, and similar from CBE/Zemen — loaded at forex bureaus, NBE rules apply). If we can get and reliably reload one, international hosting is far cheaper. If not, we pay in birr locally.

### The candidates (like-for-like ≈ 4 vCPU / 8 GB RAM)

| Provider | Plan | Specs | Price/mo | Pay in | Notes |
|---|---|---|---|---|---|
| **Yegara** (ET) | VPS 80G | 4 vCPU, 8 GB, 80 GB NVMe, 20 TB | **4,450 ETB** | Birr (banks, mobile) | Unmanaged; local support; best local value |
| Yegara (ET) | VPS 40G | 2 vCPU, 4 GB, 40 GB NVMe, 20 TB | 2,950 ETB | Birr | Viable MVP start / staging box |
| **Zergaw** (ET) | CS04008 | 4 vCPU, 8 GB, 80 GB | 10,458 ETB | Birr | In-country DC, weekly backups — but **2 Mbps uplink** standard, a serious bottleneck on draw nights |
| Ethio Telecom Telecloud (ET) | quote-based | varies | varies | Birr | In-country, enterprise-oriented; worth a quote if NLA requires local hosting |
| WebSprix (ET) | varies | varies | varies | Birr | ISP with cloud/VPS offering; get a quote |
| **Hetzner** (DE/FI) | CX32 | 4 vCPU, 8 GB, 80 GB NVMe, 20 TB | **~€7 (~1,200 ETB)** | Card (EUR) | Best price/performance anywhere; superb reliability; ~130–180 ms from Ethiopia |
| Contabo (DE) | Cloud VPS | 4 vCPU, 8 GB, 100–200 GB | ~$7 | Card | Cheapest, but oversold nodes → inconsistent performance; weaker support |
| DigitalOcean | Basic 8 GB | 4 vCPU, 8 GB, 160 GB | $48 | Card | Polished ecosystem, poor value here; no African region |

*Prices checked July 2026 — verify before purchase.*

### What actually matters for this app
- **Latency:** local hosting gives Ethiopian users ~10–40 ms vs. ~150 ms from Europe. Noticeable but fine for a lottery site behind Cloudflare caching. Telegram bot traffic routes through Telegram's European servers anyway — EU hosting is, if anything, *better* for bot responsiveness.
- **Payment webhooks** from Telebirr/Chapa reach either location without issue.
- **Data residency:** if the NLA requires in-country data, only the Ethiopian providers qualify. **Ask during the first client's licensing before committing.**
- **SaaS scaling:** tenants share the same box; each active tenant adds modest load. Plan to step up tiers as tenants sign — Hetzner's 5-minute resize/snapshots make this much easier than local providers' manual upgrades.
- **Reliability:** Hetzner's track record beats any local option; among locals, Yegara's VPS line (NVMe, 20 TB transfer) is markedly better value than Zergaw's pricing and 2 Mbps uplink.

### Recommendation
1. **If regulator allows offshore hosting and we can get a multi-currency card → Hetzner CX32** (~1,200 ETB/mo). Same specs as Yegara 80G at ¼ the price, plus snapshots and a proper cloud firewall. Keep the domain purchase at Yegara (pay in birr) or Namecheap.
2. **If we must pay in birr or host in Ethiopia → Yegara VPS 80G** (4,450 ETB/mo). Best local value by a wide margin.
3. **Either way:** Cloudflare free tier in front with wildcard DNS for tenant subdomains; a small second box (Yegara 40G or Hetzner CX22 ~€4) as staging + off-site backup target.
4. **Avoid shared hosting** for the app itself: no queue workers, no Redis, no root hardening, no wildcard subdomain control, shared IP — wrong tool for a real-money multi-tenant platform. (A cheap Yegara shared plan is fine for the marketing/landing site + email if wanted.)

---

## 9. Supporting services

| Service | Choice | Cost |
|---|---|---|
| DNS / DDoS / WAF / CDN | Cloudflare free tier (wildcard `*.ourplatform.com` supported) | 0 |
| SSL | Let's Encrypt (auto-renew; wildcard via DNS challenge + per-custom-domain issuance) | 0 |
| SMS gateway | AfroMessage / GeezSMS | per message (~0.3–0.6 ETB), metered per tenant — use Telegram push wherever possible |
| Payment aggregator | Each tenant connects their own Chapa / SantimPay / ArifPay / Telebirr merchant account | tenant pays ~2–3% per transaction to their gateway (confirm gateways will onboard licensed lotteries) |
| Error tracking | Sentry free tier | 0 |
| Uptime monitoring | UptimeRobot free | 0 |
| Backups | Nightly encrypted DB dump → second VPS/off-site (or Backblaze B2 if paying by card, ~$6/TB); per-tenant restore tested | ~0–1,000 ETB |
| OS & stack | Ubuntu LTS, Nginx, firewall (80/443/SSH only), fail2ban, SSH keys only | 0 |

---

## 10. Cost summary

**One-time (mostly non-technical):**
- First client's (or our own anchor tenant's) NLA license ≈ 500,000 ETB + bank guarantee 1,500,000 ETB (locked, not spent) — carried by the operator, not the platform
- Company setup, legal (including the tenant contract template), accounting
- Development (in-house partner effort or contracted)
- Pre-launch penetration test (recommended)

**Monthly infrastructure (platform side):**

| Item | Birr-only route | International-card route |
|---|---|---|
| Production server | Yegara 80G — 4,450 ETB | Hetzner CX32 — ~1,200 ETB |
| Staging/backup box | Yegara 40G — 2,950 ETB (optional at start) | Hetzner CX22 — ~650 ETB |
| Domain (.com or .com.et) | ~150–250 ETB/mo amortized | same |
| SMS budget | usage-based, metered per tenant | same |
| **Total infra** | **~5,000–7,500 ETB/mo** | **~2,500–4,000 ETB/mo** |

Tenant-variable costs (SMS beyond quota, payment-gateway fees) pass through to each client's own accounts. Platform infrastructure steps up roughly per handful of active tenants — and each new tenant should more than cover it in subscription revenue.

---

## 11. Decisions to make together

1. **License path & timeline** — who is the anchor tenant (our own operation vs. a committed first client), and who drives that NLA application; confirm data-residency rules
2. **SaaS pricing model** — setup fee + monthly subscription + revenue share (% of ticket sales) vs. per-ticket fee; trial policy; what the plan tiers gate (game types, player caps, SMS quota, custom domain)
3. **Target clients** — existing betting shops adding lottery, new lottery entrants, corporate/NGO promotional raffles (a lighter-regulation niche worth exploring)
4. **First game type** — raffle (simplest to explain and audit) vs. pick-N draw lottery (rollover jackpots)? Fixed prizes vs. percentage-of-pool?
5. **Hosting route** — can we obtain a multi-currency prepaid card (→ Hetzner), or birr-only (→ Yegara 80G)?
6. **Payment partners to support first** — Chapa vs. SantimPay vs. ArifPay (ask each about onboarding licensed lotteries + settlement timelines)
7. **Stack & team** — Laravel (recommended for local hiring) vs. Node.js; who builds, and who runs platform operations (tenant onboarding, billing, support)
8. **Brand & domain name** — for the *platform*; each client brings their own brand. Secure the matching Telegram handles early

---

## Sources
- Yegara plans & pricing: [whtop listing](https://www.whtop.com/review/yegara.com), [yegara.com/vps](https://yegara.com/vps), [yegara.com/price](https://yegara.com/price)
- Zergaw Cloud pricing: [zergaw.com/cloud-server](https://zergaw.com/cloud-server/)
- Ethio Telecom Telecloud: [telecloud.ethiotelecom.et](https://telecloud.ethiotelecom.et/)
- Hetzner Cloud: [hetzner.com/cloud](https://www.hetzner.com/cloud) · Contabo: [contabo.com/pricing](https://contabo.com/en-us/pricing/) · comparisons: [VPSBenchmarks](https://www.vpsbenchmarks.com/compare/contabo_vs_hetzner), [getdeploying](https://getdeploying.com/digitalocean-vs-hetzner)
- Ethiopia gaming regulation: [NLA director interview (iGaming Afrika)](https://igamingafrika.com/ethiopia-gaming-regulatory-framework-overview-with-desse-dejene-national-lottery-authority-director/), [licensing requirements (XD Africa)](https://www.xdafrica.com/article/gambling-licensing-in-ethiopia), [CMS gambling law guide](https://cms.law/en/int/expert-guides/cms-expert-guide-to-gambling-laws-in-africa/ethiopia)
- Payments: [NBE licensed operators](https://nbe.gov.et/payment-instrument-issuers-system-operators/), [Chapa](https://chapa.co/), [SantimPay](https://santimpay.com/), [Telebirr developer portal](https://developer.ethiotelecom.et), [Telebirr Node.js integration example](https://github.com/Solomonkassa/Nodejs-Telebirr-Integration)
- International card issuance in Ethiopia: [Dashen multi-currency Mastercard](https://dashenbanksc.com/dashen-mastercard-multi-currency-international-prepaid-card/), [Addis Fortune on international debit cards](https://addisfortune.news/banks-start-issuing-international-debit-cards-to-travelers)
- Multi-tenancy: [Tenancy for Laravel](https://tenancyforlaravel.com/) · Lottery software feature references: [GammaStack](https://www.gammastack.com/blog/online-lottery-management-software-features/), [Innosoft](https://innosoft-group.com/how-lottery-management-software-work/)

*Regulatory figures and prices in this document are from public sources as of July 2026 and must be re-verified with the NLA, banks, and providers before commitments are made.*
