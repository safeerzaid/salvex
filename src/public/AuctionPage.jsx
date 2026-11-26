import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, FileText, Gavel, Loader2, MapPin, ShieldCheck, Smartphone, Trophy } from 'lucide-react';
import { getAuction, getBidHistory, newIdempotencyKey, placeBid } from '../api/auctions';
import { getVehicleOptions } from '../api/vehicles';
import { useAuth } from '../auth/useAuth';
import { useSiteConfig } from '../api/site';
import { Countdown, PhaseBadge, VehiclePhoto, clockOffset, dateTime, money } from './shared';
import ModalLayer from './ModalLayer';
import './public.css';

// The client's auction terms, shown on every auction and in the bid confirmation.
const AUCTION_TERMS = [
  'Bids once submitted cannot be cancelled or withdrawn.',
  'The uploaded photos are survey photographs for reference only. Buyers are advised to physically inspect the vehicle to assess any additional damages. The auction company shall not be responsible for any missing or damaged parts not visible in the photographs.',
  'Quote validity for With RC vehicles: 15 days.',
  'Quote validity for Without RC vehicles: 60 days.',
];

const SPEC_FIELDS = [
  ['category', 'Category'], ['make', 'Make'], ['model', 'Model'], ['variant', 'Variant'], ['manufacturing_year', 'Manufacturing year'],
  ['registration_year', 'Registration year'], ['registration_number', 'Registration number'], ['fuel_type', 'Fuel'],
  ['transmission', 'Transmission'], ['number_of_owners', 'Owners'], ['km_driven', 'KM driven'], ['damage_type', 'Damage'],
  ['rc_status', 'RC status'], ['registration_type', 'Registration type'], ['hypothecation_status', 'Hypothecation'],
  ['location', 'Location'],
];

export default function AuctionPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [history, setHistory] = useState([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({});
  const [photo, setPhoto] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [a, h] = await Promise.all([getAuction(id), getBidHistory(id)]);
      setAuction(a);
      setHistory(h.items);
      setOffset(clockOffset(a.server_time));
      setError(null);
    } catch (err) {
      setError(err.status === 404 ? 'This auction does not exist or is no longer available.' : err.message);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { getVehicleOptions().then(setOptions).catch(() => {}); }, []);

  const phase = auction?.phase;
  useEffect(() => {                       // follow the auction: fast while live, slower otherwise
    if (!phase || phase === 'ended' || phase === 'cancelled') return undefined;
    const timer = setInterval(refresh, phase === 'live' || phase === 'closing' ? 3000 : 15000);
    return () => clearInterval(timer);
  }, [phase, refresh]);

  if (error && !auction) {
    return (
      <div className="pub-page"><div className="pub-container">
        <div className="pub-error">{error} <Link to="/auctions/live">See live auctions</Link></div>
      </div></div>
    );
  }
  if (!auction) return <div className="pub-page"><div className="pub-container"><div className="pub-loading"><Loader2 size={18} className="pub-spin" /> Loading auction…</div></div></div>;

  const v = auction.vehicle;
  const label = (field, value) => (field === 'damage_type' && v.damage_type === 'other' && v.damage_other ? v.damage_other : options[field]?.[value] || value);
  const youLead = history[0]?.is_you;

  return (
    <div className="pub-page">
      <div className="pub-container">
        <Link to={`/auctions/${phase === 'upcoming' ? 'upcoming' : phase === 'ended' ? 'ended' : 'live'}`} className="pub-back">
          <ChevronLeft size={16} /> All auctions
        </Link>

        <div className="pub-auction">
          <div className="pub-auction-main">
            <div className="pub-gallery">
              <div className="pub-gallery-main">
                <VehiclePhoto vehicle={v} index={photo} />
                <PhaseBadge phase={phase} />
                {v.photo_ids.length > 1 && (
                  <>
                    <button type="button" className="pub-gallery-nav pub-gallery-prev"
                      onClick={() => setPhoto((i) => (i - 1 + v.photo_ids.length) % v.photo_ids.length)}
                      aria-label="Previous photo">
                      <ChevronLeft size={20} />
                    </button>
                    <button type="button" className="pub-gallery-nav pub-gallery-next"
                      onClick={() => setPhoto((i) => (i + 1) % v.photo_ids.length)}
                      aria-label="Next photo">
                      <ChevronRight size={20} />
                    </button>
                    <span className="pub-gallery-count" aria-hidden="true">{photo + 1} / {v.photo_ids.length}</span>
                  </>
                )}
              </div>
              {v.photo_ids.length > 1 && (
                <div className="pub-thumbs">
                  {v.photo_ids.map((pid, i) => (
                    <button key={pid} type="button" className={i === photo ? 'active' : ''} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`}>
                      <VehiclePhoto vehicle={v} index={i} size="thumb" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pub-specs">
              <h2>Vehicle details</h2>
              <dl>
                {SPEC_FIELDS.map(([field, title]) => (
                  <React.Fragment key={field}>
                    <dt>{title}</dt><dd>{label(field, v[field])}</dd>
                  </React.Fragment>
                ))}
              </dl>
              <p className="pub-note">Sold as-is, where-is. Inspect the photos and details carefully before bidding.</p>
            </div>

            <section className="pub-auction-terms" aria-labelledby="auction-terms-title">
              <h2 id="auction-terms-title"><FileText size={18} /> Auction terms</h2>
              <ul>{AUCTION_TERMS.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          </div>

          <aside className="pub-auction-side">
            <div className="pub-bidbox">
              <h1>{v.manufacturing_year} {v.make} {v.model} <span>{v.variant}</span></h1>
              <p className="pub-card-meta"><MapPin size={14} /> {v.location} · {v.registration_number}</p>

              <div className="pub-bid-figures">
                <div><span>{auction.current_price ? 'Current bid' : 'Bidding'}</span>
                  {auction.current_price
                    ? <strong>{money(auction.current_price)}</strong>
                    : <strong className="pub-no-bids">Bidding open</strong>}</div>
                <div><span>Bids</span><strong>{auction.bid_count}</strong></div>
              </div>
              <div className="pub-bid-time">
                <Countdown auction={auction} offset={offset} />
                <span className="pub-muted">{phase === 'upcoming' ? `Opens ${dateTime(auction.starts_at)}` : `Ends ${dateTime(auction.ends_at)}`}</span>
              </div>
              {auction.extension_enabled && phase !== 'ended' && (
                <p className="pub-muted small">A bid in the last {auction.extension_minutes} minutes extends the auction by {auction.extension_minutes} minutes.</p>
              )}

              <BidArea auction={auction} user={user} youLead={youLead} location={location} onBid={refresh} />
            </div>

            <div className="pub-history">
              <h3>Bid history</h3>
              {history.length === 0 ? <p className="pub-muted">No bids yet. Be the first!</p> : (
                <ul>
                  {history.map((b, i) => (
                    <li key={`${b.placed_at}-${b.amount}`} className={b.is_you ? 'you' : ''}>
                      <span>{b.bidder}{b.is_you && ' (you)'}{i === 0 && <em> · highest</em>}</span>
                      <strong>{money(b.amount)}</strong>
                      <time>{dateTime(b.placed_at)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function BidArea({ auction, user, youLead, location, onBid }) {
  const site = useSiteConfig();
  // Only known once someone has bid. The starting price is admin-only (client, 2026-11-26), so before
  // the first bid the form shows no minimum and the server decides whether the amount is high enough.
  const minimum = useMemo(
    () => (auction.current_price ? Math.floor(Number(auction.current_price)) + 1 : null),
    [auction.current_price],
  );
  const [amount, setAmount] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState(null);
  const [lowBid, setLowBid] = useState(null);       // refused for being under the hidden starting price

  if (auction.phase === 'ended') {
    if (auction.result === 'sold') {
      return youLead
        ? <div className="pub-state success"><Trophy size={18} /> <div><strong>You won this auction!</strong><p>Our team will contact you with the payment steps. You can also see it in your dashboard.</p></div></div>
        : <div className="pub-state"><CheckCircle2 size={18} /> Sold for {money(auction.current_price)}.</div>;
    }
    return <div className="pub-state">This auction ended without a sale.</div>;
  }
  if (!user) {
    return <Link to="/login" state={{ from: location }} className="pub-btn primary block"><Gavel size={16} /> Sign in to bid</Link>;
  }
  if (user.role !== 'bidder') {
    return <div className="pub-state">Only bidder accounts can place bids.</div>;
  }
  if (user.kyc_status !== 'verified') {
    return (
      <div className="pub-state warning">
        <ShieldCheck size={18} />
        <div><strong>Verify your identity to bid</strong><p>Complete KYC once; you can then bid on any auction.</p>
          <Link to="/dashboard" className="pub-link">Go to KYC →</Link></div>
      </div>
    );
  }
  // Bidding can also need a mobile number confirmed by SMS (switched on once an SMS provider is set up).
  if (site?.mobile_otp && user.is_mobile_verified === false) {
    return (
      <div className="pub-state warning">
        <Smartphone size={18} />
        <div><strong>Verify your mobile number to bid</strong><p>We send a code by SMS; our team calls winners on this number.</p>
          <Link to="/dashboard" className="pub-link">Verify mobile →</Link></div>
      </div>
    );
  }
  if (auction.phase === 'upcoming') return <div className="pub-state">Bidding opens when the auction starts.</div>;
  if (auction.phase === 'paused') return <div className="pub-state warning"><AlertTriangle size={18} /> The auction is paused by the organiser.</div>;
  if (auction.phase === 'closing') return <div className="pub-state">The auction has ended and is being closed.</div>;
  if (youLead) return <div className="pub-state success"><Trophy size={18} /> <div><strong>You are the highest bidder.</strong><p>We will show here if someone outbids you.</p></div></div>;

  const value = Number(amount);
  const tooLow = minimum !== null && amount !== '' && value < minimum;
  const quick = [1000, 5000, 10000, 25000];

  return (
    <div className="pub-bid-form">
      <label>
        <span>{minimum === null ? 'Your bid (₹)' : `Your bid (₹) · minimum ${money(minimum)}`}</span>
        <input type="number" inputMode="numeric" min={minimum ?? 1} step="1" value={amount}
          placeholder={minimum === null ? 'Enter your bid' : String(minimum)}
          onChange={(e) => { setAmount(e.target.value); setMessage(null); }} />
      </label>
      {minimum !== null && (
        <div className="pub-quick">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => setAmount(String(Math.floor(Number(auction.current_price)) + q))}>
              +{q.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      )}
      {tooLow && <p className="pub-form-error">Your bid must be at least {money(minimum)}.</p>}
      {message && <p className={message.ok ? 'pub-form-ok' : 'pub-form-error'} role={message.ok ? 'status' : 'alert'}>{message.text}</p>}
      <button type="button" className="pub-btn primary block" disabled={!amount || tooLow || !(value > 0)} onClick={() => setConfirming(true)}>
        <Gavel size={16} /> Place bid
      </button>
      {confirming && (
        <ConfirmBid auctionId={auction.id} amount={value} onClose={() => setConfirming(false)}
          onDone={(text, ok, code) => {
            setConfirming(false);
            // A bid under the (hidden) starting price gets its own dialog, so it cannot be missed.
            if (code === 'bid_below_starting_price') setLowBid(text);
            else { setMessage({ text, ok }); if (ok) setAmount(''); }
            onBid();
          }} />
      )}
      {lowBid && <LowBidDialog text={lowBid} onClose={() => setLowBid(null)} />}
    </div>
  );
}

/** Shown when the server refuses a bid for being under the starting price, which bidders never see. */
function LowBidDialog({ text, onClose }) {
  return (
    <ModalLayer onClose={onClose}>
      <div className="pub-modal pub-modal-alert" role="alertdialog" aria-modal="true" aria-label="Bid too low">
        <AlertTriangle size={32} className="pub-modal-icon" />
        <h3>Bid too low</h3>
        <p className="pub-modal-text">{text}</p>
        <div className="pub-modal-actions">
          <button type="button" className="pub-btn primary" onClick={onClose} autoFocus>Try a higher bid</button>
        </div>
      </div>
    </ModalLayer>
  );
}

function ConfirmBid({ auctionId, amount, onClose, onDone }) {
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const key = useRef(newIdempotencyKey());          // one key per bid: a retried or double-sent request is the same bid

  const confirm = async () => {
    setBusy(true);
    try {
      const result = await placeBid(auctionId, amount, key.current);
      onDone(result.time_extended
        ? `Bid of ${money(result.amount)} placed. The auction was extended.`
        : `Bid of ${money(result.amount)} placed. You are the highest bidder.`, true);
    } catch (err) {
      onDone(err.message, false, err.code);
    }
  };

  return (
    <ModalLayer onClose={onClose} locked={busy}>
      <div className="pub-modal" role="dialog" aria-modal="true" aria-label="Confirm your bid">
        <h3>Confirm your bid</h3>
        <p className="pub-confirm-amount">{money(amount)}</p>
        <ul className="pub-terms">
          {AUCTION_TERMS.map((t) => <li key={t}>{t}</li>)}
          <li>If you win, you <strong>must complete the purchase</strong>. Our team will contact you.</li>
          <li>Withdrawing after winning can lead to your account being <strong>blocked</strong>.</li>
          <li>The vehicle is sold <strong>as-is, where-is</strong>.</li>
        </ul>
        <label className="pub-check">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>I understand and accept the <Link to="/legal/auction" target="_blank">auction terms</Link>.</span>
        </label>
        <div className="pub-modal-actions">
          <button type="button" className="pub-btn" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="button" className="pub-btn primary" disabled={!accepted || busy} onClick={confirm}>
            {busy ? <Loader2 size={15} className="pub-spin" /> : <Gavel size={15} />} Confirm bid
          </button>
        </div>
      </div>
    </ModalLayer>
  );
}
