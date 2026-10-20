import React, { useState } from 'react';
import {
  Car,
  FileText,
  Camera,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Building
} from 'lucide-react';
import './ListVehiclePage.css';

export default function ListVehiclePage({ onSubmitSuccess, onNavigateSellerDashboard, onShowToast }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Vehicle Specs
    make: 'BMW',
    model: '5 Series 530d M Sport',
    yearMfg: '2022',
    yearReg: '2022',
    fuel: 'Diesel',
    transmission: 'Automatic',
    kmDriven: '34,200',
    category: 'Luxury Sedans',
    rtoLocation: 'KA-01 (Koramangala, Bengaluru)',

    // Step 2: Condition & Damage
    conditionType: 'Used Vehicle', // 'Salvage' | 'Damaged' | 'Used' | 'Bank Repossessed'
    accidentHistory: 'Minor bumper scratch on rear right panel, zero structural damage',
    damageDetails: 'Cosmetic touch-up needed on bumper; all airbags, chassis, and electronics 100% intact',
    rcStatus: 'Original RC Available with Clean NOC',
    insuranceStatus: 'Comprehensive Active till Dec 2026',

    // Step 3: Photos & Docs (mock upload counts)
    photosUploaded: {
      front: true,
      rear: true,
      left: true,
      right: true,
      interior: true,
      damage: true
    },
    docsUploaded: {
      rc: true,
      insurance: true,
      serviceRecords: false
    },

    // Step 4: Seller Details
    sellerType: 'Individual Owner', // 'Individual Owner' | 'Automotive Dealer' | 'Bank / NBFC Consignor' | 'Insurance Co'
    sellerName: 'Demo Seller',
    sellerMobile: '+91 00000 00000',
    sellerEmail: 'demo.seller@example.com',
    sellerCity: 'Bengaluru',
    reservePrice: '4500000'
  });

  const steps = [
    { num: 1, label: 'Vehicle Details', icon: Car },
    { num: 2, label: 'Condition & Damage', icon: FileText },
    { num: 3, label: 'Photos & Documents', icon: Camera },
    { num: 4, label: 'Seller & Valuation', icon: User },
    { num: 5, label: 'Review & Submit', icon: ShieldCheck }
  ];

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onShowToast) {
        onShowToast('Vehicle listing submitted! Inspection and review initiated.');
      }
    }, 800);
  };

  const formatCurrency = (amt) => {
    return '₹' + Number(amt || 0).toLocaleString('en-IN');
  };

  return (
    <div className="salvex-list-vehicle-page">
      {/* 01 HEADER */}
      <section className="list-hero">
        <div className="salvex-container">
          <div className="list-hero-inner">
            <span className="list-pill">CONSIGNOR ONBOARDING PORTAL</span>
            <h1 className="list-title">List Your Vehicle on Salvex Auction</h1>
            <p className="list-subtitle">
              Reach thousands of pre-qualified verified bidders, automotive dealers, and corporate fleets across India with transparent liquidation and fast payout processes (demo).
            </p>

            {/* Stepper Progress */}
            <div className="seller-stepper-wrap">
              {steps.map((st) => {
                const IconC = st.icon;
                const isPassed = currentStep > st.num;
                const isCurrent = currentStep === st.num;
                return (
                  <div
                    key={st.num}
                    className={`stepper-step ${isCurrent ? 'step-current' : ''} ${isPassed ? 'step-passed' : ''}`}
                  >
                    <div className="stepper-circle">
                      {isPassed ? <CheckCircle2 size={16} /> : <IconC size={16} />}
                    </div>
                    <span className="stepper-label">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 02 MAIN FORM BODY */}
      <section className="list-form-section">
        <div className="salvex-container">
          <div className="form-card-container">
            {isSubmitted ? (
              <div className="submission-success-card">
                <div className="success-icon-wrap">
                  <CheckCircle2 size={48} className="text-success" />
                </div>
                <h2>Listing Submitted for Asset Inspection</h2>
                <p className="success-lead">
                  Your listing for <strong>{formData.yearMfg} {formData.make} {formData.model}</strong> has been registered under Consignor Lot <strong>#SLX-LOT-9921</strong>.
                </p>
                <div className="success-status-box">
                  <span className="status-chip under-review">Under Review</span>
                  <p>Our technical valuation and yard inspection team will review your high-res photos and RC documents within 24 business hours to schedule the live auction window.</p>
                </div>
                <div className="success-actions">
                  <button
                    type="button"
                    className="salvex-btn salvex-btn-primary"
                    onClick={onNavigateSellerDashboard}
                  >
                    <span>Go to Seller Dashboard</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="salvex-btn salvex-btn-outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setCurrentStep(1);
                    }}
                  >
                    <span>Submit Another Vehicle</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={currentStep === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                {/* STEP 1: VEHICLE DETAILS */}
                {currentStep === 1 && (
                  <div className="step-pane">
                    <div className="pane-header">
                      <h3>Step 1: Vehicle Specifications</h3>
                      <p>Enter the fundamental manufacturing and registration data of your vehicle.</p>
                    </div>

                    <div className="form-grid-3">
                      <div className="form-field">
                        <label>Vehicle Make *</label>
                        <input
                          type="text"
                          required
                          value={formData.make}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>Vehicle Model & Variant *</label>
                        <input
                          type="text"
                          required
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          <option value="Luxury Sedans">Luxury Sedans</option>
                          <option value="Luxury SUVs">Luxury SUVs</option>
                          <option value="Commercial / Fleet">Commercial / Fleet</option>
                          <option value="Hatchback / Compact">Hatchback / Compact</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Manufacturing Year *</label>
                        <input
                          type="number"
                          required
                          value={formData.yearMfg}
                          onChange={(e) => setFormData({ ...formData, yearMfg: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>Registration Year *</label>
                        <input
                          type="number"
                          required
                          value={formData.yearReg}
                          onChange={(e) => setFormData({ ...formData, yearReg: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>Fuel Type *</label>
                        <select
                          value={formData.fuel}
                          onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                        >
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Electric">Electric</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Transmission *</label>
                        <select
                          value={formData.transmission}
                          onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                        >
                          <option value="Automatic">Automatic</option>
                          <option value="Manual">Manual</option>
                          <option value="Dual Clutch (DCT)">Dual Clutch (DCT)</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>KM Driven *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 34,200 KM"
                          value={formData.kmDriven}
                          onChange={(e) => setFormData({ ...formData, kmDriven: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>Registered RTO Location *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. KA-01 Koramangala"
                          value={formData.rtoLocation}
                          onChange={(e) => setFormData({ ...formData, rtoLocation: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CONDITION & DAMAGE */}
                {currentStep === 2 && (
                  <div className="step-pane">
                    <div className="pane-header">
                      <h3>Step 2: Condition & Damage Declaration</h3>
                      <p>Full transparency ensures highest bidder confidence and prevents post-sale arbitration.</p>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field">
                        <label>Primary Asset Category *</label>
                        <select
                          value={formData.conditionType}
                          onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                        >
                          <option value="Used Vehicle">Clean Used Vehicle</option>
                          <option value="Damaged">Damaged / Repairable Vehicle</option>
                          <option value="Salvage">Salvage / Insurance Total Loss</option>
                          <option value="Bank Repossessed">Bank / NBFC Repossessed Asset</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Registration Certificate (RC) Status *</label>
                        <input
                          type="text"
                          required
                          value={formData.rcStatus}
                          onChange={(e) => setFormData({ ...formData, rcStatus: e.target.value })}
                        />
                      </div>

                      <div className="form-field full-width">
                        <label>Accident / Impact History *</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Disclose any prior collision history, panel repaints, structural repairs, or flooding..."
                          value={formData.accidentHistory}
                          onChange={(e) => setFormData({ ...formData, accidentHistory: e.target.value })}
                        />
                      </div>

                      <div className="form-field full-width">
                        <label>Specific Component Damage Details *</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Detail scratches, dents, cracked glass, windshield, suspension or mechanical status..."
                          value={formData.damageDetails}
                          onChange={(e) => setFormData({ ...formData, damageDetails: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PHOTOS & DOCUMENTS */}
                {currentStep === 3 && (
                  <div className="step-pane">
                    <div className="pane-header">
                      <h3>Step 3: Vehicle Photographs & Legal Documents</h3>
                      <p>Upload clear high-resolution photographs covering all mandatory angles.</p>
                    </div>

                    <div className="photo-slots-grid">
                      {['Front 45° View', 'Rear 45° View', 'Left Profile', 'Right Profile', 'Cockpit & Interior', 'Damage Close-Up'].map((slot, sIdx) => (
                        <div key={sIdx} className="photo-upload-slot slot-uploaded">
                          <CheckCircle2 size={24} className="text-success" />
                          <span className="slot-title">{slot}</span>
                          <span className="slot-hint">Photo Attached (Ready)</span>
                        </div>
                      ))}
                    </div>

                    <div className="doc-uploads-container">
                      <h4>Mandatory Title Documents</h4>
                      <div className="doc-rows-list">
                        <div className="doc-row doc-ready">
                          <CheckCircle2 size={16} className="text-success" />
                          <span>Original Registration Certificate (RC) Copy</span>
                          <span className="doc-tag">Verified Upload</span>
                        </div>
                        <div className="doc-row doc-ready">
                          <CheckCircle2 size={16} className="text-success" />
                          <span>Valid Comprehensive / Third-Party Insurance Policy</span>
                          <span className="doc-tag">Verified Upload</span>
                        </div>
                        <div className="doc-row">
                          <Upload size={16} className="text-muted" />
                          <span>Authorized Service History / Bank NOC (Optional)</span>
                          <span className="doc-tag-opt">Optional</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: SELLER DETAILS & VALUATION */}
                {currentStep === 4 && (
                  <div className="step-pane">
                    <div className="pane-header">
                      <h3>Step 4: Consignor Details & Reserve Valuation</h3>
                      <p>Specify contact information and minimum reserve price expectation.</p>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field">
                        <label>Consignor Entity Type *</label>
                        <select
                          value={formData.sellerType}
                          onChange={(e) => setFormData({ ...formData, sellerType: e.target.value })}
                        >
                          <option value="Individual Owner">Individual Vehicle Owner</option>
                          <option value="Automotive Dealer">Automotive Dealer / Trade Licensee</option>
                          <option value="Bank / NBFC Consignor">Bank / NBFC Asset Recovery Unit</option>
                          <option value="Insurance Co">General Insurance Corporation</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Legal Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.sellerName}
                          onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>Mobile Number (For Inspection Coordination) *</label>
                        <input
                          type="tel"
                          required
                          value={formData.sellerMobile}
                          onChange={(e) => setFormData({ ...formData, sellerMobile: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          required
                          value={formData.sellerEmail}
                          onChange={(e) => setFormData({ ...formData, sellerEmail: e.target.value })}
                        />
                      </div>

                      <div className="form-field full-width">
                        <label>Minimum Reserve Price Expectation (INR ₹) *</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 4500000"
                          value={formData.reservePrice}
                          onChange={(e) => setFormData({ ...formData, reservePrice: e.target.value })}
                        />
                        <span className="field-hint">
                          Vehicles will not sell below your reserve price without your explicit written approval.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: REVIEW & SUBMIT */}
                {currentStep === 5 && (
                  <div className="step-pane">
                    <div className="pane-header">
                      <h3>Step 5: Review & Final Submission</h3>
                      <p>Verify all entered data before submitting your lot for technical review.</p>
                    </div>

                    <div className="review-summary-box">
                      <div className="review-grid">
                        <div className="rev-item">
                          <span className="rev-lbl">VEHICLE</span>
                          <span className="rev-val">{formData.yearMfg} {formData.make} {formData.model}</span>
                        </div>
                        <div className="rev-item">
                          <span className="rev-lbl">CATEGORY</span>
                          <span className="rev-val">{formData.category} ({formData.conditionType})</span>
                        </div>
                        <div className="rev-item">
                          <span className="rev-lbl">ODOMETER</span>
                          <span className="rev-val">{formData.kmDriven} KM ({formData.fuel})</span>
                        </div>
                        <div className="rev-item">
                          <span className="rev-lbl">RESERVE PRICE</span>
                          <span className="rev-val text-red">{formatCurrency(formData.reservePrice)}</span>
                        </div>
                      </div>

                      <div className="rev-item-full">
                        <span className="rev-lbl">CONDITION & DAMAGE SUMMARY</span>
                        <p>{formData.damageDetails}</p>
                      </div>

                      <div className="rev-item-full">
                        <span className="rev-lbl">CONSIGNOR</span>
                        <p>{formData.sellerName} ({formData.sellerType}) • {formData.sellerMobile} • {formData.sellerCity}</p>
                      </div>
                    </div>

                    <div className="terms-checkbox-wrap">
                      <input type="checkbox" id="accept-seller-terms" required defaultChecked />
                      <label htmlFor="accept-seller-terms">
                        I hereby declare that I hold clear legal title or institutional power of attorney to consign this vehicle lot for auction under Salvex Auction terms and conditions.
                      </label>
                    </div>
                  </div>
                )}

                {/* Stepper Navigation Buttons */}
                <div className="stepper-footer-actions">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      className="salvex-btn salvex-btn-outline"
                      onClick={handleBack}
                    >
                      <ArrowLeft size={15} />
                      <span>Previous Step</span>
                    </button>
                  )}

                  <div className="stepper-right-btn">
                    {currentStep < 5 ? (
                      <button
                        type="button"
                        className="salvex-btn salvex-btn-primary"
                        onClick={handleNext}
                      >
                        <span>Continue</span>
                        <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="salvex-btn salvex-btn-primary"
                      >
                        {isSubmitting ? (
                          <span>Submitting Listing...</span>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Confirm & Submit Vehicle</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
