import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import '../styles/hr.css';
import {
  Users,
  Briefcase,
  ClipboardList,
  ListChecks,
  Plus,
  Search,
  Calendar,
  X,
  UserPlus,
  UserMinus,
  Shield,
  ShieldAlert,
  Star,
  Check,
  Clock,
  Eye,
  FileText,
  Download,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  BarChart3,
  Loader2,
  RefreshCw,
  Edit2,
  GripVertical,
} from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'applied', label: 'Applied', color: '#3b82f6' },
  { key: 'screening', label: 'Screening', color: '#f59e0b' },
  { key: 'interview', label: 'Interview', color: '#8b5cf6' },
  { key: 'final_review', label: 'Final Review', color: '#10b981' },
];

const STAGE_NEXT = {
  applied: 'screening',
  screening: 'interview',
  interview: 'final_review',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDatetimeForInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HRStudio() {
  const { user } = useAuthStore();
  const toast = useToastStore();

  const isHrAuthorized =
    (user?.scopeType === 'global' && ['admin', 'officer'].includes(user?.role)) ||
    (user?.role === 'lead' && user?.committeeSlug === 'hr');

  if (!isHrAuthorized) {
    return (
      <div className="hr-studio" style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-4)' }}>
        <div className="join-card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-6)' }}>
            The HR Studio is restricted to Global Administrators, Officers, and Human Resources Committee Leads.
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('campaigns');

  // ── Campaigns Tab ─────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [committees, setCommittees] = useState([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', committeeIds: [], description: '', opensAt: '', closesAt: '', status: 'draft' });
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editCampaignData, setEditCampaignData] = useState({ title: '', committeeIds: [], description: '', opensAt: '', closesAt: '', status: 'draft' });
  const [savingCampaign, setSavingCampaign] = useState(false);

  // ── Pipeline Tab ──────────────────────────────────────────────────────────
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [candidateScore, setCandidateScore] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState(null);

  // ── Roster Tab ────────────────────────────────────────────────────────────
  const [rosterCommitteeId, setRosterCommitteeId] = useState('');
  const [rosterMembers, setRosterMembers] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberData, setAddMemberData] = useState({ externalUserId: '', email: '', roleInCommittee: 'member' });
  const [savingMember, setSavingMember] = useState(false);

  // ── Onboarding Tab ────────────────────────────────────────────────────────
  const [pipelineSummary, setPipelineSummary] = useState(null);

  // ── Load committees ───────────────────────────────────────────────────────
  useEffect(() => {
    async function loadCommittees() {
      try {
        const data = await api.getPublicCommittees();
        setCommittees(data.committees || []);
        if (data.committees?.length > 0 && !rosterCommitteeId) {
          setRosterCommitteeId(data.committees[0].id);
        }
      } catch (err) {
        console.error('Failed to load committees:', err);
      }
    }
    loadCommittees();
  }, []);

  // ── Load campaigns ────────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const data = await api.getHRCampaigns();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // ── Load applications ─────────────────────────────────────────────────────
  const loadApplications = useCallback(async () => {
    setLoadingApplications(true);
    try {
      const params = {};
      if (pipelineFilter) params.committeeId = pipelineFilter;
      const data = await api.getHRApplications(params);
      setApplications(data.applications || []);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingApplications(false);
    }
  }, [pipelineFilter]);

  useEffect(() => {
    if (activeTab === 'pipeline') loadApplications();
  }, [activeTab, loadApplications]);

  // ── Load roster ───────────────────────────────────────────────────────────
  const loadRoster = useCallback(async () => {
    if (!rosterCommitteeId) {
      setRosterMembers([]);
      return;
    }
    setLoadingRoster(true);
    try {
      const data = await api.getCommitteeMemberships(rosterCommitteeId);
      setRosterMembers(data.memberships || []);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingRoster(false);
    }
  }, [rosterCommitteeId]);

  useEffect(() => {
    if (activeTab === 'roster') loadRoster();
  }, [activeTab, loadRoster]);

  // ── Load pipeline summary ─────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'onboarding') {
      api.getHRPipelineSummary().then((data) => setPipelineSummary(data)).catch(() => {});
    }
  }, [activeTab]);

  // ── Candidate Notes & Score Auto-Save in Local Storage ─────────────────────
  const handleOpenCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    const savedNotes = localStorage.getItem(`hr_notes_${candidate.id}`) || '';
    const savedScore = localStorage.getItem(`hr_score_${candidate.id}`) || '';
    setCandidateNotes(savedNotes);
    setCandidateScore(savedScore);
  };

  const handleNotesChange = (val) => {
    setCandidateNotes(val);
    if (selectedCandidate) {
      localStorage.setItem(`hr_notes_${selectedCandidate.id}`, val);
    }
  };

  const handleScoreChange = (val) => {
    let scoreNum = '';
    if (val !== '') {
      const parsed = parseInt(val, 10);
      if (!Number.isNaN(parsed)) {
        scoreNum = Math.max(1, Math.min(10, parsed));
      }
    }
    setCandidateScore(scoreNum === '' ? '' : String(scoreNum));
    if (selectedCandidate) {
      localStorage.setItem(`hr_score_${selectedCandidate.id}`, scoreNum === '' ? '' : String(scoreNum));
    }
  };

  const clearCandidateDraft = (id) => {
    localStorage.removeItem(`hr_notes_${id}`);
    localStorage.removeItem(`hr_score_${id}`);
  };

  // ── Campaign Actions ──────────────────────────────────────────────────────
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaign.committeeIds.length) {
      toast.error('Validation Error', 'Please select at least one committee.');
      return;
    }
    setSavingCampaign(true);
    try {
      await api.createHRCampaign({
        committeeIds: newCampaign.committeeIds,
        committeeId: newCampaign.committeeIds[0],
        title: newCampaign.title.trim(),
        description: newCampaign.description.trim() || null,
        opensAt: new Date(newCampaign.opensAt).toISOString(),
        closesAt: new Date(newCampaign.closesAt).toISOString(),
        status: newCampaign.status,
      });
      toast.success('Campaign Created', `"${newCampaign.title}" has been created.`);
      setShowCreateCampaign(false);
      setNewCampaign({ title: '', committeeIds: [], description: '', opensAt: '', closesAt: '', status: 'draft' });
      loadCampaigns();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleOpenEditCampaign = (camp) => {
    setEditingCampaign(camp);
    const existingCIds = camp.committees?.length > 0
      ? camp.committees.map((c) => c.id)
      : (camp.committeeId ? [camp.committeeId] : []);
    setEditCampaignData({
      title: camp.title || '',
      committeeIds: existingCIds,
      description: camp.description || '',
      opensAt: formatDatetimeForInput(camp.opensAt),
      closesAt: formatDatetimeForInput(camp.closesAt),
      status: camp.status || 'draft',
    });
  };

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    if (!editCampaignData.committeeIds.length) {
      toast.error('Validation Error', 'Please select at least one committee.');
      return;
    }
    setSavingCampaign(true);
    try {
      await api.updateHRCampaign(editingCampaign.id, {
        title: editCampaignData.title.trim(),
        description: editCampaignData.description.trim() || null,
        opensAt: new Date(editCampaignData.opensAt).toISOString(),
        closesAt: new Date(editCampaignData.closesAt).toISOString(),
        status: editCampaignData.status,
        committeeIds: editCampaignData.committeeIds,
      });
      toast.success('Campaign Updated', `"${editCampaignData.title}" has been updated.`);
      setEditingCampaign(null);
      loadCampaigns();
    } catch (err) {
      toast.error('Update Failed', err.message);
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleToggleCampaignStatus = async (campaign, newStatus) => {
    try {
      await api.updateHRCampaignStatus(campaign.id, newStatus);
      toast.success('Status Updated', `Campaign is now "${newStatus}".`);
      loadCampaigns();
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  // ── Drag and Drop Pipeline Stage Handler ──────────────────────────────────
  const handleDropCandidateOnStage = async (targetStage) => {
    if (!draggedCandidate || draggedCandidate.currentStage === targetStage) return;
    const candidate = draggedCandidate;
    setDraggedCandidate(null);

    // Optimistically update UI
    setApplications((prev) =>
      prev.map((app) => (app.id === candidate.id ? { ...app, currentStage: targetStage } : app))
    );

    try {
      if (targetStage === 'accepted') {
        await api.acceptApplication(candidate.id, { notes: 'Moved via Kanban drag-and-drop' });
        toast.success('Candidate Accepted', `${candidate.answers?.fullName || 'Applicant'} accepted & enrolled.`);
      } else if (targetStage === 'rejected') {
        await api.rejectApplication(candidate.id, { notes: 'Moved via Kanban drag-and-drop' });
        toast.success('Application Rejected', `${candidate.answers?.fullName || 'Applicant'} rejected.`);
      } else {
        await api.updateApplicationStage(candidate.id, { stage: targetStage });
        toast.success('Stage Updated', `Moved to ${targetStage.replace('_', ' ')}.`);
      }
      loadApplications();
    } catch (err) {
      toast.error('Move Failed', err.message);
      loadApplications();
    }
  };

  // ── Pipeline Actions Modal ────────────────────────────────────────────────
  const handleAdvanceStage = async (app) => {
    const nextStage = STAGE_NEXT[app.currentStage];
    if (!nextStage) return;
    setProcessingAction(true);
    try {
      await api.updateApplicationStage(app.id, {
        stage: nextStage,
        notes: candidateNotes.trim() || null,
        score: candidateScore ? parseInt(candidateScore, 10) : undefined,
      });
      clearCandidateDraft(app.id);
      toast.success('Stage Updated', `Moved to ${nextStage.replace('_', ' ')}.`);
      setSelectedCandidate(null);
      loadApplications();
    } catch (err) {
      toast.error('Update Failed', err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAccept = async (app) => {
    setProcessingAction(true);
    try {
      await api.acceptApplication(app.id, { notes: candidateNotes.trim() || null });
      clearCandidateDraft(app.id);
      toast.success('Accepted!', 'Candidate has been accepted and committee membership assigned.');
      setSelectedCandidate(null);
      loadApplications();
    } catch (err) {
      toast.error('Accept Failed', err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (app) => {
    setProcessingAction(true);
    try {
      await api.rejectApplication(app.id, { notes: candidateNotes.trim() || null });
      clearCandidateDraft(app.id);
      toast.success('Rejected', 'Application has been rejected.');
      setSelectedCandidate(null);
      loadApplications();
    } catch (err) {
      toast.error('Reject Failed', err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  // ── Roster Actions ────────────────────────────────────────────────────────
  const handleAddMember = async (e) => {
    e.preventDefault();
    setSavingMember(true);
    try {
      await api.upsertCommitteeMembership({
        committeeId: rosterCommitteeId,
        externalUserId: addMemberData.externalUserId.trim(),
        email: addMemberData.email.trim(),
        roleInCommittee: addMemberData.roleInCommittee,
      });
      toast.success('Member Added', 'New member has been added to the committee.');
      setShowAddMember(false);
      setAddMemberData({ externalUserId: '', email: '', roleInCommittee: 'member' });
      loadRoster();
    } catch (err) {
      toast.error('Add Failed', err.message);
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!confirm(`Remove ${member.name || member.email} from the committee?`)) return;
    try {
      await api.removeCommitteeMembership(rosterCommitteeId, member.externalUserId);
      toast.success('Removed', `${member.name || 'Member'} has been removed.`);
      loadRoster();
    } catch (err) {
      toast.error('Remove Failed', err.message);
    }
  };

  const handleChangeRole = async (member, newRole) => {
    try {
      await api.upsertCommitteeMembership({
        committeeId: rosterCommitteeId,
        externalUserId: member.externalUserId,
        email: member.email,
        roleInCommittee: newRole,
      });
      toast.success('Role Updated', `${member.name} is now ${newRole}.`);
      loadRoster();
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCommitteeName = (id) => committees.find((c) => c.id === id)?.name || 'General';

  const getCampaignCommitteesLabel = (camp) => {
    if (camp.committees && camp.committees.length > 0) {
      return camp.committees.map((c) => c.name).join(', ');
    }
    return getCommitteeName(camp.committeeId);
  };

  const filteredApplications = applications.filter((a) => {
    if (pipelineSearch) {
      const q = pipelineSearch.toLowerCase();
      const name = (a.answers?.fullName || a.applicantEmail || '').toLowerCase();
      const email = (a.applicantEmail || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }
    return true;
  });

  const appsByStage = {};
  for (const stage of PIPELINE_STAGES) {
    appsByStage[stage.key] = filteredApplications.filter((a) => a.currentStage === stage.key);
  }

  const filteredRoster = rosterMembers.filter((m) => {
    if (!rosterSearch) return true;
    const q = rosterSearch.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
  });

  const toggleCommitteeSelection = (committeeId, isEdit = false) => {
    if (isEdit) {
      setEditCampaignData((prev) => {
        const exists = prev.committeeIds.includes(committeeId);
        const updated = exists ? prev.committeeIds.filter((id) => id !== committeeId) : [...prev.committeeIds, committeeId];
        return { ...prev, committeeIds: updated };
      });
    } else {
      setNewCampaign((prev) => {
        const exists = prev.committeeIds.includes(committeeId);
        const updated = exists ? prev.committeeIds.filter((id) => id !== committeeId) : [...prev.committeeIds, committeeId];
        return { ...prev, committeeIds: updated };
      });
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="hr-studio">
      <div className="hr-studio__header">
        <h1><Briefcase size={24} /> HR Studio</h1>
      </div>

      {/* Tab Navigation */}
      <div className="hr-tabs">
        <button type="button" className={`hr-tab ${activeTab === 'campaigns' ? 'hr-tab--active' : ''}`} onClick={() => setActiveTab('campaigns')}>
          <ClipboardList size={16} /> Campaigns
          <span className="hr-tab__badge">{campaigns.length}</span>
        </button>
        <button type="button" className={`hr-tab ${activeTab === 'pipeline' ? 'hr-tab--active' : ''}`} onClick={() => setActiveTab('pipeline')}>
          <Users size={16} /> Candidate Pipeline
          <span className="hr-tab__badge">{applications.length}</span>
        </button>
        <button type="button" className={`hr-tab ${activeTab === 'roster' ? 'hr-tab--active' : ''}`} onClick={() => setActiveTab('roster')}>
          <Shield size={16} /> Roster Management
        </button>
        <button type="button" className={`hr-tab ${activeTab === 'onboarding' ? 'hr-tab--active' : ''}`} onClick={() => setActiveTab('onboarding')}>
          <ListChecks size={16} /> Onboarding
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Campaigns                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <>
          <div className="hr-toolbar">
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateCampaign(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={16} /> New Campaign
            </button>
            <button type="button" className="btn btn-secondary" onClick={loadCampaigns} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingCampaigns ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /> Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
              <ClipboardList size={36} style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }} />
              <p>No recruitment campaigns yet. Create your first campaign to start recruiting.</p>
            </div>
          ) : (
            <div className="hr-campaign-grid">
              {campaigns.map((camp) => (
                <div key={camp.id} className="hr-campaign-card">
                  <div className="hr-campaign-card__header">
                    <h4 className="hr-campaign-card__title">{camp.title}</h4>
                    <span className={`hr-status-badge hr-status-badge--${camp.status}`}>{camp.status}</span>
                  </div>
                  <div className="hr-campaign-card__meta">
                    <span><Briefcase size={13} /> {getCampaignCommitteesLabel(camp)}</span>
                    <span><Calendar size={13} /> {formatDate(camp.opensAt)} — {formatDate(camp.closesAt)}</span>
                  </div>
                  {camp.description && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>{camp.description}</p>}
                  <div className="hr-campaign-card__actions" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => handleOpenEditCampaign(camp)}>
                      <Edit2 size={12} /> Edit
                    </button>
                    {camp.status === 'draft' && (
                      <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }} onClick={() => handleToggleCampaignStatus(camp, 'open')}>
                        Open
                      </button>
                    )}
                    {camp.status === 'open' && (
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }} onClick={() => handleToggleCampaignStatus(camp, 'closed')}>
                        Close
                      </button>
                    )}
                    {camp.status === 'closed' && (
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }} onClick={() => handleToggleCampaignStatus(camp, 'open')}>
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Campaign Modal */}
          {showCreateCampaign && (
            <div className="modal-overlay" onClick={() => setShowCreateCampaign(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                  <h3><Plus size={18} /> New Recruitment Campaign</h3>
                  <button type="button" className="modal-close" onClick={() => setShowCreateCampaign(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleCreateCampaign}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Campaign Title *</label>
                      <input className="form-input" value={newCampaign.title} onChange={(e) => setNewCampaign((p) => ({ ...p, title: e.target.value }))} placeholder="e.g., Fall 2026 Recruitment" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Committees * (Select all that apply)</label>
                      <div className="committee-tag-list">
                        {committees.map((c) => {
                          const isSelected = newCampaign.committeeIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`committee-tag-btn ${isSelected ? 'committee-tag-btn--active' : ''}`}
                              onClick={() => toggleCommitteeSelection(c.id, false)}
                            >
                              {isSelected && <Check size={12} />} {c.name}
                            </button>
                          );
                        })}
                      </div>
                      {newCampaign.committeeIds.length === 0 && (
                        <p className="field-error-note">Please select at least one committee.</p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-input" rows={2} value={newCampaign.description} onChange={(e) => setNewCampaign((p) => ({ ...p, description: e.target.value }))} placeholder="Optional details for applicants..." />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div className="form-group">
                        <label className="form-label">Opens At *</label>
                        <input type="datetime-local" className="form-input" value={newCampaign.opensAt} onChange={(e) => setNewCampaign((p) => ({ ...p, opensAt: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Closes At *</label>
                        <input type="datetime-local" className="form-input" value={newCampaign.closesAt} onChange={(e) => setNewCampaign((p) => ({ ...p, closesAt: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Initial Status</label>
                      <select className="form-input" value={newCampaign.status} onChange={(e) => setNewCampaign((p) => ({ ...p, status: e.target.value }))}>
                        <option value="draft">Draft</option>
                        <option value="open">Open (Active)</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateCampaign(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingCampaign || newCampaign.committeeIds.length === 0}>
                      {savingCampaign ? 'Creating...' : 'Create Campaign'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Campaign Modal */}
          {editingCampaign && (
            <div className="modal-overlay" onClick={() => setEditingCampaign(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                  <h3><Edit2 size={18} /> Edit Recruitment Campaign</h3>
                  <button type="button" className="modal-close" onClick={() => setEditingCampaign(null)}><X size={18} /></button>
                </div>
                <form onSubmit={handleUpdateCampaign}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Campaign Title *</label>
                      <input className="form-input" value={editCampaignData.title} onChange={(e) => setEditCampaignData((p) => ({ ...p, title: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Committees * (Select all that apply)</label>
                      <div className="committee-tag-list">
                        {committees.map((c) => {
                          const isSelected = editCampaignData.committeeIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`committee-tag-btn ${isSelected ? 'committee-tag-btn--active' : ''}`}
                              onClick={() => toggleCommitteeSelection(c.id, true)}
                            >
                              {isSelected && <Check size={12} />} {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-input" rows={2} value={editCampaignData.description} onChange={(e) => setEditCampaignData((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div className="form-group">
                        <label className="form-label">Opens At *</label>
                        <input type="datetime-local" className="form-input" value={editCampaignData.opensAt} onChange={(e) => setEditCampaignData((p) => ({ ...p, opensAt: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Closes At *</label>
                        <input type="datetime-local" className="form-input" value={editCampaignData.closesAt} onChange={(e) => setEditCampaignData((p) => ({ ...p, closesAt: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-input" value={editCampaignData.status} onChange={(e) => setEditCampaignData((p) => ({ ...p, status: e.target.value }))}>
                        <option value="draft">Draft</option>
                        <option value="open">Open (Active)</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingCampaign(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingCampaign || editCampaignData.committeeIds.length === 0}>
                      {savingCampaign ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Candidate Pipeline Kanban (with Drag and Drop)                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipeline' && (
        <>
          <div className="hr-toolbar">
            <div className="hr-search-wrap">
              <Search size={15} />
              <input className="hr-search-input" placeholder="Search candidates by name or email..." value={pipelineSearch} onChange={(e) => setPipelineSearch(e.target.value)} />
            </div>
            <select className="form-input" style={{ width: 'auto', minWidth: 180 }} value={pipelineFilter} onChange={(e) => setPipelineFilter(e.target.value)}>
              <option value="">All Committees</option>
              {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" className="btn btn-secondary" onClick={loadApplications} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingApplications ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /> Loading applications...
            </div>
          ) : (
            <div className="hr-pipeline">
              {PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage.key}
                  className="hr-pipeline-column"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('drag-over');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    handleDropCandidateOnStage(stage.key);
                  }}
                >
                  <div className="hr-pipeline-column__header">
                    <div className="hr-pipeline-column__title">
                      <span className={`hr-pipeline-column__dot hr-pipeline-column__dot--${stage.key}`} />
                      {stage.label}
                    </div>
                    <span className="hr-pipeline-column__count">{appsByStage[stage.key]?.length || 0}</span>
                  </div>
                  <div className="hr-pipeline-column__cards">
                    {(appsByStage[stage.key] || []).map((app) => (
                      <div
                        key={app.id}
                        className={`hr-candidate-card ${draggedCandidate?.id === app.id ? 'dragging' : ''}`}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', app.id);
                          setDraggedCandidate(app);
                        }}
                        onDragEnd={() => setDraggedCandidate(null)}
                        onClick={() => handleOpenCandidate(app)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div className="hr-candidate-card__name">{app.answers?.fullName || 'Unknown Applicant'}</div>
                          <GripVertical size={13} style={{ color: 'var(--color-text-subtle)', opacity: 0.6 }} />
                        </div>
                        <div className="hr-candidate-card__email">{app.applicantEmail || '—'}</div>
                        <div className="hr-candidate-card__footer">
                          <span className="hr-candidate-card__committee">{getCommitteeName(app.committeeId)}</span>
                          <span className="hr-candidate-card__date">{formatDate(app.submittedAt)}</span>
                        </div>
                      </div>
                    ))}
                    {(appsByStage[stage.key] || []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-subtle)', fontSize: '0.8rem' }}>
                        Drop candidates here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Candidate Detail Modal */}
          {selectedCandidate && (
            <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, margin: 'auto' }}>
                <div className="modal-header">
                  <h3><Eye size={18} /> Candidate Details</h3>
                  <button type="button" className="modal-close" onClick={() => setSelectedCandidate(null)}><X size={18} /></button>
                </div>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selectedCandidate.answers?.fullName || 'Unknown'}</h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{selectedCandidate.applicantEmail}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span className={`hr-status-badge hr-status-badge--${selectedCandidate.currentStage === 'final_review' ? 'open' : 'draft'}`}>{selectedCandidate.currentStage?.replace('_', ' ')}</span>
                      <span className="hr-candidate-card__committee">{getCommitteeName(selectedCandidate.committeeId)}</span>
                    </div>
                  </div>

                  {/* Application Answers */}
                  <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Application Form Responses</h5>
                    {Object.entries(selectedCandidate.answers || {}).map(([key, val]) => (
                      val && (
                        <div key={key} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--color-text-muted)', minWidth: 120, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span style={{ fontWeight: 500 }}>
                            {key === 'cvUrl' && val ? <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Download size={12} /> Download CV</a> : String(val)}
                          </span>
                        </div>
                      )
                    ))}
                  </div>

                  {/* Notes & Score */}
                  <div className="form-group">
                    <label className="form-label">Review Notes</label>
                    <textarea className="form-input" rows={3} value={candidateNotes} onChange={(e) => handleNotesChange(e.target.value)} placeholder="Type interview observations or candidate evaluation..." />
                  </div>
                  {selectedCandidate.currentStage !== 'final_review' && (
                    <div className="form-group">
                      <label className="form-label">Evaluation Rating (1 to 10)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        max="10"
                        value={candidateScore}
                        onChange={(e) => handleScoreChange(e.target.value)}
                        placeholder="Rate candidate from 1 to 10"
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  {STAGE_NEXT[selectedCandidate.currentStage] && (
                    <button type="button" className="btn btn-primary" disabled={processingAction} onClick={() => handleAdvanceStage(selectedCandidate)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ArrowRight size={14} /> Move to {STAGE_NEXT[selectedCandidate.currentStage].replace('_', ' ')}
                    </button>
                  )}
                  {selectedCandidate.currentStage === 'final_review' && (
                    <button type="button" className="btn btn-primary" disabled={processingAction} onClick={() => handleAccept(selectedCandidate)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#10b981' }}>
                      <ThumbsUp size={14} /> Accept & Enroll
                    </button>
                  )}
                  <button type="button" className="btn" disabled={processingAction} onClick={() => handleReject(selectedCandidate)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--color-destructive)', color: '#fff', border: 'none' }}>
                    <ThumbsDown size={14} /> Reject
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedCandidate(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Direct Roster Management                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'roster' && (
        <>
          <div className="hr-toolbar">
            <select className="form-input" style={{ width: 'auto', minWidth: 200, fontWeight: 600 }} value={rosterCommitteeId} onChange={(e) => setRosterCommitteeId(e.target.value)}>
              {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="hr-search-wrap">
              <Search size={15} />
              <input className="hr-search-input" placeholder="Search members in this committee..." value={rosterSearch} onChange={(e) => setRosterSearch(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setShowAddMember(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserPlus size={16} /> Add Member
            </button>
            <button type="button" className="btn btn-secondary" onClick={loadRoster} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingRoster ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /> Loading roster...
            </div>
          ) : filteredRoster.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
              <Users size={36} style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }} />
              <p>No members found for this committee.</p>
            </div>
          ) : (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <table className="hr-roster" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>MEMBER</th>
                    <th style={{ padding: '0.75rem 1rem' }}>EMAIL</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ROLE</th>
                    <th style={{ padding: '0.75rem 1rem' }}>JOINED</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((m) => (
                    <tr key={m.id || m.externalUserId} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{m.name || 'Member'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{m.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`hr-status-badge ${m.roleInCommittee === 'lead' ? 'hr-status-badge--open' : 'hr-status-badge--draft'}`}>
                          {m.roleInCommittee}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{formatDate(m.createdAt)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {m.roleInCommittee !== 'lead' ? (
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => handleChangeRole(m, 'lead')}>
                              Promote Lead
                            </button>
                          ) : (
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => handleChangeRole(m, 'member')}>
                              Demote
                            </button>
                          )}
                          <button type="button" className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => handleRemoveMember(m)}>
                            <UserMinus size={13} /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Member Modal */}
          {showAddMember && (
            <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header">
                  <h3><UserPlus size={18} /> Add Member to Roster</h3>
                  <button type="button" className="modal-close" onClick={() => setShowAddMember(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleAddMember}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">User / External ID *</label>
                      <input className="form-input" value={addMemberData.externalUserId} onChange={(e) => setAddMemberData((p) => ({ ...p, externalUserId: e.target.value }))} placeholder="e.g. 11111111-0000-4000-8000-000000000009" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Member Email *</label>
                      <input type="email" className="form-input" value={addMemberData.email} onChange={(e) => setAddMemberData((p) => ({ ...p, email: e.target.value }))} placeholder="member@ieee.local" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role in Committee</label>
                      <select className="form-input" value={addMemberData.roleInCommittee} onChange={(e) => setAddMemberData((p) => ({ ...p, roleInCommittee: e.target.value }))}>
                        <option value="member">Member</option>
                        <option value="lead">Lead</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingMember}>
                      {savingMember ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: Onboarding & KPIs                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'onboarding' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            <BarChart3 size={18} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} /> Recruitment & Onboarding KPIs
          </h3>

          {pipelineSummary ? (
            <div className="hr-campaign-grid" style={{ marginBottom: 'var(--space-8)' }}>
              <div className="hr-campaign-card">
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Applications</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                  {pipelineSummary.totalApplications || 0}
                </div>
              </div>
              <div className="hr-campaign-card">
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Accepted Candidates</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
                  {pipelineSummary.stages?.accepted || 0}
                </div>
              </div>
              <div className="hr-campaign-card">
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Rejected Candidates</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', marginTop: '0.25rem' }}>
                  {pipelineSummary.stages?.rejected || 0}
                </div>
              </div>
              <div className="hr-campaign-card">
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>In Pipeline (Active)</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
                  {(pipelineSummary.stages?.applied || 0) + (pipelineSummary.stages?.screening || 0) + (pipelineSummary.stages?.interview || 0) + (pipelineSummary.stages?.final_review || 0)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> Loading summary metrics...
            </div>
          )}

          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
            <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Onboarding Automation Workflow</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              When a candidate is moved to the Final Review stage and Accepted:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.8 }}>
              <li>Committee membership is automatically recorded in the core branch roster.</li>
              <li>Downstream IAM services provision multi-role permissions for the member.</li>
              <li>Welcome & onboarding email notification is dispatched to the candidate's account.</li>
              <li>A personal 4-step onboarding checklist is provisioned on the member's Dashboard.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
