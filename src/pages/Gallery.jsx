import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';
import { useToastStore } from '../stores/toastStore';
import {
  Image as ImageIcon,
  Sparkles,
  Folder,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Share2,
  Calendar,
  ExternalLink,
  Download,
  Check,
} from 'lucide-react';
import '../styles/media.css';

const GALLERY_CATEGORIES = [
  'All',
  'Workshops',
  'Hackathons',
  'Conferences',
  'Celebration',
  'Social',
  'Competitions',
  'General',
];

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToastStore();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedAlbumId, setCopiedAlbumId] = useState(null);

  const albumModalBackdrop = useBackdropDismiss(() => setActiveAlbum(null), {
    isOpen: !!activeAlbum,
  });

  // Fetch published albums
  useEffect(() => {
    async function fetchAlbums() {
      try {
        setLoading(true);
        const data = await api.getPublicAlbums();
        const publishedAlbums = data.albums || [];
        setAlbums(publishedAlbums);

        // Check for deep link (?album=<id>)
        const targetAlbumId = searchParams.get('album');
        if (targetAlbumId) {
          const matched = publishedAlbums.find((a) => a.id === targetAlbumId);
          if (matched) {
            setActiveAlbum(matched);
            setActivePhotoIdx(0);
          }
        }
      } catch (err) {
        console.error('Failed to load media albums:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
  }, [searchParams]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!activeAlbum || !activeAlbum.assets || activeAlbum.assets.length <= 1) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setActivePhotoIdx((prev) => (prev < activeAlbum.assets.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : activeAlbum.assets.length - 1));
      } else if (e.key === 'Escape') {
        setActiveAlbum(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlbum]);

  // Filtered albums
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      if (selectedCategory !== 'All') {
        const cat = (album.category || 'General').toLowerCase();
        if (cat !== selectedCategory.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = album.title?.toLowerCase().includes(q);
        const matchDesc = album.description?.toLowerCase().includes(q);
        const matchComm = album.committeeName?.toLowerCase().includes(q);
        const matchTag = album.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchComm && !matchTag) return false;
      }
      return true;
    });
  }, [albums, selectedCategory, searchQuery]);

  // Share Album handler
  const handleShareAlbum = (e, album) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/gallery?album=${album.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedAlbumId(album.id);
      setTimeout(() => setCopiedAlbumId(null), 2500);
    }).catch(() => {
      toast.error('Copy Failed', 'Could not copy link to clipboard.');
    });
  };

  const currentAsset = activeAlbum?.assets?.[activePhotoIdx] || null;

  return (
    <div className="section" style={{ minHeight: '80vh', paddingBottom: 'var(--space-16)' }}>
      <div className="container">
        {/* Hero Section */}
        <div className="section-title-wrap" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto var(--space-3)' }}>
            <Sparkles size={13} />
            <span>Media & Memories</span>
          </div>
          <h1 className="section-title">Branch Media Gallery</h1>
          <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto' }}>
            Relive key moments from our engineering workshops, annual summits, hackathons, and celebrations.
          </p>
        </div>

        {/* Filter Toolbar: Search & Category Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: 'var(--space-8)',
            flexWrap: 'wrap',
          }}
        >
          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`media-pill-btn ${selectedCategory === cat ? 'media-pill-btn--active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="media-search-wrap" style={{ maxWidth: '300px' }}>
            <Search size={16} className="media-search-icon" />
            <input
              type="text"
              placeholder="Search albums, tags, events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="media-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Albums Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-muted)' }}>
            <div className="spin" style={{ display: 'inline-block', marginBottom: 'var(--space-3)' }}>
              <ImageIcon size={32} opacity={0.6} />
            </div>
            <p>Loading media collections...</p>
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '580px', margin: '0 auto' }}>
            <ImageIcon size={44} style={{ margin: '0 auto var(--space-4)', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
              {searchQuery || selectedCategory !== 'All' ? 'No Matching Albums Found' : 'No Public Albums Published'}
            </h3>
            <p style={{ fontSize: '0.9375rem' }}>
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search query or selecting a different category filter.'
                : 'Our Media team will publish photo collections after upcoming branch events.'}
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'var(--space-4)' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="media-albums-grid">
            {filteredAlbums.map((album) => {
              const photoCount = album.assets?.length || album.assetsCount || 1;
              const formattedDate = album.eventDate
                ? new Date(album.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : new Date(album.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div
                  key={album.id}
                  className="media-album-card"
                  onClick={() => {
                    setActiveAlbum(album);
                    setActivePhotoIdx(0);
                  }}
                >
                  {/* Cover Section */}
                  <div className="media-album-cover-wrap">
                    {album.coverImageUrl ? (
                      <img
                        src={album.coverImageUrl}
                        alt={album.title}
                        className="media-album-cover-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="media-album-cover-placeholder">
                        <ImageIcon size={36} opacity={0.4} />
                        <span style={{ fontSize: '0.75rem' }}>Event Album</span>
                      </div>
                    )}

                    {/* Gradient Overlay & Badges */}
                    <div className="media-album-overlay">
                      <div className="media-album-overlay-top">
                        <span />
                        <span
                          style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            color: '#ffffff',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          <ImageIcon size={12} />
                          <span>{photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}</span>
                        </span>
                      </div>

                      <div className="media-album-overlay-bottom">
                        <span
                          style={{
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                          }}
                        >
                          <Calendar size={12} />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Album Body */}
                  <div className="media-album-body">
                    <div className="media-album-meta-row">
                      {album.committeeName && (
                        <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                          {album.committeeName}
                        </span>
                      )}
                      {album.category && (
                        <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                          {album.category}
                        </span>
                      )}
                    </div>

                    <h3 className="media-album-title" title={album.title}>
                      {album.title}
                    </h3>

                    <p className="media-album-desc">
                      {album.description || 'Event photography coverage and highlight reels.'}
                    </p>

                    {album.tags && album.tags.length > 0 && (
                      <div className="media-album-tags">
                        {album.tags.slice(0, 4).map((tag, idx) => (
                          <span key={idx} className="media-tag-chip">
                            #{tag}
                          </span>
                        ))}
                        {album.tags.length > 4 && (
                          <span className="media-tag-chip">+{album.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="media-album-footer" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setActiveAlbum(album);
                        setActivePhotoIdx(0);
                      }}
                      style={{ flex: 1 }}
                    >
                      <Eye size={14} />
                      <span>View Album</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={(e) => handleShareAlbum(e, album)}
                      title="Share album link"
                    >
                      {copiedAlbumId === album.id ? <Check size={14} style={{ color: '#10b981' }} /> : <Share2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIGHTBOX VIEWER MODAL ────────────────────────────────────────── */}
        {activeAlbum && (
          <div className="modal-backdrop" {...albumModalBackdrop.getBackdropProps()}>
            <div
              className="modal-content"
              style={{
                maxWidth: '920px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div
                className="modal-header"
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{activeAlbum.title}</h3>
                    {activeAlbum.committeeName && (
                      <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                        {activeAlbum.committeeName}
                      </span>
                    )}
                    {activeAlbum.category && (
                      <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                        {activeAlbum.category}
                      </span>
                    )}
                  </div>
                  {activeAlbum.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      {activeAlbum.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon btn-sm"
                    onClick={(e) => handleShareAlbum(e, activeAlbum)}
                    title="Share album link"
                  >
                    {copiedAlbumId === activeAlbum.id ? <Check size={16} style={{ color: '#10b981' }} /> : <Share2 size={16} />}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    onClick={() => setActiveAlbum(null)}
                    title="Close viewer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Lightbox Main Stage */}
              <div
                className="modal-body"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  overflowY: 'auto',
                }}
              >
                {activeAlbum.assets && activeAlbum.assets.length > 0 ? (
                  <div>
                    {/* Viewport */}
                    <div
                      style={{
                        position: 'relative',
                        height: '460px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000000',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                      }}
                    >
                      {currentAsset?.assetType === 'video' ? (
                        <video
                          src={currentAsset.assetUrl}
                          controls
                          style={{ maxWidth: '100%', maxHeight: '460px' }}
                        />
                      ) : (
                        <img
                          src={currentAsset?.assetUrl || activeAlbum.coverImageUrl}
                          alt={currentAsset?.caption || activeAlbum.title}
                          style={{ maxWidth: '100%', maxHeight: '460px', objectFit: 'contain' }}
                        />
                      )}

                      {/* Nav Arrows */}
                      {activeAlbum.assets.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            style={{
                              position: 'absolute',
                              left: '0.85rem',
                              background: 'rgba(0, 0, 0, 0.65)',
                              color: '#ffffff',
                              border: 'none',
                              backdropFilter: 'blur(8px)',
                            }}
                            onClick={() =>
                              setActivePhotoIdx((prev) =>
                                prev > 0 ? prev - 1 : activeAlbum.assets.length - 1
                              )
                            }
                            title="Previous photo (Left Arrow)"
                          >
                            <ChevronLeft size={22} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            style={{
                              position: 'absolute',
                              right: '0.85rem',
                              background: 'rgba(0, 0, 0, 0.65)',
                              color: '#ffffff',
                              border: 'none',
                              backdropFilter: 'blur(8px)',
                            }}
                            onClick={() =>
                              setActivePhotoIdx((prev) =>
                                prev < activeAlbum.assets.length - 1 ? prev + 1 : 0
                              )
                            }
                            title="Next photo (Right Arrow)"
                          >
                            <ChevronRight size={22} />
                          </button>
                        </>
                      )}

                      {/* Photo Counter Pill */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '0.85rem',
                          right: '0.85rem',
                          background: 'rgba(0, 0, 0, 0.75)',
                          color: '#ffffff',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {activePhotoIdx + 1} / {activeAlbum.assets.length}
                      </div>

                      {/* Open / Download Full Res */}
                      {currentAsset?.assetUrl && (
                        <a
                          href={currentAsset.assetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-icon btn-sm"
                          style={{
                            position: 'absolute',
                            top: '0.85rem',
                            right: '0.85rem',
                            background: 'rgba(0, 0, 0, 0.65)',
                            color: '#ffffff',
                            border: 'none',
                            backdropFilter: 'blur(8px)',
                          }}
                          title="Open original high-res in new tab"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>

                    {/* Caption if present */}
                    {currentAsset?.caption && (
                      <div
                        style={{
                          marginTop: '0.65rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          color: 'var(--color-text-muted)',
                          fontStyle: 'italic',
                        }}
                      >
                        "{currentAsset.caption}"
                      </div>
                    )}

                    {/* Thumbnail Strip */}
                    {activeAlbum.assets.length > 1 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          overflowX: 'auto',
                          padding: '0.75rem 0.25rem 0.25rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        {activeAlbum.assets.map((asset, idx) => (
                          <div
                            key={asset.id || idx}
                            onClick={() => setActivePhotoIdx(idx)}
                            style={{
                              width: '4.25rem',
                              height: '4.25rem',
                              borderRadius: 'var(--radius-md)',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: `2px solid ${idx === activePhotoIdx ? 'var(--color-primary)' : 'transparent'}`,
                              opacity: idx === activePhotoIdx ? 1 : 0.55,
                              transition: 'all 0.15s ease',
                              flexShrink: 0,
                              boxShadow: idx === activePhotoIdx ? '0 0 0 2px rgba(37, 99, 235, 0.25)' : 'none',
                            }}
                          >
                            <img
                              src={asset.assetUrl}
                              alt={asset.caption || ''}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      height: '380px',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      backgroundColor: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={activeAlbum.coverImageUrl}
                      alt={activeAlbum.title}
                      style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
