// KYC -> admin approval -> admin creates a vehicle and auction -> buyers bid. Real backend, local database.
import { test, expect } from '@playwright/test';
import { db, go, clickFor, registerBuyer, signIn, ADMIN, fakeAadhaar, choose, PNG, PDF } from './helpers';

test.skip(!ADMIN.email || !ADMIN.password, 'set SALVEX_REAL_ADMIN_EMAIL and SALVEX_REAL_ADMIN_PASSWORD (a local verification admin)');

const REG = `KL${String(Date.now()).slice(-2)}RV${String(Date.now()).slice(-4)}`;
let buyerA, buyerB, auctionId;
const userRow = (email) => db('select id, kyc_status from users where email = %s', email)[0];

async function uploadDoc(page, label, file) {
  const form = page.locator('form.kyc-upload');
  await choose(page, form.locator('.kyc-field', { hasText: 'Document type' }), label);
  await form.locator('input[type="file"]').setInputFiles(file);
  return clickFor(page, form.getByRole('button', { name: /^Upload/ }), 'POST', '/documents');
}

async function submitKyc(page, buyer) {
  await go(page, '/dashboard?tab=documents');
  const started = await clickFor(page, page.getByRole('button', { name: 'Start verification' }), 'POST', '/api/kyc/submissions');
  expect(started.status).toBe(201);
  expect(db("select s.status from kyc_submissions s join users u on u.id = s.user_id where u.email = %s", buyer.email)[0].status).toBe('draft');
  const bad = await uploadDoc(page, 'PAN card', { name: 'pan.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('this is not an image') });
  expect(bad.status).toBe(415);                                                 // content checked, not the name (415 = wrong file type)
  await expect(page.locator('[role="alert"]').first()).toBeVisible();
  for (const [label, file] of [
    ['Aadhaar card', { name: 'aadhaar.png', mimeType: 'image/png', buffer: PNG }],
    ['PAN card', { name: 'pan.pdf', mimeType: 'application/pdf', buffer: PDF }],
  ]) expect((await uploadDoc(page, label, file)).status).toBe(201);

  const aadhaar = fakeAadhaar();
  await page.getByLabel('Aadhaar number').fill(aadhaar);
  expect((await clickFor(page, page.locator('.kyc-aadhaar').getByRole('button', { name: 'Save' }), 'PUT', '/aadhaar')).status).toBe(200);
  await expect(page.locator('.kyc-required-list')).toContainText(`XXXX XXXX ${aadhaar.slice(-4)}`);
  expect((await clickFor(page, page.getByRole('button', { name: 'Submit for review' }), 'POST', '/submit')).status).toBe(200);

  const sub = db(`select s.status, s.aadhaar_last4, (select count(*)::int from kyc_documents d where d.submission_id = s.id and d.withdrawn_at is null) docs
                  from kyc_submissions s join users u on u.id = s.user_id where u.email = %s order by s.created_at desc limit 1`, buyer.email)[0];
  expect(sub).toMatchObject({ status: 'submitted', aadhaar_last4: aadhaar.slice(-4), docs: 3 });
  const full = db("select count(*)::int n from kyc_submissions s join users u on u.id = s.user_id where u.email = %s and s.aadhaar_hash is not null", buyer.email)[0].n;
  expect(full).toBe(1);                                                          // only a hash + last 4 digits are stored
  await page.reload();
  await expect(page.getByText(/under review|submitted/i).first()).toBeVisible();
}

async function approveKyc(page, buyer) {
  await signIn(page, ADMIN.email, ADMIN.password);
  await go(page, '/admin?tab=kyc');
  const row = page.locator('tr', { hasText: buyer.email });
  await row.getByRole('button', { name: 'Open' }).click();
  const docLink = page.locator('a[href*="/api/kyc/documents/"]').first();
  const doc = await page.request.get(await docLink.getAttribute('href'));
  expect(doc.status()).toBe(200);                                                // admin can open the stored file
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Approve KYC' });
  const res = await clickFor(page, dialog.getByRole('button', { name: 'Approve' }), 'POST', '/decision');
  expect(res.status).toBe(200);
  expect(userRow(buyer.email).kyc_status).toBe('verified');
  expect(db("select decision from kyc_decisions d join kyc_submissions s on s.id = d.submission_id join users u on u.id = s.user_id where u.email = %s order by d.created_at desc limit 1", buyer.email)[0].decision).toBe('approved');
}

test.describe.serial('KYC, auction and bidding (real backend)', () => {
  test('buyer A: KYC upload (bad file refused), Aadhaar saved masked, submitted for review', async ({ page }) => {
    buyerA = await registerBuyer(page, 'buyerA');
    await submitKyc(page, buyerA);
  });

  test('another buyer cannot download buyer A\'s KYC document', async ({ page }) => {
    const docId = db("select d.id from kyc_documents d join kyc_submissions s on s.id = d.submission_id join users u on u.id = s.user_id where u.email = %s limit 1", buyerA.email)[0].id;
    buyerB = await registerBuyer(page, 'buyerB');
    const res = await page.request.get(`/api/kyc/documents/${docId}/file`);
    expect([403, 404]).toContain(res.status());
  });

  test('admin: opens the submission, the document downloads, approval is stored', async ({ page }) => {
    await approveKyc(page, buyerA);
  });

  test('admin: new vehicle with a photo and an auction starting in about a minute', async ({ page }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
    await go(page, '/admin?tab=auctions');
    await page.getByRole('button', { name: 'New auction' }).click();
    const modal = page.getByRole('dialog', { name: 'New auction' });
    const fill = async (label, value) => modal.locator('.vf-field', { hasText: label }).locator('input').first().fill(value);
    const pick = async (label, option) => choose(page, modal.locator('.vf-field', { hasText: label }), option);
    await fill('Registration number', REG);
    await fill('Claim number', `CLM-${REG}`);
    await fill('Make', 'Maruti Suzuki');
    await fill('Model', 'Swift');
    await fill('Variant', 'VXi');
    await fill('Manufacturing year', '2019');
    await fill('Registration year', '2019');
    await pick('Fuel type', 'Petrol');
    await pick('Transmission', 'Manual');
    await fill('Number of owners', '1');
    await pick('Damage type', 'Accident');
    await fill('Vehicle location', 'Kochi Yard');
    await pick('RC status', 'RC available');
    await pick('Registration type', 'Private');
    await pick('Hypothecation status', 'Not hypothecated');
    await pick('Auction category', 'Insurance');
    const created = await clickFor(page, modal.getByRole('button', { name: 'Continue to photos' }), 'POST', '/api/vehicles');
    expect(created.status).toBe(201);

    await modal.getByLabel('Add photos', { exact: true }).setInputFiles({ name: 'front.png', mimeType: 'image/png', buffer: PNG });
    const crop = page.getByRole('dialog', { name: /Crop photo/ });
    const photo = await clickFor(page, crop.getByRole('button', { name: 'Crop and use' }), 'POST', '/photos');
    expect(photo.status).toBe(201);
    await modal.getByRole('button', { name: 'Confirm vehicle' }).click();
    await expect(modal.locator('.adm-steps li.current')).toContainText('Auction settings');

    // start about 1-2 minutes from now (handles midnight: the date is picked explicitly)
    const start = new Date(Date.now() + 100000); start.setSeconds(0, 0); start.setMinutes(start.getMinutes() + 1);
    await modal.getByRole('button', { name: 'Starts' }).click();
    const picker = page.getByRole('dialog', { name: 'Choose date and time' });
    const iso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    if (start.getMonth() !== new Date().getMonth()) await picker.getByRole('button', { name: 'Next month' }).click();
    await picker.locator(`[data-date="${iso}"]`).click();
    await picker.getByRole('button', { name: start.getHours() < 12 ? 'AM' : 'PM', exact: true }).click();
    await picker.getByLabel('Hour', { exact: true }).fill(String(start.getHours() % 12 || 12).padStart(2, '0'));
    await picker.getByLabel('Minutes', { exact: true }).fill(String(start.getMinutes()).padStart(2, '0'));
    await picker.getByRole('button', { name: 'Done' }).click();
    await modal.locator('.adm-field', { hasText: 'Starting price' }).locator('input').fill('50000');
    const auction = await clickFor(page, modal.getByRole('button', { name: 'Create auction' }), 'POST', '/api/admin/auctions');
    expect(auction.status).toBe(201);
    auctionId = auction.body.id;

    const row = db(`select a.status, a.starting_price::text, a.starts_at, v.registration_number, v.status vstatus,
                    (select count(*)::int from vehicle_photos p where p.vehicle_id = v.id) photos
                    from auctions a join vehicles v on v.id = a.vehicle_id where a.id = %s`, auctionId)[0];
    test.info().annotations.push({ type: 'db', description: JSON.stringify(row) });
    expect(row).toMatchObject({ registration_number: REG, starting_price: '50000.00', photos: 1 });
    expect(Math.abs(new Date(row.starts_at) - start)).toBeLessThan(60000);
  });

  test('the auction goes live on its own and appears on the public site with its photo', async ({ page }) => {
    test.setTimeout(420000);                       // waits up to ~4 minutes for the scheduled start
    await expect.poll(async () => (await (await page.request.get(`/api/auctions/${auctionId}`)).json()).phase,
      { timeout: 240000, intervals: [5000] }).toBe('live');
    await go(page, '/auctions/live');
    await expect(page.getByText('Maruti Suzuki Swift').first()).toBeVisible();
    await go(page, `/auctions/${auctionId}`);
    await expect(page.getByRole('link', { name: /Sign in to bid/ })).toBeVisible();     // anonymous visitor
    const img = page.locator('img[src*="/api/"]').first();
    await expect(img).toBeVisible();
    expect(await img.evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
  });

  test('buyer B (KYC not approved) cannot bid, in the page or through the API', async ({ page }) => {
    await signIn(page, buyerB.email, buyerB.password);
    await go(page, `/auctions/${auctionId}`);
    await expect(page.getByText('Verify your identity to bid')).toBeVisible();
    const csrf = (await (await page.request.get('/api/auth/me')).json()).csrf_token;
    const res = await page.request.post(`/api/auctions/${auctionId}/bids`, { data: { amount: '60000', terms_accepted: true }, headers: { 'X-CSRF-Token': csrf } });
    expect(res.status()).toBe(403);
    expect(db('select count(*)::int n from auction_bids where auction_id = %s', auctionId)[0].n).toBe(0);
  });

  test('buyer A bids: under the hidden starting price is refused, a valid bid is stored and survives a reload', async ({ page }) => {
    await signIn(page, buyerA.email, buyerA.password);
    await go(page, `/auctions/${auctionId}`);
    // Every auction runs both ladders (client, 2026-11-26) and the expected amount is admin-only:
    // with no bids each ladder shows "Bidding open" and no figure.
    const withRc = page.locator('.pub-ladder').filter({ hasText: 'With RC' }).first();
    await expect(page.locator('.pub-ladders')).toContainText('Without RC');
    await expect(withRc.locator('.pub-ladder-figure')).toContainText('Bidding open');
    await expect(withRc.locator('.pub-ladder-figure')).not.toContainText('50,000');

    const box = withRc.locator('input[type="number"]');
    const confirmBid = async (amount) => {
      await box.fill(amount);
      await withRc.getByRole('button', { name: 'Place With RC bid' }).click();
      const dialog = page.getByRole('dialog', { name: 'Confirm your bid' });
      await dialog.locator('input[type="checkbox"]').check();
      return clickFor(page, dialog.getByRole('button', { name: /Confirm bid/ }), 'POST', `/api/auctions/${auctionId}/bids`);
    };

    // Below the starting price: the client cannot know, so the server refuses and the page shows a dialog.
    expect((await confirmBid('40000')).status).toBe(409);
    const alert = page.getByRole('alertdialog', { name: 'Bid too low' });
    await expect(alert).toContainText('Your bid is lower than the expected price. Kindly increase your bid.');
    await expect(alert).not.toContainText('50,000');                       // the amount is never given away
    await alert.getByRole('button', { name: 'Try a higher bid' }).click();
    expect(db('select count(*)::int n from auction_bids where auction_id = %s', auctionId)[0].n).toBe(0);

    await box.fill('51000');
    await withRc.getByRole('button', { name: 'Place With RC bid' }).click();
    const confirm = page.getByRole('dialog', { name: 'Confirm your bid' });
    await expect(confirm.getByRole('button', { name: /Confirm bid/ })).toBeDisabled();   // terms must be accepted
    await confirm.locator('input[type="checkbox"]').check();
    const bid = await clickFor(page, confirm.getByRole('button', { name: /Confirm bid/ }), 'POST', `/api/auctions/${auctionId}/bids`);
    expect(bid.status).toBe(201);
    const a = db('select current_price::text, (select count(*)::int from auction_bids b where b.auction_id = a.id) bids from auctions a where id = %s', auctionId)[0];
    expect(a).toEqual({ current_price: '51000.00', bids: 1 });
    await page.reload();
    await expect(page.getByText('You are the highest bidder.')).toBeVisible();
  });

  test('a bid equal to the current price is refused by the server', async ({ page }) => {
    await signIn(page, buyerB.email, buyerB.password);
    await submitKyc(page, buyerB);
    await approveKyc(page, buyerB);
    await signIn(page, buyerB.email, buyerB.password);
    const csrf = (await (await page.request.get('/api/auth/me')).json()).csrf_token;
    const res = await page.request.post(`/api/auctions/${auctionId}/bids`, { data: { amount: '51000', terms_accepted: true }, headers: { 'X-CSRF-Token': csrf } });
    expect(res.status()).toBe(409);
    expect(db('select current_price::text from auctions where id = %s', auctionId)[0].current_price).toBe('51000.00');
  });

  test('buyer B outbids through the page; buyer A, watching, gets the outbid dialog', async ({ page, browser }) => {
    // Buyer A is on the auction page and leading BEFORE B bids, so the page itself can tell them.
    const ctx = await browser.newContext();
    const a = await ctx.newPage();
    await signIn(a, buyerA.email, buyerA.password);
    await go(a, `/auctions/${auctionId}`);
    await expect(a.getByText('You are the highest bidder (With RC).')).toBeVisible();

    await signIn(page, buyerB.email, buyerB.password);
    await go(page, `/auctions/${auctionId}`);
    const bWithRc = page.locator('.pub-ladder').filter({ hasText: 'With RC' }).first();
    await bWithRc.locator('input[type="number"]').fill('52500');
    await bWithRc.getByRole('button', { name: 'Place With RC bid' }).click();
    const confirm = page.getByRole('dialog', { name: 'Confirm your bid' });
    await confirm.locator('input[type="checkbox"]').check();
    expect((await clickFor(page, confirm.getByRole('button', { name: /Confirm bid/ }), 'POST', '/bids')).status).toBe(201);
    expect(db('select current_price::text from auctions where id = %s', auctionId)[0].current_price).toBe('52500.00');

    // A's page polls every 3s; the dialog appears on its own, without a reload.
    const alert = a.getByRole('alertdialog', { name: 'You have been outbid (With RC)' });
    await expect(alert).toBeVisible({ timeout: 15000 });
    await expect(alert).toContainText('Your bid is lower than the expected price. Kindly increase your bid.');
    await alert.getByRole('button', { name: 'Place a higher bid' }).click();
    await expect(a.getByText('You are the highest bidder (With RC).')).toHaveCount(0);
    await expect(a.locator('.pub-ladder input[type="number"]')).toHaveCount(2);   // both ladders open
    const notes = db("select kind from notifications n join users u on u.id = n.user_id where u.email = %s order by n.created_at desc", buyerA.email).map((r) => r.kind);
    test.info().annotations.push({ type: 'db notifications for A', description: notes.join(', ') });
    expect(notes).toContain('outbid');                                         // buyer A was told in the notification list
    await ctx.close();
  });
});
