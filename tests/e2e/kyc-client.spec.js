// KYC as the client wants it: Aadhaar number + Aadhaar copy and PAN card before submitting.
// (The cancelled cheque was required until 2026-11-26, when the client dropped it.)
import { test, expect } from '@playwright/test';
import { mockApi, open, USERS } from './helpers/mockApi';

const SID = '12121212-1212-4212-8212-121212121212';
const sub = (over = {}) => ({
  id: SID, status: 'draft', created_at: '2026-10-25T05:00:00Z', submitted_at: null, decided_at: null,
  documents: [], decisions: [], aadhaar_masked: null, aadhaar_number_needed: true,
  required_documents: ['aadhaar_card', 'pan_card'], all_required_documents: ['aadhaar_card', 'pan_card'], ...over,
});

test('the checklist shows what is still needed and the Aadhaar number is saved masked', async ({ page }) => {
  const api = await mockApi(page);
  api.signIn(USERS.bidder);
  let current = sub({
    documents: [{ id: 'd1', document_type: 'aadhaar_card', content_type: 'image/jpeg', size_bytes: 20000, uploaded_at: '2026-10-25T05:01:00Z', withdrawn_at: null }],
    required_documents: ['pan_card'],
  });
  api.override('GET /api/kyc/me', () => api.json(200, { kyc_status: 'pending', submission: current }));
  api.override(`PUT /api/kyc/submissions/${SID}/aadhaar`, ({ body }) => {
    current = { ...current, aadhaar_masked: `XXXX XXXX ${body.aadhaar_number.slice(-4)}`, aadhaar_number_needed: false };
    return api.json(200, current);
  });

  await open(page, '/dashboard?tab=documents');
  const list = page.locator('.kyc-required-list');
  await expect(list.locator('li.done')).toHaveCount(1);                                       // Aadhaar card uploaded
  await expect(list).toContainText('PAN card');
  await expect(list).not.toContainText('Cancelled cheque');                                   // dropped on 2026-11-26
  const bar = page.locator('.kyc-submit-bar');
  await expect(bar).toContainText('2 things are still missing');
  await expect(bar.locator('.kyc-blocked li')).toHaveText([/Your Aadhaar number/, /PAN card/]);
  await expect(page.getByRole('button', { name: 'Submit for review' })).toBeDisabled();

  const input = page.getByLabel('Aadhaar number');
  await input.fill('2345 6789 0124');
  await expect(input).toHaveValue('2345 6789 0124');
  await page.locator('.kyc-aadhaar').getByRole('button', { name: 'Save' }).click();
  await expect(list.locator('li').first()).toContainText('XXXX XXXX 0124');
  expect(api.callsTo('PUT', `/api/kyc/submissions/${SID}/aadhaar`)[0].body).toEqual({ aadhaar_number: '234567890124' });
  await expect(bar).toContainText('1 thing is still missing');
  await expect(bar.locator('.kyc-blocked li')).toHaveText([/PAN card/]);
});
