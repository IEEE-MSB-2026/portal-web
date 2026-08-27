import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToastStore } from '../stores/toastStore';
import { useThemeStore } from '../store/themeStore';
import AuthVisualPanel from '../components/auth/AuthVisualPanel';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  KeyRound,
  Check,
} from 'lucide-react';
import '../styles/auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToastStore();
  const { theme, toggleTheme } = useThemeStore();

  // Wizard state: 1 (Email), 2 (OTP), 3 (New Password), 4 (Success)
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // OTP Countdown timer (10 minutes = 600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = useRef([]);

  // Countdown timer effect for Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'var(--color-border)' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#ef4444' };
      case 2:
        return { score: 2, label: 'Fair', color: '#f59e0b' };
      case 3:
        return { score: 3, label: 'Good', color: '#3b82f6' };
      case 4:
      default:
        return { score: 4, label: 'Strong', color: '#10b981' };
    }
  };

  // Mask email for privacy (e.g. yu••••••er@gmail.com)
  const maskEmail = (str) => {
    if (!str || !str.includes('@')) return str;
    const [local, domain] = str.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    const start = local.slice(0, 2);
    const end = local.length > 4 ? local.slice(-2) : local.slice(-1);
    return `${start}••••••${end}@${domain}`;
  };

  const strength = getPasswordStrength(newPassword);

  // STEP 1: Request OTP
  const handleRequestOtp = async (e, isResend = false) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.requestPasswordResetOtp({ email: cleanEmail });
      if (isResend) {
        toast.info('Code Resent', 'A new verification code has been dispatched.');
      }
      setTimeLeft(600); // 10 mins
      setResendCooldown(45); // 45s cooldown
      setStep(2);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err) {
      console.error('Request OTP error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers with auto-advance and clipboard paste
  const handleOtpChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setError(null);

    // Auto-advance
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyPasswordResetOtp({
        email: email.trim().toLowerCase(),
        otp: otpCode,
      });
      setResetToken(res.resetToken);
      setStep(3);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.resetPasswordWithToken({
        resetToken,
        newPassword,
        confirmPassword,
      });
      setStep(4);
    } catch (err) {
      console.error('Reset Password error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT: Visual Showcase Panel */}
      <AuthVisualPanel />

      {/* RIGHT: Multi-Step Interactive Form */}
      <section className="auth-panel-form">
        <div className="auth-form-top">
          <Link to="/" className="auth-brand" aria-label="IEEE MSB Home">
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
          {/* Step Progress Header */}
          {step < 4 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="auth-eyebrow" style={{ color: 'var(--auth-primary)' }}>
                  Step {step} of 3
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--auth-ink-soft)' }}>
                  {step === 1 && 'Account Email'}
                  {step === 2 && 'OTP Verification'}
                  {step === 3 && 'New Password'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    style={{
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: s <= step ? 'var(--auth-primary)' : 'var(--auth-border)',
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="auth-alert" role="alert" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: REQUEST OTP (ENTER EMAIL) */}
          {/* ============================================================ */}
          {step === 1 && (
            <>
              <div className="auth-header">
                <div style={{ display: 'inline-flex', padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--auth-surface-soft)', color: 'var(--auth-primary)', marginBottom: '1rem' }}>
                  <KeyRound size={24} />
                </div>
                <h1 className="auth-title">Forgot Password?</h1>
                <p className="auth-subtitle">
                  No worries! Enter your account email address and we'll send you a 6-digit verification code to reset your password.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="auth-form" style={{ marginTop: '1rem'}} noValidate>
                <div className="auth-field">
                  <label htmlFor="email">Email Address</label>
                  <div className="auth-input-shell">
                    <Mail size={18} style={{ color: 'var(--auth-ink-faint)' }} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@ieee.local"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button className="auth-btn-primary" type="submit" disabled={loading}>
                  <span>{loading ? 'Sending code…' : 'Send Verification Code'}</span>
                  {!loading && <ArrowRight size={18} />}
                </button>

                <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 2: VERIFY 6-DIGIT OTP */}
          {/* ============================================================ */}
          {step === 2 && (
            <>
              <div className="auth-header">
                <div style={{ display: 'inline-flex', padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--auth-surface-soft)', color: 'var(--auth-primary)', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={24} />
                </div>
                <h1 className="auth-title">Enter Verification Code</h1>
                <p className="auth-subtitle">
                  We've sent a 6-digit verification code to{' '}
                  <strong style={{ color: 'var(--auth-ink)', letterSpacing: '0.02em' }}>{maskEmail(email)}</strong>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="auth-form" style={{ marginTop: '1rem' }} noValidate>
                <div className="auth-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ margin: 0 }}>6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--auth-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      Change email
                    </button>
                  </div>

                  {/* 6 Individual Digit Inputs */}
                  <div className="auth-otp-grid" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`auth-otp-input ${digit ? 'auth-otp-input--filled' : ''}`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Expiry Countdown & Resend Control */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.875rem', borderRadius: 'var(--radius-sm)', background: 'var(--auth-surface-soft)', fontSize: '0.8125rem', color: 'var(--auth-ink-soft)', margin: '0.5rem 0 1rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={15} style={{ color: timeLeft < 60 ? 'var(--auth-danger)' : 'var(--auth-ink-faint)' }} />
                    <span>
                      Expires in <strong style={{ color: timeLeft < 60 ? 'var(--auth-danger)' : 'var(--auth-ink)', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRequestOtp(null, true)}
                    disabled={resendCooldown > 0 || loading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? 'var(--auth-ink-faint)' : 'var(--auth-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      padding: 0,
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}</span>
                  </button>
                </div>

                <button className="auth-btn-primary" type="submit" disabled={loading || otpDigits.join('').length !== 6}>
                  <span>{loading ? 'Verifying…' : 'Verify & Continue'}</span>
                  {!loading && <ArrowRight size={18} />}
                </button>

                <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ArrowLeft size={14} />
                    <span>Cancel and Sign In</span>
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SET NEW PASSWORD */}
          {/* ============================================================ */}
          {step === 3 && (
            <>
              <div className="auth-header">
                <div style={{ display: 'inline-flex', padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--auth-surface-soft)', color: 'var(--auth-primary)', marginBottom: '0.75rem' }}>
                  <Lock size={24} />
                </div>
                <h1 className="auth-title">Create New Password</h1>
                <p className="auth-subtitle">
                  Your identity has been verified. Choose a strong password for your IEEE Portal account.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="auth-form" style={{ marginTop: '1rem'}} noValidate>
                <div className="auth-field">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="auth-input-shell">
                    <Lock size={18} style={{ color: 'var(--auth-ink-faint)' }} />
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                      required
                      autoFocus
                    />
                    <button
                      className="auth-pw-toggle"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--auth-ink-soft)' }}>Strength</span>
                        <span style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem', height: '4px' }}>
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            style={{
                              borderRadius: '2px',
                              backgroundColor: bar <= strength.score ? strength.color : 'var(--auth-border)',
                              transition: 'background-color 0.2s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="auth-field">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="auth-input-shell">
                    <Lock size={18} style={{ color: 'var(--auth-ink-faint)' }} />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                      required
                    />
                    <button
                      className="auth-pw-toggle"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button className="auth-btn-primary" type="submit" disabled={loading}>
                  <span>{loading ? 'Updating Password…' : 'Reset Password'}</span>
                  {!loading && <Check size={18} />}
                </button>
              </form>
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 4: SUCCESS CONFIRMATION */}
          {/* ============================================================ */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', width: '100%' }}>
              <div
                style={{
                  width: '4.5rem',
                  height: '4.5rem',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                  boxShadow: '0 0 0 8px rgba(16, 185, 129, 0.08)',
                }}
              >
                <CheckCircle2 size={38} />
              </div>

              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--auth-ink)' }}>Password Reset Complete!</h1>
              <p className="auth-lede" style={{ maxWidth: '380px', margin: '0 auto 2rem auto', fontSize: '0.9375rem', lineHeight: 1.55 }}>
                Your account password has been updated successfully. All previous active sessions have been secured.
              </p>

              <button
                className="auth-btn-primary"
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Sign In with New Password</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
