# Salvex Auction – Handover and Setup Guide

This guide explains what the platform does, how to run it, how to deploy it, and what the company still
has to provide before going live.

## 1. What is included

| Area | What works |
|---|---|
| Business model | The client is a middleman: insurance companies give vehicles, the admin uploads them, buyers bid (or tap "I'm interested" on Ready to Lift), the admin contacts the winner / buyer and connects them with the owner. The deal and payment happen outside the website. No payment gateway. |
| Accounts | Register as a buyer (seller accounts are off: `SELLER_ACCOUNTS=false`), every buyer gets a Buyer ID (`SLX-000123`) the admin can search by, email code verification (signed in automatically), login, logout, forgot/reset password, sessions with HttpOnly cookies, CSRF protection, rate limits |
| KYC | Buyers enter the Aadhaar number (checked, stored only as the last 4 digits + a keyed hash; the same Aadhaar on two accounts is flagged) and upload Aadhaar and PAN copies (private storage; the cancelled cheque was dropped on 2026-11-26); admins approve / reject / request changes with a reason; users are notified; only KYC-approved users can bid |
| Vehicles | Admins add vehicles one by one or by **bulk upload** (Excel / CSV template, every row checked first, photos matched by registration number from a folder, optional auction columns), with the company field list, KM driven, Superdari, an auction category (Insurance / Bank-NBFC / Used vehicle) and photos; admin review (approve / reject / request changes); public catalogue with search and filters |
| Auctions | Listed by category from the menu; admin creates an auction for an approved vehicle: starting price, start/end time, late-bid time extension ON/OFF + minutes; pause / resume / extend / cancel / close, each with a reason in the audit log |
| Bidding | Live bidding page with server-clock countdown; the starting price is admin-only (client, 2026-11-26) — bidders see "Bidding open" until the first bid, and a bid under it is refused with a dialog that does not name the amount; after that any amount above the current bid; bid confirmation + terms; double-click safe; 50 simultaneous bids tested; masked bidder names; updates every few seconds |
| Auto-close | Ended auctions close automatically (safe with several backend processes); winner and seller notified |
| Ready to Lift | Separate public list (highlighted on the home page and menu) of vehicles for immediate collection: no auction, no price, the client's note on top; "I'm interested" → admins notified → Admin > Ready to Lift enquiries (call / WhatsApp / email the buyer, mark contacted / closed); admin marks a vehicle sold or shows it again |
| Deals & service fee | Online payment is off (`ONLINE_PAYMENT_FLOW=false`): the winner sees "our team will contact you". On each result the admin records the approved amount, approved date and service fee, and adds fee payments (amount, date, reference; part payments; corrections as minus entries). Received / pending are calculated. The bank-transfer + UTR flow still exists behind `ONLINE_PAYMENT_FLOW=true` |
| Monthly report | Admin > Reports: month picker, totals, Payments / Vehicles / Buyers lists (claim number, vehicle, approved amount and date, buyer name and Buyer ID, fee received / pending / date, reference), Excel (CSV) download; admins are reminded on the 1st of each month |
| Multi-auction | Admin > Auctions > Waiting > Start several together: tick several approved vehicles, one start time, staggered end times, a starting price each |
| Spare parts | Fixed-price parts catalogue (admin adds parts with photo, price, stock); users search by vehicle + part; "Request a part" → admins notified → admin updates status / reply / price → user notified |
| Notifications | Bell in the navbar + email (when SMTP is set) for KYC decisions, vehicle review, outbid, won, sold, payment, part-request updates |
| Contact page | Messages saved, admins notified, handled in the admin panel |
| Admin panel (`/admin`) | Dashboard, KYC queue, vehicles, auctions (with bid history), orders & payments, spare parts + requests, contact messages, users (suspend / role / unblock bidding), audit log |
| Audit | Every admin action stored in an append-only audit log; bids and KYC decisions are append-only too |

Not included (not needed for the middleman model, or need company input): payment gateway, DigiLocker automatic
KYC, GST invoice, gate pass / affidavit flow, WebSocket live updates (polling is used now), SMS, browser push
notifications (planned together with the email service).

## 2. Technology

* Frontend: React 19 + Vite (`src/`)
* Backend: Python 3.12, FastAPI, SQLAlchemy (async), Alembic migrations (`backend/`)
* Database: PostgreSQL
* Files: private folder on disk (`KYC_STORAGE_DIR`), served only through the API with permission checks

## 3. Run it on a computer (development)

Requirements: Node 22, Python 3.12, PostgreSQL 15+.

```bash
# Database: create an empty database, e.g. salvex_auction

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows   (macOS/Linux: source .venv/bin/activate)
pip install -r requirements-dev.txt   # development: app + test tools (production images use requirements.txt)
copy .env.example .env          # then edit DATABASE_URL and APP_SECRET_KEY
alembic upgrade head
python -m app.cli create-admin --email you@company.com --name "Your Name"   # asks for a password
uvicorn app.main:app --reload --reload-dir app

# Website (second terminal, project root)
npm ci
npm run dev                      # http://localhost:5173  (/api is forwarded to the backend)
```

In development, emails are written to `backend/.dev_outbox/outbox.jsonl`. Read the latest code with
`python -m app.cli dev-last-code someone@example.com`.

## 4. Deploy on Coolify (recommended: one domain)

The company database is private to the Coolify network, so the backend must run on the same Coolify server.

1. **Backend service** – Dockerfile `backend/Dockerfile`.
   * Persistent volume mounted at `/data/private` (uploaded documents and photos).
   * Environment variables (see `backend/.env.example`):
     `APP_ENV=production`, `APP_SECRET_KEY` (long random), `DATABASE_URL` (company DB, private address),
     `FRONTEND_ORIGINS=https://your-domain`, `PUBLIC_SITE_URL=https://your-domain`, `TRUSTED_PROXY_COUNT=2` (Coolify's proxy + the website's nginx),
     `EMAIL_PROVIDER=smtp` + `SMTP_HOST/PORT/USER/PASSWORD/FROM_EMAIL`, `MOBILE_OTP_REQUIRED=false` until SMS exists (sign-up always uses the email code; `true` makes bidding need a mobile confirmed by SMS from the dashboard),
     `COMPANY_BANK_*` (required only when `ONLINE_PAYMENT_FLOW=true`).
   * Before the first start and after each release: run `alembic upgrade head` (Coolify pre-deployment command),
     **after a fresh backup**. Full procedure, checklist and rollback: [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md).
   * Create the first admin once: `python -m app.cli create-admin --email ... --name "..."`.
2. **Website service** – Dockerfile at the project root (nginx).
   * Runtime variable `BACKEND_URL` = internal address of the backend service, e.g. `http://salvex-api:8000`.
   * Build arguments: `VITE_COMPANY_PHONE`, `VITE_COMPANY_WHATSAPP`, `VITE_COMPANY_EMAIL`, `VITE_COMPANY_ADDRESS`, `VITE_COMPANY_CITY`.
   * Attach the domain here. nginx forwards `/api` to the backend, so the browser sees one domain.
3. Enable HTTPS (Let's Encrypt in Coolify) and scheduled PostgreSQL backups.
4. Smoke test: `https://your-domain/api/health`, register, verify, log in, admin panel.

The backend refuses to start in production if a required setting is missing or unsafe (weak secret,
non-HTTPS origins, console email, rate limit off). The error message names the setting.

### Frontend on Vercel instead (optional)

Edit `vercel.json` and replace `REPLACE-WITH-BACKEND-DOMAIN` with the public backend domain. Add the Vercel
address to the backend's `FRONTEND_ORIGINS`. The backend still runs on Coolify.

## 5. Tests

```bash
cd backend
.venv\Scripts\python -m pytest -q -p no:cacheprovider     # uses a LOCAL database whose name contains "test"
cd ..
npm run lint && npm run build && npm run check:no-demo
npm run check:csp                                         # the website security policy, on the production build
npx playwright test                                       # desktop, mobile and demo (starts the dev servers)
npm audit --omit=dev
cd backend && pip-audit -r requirements.txt               # see the reviewed exceptions in .github/workflows/ci.yml
```

The test runner refuses to use any database that is not local or whose name does not contain "test".

## 6. What the company must provide before launch

| Item | Where it goes |
|---|---|
| Domain and Coolify access | Deployment |
| SMTP account (or Brevo / AWS SES) | `SMTP_*` backend variables |
| Phone, WhatsApp, support email, office address | `VITE_COMPANY_*` website build arguments |
| Approved Terms, Privacy, Refund and Auction policy text | `src/data/siteContent.js` (current text is a draft) |
| The first vehicles, filled in the bulk upload template, with photos named by registration number | Admin > Auctions > Bulk upload (Ready to Lift vehicles: Admin > Ready to Lift > Bulk upload) |
| Confirmation of provisional values: default extension 2 min, photo limits (1 to 20, 5 MB) | Backend variables (no code change) |

## 7. Security notes

* Never commit `.env` files. Rotate the database password that was shared during development.
* Keep one backend worker unless a shared rate limiter (Redis) is added.
* Uploaded files are never served directly; every download checks permissions.
* Photo location data (EXIF, XMP, IPTC) is removed on the server for every upload (see section 10).

## 8. Business settings (backend variables, no code change)

| Variable | Production value | Meaning |
|---|---|---|
| `ONLINE_PAYMENT_FLOW` | `false` | No online payment. Winners are contacted by the team; the admin records the deal and service fee. `true` brings back bank transfer + UTR, the 48-hour deadline, reminders and the unpaid-win bidding block |
| `SELLER_ACCOUNTS` | `false` | Registration is buyer-only; only admins add vehicles |
| `KYC_REQUIRED_DOCUMENTS` | `aadhaar_card,pan_card` | Documents a buyer must upload before submitting KYC |
| `KYC_REQUIRE_AADHAAR_NUMBER` | `true` | The Aadhaar number must be entered (only the last 4 digits are kept) |
| `PAYMENT_REMINDER_HOURS_IST` | `9,14,19` | Reminder times for unpaid wins (used only when `ONLINE_PAYMENT_FLOW=true`) |

## 9. First launch with an empty database

1. Deploy, then run the migrations (`alembic upgrade head` as the Coolify pre-deployment command; the image does
   NOT migrate on its own). See [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md).
2. Create the first administrator: `python -m app.cli create-admin --email you@company.example --name "Your Name"` (it asks for the password; never put it in chat or files).
3. Admin > Auctions > Bulk upload (Ready to Lift vehicles: Admin > Ready to Lift > Bulk upload): download the Excel template, fill it (one vehicle per row), choose the file.
   Every row is checked first and problems are listed per row. Choose the photos folder (photos named with the
   registration number, or one folder per vehicle), then Import. Vehicles with photos are published and their
   auctions created from the file; vehicles without photos stay as drafts.
4. Vehicles without auction columns: Admin > Auctions > Waiting > Start several together (several at once).

## 10. Photos and uploaded files (important for deployment)

* Vehicle photos, spare-part photos and KYC documents are files in one private folder: `KYC_STORAGE_DIR`
  (sub-folders `vehicles/`, `parts/`, `kyc/`). The database stores only their details (which vehicle, size, order,
  a hash used to detect damaged files). Files are never served directly; every download goes through the backend
  with a permission check.
* **Coolify: mount a persistent volume at `KYC_STORAGE_DIR`.** Without it every redeploy deletes all photos and
  KYC documents while the database still lists them.
* **Back up the database and this folder together, daily.** A database restore without the matching folder
  shows vehicles without photos.
* Photos are made smaller in the browser before upload (at most 1600 px, about 200-400 KB) and a 480 px thumbnail
  is stored for lists and cards. Location / phone details (EXIF, XMP, IPTC) are removed again on the server for
  every upload (pure Python, no extra library). Plan about 3-5 MB of disk per vehicle (10 photos + thumbnails).
* Photos are cached by browsers for one day (a changed photo always gets a new address).
* Later, for thousands of vehicles: move the folder to object storage (Cloudflare R2 / S3). Only
  `app/services/storage.py` changes.
