import React, { useState, useEffect } from 'react';
import { X, Gavel, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BID_INCREMENT } from '../constants';

export default function BidModal({ vehicle, isOpen, onClose, onConfirmBid }) {
  const currentBid = vehicle?.currentBid || vehicle?.startingBid || 0;
  const isEnded =
    vehicle?.status === 'ended' ||
    vehicle?.badge === 'ENDED' ||
    (vehicle?.endsInSeconds !== undefined && vehicle.endsInSeconds <= 0);

  const minValidBid = currentBid + BID_INCREMENT;
  const [bidAmount, setBidAmount] = useState(minValidBid);
  const [agreed, setAgreed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize default bid when vehicle changes or modal opens
  useEffect(() => {
    if (vehicle) {
      const base = vehicle.currentBid || vehicle.startingBid || 0;
      setBidAmount(base + BID_INCREMENT);
      setErrorMsg('');
      setAgreed(false);
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [vehicle?.id, vehicle?.currentBid, vehicle?.startingBid, isOpen]);

  if (!isOpen || !vehicle) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleIncrement = (inc) => {
    if (isEnded) return;
    setBidAmount(currentBid + inc);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isEnded) {
      setErrorMsg('This auction has ended. Bidding is closed for this lot.');
      return;
    }

    // Input validation: empty, NaN, zero, negative numbers, decimals
    const num = Number(bidAmount);
    if (bidAmount === '' || bidAmount === null || bidAmount === undefined || isNaN(num) || !isFinite(num)) {
      setErrorMsg('Please enter a valid numeric bid amount.');
      return;
    }
    if (num <= 0) {
      setErrorMsg('Bid amount must be greater than zero.');
      return;
    }
    if (!Number.isInteger(num)) {
      setErrorMsg('Decimal bids are not accepted. Please enter a whole rupee amount.');
      return;
    }
    if (num < currentBid + BID_INCREMENT) {
      setErrorMsg(`Minimum bid is ${formatCurrency(currentBid + BID_INCREMENT)} (minimum valid increment is ${formatCurrency(BID_INCREMENT)}).`);
      return;
    }
    if (!agreed) {
      setErrorMsg('Please confirm agreement to Salvex auction bidding terms');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(true);
    setTimeout(() => {
      onConfirmBid(vehicle.id, num);
      setIsSuccess(false);
      setIsSubmitting(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-bid-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-bubble">
              <Gavel size={20} className="text-auction-red" />
            </div>
            <div>
              <h3 className="modal-title">Place Live Bid</h3>
              <p className="modal-subtitle">Lot #{vehicle.id ? vehicle.id.toUpperCase() : 'DEMO'} • {vehicle.make} {vehicle.model}</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {isEnded && (
          <div className="modal-error-alert" style={{ margin: '16px 20px 0 20px' }}>
            <AlertCircle size={16} />
            <span>This auction lot has ended. Bidding is permanently closed.</span>
          </div>
        )}

        {isSuccess ? (
          <div className="bid-success-content">
            <CheckCircle2 size={52} className="text-success" />
            <h4 className="success-heading">Bid Placed Successfully!</h4>
            <p className="success-text">
              Your bid of <strong>{formatCurrency(bidAmount)}</strong> was recorded (demo mode).
            </p>
          </div>
        ) : (
          <form className="modal-body-form" onSubmit={handleSubmit}>
            {/* Vehicle Mini Summary */}
            <div className="modal-vehicle-summary">
              <img src={vehicle.image} alt={vehicle.model} className="summary-thumb" />
              <div className="summary-info">
                <div className="summary-title">{vehicle.make} {vehicle.model}</div>
                <div className="summary-tags">
                  <span>{vehicle.yearMfg || vehicle.year || 'N/A'}</span> • <span>{vehicle.fuel || 'N/A'}</span> • <span>{vehicle.kmDriven || 'N/A'}</span>
                </div>
                <div className="summary-location">{vehicle.location || 'Location Not available'}</div>
              </div>
            </div>

            {/* Current Price Box */}
            <div className="modal-prices-grid">
              <div className="modal-price-box">
                <span className="price-box-label">Starting Bid</span>
                <span className="price-box-value">{formatCurrency(vehicle.startingBid)}</span>
              </div>
              <div className="modal-price-box price-box-active">
                <span className="price-box-label">Current Highest Bid</span>
                <span className="price-box-value highlight-red">{formatCurrency(currentBid)}</span>
              </div>
            </div>

            {/* Quick Increment Buttons */}
            <div className="quick-increments-section">
              <label className="increment-label">Quick Bid Increments (+ over current bid):</label>
              <div className="increment-buttons-row">
                {[BID_INCREMENT, 25000, 50000, 100000].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    disabled={isEnded || isSubmitting}
                    className={`btn-increment-chip ${bidAmount === currentBid + inc ? 'chip-active' : ''}`}
                    onClick={() => handleIncrement(inc)}
                  >
                    +₹{(inc / 1000).toLocaleString('en-IN')}K
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Bid Input */}
            <div className="custom-bid-group">
              <label htmlFor="custom-bid-input" className="field-label">
                Enter Your Maximum Bid (INR)
              </label>
              <div className="currency-input-wrap">
                <span className="rupee-symbol">₹</span>
                <input
                  id="custom-bid-input"
                  type="number"
                  min={currentBid + BID_INCREMENT}
                  step={BID_INCREMENT}
                  value={bidAmount}
                  disabled={isEnded || isSubmitting}
                  onChange={(e) => {
                    setBidAmount(e.target.value === '' ? '' : Number(e.target.value));
                    setErrorMsg('');
                  }}
                  className="bid-number-input"
                />
              </div>
              <span className="field-hint">
                Minimum valid increment is {formatCurrency(BID_INCREMENT)} above current bid. Minimum bid is {formatCurrency(currentBid + BID_INCREMENT)}.
              </span>
            </div>

            {errorMsg && (
              <div className="modal-error-alert">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Terms checkbox */}
            <label className="modal-terms-checkbox">
              <input
                type="checkbox"
                checked={agreed}
                disabled={isEnded || isSubmitting}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I understand this bid is a sample offer in this demo environment,
                and test deposit balance is maintained.
              </span>
            </label>

            {/* Submit CTA */}
            <div className="modal-actions-row">
              <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 btn-large"
                disabled={isSubmitting || isEnded}
              >
                <Gavel size={18} />
                <span>
                  {isSubmitting
                    ? 'Processing Bid...'
                    : isEnded
                    ? 'Lot Ended'
                    : `Submit Bid: ${formatCurrency(bidAmount || 0)}`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
