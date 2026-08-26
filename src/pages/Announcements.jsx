import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Megaphone, Calendar, Tag, Image as ImageIcon, X, ZoomIn } from 'lucide-react';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const data = await api.getPublicAnnouncements();
        setAnnouncements(data.announcements || []);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  return (
    <div className="section">
      <div className="container container-narrow">
        <div className="section-title-wrap">
          <div className="section-badge">News & Broadcasts</div>
          <h1 className="section-title">Official Announcements</h1>
          <p className="section-subtitle">
            Stay updated with official statements, event notices, and branch developments.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Megaphone size={40} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Announcements Yet</h3>
            <p>Check back regularly for the latest branch news and updates.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {announcements.map((ann) => (
              <article key={ann.id} className="bento-card" style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-accent">OFFICIAL</span>
                    <span className="badge">{ann.visibility?.toUpperCase() || 'PUBLIC'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    <Calendar size={14} />
                    <span>{new Date(ann.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                <h2 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-3)' }}>{ann.title}</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: ann.imageUrl ? 'var(--space-4)' : 0 }}>
                  {ann.body}
                </p>

                {/* Optional Attached Banner Image */}
                {ann.imageUrl && (
                  <div
                    style={{
                      marginTop: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                      position: 'relative',
                      cursor: 'pointer',
                      maxHeight: '340px',
                    }}
                    onClick={() => setSelectedImage(ann.imageUrl)}
                    title="Click to zoom image"
                  >
                    <img
                      src={ann.imageUrl}
                      alt={ann.caption || ann.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        right: '0.5rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <ZoomIn size={12} />
                      <span>Zoom</span>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Fullscreen Lightbox Modal */}
        {selectedImage && (
          <div className="modal-backdrop" onClick={() => setSelectedImage(null)}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setSelectedImage(null)}
                style={{
                  position: 'absolute',
                  top: '-1rem',
                  right: '-1rem',
                  zIndex: 10,
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <X size={20} />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged announcement banner"
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
