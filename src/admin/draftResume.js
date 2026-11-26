// Adding a vehicle saves it as a draft after the first step. If the window is closed before it is published and
// the admin starts again with the same registration number, continue that draft instead of failing with
// "already listed".
import { listVehicles } from '../api/admin';
import { createVehicle, updateVehicle } from '../api/vehicles';

const norm = (text) => (text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const UNFINISHED = ['draft', 'changes_requested'];

/** Create the vehicle, or update the unfinished draft with the same registration number. */
export async function createOrResumeDraft(body) {
  try {
    return { vehicle: await createVehicle(body), resumed: false };
  } catch (err) {
    if (err.code !== 'registration_exists') throw err;
    const reg = norm(body.registration_number);
    const found = await listVehicles({ q: reg, page_size: 50 });
    const same = found.items.filter((v) => norm(v.registration_number) === reg);
    const draft = same.find((v) => UNFINISHED.includes(v.status));
    if (!draft) {
      // A vehicle is added once and can then be auctioned as many times as needed (client, 2026-11-26),
      // so this is not a dead end: say where it is and that a new auction is started from there.
      const existing = same[0];
      const where = existing?.listing_type === 'ready_to_lift' ? 'Ready to Lift' : 'Auctions';
      throw Object.assign(
        new Error(`${reg} is already on the site, so it does not need adding again. Open it under ${where} `
          + 'and create a new auction for it: a vehicle can go to auction any number of times once its '
          + 'last auction has finished.'),
        { code: err.code, existingVehicle: existing },
      );
    }
    return { vehicle: await updateVehicle(draft.id, body), resumed: true };
  }
}
