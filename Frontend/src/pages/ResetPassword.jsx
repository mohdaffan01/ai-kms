import { useState } from 'react';
import { AlertCircle, Lock, Eye, EyeOff, Loader2, CheckCircle2, Check, X } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { resetPasswordApi } from '../api/authApi';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Signup-level password validation rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Exact same regex check as signup
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordApi(token, { password, confirmPassword });
      setIsSubmitted(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 
        'Unable to reset your password. The link may have expired or is invalid.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-card">
        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'rgba(16, 163, 127, 0.15)', 
                border: '2px solid var(--accent-green)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.25rem' 
              }}
            >
              <CheckCircle2 size={36} color="var(--accent-green)" />
            </div>

            <h1 className="auth-title" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Password Reset Complete!
            </h1>
            <p 
              style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.9rem', 
                marginBottom: '1.75rem', 
                lineHeight: 1.5 
              }}
            >
              Your password has been securely updated. You can now log in using your new credentials.
            </p>

            <button 
              type="button" 
              className="btn-accent" 
              onClick={() => navigate('/login')}
            >
              Go to Login Page
            </button>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Create New Password</h1>
            <p 
              className="auth-subtitle" 
              style={{ 
                textAlign: 'center', 
                marginBottom: '1.25rem', 
                color: 'var(--text-muted)', 
                fontSize: '0.9rem' 
              }}
            >
              Set a strong password with uppercase, lowercase, and numeric characters.
            </p>

            {error && (
              <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* New Password */}
              <div className="form-field">
                <label htmlFor="new-password">New Password</label>
                <div className="input-wrapper">
                  <Lock className="field-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new-password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '0.65rem 0.85rem', 
                    fontSize: '0.78rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.4rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasMinLength ? '#34d399' : 'var(--text-dim)' }}>
                    {hasMinLength ? <Check size={13} /> : <X size={13} />}
                    <span>At least 8 chars</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasUppercase ? '#34d399' : 'var(--text-dim)' }}>
                    {hasUppercase ? <Check size={13} /> : <X size={13} />}
                    <span>1 uppercase (A-Z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasLowercase ? '#34d399' : 'var(--text-dim)' }}>
                    {hasLowercase ? <Check size={13} /> : <X size={13} />}
                    <span>1 lowercase (a-z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasNumber ? '#34d399' : 'var(--text-dim)' }}>
                    {hasNumber ? <Check size={13} /> : <X size={13} />}
                    <span>1 number (0-9)</span>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="form-field">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <div className="input-wrapper">
                  <Lock className="field-icon" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {confirmPassword.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: passwordsMatch ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>
                  {passwordsMatch ? <Check size={13} /> : <X size={13} />}
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-accent" 
                disabled={isSubmitting}
                style={{ marginTop: '0.5rem' }}
              >
                {isSubmitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={16} className="spinner" />
                    <span>Updating password...</span>
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
              <Link to="/login" className="auth-link">
                Back to log in
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;