// Email first, mobile before bidding: sign-up always finishes with the emailed code, and when bidding
// needs a verified mobile (site-config mobile_otp) the auction page asks for it before showing the bid form.
import { test, expect } from '@playwright/test';
import { mockApi, open, USERS } from './helpers/mockApi';

const AID = '42424242-4242-4242-8242-424242424242';
const auction = () => ({
  id: AID, phase: 'live', result: null, current_price: null, bid_count: 0,
  current_price_without_rc: null, bid_count_without_rc: 0,
  starts_at: new Date(Date.now() - 3600000).toISOString(), ends_at: new Date(Date.now() + 86400000).toISOString(),
  extension_enabled: true, extension_minutes: 2, server_time: new Date().toISOString(),
  vehicle: {
    id: '43434343-4343-4343-8343-434343434343', category: 'insurance', listing_type: 'auction', km_driven: null, superdari: null,
    sold_at: null, make: 'Maruti Suzuki', model: 'Swift', variant: 'VXi', manufacturing_year: 2019, registration_year: 2019,
    fuel_type: 'petrol', transmission: 'manual', number_of_owners: 1, damage_type: 'accident', damage_other: null,
    location: 'Kochi Yard', rc_status: 'available', registration_type: 'private', hypothecation_status: 'not_hypothecated',
    registration_masked: 'KL04**0104', photo_ids: [], auction: null, sold: false,
  },
});

for (const mobileOtp of [false, true]) {
  test(`sign-up asks for the EMAIL code (mobile verification ${mobileOtp ? 'on' : 'off'})`, async ({ page }) => {
    const api = await mockApi(page);
    api.override('GET /api/site-config', () => api.json(200, { online_payment: false, seller_accounts: false, mobile_otp: mobileOtp }));
    await open(page, '/register');
    await expect(page.getByText(/email you a code/i)).toBeVisible();
    await expect(page.getByText(/by SMS/i)).toHaveCount(0);

    await open(page, '/verify-email');
    await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();
    await page.fill('#verify-email', 'priya@example.com');
    await page.fill('#verify-code', '123456');
    await page.locator('form button[type="submit"]').click();
    await expect.poll(() => api.callsTo('POST', '/api/auth/verify-email').length).toBe(1);
    expect(api.callsTo('POST', '/api/auth/verify-mobile')).toHaveLength(0);
  });
}

test('with mobile verification on, an unverified mobile sees "Verify your mobile number to bid" instead of the bid form', async ({ page }) => {
  const api = await mockApi(page);
  api.override('GET /api/site-config', () => api.json(200, { online_payment: false, seller_accounts: false, mobile_otp: true }));
  api.override(`GET /api/auctions/${AID}`, () => api.json(200, auction()));
  api.override(`GET /api/auctions/${AID}/bids`, () => api.json(200, { items: [], total: 0, page: 1, page_size: 20 }));
  api.signIn({ ...USERS.bidder, kyc_status: 'verified', is_mobile_verified: false });
  await open(page, `/auctions/${AID}`);
  await expect(page.getByText('Verify your mobile number to bid')).toBeVisible();
  await expect(page.getByRole('link', { name: /Verify mobile/ })).toHaveAttribute('href', '/dashboard');
  await expect(page.getByRole('button', { name: /Place .* bid/ })).toHaveCount(0);
});

test('with mobile verification on and the mobile verified, the bid form is shown', async ({ page }) => {
  const api = await mockApi(page);
  api.override('GET /api/site-config', () => api.json(200, { online_payment: false, seller_accounts: false, mobile_otp: true }));
  api.override(`GET /api/auctions/${AID}`, () => api.json(200, auction()));
  api.override(`GET /api/auctions/${AID}/bids`, () => api.json(200, { items: [], total: 0, page: 1, page_size: 20 }));
  api.signIn({ ...USERS.bidder, kyc_status: 'verified', is_mobile_verified: true });
  await open(page, `/auctions/${AID}`);
  await expect(page.getByRole('button', { name: 'Place With RC bid' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place Without RC bid' })).toBeVisible();
});

test('with mobile verification off, the bid form is shown without a verified mobile', async ({ page }) => {
  const api = await mockApi(page);
  api.override('GET /api/site-config', () => api.json(200, { online_payment: false, seller_accounts: false, mobile_otp: false }));
  api.override(`GET /api/auctions/${AID}`, () => api.json(200, auction()));
  api.override(`GET /api/auctions/${AID}/bids`, () => api.json(200, { items: [], total: 0, page: 1, page_size: 20 }));
  api.signIn({ ...USERS.bidder, kyc_status: 'verified', is_mobile_verified: false });
  await open(page, `/auctions/${AID}`);
  await expect(page.getByRole('button', { name: 'Place With RC bid' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place Without RC bid' })).toBeVisible();
  await expect(page.getByText('Verify your mobile number to bid')).toHaveCount(0);
});
