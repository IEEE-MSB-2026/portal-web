import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { useThemeStore } from '../../store/themeStore';

export default function GoogleAuthButton({
  mode = 'signin', // 'signin' | 'signup'
  redirectUrl = '/dashboard',
  onError,
  disabled = false,
}) {
  const navigate = useNavigate();
  const toast = useToastStore();
  const { theme } = useThemeStore();
  const googleBtnContainerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(googleClientId && googleClientId.trim().length > 0);

  // Handle Google credential callback
  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      const msg = 'No credential returned from Google.';
      if (onError) onError(msg);
      return;
    }

    setLoading(true);
    if (onError) onError(null);

    try {
      await api.loginWithGoogle({ credential: response.credential });
      toast.success(
        'Welcome!',
        mode === 'signup'
          ? 'Your account has been created and verified via Google.'
          : 'Signed in successfully with Google.'
      );
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      console.error('Google auth error:', err);
      const errMsg = err.message || 'Google authentication failed. Please try again.';
      if (onError) {
        onError(errMsg);
      } else {
        toast.error('Google Sign-In Error', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load Google Identity Services script if configured
  useEffect(() => {
    if (!isConfigured) return;

    if (window.google && window.google.accounts && window.google.accounts.id) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => console.warn('Failed to load Google Identity Services SDK');
      document.body.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
    }
  }, [isConfigured]);

  // Render official Google button when SDK and container are ready
  useEffect(() => {
    if (!isConfigured || !scriptLoaded || !googleBtnContainerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      googleBtnContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
        size: 'large',
        width: googleBtnContainerRef.current.offsetWidth || 340,
        logo_alignment: 'left',
      });
    } catch (err) {
      console.warn('Error initializing Google Button:', err);
    }
  }, [isConfigured, scriptLoaded, theme, mode, googleClientId]);

  // Fallback handler when clicked if not configured or in dev
  const handleFallbackClick = async () => {
    if (!isConfigured) {
      // In development mode, provide a fast test mock option
      if (import.meta.env.DEV) {
        const testEmail = prompt(
          'Google SSO Setup Required:\n\nVITE_GOOGLE_CLIENT_ID is not configured in .env.\n\n[Dev Helper] Enter an email to test Google SSO sign-in/registration flow:',
          'google.dev.member@ieee.local'
        );
        if (!testEmail || !testEmail.trim()) return;

        setLoading(true);
        try {
          const mockCredential = `test-mock-google:sub-${Date.now()}:${testEmail.trim()}:Google Dev User:https://api.dicebear.com/7.x/bottts/svg?seed=dev`;
          await api.loginWithGoogle({ credential: mockCredential });
          toast.success('Dev Google Login', `Signed in as ${testEmail.trim()}`);
          navigate(redirectUrl, { replace: true });
        } catch (err) {
          if (onError) onError(err.message);
          else toast.error('Dev Google Login Failed', err.message);
        } finally {
          setLoading(false);
        }
        return;
      }

      toast.info(
        'Google SSO Disabled',
        'Google Single Sign-On is not configured in this environment (VITE_GOOGLE_CLIENT_ID is not set).'
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  // Google Colored G Logo SVG
  const GoogleGLogo = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
      />
    </svg>
  );

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {isConfigured && scriptLoaded ? (
        <div
          ref={googleBtnContainerRef}
          style={{
            minHeight: '44px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        />
      ) : (
        <button
          className="auth-btn-secondary"
          type="button"
          onClick={handleFallbackClick}
          disabled={disabled || loading}
          title={
            !isConfigured
              ? 'Google SSO is not configured in this environment'
              : 'Sign in with Google'
          }
          style={{
            width: '100%',
            opacity: isConfigured ? 1 : 0.75,
            cursor: loading ? 'wait' : 'pointer',
            position: 'relative',
          }}
        >
          <GoogleGLogo />
          <span>
            {loading
              ? 'Connecting to Google...'
              : mode === 'signup'
              ? 'Sign up with Google'
              : 'Sign in with Google'}
          </span>
          {!isConfigured && (
            <span
              style={{
                position: 'absolute',
                right: '12px',
                fontSize: '10.5px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(0,0,0,0.08)',
                fontWeight: 500,
              }}
            >
              {import.meta.env.DEV ? 'Dev Demo' : 'Setup Required'}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
