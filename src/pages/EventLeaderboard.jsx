import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useThemeStore } from '../store/themeStore';
import '../styles/leaderboard.css';
import {
  Medal,
  Crown,
  Search,
  Calendar,
  MapPin,
  Users,
  Award,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 15;

export default function EventLeaderboard() {
  const { eventId } = useParams();
  const { theme, toggleTheme } = useThemeStore();

  // Keep documentElement theme dataset in sync
  useEffect(() => {
    if (theme) {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Filter / Search in leaderboard list
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(
    async (isBackground = false) => {
      if (!eventId) return;
      if (!isBackground) setLoading(true);

      try {
        const res = await api.getPublicEventLeaderboard(eventId, { limit: 200 });
        setData(res);
        setError(null);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        if (!isBackground) {
          setError(err.message || 'Failed to load event leaderboard. Please try again.');
        }
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [eventId]
  );

  // Initial load
  useEffect(() => {
    fetchLeaderboard(false);
  }, [fetchLeaderboard]);

  // Silent Auto-refresh ticker (15s) in background
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLeaderboard(true);
    }, REFRESH_INTERVAL_SECONDS * 1000);

    return () => clearInterval(timer);
  }, [fetchLeaderboard]);

  // Format Event Dates
  const event = data?.event;
  const podium = data?.podium || [];
  const leaderboard = data?.leaderboard || [];

  const formattedDate = event?.startDate
    ? new Date(event.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Filtered leaderboard
  const filteredList = leaderboard.filter((item) =>
    (item.name || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className={`lb-page ${theme === 'light' ? 'lb-light' : 'lb-dark'}`}>
      {/* Floating Theme Toggle Switcher */}
      <button
        type="button"
        onClick={toggleTheme}
        className="lb-theme-toggle-btn"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Subtle atmospheric backdrop glows */}
      <div className="lb-bg-mesh">
        <div className="lb-bg-glow-1" />
        <div className="lb-bg-glow-2" />
      </div>

      <div className="lb-container">
        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
            <h3 className="lb-loading-title">Loading Event Standings…</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Calculating points from live check-in activities
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              textAlign: 'center',
              margin: '3rem auto',
              maxWidth: 550,
            }}
          >
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171' }}>Leaderboard Unavailable</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.5rem auto 1.5rem' }}>
              {error}
            </p>
            <button type="button" onClick={() => fetchLeaderboard(false)} className="btn btn-primary btn-sm">
              Retry Connection
            </button>
          </div>
        )}

        {/* Content View */}
        {!loading && !error && event && (
          <>
            {/* Event Hero Header */}
            <section className="lb-hero">
              <div className="lb-hero__info">
                <div className="lb-hero__kicker">
                  <span>IEEE Menoufia Student Branch</span>
                </div>
                <h1 className="lb-hero__title">{event.name}</h1>
                <div className="lb-hero__meta">
                  {formattedDate && (
                    <span className="lb-hero__meta-item">
                      <Calendar size={14} />
                      {formattedDate}
                    </span>
                  )}
                  {event.venue && (
                    <span className="lb-hero__meta-item">
                      <MapPin size={14} />
                      {event.venue}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Top 3 Podium (Rank 2 - Rank 1 - Rank 3) */}
            {podium.length > 0 && podium[0]?.pointsAwarded > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <Crown size={16} color="#f59e0b" />
                  <h2 className="lb-section-title">
                    Top Honors
                  </h2>
                </div>

                <div className="lb-podium">
                  {/* Rank 2: Silver */}
                  {podium[1] ? (
                    <div className="lb-podium-card lb-podium-card--2">
                      <div className="lb-podium-badge lb-podium-badge--2">
                        <Medal size={22} />
                      </div>
                      <span className="badge badge-secondary" style={{ fontSize: '0.68rem', marginBottom: '0.5rem' }}>
                        RANK #2
                      </span>
                      <div className="lb-podium-name" title={podium[1].name}>
                        {podium[1].name}
                      </div>
                      <div className="lb-podium-points">{podium[1].pointsAwarded} pts</div>
                      <div className="lb-podium-sub">
                        {podium[1].completedActivitiesCount} {podium[1].completedActivitiesCount === 1 ? 'activity' : 'activities'}
                      </div>
                    </div>
                  ) : (
                    <div className="lb-podium-card lb-podium-card--2" style={{ opacity: 0.35 }}>
                      <span className="lb-podium-sub">Awaiting Scorer</span>
                    </div>
                  )}

                  {/* Rank 1: Gold */}
                  {podium[0] ? (
                    <div className="lb-podium-card lb-podium-card--1">
                      <div className="lb-podium-badge lb-podium-badge--1">
                        <Crown size={24} />
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        CHAMPION #1
                      </span>
                      <div className="lb-podium-name" style={{ fontSize: '1.25rem' }} title={podium[0].name}>
                        {podium[0].name}
                      </div>
                      <div className="lb-podium-points" style={{ fontSize: '1.9rem' }}>
                        {podium[0].pointsAwarded} pts
                      </div>
                      <div className="lb-podium-sub">
                        {podium[0].completedActivitiesCount} {podium[0].completedActivitiesCount === 1 ? 'activity' : 'activities'}
                      </div>
                    </div>
                  ) : (
                    <div className="lb-podium-card lb-podium-card--1" style={{ opacity: 0.35 }}>
                      <span className="lb-podium-sub">Awaiting Scorer</span>
                    </div>
                  )}

                  {/* Rank 3: Bronze */}
                  {podium[2] ? (
                    <div className="lb-podium-card lb-podium-card--3">
                      <div className="lb-podium-badge lb-podium-badge--3">
                        <Award size={22} />
                      </div>
                      <span className="badge badge-accent" style={{ fontSize: '0.68rem', marginBottom: '0.5rem' }}>
                        RANK #3
                      </span>
                      <div className="lb-podium-name" title={podium[2].name}>
                        {podium[2].name}
                      </div>
                      <div className="lb-podium-points">{podium[2].pointsAwarded} pts</div>
                      <div className="lb-podium-sub">
                        {podium[2].completedActivitiesCount} {podium[2].completedActivitiesCount === 1 ? 'activity' : 'activities'}
                      </div>
                    </div>
                  ) : (
                    <div className="lb-podium-card lb-podium-card--3" style={{ opacity: 0.35 }}>
                      <span className="lb-podium-sub">Awaiting Scorer</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Standings Table Card */}
            <section className="lb-table-card">
              <div className="lb-table-header">
                <div className="lb-table-title">
                  <Users size={16} className="lb-table-icon" />
                  <span>Full Event Standings ({filteredList.length})</span>
                </div>

                {/* Instant Name Filter */}
                <div style={{ position: 'relative', width: 240, maxWidth: '100%' }}>
                  <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="form-input lb-search-input"
                    placeholder="Filter by name..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>
              </div>

              {filteredList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                  <Award size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                  <p style={{ fontSize: '0.875rem' }}>
                    {searchFilter ? 'No attendees match your search.' : 'No attendees have earned points yet. Standings will update automatically as activities are scanned!'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="lb-table">
                    <thead>
                      <tr>
                        <th style={{ width: 80, textAlign: 'center' }}>Rank</th>
                        <th>Attendee Name</th>
                        <th style={{ textAlign: 'center' }}>Completed Activities</th>
                        <th style={{ textAlign: 'right' }}>Total Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((item, idx) => {
                        const rankClass =
                          item.rank === 1
                            ? 'lb-rank-num--1'
                            : item.rank === 2
                            ? 'lb-rank-num--2'
                            : item.rank === 3
                            ? 'lb-rank-num--3'
                            : '';

                        return (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`lb-rank-num ${rankClass}`}>
                                #{item.rank}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span className="lb-attendee-name">{item.name}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {item.completedActivitiesCount} {item.completedActivitiesCount === 1 ? 'activity' : 'activities'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="lb-points-tag">
                                <Award size={13} />
                                <span>{item.pointsAwarded} pts</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

