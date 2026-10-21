import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Building,
  KeyRound
} from 'lucide-react';
import SalvexLogo from './SalvexLogo';
import './LoginPage.css';

export default function LoginPage({
  onLoginSuccess,
  onNavigateRegister,
  onShowToast
}) {
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [identifier, setIdentifier] = useState('demo.bidder@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [statusState, setStatusState] = useState(null); // null | 'loading' | 'success' | 'invalid' | 'pending' | 'suspended'

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setStatusState('loading');

    // If password mode, attempt real backend authentication
    if (authMode === 'password') {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            identifier: identifier.trim(),
            password: password
          })
        });

        const data = await response.json();

        if (response.ok) {
          setStatusState('success');
          const userRole = data.user?.role || 'bidder';
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('salvex_demo_auth', JSON.stringify({
              isAuthenticated: true,
              role: userRole,
              user: data.user
            }));
          }
          if (onShowToast) onShowToast(`Welcome back, ${data.user?.name || 'Bidder'}!`);
          setTimeout(() => {
            if (onLoginSuccess) onLoginSuccess(userRole);
          }, 600);
          return;
        }

        // Handle specific error codes
        if (response.status === 403 && data.detail?.includes('verify your email')) {
          setStatusState('pending');
          return;
        } else if (data.detail?.includes('suspended')) {
          setStatusState('suspended');
          return;
        } else {
          setStatusState('invalid');
          return;
        }
      } catch (err) {
        // Fallback for offline demo scenarios
        if (identifier.toLowerCase().includes('suspended')) {
          setStatusState('suspended');
          return;
        }
        if (identifier.toLowerCase().includes('pending')) {
          setStatusState('pending');
          return;
        }
        setStatusState('invalid');
        return;
      }
    }

    // Mobile OTP simulation/preview
    setTimeout(() => {
      setStatusState('success');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('salvex_demo_auth', JSON.stringify({ isAuthenticated: true, role: 'bidder' }));
      }
      if (onShowToast) onShowToast('Login authenticated via Mobile OTP.');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess('bidder');
      }, 600);
    }, 700);
  };

  const handleQuickPersona = (role) => {
    setStatusState('loading');
    setTimeout(() => {
      setStatusState('success');
      // TEMPORARY: fake auth for prototype, replace with real backend auth
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('salvex_demo_auth', JSON.stringify({ isAuthenticated: true, role }));
      }
      if (onShowToast) onShowToast(`Logged in as ${role.toUpperCase()} (Demo Mode)`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(role);
      }, 500);
    }, 400);
  };

  return (
    <div className="salvex-login-page">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-logo-wrap">
            <SalvexLogo variant="light" height={36} />
          </div>
          <span className="login-badge-secure">
            <ShieldCheck size={13} />
            Secure settlement (demo)
          </span>
          <h1 className="login-title">Sign In to Salvex Auction</h1>
          <p className="login-subtitle">
            Access your active bids, auction terminal, settlement statements, and digital yard lifting passes (demo).
          </p>
        </div>

        {/* Status Alerts */}
        {statusState === 'invalid' && (
          <div className="login-alert-banner alert-error">
            <AlertCircle size={18} />
            <span>Invalid email or password. Please verify your credentials and retry.</span>
          </div>
        )}

        {statusState === 'pending' && (
          <div className="login-alert-banner alert-warning">
            <AlertCircle size={18} />
            <span><strong>Account Under Verification:</strong> Your KYC documents are currently being processed by our compliance team (ETA: 2 hours).</span>
          </div>
        )}

        {statusState === 'suspended' && (
          <div className="login-alert-banner alert-error">
            <AlertCircle size={18} />
            <span><strong>Account Suspended:</strong> This account has been paused due to unfulfilled auction settlement terms. Contact demo@example.com.</span>
          </div>
        )}

        {statusState === 'success' && (
          <div className="login-alert-banner alert-success">
            <CheckCircle2 size={18} />
            <span>Authentication verified. Redirecting to your portal...</span>
          </div>
        )}

        {/* Tab switch between Password & OTP */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-mode-btn ${authMode === 'password' ? 'mode-active' : ''}`}
            onClick={() => setAuthMode('password')}
          >
            <Lock size={14} />
            <span>Password Login</span>
          </button>

          <button
            type="button"
            className={`auth-mode-btn ${authMode === 'otp' ? 'mode-active' : ''}`}
            onClick={() => setAuthMode('otp')}
          >
            <Smartphone size={14} />
            <span>Mobile OTP Login</span>
          </button>
        </div>

        {/* Main Form */}
        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-id">
              {authMode === 'password' ? 'Email Address or Mobile Number' : 'Registered Mobile Number'}
            </label>
            <div className="input-with-icon">
              {authMode === 'password' ? <Mail size={16} /> : <Smartphone size={16} />}
              <input
                type={authMode === 'password' ? 'text' : 'tel'}
                id="login-id"
                required
                placeholder={authMode === 'password' ? 'demo@example.com / +91...' : '+91 00000 00000'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          {authMode === 'password' ? (
            <div className="form-group">
              <div className="label-with-link">
                <label htmlFor="login-pass">Password</label>
                <button
                  type="button"
                  className="link-forgot"
                  onClick={() => alert('Password reset link sent to your registered email.')}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-with-icon">
                <Lock size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-pass"
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <div className="label-with-link">
                <label htmlFor="login-otp">6-Digit One-Time Password (OTP)</label>
                <button
                  type="button"
                  className="link-forgot"
                  onClick={() => {
                    setOtpSent(true);
                    setOtp('482910');
                    if (onShowToast) onShowToast('Demo OTP sent: 482910');
                  }}
                >
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
              <div className="input-with-icon">
                <KeyRound size={16} />
                <input
                  type="text"
                  id="login-otp"
                  maxLength={6}
                  required
                  placeholder="Enter 6-digit OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={statusState === 'loading'}
            className="salvex-btn salvex-btn-primary btn-login-submit"
          >
            {statusState === 'loading' ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Persona Switcher */}
        <div className="demo-persona-section">
          <span className="demo-persona-title">Instant Demo Persona Sign-In:</span>
          <div className="demo-persona-grid">
            <button
              type="button"
              className="persona-btn"
              onClick={() => handleQuickPersona('bidder')}
            >
              <UserCheck size={14} className="text-auction-red" />
              <span>Demo Bidder</span>
            </button>

            <button
              type="button"
              className="persona-btn"
              onClick={() => handleQuickPersona('seller')}
            >
              <Building size={14} className="text-info" />
              <span>Consignor / Seller</span>
            </button>

            <button
              type="button"
              className="persona-btn"
              onClick={() => handleQuickPersona('admin')}
            >
              <ShieldCheck size={14} style={{ color: '#075BFF' }} />
              <span>Super Admin</span>
            </button>
          </div>
        </div>

        {/* Registration Prompt */}
        <div className="login-footer">
          <p>
            Don't have an approved bidder account yet?{' '}
            <button
              type="button"
              className="link-register"
              onClick={onNavigateRegister}
            >
              Register as Bidder
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
