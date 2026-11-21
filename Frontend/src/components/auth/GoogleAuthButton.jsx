import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { googleAuthApi } from '../../api/authApi';

/**
 * GoogleAuthButton Component
 * Renders a Google OAuth 2.0 Sign-In / Sign-Up button powered by Google Identity Services (GSI)
 * and styled to blend with the AiKMS dark mode design system.
 *
 * @param {string} mode - 'login' | 'signup'
 * @param {function} onError - Optional callback to propagate errors to parent form
 * @param {function} onSuccess - Optional callback triggered on successful authentication
 */
const GoogleAuthButton = ({ mode = 'login', onError, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(() => Boolean(window.google?.accounts?.id));
  const [isRendered, setIsRendered] = useState(false);
  const googleBtnRef = useRef(null);
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Process ID Token credential returned by Google
  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response || !response.credential) {
        const msg = 'No credential received from Google.';
        if (onError) onError(msg);
        return;
      }

      try {
        setIsLoading(true);
        if (onError) onError('');

        const data = await googleAuthApi(response.credential);

        if (data && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem(
            'user',
            JSON.stringify({
              id: data._id,
              name: data.name,
              email: data.email,
              role: data.role,
              profileImage: data.profileImage,
              authProvider: data.authProvider || 'google',
            })
          );

          if (onSuccess) {
            onSuccess(data);
          } else {
            navigate('/dashboard');
          }
        } else {
          const errorMsg = 'Google authentication failed: Token not received from server.';
          if (onError) onError(errorMsg);
        }
      } catch (err) {
        console.error('Google OAuth backend error:', err);
        const msg =
          err.response?.data?.message ||
          'Google authentication failed. Please verify your connection or try again.';
        if (onError) onError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, onError, onSuccess]
  );

  // Dynamically load Google Identity Services script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      return;
    }

    const SCRIPT_ID = 'google-gsi-client';
    let script = document.getElementById(SCRIPT_ID);

    const onScriptLoaded = () => setGisLoaded(true);

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = onScriptLoaded;
      script.onerror = () => {
        console.warn('Google Identity Services script failed to load.');
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', onScriptLoaded);
    }

    return () => {
      if (script) {
        script.removeEventListener('load', onScriptLoaded);
      }
    };
  }, []);

  // Initialize and render official Google GIS button if Client ID is configured
  useEffect(() => {
    if (!gisLoaded || !window.google?.accounts?.id || !clientId || !clientId.trim()) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId.trim(),
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
          width: '100%',
        });
        setIsRendered(true);
      }
    } catch (err) {
      console.warn('Google button render exception:', err);
    }
  }, [gisLoaded, clientId, mode, handleCredentialResponse]);

  // Click handler for custom button fallback
  const handleCustomButtonClick = () => {
    if (!clientId || !clientId.trim()) {
      const msg =
        'Google Sign-In is ready! To connect real Google accounts, set VITE_GOOGLE_CLIENT_ID in Frontend/.env and GOOGLE_CLIENT_ID in Backend/.env.';
      if (onError) onError(msg);
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google One Tap prompt dismissed or skipped:', notification.getNotDisplayedReason());
          }
        });
      } catch (err) {
        console.warn('Google One Tap prompt error:', err);
      }
    }
  };

  const buttonLabel = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';

  return (
    <div className="google-auth-wrapper">
      {isLoading ? (
        <button type="button" className="btn-google" disabled>
          <Loader2 size={18} className="spinner" />
          <span>Authenticating with Google...</span>
        </button>
      ) : (
        <>
          {/* Container for official Google GSI Button when client ID is provided */}
          <div
            ref={googleBtnRef}
            className={`google-gis-container ${isRendered ? 'is-visible' : 'is-hidden'}`}
          />

          {/* Styled fallback button displayed when GIS is unrendered or client ID is pending */}
          {!isRendered && (
            <button
              type="button"
              className="btn-google"
              onClick={handleCustomButtonClick}
            >
              <svg
                className="google-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>{buttonLabel}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default GoogleAuthButton;
