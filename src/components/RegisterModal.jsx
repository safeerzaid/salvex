import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Info
} from 'lucide-react';
import SalvexLogo from './SalvexLogo';

export default function RegisterModal({ isOpen, onClose }) {
  // Step 1 to 6
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    // Step 1: Create Account
    name: '',
    mobile: '',
    email: '',
    // Step 2: Personal / Address Details
    address: '',
    city: '',
    state: '',
    pincode: '',
    // Step 3: PAN / KYC
    panNumber: '',
    kycType: 'Individual Aadhaar/PAN',
    // Step 4: Identity Verification
    idProofType: 'Aadhaar Card',
    idFileName: '',
    idVerified: false,
    // Step 5: PCC (Police Clearance Certificate)
    hasPcc: 'yes',
    pccFileName: '',
    // Step 6: Terms & Acceptance
    agreeTerms: false
  });

  const [validationError, setValidationError] = useState('');

  const stepLabels = [
    { num: 1, title: 'Account' },
    { num: 2, title: 'Details' },
    { num: 3, title: 'KYC' },
    { num: 4, title: 'Verification' },
    { num: 5, title: 'PCC' },
    { num: 6, title: 'Confirmation' }
  ];

  const handleNext = (e) => {
    e.preventDefault();
    setValidationError('');

    // Step 1 Validation
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.mobile.trim() || !formData.email.trim()) {
        setValidationError('Please complete all account fields.');
        return;
      }
    }
    // Step 2 Validation
    if (currentStep === 2) {
      if (!formData.address.trim() || !formData.city.trim() || !formData.pincode.trim()) {
        setValidationError('Please complete all address details.');
        return;
      }
    }
    // Step 3 Validation
    if (currentStep === 3) {
      if (!formData.panNumber.trim()) {
        setValidationError('Please provide a valid PAN number.');
        return;
      }
    }
    // Step 4 Validation
    if (currentStep === 4) {
      // ID Proof
      if (!formData.idFileName) {
        setFormData((prev) => ({ ...prev, idFileName: 'aadhaar_doc_verified.pdf' }));
      }
    }
    // Step 5 Validation
    if (currentStep === 5) {
      if (formData.hasPcc === 'yes' && !formData.pccFileName) {
        setFormData((prev) => ({ ...prev, pccFileName: 'pcc_clearance_cert.pdf' }));
      }
    }
    // Step 6 Submit
    if (currentStep === 6) {
      if (!formData.agreeTerms) {
        setValidationError('You must accept the Terms & Conditions and Auction Rules to proceed.');
        return;
      }
      setIsSuccess(true);
      return;
    }

    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const handleBack = () => {
    setValidationError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-register-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-brand-header">
            <SalvexLogo variant="light" size="small" />
            <h3 className="modal-title" style={{ marginTop: '8px' }}>
              Buyer Registration
            </h3>
            <p className="modal-subtitle">
              Verify your identity to explore bank-repossessed and insurance salvage demo auctions.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="register-success-box" style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle2 size={36} color="#16A344" />
            </div>
            <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#0B1220', margin: '0 0 8px 0' }}>
              Registration Completed!
            </h4>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '22px', maxWidth: '420px', margin: '0 auto 24px auto' }}>
              Welcome to Salvex Auction (Demo), <strong>{formData.name}</strong>. Your profile has been recorded under Demo Bidder ID <strong>DEMO-{(Math.floor(1000 + Math.random() * 9000))}</strong>. You can now place demo bids.
            </p>
            <button
              type="button"
              className="btn-submit-place-bid"
              style={{ width: '100%', height: '46px' }}
              onClick={onClose}
            >
              Start Bidding Now
            </button>
          </div>
        ) : (
          <div className="modal-body-form" style={{ padding: '20px 24px' }}>
            
            {/* 6-Step Progress Indicator */}
            <div className="register-step-progress" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#075BFF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Step {currentStep} of 6 — {stepLabels[currentStep - 1].title}
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  {Math.round((currentStep / 6) * 100)}% Complete
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(currentStep / 6) * 100}%`,
                    height: '100%',
                    backgroundColor: '#075BFF',
                    transition: 'width 0.25s ease'
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {validationError && (
              <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#075BFF', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '16px' }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handleNext}>
              {/* STEP 01: Create Account */}
              {currentStep === 1 && (
                <div className="form-step-pane">
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0B1220', margin: '0 0 14px 0' }}>
                    01 — Create Your Bidder Account
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="field-label" htmlFor="reg-name">Full Legal Name *</label>
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        className="field-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="reg-mobile">Mobile Number (OTP Verified) *</label>
                      <input
                        id="reg-mobile"
                        type="tel"
                        placeholder="+91 00000 00000"
                        className="field-input"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="reg-email">Work / Personal Email *</label>
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="demo@example.com"
                        className="field-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 02: Personal / Address Details */}
              {currentStep === 2 && (
                <div className="form-step-pane">
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0B1220', margin: '0 0 14px 0' }}>
                    02 — Personal / Address Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="field-label" htmlFor="reg-address">Street Address / House No. *</label>
                      <input
                        id="reg-address"
                        type="text"
                        placeholder="Plot 14, 5th Main, Indiranagar"
                        className="field-input"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="field-label" htmlFor="reg-city">City *</label>
                        <input
                          id="reg-city"
                          type="text"
                          placeholder="Bengaluru"
                          className="field-input"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="reg-state">State *</label>
                        <input
                          id="reg-state"
                          type="text"
                          placeholder="Karnataka"
                          className="field-input"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="reg-pincode">Pincode *</label>
                      <input
                        id="reg-pincode"
                        type="text"
                        placeholder="560038"
                        className="field-input"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 03: PAN / KYC */}
              {currentStep === 3 && (
                <div className="form-step-pane">
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0B1220', margin: '0 0 14px 0' }}>
                    03 — PAN &amp; Tax Compliance Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="field-label" htmlFor="reg-pan">Permanent Account Number (PAN) *</label>
                      <input
                        id="reg-pan"
                        type="text"
                        placeholder="ABCDE1234F"
                        className="field-input"
                        style={{ textTransform: 'uppercase' }}
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                        required
                      />
                      <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                        Required by Indian Tax Authorities &amp; Reserve Bank of India for asset auction settlements.
                      </span>
                    </div>

                    <div>
                      <label className="field-label">KYC Registration Type</label>
                      <select
                        className="field-input"
                        value={formData.kycType}
                        onChange={(e) => setFormData({ ...formData, kycType: e.target.value })}
                      >
                        <option>Individual Citizen (Aadhaar / PAN)</option>
                        <option>Registered Sole Proprietorship</option>
                        <option>Corporate Entity / Private Limited (GSTIN)</option>
                        <option>Authorized Automotive Dealer (Trade License)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 04: Identity Verification */}
              {currentStep === 4 && (
                <div className="form-step-pane">
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0B1220', margin: '0 0 14px 0' }}>
                    04 — Identity Verification (Government ID)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="field-label">Select ID Document Type *</label>
                      <select
                        className="field-input"
                        value={formData.idProofType}
                        onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                      >
                        <option>Aadhaar Card (Front &amp; Back)</option>
                        <option>Passport (Information Page)</option>
                        <option>Voter Identity Card (EPIC)</option>
                        <option>Driving License</option>
                      </select>
                    </div>

                    <div style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '20px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                      <UploadCloud size={28} color="#64748B" style={{ margin: '0 auto 8px auto' }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B1220', display: 'block' }}>
                        Upload Scanned ID Copy
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                        PDF, JPG, or PNG up to 10MB
                      </span>
                      <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '11.5px', color: '#16A344', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> Document verified &amp; ready
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 05: PCC (Police Clearance Certificate) */}
              {currentStep === 5 && (
                <div className="form-step-pane">
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0B1220', margin: '0 0 14px 0' }}>
                    05 — Police Clearance Certificate (PCC)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#1E40AF', display: 'flex', gap: '8px' }}>
                      <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        Certain bank and court-seized asset liquidations mandate a valid Police Clearance Certificate (PCC) for high-value asset bidding. If your auction requires it, upload below or select waiver.
                      </span>
                    </div>

                    <div>
                      <label className="field-label">Do you possess a valid PCC? *</label>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0B1220', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="pcc-radio"
                            checked={formData.hasPcc === 'yes'}
                            onChange={() => setFormData({ ...formData, hasPcc: 'yes' })}
                          />
                          Yes, I have a valid PCC
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0B1220', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="pcc-radio"
                            checked={formData.hasPcc === 'no'}
                            onChange={() => setFormData({ ...formData, hasPcc: 'no' })}
                          />
                          Submit within 7 days
                        </label>
                      </div>
                    </div>

                    {formData.hasPcc === 'yes' && (
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileCheck size={18} color="#16A344" />
                          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#0B1220' }}>
                            pcc_clearance_cert.pdf (Attached)
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#16A344', fontWeight: '700' }}>Valid</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 06: Terms & Acceptance */}
              {currentStep === 6 && (
                <div className="form-step-pane">
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0B1220', margin: '0 0 14px 0' }}>
                    06 — Terms &amp; Conditions Acceptance
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#64748B', lineHeight: '18px' }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: '#0B1220' }}>Salvex Auction Buyer Agreement Summary:</p>
                      <p style={{ margin: '0 0 4px 0' }}>1. All bids placed on the Salvex platform are irrevocable, legally binding contractual purchase commitments.</p>
                      <p style={{ margin: '0 0 4px 0' }}>2. Winning bidders agree to deposit 10% EMD within 24 hours of auction close and clear the remaining balance within 48 hours.</p>
                      <p style={{ margin: 0 }}>3. Vehicles are sold on an &quot;As-Is, Where-Is&quot; condition with 100% transparent inspection and document availability.</p>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#0B1220' }}>
                        <input
                          type="checkbox"
                          checked={formData.agreeTerms}
                          onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                          style={{ marginTop: '3px' }}
                          required
                        />
                        <span>
                          I have read and agree to the applicable <strong>Terms &amp; Conditions</strong>, <strong>Auction Policy</strong>, and <strong>Privacy Policy</strong>.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Navigation Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{ background: 'none', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#075BFF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 22px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(7, 91, 255, 0.35)'
                  }}
                >
                  <span>{currentStep === 6 ? 'Complete Registration' : 'Continue'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
