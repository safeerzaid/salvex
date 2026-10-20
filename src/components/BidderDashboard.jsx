import React, { useState } from 'react';
import {
  LayoutDashboard,
  Gavel,
  Trophy,
  Heart,
  CreditCard,
  FileText,
  Truck,
  Bell,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Download,
  MapPin,
  X
} from 'lucide-react';
import { wonAuctionsData, notificationsData } from '../data/mockVehicles';

export default function BidderDashboard({
  savedVehicles = [],
  onRemoveSaved,
  onNavigateVehicleDetails,
  onNavigatePayment,
  onNavigateLifting,
  onOpenBidModal,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'my-bids' | 'won' | 'watchlist' | 'payments' | 'documents' | 'lifting' | 'notifications' | 'profile'
  const [bidsFilter, setBidsFilter] = useState('active'); // 'active' | 'won' | 'lost' | 'outbid'
  const [notifications, setNotifications] = useState(notificationsData);

  // Mock Active User Bids
  const myBidsData = [
    {
      id: 'bid-lot-103',
      vehicleId: 'salvex-103',
      title: '2023 Land Rover Defender 110 V8 5.0L',
      image: '/images/defender-110.jpg',
      myBid: 16200000,
      currentBid: 16200000,
      status: 'winning', // 'winning' | 'outbid' | 'won' | 'lost'
      bidStatusLabel: 'Winning Bid',
      endsIn: '04:15:20',
      bidCount: 24,
      location: 'Bengaluru South Hub'
    },
    {
      id: 'bid-lot-101',
      vehicleId: 'salvex-101',
      title: '2023 Porsche 911 GT3 RS Weissach Package',
      image: '/images/porsche-gt3.jpg',
      myBid: 30500000,
      currentBid: 31250000,
      status: 'outbid',
      bidStatusLabel: 'Outbid',
      endsIn: '02:14:10',
      bidCount: 38,
      location: 'Mumbai Central Hub'
    },
    {
      id: 'bid-lot-102',
      vehicleId: 'salvex-102',
      title: '2023 Mercedes-AMG G 63 V8 Bi-Turbo',
      image: '/images/mercedes-g63.jpg',
      myBid: 24800000,
      currentBid: 24800000,
      status: 'winning',
      bidStatusLabel: 'Winning Bid',
      endsIn: '03:28:45',
      bidCount: 29,
      location: 'Delhi NCR Yard #2'
    },
    {
      id: 'bid-lot-100c',
      vehicleId: 'salvex-100c',
      title: '2020 BMW 3 Series 330i Luxury Line',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
      myBid: 1820000,
      currentBid: 1820000,
      status: 'won',
      bidStatusLabel: 'Auction Won',
      endsIn: 'Closed',
      bidCount: 19,
      location: 'Chennai Hub'
    }
  ];

  const filteredBids = myBidsData.filter((b) => {
    if (bidsFilter === 'active') return b.status === 'winning' || b.status === 'outbid';
    if (bidsFilter === 'outbid') return b.status === 'outbid';
    if (bidsFilter === 'won') return b.status === 'won';
    if (bidsFilter === 'lost') return b.status === 'lost';
    return true;
  });

  const formatCurrency = (amt) => {
    return '₹' + Number(amt || 0).toLocaleString('en-IN');
  };

  const markAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (onShowToast) onShowToast('All notifications marked as read');
  };

  return (
    <div className="salvex-bidder-dashboard-page">
      {/* 01 BIDDER IDENTITY BANNER */}
      <section className="bidder-header-banner">
        <div className="salvex-container">
          <div className="bidder-header-content">
            <div className="bidder-profile-summary">
              <div className="bidder-avatar">RS</div>
              <div className="bidder-titles">
                <div className="bidder-name-row">
                  <h2>Rahul Sharma</h2>
                  <span className="kyc-verified-badge">
                    <ShieldCheck size={14} />
                    Tier-2 KYC Verified
                  </span>
                </div>
                <div className="bidder-sub-meta">
                  <span>Bidder ID: <strong>SVX-BDR-7842</strong></span>
                  <span>•</span>
                  <span>Registered: <strong>Enterprise Holdings LLP</strong></span>
                  <span>•</span>
                  <span>Pre-Bid EMD Pool: <strong className="text-success">₹15,00,000 Active</strong></span>
                </div>
              </div>
            </div>

            <div className="bidder-quick-balance-box">
              <span className="balance-label">AVAILABLE BIDDING LIMIT</span>
              <span className="balance-amount">₹4,50,00,000</span>
              <span className="balance-note">Assigned based on verified EMD deposit</span>
            </div>
          </div>
        </div>
      </section>

      {/* 02 MAIN DASHBOARD WRAPPER */}
      <div className="salvex-container">
        <div className="dashboard-grid-layout">
          {/* SIDEBAR NAVIGATION */}
          <aside className="dashboard-sidebar">
            <nav className="dash-nav-menu">
              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'overview' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard size={17} />
                <span>Overview</span>
              </button>

              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'my-bids' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('my-bids')}
              >
                <Gavel size={17} />
                <span>My Bids</span>
                <span className="nav-badge-pill">3 Active</span>
              </button>

              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'won' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('won')}
              >
                <Trophy size={17} />
                <span>Won Auctions</span>
                <span className="nav-badge-alert">2 Won</span>
              </button>

              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'watchlist' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('watchlist')}
              >
                <Heart size={17} />
                <span>Watchlist</span>
                <span className="nav-badge-pill">{savedVehicles.length}</span>
              </button>

              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'payments' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('payments')}
              >
                <CreditCard size={17} />
                <span>Payments & Escrow</span>
              </button>

              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'documents' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                <FileText size={17} />
                <span>KYC & Documents</span>
              </button>

              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'lifting' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('lifting')}
              >
                <Truck size={17} />
                <span>Vehicle Lifting</span>
              </button>

              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'notifications' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={17} />
                <span>Notifications</span>
                {notifications.some((n) => !n.read) && (
                  <span className="nav-badge-dot" />
                )}
              </button>

              <button
                type="button"
                className={`dash-nav-item ${activeTab === 'profile' ? 'nav-active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={17} />
                <span>Profile Settings</span>
              </button>
            </nav>
          </aside>

          {/* MAIN TAB CONTENT */}
          <main className="dashboard-main-panel">
            {/* -------------------------------------------------------------
                TAB 1: OVERVIEW
               ------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="tab-pane-content">
                {/* 4 Core Stat Cards */}
                <div className="dash-stats-grid">
                  <div className="stat-card" onClick={() => setActiveTab('my-bids')} role="button" tabIndex={0}>
                    <div className="stat-icon-wrap stat-blue">
                      <Gavel size={20} />
                    </div>
                    <div className="stat-text">
                      <span className="stat-title">Active Bids</span>
                      <span className="stat-number">3</span>
                    </div>
                  </div>

                  <div className="stat-card" onClick={() => setActiveTab('won')} role="button" tabIndex={0}>
                    <div className="stat-icon-wrap stat-green">
                      <Trophy size={20} />
                    </div>
                    <div className="stat-text">
                      <span className="stat-title">Won Auctions</span>
                      <span className="stat-number">2 Lots</span>
                    </div>
                  </div>

                  <div className="stat-card" onClick={() => setActiveTab('watchlist')} role="button" tabIndex={0}>
                    <div className="stat-icon-wrap stat-red">
                      <Heart size={20} />
                    </div>
                    <div className="stat-text">
                      <span className="stat-title">Watchlist</span>
                      <span className="stat-number">{savedVehicles.length} Lots</span>
                    </div>
                  </div>

                  <div className="stat-card" onClick={() => setActiveTab('payments')} role="button" tabIndex={0}>
                    <div className="stat-icon-wrap stat-amber">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="stat-text">
                      <span className="stat-title">Pending Settlement</span>
                      <span className="stat-number">1 Lot Due</span>
                    </div>
                  </div>
                </div>

                {/* Urgent Action Alert if Payment Due */}
                <div className="urgent-payment-banner">
                  <div className="urgent-left">
                    <AlertCircle size={24} className="text-warning" />
                    <div>
                      <h4>Immediate Payment Window Open: Defender 110 V8</h4>
                      <p>Winning bid: ₹1,62,00,000. Balance escrow settlement required within 34 hours to avoid EMD forfeiture.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="salvex-btn salvex-btn-primary"
                    onClick={() => onNavigatePayment('won-101')}
                  >
                    <span>Proceed to Escrow Payment</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                {/* Active Bids Preview */}
                <div className="dash-section-box">
                  <div className="box-header-row">
                    <h3>Active Live Bids</h3>
                    <button
                      type="button"
                      className="link-view-all"
                      onClick={() => setActiveTab('my-bids')}
                    >
                      View All Bids →
                    </button>
                  </div>

                  <div className="overview-bids-table">
                    {myBidsData.slice(0, 3).map((item) => (
                      <div key={item.id} className="bid-preview-row">
                        <img src={item.image} alt={item.title} className="thumb-car" />
                        <div className="preview-details">
                          <span className="car-name">{item.title}</span>
                          <span className="car-loc">{item.location}</span>
                        </div>
                        <div className="preview-status">
                          <span className={`status-badge-chip ${item.status}`}>
                            {item.bidStatusLabel}
                          </span>
                        </div>
                        <div className="preview-bids">
                          <span className="b-lbl">Current Bid</span>
                          <span className="b-val">{formatCurrency(item.currentBid)}</span>
                        </div>
                        <div className="preview-actions">
                          {item.status === 'outbid' ? (
                            <button
                              type="button"
                              className="salvex-btn salvex-btn-primary btn-sm"
                              onClick={() => onOpenBidModal({ id: item.vehicleId, startingBid: item.currentBid, currentBid: item.currentBid, make: item.title, model: '' })}
                            >
                              Increase Bid
                            </button>
                          ) : (
                            <span className="winning-indicator">High Bidder</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 2: MY BIDS
               ------------------------------------------------------------- */}
            {activeTab === 'my-bids' && (
              <div className="tab-pane-content">
                <div className="tab-pane-header">
                  <h2>My Auction Bids</h2>
                  <p>Track your active live offers, outbid alerts, and won auction assets.</p>
                </div>

                {/* Filter Pills */}
                <div className="bids-filter-pills">
                  {['active', 'outbid', 'won', 'lost'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`pill-btn ${bidsFilter === f ? 'pill-active' : ''}`}
                      onClick={() => setBidsFilter(f)}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* List */}
                <div className="bids-cards-list">
                  {filteredBids.map((bid) => (
                    <div key={bid.id} className={`bid-card-item ${bid.status}`}>
                      <div className="bci-media">
                        <img src={bid.image} alt={bid.title} />
                        <span className={`bci-tag ${bid.status}`}>{bid.bidStatusLabel}</span>
                      </div>

                      <div className="bci-info">
                        <h3>{bid.title}</h3>
                        <div className="bci-meta">
                          <span><MapPin size={13} /> {bid.location}</span>
                          <span><Clock size={13} /> Closing: {bid.endsIn}</span>
                          <span>• {bid.bidCount} Total Bids</span>
                        </div>

                        <div className="bci-figures">
                          <div className="fig-box">
                            <span className="f-lbl">YOUR BID</span>
                            <span className="f-val">{formatCurrency(bid.myBid)}</span>
                          </div>
                          <div className="fig-box">
                            <span className="f-lbl">CURRENT HIGHEST</span>
                            <span className="f-val highlight">{formatCurrency(bid.currentBid)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bci-actions">
                        {bid.status === 'outbid' && (
                          <button
                            type="button"
                            className="salvex-btn salvex-btn-primary w-full"
                            onClick={() => onOpenBidModal({ id: bid.vehicleId, startingBid: bid.currentBid, currentBid: bid.currentBid, make: bid.title, model: '' })}
                          >
                            <Gavel size={15} />
                            <span>Increase Bid</span>
                          </button>
                        )}

                        {bid.status === 'won' && (
                          <button
                            type="button"
                            className="salvex-btn salvex-btn-success w-full"
                            onClick={() => onNavigatePayment('won-101')}
                          >
                            <CreditCard size={15} />
                            <span>Settle Payment</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="salvex-btn salvex-btn-outline w-full"
                          onClick={() => onNavigateVehicleDetails({ id: bid.vehicleId })}
                        >
                          <span>View Auction Terminal</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 3: WON AUCTIONS
               ------------------------------------------------------------- */}
            {activeTab === 'won' && (
              <div className="tab-pane-content">
                <div className="tab-pane-header">
                  <h2>Won Auctions & Settlements</h2>
                  <p>Congratulations on your winning bids. Complete escrow payment to trigger gate pass generation.</p>
                </div>

                <div className="won-auctions-grid">
                  {wonAuctionsData.map((lot) => (
                    <div key={lot.id} className="won-lot-card">
                      <div className="won-card-header">
                        <span className="won-badge">AUCTION WON</span>
                        <span className={`payment-pill ${lot.paymentStatus.toLowerCase()}`}>
                          Payment: {lot.paymentStatus}
                        </span>
                      </div>

                      <div className="won-card-media">
                        <img src={lot.image} alt={`${lot.yearMfg} ${lot.make} ${lot.model}`} />
                      </div>

                      <div className="won-card-body">
                        <h3>{lot.yearMfg} {lot.make} {lot.model}</h3>

                        <div className="won-figures-grid">
                          <div>
                            <span className="wf-lbl">WINNING BID</span>
                            <span className="wf-val">{formatCurrency(lot.winningBid)}</span>
                          </div>
                          <div>
                            <span className="wf-lbl">TOTAL PAYABLE</span>
                            <span className="wf-val text-red">{formatCurrency(lot.totalPayable)}</span>
                          </div>
                        </div>

                        <div className="won-location-box">
                          <MapPin size={14} className="text-auction-red" />
                          <span>{lot.yardLocation}</span>
                        </div>

                        <div className="won-card-actions">
                          {lot.paymentStatus === 'Pending' ? (
                            <button
                              type="button"
                              className="salvex-btn salvex-btn-primary w-full"
                              onClick={() => onNavigatePayment(lot.id)}
                            >
                              <CreditCard size={16} />
                              <span>Make Payment ({formatCurrency(lot.totalPayable)})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="salvex-btn salvex-btn-success w-full"
                              onClick={() => onNavigateLifting(lot.id)}
                            >
                              <Truck size={16} />
                              <span>View Gate Pass & Lifting ({lot.liftingStatus})</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 4: WATCHLIST
               ------------------------------------------------------------- */}
            {activeTab === 'watchlist' && (
              <div className="tab-pane-content">
                <div className="tab-pane-header">
                  <h2>Saved Vehicles & Watchlist</h2>
                  <p>Keep track of auction dates and live price developments on your favorite vehicle lots.</p>
                </div>

                {savedVehicles.length === 0 ? (
                  <div className="salvex-empty-state">
                    <Heart size={44} className="text-muted" />
                    <h3>Your Watchlist is Empty</h3>
                    <p>Click the heart icon on any vehicle card in the marketplace to add lots to your watchlist.</p>
                  </div>
                ) : (
                  <div className="watchlist-grid">
                    {savedVehicles.map((v) => (
                      <div key={v.id} className="watchlist-card">
                        <div className="wlc-img-wrap">
                          <img src={v.image} alt={`${v.make} ${v.model}`} />
                          <button
                            type="button"
                            className="btn-remove-watch"
                            onClick={() => onRemoveSaved(v.id)}
                            title="Remove from Watchlist"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        <div className="wlc-body">
                          <h4>{v.yearMfg} {v.make} {v.model}</h4>
                          <div className="wlc-price-row">
                            <span className="w-lbl">Current Bid</span>
                            <span className="w-val">{formatCurrency(v.currentBid || v.startingBid)}</span>
                          </div>

                          <div className="wlc-actions">
                            <button
                              type="button"
                              className="salvex-btn salvex-btn-primary btn-sm w-full"
                              onClick={() => onNavigateVehicleDetails(v)}
                            >
                              View Auction
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 5: PAYMENTS & ESCROW LEDGER
               ------------------------------------------------------------- */}
            {activeTab === 'payments' && (
              <div className="tab-pane-content">
                <div className="tab-pane-header">
                  <h2>Escrow Transactions & Payment Statements</h2>
                  <p>Review completed invoices, Earnest Money Deposit (EMD) credits, and statutory receipts.</p>
                </div>

                <div className="escrow-summary-chips">
                  <div className="chip-card">
                    <span className="c-lbl">Active EMD Balance</span>
                    <span className="c-val text-success">₹15,00,000</span>
                  </div>
                  <div className="chip-card">
                    <span className="c-lbl">Settled Invoices</span>
                    <span className="c-val">₹17,91,390</span>
                  </div>
                  <div className="chip-card">
                    <span className="c-lbl">Pending Escrow Inflow</span>
                    <span className="c-val text-red">₹1,62,07,400</span>
                  </div>
                </div>

                <div className="ledger-table-wrap">
                  <table className="salvex-table">
                    <thead>
                      <tr>
                        <th>Invoice / Lot</th>
                        <th>Transaction Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>INV-2026-8812</strong><br />
                          <span className="text-muted">BMW 330i Luxury</span>
                        </td>
                        <td>26 Sep 2026</td>
                        <td>Lot Settlement</td>
                        <td>₹17,91,390</td>
                        <td><span className="badge-paid">Paid</span></td>
                        <td>
                          <button type="button" className="btn-table-action" onClick={() => onShowToast('Downloading official tax invoice PDF...')}>
                            <Download size={14} /> Receipt
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>INV-2026-9901</strong><br />
                          <span className="text-muted">Defender 110 V8</span>
                        </td>
                        <td>Pending (Due 02 Oct)</td>
                        <td>Lot Settlement</td>
                        <td>₹1,62,07,400</td>
                        <td><span className="badge-pending">Pending</span></td>
                        <td>
                          <button type="button" className="btn-table-action action-pay" onClick={() => onNavigatePayment('won-101')}>
                            Pay Now →
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>EMD-POOL-770</strong><br />
                          <span className="text-muted">Security Deposit</span>
                        </td>
                        <td>15 Sep 2026</td>
                        <td>Pre-Bid Security</td>
                        <td>₹15,00,000</td>
                        <td><span className="badge-verified">Active In Escrow</span></td>
                        <td>
                          <button type="button" className="btn-table-action" onClick={() => onShowToast('Settlement certificate verified (Demo).')}>
                            Statement
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 6: KYC & DOCUMENTS
               ------------------------------------------------------------- */}
            {activeTab === 'documents' && (
              <div className="tab-pane-content">
                <div className="tab-pane-header">
                  <h2>Bidder Verification & Statutory Documents</h2>
                  <p>Your identity has been verified under compliance guidelines for bank and court auction participation.</p>
                </div>

                <div className="kyc-status-banner verified">
                  <CheckCircle2 size={32} className="text-success" />
                  <div>
                    <h4>Tier-2 Commercial Bidder Status: Active</h4>
                    <p>Authorized for bidding on luxury exotics, bank liquidations, and commercial equipment lots up to ₹5 Crores.</p>
                  </div>
                </div>

                <div className="kyc-documents-grid">
                  <div className="kyc-doc-card">
                    <div className="kdc-header">
                      <FileText size={18} />
                      <span className="kdc-status valid">Verified</span>
                    </div>
                    <h4>Permanent Account Number (PAN)</h4>
                    <p className="doc-num">AAACV••••F</p>
                    <span className="verified-date">Validated via NSDL Database</span>
                  </div>

                  <div className="kyc-doc-card">
                    <div className="kdc-header">
                      <FileText size={18} />
                      <span className="kdc-status valid">Verified</span>
                    </div>
                    <h4>Aadhaar / Director Passport</h4>
                    <p className="doc-num">•••• •••• 8842</p>
                    <span className="verified-date">UIDAI Biometric OTP Verified</span>
                  </div>

                  <div className="kyc-doc-card">
                    <div className="kdc-header">
                      <FileText size={18} />
                      <span className="kdc-status valid">Verified</span>
                    </div>
                    <h4>Police Clearance Certificate (PCC)</h4>
                    <p className="doc-num">PCC-BLR-2026-9901</p>
                    <span className="verified-date">Valid till 15 March 2027</span>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 7: VEHICLE LIFTING
               ------------------------------------------------------------- */}
            {activeTab === 'lifting' && (
              <div className="tab-pane-content">
                <div className="tab-pane-header">
                  <h2>Post-Auction Vehicle Lifting & Yard Gate Passes</h2>
                  <p>Access your authorized digital gate passes and regional stockyard pickup instructions.</p>
                </div>

                <div className="lifting-lot-box">
                  <div className="llb-header">
                    <div>
                      <span className="badge-pass">GATE PASS ISSUED</span>
                      <h3>2020 BMW 3 Series 330i Luxury Line</h3>
                      <p>Gate Pass ID: <strong>GP-CHN-2026-3391</strong></p>
                    </div>
                    <button
                      type="button"
                      className="salvex-btn salvex-btn-primary"
                      onClick={() => onNavigateLifting('won-102')}
                    >
                      <Truck size={15} />
                      <span>Open Full Lifting Dossier</span>
                    </button>
                  </div>

                  {/* 4-Stage Status Bar */}
                  <div className="lifting-timeline-bar">
                    <div className="timeline-step step-done">
                      <div className="dot">✓</div>
                      <span>Payment Completed</span>
                    </div>
                    <div className="timeline-step step-done">
                      <div className="dot">✓</div>
                      <span>Documents Verified</span>
                    </div>
                    <div className="timeline-step step-done">
                      <div className="dot">✓</div>
                      <span>Vehicle Ready at Yard</span>
                    </div>
                    <div className="timeline-step step-pending">
                      <div className="dot">4</div>
                      <span>Vehicle Collected</span>
                    </div>
                  </div>

                  <div className="yard-pickup-details">
                    <div className="yp-col">
                      <span className="yp-lbl">YARD FACILITY</span>
                      <p>Salvex Regional Yard, GST Road, Guindy, Chennai, TN 600032</p>
                    </div>
                    <div className="yp-col">
                      <span className="yp-lbl">YARD MANAGER</span>
                      <p>Yard Desk (+91 00000 00000)</p>
                    </div>
                    <div className="yp-col">
                      <span className="yp-lbl">FREE STORAGE UNTIL</span>
                      <p className="text-success">01 Oct 2026 (3 Days Left)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 8: NOTIFICATIONS
               ------------------------------------------------------------- */}
            {activeTab === 'notifications' && (
              <div className="tab-pane-content">
                <div className="tab-pane-header-row">
                  <div>
                    <h2>Notification Center</h2>
                    <p>Real-time outbid warnings, auction extensions, payment alerts, and gate pass issuances.</p>
                  </div>
                  <button
                    type="button"
                    className="salvex-btn salvex-btn-outline btn-sm"
                    onClick={markAllNotifsRead}
                  >
                    Mark All as Read
                  </button>
                </div>

                <div className="notifications-list">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notif-item ${notif.read ? 'notif-read' : 'notif-unread'}`}
                    >
                      <div className={`notif-icon notif-${notif.type}`}>
                        {notif.type === 'outbid' && <AlertCircle size={18} />}
                        {notif.type === 'won' && <Trophy size={18} />}
                        {notif.type === 'kyc' && <ShieldCheck size={18} />}
                        {notif.type === 'lifting' && <Truck size={18} />}
                      </div>

                      <div className="notif-content">
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 9: PROFILE SETTINGS
               ------------------------------------------------------------- */}
            {activeTab === 'profile' && (
              <div className="tab-pane-content">
                <div className="tab-pane-header">
                  <h2>Bidder Profile & Account Security</h2>
                  <p>Manage your authorized entity details, refund bank accounts, and contact credentials.</p>
                </div>

                <div className="profile-form-grid">
                  <div className="form-field">
                    <label>Full Legal Name</label>
                    <input type="text" readOnly defaultValue="Rahul Sharma" />
                  </div>

                  <div className="form-field">
                    <label>Corporate / Trade Entity</label>
                    <input type="text" readOnly defaultValue="Enterprise Holdings LLP" />
                  </div>

                  <div className="form-field">
                    <label>Registered Email</label>
                    <input type="email" readOnly defaultValue="demo.bidder@example.com" />
                  </div>

                  <div className="form-field">
                    <label>Mobile Number (SMS Alert Enabled)</label>
                    <input type="tel" readOnly defaultValue="+91 00000 00000" />
                  </div>

                  <div className="form-field full-width">
                    <label>Default Refund Escrow Bank Account (For EMD Returns)</label>
                    <input
                      type="text"
                      readOnly
                      defaultValue="Sample Bank • A/C No: 00000049281920 • IFSC: SMPL0000128"
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
