# 01 - PROJECT OVERVIEW AND REPOSITORY STRUCTURE

**Audited Target:** `beta-salvex`  
**Location:** `c:\Users\safeer\Desktop\clixdot\salvex\beta-salvex`  
**Version:** `new@0.0.0` (Private)

---

## 1. Executive Concept & Business Domain

**Salvex Auction** is designed as a digital auction, liquidation, and remarketing exchange tailored for the Indian automotive market. It is focused on:
1. **Total Loss, Salvage & Damaged Assets:** Vehicles originating from insurance write-offs, flood damage, accidental impact, and mechanical failure.
2. **Bank Repossessions & Consignment Vehicles:** Fleet liquidations, NBFC repossession lots, and commercial dealer trade-ins.
3. **Clean Title Used Vehicles:** Pre-owned luxury sedans, SUVs, and commercial trucks auctioned to dealers and retail buyers.

### Target Personas & Primary User Journeys
1. **Registered Bidders / Buyers (Automotive Dismantlers, Workshops, Resellers):**
   - Discovers lots via faceted search (Make, Fuel, Location, Damage condition, Price).
   - Examines detailed technical specifications, inspection scores, high-resolution damage photographs, and RTO status.
   - Places live bids with minimum incremental steps (₹10,000 standard increment defined in `src/constants.js:2`).
   - Tracks active, winning, and outbid lots in `BidderDashboard.jsx`.
   - Downloads settlement statements, pays platform premiums and winning bids via simulated RTGS in `PaymentPage.jsx`, and receives a digital gate pass in `VehicleLiftingPage.jsx`.
2. **Institutional & Private Consignors / Sellers:**
   - Onboards vehicles through a 5-step listing wizard in `ListVehiclePage.jsx`.
   - Monitors consignment performance, reserve price fulfillment, and liquidation status in `SellerDashboard.jsx`.
3. **Auction Operations & Fleet Desk (Admins):**
   - Monitors active auction counters, executes 120-second anti-sniping extensions, approves pending KYC verifications, and manages lot clearance via `AdminPanel.jsx`.

---

## 2. Current Project Stage: Prototype vs. Production-Ready

### Evidence Analysis:
| Criteria | Production Standard | `beta-salvex` Reality | Status |
| :--- | :--- | :--- | :--- |
| **Backend Integration** | REST/GraphQL APIs, WebSockets | **Zero network requests.** No `fetch`, `axios`, or WebSocket calls found in `src/`. | **Prototype** |
| **Data Persistence** | Relational / Document DB, Redis | State stored in React component memory (`useState`) initialized with `mockVehicles.js`. | **Prototype** |
| **Authentication & RBAC** | JWT/Sessions, OAuth, MFA, Secure Cookies | Password or OTP forms authenticate purely via `setTimeout` checks (`src/components/LoginPage.jsx:36-56`). | **Prototype** |
| **Routing & Deep Linking** | URL Pathing (`/vehicles/123`), SSR/SSG | Custom internal string router (`currentRoute === 'vehicles'`). Refreshing resets to root. | **Prototype** |
| **Financial Settlements** | Razorpay, Stripe, Escrow API integration | UTR input field simulation (`src/components/PaymentPage.jsx:52-62`). | **Prototype** |
| **Visual Polish & Styling** | Consistent UI design system | Extremely detailed custom CSS with micro-interactions, responsive grids, and animations. | **High-Fidelity** |

**Conclusion:** The codebase is an **advanced high-fidelity frontend interactive prototype**. The UI layouts and user journeys are complete in concept, but there is no underlying backend or persistence.

---

## 3. Complete File & Directory Structure

```
beta-salvex/
├── .git/                                 # Git version control metadata
├── .gitignore                            # Standard Node/Vite git ignore file
├── .oxlintrc.json                        # Oxlint linter configuration (104 active rules)
├── index.html                            # Application HTML entry point with Google Fonts (Inter, Outfit, Plus Jakarta Sans)
├── package.json                          # Package definition, scripts, and runtime dependencies
├── package-lock.json                     # Dependency lockfile
├── vite.config.js                        # Vite bundler configuration with @vitejs/plugin-react
├── logo.jpeg                             # Root branding image asset (342KB)
├── public/                               # Static assets served as-is by Vite
│   ├── favicon.svg                       # Platform browser favicon
│   ├── icons.svg                         # SVG symbol definitions
│   ├── salvex_hero_bg.jpg                # Dark high-resolution hero background
│   ├── assets/                           # Legacy boilerplate assets (react.svg, vite.svg)
│   └── images/                           # High-resolution vehicle photography & brand logos
│       ├── about-facility.jpg            # Corporate inspection facility image
│       ├── audi-rs6.jpg                  # Audi RS6 Avant lot photography
│       ├── bmw-m4.jpg                    # BMW M4 Competition lot photography
│       ├── defender-110.jpg              # Land Rover Defender 110 lot photography
│       ├── hero-bg.jpg                   # Main hero banner fallback
│       ├── hero.png                      # Desktop hero vehicle graphic
│       ├── hero_daylight_mercedes.jpg    # Mercedes daylight showcase image
│       ├── hero_porsche_gt3.jpg          # Porsche 911 GT3 RS hero slide
│       ├── lg.png                        # Header brand logo file (342KB)
│       ├── logo.png                      # Alternate brand logo
│       ├── mercedes-g63.jpg              # Mercedes-AMG G63 lot photography
│       ├── mercedes-sclass.jpg           # Mercedes-Benz S-Class lot photography
│       ├── mobile_hero_car.jpg           # Mobile-optimized hero vehicle asset
│       ├── new.png                       # Primary transparent hero car graphic
│       ├── new2.png                      # Secondary hero presentation asset
│       ├── porsche-gt3.jpg               # Porsche GT3 lot photo
│       ├── salvex-new-logo.png           # Vectorized Salvex brand logo
│       ├── swift-interior.jpg            # Maruti Swift cabin condition inspection photo
│       ├── swift-zxi-plus.jpg            # Maruti Swift ZXi salvage lot photo
│       └── whitelogo.png                 # Monochromatic white logo for dark footers
├── src/                                  # Application React source code
│   ├── App.css                           # Primary global application CSS (91KB, 3,900+ lines)
│   ├── App.jsx                           # Application root, state store, virtual routing switchboard
│   ├── constants.js                      # Core business constants (BID_INCREMENT = 10000)
│   ├── index.css                         # CSS reset, root color tokens, base button primitives
│   ├── main.jsx                          # React DOM entry point with React.StrictMode
│   ├── components/                       # UI components (pages, sections, modals, widgets)
│   │   ├── AboutPage.css                 # About page styles
│   │   ├── AboutPage.jsx                 # Full-page About Salvex company overview
│   │   ├── AboutSection.jsx              # Homepage compact About Salvex preview section
│   │   ├── AdminPanel.jsx                # Multi-role operational command desk (642 lines)
│   │   ├── BidModal.jsx                  # Quick bid submission dialog with increment pills
│   │   ├── BidderDashboard.jsx           # Buyer personal dashboard (bids, won lots, documents) (873 lines)
│   │   ├── BiddingRulesPage.jsx          # Comprehensive auction guidelines and bid compliance rules
│   │   ├── BuyerCta.jsx                  # Homepage conversion call-to-action for buyers
│   │   ├── ContactPage.css               # Contact page styles
│   │   ├── ContactPage.jsx               # Support inquiry, ticketing, and regional hub directory
│   │   ├── ContactSection.jsx            # Homepage compact contact and support strip
│   │   ├── FaqPage.css                   # FAQ page styles
│   │   ├── FaqPage.jsx                   # Collapsible accordion FAQ page across 5 categories
│   │   ├── Footer.jsx                    # Comprehensive corporate footer with sitemap and trust links
│   │   ├── Hero.jsx                      # Homepage hero with auto-advancing slides and CTA triggers
│   │   ├── HowItWorks.jsx                # Homepage 4-step auction workflow infographic
│   │   ├── HowItWorksPage.css            # Extended how-it-works page styles
│   │   ├── HowItWorksPage.jsx            # In-depth buyer/seller guide with timeline graphics
│   │   ├── LegalPage.css                 # Legal policy tab styling
│   │   ├── LegalPage.jsx                 # Multi-tab policy viewer (Privacy, Terms, Refund, Auction Policy)
│   │   ├── ListVehicleModal.jsx          # Modal-based vehicle listing intake
│   │   ├── ListVehiclePage.css           # 5-step listing page styling
│   │   ├── ListVehiclePage.jsx           # 5-step consignor vehicle onboarding wizard (548 lines)
│   │   ├── LiveAuctions.jsx              # Homepage live auctions carousel/grid
│   │   ├── LiveAuctionsPage.jsx          # Dedicated live auction marketplace with multi-filter rail (482 lines)
│   │   ├── LoginPage.css                 # Authentication styling
│   │   ├── LoginPage.jsx                 # Role-based login and demo persona switcher
│   │   ├── Navbar.css                    # Two-tier navigation bar styling
│   │   ├── Navbar.jsx                    # Header with auto-hide on scroll, search input, and mobile drawer
│   │   ├── PageLoader.jsx                # Legacy loader stub
│   │   ├── PaymentPage.css               # Payment portal styles
│   │   ├── PaymentPage.jsx               # Won lot checkout, tax breakdowns, and UTR settlement
│   │   ├── PortalBar.jsx                 # Top bar portal indicator
│   │   ├── RecentlyAdded.jsx             # Legacy component reference
│   │   ├── RecentlyAddedPage.jsx         # Standalone view for new lots added in last 48 hours
│   │   ├── RecentlyAddedVehicles.jsx     # Homepage section for new vehicle listings
│   │   ├── RegisterModal.jsx             # New bidder onboarding modal with KYC upload simulation
│   │   ├── SalvexAppComponents.css       # Monolithic CSS for dashboard, payment, and admin pages (58KB)
│   │   ├── SalvexLogo.jsx                # Brand logo wrapper supporting light/dark variants
│   │   ├── SavedModal.jsx                # Watchlist drawer showing user's saved lots
│   │   ├── SearchModal.jsx               # Quick search modal with keyword auto-filtering
│   │   ├── SearchPanel.jsx               # Homepage horizontal filter bar
│   │   ├── SellerCta.jsx                 # Consignor banner CTA
│   │   ├── SellerDashboard.jsx           # Consignor asset portal, valuation, and sales metrics
│   │   ├── TrustStats.jsx                # Metric counters for institutional volume and trust
│   │   ├── UpcomingAuctions.jsx          # Homepage preview of scheduled auctions
│   │   ├── UpcomingAuctionsPage.jsx      # Standalone upcoming auction calendar with reminder triggers
│   │   ├── VehicleCard.css               # Vehicle listing card styles
│   │   ├── VehicleCard.jsx               # Reusable vehicle auction card with countdown & bidding badge
│   │   ├── VehicleDetailsPage.css        # Vehicle details page styles (28KB)
│   │   ├── VehicleDetailsPage.jsx        # Vehicle detail page (1,356 lines)
│   │   ├── VehicleLiftingPage.jsx        # Yard dispatch, digital gate pass, and QR release
│   │   ├── VehicleModal.jsx              # Quick-view vehicle specifications modal
│   │   ├── VehiclesPage.css              # Full marketplace styling
│   │   ├── VehiclesPage.jsx              # Main marketplace inventory catalog with sorting & filters
│   │   ├── WhySalvex.jsx                 # Value proposition section highlighting transparency
│   │   └── ui/                           # Granular UI primitives
│   │       ├── PageLoader.css            # Preloader animations
│   │       └── PageLoader.jsx            # Brand introduction preloader with progress animation
│   ├── data/
│   │   └── mockVehicles.js               # Comprehensive mock database (34KB)
│   ├── hooks/
│   │   └── useScrollAnimations.js        # GSAP ScrollTrigger hooks for subtle parallax & reveals
│   └── utils/
│       └── scrollHelper.js               # Window scroll utility (resetScrollToTop)
└── docs/
    └── audit/                            # Technical audit documentation folder
```
