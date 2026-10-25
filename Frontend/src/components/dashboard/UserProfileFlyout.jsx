import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  X, 
  LogOut, 
  FileText, 
  Folder, 
  Edit3, 
  KeyRound, 
  Save, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { updateProfileApi, changePasswordApi } from '../../api/authApi';

const UserProfileFlyout = ({
  user,
  onClose,
  onUserUpdate,
  onLogout,
  docCount = 0,
  subjectCount = 0,
  onSelectTab,
}) => {
  const [view, setView] = useState('overview'); // 'overview' | 'edit' | 'password'
  
  // Edit Profile Form State (Name only, no picture)
  const [editName, setEditName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!editName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await updateProfileApi({
        name: editName.trim(),
      });

      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          name: res?.name || editName.trim(),
        });
      }

      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setProfileSuccess('');
        setView('overview');
      }, 1100);
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePasswordApi({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });

      setTimeout(() => {
        setPasswordSuccess('');
        setView('overview');
      }, 1300);
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div 
      className="user-profile-flyout" 
      role="dialog" 
      aria-label="User Profile & Account Menu"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Flyout Header */}
      <div className="flyout-header">
        <div className="flyout-header-title">
          <span>Account & Profile</span>
        </div>
        <button 
          type="button" 
          className="btn-flyout-close" 
          onClick={onClose}
          aria-label="Close user profile"
          title="Close window (Esc)"
        >
          <X size={15} />
        </button>
      </div>

      {/* VIEW: OVERVIEW */}
      {view === 'overview' && (
        <div className="flyout-content">
          {/* User Hero Identity */}
          <div className="flyout-hero">
            <div className="flyout-avatar-wrapper">
              <div className="flyout-avatar-badge">
                <User size={22} />
              </div>
              <span className="flyout-online-dot" title="Active session" />
            </div>

            <div className="flyout-user-meta">
              <h3 className="flyout-user-name">{user?.name || 'Student'}</h3>
              <p className="flyout-user-email" title={user?.email}>{user?.email}</p>
              
              <div className="flyout-badges-row">
                <span className="flyout-badge role">
                  <Shield size={11} />
                  <span>{user?.role || 'Student'}</span>
                </span>
                <span className="flyout-badge status">
                  <span>Active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="flyout-stats-grid">
            <div className="flyout-stat-card">
              <div className="stat-card-icon docs">
                <FileText size={15} />
              </div>
              <div className="stat-card-info">
                <span className="stat-card-num">{docCount}</span>
                <span className="stat-card-label">Uploaded Docs</span>
              </div>
            </div>

            <div className="flyout-stat-card">
              <div className="stat-card-icon subjects">
                <Folder size={15} />
              </div>
              <div className="stat-card-info">
                <span className="stat-card-num">{subjectCount}</span>
                <span className="stat-card-label">Subjects</span>
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="flyout-actions-list">
            <button 
              type="button" 
              className="flyout-menu-item"
              onClick={() => {
                setEditName(user?.name || '');
                setProfileError('');
                setProfileSuccess('');
                setView('edit');
              }}
            >
              <div className="menu-item-left">
                <Edit3 size={15} className="menu-item-icon edit" />
                <span>Edit Profile</span>
              </div>
              <span className="menu-item-hint">Display Name</span>
            </button>

            <button 
              type="button" 
              className="flyout-menu-item"
              onClick={() => {
                setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                setPasswordError('');
                setPasswordSuccess('');
                setView('password');
              }}
            >
              <div className="menu-item-left">
                <KeyRound size={15} className="menu-item-icon password" />
                <span>Change Password</span>
              </div>
              <span className="menu-item-hint">Security</span>
            </button>

            <button 
              type="button" 
              className="flyout-menu-item"
              onClick={() => {
                if (onSelectTab) onSelectTab('dashboard');
                onClose();
              }}
            >
              <div className="menu-item-left">
                <LayoutDashboard size={15} className="menu-item-icon dashboard" />
                <span>Dashboard Overview</span>
              </div>
            </button>
          </div>

          {/* Footer Action: Logout */}
          <div className="flyout-footer">
            <button 
              type="button" 
              className="btn-flyout-logout"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <LogOut size={15} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW: EDIT PROFILE */}
      {view === 'edit' && (
        <div className="flyout-content view-form">
          <div className="flyout-sub-header">
            <button 
              type="button" 
              className="btn-flyout-back" 
              onClick={() => setView('overview')}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <span className="sub-header-title">Edit Profile</span>
          </div>

          {profileError && (
            <div className="flyout-alert error">
              <AlertCircle size={14} />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="flyout-alert success">
              <CheckCircle size={14} />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="flyout-form">
            <div className="form-group">
              <label htmlFor="flyout-edit-name">Full Name</label>
              <input
                id="flyout-edit-name"
                type="text"
                className="flyout-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter full name"
                required
                autoFocus
              />
            </div>

            <div className="flyout-form-actions">
              <button 
                type="button" 
                className="btn-flyout-cancel"
                onClick={() => setView('overview')}
                disabled={isUpdatingProfile}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-flyout-save"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 size={14} className="spinner" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: CHANGE PASSWORD */}
      {view === 'password' && (
        <div className="flyout-content view-form">
          <div className="flyout-sub-header">
            <button 
              type="button" 
              className="btn-flyout-back" 
              onClick={() => setView('overview')}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <span className="sub-header-title">Change Password</span>
          </div>

          {passwordError && (
            <div className="flyout-alert error">
              <AlertCircle size={14} />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="flyout-alert success">
              <CheckCircle size={14} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="flyout-form">
            <div className="form-group">
              <label htmlFor="flyout-curr-pass">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  id="flyout-curr-pass"
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="flyout-input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="btn-password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="flyout-new-pass">New Password (min 8 chars)</label>
              <div className="password-input-wrapper">
                <input
                  id="flyout-new-pass"
                  type={showNewPassword ? 'text' : 'password'}
                  className="flyout-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="At least 8 characters"
                  required
                />
                <button
                  type="button"
                  className="btn-password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="flyout-confirm-pass">Confirm New Password</label>
              <input
                id="flyout-confirm-pass"
                type="password"
                className="flyout-input"
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                placeholder="Re-enter new password"
                required
              />
            </div>

            <div className="flyout-form-actions">
              <button 
                type="button" 
                className="btn-flyout-cancel"
                onClick={() => setView('overview')}
                disabled={isChangingPassword}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-flyout-save"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 size={14} className="spinner" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfileFlyout;
