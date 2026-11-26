// Calls to the KYC endpoints (see backend/app/api/kyc.py).
import { apiRequest, apiUrl } from './client';

// The documents our team checks - both are needed - plus "other" for anything extra they ask for.
// The client dropped the cancelled cheque on 2026-11-26; it is only a label now, for older submissions.
export const DOCUMENT_TYPES = [
  { value: 'aadhaar_card', label: 'Aadhaar card', hint: 'Front and back of your Aadhaar card (you may cover the first 8 digits).' },
  { value: 'pan_card', label: 'PAN card', hint: 'Your PAN card.' },
  { value: 'other', label: 'Other document', hint: 'Anything else our team asked you for.' },
];

// Every document type the backend accepts (backend/app/schemas/kyc.py DocumentType), with a label and a
// hint. The upload form is built from the list the server says is required, so a type the company turns on
// in KYC_REQUIRED_DOCUMENTS can always be uploaded here and never blocks "Submit for review" for good.
export const ALL_DOCUMENT_TYPES = [
  ...DOCUMENT_TYPES.filter((t) => t.value !== 'other'),
  { value: 'cancelled_cheque', label: 'Cancelled cheque', hint: 'A cheque from your own bank account with "CANCELLED" written across it.' },
  { value: 'identity_proof', label: 'Identity proof', hint: 'Passport, driving licence or voter ID.' },
  { value: 'address_proof', label: 'Address proof', hint: 'A recent utility bill, rent agreement or bank statement showing your address.' },
  { value: 'business_proof', label: 'Business proof', hint: 'GST certificate, Udyam certificate or trade licence.' },
  { value: 'other', label: 'Other document', hint: 'Anything else our team asked you for.' },
];

// Labels for every type, including ones used before (shown on older submissions).
export const DOCUMENT_LABELS = Object.fromEntries(ALL_DOCUMENT_TYPES.map((t) => [t.value, t.label]));

/**
 * The document types to show on a submission: the ones the server requires (so the list can never fall
 * behind the backend's KYC_REQUIRED_DOCUMENTS setting), plus "other" for anything our team asks for extra.
 * Falls back to DOCUMENT_TYPES when the server has not told us, e.g. before the submission is loaded.
 */
export function documentTypesFor(submission) {
  const required = submission?.all_required_documents;
  if (!Array.isArray(required) || required.length === 0) return DOCUMENT_TYPES;
  const known = new Map(ALL_DOCUMENT_TYPES.map((t) => [t.value, t]));
  const list = required.filter((v) => v !== 'other')
    .map((v) => known.get(v) || { value: v, label: humaniseType(v), hint: 'Our team asked for this document.' });
  return [...list, known.get('other')];
}

function humaniseType(value) {
  return String(value).replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

export const typeLabel = (value) => DOCUMENT_LABELS[value] || humaniseType(value);

export function setAadhaar(submissionId, aadhaarNumber) {
  return apiRequest(`/api/kyc/submissions/${submissionId}/aadhaar`, { method: 'PUT', body: { aadhaar_number: aadhaarNumber } });
}

export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function getMyKyc() {
  return apiRequest('/api/kyc/me');
}

export function startSubmission() {
  return apiRequest('/api/kyc/submissions', { method: 'POST' });
}

export function uploadDocument(submissionId, documentType, file) {
  const query = new URLSearchParams({ document_type: documentType });
  return apiRequest(`/api/kyc/submissions/${submissionId}/documents?${query}`, { method: 'POST', file });
}

export function withdrawDocument(documentId) {
  return apiRequest(`/api/kyc/documents/${documentId}`, { method: 'DELETE' });
}

export function submitForReview(submissionId) {
  return apiRequest(`/api/kyc/submissions/${submissionId}/submit`, { method: 'POST' });
}

export function documentUrl(documentId) {
  return apiUrl(`/api/kyc/documents/${documentId}/file`);
}
