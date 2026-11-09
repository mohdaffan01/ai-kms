import React from 'react';

/**
 * AppSplashScreen
 * Branded animated splash screen displayed on app startup/reload.
 * Ensures users never see an unstyled white blank screen and creates
 * a polished, high-performance brand entry with the official AiKMS logo.
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
            <img
              src="/logo.png"
              alt="AiKMS Logo"
              className="splash-logo-img"
              style={{
                width: '46px',
                height: '46px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 10px rgba(16, 163, 127, 0.4))',
              }}
            />
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
