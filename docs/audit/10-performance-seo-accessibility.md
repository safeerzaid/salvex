# 10 - PERFORMANCE, SEO & ACCESSIBILITY AUDIT

**Audited Target:** `dist/` bundle analysis, `index.html`, image assets, component DOM  
**Auditor:** Senior Staff Engineer

---

## 1. Bundle Size & Performance Analysis

### Production Build Metrics (`npm run build`):
- `dist/index.html`: **1.01 kB** (Gzip: 0.56 kB)
- `dist/assets/index-DgqMU6Nm.css`: **209.12 kB** (Gzip: 34.92 kB)
- `dist/assets/index-CdHrfU2B.js`: **686.63 kB** (Gzip: 193.72 kB)

```
Vite Build Warning:
(!) Some chunks are larger than 500 kB after minification.
dist/assets/index-CdHrfU2B.js is 686.63 kB (Gzip: 193.72 kB)
```

### Critical Performance Bottlenecks:
1. **Total Absence of Route Code-Splitting:**
   In `src/App.jsx:2-45`, all 36 page components, modals, and data structures are imported statically at the top of the file:
   ```javascript
   import VehiclesPage from './components/VehiclesPage';
   import VehicleDetailsPage from './components/VehicleDetailsPage';
   import AdminPanel from './components/AdminPanel';
   // ... 30+ static imports
   ```
   A first-time visitor landing on the homepage downloads the code for the entire `AdminPanel`, `SellerDashboard`, `PaymentPage`, and all modals upfront.
   - **Remediation:** Implement `React.lazy()` and `Suspense` for all top-level route views.
2. **Uncompressed Static Image Assets:**
   The `public/images/` directory contains **20 images totaling over 16 MB**:
   - `hero.png`: **1.84 MB**
   - `new.png`: **1.84 MB**
   - `new2.png`: **1.69 MB**
   - `about-facility.jpg`: **953 KB**
   - `swift-zxi-plus.jpg`: **944 KB**
   - `logo.jpeg` & `logo.png`: **342 KB each**
   None of these assets are served in modern WebP or AVIF formats. On mobile networks (3G/4G), downloading the hero graphic alone will introduce multi-second Largest Contentful Paint (LCP) delays.
   - **Remediation:** Convert all PNG/JPEG images to WebP/AVIF and resize them for standard responsive display widths (e.g. 1920w, 1200w, 640w).

---

## 2. Search Engine Optimization (SEO) Evaluation

### Current Head Configuration (`index.html:1-12`):
```html
<title>Salvex Auction — Online Vehicle Auction Platform | Find. Bid. Win.</title>
<meta name="description" content="Discover used, damaged, salvage and auction vehicles from trusted sources through a transparent online bidding platform." />
<meta name="theme-color" content="#070B14" />
```

### SEO Audit Findings:
1. **Client-Side Rendering (CSR) Lockout:**
   Because all pages are rendered dynamically via React SPA inside `<div id="root"></div>`, standard web crawlers that do not execute heavy JavaScript will see only the root HTML shell.
2. **No Per-Route Dynamic Metadata:**
   When navigating to `/vehicles/salvex-103` (2023 Land Rover Defender 110), the document `<title>` remains statically set to the generic homepage title. No OpenGraph (`og:title`, `og:image`, `og:description`) or Twitter Card meta tags are updated.
   - **Impact:** Sharing a vehicle link on WhatsApp, LinkedIn, or Twitter produces an uninformative generic homepage preview.
3. **Missing SEO Essentials:**
   - No `sitemap.xml` exists in `/public`.
   - No `robots.txt` exists in `/public`.
   - No JSON-LD Schema structured data (`schema.org/Product` or `schema.org/Vehicle`) is injected.

---

## 3. Accessibility (a11y) Evaluation

| Criteria | Audit Finding | Severity | Evidence |
| :--- | :--- | :---: | :--- |
| **Heading Hierarchy** | Single `<h1>` per page view. | **Compliant** | Evaluated in `Hero.jsx:72`, `VehicleDetailsPage.jsx:327`. |
| **Color Contrast** | Dark theme uses high-contrast text (`#FFFFFF` on `#070B14`); light theme uses `#0B1220` on `#FFFFFF`. | **Compliant** | Meets WCAG AA contrast ratio (> 4.5:1). |
| **Interactive Modals** | Modals do not trap focus or bind the `Escape` key. | **Deficient** | Focus remains on the background body while dialogs are open. |
| **Form Inputs** | Some inputs rely solely on `placeholder` without explicit `<label>` or `aria-label`. | **Deficient** | Example: `VehicleDetailsPage.jsx:493` (`<input type="number" placeholder="1,63,00,000">`). |
| **Icon Buttons** | Several action buttons lack `aria-label`. | **Deficient** | Example: Next/Prev arrows in `VehicleDetailsPage.jsx:266` omit screen-reader descriptions. |
| **Reduced Motion** | Honors user accessibility preferences. | **Compliant** | `src/hooks/useScrollAnimations.js:22` checks `window.matchMedia('(prefers-reduced-motion: reduce)')`. |
