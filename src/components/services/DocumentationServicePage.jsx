import React from 'react';
import { FileText, CheckCircle2, ArrowRight, ShieldCheck, Building2, Stamp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DocumentationServicePage() {
  return (
    <div className="salvex-service-page">
      {/* HERO SECTION */}
      <section className="lifting-hero">
        <div className="salvex-container">
          <div className="lifting-hero-inner">
            <span className="lifting-pill">
              <FileText size={14} />
              RTO COMPLIANCE & TITLE CLEARANCE
            </span>
            <h1 className="lifting-title">Vehicle Documentation Assistance</h1>
            <p className="lifting-subtitle">
              Comprehensive legal facilitation for RTO Form 29/30 transfers, bank NOC clearances, hypothecation cancellations, and interstate re-registration.
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
                  <FileText size={20} />
                </div>
                <h2 className="rule-heading">Complete Post-Auction RTO & Documentation Support</h2>
              </div>
              <p className="rule-text" style={{ marginBottom: '20px' }}>
                Navigating the documentation for bank-seized or insurance-salvage vehicles can be complex. Salvex provides dedicated legal assistance to ensure smooth ownership transfer, prompt release of original RC books, and statutory tax clearance across all state jurisdictions.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <Stamp size={18} />
                    <span>RTO Forms 29 & 30</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Preparation and authentication of statutory sale notices and application for ownership transfer.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <Building2 size={18} />
                    <span>Bank NOC & Hypothecation</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Assistance with obtaining Form 35 loan closure NOCs from lending banks and NBFCs.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <ShieldCheck size={18} />
                    <span>Interstate Clearance</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Issuance of interstate RTO NOC certificates and guidance on local state road tax computation.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px 28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0B1220' }}>
                  Have Questions Regarding RTO Transfer?
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
                  Our legal and RTO liaison desk is ready to advise you on documentation requirements.
                </p>
              </div>
              <Link
                to="/contact"
                className="btn-register-red"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
              >
                <span>Consult RTO Desk</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
