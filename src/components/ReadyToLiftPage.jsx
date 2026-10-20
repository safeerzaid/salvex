import React from 'react';
import { Truck, CheckCircle2, ShieldCheck, ArrowRight, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReadyToLiftPage() {
  return (
    <div className="salvex-ready-to-lift-page">
      {/* 01 HERO SECTION */}
      <section className="lifting-hero">
        <div className="salvex-container">
          <div className="lifting-hero-inner">
            <span className="lifting-pill">
              <Truck size={14} />
              EXPRESS DISPATCH INVENTORY
            </span>
            <h1 className="lifting-title">Ready to Lift</h1>
            <p className="lifting-subtitle">
              Fully verified, document-cleared vehicle inventory ready for immediate yard release and same-day gate pass generation.
            </p>
          </div>
        </div>
      </section>

      {/* 02 MAIN CONTENT SECTION */}
      <section className="rules-body-section" style={{ minHeight: '50vh', backgroundColor: '#F8FAFC' }}>
        <div className="salvex-container">
          <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="rule-card">
              <div className="rule-card-header">
                <div className="rule-icon-box">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="rule-heading">Fast-Track Vehicle Handover</h2>
              </div>
              <p className="rule-text" style={{ marginBottom: '16px' }}>
                All lots marked as <strong>Ready to Lift</strong> have completed mandatory NOC title inspections, settlement checks, and security yard clearance. Buyers can settle payment and immediately download digital QR gate passes to schedule transporter or self-drive collection.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '20px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <CheckCircle2 size={18} />
                    <span>Instant Digital Gate Pass</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    QR-coded yard clearance generated immediately upon payment confirmation.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <Clock size={18} />
                    <span>5 Days Free Yard Storage</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Complimentary holding period at our secure regional hubs for your logistics carrier.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <MapPin size={18} />
                    <span>Nationwide Yard Hubs</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Coordinated logistics release across Bengaluru, Mumbai, Delhi NCR, and Chennai yards.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px 28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0B1220' }}>
                  Explore Live Lots Ready for Settlement
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
                  Browse vehicles currently live on auction with pre-cleared titles.
                </p>
              </div>
              <Link
                to="/auctions/live"
                className="btn-register-red"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
              >
                <span>View Live Auctions</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
