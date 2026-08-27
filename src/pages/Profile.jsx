import React, { useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
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
  Sparkles,
  KeyRound,
  Calendar,
  Building,
  RefreshCw,
  ArrowRight,
  Upload,
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser, updateAvatar, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'security'
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [editingMembership, setEditingMembership] = useState(false);
  const [membershipInput, setMembershipInput] = useState(user?.membershipId || '');
  const [savingMembership, setSavingMembership] = useState(false);
  const [switchingScopeId, setSwitchingScopeId] = useState(null);
  const [error, setError] = useState(null);

  const handleSaveMembership = async (e) => {
    e.preventDefault();
    setSavingMembership(true);
    setError(null);
    try {
      await api.updateProfile({ membershipId: membershipInput });
      await api.getMe();
      setEditingMembership(false);
      toast.success('Membership ID Updated', 'Your IEEE Membership ID has been saved.');
    } catch (err) {
      console.error('Failed to update membership ID:', err);
      const msg = err.message || 'Failed to update IEEE Membership ID.';
      setError(msg);
      toast.error('Update Failed', msg);
    } finally {
      setSavingMembership(false);
    }
  };

  const fileInputRef = useRef(null);

  const toast = useToastStore();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'badge-danger';
      case 'lead':
        return 'badge-accent';
      case 'officer':
        return 'badge-warning';
      case 'publisher':
        return 'badge-info';
      case 'member':
      default:
        return 'badge-primary';
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const msg = 'Please select a valid image file (PNG, JPG, WebP).';
      setError(msg);
      toast.error('Invalid File Type', msg);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const msg = 'Avatar image must be smaller than 5MB.';
      setError(msg);
      toast.error('File Too Large', msg);
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    setAvatarSuccess(false);

    try {
      // 1. Direct upload to Cloudinary + Two-Step Registry in file_assets
      const uploadRes = await api.uploadDirectToCloudinary({
        file,
        folder: 'avatars',
        purpose: 'avatar',
      });

      const secureUrl = uploadRes.secureUrl;
      if (!secureUrl) {
        throw new Error('Upload succeeded but no secure URL was returned from Cloudinary.');
      }

      // 2. Persist to core-platform user profile with Cloudinary identifiers
      await api.updateAvatar({
        avatarUrl: secureUrl,
        cloudinaryPublicId: uploadRes.publicId,
        cloudinaryAssetId: uploadRes.cloudinary?.asset_id,
      });

      // 3. Update local auth state
      updateAvatar(secureUrl);
      setAvatarSuccess(true);
      toast.success('Avatar Updated', 'Your profile picture has been updated and delivered via Cloudinary CDN.');
      setTimeout(() => setAvatarSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      const msg = err.message || 'Failed to update avatar photo. Please try again.';
      setError(msg);
      toast.error('Upload Failed', msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScopeSwitch = async (targetScope) => {
    const targetScopeId = targetScope.id || targetScope.scopeId;
    if (!targetScopeId) return;

    setSwitchingScopeId(targetScopeId);
    setError(null);
    try {
      const switchRes = await api.switchContext({ targetScopeId });
      toast.success(
        'Scope Switched',
        `Switched to ${switchRes.user?.role?.toUpperCase()} (${switchRes.user?.scopeType})`
      );
    } catch (err) {
      console.error('Scope switch error:', err);
      const msg = err.message || 'Failed to switch context scope.';
      setError(msg);
      toast.error('Switch Failed', msg);
    } finally {
      setSwitchingScopeId(null);
    }
  };

  if (!user) {
    return (
      <div className="section" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
        <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading member profile...</p>
      </div>
    );
  }

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container container-narrow">
        {/* Profile Hero Card */}
        <div
          className="bento-card"
          style={{
            padding: 'var(--space-8)',
            marginBottom: 'var(--space-6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Background Accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '280px',
              height: '100%',
              background: 'radial-gradient(circle at 100% 50%, rgba(0, 98, 155, 0.12) 0%, transparent 80%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-6)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Left: Avatar with Upload Button + Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
              {/* Avatar Container with Hover Upload Overlay */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '5.5rem',
                    height: '5.5rem',
                    borderRadius: 'var(--radius-full)',
                    border: '3px solid var(--color-primary)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>

                {/* Upload Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label="Upload profile avatar"
                  title="Upload new avatar photo"
                  style={{
                    position: 'absolute',
                    bottom: '-0.25rem',
                    right: '-0.25rem',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: '2px solid var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {uploadingAvatar ? (
                    <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                  ) : (
                    <Camera size={14} />
                  )}
                </button>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFileChange}
                />
              </div>

              {/* User Bio Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                    {user.name}
                  </h1>
                  <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                    ACTIVE MEMBER
                  </span>
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
                  {user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role?.toUpperCase()}
                  </span>
                  <span className="badge">
                    SCOPE: {user.scopeType?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Pill */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Branch Chapter
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                IEEE Menoufia SB #STB20451
              </div>
            </div>
          </div>

          {/* Feedback Toasts */}
          {avatarSuccess && (
            <div
              className="badge-success"
              style={{
                marginTop: 'var(--space-4)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Avatar updated successfully!</span>
            </div>
          )}

          {error && (
            <div
              className="badge-danger"
              style={{
                marginTop: 'var(--space-4)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-2)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <User size={15} />
            <span>Overview & Roles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <KeyRound size={15} />
            <span>Security & Sessions</span>
          </button>
        </div>

        {/* Tab 1: Overview & Scopes Bento Grid */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
            {/* Card A: Account Details */}
            <div className="bento-card" style={{ padding: 'var(--space-6)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <User size={16} />
                <span>Account Credentials</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem' }}>Full Legal Name</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>{user.name}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem' }}>Primary Email</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>{user.email}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem' }}>User Unique ID</div>
                  <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{user.id}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem' }}>Default Global Role</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span className={`badge ${getRoleBadgeClass(user.defaultRole || user.role)}`}>
                      {user.defaultRole || user.role}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>IEEE Membership ID</div>
                    {!editingMembership && (
                      <button
                        type="button"
                        onClick={() => {
                          setMembershipInput(user.membershipId || '');
                          setEditingMembership(true);
                        }}
                        className="btn btn-ghost btn-xs"
                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                      >
                        {user.membershipId ? 'Edit' : '+ Add ID'}
                      </button>
                    )}
                  </div>

                  {editingMembership ? (
                    <form onSubmit={handleSaveMembership} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        placeholder="e.g. 98765432"
                        value={membershipInput}
                        onChange={(e) => setMembershipInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                          fontSize: '0.875rem',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={savingMembership}
                        className="btn btn-primary btn-xs"
                        style={{ padding: '0.4rem 0.75rem' }}
                      >
                        {savingMembership ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMembership(false)}
                        className="btn btn-ghost btn-xs"
                        style={{ padding: '0.4rem 0.5rem' }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user.membershipId ? (
                        <>
                          <span style={{ fontSize: '0.9375rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text)' }}>
                            {user.membershipId}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                            VERIFIED
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          Not provided
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card B: Assigned Committee Scopes & Switcher */}
            <div className="bento-card" style={{ padding: 'var(--space-6)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <Layers size={16} />
                  <span>Assigned Scopes ({user.availableScopes?.length || 1})</span>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                Click any scope below to instantly switch your active operating context and permissions across the portal.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {user.availableScopes && user.availableScopes.length > 0 ? (
                  user.availableScopes.map((scope) => {
                    const scopeKey = scope.id || scope.scopeId;
                    const isActive =
                      (user.scopeId === scope.scopeId || user.scopeId === scope.id) &&
                      user.role === scope.role;
                    const isSwitching = switchingScopeId === scopeKey;

                    return (
                      <div
                        key={scopeKey}
                        style={{
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isActive ? 'var(--color-primary-light)' : 'rgba(255, 255, 255, 0.02)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isActive ? 'var(--color-primary)' : 'var(--color-text)' }}>
                              {scope.label || `${scope.role} (${scope.scopeType})`}
                            </span>
                            <span className={`badge ${getRoleBadgeClass(scope.role)}`} style={{ fontSize: '0.6875rem' }}>
                              {scope.role}
                            </span>
                          </div>
                          {scope.committeeName && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {scope.committeeName}
                            </span>
                          )}
                        </div>

                        {isActive ? (
                          <span
                            className="badge badge-primary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            <Check size={12} />
                            ACTIVE
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleScopeSwitch(scope)}
                            disabled={isSwitching}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                          >
                            {isSwitching ? (
                              <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                            ) : (
                              'Switch'
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Active as default {user.role} ({user.scopeType}).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security & Sessions */}
        {activeTab === 'security' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
            <div className="bento-card" style={{ padding: 'var(--space-6)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <Shield size={16} />
                <span>Session Security</span>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                Your portal session is authenticated via rotating cryptographic JWT tokens with token family replay protection and automated silent refresh.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Active JWT Token</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Automated background rotation active</div>
                  </div>
                  <span className="badge badge-success">PROTECTED</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>HMAC Service Signature</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Cross-service internal verification</div>
                  </div>
                  <span className="badge badge-primary">ENABLED</span>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-outline"
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', gap: '0.5rem' }}
                >
                  <LogOut size={16} />
                  <span>Terminate Active Session</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
