import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Clock, RefreshCw, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { isAuthenticated, user, updateUser } = useAuthStore();
  const toast = useToastStore();

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'already_verified' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token was found in the link. Please check your email or request a new link.');
      return;
    }

    let isMounted = true;

    async function executeVerification() {
      setStatus('loading');
      try {
        const result = await api.verifyEmail({ token });
        if (!isMounted) return;

        if (result.alreadyVerified) {
          setStatus('already_verified');
        } else {
          setStatus('success');
          if (result.user) {
            updateUser({ isEmailVerified: true });
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'The verification link is invalid or has expired.');
      }
    }

    executeVerification();

    return () => {
      isMounted = false;
    };
  }, [token, updateUser]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const [unauthEmail, setUnauthEmail] = useState('');

  const handleResend = async (customEmail) => {
    const emailToUse = customEmail || (unauthEmail ? unauthEmail.trim() : null);
    if (resending || cooldown > 0) return;
    setResending(true);
    setResendSuccess(false);

    try {
      const res = await api.resendVerificationEmail({ email: emailToUse });
      setResendSuccess(true);
      setCooldown(60);
      toast.success('Verification Sent', res.message || 'A new verification link was sent to your email.');
    } catch (err) {
      if (err.status === 429 && err.cooldownSeconds) {
        setCooldown(err.cooldownSeconds);
        toast.warning('Cooldown', err.message);
      } else {
        toast.error('Resend Failed', err.message || 'Could not resend verification email.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container container-narrow" style={{ maxWidth: '580px', width: '100%' }}>
        <div
          className="bento-card"
          style={{
            padding: 'var(--space-10, 40px) var(--space-8, 32px)',
            textAlign: 'center',
            borderRadius: '16px',
            boxShadow: '0 20px 45px -15px rgba(0, 50, 100, 0.15)',
          }}
        >
          {status === 'loading' && (
            <div>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(0, 102, 155, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-6, 24px)',
                  color: 'var(--color-primary, #00669b)',
                }}
              >
                <RefreshCw size={32} style={{ animation: 'spin 1.2s linear infinite' }} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-3, 12px)' }}>
                Verifying Your Email
              </h1>
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '15px', lineHeight: '1.6' }}>
                Please wait a moment while we validate your email verification token...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-6, 24px)',
                  color: '#10b981',
                }}
              >
                <CheckCircle2 size={40} />
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: 'var(--space-3, 12px)' }}>
                Email Verified Successfully!
              </h1>
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '15px', lineHeight: '1.6', marginBottom: 'var(--space-8, 32px)' }}>
                Your email address has been confirmed. You now have full access to participate in events, register for competitions, and apply for student branch committee positions.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link
                  to={isAuthenticated ? '/dashboard' : '/login'}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Sign In to Your Account'}
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/events"
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 20px',
                    fontSize: '14px',
                  }}
                >
                  Browse Upcoming Events
                </Link>
              </div>
            </div>
          )}

          {status === 'already_verified' && (
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(0, 102, 155, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-6, 24px)',
                  color: 'var(--color-primary, #00669b)',
                }}
              >
                <ShieldCheck size={40} />
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: 'var(--space-3, 12px)' }}>
                Already Verified
              </h1>
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '15px', lineHeight: '1.6', marginBottom: 'var(--space-8, 32px)' }}>
                Your email address has already been verified previously. Your account is in good standing with full privileges.
              </p>

              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                {isAuthenticated ? 'Continue to Dashboard' : 'Sign In'}
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-6, 24px)',
                  color: '#ef4444',
                }}
              >
                <AlertCircle size={40} />
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: 'var(--space-3, 12px)' }}>
                Verification Failed
              </h1>
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '15px', lineHeight: '1.6', marginBottom: 'var(--space-6, 24px)' }}>
                {errorMessage}
              </p>

              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      fontSize: '15px',
                      fontWeight: 600,
                    }}
                  >
                    <Mail size={16} />
                    {resending
                      ? 'Sending New Link...'
                      : cooldown > 0
                      ? `Resend available in ${cooldown}s`
                      : 'Resend Verification Email'}
                  </button>

                  {resendSuccess && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '13.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={15} />
                      A new link has been dispatched to {user?.email}!
                    </div>
                  )}

                  <Link
                    to="/dashboard"
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 20px',
                      fontSize: '14px',
                    }}
                  >
                    Return to Dashboard
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                      Request a new verification link for your email:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={unauthEmail}
                        onChange={(e) => setUnauthEmail(e.target.value)}
                        className="form-input"
                        style={{ flex: 1, padding: '10px 14px', fontSize: '14px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleResend(unauthEmail)}
                        disabled={resending || cooldown > 0 || !unauthEmail.trim()}
                        className="btn btn-primary"
                        style={{ padding: '10px 18px', fontSize: '14px', whiteSpace: 'nowrap' }}
                      >
                        <Mail size={15} />
                        {resending ? 'Sending...' : cooldown > 0 ? `${cooldown}s` : 'Resend Link'}
                      </button>
                    </div>
                  </div>

                  {resendSuccess && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '13.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={15} />
                      Verification link dispatched! Please check your inbox.
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <Link to="/login" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      Sign In Instead
                    </Link>
                    <Link to="/" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      Return to Home
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
