import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import '../styles/not-found.css';

/**
 * Minimalist 404 & Backend Disconnected Page
 * Clean, dark-themed, distraction-free design with giant background watermark
 * and pill-shaped action buttons matching the design specification.
 */
const NotFound = ({ isBackendOffline = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if routed specifically for offline error
  const isOfflineMode =
    isBackendOffline ||
    location.state?.isBackendOffline ||
    location.pathname === '/server-offline' ||
    new URLSearchParams(location.search).get('reason') === 'offline';

  const [isChecking, setIsChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState(isOfflineMode ? 'offline' : 'unknown');
  const [statusMessage, setStatusMessage] = useState('');

  const backendUrl =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:3000/api`;

  // Function to ping backend server
  const testBackendConnection = async () => {
    setIsChecking(true);
    setServerStatus('testing');
    setStatusMessage('Pinging server on port 3000...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const rootUrl = backendUrl.replace(/\/api\/?$/, '');
      const response = await fetch(`${rootUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status < 500) {
        setServerStatus('online');
        setStatusMessage('Backend is reachable! Reconnecting you...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setServerStatus('offline');
        setStatusMessage(`Server returned status ${response.status}`);
      }
    } catch (err) {
      setServerStatus('offline');
      if (err.name === 'AbortError') {
        setStatusMessage('Connection timed out after 3.5s');
      } else {
        setStatusMessage('Backend process is not running on port 3000');
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOfflineMode) {
      testBackendConnection();
    }
  }, [isOfflineMode]);

  const bigCode = isOfflineMode ? '503' : '404';

  return (
    <div className="minimal-404-wrapper">
      {/* Subtle vertical architectural grid lines in background */}
      <div className="minimal-404-grid-lines" aria-hidden="true">
        <span className="grid-col-line" />
        <span className="grid-col-line" />
        <span className="grid-col-line" />
        <span className="grid-col-line" />
        <span className="grid-col-line" />
      </div>

      {/* Giant Faint Background Watermark Number */}
      <div className="minimal-404-watermark" aria-hidden="true">
        {bigCode}
      </div>

      {/* Centered Minimalist Content */}
      <main className="minimal-404-content">
        <h1 className="minimal-404-title">
          {isOfflineMode ? 'Backend Disconnected' : 'Page Not Found'}
        </h1>

        <p className="minimal-404-subtitle">
          {isOfflineMode
            ? 'Unable to establish a connection with the AiKMS backend API server. Please ensure the server is running on port 3000.'
            : "The page you are looking for doesn't exist, has been removed, or is temporarily unavailable."}
        </p>

        {/* Minimal status indicator when in offline mode */}
        {isOfflineMode && (
          <div className="minimal-404-status">
            <span className={`status-dot ${serverStatus}`} />
            <span className="status-text">
              {serverStatus === 'online'
                ? 'Server Online • Redirecting to workspace...'
                : serverStatus === 'testing'
                ? 'Checking port 3000...'
                : statusMessage || 'Server Unreachable'}
            </span>
          </div>
        )}

        {/* Minimal Pill Action Buttons */}
        <div className="minimal-404-actions">
          {isOfflineMode ? (
            <button
              type="button"
              className="btn-pill-solid"
              onClick={testBackendConnection}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <RefreshCw size={15} className="btn-spinner" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Retry Connection</span>
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn-pill-solid"
              onClick={() => navigate('/dashboard')}
            >
              <span>Go to Dashboard</span>
              <span className="btn-arrow">→</span>
            </button>
          )}

          <button
            type="button"
            className="btn-pill-outline"
            onClick={() =>
              navigate(
                localStorage.getItem('isAuthenticated') === 'true'
                  ? '/dashboard'
                  : '/login'
              )
            }
          >
            <span>Go Home</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
