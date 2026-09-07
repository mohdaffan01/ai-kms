import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const SignupForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    // Demo Authentication Signup
    const userObj = {
      name: fullName.trim(),
      email: email.trim(),
    };

    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userObj));

    navigate('/dashboard');
  };

  return (
    <div className="auth-form-card">
      <h2 className="auth-title">Create your account</h2>
      
      {error && (
        <div className="auth-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-field">
          <label htmlFor="fullName">Full Name</label>
          <div className="input-wrapper">
            <User className="field-icon" size={18} />
            <input
              type="text"
              id="fullName"
              placeholder="Mohd Affan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>

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

        <div className="form-field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-wrapper">
            <Lock className="field-icon" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-accent">
          Create Account
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account? </span>
        <Link to="/login" className="auth-link">
          Log in
        </Link>
      </div>
    </div>
  );
};

export default SignupForm;
