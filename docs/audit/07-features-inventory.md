# 07 - COMPLETE FEATURES INVENTORY & IMPLEMENTATION MATRIX

**Audited Target:** All UI flows in `src/`  
**Auditor:** Senior Staff Engineer

---

## 1. Feature Status Classification

Features are classified according to strict operational criteria:
- **Complete:** Real functionality executed completely (client-side interactive).
- **Partial:** UI interacts, but steps or inputs are simulated.
- **Mocked:** UI renders authentic data, but all data is hardcoded from mock files with zero server communication.
- **Fake / Cosmetic:** UI elements appear interactive (buttons, toggles, forms), but execute no real operation or state change.

---

## 2. Feature Inventory Matrix

| Feature Name | Status | Files Involved | Description & Implementation Reality |
| :--- | :---: | :--- | :--- |
| **Startup Preloader** | **Complete** | `src/components/ui/PageLoader.jsx` | Animated branded preloader with progress bar and entrance animation. |
| **Navbar & Navigation** | **Complete** | `src/components/Navbar.jsx` | Two-tier responsive navbar, auto-hide on downward scroll, mobile drawer menu. |
| **Hero Image Carousel** | **Complete** | `src/components/Hero.jsx` | 3-slide auto-advancing slideshow with dots and CTA buttons. |
| **Faceted Marketplace Search**| **Partial** | `src/components/SearchPanel.jsx`, `VehiclesPage.jsx` | Filters inventory by Make, Vehicle Type, Location, Year, Price Range. Filter operates in memory on 6 mock vehicles. |
| **Vehicle Card Display** | **Complete** | `src/components/VehicleCard.jsx` | Displays countdown, bid count, fuel, location, and condition tags. |
| **Watchlist / Saved Vehicles** | **Complete (In-Memory)**| `src/App.jsx:144`, `SavedModal.jsx` | Heart icon toggles vehicle ID in `savedIds` array; opens slide-out drawer. Resets on page reload. |
| **Live Bidding Submission** | **Complete (In-Memory)**| `src/components/VehicleDetailsPage.jsx:123`, `BidModal.jsx` | Validates minimum increment, updates `currentBid` and `bidCount` in memory, shows toast. |
| **Anti-Sniping Overtime (+120s)**| **Complete (In-Memory)**| `src/App.jsx:175`, `AdminPanel.jsx:68` | Extends `endsInSeconds` by 120s; immediately updates live countdown timers. |
| **Vehicle Photo Gallery** | **Complete** | `src/components/VehicleDetailsPage.jsx:212` | 5 thumbnail views (Front, Rear, Side, Interior, Engine), prev/next arrows, active indicator. |
| **Condition Report Modal** | **Mocked** | `src/components/VehicleDetailsPage.jsx:391` | Opens 150-point inspection checklist modal. Checklist scores are hardcoded. |
| **Share Listing Link** | **Complete** | `src/components/VehicleDetailsPage.jsx:148` | Copies `window.location.href` to clipboard with visual confirmation. |
| **Auction Calendar Reminders**| **Partial** | `src/components/UpcomingAuctionsPage.jsx:68` | Clicking "Set Reminder" triggers a success toast, but does not schedule notifications or export `.ics` calendar files. |
| **Consignor Listing Wizard** | **Partial (Mocked)** | `src/components/ListVehiclePage.jsx` | 5-step wizard with form validation. Submitting triggers an 800ms loading spinner and redirects to seller dashboard. Data is not added to catalog. |
| **Role-Based Authentication** | **Mocked** | `src/components/LoginPage.jsx` | Allows signing in as Bidder, Consignor, or Super Admin. Any password works; hardcoded strings simulate suspended/pending accounts. |
| **Bidder Dashboard Analytics** | **Mocked** | `src/components/BidderDashboard.jsx` | Shows active bids, won lots, documents, wallet balance, and notifications. Data is static. |
| **Invoice & Settlement Breakdown**| **Partial (Mocked)** | `src/components/PaymentPage.jsx` | Dynamically calculates 2.5% Buyer's Premium, 18% GST, and EMD deduction from winning bid. |
| **Simulated RTGS Payment** | **Mocked** | `src/components/PaymentPage.jsx:52` | Accepts UTR number, waits 1.2s, marks invoice "Paid", unlocks gate pass. |
| **Yard Lifting & Gate Pass** | **Partial (Mocked)** | `src/components/VehicleLiftingPage.jsx` | Displays authorized release dossier with QR code, yard map, and 4-stage dispatch timeline. "Simulate Gate Scan" clears pass. |
| **Consignor Sales Dashboard** | **Mocked** | `src/components/SellerDashboard.jsx` | Displays consignment portfolio, liquidation rate (84%), and payout statements. |
| **Admin Command Center** | **Partial (In-Memory)**| `src/components/AdminPanel.jsx` | Allows reviewing and approving pending KYC documents, inspecting seller inventory, and extending live lots. |
| **FAQ Accordions** | **Complete** | `src/components/FaqPage.jsx` | Collapsible FAQ items across General, Bidding, Payments, Delivery categories. |
| **Multi-Tab Legal Policies** | **Complete** | `src/components/LegalPage.jsx` | Tabs for Terms & Conditions, Privacy Policy, Refund Policy, and Auction Rules. |

---

## 3. Deceptive / Cosmetic Features in the UI

The following features appear fully functional to users, but are actually simulated:

1. **Currency Selector Dropdown (`Navbar.jsx:32-40`):**
   Displays INR, USD, AED, and EUR. Selecting a foreign currency changes the dropdown label, but **does not convert any prices across the site** (all prices remain in hardcoded INR).
2. **Document Download Buttons (`VehicleDetailsPage.jsx`, `PaymentPage.jsx`):**
   Buttons labeled "Download Inspection Report (PDF)" or "Download Tax Invoice" trigger dummy alerts or empty handlers instead of downloading real PDF files.
3. **Photo Upload Dropzone (`ListVehiclePage.jsx:42-49`):**
   Clicking upload boxes does not trigger file selectors; it toggles boolean flags on pre-populated state.
4. **KYC Verification Submission (`RegisterModal.jsx`):**
   Submitting Aadhaar/PAN cards displays a success screen, but uploads no documents.
