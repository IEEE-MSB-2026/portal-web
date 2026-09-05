import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import '../styles/operations.css';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Calendar,
  Award,
} from 'lucide-react';

export default function SelfServiceCheckIn() {
  const { activityQrId } = useParams();
  const { user, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    async function loadActivity() {
      if (!activityQrId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getActivityByQrId(activityQrId);
        setActivityData(data);
      } catch (err) {
        console.error('Failed to load activity info:', err);
        setError(err.message || 'Activity not found or check-in link is invalid.');
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, [activityQrId]);

  const handleSelfCheckIn = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.selfCheckInActivity(activityQrId, email.trim().toLowerCase());
      setResult(res);
    } catch (err) {
      console.error('Self check-in error:', err);
      setError(err.message || 'Check-in failed. Please verify your email or check with the organizer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="studio-layout ops-studio" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <QrCode size={40} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-3)' }} />
          <h3>Loading Activity Check-In...</h3>
        </div>
      </div>
    );
  }

  const isLocked = activityData?.activity?.isLocked;
  const activity = activityData?.activity;
  const event = activityData?.event;

  return (
    <div className="studio-layout ops-studio" style={{ maxWidth: '580px', margin: '2rem auto', padding: '1rem' }}>
      <div className="bento-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        
        {/* Top Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.45rem', marginBottom: '1.25rem' }}>
          <span className="badge badge-primary">
            <QrCode size={13} /> IEEE Self-Service Check-In
          </span>
        </div>

        {/* Activity & Event Headers */}
        {activity && (
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.35rem' }}>
              {activity.name}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0 }}>
              {event?.name || 'IEEE Event'}
            </p>
            {activity.points > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '999px', padding: '0.3rem 0.85rem', color: '#10b981', fontWeight: 700, fontSize: '0.82rem', marginTop: '0.85rem' }}>
                <Award size={14} /> +{activity.points} Activity Points
              </div>
            )}
          </div>
        )}

        {/* Locked Activity Guard */}
        {isLocked ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', color: 'var(--color-danger)' }}>
            <Lock size={36} style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Check-In Currently Locked
            </h3>
            <p style={{ fontSize: '0.88rem', margin: 0, opacity: 0.9 }}>
              This activity has been locked by the operations team. Please wait for the session moderator to open check-in.
            </p>
          </div>
        ) : result ? (
          /* Success Screen */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.35rem' }}>
                You're Checked In!
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Welcome, <strong>{result.participant?.name || 'Attendee'}</strong>! Your attendance is recorded.
              </p>
            </div>

            <div className="bento-card" style={{ width: '100%', padding: '1.25rem', background: 'var(--color-bg)', display: 'flex', justifyContent: 'space-around', margin: '0.5rem 0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Points Earned</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                  +{result.pointsEarned || activity?.points || 10}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--color-border)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total Points</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {result.participant?.pointsAwarded || 'Active'}
                </div>
              </div>
            </div>

            <Link
              to="/events"
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Browse More Events
            </Link>
          </div>
        ) : (
          /* Check-In Form */
          <form onSubmit={handleSelfCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            
            {error && (
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Your Registered Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter the email you registered with..."
                  className="form-input"
                />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Enter the email address you used when registering for this event.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
            >
              {submitting ? 'Checking In...' : 'Confirm My Attendance →'}
            </button>

            {!isAuthenticated && (
              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Have an IEEE Portal account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Log In</Link>
              </p>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
