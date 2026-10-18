import { useState } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { resetPasswordApi } from '../api/authApi';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordApi(token, { password, confirmPassword });
      setIsSubmitted(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset your password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-card">
        <h1 className="auth-title">Reset password</h1>
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {isSubmitted ? (
          <>
            <p className="auth-success" role="status">
              Your password has been reset. You can now log in with your new password.
            </p>
            <div className="auth-footer">
              <Link to="/login" className="auth-link">Back to log in</Link>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-field">
                <label htmlFor="new-password">New password</label>
                <div className="input-wrapper">
                  <Lock className="field-icon" size={18} />
                  <input
                    type="password"
                    id="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <div className="input-wrapper">
                  <Lock className="field-icon" size={18} />
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-accent" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update password'}
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

export default ResetPassword;