import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  Calendar,
  Save,
  KeyRound
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
];

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profileImage || '',
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Alerts State
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  // Handle Profile Form Changes
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    if (profileError) setProfileError('');
    if (profileSuccess) setProfileSuccess('');
  };

  // Handle Avatar Preset Selection
  const selectAvatar = (url) => {
    setProfileForm({ ...profileForm, profileImage: url });
    if (profileError) setProfileError('');
  };

  // Submit Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileForm.name.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      await updateProfile({
        name: profileForm.name,
        profileImage: profileForm.profileImage,
      });
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Form Changes
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };

  // Submit Password Change
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
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>User Profile & Settings</h1>
        <p>Manage your account credentials, profile details, and security.</p>
      </div>

      <div className="profile-layout">
        {/* Profile Card & Info Sidebar */}
        <div className="profile-card">
          <div className="profile-avatar-container">
            <img
              src={profileForm.profileImage || user?.profileImage || PRESET_AVATARS[0]}
              alt={user?.name}
              className="profile-large-avatar"
              onError={(e) => {
                e.target.src = PRESET_AVATARS[0];
              }}
            />
          </div>

          <h2 className="profile-name">{user?.name}</h2>
          <p className="profile-email">{user?.email}</p>

          <div className="profile-badges">
            <span className="badge badge-primary">
              <Shield size={14} /> {user?.role || 'student'}
            </span>
          </div>

          <div className="profile-details-list">
            <div className="detail-item">
              <Calendar size={18} className="detail-icon" />
              <div>
                <span className="detail-title">Member Since</span>
                <span className="detail-value">{formattedDate}</span>
              </div>
            </div>
            <div className="detail-item">
              <Mail size={18} className="detail-icon" />
              <div>
                <span className="detail-title">Account Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Update Forms Section */}
        <div className="profile-forms-section">
          {/* Update Profile Form */}
          <div className="panel">
            <div className="panel-header">
              <h3>
                <User size={20} /> Personal Information
              </h3>
            </div>
            <div className="panel-body">
              {profileError && (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-icon-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address (Read-only)</label>
                  <div className="input-icon-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileForm.email}
                      disabled
                      className="input-disabled"
                    />
                  </div>
                  <small className="form-hint">Email address is linked to your account identity.</small>
                </div>

                <div className="form-group">
                  <label htmlFor="profileImage">Profile Image URL</label>
                  <div className="input-icon-wrapper">
                    <ImageIcon className="input-icon" size={18} />
                    <input
                      type="text"
                      id="profileImage"
                      name="profileImage"
                      placeholder="https://example.com/avatar.jpg"
                      value={profileForm.profileImage}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>

                {/* Preset Avatars Picker */}
                <div className="avatar-picker">
                  <label>Or select a default avatar:</label>
                  <div className="preset-grid">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`preset-btn ${profileForm.profileImage === url ? 'selected' : ''}`}
                        onClick={() => selectAvatar(url)}
                      >
                        <img src={url} alt={`Avatar ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isUpdatingProfile}
                  >
                    <Save size={18} />
                    <span>{isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="panel">
            <div className="panel-header">
              <h3>
                <KeyRound size={20} /> Security & Password
              </h3>
            </div>
            <div className="panel-body">
              {passwordError && (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className="input-icon-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      placeholder="••••••••"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password (min. 8 characters)</label>
                  <div className="input-icon-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      placeholder="••••••••"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <div className="input-icon-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      type="password"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      placeholder="••••••••"
                      value={passwordForm.confirmNewPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-secondary"
                    disabled={isChangingPassword}
                  >
                    <KeyRound size={18} />
                    <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
