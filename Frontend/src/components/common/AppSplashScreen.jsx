import React from 'react';

/**
 * AppSplashScreen
 * Branded animated splash screen displayed on app startup/reload.
 * Ensures users never see an unstyled white blank screen and creates
 * a polished, high-performance brand entry.
 */
const AppSplashScreen = ({ isFadingOut = false }) => {
  return (
    <div
      className={`aikms-splash-screen ${isFadingOut ? 'fade-out' : ''}`}
      aria-label="Loading AiKMS Workspace"
      role="status"
    >
      <div className="splash-content">
        {/* Animated Brand Logo Icon with Glowing Halo */}
        <div className="splash-logo-container">
          <div className="splash-glow-ring" />
          <div className="splash-logo-box">
            <svg
              className="splash-logo-svg"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 18V5" />
              <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
              <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
              <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
              <path d="M18 18a4 4 0 0 0 2-7.464" />
              <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
              <path d="M6 18a4 4 0 0 1-2-7.464" />
              <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
            </svg>
          </div>
        </div>

        {/* Brand Typography */}
        <div className="splash-brand-text">
          <h1 className="splash-title">
            Ai<span>KMS</span>
          </h1>
          <p className="splash-subtitle">Personal AI Learning Workspace</p>
        </div>

        {/* Animated Loading Bar */}
        <div className="splash-progress-track">
          <div className="splash-progress-fill" />
        </div>
      </div>
    </div>
  );
};

export default AppSplashScreen;

