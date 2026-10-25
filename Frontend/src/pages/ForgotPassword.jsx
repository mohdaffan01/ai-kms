import { useState } from 'react';
import { AlertCircle, Mail, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { requestPasswordResetApi } from '../api/authApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordResetApi(email.trim());
      setIsSubmitted(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 
        'Unable to send password reset email. Please verify your email address.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = () => {
    setIsSubmitted(false);
    setError('');
  };

  return (
    <AuthLayout>
      <div className="auth-form-card">
        {!isSubmitted ? (
          <>
            <h1 className="auth-title">Forgot Password</h1>
            <p 
              className="auth-subtitle" 
              style={{ 
                textAlign: 'center', 
                marginBottom: '1.25rem', 
                color: 'var(--text-muted)', 
                fontSize: '0.9rem' 
              }}
            >
              Enter your registered email address and we'll send you a direct link to reset your password.
            </p>

            {error && (
              <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-field">
                <label htmlFor="reset-email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="field-icon" size={18} />
                  <input
                    type="email"
                    id="reset-email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="btn-accent" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={16} className="spinner" />
                    <span>Sending reset link...</span>
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
              <Link to="/login" className="auth-link">
                Back to log in
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div 
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'rgba(16, 163, 127, 0.15)', 
                border: '2px solid var(--accent-green)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.25rem' 
              }}
            >
              <CheckCircle2 size={32} color="var(--accent-green)" />
            </div>

            <h1 className="auth-title" style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
              Check your email
            </h1>
            <p 
              style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.88rem', 
                lineHeight: 1.5, 
                marginBottom: '1.75rem' 
              }}
            >
              We've sent a password reset link to <strong style={{ color: 'var(--text-main)' }}>{email}</strong>.
              Please check your email inbox and click the link to choose your new password.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={handleResend}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-main)', 
                  padding: '0.65rem 1rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  cursor: 'pointer' 
                }}
              >
                Didn't receive an email? Send again
              </button>

              <Link 
                to="/login" 
                className="auth-link" 
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', marginTop: '0.5rem' }}
              >
                <ArrowLeft size={14} />
                <span>Back to log in</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;