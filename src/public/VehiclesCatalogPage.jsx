import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Gavel, Loader2, MapPin, Search, Truck } from 'lucide-react';
import { getCatalogueVehicle, getVehicleOptions, listCatalogue } from '../api/vehicles';
import { EmptyState, PhaseBadge, VehiclePhoto, money } from './shared';
import './public.css';
import Select from '../components/ui/Select';
import InterestButton from './InterestButton';
import { READY_TO_LIFT_NOTE } from '../api/readyToLift';

export default function VehiclesCatalogPage() {
  const [params, setParams] = useSearchParams();
  const [options, setOptions] = useState({});
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');

  const filters = Object.fromEntries(['q', 'category', 'fuel_type', 'transmission', 'damage_type', 'year_from', 'year_to', 'location']
    .map((k) => [k, params.get(k) || '']));
  const filterKey = JSON.stringify(filters);

  const load = useCallback(async (pageNumber, append) => {
    setLoading(true);
    try {
      const data = await listCatalogue({ ...JSON.parse(filterKey), page: pageNumber, page_size: 12 });
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setPage(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { load(1, false); }, [load]);
  useEffect(() => { getVehicleOptions().then(setOptions).catch(() => {}); }, []);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  return (
    <div className="pub-page">
      <div className="pub-container">
        <div className="pub-head">
          <div>
            <h1>Vehicles</h1>
            <p>Every vehicle here has been checked and approved by our team.</p>
          </div>
        </div>

        <form className="pub-filters" onSubmit={(e) => { e.preventDefault(); setFilter('q', q.trim()); }}>
          <div className="pub-search"><Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Make, model or variant" aria-label="Search vehicles" /></div>
          <Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
            <option value="">Any category</option>
            {Object.entries(options.category || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <Select value={filters.fuel_type} onChange={(e) => setFilter('fuel_type', e.target.value)} aria-label="Fuel">
            <option value="">Any fuel</option>
            {Object.entries(options.fuel_type || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <Select value={filters.transmission} onChange={(e) => setFilter('transmission', e.target.value)} aria-label="Transmission">
            <option value="">Any transmission</option>
            {Object.entries(options.transmission || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <Select value={filters.damage_type} onChange={(e) => setFilter('damage_type', e.target.value)} aria-label="Damage">
            <option value="">Any damage</option>
            {Object.entries(options.damage_type || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <input type="number" className="pub-year" placeholder="Year from" value={filters.year_from} min="1950" max="2100"
            onChange={(e) => setFilter('year_from', e.target.value)} aria-label="Year from" />
          <button type="submit" className="pub-btn primary">Search</button>
        </form>

        {error && items.length === 0 && <div className="pub-error">Could not load vehicles. <button type="button" onClick={() => load(1, false)}>Try again</button></div>}
        {loading && items.length === 0 && <div className="pub-loading"><Loader2 size={18} className="pub-spin" /> Loading vehicles…</div>}
        {!loading && !error && items.length === 0 && <EmptyState title="No vehicles match">Try fewer filters.</EmptyState>}

        <div className="pub-grid">
          {items.map((v) => (
            <Link key={v.id} to={`/vehicles/${v.id}`} className="pub-card">
              <div className="pub-card-media">
                <VehiclePhoto vehicle={v} size="thumb" />
                {v.auction && <PhaseBadge phase={v.auction.phase} />}
                {v.listing_type === 'ready_to_lift' && <span className="pub-rtl-badge"><Truck size={12} /> Ready to Lift</span>}
              </div>
              <div className="pub-card-body">
                <h3>{v.manufacturing_year} {v.make} {v.model}</h3>
                <p className="pub-card-sub">{v.variant} · {v.registration_number}</p>
                <p className="pub-card-meta"><MapPin size={13} /> {v.location}</p>
                <div className="pub-card-price">
                  {v.listing_type === 'ready_to_lift' ? (
                    <div><span>Ready to Lift</span><strong className="pub-rtl-text">Available now</strong></div>
                  ) : v.auction ? (
                    <div><span>{v.auction.current_price ? 'Current bid' : 'Bidding'}</span>
                      {v.auction.current_price
                        ? <strong>{money(v.auction.current_price)}</strong>
                        : <strong className="pub-no-bids">No bids yet</strong>}</div>
                  ) : <div><span>Auction</span><strong className="pub-muted">Next auction coming soon</strong></div>}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {page && page.page < page.pages && (
          <div className="pub-more">
            <button type="button" className="pub-btn" disabled={loading} onClick={() => load(page.page + 1, true)}>{loading ? 'Loading…' : 'Show more'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function VehiclePage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({});
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    getCatalogueVehicle(id).then(setVehicle).catch((err) => setError(err.status === 404 ? 'This vehicle is not available.' : err.message));
    getVehicleOptions().then(setOptions).catch(() => {});
  }, [id]);

  if (error) return <div className="pub-page"><div className="pub-container"><div className="pub-error">{error} <Link to="/auctions/live">Live auctions</Link></div></div></div>;
  if (!vehicle) return <div className="pub-page"><div className="pub-container"><div className="pub-loading"><Loader2 size={18} className="pub-spin" /> Loading…</div></div></div>;

  const v = vehicle;
  const label = (field) => (field === 'damage_type' && v.damage_type === 'other' && v.damage_other ? v.damage_other : options[field]?.[v[field]] || v[field]);
  return (
    <div className="pub-page">
      <div className="pub-container">
        <Link to={v.listing_type === 'ready_to_lift' ? '/ready-to-lift' : '/auctions/live'} className="pub-back"><ChevronLeft size={16} /> {v.listing_type === 'ready_to_lift' ? 'Ready to Lift' : 'Auctions'}</Link>
        <div className="pub-auction">
          <div className="pub-auction-main">
            <div className="pub-gallery">
              <div className="pub-gallery-main"><VehiclePhoto vehicle={v} index={photo} /></div>
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
          </div>
          <aside className="pub-auction-side">
            <div className="pub-bidbox">
              <h1>{v.manufacturing_year} {v.make} {v.model} <span>{v.variant}</span></h1>
              <p className="pub-card-meta"><MapPin size={14} /> {v.location} · {v.registration_number}</p>
              <dl className="pub-mini-specs">
                {v.listing_type !== 'ready_to_lift' && <><dt>Category</dt><dd>{label('category')}</dd></>}
                <dt>Fuel</dt><dd>{label('fuel_type')}</dd>
                <dt>Transmission</dt><dd>{label('transmission')}</dd>
                <dt>Owners</dt><dd>{v.number_of_owners}</dd>
                {v.km_driven !== null && v.km_driven !== undefined && <><dt>KM driven</dt><dd>{Number(v.km_driven).toLocaleString('en-IN')} km</dd></>}
                {v.superdari !== null && v.superdari !== undefined && <><dt>Superdari</dt><dd>{v.superdari ? 'Yes' : 'No'}</dd></>}
                <dt>Damage</dt><dd>{label('damage_type')}</dd>
                <dt>RC</dt><dd>{label('rc_status')}</dd>
                <dt>Registration</dt><dd>{label('registration_type')} · {v.registration_year}</dd>
                <dt>Hypothecation</dt><dd>{label('hypothecation_status')}</dd>
              </dl>
              {v.sold ? (
                <div className="pub-state pub-sold-state"><strong>Sold</strong> This vehicle has been sold. Browse the other vehicles and auctions.</div>
              ) : v.listing_type === 'ready_to_lift' ? (
                <div className="pub-rtl-box">
                  <span className="pub-rtl-badge static"><Truck size={12} /> Ready to Lift · available for immediate collection</span>
                  <p className="pub-muted small">{READY_TO_LIFT_NOTE}</p>
                  <InterestButton vehicleId={v.id} block title={`${v.manufacturing_year} ${v.make} ${v.model} ${v.variant || ''}`.trim()} />
                </div>
              ) : v.auction ? (
                <Link to={`/auctions/${v.auction.id}`} className="pub-btn primary block"><Gavel size={16} /> {v.auction.phase === 'upcoming' ? 'View upcoming auction' : 'Go to auction'}</Link>
              ) : <div className="pub-state">The next auction for this vehicle is coming soon. Check the upcoming auctions.</div>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
