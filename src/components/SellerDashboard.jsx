import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Car,
  Eye,
  ArrowRight,
  ShieldCheck,
  Download
} from 'lucide-react';
import { sellerListingsData } from '../data/mockVehicles';

export default function SellerDashboard({
  onNavigateListVehicle,
  onNavigateVehicleDetails,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('listings'); // 'overview' | 'listings' | 'live' | 'sold' | 'payments'
  const [statusFilter, setStatusFilter] = useState('All');
  const [listings, setListings] = useState(sellerListingsData);

  const filteredListings = listings.filter((item) => {
    if (statusFilter === 'All') return true;
    return item.status === statusFilter;
  });

  const formatCurrency = (amt) => {
    return '₹' + Number(amt || 0).toLocaleString('en-IN');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Live': return 'status-live';
      case 'Under Review': return 'status-review';
      case 'Approved': return 'status-approved';
      case 'Sold': return 'status-sold';
      case 'Draft': return 'status-draft';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  return (
    <div className="salvex-seller-dashboard-page">
      {/* 01 SELLER HEADER */}
      <section className="seller-header-banner">
        <div className="salvex-container">
          <div className="seller-header-content">
            <div className="seller-profile-row">
              <div className="seller-icon-box">
                <Building2 size={24} />
              </div>
              <div>
                <div className="seller-title-wrap">
                  <h2>Institutional Consignor (Demo)</h2>
                  <span className="seller-verified-pill">
                    <ShieldCheck size={14} /> Institutional Consignor (Demo)
                  </span>
                </div>
                <div className="seller-meta-row">
                  <span>Consignor ID: <strong>DEMO-SEL-4091</strong></span>
                  <span>•</span>
                  <span>Portfolio: <strong>Automotive & Equipment Liquidations</strong></span>
                  <span>•</span>
                  <span>Settlement Rail: <strong>Secure settlement (demo)</strong></span>
                </div>
              </div>
            </div>

            <div className="seller-cta-box">
              <button
                type="button"
                className="salvex-btn salvex-btn-primary"
                onClick={onNavigateListVehicle}
              >
                <PlusCircle size={16} />
                <span>List New Vehicle</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 02 STAT CARDS */}
      <section className="seller-stats-section">
        <div className="salvex-container">
          <div className="seller-stats-grid">
            <div className="sstat-card">
              <span className="sstat-lbl">Total Sourced Lots</span>
              <span className="sstat-val">28 Lots</span>
              <span className="sstat-sub">Across 4 regional hubs</span>
            </div>

            <div className="sstat-card">
              <span className="sstat-lbl">Active Live Auctions</span>
              <span className="sstat-val text-red">4 Live</span>
              <span className="sstat-sub">Active bidding in progress</span>
            </div>

            <div className="sstat-card">
              <span className="sstat-lbl">Pending Technical Review</span>
              <span className="sstat-val text-warning">2 Lots</span>
              <span className="sstat-sub">Inspection & RC verification</span>
            </div>

            <div className="sstat-card">
              <span className="sstat-lbl">Settled Sales Payout</span>
              <span className="sstat-val text-success">₹4.85 Cr (sample)</span>
              <span className="sstat-sub">Sample consignor settlement total</span>
            </div>
          </div>
        </div>
      </section>

      {/* 03 MAIN DASHBOARD BODY */}
      <section className="seller-main-body">
        <div className="salvex-container">
          <div className="seller-content-card">
            {/* Nav & Filters Bar */}
            <div className="seller-controls-row">
              <div className="seller-tabs">
                <button
                  type="button"
                  className={`stab-btn ${activeTab === 'listings' ? 'stab-active' : ''}`}
                  onClick={() => setActiveTab('listings')}
                >
                  <span>Inventory Portfolio</span>
                  <span className="counter-pill">{listings.length}</span>
                </button>

                <button
                  type="button"
                  className={`stab-btn ${activeTab === 'payments' ? 'stab-active' : ''}`}
                  onClick={() => setActiveTab('payments')}
                >
                  <span>Settlements & Payouts</span>
                </button>
              </div>

              {activeTab === 'listings' && (
                <div className="seller-status-filter">
                  <label>Status Filter:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="seller-select"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Live">Live</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              )}
            </div>

            {/* TAB: LISTINGS */}
            {activeTab === 'listings' && (
              <div className="seller-table-wrap">
                <table className="seller-table">
                  <thead>
                    <tr>
                      <th>Vehicle Lot</th>
                      <th>Submission Date</th>
                      <th>Yard Hub</th>
                      <th>Reserve Price</th>
                      <th>Highest Live Bid</th>
                      <th>Listing Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map((lot) => (
                      <tr key={lot.id}>
                        <td>
                          <div className="vehicle-cell-split">
                            <img src={lot.image} alt={lot.model} className="v-thumb" />
                            <div>
                              <strong>{lot.yearMfg} {lot.make} {lot.model}</strong>
                              <span className="v-km">{lot.kmDriven}</span>
                            </div>
                          </div>
                        </td>
                        <td>{lot.submissionsDate}</td>
                        <td>{lot.location}</td>
                        <td>{formatCurrency(lot.reservePrice)}</td>
                        <td>
                          {lot.currentHighestBid > 0 ? (
                            <strong className="text-red">{formatCurrency(lot.currentHighestBid)}</strong>
                          ) : (
                            <span className="text-muted">Awaiting Live Opening</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${getStatusClass(lot.status)}`}>
                            {lot.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            {lot.status === 'Live' && (
                              <button
                                type="button"
                                className="btn-action-icon"
                                title="Monitor Live Auction"
                                onClick={() => onNavigateVehicleDetails({ id: 'salvex-103' })}
                              >
                                <Eye size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-action-text"
                              onClick={() => onShowToast(`Inspecting dossier for Lot ${lot.id}...`)}
                            >
                              Dossier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: PAYMENTS & SETTLEMENTS */}
            {activeTab === 'payments' && (
              <div className="seller-settlement-pane">
                <div className="settlement-hero-box">
                  <div>
                    <h3>Consignor Settlement Ledger (Demo)</h3>
                    <p>Sample net proceeds from winning bids after deducting platform facilitation fees.</p>
                  </div>
                  <button
                    type="button"
                    className="salvex-btn salvex-btn-outline"
                    onClick={() => onShowToast('Exporting FY2026-27 Settlement Ledger CSV...')}
                  >
                    <Download size={14} />
                    <span>Export Payouts CSV</span>
                  </button>
                </div>

                <div className="seller-table-wrap">
                  <table className="seller-table">
                    <thead>
                      <tr>
                        <th>Disbursement Ref</th>
                        <th>Sold Vehicle</th>
                        <th>Winning Hammer Price</th>
                        <th>Platform Commission</th>
                        <th>Net Remittance</th>
                        <th>Bank UTR Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>DISB-2026-9041</strong></td>
                        <td>2022 Volvo XC90 B6 Inscription</td>
                        <td>₹53,50,000</td>
                        <td>-₹1,33,750 (2.5%)</td>
                        <td><strong className="text-success">₹52,16,250</strong></td>
                        <td><code>DEMOR520260912004491</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
