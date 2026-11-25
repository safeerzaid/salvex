import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Download, FileText, Loader2, RotateCcw, Send, ShieldCheck, Trash2, Upload,
} from 'lucide-react';
import {
  ACCEPTED_TYPES, DOCUMENT_TYPES, MAX_FILE_BYTES, documentTypesFor, documentUrl, getMyKyc, setAadhaar,
  startSubmission, submitForReview, typeLabel, uploadDocument, withdrawDocument,
} from '../api/kyc';
import { useAuth } from '../auth/useAuth';
import './KycPanel.css';
import Select from './ui/Select';

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fileProblem(file) {
  if (!file) return 'Choose a file first.';
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Only PDF, JPEG and PNG files are accepted.';
  if (file.size > MAX_FILE_BYTES) return 'The file is too large (at most 5 MB).';
  if (file.size === 0) return 'The file is empty.';
  return null;
}

/** The signed-in user's KYC: status, document upload, submission for review. All data comes from the server. */
export default function KycPanel() {
  const { refresh } = useAuth();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [busy, setBusy] = useState(null);           // 'start' | 'upload' | 'submit' | document id
  const [message, setMessage] = useState(null);     // { kind: 'error' | 'success', text }
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0].value);
  const [file, setFile] = useState(null);
  const fileInput = useRef(null);

  // The upload form follows the document types the server says are required, so it can never fall behind
  // the backend's KYC_REQUIRED_DOCUMENTS setting and leave a required type with no way to upload it (which
  // would keep "Submit for review" disabled for ever).
  const docTypes = documentTypesFor(state.data?.submission);
  const docTypeKey = docTypes.map((t) => t.value).join(',');
  useEffect(() => {
    const values = docTypeKey.split(',');
    setDocType((current) => (values.includes(current) ? current : values[0]));
  }, [docTypeKey]);

  const load = useCallback(async () => {
    try {
      const data = await getMyKyc();
      setState({ loading: false, data, error: null });
    } catch (err) {
      setState({ loading: false, data: null, error: err.message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (key, action, success) => {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ kind: 'success', text: success });
      await load();
      return true;
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
      return false;
    } finally {
      setBusy(null);
    }
  };

  if (state.loading) {
    return <div className="kyc-panel kyc-loading"><Loader2 size={18} className="kyc-spin" /> Loading your verification…</div>;
  }
  if (state.error) {
    return (
      <div className="kyc-panel">
        <div className="kyc-alert kyc-alert-error">
          <AlertTriangle size={18} /> <span>{state.error}</span>
          <button type="button" className="kyc-link-btn" onClick={() => { setState({ loading: true }); load(); }}>Try again</button>
        </div>
      </div>
    );
  }

  const { kyc_status: kycStatus, submission } = state.data;
  const documents = submission?.documents || [];
  const activeDocs = documents.filter((d) => !d.withdrawn_at);
  const lastDecision = submission?.decisions?.[submission.decisions.length - 1];
  const editable = submission && ['draft', 'changes_requested'].includes(submission.status);
  const canStart = kycStatus !== 'verified' && (!submission || submission.status === 'rejected');
  const missing = submission?.required_documents || [];
  const needsAadhaar = Boolean(submission?.aadhaar_number_needed);
  const ready = activeDocs.length > 0 && missing.length === 0 && !needsAadhaar;
  const checklist = docTypes.filter((t) => t.value !== 'other');
  const blockers = [
    ...(needsAadhaar ? ['Your Aadhaar number — enter it under "What we need" above.'] : []),
    ...missing.map((m) => `${typeLabel(m)} — upload it under "Add a document" above.`),
    ...(activeDocs.length === 0 && missing.length === 0 ? ['At least one document.'] : []),
  ];

  const handleUpload = async (event) => {
    event.preventDefault();
    const problem = fileProblem(file);
    if (problem) { setMessage({ kind: 'error', text: problem }); return; }
    const ok = await run('upload', () => uploadDocument(submission.id, docType, file), 'Document uploaded.');
    if (ok) {
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleWithdraw = (doc) => {
    if (!window.confirm(`Remove "${typeLabel(doc.document_type)}" from your submission?`)) return;
    run(doc.id, () => withdrawDocument(doc.id), 'Document removed from your submission.');
  };

  const handleSubmit = async () => {
    const ok = await run('submit', () => submitForReview(submission.id), 'Sent for review. We will update this page when our team has checked your documents.');
    if (ok) refresh();                   // the account's KYC status may have changed (e.g. rejected -> pending)
  };

  return (
    <div className="kyc-panel">
      <StatusCard kycStatus={kycStatus} submission={submission} />

      {message && (
        <div className={`kyc-alert kyc-alert-${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
          {message.kind === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {submission?.status === 'changes_requested' && lastDecision && (
        <div className="kyc-alert kyc-alert-warning">
          <RotateCcw size={18} />
          <div>
            <strong>Our team asked for changes:</strong>
            <p>{lastDecision.reason}</p>
          </div>
        </div>
      )}

      {submission?.status === 'rejected' && lastDecision && (
        <div className="kyc-alert kyc-alert-error">
          <AlertTriangle size={18} />
          <div>
            <strong>Your last verification was not approved:</strong>
            <p>{lastDecision.reason}</p>
          </div>
        </div>
      )}

      {canStart && (
        <div className="kyc-card kyc-start">
          <h3>{submission ? 'Start a new verification' : 'Verify your identity to start bidding'}</h3>
          <p>Upload clear copies of your documents. Accepted: PDF, JPEG or PNG, up to 5 MB each.</p>
          <ul className="kyc-checklist">
            {DOCUMENT_TYPES.map((t) => <li key={t.value}><strong>{t.label}:</strong> {t.hint}</li>)}
          </ul>
          <button type="button" className="salvex-btn salvex-btn-primary" disabled={busy === 'start'}
            onClick={() => run('start', startSubmission)}>
            {busy === 'start' ? <Loader2 size={16} className="kyc-spin" /> : <ShieldCheck size={16} />}
            <span>{submission ? 'Start again' : 'Start verification'}</span>
          </button>
        </div>
      )}

      {editable && (
        <div className="kyc-card kyc-required">
          <h3>What we need</h3>
          <ul className="kyc-required-list">
            <li className={needsAadhaar ? '' : 'done'}>
              {needsAadhaar ? <Clock size={16} /> : <CheckCircle2 size={16} />}
              <span><strong>Aadhaar number</strong>{submission.aadhaar_masked ? ` · ${submission.aadhaar_masked}` : ''}</span>
            </li>
            {checklist.map((t) => {
              const done = activeDocs.some((d) => d.document_type === t.value);
              return (
                <li key={t.value} className={done ? 'done' : ''}>
                  {done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  <span><strong>{t.label}</strong> · {t.hint}</span>
                </li>
              );
            })}
          </ul>
          <AadhaarForm submission={submission} busy={busy === 'aadhaar'}
            onSave={(number) => run('aadhaar', () => setAadhaar(submission.id, number), 'Aadhaar number saved. Only the last 4 digits are kept.')} />
        </div>
      )}

      {editable && (
        <form className="kyc-card kyc-upload" onSubmit={handleUpload}>
          <h3>Add a document</h3>
          <div className="kyc-upload-row">
            <label className="kyc-field">
              <span>Document type</span>
              <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                {docTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </label>
            <label className="kyc-field kyc-file-field">
              <span>File (PDF, JPEG or PNG, max 5 MB)</span>
              <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setMessage(null); }} />
            </label>
            <button type="submit" className="salvex-btn salvex-btn-primary" disabled={!file || busy === 'upload'}>
              {busy === 'upload' ? <Loader2 size={16} className="kyc-spin" /> : <Upload size={16} />}
              <span>{busy === 'upload' ? 'Uploading…' : 'Upload'}</span>
            </button>
          </div>
          <p className="kyc-hint">{docTypes.find((t) => t.value === docType)?.hint}</p>
        </form>
      )}

      {documents.length > 0 && (
        <div className="kyc-card">
          <h3>Your documents</h3>
          <ul className="kyc-doc-list">
            {documents.map((doc) => (
              <li key={doc.id} className={doc.withdrawn_at ? 'kyc-doc withdrawn' : 'kyc-doc'}>
                <FileText size={20} className="kyc-doc-icon" />
                <div className="kyc-doc-info">
                  <strong>{typeLabel(doc.document_type)}</strong>
                  <span>
                    {doc.content_type === 'application/pdf' ? 'PDF' : doc.content_type === 'image/png' ? 'PNG' : 'JPEG'}
                    {' · '}{formatSize(doc.size_bytes)}{' · '}uploaded {formatDate(doc.uploaded_at)}
                    {doc.withdrawn_at && ' · removed'}
                  </span>
                </div>
                <div className="kyc-doc-actions">
                  <a className="kyc-icon-btn" href={documentUrl(doc.id)} title="Download" aria-label="Download document">
                    <Download size={16} />
                  </a>
                  {editable && !doc.withdrawn_at && (
                    <button type="button" className="kyc-icon-btn danger" title="Remove" aria-label="Remove document"
                      disabled={busy === doc.id} onClick={() => handleWithdraw(doc)}>
                      {busy === doc.id ? <Loader2 size={16} className="kyc-spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editable && (
        <div className="kyc-submit-bar">
          {ready ? (
            <span className="kyc-submit-ready"><CheckCircle2 size={18} /> Everything is ready.</span>
          ) : (
            <div className="kyc-blocked" id="kyc-blockers" role="status">
              <AlertTriangle size={18} />
              <div>
                <strong>You cannot submit yet — {blockers.length === 1 ? '1 thing is' : `${blockers.length} things are`} still missing:</strong>
                <ul>{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
              </div>
            </div>
          )}
          <button type="button" className="salvex-btn salvex-btn-primary" disabled={!ready || busy === 'submit'}
            onClick={handleSubmit} aria-describedby={ready ? undefined : 'kyc-blockers'}
            title={ready ? undefined : `Still needed: ${blockers.join(' ')}`}>
            {busy === 'submit' ? <Loader2 size={16} className="kyc-spin" /> : <Send size={16} />}
            <span>{submission.status === 'changes_requested' ? 'Send again for review' : 'Submit for review'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function AadhaarForm({ submission, busy, onSave }) {
  const [value, setValue] = useState('');
  const digits = value.replace(/\D/g, '');
  const pretty = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  return (
    <form className="kyc-aadhaar" onSubmit={(e) => { e.preventDefault(); onSave(digits).then((ok) => ok && setValue('')); }}>
      <label className="kyc-field">
        <span>{submission.aadhaar_masked ? `Aadhaar number saved (${submission.aadhaar_masked}). Enter again to change it.` : 'Aadhaar number'}</span>
        <input inputMode="numeric" autoComplete="off" maxLength={14} placeholder="1234 5678 9012" value={pretty}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 12))} aria-label="Aadhaar number" />
      </label>
      <button type="submit" className="salvex-btn salvex-btn-primary" disabled={digits.length !== 12 || busy}>
        {busy ? <Loader2 size={16} className="kyc-spin" /> : <ShieldCheck size={16} />}
        <span>Save</span>
      </button>
      <p className="kyc-hint">We keep only the last 4 digits. The number is checked against your Aadhaar copy.</p>
    </form>
  );
}

function StatusCard({ kycStatus, submission }) {
  let tone = 'pending';
  let icon = <Clock size={26} />;
  let title = 'Not verified yet';
  let text = 'You need a verified identity before you can bid.';

  if (kycStatus === 'verified') {
    tone = 'verified'; icon = <ShieldCheck size={26} />;
    title = 'Identity verified'; text = 'You can bid on live auctions.';
  } else if (submission?.status === 'submitted') {
    title = 'Under review'; text = 'Our team is checking your documents. This page updates when they decide.';
  } else if (submission?.status === 'changes_requested') {
    tone = 'warning'; icon = <RotateCcw size={26} />;
    title = 'Changes requested'; text = 'Please update your documents as described below and send them again.';
  } else if (submission?.status === 'rejected') {
    tone = 'rejected'; icon = <AlertTriangle size={26} />;
    title = 'Not approved'; text = 'You can start a new verification with corrected documents.';
  } else if (submission?.status === 'draft') {
    title = 'Draft – not sent yet'; text = 'Add your documents, then submit them for review.';
  }

  return (
    <div className={`kyc-status-card tone-${tone}`}>
      <div className="kyc-status-icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}
