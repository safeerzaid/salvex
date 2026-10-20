import React from 'react';
import { Truck, CheckCircle2, ArrowRight, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecoveryServicePage() {
  return (
    <div className="salvex-service-page">
      {/* HERO SECTION */}
      <section className="lifting-hero">
        <div className="salvex-container">
          <div className="lifting-hero-inner">
            <span className="lifting-pill">
              <Truck size={14} />
              NATIONWIDE LOGISTICS & DISPATCH
            </span>
            <h1 className="lifting-title">Recovery Vehicle Booking</h1>
            <p className="lifting-subtitle">
              Professional flatbed towing, hydraulic recovery lifters, and multi-car carrier dispatch directly from all regional Salvex yard hubs.
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
                  <Truck size={20} />
                </div>
                <h2 className="rule-heading">Recovery & Flatbed Dispatch Solutions</h2>
              </div>
              <p className="rule-text" style={{ marginBottom: '20px' }}>
                Whether your acquired lot is in non-running, salvage, or pristine running condition, our network of certified recovery flatbeds and enclosed transporters ensures damage-free pickup and GPS-tracked doorstep delivery across India.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <CheckCircle2 size={18} />
                    <span>Hydraulic Flatbeds</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Zero-angle tilt-bed carriers suited for lowered sports cars, luxury sedans, and immobilized vehicles.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <Clock size={18} />
                    <span>Same-Day Gate Pass Pickup</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Coordinated yard gate pass handover directly between our drivers and yard dispatch managers.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#075BFF', fontWeight: 600 }}>
                    <MapPin size={18} />
                    <span>Inter-City Car Hauling</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                    Cost-effective containerized shipping between stockyards in Bengaluru, Mumbai, Delhi, and Chennai.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px 28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0B1220' }}>
                  Schedule a Yard Pickup or Flatbed Booking
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
                  Coordinate transportation for your won auction lot with our logistics desk.
                </p>
              </div>
              <Link
                to="/contact"
                className="btn-register-red"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
              >
                <span>Book Recovery Vehicle</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
