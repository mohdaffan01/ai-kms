import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Demo Authentication Login
    const nameFromEmail = email.split('@')[0];
    const formattedName = nameFromEmail
      ? nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1)
      : 'Student';

    const userObj = {
      name: formattedName,
      email: email.trim(),
    };

    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userObj));

    navigate('/dashboard');
  };

  return (
    <div className="auth-form-card">
      {error && (
        <div className="auth-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <div className="input-wrapper">
            <Mail className="field-icon" size={18} />
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="input-wrapper">
            <Lock className="field-icon" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-accent">
          Log in
        </button>
      </form>

      <div className="auth-footer">
        <span>Don't have an account? </span>
        <Link to="/signup" className="auth-link">
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
