import React, { useState, useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SearchPanel from './components/SearchPanel';
import LiveAuctions from './components/LiveAuctions';
import UpcomingAuctions from './components/UpcomingAuctions';
import HowItWorks from './components/HowItWorks';
import RecentlyAddedVehicles from './components/RecentlyAddedVehicles';
import WhySalvex from './components/WhySalvex';
import AboutSection from './components/AboutSection';
import BuyerCta from './components/BuyerCta';
import Footer from './components/Footer';

// Dedicated Standalone Pages
import VehiclesPage from './components/VehiclesPage';
import VehicleDetailsPage from './components/VehicleDetailsPage';
import LiveAuctionsPage from './components/LiveAuctionsPage';
import UpcomingAuctionsPage from './components/UpcomingAuctionsPage';
import RecentlyAddedPage from './components/RecentlyAddedPage';
import HowItWorksPage from './components/HowItWorksPage';
import BiddingRulesPage from './components/BiddingRulesPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import FaqPage from './components/FaqPage';
import LegalPage from './components/LegalPage';
import ReadyToLiftPage from './components/ReadyToLiftPage';
import InsuranceServicePage from './components/services/InsuranceServicePage';
import RecoveryServicePage from './components/services/RecoveryServicePage';
import DocumentationServicePage from './components/services/DocumentationServicePage';

// Authentication & Seller Onboarding Pages
import LoginPage from './components/LoginPage';
import ListVehiclePage from './components/ListVehiclePage';

// Operational & User Workflow Portals
import BidderDashboard from './components/BidderDashboard';
import PaymentPage from './components/PaymentPage';
import VehicleLiftingPage from './components/VehicleLiftingPage';
import SellerDashboard from './components/SellerDashboard';
import AdminPanel from './components/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

// Interactive Modals
import BidModal from './components/BidModal';
import VehicleModal from './components/VehicleModal';
import RegisterModal from './components/RegisterModal';
import ListVehicleModal from './components/ListVehicleModal';
import SavedModal from './components/SavedModal';
import SearchModal from './components/SearchModal';

// Mock Data
import {
  liveVehiclesData,
  upcomingAuctionsData,
  recentlyAddedVehiclesData,
  howItWorksSteps,
  whySalvexFeatures
} from './data/mockVehicles';

import './App.css';
import './components/SalvexAppComponents.css';
import { useScrollAnimations } from './hooks/useScrollAnimations';
import PageLoader from './components/ui/PageLoader';
import { resetScrollToTop } from './utils/scrollHelper';

// Central Route-ID to URL Path Map
export const ROUTE_MAP = {
  home: '/',
  vehicles: '/vehicles',
  'vehicle-details': '/vehicles/:id',
  'live-auctions': '/auctions/live',
  'upcoming-auctions': '/auctions/upcoming',
  'recently-added': '/vehicles/recent',
  'ready-to-lift': '/ready-to-lift',
  'service-insurance': '/services/insurance',
  'service-recovery': '/services/recovery',
  'service-documentation': '/services/documentation',
  'how-it-works': '/how-it-works',
  'bidding-rules': '/bidding-rules',
  about: '/about',
  contact: '/contact',
  faq: '/faq',
  'privacy-policy': '/legal/privacy',
  'terms-and-conditions': '/legal/terms',
  'refund-policy': '/legal/refund',
  'auction-policy': '/legal/auction',
  legal: '/legal',
  login: '/login',
  register: '/login',
  'list-your-vehicle': '/sell',
  dashboard: '/dashboard',
  payment: '/payment/:lotId',
  lifting: '/lifting/:lotId',
  'seller-dashboard': '/seller/dashboard',
  admin: '/admin'
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPreloader, setShowPreloader] = useState(true);
  const [liveVehicles, setLiveVehicles] = useState(liveVehiclesData);
  const [savedIds, setSavedIds] = useState(['salvex-101', 'salvex-103']);

  // GSAP ScrollTrigger smooth premium scroll enhancements (keyed to location.pathname)
  useScrollAnimations(location.pathname);

  // Global Route Navigation Scroll-to-Top: runs on every route change
  useLayoutEffect(() => {
    resetScrollToTop();
  }, [location.pathname]);

  // Derive activeSection for Navbar from current pathname
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/auctions')) return 'auctions';
    if (path.startsWith('/ready-to-lift')) return 'ready-to-lift';
    if (path.startsWith('/services')) return 'services';
    if (path === '/sell') return 'services';
    if (path === '/vehicles/recent') return 'vehicles';
    if (path.startsWith('/vehicles')) return 'vehicles';
    if (path.startsWith('/how-it-works')) return 'how-it-works';
    if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/contact')) return 'contact';
    return '';
  };

  // Search Filter state for home quick panel
  const [searchTab, setSearchTab] = useState('search');
  const [searchFilters, setSearchFilters] = useState({
    make: 'All Makes',
    vehicleType: 'All Types',
    location: 'All Locations',
    year: 'Any Year',
    priceRange: 'Any Price'
  });

  // Modal visibility states
  const [selectedBidVehicle, setSelectedBidVehicle] = useState(null);
  const [selectedDetailVehicle, setSelectedDetailVehicle] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSellerOpen, setIsSellerOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Central Router Dispatcher maintaining identical callback signature
  const navigateTo = (route, params = null) => {
    if (route === 'vehicle-details' && params?.vehicle?.id) {
      navigate(`/vehicles/${params.vehicle.id}`);
      return;
    }
    if (route === 'payment' && params?.lotId) {
      navigate(`/payment/${params.lotId}`);
      return;
    }
    if (route === 'lifting' && params?.lotId) {
      navigate(`/lifting/${params.lotId}`);
      return;
    }

    if (route && (route.startsWith('/') || route.includes('?'))) {
      navigate(route);
      return;
    }

    const path = ROUTE_MAP[route] || '/';
    navigate(path);
  };

  // Watchlist Toggle
  const handleToggleSave = (vehicleId) => {
    setSavedIds((prev) => {
      const exists = prev.includes(vehicleId);
      if (exists) {
        showToast('Vehicle removed from watchlist');
        return prev.filter((id) => id !== vehicleId);
      } else {
        showToast('Vehicle saved to your watchlist');
        return [...prev, vehicleId];
      }
    });
  };

  // Live Bid Execution
  const handleConfirmBid = (vehicleId, newBidAmount) => {
    setLiveVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            currentBid: newBidAmount,
            bidCount: (v.bidCount || 0) + 1
          };
        }
        return v;
      })
    );
    showToast(`Bid confirmed: ₹${newBidAmount.toLocaleString('en-IN')}`);
  };

  // Admin Overtime Extension (+120s)
  const handleExtendLot = (lotId, extraSeconds = 120) => {
    setLiveVehicles((prev) =>
      prev.map((lot) =>
        lot.id === lotId
          ? { ...lot, endsInSeconds: Math.max(0, (lot.endsInSeconds || 0) + extraSeconds) }
          : lot
      )
    );
  };

  // Open Vehicle Details View
  const handleViewVehicleDetails = (vehicle) => {
    if (vehicle?.id) {
      navigate(`/vehicles/${vehicle.id}`);
    }
  };

  const savedVehiclesList = liveVehicles.filter((v) => savedIds.includes(v.id));

  return (
    <div className="salvex-app-root">
      {/* 00 PREMIUM BRANDED PRELOADER */}
      {showPreloader && (
        <PageLoader onLoadingComplete={() => setShowPreloader(false)} />
      )}

      {/* 01 MAIN TWO-ROW NAVBAR */}
      <Navbar
        activeSection={getActiveSection()}
        onNavigate={(routeId) => navigateTo(routeId)}
        onOpenBidderModal={() => navigateTo('login')}
        onOpenSellerModal={() => navigateTo('list-your-vehicle')}
        onOpenSearchModal={() => setIsSearchOpen(true)}
        onSearchSubmitQuery={(query) => {
          navigateTo('vehicles');
          showToast(`Searching marketplace for: "${query || 'All inventory'}"`);
        }}
        savedCount={savedIds.length}
        onOpenSavedModal={() => setIsSavedOpen(true)}
      />

      {/* 02 ROUTING VIEW CONTAINER */}
      <main className="salvex-main-route-outlet" id="main-content">
        <Routes>
          {/* ROUTE 01: HOME PAGE */}
          <Route
            path="/"
            element={
              <div className="salvex-home-view">
                <Hero
                  onSearchClick={() => {
                    const el = document.getElementById('auction-search-panel');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onLiveAuctionsClick={() => navigateTo('live-auctions')}
                />

                <SearchPanel
                  activeTab={searchTab}
                  onTabChange={setSearchTab}
                  filters={searchFilters}
                  onFilterChange={(k, v) => setSearchFilters((prev) => ({ ...prev, [k]: v }))}
                  onSearch={(filters, tab) => {
                    if (tab === 'upcoming') {
                      navigateTo('upcoming-auctions');
                    } else {
                      navigateTo('live-auctions');
                    }
                    showToast(`Filtering inventory for ${filters.vehicleType}...`);
                  }}
                />

                <LiveAuctions
                  vehicles={liveVehicles}
                  onPlaceBid={(v) => setSelectedBidVehicle(v)}
                  onViewDetails={(v) => handleViewVehicleDetails(v)}
                  savedIds={savedIds}
                  onToggleSave={handleToggleSave}
                  onViewAllLive={() => navigateTo('live-auctions')}
                />

                <UpcomingAuctions
                  auctions={upcomingAuctionsData}
                  onViewAuction={() => navigateTo('upcoming-auctions')}
                  onRegisterInterest={(auc) => {
                    showToast(`Sign in or register to bid on ${auc.title}`);
                    navigateTo('login');
                  }}
                />

                <RecentlyAddedVehicles
                  vehicles={recentlyAddedVehiclesData}
                  onViewDetails={(v) => handleViewVehicleDetails(v)}
                  savedIds={savedIds}
                  onToggleSave={handleToggleSave}
                  onViewAll={() => navigateTo('recently-added')}
                />

                <HowItWorks steps={howItWorksSteps} />
                <WhySalvex features={whySalvexFeatures} />
                <AboutSection onAboutClick={() => navigateTo('about')} />
                <BuyerCta
                  onRegisterClick={() => navigateTo('login')}
                  onExploreClick={() => navigateTo('vehicles')}
                />
              </div>
            }
          />

          {/* ROUTE 02: VEHICLES MARKETPLACE (/vehicles) */}
          <Route
            path="/vehicles"
            element={
              <VehiclesPage
                vehicles={liveVehicles}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                onViewDetails={(v) => handleViewVehicleDetails(v)}
                onNavigateHome={() => navigateTo('home')}
                onPlaceBidQuick={(v) => setSelectedBidVehicle(v)}
              />
            }
          />

          {/* ROUTE 03: RECENTLY ADDED (/vehicles/recent) - Defined BEFORE /vehicles/:id */}
          <Route
            path="/vehicles/recent"
            element={
              <RecentlyAddedPage
                vehicles={recentlyAddedVehiclesData}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                onViewDetails={(v) => handleViewVehicleDetails(v)}
              />
            }
          />

          {/* ROUTE 04: VEHICLE DETAILS (/vehicles/:id) */}
          <Route
            path="/vehicles/:id"
            element={
              <VehicleDetailsPage
                onNavigateHome={() => navigateTo('home')}
                onNavigateLiveAuctions={() => navigateTo('live-auctions')}
                onOpenBidModal={(v) => setSelectedBidVehicle(v)}
                onOpenRegisterModal={() => navigateTo('login')}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                onViewVehicleDetails={(v) => handleViewVehicleDetails(v)}
                similarVehicles={liveVehicles}
              />
            }
          />

          {/* ROUTE 05: LIVE AUCTIONS (/auctions/live) */}
          <Route
            path="/auctions/live"
            element={
              <LiveAuctionsPage
                vehicles={liveVehicles}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                onViewDetails={(v) => handleViewVehicleDetails(v)}
                onPlaceBidQuick={(v) => setSelectedBidVehicle(v)}
              />
            }
          />

          {/* ROUTE 06: UPCOMING AUCTIONS (/auctions/upcoming) */}
          <Route
            path="/auctions/upcoming"
            element={
              <UpcomingAuctionsPage
                auctions={upcomingAuctionsData}
                onSetReminder={(msg) => showToast(msg)}
                onViewVehicle={(auc) => {
                  const matched = liveVehicles.find((v) => v.make === auc.title.split(' ')[1]) || liveVehicles[0];
                  handleViewVehicleDetails(matched);
                }}
              />
            }
          />

          {/* ROUTE 07: HOW IT WORKS (/how-it-works) */}
          <Route
            path="/how-it-works"
            element={
              <HowItWorksPage
                onRegisterClick={() => navigateTo('login')}
                onExploreClick={() => navigateTo('vehicles')}
              />
            }
          />

          {/* ROUTE 08: BIDDING RULES (/bidding-rules) */}
          <Route
            path="/bidding-rules"
            element={<BiddingRulesPage onRegisterClick={() => navigateTo('login')} />}
          />

          {/* ROUTE 09: ABOUT SALVEX (/about) */}
          <Route
            path="/about"
            element={
              <AboutPage
                onExploreClick={() => navigateTo('vehicles')}
                onRegisterClick={() => navigateTo('login')}
              />
            }
          />

          {/* ROUTE 10: CONTACT (/contact) */}
          <Route
            path="/contact"
            element={
              <ContactPage
                onShowToast={showToast}
                onNavigate={(route) => navigateTo(route)}
                onOpenRegister={() => navigateTo('login')}
              />
            }
          />

          {/* ROUTE 11: FAQ (/faq) */}
          <Route
            path="/faq"
            element={
              <FaqPage
                onContactClick={() => navigateTo('contact')}
                onRegisterClick={() => navigateTo('login')}
              />
            }
          />

          {/* ROUTE 12-16: LEGAL POLICIES */}
          <Route path="/legal" element={<LegalPage initialTab="terms" />} />
          <Route path="/legal/terms" element={<LegalPage initialTab="terms" />} />
          <Route path="/legal/privacy" element={<LegalPage initialTab="privacy" />} />
          <Route path="/legal/refund" element={<LegalPage initialTab="refund" />} />
          <Route path="/legal/auction" element={<LegalPage initialTab="auction" />} />

          {/* ROUTE 17: LOGIN (/login) */}
          <Route
            path="/login"
            element={
              <LoginPage
                onLoginSuccess={(role) => {
                  if (role === 'admin') navigate('/admin');
                  else if (role === 'seller') navigate('/seller/dashboard');
                  else navigate('/dashboard');
                }}
                onNavigateRegister={() => navigate('/login')}
                onShowToast={showToast}
              />
            }
          />

          {/* ROUTE 18: REGISTER -> REDIRECT TO /login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* ROUTE 19: LIST YOUR VEHICLE (/sell) */}
          <Route
            path="/sell"
            element={
              <ListVehiclePage
                onSubmitSuccess={() => navigate('/seller/dashboard')}
                onNavigateSellerDashboard={() => navigate('/seller/dashboard')}
                onShowToast={showToast}
              />
            }
          />

          {/* ROUTE 19B: READY TO LIFT (/ready-to-lift) */}
          <Route path="/ready-to-lift" element={<ReadyToLiftPage />} />

          {/* ROUTE 19C: OUR SERVICES */}
          <Route path="/services/insurance" element={<InsuranceServicePage />} />
          <Route path="/services/recovery" element={<RecoveryServicePage />} />
          <Route path="/services/documentation" element={<DocumentationServicePage />} />

          {/* ROUTE 20: BIDDER DASHBOARD (/dashboard) - Guarded */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['bidder', 'admin', 'seller']}>
                <BidderDashboard
                  savedVehicles={savedVehiclesList}
                  onRemoveSaved={handleToggleSave}
                  onNavigateHome={() => navigate('/')}
                  onNavigateVehicleDetails={(v) => handleViewVehicleDetails(v)}
                  onNavigatePayment={(lotId) => navigate(`/payment/${lotId}`)}
                  onNavigateLifting={(lotId) => navigate(`/lifting/${lotId}`)}
                  onShowToast={showToast}
                />
              </ProtectedRoute>
            }
          />

          {/* ROUTE 21: PAYMENT CHECKOUT (/payment/:lotId) - Guarded */}
          <Route
            path="/payment/:lotId"
            element={
              <ProtectedRoute allowedRoles={['bidder', 'admin', 'seller']}>
                <PaymentPage
                  onNavigateLifting={(lotId) => navigate(`/lifting/${lotId}`)}
                  onNavigateDashboard={() => navigate('/dashboard')}
                  onShowToast={showToast}
                />
              </ProtectedRoute>
            }
          />

          {/* ROUTE 22: VEHICLE LIFTING (/lifting/:lotId) - Guarded */}
          <Route
            path="/lifting/:lotId"
            element={
              <ProtectedRoute allowedRoles={['bidder', 'admin', 'seller']}>
                <VehicleLiftingPage
                  onNavigateDashboard={() => navigate('/dashboard')}
                  onShowToast={showToast}
                />
              </ProtectedRoute>
            }
          />

          {/* ROUTE 23: SELLER DASHBOARD (/seller/dashboard) - Guarded */}
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerDashboard
                  onNavigateListVehicle={() => navigate('/sell')}
                  onNavigateVehicleDetails={(v) => handleViewVehicleDetails(v)}
                  onShowToast={showToast}
                />
              </ProtectedRoute>
            }
          />

          {/* ROUTE 24: ADMIN PANEL (/admin) - Guarded */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel
                  liveLots={liveVehicles}
                  onExtendLot={handleExtendLot}
                  onShowToast={showToast}
                  onNavigateVehicleDetails={(v) => handleViewVehicleDetails(v)}
                />
              </ProtectedRoute>
            }
          />

          {/* ROUTE 25: 404 NOT FOUND */}
          <Route
            path="*"
            element={
              <div
                style={{
                  minHeight: '65vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  textAlign: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.08em',
                    color: '#075BFF',
                    textTransform: 'uppercase',
                    marginBottom: '8px'
                  }}
                >
                  Error 404
                </span>
                <h1
                  style={{
                    fontSize: '36px',
                    lineHeight: '44px',
                    fontWeight: '800',
                    color: '#0B1220',
                    marginBottom: '12px'
                  }}
                >
                  Page Not Found
                </h1>
                <p
                  style={{
                    color: '#64748B',
                    maxWidth: '460px',
                    marginBottom: '28px',
                    fontSize: '15px',
                    lineHeight: '24px'
                  }}
                >
                  The page you are looking for does not exist, has been removed, or the link has expired.
                </p>
                <Link
                  to="/"
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Return to Homepage
                </Link>
              </div>
            }
          />
        </Routes>
      </main>

      {/* 03 GLOBAL COMMERCIAL FOOTER */}
      <Footer
        onNavigate={(routeId) => navigateTo(routeId)}
        onOpenBidderModal={() => navigateTo('login')}
        onOpenSellerModal={() => navigateTo('list-your-vehicle')}
        onOpenSavedModal={() => setIsSavedOpen(true)}
      />

      {/* 04 INTERACTIVE DIALOG MODALS */}
      <BidModal
        vehicle={selectedBidVehicle}
        isOpen={Boolean(selectedBidVehicle)}
        onClose={() => setSelectedBidVehicle(null)}
        onConfirmBid={handleConfirmBid}
      />

      <VehicleModal
        vehicle={selectedDetailVehicle}
        isOpen={Boolean(selectedDetailVehicle)}
        onClose={() => setSelectedDetailVehicle(null)}
        onPlaceBid={(v) => setSelectedBidVehicle(v)}
        isSaved={selectedDetailVehicle ? savedIds.includes(selectedDetailVehicle.id) : false}
        onToggleSave={handleToggleSave}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      <ListVehicleModal
        isOpen={isSellerOpen}
        onClose={() => setIsSellerOpen(false)}
      />

      <SavedModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedVehicles={savedVehiclesList}
        onRemoveSaved={handleToggleSave}
        onPlaceBid={(v) => setSelectedBidVehicle(v)}
        onViewDetails={(v) => handleViewVehicleDetails(v)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        allVehicles={liveVehicles}
        onSelectVehicle={(v) => handleViewVehicleDetails(v)}
      />

      {/* 05 REAL-TIME TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className="salvex-toast-notification" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
