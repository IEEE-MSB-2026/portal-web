import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import EventRegistrationModal from '../components/events/EventRegistrationModal';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Ticket,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

function getEventRegistrationStatus(event) {
  if (!event) {
    return { isOpen: true, label: 'REGISTRATION OPEN', isClosed: false };
  }
  if (event.isRegistrationOpen === false) {
    return { isOpen: false, label: 'REGISTRATION CLOSED', isClosed: true, reason: 'Registration is currently closed by organizers.' };
  }
  if (!event.date) {
    return { isOpen: true, label: 'REGISTRATION OPEN', isClosed: false };
  }

  const eventTime = new Date(event.date).getTime();
  if (isNaN(eventTime)) {
    return { isOpen: true, label: 'REGISTRATION OPEN', isClosed: false };
  }

  const now = Date.now();
  const cutoffTime = eventTime - 24 * 60 * 60 * 1000; // 24 hours prior to event start

  if (now > eventTime) {
    return { isOpen: false, label: 'EVENT COMPLETED', isClosed: true, reason: 'This event has already taken place.' };
  }
  if (now >= cutoffTime) {
    return { isOpen: false, label: 'REGISTRATION CLOSED', isClosed: true, reason: 'Registration closed 24 hours prior to the event date.' };
  }

  return { isOpen: true, label: 'REGISTRATION OPEN', isClosed: false };
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await api.getEvents();
        const eventList = data.events || (Array.isArray(data) ? data : []);
        setEvents(eventList);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleOpenRegistration = (ev) => {
    setSelectedEvent(ev);
    setRegistrationModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Name and Email are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const eventId = selectedEvent._id || selectedEvent.id;
      const res = await api.registerParticipant(eventId, {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone || undefined,
        university: formData.university || undefined,
        faculty: formData.faculty || undefined,
      });

      setTicketResult(res.participant || res);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setFormError('Public self-registration requires logging in to your attendee portal account. Please sign in via the Portal Login button.');
      } else {
        setFormError(err.data?.error || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
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
        ) : events.length === 0 ? (
          <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            <Calendar size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Upcoming Events Listed</h3>
            <p>Our organizing team will announce upcoming workshops and tech summits soon.</p>
          </div>
        ) : (
          <div className="bento-grid">
            {events.map((ev) => {
              const eventId = ev._id || ev.id;
              const regStatus = getEventRegistrationStatus(ev);
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
                          <span>
                            {ev.date
                              ? new Date(ev.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                              : 'Date Announced Soon'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                          <span>{ev.location || 'Faculty of Electronic Engineering, Menouf'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        className={`btn ${regStatus.isOpen ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          width: '100%',
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
