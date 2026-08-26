import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Users,
  Linkedin,
  Mail,
  Calendar,
} from 'lucide-react';

export default function About() {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSeasonsAndOfficers() {
      try {
        const seasonsRes = await api.getPublicSeasons();
        const seasonList = seasonsRes.seasons || [];
        setSeasons(seasonList);

        const currentSeason = seasonList.find((s) => s.isCurrent)?.season || seasonList[0]?.season || '2025/2026';
        setSelectedSeason(currentSeason);

        const officersRes = await api.getPublicOfficers({ season: currentSeason });
        setOfficers(officersRes.officers || []);
      } catch (err) {
        console.error('Failed to load leadership data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSeasonsAndOfficers();
  }, []);

  const handleSeasonChange = async (season) => {
    setSelectedSeason(season);
    setLoading(true);
    try {
      const res = await api.getPublicOfficers({ season });
      setOfficers(res.officers || []);
    } catch (err) {
      console.error('Failed to fetch officers for season:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="section-title-wrap">
          <h1 className="section-title">Meet the Brains</h1>
          <p className="section-subtitle">
            The passionate leaders and officers driving IEEE Menoufia Student Branch across the whole season.
          </p>
        </div>

        {/* Dynamic Season Filter Pills */}
        {seasons.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-10)',
            }}
          >
            {seasons.map((s) => (
              <button
                key={s.season}
                type="button"
                className={`btn btn-sm ${selectedSeason === s.season ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSeasonChange(s.season)}
                style={{
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.45rem 1.15rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Calendar size={14} />
                <span>{s.season}</span>
                {s.isCurrent && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: selectedSeason === s.season ? '#FFFFFF' : '#10B981',
                      display: 'inline-block',
                      boxShadow: selectedSeason === s.season ? '0 0 6px rgba(255,255,255,0.8)' : '0 0 6px #10B981',
                    }}
                    title="Current Active Season"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Large, Image-Focused Officer Cards (3 to 5 Per Season) */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-muted)' }}>
            Loading leadership roster...
          </div>
        ) : officers.length === 0 ? (
          <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            <Users size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Officers Found for {selectedSeason}</h3>
            <p>Officers data will appear here once announced for this season.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-12)',
            }}
          >
            {officers.map((officer) => (
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
                {/* Large Portrait Image Container */}
                <div
                  style={{
                    width: '100%',
                    height: '290px',
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

                {/* Name, Role Badge, and Contact Icons Row */}
                <div style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.375rem' }}>{officer.name}</h3>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {officer.role}
                    </span>
                  </div>

                  {/* Contact Row directly under image details */}
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: 'var(--space-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                    }}
                  >
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
                        title={`Send email to ${officer.name}`}
                      >
                        <Mail size={15} style={{ color: 'var(--color-accent)' }} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover Micro-interaction Styling */}
      <style>{`
        .bento-card:hover .officer-img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
