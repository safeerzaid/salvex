# 08 - CODE QUALITY, TECH DEBT & CODE SMELLS

**Audited Target:** `src/` (All components, stylesheets, and configs)  
**Auditor:** Senior Staff Engineer

---

## 1. Automated Linter Results & Code Hygiene

The project utilizes `oxlint` (configured via `.oxlintrc.json`). Running `npm run lint` yields:
- **0 Compilation / Syntax Errors**
- **105 Lint Warnings** across 51 source files.

```
Summary: Found 105 warnings and 0 errors in 204ms on 51 files.
```

### Categorization of the 105 Warnings:
1. **Unused Imports & Dead Identifiers (68 occurrences):**
   Dozens of Lucide icons and helper functions are imported but never referenced in JSX.
   - Example: `src/components/LiveAuctionsPage.jsx:5-20` imports `Flame`, `Heart`, `Gavel`, `ArrowRight`, `Fuel`, `Gauge`, `CheckCircle2`, `ChevronDown`, `Sparkles`, and `Zap` without using any of them.
   - Example: `src/components/AdminPanel.jsx:13` imports `Pause` unused.
   - Example: `src/components/UpcomingAuctionsPage.jsx:78` declares `formatCurrency` but never uses it.
2. **Synchronous `setState` Inside `useEffect` (21 occurrences):**
   Triggers cascading re-renders and causes the React Compiler to skip optimizations.
   - Example: `src/components/VehicleDetailsPage.jsx:70` (`setCurrentBid(base)`).
   - Example: `src/components/VehicleDetailsPage.jsx:83` (`setSecondsRemaining(0)`).
   - Example: `src/components/AdminPanel.jsx:33` (`setLiveLots(propLiveLots)`).
3. **Missing Hook Dependencies (`exhaustive-deps`) (16 occurrences):**
   - Example: `src/components/VehicleDetailsPage.jsx:74`: `useEffect` references `vehicle` and `minIncrement` but omits them from the dependency array.

---

## 2. Major Code Smells & Architectural Anti-Patterns

### Smell 1: The "God Component" Monolith
- **Location:** `src/components/VehicleDetailsPage.jsx` (1,356 lines, 61.9KB)
- **Problem:** Single component handles:
  - Image gallery switching and fullscreen modal state.
  - Active tab navigation (Details, Inspection, Auction, Documents, History, Location).
  - Bid increment math and validation rules.
  - Live countdown interval timers.
  - 150-point inspection modal rendering.
  - Bid confirmation modal rendering.
  - Toast message timers and clipboard copying.
- **Impact:** Any change to a button or layout requires editing a 1,356-line file. High risk of introducing regressions.

### Smell 2: Massive Unpartitioned CSS Files
- **Location:** `src/App.css` (3,900+ lines, 91.9KB) and `SalvexAppComponents.css` (58.0KB)
- **Problem:** Styles for dozens of distinct pages are lumped into single massive stylesheets. Selectors frequently overlap, and specificity wars are resolved with `!important`.
- **Impact:** Makes global style refactoring extremely hazardous. Deleting an unused class in `App.css` risks breaking layouts on unrelated pages.

### Smell 3: Hardcoded Color Inversion
- **Location:** `src/index.css:9` and across 15 CSS files
- **Problem:** `--color-auction-red` is defined as `#075BFF` (Royal Blue). Components style blue buttons using class names like `.btn-primary-place-bid` and `.text-auction-red`.
- **Impact:** Misleads developers and creates confusion between variable names and rendered colors.

### Smell 4: Duplicated Currency & Countdown Formatting Logic
- **Location:** Re-declared across 8 separate components:
  - `src/components/VehicleDetailsPage.jsx:103, 110`
  - `src/components/PaymentPage.jsx:39`
  - `src/components/SellerDashboard.jsx:33`
  - `src/components/AdminPanel.jsx:46`
  - `src/components/ListVehiclePage.jsx:93`
  - `src/components/UpcomingAuctionsPage.jsx:78`
  - `src/components/RecentlyAddedPage.jsx:65`
- **Impact:** Inconsistent formatting across pages (some use `Intl.NumberFormat`, others use string concatenation).

---

## 3. Prioritized Tech Debt List

| Priority | Issue Description | Impact | Estimated Effort |
| :---: | :--- | :--- | :---: |
| **HIGH** | **Break down `VehicleDetailsPage.jsx`** into subcomponents (`VehicleGallery`, `VehicleSpecs`, `BiddingPanel`, `VehicleTabs`). | Isolates layout from business logic; unlocks safe redesigns. | 1.5 Days |
| **HIGH** | **Replace virtual routing in `App.jsx` with React Router v7 / TanStack Router.** | Enables real URLs, browser history, and deep-linking. | 2 Days |
| **HIGH** | **Centralize shared utility functions** (`formatCurrency`, `formatCountdown`, `calculateTaxes`) into `src/utils/formatters.js`. | Eliminates 8 instances of duplicated code. | 0.5 Days |
| **MEDIUM**| **Clean up 105 Oxlint warnings** (remove unused Lucide imports, resolve `useEffect` cascading renders). | Improves performance and build hygiene. | 0.5 Days |
| **MEDIUM**| **Remove ghost dependencies** (`"i"` and `"lenis"`) from `package.json`. | Reduces supply chain risk and dependency bloat. | 15 Mins |
| **MEDIUM**| **Harmonize CSS design tokens** (rename `--color-auction-red` to `--color-brand-blue` or `--color-primary-accent`). | Eliminates semantic naming contradictions. | 0.5 Days |
| **LOW** | **Implement code-splitting via `React.lazy()`** in `App.jsx`. | Reduces initial bundle size from 686KB to <200KB. | 0.5 Days |
