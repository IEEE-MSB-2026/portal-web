import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import {
  Megaphone,
  Calendar,
  Tag,
  Search,
  Pin,
  X,
  ZoomIn,
  Share2,
  Check,
  Filter,
  User,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import '../styles/pr.css';

const CATEGORIES = [
  { id: 'All', label: 'All Announcements', color: 'badge-accent' },
  { id: 'General', label: 'General', color: 'badge-primary' },
  { id: 'Event', label: 'Events & Summits', color: 'badge-warning' },
  { id: 'Recruitment', label: 'Recruitment', color: 'badge-success' },
  { id: 'Technical', label: 'Technical', color: 'badge-info' },
  { id: 'Competition', label: 'Competitions', color: 'badge-purple' },
];

export default function Announcements() {
  const { user, isAuthenticated } = useAuthStore();

  // Determine if the current user is a team member with dashboard access
  const hasCommitteeAccess = Boolean(
    user?.scopeType === 'committee' ||
    user?.committeeId ||
    (user?.availableScopes && user.availableScopes.some((s) => s.scopeType === 'committee' || s.committeeSlug || s.committeeName)) ||
    ['admin', 'officer'].includes(user?.role)
  );
  const hasDashboardAccess = isAuthenticated && hasCommitteeAccess;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVisibility, setSelectedVisibility] = useState('All'); // 'All' | 'public' | 'internal'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      setError(null);
      try {
        if (hasDashboardAccess) {
          // Team members receive both public and internal announcements
          const data = await api.getPRAnnouncements({ limit: 100 });
          const list = data?.announcements || data?.data || (Array.isArray(data) ? data : []);
          setAnnouncements(list);
        } else {
          // Visitors receive public broadcasts only
          const data = await api.getPublicAnnouncements({ limit: 100 });
          const list = data?.announcements || data?.data || (Array.isArray(data) ? data : []);
          setAnnouncements(list);
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
        setError('Failed to load official announcements. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, [hasDashboardAccess]);

  // Keyboard shortcut (ESC) to close Lightbox modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (ann.category || 'General').toLowerCase() === selectedCategory.toLowerCase();

      const matchesVisibility =
        !hasDashboardAccess ||
        selectedVisibility === 'All' ||
        (ann.visibility || 'public') === selectedVisibility;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        ann.title?.toLowerCase().includes(query) ||
        ann.body?.toLowerCase().includes(query) ||
        ann.authorName?.toLowerCase().includes(query) ||
        ann.category?.toLowerCase().includes(query);

      return matchesCategory && matchesVisibility && matchesSearch;
    });
  }, [announcements, selectedCategory, selectedVisibility, searchQuery, hasDashboardAccess]);

  const handleCopyLink = (id) => {
    const url = `${window.location.origin}/announcements#${id}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getCategoryBadgeClass = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'event':
        return 'badge-warning';
      case 'recruitment':
        return 'badge-success';
      case 'technical':
        return 'badge-info';
      case 'competition':
        return 'badge-purple';
      case 'general':
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container container-narrow">
        {/* Section Header */}
        <div className="section-title-wrap" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <Megaphone size={14} />
            <span>Official Communications</span>
          </div>
          <h1 className="section-title">Official Branch Announcements</h1>
          <p className="section-subtitle" style={{ maxWidth: '680px', margin: '0 auto' }}>
            Stay informed with official statements, major announcements, recruitment drives, and event updates directly from IEEE Menoufia Student Branch leadership.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div
          className="bento-card"
          style={{
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search announcements by title, content, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '2.75rem',
                paddingRight: searchQuery ? '2.5rem' : '1rem',
                fontSize: '0.9375rem',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
              scrollbarWidth: 'none',
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    borderRadius: 'var(--radius-full)',
                    whiteSpace: 'nowrap',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Visibility Filter Pills (Team Members with Dashboard Access Only) */}
          {hasDashboardAccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--color-border)',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.25rem' }}>
                <Filter size={13} />
                <span>Audience Visibility:</span>
              </span>
              {[
                { id: 'All', label: 'All Announcements' },
                { id: 'public', label: 'Public Only' },
                { id: 'internal', label: 'Internal (Team Only)' },
              ].map((vis) => {
                const isActive = selectedVisibility === vis.id;
                return (
                  <button
                    key={vis.id}
                    type="button"
                    onClick={() => setSelectedVisibility(vis.id)}
                    className={`btn btn-xs ${isActive ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderRadius: 'var(--radius-full)', fontSize: '0.75rem', padding: '0.2rem 0.65rem' }}
                  >
                    {vis.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-16)',
              gap: 'var(--space-3)',
              color: 'var(--color-text-muted)',
            }}
          >
            <div className="spinner" />
            <p style={{ fontSize: '0.9375rem' }}>Fetching latest broadcasts...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bento-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-danger)' }}>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAnnouncements.length === 0 && (
          <div
            className="bento-card"
            style={{
              padding: 'var(--space-16) var(--space-8)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <Megaphone size={44} style={{ margin: '0 auto var(--space-4)', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
              No Announcements Found
            </h3>
            <p style={{ fontSize: '0.9375rem', maxWidth: '440px', margin: '0 auto var(--space-6)' }}>
              {searchQuery || selectedCategory !== 'All' || selectedVisibility !== 'All'
                ? `No results matched your filter criteria.`
                : 'There are no official announcements at this time.'}
            </p>
            {(searchQuery || selectedCategory !== 'All' || selectedVisibility !== 'All') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedVisibility('All');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Announcements Feed */}
        {!loading && !error && filteredAnnouncements.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {filteredAnnouncements.map((ann) => {
              const isPinned = Boolean(ann.isPinned);
              const isInternal = ann.visibility === 'internal';

              return (
                <article
                  key={ann.id}
                  id={ann.id}
                  className="bento-card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    borderLeft: isPinned ? '3px solid var(--color-primary)' : undefined,
                    boxShadow: isPinned ? '0 0 20px -5px rgba(0, 98, 155, 0.25)' : undefined,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Fixed-Height Centered Banner Header (matching PR Studio card live preview) */}
                  {ann.imageUrl && (
                    <div
                      className="pr-announcement-card__banner"
                      style={{
                        height: '220px',
                        cursor: 'pointer',
                        borderRadius: 0,
                        backgroundColor: 'var(--color-surface)',
                      }}
                      onClick={() => setSelectedImage(ann.imageUrl)}
                      title="Click to view full resolution banner"
                    >
                      <img
                        src={ann.imageUrl}
                        alt={ann.title}
                        loading="lazy"
                        className="pr-announcement-card__img"
                      />

                      {/* Enlarge Banner Action Capsule */}
                      <button
                        type="button"
                        className="pr-announcement-card__enlarge-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(ann.imageUrl);
                        }}
                        title="Click to zoom image in full screen"
                      >
                        <ZoomIn size={13} />
                        <span>Enlarge Banner</span>
                      </button>
                    </div>
                  )}

                  {/* Card Main Body */}
                  <div style={{ padding: 'var(--space-6)' }}>
                    {/* Top Bar: Badges + Timestamp + Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: 'var(--space-3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isPinned && (
                          <span
                            className="badge badge-accent"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                            }}
                          >
                            <Pin size={12} style={{ transform: 'rotate(45deg)' }} />
                            PINNED
                          </span>
                        )}

                        <span className={`badge ${getCategoryBadgeClass(ann.category)}`}>
                          {ann.category || 'General'}
                        </span>

                        {isInternal && (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: 'var(--color-warning)',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              fontWeight: 700,
                              fontSize: '0.71875rem',
                            }}
                          >
                            INTERNAL (TEAM)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.8125rem',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <Calendar size={13} />
                          <span>
                            {new Date(ann.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(ann.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                          title="Copy direct link to this announcement"
                        >
                          {copiedId === ann.id ? (
                            <>
                              <Check size={13} style={{ color: 'var(--color-success)' }} />
                              <span style={{ color: 'var(--color-success)' }}>Copied</span>
                            </>
                          ) : (
                            <>
                              <Share2 size={13} />
                              <span>Share</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Announcement Title */}
                    <h2
                      style={{
                        fontSize: '1.375rem',
                        fontWeight: 700,
                        lineHeight: 1.35,
                        marginBottom: ann.body ? 'var(--space-3)' : 'var(--space-4)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {ann.title}
                    </h2>

                    {/* Announcement Body (Optional) */}
                    {ann.body && (
                      <p
                        style={{
                          color: 'var(--color-text-muted)',
                          fontSize: '0.9875rem',
                          lineHeight: 1.65,
                          whiteSpace: 'pre-line',
                          marginBottom: 'var(--space-5)',
                        }}
                      >
                        {ann.body}
                      </p>
                    )}

                    {/* Author Signature Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 'var(--space-3)',
                        borderTop: '1px solid var(--color-border)',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <User size={13} style={{ color: 'var(--color-primary)' }} />
                        <span>
                          Published by:{' '}
                          <strong style={{ color: 'var(--color-text)' }}>
                            {ann.authorName || 'Branch Executive Board'}
                          </strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.75 }}>
                        <span>Menoufia SB</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Shared Lightbox Fullscreen Modal */}
        {selectedImage && (
          <div className="pr-lightbox-backdrop" onClick={() => setSelectedImage(null)}>
            <div className="pr-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="pr-lightbox-close"
                onClick={() => setSelectedImage(null)}
                aria-label="Close enlarged banner"
              >
                <X size={18} />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged announcement banner"
                className="pr-lightbox-img"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
