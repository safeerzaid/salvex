import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  FileCheck2,
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  ArrowRight
} from 'lucide-react';
import { wonAuctionsData } from '../data/mockVehicles';

export default function VehicleLiftingPage({
  lotId = 'won-102',
  onNavigateDashboard,
  onShowToast
}) {
  const lot = wonAuctionsData.find((l) => l.id === lotId) || wonAuctionsData[1];
  const [liftingStage, setLiftingStage] = useState(lot.liftingStatus === 'Vehicle Ready' ? 3 : 4);
  const [collectionConfirmed, setCollectionConfirmed] = useState(false);

  const stages = [
    { num: 1, label: 'Payment Completed', desc: 'Secure settlement (demo) confirmed' },
    { num: 2, label: 'Documents Verified', desc: 'RTO Form 29/30 & NOC generated' },
    { num: 3, label: 'Vehicle Ready at Yard', desc: 'Vehicle prepped & gate pass active' },
    { num: 4, label: 'Vehicle Collected', desc: 'Physical release & gate pass clearance' }
  ];

  const handleSimulatePickup = () => {
    setLiftingStage(4);
    setCollectionConfirmed(true);
    if (onShowToast) {
      onShowToast('Vehicle release recorded! Gate Pass cleared by yard security.');
    }
  };

  return (
    <div className="salvex-vehicle-lifting-page">
      {/* 01 HEADER */}
      <section className="lifting-hero">
        <div className="salvex-container">
          <div className="lifting-hero-inner">
            <span className="lifting-pill">
              <Truck size={14} />
              POST-AUCTION LOGISTICS & VEHICLE DISPATCH
            </span>
            <h1 className="lifting-title">Vehicle Lifting & Yard Gate Pass</h1>
            <p className="lifting-subtitle">
              Authorized release dossier for {lot.yearMfg} {lot.make} {lot.model} • Gate Pass #{lot.gatePassId}.
            </p>
          </div>
        </div>
      </section>

      {/* 02 STATUS TIMELINE */}
      <section className="lifting-timeline-section">
        <div className="salvex-container">
          <div className="timeline-container-card">
            <div className="stages-flow">
              {stages.map((st) => {
                const isPassed = liftingStage >= st.num;
                const isCurrent = liftingStage === st.num;
                return (
                  <div
                    key={st.num}
                    className={`stage-node ${isPassed ? 'node-passed' : ''} ${isCurrent ? 'node-current' : ''}`}
                  >
                    <div className="node-marker">
                      {isPassed ? <CheckCircle2 size={18} /> : <span>{st.num}</span>}
                    </div>
                    <div className="node-text">
                      <span className="node-title">{st.label}</span>
                      <span className="node-desc">{st.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 03 MAIN DETAILS: GATE PASS + YARD INSTRUCTIONS */}
      <section className="lifting-body-section">
        <div className="salvex-container">
          <div className="lifting-layout-grid">
            {/* LEFT COLUMN: OFFICIAL DIGITAL GATE PASS */}
            <div className="gate-pass-col">
              <div className="digital-gate-pass-card" id="gate-pass-card">
                <div className="gp-header">
                  <div className="gp-brand">
                    <span className="gp-logo">SALVEX AUCTION</span>
                    <span className="gp-sub">AUTHORIZATION FOR VEHICLE DISPATCH</span>
                  </div>
                  <span className="gp-pass-id">{lot.gatePassId}</span>
                </div>

                <div className="gp-body">
                  <div className="gp-vehicle-row">
                    <img src={lot.image} alt={`${lot.make} ${lot.model}`} className="gp-thumb" />
                    <div>
                      <span className="gp-tag">AUTHORIZATION LOT</span>
                      <h3>{lot.yearMfg} {lot.make} {lot.model}</h3>
                      <p>Lot Ref: <strong>#{lot.vehicleId.toUpperCase()}</strong></p>
                    </div>
                  </div>

                  <div className="gp-info-grid">
                    <div className="gp-info-box">
                      <span className="gi-lbl">REGISTERED RECIPIENT</span>
                      <span className="gi-val">Rahul Sharma (SVX-BDR-7842)</span>
                    </div>

                    <div className="gp-info-box">
                      <span className="gi-lbl">PAYMENT STATUS</span>
                      <span className="gi-val text-success">Fully Cleared (Secure settlement - demo)</span>
                    </div>

                    <div className="gp-info-box">
                      <span className="gi-lbl">VALID UNTIL</span>
                      <span className="gi-val text-red">{lot.liftingDeadline} (18:00 IST)</span>
                    </div>

                    <div className="gp-info-box">
                      <span className="gi-lbl">STOCKYARD FACILITY</span>
                      <span className="gi-val">{lot.yardLocation?.split(',')[0]}</span>
                    </div>
                  </div>

                  {/* QR Security Block */}
                  <div className="gp-qr-block">
                    <div className="qr-visual">
                      <QrCode size={96} className="qr-icon-svg" />
                    </div>
                    <div className="qr-text">
                      <h4>Sample Yard Security QR (Demo)</h4>
                      <p>Scan by authorized stockyard gate inspector to authenticate release and log odometer upon exit.</p>
                      <span className="sec-tag">Sample Digital Verification Format</span>
                    </div>
                  </div>
                </div>

                <div className="gp-footer-actions">
                  <button
                    type="button"
                    className="salvex-btn salvex-btn-outline"
                    onClick={() => {
                      window.print();
                    }}
                  >
                    <Printer size={15} />
                    <span>Print Gate Pass</span>
                  </button>

                  <button
                    type="button"
                    className="salvex-btn salvex-btn-outline"
                    onClick={() => onShowToast('Gate Pass PDF downloaded.')}
                  >
                    <Download size={15} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: YARD LOGISTICS & COLLECTION INSTRUCTIONS */}
            <div className="yard-logistics-col">
              {/* Yard Location & Manager */}
              <div className="yard-contact-card">
                <div className="ycc-header">
                  <MapPin size={20} className="text-auction-red" />
                  <div>
                    <h3>Designated Stockyard Facility</h3>
                    <p>Physical collection and loading site</p>
                  </div>
                </div>

                <div className="ycc-body">
                  <p className="yard-address-full">
                    <strong>{lot.yardLocation}</strong>
                  </p>

                  <div className="yard-manager-row">
                    <div className="ym-icon"><UserCheck size={18} /></div>
                    <div className="ym-text">
                      <span className="ym-lbl">FACILITY DESK & YARD MANAGER</span>
                      <strong className="ym-name">{lot.yardManager}</strong>
                      <span className="ym-hours">Operating: Mon – Sat, 09:00 AM – 06:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Documents Checklist */}
              <div className="lifting-checklist-card">
                <h3>Mandatory Lifting Documents Checklist</h3>
                <p className="cl-sub">The lifting driver / transporter must present these at the security gate:</p>

                <ul className="checklist-items">
                  <li>
                    <FileCheck2 size={16} className="text-success" />
                    <span>Printed Official Digital Gate Pass (with visible QR code)</span>
                  </li>
                  <li>
                    <FileCheck2 size={16} className="text-success" />
                    <span>Original Government ID of Winning Bidder (Aadhaar or PAN)</span>
                  </li>
                  <li>
                    <FileCheck2 size={16} className="text-success" />
                    <span>Signed Authority Letter & Driver License (if third-party transport)</span>
                  </li>
                  <li>
                    <FileCheck2 size={16} className="text-success" />
                    <span>Flatbed Tow Truck Registration & Insurance (for salvage/damaged lots)</span>
                  </li>
                </ul>
              </div>

              {/* Operational Yard Clearance Action */}
              <div className="yard-clearance-box">
                {collectionConfirmed ? (
                  <div className="cleared-alert">
                    <CheckCircle2 size={24} className="text-success" />
                    <div>
                      <h4>Vehicle Successfully Collected</h4>
                      <p>Yard release logged into system. RTO ownership transfer dossier sent via registered speed post.</p>
                    </div>
                  </div>
                ) : (
                  <div className="pickup-sim-box">
                    <h4>Stockyard Operator Release Check</h4>
                    <p>Simulate yard security validation and physical handover:</p>
                    <button
                      type="button"
                      className="salvex-btn salvex-btn-success w-full"
                      onClick={handleSimulatePickup}
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirm Gate Exit & Clearance</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="salvex-btn salvex-btn-ghost w-full"
                  onClick={onNavigateDashboard}
                >
                  <span>Return to Bidder Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
