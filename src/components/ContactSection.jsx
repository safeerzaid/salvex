import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    subject: 'Bidder Registration Support',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        subject: 'Bidder Registration Support',
        message: ''
      });
      setTimeout(() => setIsSubmitted(false), 6000);
    }, 700);
  };

  const contactCards = [
    {
      icon: Phone,
      title: 'Phone Support',
      value: '+91 00000 00000',
      sub: 'Mon - Sat: 9:00 AM - 7:00 PM IST',
      actionUrl: 'tel:+910000000000',
      actionLabel: 'Call Now'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Desk',
      value: '+91 00000 00000',
      sub: 'Sample bidding alerts & catalogue updates',
      actionUrl: 'https://wa.me/910000000000',
      actionLabel: 'Chat on WhatsApp',
      isWhatsapp: true
    },
    {
      icon: Mail,
      title: 'Email Enquiries',
      value: 'demo@example.com',
      sub: 'Demo & platform inquiries',
      actionUrl: 'mailto:demo@example.com',
      actionLabel: 'Send Email'
    },
    {
      icon: MapPin,
      title: 'Office Address',
      value: 'Demo Operations Desk (Sample)',
      sub: 'Bandra Kurla Complex, Mumbai, MH (Demo Address)',
      actionUrl: '#',
      actionLabel: 'View on Maps'
    }
  ];

  return (
    <section className="salvex-section salvex-contact-section" id="contact">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="section-eyebrow">
            <span className="eyebrow-line" />
            <span>CONNECT WITH OUR AUCTION DESK</span>
            <span className="eyebrow-line" />
          </div>
          <h2 className="section-title">Get in Touch</h2>
          <p className="section-subtitle centered-sub">
            Have questions regarding bidder onboarding, security deposits, physical yard inspections, or listing a vehicle?
            Our dedicated client relations team is here to assist.
          </p>
        </div>

        <div className="contact-main-grid">
          {/* Left Column: Direct Contact Info Cards */}
          <div className="contact-info-column">
            <div className="contact-cards-stack">
              {contactCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="contact-card-item">
                    <div className="contact-card-icon-wrap">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <div className="contact-card-details">
                      <h4 className="contact-card-title">{item.title}</h4>
                      <div className="contact-card-value">{item.value}</div>
                      <p className="contact-card-sub">{item.sub}</p>
                      <a
                        href={item.actionUrl}
                        target={item.actionUrl.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        className="contact-card-link"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Operating Hours Box */}
            <div className="contact-hours-box">
              <Clock size={16} className="text-auction-red" />
              <div className="hours-text">
                <strong>Auction Floor Hours:</strong> Monday through Saturday, 09:30 AM to 06:30 PM.
                Physical vehicle inspection yards are open on prior appointment.
              </div>
            </div>
          </div>

          {/* Right Column: Clean Contact Form */}
          <div className="contact-form-column">
            <div className="contact-form-wrapper">
              <div className="form-header">
                <h3 className="form-heading">Send an Enquiry</h3>
                <p className="form-subheading">Fill out the form below and an auction coordinator will contact you within 2 business hours.</p>
              </div>

              {isSubmitted ? (
                <div className="form-success-box">
                  <CheckCircle2 size={36} className="success-icon" />
                  <h4 className="success-title">Enquiry Sent Successfully</h4>
                  <p className="success-msg">
                    Thank you, your enquiry has been routed to our specialized auction desk. A representative will reach out to your mobile shortly.
                  </p>
                </div>
              ) : (
                <form className="contact-clean-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-field-group">
                      <label htmlFor="contact-name" className="field-label">Full Name *</label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        placeholder="e.g. Vikram Singhania"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="field-input"
                      />
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="contact-email" className="field-label">Email Address *</label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        placeholder="demo@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="field-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field-group">
                      <label htmlFor="contact-mobile" className="field-label">Mobile Number *</label>
                      <input
                        id="contact-mobile"
                        type="tel"
                        required
                        placeholder="+91 00000 00000"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="field-input"
                      />
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="contact-subject" className="field-label">Subject / Interest</label>
                      <select
                        id="contact-subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="field-input field-select"
                      >
                        <option value="Bidder Registration Support">Bidder Registration Support</option>
                        <option value="Vehicle Inspection Yard Visit">Vehicle Inspection Yard Visit</option>
                        <option value="Selling / Consignment Inquiry">Selling / Consignment Inquiry</option>
                        <option value="Security Deposit & Settlement (Demo)">Security Deposit &amp; Settlement (Demo)</option>
                        <option value="Sample Bank Portfolio">Sample Bank Portfolio</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="contact-message" className="field-label">Message *</label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      placeholder="Please specify vehicle lot numbers, auction catalogs, or specific requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="field-input field-textarea"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full btn-large"
                    id="btn-submit-contact-enquiry"
                  >
                    <span>{isSubmitting ? 'Sending Enquiry...' : 'Send Enquiry'}</span>
                    <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
