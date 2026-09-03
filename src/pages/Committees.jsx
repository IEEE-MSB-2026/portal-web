import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import {
  Cpu,
  Brain,
  Code2,
  ShieldAlert,
  Users,
  Megaphone,
  Palette,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function Committees() {
  const { user } = useAuthStore();
  const [committees, setCommittees] = useState([]);
  const [openCampaigns, setOpenCampaigns] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const promises = [
          api.getPublicCommittees(),
          api.getOpenCampaigns(),
        ];
        if (user) {
          promises.push(api.getMyApplications().catch(() => ({ applications: [] })));
        }
        const [commData, campData, myAppsData] = await Promise.all(promises);
        setCommittees(commData.committees || []);
        setOpenCampaigns(campData.campaigns || []);
        if (myAppsData?.applications) {
          setUserApplications(myAppsData.applications);
        }
      } catch (err) {
        console.error('Failed to load committee data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const userEnrolledCommitteeIds = new Set();
  if (user?.availableScopes) {
    user.availableScopes.forEach((s) => {
      if (s.scopeType === 'committee' && s.scopeId) {
        userEnrolledCommitteeIds.add(s.scopeId);
      }
    });
  }
  if (user?.scopeType === 'committee' && user?.scopeId) {
    userEnrolledCommitteeIds.add(user.scopeId);
  }
  if (user?.committeeId) {
    userEnrolledCommitteeIds.add(user.committeeId);
  }

  const committeeDetails = {
    ras: {
      name: 'Robotics & Automation Society (RAS)',
      tagline: 'Designing, building, and programming autonomous systems.',
      icon: <Cpu size={28} />,
      tracks: [
        'Embedded Systems & Microcontrollers (STM32, ESP32, AVR)',
        'Autonomous Mobile Robotics & Sensor Fusion',
        'Computer Vision for Robot Navigation',
        'PCB Design, CAD Modeling & 3D Prototyping',
      ],
      leadRole: 'Lead Robotics Engineer',
    },
    ai: {
      name: 'Artificial Intelligence & Machine Learning (AI)',
      tagline: 'Advancing intelligence through deep learning, neural networks, and computer vision.',
      icon: <Brain size={28} />,
      tracks: [
        'Machine Learning Fundamentals & Data Science',
        'Deep Learning Architectures (CNNs, Transformers, LLMs)',
        'Computer Vision & Object Detection Pipelines',
        'Edge AI Deployment on Embedded Devices',
      ],
      leadRole: 'AI Research & Engineering Lead',
    },
    web: {
      name: 'Web Development & Cloud Computing (Web)',
      tagline: 'Architecting scalable, modern web applications and cloud infrastructure.',
      icon: <Code2 size={28} />,
      tracks: [
        'Modern Frontend Engineering (React, Vite, Next.js)',
        'Backend Microservices & Distributed APIs (Node.js, Express)',
        'Database Modeling (PostgreSQL, MongoDB, Redis)',
        'DevOps, Containerization & CI/CD Deployment',
      ],
      leadRole: 'Full Stack Engineering Lead',
    },
    cyber: {
      name: 'Cybersecurity & Defense (Cyber)',
      tagline: 'Securing digital assets through penetration testing, CTFs, and defensive forensics.',
      icon: <ShieldAlert size={28} />,
      tracks: [
        'Network Security & Protocol Analysis',
        'Web Application Penetration Testing',
        'Digital Forensics & Incident Response (DFIR)',
        'CTF Competitive Training (Reverse Engineering, Cryptography)',
      ],
      leadRole: 'Cybersecurity Operations Lead',
    },
    hr: {
      name: 'Human Resources & Talent (HR)',
      tagline: 'Recruiting, developing, and nurturing branch leaders and volunteers.',
      icon: <Users size={28} />,
      tracks: [
        'Annual Volunteer Recruitment Campaigns',
        'Member Performance & Development Tracking',
        'Leadership Training & Onboarding Workshops',
        'Branch Culture & Team Building Initiatives',
      ],
      leadRole: 'HR Director',
    },
    pr: {
      name: 'Public Relations & Partnerships (PR)',
      tagline: 'Building corporate sponsorships, university relations, and public communications.',
      icon: <Megaphone size={28} />,
      tracks: [
        'Corporate Sponsorship & Partner Outreach',
        'Official Communications & Press Releases',
        'Event Logistics & Speaker Relations',
        'Branch Growth & Community Networking',
      ],
      leadRole: 'PR & Outreach Director',
    },
    media: {
      name: 'Media & Visual Design (Media)',
      tagline: 'Visual storytelling, brand identity design, photo/video coverage, and digital art.',
      icon: <Palette size={28} />,
      tracks: [
        'Brand Identity & UI/UX Graphic Design',
        'Conference Photography & Live Coverage',
        'Cinematic Video Production & Post-Editing',
        'Motion Graphics & Digital Campaign Assets',
      ],
      leadRole: 'Creative & Media Director',
    },
  };

  return (
    <div className="section">
      <div className="container">
        <div className="section-title-wrap">
          <div className="section-badge">Committees & Societies</div>
          <h1 className="section-title">Explore Branch Committees</h1>
          <p className="section-subtitle">
            IEEE Menoufia Student Branch features 7 specialized technical societies and operational committees. Explore their tracks and get involved.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {committees.map((comm) => {
            const slug = (comm.slug || comm.key || '').toLowerCase();
            const detail = committeeDetails[slug] || {
              name: comm.name,
              tagline: comm.description,
              icon: <Sparkles size={28} />,
              tracks: ['Technical Workshop Series', 'Hands-on Projects', 'Peer Mentorship'],
            };

            const isUserEnrolled = userEnrolledCommitteeIds.has(comm.id);
            const hasOpenCampaign = openCampaigns.some((camp) => {
              if (camp.committees && camp.committees.length > 0) {
                return camp.committees.some((c) => c.id === comm.id);
              }
              return camp.committeeId === comm.id;
            });

            return (
              <div
                key={comm.id || slug}
                id={slug}
                className="bento-card"
                style={{
                  padding: 'var(--space-8)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 'var(--space-8)',
                  alignItems: 'start',
                }}
              >
                {/* Committee Overview */}
                <div>
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
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    {detail.icon}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-2)' }}>
                    <span className="badge badge-primary">{slug.toUpperCase()}</span>
                    {hasOpenCampaign ? (
                      <span className="badge badge-accent">RECRUITING NOW</span>
                    ) : (
                      <span className="badge badge-secondary" style={{ opacity: 0.8 }}>APPLICATIONS CLOSED</span>
                    )}
                  </div>

                  <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-3)' }}>{detail.name}</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '1.0625rem', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
                    {detail.tagline}
                  </p>

                  {(() => {
                    const userApp = userApplications.find(
                      (a) => a.committeeId === comm.id || a.committeeSlug === slug
                    );
                    const isUserEnrolled =
                      userEnrolledCommitteeIds.has(comm.id) ||
                      (userApp && (userApp.currentStage === 'accepted' || userApp.status === 'accepted'));

                    if (isUserEnrolled) {
                      return (
                        <Link
                          to={`/workspace/${comm.id}`}
                          className="btn btn-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <span>Go to Workspace</span>
                          <ArrowUpRight size={18} />
                        </Link>
                      );
                    }
                    if (userApp) {
                      const stageLabel = (userApp.currentStage || userApp.status || 'Applied').replace('_', ' ');
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <Link
                            to="/profile"
                            className="btn btn-warning"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', textTransform: 'capitalize' }}
                          >
                            <CheckCircle2 size={16} />
                            <span>Already Applied ({stageLabel})</span>
                          </Link>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            View review status on your profile
                          </span>
                        </div>
                      );
                    }
                    if (hasOpenCampaign) {
                      return (
                        <Link
                          to={`/join?committee=${slug}`}
                          className="btn btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <span>Apply for {slug.toUpperCase()}</span>
                          <ArrowUpRight size={18} />
                        </Link>
                      );
                    }
                    return (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled
                        style={{ opacity: 0.6, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Lock size={15} />
                        <span>Applications Closed</span>
                      </button>
                    );
                  })()}
                </div>

                {/* Technical Focus Tracks */}
                <div
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-6)',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      marginBottom: 'var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>Specialized Learning Tracks</span>
                  </h3>

                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {detail.tracks.map((track, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.625rem',
                          fontSize: '0.9375rem',
                          lineHeight: 1.5,
                        }}
                      >
                        <CheckCircle2 size={18} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{track}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
