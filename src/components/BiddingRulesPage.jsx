import React from 'react';
import {
  Gavel,
  ShieldAlert,
  Clock,
  Ban,
  CalendarCheck,
  Search,
  FileText,
  Truck,
  Receipt,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function BiddingRulesPage({ onRegisterClick }) {
  const rules = [
    {
      id: 'starting-bid',
      title: '1. Starting Bid & Reserve Price',
      icon: Gavel,
      content:
        'Every vehicle lot published on Salvex Auction has an established starting bid set in consultation with the consigning bank, insurer, or vehicle owner. If a confidential reserve price is attached, the lot will not be awarded unless the winning bid equals or exceeds that benchmark.'
    },
    {
      id: 'bid-increment',
      title: '2. Minimum Bid Increment Table',
      icon: Clock,
      content:
        'To prevent micro-bidding delays, all live counter-bids must adhere to the standardized increment table below:',
      hasTable: true
    },
    {
      id: 'closing-time',
      title: '3. Auction Closing Time & Dynamic Overtime (Anti-Sniping)',
      icon: Clock,
      content:
        'Auctions terminate precisely at the posted countdown deadline. However, to eliminate last-second sniping software, any verified bid submitted in the final 60 seconds of a lot automatically extends the clock by 120 seconds. This process repeats until no further bids occur for a full 2-minute cycle.'
    },
    {
      id: 'cancellation',
      title: '4. Bid Cancellation & Irrevocability Policy',
      icon: Ban,
      content:
        'Platform Demo: Bids placed during demo mode are simulated sample offers. In production, bids cannot be canceled, withdrawn, or amended downwards once registered. Bidders are advised to verify vehicle inspection reports prior to bidding.'
    },
    {
      id: 'payment-deadline',
      title: '5. Payment Deadlines & Settlement Remittance (Demo)',
      icon: CalendarCheck,
      content:
        'Winning bidders must deposit a mandatory 10% Earnest Money Deposit (EMD) within 24 hours of auction close. The remaining 90% balance, together with buyer’s premium and statutory GST, must be remitted within 48 hours via RTGS/NEFT to the designated institutional settlement account.'
    },
    {
      id: 'inspection',
      title: '6. Vehicle Inspection & "As-Is, Where-Is" Terms',
      icon: Search,
      content:
        'All salvage, damaged, and repossessed auction lots are auctioned strictly on an "As-Is, Where-Is" basis with all faults and damage. While Salvex displays sample multi-point inspection checklists and defect photography, bidders are encouraged to perform physical yard inspections during authorized pre-auction windows.'
    },
    {
      id: 'purchase-terms',
      title: '7. Vehicle Purchase Terms & Title Transfer',
      icon: FileText,
      content:
        'Title transfer documents (RTO Form 29, 30, Bank NOC, Insurance Endorsements) are processed following full financial clearance. The buyer assumes all post-sale statutory transfer responsibilities and road tax compliances within the jurisdiction.'
    },
    {
      id: 'lifting',
      title: '8. Vehicle Lifting & Yard Storage Guidelines',
      icon: Truck,
      content:
        'Winning bidders receive 5 business days of complimentary holding storage at our regional logistics yard starting from payment clearance. Digital QR Gate Passes are issued upon payment validation. Vehicles not lifted within 5 business days incur yard storage demurrage of ₹500 per calendar day.'
    },
    {
      id: 'charges',
      title: '9. Applicable Fees & Charges Schedule',
      icon: Receipt,
      content:
        'Standard commercial transaction charges applicable across all auction purchases:',
      hasChargesTable: true
    }
  ];

  return (
    <div className="salvex-bidding-rules-page">
      {/* 01 HERO */}
      <section className="rules-hero">
        <div className="salvex-container">
          <div className="rules-hero-inner">
            <span className="rules-pill">
              <ShieldAlert size={14} />
              OFFICIAL BYLAWS & OPERATIONAL GUIDELINES
            </span>
            <h1 className="rules-title">Bidding Rules & Regulations</h1>
            <p className="rules-subtitle">
              Comprehensive guidelines governing participant eligibility, live auction increments, escrow settlements, and vehicle handover across the Salvex Auction marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* 02 MAIN RULES CONTENT */}
      <section className="rules-body-section">
        <div className="salvex-container">
          <div className="rules-content-layout">
            <div className="rules-main-column">
              {rules.map((rule) => {
                const IconComponent = rule.icon;
                return (
                  <div key={rule.id} id={rule.id} className="rule-card">
                    <div className="rule-card-header">
                      <div className="rule-icon-box">
                        <IconComponent size={20} />
                      </div>
                      <h2 className="rule-heading">{rule.title}</h2>
                    </div>

                    <p className="rule-text">{rule.content}</p>

                    {/* Table: Minimum Bid Increments */}
                    {rule.hasTable && (
                      <div className="rule-table-container">
                        <table className="rule-data-table">
                          <thead>
                            <tr>
                              <th>Current Bid Value Bracket</th>
                              <th>Mandatory Minimum Increment</th>
                              <th>Anti-Sniping Buffer</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>₹1,00,000 – ₹10,00,000</td>
                              <td><strong>₹25,000</strong></td>
                              <td>60 Seconds</td>
                            </tr>
                            <tr>
                              <td>₹10,00,001 – ₹50,00,000</td>
                              <td><strong>₹50,000</strong></td>
                              <td>60 Seconds</td>
                            </tr>
                            <tr>
                              <td>₹50,00,001 – ₹2,00,00,000</td>
                              <td><strong>₹1,00,000</strong></td>
                              <td>120 Seconds</td>
                            </tr>
                            <tr>
                              <td>Above ₹2,00,00,000 (Exotics & Commercial)</td>
                              <td><strong>₹2,00,000</strong></td>
                              <td>120 Seconds</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Table: Applicable Charges */}
                    {rule.hasChargesTable && (
                      <div className="rule-table-container">
                        <table className="rule-data-table">
                          <thead>
                            <tr>
                              <th>Fee Item</th>
                              <th>Applicable Rate</th>
                              <th>Levied By</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Buyer's Premium (Success Fee)</td>
                              <td><strong>2.5% of Winning Bid</strong></td>
                              <td>Salvex Auction Platform</td>
                            </tr>
                            <tr>
                              <td>Yard Logistics & Gate Pass Fee</td>
                              <td><strong>₹15,000 – ₹25,000</strong> (Lot specific)</td>
                              <td>Regional Stockyard Operator</td>
                            </tr>
                            <tr>
                              <td>Goods & Services Tax (GST)</td>
                              <td><strong>18%</strong> on Platform & Yard Fees only</td>
                              <td>Statutory Requirement (Govt. of India)</td>
                            </tr>
                            <tr>
                              <td>Post-Deadline Storage Demurrage</td>
                              <td><strong>₹500 / day</strong> (Post 5 days free)</td>
                              <td>Holding Yard Facility</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Sticky Summary Sidebar */}
            <aside className="rules-sidebar">
              <div className="rules-summary-card">
                <div className="summary-badge">
                  <CheckCircle2 size={16} />
                  <span>Bidder Checklist</span>
                </div>
                <h3>Quick Reference</h3>
                <ul className="rules-quick-list">
                  <li><strong>KYC:</strong> PAN & ID verification mandatory before bidding.</li>
                  <li><strong>Bids:</strong> Non-cancellable legally binding contracts.</li>
                  <li><strong>EMD:</strong> 10% payable within 24h of winning lot.</li>
                  <li><strong>Balance:</strong> 90% payable within 48h to Escrow.</li>
                  <li><strong>Lifting:</strong> 5 business days complimentary yard storage.</li>
                </ul>

                <button
                  type="button"
                  className="salvex-btn salvex-btn-primary w-full"
                  onClick={onRegisterClick}
                >
                  <span>Register as Bidder</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="rules-disclaimer-box">
                <AlertTriangle size={18} className="text-warning" />
                <p>
                  <strong>Disclaimer:</strong> Specific consignor lots (e.g. Court Liquidation, Special NBFC portfolios) may carry tailored supplementary conditions posted in the lot inspection documents.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
