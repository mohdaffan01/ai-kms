import { useState } from 'react';
import { AlertCircle, Mail } from 'lucide-react';
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
    setIsSubmitting(true);

    try {
      await requestPasswordResetApi(email.trim());
      setIsSubmitted(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to request a password reset right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-card">
        <h1 className="auth-title">Forgot password</h1>
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {isSubmitted ? (
          <>
            <p className="auth-success" role="status">
              If an account exists for that email, a password reset link has been sent.
            </p>
            <div className="auth-footer">
              <Link to="/login" className="auth-link">Back to log in</Link>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-field">
                <label htmlFor="reset-email">Email address</label>
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
                  />
                </div>
              </div>
              <button type="submit" className="btn-accent" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <div className="auth-footer">
              <Link to="/login" className="auth-link">Back to log in</Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;