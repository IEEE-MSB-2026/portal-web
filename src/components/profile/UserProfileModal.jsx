import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import { useToastStore } from '../../stores/toastStore';
import {
  User,
  Mail,
  Phone,
  Layers,
  Award,
  CheckCircle2,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  MessageSquare,
  Calendar,
  X,
  Sparkles,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import '../../styles/profile.css';

export default function UserProfileModal({ userId, isOpen, onClose }) {
  const navigate = useNavigate();
  const toast = useToastStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const backdropDismiss = useBackdropDismiss(onClose, { isOpen: Boolean(isOpen && userId) });

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getUserProfile(userId);
        if (isMounted) {
          setProfile(res.profile);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load user profile:', err);
          setError(err.message || 'Could not load member profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Joined Member';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Joined Member';
    }
  };

  return (
    <div className="modal-overlay" {...backdropDismiss.getBackdropProps()} style={{ zIndex: 1300 }}>
      <div
        className="modal-content profile-quick-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '580px',
          width: '100%',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Modal Banner Header */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #002F4C 0%, #00629B 60%, #00A6C4 100%)',
            padding: '2rem 1.5rem 1.25rem',
            color: '#fff',
          }}
        >
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-label="Close profile modal"
          >
            <X size={18} />
          </button>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                className="dashboard-shimmer"
                style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div className="dashboard-shimmer" style={{ width: '60%', height: '1.25rem', marginBottom: '0.5rem' }} />
                <div className="dashboard-shimmer" style={{ width: '40%', height: '0.875rem' }} />
              </div>
            </div>
          ) : error ? (
            <div style={{ padding: '1rem 0', color: '#ffb4b4' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            </div>
          ) : profile ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '4.75rem',
                  height: '4.75rem',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '3px solid rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#fff',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                }}
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{getInitials(profile.name)}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                    {profile.name}
                  </h3>
                 
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem', fontSize: '0.75rem', opacity: 0.9 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} />
                    Member since {formatDate(profile.createdAt)}
                  </span>
                </div>

                {/* Bio & Social Icons Row */}
                {(profile.bio || (profile.socialLinks && Object.values(profile.socialLinks).some(Boolean))) && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                    {/* Bio on Left */}
                    {profile.bio ? (
                      <div
                        style={{
                          background: 'rgba(0, 20, 40, 0.35)',
                          border: '1px solid rgba(255, 255, 255, 0.16)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.8125rem',
                          lineHeight: 1.45,
                          color: 'rgba(255, 255, 255, 0.95)',
                          width: 'fit-content',
                          maxWidth: '100%',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {profile.bio}
                      </div>
                    ) : <div />}

                    {/* Social icons on Right */}
                    {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                        {profile.socialLinks.github && (
                          <a
                            href={profile.socialLinks.github}
                            target="_blank"
                            rel="noreferrer"
                            className="profile-social-btn"
                            title="GitHub"
                            style={{ width: '1.875rem', height: '1.875rem' }}
                          >
                            <Github size={13} />
                          </a>
                        )}
                        {profile.socialLinks.linkedin && (
                          <a
                            href={profile.socialLinks.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="profile-social-btn"
                            title="LinkedIn"
                            style={{ width: '1.875rem', height: '1.875rem' }}
                          >
                            <Linkedin size={13} />
                          </a>
                        )}
                        {profile.socialLinks.website && (
                          <a
                            href={profile.socialLinks.website}
                            target="_blank"
                            rel="noreferrer"
                            className="profile-social-btn"
                            title="Portfolio / Website"
                            style={{ width: '1.875rem', height: '1.875rem' }}
                          >
                            <Globe size={13} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="dashboard-shimmer" style={{ height: '60px', borderRadius: 'var(--radius-md)' }} />
              <div className="dashboard-shimmer" style={{ height: '100px', borderRadius: 'var(--radius-md)' }} />
            </div>
          ) : profile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Verified Committees & Roles */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="var(--color-primary)" />
                  Committees
                </h4>
                {profile.committees && profile.committees.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {profile.committees.map((c) => {
                      const isLead = c.roleInCommittee === 'lead';
                      const isHR = c.roleInCommittee === 'hr';
                      return (
                        <div
                          key={c.committeeId}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <strong style={{ color: 'var(--color-text)' }}>{c.committeeName}</strong>
                          <span
                            className={`badge ${isLead ? 'badge-warning' : isHR ? 'badge-hr' : 'badge-primary'}`}
                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
                          >
                            {(c.roleInCommittee || 'member').toUpperCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    General Branch Member
                  </span>
                )}
              </div>

              {/* Elevated Contact Details (Visible to HR, Leads, Admin, Self) */}
              {profile.canViewPrivate && (profile.email || profile.phone) && (
                <div
                  style={{
                    background: 'rgba(0, 98, 155, 0.08)',
                    border: '1px solid rgba(0, 98, 155, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', margin: 0 }}>
                      Contact Details
                    </h4>
                    <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                      Private Access
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                    {profile.email && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Mail size={14} color="var(--color-primary)" />
                          <span style={{ color: 'var(--color-text)' }}>{profile.email}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleCopy(profile.email, 'email')}
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                        >
                          {copiedEmail ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                          <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {profile.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Phone size={14} color="var(--color-primary)" />
                          <span style={{ color: 'var(--color-text)' }}>{profile.phone}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleCopy(profile.phone, 'phone')}
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                        >
                          {copiedPhone ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                          <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            background: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>

          {profile && (
            <Link
              to={`/profile/${profile.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
            >
              <span>View Full Profile</span>
              <ExternalLink size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
