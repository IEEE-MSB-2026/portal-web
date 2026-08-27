import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useThemeStore } from '../store/themeStore';
import AuthVisualPanel from '../components/auth/AuthVisualPanel';
import '../styles/auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toast = useToastStore();
  const { theme, toggleTheme } = useThemeStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedGuidelines, setAgreedGuidelines] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMemId = membershipId.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (!agreedGuidelines) {
      setError('Please agree to the IEEE Menoufia SB community guidelines to register.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.register({
        name: cleanName,
        email: cleanEmail,
        password,
        membershipId: cleanMemId || undefined,
      });
      toast.success('Account created!', `Welcome to IEEE Menoufia SB, ${cleanName}!`);
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info('Google SSO', 'Google Workspace Single Sign-On will be activated in the upcoming production release.');
  };

  return (
    <div className="auth-page">
      {/* LEFT: Visual Showcase with Animated Constellation Canvas & Quotes */}
      <AuthVisualPanel />

      {/* RIGHT: Register Form Panel */}
      <section className="auth-panel-form">
        <div className="auth-form-top">
          <Link to="/" className="auth-brand" aria-label="IEEE Menoufia Student Branch Home">
            <svg className="auth-brand-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="6" r="3.4" fill="var(--auth-primary)" />
              <circle cx="6" cy="24" r="3.4" fill="var(--auth-cyan)" />
              <circle cx="26" cy="24" r="3.4" fill="var(--auth-cyan)" />
              <path
                d="M16 9.4 L7.6 21.4 M16 9.4 L24.4 21.4 M9 24 H23"
                stroke="var(--auth-primary)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <div className="auth-brand-text">
              <div className="auth-brand-name">IEEE MSB</div>
              <div className="auth-brand-sub">Menoufia University</div>
            </div>
          </Link>

          <button
            className="auth-theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
              </svg>
            )}
          </button>
        </div>

        <div className="auth-form-wrap">
          <h1>Create account</h1>
          <p className="auth-lede">Join IEEE Menoufia Student Branch and innovate together.</p>

          {error && <div className="auth-error-banner">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              {/* <label htmlFor="reg-name">Full name</label> */}
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              {/* <label htmlFor="reg-email">Email address</label> */}
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2.4" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              {/* <label htmlFor="reg-membership">
                IEEE Membership ID <span className="auth-optional">(Optional)</span>
              </label> */}
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 8h10M7 12h6M7 16h8" />
                </svg>
                <input
                  id="reg-membership"
                  name="membershipId"
                  type="text"
                  placeholder="IEEE Membership ID"
                  value={membershipId}
                  onChange={(e) => setMembershipId(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              {/* <label htmlFor="reg-password">Password</label> */}
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
                  <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
                </svg>
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="auth-pw-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="2.6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-field">
              {/* <label htmlFor="reg-confirm-password">Confirm Password</label> */}
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
                  <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
                </svg>
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  className="auth-pw-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="2.6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                name="guidelines"
                checked={agreedGuidelines}
                onChange={(e) => setAgreedGuidelines(e.target.checked)}
              />
              <span>I agree to the IEEE Menoufia SB community guidelines</span>
            </label>

            <button className="auth-btn-primary" type="submit" disabled={loading}>
              <span>{loading ? 'Creating account…' : 'Create account'}</span>
              {!loading && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>

            <div className="auth-divider">or continue with</div>

            <button className="auth-btn-secondary" type="button" onClick={handleGoogleSignIn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.4" />
                <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" />
              </svg>
              Sign up with Google
            </button>
          </form>

          <p className="auth-foot-note">
            Already have an account?{' '}
            <Link className="auth-link" to={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="auth-legal">
          © {new Date().getFullYear()} IEEE — Institute of Electrical and Electronics Engineers. <a href="#privacy">Privacy</a> · <a href="#help">Help</a>
        </p>
      </section>
    </div>
  );
}
