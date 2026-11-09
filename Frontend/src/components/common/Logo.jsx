import React from 'react';

const Logo = ({ size = 'normal', showSubtitle = true }) => {
  const iconDim = size === 'large' ? 32 : 24;

  return (
    <div className={`logo-container ${size}`}>
      <div className="logo-brand">
        <div className="logo-icon">
          <img
            src="/logo-128.png"
            alt="AiKMS"
            style={{
              width: iconDim,
              height: iconDim,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
        <span className="logo-text">AiKMS</span>
      </div>
      {showSubtitle && (
        <p className="logo-subtitle">Your Personal AI Learning Workspace</p>
      )}
    </div>
  );
};

export default Logo;
