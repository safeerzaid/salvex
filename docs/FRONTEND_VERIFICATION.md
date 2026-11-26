# Salvex: Frontend Functionality Verification (real backend)

- **Date:** 24 November 2026
- **Branch:** `feature/full-frontend`
- **Scope:** frontend features, exercised through the real website. The backend audit is a separate phase.
- **Updated 24 Nov:** sign-up is now **email first**. The emailed code finishes sign-up; the mobile is confirmed later, before bidding, only when `MOBILE_OTP_REQUIRED=true`. Rows 3, 5 and 6 and findings F-1 and F-2 are updated.

## How this was tested

The checks drove a real Chromium browser against the real API and the **local development** PostgreSQL database (`127.0.0.1/salvex_auction`). Nothing was mocked.

- **Tests:** `tests/real/*.spec.js`, run with `npx playwright test -c playwright.real.config.js`.
- **What each step checks:**
  - it performs the real UI action
  - it waits for the real API response and checks its status
  - it reads the matching database row with `tests/real/dbq.py`, which is read-only and refuses any non-local database
  - it reloads the page to confirm the data persisted
  - it tries invalid input and access without permission
- **Admin account:** a separate local verification admin (`verify.admin@example.com`). Its password lives only in an environment variable and is never stored in the repo.
- **Email and SMS:** the test server is always started with the console (developer outbox) providers, even if `backend/.env` holds real SMTP settings, so test accounts are never emailed. The backend writes each code to the outbox file, and the tests read the codes from there. This proves the **code checks** work. It does **not** prove that a message reaches a phone or inbox (see BLOCKED).
- **Payment:** online payment is switched off for this client (`ONLINE_PAYMENT_FLOW=false`), so no payment screen exists to test.

**Final run (email-first sign-up):** 26 tests, 26 passed, 0 failed, 0 flaky (7.8 min). The earlier SMS-first version also passed 26/26. The evidence is in `test-results/real-results.json`, which is regenerated on every run.

## Matrix

| # | Feature | User action | Expected | Actual | API | Database check | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Registration form checks | Submit an empty form, then an invalid email | Stopped in the browser, no API call | No `POST /register` was sent | none | – | 01 #1 | PASS |
| 2 | Registration | Fill a valid form | Unverified account created; password hashed | 201; `is_email_verified=false`, `is_mobile_verified=false`; bcrypt hash `$2…`, never the plain password | `POST /api/auth/register` 201 | `users` row | 01 #1 | PASS |
| 3 | Sign-in before verification | Sign in with an unverified account | Refused | 403 `email_not_verified` with "Please verify your email address…"; `/me` stays 401 | `POST /api/auth/login` 403 | – | 01 #2 | PASS |
| 4 | Registering again before finishing | Register the same email with new details | Still one account; newest details win; new code sent to the email | 1 row; name replaced; password re-hashed | `POST /register` 201 | `users` count = 1 | 01 #3 | PASS |
| 5 | Email sign-up code | Enter an old code, a wrong code, then the right one | Old and wrong refused; right one finishes sign-up and signs in | Old and wrong ≥400 with alert; right one 200 → dashboard; `is_email_verified=true`, `is_mobile_verified=false`; session row; reload keeps the session | `POST /api/auth/verify-email` | `users`, `auth_sessions` | 01 #4 | PASS (code read from the dev outbox) |
| 6 | Dashboard after sign-up | Sign in after the email code | No more codes asked (switch off) | No email card, no mobile card; site-config `mobile_otp=false` | `GET /api/site-config` | – | 01 #5 | PASS |
| 7 | Profile edit | Change name and organisation, save | Saved and shown after reload | 200; DB updated; fields refilled after reload | `PATCH /api/users/me` 200 | `users` | 01 #6 | PASS |
| 8 | Sign-out | Account menu → Sign out | This session ends on the server | 200; this browser's session revoked (active count −1); `/me` 401; `/dashboard` → `/login` | `POST /api/auth/logout` 200 | `auth_sessions.revoked_at` | 01 #7 | PASS |
| 9 | Sign-in | Wrong password, then the right one | Wrong refused with a message; right one signs in | 401 + alert; then dashboard | `POST /api/auth/login` | – | 01 #8 | PASS |
| 10 | Forgotten password | Request a code, reset, sign in | Password changed; old one rejected | 200, 200; hash changed; old password 401; new one works | `/forgot-password`, `/reset-password` | `users.password_hash` | 01 #9 | PASS (dev outbox) |
| 11 | Admin protection (buyer) | Buyer opens `/admin` and calls an admin API | Blocked in both places | Redirected away; API 403 | `GET /api/admin/dashboard` 403 | – | 01 #10 | PASS |
| 12 | Protection when signed out | Open `/dashboard` and `/admin`, call the APIs | Sent to sign-in; API 401 | Redirect to `/login`; 401, 401 | `/api/users/me`, `/api/admin/dashboard` 401 | – | 01 #11 | PASS |
| 13 | KYC start and upload | Start KYC; upload a fake JPEG, then 3 real files | Fake refused by content; real ones stored | Fake 415 with alert; 3 × 201 | `POST /api/kyc/submissions`, `…/documents` | `kyc_submissions`=draft → 3 `kyc_documents` | 02 #1 | PASS |
| 14 | Aadhaar number | Enter and save | Saved masked; only hash and last 4 kept | 200; page shows `XXXX XXXX nnnn`; DB has hash + last 4 | `PUT …/aadhaar` 200 | `aadhaar_hash`, `aadhaar_last4` | 02 #1 | PASS |
| 15 | KYC submit | Submit for review | Status becomes submitted; still shown after reload | 200; `status=submitted`; reload shows it under review | `POST …/submit` 200 | `kyc_submissions.status` | 02 #1 | PASS |
| 16 | KYC privacy | Another buyer requests the document URL | Refused | 403/404 | `GET /api/kyc/documents/{id}/file` | – | 02 #2 | PASS |
| 17 | Admin KYC approval | Admin opens the submission, downloads the file, approves | File opens; approval stored | Download 200; decision 200; `kyc_status=verified`; decision `approved` | `POST /api/admin/kyc/submissions/{id}/decision` | `users.kyc_status`, `kyc_decisions` | 02 #3 | PASS |
| 18 | Admin new vehicle and auction | 3-step wizard: details, photo (crop), auction settings | Vehicle, photo and auction stored | 201, 201, 201; DB: registration number, price 50000.00, 1 photo, start time as chosen | `POST /api/vehicles`, `…/photos`, `/api/admin/auctions` | `vehicles`, `vehicle_photos`, `auctions` | 02 #4 | PASS |
| 19 | Auction goes live | Wait for the scheduled start | Becomes live on its own; listed publicly with its photo | `phase=live`; shown on `/auctions/live`; photo loads (naturalWidth > 0); signed-out visitor sees "Sign in to bid" | `GET /api/auctions/{id}` | – | 02 #5 | PASS |
| 20 | Bidding without KYC | Buyer B without approved KYC tries to bid | Blocked on the page and by the API | Page shows "Verify your identity to bid"; API 403; 0 bids in DB | `POST /api/auctions/{id}/bids` 403 | `auction_bids` = 0 | 02 #6 | PASS |
| 21 | Bid too low | Enter less than the starting price | Refused by the server, dialog shown | "Your bid is lower than the expected price. Kindly increase your bid.", amount not given away | none | – | 02 #7 | PASS |
| 22 | Valid bid | Place bid → accept the terms → confirm | Stored; price updated; shown after reload | Confirm disabled until the terms are ticked; 201; `current_price=51000.00`, 1 bid; reload shows "You are the highest bidder" | `POST …/bids` 201 | `auctions.current_price`, `auction_bids` | 02 #7 | PASS |
| 23 | Bid equal to the current price | Bid the same amount (API) | Refused | 409; price unchanged | `POST …/bids` 409 | `auctions.current_price` | 02 #8 | PASS |
| 24 | Outbid | Buyer B bids higher through the page | Stored; buyer A notified and can bid again | 201; price 52500.00; A gets an `outbid` notification row; A's page shows the bid form again | `POST …/bids` 201 | `auctions`, `notifications` | 02 #9 | PASS |
| 25 | Contact form | Submit empty, then a full message | Empty stopped in the browser; full one stored | No request when empty; 201; row with name, subject, message, status `new` | `POST /api/contact` 201 | `contact_messages` | 03 #1 | PASS |
| 26 | Admin sees contact message | Admin → Messages | The message is listed | Row visible | admin list API | – | 03 #2 | PASS |
| 27 | Ready to Lift interest | Signed out: button; signed in: I'm interested → agree → send | Signed out asks to sign in; signed in stores once | Button count = approved RTL vehicles in the DB; Send disabled until agreed; 201; 1 enquiry row; after reload that vehicle's button changes | `POST /api/ready-to-lift/{id}/interest` 201 | `vehicle_enquiries` | 03 #3 | PASS |
| 28 | Spare part request | Request this part → form → send | Stored with a number; listed in the dashboard | 201; row with part name and phone; number shown; dashboard Parts tab lists it | `POST /api/part-requests` 201 | `part_requests` | 03 #4 | PASS |
| 29 | Admin sees enquiries | Admin → Vehicle enquiries, Spare part enquiries | Both listed | Both visible | admin list APIs | – | 03 #5 | PASS |
| 30 | Public lists match the DB | Compare counts; search | Same numbers as the database | Live auctions: DB 6 = API 6; active parts equal; search "Swift" shows results | `/api/auctions?phase=live`, `/api/parts` | counts | 03 #6 | PASS |
| 31 | Rate limiting (seen during testing) | More than 10 registrations from one IP in an hour | Refused | 429 at registration (seen several times) | `POST /register` 429 | – | test logs | PASS (seen, not a dedicated test) |
| 32 | Real SMS delivery | – | Code arrives on a phone | No SMS provider exists | – | – | – | **BLOCKED** |
| 33 | Real email delivery | – | Code arrives in an inbox | SMTP not configured | – | – | – | **BLOCKED** |
| 34 | Online payment | – | – | Switched off for this client (`ONLINE_PAYMENT_FLOW=false`) | – | – | – | **BLOCKED (not in scope)** |
| 35 | Auction close, winner and results | Wait for the end | Winner, order and results | Not run: needs a short auction plus a full close cycle | – | – | – | NOT TESTED |
| 36 | Admin auction actions (pause, resume, extend, cancel, close) | – | – | – | – | – | – | NOT TESTED |
| 37 | Admin users (suspend, reactivate, role, unblock) | – | – | – | – | – | – | NOT TESTED |
| 38 | Admin status changes on messages, enquiries and part requests | – | – | Only "listed" was checked | – | – | – | NOT TESTED |
| 39 | Admin bulk Excel upload, spare-parts catalogue edit, reports and CSV, audit log, admin search | – | – | – | – | – | – | NOT TESTED |
| 40 | Notification bell in the page, mark as read | – | – | Only the DB row was checked (#24) | – | – | – | NOT TESTED |
| 41 | Sign out on all devices, resend-code cooldown in the real UI, rate-limit message text | – | – | – | – | – | – | NOT TESTED |
| 42 | Phone-size layout against the real backend | – | – | Covered only by the mocked suite | – | – | – | NOT TESTED |
| 43 | Seller accounts and `/sell` | – | – | Switched off for this client (`SELLER_ACCOUNTS=false`) | – | – | – | NOT TESTED (off) |

**Totals:**

| Status | Rows |
|---|---|
| PASS | 31 (rows 1–31) |
| BLOCKED | 3 |
| NOT TESTED | 9 |
| FAIL | 0 |

## Findings

**Frontend bugs found:** none. Every failure during development of these tests was a mistake in the test, each confirmed against the real behaviour:
- wrong selector
- wrong expected status (415 rather than 400; 422 for a missing `terms_accepted`)
- email letter case
- the registration rate limit kicking in

No frontend code was changed.

**For the backend phase (not fixed here):**
- **F-1 (security): FIXED.** Sign-up used to finish with the SMS code, so the email address was never proven. Sign-up now always finishes with the code sent to the email address, so an account cannot be made with someone else's email. Backend test: `test_someone_elses_email_cannot_be_taken_with_your_own_mobile`.
- **F-2 (minor): FIXED.** Signing in to an unverified account now returns `email_not_verified` with an email message. Backend test: `test_sign_in_is_refused_until_the_email_code_is_entered`.
- **Mobile before bidding:** when `MOBILE_OTP_REQUIRED=true`, the auction page shows "Verify your mobile number to bid" instead of the bid form until the mobile is confirmed in the dashboard. Mocked regression tests in `tests/e2e/email-first-signup.spec.js`. The real-backend check of this path is **NOT TESTED**: it needs SMS switched on, and there is no SMS provider.

## Test data left in the local development database

Accounts `real.*@example.com` and `verify.admin@example.com`, plus test vehicles (`KL..RV....`), auctions, bids, KYC files, contact messages and enquiries. All of these are **local only**. Remove them before using this database as seed data.
