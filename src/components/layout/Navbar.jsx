import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { api } from '../../services/api';
import {
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
  LayoutDashboard,
  LogOut,
  Layers,
  Check,
  Settings,
  Shield,
  Briefcase,
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const toast = useToastStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [switchingScopeId, setSwitchingScopeId] = useState(null);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Committee & Workspace permissions
  const hasCommitteeAccess = Boolean(
    user?.scopeType === 'committee' ||
    user?.committeeId ||
    (user?.availableScopes && user.availableScopes.some((s) => s.scopeType === 'committee' || s.committeeSlug || s.committeeName)) ||
    ['admin', 'officer'].includes(user?.role)
  );

  const showDashboard = isAuthenticated && hasCommitteeAccess;

  const navLinks = [
    { to: '/', label: 'Home' },
    ...(showDashboard
      ? [{ to: '/dashboard', label: 'Dashboard' }]
      : []),
    { to: '/committees', label: 'Committees' },
    { to: '/events', label: 'Events' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/gallery', label: 'Gallery' },
    ...(!showDashboard
      ? [{ to: '/join', label: 'Join Us' }]
      : []),
    { to: '/about', label: 'About' },
  ];

  // Available scopes for the user (filter out generic redundant defaults)
  const selectableScopes = (user?.availableScopes || []).filter(
    (s) => s.scopeType === 'committee' || s.committeeSlug || s.committeeName || (s.role !== 'applicant' && s.role !== 'member')
  );

  // HR Studio access: strictly Global Admin, Global Officer, or HR Committee Lead
  const isHrAuthorized =
    (user?.scopeType === 'global' && ['admin', 'officer'].includes(user?.role)) ||
    (user?.role === 'lead' && user?.committeeSlug === 'hr');

  const handleScopeSwitch = async (targetScope) => {
    const targetScopeId = targetScope.id || targetScope.scopeId;
    if (!targetScopeId) return;

    const isCurrentActive =
      (user?.scopeId === targetScope.scopeId || user?.scopeId === targetScope.id) &&
      user?.role === targetScope.role;

    if (isCurrentActive) {
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      return;
    }

    setSwitchingScopeId(targetScopeId);
    try {
      await api.switchContext({ targetScopeId });
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Scope switch error:', err);
      toast.error('Scope Switch Failed', err.message || 'Could not switch active scope.');
    } finally {
      setSwitchingScopeId(null);
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await api.logout();
    navigate('/', { replace: true });
  };

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

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: 'var(--navbar-bg)',
        borderBottom: '1px solid var(--color-border)',
        transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4.5rem',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.875rem',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            }}
          >
            IEEE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span>Menoufia SB</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              STUDENT BRANCH PORTAL
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary btn-icon"
            aria-label="Toggle visual theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Unauthenticated: Sign In */}
          {!isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-primary btn-sm">
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* Authenticated: User Avatar Pill & Floating Menu */}
          {isAuthenticated && user && (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="nav-user-pill-btn"
                aria-expanded={userDropdownOpen}
                aria-label="User profile & scope menu"
              >
                {/* Avatar Image or Initials */}
                <div className="nav-user-pill-btn__avatar">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                    />
                  ) : (
                    <span>{getInitials(user.name)}</span>
                  )}
                </div>

                {/* User Active Role Pill (Desktop) */}
                <div className="nav-user-label">
                  <span className="nav-user-label__name">
                    {user.name?.split(' ')[0]}
                  </span>
                  <span
                    className={`badge ${getRoleBadgeClass(user.role)}`}
                    style={{ fontSize: '0.6875rem', padding: '0.1rem 0.45rem' }}
                  >
                    {user.committeeSlug ? `${user.role?.toUpperCase()}` : user.role?.toUpperCase()}
                  </span>
                </div>

                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--color-text-muted)',
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </button>

              {/* Floating Glassmorphism Dropdown */}
              {userDropdownOpen && (
                <div className="nav-profile-dropdown" role="menu">
                  {/* Dark Navy Gradient Header */}
                  <div className="nav-profile-header">
                    <div className="nav-profile-header__layout">
                      <div className="nav-profile-header__avatar">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} />
                        ) : (
                          <span>{getInitials(user.name)}</span>
                        )}
                      </div>
                      <div className="nav-profile-header__meta">
                        <div className="nav-profile-header__name">{user.name}</div>
                        <div className="nav-profile-header__email">{user.email}</div>
                        <div className="nav-profile-header__badges">
                          <span className="nav-profile-badge nav-profile-badge--role">
                            <Shield size={10} />
                            {user.role?.toUpperCase()}
                          </span>
                          {user.scopeType && user.scopeType !== 'global' && (
                            <span className="nav-profile-badge nav-profile-badge--scope">
                              <Layers size={10} />
                              {user.committeeSlug?.toUpperCase() || user.committeeName || user.scopeType?.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Switch Scope / Role Section */}
                  {selectableScopes.length > 1 && (
                    <div className="nav-profile-scopes">
                      <div className="nav-profile-section-title">
                        <Layers size={12} />
                        <span>Switch Scope / Role</span>
                      </div>
                      <div className="nav-profile-scopes__list">
                        {selectableScopes.map((scope) => {
                          const scopeKey = scope.id || scope.scopeId;
                          const isActive =
                            (user.scopeId === scope.scopeId || user.scopeId === scope.id) &&
                            user.role === scope.role;
                          const isSwitching = switchingScopeId === scopeKey;

                          return (
                            <button
                              key={scopeKey}
                              type="button"
                              onClick={() => handleScopeSwitch(scope)}
                              disabled={isSwitching}
                              className={`nav-scope-item ${isActive ? 'nav-scope-item--active' : ''}`}
                            >
                              <div className="nav-scope-item__info">
                                <span className="nav-scope-item__label">
                                  {scope.committeeSlug ? `${scope.committeeSlug.toUpperCase()} Committee` : (scope.committeeName || `${scope.scopeType?.toUpperCase()} Scope`)}
                                </span>
                                <span className="nav-scope-item__sub">
                                  <span className={`badge ${getRoleBadgeClass(scope.role)}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>
                                    {scope.role?.toUpperCase()}
                                  </span>
                                </span>
                              </div>
                              {isSwitching ? (
                                <div className="spinner" style={{ width: '0.875rem', height: '0.875rem', borderWidth: '2px' }} />
                              ) : isActive ? (
                                <span className="nav-scope-item__active-badge">
                                  <Check size={12} />
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Navigation Links */}
                  <div className="nav-profile-links">
                    {hasCommitteeAccess && (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="nav-profile-link"
                        >
                          <div className="nav-profile-link__left">
                            <LayoutDashboard size={15} />
                            <span>Dashboard</span>
                          </div>
                          <ChevronRight size={13} className="nav-profile-link__arrow" />
                        </Link>

                        <Link
                          to="/workspace"
                          onClick={() => setUserDropdownOpen(false)}
                          className="nav-profile-link"
                        >
                          <div className="nav-profile-link__left">
                            <Layers size={15} />
                            <span>Committee Workspace</span>
                          </div>
                          <ChevronRight size={13} className="nav-profile-link__arrow" />
                        </Link>
                      </>
                    )}

                    {isHrAuthorized && (
                      <Link
                        to="/hr"
                        onClick={() => setUserDropdownOpen(false)}
                        className="nav-profile-link"
                      >
                        <div className="nav-profile-link__left">
                          <Briefcase size={15} />
                          <span>HR Studio</span>
                        </div>
                        <ChevronRight size={13} className="nav-profile-link__arrow" />
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="nav-profile-link"
                    >
                      <div className="nav-profile-link__left">
                        <User size={15} />
                        <span>Member Profile</span>
                      </div>
                      <ChevronRight size={13} className="nav-profile-link__arrow" />
                    </Link>

                    <Link
                      to="/profile?tab=settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="nav-profile-link"
                    >
                      <div className="nav-profile-link__left">
                        <Settings size={15} />
                        <span>Account Settings</span>
                      </div>
                      <ChevronRight size={13} className="nav-profile-link__arrow" />
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="nav-profile-footer">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="nav-profile-logout-btn"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="btn btn-secondary btn-icon mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-card)',
            padding: '1.25rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxHeight: 'calc(100vh - 4.5rem)',
            overflowY: 'auto',
          }}
        >
          {/* Authenticated User Header on Mobile */}
          {isAuthenticated && user && (
            <div className="mobile-user-card">
              <div className="nav-profile-header" style={{ borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div className="nav-profile-header__layout">
                  <div className="nav-profile-header__avatar" style={{ width: '2.75rem', height: '2.75rem' }}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                      <span>{getInitials(user.name)}</span>
                    )}
                  </div>
                  <div className="nav-profile-header__meta">
                    <div className="nav-profile-header__name" style={{ fontSize: '0.9375rem' }}>{user.name}</div>
                    <div className="nav-profile-header__email">{user.email}</div>
                    <div className="nav-profile-header__badges">
                      <span className="nav-profile-badge nav-profile-badge--role">
                        <Shield size={9} />
                        {user.role?.toUpperCase()}
                      </span>
                      {user.scopeType && user.scopeType !== 'global' && (
                        <span className="nav-profile-badge nav-profile-badge--scope">
                          <Layers size={9} />
                          {user.committeeSlug?.toUpperCase() || user.committeeName || user.scopeType?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Scope Switcher */}
              {selectableScopes.length > 1 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem', letterSpacing: '0.04em' }}>
                    Switch Scope / Role
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {selectableScopes.map((scope) => {
                      const scopeKey = scope.id || scope.scopeId;
                      const isActive =
                        (user.scopeId === scope.scopeId || user.scopeId === scope.id) &&
                        user.role === scope.role;
                      return (
                        <button
                          key={scopeKey}
                          type="button"
                          onClick={() => handleScopeSwitch(scope)}
                          disabled={switchingScopeId === scopeKey}
                          className={`nav-scope-item ${isActive ? 'nav-scope-item--active' : ''}`}
                        >
                          <div className="nav-scope-item__info">
                            <span className="nav-scope-item__label">
                              {scope.committeeSlug ? `${scope.committeeSlug.toUpperCase()} Committee` : (scope.committeeName || `${scope.scopeType?.toUpperCase()} Scope`)}
                            </span>
                            <span className="nav-scope-item__sub">
                              <span className={`badge ${getRoleBadgeClass(scope.role)}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>
                                {scope.role?.toUpperCase()}
                              </span>
                            </span>
                          </div>
                          {isActive && (
                            <span className="nav-scope-item__active-badge">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Links */}
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-heading)',
                fontSize: '1rem',
                fontWeight: 600,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Profile & Auth Mobile Actions */}
          {isAuthenticated ? (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-profile-link"
                style={{ padding: '0.625rem 0.875rem' }}
              >
                <div className="nav-profile-link__left">
                  <User size={16} />
                  <span>Member Profile</span>
                </div>
                <ChevronRight size={14} className="nav-profile-link__arrow" />
              </Link>
              <Link
                to="/profile?tab=settings"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-profile-link"
                style={{ padding: '0.625rem 0.875rem' }}
              >
                <div className="nav-profile-link__left">
                  <Settings size={16} />
                  <span>Account Settings</span>
                </div>
                <ChevronRight size={14} className="nav-profile-link__arrow" />
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-profile-link"
                style={{ padding: '0.625rem 0.875rem' }}
              >
                <div className="nav-profile-link__left">
                  <LayoutDashboard size={16} />
                  <span>Member Dashboard</span>
                </div>
                <ChevronRight size={14} className="nav-profile-link__arrow" />
              </Link>
              {isHrAuthorized && (
                <Link
                  to="/hr"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-profile-link"
                  style={{ padding: '0.625rem 0.875rem' }}
                >
                  <div className="nav-profile-link__left">
                    <Briefcase size={16} />
                    <span>HR Studio</span>
                  </div>
                  <ChevronRight size={14} className="nav-profile-link__arrow" />
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="nav-profile-logout-btn"
                style={{ marginTop: '0.5rem' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Scoped CSS styling for Navbar user dropdown */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 640px) {
          .nav-user-label { display: none !important; }
        }

        /* Nav User Pill Trigger */
        .nav-user-pill-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.65rem 0.3rem 0.3rem;
          border-radius: var(--radius-pill);
          background: var(--color-card);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        }
        .nav-user-pill-btn:hover {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-sm);
        }
        .nav-user-pill-btn__avatar {
          width: 2rem;
          height: 2rem;
          border-radius: var(--radius-pill);
          overflow: hidden;
          background: var(--color-primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .nav-user-pill-btn__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nav-user-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          text-align: left;
        }
        .nav-user-label__name {
          font-size: 0.875rem;
          font-weight: 600;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--color-text);
        }

        /* Floating Glassmorphism Dropdown */
        .nav-profile-dropdown {
          position: absolute;
          top: calc(100% + 0.65rem);
          right: 0;
          width: 320px;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
          overflow: hidden;
          z-index: 500;
          animation: navDropdownSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes navDropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Dropdown Header */
        .nav-profile-header {
          background: linear-gradient(135deg, #002F4C 0%, #00629B 70%, #00A6C4 100%);
          padding: 1.25rem 1rem;
          position: relative;
          overflow: hidden;
        }
        .nav-profile-header::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(0, 166, 196, 0.3) 0%, transparent 70%);
          pointer-events: none;
        }
        .nav-profile-header__layout {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          position: relative;
          z-index: 1;
        }
        .nav-profile-header__avatar {
          width: 3rem;
          height: 3rem;
          border-radius: var(--radius-pill);
          border: 2px solid rgba(255, 255, 255, 0.4);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .nav-profile-header__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nav-profile-header__meta {
          min-width: 0;
          flex: 1;
        }
        .nav-profile-header__name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.9375rem;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
        }
        .nav-profile-header__email {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.75);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 0.125rem;
        }
        .nav-profile-header__badges {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
          margin-top: 0.4rem;
        }
        .nav-profile-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-pill);
          backdrop-filter: blur(4px);
        }
        .nav-profile-badge--role {
          background: rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }
        .nav-profile-badge--scope {
          background: rgba(16, 185, 129, 0.25);
          color: #6ee7b7;
        }

        /* Scope Switcher */
        .nav-profile-scopes {
          padding: 0.75rem 0.875rem;
          border-bottom: 1px solid var(--color-border);
        }
        .nav-profile-section-title {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .nav-profile-scopes__list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          max-height: 160px;
          overflow-y: auto;
        }
        .nav-scope-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0.625rem;
          border-radius: var(--radius-sm);
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .nav-scope-item:hover:not(:disabled) {
          background: var(--color-bg-alt);
        }
        .nav-scope-item--active {
          background: var(--color-primary-light) !important;
          border-color: var(--color-primary);
        }
        .nav-scope-item__info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .nav-scope-item__label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text);
        }
        .nav-scope-item--active .nav-scope-item__label {
          color: var(--color-primary);
          font-weight: 700;
        }
        .nav-scope-item__sub {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }
        .nav-scope-item__active-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.125rem;
          height: 1.125rem;
          border-radius: var(--radius-pill);
          background: var(--color-primary);
          color: #fff;
          flex-shrink: 0;
        }

        /* Navigation Links */
        .nav-profile-links {
          padding: 0.375rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .nav-profile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text);
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .nav-profile-link:hover {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }
        .nav-profile-link__left {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .nav-profile-link:hover .nav-profile-link__arrow {
          transform: translateX(2px);
          color: var(--color-primary);
        }
        .nav-profile-link__arrow {
          color: var(--color-text-subtle);
          transition: transform 0.15s ease;
        }

        /* Footer / Danger Sign Out */
        .nav-profile-footer {
          padding: 0.375rem;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface);
        }
        .nav-profile-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.55rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-destructive);
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .nav-profile-logout-btn:hover {
          background: var(--color-destructive-light);
        }
      `}</style>
    </header>
  );
}
