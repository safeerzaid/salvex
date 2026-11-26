import React, { useState } from 'react';
import { MessageCircle, Phone, Search, Trophy } from 'lucide-react';
import { getResult, listResults } from '../api/admin';
import { categoryLabel } from '../api/auctions';
import { DealSummary, FeeEntries } from './DealCard';
import { AdmTable, Badge, Empty, ErrorBox, Modal, Notice, Pager, Spinner, VehicleCell, dateTime, money, pickFilter, useLoad } from './ui';

const FILTERS = [
  { value: 'sold', label: 'Sold' },
  { value: 'no_sale', label: 'No sale' },
  { value: '', label: 'All' },
];

/** Finished auctions: who won, for how much, and where the payment stands. */
export default function AdminResults({ deepLink = {}, onDeepLinkClose }) {
  const [result, setResult] = useState(pickFilter(deepLink.status, FILTERS, 'sold'));
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(deepLink.id || null);
  const closeDetail = () => { setOpenId(null); if (deepLink.id) onDeepLinkClose?.(); };
  const list = useLoad(() => listResults({ result, q: search, page, page_size: 25 }), [result, search, page]);

  return (
    <div className="adm-section">
      <div className="adm-section-head">
        <div>
          <h2>Results</h2>
          <p className="adm-muted">Every finished auction: the winner, the winning amount and the payment status.</p>
        </div>
        <form className="adm-search" onSubmit={(e) => { e.preventDefault(); setSearch(query.trim()); setPage(1); }}>
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Vehicle, claim no., winner or Buyer ID" aria-label="Search results" />
        </form>
      </div>

      <div className="adm-tabs">
        {FILTERS.map((f) => (
          <button key={f.label} type="button" className={result === f.value ? 'active' : ''} onClick={() => { setResult(f.value); setPage(1); }}>{f.label}</button>
        ))}
      </div>

      <ErrorBox message={list.error} onRetry={list.reload} />
      {!list.data && list.loading && <Spinner />}
      {list.data && (list.data.items.length === 0 ? <Empty>No finished auctions here yet.</Empty> : (
        <AdmTable>
            <thead><tr><th>Vehicle</th><th>Result</th><th>Approved amount</th><th>Winner</th><th>Service fee</th><th>Closed</th><th /></tr></thead>
            <tbody>
              {list.data.items.map((r) => (
                <tr key={r.auction_id} className="clickable" onClick={() => setOpenId(r.auction_id)}>
                  <td className="adm-cell-main">
                    <VehicleCell vehicleId={r.vehicle_id} photoId={r.cover_photo_id} title={r.vehicle_title}
                      sub={`${r.registration_number} · ${categoryLabel(r.category)}`} />
                  </td>
                  <td><Badge value={r.result} label={r.result === 'sold' ? 'Sold' : 'No sale'} /></td>
                  <td><strong>{money(r.approved_amount ?? r.winning_amount)}</strong></td>
                  <td>{r.winner_name ? <div className="adm-two-line"><strong>{r.winner_name}</strong><span>{r.winner_buyer_id} · {r.winner_mobile || r.winner_email}</span></div> : '—'}</td>
                  <td><FeeStatus row={r} /></td>
                  <td>{dateTime(r.closed_at)}</td>
                  <td className="right"><button type="button" className="adm-btn small">Open</button></td>
                </tr>
              ))}
            </tbody>
          </AdmTable>
      ))}
      <Pager page={list.data} onPage={setPage} />
      {openId && <ResultDetail id={openId} onClose={closeDetail} />}
    </div>
  );
}

function FeeStatus({ row }) {
  if (row.result !== 'sold') return '—';
  if (row.service_fee === null || row.service_fee === undefined) return <span className="adm-muted">Fee not set</span>;
  const pending = Number(row.fee_pending);
  return (
    <div className="adm-two-line">
      <strong>{money(row.fee_received)} / {money(row.service_fee)}</strong>
      {pending > 0 ? <span className="adm-text-amber">{money(pending)} pending</span> : <span className="adm-text-green">Fully paid</span>}
    </div>
  );
}

function ResultDetail({ id, onClose }) {
  const { data: r, error, loading, reload } = useLoad(() => getResult(id), [id]);
  const [notice, setNotice] = useState(null);
  const changed = (msg) => { setNotice(msg); reload(); };
  if (!r) return <Modal title="Result" onClose={onClose} wide>{loading ? <Spinner /> : <ErrorBox message={error} onRetry={reload} />}</Modal>;
  const sold = r.result === 'sold';

  return (
    <Modal title={`${r.vehicle_title} · ${r.registration_number}`} onClose={onClose} wide>
      <div className="adm-detail">
        <Notice onClose={() => setNotice(null)}>{notice}</Notice>
        <div className={`adm-result-banner ${sold ? 'sold' : 'no-sale'}`}>
          <Trophy size={22} />
          <div>
            <strong>{sold ? `Sold for ${money(r.winning_amount)}` : 'Ended without a sale'}</strong>
            <span>{sold ? `Won by ${r.winner_name}` : 'No bids were placed.'} · closed {dateTime(r.closed_at)}</span>
          </div>
        </div>

        <div className="adm-grid-3">
          <div className="adm-stat"><span>Winning bid (With RC)</span><strong>{money(r.winning_amount)}</strong></div>
          <div className="adm-stat"><span>Expected — With RC</span><strong>{money(r.starting_price)}</strong></div>
          <div className="adm-stat"><span>Bids — With RC</span><strong>{r.bid_count}</strong></div>
          {r.claim_number && <div className="adm-stat"><span>Claim number</span><strong className="mono">{r.claim_number}</strong></div>}
        </div>

        {/* The second rate the company quotes the insurer. Reported whatever the With RC result was. */}
        <div className="adm-grid-3">
          <div className="adm-stat"><span>Best rate — Without RC</span>
            <strong>{r.highest_without_rc ? money(r.highest_without_rc) : '—'}</strong></div>
          <div className="adm-stat"><span>Expected — Without RC</span>
            <strong>{r.starting_price_without_rc ? money(r.starting_price_without_rc) : '—'}</strong></div>
          <div className="adm-stat"><span>Bids — Without RC</span><strong>{r.bid_count_without_rc ?? 0}</strong></div>
        </div>

        {sold && (
          <div className="adm-grid-2">
            <div className="adm-card">
              <div className="adm-card-head"><h4>Winner</h4><Badge value={r.winner_kyc_status} label={`KYC ${r.winner_kyc_status}`} /></div>
              <dl className="adm-dl">
                <dt>Buyer ID</dt><dd className="mono"><strong>{r.winner_buyer_id}</strong></dd>
                <dt>Name</dt><dd><strong>{r.winner_name}</strong></dd>
                <dt>Email</dt><dd>{r.winner_email}</dd>
                <dt>Mobile</dt><dd>{r.winner_mobile || '—'}</dd>
                <dt>Organisation</dt><dd>{r.winner_organization || '—'}</dd>
                <dt>Account</dt><dd>{r.winner_is_active ? 'Active' : 'Suspended'} · since {dateTime(r.winner_since)}</dd>
              </dl>
              <div className="adm-actions-row" style={{ justifyContent: 'flex-start' }}>
                {r.winner_mobile && <a className="adm-btn small primary" href={`tel:${r.winner_mobile.replace(/[^0-9+]/g, '')}`}><Phone size={14} /> Call</a>}
                {r.winner_mobile && <a className="adm-btn small" href={`https://wa.me/${r.winner_mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>}
              </div>
            </div>

            {r.deal && <DealSummary deal={r.deal} onChanged={changed} />}
          </div>
        )}

        {sold && r.deal && <FeeEntries deal={r.deal} onChanged={changed} />}

        <div className="adm-card">
          <h4>Vehicle and auction</h4>
          <dl className="adm-dl">
            <dt>Vehicle</dt><dd>{r.vehicle_title}</dd>
            <dt>Registration</dt><dd className="mono">{r.registration_number}</dd>
            <dt>Category</dt><dd>{categoryLabel(r.category)}</dd>
            <dt>Location</dt><dd>{r.location}</dd>
            <dt>Auction</dt><dd>{dateTime(r.starts_at)} → {dateTime(r.ends_at)}</dd>
          </dl>
        </div>

        {r.top_bids.length > 0 && (
          <div className="adm-card">
            <h4>Top bids</h4>
            <AdmTable className="compact">
              <thead><tr><th>#</th><th>Bidder</th><th>Amount</th><th>Time</th></tr></thead>
              <tbody>
                {r.top_bids.map((b, i) => (
                  <tr key={`${b.created_at}-${b.amount}`}>
                    <td>{i + 1}</td>
                    <td>{b.bidder_name}<div className="adm-muted small">{b.bidder_email}</div></td>
                    <td><strong>{money(b.amount)}</strong>{i === 0 && sold && <> <Badge value="sold" label="Winner" /></>}</td>
                    <td>{dateTime(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </AdmTable>
          </div>
        )}
      </div>
    </Modal>
  );
}
