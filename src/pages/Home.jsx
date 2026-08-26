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
  Target,
  Telescope,
  HeartHandshake,
  Linkedin,
  Mail,
  Handshake,
} from 'lucide-react';

export default function Home() {
  const [committees, setCommittees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [featuredOfficers, setFeaturedOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [commData, annData, evData, officersData] = await Promise.allSettled([
          api.getPublicCommittees(),
          api.getPublicAnnouncements(),
          api.getPublicEvents(),
          api.getPublicOfficers(),
        ]);

        if (commData.status === 'fulfilled') setCommittees(commData.value.committees || []);
        if (annData.status === 'fulfilled') setAnnouncements(annData.value.announcements?.slice(0, 3) || []);
        if (evData.status === 'fulfilled') {
          const allEvents = evData.value.events || (Array.isArray(evData.value) ? evData.value : []);
          setEvents(allEvents.slice(0, 3));
        }
        if (officersData.status === 'fulfilled') {
          setFeaturedOfficers(officersData.value.officers?.slice(0, 5) || []);
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

  // Creative IEEE Core Values cards matching reference design
  const coreValues = [
    {
      title: 'Growth',
      description:
        'Promote ongoing education for engineers, scientists, and technologists and maintain a student pipeline to sustain the profession.',
      watermark: (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%', opacity: 0.18 }}>
          <path d="M15 85 L45 55 L65 75 L90 25" />
          <path d="M70 25 L90 25 L90 45" />
        </svg>
      ),
    },
    {
      title: 'Global Community Building',
      description:
        'Cultivating active, vibrant, and honest exchange among cross-disciplinary and interdisciplinary global communities of technical professionals.',
      watermark: (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" style={{ width: '100%', height: '100%', opacity: 0.18 }}>
          <circle cx="50" cy="50" r="38" />
          <ellipse cx="50" cy="50" rx="20" ry="38" />
          <line x1="12" y1="50" x2="88" y2="50" />
          <path d="M25 25 Q 50 10 75 25" />
          <path d="M25 75 Q 50 90 75 75" />
        </svg>
      ),
    },
    {
      title: 'Trust',
      description:
        'Being a trusted and unbiased source of technical information, and forums, for technical dialog and collaboration.',
      watermark: (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" style={{ width: '100%', height: '100%', opacity: 0.18 }}>
          <circle cx="50" cy="30" r="14" fill="currentColor" opacity="0.4" />
          <circle cx="25" cy="70" r="12" fill="currentColor" opacity="0.4" />
          <circle cx="75" cy="70" r="12" fill="currentColor" opacity="0.4" />
          <line x1="50" y1="44" x2="25" y2="58" strokeWidth="6" />
          <line x1="50" y1="44" x2="75" y2="58" strokeWidth="6" />
          <line x1="37" y1="70" x2="63" y2="70" strokeWidth="6" />
        </svg>
      ),
    },
    {
      title: 'Partnership',
      description:
        'Cultivate a culture that values contributions, empowers individuals, and strengthens the volunteer-staff partnership for professional service.',
      watermark: (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%', opacity: 0.18 }}>
          <rect x="18" y="20" width="24" height="28" rx="4" />
          <rect x="58" y="52" width="24" height="28" rx="4" />
          <path d="M42 34 L58 50 M42 42 L58 58 M42 26 L58 42" />
        </svg>
      ),
    },
    {
      title: 'Service to humanity',
      description:
        'Leveraging science, technology, and engineering to benefit human welfare; promoting public awareness and understanding of engineering.',
      watermark: (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" style={{ width: '100%', height: '100%', opacity: 0.18 }}>
          <rect x="25" y="25" width="50" height="50" rx="8" />
          <line x1="50" y1="12" x2="50" y2="25" strokeWidth="5" />
          <line x1="50" y1="75" x2="50" y2="88" strokeWidth="5" />
          <line x1="12" y1="50" x2="25" y2="50" strokeWidth="5" />
          <line x1="75" y1="50" x2="88" y2="50" strokeWidth="5" />
          <circle cx="50" cy="50" r="12" />
        </svg>
      ),
    },
    {
      title: 'Integrity in action',
      description:
        'Fostering a professional climate in which engineers and scientists continue to be respected for their exemplary ethical behaviour and volunteerism.',
      watermark: (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" style={{ width: '100%', height: '100%', opacity: 0.18 }}>
          <line x1="50" y1="15" x2="50" y2="85" strokeWidth="6" />
          <line x1="20" y1="30" x2="80" y2="30" strokeWidth="6" />
          <path d="M20 30 L10 60 Q 20 70 30 60 Z" />
          <path d="M80 30 L70 60 Q 80 70 90 60 Z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* 1. Hero Section */}
      <section
        style={{
          position: 'relative',
          paddingTop: 'var(--space-16)',
          paddingBottom: 'var(--space-16)',
          background: 'radial-gradient(ellipse at 50% 10%, var(--color-primary-light) 0%, transparent 70%)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
            <div className="section-badge" style={{ marginBottom: 'var(--space-4)' }}>
              <Sparkles size={14} />
              <span>IEEE Student Branch #STB20451</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 'var(--space-6)',
                letterSpacing: '-0.03em',
              }}
            >
              Inspiring, innovating,{' '}
              <span style={{ color: 'var(--color-primary)' }}>connecting.</span>
            </h1>

            <p
              style={{
                fontSize: '1.2rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.65,
                marginBottom: 'var(--space-8)',
                maxWidth: '780px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              IEEE Menoufia Student Branch brings the world's largest technical association to campus — turning academic knowledge into real-world skill through robotics, AI, cybersecurity, and community leadership.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <Link to="/about" className="btn btn-primary btn-lg">
                <span>Meet the Brains</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/committees" className="btn btn-secondary btn-lg">
                <span>Explore Committees</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Historical Stats Banner (Separated Section seamlessly matching Hero) */}
      <section
        style={{
          padding: '0 0 var(--space-16) 0',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {/* Stat Card 1 */}
            <div
              className="bento-card"
              style={{
                padding: 'var(--space-6)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexDirection: 'row',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Calendar size={28} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
                  50+
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem' }}>
                  Events until present
                </div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div
              className="bento-card"
              style={{
                padding: 'var(--space-6)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexDirection: 'row',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Handshake size={28} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
                  30+
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem' }}>
                  Partnerships until present
                </div>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div
              className="bento-card"
              style={{
                padding: 'var(--space-6)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexDirection: 'row',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={28} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
                  200+
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem' }}>
                  Volunteers until present
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Block 1: Mission, Vision, and Values */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap" style={{ marginBottom: 'var(--space-10)' }}>
            <div className="section-badge">Branch Purpose</div>
            <h2 className="section-title">Mission, Vision & Values</h2>
            <p className="section-subtitle">
              The foundational pillars guiding every project, workshop, and leadership initiative at Menoufia.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {/* Card 1: Mission */}
            <div className="bento-card" style={{ padding: 'var(--space-8)' }}>
              <div
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <Target size={26} />
              </div>
              <h3 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-2)' }}>Mission</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
                Foster technological innovation for the benefit of humanity by empowering students with IEEE resources.
              </p>
            </div>

            {/* Card 2: Vision */}
            <div className="bento-card" style={{ padding: 'var(--space-8)' }}>
              <div
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <Telescope size={26} />
              </div>
              <h3 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-2)' }}>Vision</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
                To be the leading student branch in Egypt, known for impactful projects and a strong community of future engineers.
              </p>
            </div>

            {/* Card 3: Values */}
            <div className="bento-card" style={{ padding: 'var(--space-8)' }}>
              <div
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <HeartHandshake size={26} />
              </div>
              <h3 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-2)' }}>Values</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
                Collaboration, integrity, innovation, and using technology to solve real-world problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Block 2: Creative IEEE Core Values (Image 1 Style) */}
      <section
        className="section"
        style={{
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container">
          <div className="section-title-wrap" style={{ marginBottom: 'var(--space-10)' }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}>IEEE Values. Our Core.</h2>
            <p className="section-subtitle">
              The principles IEEE upholds worldwide across every initiative and community
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {coreValues.map((val, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
                }}
              >
                {/* Background Watermark Icon */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    width: '130px',
                    height: '130px',
                    pointerEvents: 'none',
                  }}
                >
                  {val.watermark}
                </div>

                <div style={{ position: 'relative', zIndex: 2, maxWidth: '85%' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.375rem',
                      fontWeight: 700,
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    {val.title}
                  </h3>
                  <p
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: '0.9375rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {val.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Latest Announcements & Featured Events */}
      <section className="section">
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
                  {events.map((ev) => {
                    const eventTime = ev.date ? new Date(ev.date).getTime() : NaN;
                    const isRegOpen = isNaN(eventTime) || (Date.now() < (eventTime - 24 * 60 * 60 * 1000));
                    const coverUrl = ev.coverImageUrl;

                    return (
                      <div
                        key={ev._id || ev.id}
                        className="bento-card"
                        style={{
                          padding: 0,
                          overflow: 'hidden',
                          borderRadius: 'var(--radius-lg)',
                        }}
                      >
                        {coverUrl && (
                          <div
                            style={{
                              width: '100%',
                              height: '140px',
                              backgroundColor: 'var(--color-bg-alt)',
                              overflow: 'hidden',
                            }}
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
                                e.target.parentElement.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div style={{ padding: 'var(--space-5)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-2)' }}>
                            <span className="badge badge-primary">CONFERENCE</span>
                            <span className={isRegOpen ? 'badge badge-accent' : 'badge badge-secondary'}>
                              {isRegOpen ? 'REGISTRATION OPEN' : 'REGISTRATION CLOSED'}
                            </span>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. 7 Committees Bento Grid Showcase */}
      <section
        className="section"
        style={{
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
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

      {/* 7. Featured "Meet the Brains" — Image-Focused 5-Officer Cards */}
      {featuredOfficers.length > 0 && (
        <section className="section">
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: 'var(--space-8)' }}>
              <div>
                <div className="section-badge">Branch Leadership</div>
                <h2 style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}>Meet the Brains</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                  Executive Board driving Season 2025/2026.
                </p>
              </div>
              <Link to="/about" className="btn btn-outline">
                <span>View Leadership Roster</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              {featuredOfficers.map((officer) => (
                <div
                  key={officer.id}
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
                  {/* Dominant Image Portrait Container */}
                  <div
                    style={{
                      width: '100%',
                      height: '280px',
                      backgroundColor: 'var(--color-bg-alt)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {officer.avatarUrl ? (
                      <img
                        src={officer.avatarUrl}
                        alt={officer.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                          transition: 'transform var(--transition-slow)',
                        }}
                        className="officer-img"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 800, fontSize: '3rem' }}>
                        {officer.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Officer Info & Clean Contact Icons */}
                  <div style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.375rem' }}>{officer.name}</h3>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {officer.role}
                      </span>
                    </div>

                    {/* Social / Contact Action Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                      {officer.linkedinUrl && (
                        <a
                          href={officer.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-icon"
                          style={{ width: '2.25rem', height: '2.25rem', padding: 0 }}
                          title={`LinkedIn Profile for ${officer.name}`}
                        >
                          <Linkedin size={15} style={{ color: 'var(--color-primary)' }} />
                        </a>
                      )}
                      {officer.email && (
                        <a
                          href={`mailto:${officer.email}`}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '2.25rem', height: '2.25rem', padding: 0 }}
                          title={`Send Email to ${officer.name}`}
                        >
                          <Mail size={15} style={{ color: 'var(--color-accent)' }} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hover Micro-interaction Styling */}
      <style>{`
        .bento-card:hover .officer-img,
        .bento-card:hover .event-img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
