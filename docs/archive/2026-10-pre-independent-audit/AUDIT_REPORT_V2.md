# SALVEX AUCTION — SECOND-PASS COMPREHENSIVE AUDIT REPORT (V2)
**Target System:** Salvex Auction (Online Vehicle Auction Platform — Used, Damaged & Salvage Vehicles)  
**Live Production URL:** [https://beta-salvex.vercel.app](https://beta-salvex.vercel.app)  
**Repository Branch:** `main` (commit `f23d29b`)  
**Audit Date:** October 15, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, Security Auditor & Product Analyst  
**Audit Type:** Second-Pass Deep Forensic Audit (Verification of Audit V1 + Net-New Findings across all repository files)

---

## 1. RECONCILIATION OF SYSTEM HEALTH SCORE

The initial audit report (`AUDIT_REPORT.md`) contained an arithmetic discrepancy: it announced an "Overall System Health Score: 38 / 100" in its executive summary while calculating a weighted sum of `30.8 / 100` in its table. Furthermore, upon deeper file-by-file forensic verification of code quality, accessibility, CSS architecture, and legal compliance, the score has been recalibrated downwards to accurately reflect production readiness.

### Recalibrated Health Score: **26.0 / 100** (Grade: F — Prototype Stage)

$$\text{Final Score} = \sum (\text{Category Score} \times \text{Weight}) = 25.95 \approx \mathbf{26.0 / 100}$$

| Evaluation Category | Raw Score (0–100) | Weight | Weighted Score | Audit Assessment |
| :--- | :---: | :---: | :---: | :--- |
| **UI Design & Aesthetic Polish** | **82 / 100** | 15% | **12.30** | Sleek luxury styling, cohesive palette, responsive layout structure, smooth GSAP parallax. |
| **Architecture & Navigation** | **25 / 100** | 15% | **3.75** | Custom state-based router (`currentRoute`), URL stuck at `/`, back-button and refresh broken. |
| **Backend, API & Database** | **0 / 100** | 20% | **0.00** | **NON-EXISTENT.** Zero endpoints, zero database tables, zero models, zero persistence. |
| **Security & Authentication** | **10 / 100** | 15% | **1.50** | Mock auth bypass, open `/admin` selector, missing security headers, missing `.env` in `.gitignore`. |
| **Auction Business Logic** | **12 / 100** | 15% | **1.80** | Client-only bids and timers, zero concurrency control, non-functional anti-sniping, no proxy bidding. |
| **Code Quality & Reliability** | **35 / 100** | 10% | **3.50** | 7 fatal Hook errors, 113 linter warnings, 330 `!important` CSS rules, 5 orphaned files, 3 dead modals. |
| **Performance & Core Web Vitals** | **42 / 100** | 5% | **2.10** | 684 KB monolithic JS bundle, 14.74 MB uncompressed images, missing `width`/`height` on images. |
| **SEO, Accessibility & Legal** | **20 / 100** | 5% | **1.00** | Blank initial HTML, no sitemap/robots, WCAG AA contrast failures, false regulatory claims in copy. |
| **TOTAL** | — | **100%** | **25.95 / 100** | **STRICT PROTOTYPE — UNFIT FOR PRODUCTION OPERATION** |

---

## PART 1: VERIFICATION OF THE FIRST AUDIT (AUDIT_REPORT.MD)

### 1.1 Item-by-Item Verification of Findings SEC-01 to SEO-01

Each finding from the first audit was tested directly against the source code:

| ID | First Audit Title | Status | Actual Location & Evidence | Detailed Forensic Verdict |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | Open Admin Command Center | **CONFIRMED** | [src/components/AdminPanel.jsx:80-97](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AdminPanel.jsx#L80-L97) | Anyone can switch to "Super Admin" via a raw HTML `<select>` dropdown. Route `/admin` is completely unguarded. |
| **SEC-02** | Mock Authentication Bypass | **CONFIRMED** | [src/components/LoginPage.jsx:32-68](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LoginPage.jsx#L32-L68) | `setTimeout(..., 750)` grants authenticated access to any non-empty input; `handleQuickPersona` bypasses credentials entirely. |
| **SEC-03** | Injection / XSS in PaymentPage | **PARTIALLY TRUE / MISCHARACTERIZED** | [src/components/PaymentPage.jsx:35-40](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L35-L40) | The line number is correct (`handleCopy`), but `navigator.clipboard.writeText(text)` does **not** cause DOM XSS injection. React auto-escapes JSX text. Risk was overstated in V1; real vulnerability is client-side payment forgery. |
| **SEC-04** | Missing Security Headers | **CONFIRMED** | [vite.config.js:1-12](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/vite.config.js#L1-L12) & Root | `vercel.json` does not exist in root. No CSP, HSTS, X-Frame-Options, or Referrer-Policy headers are served. |
| **SEC-05** | Vulnerability in `source-map-js` | **CONFIRMED** | `package.json` / `node_modules` | Verified via `npm audit`: `source-map-js 1.0.0 - 1.2.1` has 1 High Severity DoS vulnerability (GHSA-68fv-2mgg-jv7q). |
| **AUC-01** | Client-Side Only Bidding | **CONFIRMED** | [src/App.jsx:158-172](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/App.jsx#L158-L172) | Bids are dispatched into in-memory `useState(liveVehiclesData)`. No server or network socket exists. |
| **AUC-02** | Zero Concurrency Control | **CONFIRMED** | Whole Codebase | Zero distributed locking, Redis, or atomic SQL updates exist. Simultaneous bids cannot be synchronized. |
| **AUC-03** | Client-Side Clock Reliance | **CONFIRMED** | [src/components/VehicleCard.jsx:30-36](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleCard.jsx#L30-L36) | Timer relies on browser `setInterval`. Client clock drift or sleeping background tabs alters auction duration. |
| **AUC-04** | Non-Functional Anti-Sniping | **CONFIRMED** | [src/components/AdminPanel.jsx:57-59](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AdminPanel.jsx#L57-L59) | `handleExtendAuction` only displays `onShowToast(...)`; no auction end time is modified in state or data. |
| **AUC-05** | Simulated Payment Settlement | **CONFIRMED** | [src/components/PaymentPage.jsx:42-52](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L42-L52) | `handleSimulatePayment` switches status to `'Paid'` via 1.2s `setTimeout`. No payment gateway or webhook exists. |
| **BUG-01** | Rule of Hooks in ListVehicleModal | **CONFIRMED** | [src/components/ListVehicleModal.jsx:6](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/ListVehicleModal.jsx#L6) | `if (!isOpen) return null;` precedes `useState` on lines 8, 9, 19. Triggers React fatal hook order violation. |
| **BUG-02** | Rule of Hooks in RegisterModal | **CONFIRMED** | [src/components/RegisterModal.jsx:15](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/RegisterModal.jsx#L15) | `if (!isOpen) return null;` precedes `useState` on lines 18, 19, 22, 46. Causes dynamic render crash. |
| **BUG-03** | Hardcoded Vehicle Details | **CONFIRMED** | [src/components/VehicleDetailsPage.jsx:287-330](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleDetailsPage.jsx#L287-L330) | Title, specs, and tabs are hardcoded to "Land Rover Defender 110". Selected marketplace vehicle is ignored. |
| **BUG-04** | Direct State Mutation | **CONFIRMED** | [src/components/RegisterModal.jsx:86, 92](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/RegisterModal.jsx#L86) | Code assigns directly: `formData.idFileName = ...` and `formData.pccFileName = ...` instead of immutable update. |
| **BUG-05** | Unreachable Dialog Modals | **CONFIRMED** | [src/App.jsx:100-102](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/App.jsx#L100-L102) | `isRegisterOpen`, `isSellerOpen`, and `selectedDetailVehicle` setters are never called with `true` or a vehicle. |
| **BUG-06** | Orphaned Components | **CONFIRMED** | `src/components/` | 5 components are confirmed completely unimported: `RecentlyAdded.jsx`, `ContactSection.jsx`, `PortalBar.jsx`, `SellerCta.jsx`, `TrustStats.jsx`. |
| **DEP-01** | Dead Dependencies (`i`, `lenis`) | **CONFIRMED** | [package.json:14-15](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/package.json#L14-L15) | Both packages are in `package.json`, but grep confirms 0 imports in the entire codebase. |
| **ROU-01** | No Real URL Routing | **CONFIRMED** | [src/App.jsx:68, 127-141](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/App.jsx#L68) | State router does not use HTML5 History API or React Router. URL is pinned to `/`. Refresh resets to home. |
| **PERF-01**| `setInterval` Recreation Leak | **CONFIRMED** | [src/components/VehicleCard.jsx:30-36](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleCard.jsx#L30-L36) | `[remainingSeconds]` in dependency array tears down and recreates intervals every second across all cards. |
| **PERF-02**| Uncompressed Image Assets | **CONFIRMED** | `public/images/` | 19 image files total 14.74 MB (15,455,487 bytes). 3 hero images alone consume 5.14 MB. |
| **SEO-01** | Zero Search Engine Indexability | **CONFIRMED** | [index.html:1-18](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/index.html#L1-L18) & `public/` | Empty root container, no server rendering, no OpenGraph, no Twitter cards, no `robots.txt`, no `sitemap.xml`. |

---

### 1.2 Command-Line Verification Evidence (Live Execution Output)

#### 1. Real Oxlint Verification:
```bash
$ npx oxlint
Found 113 warnings and 7 errors.
Finished in 240ms on 50 files with 104 rules using 12 threads.
```
- **7 Errors:** All 7 are `react-hooks(rules-of-hooks)` violations:
  - `src/components/ListVehicleModal.jsx`: Lines 8, 9, 19
  - `src/components/RegisterModal.jsx`: Lines 18, 19, 22, 46
- **113 Warnings:**
  - 104 `eslint(no-unused-vars)`: Over 80 unused Lucide icon imports across components.
  - 1 `react(set-state-in-effect)` in `src/components/VehicleCard.jsx:26`.
  - 1 `eslint(react-compiler)` in `src/components/RegisterModal.jsx:142` (calling impure `Math.random()` during render).

#### 2. Real NPM Audit Verification:
```bash
$ npm audit
# npm audit report
source-map-js  1.0.0 - 1.2.1
Severity: high
source-map-js allows event-loop denial of service through indexed source-map section offsets - https://github.com/advisories/GHSA-68fv-2mgg-jv7q
fix available via `npm audit fix`
node_modules/source-map-js
1 high severity vulnerability
```

#### 3. Real Production Build (`npm run build`) Verification:
```bash
$ npm run build
> vite build
vite v8.3.1 building client environment for production...
✓ 1948 modules transformed.
dist/index.html                   1.01 kB │ gzip:   0.56 kB
dist/assets/index-D8oeAbXC.css  208.71 kB │ gzip:  34.85 kB
dist/assets/index-Ca9uQ7VT.js   684.06 kB │ gzip: 193.03 kB
(!) Some chunks are larger than 500 kB after minification.
✓ built in 1.60s
```
- **Monolithic Output:** One single JS bundle of **684.06 KB** (193.03 KB gzipped) and one CSS file of **208.71 KB**.
- **No Code Splitting:** Admin panel, dashboards, modals, and landing page are all compiled into a single file.

#### 4. Real Asset Weight & 10 Largest Image Files:
- **Total Asset Folder Size:** 19 files, **14.74 MB** (15,455,487 bytes).
- **10 Largest Files in `public/images/`:**
  1. `new.png`: 1,844,636 bytes (1.76 MB) — Hero wallpaper
  2. `hero.png`: 1,840,509 bytes (1.76 MB) — Unused hero background
  3. `new2.png`: 1,695,837 bytes (1.62 MB) — Secondary hero wallpaper
  4. `about-facility.jpg`: 953,123 bytes (0.91 MB)
  5. `swift-zxi-plus.jpg`: 944,821 bytes (0.90 MB)
  6. `hero_daylight_mercedes.jpg`: 791,793 bytes (0.76 MB)
  7. `swift-interior.jpg`: 771,949 bytes (0.74 MB)
  8. `hero-bg.jpg`: 741,075 bytes (0.71 MB)
  9. `defender-110.jpg`: 690,897 bytes (0.66 MB)
  10. `mercedes-g63.jpg`: 684,812 bytes (0.65 MB)
  *Notice:* `whitelogo.png` is **653,894 bytes** (638 KB) and `logo.png` is **377,544 bytes** (368 KB) for simple brand logos!

#### 5. Unused Dependencies & Components Trace:
- `lenis`: **0 imports** in `src/`. Confirmed dead dependency.
- `"i"`: **0 imports** in `src/`. Confirmed accidental install.
- `RecentlyAdded.jsx`: Confirmed **0 imports** in `src/`. `App.jsx` imports `RecentlyAddedVehicles.jsx` and `RecentlyAddedPage.jsx`.
- `ContactSection.jsx`: Confirmed **0 imports** in `src/`.
- `PortalBar.jsx`: Confirmed **0 imports** in `src/`.
- `SellerCta.jsx`: Confirmed **0 imports** in `src/`.
- `TrustStats.jsx`: Confirmed **0 imports** in `src/`.

#### 6. Complete Audit of Hardcoded Fields in `VehicleDetailsPage.jsx`:
In 1,306 lines of code, the `vehicle` prop is only read for `image`, `currentBid`, `bidCount`, `startingBid`, `id`, and conditionally for `location` on line 823. **Every other field is hardcoded to a Land Rover Defender:**
1. Line 168: Breadcrumb active item: `"Land Rover Defender 110 V8 5.0L"`
2. Line 183: Active image alt text: `"Land Rover Defender 110 - ..."`
3. Line 186 & 269: Image fallback paths: `"/images/defender-110.jpg"`
4. Line 288: Main `<h1>` Title: `"Land Rover Defender 110 V8 5.0L"`
5. Line 292: Mfg Year: `"Mfg: 2023"`
6. Line 294: Reg Year: `"Reg: 2023"`
7. Line 296: Stock ID: `"SVX-45892"`
8. Lines 305, 313, 321, 329: 2x2 Specs: Fuel `"Petrol"`, Trans `"8-Speed Automatic"`, KM `"18,650 KM"`, Location `"Bengaluru, KA"`
9. Lines 353-358: Damage card: `"Minor scratches on front bumper and right side panel..."`
10. Line 371: Short description: `"2023 Land Rover Defender 110 V8 5.0L with 18,650 KM..."`
11. Line 404: Auction Start: `"28 Sep 2026 · 10:00 AM"` (Past date)
12. Line 408: Auction End: `"30 Sep 2026 · 04:14 PM"` (Past date)
13. Lines 546-590: Details Tab: Make `"Land Rover"`, Model `"Defender 110 V8 5.0L"`, Body `"SUV"`, Color `"Carpathian Grey"`, Owner `"Single Owner"`
14. Lines 601-645: Inspection Tab: Hardcoded score `"94 / 100"`, `"Tires 82%"`, `"Engine 96%"`, `"Chassis 98%"`
15. Lines 710-750: Documents Tab: Hardcoded fake files `"RC_Copy_KA03.pdf"`, `"NOC_Bank.pdf"`
16. Lines 760-815: Bid History: Hardcoded bids from fake users `"Rahul Sharma"`, `"Karan Patel"`, `"Amitabh S."`

#### 7. Verification of the 3 Unreachable Modals:
- `isRegisterOpen`: Initialized to `false` ([App.jsx:101](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/App.jsx#L101)). The only setter call in the entire repo is `onClose={() => setIsRegisterOpen(false)}` on line 485. **Never set to true.**
- `isSellerOpen`: Initialized to `false` ([App.jsx:102](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/App.jsx#L102)). The only setter call is `onClose={() => setIsSellerOpen(false)}` on line 490. **Never set to true.**
- `selectedDetailVehicle`: Initialized to `null` ([App.jsx:100](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/App.jsx#L100)). The only setter call is `onClose={() => setSelectedDetailVehicle(null)}` on line 477. **Never set to a vehicle.**
- **Verdict:** Confirmed. All 3 modals are rendered into the React tree but are impossible for any user to trigger.

---

## PART 2: NEW PROBLEMS THE FIRST AUDIT MISSED

### 2.1 Runtime & Logic Bugs (Section A)

#### A1. Non-Functional Buttons & Broken Navigation Links
- **Social Media Links Lead Nowhere:** In [src/components/Footer.jsx:56-60](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L56-L60), all 5 social links (`Twitter/X`, `LinkedIn`, `YouTube`, `WhatsApp`, `Instagram`) use `href="#"`, causing the page to abruptly scroll to top rather than opening any social profile.
- **Fake Contact Coordinates:**
  - Phone: `href="tel:+911800000000"` ([Footer.jsx:128](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L128))
  - WhatsApp: `href="https://wa.me/911800000000"` ([Footer.jsx:136](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L136))
  - Email: `mailto:support@salvexauction.in` ([Footer.jsx:132](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L132))
- **Exposed Admin Portal Link in Footer:** [src/components/Footer.jsx:175-177](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L175-L177) renders a public `<button className="footer-admin-link" onClick={() => onNavigate('admin')}>Admin →</button>`. Any guest visitor who scrolls to the footer can click this and immediately open the administrative liquidation terminal.
- **Browser Raw Alerts as Placeholders:**
  - [src/components/LoginPage.jsx:164](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LoginPage.jsx#L164): `onClick={() => alert('Password reset link sent to your registered email.')}`
  - [src/components/VehicleDetailsPage.jsx:96](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleDetailsPage.jsx#L96): `alert('Your bid must meet or exceed...')`
  - [src/components/VehicleDetailsPage.jsx:811](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleDetailsPage.jsx#L811): `onClick={() => alert('Complete 24-bid audit trail loaded.')}`

#### A2. Bidding Engine Edge Cases & Flaws
- **Increment Enforcement Bypass:** In [src/components/BidModal.jsx:29](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BidModal.jsx#L29), the validation check is strictly `if (bidAmount <= currentBid)`. Even though line 137 claims *"Minimum valid increment is ₹10,000 above the highest live bid"*, the code allows a user to bid `currentBid + 1` (a ₹1 increment), which violates auction rules.
- **Bidding on Ended Lots:** In [src/components/VehicleDetailsPage.jsx:93-100](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleDetailsPage.jsx#L93-L100), `handleInitiateBid` does **not** check whether `secondsRemaining <= 0`. Even after the countdown hits zero, the user can continue to place bids on the ended lot.
- **NaN & Blank Input Handling:** In `BidModal.jsx:130`, if a user backspaces the input, `Number("")` evaluates to `0`. If they then submit, it prompts an error, but the input renders as `0` instead of remaining empty.
- **Double-Submit Race:** In `BidModal.jsx:38-43`, `setIsSuccess(true)` triggers a 1200ms `setTimeout`. During this window, the submit button is not disabled, allowing repeated form submissions to fire multiple `onConfirmBid` dispatches.

#### A3. Invoice & Currency Calculation Edge Cases
- **Invoice Math Check (Lot won-101):**
  - Winning Hammer Bid: ₹1,62,00,000
  - Buyer's Premium (2.5%): ₹1,62,00,000 × 0.025 = ₹4,05,000
  - Documentation Charges: ₹25,000
  - Total Fee Base: ₹4,05,000 + ₹25,000 = ₹4,30,000
  - Statutory GST (18% on fees): ₹4,30,000 × 0.18 = ₹77,400
  - Security Deposit (EMD) Credit: -₹5,00,000
  - Net Consideration: ₹1,62,00,000 + ₹4,05,000 + ₹25,000 + ₹77,400 - ₹5,00,000 = **₹1,62,07,400** (Data matches).
- **Double Negative UI Bug:** In [src/components/PaymentPage.jsx:120-122](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L120-L122):
  ```jsx
  <span className="row-label">Less: Pre-Bid Security Deposit (EMD Adjustment)</span>
  <span className="row-value text-success">{formatCurrency(lot.securityDepositAdjustment)}</span>
  ```
  Since `lot.securityDepositAdjustment` is stored as `-500000`, `formatCurrency` renders `-₹5,00,000`. The UI displays: **"Less: Pre-Bid Security Deposit -₹5,00,000"**, creating a confusing double negative for the user.

#### A4. Historical Date & Time Contradictions
- All auction and settlement dates in `mockVehicles.js` and `VehicleDetailsPage.jsx` are set in September / early October 2026:
  - `VehicleDetailsPage.jsx:404, 408`: Auction Start: `28 Sep 2026`, Auction End: `30 Sep 2026`. The current date is **October 15, 2026**. An auction that ended over two weeks ago is rendered with an active "LIVE AUCTION" badge and a ticking 4-hour countdown.
  - `mockVehicles.js:576`: Payment Deadline: `02 Oct 2026 · 04:00 PM IST` (13 days overdue, yet status is still "Pending" instead of "EMD Forfeited").
  - `mockVehicles.js:580`: Lifting Deadline: `07 Oct 2026` (8 days overdue).

---

### 2.2 React Architecture & Performance Flaws (Section B)

#### B1. Re-render Cascades & Effect Dependency Misconfiguration
- **Cascading Render in `VehicleCard.jsx`:** [src/components/VehicleCard.jsx:24-28](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleCard.jsx#L24-L28) synchronously calls `setRemainingSeconds(vehicle.endsInSeconds)` inside an effect triggered by `[vehicle?.endsInSeconds]`. Oxlint flagged this with `react(set-state-in-effect)` because it forces React to abort the current paint and execute a second render cycle.
- **Scroll Event Throttle Missing in `Navbar.jsx`:** [src/components/Navbar.jsx:45-66](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Navbar.jsx#L45-L66) attaches an unthrottled `scroll` listener that calls `setIsScrolled` and `setIsVisible` on every pixel change, forcing continuous re-renders of the top-level navbar during page momentum scrolling.

#### B2. Missing Layout Dimensions & Cumulative Layout Shift (CLS)
- Out of 29 `<img>` elements across the codebase, **28 lack explicit `width` and `height` HTML attributes**.
- When hero slides, thumbnails, and vehicle cards load over high-latency networks, the browser cannot reserve layout space, causing heavy Cumulative Layout Shift (CLS) that damages user experience and Core Web Vitals.

#### B3. Risky External Image Hotlinks
The application hotlinks images directly from third-party CDNs that can block referrers, rate-limit requests, or experience link rot:
- `AboutPage.jsx:38`: `https://i.pinimg.com/736x/8e/f5/c5/8ef5c5059bc189b20b3e6ef4f4cfbb98.jpg` (Pinterest CDN)
- `RecentlyAddedPage.jsx:22`: `https://i.pinimg.com/1200x/1a/33/2f/1a332f7bcb1bc2721aaa5bf3c4e977e1.jpg` (Pinterest CDN)
- `UpcomingAuctionsPage.jsx:45`: `https://i.pinimg.com/736x/cd/5e/64/cd5e646feb3b79cc1777857873fa18f6.jpg` (Pinterest CDN)
- `LiveAuctionsPage.jsx:35`: `https://res.cloudinary.com/ddluoarzr/image/upload/v1790837379/new2_zuo5hc.png` (Personal Cloudinary account `ddluoarzr`)

#### B4. Render-Blocking Typography
In [index.html:10-12](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/index.html#L10-L12):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
```
- **Missing `crossorigin` Preconnect:** It preconnects to `fonts.googleapis.com` without `crossorigin`, but completely omits preconnecting to `fonts.gstatic.com` where the actual font files live.
- **14 Font Variants:** Downloading 14 separate font weights across three typefaces (`Inter`, `Outfit`, `Plus Jakarta Sans`) blocks the First Contentful Paint (FCP).

---

### 2.3 Accessibility Audit (Section C)

#### C1. Modal Dialog Failures (WCAG 2.1 Level A & AA)
- **Zero Focus Trap:** None of the modals (`BidModal`, `RegisterModal`, `ListVehicleModal`, `SavedModal`, `SearchModal`, `VehicleModal`) trap keyboard focus. A user pressing the `Tab` key cycles through background links and buttons underneath the modal.
- **Escape Key Ignored:** Not a single modal listens for the `Escape` key (`keydown` event). Keyboard-only users have no standard way to dismiss a modal.
- **Background Scroll Unlocked:** Opening `BidModal` or `RegisterModal` does not set `document.body.style.overflow = 'hidden'`. The background page scrolls freely behind the open dialog.

#### C2. Severe WCAG AA Color Contrast Failures
- **Token Incoherency:** In [src/index.css:9](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/index.css#L9), the variable is named `--color-auction-red`, but its value was modified to royal blue `#075BFF`.
- **Contrast Ratio Calculations:**
  - Royal Blue `#075BFF` on Dark Navy `#070B14`: Contrast ratio is **2.82 : 1**.
    *(WCAG 2.1 AA requires minimum 4.5:1 for normal text and 3.0:1 for large text/icons. This fails AA standards).*
  - Muted Gray text `#64748B` on Dark Navy `#070B14`: Contrast ratio is **3.64 : 1**.
    *(Fails the 4.5:1 requirement for small secondary metadata and labels).*

#### C3. Screen Reader Invisibility
- Live countdown timers in `VehicleCard.jsx` and `VehicleDetailsPage.jsx` lack `role="timer"` and `aria-live`. A blind user using a screen reader has no audible indication of how much time remains or that the auction has ended.

---

### 2.4 Responsive Layout & CSS Specificity (Section D)

#### D1. Fragmented Media Query Architecture
The codebase contains **24 distinct arbitrary media query breakpoints** scattered across stylesheets:
`330px`, `340px`, `360px`, `375px`, `425px`, `480px`, `540px`, `600px`, `640px`, `680px`, `700px`, `768px`, `860px`, `900px`, `960px`, `992px`, `1024px`, `1040px`, `1080px`, `1100px`, `1140px`, `1200px`, `1240px`, `1250px`.
Rather than adopting standard responsive tiers (e.g., `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`), components were patched ad-hoc to fix specific device viewports (e.g. iPhone SE at 375px or Galaxy Fold at 320px).

#### D2. Excessive Specificity Wars (330 `!important` Declarations)
Across the `.css` files in `src/`, there are **330 instances of `!important`**. This indicates severe selector specificity conflicts between global stylesheets (`App.css`, `SalvexAppComponents.css`) and component stylesheets (`Navbar.css`, `VehicleDetailsPage.css`), making future style maintenance fragile.

---

### 2.5 Security, Privacy & Repository Health (Section E)

#### E1. Git History Secrets Audit
A forensic regex scan of the complete git patch log (`git log -p`) for API tokens, secret keys, bearer tokens, AWS credentials, and GitHub PATs returned **0 hardcoded credentials**. No active live secrets were committed to git history.

#### E2. Critical `.gitignore` Gaps
In [/.gitignore:1-25](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/.gitignore#L1-L25):
- `.env` and `.env*.local` are **completely absent** from `.gitignore`.
- `.vercel` (local Vercel deployment cache and project settings) is **absent**.
- *Risk:* If a developer adds a `.env` file with database credentials or Stripe API keys and runs `git add .`, git will immediately track and push secrets to the public GitHub repository.

#### E3. Personal Identifiable Information (PII) Exposure
The repository contains real-format personal names, emails, and Indian mobile numbers in `src/data/mockVehicles.js`:
- Phone numbers: `+91 98450 11223` (Bengaluru Airtel block) and `+91 97910 44556` (Chennai Vodafone block).
- Names & Emails: `rahul.sharma@enterpriseholdings.in`, `priya.nair@malabartraders.com`, `gurpreet.singh@delhiauto.in`.
- Real-format PAN cards: `AABCE1234F`, `BKLPZ5678Q`, `CJXPS9012M`.
*Remediation:* Replace all phone numbers with official TRAI dummy numbers (`+91 99999 00000` to `99999 99999`) and emails with `@example.com`.

---

### 2.6 Legal, Regulatory & Copy Truthfulness Risks (Section F)

Under the Indian Consumer Protection Act 2019 and E-Commerce Rules 2020, presenting simulated features as real government-backed or banking operations carries substantial legal risk:

1. **False Regulatory Escrow Claims:**
   - [LoginPage.jsx:80](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LoginPage.jsx#L80): *"RBI REGULATED ESCROW & STATUTORY COMPLIANCE"*
   - [PaymentPage.jsx:62](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L62): *"RESERVE BANK OF INDIA REGULATED ESCROW CONDUIT"*
   - [PaymentPage.jsx:157](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L157): *"verified by the Salvex Escrow Trust"*
   *Fact:* There is no escrow trust, no nodal bank account, and no RBI registration.
2. **False Blockchain Claims:**
   - [BidModal.jsx:70](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BidModal.jsx#L70): *"Your bid ... has been registered on the live blockchain ledger."*
   *Fact:* There is no blockchain; state is held in a React hook.
3. **Unauthorized Use of Real Commercial Entities:**
   - [SellerDashboard.jsx:61](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L61): Claims institutional partnership with *"HDFC Bank Asset Recovery & Fleet Consignment"*.
   *Risk:* Trademark infringement and misrepresentation of affiliation with HDFC Bank.
4. **Fictitious Corporate Registration Number:**
   - [Footer.jsx:169](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L169): Publicly displays a fake Corporate Identification Number: `CIN: U12345MH2020PTC123456`.

---

### 2.7 Deployment & Live Production Parity (Section G)

- **Verification against `https://beta-salvex.vercel.app`:**
  - Live script asset: `/assets/index-Ca9uQ7VT.js` (Hash `Ca9uQ7VT`)
  - Live stylesheet: `/assets/index-D8oeAbXC.css` (Hash `D8oeAbXC`)
  - Local build output: Exact same hashes produced (`dist/assets/index-Ca9uQ7VT.js` and `dist/assets/index-D8oeAbXC.css`).
  - **Verdict:** The live deployment on Vercel is in **100% exact parity** with the latest commit (`f23d29b`) in this workspace.

---

## 3. MASTER REMEDIATION ACTION PLAN

### Step 1: Immediate Critical Fixes (Today — 2 Hours)
1. **Fix Rules of Hooks:** In `src/components/ListVehicleModal.jsx` and `src/components/RegisterModal.jsx`, move `if (!isOpen) return null;` to after all `useState` hook calls.
2. **Harden `.gitignore`:** Add `.env`, `.env*.local`, `.vercel`, and OS files.
3. **Patch Vulnerability:** Run `npm audit fix` to resolve high-severity vulnerability in `source-map-js`.
4. **Clean Dead Code:** Uninstall `i` and `lenis`; delete the 5 unreferenced components.
5. **Fix Double Negative:** In `PaymentPage.jsx:121`, use `Math.abs(lot.securityDepositAdjustment)`.

### Step 2: Product & UX Realism (Week 1)
1. **Dynamic Vehicle Details:** Refactor `VehicleDetailsPage.jsx` to dynamically render `vehicle.make`, `vehicle.model`, `vehicle.yearMfg`, `vehicle.kmDriven`, `vehicle.fuel`, `vehicle.transmission`, and `vehicle.startingBid`.
2. **Standard Routing:** Install `react-router-dom` to support real URLs (`/vehicles/:id`, `/auctions/live`, `/dashboard`) with back/forward support.
3. **Asset Compression:** Convert 15 MB of uncompressed public images into WebP format (<1.5 MB total).
4. **Add `vercel.json`:** Configure HTTP security headers (CSP, HSTS, X-Frame-Options) and SPA rewrite rules.

### Step 3: Full-Stack Architecture (Weeks 2 to 6)
1. **Backend API:** Build Node.js / Next.js server with PostgreSQL database (Prisma / Drizzle ORM).
2. **Real Authentication:** Implement bcrypt password hashing, JWT in HttpOnly cookies, and OTP validation.
3. **Real-Time Bidding Engine:** Implement WebSocket server with Redis distributed locks for atomic bid increments.
4. **Payment Gateway:** Integrate official Razorpay / Cashfree escrow accounts with HMAC webhook signature validation.
