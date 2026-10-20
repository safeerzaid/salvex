# Salvex Auction — Record of False Claims Fixed (Phase 1)

This document catalogues every user-facing claim, unverified guarantee, regulatory assertion, real bank reference, fake registration number, and simulated contact detail remediated during Phase 1.

| File : Line | Old Text | New Text |
| :--- | :--- | :--- |
| `src/components/Navbar.jsx:108-112` | *(None - added)* | `<div className="navbar-demo-disclaimer-strip" role="status"><span><strong>Demo Prototype:</strong> All vehicles, bids, partners, prices and statistics are sample data. No real payments or transactions.</span></div>` |
| `src/components/Navbar.jsx:132` | `Need Help? <strong>+91 98765 43210</strong>` | `Need Help? <strong>+91 00000 00000</strong>` |
| `src/components/LoginPage.jsx:25` | `const [identifier, setIdentifier] = useState('rahul.sharma@enterpriseholdings.in');` | `const [identifier, setIdentifier] = useState('demo.bidder@example.com');` |
| `src/components/LoginPage.jsx:80` | `RBI REGULATED ESCROW & STATUTORY COMPLIANCE` | `Secure settlement (demo)` |
| `src/components/LoginPage.jsx:84` | `Access your active bids, live auction terminal, escrow statements, and digital yard lifting passes.` | `Access your active bids, auction terminal, settlement statements, and digital yard lifting passes (demo).` |
| `src/components/LoginPage.jsx:106` | `Contact compliance@salvexauction.com.` | `Contact demo@example.com.` |
| `src/components/LoginPage.jsx:150` | `placeholder={authMode === 'password' ? 'name@domain.com / +91...' : '+91 98765 43210'}` | `placeholder={authMode === 'password' ? 'demo@example.com / +91...' : '+91 00000 00000'}` |
| `src/components/BidModal.jsx:70` | `Your bid of <strong>{formatCurrency(bidAmount)}</strong> has been registered on the live blockchain ledger.` | `Your bid of <strong>{formatCurrency(bidAmount)}</strong> was recorded (demo mode).` |
| `src/components/BidModal.jsx:156-157` | `I agree that this bid is legally binding under the Salvex Auction Buyer Agreement, and sufficient deposit balance is maintained.` | `I understand this bid is a sample offer in this demo environment, and test deposit balance is maintained.` |
| `src/components/Footer.jsx:44` | `<span>RBI Regulated Escrow Settlements</span>` | `<span>Secure settlement (demo)</span>` |
| `src/components/Footer.jsx:48` | `<span>Verified KYC Bidder Process</span>` | `<span>Verified KYC Bidder Process (Demo)</span>` |
| `src/components/Footer.jsx:52` | `<span>Live Auction Monitoring 24/7</span>` | `<span>Demo environment</span>` |
| `src/components/Footer.jsx:90` | `['Payment & Escrow', 'payment'],` | `['Payment & Settlement', 'payment'],` |
| `src/components/Footer.jsx:128` | `<a href="tel:+911800000000"` | `<a href="tel:+910000000000"` |
| `src/components/Footer.jsx:130` | `<span>+91 1800-000-000</span>` | `<span>+91 00000 00000</span>` |
| `src/components/Footer.jsx:132` | `<a href="mailto:support@salvexauction.in"` | `<a href="mailto:demo@example.com"` |
| `src/components/Footer.jsx:134` | `<span>support@salvexauction.in</span>` | `<span>demo@example.com</span>` |
| `src/components/Footer.jsx:136` | `<a href="https://wa.me/911800000000"` | `<a href="https://wa.me/910000000000"` |
| `src/components/Footer.jsx:167-169` | `<span>© {year} Salvex Auction Pvt. Ltd. All rights reserved.</span> <span className="footer-bottom-sep">•</span> <span>CIN: U12345MH2020PTC123456</span>` | `<span>© {year} Salvex Auction (Demo Prototype). All rights reserved.</span>` (fake CIN line removed completely) |
| `src/components/Footer.jsx:174` | `<span>Certified Institutional Liquidation Services</span>` | `<span>Sample Institutional Liquidation Services</span>` |
| `src/components/PaymentPage.jsx:49` | `onShowToast('Escrow payment verified! Digital Gate Pass has been issued.');` | `onShowToast('Payment verified (demo)! Digital Gate Pass has been issued.');` |
| `src/components/PaymentPage.jsx:62` | `RESERVE BANK OF INDIA REGULATED ESCROW CONDUIT` | `Secure settlement (demo)` |
| `src/components/PaymentPage.jsx:64` | `Escrow Settlement & Invoice Checkout` | `Settlement & Invoice Checkout (Demo)` |
| `src/components/PaymentPage.jsx:66` | `Secure settlement portal for Lot #{lot.id.toUpperCase()}...` | `Settlement portal (demo) for Lot #{lot.id.toUpperCase()}...` |
| `src/components/PaymentPage.jsx:157` | `...has been verified by the Salvex Escrow Trust.` | `...was recorded in local demonstration session.` |
| `src/components/PaymentPage.jsx:202` | `Verifying RTGS / Escrow Clearance` | `Verifying RTGS / Settlement Clearance (Demo)` |
| `src/components/PaymentPage.jsx:204` | `Communicating with banking rails to match your transaction reference with incoming escrow credits...` | `Simulating communication with banking rails to match your transaction reference (demo)...` |
| `src/components/PaymentPage.jsx:216` | `Official Escrow Banking Details` | `Sample Settlement Banking Details (Demo)` |
| `src/components/PaymentPage.jsx:217` | `Remit funds via RTGS / NEFT to the dedicated virtual escrow account below.` | `Demo account details for simulated RTGS / NEFT remittance.` |
| `src/components/PaymentPage.jsx:226` | `SALVEX AUCTION ESCROW TRUST` | `SALVEX DEMO SETTLEMENT` |
| `src/components/PaymentPage.jsx:240` | `HDFC Bank Limited (Corporate Wholesale Banking)` | `Sample Bank (Corporate Banking Demo)` |
| `src/components/PaymentPage.jsx:247` | `SLVXESC99018842` | `DEMO-SLVX-99018842` |
| `src/components/PaymentPage.jsx:261` | `HDFC0000128` | `SMPL0000128` |
| `src/components/PaymentPage.jsx:281` | `placeholder="e.g. HDFCR520260930008819"` | `placeholder="e.g. DEMOR520260930008819"` |
| `src/components/PaymentPage.jsx:295` | `Confirm Escrow Remittance ({formatCurrency(lot.totalPayable)})` | `Confirm Settlement Remittance (Demo: {formatCurrency(lot.totalPayable)})` |
| `src/components/SellerDashboard.jsx:61` | `<h2>HDFC Bank Asset Recovery & Fleet Consignment</h2>` | `<h2>Institutional Consignor (Demo)</h2>` |
| `src/components/SellerDashboard.jsx:63` | `<ShieldCheck size={14} /> Institutional Consignor` | `<ShieldCheck size={14} /> Institutional Consignor (Demo)` |
| `src/components/SellerDashboard.jsx:67` | `Consignor ID: <strong>SVX-SEL-4091</strong>` | `Consignor ID: <strong>DEMO-SEL-4091</strong>` |
| `src/components/SellerDashboard.jsx:71` | `Settlement Rail: <strong>Corporate Escrow Direct</strong>` | `Settlement Rail: <strong>Secure settlement (demo)</strong>` |
| `src/components/SellerDashboard.jsx:114-115` | `<span className="sstat-val text-success">₹4.85 Cr</span> <span className="sstat-sub">Disbursed to consignor escrow</span>` | `<span className="sstat-val text-success">₹4.85 Cr (sample)</span> <span className="sstat-sub">Sample consignor settlement total</span>` |
| `src/components/SellerDashboard.jsx:239` | `<h3>Consignor Escrow Settlement Ledger</h3>` | `<h3>Consignor Settlement Ledger (Demo)</h3>` |
| `src/components/SellerDashboard.jsx:271` | `<code>HDFCR520260912004491</code>` | `<code>DEMOR520260912004491</code>` |
| `src/components/LiveAuctionsPage.jsx:152` | `Place transparent bids on verified bank repossessions, insurance salvage, and corporate asset liquidations in live certified online auctions with instant escrow settlement.` | `Browse sample vehicle lots including bank consignments, insurance salvage, and corporate asset liquidations in demo online auctions with secure settlement (demo).` |
| `src/components/LiveAuctionsPage.jsx:366` | `Official Salvex Live Auction Protocols & Institutional Assurance` | `Salvex Auction Protocols & Platform Overview (Demo)` |
| `src/components/LiveAuctionsPage.jsx:367` | `All bids submitted are irrevocable legal contracts governed by the SARFAESI Act and Indian Contract Act 1872.` | `Demonstration platform — bids placed during demo mode are sample entries for UI testing.` |
| `src/components/LiveAuctionsPage.jsx:372` | `✓ RBI Authorized Escrow Conduit` | `✓ Secure settlement (demo)` |
| `src/components/LiveAuctionsPage.jsx:380-381` | `120-Point Yard Verification / Every lot undergoes digital OBD diagnostic scans...` | `Standardized Yard Inspection (Sample) / Sample inspection protocol outlining diagnostic checks...` |
| `src/components/LiveAuctionsPage.jsx:392-393` | `100% Escrow Protection / Earnest Money Deposits (EMD) remain in institutional escrow accounts...` | `Secure Deposit Protection (Demo) / Planned security deposit framework designed for registered participants...` |
| `src/components/LiveAuctionsPage.jsx:398-399` | `Clear Title & Interstate NOC / Complete documentation guarantee with bank release letters...` | `Title & Transfer Documentation (Demo) / Overview of documentation workflows including sample bank release letters...` |
| `src/components/AboutPage.jsx:24-41` | `10K+ / 5K+ / 98% / 50+` stats | `10K+ (sample) / 5K+ (sample) / 98% (sample) / 50+ (sample)` |
| `src/components/AboutPage.jsx:172` | `...with verified 150-point diagnostic disclosures.` | `...with detailed diagnostic condition checklists.` |
| `src/components/AboutPage.jsx:175` | `...live auctions with anti-sniping protection and real-time terminal controls.` | `...live auctions with anti-sniping protection and auction terminal controls.` |
| `src/components/AboutPage.jsx:252` | `'150-Point Physical Inspection Reports'` | `'Multi-Point Yard Inspection Reports (Sample)'` |
| `src/components/AboutPage.jsx:255` | `'RBI Regulated Escrow Settlements'` | `'Secure settlement (demo)'` |
| `src/components/AboutPage.jsx:272` | `...conducting auctions through RBI-regulated escrow banking rails...` | `...providing structured settlement processes, we empower buyers with dependable vehicle clarity.` |
| `src/components/ContactPage.jsx:102, 112` | `+91 80 4000 7000` | `+91 00000 00000` |
| `src/components/ContactPage.jsx:121, 131` | `+91 98450 00000` | `+91 00000 00000` |
| `src/components/ContactPage.jsx:140, 150` | `support@salvexauction.com` | `demo@example.com` |
| `src/components/ContactPage.jsx:302-303` | `Escrow Payment Assistance` | `Settlement Payment Assistance (Demo)` |
| `src/components/ContactPage.jsx:409` | `Plot 42-B, Industrial Area, Electronic City, Bengaluru - 560100` | `Demo Operations Hub, Bengaluru, Karnataka (Sample Address)` |
| `src/components/ContactPage.jsx:440` | `Plot 42-B, Industrial Area, Electronic City Phase 1, Bengaluru, Karnataka - 560100, India` | `Demo Operations Hub, Bengaluru, Karnataka, India (Sample Address)` |
| `src/components/ContactSection.jsx:45, 47` | `+91 (022) 6982 4500` / `tel:+912269824500` | `+91 00000 00000` / `tel:+910000000000` |
| `src/components/ContactSection.jsx:53, 55` | `+91 98200 45678` / `https://wa.me/919820045678` | `+91 00000 00000` / `https://wa.me/910000000000` |
| `src/components/ContactSection.jsx:62, 64` | `auctions@salvexauction.com` / `mailto:auctions@salvexauction.com` | `demo@example.com` / `mailto:demo@example.com` |
| `src/components/ContactSection.jsx:70-71` | `Salvex Commercial Towers, Level 8 / BKC Avenue, Bandra Kurla Complex, Mumbai, MH 400051` | `Demo Operations Desk (Sample) / Bandra Kurla Complex, Mumbai, MH (Demo Address)` |
| `src/components/ContactSection.jsx:172` | `placeholder="vikram@example.com"` | `placeholder="demo@example.com"` |
| `src/components/ContactSection.jsx:187` | `placeholder="+91 98765 43210"` | `placeholder="+91 00000 00000"` |
| `src/components/ContactSection.jsx:205` | `<option value="Security Deposit & Escrow">Security Deposit & Escrow</option>` | `<option value="Security Deposit & Settlement (Demo)">Security Deposit & Settlement (Demo)</option>` |
| `src/components/ContactSection.jsx:206` | `<option value="Institutional Bank Portfolio">Institutional Bank Portfolio</option>` | `<option value="Sample Bank Portfolio">Sample Bank Portfolio</option>` |
| `src/components/BiddingRulesPage.jsx:46` | `All bids placed on Salvex Auction constitute an irrevocable, legally binding offer...` | `Platform Demo: Bids placed during demo mode are simulated sample offers...` |
| `src/components/BiddingRulesPage.jsx:50, 53` | `5. Payment Deadlines & Escrow Remittance` / `...designated Salvex Escrow Trust account.` | `5. Payment Deadlines & Settlement Remittance (Demo)` / `...designated institutional settlement account.` |
| `src/components/BiddingRulesPage.jsx:60` | `While Salvex provides certified 150-point inspection logs...` | `While Salvex displays sample multi-point inspection checklists...` |
| `src/components/VehicleLiftingPage.jsx:30` | `{ num: 1, label: 'Payment Completed', desc: 'Escrow settlement confirmed' }` | `{ num: 1, label: 'Payment Completed', desc: 'Secure settlement (demo) confirmed' }` |
| `src/components/VehicleLiftingPage.jsx:123` | `Fully Cleared (HDFC Escrow)` | `Fully Cleared (Secure settlement - demo)` |
| `src/components/VehicleLiftingPage.jsx:143` | `Cryptographic Yard Security QR` | `Sample Yard Security QR (Demo)` |
| `src/components/VehicleLiftingPage.jsx:145` | `SHA-256 Digital Verification Signature` | `Sample Digital Verification Format` |
| `src/components/VehicleDetailsPage.jsx:191-194` | Static `<span className="live-tag-pulse" /><span>LIVE AUCTION</span>` | Dynamic based on `secondsRemaining > 0 ? LIVE AUCTION : AUCTION ENDED` |
| `src/components/VehicleDetailsPage.jsx:389-396` | Static header pill and hardcoded dates | Dynamic header pill (`LIVE AUCTION` or `AUCTION ENDED`), countdown (`formatCountdown` or `ENDED`), and relative start/end |
| `src/components/VehicleDetailsPage.jsx:622` | `Status: <strong>Verified</strong>` | `Status: <strong>Completed (Sample)</strong>` |
| `src/components/VehicleDetailsPage.jsx:671` | `<span className="af-val text-live-red">● Live Bidding Open</span>` | Dynamic: `<span className={af-val ${secondsRemaining > 0 ? 'text-live-red' : ''}}>{secondsRemaining > 0 ? '● Live Bidding Open' : '● Bidding Closed (Ended)'}</span>` |
| `src/components/VehicleDetailsPage.jsx:679, 687` | Hardcoded `28 Sep 2026 · 10:00 AM IST` / `30 Sep 2026 · 04:14 PM IST` | Relative `Scheduled Today · 10:00 AM IST` / `{secondsRemaining > 0 ? In ... : 'Closed'}` |
| `src/components/VehicleDetailsPage.jsx:834` | `+91 1800-000-000 • yard.ops@salvexauction.in` | `+91 00000 00000 • demo@example.com` |
| `src/components/VehicleDetailsPage.jsx:1268` | `All submitted bids are legally binding and non-cancellable...` | `Platform Demo: Bids placed during demo mode are simulated sample offers...` |
| `src/components/VehicleDetailsPage.jsx:1280` | `...via authorized Escrow wire transfer.` | `...via authorized secure settlement wire transfer (demo).` |
| `src/components/VehicleCard.jsx:46-59` | Badge logic allowed overlapping `LIVE` and `ENDING SOON`, no explicit check for `remainingSeconds > 0` | Lots show `LIVE` only if `remainingSeconds > 0` and not ended; if expired or <= 0, shows `ENDED` |
| `src/components/VehicleCard.jsx:109` | `chips.push({ label: 'Certified', type: 'info' });` | `chips.push({ label: 'Inspected', type: 'info' });` |
| `src/components/HowItWorksPage.jsx:76, 78` | `Secure Escrow Settlement` / `...regulated Salvex Escrow Trust.` | `Secure Settlement (Demo)` / `...designated settlement account (demo).` |
| `src/components/HowItWorksPage.jsx:143-144` | `RBI Regulated Escrow` / `...independent escrow trust until title documents...` | `Secure settlement (demo)` / `Simulated settlement process illustrating trust protection...` |
| `src/components/HowItWorks.jsx:21` | `Browse verified lots with comprehensive 150-point diagnostic reports.` | `Browse lots with comprehensive sample multi-point diagnostic reports.` |
| `src/components/HowItWorks.jsx:39` | `Remit payments safely through RBI-authorized escrow banking channels.` | `Remit payments safely through secure settlement (demo).` |
| `src/components/ListVehiclePage.jsx:58-60` | `sellerName: 'Vikram Joshi'`, `sellerMobile: '+91 98450 11223'`, `sellerEmail: 'vikram.joshi@gmail.com'` | `sellerName: 'Demo Seller'`, `sellerMobile: '+91 00000 00000'`, `sellerEmail: 'demo.seller@example.com'` |
| `src/components/ListVehiclePage.jsx:106` | `...with guaranteed transparent liquidation and fast escrow payout.` | `...with transparent liquidation and fast payout processes (demo).` |
| `src/components/ListVehicleModal.jsx:101, 114` | `placeholder="e.g. HDFC Asset Recovery / Zenith Motors"` / `placeholder="+91 98200 12345"` | `placeholder="e.g. Sample Asset Recovery / Sample Motors"` / `placeholder="+91 00000 00000"` |
| `src/components/RegisterModal.jsx:125` | `...bid on live, bank-repossessed and insurance salvage auctions.` | `...explore bank-repossessed and insurance salvage demo auctions.` |
| `src/components/RegisterModal.jsx:142` | `...KYC & Verification packet has been logged under Bidder ID SVX-xxxx. You can now place live bids.` | `...profile has been recorded under Demo Bidder ID DEMO-xxxx. You can now place demo bids.` |
| `src/components/RegisterModal.jsx:210, 222` | `placeholder="+91 98765 43210"` / `placeholder="rahul.sharma@example.com"` | `placeholder="+91 00000 00000"` / `placeholder="demo@example.com"` |
| `src/components/BidderDashboard.jsx:654` | `Escrow certificate verified by Axis Bank Trust.` | `Settlement certificate verified (Demo).` |
| `src/components/BidderDashboard.jsx:771` | `<p>K. Senthil (+91 97910 44556)</p>` | `<p>Yard Desk (+91 00000 00000)</p>` |
| `src/components/BidderDashboard.jsx:848, 853` | `rahul.sharma@enterpriseholdings.in` / `+91 98451 90211` | `demo.bidder@example.com` / `+91 00000 00000` |
| `src/components/BidderDashboard.jsx:861` | `HDFC Bank • A/C No: 50200049281920 • IFSC: HDFC0000128` | `Sample Bank • A/C No: 00000049281920 • IFSC: SMPL0000128` |
| `src/components/AdminPanel.jsx:210` | `Held in RBI-regulated trustee account` | `Held in secure settlement account (demo)` |
| `src/components/AdminPanel.jsx:448` | `HDFC Consignments` | `Sample Institutional Consignments` |
| `src/components/AdminPanel.jsx:495, 499` | `UTR-HDFC-991204` / `HDFC Corporate Escrow` | `DEMO-UTR-991204` / `Sample Bank Escrow (Demo)` |
| `src/components/AdminPanel.jsx:503, 507` | `UTR-AXIS-330192` / `Axis Escrow Trust` | `DEMO-UTR-330192` / `Sample Settlement Trust (Demo)` |
| `src/data/mockVehicles.js:161` | `source: 'HDFC Bank Repossession Portfolio'` | `source: 'Sample Bank Repossession Portfolio'` |
| `src/data/mockVehicles.js:245` | `source: 'Kotak Mahindra Prime Asset Liquidation'` | `source: 'Institutional Asset Liquidation (Demo)'` |
| `src/data/mockVehicles.js:273` | `source: 'Axis Bank Commercial Portfolio Recovery'` | `source: 'Sample Bank Commercial Portfolio Recovery'` |
| `src/data/mockVehicles.js:329` | `source: 'ICICI Bank Stressed Asset Division'` | `source: 'Sample Bank Stressed Asset Division'` |
| `src/data/mockVehicles.js:490-495` | `10K+ / 25K+ / 500+ / 100%` | `10K+ (sample) / 25K+ (sample) / 500+ (sample) / 100% (demo)` |
| `src/data/mockVehicles.js:501, 506, 521` | Online KYC / 150-point report / RBI-authorized escrow | Online KYC (demo) / sample multi-point report / secure settlement (demo) |
| `src/data/mockVehicles.js:579, 601` | Vikram Joshi `(+91 98450 11223)` / K. Senthil `(+91 97910 44556)` | Yard Desk `(+91 00000 00000)` |
| `src/data/mockVehicles.js:678-710` | Personal names, emails, real-looking phone numbers and PANs | Demo Bidder 1/2, `demo.bidderX@example.com`, `+91 00000 00000`, `ABCDE1234F` |
| `src/data/mockVehicles.js:729` | `...Escrow payment window is open.` | `...Settlement payment window (demo) is open.` |
| `src/data/mockVehicles.js:738` | `...PCC have been verified by Salvex Compliance.` | `...profile have been processed (demo mode).` |
| `src/data/mockVehicles.js:835-836` | `Reserve Bank of India regulated banking conduits and specialized escrow trusts...` | `All payment settlements are simulated via secure settlement (demo) architecture...` |
| `src/data/mockVehicles.js:850` | `...mandatory 48-hour escrow settlement window...` | `...designated 48-hour settlement window (demo)...` |
