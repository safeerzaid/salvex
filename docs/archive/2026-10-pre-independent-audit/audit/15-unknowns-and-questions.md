# 15 - UNKNOWNS, CODE BLIND SPOTS & STAKEHOLDER QUESTIONS

**Audited Target:** `beta-salvex`  
**Auditor:** Senior Staff Engineer

---

## 1. What Cannot Be Determined from Code Alone (Blind Spots)

1. **Target Backend Architecture & Data Contracts:**
   There are no API specifications, Swagger/OpenAPI files, or backend schemas in the repository. We do not know if the planned backend will be Node.js, Python, Go, Java, or an external BaaS (Supabase / Firebase).
2. **Real Payment Gateway Integration:**
   `PaymentPage.jsx` models offline RTGS bank transfers with UTR submission. It is unknown whether the client intends to integrate a digital payment gateway (Razorpay, Cashfree, PayU) or rely solely on manual bank wire verification.
3. **Real-Time Auction Transport Protocol:**
   Bidding is currently simulated with client-side timers. It is unknown whether the production platform will use standard WebSockets (`ws://`), Server-Sent Events (SSE), or a managed service like Pusher or Ably.
4. **Planned Design Evolution:**
   The client stated the design is "not final," but no Figma links, design system guidelines, or redesign briefs exist in the repository to indicate the direction of future visual changes.
5. **Production Hosting & Deployment Environment:**
   No Dockerfile, Terraform scripts, or cloud configurations (AWS, GCP, Vercel) exist in the codebase.

---

## 2. Questions to Ask the Previous Developer, Team, or Client

### Architecture & Backend:
1. *Is there an existing backend API repository or backend team working on this project? If so, where are the API specifications (OpenAPI / Swagger) located?*
2. *What is the planned communication protocol for live auction countdowns and bids (WebSockets, Server-Sent Events, or polling)?*
3. *What database is planned for vehicle inventory and bids (PostgreSQL, MongoDB, etc.)?*

### Product & Design:
4. *What specific areas of the current visual design are slated for change? Are there Figma files or brand guidelines that we should align with?*
5. *Should we adopt a utility-first styling system (like TailwindCSS) or CSS Modules during the redesign to reduce styling friction?*
6. *What payment gateways (Razorpay, Cashfree, manual RTGS escrow) will be supported for Earnest Money Deposits (EMD) and winning hammer settlements?*

### Infrastructure & Operations:
7. *Where will the application be hosted in staging and production (Vercel, AWS ECS, Netlify, DigitalOcean)?*
8. *What cloud storage provider (AWS S3, Cloudflare R2, Google Cloud Storage) will be used for vehicle photos and inspection condition reports?*
9. *What are the authentication requirements (Email + Password, Mobile OTP via SMS, Google OAuth, or Enterprise SSO)?*

---

## 3. Self-Check & Audit Limitations

Every source file in `src/`, configuration file in the project root, and asset directory in `public/` was analyzed during this audit:
- **Analyzed:**
  - `src/App.jsx`, `src/main.jsx`, `src/constants.js`, `src/index.css`, `src/App.css`
  - All 36 JSX components in `src/components/` and `src/components/ui/`
  - All 11 CSS stylesheets in `src/components/`
  - `src/data/mockVehicles.js`
  - `src/hooks/useScrollAnimations.js`
  - `src/utils/scrollHelper.js`
  - `package.json`, `package-lock.json`, `vite.config.js`, `.oxlintrc.json`, `index.html`
  - `public/` assets, images, and SVG icons
  - Git commit history and branch status
- **Excluded:**
  - `node_modules/` (standard third-party external code).
  - `dist/` (compiled build output generated during audit verification).
  - Pre-existing markdown reports in root (`AUDIT_REPORT.md`, `AUDIT_CLAIMS.md`, `PHASE2_REPORT.md`) were noted but the actual source code was audited directly as the single source of truth.
