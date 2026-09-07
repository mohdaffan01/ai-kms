import React from 'react';
import { Brain } from 'lucide-react';

const Logo = ({ size = 'normal', showSubtitle = true }) => {
  return (
    <div className={`logo-container ${size}`}>
      <div className="logo-brand">
        <div className="logo-icon">
          <Brain size={size === 'large' ? 32 : 24} />
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
