// Shared pieces for the public auction pages. All data comes from the server.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Clock, Gavel, MapPin } from 'lucide-react';
import { publicPhotoUrl } from '../api/vehicles';
import { categoryLabel } from '../api/auctions';

export const money = (value) =>
  value === null || value === undefined ? '—' : `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const dateTime = (value) =>
  new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * The difference between the server clock and this device's clock, from a response's `server_time`.
 * Countdowns use server time, so a wrong phone clock cannot show the wrong time left.
 */
export function clockOffset(serverTime) {
  return serverTime ? new Date(serverTime).getTime() - Date.now() : 0;
}

export function useNow(offsetMs, everyMs = 1000) {
  const [now, setNow] = useState(() => Date.now() + offsetMs);
  useEffect(() => {
    setNow(Date.now() + offsetMs);
    const timer = setInterval(() => setNow(Date.now() + offsetMs), everyMs);
    return () => clearInterval(timer);
  }, [offsetMs, everyMs]);
  return now;
}

export function formatLeft(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
}

/** "Ends in 2h 5m" / "Starts in…" / "Ended", counted against the server clock. */
export function Countdown({ auction, offset }) {
  const now = useNow(offset);
  const starts = new Date(auction.starts_at).getTime();
  const ends = new Date(auction.ends_at).getTime();
  if (auction.phase === 'ended' || auction.phase === 'cancelled') return <span className="pub-count ended">Ended</span>;
  if (auction.phase === 'paused') return <span className="pub-count paused">Paused</span>;
  if (now < starts) return <span className="pub-count upcoming">Starts in {formatLeft(starts - now)}</span>;
  if (now < ends) {
    const urgent = ends - now < 5 * 60 * 1000;
    return <span className={`pub-count live${urgent ? ' urgent' : ''}`}>Ends in {formatLeft(ends - now)}</span>;
  }
  return <span className="pub-count closing">Closing…</span>;
}

const PHASE_LABEL = { live: 'Live', upcoming: 'Upcoming', paused: 'Paused', closing: 'Closing', ended: 'Ended' };

export function PhaseBadge({ phase }) {
  return <span className={`pub-phase phase-${phase}`}>{phase === 'live' && <span className="dot" />}{PHASE_LABEL[phase] || phase}</span>;
}

/** size="thumb" for cards and lists (small file), full size for the gallery. */
export function VehiclePhoto({ vehicle, index = 0, className, size }) {
  const photoId = vehicle.photo_ids?.[index];
  if (!photoId) return <div className={`pub-photo-empty ${className || ''}`}><Car size={36} /></div>;
  return <img className={className} src={publicPhotoUrl(vehicle.id, photoId, size)} alt={`${vehicle.make} ${vehicle.model}`} loading="lazy" />;
}

export function AuctionCard({ auction, offset }) {
  const v = auction.vehicle;
  return (
    <Link to={`/auctions/${auction.id}`} className="pub-card">
      <div className="pub-card-media">
        <VehiclePhoto vehicle={v} size="thumb" />
        <PhaseBadge phase={auction.phase} />
      </div>
      <div className="pub-card-body">
        <h3>{v.manufacturing_year} {v.make} {v.model}</h3>
        <p className="pub-card-sub">{v.variant} · {v.registration_number}{categoryLabel(v.category) ? ` · ${categoryLabel(v.category)}` : ''}</p>
        <p className="pub-card-meta"><MapPin size={13} /> {v.location}</p>
        <div className="pub-card-price">
          <div>
            <span>{auction.current_price ? 'Current bid' : 'Bidding'}</span>
            {auction.current_price
              ? <strong>{money(auction.current_price)}</strong>
              : <strong className="pub-no-bids">No bids yet</strong>}
          </div>
          <div className="right">
            <span><Gavel size={12} /> {auction.bid_count} bid{auction.bid_count === 1 ? '' : 's'}</span>
            <span className="pub-card-time"><Clock size={12} /> <Countdown auction={auction} offset={offset} /></span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="pub-empty">
      <Gavel size={34} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
