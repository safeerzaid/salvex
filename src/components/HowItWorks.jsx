import React from 'react';
import {
  ShieldCheck,
  Search,
  Gavel,
  Trophy,
  CreditCard,
  Truck
} from 'lucide-react';

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Register & Verify',
    description: 'Create account and complete quick online KYC verification.',
    icon: ShieldCheck
  },
  {
    number: '02',
    title: 'Discover & Inspect',
    description: 'Browse lots with comprehensive sample multi-point diagnostic reports.',
    icon: Search
  },
  {
    number: '03',
    title: 'Place Your Bid',
    description: 'Participate in live countdown auctions with real-time bidding controls.',
    icon: Gavel
  },
  {
    number: '04',
    title: 'Win the Auction',
    description: 'Secure highest bid victory with instant digital allotment confirmation.',
    icon: Trophy
  },
  {
    number: '05',
    title: 'Secure Settlement',
    description: 'Remit payments safely through secure settlement (demo).',
    icon: CreditCard
  },
  {
    number: '06',
    title: 'Vehicle Lifting',
    description: 'Collect your vehicle from regional yard with digital QR Gate Pass.',
    icon: Truck
  }
];

export default function HowItWorks({ steps = HOW_IT_WORKS_STEPS }) {
  // Use 6 steps and group into 3 rows of 2 for mobile responsiveness
  const activeSteps = (steps && steps.length === 6) ? steps.map((s, i) => ({
    ...s,
    icon: HOW_IT_WORKS_STEPS[i].icon
  })) : HOW_IT_WORKS_STEPS;

  const pairs = [
    [activeSteps[0], activeSteps[1]],
    [activeSteps[2], activeSteps[3]],
    [activeSteps[4], activeSteps[5]]
  ];

  return (
    <section className="salvex-section salvex-how-section" id="how-it-works">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle centered-sub">
            Simple and transparent process from registration to vehicle lifting.
          </p>
        </div>

        {/* 6-Step Visual Process */}
        <div className="steps-process-container">
          <div className="steps-connecting-bar" aria-hidden="true" />

          <div className="steps-grid steps-grid-6">
            {pairs.map((pair, pIdx) => (
              <div key={pIdx} className="steps-row-pair">
                <div className="steps-pair-line" aria-hidden="true" />
                {pair.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="step-card" id={`step-${step.number}`}>
                      <div className="step-icon-wrapper">
                        <div className="step-number-tag">{step.number}</div>
                        <div className="step-icon-circle">
                          <Icon size={21} strokeWidth={1.9} />
                        </div>
                      </div>

                      <div className="step-content">
                        <h3 className="step-title">{step.title}</h3>
                        <p className="step-description">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
