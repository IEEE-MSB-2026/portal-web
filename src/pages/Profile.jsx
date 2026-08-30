import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import '../styles/profile.css';
import {
  User,
  Mail,
  Shield,
  Layers,
  Camera,
  Check,
  CheckCircle2,
  AlertCircle,
  LogOut,
  KeyRound,
  Calendar,
  Building,
  Settings,
  ClipboardList,
  Users,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  X,
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser, updateAvatar, logout } = useAuthStore();
  const toast = useToastStore();
  const fileInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state (sync with ?tab=settings query param)
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'settings') {
      setActiveTab('settings');
    } else if (tabParam === 'profile') {
      setActiveTab('profile');
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'settings' ? { tab: 'settings' } : {});
  };

  // Stats data
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [editingMembership, setEditingMembership] = useState(false);
  const [membershipInput, setMembershipInput] = useState('');
  const [savingMembership, setSavingMembership] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Scope switching
  const [switchingScopeId, setSwitchingScopeId] = useState(null);

  // In-place save feedback states
  const [savedName, setSavedName] = useState(false);
  const [savedMembership, setSavedMembership] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [savedAvatar, setSavedAvatar] = useState(false);

  // Fetch dedicated profile stats
  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const stats = await api.getMyStats();
        if (!cancelled) setStatsData(stats);
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  // Utilities
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'badge-danger';
      case 'lead': return 'badge-accent';
      case 'officer': return 'badge-warning';
      case 'publisher': return 'badge-info';
      default: return 'badge-primary';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  const getDaysSince = (dateStr) => {
    if (!dateStr) return 1;
    try {
      const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 1;
    }
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  // Handlers
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File Type', 'Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Avatar image must be smaller than 10MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploadRes = await api.uploadDirectToCloudinary({ file, folder: 'avatars', purpose: 'avatar' });
      const secureUrl = uploadRes.secureUrl;
      if (!secureUrl) throw new Error('Upload succeeded but no secure URL was returned.');

      await api.updateAvatar({
        avatarUrl: secureUrl,
        cloudinaryPublicId: uploadRes.publicId,
        cloudinaryAssetId: uploadRes.cloudinary?.asset_id,
      });

      updateAvatar(secureUrl);
      setSavedAvatar(true);
      setTimeout(() => setSavedAvatar(false), 2500);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      toast.error('Upload Failed', err.message || 'Failed to update avatar photo.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await api.updateProfile({ name: nameInput.trim() });
      updateUser({ name: nameInput.trim() });
      setEditingName(false);
      setSavedName(true);
      setTimeout(() => setSavedName(false), 2500);
    } catch (err) {
      toast.error('Update Failed', err.message || 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveMembership = async (e) => {
    e.preventDefault();
    setSavingMembership(true);
    try {
      await api.updateProfile({ membershipId: membershipInput });
      updateUser({ membershipId: membershipInput });
      setEditingMembership(false);
      setSavedMembership(true);
      setTimeout(() => setSavedMembership(false), 2500);
    } catch (err) {
      toast.error('Update Failed', err.message || 'Failed to update membership ID.');
    } finally {
      setSavingMembership(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Too Short', 'New password must be at least 8 characters.');
      return;
    }
    setChangingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSavedPassword(true);
      setTimeout(() => setSavedPassword(false), 3000);
    } catch (err) {
      toast.error('Password Change Failed', err.message || 'Could not change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleScopeSwitch = async (scope) => {
    const targetScopeId = scope.id || scope.scopeId;
    if (!targetScopeId) return;
    setSwitchingScopeId(targetScopeId);
    try {
      await api.switchContext({ targetScopeId });
    } catch (err) {
      toast.error('Switch Failed', err.message || 'Failed to switch context scope.');
    } finally {
      setSwitchingScopeId(null);
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="section" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
        <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading member profile...</p>
      </div>
    );
  }

  // Derived data
  const taskStats = statsData?.tasks || { total: 0, todo: 0, inProgress: 0, done: 0 };
  const assignmentStats = statsData?.assignments || { total: 0, pending: 0, submitted: 0, graded: 0 };
  const memberSince = user.createdAt;
  const daysMember = statsData?.daysMember || getDaysSince(memberSince);
  const pwStrength = getPasswordStrength(newPassword);

  const userCommittees = (user?.availableScopes || [])
    .filter((s) => s.scopeType === 'committee' || s.committeeId)
    .map((s) => ({
      id: s.committeeId || s.scopeId,
      scopeId: s.id || s.scopeId,
      name: s.committeeName || s.label || 'Committee',
      slug: s.committeeSlug || s.slug || 'committee',
      role: s.role || 'member',
    }));

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container container-narrow">

        {/* ============================================================
            HERO BANNER
            ============================================================ */}
        <div className="profile-hero">
          <div className="profile-hero__layout">
            {/* Avatar */}
            <div className="profile-hero__avatar-wrap">
              <div className="profile-hero__avatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  <span className="profile-hero__avatar-initials">{getInitials(user.name)}</span>
                )}
              </div>
              <button
                type="button"
                className="profile-hero__upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Upload profile avatar"
                title="Upload new avatar photo"
              >
                {uploadingAvatar ? (
                  <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                style={{ display: 'none' }}
                onChange={handleAvatarFileChange}
              />
            </div>

            {/* User Info */}
            <div className="profile-hero__info">
              <h1 className="profile-hero__name">
                {user.name}
                <span className="profile-hero__badge" style={{ fontSize: '0.625rem' }}>
                  <CheckCircle2 size={10} /> ACTIVE
                </span>
              </h1>
              <div className="profile-hero__email">{user.email}</div>
              <div className="profile-hero__badges">
                <span className="profile-hero__badge profile-hero__badge--role">
                  <Shield size={10} />
                  {user.role?.toUpperCase()}
                </span>
                {user.scopeType && user.scopeType !== 'global' && (
                  <span className="profile-hero__badge profile-hero__badge--scope">
                    <Layers size={10} />
                    {user.committeeSlug?.toUpperCase() || user.committeeName || user.scopeType?.toUpperCase()}
                  </span>
                )}
              </div>
              {memberSince && (
                <div className="profile-hero__member-since">
                  <Calendar size={12} />
                  Member since {formatDate(memberSince)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            TAB NAVIGATION
            ============================================================ */}
        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab ${activeTab === 'profile' ? 'profile-tab--active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <User size={15} />
            <span>Profile</span>
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'settings' ? 'profile-tab--active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <Settings size={15} />
            <span>Settings</span>
          </button>
        </div>

        {/* ============================================================
            TAB 1: PROFILE
            ============================================================ */}
        {activeTab === 'profile' && (
          <>
            {/* Quick Stats */}
            <div className="profile-stats">
              <div className="profile-stat-card">
                <div className="profile-stat-card__value">{taskStats.done}</div>
                <div className="profile-stat-card__label">Tasks Completed</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-card__value">{assignmentStats.graded}</div>
                <div className="profile-stat-card__label">Graded Assignments</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-card__value">{daysMember}</div>
                <div className="profile-stat-card__label">Days as Member</div>
              </div>
            </div>

            {/* My Committees */}
            <div className="profile-section-title">
              <Building size={14} />
              <span>My Committees</span>
            </div>

            {userCommittees.length > 0 ? (
              <div className="profile-committees">
                {userCommittees.map((c) => {
                  const isActive =
                    (user.scopeId === c.scopeId || user.scopeId === c.id) &&
                    user.role === c.role;
                  const isSwitching = switchingScopeId === c.scopeId;

                  return (
                    <div
                      key={c.id || c.scopeId}
                      className={`profile-committee-card ${isActive ? 'profile-committee-card--active' : ''}`}
                    >
                      <div className="profile-committee-card__info">
                        <div className="profile-committee-card__name">{c.name}</div>
                        <div className="profile-committee-card__role">
                          <span className={`badge ${getRoleBadgeClass(c.role || 'member')}`} style={{ fontSize: '0.65rem' }}>
                            {(c.role || 'MEMBER').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {isActive ? (
                        <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700 }}>
                          <Check size={11} /> ACTIVE
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleScopeSwitch(c)}
                          disabled={isSwitching}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                        >
                          {isSwitching ? (
                            <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                          ) : (
                            <>Switch <ChevronRight size={12} /></>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="profile-empty" style={{ marginBottom: 'var(--space-6)' }}>
                <Users size={32} />
                <p>You're not assigned to any committees yet.</p>
              </div>
            )}
          </>
        )}

        {/* ============================================================
            TAB 2: SETTINGS
            ============================================================ */}
        {activeTab === 'settings' && (
          <div className="profile-settings">

            {/* Edit Profile Card */}
            <div className="profile-settings-card">
              <div className="profile-settings-card__header">
                <User size={16} />
                <span>Profile Information</span>
              </div>

              {/* Name Field */}
              <div className="profile-field">
                <div className="profile-field__row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="profile-field__label">Display Name</span>
                    {savedName && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Check size={10} /> Saved
                      </span>
                    )}
                  </div>
                  {!editingName && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                      onClick={() => { setNameInput(user.name || ''); setEditingName(true); }}
                    >
                      <Pencil size={11} /> Edit
                    </button>
                  )}
                </div>
                {editingName ? (
                  <form onSubmit={handleSaveName} className="profile-form-row">
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="Your full name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" disabled={savingName} className="btn btn-primary btn-xs" style={{ padding: '0.4rem 0.75rem' }}>
                      {savingName ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs" style={{ padding: '0.4rem 0.5rem' }}
                      onClick={() => setEditingName(false)}>
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <span className="profile-field__value">{user.name}</span>
                )}
              </div>

              {/* Email Field (read-only) */}
              <div className="profile-field">
                <span className="profile-field__label">Email Address</span>
                <span className="profile-field__value">{user.email}</span>
              </div>

              {/* Membership ID Field */}
              <div className="profile-field">
                <div className="profile-field__row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="profile-field__label">IEEE Membership ID</span>
                    {savedMembership && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Check size={10} /> Saved
                      </span>
                    )}
                  </div>
                  {!editingMembership && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                      onClick={() => { setMembershipInput(user.membershipId || ''); setEditingMembership(true); }}
                    >
                      {user.membershipId ? <><Pencil size={11} /> Edit</> : '+ Add ID'}
                    </button>
                  )}
                </div>
                {editingMembership ? (
                  <form onSubmit={handleSaveMembership} className="profile-form-row">
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="e.g. 98765432"
                      value={membershipInput}
                      onChange={(e) => setMembershipInput(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" disabled={savingMembership} className="btn btn-primary btn-xs" style={{ padding: '0.4rem 0.75rem' }}>
                      {savingMembership ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs" style={{ padding: '0.4rem 0.5rem' }}
                      onClick={() => setEditingMembership(false)}>
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {user.membershipId ? (
                      <>
                        <span className="profile-field__value" style={{ fontFamily: 'var(--font-mono)' }}>
                          {user.membershipId}
                        </span>
                        <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>VERIFIED</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        Not provided
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Change Password Card */}
            <div className="profile-settings-card">
              <div className="profile-settings-card__header">
                <KeyRound size={16} />
                <span>Change Password</span>
              </div>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Current Password */}
                <div className="profile-field" style={{ marginBottom: 0 }}>
                  <span className="profile-field__label">Current Password</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      className="profile-input"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      style={{
                        position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem',
                      }}
                      aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="profile-field" style={{ marginBottom: 0 }}>
                  <span className="profile-field__label">New Password</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      className="profile-input"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      style={{
                        position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem',
                      }}
                      aria-label={showNewPw ? 'Hide password' : 'Show password'}
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="password-strength">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`password-strength__bar ${
                            pwStrength >= level
                              ? level <= 1 ? 'password-strength__bar--weak'
                              : level <= 2 ? 'password-strength__bar--medium'
                              : 'password-strength__bar--strong'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="profile-field" style={{ marginBottom: 0 }}>
                  <span className="profile-field__label">Confirm New Password</span>
                  <input
                    type="password"
                    className="profile-input"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  {confirmPassword && newPassword && confirmPassword !== newPassword && (
                    <div className="profile-feedback profile-feedback--error" style={{ marginTop: '0.25rem' }}>
                      <AlertCircle size={14} />
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={changingPassword || savedPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className={`btn ${savedPassword ? 'btn-success' : 'btn-primary'}`}
                  style={{
                    alignSelf: 'flex-start',
                    gap: '0.5rem',
                    marginTop: '0.25rem',
                    transition: 'all 0.2s ease',
                    ...(savedPassword ? { backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' } : {}),
                  }}
                >
                  {savedPassword ? (
                    <>
                      <Check size={15} />
                      <span>Password Updated!</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>{changingPassword ? 'Changing…' : 'Change Password'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="profile-danger-zone">
              <div className="profile-danger-zone__title">Danger Zone</div>
              <div className="profile-danger-zone__desc">
                Terminating your session will sign you out from all devices. You'll need to log in again with your credentials.
              </div>
              <button
                type="button"
                className="profile-btn-danger"
                onClick={logout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
