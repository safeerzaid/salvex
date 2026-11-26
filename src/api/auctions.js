// Public auctions and bidding (backend/app/api/auctions.py).
import { apiRequest } from './client';

export const listAuctions = (phase = 'live', page = 1, pageSize = 24, category = null) =>
  apiRequest(`/api/auctions?phase=${phase}&page=${page}&page_size=${pageSize}${category ? `&category=${category}` : ''}`,
    { notifyUnauthorized: false });

// Auction categories. The address uses dashes (?category=bank-nbfc); the API uses underscores.
export const CATEGORIES = [
  { slug: 'insurance', value: 'insurance', label: 'Insurance' },
  { slug: 'bank-nbfc', value: 'bank_nbfc', label: 'Bank / NBFC' },
  { slug: 'used-vehicle', value: 'used_vehicle', label: 'Used vehicle' },
];
export const categoryFromSlug = (slug) => CATEGORIES.find((c) => c.slug === slug) || null;
export const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label || '';
export const getAuction = (id) => apiRequest(`/api/auctions/${id}`, { notifyUnauthorized: false });
export const getBidHistory = (id) => apiRequest(`/api/auctions/${id}/bids?page_size=20`, { notifyUnauthorized: false });
export const listMyBids = (page = 1) => apiRequest(`/api/bids/mine?page=${page}&page_size=50`);

/** One click = one bid: the same key is reused if the request has to be retried. */
/** rcOption is 'with_rc' or 'without_rc': every auction runs both ladders (client, 2026-11-26). */
export function placeBid(id, amount, idempotencyKey, rcOption = 'with_rc') {
  return apiRequest(`/api/auctions/${id}/bids`, {
    method: 'POST',
    body: { amount: String(amount), terms_accepted: true, rc_option: rcOption },
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

export function newIdempotencyKey() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID().replace(/-/g, '');
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
