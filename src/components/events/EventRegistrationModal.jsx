import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import {
  CheckCircle2,
  X,
  AlertCircle,
  Calendar,
  MapPin,
  Sparkles,
  Ticket,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export default function EventRegistrationModal({
  event,
  isOpen,
  onClose,
  onSuccess,
  isPreview = false,
  embedded = false,
}) {
  const { user, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    university: 'Menoufia University',
    faculty: 'Faculty of Electronic Engineering',
    major: '',
  });

  const [customResponses, setCustomResponses] = useState({});

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setSuccessData(null);
      setFormData({
        name: user?.name || (isPreview ? 'Yousef Mansour' : ''),
        email: user?.email || (isPreview ? 'attendee@ieeemsb.org' : ''),
        phoneNumber: user?.phoneNumber || (isPreview ? '+20 100 123 4567' : ''),
        university: user?.university || 'Menoufia University',
        faculty: user?.faculty || 'Faculty of Electronic Engineering',
        major: user?.major || (isPreview ? 'Computer Science & Engineering' : ''),
      });
      setCustomResponses({});
    }
  }, [isOpen, user, isPreview]);

  if (!isOpen || !event) return null;

  // Eligibility Guard
  const isPublic = !event.allowedAudience || event.allowedAudience === 'public';
  const isEmailUnverified = Boolean(isAuthenticated && user && !user.isEmailVerified && !isPreview);

  let eligibilityWarning = null;
  if (!isAuthenticated && !isPublic && !isPreview) {
    eligibilityWarning = 'This event is restricted to IEEE Portal members. Please log in to your account to register.';
  } else if (isEmailUnverified) {
    eligibilityWarning = `Email verification required: Please verify your email address (${user?.email}) before registering for events.`;
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomResponseChange = (fieldId, value) => {
    setCustomResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Full name is required';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) return 'A valid email address is required';
    return null;
  };

  const validateStep2 = () => {
    const fields = event.customFields || [];
    for (const f of fields) {
      if (f.required) {
        const val = customResponses[f.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          return `Please complete the required question: "${f.label}"`;
        }
      }
    }
    return null;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      if (!event.customFields || event.customFields.length === 0) {
        handleSubmit();
      } else {
        setStep(2);
      }
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (isEmailUnverified) {
      setError(`Please verify your email address (${user?.email}) to register for events.`);
      return;
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
    }

    if (isPreview) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessData({ id: 'TKT-PREVIEW-89241' });
        setStep(3);
      }, 350);
      return;
    }

    setLoading(true);
    try {
      const evId = event._id || event.id;
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phoneNumber,
        university: formData.university,
        faculty: formData.faculty,
        major: formData.major,
        customResponses,
      };

      const res = await api.registerForEvent(evId, payload);
      setSuccessData(res.participant || res.ticket || { id: res.ticketId || 'CONFIRMED' });
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalBody = (
    <div
      className={embedded ? 'ops-embedded-modal-card' : 'modal-content'}
      style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: embedded ? 'none' : '85vh',
        overflowY: embedded ? 'visible' : 'auto',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: embedded ? '1px solid var(--color-border)' : undefined,
        boxShadow: embedded ? 'var(--shadow-md)' : undefined,
        margin: embedded ? '0 auto' : undefined,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="modal-header">
        <div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
            <span className="badge badge-primary">{event.category || 'Event'}</span>
            <span className="badge badge-accent">Stage {step} of {event.customFields?.length > 0 ? 2 : 1}</span>
            {isPreview && (
              <span className="badge badge-secondary" style={{ fontSize: '0.68rem' }}>
                Live Simulation
              </span>
            )}
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
            {event.name}
          </h2>
        </div>
        {embedded ? (
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setStep(1)}
            title="Restart preview to Stage 1"
          >
            Reset
          </button>
        ) : (
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Modal Body */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {eligibilityWarning && (
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{eligibilityWarning}</span>
            </div>
          )}

          {error && (
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Personal & Academic Details */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Yousef Mansour"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="e.g. yousef@ieee.local"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">University / Org</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    placeholder="Menoufia University"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty</label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => handleInputChange('faculty', e.target.value)}
                    placeholder=""
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading || isEmailUnverified}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {isEmailUnverified ? (
                    'Verification Required'
                  ) : event.customFields && event.customFields.length > 0 ? (
                    <>Next: Questions <ChevronRight size={15} /></>
                  ) : (
                    loading ? 'Confirming...' : 'Complete Registration'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Event Custom Dynamic Fields */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Please answer the event-specific questions required by the organizer:
              </p>

              {(event.customFields || []).map((field) => (
                <div key={field.id} className="form-group">
                  <label className="form-label">
                    {field.label} {field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={customResponses[field.id] || ''}
                      onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                      className="form-input"
                    >
                      <option value="">{field.placeholder || '-- Select Option --'}</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={customResponses[field.id] || ''}
                      onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="form-input"
                      style={{ resize: 'vertical' }}
                    />
                  ) : field.type === 'checkbox' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(customResponses[field.id])}
                        onChange={(e) => handleCustomResponseChange(field.id, e.target.checked)}
                      />
                      {field.placeholder || 'Yes, I agree'}
                    </label>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={customResponses[field.id] || ''}
                      onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="form-input"
                    />
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || isEmailUnverified}
                  className="btn btn-primary"
                >
                  {isEmailUnverified ? 'Verification Required' : loading ? 'Submitting...' : 'Complete Registration ✓'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--color-text)' }}>
                Registration Confirmed!
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', maxWidth: '420px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Your event ticket will be sent to your email closer to the event date. Keep an eye on your inbox!.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Close Confirmation
              </button>
            </div>
          )}

        </div>
      </div>
  );

  if (embedded) {
    return modalBody;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {modalBody}
    </div>
  );
}
