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
  User,
  LayoutDashboard,
  LogOut,
  Layers,
  Check,
  Sparkles,
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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/committees', label: 'Committees' },
    { to: '/events', label: 'Events' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/gallery', label: 'Gallery' },
  ];

  const handleScopeSwitch = async (targetScope) => {
    const targetScopeId = targetScope.id || targetScope.scopeId;
    if (!targetScopeId) return;

    // If already active, close menus
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
      const switchRes = await api.switchContext({ targetScopeId });
      toast.success(
        'Active Scope Switched',
        `Switched to ${switchRes.user?.role?.toUpperCase()} (${switchRes.user?.scopeType})`
      );
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
    toast.info('Signed Out', 'You have been signed out successfully.');
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

          {/* Authenticated: User Avatar & 1-Click Context Switcher Dropdown */}
          {isAuthenticated && user && (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="btn btn-secondary"
                style={{
                  padding: '0.35rem 0.65rem 0.35rem 0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: 'var(--radius-full)',
                }}
                aria-expanded={userDropdownOpen}
                aria-label="User profile & scope menu"
              >
                {/* Avatar Image or Initials */}
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: 'var(--radius-full)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                )}

                {/* User Active Role Pill (Desktop) */}
                <div className="nav-user-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                  <span
                    className={`badge ${getRoleBadgeClass(user.role)}`}
                    style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem' }}
                  >
                    {user.role?.toUpperCase()}
                  </span>
                </div>

                <ChevronDown size={14} style={{ color: 'var(--color-text-muted)', transform: userDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>

              {/* Context Switcher & Profile Dropdown */}
              {userDropdownOpen && (
                <div
                  className="bento-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    width: '300px',
                    padding: 0,
                    boxShadow: 'var(--shadow-xl)',
                    borderRadius: 'var(--radius-lg)',
                    zIndex: 200,
                    overflow: 'hidden',
                  }}
                >
                  {/* User Profile Header */}
                  <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Active Context:</span>
                      <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ fontSize: '0.6875rem' }}>
                        {user.role} ({user.scopeType})
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Context / Scope Switcher Section */}
                  {user.availableScopes && user.availableScopes.length > 0 && (
                    <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <Layers size={13} style={{ color: 'var(--color-primary)' }} />
                        <span>Switch Scope / Role</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {user.availableScopes.map((scope) => {
                          const scopeKey = scope.id || scope.scopeId;
                          const isActive =
                            (user.scopeId === scope.scopeId || user.scopeId === scope.id) &&
                            user.role === scope.role;
                          const isSwitchingThis = switchingScopeId === scopeKey;

                          return (
                            <button
                              key={scopeKey}
                              type="button"
                              onClick={() => handleScopeSwitch(scope)}
                              disabled={isSwitchingThis}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background-color 0.15s ease',
                              }}
                              className="scope-switch-item"
                            >
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-primary)' : 'var(--color-text)' }}>
                                  {scope.label || `${scope.role} (${scope.scopeType})`}
                                </span>
                                {scope.committeeName && (
                                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                                    {scope.committeeName}
                                  </span>
                                )}
                              </div>

                              {isSwitchingThis ? (
                                <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                              ) : isActive ? (
                                <Check size={14} style={{ color: 'var(--color-primary)' }} />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        color: 'var(--color-text)',
                        textDecoration: 'none',
                      }}
                      className="dropdown-nav-item"
                    >
                      <User size={16} style={{ color: 'var(--color-primary)' }} />
                      <span>Member Profile</span>
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        color: 'var(--color-text)',
                        textDecoration: 'none',
                      }}
                      className="dropdown-nav-item"
                    >
                      <LayoutDashboard size={16} style={{ color: 'var(--color-primary)' }} />
                      <span>Member Dashboard</span>
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div style={{ padding: '0.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        color: 'var(--color-danger)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      className="dropdown-nav-item"
                    >
                      <LogOut size={16} />
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

      {/* Mobile Dropdown Menu with Complete Parity */}
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
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                  <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ fontSize: '0.6875rem', marginTop: '0.25rem' }}>
                    {user.role?.toUpperCase()} ({user.scopeType})
                  </span>
                </div>
              </div>

              {/* Mobile 1-Click Scope Switcher List */}
              {user.availableScopes && user.availableScopes.length > 1 && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                    Active Scope
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {user.availableScopes.map((scope) => {
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
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.375rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                            border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                            fontSize: '0.8125rem',
                            textAlign: 'left',
                          }}
                        >
                          <span>{scope.label || `${scope.role} (${scope.scopeType})`}</span>
                          {isActive && <Check size={14} />}
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
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', gap: '0.5rem' }}
              >
                <User size={16} />
                <span>My Profile</span>
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', gap: '0.5rem' }}
              >
                <LayoutDashboard size={16} />
                <span>Member Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', justifyContent: 'flex-start', gap: '0.5rem' }}
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

      {/* Responsive media style override */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 640px) {
          .nav-user-label { display: none !important; }
        }
        .dropdown-nav-item:hover {
          background-color: var(--color-primary-light);
        }
        .scope-switch-item:hover:not(:disabled) {
          background-color: var(--color-primary-light);
        }
      `}</style>
    </header>
  );
}
