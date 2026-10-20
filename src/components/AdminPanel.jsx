import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Gavel,
  Car,
  CreditCard,
  FileCheck,
  Truck,
  Settings,
  CheckCircle2,
  XCircle,
  Pause
} from 'lucide-react';
import { adminMetricsData, pendingKycReviewData, sellerListingsData, liveVehiclesData } from '../data/mockVehicles';

export default function AdminPanel({
  onShowToast,
  _onNavigateVehicleDetails,
  liveLots: propLiveLots,
  onExtendLot
}) {
  const [selectedRole, setSelectedRole] = useState('Super Admin');
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'auctions' | 'kyc' | 'vehicles' | 'payments' | 'lifting' | 'settings'

  // Admin Operational State
  const [kycQueue, setKycQueue] = useState(pendingKycReviewData);
  const [inventoryQueue, setInventoryQueue] = useState(sellerListingsData);
  const [liveLots, setLiveLots] = useState(propLiveLots || liveVehiclesData);

  useEffect(() => {
    if (propLiveLots) {
      setLiveLots(propLiveLots);
    }
  }, [propLiveLots]);

  const roles = [
    'Super Admin',
    'Auction Manager',
    'Vehicle Manager',
    'KYC Manager',
    'Finance Manager',
    'Support Manager'
  ];

  const formatCurrency = (amt) => {
    return '₹' + Number(amt || 0).toLocaleString('en-IN');
  };

  // Actions
  const handleApproveKyc = (id, name) => {
    setKycQueue((prev) => prev.filter((k) => k.id !== id));
    if (onShowToast) onShowToast(`KYC Approved: Bidding rights activated for ${name}`);
  };

  const handleRejectKyc = (id, name) => {
    setKycQueue((prev) => prev.filter((k) => k.id !== id));
    if (onShowToast) onShowToast(`KYC Rejected: Deficiency notification dispatched to ${name}`);
  };

  const handleApproveListing = (id, title) => {
    setInventoryQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item))
    );
    if (onShowToast) onShowToast(`Listing Approved: ${title} scheduled for auction.`);
  };

  const handleExtendAuction = (id, title) => {
    setLiveLots((prev) =>
      prev.map((lot) =>
        lot.id === id ? { ...lot, endsInSeconds: (lot.endsInSeconds || 0) + 120 } : lot
      )
    );
    if (onExtendLot) {
      onExtendLot(id, 120);
    }
    if (onShowToast) {
      onShowToast(`Anti-Sniping Overtime (+120s) added to ${title}. Time extended!`);
    }
  };

  return (
    <div className="salvex-admin-panel-page">
      {/* 01 TOP COMMAND BAR */}
      <header className="admin-command-bar">
        <div className="admin-bar-inner">
          <div className="admin-bar-left">
            <div className="admin-shield-icon">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="admin-title-row">
                <span className="admin-title">SALVEX COMMAND CENTER</span>
                <span className="admin-live-pulse" />
                <span className="admin-live-text">OPERATIONS DESK LIVE</span>
              </div>
              <span className="admin-sub">Central Automotive Liquidation Operations Terminal</span>
            </div>
          </div>

          <div className="admin-role-selector-wrap">
            <label htmlFor="admin-role-select">Active Persona Role:</label>
            <select
              id="admin-role-select"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                if (onShowToast) onShowToast(`Switched active view to ${e.target.value}`);
              }}
              className="admin-role-select"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 02 MAIN ADMIN LAYOUT */}
      <div className="admin-layout-container">
        {/* SIDEBAR NAVIGATION */}
        <aside className="admin-sidebar">
          <nav className="admin-nav-list">
            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'overview' ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <ShieldCheck size={16} />
              <span>Operations Overview</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'auctions' ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveSection('auctions')}
            >
              <Gavel size={16} />
              <span>Live Auction Control</span>
              <span className="admin-badge-count">{liveLots.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'kyc' ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveSection('kyc')}
            >
              <FileCheck size={16} />
              <span>KYC & Bidders Queue</span>
              {kycQueue.length > 0 && (
                <span className="admin-badge-alert">{kycQueue.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'vehicles' ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveSection('vehicles')}
            >
              <Car size={16} />
              <span>Vehicle Consignments</span>
              <span className="admin-badge-count">{inventoryQueue.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'payments' ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveSection('payments')}
            >
              <CreditCard size={16} />
              <span>Escrow & Payments</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'lifting' ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveSection('lifting')}
            >
              <Truck size={16} />
              <span>Yard & Gate Passes</span>
              <span className="admin-badge-count">12</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'settings' ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <Settings size={16} />
              <span>Platform Config</span>
            </button>
          </nav>
        </aside>

        {/* ADMIN CONTENT PANEL */}
        <main className="admin-main-panel">
          {/* TAB 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="admin-pane">
              <div className="admin-pane-header">
                <h2>Real-Time Operations Dashboard</h2>
                <span className="admin-timestamp">Refreshed 30s ago • 14 Stockyards Online</span>
              </div>

              {/* 6 Key Operational Metric Cards */}
              <div className="admin-metrics-grid">
                <div className="metric-box">
                  <span className="m-lbl">ACTIVE LIVE AUCTIONS</span>
                  <span className="m-val text-red">{adminMetricsData.totalActiveAuctions} Lots</span>
                  <span className="m-sub">₹48.2 Cr combined reserve</span>
                </div>

                <div className="metric-box">
                  <span className="m-lbl">PENDING KYC VERIFICATION</span>
                  <span className="m-val text-warning">{kycQueue.length} Bidders</span>
                  <span className="m-sub">Target review SLA: &lt; 4 hours</span>
                </div>

                <div className="metric-box">
                  <span className="m-lbl">CONSIGNOR SUBMISSIONS</span>
                  <span className="m-val">{adminMetricsData.pendingListingApprovals} Lots</span>
                  <span className="m-sub">Awaiting technical yard inspection</span>
                </div>

                <div className="metric-box">
                  <span className="m-lbl">TOTAL SETTLEMENT INFLOW (SAMPLE)</span>
                  <span className="m-val text-success">{formatCurrency(adminMetricsData.totalEscrowInflow)}</span>
                  <span className="m-sub">Held in secure settlement account (demo)</span>
                </div>

                <div className="metric-box">
                  <span className="m-lbl">VEHICLES IN STOCKYARDS</span>
                  <span className="m-val">{adminMetricsData.vehiclesInYard} Assets</span>
                  <span className="m-sub">Spread across 6 regional hubs</span>
                </div>

                <div className="metric-box">
                  <span className="m-lbl">AWAITING YARD LIFTING</span>
                  <span className="m-val text-info">{adminMetricsData.vehiclesAwaitingLifting} Lots</span>
                  <span className="m-sub">Digital gate passes active</span>
                </div>
              </div>

              {/* Quick Queue Previews */}
              <div className="admin-split-grid">
                {/* KYC Urgent */}
                <div className="admin-box">
                  <div className="box-head">
                    <h3>Pending KYC Submissions</h3>
                    <button
                      type="button"
                      className="link-admin-action"
                      onClick={() => setActiveSection('kyc')}
                    >
                      View All ({kycQueue.length}) →
                    </button>
                  </div>
                  <div className="box-body">
                    {kycQueue.slice(0, 2).map((item) => (
                      <div key={item.id} className="admin-queue-row">
                        <div>
                          <strong>{item.bidderName}</strong>
                          <p>{item.kycType} • PAN: {item.panNumber}</p>
                        </div>
                        <div className="queue-btn-group">
                          <button
                            type="button"
                            className="btn-admin-check"
                            onClick={() => handleApproveKyc(item.id, item.bidderName)}
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Lots Control Room */}
                <div className="admin-box">
                  <div className="box-head">
                    <h3>Active Live Auctions Monitoring</h3>
                    <button
                      type="button"
                      className="link-admin-action"
                      onClick={() => setActiveSection('auctions')}
                    >
                      Control Room →
                    </button>
                  </div>
                  <div className="box-body">
                    {liveLots.slice(0, 2).map((v) => (
                      <div key={v.id} className="admin-queue-row">
                        <div>
                          <strong>{v.yearMfg} {v.make} {v.model}</strong>
                          <p>Current: <strong>{formatCurrency(v.currentBid || v.startingBid)}</strong> • {v.bidCount} bids</p>
                        </div>
                        <button
                          type="button"
                          className="btn-admin-extend"
                          onClick={() => handleExtendAuction(v.id, `${v.make} ${v.model}`)}
                        >
                          +120s Extend
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE AUCTION CONTROL */}
          {activeSection === 'auctions' && (
            <div className="admin-pane">
              <div className="admin-pane-header">
                <h2>Live Auction Command & Anti-Sniping Terminal</h2>
                <p>Monitor live bids in real time, apply overtime extensions, or pause lots during technical checks.</p>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Auction Lot</th>
                      <th>Yard Location</th>
                      <th>Starting Bid</th>
                      <th>Current High Bid</th>
                      <th>Bids</th>
                      <th>Time Remaining</th>
                      <th>Control Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveLots.map((lot) => (
                      <tr key={lot.id}>
                        <td>
                          <div className="lot-cell-desc">
                            <strong>{lot.yearMfg} {lot.make} {lot.model}</strong>
                            <span className="text-muted">ID: {lot.id}</span>
                          </div>
                        </td>
                        <td>{lot.location}</td>
                        <td>{formatCurrency(lot.startingBid)}</td>
                        <td><strong className="text-red">{formatCurrency(lot.currentBid || lot.startingBid)}</strong></td>
                        <td>{lot.bidCount || 0}</td>
                        <td><span className="live-clock-pill">{Math.floor((lot.endsInSeconds || 3600) / 60)}m left</span></td>
                        <td>
                          <div className="action-buttons-flex">
                            <button
                              type="button"
                              className="btn-admin-extend"
                              onClick={() => handleExtendAuction(lot.id, `${lot.make} ${lot.model}`)}
                              title="Add 120s Overtime"
                            >
                              +120s Extend
                            </button>
                            <button
                              type="button"
                              className="btn-admin-pause"
                              onClick={() => onShowToast(`Lot ${lot.id} paused for audit.`)}
                            >
                              Pause
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: KYC & BIDDER QUEUE */}
          {activeSection === 'kyc' && (
            <div className="admin-pane">
              <div className="admin-pane-header">
                <h2>Bidder KYC Verification Queue</h2>
                <p>Review submitted identity documents (PAN, Aadhaar, PCC, Trade Licenses) to grant live bidding rights.</p>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Applicant Name</th>
                      <th>Entity Type</th>
                      <th>PAN Card</th>
                      <th>ID Proof</th>
                      <th>PCC Certificate</th>
                      <th>Submitted</th>
                      <th>Verification Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycQueue.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-muted">
                          All submitted KYC documents have been reviewed. Queue is clear!
                        </td>
                      </tr>
                    ) : (
                      kycQueue.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.bidderName}</strong><br />
                            <span className="text-muted">{item.bidderEmail}</span>
                          </td>
                          <td>{item.kycType}</td>
                          <td><code>{item.panNumber}</code></td>
                          <td>{item.idProof}</td>
                          <td><span className="badge-pcc">{item.pccStatus}</span></td>
                          <td>{item.submittedAt}</td>
                          <td>
                            <div className="action-buttons-flex">
                              <button
                                type="button"
                                className="btn-kyc-approve"
                                onClick={() => handleApproveKyc(item.id, item.bidderName)}
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn-kyc-reject"
                                onClick={() => handleRejectKyc(item.id, item.bidderName)}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VEHICLE CONSIGNMENTS */}
          {activeSection === 'vehicles' && (
            <div className="admin-pane">
              <div className="admin-pane-header">
                <h2>Consignor Vehicle Approval Workflow</h2>
                <p>Approve incoming inventory listings from banks, fleets, and individual sellers.</p>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Consignor</th>
                      <th>Location</th>
                      <th>Reserve Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryQueue.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.yearMfg} {item.make} {item.model}</strong></td>
                        <td>Sample Institutional Consignments</td>
                        <td>{item.location}</td>
                        <td>{formatCurrency(item.reservePrice)}</td>
                        <td><span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span></td>
                        <td>
                          {item.status === 'Under Review' ? (
                            <button
                              type="button"
                              className="btn-kyc-approve"
                              onClick={() => handleApproveListing(item.id, `${item.make} ${item.model}`)}
                            >
                              Approve for Auction
                            </button>
                          ) : (
                            <span className="text-muted">Approved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ESCROW PAYMENTS */}
          {activeSection === 'payments' && (
            <div className="admin-pane">
              <div className="admin-pane-header">
                <h2>Settlement &amp; Reconciliation Desk (Demo)</h2>
                <p>Match incoming RTGS transfers with pending auction invoices and authorize gate pass releases.</p>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Winning Bidder</th>
                      <th>Lot Description</th>
                      <th>Amount Received</th>
                      <th>Settlement Bank</th>
                      <th>Reconciliation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>DEMO-UTR-991204</code></td>
                      <td>Rahul Sharma (SVX-7842)</td>
                      <td>Defender 110 V8 (won-101)</td>
                      <td><strong>₹1,62,07,400</strong></td>
                      <td>Sample Bank Escrow (Demo)</td>
                      <td><span className="badge-paid">Matched &amp; Reconciled</span></td>
                    </tr>
                    <tr>
                      <td><code>DEMO-UTR-330192</code></td>
                      <td>Kailash Autotraders</td>
                      <td>BMW 330i Luxury (won-102)</td>
                      <td><strong>₹17,91,390</strong></td>
                      <td>Sample Settlement Trust (Demo)</td>
                      <td><span className="badge-paid">Matched &amp; Reconciled</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: YARD & GATE PASSES */}
          {activeSection === 'lifting' && (
            <div className="admin-pane">
              <div className="admin-pane-header">
                <h2>Stockyard Logistics & Gate Pass Control</h2>
                <p>Manage physical yard dispatches and authorize transporter exits across regional hubs.</p>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Gate Pass ID</th>
                      <th>Vehicle</th>
                      <th>Yard Hub</th>
                      <th>Authorized Recipient</th>
                      <th>Valid Until</th>
                      <th>Gate Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>GP-BLR-2026-8842</strong></td>
                      <td>Defender 110 V8</td>
                      <td>Bengaluru South Hub</td>
                      <td>Rahul Sharma</td>
                      <td>07 Oct 2026</td>
                      <td><span className="badge-pass">Active Ready</span></td>
                      <td>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => onShowToast('Gate Pass cleared. Vehicle exit registered.')}
                        >
                          Clear Exit
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>GP-CHN-2026-3391</strong></td>
                      <td>BMW 330i Luxury</td>
                      <td>Chennai Guindy Yard</td>
                      <td>Rahul Sharma</td>
                      <td>01 Oct 2026</td>
                      <td><span className="badge-pass">Active Ready</span></td>
                      <td>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => onShowToast('Gate Pass cleared. Vehicle exit registered.')}
                        >
                          Clear Exit
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeSection === 'settings' && (
            <div className="admin-pane">
              <div className="admin-pane-header">
                <h2>Salvex Auction Platform Configuration</h2>
                <p>Manage auction bylaws, anti-sniping window parameters, and institutional integration keys.</p>
              </div>

              <div className="admin-settings-grid">
                <div className="setting-card">
                  <h4>Anti-Sniping Dynamic Overtime</h4>
                  <p>Trigger extension if bids arrive during final countdown seconds.</p>
                  <div className="setting-control-row">
                    <span>Threshold: <strong>60 Seconds</strong></span>
                    <span>Extension: <strong>120 Seconds</strong></span>
                  </div>
                </div>

                <div className="setting-card">
                  <h4>Standard Buyer Premium</h4>
                  <p>Platform success commission charged on winning hammer bid.</p>
                  <div className="setting-control-row">
                    <span>Rate: <strong>2.50%</strong></span>
                    <span>GST: <strong>18% Applicable</strong></span>
                  </div>
                </div>

                <div className="setting-card">
                  <h4>Complimentary Yard Storage Window</h4>
                  <p>Days allowed before yard storage demurrage charges kick in.</p>
                  <div className="setting-control-row">
                    <span>Free Period: <strong>5 Business Days</strong></span>
                    <span>Demurrage: <strong>₹500 / Day</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
