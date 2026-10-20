import React, { useState, useEffect } from 'react';
import {
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Fuel,
  Gauge,
  Settings2,
  MapPin,
  FileCheck,
  ArrowRight,
  Gavel,
  CheckCircle2,
  Download,
  Check,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import './VehicleDetailsPage.css';
import VehicleCard from './VehicleCard';
import { BID_INCREMENT } from '../constants';

export default function VehicleDetailsPage({
  vehicle,
  onNavigateHome,
  onNavigateLiveAuctions,
  _onOpenBidModal,
  _onOpenRegisterModal,
  savedIds = [],
  onToggleSave,
  onViewVehicleDetails,
  similarVehicles = []
}) {
  const vehicleTitle = [vehicle?.yearMfg || vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(' ') || 'Vehicle Details';
  const mainImage = vehicle?.image || '/images/defender-110.jpg';

  // 5 compact gallery photos
  const galleryImages = [
    { id: 1, label: 'Front View', url: mainImage, tag: 'Front' },
    { id: 2, label: 'Rear Angle', url: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80', tag: 'Rear' },
    { id: 3, label: 'Side Profile', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', tag: 'Side' },
    { id: 4, label: 'Interior', url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80', tag: 'Interior' },
    { id: 5, label: 'Engine Bay', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80', tag: '+18 Photos' }
  ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'inspection' | 'auction' | 'documents' | 'history' | 'location'
  const [isCopied, setIsCopied] = useState(false);
  const [isReadMore, setIsReadMore] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isBidConfirmOpen, setIsBidConfirmOpen] = useState(false);

  // Live Auction Parameters
  const startingBid = vehicle?.startingBid || 0;
  const minIncrement = BID_INCREMENT;
  const [currentBid, setCurrentBid] = useState(vehicle?.currentBid || vehicle?.startingBid || 0);
  const [bidCount, setBidCount] = useState(vehicle?.bidCount ?? 0);
  const minNextBid = currentBid + minIncrement;
  const [bidAmount, setBidAmount] = useState(minNextBid);
  const [bidSuccessToast, setBidSuccessToast] = useState(null);

  useEffect(() => {
    if (vehicle) {
      const base = vehicle.currentBid || vehicle.startingBid || 0;
      setCurrentBid(base);
      setBidCount(vehicle.bidCount ?? 0);
      setBidAmount(base + minIncrement);
    }
  }, [vehicle?.id, vehicle?.currentBid, vehicle?.startingBid, vehicle?.bidCount]);

  // Live countdown timer - computed from target end time to remain accurate across tabs
  const initialEndsIn = vehicle?.endsInSeconds !== undefined ? vehicle.endsInSeconds : 15291;
  const [secondsRemaining, setSecondsRemaining] = useState(Math.max(0, initialEndsIn));

  useEffect(() => {
    const totalSec = vehicle?.endsInSeconds !== undefined ? vehicle.endsInSeconds : 15291;
    if (totalSec <= 0) {
      setSecondsRemaining(0);
      return;
    }

    const endTimeMs = Date.now() + totalSec * 1000;

    const updateTimer = () => {
      const diffSec = Math.max(0, Math.round((endTimeMs - Date.now()) / 1000));
      setSecondsRemaining(diffSec);
      if (diffSec <= 0 && timerId) {
        clearInterval(timerId);
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, [vehicle?.id, vehicle?.endsInSeconds]);

  const formatCountdown = (totalSec) => {
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleAddIncrement = (inc) => {
    setBidAmount((prev) => Math.max(minNextBid, prev + inc));
  };

  // Pre-validate and open Confirmation Modal
  const handleInitiateBid = (e) => {
    e.preventDefault();
    if (secondsRemaining <= 0) {
      alert('This auction has ended. Bidding is permanently closed for this lot.');
      return;
    }
    if (bidAmount < minNextBid) {
      alert(`Your bid must meet or exceed the minimum next bid of ${formatCurrency(minNextBid)}`);
      return;
    }
    setIsBidConfirmOpen(true);
  };

  // Confirm and commit bid
  const handleCommitBid = () => {
    setCurrentBid(bidAmount);
    setBidCount((prev) => prev + 1);
    setBidAmount(bidAmount + minIncrement);
    setIsBidConfirmOpen(false);
    setBidSuccessToast(`Bid of ${formatCurrency(bidAmount)} placed successfully! You are now the highest bidder.`);
    setTimeout(() => setBidSuccessToast(null), 4500);
  };

  const isSaved = savedIds.includes(vehicle?.id || 'salvex-103');

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const tabsList = [
    { id: 'details', label: 'Vehicle Details' },
    { id: 'inspection', label: 'Inspection' },
    { id: 'auction', label: 'Auction Info' },
    { id: 'documents', label: 'Documents' },
    { id: 'history', label: 'Bid History' },
    { id: 'location', label: 'Location' }
  ];

  return (
    <div className="salvex-vehicle-minimal-page">
      {/* Toast Feedback */}
      {bidSuccessToast && (
        <div className="minimal-floating-toast" role="alert">
          <CheckCircle2 size={16} color="#16A344" />
          <span>{bidSuccessToast}</span>
          <button type="button" onClick={() => setBidSuccessToast(null)} className="toast-close-btn">
            <X size={13} />
          </button>
        </div>
      )}

      {/* 01 COMPACT BREADCRUMB */}
      <nav className="minimal-breadcrumb-nav" aria-label="Breadcrumb">
        <div className="minimal-page-container">
          <div className="breadcrumb-inner-row">
            <button type="button" onClick={onNavigateHome} className="crumb-btn">
              Home
            </button>
            <span className="crumb-slash">/</span>
            <button
              type="button"
              onClick={onNavigateLiveAuctions || onNavigateHome}
              className="crumb-btn"
            >
              Live Auctions
            </button>
            <span className="crumb-slash">/</span>
            <span className="crumb-active">{vehicleTitle}</span>
          </div>
        </div>
      </nav>

      {/* 02 PRIMARY VEHICLE AREA (Desktop 3-Column: 45% / 28% / 27%) */}
      <section className="primary-vehicle-section">
        <div className="minimal-page-container">
          <div className="primary-vehicle-3col">
            
            {/* COLUMN 1: VEHICLE GALLERY (LEFT 45%) */}
            <div className="gallery-column">
              <div className="gallery-main-frame">
                <img
                  src={galleryImages[activeImageIndex].url}
                  alt={`${vehicleTitle} - ${galleryImages[activeImageIndex].label}`}
                  className="gallery-active-image"
                  onError={(e) => {
                    e.currentTarget.src = mainImage;
                  }}
                />

                {/* LIVE AUCTION Tag (Top Left) */}
                <div className="gallery-live-tag">
                  {secondsRemaining > 0 ? (
                    <>
                      <span className="live-tag-pulse" />
                      <span>LIVE AUCTION</span>
                    </>
                  ) : (
                    <span>AUCTION ENDED</span>
                  )}
                </div>

                {/* Top Right: Counter & Save/Share Icons */}
                <div className="gallery-top-right-group">
                  <span className="gallery-counter-pill">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </span>
                  <button
                    type="button"
                    className={`gallery-save-btn ${isSaved ? 'save-btn-active' : ''}`}
                    onClick={() => onToggleSave && vehicle?.id && onToggleSave(vehicle.id)}
                    title={isSaved ? 'Remove from saved' : 'Save vehicle'}
                    aria-label="Save to watchlist"
                  >
                    <Heart
                      size={15}
                      fill={isSaved ? '#DC2626' : 'none'}
                      stroke={isSaved ? '#DC2626' : '#FFFFFF'}
                    />
                  </button>
                  <button
                    type="button"
                    className="gallery-share-btn"
                    onClick={handleShare}
                    title="Share listing"
                    aria-label="Share listing"
                  >
                    {isCopied ? <Check size={14} color="#16A344" /> : <Share2 size={14} />}
                  </button>
                </div>

                {/* Gallery Nav Arrows */}
                <button
                  type="button"
                  className="gallery-slide-arrow arrow-left"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  className="gallery-slide-arrow arrow-right"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight size={18} strokeWidth={2.4} />
                </button>
              </div>

              {/* 5 Compact Thumbnails (Front, Rear, Side, Interior, Engine / +18 Photos) */}
              <div className="gallery-thumbs-row">
                {galleryImages.map((thumb, idx) => {
                  const isCurrent = activeImageIndex === idx;
                  const isLast = idx === galleryImages.length - 1;

                  return (
                    <button
                      key={thumb.id}
                      type="button"
                      className={`gallery-thumb-slot ${isCurrent ? 'thumb-active' : ''}`}
                      onClick={() => {
                        if (isLast) {
                          setIsFullscreenOpen(true);
                        } else {
                          setActiveImageIndex(idx);
                        }
                      }}
                      title={thumb.label}
                    >
                      <img
                        src={thumb.url}
                        alt={thumb.label}
                        className="thumb-slot-img"
                        onError={(e) => {
                          e.currentTarget.src = mainImage;
                        }}
                      />
                      {isLast ? (
                        <div className="thumb-plus-overlay">
                          <span>+18 Photos</span>
                        </div>
                      ) : (
                        <span className="thumb-slot-tag">{thumb.tag}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: VEHICLE INFORMATION (CENTER 28%) */}
            <div className="info-column">
              <h1 className="vehicle-title-text">
                {vehicleTitle}
              </h1>

              <div className="vehicle-sub-meta">
                <span>Mfg: {vehicle?.yearMfg || vehicle?.year || 'Not available'}</span>
                <span className="meta-sep">·</span>
                <span>Reg: {vehicle?.yearReg || vehicle?.yearMfg || vehicle?.year || 'Not available'}</span>
                <span className="meta-sep">·</span>
                <span className="stock-id-badge">Lot: {vehicle?.id ? vehicle.id.toUpperCase() : 'Not available'}</span>
              </div>

              {/* Compact 2 × 2 Specification Layout */}
              <div className="key-specs-2x2">
                <div className="key-spec-cell">
                  <span className="key-spec-label">Fuel</span>
                  <div className="key-spec-val-row">
                    <Fuel size={13} className="spec-val-icon" />
                    <span className="key-spec-value">{vehicle?.fuel || 'Not available'}</span>
                  </div>
                </div>

                <div className="key-spec-cell">
                  <span className="key-spec-label">Transmission</span>
                  <div className="key-spec-val-row">
                    <Settings2 size={13} className="spec-val-icon" />
                    <span className="key-spec-value">{vehicle?.transmission || 'Not available'}</span>
                  </div>
                </div>

                <div className="key-spec-cell">
                  <span className="key-spec-label">KM Driven</span>
                  <div className="key-spec-val-row">
                    <Gauge size={13} className="spec-val-icon" />
                    <span className="key-spec-value">{vehicle?.kmDriven || 'Not available'}</span>
                  </div>
                </div>

                <div className="key-spec-cell">
                  <span className="key-spec-label">Location</span>
                  <div className="key-spec-val-row">
                    <MapPin size={13} className="spec-val-icon" />
                    <span className="key-spec-value">{vehicle?.location || 'Not available'}</span>
                  </div>
                </div>
              </div>

              {/* Condition Badges */}
              <div className="condition-badges-row">
                <span className="cond-badge cond-success">
                  <CheckCircle2 size={12} />
                  {vehicle?.condition || 'Not available'}
                </span>
                <span className="cond-badge cond-inspected">
                  <ShieldCheck size={12} />
                  {vehicle?.inspectionScore ? `Inspected (${vehicle.inspectionScore})` : 'Inspected'}
                </span>
                <span className="cond-badge cond-info">
                  <FileCheck size={12} />
                  {vehicle?.rcStatus || 'Not available'}
                </span>
              </div>

              {/* ACCIDENT / DAMAGE DETAILS (IMPORTANT FOR SALVEX TRANSPARENCY) */}
              <div className="salvex-damage-disclosure-card">
                <div className="damage-badge-row">
                  <span className="cond-badge cond-damage-status">{vehicle?.condition || 'Not available'}</span>
                  <span className="damage-overall-status">Condition: <strong>{vehicle?.condition || 'Not available'}</strong></span>
                </div>
                <p className="damage-desc-text">
                  <strong>Damage / Asset Details:</strong> {vehicle?.damageDescription || vehicle?.description || 'Minor cosmetic surface blemishes typical of pre-owned inventory. No structural impairment noted in preliminary intake inspection.'}
                </p>
                <button
                  type="button"
                  className="btn-condition-report-action"
                  onClick={() => setIsInspectionModalOpen(true)}
                >
                  <span>View Full Condition Report →</span>
                </button>
              </div>

              {/* Short Description */}
              <div className="short-description-block">
                <p className="desc-text">
                  {vehicle?.description || `${vehicleTitle} with ${vehicle?.kmDriven || 'documented mileage'}, original title documentation and verified inspection checklist.`}
                  {isReadMore && vehicle?.engine && ` Engine: ${vehicle.engine}.`}
                  {isReadMore && vehicle?.exteriorColor && ` Color: ${vehicle.exteriorColor}.`}
                  {isReadMore && vehicle?.interiorColor && ` Interior: ${vehicle.interiorColor}.`}
                </p>
                <button
                  type="button"
                  className="read-more-btn"
                  onClick={() => setIsReadMore(!isReadMore)}
                >
                  <span>{isReadMore ? 'Show Less' : 'Read More →'}</span>
                </button>
              </div>
            </div>

            {/* COLUMN 3: LIVE AUCTION PANEL (RIGHT 27% - STICKY) */}
            <div className="bidding-column">
              <div className="bidding-panel-card">
                {/* Header: LIVE AUCTION + Countdown */}
                <div className="panel-header-bar">
                  <div className="panel-live-pill">
                    {secondsRemaining > 0 ? (
                      <>
                        <span className="pulse-red-dot" />
                        <span>LIVE AUCTION</span>
                      </>
                    ) : (
                      <span>AUCTION ENDED</span>
                    )}
                  </div>

                  <div className="panel-countdown-tag">
                    <span className="countdown-lbl">{secondsRemaining > 0 ? 'ENDS IN' : 'STATUS'}</span>
                    <span className="countdown-val">{secondsRemaining > 0 ? formatCountdown(secondsRemaining) : 'ENDED'}</span>
                  </div>
                </div>

                {/* Auction Start & End Timing */}
                <div className="auction-timing-strip">
                  <div className="timing-col">
                    <span className="timing-label">Auction Start:</span>
                    <span className="timing-value">Scheduled Today</span>
                  </div>
                  <div className="timing-col text-right">
                    <span className="timing-label">Auction End:</span>
                    <span className="timing-value">{secondsRemaining > 0 ? `In ${formatCountdown(secondsRemaining)}` : 'Closed'}</span>
                  </div>
                </div>

                {/* Current Bid Display */}
                <div className="panel-current-bid-box">
                  <span className="bid-box-title">CURRENT BID</span>
                  <div className="bid-box-main-row">
                    <span className="bid-price-large">{formatCurrency(currentBid)}</span>
                    <span className="bid-count-pill">
                      <Gavel size={11} />
                      <span>{bidCount} Bids</span>
                    </span>
                  </div>
                </div>

                {/* Clean Parameters List: Starting Bid, Minimum Next Bid, Minimum Increment */}
                <div className="panel-parameters-list">
                  <div className="param-item-row">
                    <span className="param-label">STARTING BID</span>
                    <span className="param-value">{formatCurrency(startingBid)}</span>
                  </div>
                  <div className="param-item-row highlight-param">
                    <span className="param-label">MINIMUM NEXT BID</span>
                    <span className="param-value font-bold">{formatCurrency(minNextBid)}</span>
                  </div>
                  <div className="param-item-row">
                    <span className="param-label">MINIMUM BID INCREMENT</span>
                    <span className="param-value">{formatCurrency(minIncrement)}</span>
                  </div>
                </div>

                {/* Bid Amount Input + 3 Quick Increments (+₹1L, +₹2L, +₹5L) */}
                <form onSubmit={handleInitiateBid} className="panel-bid-form">
                  <div className="bid-field-box">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      step={minIncrement}
                      min={minNextBid}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      placeholder="1,63,00,000"
                      className="bid-input-elem"
                      required
                    />
                  </div>

                  {/* Bid Validation Notice */}
                  <div className="bid-validation-notice">
                    <AlertCircle size={12} className="val-icon" />
                    <span>Your bid must meet or exceed the minimum next bid ({formatCurrency(minNextBid)}).</span>
                  </div>

                  {/* Quick Increment Controls */}
                  <div className="quick-inc-trio">
                    <button
                      type="button"
                      className="btn-inc-pill"
                      onClick={() => handleAddIncrement(100000)}
                    >
                      +₹1L
                    </button>
                    <button
                      type="button"
                      className="btn-inc-pill"
                      onClick={() => handleAddIncrement(200000)}
                    >
                      +₹2L
                    </button>
                    <button
                      type="button"
                      className="btn-inc-pill"
                      onClick={() => handleAddIncrement(500000)}
                    >
                      +₹5L
                    </button>
                  </div>

                  {/* Primary CTA: PLACE BID → in Auction Red #DC2626 */}
                  <button
                    type="submit"
                    className="btn-primary-place-bid"
                    id="btn-place-bid-primary"
                  >
                    <span>PLACE BID</span>
                    <ArrowRight size={16} />
                  </button>
                </form>

                <p className="panel-terms-micro">
                  By placing a bid, you agree to the Auction Rules and Terms &amp; Conditions.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 03 INFORMATION TABS BAR (Progressive Disclosure) */}
      <section className="info-tabs-bar-section">
        <div className="minimal-page-container">
          <div className="tabs-bar-wrapper">
            <div className="tabs-buttons-row" role="tablist">
              {tabsList.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`tab-switch-btn ${isActive ? 'tab-btn-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    id={`tab-control-${tab.id}`}
                  >
                    <span>{tab.label}</span>
                    {isActive && <div className="tab-red-bar" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 04 ACTIVE TAB CONTENT ONLY */}
      <section className="tab-pane-container-section">
        <div className="minimal-page-container">
          <div className="tab-pane-box">

            {/* TAB 1: VEHICLE DETAILS */}
            {activeTab === 'details' && (
              <div className="tab-pane-inner">
                <div className="compact-2col-specs-grid">
                  <div className="spec-row-item">
                    <span className="spec-k">Make</span>
                    <span className="spec-v">{vehicle?.make || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Model</span>
                    <span className="spec-v">{vehicle?.model || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Manufacturing Year</span>
                    <span className="spec-v">{vehicle?.yearMfg || vehicle?.year || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Registration Year</span>
                    <span className="spec-v">{vehicle?.yearReg || vehicle?.yearMfg || vehicle?.year || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Fuel Type</span>
                    <span className="spec-v">{vehicle?.fuel || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Transmission</span>
                    <span className="spec-v">{vehicle?.transmission || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">KM Driven</span>
                    <span className="spec-v">{vehicle?.kmDriven || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Body Type</span>
                    <span className="spec-v">{vehicle?.category || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Color</span>
                    <span className="spec-v">{vehicle?.exteriorColor || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Ownership</span>
                    <span className="spec-v">{vehicle?.source || vehicle?.ownership || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">Location</span>
                    <span className="spec-v">{vehicle?.location || 'Not available'}</span>
                  </div>
                  <div className="spec-row-item">
                    <span className="spec-k">RC Status</span>
                    <span className="spec-v">{vehicle?.rcStatus || 'Not available'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INSPECTION */}
            {activeTab === 'inspection' && (
              <div className="tab-pane-inner">
                <div className="inspection-top-summary">
                  <div className="insp-summary-left">
                    <span className="insp-status-tag">Status: <strong>Completed (Sample)</strong></span>
                    <span className="insp-score-tag">Inspection Score: <strong>92 / 100</strong></span>
                  </div>
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={() => setIsInspectionModalOpen(true)}
                  >
                    <span>View Sample Inspection Report →</span>
                  </button>
                </div>

                <div className="inspection-compact-grid">
                  <div className="insp-compact-cell">
                    <div className="insp-cell-head">
                      <span className="cell-cat">Exterior</span>
                      <span className="pill-pass">Passed</span>
                    </div>
                    <p className="cell-note">Minor surface scratches on front bumper; factory paint depth verified.</p>
                  </div>

                  <div className="insp-compact-cell">
                    <div className="insp-cell-head">
                      <span className="cell-cat">Interior</span>
                      <span className="pill-good">Good</span>
                    </div>
                    <p className="cell-note">Ebony Windsor leather clean; digital instrument cluster and AC operational.</p>
                  </div>

                  <div className="insp-compact-cell">
                    <div className="insp-cell-head">
                      <span className="cell-cat">Engine</span>
                      <span className="pill-pass">Passed</span>
                    </div>
                    <p className="cell-note">5.0L Supercharged V8 idle smooth, zero oil/coolant leaks, OBD clear.</p>
                  </div>

                  <div className="insp-compact-cell">
                    <div className="insp-cell-head">
                      <span className="cell-cat">Tyres</span>
                      <span className="pill-good">Good</span>
                    </div>
                    <p className="cell-note">7.2mm average tread depth remaining across all Pirelli Scorpion tyres.</p>
                  </div>

                  <div className="insp-compact-cell">
                    <div className="insp-cell-head">
                      <span className="cell-cat">Electrical</span>
                      <span className="pill-pass">Passed</span>
                    </div>
                    <p className="cell-note">12.8V battery health, adaptive LED headlights and 360° cameras active.</p>
                  </div>

                  <div className="insp-compact-cell">
                    <div className="insp-cell-head">
                      <span className="cell-cat">Documents</span>
                      <span className="pill-pass">Available</span>
                    </div>
                    <p className="cell-note">Original smart RC card on record (sample), single owner.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AUCTION INFO */}
            {activeTab === 'auction' && (
              <div className="tab-pane-inner">
                <div className="auction-parameters-grid">
                  <div className="auction-field-item">
                    <span className="af-label">Auction Status</span>
                    <span className={`af-val ${secondsRemaining > 0 ? 'text-live-red' : ''}`}>
                      {secondsRemaining > 0 ? '● Live Bidding Open' : '● Bidding Closed (Ended)'}
                    </span>
                  </div>
                  <div className="auction-field-item">
                    <span className="af-label">Starting Bid</span>
                    <span className="af-val">{formatCurrency(startingBid)}</span>
                  </div>
                  <div className="auction-field-item">
                    <span className="af-label">Auction Start</span>
                    <span className="af-val">Scheduled Today · 10:00 AM IST</span>
                  </div>
                  <div className="auction-field-item">
                    <span className="af-label">Minimum Bid Increment</span>
                    <span className="af-val">{formatCurrency(minIncrement)}</span>
                  </div>
                  <div className="auction-field-item">
                    <span className="af-label">Auction End</span>
                    <span className="af-val">{secondsRemaining > 0 ? `In ${formatCountdown(secondsRemaining)}` : 'Closed'}</span>
                  </div>
                  <div className="auction-field-item">
                    <span className="af-label">Payment Deadline</span>
                    <span className="af-val font-semibold">48 Hours post close</span>
                  </div>
                  <div className="auction-field-item">
                    <span className="af-label">Vehicle Lifting Deadline</span>
                    <span className="af-val font-semibold">5 Business Days post settlement</span>
                  </div>
                  <div className="auction-field-item">
                    <span className="af-label">Auction Format</span>
                    <span className="af-val">Commercial Asset Liquidation</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="tab-pane-inner">
                <div className="documents-compact-list">
                  <div className="doc-compact-row">
                    <div className="doc-info-left">
                      <FileText size={16} className="doc-type-icon" />
                      <span className="doc-name">Registration Certificate (Original KA-03)</span>
                    </div>
                    <div className="doc-info-right">
                      <span className="doc-avail-pill">Available</span>
                      <button type="button" className="btn-view-doc-icon" title="View document">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="doc-compact-row">
                    <div className="doc-info-left">
                      <FileText size={16} className="doc-type-icon" />
                      <span className="doc-name">Comprehensive Insurance Certificate</span>
                    </div>
                    <div className="doc-info-right">
                      <span className="doc-avail-pill">Available</span>
                      <button type="button" className="btn-view-doc-icon" title="View document">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="doc-compact-row">
                    <div className="doc-info-left">
                      <FileText size={16} className="doc-type-icon" />
                      <span className="doc-name">Digital Inspection Certificate (150-Point)</span>
                    </div>
                    <div className="doc-info-right">
                      <span className="doc-avail-pill">Available</span>
                      <button type="button" className="btn-view-doc-icon" title="View document">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="doc-compact-row">
                    <div className="doc-info-left">
                      <FileText size={16} className="doc-type-icon" />
                      <span className="doc-name">Vehicle Photo Archive (24 High-Res Angles)</span>
                    </div>
                    <div className="doc-info-right">
                      <span className="doc-avail-pill">Available</span>
                      <button type="button" className="btn-view-doc-icon" title="View document">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="doc-compact-row">
                    <div className="doc-info-left">
                      <FileText size={16} className="doc-type-icon" />
                      <span className="doc-name">Bank / NOC Clearance Documents</span>
                    </div>
                    <div className="doc-info-right">
                      <span className="doc-avail-pill">Verified</span>
                      <button type="button" className="btn-view-doc-icon" title="View document">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BID HISTORY */}
            {activeTab === 'history' && (
              <div className="tab-pane-inner">
                <table className="compact-bids-table">
                  <thead>
                    <tr>
                      <th>Bidder</th>
                      <th>Bid Amount</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="top-bid-row">
                      <td>
                        <span className="bidder-code">SVX7845</span>
                        <span className="highest-tag">Highest Bid</span>
                      </td>
                      <td className="bid-amt text-red font-bold">{formatCurrency(currentBid)}</td>
                      <td className="bid-time">2 min ago</td>
                    </tr>
                    <tr>
                      <td><span className="bidder-code">SVX1203</span></td>
                      <td className="bid-amt">₹1,61,00,000</td>
                      <td className="bid-time">5 min ago</td>
                    </tr>
                    <tr>
                      <td><span className="bidder-code">SVX5532</span></td>
                      <td className="bid-amt">₹1,60,00,000</td>
                      <td className="bid-time">8 min ago</td>
                    </tr>
                  </tbody>
                </table>

                <div className="bids-pane-footer">
                  <button type="button" className="btn-text-action" onClick={() => alert('Complete 24-bid audit trail loaded.')}>
                    <span>View All Bids →</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: LOCATION */}
            {activeTab === 'location' && (
              <div className="tab-pane-inner">
                <div className="location-compact-row">
                  <div className="loc-compact-info">
                    <h3 className="loc-city">{vehicle?.location ? `${vehicle.location}, India` : 'Bengaluru, Karnataka'}</h3>
                    <div className="loc-meta-item">
                      <span className="loc-lbl">Pickup Location:</span>
                      <span className="loc-val">{vehicle?.pickupAddress || 'Salvex Regional Logistics Hub, Electronic City Phase 1, Bengaluru, Karnataka 560100'}</span>
                    </div>
                    <div className="loc-meta-item">
                      <span className="loc-lbl">Yard Inspection &amp; Pickup Hours:</span>
                      <span className="loc-val">Mon – Sat: 09:00 AM – 06:00 PM (Salvex Gate Pass &amp; Valid ID required)</span>
                    </div>
                    <div className="loc-meta-item">
                      <span className="loc-lbl">Yard Helpdesk:</span>
                      <span className="loc-val">+91 00000 00000 • demo@example.com</span>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          (vehicle?.location || 'Electronic City, Bengaluru') + ', Karnataka, India'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#0B1220',
                          color: '#FFFFFF',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <MapPin size={13} color="#075BFF" />
                        <span>Get Directions on Google Maps ↗</span>
                      </a>
                    </div>
                  </div>

                  <div className="loc-compact-map-graphic">
                    <iframe
                      title="Salvex Vehicle Stockyard Map"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        (vehicle?.location || 'Electronic City, Bengaluru') + ', Karnataka, India'
                      )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '260px',
                        border: '0',
                        borderRadius: '10px',
                        display: 'block'
                      }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div className="map-chip-loc">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                      <span>{vehicle?.location || 'Electronic City Hub, Bengaluru'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 05 COMPACT AUCTION RULES BLOCK */}
      <section className="compact-rules-strip-section">
        <div className="minimal-page-container">
          <div className="compact-rules-strip">
            <div className="rules-strip-header">
              <span className="rules-title">Auction Rules</span>
            </div>

            <div className="rules-micro-grid">
              <div className="rule-micro-item">
                <span className="rm-label">Starting Bid</span>
                <span className="rm-val">{formatCurrency(startingBid)}</span>
              </div>
              <div className="rule-micro-item">
                <span className="rm-label">Minimum Bid Increment</span>
                <span className="rm-val">{formatCurrency(minIncrement)}</span>
              </div>
              <div className="rule-micro-item">
                <span className="rm-label">Auction Closing Time</span>
                <span className="rm-val">30 Sep 2026 · 04:14 PM</span>
              </div>
              <div className="rule-micro-item">
                <span className="rm-label">Bid Cancellation</span>
                <span className="rm-val">Legally Binding &amp; Final</span>
              </div>
              <div className="rule-micro-item">
                <span className="rm-label">Payment Deadline</span>
                <span className="rm-val">48 Hours post close</span>
              </div>
              <div className="rule-micro-item">
                <span className="rm-label">Vehicle Lifting</span>
                <span className="rm-val">5 Business Days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06 SIMILAR VEHICLES */}
      <section className="compact-similar-section">
        <div className="minimal-page-container">
          <div className="similar-section-header">
            <h2 className="similar-title">Similar Vehicles</h2>
            <div className="similar-title-accent" />
          </div>

          <div className="recent-cards-grid">
            {(similarVehicles.length > 0 ? similarVehicles : [
              {
                id: 'salvex-101',
                make: 'Porsche',
                model: '911 GT3 (992)',
                badge: 'LIVE',
                yearMfg: 2023,
                yearReg: 2023,
                fuel: 'Petrol',
                transmission: 'Automatic',
                kmDriven: '4,800 KM',
                location: 'Mumbai Central',
                startingBid: 24500000,
                image: '/images/porsche-gt3.jpg'
              },
              {
                id: 'salvex-102',
                make: 'Mercedes-Benz',
                model: 'G63 AMG 4MATIC',
                badge: 'LIVE',
                yearMfg: 2023,
                yearReg: 2023,
                fuel: 'Petrol',
                transmission: 'Automatic',
                kmDriven: '12,400 KM',
                location: 'Delhi Stockyard',
                startingBid: 21000000,
                image: '/images/mercedes-g63.jpg'
              },
              {
                id: 'salvex-104',
                make: 'BMW',
                model: 'M4 Competition Coupe',
                badge: 'LIVE',
                yearMfg: 2023,
                yearReg: 2023,
                fuel: 'Petrol',
                transmission: 'Automatic',
                kmDriven: '9,100 KM',
                location: 'Hyderabad',
                startingBid: 11000000,
                image: '/images/bmw-m4.jpg'
              }
            ]).slice(0, 3).map((car) => {
              const isCarSaved = savedIds.includes(car.id);
              return (
                <VehicleCard
                  key={car.id}
                  vehicle={car}
                  isSaved={isCarSaved}
                  onToggleSave={onToggleSave}
                  onViewDetails={onViewVehicleDetails}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 07 MOBILE STICKY BID BAR */}
      <div className="mobile-sticky-bid-bar">
        <div className="mobile-bid-bar-inner">
          <div className="mobile-bar-info">
            <span className="mb-label">Current Bid</span>
            <span className="mb-amount">{formatCurrency(currentBid)}</span>
          </div>
          <button
            type="button"
            className="mobile-bar-bid-btn"
            onClick={() => {
              const el = document.getElementById('btn-place-bid-primary');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>PLACE BID →</span>
          </button>
        </div>
      </div>

      {/* BID CONFIRMATION MODAL */}
      {isBidConfirmOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gavel size={16} color="#075BFF" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0B1220', margin: 0 }}>
                    Confirm Your Bid
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>{vehicleTitle}</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsBidConfirmOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Your Bid:</span>
                  <span style={{ fontWeight: '800', color: '#075BFF', fontSize: '16px' }}>{formatCurrency(bidAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px' }}>
                  <span style={{ color: '#64748B' }}>Current Bid:</span>
                  <span style={{ fontWeight: '600', color: '#0B1220' }}>{formatCurrency(currentBid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                  <span style={{ color: '#64748B' }}>Minimum Bid Required:</span>
                  <span style={{ fontWeight: '600', color: '#0B1220' }}>{formatCurrency(minNextBid)}</span>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '16px', margin: '0 0 18px 0', textAlign: 'center' }}>
                Once submitted, your bid may be subject to the auction cancellation rules. All placed bids are binding contracts.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBidConfirmOpen(false)}
                  style={{
                    height: '42px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitBid}
                  style={{
                    height: '42px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#075BFF',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(7, 91, 255, 0.35)'
                  }}
                >
                  Confirm Bid →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN GALLERY MODAL */}
      {isFullscreenOpen && (
        <div className="fullscreen-gallery-modal">
          <div className="fs-backdrop" onClick={() => setIsFullscreenOpen(false)} />
          <div className="fs-content-box">
            <div className="fs-header">
              <span className="fs-title">
                {vehicleTitle} ({activeImageIndex + 1} / {galleryImages.length})
              </span>
              <button
                type="button"
                className="fs-close-btn"
                onClick={() => setIsFullscreenOpen(false)}
                aria-label="Close fullscreen"
              >
                <X size={20} />
              </button>
            </div>
            <div className="fs-image-wrap">
              <img
                src={galleryImages[activeImageIndex].url}
                alt={galleryImages[activeImageIndex].label}
                className="fs-full-img"
              />
              <button type="button" className="fs-arrow fs-arrow-prev" onClick={prevImage}>
                <ChevronLeft size={24} />
              </button>
              <button type="button" className="fs-arrow fs-arrow-next" onClick={nextImage}>
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="fs-thumbnails-bar">
              {galleryImages.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  className={`fs-thumb-box ${activeImageIndex === i ? 'fs-thumb-active' : ''}`}
                  onClick={() => setActiveImageIndex(i)}
                >
                  <img src={img.url} alt={img.label} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULL CONDITION / INSPECTION REPORT MODAL */}
      {isInspectionModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card inspection-report-modal">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="modal-icon-bubble" style={{ backgroundColor: '#DCFCE7' }}>
                  <ShieldCheck size={20} color="#16A344" />
                </div>
                <div>
                  <h3 className="modal-title">Condition &amp; Inspection Certificate</h3>
                  <p className="modal-subtitle">Certificate ID: SVX-INSP-2026-92 · Inspected on 28 Sep 2026</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsInspectionModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-form" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="insp-modal-summary">
                <div className="summary-score-large">
                  <span className="score-val">{vehicle?.inspectionScore ? vehicle.inspectionScore.split('/')[0] : '92'}</span>
                  <span className="score-max">/100</span>
                  <span className="score-desc">Grade A</span>
                </div>
                <div className="summary-texts">
                  <p className="vehicle-name-insp">{vehicleTitle}</p>
                  <p className="chassis-num">VIN / Chassis: {vehicle?.chassis || vehicle?.rto || 'Verified in Registry'}</p>
                  <p className="engine-num">Engine: {vehicle?.engine || 'Verified'}</p>
                </div>
              </div>

              {/* Damage Transparency Callout inside Modal */}
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 14px', borderRadius: '6px', marginTop: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#B45309', display: 'block', marginBottom: '4px' }}>
                  Damage Observation Log:
                </span>
                <p style={{ fontSize: '12.5px', color: '#92400E', margin: 0, lineHeight: '18px' }}>
                  {vehicle?.damageDescription || vehicle?.description || 'Minor cosmetic surface blemishes typical of pre-owned inventory. No structural impairment noted in preliminary intake inspection.'}
                </p>
              </div>

              <div className="insp-details-list">
                <div className="insp-row-item">
                  <span className="insp-row-label">Engine &amp; Powertrain</span>
                  <span className="status-badge-passed">Passed (No leaks, optimal compression)</span>
                </div>
                <div className="insp-row-item">
                  <span className="insp-row-label">8-Speed ZF Automatic Transmission</span>
                  <span className="status-badge-passed">Passed (Smooth shifts, adaptive OK)</span>
                </div>
                <div className="insp-row-item">
                  <span className="insp-row-label">Air Suspension &amp; Terrain Response 2</span>
                  <span className="status-badge-passed">Passed (Compressor healthy, no drop)</span>
                </div>
                <div className="insp-row-item">
                  <span className="insp-row-label">Body Frame &amp; Chassis Structural Integrity</span>
                  <span className="status-badge-passed">Passed (Zero accident deformities)</span>
                </div>
                <div className="insp-row-item">
                  <span className="insp-row-label">Exterior Paint &amp; Cosmetic Panels</span>
                  <span className="status-badge-good">Good (Minor bumper scratches logged)</span>
                </div>
                <div className="insp-row-item">
                  <span className="insp-row-label">Braking System (Discs &amp; Brembo Calipers)</span>
                  <span className="status-badge-good">Good (Pads at 78% remaining life)</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline-action"
                onClick={() => setIsInspectionModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL AUCTION RULES / POLICY MODAL */}
      {isRulesModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="modal-icon-bubble" style={{ backgroundColor: '#EFF6FF' }}>
                  <Gavel size={20} color="#075BFF" />
                </div>
                <div>
                  <h3 className="modal-title">Salvex Auction Policy &amp; Rules</h3>
                  <p className="modal-subtitle">Official Guidelines for Commercial Asset Liquidation</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsRulesModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-form" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="rule-item-detail">
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0B1220' }}>1. Bid Validity &amp; Finality</h4>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '20px' }}>
                  Platform Demo: Bids placed during demo mode are simulated sample offers. In production, bids are legally binding upon auction close.
                </p>
              </div>
              <div className="rule-item-detail" style={{ marginTop: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0B1220' }}>2. Dynamic Overtime Clock</h4>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '20px' }}>
                  Any bid placed in the final 60 seconds automatically extends the countdown clock by 2 minutes to eliminate sniping and ensure fair participation.
                </p>
              </div>
              <div className="rule-item-detail" style={{ marginTop: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0B1220' }}>3. Earnest Money Deposit &amp; Full Settlement</h4>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '20px' }}>
                  The winning bidder must remit a 10% Earnest Money Deposit within 24 hours of auction close. The remaining 90% balance must be settled within 48 hours via authorized secure settlement wire transfer (demo).
                </p>
              </div>
              <div className="rule-item-detail" style={{ marginTop: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0B1220' }}>4. Physical Inspection &amp; Vehicle Lifting</h4>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '20px' }}>
                  Complimentary yard storage is granted for up to 5 business days post full payment. Vehicle lifting requires presentation of verified Salvex Gate Pass.
                </p>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-outline-action"
                onClick={() => setIsRulesModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
