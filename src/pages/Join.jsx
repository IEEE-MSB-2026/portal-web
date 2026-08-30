import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import '../styles/hr.css';
import {
  User,
  Phone,
  GraduationCap,
  Building2,
  Layers,
  FileText,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Send,
  Sparkles,
  LogIn,
  Lock,
  AlertTriangle,
  AlertCircle,
  Check,
} from 'lucide-react';

const STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Committee', icon: Layers },
  { label: 'Experience', icon: FileText },
  { label: 'CV Upload', icon: Upload },
  { label: 'Review', icon: CheckCircle2 },
];

const ACADEMIC_YEARS = ['First Year', 'Second Year', 'Third Year', 'Forth Year', 'Fifth Year', 'Graduate'];
const FACULTIES = [
  'Faculty of Engineering',
  'Faculty of Electronic Engineering',
  'Faculty of Computers and Information',
  'Faculty of Science',
  'Faculty of Arts',
  'Other',
];

export default function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const toast = useToastStore();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attemptedStepNext, setAttemptedStepNext] = useState(false);

  // Campaigns & committees
  const [campaigns, setCampaigns] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [urlCommitteeSlug, setUrlCommitteeSlug] = useState('');
  const [urlCommitteeNoCampaign, setUrlCommitteeNoCampaign] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');

  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('');

  const [skills, setSkills] = useState('');
  const [motivation, setMotivation] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const [cvFile, setCvFile] = useState(null);
  const [cvUrl, setCvUrl] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);

  // Pre-fill from auth
  useEffect(() => {
    if (user?.name) setFullName(user.name);
  }, [user]);

  // Load open campaigns
  useEffect(() => {
    async function load() {
      try {
        const [campaignsRes, committeesRes] = await Promise.all([
          api.getOpenCampaigns(),
          api.getPublicCommittees(),
        ]);
        const openCamps = campaignsRes.campaigns || [];
        const allComms = committeesRes.committees || [];
        setCampaigns(openCamps);
        setCommittees(allComms);

        // Auto-select campaign / check url ?committee= slug
        const preselectedSlug = searchParams.get('committee');
        if (preselectedSlug) {
          setUrlCommitteeSlug(preselectedSlug);
          const matchedComm = allComms.find((c) => c.slug === preselectedSlug);
          if (matchedComm) {
            // Find campaign that includes this committee
            const matchingCamp = openCamps.find((camp) => {
              if (camp.committees && camp.committees.length > 0) {
                return camp.committees.some((c) => c.id === matchedComm.id);
              }
              return camp.committeeId === matchedComm.id;
            });

            if (matchingCamp) {
              setSelectedCampaignId(matchingCamp.id);
              setSelectedCommitteeId(matchedComm.id);
              setUrlCommitteeNoCampaign(false);
            } else {
              setUrlCommitteeNoCampaign(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    load();
  }, [searchParams]);

  // Determine user memberships to disable already joined committees
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

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const selectedCommittee = committees.find((c) => c.id === selectedCommitteeId);

  // CV upload
  const handleCvUpload = async (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast.error('Invalid File', 'Please upload a PDF or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum file size is 10MB.');
      return;
    }

    setUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setCvUrl(data.url || data.fileUrl);
      setCvFile(file);
      toast.success('CV Uploaded', `${file.name} uploaded successfully.`);
    } catch (err) {
      toast.error('Upload Failed', err.message);
    } finally {
      setUploadingCv(false);
    }
  };

  // Validation per step
  const isStepValid = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return Boolean(fullName.trim() && phone.trim() && academicYear && faculty);
      case 1:
        return Boolean(selectedCampaignId && selectedCommitteeId);
      case 2:
        return motivation.trim().length >= 10;
      case 3:
        return true; // CV is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    setAttemptedStepNext(true);
    if (!isStepValid(step)) {
      return;
    }
    setAttemptedStepNext(false);
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.submitHRApplication({
        campaignId: selectedCampaignId,
        committeeId: selectedCommitteeId,
        answers: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          academicYear,
          faculty,
          department: department.trim(),
          skills: skills.trim(),
          motivation: motivation.trim(),
          portfolio: portfolio.trim(),
          cvUrl: cvUrl || null,
          cvFileName: cvFile?.name || null,
        },
      });
      setSubmitted(true);
      toast.success('Application Submitted!', 'Your application has been received. We\'ll review it soon.');
    } catch (err) {
      if (err.message?.includes('409') || err.message?.includes('already submitted')) {
        toast.error('Already Applied', 'You have already submitted an application for this campaign.');
      } else {
        toast.error('Submission Failed', err.message || 'Could not submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="join-page">
        <div className="join-page__header">
          <h1>Join IEEE MSB</h1>
          <p>Create an account or log in to submit your application to one of our technical committees.</p>
        </div>
        <div className="join-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <LogIn size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Authentication Required
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 360, margin: '0 auto var(--space-6)' }}>
            You need to be logged in to submit a recruitment application. Your profile information will be used for your application.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <LogIn size={16} /> Log In
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Submitted confirmation ────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="join-page">
        <div className="join-confirmation">
          <div className="join-confirmation__icon">
            <CheckCircle2 size={32} />
          </div>
          <h2>Application Submitted!</h2>
          <p>
            Your application to <strong>{selectedCommittee?.name || 'the committee'}</strong> has been received.
            Our HR team will review your submission and contact you about next steps.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to="/committees" className="btn btn-secondary">
              Browse Committees
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── No open campaigns ──────────────────────────────────────────────────────
  if (!loadingCampaigns && campaigns.length === 0) {
    return (
      <div className="join-page">
        <div className="join-page__header">
          <h1>Join IEEE MSB</h1>
          <p>Be part of Egypt's most innovative student engineering branch.</p>
        </div>
        <div className="join-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Recruitment is Not Open Yet
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto var(--space-6)' }}>
            Our recruitment campaigns are not currently active. Check back soon or follow our announcements for the next recruitment season.
          </p>
          <Link to="/committees" className="btn btn-primary">
            Explore Our Committees
          </Link>
        </div>
      </div>
    );
  }

  // Flatten campaign options for user selection
  const campaignCommitteeOptions = [];
  campaigns.forEach((camp) => {
    if (camp.committees && camp.committees.length > 0) {
      camp.committees.forEach((c) => {
        campaignCommitteeOptions.push({
          campaignId: camp.id,
          campaignTitle: camp.title,
          closesAt: camp.closesAt,
          committeeId: c.id,
          committeeName: c.name,
          committeeSlug: c.slug,
          isEnrolled: userEnrolledCommitteeIds.has(c.id),
        });
      });
    } else if (camp.committeeId) {
      const comm = committees.find((c) => c.id === camp.committeeId);
      campaignCommitteeOptions.push({
        campaignId: camp.id,
        campaignTitle: camp.title,
        closesAt: camp.closesAt,
        committeeId: camp.committeeId,
        committeeName: comm?.name || 'General Committee',
        committeeSlug: comm?.slug || '',
        isEnrolled: userEnrolledCommitteeIds.has(camp.committeeId),
      });
    }
  });

  // ── Main wizard ───────────────────────────────────────────────────────────
  return (
    <div className="join-page">
      <div className="join-page__header">
        <h1>Join IEEE MSB</h1>
        <p>Complete the application form to join one of our technical committees.</p>
      </div>

      {/* Step indicators */}
      <div className="join-steps">
        {STEPS.map((s, i) => (
          <div key={i} className={`join-step ${i === step ? 'join-step--active' : ''} ${i < step ? 'join-step--completed' : ''}`}>
            {i > 0 && <div className="join-step__connector" />}
            <div className="join-step__circle">
              {i < step ? <CheckCircle2 size={14} /> : i + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="join-card">
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <>
            <h3 className="join-card__title"><User size={20} /> Personal & Contact Info</h3>
            <div className="join-field">
              <label>Full Name *</label>
              <input
                type="text"
                className={`form-input ${attemptedStepNext && !fullName.trim() ? 'input-error' : ''}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
              {attemptedStepNext && !fullName.trim() && (
                <p className="field-error-note"><AlertCircle size={12} /> Full name is required.</p>
              )}
            </div>

            {/* Email Address (Non-Editable Account Bound) */}
            <div className="join-field">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  readOnly
                  disabled
                  style={{
                    background: 'var(--color-card-hover)',
                    color: 'var(--color-text-muted)',
                    cursor: 'not-allowed',
                    paddingRight: '2.5rem',
                  }}
                />
                <span style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} title="Account locked email">
                  <Lock size={15} />
                </span>
              </div>
            </div>

            <div className="join-field">
              <label>Phone / WhatsApp *</label>
              <input
                type="tel"
                className={`form-input ${attemptedStepNext && !phone.trim() ? 'input-error' : ''}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 1XX XXX XXXX"
              />
              {attemptedStepNext && !phone.trim() && (
                <p className="field-error-note"><AlertCircle size={12} /> Phone number is required.</p>
              )}
            </div>

            <div className="join-field">
              <label>Academic Year *</label>
              <select
                className={`form-input ${attemptedStepNext && !academicYear ? 'input-error' : ''}`}
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="">Select your year</option>
                {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {attemptedStepNext && !academicYear && (
                <p className="field-error-note"><AlertCircle size={12} /> Please select your academic year.</p>
              )}
            </div>

            <div className="join-field">
              <label>Faculty *</label>
              <select
                className={`form-input ${attemptedStepNext && !faculty ? 'input-error' : ''}`}
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
              >
                <option value="">Select your faculty</option>
                {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              {attemptedStepNext && !faculty && (
                <p className="field-error-note"><AlertCircle size={12} /> Please select your faculty.</p>
              )}
            </div>

            <div className="join-field">
              <label>Department</label>
              <input type="text" className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Computer Science & Engineering" />
            </div>
          </>
        )}

        {/* Step 1: Committee Preference */}
        {step === 1 && (
          <>
            <h3 className="join-card__title"><Layers size={20} /> Select Committee</h3>

            {urlCommitteeNoCampaign && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '0.15rem' }} />
                <div style={{ fontSize: '0.875rem' }}>
                  <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.15rem' }}>No Active Campaign for Selected Committee</strong>
                  There is currently no open recruitment campaign for <strong>{urlCommitteeSlug.toUpperCase()}</strong>. Please choose from one of our available open campaigns below.
                </div>
              </div>
            )}

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
              Choose the committee you'd like to join. Only committees with active recruitment campaigns are available.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {campaignCommitteeOptions.map((opt) => {
                const isSelected = selectedCampaignId === opt.campaignId && selectedCommitteeId === opt.committeeId;
                const isEnrolled = opt.isEnrolled;

                return (
                  <div
                    key={`${opt.campaignId}-${opt.committeeId}`}
                    onClick={() => {
                      if (!isEnrolled) {
                        setSelectedCampaignId(opt.campaignId);
                        setSelectedCommitteeId(opt.committeeId);
                      }
                    }}
                    style={{
                      background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg)',
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      cursor: isEnrolled ? 'not-allowed' : 'pointer',
                      opacity: isEnrolled ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {opt.committeeName}
                          {isEnrolled && (
                            <span className="hr-status-badge hr-status-badge--draft" style={{ fontSize: '0.65rem', textTransform: 'none' }}>
                              Already a Member
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {opt.campaignTitle} • Closes {new Date(opt.closesAt).toLocaleDateString()}
                        </div>
                      </div>
                      {isSelected && !isEnrolled && (
                        <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {attemptedStepNext && (!selectedCampaignId || !selectedCommitteeId) && (
              <p className="field-error-note" style={{ marginTop: '0.75rem' }}>
                <AlertCircle size={13} /> Please select an available committee to proceed.
              </p>
            )}
          </>
        )}

        {/* Step 2: Experience & Motivation */}
        {step === 2 && (
          <>
            <h3 className="join-card__title"><FileText size={20} /> Experience & Motivation</h3>

            <div className="join-field">
              <label>Relevant Skills</label>
              <p className="join-field__hint">List technologies, tools, or skills you're experienced in.</p>
              <input
                type="text"
                className="form-input"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g., Python, PyTorch, React, Embedded C, Photoshop"
              />
            </div>

            <div className="join-field">
              <label>Why do you want to join IEEE MSB & {selectedCommittee?.name || 'this committee'}? *</label>
              <p className="join-field__hint">Tell us about your motivation and what you hope to achieve (min 10 characters).</p>
              <textarea
                className={`form-input ${attemptedStepNext && motivation.trim().length < 10 ? 'input-error' : ''}`}
                rows={4}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Share your background, passion, and reasons for joining..."
                style={{ resize: 'vertical' }}
              />
              {attemptedStepNext && motivation.trim().length < 10 && (
                <p className="field-error-note">
                  <AlertCircle size={12} /> Motivation statement is required (minimum 10 characters).
                </p>
              )}
            </div>

            <div className="join-field">
              <label>Portfolio / GitHub / LinkedIn</label>
              <input type="url" className="form-input" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://github.com/yourusername" />
            </div>
          </>
        )}

        {/* Step 3: CV Upload */}
        {step === 3 && (
          <>
            <h3 className="join-card__title"><Upload size={20} /> CV / Resume (Optional)</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
              Upload your CV or resume if available. Accepted formats: PDF, DOCX (max 10MB).
            </p>

            {cvFile ? (
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cvFile.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{(cvFile.size / 1024).toFixed(0)} KB</div>
                  </div>
                </div>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={() => { setCvFile(null); setCvUrl(''); }}>
                  Remove
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-10)',
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: 'var(--color-bg)',
                  textAlign: 'center',
                }}
              >
                <Upload size={32} style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{uploadingCv ? 'Uploading...' : 'Click to upload your CV'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>PDF or DOCX, max 10MB</div>
                </div>
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} disabled={uploadingCv} onChange={(e) => handleCvUpload(e.target.files?.[0])} />
              </label>
            )}
          </>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <>
            <h3 className="join-card__title"><CheckCircle2 size={20} /> Review Your Application</h3>
            <div className="join-summary">
              <div className="join-summary__section">
                <h4>Personal Info</h4>
                <div className="join-summary__row"><span className="join-summary__label">Full Name</span><span className="join-summary__value">{fullName}</span></div>
                <div className="join-summary__row"><span className="join-summary__label">Account Email</span><span className="join-summary__value">{user?.email}</span></div>
                <div className="join-summary__row"><span className="join-summary__label">Phone</span><span className="join-summary__value">{phone}</span></div>
                <div className="join-summary__row"><span className="join-summary__label">Academic Year</span><span className="join-summary__value">{academicYear}</span></div>
                <div className="join-summary__row"><span className="join-summary__label">Faculty</span><span className="join-summary__value">{faculty}</span></div>
                {department && <div className="join-summary__row"><span className="join-summary__label">Department</span><span className="join-summary__value">{department}</span></div>}
              </div>
              <div className="join-summary__section">
                <h4>Target Committee</h4>
                <div className="join-summary__row"><span className="join-summary__label">Committee</span><span className="join-summary__value">{selectedCommittee?.name || 'Selected Committee'}</span></div>
                <div className="join-summary__row"><span className="join-summary__label">Campaign</span><span className="join-summary__value">{selectedCampaign?.title || 'N/A'}</span></div>
              </div>
              <div className="join-summary__section">
                <h4>Experience</h4>
                {skills && <div className="join-summary__row"><span className="join-summary__label">Skills</span><span className="join-summary__value">{skills}</span></div>}
                <div className="join-summary__row"><span className="join-summary__label">Motivation</span><span className="join-summary__value">{motivation}</span></div>
                {portfolio && <div className="join-summary__row"><span className="join-summary__label">Portfolio</span><span className="join-summary__value">{portfolio}</span></div>}
              </div>
              {cvFile && (
                <div className="join-summary__section">
                  <h4>CV / Resume</h4>
                  <div className="join-summary__row"><span className="join-summary__label">File</span><span className="join-summary__value">{cvFile.name}</span></div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Navigation buttons */}
        <div className="join-actions">
          {step > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={() => { setAttemptedStepNext(false); setStep((s) => s - 1); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button type="button" className="btn btn-primary" onClick={handleNextStep} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              {submitting ? 'Submitting...' : <><Send size={16} /> Submit Application</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
