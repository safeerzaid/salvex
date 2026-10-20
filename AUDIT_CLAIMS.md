# SALVEX AUCTION — FORENSIC AUDIT OF USER-FACING CLAIMS & MISREPRESENTATION RISKS
**Target System:** Salvex Auction Platform  
**Live Production URL:** [https://beta-salvex.vercel.app](https://beta-salvex.vercel.app)  
**Repository Branch:** `main` (commit `f23d29b`)  
**Audit Date:** October 15, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, Security Auditor & Product Analyst  
**Document Purpose:** Exhaustive catalogue of every unverified, simulated, or legally high-risk claim displayed to users across the Salvex Auction UI.

---

## 1. EXECUTIVE SUMMARY & LEGAL RISK CONTEXT

The Salvex Auction web interface presents a sophisticated commercial facade featuring regulatory claims (*"RBI Regulated Escrow"*, *"Live Blockchain Ledger"*, statutory SARFAESI Act governance), fake corporate registrations (*"CIN: U12345MH2020PTC123456"*), institutional banking partnerships (*"HDFC Bank Asset Recovery"*, *"ICICI Bank Stressed Asset Division"*), certified 120/150-point diagnostic inspection guarantees, and unbacked market turnover statistics (*"10K+ Vehicles Auctioned"*, *"₹48.25M Escrow Inflow"*). 

Because the repository currently contains **zero backend infrastructure, zero database persistence, zero banking escrow conduits, zero third-party inspection feeds, and zero real-time bidding**, every single one of these assertions is **hardcoded simulated data presented to the general public as factual commercial operations**.

### Applicable Legal Framework & Exposure:
1. **Consumer Protection Act, 2019 & E-Commerce Rules, 2020 (India):** Section 2(28) prohibits misleading advertisements that falsely describe products or services, give false guarantees, or convey representations that would mislead consumers regarding authenticity.
2. **Reserve Bank of India (RBI) Regulations:** Falsely advertising an *"RBI Regulated Escrow Conduit"* or *"RBI Nodal Account"* without actual regulatory authorization or an authorized banking trustee constitutes regulatory misrepresentation.
3. **Trade Marks Act, 1999:** Displaying institutional partnerships with commercial entities such as *HDFC Bank* and *ICICI Bank* without explicit written consignment agreements or trademark licensing creates immediate liability for passing off and trademark infringement.
4. **Companies Act, 2013:** Displaying a fictitious Corporate Identification Number (*CIN: U12345MH2020PTC123456*) on a commercial website violates statutory corporate disclosure norms.

---

## 2. MASTER CLAIMS AUDIT TABLE

| File : Line | Category | Exact Text Shown to User | Hardcoded Fake? | Risk Level | Suggested Neutral Replacement Wording |
| :--- | :--- | :--- | :---: | :---: | :--- |
| [src/components/LoginPage.jsx:79-81](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LoginPage.jsx#L79-L81) | Regulatory (RBI/Escrow) | `RBI REGULATED ESCROW & STATUTORY COMPLIANCE` | **YES** | **CRITICAL** | `PROTOTYPE DEMONSTRATION TERMINAL (BETA)` |
| [src/components/PaymentPage.jsx:62-63](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L62-L63) | Regulatory (RBI/Escrow) | `RESERVE BANK OF INDIA REGULATED ESCROW CONDUIT` | **YES** | **CRITICAL** | `SIMULATED ESCROW & SETTLEMENT DEMO` |
| [src/components/PaymentPage.jsx:157-158](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L157-L158) | Banking / Escrow | `...verified by the Salvex Escrow Trust.` | **YES** | **CRITICAL** | `...recorded in local demonstration session.` |
| [src/components/PaymentPage.jsx:165](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L165) | Regulatory (RBI/Nodal) | `Escrow Release Authority: Reserve Bank of India Nodal Conduit` | **YES** | **CRITICAL** | `Settlement Method: Demonstration Mock Rail` |
| [src/components/PaymentPage.jsx:169](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L169) | Banking / Settlement | `UTR / Transaction Hash: UTR-998821094821-HDFC` | **YES** | **HIGH** | `Reference Number: SIM-DEMO-998821` |
| [src/components/BidModal.jsx:70-71](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BidModal.jsx#L70-L71) | Tech Architecture | `...registered on the live blockchain ledger.` | **YES** | **CRITICAL** | `...recorded in local browser memory (Demo Mode).` |
| [src/components/LiveAuctionsPage.jsx:366-367](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LiveAuctionsPage.jsx#L366-L367) | Statutory / Legal | `All bids submitted are irrevocable legal contracts governed by the SARFAESI Act and Indian Contract Act 1872.` | **YES** | **HIGH** | `Demonstration platform — bids placed during beta are non-binding sample entries.` |
| [src/components/LiveAuctionsPage.jsx:372](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LiveAuctionsPage.jsx#L372) | Regulatory (RBI) | `✓ RBI Authorized Escrow Conduit` | **YES** | **CRITICAL** | `✓ Platform Architecture Concept` |
| [src/components/LiveAuctionsPage.jsx:380-382](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LiveAuctionsPage.jsx#L380-L382) | Inspection Guarantee | `120-Point Yard Verification: Every lot undergoes digital OBD diagnostic scans, engine compression check...` | **YES** | **HIGH** | `Inspection Protocol Framework: Standardized diagnostics for partnered liquidation yards.` |
| [src/components/LiveAuctionsPage.jsx:386-388](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LiveAuctionsPage.jsx#L386-L388) | Auction Overtime | `120s Soft-Snipe Overtime: Any competitive bid placed in the final 120 seconds auto-extends...` | **YES** | **MEDIUM** | `Planned Anti-Sniping Feature: 120s overtime extension mechanism.` |
| [src/components/LiveAuctionsPage.jsx:392-394](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LiveAuctionsPage.jsx#L392-L394) | Financial Guarantee | `100% Escrow Protection: Earnest Money Deposits (EMD) remain in institutional escrow...` | **YES** | **HIGH** | `Proposed Security Deposit Escrow: Design specification for registered participants.` |
| [src/components/LiveAuctionsPage.jsx:398-400](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LiveAuctionsPage.jsx#L398-L400) | Document Guarantee | `Clear Title & Interstate NOC: Complete documentation guarantee with bank release letters...` | **YES** | **HIGH** | `Title Transfer Workflow: Proposed RTO Form 29/30 processing documentation.` |
| [src/components/SellerDashboard.jsx:61](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L61) | Partner / Trademark | `HDFC Bank Asset Recovery & Fleet Consignment` | **YES** | **CRITICAL** | `Sample Institutional Consignor (Demo Account)` |
| [src/components/SellerDashboard.jsx:63](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L63) | Status Badge | `Institutional Consignor` | **YES** | **MEDIUM** | `Demo Consignor Profile` |
| [src/components/SellerDashboard.jsx:67](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L67) | Identifier | `Consignor ID: SVX-SEL-4091` | **YES** | **LOW** | `Sample Consignor ID: DEMO-SEL-4091` |
| [src/components/SellerDashboard.jsx:71](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L71) | Financial Rail | `Settlement Rail: Corporate Escrow Direct` | **YES** | **HIGH** | `Settlement Rail: Prototype Rail` |
| [src/components/VehicleLiftingPage.jsx:123](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleLiftingPage.jsx#L123) | Partner / Escrow | `Fully Cleared (HDFC Escrow)` | **YES** | **CRITICAL** | `Cleared (Simulated Escrow Demo)` |
| [src/data/mockVehicles.js:161](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L161) | Sourcing / Partner | `source: 'HDFC Bank Repossession Portfolio'` | **YES** | **HIGH** | `source: 'Institutional Bank Consignment (Sample)'` |
| [src/data/mockVehicles.js:329](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L329) | Sourcing / Partner | `source: 'ICICI Bank Stressed Asset Division'` | **YES** | **HIGH** | `source: 'Financial Asset Liquidation (Sample)'` |
| [src/components/Footer.jsx:169](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L169) | Corporate Legal | `CIN: U12345MH2020PTC123456` | **YES** | **CRITICAL** | *(Remove entirely until real MCA incorporation certificate is issued)* |
| [src/components/Footer.jsx:167](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L167) | Corporate Legal | `© 2026 Salvex Auction Pvt. Ltd. All rights reserved.` | **YES** | **MEDIUM** | `© 2026 Salvex Auction (Prototype Project).` |
| [src/components/Footer.jsx:174](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L174) | Certification | `Certified Institutional Liquidation Services` | **YES** | **HIGH** | `Online Vehicle Auction Platform Prototype` |
| [src/components/Footer.jsx:128-130](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L128-L130) | Contact Coordinates | `+91 1800-000-000` | **YES** | **MEDIUM** | `Toll-Free Support: Coming Soon` |
| [src/components/Footer.jsx:132-134](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L132-L134) | Contact Coordinates | `support@salvexauction.in` | **YES** | **LOW** | `contact@example.com (Demo Inquiries)` |
| [src/components/Footer.jsx:136-139](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L136-L139) | Contact Coordinates | `https://wa.me/911800000000 (WhatsApp Support)` | **YES** | **MEDIUM** | `WhatsApp Channel: Under Configuration` |
| [src/components/Footer.jsx:142](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L142) | Contact Coordinates | `Mumbai, Maharashtra, India` | **YES** | **LOW** | `Operations Hub: Bengaluru / Mumbai (Planned)` |
| [src/components/AboutPage.jsx:24-26](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AboutPage.jsx#L24-L26) | Market Statistics | `10K+ Vehicles Auctioned (Verified transactions across India)` | **YES** | **HIGH** | `10K+ Projected Lots (Planned Capacity)` |
| [src/components/AboutPage.jsx:29-31](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AboutPage.jsx#L29-L31) | Market Statistics | `5K+ Registered Bidders (Dealers, rebuilders & retail buyers)` | **YES** | **HIGH** | `Targeting 5K+ Verified Bidders Across India` |
| [src/components/AboutPage.jsx:34-36](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AboutPage.jsx#L34-L36) | Settlement Claims | `98% Successful Settlement (Protected with RBI escrow conduits)` | **YES** | **CRITICAL** | `Institutional Escrow Framework Architecture` |
| [src/components/AboutPage.jsx:39-41](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AboutPage.jsx#L39-L41) | Physical Facilities | `50+ Inspection Hubs (Pan-India regional yard facilities)` | **YES** | **HIGH** | `Planned Pan-India Yard Network` |
| [src/components/AboutPage.jsx:167](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AboutPage.jsx#L167) | Inspection | `...certified independent automotive engineers with standardized 150-point diagnostic logs.` | **YES** | **HIGH** | `...standardized multi-point inspection schema.` |
| [src/components/ContactPage.jsx:74](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/ContactPage.jsx#L74) | Physical Facilities | `Official Central Operations Desk & Regional Liquidation Yards` | **YES** | **MEDIUM** | `Central Operations & Regional Yard Directory (Demo)` |
| [src/components/ContactPage.jsx:409, 440](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/ContactPage.jsx#L409) | Physical Address | `Plot 42-B, Industrial Area, Electronic City Phase 1, Bengaluru - 560100` | **YES** | **MEDIUM** | `Sample Holding Yard Address (Demo Location)` |
| [src/components/ContactPage.jsx:212](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/ContactPage.jsx#L212) | Real Mobile Number | `+91 98450 11223` | **YES** | **HIGH** | `+91 99999 00000 (Dummy Contact)` |
| [src/components/BiddingRulesPage.jsx:46](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BiddingRulesPage.jsx#L46) | Legal Bidding | `All bids placed on Salvex Auction constitute an irrevocable, legally binding offer...` | **YES** | **HIGH** | `Platform Demo: Bids placed during beta are simulated test offers.` |
| [src/components/BiddingRulesPage.jsx:53](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BiddingRulesPage.jsx#L53) | Escrow Account | `...remitted within 48 hours via RTGS/NEFT to the designated Salvex Escrow Trust account.` | **YES** | **CRITICAL** | `...to the designated institutional escrow account.` |
| [src/components/BiddingRulesPage.jsx:60](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BiddingRulesPage.jsx#L60) | Inspection | `While Salvex provides certified 150-point inspection logs...` | **YES** | **HIGH** | `While Salvex displays sample inspection checklists...` |
| [src/components/BiddingRulesPage.jsx:67](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BiddingRulesPage.jsx#L67) | Document Guarantee | `Title transfer documents (RTO Form 29, 30, Bank NOC...) are processed following full financial clearance.` | **YES** | **MEDIUM** | `Sample title transfer documentation sets for demonstration.` |
| [src/components/VehicleLiftingPage.jsx:51-53](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleLiftingPage.jsx#L51-L53) | Gate Pass Clearance | `POST-AUCTION LOGISTICS & VEHICLE DISPATCH: Gate Pass #GP-CHN-2026-3391` | **YES** | **MEDIUM** | `DEMO GATE PASS: Sample Yard Authorization Dossier` |
| [src/components/RegisterModal.jsx:142](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/RegisterModal.jsx#L142) | KYC Clearance | `Your KYC & Verification packet has been logged under Bidder ID SVX-xxxx. You can now place live bids.` | **YES** | **HIGH** | `Demo Registration Completed: Sample Bidder Profile Activated.` |
| [src/components/RegisterModal.jsx:327](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/RegisterModal.jsx#L327) | Tax Registration | `Corporate Entity / Private Limited (GSTIN)` | **YES** | **LOW** | `Corporate Entity (GSTIN Required in Production)` |
| [src/components/AdminPanel.jsx:43](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AdminPanel.jsx#L43) | Compliance Rights | `KYC Approved: Bidding rights activated for {name}` | **YES** | **HIGH** | `Demo Simulation: Bidder rights toggled in memory.` |
| [src/data/mockVehicles.js:490-495](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L490-L495) | Platform Statistics | `10K+ Vehicles Auctioned, 25K+ Registered Bidders, 500+ Trusted Partners, 100% Transparent Process` | **YES** | **HIGH** | `Prototype Platform: All figures represent projected business targets.` |
| [src/data/mockVehicles.js:666-673](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L666-L673) | Admin Financials | `totalEscrowInflow: 48250000, activeBiddersOnline: 1420` | **YES** | **HIGH** | `Sample mock metrics for UI demonstration.` |
| [src/data/mockVehicles.js:680-705](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L680-L705) | Personal Data & PAN | `Vikramaditya Rao, +91 98451 90211, PAN: AABCE1234F, BKLPZ5678Q` | **YES** | **HIGH** | `John Doe, +91 99999 00000, PAN: ABCDE1234F (Sample Data)` |
| [src/data/mockVehicles.js:835-837](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L835-L837) | Regulatory Security | `All payment settlements are executed via Reserve Bank of India regulated banking conduits...` | **YES** | **CRITICAL** | `Demonstration platform. Production settlements will use regulated banking escrow.` |
| [src/components/VehicleDetailsPage.jsx:601-645](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleDetailsPage.jsx#L601-L645) | Vehicle Certification | `Inspection Score: 94 / 100, 185-Point Inspection, Tires 82%, Engine 96%, Chassis 98%` | **YES** | **HIGH** | `Sample 185-Point Diagnostic Report (Mock Illustration)` |

---

## 3. CATEGORICAL DEEP DIVES

### 3.1 Regulatory & Banking Authority Claims (RBI & Escrow)
- **Claims:** The platform states across multiple conversion touchpoints ([LoginPage.jsx:80](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LoginPage.jsx#L80), [PaymentPage.jsx:62, 165](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/PaymentPage.jsx#L62), [LiveAuctionsPage.jsx:372](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LiveAuctionsPage.jsx#L372), [mockVehicles.js:835](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L835)) that it operates an *"RBI REGULATED ESCROW CONDUIT"*, an *"RBI Nodal Account"*, and an official *"Salvex Escrow Trust"*.
- **Reality:** No trust deed, no escrow agreement with an authorized schedule bank (e.g. ICICI, Axis, HDFC Trustee), and no RBI nod has been secured.
- **Risk Level:** **CRITICAL**. Section 45-IA / Section 58-B of the RBI Act, 1934 penalizes unauthorized representations concerning banking business or RBI authorization.

### 3.2 Unbacked Blockchain Ledger Claims
- **Claims:** In [src/components/BidModal.jsx:70](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BidModal.jsx#L70), the bid confirmation screen tells the bidder: *"Your bid ... has been registered on the live blockchain ledger."*
- **Reality:** There is zero smart contract, zero Web3 provider, zero hash generation, and zero distributed ledger. The bid is held in a React `useState` array.
- **Risk Level:** **HIGH**. Misleading marketing under Section 2(28) of the Consumer Protection Act, 2019.

### 3.3 Commercial Bank Consignment Claims (HDFC & ICICI)
- **Claims:** In [src/components/SellerDashboard.jsx:61](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L61), the institutional consignor is explicitly named *"HDFC Bank Asset Recovery & Fleet Consignment"*, with Consignor ID `SVX-SEL-4091`. Furthermore, [mockVehicles.js:161, 329](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L161) attributes vehicle lots directly to *"HDFC Bank Repossession Portfolio"* and *"ICICI Bank Stressed Asset Division"*.
- **Reality:** No commercial consignment agreements exist between Salvex and HDFC Bank or ICICI Bank.
- **Risk Level:** **CRITICAL**. Actionable under Section 29 of the Trade Marks Act, 1999 for unauthorized commercial use of registered trademarks and false claims of institutional affiliation.

### 3.4 Fabricated Corporate Identification Number (CIN)
- **Claims:** [src/components/Footer.jsx:169](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L169) publicly displays `CIN: U12345MH2020PTC123456`.
- **Reality:** This is a sequential dummy number (`12345...123456`) imitating an official Ministry of Corporate Affairs (MCA) registration code for a Maharashtra private limited company incorporated in 2020.
- **Risk Level:** **HIGH**. False corporate disclosure.

### 3.5 Fabricated Pan-India Footprint & Turnover Statistics
- **Claims:**
  - [AboutPage.jsx:24-41](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AboutPage.jsx#L24-L41): *"10K+ Vehicles Auctioned"*, *"5K+ Registered Bidders"*, *"98% Successful Settlement"*, *"50+ Inspection Hubs"*.
  - [mockVehicles.js:490-495](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L490-L495): *"10K+ Vehicles Auctioned"*, *"25K+ Registered Bidders"*, *"500+ Trusted Partners"*.
  - [mockVehicles.js:666-673](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/data/mockVehicles.js#L666-L673): *"Total Escrow Inflow: ₹4,82,50,000"*, *"Active Bidders Online: 1420"*.
- **Reality:** The platform has zero completed commercial auctions, zero registered bidders in a database, zero yard facilities, and zero escrow turnover.
- **Risk Level:** **HIGH**.

---

## 4. EXHAUSTIVE CATALOGUE OF SIMULATED "LIVE" CLAIMS IN THE UI

The term **"LIVE"** is used ubiquitously throughout the user interface to denote real-time auction synchronization, active countdown timers, live market pricing, and dynamic command center operations. In reality, **there are zero WebSockets, zero Server-Sent Events, zero polling intervals, and zero active server clocks**. 

The following table catalogs every place where the UI claims something is "LIVE":

| File : Line | UI Component / Element | Exact "LIVE" Claim Text | Simulated Operational Reality |
| :--- | :--- | :--- | :--- |
| [src/components/Navbar.jsx:71](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Navbar.jsx#L71) | Main Desktop Nav Link | `{ id: 'live-auctions', label: 'Live Auctions', isLive: true }` | Static link; routes to static mock array. |
| [src/components/Navbar.jsx:317](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Navbar.jsx#L317) | Desktop Nav Badge | `<span className="nav-live-capsule">LIVE</span>` | Flashing green dot; no active socket connection. |
| [src/components/Navbar.jsx:362](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Navbar.jsx#L362) | Mobile Menu Drawer Badge | `{item.isLive && <span className="nav-live-capsule">LIVE</span>}` | Purely cosmetic badge. |
| [src/components/VehicleCard.jsx:146-148](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleCard.jsx#L146-L148) | Vehicle Lot Card Badge | `<span className="salvex-status-badge status-badge-live"><span className="status-live-dot" />LIVE</span>` | Rendered on all cards where `badge === 'LIVE'`. |
| [src/components/VehicleDetailsPage.jsx:190-194](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleDetailsPage.jsx#L190-L194) | Image Gallery Overlay Tag | `<div className="gallery-live-tag"><span className="live-tag-pulse" /><span>LIVE AUCTION</span></div>` | Hardcoded red pulsing badge over vehicle photo. |
| [src/components/VehicleDetailsPage.jsx:389-391](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleDetailsPage.jsx#L389-L391) | Sticky Bidding Panel Header | `<div className="panel-live-pill"><span className="pulse-red-dot" /><span>LIVE AUCTION</span></div>` | Header above local input box; no real-time stream. |
| [src/components/VehicleDetailsPage.jsx:671](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehicleDetailsPage.jsx#L671) | Auction Info Tab Status | `<span className="af-val text-live-red">● Live Bidding Open</span>` | Static label; auction start/end was in Sep 2026. |
| [src/components/AdminPanel.jsx:73-75](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/AdminPanel.jsx#L73-L75) | Command Bar Header Pulse | `<span className="admin-live-pulse" /><span className="admin-live-text">OPERATIONS DESK LIVE</span>` | Simulated operational terminal; no live telemetry. |
| [src/components/Footer.jsx:52](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/Footer.jsx#L52) | Footer Trust Pillar | `<span>Live Auction Monitoring 24/7</span>` | Platform has zero automated monitors or ops desk. |
| [src/components/SavedModal.jsx:46](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SavedModal.jsx#L46) | Watchlist Modal Description | `"...quick access and live price tracking."` | Watchlist is kept in React state; lost on reload. |
| [src/components/SellerDashboard.jsx:101-102](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L101-L102) | Seller Stat Card | `<span className="sstat-lbl">Active Live Auctions</span><span className="sstat-val text-red">4 Live</span>` | Static number from `sellerListingsData`. |
| [src/components/SellerDashboard.jsx:174](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L174) | Consignor Listings Table Header | `<th>Highest Live Bid</th>` | Displays static property `lot.currentBid`. |
| [src/components/SellerDashboard.jsx:212](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SellerDashboard.jsx#L212) | Listing Action Button | `title="Monitor Live Auction"` | Button does not link to live monitoring room. |
| [src/components/VehiclesPage.jsx:181](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/VehiclesPage.jsx#L181) | Marketplace Filter Chip | `{status === 'LIVE' ? '🔴 Live Auction' : ...}` | Filters in-memory array by string `badge === 'LIVE'`. |
| [src/components/SearchPanel.jsx:21](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/SearchPanel.jsx#L21) | Home Search Filter Tab | `{ id: 'live', label: 'Live Auctions' }` | Switches tab state in local component. |
| [src/components/LoginPage.jsx:84](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LoginPage.jsx#L84) | Login Hero Subtitle | `"Access your active bids, live auction terminal..."` | Routes to mock dashboard with static entries. |
| [src/components/RegisterModal.jsx:125](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/RegisterModal.jsx#L125) | Registration Modal Subtitle | `"Verify your identity to bid on live, bank-repossessed..."` | Registration does not persist or create identity. |
| [src/components/RegisterModal.jsx:142](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/RegisterModal.jsx#L142) | Registration Success Message | `"...You can now place live bids."` | Bids placed only modify transient client memory. |
| [src/components/BidModal.jsx:56](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BidModal.jsx#L56) | Modal Title | `<h3 className="modal-title">Place Live Bid</h3>` | Submits bid to local component state. |
| [src/components/BidModal.jsx:95](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BidModal.jsx#L95) | Bid Price Box Label | `<span className="price-box-label">Current Highest Bid</span>` | Reads static object property. |
| [src/components/BidModal.jsx:101](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BidModal.jsx#L101) | Increment Controls Label | `Quick Bid Increments (+ over current bid):` | Bumping amounts does not broadcast to others. |
| [src/components/BidModal.jsx:137](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/BidModal.jsx#L137) | Validation Hint Text | `Minimum valid increment is ₹10,000 above the highest live bid.` | Code actually accepts increments of ₹1. |
| [src/components/LiveAuctionsPage.jsx:366](file:///c:/Users/safeer/Desktop/clixdot/salvex/beta-salvex/src/components/LiveAuctionsPage.jsx#L366) | Assurance Banner Heading | `Official Salvex Live Auction Protocols & Institutional Assurance` | Protocols are theoretical frontend copy. |

---

## 5. IMMEDIATE REMEDIATION & RISK MITIGATION PROTOCOL

To protect the platform from regulatory enforcement, trademark actions, and consumer complaints while it remains in demonstration/prototype status:

### Phase 1: Deploy a Global "Demo / Beta Prototype" Banner (15 Minutes)
Mount a prominent, persistent disclaimer across the top of all pages (or in the top announcement bar in `Navbar.jsx`):
> **NOTICE:** *Salvex Auction is currently in Interactive Prototype Demonstration Mode. All vehicle listings, auction countdowns, bids, partner names, inspection scores, escrow statements, and statistics are simulated for illustrative purposes only. No real financial transactions, legal title transfers, or commercial consignments are active on this demonstration deployment.*

### Phase 2: Neutralize Brand & Bank Names (30 Minutes)
- Replace `"HDFC Bank Asset Recovery & Fleet Consignment"` with `"Institutional Consignor Consignment Portfolio (Demo)"`.
- Replace `"ICICI Bank Stressed Asset Division"` with `"Corporate Fleet Liquidation (Sample)"`.
- Replace real mobile phone numbers (`+91 98450 11223`, `+91 97910 44556`) with standard TRAI dummy numbers (`+91 99999 00000`).

### Phase 3: Replace Misleading Regulatory & Blockchain Text (30 Minutes)
- Replace `"RBI REGULATED ESCROW CONDUIT"` with `"SECURE SETTLEMENT FRAMEWORK (PROPOSED)"`.
- Replace `"registered on the live blockchain ledger"` with `"recorded in local session state (Demo Mode)"`.
- Remove fictitious `CIN: U12345MH2020PTC123456` from the footer until an official Ministry of Corporate Affairs registration is issued.
