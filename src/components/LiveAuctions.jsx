import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import VehicleCard from './VehicleCard';

export default function LiveAuctions({
  vehicles,
  onPlaceBid,
  onViewDetails,
  savedIds = [],
  onToggleSave,
  onViewAllLive
}) {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [vehicles]);

  const handleScrollLeft = () => {
    if (sliderRef.current) {
      const card = sliderRef.current.querySelector('.live-slider-card');
      const scrollStep = card ? card.offsetWidth + 24 : sliderRef.current.clientWidth / 3;
      sliderRef.current.scrollBy({ left: -scrollStep, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (sliderRef.current) {
      const card = sliderRef.current.querySelector('.live-slider-card');
      const scrollStep = card ? card.offsetWidth + 24 : sliderRef.current.clientWidth / 3;
      sliderRef.current.scrollBy({ left: scrollStep, behavior: 'smooth' });
    }
  };

  return (
    <section className="salvex-section salvex-live-section" id="live-auctions">
      <div className="section-container">
        {/* Section Header Centered */}
        <div className="section-header-centered">
          <h2 className="section-title">Live Auctions</h2>
          <p className="section-subtitle centered-sub">
            Explore vehicles currently available for live bidding in real time.
          </p>
        </div>

        {/* 1-Row Live Auctions Slider with Prev / Next Arrow Controls */}
        <div className="live-slider-container">
          {/* Left Navigation Arrow */}
          <button
            type="button"
            className={`live-slider-arrow live-slider-arrow-prev ${!canScrollLeft ? 'arrow-dimmed' : ''}`}
            onClick={handleScrollLeft}
            aria-label="Previous vehicles"
            id="live-slider-prev-btn"
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>

          {/* Slider Horizontal Track */}
          <div className="live-slider-track" ref={sliderRef}>
            {vehicles.map((vehicle) => {
              const isSaved = savedIds.includes(vehicle.id);
              return (
                <div key={vehicle.id} className="live-slider-card">
                  <VehicleCard
                    vehicle={vehicle}
                    isSaved={isSaved}
                    onToggleSave={onToggleSave}
                    onViewDetails={onViewDetails}
                    onPlaceBid={onPlaceBid}
                  />
                </div>
              );
            })}
          </div>

          {/* Right Navigation Arrow */}
          <button
            type="button"
            className={`live-slider-arrow live-slider-arrow-next ${!canScrollRight ? 'arrow-dimmed' : ''}`}
            onClick={handleScrollRight}
            aria-label="Next vehicles"
            id="live-slider-next-btn"
          >
            <ChevronRight size={22} strokeWidth={2.4} />
          </button>
        </div>

        {/* Bottom Centered Action Button below cards */}
        <div className="live-bottom-action-wrap">
          <button
            type="button"
            className="btn-view-all-live-cta"
            onClick={onViewAllLive}
            id="btn-view-all-live-auctions"
          >
            <span>View All Live Auctions</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
