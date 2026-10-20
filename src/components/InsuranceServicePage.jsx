import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight, FileCheck, PhoneCall, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InsuranceServicePage() {
  return (
    <div className="salvex-service-page">
      {/* HERO SECTION */}
      <section className="lifting-hero">
        <div className="salvex-container">
          <div className="lifting-hero-inner">
            <span className="lifting-pill">
              <ShieldCheck size={14} />
              COMPREHENSIVE COVERAGE SOLUTIONS
            </span>
            <h1 className="lifting-title">Vehicle Insurance</h1>
            <p className="lifting-subtitle">
              Instant insurance transit policies, comprehensive damage coverage, and post-auction salvage claim assistance tailored for auction winners.
            </p>
          </div>
        </div>
      </section>

      {/* BODY CONTENT */}
      <section className="rules-body-section" style={{ minHeight: '55vh', backgroundColor: '#F8FAFC' }}>
        <div className="salvex-container">
          <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="rule-card">
              <div className="rule-card-header">
                <div className="rule-icon-box">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="rule-heading">Auction Vehicle Insurance Services</h2>
              </div>
              <p className="rule-text" style={{ marginBottom: '20px' }}>
                Winning lots from insurance salvage or bank repossession requires customized transit coverage before driving or hauling vehicles out of regional yards. Salvex partners with leading national insurers to provide instant digital policy issuance, third-party liability endorsements, and comprehensive packages.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <CheckCircle2 size={18} />
                    <span>Transit Cover</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Same-day transit insurance covering road transportation from yard to your destination workshop.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <FileCheck size={18} />
                    <span>Salvage Endorsements</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Direct policy name transfers and endorsements aligned with RTO Form 29/30 documentation.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <PhoneCall size={18} />
                    <span>Claims Guidance</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Dedicated claims desk assisting with total-loss paperwork and insurer salvage clearance.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px 28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0B1220' }}>
                  Need an Insurance Quote for a Won Lot?
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
                  Speak directly with our automotive insurance desk for instant policy generation.
                </p>
              </div>
              <Link
                to="/contact"
                className="btn-register-red"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
              >
                <span>Contact Insurance Desk</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
