import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import EventRegistrationModal from '../components/events/EventRegistrationModal';
import { formatEventDateRange, getEventRegistrationState } from '../utils/eventDateUtils';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Ticket,
  X,
  AlertCircle,
  Sparkles,
  Share2,
  Maximize2,
} from 'lucide-react';

export default function Events() {
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToastStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await api.getEvents();
        const eventList = data.events || (Array.isArray(data) ? data : []);
        // Exclude archived events
        setEvents(eventList.filter((e) => e.status !== 'archived'));
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Check roles and scope permissions for allowedAudience
  const isAdminOrOfficer =
    user?.role === 'admin' ||
    user?.role === 'officer' ||
    user?.availableScopes?.some((s) => ['admin', 'officer'].includes(s.role));

  const isLead =
    isAdminOrOfficer ||
    user?.role === 'lead' ||
    user?.availableScopes?.some((s) => s.role === 'lead');

  const isBranchMember =
    isAdminOrOfficer ||
    isLead ||
    user?.isMember ||
    user?.role === 'member' ||
    (user?.availableScopes && user.availableScopes.length > 0);

  // Audience filtering:
  // 1- public: show always, allow registration for anyone
  // 2- authenticated (login users): show always, unauthenticated redirects to login on register
  // 3- members_only: show ONLY to members; public users do not see it at all
  // 4- committee leads: show ONLY to committee leads (who have anyscope with role lead)
  // Admins & officers always see all events
  const visibleEvents = events.filter((ev) => {
    if (isAdminOrOfficer) return true;
    const audience = ev.allowedAudience || 'public';
    if (audience === 'public') return true;
    if (audience === 'authenticated') return true;
    if (audience === 'members_only') return isBranchMember;
    if (audience === 'leads_only') return isLead;
    return false;
  });

  // Auto-open registration modal if redirected back with ?register=eventId
  useEffect(() => {
    const registerEventId = searchParams.get('register') || searchParams.get('event');
    if (registerEventId && events.length > 0) {
      const found = events.find((e) => (e._id || e.id) === registerEventId);
      if (found) {
        setSelectedEvent(found);
        setRegistrationModalOpen(true);
      }
    }
  }, [searchParams, events]);

  const handleOpenRegistration = (ev) => {
    const audience = ev.allowedAudience || 'public';
    const eventId = ev._id || ev.id;

    // Login users requirement: when user is not logged in, show toast and redirect to login
    if (audience === 'authenticated' && !isAuthenticated) {
      toast.info('Login Required', 'Login is required to register for this event.');
      navigate(`/login?redirect=${encodeURIComponent(`/events?register=${eventId}`)}`);
      return;
    }

    setSelectedEvent(ev);
    setRegistrationModalOpen(true);
  };

  const handleShareEvent = async (ev, e) => {
    if (e) e.stopPropagation();
    const eventId = ev._id || ev.id;
    const shareUrl = `${window.location.origin}/events?register=${eventId}`;
    const title = ev.name || ev.title || 'IEEE Event';
    const text = `Join ${title} with IEEE MSB!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share sheet failed, falling back to clipboard:', err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link Copied', 'Event link copied to clipboard!');
    } catch {
      toast.error('Copy Failed', 'Could not copy link to clipboard.');
    }
  };

  return (
    <div className="section">
      <div className="container">
        <div className="section-title-wrap">
          <div className="section-badge">Events & Summits</div>
          <h1 className="section-title">Conferences & Workshops</h1>
          <p className="section-subtitle">
            Join flagship branch events, hands-on bootcamps, and networking summits.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
            Loading events schedule...
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            <Calendar size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Upcoming Events Listed</h3>
            <p>Our organizing team will announce upcoming workshops and tech summits soon.</p>
          </div>
        ) : (
          <div className="bento-grid">
            {visibleEvents.map((ev) => {
              const eventId = ev._id || ev.id;
              const regStatus = getEventRegistrationState(ev);
              // Card strictly uses coverImageUrl (never substitutes bannerUrl)
              const coverUrl = ev.coverImageUrl;

              return (
                <div
                  key={eventId}
                  className="bento-card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Event Cover Image Container (strictly coverImageUrl) */}
                  <div
                    style={{
                      width: '100%',
                      height: '210px',
                      backgroundColor: 'var(--color-bg-alt)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {coverUrl ? (
                      <div
                        style={{ width: '100%', height: '100%', cursor: 'pointer', position: 'relative' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({ url: coverUrl, title: ev.name || ev.title });
                        }}
                        title="Click to enlarge cover image"
                      >
                        <img
                          src={coverUrl}
                          alt={ev.name || ev.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            transition: 'transform var(--transition-slow)',
                          }}
                          className="event-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 2,
                            pointerEvents: 'none',
                          }}
                        >
                          <Maximize2 size={11} /> Enlarge
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-alt) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-primary)',
                        }}
                      >
                        <Calendar size={48} style={{ opacity: 0.4 }} />
                      </div>
                    )}

                    {/* Floating Status Badges on Top of Card Image */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.875rem',
                        left: '0.875rem',
                        right: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        pointerEvents: 'none',
                      }}
                    >
                      <span
                        className="badge badge-primary"
                        style={{
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        CONFERENCE
                      </span>
                      <span
                        className={regStatus.isOpen ? 'badge badge-accent' : 'badge badge-secondary'}
                        style={{
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {regStatus.isOpen && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'currentColor',
                              display: 'inline-block',
                            }}
                          />
                        )}
                        {regStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Event Content & Details */}
                  <div
                    style={{
                      padding: 'var(--space-6)',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                        {ev.name || ev.title}
                      </h2>
                      <p
                        style={{
                          color: 'var(--color-text-muted)',
                          fontSize: '0.9375rem',
                          lineHeight: 1.5,
                          marginBottom: 'var(--space-5)',
                        }}
                      >
                        {ev.description || 'Join leading engineers and innovators for a deep dive into modern technology and professional excellence.'}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-6)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                          <span>{formatEventDateRange(ev.startDate, ev.endDate, ev.date)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                          <span>{ev.location || 'Faculty of Electronic Engineering, Menouf'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className={`btn ${regStatus.isOpen ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          flex: 1,
                          opacity: regStatus.isOpen ? 1 : 0.65,
                          cursor: regStatus.isOpen ? 'pointer' : 'not-allowed',
                        }}
                        disabled={!regStatus.isOpen}
                        onClick={() => handleOpenRegistration(ev)}
                        title={regStatus.reason || undefined}
                      >
                        <Ticket size={18} />
                        <span>{regStatus.isOpen ? 'Register for Event' : regStatus.label}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        onClick={(e) => handleShareEvent(ev, e)}
                        title="Share Event"
                        style={{ width: '42px', height: '42px', flexShrink: 0 }}
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Multi-Stage Event Registration Modal */}
        <EventRegistrationModal
          event={selectedEvent}
          isOpen={registrationModalOpen}
          onClose={() => setRegistrationModalOpen(false)}
          onSuccess={() => {
            api.getEvents().then((d) => setEvents(d.events || (Array.isArray(d) ? d : [])));
          }}
        />

        {/* Click-to-Enlarge Lightbox Modal */}
        {lightboxImage && (
          <div
            className="ops-lightbox-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1600,
              background: 'rgba(0, 0, 0, 0.88)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={() => setLightboxImage(null)}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '92vw',
                maxHeight: '92vh',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                  {lightboxImage.title || 'Event Cover Image'}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon btn-sm"
                  onClick={() => setLightboxImage(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '1rem' }}>
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title || 'Enlarged Banner'}
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Micro-interaction Styling */}
      <style>{`
        .bento-card:hover .event-img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
