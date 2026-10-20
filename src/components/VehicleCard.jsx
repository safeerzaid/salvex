import React, { useState, useEffect } from 'react';
import {
  Heart,
  Clock,
  MapPin,
  Gauge,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import './VehicleCard.css';

export default function VehicleCard({
  vehicle,
  isSaved = false,
  onToggleSave,
  onViewDetails,
  onPlaceBid,
  statusOverride
}) {
  const initialSeconds = vehicle?.endsInSeconds !== undefined ? vehicle.endsInSeconds : 8075;
  const [remainingSeconds, setRemainingSeconds] = useState(Math.max(0, initialSeconds));

  useEffect(() => {
    const totalSec = vehicle?.endsInSeconds !== undefined ? vehicle.endsInSeconds : 8075;
    if (totalSec <= 0) {
      setRemainingSeconds(0);
      return;
    }

    const endTimeMs = Date.now() + totalSec * 1000;

    const updateTimer = () => {
      const diffSec = Math.max(0, Math.round((endTimeMs - Date.now()) / 1000));
      setRemainingSeconds(diffSec);
      if (diffSec <= 0 && intervalId) {
        clearInterval(intervalId);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [vehicle?.id, vehicle?.endsInSeconds]);

  if (!vehicle) return null;

  // Determine Auction State
  const isUpcoming =
    statusOverride === 'UPCOMING' ||
    vehicle.badge === 'UPCOMING' ||
    vehicle.status === 'upcoming';

  const isEnded =
    statusOverride === 'ENDED' ||
    vehicle.badge === 'ENDED' ||
    (remainingSeconds !== undefined && remainingSeconds <= 0);

  const isEndingSoon =
    !isUpcoming &&
    !isEnded &&
    statusOverride === 'ENDING SOON';

  const isLive =
    !isUpcoming &&
    !isEnded &&
    !isEndingSoon &&
    remainingSeconds > 0 &&
    (statusOverride === 'LIVE' || vehicle.badge === 'LIVE' || (!statusOverride && !vehicle.badge));

  // Format Time: HH:MM:SS
  const formatCountdown = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format Currency
  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Clean Location (e.g. "Bengaluru, KA")
  const formatLocation = (loc) => {
    if (!loc) return 'Bengaluru, KA';
    if (loc.includes('Bengaluru')) return 'Bengaluru, KA';
    if (loc.includes('Mumbai')) return 'Mumbai, MH';
    if (loc.includes('Delhi')) return 'Delhi, DL';
    if (loc.includes('Chennai')) return 'Chennai, TN';
    if (loc.includes('Kochi')) return 'Kochi, KL';
    if (loc.includes('Hyderabad')) return 'Hyderabad, TS';
    return loc.split('•')[0].trim();
  };

  // Condition Chips logic (max 2–3 compact status chips)
  const getConditionChips = () => {
    const chips = [];

    // Chip 1: Drive Condition
    if (vehicle.condition?.toLowerCase().includes('good') || vehicle.condition?.toLowerCase().includes('grade a')) {
      chips.push({ label: 'Run & Drive', type: 'success' });
    } else if (vehicle.condition?.toLowerCase().includes('damage') || vehicle.condition?.toLowerCase().includes('salvage')) {
      chips.push({ label: 'Minor Damage', type: 'warning' });
    } else {
      chips.push({ label: 'Run & Drive', type: 'success' });
    }

    // Chip 2: Inspection or Secondary Status
    if (vehicle.condition?.toLowerCase().includes('certified') || vehicle.inspectionScore) {
      chips.push({ label: 'Inspected', type: 'info' });
    } else if (vehicle.condition?.toLowerCase().includes('repo')) {
      chips.push({ label: 'Bank Repo', type: 'warning' });
    } else {
      chips.push({ label: 'Good Condition', type: 'success' });
    }

    // Chip 3: RC Status
    chips.push({ label: 'RC Available', type: 'info' });

    return chips.slice(0, 3);
  };

  const chips = getConditionChips();
  const bidAmount = isLive
    ? vehicle.currentBid || vehicle.startingBid
    : vehicle.startingBid;

  const currentBidCount = vehicle.bidCount || 12;

  return (
    <article className="salvex-vehicle-card" id={`vehicle-card-${vehicle.id}`}>
      {/* 01. VEHICLE IMAGE (4:3) */}
      <div className="salvex-card-image-wrap">
        <img
          src={vehicle.image}
          alt={`${vehicle.yearMfg || 2021} ${vehicle.make} ${vehicle.model}`}
          className="salvex-card-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/images/porsche-gt3.jpg';
          }}
        />

        {/* Top-Left: LIVE / UPCOMING / ENDING SOON Badge */}
        <div className="salvex-card-badge-wrap">
          {isLive && (
            <span className="salvex-status-badge status-badge-live">
              <span className="status-live-dot" />
              LIVE
            </span>
          )}

          {isEndingSoon && (
            <span className="salvex-status-badge status-badge-ending">
              ENDING SOON
            </span>
          )}

          {isUpcoming && (
            <span className="salvex-status-badge status-badge-upcoming">
              UPCOMING
            </span>
          )}

          {isEnded && (
            <span className="salvex-status-badge status-badge-ended">
              ENDED
            </span>
          )}
        </div>

        {/* Top-Right: Outline Wishlist Heart */}
        <button
          type="button"
          className={`salvex-card-heart-btn ${isSaved ? 'is-saved' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSave) onToggleSave(vehicle.id);
          }}
          title={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-label="Wishlist heart"
        >
          <Heart
            size={16}
            fill={isSaved ? '#DC2626' : 'none'}
            stroke={isSaved ? '#DC2626' : 'currentColor'}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* 02. VEHICLE INFORMATION BODY */}
      <div className="salvex-card-body">
        {/* Vehicle Name (16px, 600 weight, strongest text) */}
        <h3
          className="salvex-card-title"
          title={`${vehicle.make} ${vehicle.model}`}
        >
          {vehicle.make} {vehicle.model}
        </h3>

        {/* Second Line: Year · Fuel · Transmission */}
        <div className="salvex-card-meta">
          <span>{vehicle.yearMfg || vehicle.year || '2021'}</span>
          <span className="salvex-card-meta-dot">·</span>
          <span>{vehicle.fuel || 'Petrol'}</span>
          <span className="salvex-card-meta-dot">·</span>
          <span>{vehicle.transmission?.split(' ')[0] || 'Automatic'}</span>
        </div>

        {/* Key Specifications: KM Driven · Location · RC Status */}
        <div className="salvex-card-specs-row">
          <span className="salvex-spec-item">
            <Gauge size={13} className="salvex-spec-icon" />
            <span>{vehicle.kmDriven || '45,000 KM'}</span>
          </span>
          <span className="salvex-spec-sep">·</span>
          <span className="salvex-spec-item">
            <MapPin size={13} className="salvex-spec-icon" />
            <span>{formatLocation(vehicle.location)}</span>
          </span>
          <span className="salvex-spec-sep">·</span>
          <span className="salvex-spec-item">
            <FileCheck size={13} className="salvex-spec-icon" />
            <span>RC Available</span>
          </span>
        </div>

        {/* Condition Chips: Max 2–3 subtle chips */}
        <div className="salvex-card-chips-row">
          {chips.map((c, idx) => (
            <span key={idx} className={`salvex-chip chip-${c.type}`}>
              {c.label}
            </span>
          ))}
        </div>

        {/* 03. AUCTION INFORMATION AREA */}
        <div className="salvex-card-auction-box">
          {/* Left: Bid label + Strong numeric amount */}
          <div className="salvex-bid-left">
            <span className="salvex-bid-label">
              {isUpcoming ? 'Starting Bid' : 'Current Bid'}
            </span>
            <span className="salvex-bid-amount">
              {formatCurrency(bidAmount)}
            </span>
          </div>

          {/* Right: Bids count + Countdown / Starts */}
          <div className="salvex-bid-right">
            {isUpcoming ? (
              <>
                <span className="salvex-upcoming-start-label">Auction Starts</span>
                <span className="salvex-upcoming-start-val">
                  {vehicle.startDate || vehicle.auctionStarts || '12 Jan 2026 · 10:00 AM'}
                </span>
              </>
            ) : isEnded ? (
              <>
                <span className="salvex-bid-count-text">{currentBidCount} Total Bids</span>
                <span className="salvex-countdown-row" style={{ color: '#64748B' }}>
                  Auction Ended
                </span>
              </>
            ) : (
              <>
                <span className="salvex-bid-count-text">{currentBidCount} Bids</span>
                <div className="salvex-countdown-row">
                  <Clock size={12} className="salvex-countdown-icon" />
                  <span>{formatCountdown(remainingSeconds)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 04. CTA AREA (TWO COMPACT EQUAL-HEIGHT ACTIONS) */}
        <div className="salvex-card-cta-row">
          {isUpcoming ? (
            <>
              <button
                type="button"
                className="salvex-card-btn-primary"
                onClick={() => onViewDetails && onViewDetails(vehicle)}
              >
                Set Reminder
              </button>
              <button
                type="button"
                className="salvex-card-btn-secondary"
                onClick={() => onViewDetails && onViewDetails(vehicle)}
              >
                <span>View Details</span>
                <ArrowRight size={13} />
              </button>
            </>
          ) : isEnded ? (
            <button
              type="button"
              className="salvex-card-btn-secondary"
              style={{ gridColumn: 'span 2' }}
              onClick={() => onViewDetails && onViewDetails(vehicle)}
            >
              <span>View Results</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="salvex-card-btn-primary"
                onClick={() => {
                  if (onPlaceBid) onPlaceBid(vehicle);
                  else if (onViewDetails) onViewDetails(vehicle);
                }}
              >
                Bid Now
              </button>
              <button
                type="button"
                className="salvex-card-btn-secondary"
                onClick={() => onViewDetails && onViewDetails(vehicle)}
              >
                <span>View Details</span>
                <ArrowRight size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
