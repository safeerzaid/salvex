# 13 - COMPREHENSIVE RISK REGISTER

**Audited Target:** `beta-salvex`  
**Auditor:** Senior Staff Engineer

---

## 1. Top 10 Technical & Business Risks (Ranked by Severity)

```mermaid
quadrantChart
    title Risk Severity vs. Implementation Complexity
    x-axis Low Complexity --> High Complexity
    y-axis Low Severity --> High Severity
    quadrant-1 High Risk, High Effort (Strategic Debt)
    quadrant-2 High Risk, Low Effort (Immediate Fixes)
    quadrant-3 Low Risk, Low Effort (Quick Wins)
    quadrant-4 Low Risk, High Effort (Postpone)

    "1. High Redesign Friction": [0.85, 0.95]
    "2. In-Memory Ephemeral State": [0.80, 0.90]
    "3. Zero Access Guarding on Admin": [0.25, 0.92]
    "4. Fragile Virtual String Routing": [0.65, 0.85]
    "5. Monolithic God Component": [0.60, 0.78]
    "6. Unoptimized 16MB Assets": [0.30, 0.70]
    "7. Total Absence of Automated Tests": [0.75, 0.72]
    "8. Accidental Ghost Dependency 'i'": [0.05, 0.60]
    "9. Token Naming Inversion": [0.35, 0.55]
    "10. 105 Oxlint Warnings": [0.40, 0.45]
```

---

## 2. Risk Detail & Mitigation Matrix

### Risk 1: High Redesign Friction due to Coupled CSS & Markup
- **Severity:** **CRITICAL** (Impact: 9/10, Likelihood: 10/10)
- **Evidence:** `App.css` (91KB), `SalvexAppComponents.css` (58KB), `VehicleDetailsPage.css` (28KB). Deeply nested vanilla CSS selectors tightly coupled to exact DOM hierarchies.
- **Consequence:** Redesigning layouts as requested by clients will require extensive CSS rewriting, risking layout regressions across other pages.
- **Recommended Fix:** Decouple pages into modular UI components and transition styling toward utility CSS (Tailwind) or CSS Modules.

### Risk 2: Ephemeral State & Zero Data Persistence
- **Severity:** **CRITICAL** (Impact: 9/10, Likelihood: 10/10)
- **Evidence:** `src/App.jsx:63-64` (`useState(liveVehiclesData)`).
- **Consequence:** Any browser refresh (`F5`) wipes all user bids, watchlist updates, listing submissions, and admin actions.
- **Recommended Fix:** Integrate a backend persistence layer and use TanStack Query with optimistic UI mutations.

### Risk 3: Zero Authentication / Authorization on Administrative Console
- **Severity:** **HIGH** (Impact: 9/10, Likelihood: 8/10)
- **Evidence:** `src/App.jsx:461-468` and `src/components/AdminPanel.jsx:23`.
- **Consequence:** If deployed publicly, any user can access the admin operations desk and approve KYC or extend auctions.
- **Recommended Fix:** Implement JWT authentication stored in `HttpOnly` cookies and protect administrative views behind a role-based route guard.

### Risk 4: Fragile Virtual Routing (No Real URLs)
- **Severity:** **HIGH** (Impact: 8/10, Likelihood: 10/10)
- **Evidence:** `src/App.jsx:68` (`currentRoute` string state).
- **Consequence:** Users cannot share links to specific vehicles, browser back/forward buttons break the navigation flow, and SEO crawlers cannot index individual lots.
- **Recommended Fix:** Adopt React Router v7 with dynamic URL segments (`/vehicles/:id`).

### Risk 5: "God Component" Maintenance Hazard in Vehicle Details
- **Severity:** **HIGH** (Impact: 8/10, Likelihood: 9/10)
- **Evidence:** `src/components/VehicleDetailsPage.jsx` (1,356 LOC).
- **Consequence:** High cognitive overhead for engineers; simple edits risk breaking countdown timers, increment calculations, or modal states.
- **Recommended Fix:** Split into four subcomponents: `VehicleGallery`, `VehicleSpecs`, `BiddingPanel`, and `VehicleTabs`.

### Risk 6: Unoptimized 16MB Image Assets Causing Mobile Load Latency
- **Severity:** **MEDIUM** (Impact: 7/10, Likelihood: 8/10)
- **Evidence:** `public/images/hero.png` (1.84MB), `new.png` (1.84MB), `new2.png` (1.69MB).
- **Consequence:** Severe bandwidth usage and poor Largest Contentful Paint (LCP) performance on mobile 3G/4G networks.
- **Recommended Fix:** Compress assets and convert them to modern WebP / AVIF formats.

### Risk 7: Total Absence of Automated Testing
- **Severity:** **MEDIUM** (Impact: 7/10, Likelihood: 7/10)
- **Evidence:** Zero test files or test runner configs exist in the repository.
- **Consequence:** Refactoring or redesigning UI components risks introducing regressions into bidding and tax calculations.
- **Recommended Fix:** Install Vitest and write unit tests for critical business math (`BID_INCREMENT`, tax calculations, timer logic).

### Risk 8: Supply Chain Vulnerability from Accidental Typo Package `"i"`
- **Severity:** **MEDIUM** (Impact: 6/10, Likelihood: 4/10)
- **Evidence:** `package.json:14` (`"i": "^0.3.7"`).
- **Consequence:** Introduces unnecessary supply chain risk and dependency bloat.
- **Recommended Fix:** Run `npm uninstall i` to remove the package immediately.

### Risk 9: Semantic Token Contradiction in Design System
- **Severity:** **LOW** (Impact: 4/10, Likelihood: 8/10)
- **Evidence:** `src/index.css:9` (`--color-auction-red: #075BFF`).
- **Consequence:** Blue UI elements are referenced by red class names, confusing incoming developers.
- **Recommended Fix:** Rename variable to `--color-primary-brand` or `--color-brand-blue`.

### Risk 10: 105 Unresolved Oxlint Warnings
- **Severity:** **LOW** (Impact: 3/10, Likelihood: 6/10)
- **Evidence:** `npm run lint` yields 105 warnings (unused Lucide imports and synchronous `setState` inside `useEffect`).
- **Consequence:** Code clutter, unused imports in bundle, and unoptimized React compiler passes.
- **Recommended Fix:** Clean up unused imports and refactor `useEffect` hooks to derive state during render.
