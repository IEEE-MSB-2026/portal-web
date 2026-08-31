import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  UserX,
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
  Filter,
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';

const BASE_PIPELINE_STAGES = [
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

  const isGlobalAdminOrOfficer = user?.scopeType === 'global' && ['admin', 'officer'].includes(user?.role);
  const isHrLead = user?.role === 'lead' && user?.committeeSlug === 'hr';
  const isHrAuthorized = isGlobalAdminOrOfficer || isHrLead;

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
          <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const VALID_HR_TABS = ['campaigns', 'pipeline', 'members', 'onboarding'];
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = VALID_HR_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'campaigns';
  const [activeTab, setActiveTabState] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (VALID_HR_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [searchParams]);

  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
    setSearchParams(newTab === 'campaigns' ? {} : { tab: newTab }, { replace: true });
  };

  // ── Campaigns Tab ─────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [committees, setCommittees] = useState([]);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('');
  const [campaignCommitteeFilter, setCampaignCommitteeFilter] = useState('');
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

  // ── Dedicated Rejected Modal State ────────────────────────────────────────
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [rejectedApplications, setRejectedApplications] = useState([]);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [rejectedSearch, setRejectedSearch] = useState('');

  // ── Member Management Tab ─────────────────────────────────────────────────
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedCommitteeFilters, setSelectedCommitteeFilters] = useState([]);
  const [selectedRoleFilters, setSelectedRoleFilters] = useState([]);
  const [joinedDateFrom, setJoinedDateFrom] = useState('');
  const [joinedDateTo, setJoinedDateTo] = useState('');
  const [openColumnFilter, setOpenColumnFilter] = useState(null);
  const [committeeFilterSearch, setCommitteeFilterSearch] = useState('');

  // Add Member Modal State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [targetCommitteeId, setTargetCommitteeId] = useState('');
  const [targetRole, setTargetRole] = useState('member');
  const [savingMembers, setSavingMembers] = useState(false);
  const [openActionMenuKey, setOpenActionMenuKey] = useState(null);

  // Close 3-dots action menu and column filters when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenActionMenuKey(null);
      setOpenColumnFilter(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // ── Onboarding Tab ────────────────────────────────────────────────────────
  const [pipelineSummary, setPipelineSummary] = useState(null);

  // ── Load Committees ───────────────────────────────────────────────────────
  useEffect(() => {
    async function loadCommittees() {
      try {
        const data = await api.getPublicCommittees();
        const comms = data.committees || [];
        setCommittees(comms);
        if (comms.length > 0 && !targetCommitteeId) {
          setTargetCommitteeId(comms[0].id);
        }
      } catch (err) {
        console.error('Failed to load committees:', err);
      }
    }
    loadCommittees();
  }, []);

  // ── Load Campaigns ────────────────────────────────────────────────────────
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

  // ── Load Applications (Active Stages) ─────────────────────────────────────
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

  // ── Load Rejected Applications ────────────────────────────────────────────
  const loadRejectedApplications = useCallback(async () => {
    setLoadingRejected(true);
    try {
      const params = { includeRejected: true };
      if (pipelineFilter) params.committeeId = pipelineFilter;
      const data = await api.getHRApplications(params);
      const rejectedList = (data.applications || []).filter((a) => a.currentStage === 'rejected');
      setRejectedApplications(rejectedList);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingRejected(false);
    }
  }, [pipelineFilter]);

  const handleOpenRejectedModal = () => {
    setShowRejectedModal(true);
    loadRejectedApplications();
  };

  // ── Load All Members (Branch-wide) ────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await api.getAllCommitteeMemberships();
      setAllMembers(data.memberships || []);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'members') loadMembers();
  }, [activeTab, loadMembers]);

  // ── Load Pipeline Summary ─────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'onboarding') {
      api.getHRPipelineSummary().then((data) => setPipelineSummary(data)).catch(() => {});
    }
  }, [activeTab]);

  // ── User Search in Add Member Modal ───────────────────────────────────────
  useEffect(() => {
    if (!userSearchQuery.trim() || !showAddMember) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const data = await api.searchRegisteredUsers(userSearchQuery);
        setUserSearchResults(data.users || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearchQuery, showAddMember]);

  // ── Candidate Notes & Score Local Storage ─────────────────────────────────
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

  // ── Campaign CRUD ─────────────────────────────────────────────────────────
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
      toast.success('Rejected', 'Application has been moved to Rejected archive.');
      setSelectedCandidate(null);
      loadApplications();
    } catch (err) {
      toast.error('Reject Failed', err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  // ── Batch Add Members ─────────────────────────────────────────────────────
  const toggleUserSelection = (u) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((item) => item.id === u.id);
      if (exists) return prev.filter((item) => item.id !== u.id);
      return [...prev, u];
    });
  };

  const handleBatchAddMembers = async (e) => {
    e.preventDefault();
    if (!selectedUsers.length) {
      toast.error('Validation Error', 'Please select at least one user.');
      return;
    }
    if (!targetCommitteeId) {
      toast.error('Validation Error', 'Please select a target committee.');
      return;
    }

    setSavingMembers(true);
    let successCount = 0;
    try {
      for (const u of selectedUsers) {
        await api.upsertCommitteeMembership({
          committeeId: targetCommitteeId,
          externalUserId: u.externalUserId || u.id,
          email: u.email,
          roleInCommittee: targetRole,
        });
        successCount++;
      }
      toast.success('Members Added', `Successfully added ${successCount} member(s) and synchronized IAM scopes.`);
      setShowAddMember(false);
      setSelectedUsers([]);
      setUserSearchQuery('');
      setUserSearchResults([]);
      loadMembers();
    } catch (err) {
      toast.error('Add Members Failed', err.message);
    } finally {
      setSavingMembers(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!confirm(`Remove ${member.name || member.email} from ${member.committeeName || 'the committee'}?`)) return;
    try {
      await api.removeCommitteeMembership(member.committeeId, member.externalUserId);
      toast.success('Removed', `${member.name || 'Member'} has been removed and permissions revoked.`);
      loadMembers();
    } catch (err) {
      toast.error('Remove Failed', err.message);
    }
  };

  const handleChangeRole = async (member, newRole) => {
    try {
      await api.upsertCommitteeMembership({
        committeeId: member.committeeId,
        externalUserId: member.externalUserId,
        email: member.email,
        roleInCommittee: newRole,
      });
      toast.success('Role Updated', `${member.name} is now ${newRole}.`);
      loadMembers();
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  // ── Export Members CSV ────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!filteredMembers.length) {
      toast.error('No Data', 'No member records to export.');
      return;
    }
    const headers = ['Name', 'Email', 'Committee', 'Role', 'Joined Date'];
    const rows = filteredMembers.map((m) => [
      `"${(m.name || 'Member').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.committeeName || '').replace(/"/g, '""')}"`,
      `"${(m.roleInCommittee || 'member').toUpperCase()}"`,
      `"${formatDate(m.createdAt)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ieee_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Complete', 'Downloaded member roster CSV.');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCommitteeName = (id) => committees.find((c) => c.id === id)?.name || 'General';

  const getCampaignCommitteesLabel = (camp) => {
    if (camp.committees && camp.committees.length > 0) {
      return camp.committees.map((c) => c.name).join(', ');
    }
    return getCommitteeName(camp.committeeId);
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    if (campaignStatusFilter && camp.status !== campaignStatusFilter) return false;
    if (campaignCommitteeFilter) {
      const matchInList = camp.committees?.some((c) => c.id === campaignCommitteeFilter);
      if (!matchInList && camp.committeeId !== campaignCommitteeFilter) return false;
    }
    return true;
  });

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
  for (const stage of BASE_PIPELINE_STAGES) {
    appsByStage[stage.key] = filteredApplications.filter((a) => a.currentStage === stage.key);
  }

  const filteredRejectedApplications = rejectedApplications.filter((a) => {
    if (rejectedSearch) {
      const q = rejectedSearch.toLowerCase();
      const name = (a.answers?.fullName || a.applicantEmail || '').toLowerCase();
      const email = (a.applicantEmail || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }
    return true;
  });

  const hasActiveColumnFilters =
    selectedCommitteeFilters.length > 0 ||
    selectedRoleFilters.length > 0 ||
    Boolean(joinedDateFrom) ||
    Boolean(joinedDateTo);

  const resetAllColumnFilters = () => {
    setSelectedCommitteeFilters([]);
    setSelectedRoleFilters([]);
    setJoinedDateFrom('');
    setJoinedDateTo('');
    setOpenColumnFilter(null);
  };

  const filteredMembers = allMembers.filter((m) => {
    if (memberSearch.trim()) {
      const q = memberSearch.trim().toLowerCase();
      const match =
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.roleInCommittee && m.roleInCommittee.toLowerCase().includes(q)) ||
        (m.committeeName && m.committeeName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedCommitteeFilters.length > 0 && !selectedCommitteeFilters.includes(m.committeeId)) {
      return false;
    }
    if (selectedRoleFilters.length > 0) {
      const r = (m.roleInCommittee || 'member').toLowerCase();
      if (!selectedRoleFilters.includes(r)) return false;
    }
    if (joinedDateFrom) {
      const created = new Date(m.createdAt);
      const fromDate = new Date(joinedDateFrom);
      if (created < fromDate) return false;
    }
    if (joinedDateTo) {
      const created = new Date(m.createdAt);
      const toDate = new Date(`${joinedDateTo}T23:59:59.999Z`);
      if (created > toDate) return false;
    }
    return true;
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
        <button type="button" className={`hr-tab ${activeTab === 'members' ? 'hr-tab--active' : ''}`} onClick={() => setActiveTab('members')}>
          <Shield size={16} /> Member Management
          <span className="hr-tab__badge">{allMembers.length}</span>
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
            <select className="form-input" style={{ width: 'auto', minWidth: 150 }} value={campaignStatusFilter} onChange={(e) => setCampaignStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
            <select className="form-input" style={{ width: 'auto', minWidth: 180 }} value={campaignCommitteeFilter} onChange={(e) => setCampaignCommitteeFilter(e.target.value)}>
              <option value="">All Committees</option>
              {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" className="btn btn-secondary" onClick={loadCampaigns} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingCampaigns ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span>Loading campaigns...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <ClipboardList size={20} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span>No campaigns matching the selected filters.</span>
            </div>
          ) : (
            <div className="hr-campaign-grid">
              {filteredCampaigns.map((camp) => (
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
      {/* TAB 2: Candidate Pipeline Kanban                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipeline' && (
        <>
          <div className="hr-toolbar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, flexWrap: 'wrap' }}>
              <div className="hr-search-wrap">
                <Search size={15} />
                <input className="hr-search-input" placeholder="Search candidates by name or email..." value={pipelineSearch} onChange={(e) => setPipelineSearch(e.target.value)} />
              </div>
              <select className="form-input" style={{ width: 'auto', minWidth: 180 }} value={pipelineFilter} onChange={(e) => setPipelineFilter(e.target.value)}>
                <option value="">All Committees</option>
                {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenRejectedModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <UserX size={15} style={{ color: 'var(--color-danger, #ef4444)' }} />
                <span>Rejected Applications</span>
              </button>
            </div>
            <button type="button" className="btn btn-secondary" onClick={loadApplications} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingApplications ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span>Loading applications...</span>
            </div>
          ) : (
            <div className="hr-pipeline">
              {BASE_PIPELINE_STAGES.map((stage) => (
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

          {/* Dedicated Rejected Applications Modal */}
          {showRejectedModal && (
            <div className="modal-overlay" onClick={() => setShowRejectedModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
                <div className="modal-header">
                  <h3><UserX size={18} style={{ color: 'var(--color-danger, #ef4444)' }} /> Rejected Applications</h3>
                  <button type="button" className="modal-close" onClick={() => setShowRejectedModal(false)}><X size={18} /></button>
                </div>
                <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <div className="hr-search-wrap" style={{ marginBottom: '1rem' }}>
                    <Search size={15} />
                    <input
                      className="hr-search-input"
                      placeholder="Search rejected candidates by name or email..."
                      value={rejectedSearch}
                      onChange={(e) => setRejectedSearch(e.target.value)}
                    />
                  </div>

                  {loadingRejected ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Loading rejected archive...</span>
                    </div>
                  ) : filteredRejectedApplications.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <UserX size={20} style={{ opacity: 0.6 }} />
                      <span>No rejected applications found.</span>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table className="hr-roster" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '0.65rem 0.85rem' }}>CANDIDATE</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>COMMITTEE</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>DATE</th>
                            <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRejectedApplications.map((app) => (
                            <tr key={app.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                              <td style={{ padding: '0.65rem 0.85rem' }}>
                                <div style={{ fontWeight: 600 }}>{app.answers?.fullName || 'Unknown'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{app.applicantEmail}</div>
                              </td>
                              <td style={{ padding: '0.65rem 0.85rem' }}>
                                <span className="badge badge-primary">{getCommitteeName(app.committeeId)}</span>
                              </td>
                              <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                {formatDate(app.submittedAt)}
                              </td>
                              <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                    onClick={() => handleOpenCandidate(app)}
                                  >
                                    <Eye size={12} /> Details
                                  </button>
                                  {app.answers?.cvUrl && (
                                    <a
                                      href={app.answers.cvUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                      <Download size={12} /> CV
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRejectedModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Member Management (Direct Add / Remove / Role Change)       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'members' && (
        <>
          <div className="hr-toolbar">
            <div className="hr-search-wrap">
              <Search size={15} />
              <input className="hr-search-input" placeholder="Search members by name, email, or role..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
            </div>
            {hasActiveColumnFilters && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={resetAllColumnFilters}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <X size={14} /> Clear Filters
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setShowAddMember(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserPlus size={16} /> Add Member
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileSpreadsheet size={16} /> Export
            </button>
            <button type="button" className="btn btn-secondary" onClick={loadMembers} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingMembers ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span>Loading members...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Users size={20} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span>No members found matching the search or filter criteria.</span>
            </div>
          ) : (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'visible' }}>
              <table className="hr-roster" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>MEMBER</th>
                    <th style={{ padding: '0.75rem 1rem' }}>EMAIL</th>
                    
                    {/* COMMITTEE COLUMN WITH FILTER */}
                    <th style={{ padding: '0.75rem 1rem', position: 'relative' }}>
                      <div
                        className="hr-col-header-filter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColumnFilter(openColumnFilter === 'committee' ? null : 'committee');
                        }}
                      >
                        <span>COMMITTEE</span>
                        <button
                          type="button"
                          className={`hr-col-filter-btn ${selectedCommitteeFilters.length > 0 ? 'hr-col-filter-btn--active' : ''}`}
                          aria-label="Filter committees"
                        >
                          <Filter size={13} />
                          {selectedCommitteeFilters.length > 0 && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>({selectedCommitteeFilters.length})</span>
                          )}
                        </button>
                      </div>

                      {openColumnFilter === 'committee' && (
                        <div className="hr-col-filter-popover" onClick={(e) => e.stopPropagation()}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                            Filter by Committee
                          </div>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Search committees..."
                            value={committeeFilterSearch}
                            onChange={(e) => setCommitteeFilterSearch(e.target.value)}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', marginBottom: '0.4rem' }}
                          />
                          <div className="hr-col-filter-list">
                            {committees
                              .filter((c) => !committeeFilterSearch || c.name.toLowerCase().includes(committeeFilterSearch.toLowerCase()))
                              .map((c) => {
                                const isChecked = selectedCommitteeFilters.includes(c.id);
                                return (
                                  <label key={c.id} className="hr-col-filter-item">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setSelectedCommitteeFilters((prev) =>
                                          isChecked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                        );
                                      }}
                                    />
                                    <span>{c.name}</span>
                                  </label>
                                );
                              })}
                          </div>
                          <div className="hr-col-filter-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => setSelectedCommitteeFilters([])}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => setOpenColumnFilter(null)}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* ROLE COLUMN WITH FILTER */}
                    <th style={{ padding: '0.75rem 1rem', position: 'relative' }}>
                      <div
                        className="hr-col-header-filter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColumnFilter(openColumnFilter === 'role' ? null : 'role');
                        }}
                      >
                        <span>ROLE</span>
                        <button
                          type="button"
                          className={`hr-col-filter-btn ${selectedRoleFilters.length > 0 ? 'hr-col-filter-btn--active' : ''}`}
                          aria-label="Filter roles"
                        >
                          <Filter size={13} />
                          {selectedRoleFilters.length > 0 && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>({selectedRoleFilters.length})</span>
                          )}
                        </button>
                      </div>

                      {openColumnFilter === 'role' && (
                        <div className="hr-col-filter-popover" onClick={(e) => e.stopPropagation()}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                            Filter by Role
                          </div>
                          <div className="hr-col-filter-list">
                            {[
                              { key: 'lead', label: 'Lead' },
                              { key: 'member', label: 'Member' },
                              { key: 'hr', label: 'HR' },
                            ].map((r) => {
                              const isChecked = selectedRoleFilters.includes(r.key);
                              return (
                                <label key={r.key} className="hr-col-filter-item">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedRoleFilters((prev) =>
                                        isChecked ? prev.filter((k) => k !== r.key) : [...prev, r.key]
                                      );
                                    }}
                                  />
                                  <span>{r.label}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="hr-col-filter-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => setSelectedRoleFilters([])}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => setOpenColumnFilter(null)}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* JOINED COLUMN WITH FILTER */}
                    <th style={{ padding: '0.75rem 1rem', position: 'relative' }}>
                      <div
                        className="hr-col-header-filter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColumnFilter(openColumnFilter === 'joined' ? null : 'joined');
                        }}
                      >
                        <span>JOINED</span>
                        <button
                          type="button"
                          className={`hr-col-filter-btn ${joinedDateFrom || joinedDateTo ? 'hr-col-filter-btn--active' : ''}`}
                          aria-label="Filter joined date"
                        >
                          <Filter size={13} />
                          {(joinedDateFrom || joinedDateTo) && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>•</span>
                          )}
                        </button>
                      </div>

                      {openColumnFilter === 'joined' && (
                        <div className="hr-col-filter-popover hr-col-filter-popover--right" onClick={(e) => e.stopPropagation()}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                            Filter Joined Date
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>From:</label>
                              <input
                                type="date"
                                className="form-input"
                                value={joinedDateFrom}
                                onChange={(e) => setJoinedDateFrom(e.target.value)}
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>To:</label>
                              <input
                                type="date"
                                className="form-input"
                                value={joinedDateTo}
                                onChange={(e) => setJoinedDateTo(e.target.value)}
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                              />
                            </div>
                          </div>
                          <div className="hr-col-filter-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                setJoinedDateFrom('');
                                setJoinedDateTo('');
                              }}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => setOpenColumnFilter(null)}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={`${m.committeeId}-${m.externalUserId || m.id}`} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{m.name || 'Member'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{m.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge badge-committee">{m.committeeName || getCommitteeName(m.committeeId)}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${m.roleInCommittee === 'lead' ? 'badge-warning' : m.roleInCommittee === 'hr' ? 'badge-hr' : 'badge-outline'}`}>
                          {m.roleInCommittee === 'hr' ? 'HR' : m.roleInCommittee === 'lead' ? 'Lead' : 'Member'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{formatDate(m.createdAt)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', position: 'relative' }}>
                        <div className="hr-action-menu-wrap">
                          <button
                            type="button"
                            className="hr-action-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const key = `${m.committeeId}-${m.externalUserId || m.id}`;
                              setOpenActionMenuKey(openActionMenuKey === key ? null : key);
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openActionMenuKey === `${m.committeeId}-${m.externalUserId || m.id}` && (
                            <div className="hr-action-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                              {/* Set as Member */}
                              {m.roleInCommittee !== 'member' && (
                                <div
                                  className="hr-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuKey(null);
                                    handleChangeRole(m, 'member');
                                  }}
                                >
                                  Set as member
                                </div>
                              )}

                              {/* Set as HR */}
                              {m.roleInCommittee !== 'hr' && (
                                <div
                                  className="hr-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuKey(null);
                                    handleChangeRole(m, 'hr');
                                  }}
                                >
                                  Set as HR
                                </div>
                              )}

                              {/* Set as Lead (Admins & Officers only) */}
                              {isGlobalAdminOrOfficer && m.roleInCommittee !== 'lead' && (
                                <div
                                  className="hr-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuKey(null);
                                    handleChangeRole(m, 'lead');
                                  }}
                                >
                                  Set as Lead
                                </div>
                              )}

                              {/* Divider */}
                              {(m.roleInCommittee !== 'lead' || isGlobalAdminOrOfficer) && (
                                <div className="hr-action-menu-divider" />
                              )}

                              {/* Remove Member */}
                              {(m.roleInCommittee !== 'lead' || isGlobalAdminOrOfficer) && (
                                <div
                                  className="hr-action-menu-item hr-action-menu-item--danger"
                                  onClick={() => {
                                    setOpenActionMenuKey(null);
                                    handleRemoveMember(m);
                                  }}
                                >
                                  Remove member
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Member Modal with User Search Autocomplete */}
          {showAddMember && (
            <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                  <h3><UserPlus size={18} /> Add Members to Committee</h3>
                  <button type="button" className="modal-close" onClick={() => setShowAddMember(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleBatchAddMembers}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Search Registered Portal Users *</label>
                      <div className="hr-search-wrap">
                        <Search size={15} />
                        <input
                          className="hr-search-input"
                          placeholder="Type name or email to search..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Search Results / Selected Users List */}
                      {searchingUsers && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: 4 }} /> Searching users...
                        </div>
                      )}

                      {userSearchResults.length > 0 && (
                        <div className="user-picker-list">
                          {userSearchResults.map((u) => {
                            const isSelected = selectedUsers.some((item) => item.id === u.id);
                            return (
                              <div
                                key={u.id}
                                className={`user-picker-item ${isSelected ? 'user-picker-item--selected' : ''}`}
                                onClick={() => toggleUserSelection(u)}
                              >
                                {isSelected ? <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} /> : <Square size={16} style={{ color: 'var(--color-text-subtle)' }} />}
                                <div>
                                  <div className="user-picker-item__name">{u.name}</div>
                                  <div className="user-picker-item__email">{u.email}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedUsers.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                            Selected Users ({selectedUsers.length}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {selectedUsers.map((u) => (
                              <span
                                key={u.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: 'var(--radius-md)',
                                  background: 'var(--color-primary-light)',
                                  color: 'var(--color-primary)',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                {u.name} ({u.email})
                                <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleUserSelection(u)} />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Assign To Committee *</label>
                      <select className="form-input" value={targetCommitteeId} onChange={(e) => setTargetCommitteeId(e.target.value)} required>
                        {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role in Committee</label>
                      <select className="form-input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                        <option value="member">Member</option>
                        <option value="hr">HR</option>
                        {isGlobalAdminOrOfficer && <option value="lead">Lead</option>}
                      </select>
                      {!isGlobalAdminOrOfficer && targetRole !== 'lead' && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          Note: Committee Lead role assignment is reserved for Officers.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingMembers || selectedUsers.length === 0}>
                      {savingMembers ? 'Adding...' : `Add ${selectedUsers.length} Member(s)`}
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
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} style={{ flexShrink: 0 }} />
            <span>Recruitment & Onboarding KPIs</span>
          </h3>

          {pipelineSummary ? (
            <div className="hr-campaign-grid hr-onboarding-kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
              <div className="hr-campaign-card">
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Applications</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                  {pipelineSummary.totals?.applications ?? pipelineSummary.totalApplications ?? 0}
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
                  {(pipelineSummary.stages?.applied || 0) +
                    (pipelineSummary.stages?.screening || 0) +
                    (pipelineSummary.stages?.interview || 0) +
                    (pipelineSummary.stages?.finalReview ?? pipelineSummary.stages?.final_review ?? 0)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-8)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span>Loading summary metrics...</span>
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

      {/* Candidate Detail Modal (Floats globally on top of any active list/modal) */}
      {selectedCandidate && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setSelectedCandidate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, margin: 'auto', zIndex: 1201 }}>
            <div className="modal-header">
              <h3><Eye size={18} /> Candidate Details</h3>
              <button type="button" className="modal-close" onClick={() => setSelectedCandidate(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selectedCandidate.answers?.fullName || 'Unknown'}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{selectedCandidate.applicantEmail}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className={`hr-status-badge hr-status-badge--${selectedCandidate.currentStage === 'final_review' || selectedCandidate.currentStage === 'accepted' ? 'open' : 'draft'}`}>
                    {selectedCandidate.currentStage?.replace('_', ' ')}
                  </span>
                  <span className="hr-candidate-card__committee">{getCommitteeName(selectedCandidate.committeeId)}</span>
                </div>
              </div>

              {/* CV / Resume Download Button */}
              {selectedCandidate.answers?.cvUrl && (
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedCandidate.answers.cvFileName || 'Applicant_CV.pdf'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Curriculum Vitae / Resume</div>
                    </div>
                  </div>
                  <a
                    href={selectedCandidate.answers.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <ExternalLink size={13} /> View / Download
                  </a>
                </div>
              )}

              {/* Application Answers */}
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Application Form Responses</h5>
                {Object.entries(selectedCandidate.answers || {}).map(([key, val]) => (
                  val && key !== 'cvUrl' && key !== 'cvFileName' && (
                    <div key={key} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: 120, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span style={{ fontWeight: 500 }}>{String(val)}</span>
                    </div>
                  )
                ))}
              </div>

              {/* Notes & Score */}
              <div className="form-group">
                <label className="form-label">Review Notes</label>
                <textarea className="form-input" rows={3} value={candidateNotes} onChange={(e) => handleNotesChange(e.target.value)} placeholder="Type interview observations or candidate evaluation..." />
              </div>
              {selectedCandidate.currentStage !== 'final_review' && selectedCandidate.currentStage !== 'accepted' && (
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
              {selectedCandidate.currentStage !== 'rejected' && selectedCandidate.currentStage !== 'accepted' && (
                <button type="button" className="btn" disabled={processingAction} onClick={() => handleReject(selectedCandidate)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--color-destructive)', color: '#fff', border: 'none' }}>
                  <ThumbsDown size={14} /> Reject
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedCandidate(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
