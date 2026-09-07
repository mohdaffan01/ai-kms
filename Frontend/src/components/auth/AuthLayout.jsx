import React from 'react';
import Logo from '../common/Logo';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container dotted-background">
      <div className="auth-box">
        <div className="auth-logo-header">
          <Logo size="large" showSubtitle={true} />
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
