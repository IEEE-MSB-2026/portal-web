import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  Ticket,
  X,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    university: 'Menoufia University',
  });
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await api.getPublicEvents();
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
    setTicketResult(null);
    setFormError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      university: 'Menoufia University',
    });
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
        phone: formData.phone || undefined,
        university: formData.university,
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
              return (
                <div key={eventId} className="bento-card" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-3)' }}>
                      <span className="badge badge-primary">CONFERENCE</span>
                      <span className="badge badge-accent">REGISTRATION OPEN</span>
                    </div>

                    <h2 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-2)' }}>{ev.name || ev.title}</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: 'var(--space-5)' }}>
                      {ev.description || 'Join leading engineers and innovators for a deep dive into modern technology and professional excellence.'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                        <span>{ev.date ? new Date(ev.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date Announced Soon'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                        <span>{ev.location || 'Faculty of Electronic Engineering, Menouf'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={16} style={{ color: 'var(--color-accent)' }} />
                        <span>Capacity: {ev.capacity || 250} Attendees</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => handleOpenRegistration(ev)}
                    >
                      <Ticket size={18} />
                      <span>Register for Event</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Event Registration Modal */}
        {registrationModalOpen && selectedEvent && (
          <div className="modal-backdrop" onClick={() => setRegistrationModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Event Registration</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedEvent.name || selectedEvent.title}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  onClick={() => setRegistrationModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {ticketResult ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                    <div
                      style={{
                        width: '4rem',
                        height: '4rem',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'var(--color-accent-light)',
                        color: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-4)',
                      }}
                    >
                      <CheckCircle2 size={36} />
                    </div>
                    <h4 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-2)' }}>Registration Confirmed!</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: 'var(--space-6)' }}>
                      Your ticket has been generated. An electronic confirmation has been logged.
                    </p>

                    <div
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        border: '1px dashed var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4)',
                        marginBottom: 'var(--space-6)',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>TICKET ID</div>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                        {ticketResult._id || ticketResult.id || ticketResult.ticketId || 'CONFIRMED-PASS'}
                      </div>
                      <div style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>ATTENDEE</div>
                      <div style={{ fontWeight: 600 }}>{ticketResult.name || formData.name} ({ticketResult.email || formData.email})</div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => setRegistrationModalOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit}>
                    {formError && (
                      <div
                        style={{
                          backgroundColor: 'var(--color-destructive-light)',
                          color: 'var(--color-destructive)',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: 'var(--space-4)',
                        }}
                      >
                        <AlertCircle size={16} />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="input-group">
                      <label className="input-label" htmlFor="reg-name">Full Name *</label>
                      <input
                        id="reg-name"
                        type="text"
                        className="input-field"
                        placeholder="e.g. Ahmed Hassan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="reg-email">Email Address *</label>
                      <input
                        id="reg-email"
                        type="email"
                        className="input-field"
                        placeholder="e.g. ahmed@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="reg-phone">Phone Number</label>
                      <input
                        id="reg-phone"
                        type="tel"
                        className="input-field"
                        placeholder="e.g. +20 100 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="reg-uni">University / Faculty</label>
                      <input
                        id="reg-uni"
                        type="text"
                        className="input-field"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      />
                    </div>

                    <div style={{ marginTop: 'var(--space-6)' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={submitting}
                      >
                        {submitting ? 'Registering...' : 'Confirm Registration'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
