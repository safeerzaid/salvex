import React from 'react';
import SalvexLogo from './SalvexLogo';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Share2,
  Globe,
  Rss,
  Camera,
  BadgeCheck,
  Clock
} from 'lucide-react';

export default function Footer({ onNavigate, onOpenBidderModal, onOpenSellerModal }) {
  const year = new Date().getFullYear();

  return (
    <footer className="salvex-footer" id="main-footer" aria-label="Site footer">


      {/* MAIN FOOTER BODY */}
      <div className="footer-body">
        <div className="footer-inner-container">

          {/* GRID */}
          <div className="footer-grid-main">

            {/* Brand Column */}
            <div className="footer-col footer-col-brand">
              <button className="footer-brand-logo-btn" onClick={() => onNavigate('home')} aria-label="Homepage">
                <SalvexLogo variant="dark" size="normal" />
              </button>
              <p className="footer-brand-tagline">Online Vehicle Auction Platform</p>
              <p className="footer-brand-desc">
                Discover, inspect, bid on and purchase salvage, damaged, used, and fleet vehicles through India's most transparent auction platform.
              </p>
              <div className="footer-trust-stack">
                <div className="footer-trust-item">
                  <ShieldCheck size={14} className="footer-trust-icon" />
                  <span>Secure settlement (demo)</span>
                </div>
                <div className="footer-trust-item">
                  <BadgeCheck size={14} className="footer-trust-icon" />
                  <span>Verified KYC Bidder Process (Demo)</span>
                </div>
                <div className="footer-trust-item">
                  <Clock size={14} className="footer-trust-icon" />
                  <span>Demo environment</span>
                </div>
              </div>
              <div className="footer-social-row">
                <a href="#" className="footer-social-btn" aria-label="Twitter / X"><Share2 size={15} /></a>
                <a href="#" className="footer-social-btn" aria-label="LinkedIn"><Globe size={15} /></a>
                <a href="#" className="footer-social-btn" aria-label="YouTube"><Rss size={15} /></a>
                <a href="#" className="footer-social-btn footer-social-wa" aria-label="WhatsApp"><MessageCircle size={15} /></a>
                <a href="#" className="footer-social-btn" aria-label="Instagram"><Camera size={15} /></a>
              </div>
            </div>

            {/* Explore */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Explore</h4>
              <ul className="footer-nav-list">
                {[
                  ['All Vehicles', 'vehicles'],
                  ['Live Auctions', 'live-auctions'],
                  ['Upcoming Auctions', 'upcoming-auctions'],
                  ['Recently Added', 'recently-added'],
                  ['How It Works', 'how-it-works'],
                ].map(([label, route]) => (
                  <li key={route}>
                    <button className="footer-nav-link" onClick={() => onNavigate(route)}>
                      <ChevronRight size={13} className="footer-nav-chevron" />{label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Buyers */}
            <div className="footer-col">
              <h4 className="footer-col-heading">For Buyers</h4>
              <ul className="footer-nav-list">
                {[
                  ['Register as Bidder', 'register'],
                  ['Bidding Rules', 'bidding-rules'],
                  ['Payment & Settlement', 'payment'],
                  ['Vehicle Lifting', 'lifting'],
                  ['FAQ', 'faq'],
                ].map(([label, route]) => (
                  <li key={label}>
                    <button className="footer-nav-link" onClick={() => onNavigate(route)}>
                      <ChevronRight size={13} className="footer-nav-chevron" />{label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sellers */}
            <div className="footer-col">
              <h4 className="footer-col-heading">For Sellers</h4>
              <ul className="footer-nav-list">
                {[
                  ['List Your Vehicle', 'list-your-vehicle'],
                  ['Seller Dashboard', 'seller-dashboard'],
                  ['Consignor Overview', 'about'],
                  ['About Salvex', 'about'],
                  ['Contact Operations', 'contact'],
                ].map(([label, route]) => (
                  <li key={label}>
                    <button className="footer-nav-link" onClick={() => onNavigate(route)}>
                      <ChevronRight size={13} className="footer-nav-chevron" />{label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact + Legal */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Contact Us</h4>
              <div className="footer-contact-list">
                <a href="tel:+910000000000" className="footer-contact-item">
                  <span className="footer-contact-icon"><Phone size={13} /></span>
                  <span>+91 00000 00000</span>
                </a>
                <a href="mailto:demo@example.com" className="footer-contact-item">
                  <span className="footer-contact-icon"><Mail size={13} /></span>
                  <span>demo@example.com</span>
                </a>
                <a href="https://wa.me/910000000000" className="footer-contact-item">
                  <span className="footer-contact-icon footer-wa-icon"><MessageCircle size={13} /></span>
                  <span>WhatsApp Support</span>
                </a>
                <div className="footer-contact-item">
                  <span className="footer-contact-icon"><MapPin size={13} /></span>
                  <span>Mumbai, Maharashtra, India</span>
                </div>
              </div>

              <h4 className="footer-col-heading" style={{ marginTop: '28px' }}>Legal</h4>
              <ul className="footer-nav-list">
                {[
                  ['Privacy Policy', 'privacy-policy'],
                  ['Terms & Conditions', 'terms-and-conditions'],
                  ['Refund Policy', 'refund-policy'],
                  ['Auction Policy', 'auction-policy'],
                ].map(([label, route]) => (
                  <li key={route}>
                    <button className="footer-nav-link" onClick={() => onNavigate(route)}>
                      <ChevronRight size={13} className="footer-nav-chevron" />{label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="footer-bottom-bar">
            <div className="footer-bottom-left">
              <span>© {year} Salvex Auction (Demo Prototype). All rights reserved.</span>
            </div>
            <div className="footer-bottom-right">
              <span>Online Vehicle Auction Platform (Demo)</span>
              <span className="footer-bottom-sep">•</span>
              <span>Sample Institutional Liquidation Services</span>
              <button className="footer-admin-link" onClick={() => onNavigate('admin')}>
                Admin →
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

