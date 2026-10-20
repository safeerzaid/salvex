import React from 'react';
import {
  UserPlus,
  ShieldCheck,
  Search,
  Gavel,
  Trophy,
  CreditCard,
  Truck,
  FileCheck2,
  Lock,
  Clock,
  Building
} from 'lucide-react';
import './HowItWorksPage.css';

export default function HowItWorksPage({ _onRegisterClick, _onExploreClick }) {
  const steps = [
    {
      num: '01',
      title: 'Register as Bidder',
      icon: UserPlus,
      summary: 'Create your secure Salvex Auction account with verified phone and email.',
      details: [
        'Quick 2-minute registration process',
        'Tier-1 access to search all inventory',
        'SMS & email instant notification preferences'
      ]
    },
    {
      num: '02',
      title: 'Identity & KYC Verification',
      icon: ShieldCheck,
      summary: 'Upload government-mandated verification documents to unlock live bidding rights.',
      details: [
        'Valid PAN card verification for statutory compliance',
        'Aadhaar / Voter ID / Passport proof of identity',
        'Valid Police Clearance Certificate (PCC) or Trade License'
      ]
    },
    {
      num: '03',
      title: 'Discover & Inspect Vehicle',
      icon: Search,
      summary: 'Review detailed 150-point inspection reports, HD photo galleries, and vehicle title status.',
      details: [
        'Transparent damage photographs and repair estimates',
        'Original RC, RTO status, and NOC clarity',
        'Physical yard inspection windows available prior to auction'
      ]
    },
    {
      num: '04',
      title: 'Participate in Live Bidding',
      icon: Gavel,
      summary: 'Place competitive bids in real time with transparent minimum increment controls.',
      details: [
        'Standard minimum increment: ₹1,00,000 for exotics / commercial',
        'Dynamic 120-second overtime rule prevents last-second sniping',
        'Immediate instant outbid alerts with 1-click counter-bidding'
      ]
    },
    {
      num: '05',
      title: 'Win the Auction Lot',
      icon: Trophy,
      summary: 'If your bid remains the highest valid bid at auction close, the vehicle lot is awarded to you.',
      details: [
        'Formal Bid Confirmation Certificate generated',
        'Guaranteed price protection with no hidden broker markups',
        'Automated allocation notice sent to your registered dashboard'
      ]
    },
    {
      num: '06',
      title: 'Secure Settlement (Demo)',
      icon: CreditCard,
      summary: 'Remit the purchase consideration securely into the designated settlement account (demo).',
      details: [
        '10% Earnest Money Deposit (EMD) within 24 hours of close',
        'Remaining 90% balance settlement within 48 hours via RTGS/NEFT',
        'Statutory RTO transfer and buyer premium tax invoice issued'
      ]
    },
    {
      num: '07',
      title: 'Vehicle Lifting & Handover',
      icon: Truck,
      summary: 'Collect your vehicle from our regional logistics yard with an official QR Gate Pass.',
      details: [
        'Automated Digital Gate Pass generated upon payment clearance',
        '5 business days of complimentary holding yard storage',
        'Assistance with flatbed towing and interstate transport dispatch'
      ]
    }
  ];

  return (
    <div className="salvex-how-it-works-page">
      {/* 01 VISUAL 7-STEP TIMELINE */}
      <section className="how-steps-section">
        <div className="salvex-container">
          <div className="steps-journey-container">
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div key={step.num} className="step-journey-card">
                  <div className="step-card-header">
                    <div className="step-icon-bubble">
                      <IconComp size={24} />
                    </div>
                    <span className="step-large-num">{step.num}</span>
                  </div>

                  <h2 className="step-card-title">{step.title}</h2>
                  <p className="step-card-summary">{step.summary}</p>

                  <ul className="step-details-list">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx}>
                        <FileCheck2 size={14} className="check-bullet" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {idx < steps.length - 1 && (
                    <div className="step-connector-line" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 03 TRUST PILLARS */}
      <section className="how-trust-pillars">
        <div className="salvex-container">
          <div className="trust-grid">
            <div className="trust-col">
              <Lock size={28} className="text-auction-red" />
              <h3>Secure settlement (demo)</h3>
              <p>Simulated settlement process illustrating trust protection until title documents and gate passes are validated.</p>
            </div>
            <div className="trust-col">
              <Building size={28} className="text-auction-red" />
              <h3>Direct Institutional Sourcing</h3>
              <p>Vehicles are consigned directly by Tier-1 banks, insurance corporations, and fleet balance sheets.</p>
            </div>
            <div className="trust-col">
              <Clock size={28} className="text-auction-red" />
              <h3>Rapid Dispatch & Lifting</h3>
              <p>Instant digital gate passes and coordinated towing support across all metropolitan yard facilities.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
