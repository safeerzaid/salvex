import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle2, ArrowRight, Upload, Building2 } from 'lucide-react';
import SalvexLogo from './SalvexLogo';

export default function ListVehicleModal({ isOpen, onClose }) {
  const [sellerType, setSellerType] = useState('bank');
  const [formData, setFormData] = useState({
    sellerName: '',
    contactMobile: '',
    email: '',
    makeModel: '',
    year: '2023',
    vehicleCondition: 'Used - Running',
    location: 'Mumbai',
    estimatedReserve: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-register-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-brand-header">
            <SalvexLogo variant="light" size="small" />
            <h3 className="modal-title" style={{ marginTop: '8px' }}>List Your Vehicle for Auction</h3>
            <p className="modal-subtitle">Connect with 25,000+ verified bidders across India with 72-hour turnaround.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="register-success-box">
            <CheckCircle2 size={56} className="text-success" />
            <h4 className="success-heading">Consignment Request Received!</h4>
            <p className="success-text">
              Thank you, <strong>{formData.sellerName || 'Consignor'}</strong>.
              Our asset valuation team will contact you to schedule a physical 150-point inspection
              and reserve price cataloging.
            </p>
            <button
              type="button"
              className="btn-primary w-full btn-large"
              style={{ marginTop: '20px' }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form className="modal-body-form" onSubmit={handleSubmit}>
            <div className="bidder-type-selector">
              <label className="field-label">Seller Classification:</label>
              <div className="bidder-type-pills">
                <button
                  type="button"
                  className={`type-pill ${sellerType === 'bank' ? 'type-pill-active' : ''}`}
                  onClick={() => setSellerType('bank')}
                >
                  Bank / NBFC Lender
                </button>
                <button
                  type="button"
                  className={`type-pill ${sellerType === 'insurance' ? 'type-pill-active' : ''}`}
                  onClick={() => setSellerType('insurance')}
                >
                  Insurance Company
                </button>
                <button
                  type="button"
                  className={`type-pill ${sellerType === 'corporate' ? 'type-pill-active' : ''}`}
                  onClick={() => setSellerType('corporate')}
                >
                  Corporate Fleet
                </button>
                <button
                  type="button"
                  className={`type-pill ${sellerType === 'individual' ? 'type-pill-active' : ''}`}
                  onClick={() => setSellerType('individual')}
                >
                  Individual / Dealer
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field-group">
                <label className="field-label" htmlFor="seller-name">Seller / Organization Name *</label>
                <input
                  id="seller-name"
                  type="text"
                  required
                  placeholder="e.g. Sample Asset Recovery / Sample Motors"
                  className="field-input"
                  value={formData.sellerName}
                  onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="seller-phone">Contact Mobile *</label>
                <input
                  id="seller-phone"
                  type="tel"
                  required
                  placeholder="+91 00000 00000"
                  className="field-input"
                  value={formData.contactMobile}
                  onChange={(e) => setFormData({ ...formData, contactMobile: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field-group">
                <label className="field-label" htmlFor="seller-vehicle">Vehicle Make & Model *</label>
                <input
                  id="seller-vehicle"
                  type="text"
                  required
                  placeholder="e.g. 2023 Mercedes E 220d"
                  className="field-input"
                  value={formData.makeModel}
                  onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="seller-condition">Vehicle Condition *</label>
                <select
                  id="seller-condition"
                  className="field-input field-select"
                  value={formData.vehicleCondition}
                  onChange={(e) => setFormData({ ...formData, vehicleCondition: e.target.value })}
                >
                  <option value="Used - Certified">Used - In Running Condition</option>
                  <option value="Bank Repossessed">Bank Repossessed Asset</option>
                  <option value="Insurance Salvage - Repairable">Insurance Salvage - Repairable</option>
                  <option value="Total Loss / Accidental">Total Loss / Scrap / Recycler</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field-group">
                <label className="field-label" htmlFor="seller-reserve">Estimated Reserve Price (INR)</label>
                <input
                  id="seller-reserve"
                  type="text"
                  placeholder="e.g. ₹25,00,000"
                  className="field-input"
                  value={formData.estimatedReserve}
                  onChange={(e) => setFormData({ ...formData, estimatedReserve: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="seller-yard">Stockyard / Parking City *</label>
                <input
                  id="seller-yard"
                  type="text"
                  required
                  placeholder="e.g. Mumbai / Delhi NCR"
                  className="field-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full btn-large" id="btn-submit-seller-consignment">
              <span>Submit Listing for Verification</span>
              <ArrowRight size={18} className="btn-arrow" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
