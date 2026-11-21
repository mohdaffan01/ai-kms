import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { registerApi } from '../../api/authApi';
import GoogleAuthButton from './GoogleAuthButton';

const SignupForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleNameChange = (e) => {
    // Restrict input to alphabets and spaces only (no numbers)
    const filteredValue = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFullName(filteredValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(fullName.trim())) {
      setError('Name should contain only alphabetic characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password should be at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await registerApi({
        name: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (data && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
          })
        );
        navigate('/dashboard');
      } else {
        setError('Signup failed: Token not received from server.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      const msg =
        err.response?.data?.message ||
        'Registration failed. Please try again or use another email.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
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

      <GoogleAuthButton mode="signup" onError={setError} />

      <div className="auth-divider">
        <span>or register with email</span>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-field">
          <label htmlFor="fullName">Full Name</label>
          <div className="input-wrapper">
            <User className="field-icon" size={18} />
            <input
              type="text"
              id="fullName"
              placeholder="Enter your Name"
              value={fullName}
              onChange={handleNameChange}
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

        <button type="submit" className="btn-accent" disabled={isSubmitting}>
          {isSubmitting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader2 size={18} className="spinner" /> Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
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
