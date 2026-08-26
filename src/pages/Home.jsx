import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Cpu,
  Brain,
  Code2,
  ShieldAlert,
  Users,
  Megaphone,
  Palette,
  ArrowRight,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';

export default function Home() {
  const [committees, setCommittees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [commData, annData, evData] = await Promise.allSettled([
          api.getPublicCommittees(),
          api.getPublicAnnouncements(),
          api.getPublicEvents(),
        ]);

        if (commData.status === 'fulfilled') setCommittees(commData.value.committees || []);
        if (annData.status === 'fulfilled') setAnnouncements(annData.value.announcements?.slice(0, 3) || []);
        if (evData.status === 'fulfilled') {
          const allEvents = evData.value.events || (Array.isArray(evData.value) ? evData.value : []);
          setEvents(allEvents.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const committeeIcons = {
    ras: <Cpu size={24} className="text-primary" />,
    ai: <Brain size={24} className="text-primary" />,
    web: <Code2 size={24} className="text-primary" />,
    cyber: <ShieldAlert size={24} className="text-primary" />,
    hr: <Users size={24} className="text-primary" />,
    pr: <Megaphone size={24} className="text-primary" />,
    media: <Palette size={24} className="text-primary" />,
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          paddingTop: 'var(--space-16)',
          paddingBottom: 'var(--space-16)',
          background: 'radial-gradient(ellipse at 50% 10%, var(--color-primary-light) 0%, transparent 70%)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <div className="section-badge" style={{ marginBottom: 'var(--space-4)' }}>
              <Sparkles size={14} />
              <span>IEEE Student Branch #62971</span>
            </div>
            
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 'var(--space-6)',
              }}
            >
              Advancing Technology for{' '}
              <span style={{ color: 'var(--color-primary)' }}>Humanity & Leadership</span>
            </h1>

            <p
              style={{
                fontSize: '1.25rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-8)',
              }}
            >
              Welcome to the official digital portal for IEEE Menoufia Student Branch. Empowering hundreds of engineering students across robotics, artificial intelligence, cyber defense, web development, and organizational excellence.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <Link to="/committees" className="btn btn-primary btn-lg">
                <span>Explore Committees</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/events" className="btn btn-secondary btn-lg">
                <Calendar size={18} />
                <span>Upcoming Events</span>
              </Link>
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
              marginTop: 'var(--space-12)',
            }}
          >
            <div className="bento-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                7
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Specialized Committees</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>RAS, AI, Web, Cyber, HR, PR, Media</div>
            </div>

            <div className="bento-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                500+
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Active Branch Community</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Engineers, developers, and volunteers</div>
            </div>

            <div className="bento-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                20+
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Annual Conferences & Workshops</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tech Summit, Hackathons & Bootcamps</div>
            </div>

            <div className="bento-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                100%
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Practical Hands-on Projects</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Industry-standard tracks and certifications</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Committees Bento Grid Showcase */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <div className="section-badge">Committees Directory</div>
            <h2 className="section-title">Explore Our 7 Domains</h2>
            <p className="section-subtitle">
              Discover our technical societies and operational committees driving excellence across Menoufia.
            </p>
          </div>

          <div className="bento-grid">
            {committees.map((comm) => {
              const slug = (comm.slug || comm.key || '').toLowerCase();
              return (
                <div key={comm.id || slug} className="bento-card" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div
                      style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      {committeeIcons[slug] || <Award size={24} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-2)' }}>
                      <span className="badge badge-primary">{slug.toUpperCase()}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {comm.slug || slug}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>{comm.name}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                      {comm.description || 'Fostering engineering skills, hands-on workshops, and community leadership.'}
                    </p>
                  </div>
                  <div>
                    <Link
                      to={`/committees#${slug}`}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%' }}
                    >
                      <span>View Committee Tracks</span>
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Announcements & Featured Events */}
      <section className="section" style={{ backgroundColor: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-8)',
            }}
          >
            {/* Announcements Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
                <div>
                  <div className="section-badge" style={{ margin: 0 }}>Newsfeed</div>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Branch Broadcasts</h3>
                </div>
                <Link to="/announcements" className="btn btn-outline btn-sm">
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {announcements.length === 0 ? (
                <div className="bento-card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No public announcements posted at this time.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {announcements.map((ann) => (
                    <div key={ann.id} className="bento-card" style={{ padding: 'var(--space-5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-2)' }}>
                        <span className="badge badge-accent">OFFICIAL</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-2)' }}>{ann.title}</h4>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        {ann.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
                <div>
                  <div className="section-badge" style={{ margin: 0 }}>Upcoming</div>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Events & Workshops</h3>
                </div>
                <Link to="/events" className="btn btn-outline btn-sm">
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="bento-card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No public events scheduled right now. Check back soon!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {events.map((ev) => (
                    <div key={ev._id || ev.id} className="bento-card" style={{ padding: 'var(--space-5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-2)' }}>
                        <span className="badge badge-primary">CONFERENCE</span>
                      </div>
                      <h4 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-2)' }}>{ev.name || ev.title}</h4>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 'var(--space-3)' }}>
                        {ev.description || 'Join us for an inspiring session of technical talks and networking.'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} />
                          {ev.date ? new Date(ev.date).toLocaleDateString() : 'Upcoming'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={14} />
                          {ev.location || 'Menoufia University'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
