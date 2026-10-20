import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Car,
  X,
  RotateCcw,
  Search
} from 'lucide-react';

export default function UpcomingAuctionsPage({
  auctions = [],
  onSetReminder,
  onViewVehicle
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedMake, setSelectedMake] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'All');
  const [remindedIds, setRemindedIds] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  const categoryOptions = [
    { id: 'All', label: 'All Lots' },
    { id: 'insurance', label: 'Insurance Auctions' },
    { id: 'bank-nbfc', label: 'Bank / NBFC Auctions' },
    { id: 'used-vehicle', label: 'Used Vehicle Auctions' },
    { id: 'used-spare-parts', label: 'Used Spare Parts' },
    { id: 'ready-to-lift', label: 'Ready to Lift' }
  ];

  const activeFilterCount = [
    selectedLocation !== 'All',
    selectedMake !== 'All',
    selectedCategory !== 'All',
    searchQuery.trim().length > 0
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('All');
    setSelectedMake('All');
    setSelectedCategory('All');
    searchParams.delete('category');
    setSearchParams(searchParams, { replace: true });
  };

  const filteredAuctions = useMemo(() => {
    return auctions.filter((auc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          auc.title?.toLowerCase().includes(q) ||
          auc.location?.toLowerCase().includes(q) ||
          auc.category?.toLowerCase().includes(q) ||
          auc.id?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedLocation !== 'All' && !auc.location?.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }
      if (selectedMake !== 'All' && !auc.title?.toLowerCase().includes(selectedMake.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== 'All' && auc.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [auctions, searchQuery, selectedLocation, selectedMake, selectedCategory]);

  const handleReminderToggle = (auc) => {
    const isReminded = remindedIds.includes(auc.id);
    if (isReminded) {
      setRemindedIds((prev) => prev.filter((id) => id !== auc.id));
      if (onSetReminder) onSetReminder(`Reminder removed for ${auc.title}`);
    } else {
      setRemindedIds((prev) => [...prev, auc.id]);
      if (onSetReminder) onSetReminder(`SMS & Email reminder set for ${auc.title} on ${auc.auctionDate}`);
    }
  };

  const formatCurrency = (amt) => {
    return '₹' + Number(amt || 0).toLocaleString('en-IN');
  };

  return (
    <div className="salvex-upcoming-auctions-page">
      {/* 01 HERO SECTION WITH BACKGROUND IMAGE */}
      <section className="upcoming-hero">
        <div className="upcoming-hero-backdrop" aria-hidden="true">
          <div className="upcoming-hero-ambient-glow" />
          <img
            src="https://i.pinimg.com/736x/cd/5e/64/cd5e646feb3b79cc1777857873fa18f6.jpg"
            alt="Upcoming Auctions Luxury Wheel"
            className="upcoming-hero-bg-img"
          />
          <div className="upcoming-hero-overlay" />
          <div className="upcoming-hero-top-vignette" />
          <div className="upcoming-hero-bottom-vignette" />
        </div>

        <div className="salvex-container upcoming-hero-content">
          <div className="upcoming-hero-inner">
            <div className="upcoming-hero-text">
              <h1 className="upcoming-title">Upcoming Auctions</h1>
              <p className="upcoming-desc">
                Explore scheduled vehicle lots from banks, insurance corporations, and fleet consignors. Register early to inspect in-yard and participate in bidding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 FILTERS BAR */}
      <section className="upcoming-filters-bar">
        <div className="salvex-container">
          {/* Quick Category Chips Row */}
          <div className="live-category-pills-row" style={{ marginBottom: '16px' }}>
            <span className="category-label">Category:</span>
            <div className="category-pills-scroll">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`live-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (cat.id === 'All') {
                      searchParams.delete('category');
                    } else {
                      searchParams.set('category', cat.id);
                    }
                    setSearchParams(searchParams, { replace: true });
                  }}
                  data-testid={`upcoming-category-tab-${cat.id}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Pill & Mobile Filter Trigger */}
          <div className="card-page-header-actions">
            <span className="card-page-stats-pill">
              Showing <strong>{filteredAuctions.length}</strong> of {auctions.length} Vehicles
            </span>
            <button
              type="button"
              className={`card-page-filter-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
              onClick={() => setMobileFilterOpen(true)}
              aria-label="Open Filters"
            >
              <Filter size={14} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge-count">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="card-page-search-bar">
            <div className="card-page-search-wrap">
              <Search size={16} className="card-page-search-icon" />
              <input
                type="text"
                placeholder="Search upcoming lots by make, model, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="card-page-search-input"
              />
            </div>
          </div>

          <div className="upcoming-filters-wrap">
            <div className="filter-group">
              <label>Location / Stockyard:</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="upcoming-select"
              >
                <option value="All">All Yard Hubs</option>
                <option value="Delhi">Delhi NCR Hub</option>
                <option value="Bengaluru">Bengaluru Hub</option>
                <option value="Mumbai">Mumbai Yard</option>
                <option value="Chennai">Chennai Hub</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Make:</label>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="upcoming-select"
              >
                <option value="All">All Makes</option>
                <option value="Mercedes">Mercedes-Benz</option>
                <option value="BMW">BMW</option>
                <option value="Audi">Audi</option>
                <option value="Porsche">Porsche</option>
                <option value="Land Rover">Land Rover</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="upcoming-select"
              >
                <option value="All">All Categories</option>
                <option value="Luxury SUVs">Luxury SUVs</option>
                <option value="Luxury Sedans">Luxury Sedans</option>
                <option value="Bank Repossession">Bank Repossession</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 03 UPCOMING LOTS GRID (SAME UI AS HOME PAGE) */}
      <section className="upcoming-grid-section">
        <div className="salvex-container">
          <div className="upcoming-reference-grid">
            {filteredAuctions.map((auc) => {
              const isReminded = remindedIds.includes(auc.id);
              return (
                <div key={auc.id} className="upcoming-ref-card" id={`upcoming-${auc.id}`}>
                  {/* Left Column: Image Thumbnail */}
                  <div className="upcoming-ref-img-wrap">
                    <img
                      src={auc.image || '/images/bmw-m4.jpg'}
                      alt={auc.title}
                      className="upcoming-ref-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/defender-110.jpg';
                      }}
                    />
                  </div>

                  {/* Right Column: Content */}
                  <div className="upcoming-ref-content">
                    {/* Top Badge */}
                    <div className="upcoming-ref-badge-row">
                      <span className="upcoming-ref-amber-badge">
                        {auc.statusBadge || 'UPCOMING'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="upcoming-ref-title" title={auc.title}>
                      {auc.title}
                    </h3>

                    {/* 2x2 Meta Details Grid */}
                    <div className="upcoming-ref-meta-grid">
                      <div className="upcoming-ref-meta-cell">
                        <Calendar size={13} className="upcoming-ref-red-icon" />
                        <span>{auc.date || auc.auctionDate || 'Scheduled'}</span>
                      </div>
                      <div className="upcoming-ref-meta-cell">
                        <Clock size={13} className="upcoming-ref-red-icon" />
                        <span>{auc.time || auc.auctionTime || '11:00 AM IST'}</span>
                      </div>
                      <div className="upcoming-ref-meta-cell">
                        <MapPin size={13} className="upcoming-ref-red-icon" />
                        <span className="truncate-text">{auc.location || 'Pan-India Yard'}</span>
                      </div>
                      <div className="upcoming-ref-meta-cell">
                        <Car size={13} className="upcoming-ref-red-icon" />
                        <span>{auc.vehiclesCount || 85} Vehicles</span>
                      </div>
                    </div>

                    {/* Bottom Action: View Auction → & Reminder */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-upcoming-ref-view"
                        style={{ flex: 1 }}
                        onClick={() => onViewVehicle ? onViewVehicle(auc) : onSetReminder && onSetReminder(`Viewing details for ${auc.title}`)}
                      >
                        <span>View Auction</span>
                        <ArrowRight size={14} className="btn-ref-arrow" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReminderToggle(auc)}
                        style={{
                          height: '40px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isReminded ? '1px solid #2563EB' : '1px solid #CBD5E1',
                          backgroundColor: isReminded ? '#EFF6FF' : '#FFFFFF',
                          color: isReminded ? '#2563EB' : '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                          marginTop: '4px'
                        }}
                        title={isReminded ? 'Reminder set' : 'Set reminder'}
                      >
                        {isReminded ? <CheckCircle2 size={14} color="#2563EB" /> : <Bell size={14} />}
                        <span>{isReminded ? 'Set' : 'Alert'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MOBILE FILTER MODAL SHEET */}
      {mobileFilterOpen && (
        <div className="mobile-filter-modal" role="dialog" aria-modal="true">
          <div
            className="mobile-filter-backdrop"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="mobile-filter-sheet">
            <div className="mobile-sheet-drag-handle" />
            <div className="mobile-sheet-header">
              <span className="mobile-sheet-title">
                <Filter size={16} color="#075BFF" />
                Filter Upcoming Auctions
                {activeFilterCount > 0 && (
                  <span className="filter-badge-count">{activeFilterCount}</span>
                )}
              </span>
              <button
                type="button"
                className="mobile-sheet-close-btn"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-content">
              {/* Location */}
              <div className="filter-group-block">
                <label className="filter-group-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Location / Stockyard</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="upcoming-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="All">All Yard Hubs</option>
                  <option value="Delhi">Delhi NCR Hub</option>
                  <option value="Bengaluru">Bengaluru Hub</option>
                  <option value="Mumbai">Mumbai Yard</option>
                  <option value="Chennai">Chennai Hub</option>
                </select>
              </div>

              {/* Make */}
              <div className="filter-group-block">
                <label className="filter-group-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Make</label>
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="upcoming-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="All">All Makes</option>
                  <option value="Mercedes">Mercedes-Benz</option>
                  <option value="BMW">BMW</option>
                  <option value="Audi">Audi</option>
                  <option value="Porsche">Porsche</option>
                  <option value="Land Rover">Land Rover</option>
                </select>
              </div>

              {/* Category */}
              <div className="filter-group-block">
                <label className="filter-group-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="upcoming-select"
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="All">All Categories</option>
                  <option value="Luxury SUVs">Luxury SUVs</option>
                  <option value="Luxury Sedans">Luxury Sedans</option>
                  <option value="Bank Repossession">Bank Repossession</option>
                </select>
              </div>
            </div>

            <div className="mobile-sheet-footer">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="filter-clear-all-btn"
                  style={{ padding: '0 14px', height: '46px', border: '1px solid #CBD5E1', borderRadius: '10px' }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              <button
                type="button"
                className="mobile-apply-btn"
                onClick={() => setMobileFilterOpen(false)}
              >
                Show {filteredAuctions.length} {filteredAuctions.length === 1 ? 'Auction' : 'Auctions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
