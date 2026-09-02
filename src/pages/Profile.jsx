import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import '../styles/profile.css';
import {
  User,
  Shield,
  Layers,
  GraduationCap,
  Building2,
  Building,
  BookOpen,
  CalendarClock,
  Calendar,
  CreditCard,
  Sparkles,
  Copy,
  Check,
  Share2,
  Edit3,
  Globe,
  Github,
  Linkedin,
  Mail,
  Phone,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Camera,
  Activity,
  ListTodo,
  FileCheck,
  Award,
  Briefcase,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function Profile() {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToastStore();

  const authUser = useAuthStore((state) => state.user);
  const authUserId = authUser?.id || authUser?.sub || authUser?.userId;
  const currentAuthId = authUserId ? String(authUserId) : null;
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  const fileInputRef = useRef(null);

  // Target User & View Mode
  const isViewingSelf = !userId || (currentAuthId && String(userId) === currentAuthId);
  const targetUserId = isViewingSelf ? currentAuthId : userId;

  // Active Tab
  const requestedTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(requestedTab);

  // Profile Data State
  const [profileData, setProfileData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Settings Form State (3 Sections)
  // Section 1: Personal & Identity
  const [nameInput, setNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [membershipInput, setMembershipInput] = useState('');
  const [savingSec1, setSavingSec1] = useState(false);
  const [savedSec1, setSavedSec1] = useState(false);

  // Section 2: Academic Background
  const [universityInput, setUniversityInput] = useState('');
  const [facultyInput, setFacultyInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [academicYearInput, setAcademicYearInput] = useState('');
  const [savingSec2, setSavingSec2] = useState(false);
  const [savedSec2, setSavedSec2] = useState(false);

  // Section 3: Social Links
  const [githubInput, setGithubInput] = useState('');
  const [linkedinInput, setLinkedinInput] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  const [savingSec3, setSavingSec3] = useState(false);
  const [savedSec3, setSavedSec3] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Scope switch state
  const [switchingScopeId, setSwitchingScopeId] = useState(null);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'applications', 'settings'].includes(tab)) {
      if (tab === 'settings' && !isViewingSelf) {
        setActiveTab('overview');
      } else {
        setActiveTab(tab);
      }
    }
  }, [searchParams, isViewingSelf]);

  const handleTabChange = (newTab) => {
    if (newTab === 'settings' && !isViewingSelf) return;
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    if (newTab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', newTab);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Fetch Profile Data
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!targetUserId) return;
      setLoadingProfile(true);
      setProfileError(null);

      try {
        const res = await api.getUserProfile(targetUserId);
        const profile = res?.profile || res;
        if (!cancelled && profile) {
          setProfileData(profile);

          // Populate form inputs if viewing self
          if (isViewingSelf) {
            setNameInput(profile.name || authUser?.name || '');
            setMembershipInput(profile.membershipId || authUser?.membershipId || '');
            setBioInput(profile.bio || '');
            setUniversityInput(profile.university || '');
            setFacultyInput(profile.faculty || '');
            setDepartmentInput(profile.department || '');
            setAcademicYearInput(profile.academicYear || '');
            setPhoneInput(profile.phone || '');
            setGithubInput(profile.socialLinks?.github || '');
            setLinkedinInput(profile.socialLinks?.linkedin || '');
            setWebsiteInput(profile.socialLinks?.website || '');
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load profile:', err);
          setProfileError(err.message || 'Could not load user profile.');
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [targetUserId, isViewingSelf]);

  // Fetch Stats & Applications if viewing self
  useEffect(() => {
    if (!isViewingSelf) return;
    let cancelled = false;

    async function loadSelfExtras() {
      try {
        const stats = await api.getMyStats();
        if (!cancelled) setStatsData(stats);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }

      setLoadingApps(true);
      try {
        const apps = await api.getMyApplications();
        if (!cancelled) setMyApplications(apps?.applications || apps || []);
      } catch (err) {
        console.error('Failed to load my applications:', err);
      } finally {
        if (!cancelled) setLoadingApps(false);
      }
    }

    loadSelfExtras();
    return () => {
      cancelled = true;
    };
  }, [isViewingSelf]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied!', `${key} copied to clipboard.`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Clean Share Profile URL handler
  const handleShareProfile = () => {
    const shareId = profileData?.id || targetUserId || currentAuthId;
    const shareUrl = `${window.location.origin}/profile/${shareId}`;
    handleCopy(shareUrl, 'Profile URL');
  };

  // Utilities
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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

  // Helper to resolve committee name
  const getCommitteeName = (committeeId) => {
    if (!committeeId) return '';
    const match = (profileData?.committees || []).find((c) => c.committeeId === committeeId);
    if (match) return match.committeeName;
    const scopeMatch = (authUser?.availableScopes || []).find((s) => (s.committeeId || s.scopeId || s.id) === committeeId);
    if (scopeMatch) return scopeMatch.committeeName || scopeMatch.label || scopeMatch.name;
    return '';
  };

  // Avatar Upload Handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Invalid File', 'Please select a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File Too Large', 'Avatar image must be under 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await api.uploadAvatar(file);
      const updatedUser = res?.user || res?.profile || res;
      updateUser(updatedUser);
      setProfileData((prev) => (prev ? { ...prev, avatarUrl: updatedUser.avatarUrl || updatedUser.avatar_url } : prev));
      toast.success('Avatar Updated', 'Your profile picture has been updated.');
    } catch (err) {
      toast.error('Upload Failed', err.message || 'Could not upload avatar image.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Section 1 Save Handler: Personal Information & Identity
  const handleSaveSec1 = async (e) => {
    if (e) e.preventDefault();
    if (!nameInput.trim()) {
      toast.error('Validation Error', 'Full Name is required.');
      return;
    }

    setSavingSec1(true);
    try {
      const payload = {
        name: nameInput.trim(),
        membershipId: membershipInput.trim(),
        bio: bioInput.trim(),
        phone: phoneInput.trim(),
      };

      const res = await api.updateMyPublicProfile(payload);
      const updated = res?.profile || res;

      updateUser({
        name: payload.name,
        membershipId: payload.membershipId,
        avatarUrl: updated.avatarUrl || profileData?.avatarUrl,
      });

      setProfileData((prev) => ({
        ...prev,
        ...payload,
      }));

      setSavedSec1(true);
      toast.success('Saved', 'Personal information updated successfully.');
      setTimeout(() => setSavedSec1(false), 2500);
    } catch (err) {
      toast.error('Save Failed', err.message || 'Could not save personal information.');
    } finally {
      setSavingSec1(false);
    }
  };

  // Section 2 Save Handler: Academic Background
  const handleSaveSec2 = async (e) => {
    if (e) e.preventDefault();
    setSavingSec2(true);
    try {
      const payload = {
        university: universityInput.trim(),
        faculty: facultyInput.trim(),
        department: departmentInput.trim(),
        academicYear: academicYearInput,
      };

      await api.updateMyPublicProfile(payload);

      setProfileData((prev) => ({
        ...prev,
        ...payload,
      }));

      setSavedSec2(true);
      toast.success('Saved', 'Academic credentials updated successfully.');
      setTimeout(() => setSavedSec2(false), 2500);
    } catch (err) {
      toast.error('Save Failed', err.message || 'Could not save academic details.');
    } finally {
      setSavingSec2(false);
    }
  };

  // Section 3 Save Handler: Social Links & Portfolios
  const handleSaveSec3 = async (e) => {
    if (e) e.preventDefault();
    setSavingSec3(true);
    try {
      const payload = {
        socialLinks: {
          github: githubInput.trim(),
          linkedin: linkedinInput.trim(),
          website: websiteInput.trim(),
        },
      };

      await api.updateMyPublicProfile(payload);

      setProfileData((prev) => ({
        ...prev,
        socialLinks: payload.socialLinks,
      }));

      setSavedSec3(true);
      toast.success('Saved', 'Social links updated successfully.');
      setTimeout(() => setSavedSec3(false), 2500);
    } catch (err) {
      toast.error('Save Failed', err.message || 'Could not save social links.');
    } finally {
      setSavingSec3(false);
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
      toast.success('Password Changed', 'Your password has been updated securely.');
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
      toast.success('Context Switched', `Active workspace changed to ${scope.name}.`);
    } catch (err) {
      toast.error('Switch Failed', err.message || 'Failed to switch context scope.');
    } finally {
      setSwitchingScopeId(null);
    }
  };

  // Loading State
  if (loadingProfile && !profileData) {
    return (
      <div className="section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
          <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Loading profile...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (profileError && !profileData) {
    return (
      <div className="section" style={{ minHeight: '75vh' }}>
        <div className="container container-narrow">
          <div className="profile-empty" style={{ padding: '4rem 2rem' }}>
            <div className="profile-empty__icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-destructive)' }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>Profile Unavailable</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: 420, margin: '0 auto 1.5rem' }}>
              {profileError}
            </p>
            <Link to="/workspace" className="btn btn-primary btn-sm">
              Return to Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Computed Values
  const user = profileData || authUser || {};
  const isOwner = isViewingSelf;
  const memberSince = user.memberSince || user.createdAt;
  const daysMember = statsData?.daysMember || getDaysSince(memberSince);
  const pwStrength = getPasswordStrength(newPassword);

  const committees = user.committees || (authUser?.availableScopes || [])
    .filter((s) => s.scopeType === 'committee' || s.committeeId)
    .map((s) => ({
      committeeId: s.committeeId || s.scopeId,
      committeeName: s.committeeName || s.label || 'Committee',
      committeeSlug: s.committeeSlug || s.slug || 'committee',
      roleInCommittee: s.role || 'member',
      joinedAt: s.joinedAt || s.createdAt || null,
    }));

  const userCommitteesScopes = (authUser?.availableScopes || [])
    .filter((s) => s.scopeType === 'committee' || s.committeeId)
    .map((s) => ({
      id: s.committeeId || s.scopeId,
      scopeId: s.id || s.scopeId,
      name: s.committeeName || s.label || 'Committee',
      slug: s.committeeSlug || s.slug || 'committee',
      role: s.role || 'member',
    }));

  const stats = user.stats || {
    tasksCompleted: statsData?.tasks?.done || 0,
    assignmentsSubmitted: statsData?.assignments?.submitted || 0,
    committeesCount: committees.length,
  };

  const socials = user.socialLinks || {};
  const hasSocials = Boolean(socials.github || socials.linkedin || socials.website);
  const hasAcademicInfo = Boolean(user.university || user.faculty || user.department || user.academicYear);

  // Applications list: prefer loaded self applications or profile-attached applications
  const applicationsList = isOwner && myApplications.length > 0 ? myApplications : (user.applications || myApplications || []);
  const authUserRole = (authUser?.role || '').toLowerCase();
  const canViewApplications = isOwner || ['admin', 'officer', 'lead', 'hr'].includes(authUserRole) || authUser?.isHR;

  // Resolve user role with robust fallback (ensuring role badge ALWAYS renders)
  const resolvedRole = (
    user.role ||
    user.defaultRole ||
    (isViewingSelf ? authUser?.role : null) ||
    committees.find((c) => (c.roleInCommittee || '').toLowerCase() === 'lead')?.roleInCommittee ||
    committees.find((c) => (c.roleInCommittee || '').toLowerCase() === 'hr')?.roleInCommittee ||
    (committees.length > 0 ? committees[0].roleInCommittee : null) ||
    'member'
  ).toLowerCase();

  return (
    <div className="section" style={{ minHeight: '85vh' }}>
      <div className="container container-narrow">

        {/* Hidden File Input for Avatar Upload */}
        {isOwner && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        )}

        {/* ============================================================
            HERO BANNER
            ============================================================ */}
        <div className="profile-hero">
          {/* Top-Right Corner Action Cluster (Share + Edit) */}
          <div className="profile-hero__corner-actions">
            <button
              type="button"
              className="profile-hero__corner-share-btn"
              onClick={handleShareProfile}
              title="Copy clean public profile link"
              aria-label="Share Profile"
            >
              {copiedKey === 'Profile URL' ? <Check size={12} /> : <Share2 size={12} />}
              <span>{copiedKey === 'Profile URL' ? 'Copied!' : 'Share'}</span>
            </button>

            {isOwner && activeTab !== 'settings' && (
              <button
                type="button"
                className="profile-hero__corner-icon-btn"
                onClick={() => handleTabChange('settings')}
                title="Edit Profile Settings"
                aria-label="Edit Profile Settings"
              >
                <Edit3 size={13} />
              </button>
            )}
          </div>

          <div className="profile-hero__layout">
            <div className="profile-hero__main">
              {/* Avatar */}
              <div className="profile-hero__avatar-wrap">
                <div className="profile-hero__avatar">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || 'User avatar'} />
                  ) : (
                    <span className="profile-hero__avatar-initials">{getInitials(user.name)}</span>
                  )}
                </div>
                {isOwner && (
                  <button
                    type="button"
                    className="profile-hero__upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    aria-label="Upload profile avatar"
                    title="Upload new avatar photo"
                  >
                    {uploadingAvatar ? (
                      <div className="spinner" style={{ width: '0.875rem', height: '0.875rem', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    ) : (
                      <Camera size={11} />
                    )}
                  </button>
                )}
              </div>

              {/* User Identity Info */}
              <div className="profile-hero__info">
                {/* 1. Name Row: Name + Role Badge */}
                <div className="profile-hero__name-row">
                  <div className="profile-hero__name-group">
                    <h1 className="profile-hero__name">{user.name || 'IEEE Member'}</h1>
                    <span className={`profile-hero__badge profile-hero__badge--${resolvedRole}`}>
                      <Shield size={11} />
                      <span>{resolvedRole.toUpperCase()}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Badges Strip: IEEE ID + Joined Date + Committee Scope */}
                <div className="profile-hero__badges">
                  {user.membershipId && (
                    <span
                      className="profile-hero__badge profile-hero__badge--verified"
                      onClick={() => handleCopy(user.membershipId, 'IEEE Membership ID')}
                      style={{ cursor: 'pointer' }}
                      title="Click to copy IEEE Membership ID"
                    >
                      <CreditCard size={11} />
                      <span style={{ fontFamily: 'var(--font-mono)' }}>Membership ID: {user.membershipId}</span>
                      {copiedKey === 'IEEE Membership ID' ? <Check size={11} /> : <Copy size={11} style={{ opacity: 0.7 }} />}
                    </span>
                  )}
                  {memberSince && (
                    <span className="profile-hero__badge profile-hero__badge--joined" title={`Joined ${formatDate(memberSince)}`}>
                      <Calendar size={11} />
                      <span>Joined {formatDate(memberSince)}</span>
                    </span>
                  )}
                  {user.scopeType && user.scopeType !== 'global' && (
                    <span className="profile-hero__badge profile-hero__badge--scope">
                      <Layers size={11} />
                      <span>{user.committeeSlug?.toUpperCase() || user.committeeName || user.scopeType?.toUpperCase()}</span>
                    </span>
                  )}
                </div>

                {/* 3. EMBEDDED BIO IN HERO (Fitted box that hugs text) */}
                {user.bio ? (
                  <div className="profile-hero__bio-box">
                    <p className="profile-hero__bio-text">{user.bio}</p>
                  </div>
                ) : isOwner ? (
                  <div className="profile-hero__bio-box profile-hero__bio-box--empty">
                    <span>No bio written yet.</span>
                    <button
                      type="button"
                      onClick={() => handleTabChange('settings')}
                      className="profile-hero__bio-btn"
                    >
                      <Edit3 size={11} /> Add Bio
                    </button>
                  </div>
                ) : null}

                {/* 4. BOTTOM BAR: Connection & Contact Icons */}
                <div className="profile-hero__bottom-bar">
                  <div className="profile-hero__socials-and-contact">
                    {/* Official Email */}
                    {user.email && (
                      <div
                        className="profile-hero__contact-pill"
                        onClick={() => handleCopy(user.email, 'Email')}
                        title="Click to copy official email"
                      >
                        <Mail size={12} />
                        <span>{user.email}</span>
                        {copiedKey === 'Email' ? <Check size={11} /> : <Copy size={11} style={{ opacity: 0.6 }} />}
                      </div>
                    )}

                    {/* Official Phone */}
                    {user.phone && (
                      <div
                        className="profile-hero__contact-pill"
                        onClick={() => handleCopy(user.phone, 'Phone')}
                        title="Click to copy phone number"
                      >
                        <Phone size={12} />
                        <span>{user.phone}</span>
                        {copiedKey === 'Phone' ? <Check size={11} /> : <Copy size={11} style={{ opacity: 0.6 }} />}
                      </div>
                    )}

                    {/* GitHub */}
                    {socials.github && (
                      <a href={socials.github} target="_blank" rel="noopener noreferrer" className="profile-social-btn" title="GitHub">
                        <Github size={14} />
                      </a>
                    )}

                    {/* LinkedIn */}
                    {socials.linkedin && (
                      <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="profile-social-btn" title="LinkedIn">
                        <Linkedin size={14} />
                      </a>
                    )}

                    {/* Portfolio / Website */}
                    {socials.website && (
                      <a href={socials.website} target="_blank" rel="noopener noreferrer" className="profile-social-btn" title="Portfolio / Website">
                        <Globe size={14} />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            TAB NAVIGATION (Only shown if more than 1 tab available)
            ============================================================ */}
        {(canViewApplications || isOwner) && (
          <div className="profile-tabs">
            <button
              type="button"
              className={`profile-tab ${activeTab === 'overview' ? 'profile-tab--active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              <User size={14} />
              <span>Overview</span>
            </button>

            {canViewApplications && (
              <button
                type="button"
                className={`profile-tab ${activeTab === 'applications' ? 'profile-tab--active' : ''}`}
                onClick={() => handleTabChange('applications')}
              >
                <Briefcase size={14} />
                <span>Applications</span>
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                className={`profile-tab ${activeTab === 'settings' ? 'profile-tab--active' : ''}`}
                onClick={() => handleTabChange('settings')}
              >
                <Edit3 size={14} />
                <span>Settings & Security</span>
              </button>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 1: OVERVIEW
            - Row 1: Academic & Campus Education (col-7) + Contributions (col-5)
            - Row 2: Technical Committees (col-12 line alone)
            ============================================================ */}
        {activeTab === 'overview' && (
          <div className="profile-bento-grid">

            {/* 1. ACADEMIC & CAMPUS EDUCATION (COL-7) */}
            <div className="profile-bento-card profile-bento-card--col-7">
              <div className="profile-bento-header">
                <span className="profile-bento-header__title">
                  <GraduationCap size={16} />
                  <span>Academic Education</span>
                </span>
                {isOwner && (
                  <button
                    type="button"
                    className="profile-bento-header__action"
                    onClick={() => handleTabChange('settings')}
                  >
                    <Edit3 size={11} /> Edit
                  </button>
                )}
              </div>

              {hasAcademicInfo ? (
                <div className="profile-academic-grid">
                  {/* University */}
                  <div className="profile-academic-item">
                    <div className="profile-academic-item__icon">
                      <Building2 size={16} />
                    </div>
                    <div className="profile-academic-item__content">
                      <div className="profile-academic-item__label">University</div>
                      <div className="profile-academic-item__value">
                        {user.university || 'Not Specified'}
                      </div>
                    </div>
                  </div>

                  {/* Faculty */}
                  <div className="profile-academic-item">
                    <div className="profile-academic-item__icon">
                      <Building size={16} />
                    </div>
                    <div className="profile-academic-item__content">
                      <div className="profile-academic-item__label">Faculty / School</div>
                      <div className="profile-academic-item__value">
                        {user.faculty || 'Not Specified'}
                      </div>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="profile-academic-item">
                    <div className="profile-academic-item__icon">
                      <BookOpen size={16} />
                    </div>
                    <div className="profile-academic-item__content">
                      <div className="profile-academic-item__label">Department / Major</div>
                      <div className="profile-academic-item__value">
                        {user.department || 'Not Specified'}
                      </div>
                    </div>
                  </div>

                  {/* Academic Year */}
                  <div className="profile-academic-item">
                    <div className="profile-academic-item__icon">
                      <CalendarClock size={16} />
                    </div>
                    <div className="profile-academic-item__content">
                      <div className="profile-academic-item__label">Academic Standing</div>
                      <div className="profile-academic-item__value">
                        {user.academicYear ? (
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {user.academicYear}
                          </span>
                        ) : (
                          'Not Specified'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontStyle: 'italic', padding: '1.5rem 0' }}>
                  {isOwner ? (
                    <div>
                      <span>No academic details provided yet. Add your university, faculty, department, and academic standing.</span>
                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => handleTabChange('settings')}
                          style={{ gap: '0.35rem' }}
                        >
                          <Edit3 size={11} /> Add Academic Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    'Academic details have not been provided.'
                  )}
                </div>
              )}
            </div>

            {/* 2. CONTRIBUTIONS & ACTIVITY BENTO STATS (COL-5 — RIGHT SIDE-BY-SIDE) */}
            <div className="profile-bento-card profile-bento-card--col-5">
              <div className="profile-bento-header">
                <span className="profile-bento-header__title">
                  <Activity size={16} />
                  <span>Contributions & Activity</span>
                </span>
              </div>

              <div className="profile-stats-grid">
                <div className="profile-stat-box">
                  <div className="profile-stat-box__icon">
                    <ListTodo size={16} />
                  </div>
                  <div className="profile-stat-box__value">{stats.tasksCompleted ?? 0}</div>
                  <div className="profile-stat-box__label">Tasks Completed</div>
                </div>

                <div className="profile-stat-box">
                  <div className="profile-stat-box__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <FileCheck size={16} />
                  </div>
                  <div className="profile-stat-box__value">{stats.assignmentsSubmitted ?? 0}</div>
                  <div className="profile-stat-box__label">Delivered Work</div>
                </div>

                <div className="profile-stat-box">
                  <div className="profile-stat-box__icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                    <Layers size={16} />
                  </div>
                  <div className="profile-stat-box__value">{committees.length}</div>
                  <div className="profile-stat-box__label">Active Committees</div>
                </div>

                <div className="profile-stat-box">
                  <div className="profile-stat-box__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <Award size={16} />
                  </div>
                  <div className="profile-stat-box__value">{daysMember}</div>
                  <div className="profile-stat-box__label">Days as Member</div>
                </div>
              </div>
            </div>

            {/* 3. TECHNICAL COMMITTEES (COL-12 — FULL WIDTH LINE ALONE) */}
            <div className="profile-bento-card profile-bento-card--col-12">
              <div className="profile-bento-header">
                <span className="profile-bento-header__title">
                  <Layers size={16} />
                  <span>Committees</span>
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {committees.length} Committee{committees.length !== 1 ? 's' : ''}
                </span>
              </div>

              {committees.length > 0 ? (
                <div className="profile-committees-list">
                  {committees.map((c) => {
                    const role = (c.roleInCommittee || 'member').toLowerCase();
                    const isLead = role === 'lead';
                    const isHr = role === 'hr';

                    return (
                      <div key={c.committeeId || c.committeeSlug} className="profile-committee-badge-card">
                        <div className="profile-committee-badge-card__info">
                          <span className="profile-committee-badge-card__name">{c.committeeName}</span>
                          <span className="profile-committee-badge-card__date">
                            {c.joinedAt ? `Joined ${formatDate(c.joinedAt)}` : 'Active Member'}
                          </span>
                          {isOwner && (
                            <div style={{ marginTop: '0.4rem' }}>
                              <Link
                                to={`/workspace?committee=${c.committeeId}`}
                                className="btn btn-outline btn-xs"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.71875rem', padding: '0.2rem 0.55rem', textDecoration: 'none' }}
                              >
                                <span>Workspace</span>
                                <ExternalLink size={10} />
                              </Link>
                            </div>
                          )}
                        </div>

                        <span
                          className={`badge ${
                            isLead ? 'badge-warning' : isHr ? 'badge-hr' : 'badge-primary'
                          }`}
                          style={{ fontSize: '0.71875rem', fontWeight: 700, textTransform: 'uppercase', alignSelf: 'flex-start' }}
                        >
                          {role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="profile-empty" style={{ padding: '2.5rem 1rem' }}>
                  <div className="profile-empty__icon-wrap">
                    <Layers size={28} />
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
                    No Committee Memberships
                  </h4>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No active committee memberships found for this member.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================
            TAB 2: APPLICATIONS (RECRUITMENT & CAMPAIGN APPLICATIONS)
            ============================================================ */}
        {activeTab === 'applications' && canViewApplications && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="profile-bento-card profile-bento-card--col-12">
              <div className="profile-bento-header">
                <span className="profile-bento-header__title">
                  <Briefcase size={16} />
                  <span>{isOwner ? 'My Recruitment Applications' : `${user.name || 'Member'}'s Applications`}</span>
                </span>
                {isOwner && (
                  <Link to="/committees" className="btn btn-secondary btn-xs" style={{ gap: '0.35rem', textDecoration: 'none' }}>
                    <span>Browse Open Positions</span>
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>

              {loadingApps ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span>Loading application records...</span>
                </div>
              ) : applicationsList.length > 0 ? (
                <div className="profile-applications-table-wrap">
                  <table className="profile-applications-table">
                    <thead>
                      <tr>
                        <th>Campaign / Position</th>
                        <th>Committee</th>
                        <th>Current Stage</th>
                        <th>Submitted Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicationsList.map((app) => {
                        const stage = (app.currentStage || app.status || 'applied').toLowerCase();
                        const isAccepted = stage === 'accepted';
                        const isRejected = stage === 'rejected';
                        const resolvedCommitteeName = app.committeeName || getCommitteeName(app.committeeId) || 'Committee';

                        return (
                          <tr key={app.id || app.applicationId}>
                            <td style={{ fontWeight: 600 }}>{app.campaignTitle || 'Recruitment Campaign'}</td>
                            <td>
                              <span className="badge badge-committee">{resolvedCommitteeName}</span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  isAccepted ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning'
                                }`}
                                style={{ textTransform: 'capitalize' }}
                              >
                                {stage.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                              {formatDate(app.submittedAt || app.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="profile-empty" style={{ padding: '2.5rem 1rem' }}>
                  <div className="profile-empty__icon-wrap">
                    <Briefcase size={28} />
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
                    No Applications Found
                  </h4>
                  <p style={{ margin: isOwner ? '0 0 1rem' : '0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {isOwner
                      ? "You haven't submitted any recruitment applications yet."
                      : 'No applications submitted by this member.'}
                  </p>
                  {isOwner && (
                    <Link to="/committees" className="btn btn-primary btn-xs" style={{ textDecoration: 'none' }}>
                      Browse Open Positions
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: SETTINGS & SECURITY (OWNER ONLY — 3 SECTIONS WITH DEDICATED SAVES)
            ============================================================ */}
        {isOwner && activeTab === 'settings' && (
          <div className="profile-settings">

            {/* SECTION 1: PERSONAL INFORMATION */}
            <div className="profile-settings-card">
              <div className="profile-settings-card__header">
                <User size={16} />
                <span>Personal Information</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem' }}>
                Manage your official identity details, bio, and contact information.
              </p>

              <form onSubmit={handleSaveSec1}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {/* Full Name */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">Full Name *</span>
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="Enter your full name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                    />
                  </div>

                  {/* IEEE Global Membership ID */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">IEEE Global Membership ID</span>
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="e.g. 98765432"
                      value={membershipInput}
                      onChange={(e) => setMembershipInput(e.target.value)}
                    />
                  </div>

                  {/* Official Email (Disabled / Read-only) */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">Email</span>
                    <input
                      type="email"
                      className="profile-input"
                      value={user.email || authUser?.email || ''}
                      disabled
                      style={{ opacity: 0.75, cursor: 'not-allowed', background: 'var(--color-bg)' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      Managed by branch administration.
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">Phone</span>
                    <input
                      type="tel"
                      className="profile-input"
                      placeholder="e.g. +20 100 123 4567"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                    />
                  </div>
                </div>

                {/* Bio / About */}
                <div className="profile-field" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span className="profile-field__label">About / Bio</span>
                    <span style={{ fontSize: '0.75rem', color: (bioInput || '').length > 280 ? 'var(--color-destructive)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {(bioInput || '').length} / 300
                    </span>
                  </div>
                  <textarea
                    className="profile-input"
                    rows={3}
                    maxLength={300}
                    placeholder="Tell other IEEE members about your passions, technical focus, and journey..."
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '80px', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Section 1 Save Button */}
                <button
                  type="submit"
                  disabled={savingSec1 || savedSec1}
                  className={`btn ${savedSec1 ? 'btn-success' : 'btn-primary'} btn-sm`}
                  style={{ gap: '0.4rem' }}
                >
                  {savedSec1 ? <Check size={14} /> : <Save size={14} />}
                  <span>{savedSec1 ? 'Saved Personal Info' : savingSec1 ? 'Saving…' : 'Save Personal Info'}</span>
                </button>
              </form>
            </div>

            {/* SECTION 2: ACADEMIC BACKGROUND */}
            <div className="profile-settings-card">
              <div className="profile-settings-card__header">
                <GraduationCap size={16} />
                <span>Academic Background</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem' }}>
                Your campus education credentials and current university standing.
              </p>

              <form onSubmit={handleSaveSec2}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {/* University */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">University</span>
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="e.g. Menoufia University"
                      value={universityInput}
                      onChange={(e) => setUniversityInput(e.target.value)}
                    />
                  </div>

                  {/* Faculty */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">Faculty / School</span>
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="e.g. Faculty of Electronic Engineering"
                      value={facultyInput}
                      onChange={(e) => setFacultyInput(e.target.value)}
                    />
                  </div>

                  {/* Department */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">Department / Major</span>
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="e.g. Computer Science & Engineering"
                      value={departmentInput}
                      onChange={(e) => setDepartmentInput(e.target.value)}
                    />
                  </div>

                  {/* Academic Year */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">Academic Standing</span>
                    <select
                      className="profile-input"
                      value={academicYearInput}
                      onChange={(e) => setAcademicYearInput(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">Select Academic Year</option>
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                      <option value="Fifth Year">Fifth Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                </div>

                {/* Section 2 Save Button */}
                <button
                  type="submit"
                  disabled={savingSec2 || savedSec2}
                  className={`btn ${savedSec2 ? 'btn-success' : 'btn-primary'} btn-sm`}
                  style={{ gap: '0.4rem' }}
                >
                  {savedSec2 ? <Check size={14} /> : <Save size={14} />}
                  <span>{savedSec2 ? 'Saved Academic Details' : savingSec2 ? 'Saving…' : 'Save Academic Details'}</span>
                </button>
              </form>
            </div>

            {/* SECTION 3: SOCIAL LINKS & PORTFOLIOS */}
            <div className="profile-settings-card">
              <div className="profile-settings-card__header">
                <Globe size={16} />
                <span>Social Links & Portfolios</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem' }}>
                Connect your external developer profiles and portfolios for other members to explore.
              </p>

              <form onSubmit={handleSaveSec3}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {/* GitHub */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">GitHub URL</span>
                    <div style={{ position: 'relative' }}>
                      <Github size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="url"
                        className="profile-input"
                        placeholder="https://github.com/username"
                        value={githubInput}
                        onChange={(e) => setGithubInput(e.target.value)}
                        style={{ paddingLeft: '2.25rem' }}
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">LinkedIn URL</span>
                    <div style={{ position: 'relative' }}>
                      <Linkedin size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="url"
                        className="profile-input"
                        placeholder="https://linkedin.com/in/username"
                        value={linkedinInput}
                        onChange={(e) => setLinkedinInput(e.target.value)}
                        style={{ paddingLeft: '2.25rem' }}
                      />
                    </div>
                  </div>

                  {/* Portfolio / Website */}
                  <div className="profile-field" style={{ marginBottom: 0 }}>
                    <span className="profile-field__label">Portfolio / Website URL</span>
                    <div style={{ position: 'relative' }}>
                      <Globe size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="url"
                        className="profile-input"
                        placeholder="https://yourwebsite.com"
                        value={websiteInput}
                        onChange={(e) => setWebsiteInput(e.target.value)}
                        style={{ paddingLeft: '2.25rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3 Save Button */}
                <button
                  type="submit"
                  disabled={savingSec3 || savedSec3}
                  className={`btn ${savedSec3 ? 'btn-success' : 'btn-primary'} btn-sm`}
                  style={{ gap: '0.4rem' }}
                >
                  {savedSec3 ? <Check size={14} /> : <Save size={14} />}
                  <span>{savedSec3 ? 'Saved Social Links' : savingSec3 ? 'Saving…' : 'Save Social Links'}</span>
                </button>
              </form>
            </div>

            {/* SECTION 4: CHANGE PASSWORD */}
            <div className="profile-settings-card">
              <div className="profile-settings-card__header">
                <KeyRound size={16} />
                <span>Change Password</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem' }}>
                Ensure your account is using a secure, strong password with numbers and symbols.
              </p>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '520px' }}>
                <div className="profile-field" style={{ marginBottom: 0 }}>
                  <span className="profile-field__label">Current Password</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      className="profile-input"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                    >
                      {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="profile-field" style={{ marginBottom: 0 }}>
                  <span className="profile-field__label">New Password</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      className="profile-input"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                    >
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="password-strength">
                      <div className={`password-strength__bar ${pwStrength >= 1 ? (pwStrength >= 3 ? 'password-strength__bar--strong' : 'password-strength__bar--medium') : 'password-strength__bar--weak'}`} />
                      <div className={`password-strength__bar ${pwStrength >= 2 ? (pwStrength >= 3 ? 'password-strength__bar--strong' : 'password-strength__bar--medium') : ''}`} />
                      <div className={`password-strength__bar ${pwStrength >= 3 ? 'password-strength__bar--strong' : ''}`} />
                      <div className={`password-strength__bar ${pwStrength >= 4 ? 'password-strength__bar--strong' : ''}`} />
                    </div>
                  )}
                </div>

                <div className="profile-field" style={{ marginBottom: 0 }}>
                  <span className="profile-field__label">Confirm New Password</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      className="profile-input"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                    >
                      {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword || savedPassword || !currentPassword || !newPassword}
                  className={`btn ${savedPassword ? 'btn-success' : 'btn-secondary'} btn-sm`}
                  style={{ alignSelf: 'flex-start', marginTop: '0.25rem', gap: '0.4rem' }}
                >
                  {savedPassword ? <Check size={14} /> : <KeyRound size={14} />}
                  <span>{savedPassword ? 'Password Changed!' : changingPassword ? 'Updating…' : 'Update Password'}</span>
                </button>
              </form>
            </div>

            {/* SECTION 5: SWITCH ACTIVE WORKSPACE CONTEXT */}
            {userCommitteesScopes.length > 1 && (
              <div className="profile-settings-card">
                <div className="profile-settings-card__header">
                  <Layers size={16} />
                  <span>Switch Active Workspace Context</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
                  Select which committee context your portal operates in by default.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {userCommitteesScopes.map((scope) => {
                    const isActive = authUser.scopeId === scope.id || authUser.scopeId === scope.scopeId;
                    const isSwitching = switchingScopeId === (scope.id || scope.scopeId);

                    return (
                      <button
                        key={scope.id || scope.scopeId}
                        type="button"
                        onClick={() => handleScopeSwitch(scope)}
                        disabled={isActive || isSwitching}
                        className={`profile-committee-badge-card ${isActive ? 'profile-committee-card--active' : ''}`}
                        style={{ textAlign: 'left', cursor: isActive ? 'default' : 'pointer', border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>{scope.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{scope.role}</div>
                        </div>
                        {isActive ? (
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                        ) : isSwitching ? (
                          <div className="spinner" style={{ width: '1rem', height: '1rem' }} />
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Switch</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 6: LOGOUT ACTION */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={logout}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-destructive)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
