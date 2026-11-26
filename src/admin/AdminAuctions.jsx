import React, { useEffect, useState } from 'react';
import { Ban, Check, Clock, FileSpreadsheet, Flag, Loader2, Pause, Play, Plus, TimerReset } from 'lucide-react';
import { auctionAction, createAuction, getAuction, listAuctionBids, listAuctions, listVehicles, updateAuction } from '../api/admin';
import { updateVehicle, vehicleTitle } from '../api/vehicles';
import { createOrResumeDraft } from './draftResume';
import VehicleForm from '../components/VehicleForm';
import { PhotoStep } from './PhotoStep';
import AdminVehicles from './AdminVehicles';
import AdminBulkUpload from './AdminBulkUpload';
import { ActionDialog, AdmTable, Badge, Empty, ErrorBox, Modal, Notice, Pager, Spinner, VehicleCell, dateTime, money, useLoad } from './ui';
import Select from '../components/ui/Select';
import DateTimePicker from '../components/ui/DateTimePicker';
import { categoryLabel } from '../api/auctions';
import { clockOffset, formatLeft, useNow } from '../public/shared';

// One simple list: vehicles waiting for an auction, then the auctions by stage.
const TABS = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'live', label: 'Live' },
  { key: 'ended', label: 'Ended' },
];
// links from notifications / the dashboard may still use the auction statuses
const LEGACY = { scheduled: 'upcoming', paused: 'live', closed: 'ended', cancelled: 'ended', '': 'live' };
const EMPTY_TEXT = {
  upcoming: 'No upcoming auctions. Start one from the Waiting tab or with New auction.',
  live: 'No live auctions right now.',
  ended: 'No ended auctions yet.',
};

// The date-time picker works in local time without a zone; the server needs a zone.
/** "Ends in 3h 20m" / "Starts in 2d 4h" / "Ended", counted on the server clock, with the date underneath. */
function AuctionTime({ auction: a }) {
  const now = useNow(clockOffset(a.server_time));
  const starts = new Date(a.starts_at).getTime();
  const ends = new Date(a.ends_at).getTime();
  let main;
  let tone = '';
  let when = dateTime(a.ends_at);
  if (a.status === 'cancelled') { main = 'Cancelled'; when = dateTime(a.closed_at); }
  else if (a.status === 'closed') { main = 'Ended'; when = dateTime(a.closed_at || a.ends_at); }
  else if (a.status === 'paused') { main = 'Paused'; tone = 'amber'; }
  else if (now < starts) { main = `Starts in ${formatLeft(starts - now)}`; tone = 'blue'; when = dateTime(a.starts_at); }
  else if (now < ends) { main = `Ends in ${formatLeft(ends - now)}`; tone = ends - now < 5 * 60000 ? 'red' : 'green'; }
  else { main = 'Closing…'; tone = 'amber'; }
  return (
    <div className={`adm-two-line adm-time ${tone}`}>
      <strong>{main}</strong>
      <span>{when}</span>
    </div>
  );
}

const toLocalInput = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};
const fromLocalInput = (value) => new Date(value).toISOString();
// Ends after Starts: when the start moves past the end, the end moves with it (keeping the old length, or 1 hour).
const followStart = (form, nextStart) => {
  const oldStart = new Date(form.starts_at).getTime();
  const oldEnd = new Date(form.ends_at).getTime();
  const start = new Date(nextStart).getTime();
  if (Number.isNaN(start) || (!Number.isNaN(oldEnd) && oldEnd > start)) return { ...form, starts_at: nextStart };
  const length = !Number.isNaN(oldEnd) && !Number.isNaN(oldStart) && oldEnd > oldStart ? oldEnd - oldStart : 3600000;
  return { ...form, starts_at: nextStart, ends_at: toLocalInput(new Date(start + length)) };
};


export default function AdminAuctions({ preselectVehicle, clearPreselect, deepLink = {} }) {
  const linked = TABS.some((t) => t.key === deepLink.status) ? deepLink.status : LEGACY[deepLink.status];
  // from the dashboard: status=upload opens the bulk upload, status=new the New auction window
  const [tab, setTab] = useState(linked || (preselectVehicle || deepLink.status === 'upload' ? 'waiting' : 'live'));
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(tab !== 'waiting' ? deepLink.id || null : null);
  const [chosen, setChosen] = useState(preselectVehicle || null);       // vehicle to start an auction for
  const [creating, setCreating] = useState(Boolean(preselectVehicle) || deepLink.status === 'new');
  const [bulk, setBulk] = useState(deepLink.status === 'upload');
  const [notice, setNotice] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const list = useLoad(() => (tab === 'waiting' ? Promise.resolve(null) : listAuctions({ view: tab, page, page_size: 25 })), [tab, page, refresh]);
  // Waiting = ready to start + drafts that still need photos
  const waiting = useLoad(async () => {
    const [ready, drafts] = await Promise.all([
      listVehicles({ listing_type: 'auction', ready_for_auction: true, page_size: 1 }),
      listVehicles({ listing_type: 'auction', status: 'draft', page_size: 1 }),
    ]);
    return { total: ready.total + drafts.total };
  }, [tab, refresh]);
  const changed = () => setRefresh((n) => n + 1);
  const show = (key) => { setTab(key); setPage(1); };
  const closeCreate = () => { setCreating(false); setChosen(null); clearPreselect?.(); };

  return (
    <div className="adm-section">
      <div className="adm-section-head">
        <div>
          <h2>Auctions</h2>
          <p className="adm-muted">Add vehicles, start their auctions, follow them live. Auctions open and close on their own at the times you set.</p>
        </div>
        <div className="adm-actions-row adm-head-actions">
          <button type="button" className="adm-btn" onClick={() => setBulk(true)}><FileSpreadsheet size={15} /> Bulk upload</button>
          <button type="button" className="adm-btn primary" onClick={() => { setChosen(null); setCreating(true); }}><Plus size={15} /> New auction</button>
        </div>
      </div>

      <div className="adm-tabs adm-auction-tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? 'active' : ''} onClick={() => show(t.key)}>
            {t.label}
            {t.key === 'waiting' && waiting.data?.total > 0 && <span className="adm-tab-count">{waiting.data.total}</span>}
          </button>
        ))}
      </div>

      <Notice onClose={() => setNotice(null)}>{notice}</Notice>
      {tab === 'waiting' && (
        <AdminVehicles listing="auction" embedded deepLink={deepLink.status === 'waiting' ? deepLink : {}} refreshKey={refresh}
          onChanged={changed} onAuction={(v) => { setChosen(v); setCreating(true); }} />
      )}
      {tab !== 'waiting' && <ErrorBox message={list.error} onRetry={list.reload} />}
      {tab !== 'waiting' && !list.data && list.loading && <Spinner />}
      {tab !== 'waiting' && list.data && (list.data.items.length === 0 ? <Empty>{EMPTY_TEXT[tab]}</Empty> : (
        <AdmTable>
            <thead><tr><th>Vehicle</th><th>Status</th><th>Price</th><th>Bids</th><th>Time</th><th /></tr></thead>
            <tbody>
              {list.data.items.map((a) => (
                <tr key={a.id} className="clickable" onClick={() => setOpenId(a.id)}>
                  <td className="adm-cell-main">
                    <VehicleCell vehicleId={a.vehicle_id} photoId={a.cover_photo_id}
                      title={(a.vehicle_title || '').replace(/\s*\([^)]*\)$/, '') || 'Vehicle'}
                      sub={[a.registration_number, categoryLabel(a.category)].filter(Boolean).join(' · ')} />
                  </td>
                  <td><span className="adm-badges"><Badge value={a.phase} />{a.result && <Badge value={a.result} label={a.result === 'no_sale' ? 'No sale' : 'Sold'} />}</span></td>
                  <td>
                    <div className="adm-two-line">
                      <strong>{money(a.current_price ?? a.starting_price)}</strong>
                      <span>{a.current_price ? `from ${money(a.starting_price)}` : 'starting price'}</span>
                    </div>
                  </td>
                  <td><span className="adm-count">{a.bid_count}</span></td>
                  <td><AuctionTime auction={a} /></td>
                  <td className="right"><button type="button" className="adm-btn small">Open</button></td>
                </tr>
              ))}
            </tbody>
          </AdmTable>
      ))}
      {tab !== 'waiting' && <Pager page={list.data} onPage={setPage} />}

      {creating && chosen && (
        <CreateAuction vehicle={chosen}
          onClose={closeCreate}
          onCreated={(a) => { closeCreate(); setNotice('Auction created.'); show('upcoming'); changed(); setOpenId(a.id); }} />
      )}
      {creating && !chosen && (
        <NewAuctionWizard
          onClose={(saved) => {
            closeCreate();
            if (saved) {
              setNotice(saved.stage >= 3
                ? `${saved.registration_number} is published and waiting for its auction: Waiting tab, Start auction.`
                : `${saved.registration_number} is saved as a draft: Waiting tab, Need photos. Or add it again: you continue where you stopped.`);
              show('waiting');
            }
            changed();
          }}
          onCreated={(a) => { closeCreate(); setNotice('Vehicle published and auction created.'); show('upcoming'); changed(); setOpenId(a.id); }} />
      )}
      {bulk && <AdminBulkUpload listing="auction" onClose={() => { setBulk(false); show('waiting'); changed(); }} onFinished={changed} />}
      {openId && <AuctionDetail id={openId} onClose={() => { setOpenId(null); changed(); }} />}
    </div>
  );
}

function CreateAuction({ vehicle, onClose, onCreated }) {
  return (
    <Modal title="New auction" onClose={onClose}>
      <AuctionSettingsForm vehicle={vehicle} chooseVehicle onCancel={onClose} onCreated={onCreated} />
    </Modal>
  );
}

/** Starting price, times and the late-bid extension. `chooseVehicle` shows a list of approved vehicles. */
function AuctionSettingsForm({ vehicle, chooseVehicle, onCancel, onCreated, cancelLabel = 'Cancel' }) {
  const vehicles = useLoad(() => (chooseVehicle ? listVehicles({ status: 'approved', page_size: 100 }) : Promise.resolve(null)), [chooseVehicle]);
  const [form, setForm] = useState(() => {
    const now = Date.now();
    return {
      vehicle_id: vehicle?.id || '',
      starting_price: '',
      starting_price_without_rc: '',
      starts_at: toLocalInput(new Date(now + 10 * 60000)),
      ends_at: toLocalInput(new Date(now + 24 * 3600000)),
      extension_enabled: true,
      extension_minutes: 2,
    };
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id) { setError('Choose a vehicle.'); return; }
    if (!(Number(form.starting_price) > 0)) { setError('Enter a starting price.'); return; }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) { setError('The end time must be after the start time.'); return; }
    setBusy(true);
    setError(null);
    try {
      const created = await createAuction({
        vehicle_id: form.vehicle_id,
        starting_price: String(form.starting_price),
        ...(form.starting_price_without_rc ? { starting_price_without_rc: String(form.starting_price_without_rc) } : {}),
        starts_at: fromLocalInput(form.starts_at),
        ends_at: fromLocalInput(form.ends_at),
        extension_enabled: form.extension_enabled,
        extension_minutes: Number(form.extension_minutes),
      });
      onCreated(created);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="adm-form" onSubmit={submit}>
      {chooseVehicle ? (
        <label className="adm-field">
          <span>Vehicle (approved vehicles only)</span>
          <Select value={form.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
            <option value="" disabled>Select a vehicle…</option>
            {vehicle && <option value={vehicle.id}>{vehicle.manufacturing_year} {vehicle.make} {vehicle.model} · {vehicle.registration_number}</option>}
            {vehicles.data?.items.filter((v) => v.id !== vehicle?.id).map((v) => (
              <option key={v.id} value={v.id}>{v.manufacturing_year} {v.make} {v.model} · {v.registration_number}</option>
            ))}
          </Select>
        </label>
      ) : vehicle && (
        <div className="adm-wizard-vehicle">
          <Check size={16} /> <span><strong>{vehicleTitle(vehicle)}</strong> · {vehicle.registration_number} · published on the website</span>
        </div>
      )}
      <label className="adm-field">
        <span>Expected amount — With RC (₹). The first With RC bid must be at least this; later bids just need to be higher. Bidders never see it.</span>
        <input type="number" min="1" step="1" inputMode="numeric" value={form.starting_price} onChange={(e) => set('starting_price', e.target.value)} />
      </label>
      <label className="adm-field">
        <span>Expected amount — Without RC (₹), optional. Leave empty to accept any first Without RC bid.</span>
        <input type="number" min="1" step="1" inputMode="numeric" value={form.starting_price_without_rc}
          onChange={(e) => set('starting_price_without_rc', e.target.value)} />
      </label>
      <div className="adm-grid-2">
        <div className="adm-field"><span>Starts</span><DateTimePicker aria-label="Starts" value={form.starts_at} min={toLocalInput(new Date())} onChange={(e) => setForm((f) => followStart(f, e.target.value))} /></div>
        <div className="adm-field"><span>Ends</span><DateTimePicker aria-label="Ends" value={form.ends_at} min={form.starts_at || toLocalInput(new Date())} onChange={(e) => set('ends_at', e.target.value)} /></div>
      </div>
      <div className="adm-grid-2">
        <label className="adm-check">
          <input type="checkbox" checked={form.extension_enabled} onChange={(e) => set('extension_enabled', e.target.checked)} />
          <span>Extend the time when a bid comes in the last minutes</span>
        </label>
        <label className="adm-field">
          <span>Extension (minutes)</span>
          <input type="number" min="1" max="60" value={form.extension_minutes} disabled={!form.extension_enabled}
            onChange={(e) => set('extension_minutes', e.target.value)} />
        </label>
      </div>
      <ErrorBox message={error} />
      <div className="adm-actions-row">
        <button type="button" className="adm-btn" onClick={onCancel}>{cancelLabel}</button>
        <button type="submit" className="adm-btn primary" disabled={busy}>{busy && <Loader2 size={14} className="adm-spin" />} Create auction</button>
      </div>
    </form>
  );
}

const WIZARD_STEPS = ['Vehicle details', 'Photos', 'Auction settings'];

/**
 * New auction in one flow: 1) the company's vehicle fields, 2) photos ("Confirm vehicle" publishes it),
 * 3) the auction settings. Leaving half-way keeps the vehicle under Vehicles (draft or approved).
 */
function NewAuctionWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState(null);
  const [useExisting, setUseExisting] = useState(false);
  const [resumed, setResumed] = useState(false);
  const close = () => onClose(vehicle ? { ...vehicle, stage: step } : null);   // what was saved before closing

  return (
    <Modal title="New auction" onClose={close} wide>
      {useExisting ? (
        <>
          <p className="adm-muted">Auction for a vehicle that is already approved.</p>
          <AuctionSettingsForm chooseVehicle onCancel={() => setUseExisting(false)} cancelLabel="Back" onCreated={onCreated} />
        </>
      ) : (
        <>
          <ol className="adm-steps">
            {WIZARD_STEPS.map((label, i) => (
              <li key={label} className={step === i + 1 ? 'current' : step > i + 1 ? 'done' : ''}>
                <span className="adm-step-num">{step > i + 1 ? <Check size={13} /> : i + 1}</span>
                <span className="adm-step-label">{label}</span>
              </li>
            ))}
          </ol>

          {step === 1 && (
            <>
              <VehicleForm initial={vehicle} auctionOnly saveLabel="Continue to photos" onCancel={close}
                onSave={async (body) => {
                  if (vehicle) { setVehicle(await updateVehicle(vehicle.id, body)); setStep(2); return; }
                  const result = await createOrResumeDraft(body);
                  setVehicle(result.vehicle);
                  setResumed(result.resumed);
                  setStep(2);
                }} />
              {!vehicle && (
                <p className="adm-muted small adm-wizard-alt">
                  Vehicle already added and approved?{' '}
                  <button type="button" className="adm-link" onClick={() => setUseExisting(true)}>Create the auction for it</button>
                </p>
              )}
            </>
          )}
          {resumed && step === 2 && (
            <p className="adm-alert adm-alert-info" role="status">
              You had started {vehicle.registration_number} earlier. Continuing that draft with these details; photos already added are kept.
            </p>
          )}
          {step === 2 && vehicle && (
            <PhotoStep vehicleId={vehicle.id} onBack={() => setStep(1)} onLater={close}
              onConfirmed={(approved) => { setVehicle(approved); setStep(3); }} />
          )}
          {step === 3 && vehicle && (
            <AuctionSettingsForm vehicle={vehicle} onCancel={close} cancelLabel="Later" onCreated={onCreated} />
          )}
        </>
      )}
    </Modal>
  );
}


function AuctionDetail({ id, onClose }) {
  const auction = useLoad(() => getAuction(id), [id]);
  const bids = useLoad(() => listAuctionBids(id, { page_size: 50 }), [id]);
  const [dialog, setDialog] = useState(null);
  const a = auction.data;
  const open = a && ['scheduled', 'paused'].includes(a.status);
  const reloadAuction = auction.reload;
  const reloadBids = bids.reload;

  useEffect(() => {                         // follow a live auction without reloading the page
    if (!a || !['live', 'closing', 'paused'].includes(a.phase)) return undefined;
    const timer = setInterval(() => { reloadAuction(); reloadBids(); }, 5000);
    return () => clearInterval(timer);
  }, [a, reloadAuction, reloadBids]);

  if (!a) return <Modal title="Auction" onClose={onClose} wide>{auction.loading ? <Spinner /> : <ErrorBox message={auction.error} onRetry={auction.reload} />}</Modal>;

  const act = (action, config) => setDialog({
    ...config,
    onConfirm: async (values) => {
      const body = {};
      if (values.reason) body.reason = values.reason;
      if (action === 'extend') body.minutes = Number(values.minutes);
      await auctionAction(id, action, body);
      auction.reload();
    },
  });

  return (
    <Modal title={a.vehicle_title || 'Auction'} onClose={onClose} wide>
      <div className="adm-detail">
        <div className="adm-inline">
          <Badge value={a.phase} /> {a.result && <Badge value={a.result} />}
          <span className="adm-muted small">Server time {dateTime(a.server_time)}</span>
        </div>

        <div className="adm-grid-3">
          <div className="adm-stat"><span>Expected — With RC</span><strong>{money(a.starting_price)}</strong></div>
          <div className="adm-stat"><span>Highest — With RC</span><strong>{money(a.current_price)}</strong>
            <em className="adm-muted small">{a.bid_count} bid{a.bid_count === 1 ? '' : 's'}</em></div>
          <div className="adm-stat"><span>Highest — Without RC</span>
            <strong>{a.current_price_without_rc ? money(a.current_price_without_rc) : '—'}</strong>
            <em className="adm-muted small">
              {a.bid_count_without_rc} bid{a.bid_count_without_rc === 1 ? '' : 's'}
              {a.starting_price_without_rc ? ` · expected ${money(a.starting_price_without_rc)}` : ' · no expected amount'}
            </em></div>
          <div className="adm-stat"><span>Starts</span><strong>{dateTime(a.starts_at)}</strong></div>
          <div className="adm-stat"><span>Ends</span><strong>{dateTime(a.ends_at)}</strong>
            {a.ends_at !== a.scheduled_ends_at && <em className="adm-muted small">originally {dateTime(a.scheduled_ends_at)}</em>}</div>
          <div className="adm-stat"><span>Late-bid extension</span>
            <strong>{a.extension_enabled ? `On · ${a.extension_minutes} min` : 'Off'}</strong>
            {open && (
              <button type="button" className="adm-link" onClick={async () => { await updateAuction(id, { extension_enabled: !a.extension_enabled }); auction.reload(); }}>
                Switch {a.extension_enabled ? 'off' : 'on'}
              </button>
            )}
          </div>
        </div>

        {open && (
          <div className="adm-actions-row left">
            {a.status === 'scheduled' && a.phase !== 'closing' && (
              <button type="button" className="adm-btn" onClick={() => act('pause', { title: 'Pause auction', confirmLabel: 'Pause',
                description: 'Bidding stops. When you resume, the end time moves forward by the paused time.' })}><Pause size={15} /> Pause</button>
            )}
            {a.status === 'paused' && (
              <button type="button" className="adm-btn" onClick={() => act('resume', { title: 'Resume auction', confirmLabel: 'Resume', reasonRequired: false })}><Play size={15} /> Resume</button>
            )}
            <button type="button" className="adm-btn" onClick={() => act('extend', { title: 'Extend auction', confirmLabel: 'Extend', initial: { minutes: 15 },
              extra: (v, set) => (
                <label className="adm-field"><span>Add minutes</span>
                  <input type="number" min="1" max="10080" value={v.minutes} onChange={(e) => set('minutes', e.target.value)} /></label>
              ) })}><TimerReset size={15} /> Extend</button>
            <button type="button" className="adm-btn" onClick={() => act('close', { title: 'Close auction now', confirmLabel: 'Close now',
              description: 'The highest bidder (if any) wins now. This cannot be undone.' })}><Flag size={15} /> Close now</button>
            <button type="button" className="adm-btn danger" onClick={() => act('cancel', { title: 'Cancel auction', confirmLabel: 'Cancel auction', danger: true,
              description: 'Nobody wins. The vehicle can be auctioned again later.' })}><Ban size={15} /> Cancel</button>
          </div>
        )}

        <div className="adm-card">
          <h4>Bids ({bids.data?.total ?? 0})</h4>
          <ErrorBox message={bids.error} />
          {bids.data && (bids.data.items.length === 0 ? <p className="adm-muted">No bids yet.</p> : (
            <AdmTable className="compact">
                <thead><tr><th>Amount</th><th>Rate</th><th>Bidder</th><th>Time</th></tr></thead>
                <tbody>
                  {bids.data.items.map((b) => {
                    const top = b.amount === (b.rc_option === 'without_rc' ? a.current_price_without_rc : a.current_price);
                    return (
                    <tr key={b.id} className={top ? 'highlight' : ''}>
                      <td><strong>{money(b.amount)}</strong>{top && <> <Badge value="live" label="highest" /></>}</td>
                      <td>{b.rc_option === 'without_rc' ? 'Without RC' : 'With RC'}</td>
                      <td>{b.bidder_name}<div className="adm-muted small">{b.bidder_email}</div></td>
                      <td>{dateTime(b.created_at)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </AdmTable>
          ))}
        </div>

        <div className="adm-card">
          <h4>History</h4>
          <ul className="adm-timeline">
            {a.history.map((h, i) => (
              <li key={i}>
                <Clock size={13} /> <strong>{h.action.replace('auction.', '').replace('_', ' ')}</strong>
                <span className="adm-muted small">{h.actor_role} · {dateTime(h.created_at)}</span>
                {h.details?.reason && <span>“{h.details.reason}”</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {dialog && <ActionDialog {...dialog} onClose={() => setDialog(null)} />}
    </Modal>
  );
}
