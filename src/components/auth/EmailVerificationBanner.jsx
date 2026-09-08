import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { api } from '../../services/api';

const COOLDOWN_KEY = 'ieee_email_resend_cooldown';

export default function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToastStore();

  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Check cooldown on mount
  useEffect(() => {
    const checkCooldown = () => {
      try {
        const stored = localStorage.getItem(COOLDOWN_KEY);
        if (stored) {
          const target = parseInt(stored, 10);
          const diff = Math.ceil((target - Date.now()) / 1000);
          if (diff > 0) {
            setSecondsLeft(diff);
          } else {
            setSecondsLeft(0);
            localStorage.removeItem(COOLDOWN_KEY);
          }
        }
      } catch (err) {
        console.warn('Cooldown storage access error:', err);
      }
    };

    checkCooldown();
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(COOLDOWN_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Do not show if not logged in, user doesn't exist, already verified, or dismissed
  if (!isAuthenticated || !user || user.isEmailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    if (loading || secondsLeft > 0) return;

    setLoading(true);
    try {
      const res = await api.resendVerificationEmail();
      const targetTime = Date.now() + 60 * 1000;
      localStorage.setItem(COOLDOWN_KEY, String(targetTime));
      setSecondsLeft(60);

      toast.success(
        'Verification Email Sent',
        res.message || 'Please check your email inbox (and spam folder) for your verification link.'
      );
    } catch (err) {
      if (err.status === 429 && err.cooldownSeconds) {
        const targetTime = Date.now() + err.cooldownSeconds * 1000;
        localStorage.setItem(COOLDOWN_KEY, String(targetTime));
        setSecondsLeft(err.cooldownSeconds);
        toast.warning('Cooldown Active', err.message || `Please wait ${err.cooldownSeconds}s before requesting again.`);
      } else {
        toast.error('Resend Failed', err.message || 'Unable to send verification email. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      role="region"
      aria-label="Email verification notice"
      style={{
        background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.12) 0%, rgba(0, 102, 155, 0.12) 100%)',
        borderBottom: '1px solid rgba(234, 179, 8, 0.28)',
        backdropFilter: 'blur(8px)',
        position: 'relative',
        zIndex: 40,
        padding: '10px 16px',
        fontSize: '13.5px',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          maxWidth: '1280px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234, 179, 8, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={16} />
          </div>
          <div style={{ lineHeight: '1.4' }}>
            <span style={{ fontWeight: 600 }}>Please verify your email address</span>
            <span style={{ opacity: 0.85, margin: '0 6px' }}>—</span>
            <span style={{ opacity: 0.85 }}>
              A confirmation link was sent to <strong style={{ color: 'var(--color-primary, #00669b)' }}>{user.email}</strong>.
              Verify your email to register for events and apply to committees.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || secondsLeft > 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid rgba(0, 102, 155, 0.35)',
              backgroundColor: secondsLeft > 0 ? 'rgba(0,0,0,0.05)' : 'var(--color-primary, #00669b)',
              color: secondsLeft > 0 ? 'var(--color-text-muted, #64748b)' : '#ffffff',
              cursor: secondsLeft > 0 || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: secondsLeft > 0 ? 'none' : '0 2px 4px rgba(0, 102, 155, 0.15)',
            }}
          >
            <RefreshCw
              size={13}
              style={{
                animation: loading ? 'spin 1s linear infinite' : 'none',
              }}
            />
            {loading
              ? 'Sending...'
              : secondsLeft > 0
              ? `Resend in ${secondsLeft}s`
              : 'Resend Verification Link'}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner for now"
            title="Dismiss for this session"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted, #64748b)',
              cursor: 'pointer',
              opacity: 0.75,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
