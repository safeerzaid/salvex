import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Copy,
  Check,
  Truck
} from 'lucide-react';
import { wonAuctionsData } from '../data/mockVehicles';
import './PaymentPage.css';

export default function PaymentPage({
  lotId: propLotId,
  onNavigateLifting,
  onNavigateDashboard,
  onShowToast
}) {
  const { lotId: paramLotId } = useParams();
  const targetLotId = paramLotId || propLotId || 'won-101';
  const lot = wonAuctionsData.find((l) => l.id === targetLotId);

  const [paymentStatus, setPaymentStatus] = useState(lot?.paymentStatus || 'Pending'); // 'Pending' | 'Processing' | 'Paid' | 'Failed'
  const [paymentMethod, setPaymentMethod] = useState('rtgs'); // 'rtgs' | 'netbanking'
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  if (!lot) {
    return <Navigate to="/dashboard" replace />;
  }

  // Financial calculations
  const winningBid = lot.winningBid || 0;
  const buyerPremium = lot.buyerPremium ?? Math.round(winningBid * 0.025); // 2.5% platform fee
  const documentationCharges = lot.documentationCharges ?? 0;
  const gstTaxes = lot.gstTaxes ?? Math.round((buyerPremium + documentationCharges) * 0.18); // 18% GST on platform fees
  const depositCredit = Math.abs(lot.securityDepositAdjustment ?? 0); // EMD deduction
  const totalPayable = winningBid + buyerPremium + documentationCharges + gstTaxes - depositCredit;

  const formatCurrency = (amt) => {
    const val = Number(amt || 0);
    const isNeg = val < 0;
    return `${isNeg ? '-' : ''}₹${Math.abs(val).toLocaleString('en-IN')}`;
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (onShowToast) onShowToast(`${fieldName} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    setPaymentStatus('Processing');

    setTimeout(() => {
      setPaymentStatus('Paid');
      if (onShowToast) {
        onShowToast('Payment verified (demo)! Digital Gate Pass has been issued.');
      }
    }, 1200);
  };

  return (
    <div className="salvex-payment-page">
      {/* 01 HEADER */}
      <section className="payment-hero">
        <div className="salvex-container">
          <div className="payment-hero-inner">
            <span className="payment-pill">
              <ShieldCheck size={14} />
              Secure settlement (demo)
            </span>
            <h1 className="payment-title">Settlement & Invoice Checkout (Demo)</h1>
            <p className="payment-subtitle">
              Settlement portal (demo) for Lot #{lot.id.toUpperCase()} • {lot.yearMfg} {lot.make} {lot.model}.
            </p>
          </div>
        </div>
      </section>

      {/* 02 MAIN CHECKOUT CONTENT */}
      <section className="payment-body-section">
        <div className="salvex-container">
          <div className="payment-layout-grid">
            {/* LEFT COLUMN: INVOICE BREAKDOWN & VEHICLE SUMMARY */}
            <div className="invoice-left-col">
              {/* Vehicle Summary Card */}
              <div className="payment-vehicle-card">
                <img src={lot.image} alt={`${lot.make} ${lot.model}`} className="pv-thumb" />
                <div className="pv-info">
                  <span className="pv-badge">LOT WON</span>
                  <h3>{lot.yearMfg} {lot.make} {lot.model}</h3>
                  <p className="pv-yard">Holding Yard: {lot.yardLocation}</p>
                </div>
              </div>

              {/* Comprehensive Invoice Breakdown */}
              <div className="invoice-breakdown-card">
                <div className="ibc-header">
                  <FileText size={18} />
                  <h3>Official Commercial Invoice Breakdown</h3>
                  <span className="invoice-no">#SLX-INV-9901</span>
                </div>

                <div className="ibc-rows-list">
                  <div className="ibc-row">
                    <span className="row-label">Winning Hammer Bid Consideration</span>
                    <span className="row-value">{formatCurrency(winningBid)}</span>
                  </div>

                  <div className="ibc-row">
                    <span className="row-label">
                      Buyer’s Premium (Platform Success Fee @ 2.5%)
                    </span>
                    <span className="row-value">{formatCurrency(buyerPremium)}</span>
                  </div>

                  <div className="ibc-row">
                    <span className="row-label">Yard Logistics & RTO NOC Documentation</span>
                    <span className="row-value">{formatCurrency(documentationCharges)}</span>
                  </div>

                  <div className="ibc-row">
                    <span className="row-label">Statutory Goods & Services Tax (GST 18% on Fees)</span>
                    <span className="row-value">{formatCurrency(gstTaxes)}</span>
                  </div>

                  <div className="ibc-row discount-row">
                    <span className="row-label">Pre-Bid Security Deposit (EMD Credit)</span>
                    <span className="row-value text-success">- {formatCurrency(depositCredit)}</span>
                  </div>

                  <div className="ibc-divider" />

                  <div className="ibc-total-row">
                    <div>
                      <span className="total-title">Total Net Payable Consideration</span>
                      <span className="total-sub">Includes all platform, gate, and documentation fees</span>
                    </div>
                    <span className="total-amount-val text-red">
                      {formatCurrency(totalPayable)}
                    </span>
                  </div>
                </div>

                <div className="payment-deadline-warning">
                  <Clock size={16} className="text-warning" />
                  <div>
                    <strong>Mandatory Settlement Deadline:</strong> {lot.paymentDeadline}
                    <p className="text-muted">Failure to settle within the designated window results in EMD forfeiture under Section 5.2 of the Auction Bylaws.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ESCROW PAYMENT METHODS & PROCESSING STATES */}
            <div className="payment-right-col">
              {/* Payment State: PAID */}
              {paymentStatus === 'Paid' && (
                <div className="payment-status-card status-success-card">
                  <div className="icon-circ success-circ">
                    <CheckCircle2 size={44} className="text-success" />
                  </div>
                  <h2>Payment Cleared & Confirmed</h2>
                  <p className="status-desc">
                    The settlement consideration of <strong>{formatCurrency(totalPayable)}</strong> was recorded in local demonstration session.
                  </p>

                  <div className="settlement-receipt-box">
                    <div className="srb-row">
                      <span>Receipt Number:</span>
                      <strong>REC-2026-BLR-8842</strong>
                    </div>
                    <div className="srb-row">
                      <span>Gate Pass Status:</span>
                      <strong className="text-success">Generated & Active</strong>
                    </div>
                    <div className="srb-row">
                      <span>Complimentary Storage:</span>
                      <strong>5 Business Days Remaining</strong>
                    </div>
                  </div>

                  <div className="status-actions">
                    <button
                      type="button"
                      className="salvex-btn salvex-btn-primary w-full"
                      onClick={() => onNavigateLifting(lot.id)}
                    >
                      <Truck size={16} />
                      <span>Proceed to Vehicle Lifting & Gate Pass</span>
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      className="salvex-btn salvex-btn-outline w-full"
                      onClick={() => onShowToast('Tax invoice PDF downloaded.')}
                    >
                      <Download size={15} />
                      <span>Download Statutory Tax Invoice</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Payment State: PROCESSING */}
              {paymentStatus === 'Processing' && (
                <div className="payment-status-card status-processing-card">
                  <div className="spinner-large" />
                  <h2>Verifying RTGS / Settlement Clearance (Demo)</h2>
                  <p className="status-desc">
                    Simulating communication with banking rails to match your transaction reference (demo)...
                  </p>
                  <span className="stat-hint">Please do not close this browser window.</span>
                </div>
              )}

              {/* Payment State: PENDING (Default Form) */}
              {paymentStatus === 'Pending' && (
                <div className="payment-form-card">
                  <div className="pfc-header">
                    <Building2 size={20} />
                    <div>
                      <h3>Sample Settlement Banking Details (Demo)</h3>
                      <p>Demo account details for simulated RTGS / NEFT remittance.</p>
                    </div>
                  </div>

                  {/* Virtual Account Grid */}
                  <div className="virtual-account-table">
                    <div className="va-row">
                      <span className="va-lbl">Beneficiary Name</span>
                      <div className="va-val-wrap">
                        <strong>SALVEX DEMO SETTLEMENT</strong>
                        <button
                          type="button"
                          className="btn-copy"
                          onClick={() => handleCopy('SALVEX DEMO SETTLEMENT', 'Beneficiary Name')}
                        >
                          {copiedField === 'Beneficiary Name' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="va-row">
                      <span className="va-lbl">Bank Name</span>
                      <div className="va-val-wrap">
                        <span>Sample Bank (Corporate Banking Demo)</span>
                      </div>
                    </div>

                    <div className="va-row">
                      <span className="va-lbl">Virtual Account Number</span>
                      <div className="va-val-wrap">
                        <strong className="text-red">DEMO-SLVX-99018842</strong>
                        <button
                          type="button"
                          className="btn-copy"
                          onClick={() => handleCopy('DEMO-SLVX-99018842', 'Virtual Account Number')}
                        >
                          {copiedField === 'Virtual Account Number' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="va-row">
                      <span className="va-lbl">IFSC Code</span>
                      <div className="va-val-wrap">
                        <strong>SMPL0000128</strong>
                        <button
                          type="button"
                          className="btn-copy"
                          onClick={() => handleCopy('SMPL0000128', 'IFSC Code')}
                        >
                          {copiedField === 'IFSC Code' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* UTR Submission Form */}
                  <form onSubmit={handleSimulatePayment} className="utr-submission-form">
                    <div className="form-field">
                      <label htmlFor="utr-input">16-Digit Bank UTR / Transaction Reference Number *</label>
                      <input
                        type="text"
                        id="utr-input"
                        required
                        placeholder="e.g. DEMOR520260930008819"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                      />
                      <span className="utr-hint">
                        Enter the Unique Transaction Reference (UTR) provided by your bank post-transfer.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="salvex-btn salvex-btn-primary btn-settle-action"
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirm Settlement Remittance (Demo: {formatCurrency(totalPayable)})</span>
                    </button>

                    <button
                      type="button"
                      className="salvex-btn salvex-btn-ghost w-full"
                      onClick={onNavigateDashboard}
                    >
                      <span>Return to Bidder Dashboard</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
