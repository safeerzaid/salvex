import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Gavel,
  Car,
  Building2,
  Users,
  Award,
  Layers,
  FileCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Banknote
} from 'lucide-react';
import './AboutPage.css';

export default function AboutPage({ onExploreClick, onRegisterClick }) {
  const stats = [
    {
      value: '10K+ (sample)',
      label: 'Vehicles Auctioned',
      sub: 'Projected transactions across India'
    },
    {
      value: '5K+ (sample)',
      label: 'Registered Bidders',
      sub: 'Dealers, rebuilders & retail buyers'
    },
    {
      value: '98% (sample)',
      label: 'Successful Settlement',
      sub: 'Secure settlement framework'
    },
    {
      value: '50+ (sample)',
      label: 'Inspection Hubs',
      sub: 'Planned regional yard facilities'
    }
  ];


  const assetCategories = [
    {
      num: '01',
      title: 'Salvage Vehicles',
      desc: 'Insurance total-loss and accident recovery vehicles ideal for certified rebuilders, dismantlers, and component recyclers.',
      icon: Car
    },
    {
      num: '02',
      title: 'Damaged Vehicles',
      desc: 'Mechanically sound or repairable body-damage lots with comprehensive 150-point diagnostic damage reports.',
      icon: FileCheck
    },
    {
      num: '03',
      title: 'Used Vehicles',
      desc: 'Clean-title, inspected pre-owned passenger and commercial fleets ready for immediate road use and RTO title transfer.',
      icon: CheckCircle2
    },
    {
      num: '04',
      title: 'Auction Vehicles',
      desc: 'Bank repossessions, institutional fleet roll-offs, and luxury exotics auctioned under competitive bidding timelines.',
      icon: Gavel
    }
  ];

  return (
    <div className="salvex-about-page">
      {/* 01 SPLIT-LAYOUT ABOUT HERO */}
      <section className="about-hero-clean">
        <div className="about-max-container">
          <div className="about-hero-split-grid">
            
            {/* LEFT COLUMN: Headings & Conversion CTAs */}
            <div className="about-hero-left">
              <h1 className="about-headline">
                Making Vehicle Auctions <span className="text-highlight">Simple, Transparent</span> & Accessible.
              </h1>

              <p className="about-supporting-text">
                Salvex Auction is an online vehicle auction platform designed to make the process of discovering, bidding, and purchasing vehicles simple, transparent, and convenient.
              </p>

              {/* CTAs */}
              <div className="about-cta-row">
                <button
                  type="button"
                  className="btn-about-primary"
                  onClick={onExploreClick}
                >
                  <span>Explore Live Auctions</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="btn-about-secondary"
                  onClick={onRegisterClick}
                >
                  <span>Register as Bidder</span>
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: Single Premium Automotive Image */}
            <div className="about-hero-right">
              <div className="about-visual-canvas">
                
                {/* Single Premium Vehicle Showcase Card */}
                <div className="about-single-image-card">
                  <img
                    src="https://i.pinimg.com/736x/8e/f5/c5/8ef5c5059bc189b20b3e6ef4f4cfbb98.jpg"
                    alt="Salvex Auction - Verified Inventory"
                    className="about-single-img"
                    loading="eager"
                  />
                  <div className="about-single-overlay" />

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 02 TRUST / STATISTICS SECTION (Wide Horizontal Card) */}
      <section className="about-stats-section">
        <div className="about-max-container">
          <div className="about-stats-card">
            <div className="about-stats-grid">
              {stats.map((stat, idx) => (
                <div key={idx} className="about-stat-item">
                  <div className="about-stat-value">{stat.value}</div>
                  <div className="about-stat-label">{stat.label}</div>
                  <div className="about-stat-sub">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 03 THE MARKETPLACE BRIDGE & INVENTORY SOURCING */}
      <section className="about-bridge-section">
        <div className="about-max-container">
          <div className="about-bridge-grid">
            
            {/* Card 1: Who We Connect */}
            <div className="about-bridge-card">
              <span className="bridge-category-badge">THE MARKETPLACE BRIDGE</span>
              <h2>Who We Connect</h2>
              <p className="bridge-lead-desc">
                Salvex Auction operates an enterprise-grade digital exchange bringing together verified market participants in an authenticated, regulated bidding environment:
              </p>
              <ul className="bridge-bullet-list">
                <li>
                  <strong>Vehicle Owners & Individual Consignors:</strong> Access liquid national buyer demand without middlemen delays or price erosion.
                </li>
                <li>
                  <strong>Automotive Dealers & Fleet Operators:</strong> Efficiently procure high-yield commercial and passenger vehicle stock with verifiable title trails.
                </li>
                <li>
                  <strong>Independent Buyers & Rebuilders:</strong> Acquire salvage, project, and clear-title used vehicles with detailed diagnostic condition checklists.
                </li>
                <li>
                  <strong>Professional Bidders:</strong> Participate in scheduled live auctions with anti-sniping protection and auction terminal controls.
                </li>
              </ul>
            </div>

            {/* Card 2: Our Inventory Sources */}
            <div className="about-bridge-card">
              <span className="bridge-category-badge">DIRECT ASSET SOURCING</span>
              <h2>Our Inventory Sources</h2>
              <p className="bridge-lead-desc">
                Our auction lots are sourced directly through institutional relationships, ensuring title legitimacy, lawful repossession documentation, and clean settlement procedures:
              </p>
              <ul className="bridge-bullet-list">
                <li>
                  <strong>Scheduled Commercial Banks:</strong> Court-authorized loan repossession and asset recovery portfolios.
                </li>
                <li>
                  <strong>Non-Banking Financial Companies (NBFCs):</strong> Corporate lease returns, commercial vehicle portfolios, and inventory liquidations.
                </li>
                <li>
                  <strong>General Insurance Companies:</strong> Constructive total loss (CTL), salvage recoveries, and theft-recovered vehicles.
                </li>
                <li>
                  <strong>Corporate Fleets & Verified Consumers:</strong> High-grade pre-owned vehicles with complete digital service history.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 04 CORE ASSET FOCUS (4-COLUMN GRID) */}
      <section className="about-focus-section-clean">
        <div className="about-max-container">
          <div className="about-section-header-center">
            <span className="clean-subhead-pill">MARKETPLACE SPECTRUM</span>
            <h2>Our Core Asset Focus</h2>
            <p className="clean-section-subtext">
              We specialize across distinct automotive asset classes to provide tailored bidding opportunities for every category of commercial buyer.
            </p>
          </div>

          <div className="about-focus-4col-grid">
            {assetCategories.map((cat, idx) => {
              const IconComponent = cat.icon;
              return (
                <div key={idx} className="about-focus-card">
                  <div className="focus-card-top">
                    <span className="focus-badge-number">{cat.num}</span>
                    <div className="focus-icon-circle">
                      <IconComponent size={20} />
                    </div>
                  </div>
                  <h3>{cat.title}</h3>
                  <p>{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 05 WHAT WE OFFER & OUR APPROACH */}
      <section className="about-offer-section-clean">
        <div className="about-max-container">
          <div className="about-offer-split-card">
            
            {/* Left: What We Offer */}
            <div className="offer-side-col">
              <h2>What We Offer</h2>
              <div className="offer-checklist-grid">
                {[
                  'Online Vehicle Auctions',
                  'Salvage & Damaged Vehicle Listings',
                  'Used Vehicle Fleet Auctions',
                  'Transparent Real-Time Bidding',
                  'Multi-Point Yard Inspection Reports (Sample)',
                  'Online KYC Verification (Demo)',
                  'Live & Scheduled Bidding Timelines',
                  'Secure settlement (demo)'
                ].map((item, i) => (
                  <div key={i} className="offer-check-pill">
                    <CheckCircle2 size={16} className="text-accent-blue" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Our Approach */}
            <div className="approach-side-col">
              <h2>Our Approach</h2>
              <p>
                Traditional automotive auctions have historically been fragmented, regional, and opaque. Our approach is to make vehicle auctions more accessible, transparent, and legally sound through a modern digital auction experience.
              </p>
              <p>
                By digitizing vehicle inspection frameworks, verifying bidder identities, and providing structured settlement processes, we empower buyers with dependable vehicle clarity.
              </p>

              <div className="approach-button-group">
                <button
                  type="button"
                  className="btn-approach-primary"
                  onClick={onRegisterClick}
                >
                  <span>Register as Bidder</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  className="btn-approach-secondary"
                  onClick={onExploreClick}
                >
                  <span>Browse Vehicles</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
