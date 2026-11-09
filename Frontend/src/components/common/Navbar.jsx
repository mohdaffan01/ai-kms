import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, LayoutDashboard, User, LogOut, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={token ? "/dashboard" : "/login"} className="nav-brand">
          <div className="brand-icon-wrapper">
            <img src="/logo-128.png" alt="AiKMS" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>
          <span className="brand-title">Ai<span className="brand-highlight">KMS</span></span>
        </Link>

        <div className="nav-links">
          {token && user ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/profile"
                className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Profile</span>
              </Link>

              <div className="nav-user-badge">
                <div 
                  className="user-avatar-badge"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(16, 163, 127, 0.15)',
                    border: '1px solid rgba(16, 163, 127, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10a37f',
                    flexShrink: 0
                  }}
                >
                  <User size={16} />
                </div>
                <span className="user-name">{user.name?.split(' ')[0] || 'Student'}</span>
              </div>

              <button onClick={handleLogout} className="btn-logout" title="Logout">
                <LogOut size={18} />
                <span className="logout-text">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-item ${isActive('/login') ? 'active' : ''}`}
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="btn-primary-sm"
              >
                <UserPlus size={18} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
