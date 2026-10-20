import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  User,
  Clock,
  Send,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  FileText,
  Maximize2,
  Building2
} from 'lucide-react';
import './ContactPage.css';

export default function ContactPage({ onShowToast, onNavigate, onOpenRegister }) {
  const [formState, setFormState] = useState({
    fullName: '',
    mobile: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.subject) {
      if (onShowToast) onShowToast('Please select an enquiry subject');
      return;
    }

    setIsSubmitting(true);
    const newTicket = `SLX-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setTicketNumber(newTicket);
      setSubmitted(true);
      if (onShowToast) {
        onShowToast(`Enquiry submitted successfully! Reference: #${newTicket}`);
      }
    }, 600);
  };

  const handleQuickChannel = (type, val) => {
    if (type === 'phone') {
      window.location.href = `tel:${val.replace(/\s+/g, '')}`;
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/${val.replace(/[^0-9]/g, '')}?text=Hello%20Salvex%20Auction%20Support`, '_blank');
    } else if (type === 'email') {
      window.location.href = `mailto:${val}`;
    } else if (type === 'map') {
      window.open('https://maps.google.com/?q=Electronic+City+Bengaluru', '_blank');
    }
  };

  return (
    <div className="salvex-contact-page-v2">
      {/* 01. HERO SECTION (FULL-WIDTH CINEMATIC BACKGROUND) */}
      <section className="contact-v2-hero">
        <div className="contact-v2-hero-backdrop" aria-hidden="true">
          <img
            src="/images/hero-bg.jpg"
            alt="Salvex Auction Fleet"
            className="contact-v2-hero-bg-img"
            loading="eager"
          />
          <div className="contact-v2-hero-overlay" />
        </div>

        <div className="contact-v2-hero-container">
          <div className="contact-v2-hero-content">
            {/* Title */}

            {/* Title */}
            <h1 className="contact-v2-title">
              Contact <span className="contact-v2-title-red">Us</span>
            </h1>

            {/* Subtitle */}
            <p className="contact-v2-subtitle">
              We're here to help. Get in touch with our team for any queries, support or partnership opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* 02. FLOATING OVERLAP 4 CONTACT CARDS */}
      <section className="contact-v2-overlap-section">
        <div className="contact-v2-overlap-container">
          <div className="contact-v2-channels-grid">
            {/* 1. Phone */}
            <div
              className="contact-channel-card"
              onClick={() => handleQuickChannel('phone', '+91 00000 00000')}
              title="Click to call helpline"
            >
              <div className="channel-card-left">
                <div className="channel-icon-box icon-box-red">
                  <Phone size={20} />
                </div>
                <div className="channel-info">
                  <span className="channel-title">Phone</span>
                  <span className="channel-sub">Speak with our team</span>
                  <span className="channel-val">+91 00000 00000</span>
                </div>
              </div>
              <ChevronRight size={18} className="channel-chevron" />
            </div>

            {/* 2. WhatsApp */}
            <div
              className="contact-channel-card"
              onClick={() => handleQuickChannel('whatsapp', '+91 00000 00000')}
              title="Chat on WhatsApp"
            >
              <div className="channel-card-left">
                <div className="channel-icon-box icon-box-green">
                  <MessageCircle size={20} />
                </div>
                <div className="channel-info">
                  <span className="channel-title">WhatsApp</span>
                  <span className="channel-sub">Chat with us on WhatsApp</span>
                  <span className="channel-val">+91 00000 00000</span>
                </div>
              </div>
              <ChevronRight size={18} className="channel-chevron" />
            </div>

            {/* 3. Email */}
            <div
              className="contact-channel-card"
              onClick={() => handleQuickChannel('email', 'demo@example.com')}
              title="Send email"
            >
              <div className="channel-card-left">
                <div className="channel-icon-box icon-box-blue">
                  <Mail size={20} />
                </div>
                <div className="channel-info">
                  <span className="channel-title">Email</span>
                  <span className="channel-sub">Send us an email</span>
                  <span className="channel-val">demo@example.com</span>
                </div>
              </div>
              <ChevronRight size={18} className="channel-chevron" />
            </div>

            {/* 4. Office Address */}
            <div
              className="contact-channel-card"
              onClick={() => handleQuickChannel('map', '')}
              title="View on Google Maps"
            >
              <div className="channel-card-left">
                <div className="channel-icon-box icon-box-navy">
                  <MapPin size={20} />
                </div>
                <div className="channel-info">
                  <span className="channel-title">Office Address</span>
                  <span className="channel-sub">Visit our office</span>
                  <span className="channel-val">Electronic City, Bengaluru, KA</span>
                </div>
              </div>
              <ChevronRight size={18} className="channel-chevron" />
            </div>
          </div>
        </div>
      </section>

      {/* 03. MAIN BODY SECTION (FORM + MAP CARDS) */}
      <section className="contact-v2-main-section">
        <div className="contact-v2-main-container">
          <div className="contact-v2-split-grid">
            {/* LEFT: SEND US A MESSAGE FORM */}
            <div className="contact-v2-form-card">
              <h2 className="form-card-title">Send Us a Message</h2>
              <p className="form-card-subtitle">
                Fill out the form below and our team will get back to you shortly.
              </p>

              {submitted ? (
                <div className="form-card-success-v2">
                  <CheckCircle2 size={44} color="#16A34A" />
                  <h4>Message Sent Successfully</h4>
                  <p>
                    Thank you! Your inquiry (Ticket <strong>#{ticketNumber}</strong>) has been routed to our operations team. We will contact you within 4 business hours.
                  </p>
                  <button
                    type="button"
                    className="btn-reset-form-v2"
                    onClick={() => {
                      setSubmitted(false);
                      setFormState({
                        fullName: '',
                        mobile: '',
                        email: '',
                        subject: '',
                        message: ''
                      });
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-v2-form">
                  {/* Row 1: Full Name & Mobile */}
                  <div className="form-2col-row">
                    <div className="form-group-v2">
                      <label className="form-label-v2">
                        Full Name<span className="label-required">*</span>
                      </label>
                      <div className="input-with-icon-wrap">
                        <User size={17} className="input-prefix-icon" />
                        <input
                          type="text"
                          required
                          placeholder="Enter your full name"
                          className="form-input-v2"
                          value={formState.fullName}
                          onChange={(e) =>
                            setFormState({ ...formState, fullName: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group-v2">
                      <label className="form-label-v2">
                        Mobile Number<span className="label-required">*</span>
                      </label>
                      <div className="input-with-icon-wrap">
                        <Phone size={17} className="input-prefix-icon" />
                        <input
                          type="tel"
                          required
                          placeholder="Enter mobile number"
                          className="form-input-v2"
                          value={formState.mobile}
                          onChange={(e) =>
                            setFormState({ ...formState, mobile: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Email & Subject */}
                  <div className="form-2col-row">
                    <div className="form-group-v2">
                      <label className="form-label-v2">
                        Email Address<span className="label-required">*</span>
                      </label>
                      <div className="input-with-icon-wrap">
                        <Mail size={17} className="input-prefix-icon" />
                        <input
                          type="email"
                          required
                          placeholder="Enter your email address"
                          className="form-input-v2"
                          value={formState.email}
                          onChange={(e) =>
                            setFormState({ ...formState, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group-v2">
                      <label className="form-label-v2">
                        Subject<span className="label-required">*</span>
                      </label>
                      <div className="select-with-icon-wrap">
                        <select
                          required
                          className="form-select-v2"
                          value={formState.subject}
                          onChange={(e) =>
                            setFormState({ ...formState, subject: e.target.value })
                          }
                        >
                          <option value="" disabled>
                            Select a subject
                          </option>
                          <option value="General Auction Inquiry">
                            General Auction Inquiry
                          </option>
                          <option value="Bidder Registration & KYC">
                            Bidder Registration &amp; KYC
                          </option>
                          <option value="Institutional Consignment">
                            Institutional Consignment (Bank / NBFC / Fleet)
                          </option>
                          <option value="Settlement Payment Assistance (Demo)">
                            Settlement Payment Assistance (Demo)
                          </option>
                          <option value="Yard Lifting & Gate Pass">
                            Yard Lifting &amp; Gate Pass
                          </option>
                          <option value="Inspection Bay Booking">
                            Physical Inspection Bay Booking
                          </option>
                        </select>
                        <ChevronDown size={16} className="select-chevron-icon" />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Message Textarea */}
                  <div className="form-group-v2">
                    <label className="form-label-v2">
                      Message<span className="label-required">*</span>
                    </label>
                    <div className="textarea-with-icon-wrap">
                      <FileText size={17} className="textarea-prefix-icon" />
                      <textarea
                        required
                        rows={4}
                        placeholder="Write your message here..."
                        className="form-textarea-v2"
                        value={formState.message}
                        onChange={(e) =>
                          setFormState({ ...formState, message: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-send-enquiry-v2"
                  >
                    <div className="btn-left-content">
                      <Send size={16} />
                      <span>{isSubmitting ? 'Sending Enquiry...' : 'Send Enquiry'}</span>
                    </div>
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </div>

            {/* RIGHT: MAP & OUR OFFICE DETAILS */}
            <div className="contact-v2-office-card">
              {/* Map Illustration matching reference */}
              <div className="map-canvas-container">
                <svg
                  className="map-svg-canvas"
                  viewBox="0 0 540 250"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background terrain */}
                  <rect width="540" height="250" fill="#E8EEF5" />
                  
                  {/* Water / Coastline curve on left matching reference */}
                  <path
                    d="M0,0 L180,0 C160,80 190,140 210,250 L0,250 Z"
                    fill="#BAE6FD"
                  />
                  <text x="50" y="160" fill="#0284C7" fontSize="11" fontWeight="600" opacity="0.85">
                    Arabian Sea Coast
                  </text>

                  {/* Road Grid */}
                  <path d="M190,40 L540,90" stroke="#CBD5E1" strokeWidth="4" />
                  <path d="M220,120 L540,140" stroke="#F1F5F9" strokeWidth="6" />
                  <path d="M220,120 L540,140" stroke="#CBD5E1" strokeWidth="3" />
                  <path d="M270,0 L290,250" stroke="#F1F5F9" strokeWidth="8" />
                  <path d="M270,0 L290,250" stroke="#CBD5E1" strokeWidth="4" />
                  <path d="M420,0 L410,250" stroke="#F1F5F9" strokeWidth="6" />
                  <path d="M420,0 L410,250" stroke="#CBD5E1" strokeWidth="3" />
                  <path d="M180,210 L540,200" stroke="#CBD5E1" strokeWidth="3" />
                  <path d="M340,60 L540,30" stroke="#E2E8F0" strokeWidth="2" />
                  <path d="M310,180 L540,240" stroke="#E2E8F0" strokeWidth="2" />

                  {/* Highway route lines (yellow/orange accents) */}
                  <path d="M270,40 L440,110" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
                  <path d="M280,130 L380,220" stroke="#FED7AA" strokeWidth="3" strokeLinecap="round" />

                  {/* Area label tags */}
                  <circle cx="280" cy="140" r="4" fill="#0284C7" />
                  <text x="290" y="144" fill="#64748B" fontSize="9" fontWeight="600">
                    City Center
                  </text>

                  <circle cx="430" cy="80" r="4" fill="#64748B" />
                  <text x="440" y="84" fill="#64748B" fontSize="9" fontWeight="600">
                    Industrial Area
                  </text>
                </svg>

                {/* Centered Map Marker Tooltip Box */}
                <div className="map-marker-pin-wrap">
                  <div className="map-popup-card">
                    <MapPin size={22} className="popup-red-pin" />
                    <div className="popup-info">
                      <h5>Salvex Auction (Demo Hub)</h5>
                      <p>Demo Operations Hub, Bengaluru, Karnataka (Sample Address)</p>
                      <a
                        href="https://maps.google.com/?q=Electronic+City+Bengaluru"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="popup-dir-link"
                      >
                        <span>Get Directions</span>
                        <ArrowRight size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Maximize map button */}
                <button
                  type="button"
                  className="map-expand-btn"
                  title="Expand Map"
                  onClick={() =>
                    window.open('https://maps.google.com/?q=Electronic+City+Bengaluru', '_blank')
                  }
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              {/* Office Details Text & Hours below map */}
              <div className="office-details-box">
                <h4 className="office-heading">Our Office (Demo Location)</h4>
                <p className="office-address-p">
                  Demo Operations Hub, Bengaluru, Karnataka, India (Sample Address)
                </p>

                <div className="office-hours-grid">
                  {/* Hours */}
                  <div className="office-hour-item">
                    <div className="hour-icon-wrap">
                      <Clock size={18} />
                    </div>
                    <div className="hour-content">
                      <h6>Working Hours</h6>
                      <p>Mon - Sat, 9:00 AM - 6:00 PM<br />(Sunday Holiday)</p>
                    </div>
                  </div>

                  {/* Branch Visits */}
                  <div className="office-hour-item">
                    <div className="hour-icon-wrap">
                      <Building2 size={18} />
                    </div>
                    <div className="hour-content">
                      <h6>Branch / Yard Visits</h6>
                      <p>Please contact us in advance to schedule a physical yard inspection visit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
