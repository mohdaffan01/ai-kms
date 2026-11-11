import React from 'react';
import { Outlet } from 'react-router-dom';
import Logo from '../components/common/Logo';

/**
 * AuthLayout - Layout shell for authentication views (Login, Signup, Password Recovery)
 */
const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container dotted-background">
      <div className="auth-box">
        <div className="auth-logo-header">
          <Logo size="large" showSubtitle={true} />
        </div>
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default AuthLayout;

