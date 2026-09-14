import React, { useState, useEffect, useMemo } from 'react';
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
  Link2,
  ExternalLink,
} from 'lucide-react';

export const normalizeWebUrl = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const isValidWebUrl = (val) => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;

  // Whitespace anywhere in the URL is invalid
  if (/\s/.test(trimmed)) return false;

  // Block dangerous schemes
  if (/^(javascript|data|file|vbscript):/i.test(trimmed)) return false;

  // If a scheme is provided, only accept http:// or https://
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    if (!/^https?:\/\//i.test(trimmed)) {
      return false;
    }
  }

  const testUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(testUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname;
    if (!hostname) return false;

    // Allow localhost or loopback IP (useful in dev/testing)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // Hostname must contain at least one dot (domain.tld or sub.domain.tld)
    if (!hostname.includes('.')) {
      return false;
    }

    // Cannot start or end with dot or hyphen
    if (hostname.startsWith('.') || hostname.endsWith('.') || hostname.startsWith('-') || hostname.endsWith('-')) {
      return false;
    }

    const labels = hostname.split('.');
    if (labels.length < 2) return false;

    // TLD must be at least 2 alpha chars (or punycode)
    const tld = labels[labels.length - 1];
    if (!/^[a-zA-Z]{2,}$/.test(tld) && !/^xn--[a-zA-Z0-9]+$/i.test(tld)) {
      return false;
    }

    for (const label of labels) {
      if (!label || label.length > 63) return false;
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

export default function EventRegistrationModal({
  event,
  isOpen,
  onClose,
  onSuccess,
  isPreview = false,
  embedded = false,
}) {
  const { user, isAuthenticated, updateUser } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    university: '',
    faculty: '',
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
        phoneNumber: user?.phoneNumber || user?.phone || (isPreview ? '+20 100 123 4567' : ''),
        university: user?.university || (isPreview ? 'Menoufia University' : ''),
        faculty: user?.faculty || (isPreview ? 'Faculty of Electronic Engineering' : ''),
        major: user?.major || (isPreview ? 'Computer Science & Engineering' : ''),
      });
      setCustomResponses({});
    }
  }, [isOpen, user, isPreview]);

  // Fetch user profile from /api/core/users/{:id}/profile on open to populate university, faculty, and phone if already set
  useEffect(() => {
    const userId = user?.id || user?.userId || user?._id;
    if (!isOpen || !isAuthenticated || !userId) return;

    let isMounted = true;
    const loadUserProfile = async () => {
      try {
        const res = await api.getUserProfile(userId);
        const profile = res?.profile || res?.user || res;

        if (!isMounted || !profile) return;

        const profileUniversity = profile.university ? String(profile.university).trim() : '';
        const profileFaculty = profile.faculty ? String(profile.faculty).trim() : '';
        const profilePhone = (profile.phone || profile.phoneNumber) ? String(profile.phone || profile.phoneNumber).trim() : '';
        const profileMajor = (profile.department || profile.major) ? String(profile.department || profile.major).trim() : '';

        setFormData((prev) => ({
          ...prev,
          phoneNumber: prev.phoneNumber || profilePhone,
          university: prev.university || profileUniversity,
          faculty: prev.faculty || profileFaculty,
          major: prev.major || profileMajor,
        }));

        if (updateUser && (profileUniversity || profileFaculty || profilePhone)) {
          updateUser({
            ...(profileUniversity ? { university: profileUniversity } : {}),
            ...(profileFaculty ? { faculty: profileFaculty } : {}),
            ...(profilePhone ? { phone: profilePhone, phoneNumber: profilePhone } : {}),
          });
        }
      } catch (err) {
        console.warn('Could not fetch user profile details:', err);
      }
    };

    loadUserProfile();
    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated, user?.id, user?.userId, user?._id, updateUser]);

  // Derive sections from event.customFields unconditionally before any early return
  const sections = useMemo(() => {
    const rawFields = event?.customFields || [];
    if (!rawFields.length) return [];

    const sectionMap = new Map();
    rawFields.forEach((field) => {
      const secTitle = (field.section && field.section.trim()) ? field.section.trim() : 'Additional Questions';
      if (!sectionMap.has(secTitle)) {
        sectionMap.set(secTitle, []);
      }
      sectionMap.get(secTitle).push(field);
    });

    return Array.from(sectionMap.entries()).map(([title, fields]) => ({
      title,
      fields,
    }));
  }, [event?.customFields]);

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

  const handleCustomResponseChange = (fieldId, value, fieldType) => {
    let sanitized = value;
    if (fieldType === 'national_id') {
      sanitized = typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 14) : '';
    }
    setCustomResponses((prev) => ({ ...prev, [fieldId]: sanitized }));
  };

  const handleUrlBlur = (fieldId) => {
    setCustomResponses((prev) => {
      const current = prev[fieldId];
      if (typeof current !== 'string') return prev;
      const trimmed = current.trim();
      if (!trimmed) return { ...prev, [fieldId]: '' };
      if (isValidWebUrl(trimmed)) {
        return { ...prev, [fieldId]: normalizeWebUrl(trimmed) };
      }
      return { ...prev, [fieldId]: trimmed };
    });
  };

  const handleToggleMultiSelect = (fieldId, option) => {
    setCustomResponses((prev) => {
      const currentList = Array.isArray(prev[fieldId]) ? [...prev[fieldId]] : [];
      const idx = currentList.indexOf(option);
      if (idx > -1) {
        currentList.splice(idx, 1);
      } else {
        currentList.push(option);
      }
      return { ...prev, [fieldId]: currentList };
    });
  };

  const totalSteps = 1 + sections.length;
  const currentSection = typeof step === 'number' && step >= 2 && step <= totalSteps ? sections[step - 2] : null;
  const currentStepTitle = step === 1 ? 'Personal Details' : (currentSection?.title || '');

  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Full name is required';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) return 'A valid email address is required';
    if (!formData.phoneNumber.trim()) return 'Phone number is required';
    const cleanPhone = formData.phoneNumber.replace(/[\s\-()]/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      return 'Please enter a valid phone number (at least 10 digits)';
    }
    if (!formData.university.trim()) return 'University is required';
    if (!formData.faculty.trim()) return 'Faculty is required';
    return null;
  };

  const validateSection = (fields) => {
    for (const f of fields) {
      const val = customResponses[f.id];
      const strVal = val !== undefined && val !== null ? String(val).trim() : '';
      const isBlank = val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);

      if (f.required && isBlank) {
        return `Please complete the required question: "${f.label}"`;
      }

      if (f.type === 'url' && strVal) {
        if (!isValidWebUrl(strVal)) {
          return `Please enter a valid link/URL for "${f.label}" (e.g. drive.google.com/... or https://...)`;
        }
      }

      if (f.type === 'national_id') {
        if (f.required && !strVal) {
          return `Please enter your 14-digit National ID for "${f.label}"`;
        }
        if (strVal && !/^\d{14}$/.test(strVal)) {
          return `"${f.label}" must be exactly 14 digits (numbers only, currently ${strVal.length}/14)`;
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
      if (sections.length === 0) {
        handleSubmit();
      } else {
        setStep(2);
      }
    } else {
      const currentSecIdx = step - 2;
      const sec = sections[currentSecIdx];
      if (sec) {
        const err = validateSection(sec.fields);
        if (err) {
          setError(err);
          return;
        }

        // Auto-normalize valid URLs for current section
        setCustomResponses((prev) => {
          const updated = { ...prev };
          let changed = false;
          sec.fields.forEach((f) => {
            if (f.type === 'url' && typeof updated[f.id] === 'string') {
              const trimmed = updated[f.id].trim();
              if (trimmed && isValidWebUrl(trimmed)) {
                const norm = normalizeWebUrl(trimmed);
                if (norm !== updated[f.id]) {
                  updated[f.id] = norm;
                  changed = true;
                }
              }
            }
          });
          return changed ? updated : prev;
        });
      }

      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrev = () => {
    setError(null);
    if (typeof step === 'number' && step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (isEmailUnverified) {
      setError(`Please verify your email address (${user?.email}) to register for events.`);
      return;
    }
    for (const sec of sections) {
      const err = validateSection(sec.fields);
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
        setStep('confirmed');
      }, 350);
      return;
    }

    setLoading(true);
    try {
      const evId = event._id || event.id;

      // Sanitize and normalize URL custom responses for payload
      const sanitizedResponses = { ...customResponses };
      for (const sec of sections) {
        for (const f of sec.fields) {
          if (f.type === 'url' && typeof sanitizedResponses[f.id] === 'string') {
            const trimmed = sanitizedResponses[f.id].trim();
            if (trimmed && isValidWebUrl(trimmed)) {
              sanitizedResponses[f.id] = normalizeWebUrl(trimmed);
            }
          }
        }
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phoneNumber,
        phoneNumber: formData.phoneNumber,
        university: formData.university,
        faculty: formData.faculty,
        major: formData.major,
        customResponses: sanitizedResponses,
      };

      const res = await api.registerForEvent(evId, payload);
      setSuccessData(res.participant || res.ticket || { id: res.ticketId || 'CONFIRMED' });
      setStep('confirmed');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field) => {
    if (field.type === 'select') {
      return (
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
      );
    }

    if (field.type === 'multi_select') {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          maxHeight: '190px',
          overflowY: 'auto',
          padding: '0.6rem',
          background: 'var(--color-surface-hover, rgba(255,255,255,0.03))',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
        }}>
          {(field.options || []).map((opt) => {
            const isChecked = Array.isArray(customResponses[field.id]) && customResponses[field.id].includes(opt);
            return (
              <label
                key={opt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: '0.3rem 0.4rem',
                  borderRadius: 'var(--radius-xs)',
                  background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                  transition: 'background 0.15s',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleMultiSelect(field.id, opt)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      );
    }

    if (field.type === 'url') {
      const currentVal = customResponses[field.id] || '';
      const trimmedVal = typeof currentVal === 'string' ? currentVal.trim() : '';
      const isValid = trimmedVal.length > 0 && isValidWebUrl(trimmedVal);
      const isInvalid = trimmedVal.length > 0 && !isValid;
      const previewUrl = isValid ? normalizeWebUrl(trimmedVal) : null;

      return (
        <div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.85rem',
                color: isInvalid
                  ? 'var(--color-danger, #ef4444)'
                  : isValid
                  ? 'var(--color-success, #10b981)'
                  : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                transition: 'color 0.2s',
              }}
            >
              <Link2 size={16} />
            </span>
            <input
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={currentVal}
              onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
              onBlur={() => handleUrlBlur(field.id)}
              placeholder={field.placeholder || 'https://drive.google.com/... or linkedin.com/in/...'}
              className="form-input"
              style={{
                paddingLeft: '2.4rem',
                paddingRight: isValid ? '5.2rem' : '1rem',
                borderColor: isInvalid
                  ? 'var(--color-danger, #ef4444)'
                  : isValid
                  ? 'rgba(16, 185, 129, 0.4)'
                  : undefined,
              }}
            />
            {isValid && previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-xs"
                style={{
                  position: 'absolute',
                  right: '0.45rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.45rem',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-xs)',
                  textDecoration: 'none',
                  background: 'var(--color-surface-hover, rgba(255, 255, 255, 0.06))',
                  border: '1px solid var(--color-border)',
                }}
                title="Open and verify link in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Test</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          {isInvalid && (
            <span style={{ display: 'block', color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '0.3rem' }}>
              Please enter a valid link
            </span>
          )}
        </div>
      );
    }

    if (field.type === 'national_id') {
      return (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={14}
            value={customResponses[field.id] || ''}
            onChange={(e) => handleCustomResponseChange(field.id, e.target.value, 'national_id')}
            placeholder={field.placeholder || 'Enter 14-digit National ID'}
            className="form-input"
            style={{
              paddingRight: '4.8rem',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: (customResponses[field.id]?.length === 14)
                ? 'var(--color-success, #10b981)'
                : 'var(--color-text-muted)',
              pointerEvents: 'none',
              userSelect: 'none',
              transition: 'color 0.2s',
            }}
          >
            {customResponses[field.id]?.length || 0}/14
          </span>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          rows={3}
          value={customResponses[field.id] || ''}
          onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
          placeholder={field.placeholder || ''}
          className="form-input"
          style={{ resize: 'vertical' }}
        />
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem' }}>
          <input
            type="checkbox"
            checked={Boolean(customResponses[field.id])}
            onChange={(e) => handleCustomResponseChange(field.id, e.target.checked)}
          />
          {field.placeholder || 'Yes, I agree'}
        </label>
      );
    }

    return (
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={customResponses[field.id] || ''}
        onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
        placeholder={field.placeholder || ''}
        className="form-input"
      />
    );
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
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">{event.category || 'Event'}</span>
            {!successData && totalSteps > 1 && (
              <span className="badge badge-accent">
                Stage {step} of {totalSteps}
              </span>
            )}
            {!successData && currentStepTitle && (
              <span className="badge badge-secondary" style={{ fontSize: '0.72rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentStepTitle}
              </span>
            )}
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
            onClick={() => { setStep(1); setSuccessData(null); }}
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

      {/* Progress Bar */}
      {!successData && totalSteps > 1 && (
        <div style={{ width: '100%', height: '3px', background: 'var(--color-border)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.round(((typeof step === 'number' ? step : totalSteps) / totalSteps) * 100))}%`,
              height: '100%',
              background: 'var(--color-primary)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
      )}

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
          {step === 1 && !successData && (
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
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">University *</label>
                  <input
                    type="text"
                    required
                    value={formData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    placeholder="e.g. Menoufia University"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <input
                    type="text"
                    required
                    value={formData.faculty}
                    onChange={(e) => handleInputChange('faculty', e.target.value)}
                    placeholder="e.g. Faculty of Electronic Engineering"
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
                  ) : sections.length > 0 ? (
                    <>Next: {sections[0]?.title} <ChevronRight size={15} /></>
                  ) : (
                    loading ? 'Confirming...' : 'Complete Registration'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 to N: Dynamic Custom Sections */}
          {typeof step === 'number' && step >= 2 && currentSection && !successData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.2rem', color: 'var(--color-text)' }}>
                  {currentSection.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Section {step - 1} of {sections.length} • {currentSection.fields.length} question{currentSection.fields.length !== 1 ? 's' : ''}
                </span>
              </div>

              {currentSection.fields.map((field) => (
                <div key={field.id} className="form-group">
                  <label className="form-label">
                    {field.label} {field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                  </label>
                  {renderFieldInput(field)}
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ArrowLeft size={15} /> {step === 2 ? 'Details' : 'Previous'}
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
                  ) : step < totalSteps ? (
                    <>Next: {sections[step - 1]?.title} <ChevronRight size={15} /></>
                  ) : (
                    loading ? 'Submitting...' : 'Complete Registration ✓'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS Confirmation Screen */}
          {(Boolean(successData) || step === 'confirmed') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--color-text)' }}>
                Registration Confirmed!
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', maxWidth: '420px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Your event ticket will be sent to your email closer to the event date. Keep an eye on your inbox!
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
