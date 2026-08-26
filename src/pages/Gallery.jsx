import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Image as ImageIcon, Sparkles, Folder, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const data = await api.getPublicAlbums();
        setAlbums(data.albums || []);
      } catch (err) {
        console.error('Failed to load media albums:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
  }, []);

  return (
    <div className="section">
      <div className="container">
        <div className="section-title-wrap">
          <div className="section-badge">Media & Memories</div>
          <h1 className="section-title">Branch Media Gallery</h1>
          <p className="section-subtitle">
            Relive key moments from our engineering workshops, annual summits, hackathons, and celebrations.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
            Loading media albums...
          </div>
        ) : albums.length === 0 ? (
          <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            <ImageIcon size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Public Albums Published</h3>
            <p>Our PR & Media team will publish coverage albums after upcoming events.</p>
          </div>
        ) : (
          <div className="bento-grid">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bento-card"
                style={{ padding: 0, cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => {
                  setActiveAlbum(album);
                  setActivePhotoIdx(0);
                }}
              >
                {/* Cover Photo */}
                <div style={{ height: '220px', width: '100%', backgroundColor: 'var(--color-bg-alt)', position: 'relative' }}>
                  {album.coverImageUrl ? (
                    <img
                      src={album.coverImageUrl}
                      alt={album.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                      <ImageIcon size={40} opacity={0.4} />
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      color: 'white',
                      padding: '0.25rem 0.625rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <ImageIcon size={12} />
                    <span>{album.assets?.length || 1} Photos</span>
                  </div>
                </div>

                {/* Album Details */}
                <div style={{ padding: 'var(--space-5)' }}>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-2)' }}>{album.title}</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                    {album.description || 'Event photography coverage and highlight reels.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(album.createdAt).toLocaleDateString()}
                    </span>
                    <button type="button" className="btn btn-outline btn-sm">
                      <Eye size={14} />
                      <span>View Album</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Album Lightbox Modal */}
        {activeAlbum && (
          <div className="modal-backdrop" onClick={() => setActiveAlbum(null)}>
            <div
              className="modal-content"
              style={{ maxWidth: '850px', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>{activeAlbum.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{activeAlbum.description}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  onClick={() => setActiveAlbum(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                {activeAlbum.assets && activeAlbum.assets.length > 0 ? (
                  <div>
                    <div
                      style={{
                        position: 'relative',
                        maxHeight: '480px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--color-bg-alt)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      <img
                        src={activeAlbum.assets[activePhotoIdx]?.assetUrl || activeAlbum.coverImageUrl}
                        alt={activeAlbum.assets[activePhotoIdx]?.caption || activeAlbum.title}
                        style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain' }}
                      />

                      {activeAlbum.assets.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            style={{ position: 'absolute', left: '0.75rem' }}
                            onClick={() =>
                              setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : activeAlbum.assets.length - 1))
                            }
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            style={{ position: 'absolute', right: '0.75rem' }}
                            onClick={() =>
                              setActivePhotoIdx((prev) => (prev < activeAlbum.assets.length - 1 ? prev + 1 : 0))
                            }
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {activeAlbum.assets.map((asset, idx) => (
                        <div
                          key={asset.id || idx}
                          onClick={() => setActivePhotoIdx(idx)}
                          style={{
                            width: '4rem',
                            height: '4rem',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: `2px solid ${idx === activePhotoIdx ? 'var(--color-primary)' : 'transparent'}`,
                            opacity: idx === activePhotoIdx ? 1 : 0.6,
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <img
                            src={asset.assetUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '360px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <img
                      src={activeAlbum.coverImageUrl}
                      alt={activeAlbum.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
