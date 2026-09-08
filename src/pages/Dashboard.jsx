import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Layers,
  ArrowRight,
  ChevronRight,
  Calendar,
  Building,
  Bell,
  Activity,
  AlertCircle,
  Play,
  RotateCcw,
  Megaphone,
  Pin,
  FileText,
  Upload,
  Send,
  Download,
  ExternalLink,
  Award,
  FileCheck,
  Eye,
  FolderDown,
  X,
  ListChecks,
  Users,
  Camera,
  Sparkles,
  Search,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';
import { api } from '../services/api';
import '../styles/dashboard.css';
import '../styles/workspace.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const toast = useToastStore();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskPage, setTaskPage] = useState(1);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [switchingScopeId, setSwitchingScopeId] = useState(null);

  // Delivery Modal State (Member delivering solution)
  const [deliveryModalAssignment, setDeliveryModalAssignment] = useState(null);
  const [deliveryFile, setDeliveryFile] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Review Submissions Modal State (Lead reviewing submissions from dashboard)
  const [viewingSubmissionsAssignment, setViewingSubmissionsAssignment] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Announcement View Modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // All Announcements Modal State (Archive with Search & Category Filters)
  const [isAllAnnouncementsModalOpen, setIsAllAnnouncementsModalOpen] = useState(false);
  const [announcementsSearch, setAnnouncementsSearch] = useState('');
  const [announcementsCategoryFilter, setAnnouncementsCategoryFilter] = useState('all');
  const [announcementsPage, setAnnouncementsPage] = useState(1);

  // All Activity Modal State (Archive with Search & Scope Filters)
  const [isAllActivityModalOpen, setIsAllActivityModalOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityScopeFilter, setActivityScopeFilter] = useState('all');
  const [activityPage, setActivityPage] = useState(1);

  // ── Modal Backdrop Dismiss Hooks ─────────────────────────────────────────
  const deliveryModalBackdrop = useBackdropDismiss(() => setDeliveryModalAssignment(null), {
    isOpen: !!deliveryModalAssignment,
  });
  const submissionsModalBackdrop = useBackdropDismiss(() => setViewingSubmissionsAssignment(null), {
    isOpen: !!viewingSubmissionsAssignment,
  });
  const announcementModalBackdrop = useBackdropDismiss(() => setSelectedAnnouncement(null), {
    isOpen: !!selectedAnnouncement,
  });
  const allAnnouncementsModalBackdrop = useBackdropDismiss(() => setIsAllAnnouncementsModalOpen(false), {
    isOpen: isAllAnnouncementsModalOpen,
  });
  const allActivityModalBackdrop = useBackdropDismiss(() => setIsAllActivityModalOpen(false), {
    isOpen: isAllActivityModalOpen,
  });

  // Workspace Hub Category Tab Filter ('all' | 'committees' | 'studios')
  const [workspaceCategoryTab, setWorkspaceCategoryTab] = useState('all');

  // Assigned Scanner Events
  const [assignedScannerEvents, setAssignedScannerEvents] = useState([]);

  // Onboarding Items State
  const [onboardingItems, setOnboardingItems] = useState([]);
  const [updatingOnboardingId, setUpdatingOnboardingId] = useState(null);
  const [dismissedOnboarding, setDismissedOnboarding] = useState(() => {
    return localStorage.getItem('dismiss_onboarding_completed') === 'true';
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [data, onboardingRes, eventsRes] = await Promise.all([
        api.getMyDashboard(),
        api.getHROnboarding('me').catch(() => ({ onboarding: { items: [] } })),
        api.getEvents({ status: 'active' }).catch(() => []),
      ]);
      setDashboardData(data);
      setOnboardingItems(onboardingRes?.onboarding?.items || []);

      const eventList = Array.isArray(eventsRes) ? eventsRes : (eventsRes?.events || []);
      const currentUserId = String(user?.id || user?._id || '');
      const userAssigned = eventList.filter(
        (e) =>
          Array.isArray(e.scannerUserIds) &&
          e.scannerUserIds.some((id) => String(typeof id === 'object' ? id.id || id._id : id) === currentUserId)
      );
      setAssignedScannerEvents(userAssigned);
      if (userAssigned.length > 0 && !user?.isAssignedScanner) {
        useAuthStore.getState().updateUser({ isAssignedScanner: true });
      } else if (userAssigned.length === 0 && user?.isAssignedScanner) {
        useAuthStore.getState().updateUser({ isAssignedScanner: false });
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      toast.error('Dashboard Error', err.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleOnboarding = async (item) => {
    const nextStatus = item.status === 'done' ? 'todo' : 'done';
    setUpdatingOnboardingId(item.id);
    try {
      await api.updateOnboardingItem(item.id, nextStatus);
      setOnboardingItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
      );
      toast.success(
        'Onboarding Updated',
        nextStatus === 'done' ? 'Step marked as completed!' : 'Step marked as to-do.'
      );
    } catch (err) {
      toast.error('Update Failed', err.message || 'Failed to update onboarding step.');
    } finally {
      setUpdatingOnboardingId(null);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await api.updateTaskStatus({ taskId, status: newStatus });
      setDashboardData((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
        const updatedTasks = currentTasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        );
        const todo = updatedTasks.filter((t) => t.status === 'todo').length;
        const inProgress = updatedTasks.filter((t) => t.status === 'in_progress').length;
        const done = updatedTasks.filter((t) => t.status === 'done').length;
        return {
          ...prev,
          tasks: updatedTasks,
          taskStats: { total: updatedTasks.length, todo, inProgress, done },
        };
      });
      toast.success('Task Updated', `Task moved to ${newStatus.replace('_', ' ')}.`);
    } catch (err) {
      toast.error('Update Failed', err.message || 'Failed to update task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSwitchAndOpen = async (committee) => {
    const matchingScope = user?.availableScopes?.find(
      (s) => s.committeeId === committee.id || s.scopeId === committee.id
    );

    if (matchingScope) {
      const targetScopeId = matchingScope.id || matchingScope.scopeId;
      if (user?.scopeId === targetScopeId) {
        navigate('/workspace');
        return;
      }

      setSwitchingScopeId(committee.id);
      try {
        const res = await api.switchContext({ targetScopeId });
        if (res?.user) updateUser(res.user);
        navigate('/workspace');
      } catch (err) {
        navigate(`/workspace?committee=${committee.id}`);
      } finally {
        setSwitchingScopeId(null);
      }
      return;
    }

    navigate(`/workspace?committee=${committee.id}`);
  };

  const handleOpenStudio = async (studioWorkspace) => {
    const slug = studioWorkspace.slug;
    const available = user?.availableScopes || [];

    // Check if the user's active role & scope already grant access:
    const isAuthorized = () => {
      const isGlobalAdminOrOff = user?.scopeType === 'global' && ['admin', 'officer'].includes(user?.role);
      if (isGlobalAdminOrOff) return true;

      if (slug === 'hr') {
        return user?.role === 'lead' && user?.committeeSlug === 'hr';
      }
      if (slug === 'pr') {
        return (user?.role === 'lead' && user?.committeeSlug === 'pr') || user?.role === 'publisher';
      }
      if (slug === 'media') {
        return user?.role === 'lead' && user?.committeeSlug === 'media';
      }
      if (slug === 'oc') {
        return (
          (user?.role === 'lead' && user?.committeeSlug === 'oc') ||
          ['event_organizer', 'event_scanner', 'scanner'].includes(user?.role) ||
          Boolean(user?.isAssignedScanner)
        );
      }
      return false;
    };

    // 1. If currently authorized, proceed directly
    if (isAuthorized()) {
      navigate(studioWorkspace.path);
      return;
    }

    // 2. Otherwise find the best matching authorized scope to switch to
    let bestScope = null;
    if (slug === 'hr') {
      bestScope = available.find((s) => s.role === 'lead' && s.committeeSlug === 'hr');
    } else if (slug === 'pr') {
      bestScope = available.find(
        (s) => (s.role === 'lead' && s.committeeSlug === 'pr') || s.role === 'publisher'
      );
    } else if (slug === 'media') {
      bestScope = available.find((s) => s.role === 'lead' && s.committeeSlug === 'media');
    } else if (slug === 'oc') {
      bestScope = available.find(
        (s) =>
          (s.role === 'lead' && s.committeeSlug === 'oc') ||
          ['event_organizer', 'event_scanner', 'scanner'].includes(s.role)
      );
    }

    // Fallback to Admin or Officer scope if held
    if (!bestScope) {
      bestScope = available.find((s) => ['admin', 'officer'].includes(s.role));
    }

    if (bestScope) {
      const targetScopeId = bestScope.id || bestScope.scopeId;
      if (targetScopeId && targetScopeId !== user?.scopeId) {
        setSwitchingScopeId(studioWorkspace.id);
        try {
          const res = await api.switchContext({ targetScopeId });
          if (res?.user) {
            updateUser(res.user);
          }
        } catch (err) {
          console.error('Failed to auto-switch scope for studio:', err);
        } finally {
          setSwitchingScopeId(null);
        }
      }
    }

    navigate(studioWorkspace.path);
  };

  // Submit Assignment Delivery
  const handleSubmitDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryModalAssignment) return;

    if (!deliveryFile) {
      toast.error('File Required', 'Please choose a solution file to upload.');
      return;
    }
    if (deliveryFile.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum solution file size is 10MB.');
      return;
    }

    setSubmittingDelivery(true);
    try {
      const uploadRes = await api.uploadDirectToCloudinary({
        file: deliveryFile,
        folder: 'resources',
        purpose: 'assignment_delivery',
      });

      await api.submitAssignment({
        committeeId: deliveryModalAssignment.committeeId,
        assignmentId: deliveryModalAssignment.id,
        fileUrl: uploadRes.secureUrl,
        fileName: deliveryFile.name,
        notes: deliveryNotes.trim() || null,
      });

      toast.success('Delivery Submitted', 'Your assignment has been submitted for review.');
      setDeliveryModalAssignment(null);
      setDeliveryFile(null);
      setDeliveryNotes('');
      fetchDashboard();
    } catch (err) {
      toast.error('Submission Failed', err.message || 'Failed to deliver assignment.');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // Open Submissions (for Lead)
  const handleOpenSubmissions = async (assignment) => {
    setViewingSubmissionsAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const data = await api.getAssignmentSubmissions(assignment.committeeId, assignment.id);
      setSubmissionsList(data.submissions || []);
    } catch (err) {
      toast.error('Submissions Error', err.message || 'Could not load submissions.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Grade Submission (for Lead)
  const handleGradeSubmission = async (submissionId) => {
    if (gradeInput === '' || Number.isNaN(Number(gradeInput))) {
      toast.error('Grade Required', 'Please enter a valid numeric grade.');
      return;
    }
    const numGrade = Number(gradeInput);
    if (numGrade < 0) {
      toast.error('Invalid Grade', 'Grade cannot be negative.');
      return;
    }
    const maxPoints = viewingSubmissionsAssignment?.maxPoints || 100;
    if (numGrade > maxPoints) {
      toast.error('Invalid Grade', `Grade cannot exceed maximum points (${maxPoints}).`);
      return;
    }

    setSavingGrade(true);
    try {
      await api.gradeAssignmentSubmission({
        committeeId: viewingSubmissionsAssignment.committeeId,
        assignmentId: viewingSubmissionsAssignment.id,
        submissionId,
        grade: numGrade,
        feedback: feedbackInput.trim() || null,
        status: 'graded',
      });

      toast.success('Grade Recorded', 'Member grade and feedback saved.');
      setGradingSubmissionId(null);
      setGradeInput('');
      setFeedbackInput('');
      handleOpenSubmissions(viewingSubmissionsAssignment);
    } catch (err) {
      toast.error('Grading Failed', err.message || 'Could not record grade.');
    } finally {
      setSavingGrade(false);
    }
  };

  const rawTasks = dashboardData?.tasks;
  const tasks = Array.isArray(rawTasks) ? rawTasks : (rawTasks?.items || []);
  const committees = dashboardData?.committees || [];
  const recentAnnouncements = dashboardData?.recentAnnouncements || [];
  const committeeAnnouncements = dashboardData?.committeeAnnouncements || [];
  const pendingAssignments = dashboardData?.pendingAssignments || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const taskStats = dashboardData?.taskStats || { total: 0, todo: 0, inProgress: 0, done: 0 };

  // Calculate accessible workspaces (Committees from scopes + DB committees + Specialized Studios)
  const isGlobalAdmin =
    user?.role === 'admin' ||
    user?.availableScopes?.some((s) => s.role === 'admin');

  const isOfficer =
    user?.role === 'officer' ||
    user?.availableScopes?.some((s) => s.role === 'officer');

  const isHRLead = user?.availableScopes?.some(
    (s) => (s.committeeSlug === 'hr' || s.committeeName?.toLowerCase().includes('human resource')) && s.role === 'lead'
  );

  const isGlobalAdminOrOfficer = isGlobalAdmin || isOfficer;

  const hrScope = user?.availableScopes?.find(
    (s) =>
      (s.committeeSlug === 'hr' || s.committeeName?.toLowerCase().includes('human resource')) &&
      s.role === 'lead'
  );
  const prScope = user?.availableScopes?.find(
    (s) =>
      (s.committeeSlug === 'pr' || s.committeeName?.toLowerCase().includes('public relation')) &&
      s.role === 'lead'
  );
  const mediaScope = user?.availableScopes?.find(
    (s) =>
      (s.committeeSlug === 'media' || s.committeeName?.toLowerCase().includes('media')) &&
      s.role === 'lead'
  );
  const ocScope = user?.availableScopes?.find(
    (s) =>
      (s.committeeSlug === 'oc' || s.committeeName?.toLowerCase().includes('operation')) &&
      s.role === 'lead'
  );

  const workspaceMap = new Map();

  // 1. Direct committee scopes from user.availableScopes
  const committeeScopes = (user?.availableScopes || []).filter((s) => s.scopeType === 'committee');
  for (const s of committeeScopes) {
    const committeeId = s.committeeId || s.scopeId;
    if (committeeId) {
      workspaceMap.set(committeeId, {
        id: committeeId,
        name: s.committeeName || (s.committeeSlug ? s.committeeSlug.toUpperCase() : 'Committee'),
        slug: s.committeeSlug || 'committee',
        role: isGlobalAdmin ? 'FULL ACCESS' : (s.role || 'member').toUpperCase(),
        type: 'committee',
        category: 'COMMITTEE WORKSPACE',
        isCommittee: true,
        data: {
          id: committeeId,
          name: s.committeeName || s.committeeSlug,
          slug: s.committeeSlug,
          roleInCommittee: s.role,
        },
      });
    }
  }

  // 2. Database committees returned from getMyDashboard (HR observers, Officer/HR Lead follow-ups, Admin full-access)
  for (const c of committees) {
    const rawRole = (c.roleInCommittee || c.role_in_committee || 'member').toLowerCase();
    let displayRole = rawRole.toUpperCase();
    if (rawRole === 'hr') {
      displayRole = 'HR';
    } else if (rawRole === 'admin' || isGlobalAdmin) {
      displayRole = 'FULL ACCESS';
    }

    if (workspaceMap.has(c.id)) {
      const existing = workspaceMap.get(c.id);
      if (isGlobalAdmin) {
        existing.role = 'FULL ACCESS';
      }
    } else {
      workspaceMap.set(c.id, {
        id: c.id,
        name: c.name,
        slug: c.slug,
        role: displayRole,
        type: 'committee',
        category: 'COMMITTEE WORKSPACE',
        isCommittee: true,
        data: c,
      });
    }
  }

  const committeeWorkspaces = Array.from(workspaceMap.values());

  const specializedWorkspaces = [];

  if (isGlobalAdminOrOfficer) {
    specializedWorkspaces.push({
      id: 'workspace-officer-executive',
      name: 'Officer Executive Board',
      slug: 'executive',
      role: isGlobalAdmin ? 'ADMIN' : 'OFFICER',
      type: 'executive',
      category: 'EXECUTIVE',
      path: '/workspace',
      isCommittee: false,
    });
  }

  if (isGlobalAdminOrOfficer || hrScope) {
    specializedWorkspaces.push({
      id: 'workspace-hr-studio',
      name: 'HR & Talent Studio',
      slug: 'hr',
      role: isGlobalAdminOrOfficer ? 'OFFICER' : 'LEAD',
      type: 'studio',
      category: 'WORKSPACE',
      path: '/hr',
      isCommittee: false,
    });
  }

  if (isGlobalAdminOrOfficer || prScope) {
    specializedWorkspaces.push({
      id: 'workspace-pr-studio',
      name: 'PR Broadcasts Studio',
      slug: 'pr',
      role: isGlobalAdminOrOfficer ? 'OFFICER' : 'LEAD',
      type: 'studio',
      category: 'WORKSPACE',
      path: '/pr',
      isCommittee: false,
    });
  }

  if (isGlobalAdminOrOfficer || mediaScope) {
    specializedWorkspaces.push({
      id: 'workspace-media-hub',
      name: 'Media Operations',
      slug: 'media',
      role: isGlobalAdminOrOfficer ? 'OFFICER' : 'LEAD',
      type: 'studio',
      category: 'WORKSPACE',
      path: '/media',
      isCommittee: false,
    });
  }

  const hasAssignedScannerEvents = assignedScannerEvents.length > 0;

  if (isGlobalAdminOrOfficer || ocScope || hasAssignedScannerEvents) {
    const isScannerOnlyUser = hasAssignedScannerEvents && !isGlobalAdminOrOfficer && !ocScope;
    specializedWorkspaces.push({
      id: 'workspace-operations-studio',
      name: isScannerOnlyUser ? 'Operations (Scanner)' : 'Operations Studio',
      slug: 'oc',
      role: isGlobalAdminOrOfficer ? 'OFFICER' : ocScope ? 'LEAD' : 'SCANNER',
      type: 'studio',
      category: 'WORKSPACE',
      path: isScannerOnlyUser ? '/operations?tab=scanner' : '/operations',
      isCommittee: false,
    });
  }

  const allWorkspaces = [...committeeWorkspaces, ...specializedWorkspaces];

  // Determine which assignments to show on dashboard:
  // - If user is Lead, Admin, or HR in that committee: show active assignments with submissions review access
  // - If user is Member in that committee: only show if unsubmitted (!isSubmitted) with "Deliver Solution"
  const actionableAssignments = pendingAssignments.filter((assignment) => {
    const committeeInfo = committees.find((c) => c.id === assignment.committeeId);
    const roleInCommittee = committeeInfo?.roleInCommittee || committeeInfo?.role_in_committee;
    const isLeadOrAdmin =
      user?.role === 'admin' ||
      user?.role === 'officer' ||
      roleInCommittee === 'lead' ||
      roleInCommittee === 'admin';
    const isHrRole = roleInCommittee === 'hr';

    if (isLeadOrAdmin || isHrRole) return true;
    return !assignment.isSubmitted;
  });

  const unsubmittedAssignmentsCount = pendingAssignments.filter((a) => !a.isSubmitted).length;

  // Combine Global PR announcements and Committee Announcements
  const allAnnouncements = [
    ...committeeAnnouncements.map((ca) => ({
      id: ca.id,
      title: ca.title,
      body: ca.body,
      isPinned: ca.isPinned,
      authorName: ca.authorName,
      committeeName: ca.committeeName,
      committeeSlug: ca.committeeSlug,
      type: 'committee',
      createdAt: ca.createdAt,
    })),
    ...recentAnnouncements.map((ra) => ({
      id: ra.id,
      title: ra.title,
      body: ra.body,
      isPinned: ra.isPinned,
      authorName: ra.authorName,
      category: ra.category,
      type: 'global',
      createdAt: ra.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'all') return true;
    return t.status === taskFilter;
  });

  const TASKS_PER_PAGE = 6;
  const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const paginatedTasks = filteredTasks.slice(
    (taskPage - 1) * TASKS_PER_PAGE,
    taskPage * TASKS_PER_PAGE
  );

  // All Announcements Modal Filtering & Pagination
  const ANNOUNCEMENTS_MODAL_PER_PAGE = 6;
  const modalAnnouncements = allAnnouncements.filter((ann) => {
    if (announcementsCategoryFilter !== 'all' && ann.type !== announcementsCategoryFilter) {
      return false;
    }
    if (announcementsSearch.trim()) {
      const q = announcementsSearch.toLowerCase();
      const matchTitle = (ann.title || '').toLowerCase().includes(q);
      const matchBody = (ann.body || '').toLowerCase().includes(q);
      const matchAuthor = (ann.authorName || '').toLowerCase().includes(q);
      const matchComm = (ann.committeeName || '').toLowerCase().includes(q);
      return matchTitle || matchBody || matchAuthor || matchComm;
    }
    return true;
  });
  const totalAnnouncementsPages = Math.max(1, Math.ceil(modalAnnouncements.length / ANNOUNCEMENTS_MODAL_PER_PAGE));
  const paginatedModalAnnouncements = modalAnnouncements.slice(
    (announcementsPage - 1) * ANNOUNCEMENTS_MODAL_PER_PAGE,
    announcementsPage * ANNOUNCEMENTS_MODAL_PER_PAGE
  );

  // All Activity Modal Filtering & Pagination
  const ACTIVITY_MODAL_PER_PAGE = 8;
  const modalActivity = recentActivity.filter((act) => {
    if (activityScopeFilter !== 'all') {
      const actComm = (act.committeeSlug || act.committeeName || act.committee_name || '').toLowerCase();
      if (!actComm.includes(activityScopeFilter.toLowerCase())) {
        return false;
      }
    }
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      const matchActor = (act.actorName || '').toLowerCase().includes(q);
      const matchTitle = (act.title || '').toLowerCase().includes(q);
      const matchAction = (act.action || '').toLowerCase().includes(q);
      const matchComm = (act.committeeName || act.committee_name || '').toLowerCase().includes(q);
      const matchDetails = typeof act.details === 'string'
        ? act.details.toLowerCase().includes(q)
        : act.details
          ? JSON.stringify(act.details).toLowerCase().includes(q)
          : false;
      return matchActor || matchTitle || matchAction || matchComm || matchDetails;
    }
    return true;
  });
  const totalActivityPages = Math.max(1, Math.ceil(modalActivity.length / ACTIVITY_MODAL_PER_PAGE));
  const paginatedModalActivity = modalActivity.slice(
    (activityPage - 1) * ACTIVITY_MODAL_PER_PAGE,
    activityPage * ACTIVITY_MODAL_PER_PAGE
  );

  const getPriorityLabel = (dueAt) => {
    if (!dueAt) return 'Normal';
    const due = new Date(dueAt);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays <= 2) return 'Urgent';
    if (diffDays <= 5) return 'High';
    return 'Normal';
  };

  const getPriorityClass = (dueAt) => {
    const label = getPriorityLabel(dueAt);
    if (label === 'Overdue' || label === 'Urgent') return 'dashboard-task-item__priority-dot--urgent';
    if (label === 'High') return 'dashboard-task-item__priority-dot--high';
    return 'dashboard-task-item__priority-dot--medium';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatActivityDetails = (details) => {
    if (!details) return null;
    if (typeof details === 'string') return details;
    if (typeof details === 'object') {
      const parts = [];
      if (details.grade !== undefined) {
        parts.push(`Score: ${details.grade}${details.maxPoints ? `/${details.maxPoints}` : ''}`);
      } else if (details.maxPoints !== undefined) {
        parts.push(`Max Points: ${details.maxPoints}`);
      }
      if (details.feedback) parts.push(`Feedback: "${details.feedback}"`);
      if (details.notes) parts.push(details.notes);
      if (details.description) parts.push(details.description);
      if (parts.length > 0) return parts.join(' • ');

      const readable = Object.entries(details)
        .filter(([k, v]) => !k.toLowerCase().endsWith('id') && v !== null && v !== undefined && typeof v !== 'object')
        .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${v}`);
      if (readable.length > 0) return readable.join(' • ');
    }
    return null;
  };

  const getActivityIcon = (act) => {
    const type = (typeof act === 'string' ? act : (act?.activityType || act?.activity_type || act?.action || '')).toLowerCase();
    const title = (typeof act === 'object' ? (act?.title || '') : '').toLowerCase();

    if (type.includes('grade') || title.includes('grade') || title.includes('graded')) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <Award size={14} color="#10b981" />
        </div>
      );
    }
    if (type.includes('submit') || title.includes('submit') || title.includes('delivery')) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <Upload size={14} color="#3b82f6" />
        </div>
      );
    }
    if (type.includes('completed') || title.includes('completed')) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <CheckCircle2 size={14} color="#10b981" />
        </div>
      );
    }
    if (type.includes('assignment') || title.includes('assignment')) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <FileText size={14} color="#f59e0b" />
        </div>
      );
    }
    if (type.includes('announcement') || title.includes('announcement')) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139, 92, 246, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <Bell size={14} color="#8b5cf6" />
        </div>
      );
    }
    if (type.includes('resource') || title.includes('resource')) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14, 165, 233, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
          <FolderDown size={14} color="#0ea5e9" />
        </div>
      );
    }
    if (type.includes('task') || title.includes('task')) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <ListTodo size={14} color="#3b82f6" />
        </div>
      );
    }
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
        <Clock size={14} color="var(--color-text-muted)" />
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      {/* 1. HERO GREETING BANNER */}
      <section className="dashboard-hero">
        <div className="dashboard-hero__layout">
          <div>
            <div className="dashboard-hero__greeting">IEEE Menoufia Student Branch &bull; Member Portal</div>
            <h1 className="dashboard-hero__name">
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'Member'}! 👋
            </h1>
            <p className="dashboard-hero__subtitle" style={{ margin: '0.4rem 0 0', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9375rem' }}>
              Your central command center for tasks, assignments, and committee updates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/workspace" className="dashboard-hero__cta" id="btn-open-workspace">
              <Layers size={17} />
              <span>{isGlobalAdminOrOfficer ? 'Officer Workspace' : 'Committee Workspace'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. KPI METRICS GRID */}
      <section className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__icon-wrap dashboard-stat-card__icon-wrap--primary">
            <ListTodo size={20} />
          </div>
          <div className="dashboard-stat-card__content">
            <div className="dashboard-stat-card__value">{taskStats.total}</div>
            <div className="dashboard-stat-card__label">Total Tasks</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__icon-wrap dashboard-stat-card__icon-wrap--warning">
            <Clock size={20} />
          </div>
          <div className="dashboard-stat-card__content">
            <div className="dashboard-stat-card__value">{taskStats.inProgress}</div>
            <div className="dashboard-stat-card__label">In Progress</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__icon-wrap dashboard-stat-card__icon-wrap--success">
            <CheckCircle2 size={20} />
          </div>
          <div className="dashboard-stat-card__content">
            <div className="dashboard-stat-card__value">{taskStats.done}</div>
            <div className="dashboard-stat-card__label">Completed</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__icon-wrap dashboard-stat-card__icon-wrap--accent">
            <FileText size={20} />
          </div>
          <div className="dashboard-stat-card__content">
            <div className="dashboard-stat-card__value">{unsubmittedAssignmentsCount}</div>
            <div className="dashboard-stat-card__label">Pending Assignments</div>
          </div>
        </div>
      </section>

      {/* 3. BENTO LAYOUT (Main Tasks & Assignments + Sidebar Stream) */}
      <div className="dashboard-bento-grid">
        {/* LEFT / MAIN COLUMN */}
        <div className="dashboard-bento-main">
          {/* MY ASSIGNED TASKS WIDGET */}
          <div className="dashboard-card" id="my-tasks-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <ListTodo size={18} color="var(--color-primary)" />
                <h2 className="dashboard-card__title">My Assigned Tasks</h2>
              </div>

              {/* Status Filter Tabs */}
              <div className="dashboard-filter-tabs">
                <button
                  type="button"
                  className={`dashboard-filter-tab ${taskFilter === 'all' ? 'dashboard-filter-tab--active' : ''}`}
                  onClick={() => {
                    setTaskFilter('all');
                    setTaskPage(1);
                  }}
                >
                  All ({tasks.length})
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-tab ${taskFilter === 'todo' ? 'dashboard-filter-tab--active' : ''}`}
                  onClick={() => {
                    setTaskFilter('todo');
                    setTaskPage(1);
                  }}
                >
                  To Do ({taskStats.todo})
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-tab ${taskFilter === 'in_progress' ? 'dashboard-filter-tab--active' : ''}`}
                  onClick={() => {
                    setTaskFilter('in_progress');
                    setTaskPage(1);
                  }}
                >
                  In Progress ({taskStats.inProgress})
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-tab ${taskFilter === 'done' ? 'dashboard-filter-tab--active' : ''}`}
                  onClick={() => {
                    setTaskFilter('done');
                    setTaskPage(1);
                  }}
                >
                  Done ({taskStats.done})
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="dashboard-shimmer" style={{ height: '54px' }} />
                ))}
              </div>
            ) : filteredTasks.length > 0 ? (
              <>
                <div className="dashboard-task-list">
                  {paginatedTasks.map((task) => {
                    const isUpdating = updatingTaskId === task.id;
                    const dueDate = task.dueAt || task.due_at;
                    const committeeName = task.committeeName || task.committee_name || task.committeeSlug;
                    return (
                      <div key={task.id} className="dashboard-task-item">
                        <div className="dashboard-task-item__main">
                          <div className={`dashboard-task-item__priority-dot ${getPriorityClass(dueDate)}`} />
                          <div style={{ minWidth: 0 }}>
                            <div className="dashboard-task-item__title">{task.title}</div>
                            <div className="dashboard-task-item__meta">
                              {committeeName && (
                                <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                                  {committeeName}
                                </span>
                              )}
                              {dueDate && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <Calendar size={11} />
                                  {formatDate(dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 1-Click Action Transitions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {task.status === 'todo' && (
                            <button
                              type="button"
                              className="dashboard-task-item__status-btn dashboard-task-item__status-btn--todo"
                              disabled={isUpdating}
                              onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                            >
                              <Play size={12} />
                              <span>{isUpdating ? 'Starting…' : 'Start Task'}</span>
                            </button>
                          )}

                          {task.status === 'in_progress' && (
                            <button
                              type="button"
                              className="dashboard-task-item__status-btn dashboard-task-item__status-btn--in_progress"
                              disabled={isUpdating}
                              onClick={() => handleTaskStatusChange(task.id, 'done')}
                            >
                              <CheckCircle2 size={12} />
                              <span>{isUpdating ? 'Saving…' : 'Mark Done'}</span>
                            </button>
                          )}

                          {task.status === 'done' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className="dashboard-task-item__status-btn dashboard-task-item__status-btn--done">
                                <CheckCircle2 size={12} /> Completed
                              </span>
                              <button
                                type="button"
                                title="Reopen Task"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--color-text-muted)',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                }}
                                disabled={isUpdating}
                                onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                              >
                                <RotateCcw size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredTasks.length > TASKS_PER_PAGE && (
                  <div className="dashboard-pagination">
                    <span className="dashboard-pagination__info">
                      Showing {(taskPage - 1) * TASKS_PER_PAGE + 1}–{Math.min(taskPage * TASKS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length} tasks
                    </span>
                    <div className="dashboard-pagination__controls">
                      <button
                        type="button"
                        className="dashboard-pagination__btn"
                        disabled={taskPage === 1}
                        onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                        title="Previous page"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0 0.35rem' }}>
                        Page {taskPage} of {totalTaskPages}
                      </span>
                      <button
                        type="button"
                        className="dashboard-pagination__btn"
                        disabled={taskPage === totalTaskPages}
                        onClick={() => setTaskPage((p) => Math.min(totalTaskPages, p + 1))}
                        title="Next page"
                        aria-label="Next page"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="dashboard-empty">
                <CheckCircle2 size={32} color="var(--color-primary)" />
                <p>No tasks found in this section. Great job staying on top of work!</p>
              </div>
            )}
          </div>

          {/* COMMITTEE ASSIGNMENTS WIDGET */}
          <div className="dashboard-card" id="my-assignments-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <FileText size={18} color="var(--color-primary)" />
                <h2 className="dashboard-card__title">Committee Assignments</h2>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                {actionableAssignments.length} Pending
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[1, 2].map((n) => (
                  <div key={n} className="dashboard-shimmer" style={{ height: '70px' }} />
                ))}
              </div>
            ) : actionableAssignments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {actionableAssignments.map((assignment) => {
                  const committeeInfo = committees.find((c) => c.id === assignment.committeeId);
                  const roleInCommittee = committeeInfo?.roleInCommittee || committeeInfo?.role_in_committee;
                  const isLeadForThisCommittee =
                    user?.role === 'admin' ||
                    user?.role === 'officer' ||
                    roleInCommittee === 'lead' ||
                    roleInCommittee === 'admin';
                  const isHrForThisCommittee = roleInCommittee === 'hr';
                  const hasSubmissionsAccess = isLeadForThisCommittee || isHrForThisCommittee;

                  const isOverdue =
                    assignment.dueDate &&
                    (() => {
                      const due = new Date(assignment.dueDate);
                      if (due.getUTCHours() === 0 && due.getUTCMinutes() === 0 && due.getUTCSeconds() === 0) {
                        const endOfDay = new Date(due);
                        endOfDay.setUTCHours(23, 59, 59, 999);
                        return endOfDay < new Date();
                      }
                      return due < new Date();
                    })() &&
                    !assignment.isSubmitted;

                  return (
                    <div
                      key={assignment.id}
                      style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ minWidth: '220px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                            {assignment.committeeName || 'Committee'}
                          </span>
                          <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                            {assignment.maxPoints} Pts
                          </span>
                          {isOverdue && !hasSubmissionsAccess && (
                            <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                              Overdue
                            </span>
                          )}
                        </div>

                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                          {assignment.title}
                        </h4>

                        {assignment.description && (
                          <p
                            style={{
                              margin: '0.25rem 0 0',
                              fontSize: '0.8125rem',
                              color: 'var(--color-text-muted)',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {assignment.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {assignment.dueDate && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={12} />
                              Due: {formatDate(assignment.dueDate)}
                            </span>
                          )}
                          {assignment.attachmentUrl && (
                            <a
                              href={assignment.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                            >
                              <Download size={12} />
                              <span>{assignment.attachmentName || 'Download Materials'}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        {hasSubmissionsAccess ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenSubmissions(assignment)}
                          >
                            <Eye size={14} />
                            <span>{isHrForThisCommittee ? 'View Submissions' : 'Review Submissions'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setDeliveryModalAssignment(assignment)}
                          >
                            <Upload size={14} />
                            <span>Deliver Solution</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-empty">
                <FileCheck size={32} color="var(--color-primary)" />
                <p>No pending assignments right now. All caught up!</p>
              </div>
            )}
          </div>

          {/* MY WORKSPACES GRID */}
          <div className="dashboard-card" id="my-workspaces-card">
            <div className="dashboard-card__header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="dashboard-card__title-wrap">
                <Layers size={18} color="var(--color-primary)" />
                <h2 className="dashboard-card__title">My Workspaces</h2>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                  {allWorkspaces.length}
                </span>
              </div>

              {/* Workspace Category Segmented Tabs */}
              <div className="dashboard-pill-tabs">
                <button
                  type="button"
                  onClick={() => setWorkspaceCategoryTab('all')}
                  className={`dashboard-pill-tab ${workspaceCategoryTab === 'all' ? 'dashboard-pill-tab--active' : ''}`}
                >
                  <span>All</span>
                  <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: workspaceCategoryTab === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--color-bg-alt)', color: workspaceCategoryTab === 'all' ? '#fff' : 'inherit' }}>
                    {allWorkspaces.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceCategoryTab('committees')}
                  className={`dashboard-pill-tab ${workspaceCategoryTab === 'committees' ? 'dashboard-pill-tab--active' : ''}`}
                >
                  <span>Committees</span>
                  <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: workspaceCategoryTab === 'committees' ? 'rgba(255,255,255,0.25)' : 'var(--color-bg-alt)', color: workspaceCategoryTab === 'committees' ? '#fff' : 'inherit' }}>
                    {committeeWorkspaces.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceCategoryTab('studios')}
                  className={`dashboard-pill-tab ${workspaceCategoryTab === 'studios' ? 'dashboard-pill-tab--active' : ''}`}
                >
                  <span>Studios</span>
                  <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: workspaceCategoryTab === 'studios' ? 'rgba(255,255,255,0.25)' : 'var(--color-bg-alt)', color: workspaceCategoryTab === 'studios' ? '#fff' : 'inherit' }}>
                    {specializedWorkspaces.length}
                  </span>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="dashboard-shimmer" style={{ height: '78px' }} />
                ))}
              </div>
            ) : allWorkspaces.filter((w) => workspaceCategoryTab === 'all' || (workspaceCategoryTab === 'committees' ? w.isCommittee : !w.isCommittee)).length > 0 ? (
              <div className="dashboard-workspace-grid">
                {allWorkspaces
                  .filter((w) => workspaceCategoryTab === 'all' || (workspaceCategoryTab === 'committees' ? w.isCommittee : !w.isCommittee))
                  .map((w) => {
                    const isSwitching = switchingScopeId === w.id;
                    const isStudio = !w.isCommittee;
                    const isHRRole = w.role === 'HR';
                    const isLeadRole = w.role === 'LEAD';
                    const isScannerRole = w.role === 'SCANNER';
                    const isFullAccess = w.role === 'FULL ACCESS';

                    return (
                      <div
                        key={w.id}
                        className={`dashboard-workspace-card ${isStudio ? 'dashboard-workspace-card--studio' : ''} ${isScannerRole ? 'dashboard-workspace-card--scanner' : ''}`}
                      >
                        {/* Top Line: Slug Badge + Name on Left, Role Badge on Right */}
                        <div className="dashboard-workspace-card__top">
                          <div className="dashboard-workspace-card__title-group">
                            <span
                              className={`badge ${isStudio ? 'badge-accent' : 'badge-committee'}`}
                              style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0 }}
                            >
                              {w.slug}
                            </span>
                            <span className="dashboard-workspace-card__name" title={w.name}>
                              {w.name}
                            </span>
                          </div>

                          <span
                            className={`badge ${
                              isFullAccess
                                ? 'badge-primary'
                                : isLeadRole
                                ? 'badge-warning'
                                : isHRRole
                                ? 'badge-hr'
                                : isScannerRole
                                ? 'badge-accent'
                                : 'badge-outline'
                            }`}
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {w.role}
                          </span>
                        </div>

                        {/* Bottom Line: Category Description on Left, Quick Action on Right */}
                        <div className="dashboard-workspace-card__bottom">
                          <span className="dashboard-workspace-card__type">
                            {isScannerRole ? 'Event Scanner' : isStudio ? 'Specialized Studio' : 'Committee Workspace'}
                          </span>

                          {isStudio ? (
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              disabled={isSwitching}
                              onClick={() => handleOpenStudio(w)}
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', height: '26px' }}
                            >
                              {isSwitching ? (
                                'Opening…'
                              ) : (
                                <>
                                  <span>Open</span>
                                  <ChevronRight size={12} />
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              disabled={isSwitching}
                              onClick={() => handleSwitchAndOpen(w.data)}
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', height: '26px' }}
                            >
                              {isSwitching ? (
                                'Opening…'
                              ) : (
                                <>
                                  <span>Open</span>
                                  <ChevronRight size={12} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="dashboard-empty" style={{ padding: '2rem 1rem' }}>
                <Layers size={28} />
                <p>No workspaces found in this category.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / SIDEBAR COLUMN */}
        <div className="dashboard-bento-sidebar">
          {/* ONBOARDING CHECKLIST (For New Members) */}
          {onboardingItems.length > 0 && !dismissedOnboarding && (
            <div className="dashboard-card" id="onboarding-checklist-card">
              <div className="dashboard-card__header">
                <div className="dashboard-card__title-wrap">
                  <ListChecks size={17} color="var(--color-primary)" />
                  <h3 className="dashboard-card__title" style={{ fontSize: '0.9375rem' }}>
                    Onboarding Checklist
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                    {onboardingItems.filter((i) => i.status === 'done').length}/{onboardingItems.length}
                  </span>
                  {onboardingItems.every((i) => i.status === 'done') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDismissedOnboarding(true);
                        localStorage.setItem('dismiss_onboarding_completed', 'true');
                      }}
                      title="Dismiss completed checklist"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', padding: '0.1rem' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '6px', borderRadius: '9999px', background: 'var(--color-bg)', margin: '0.5rem 0 0.85rem', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                    width: `${Math.round((onboardingItems.filter((i) => i.status === 'done').length / onboardingItems.length) * 100)}%`,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {onboardingItems.map((item) => {
                  const isDone = item.status === 'done';
                  const isUpdating = updatingOnboardingId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isUpdating && handleToggleOnboarding(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        cursor: isUpdating ? 'wait' : 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: '1.15rem',
                          height: '1.15rem',
                          borderRadius: '4px',
                          border: isDone ? 'none' : '2px solid var(--color-border)',
                          background: isDone ? 'var(--color-accent)' : 'transparent',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isDone && <CheckCircle2 size={13} />}
                      </div>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? 'var(--color-text-muted)' : 'var(--color-text)',
                          flex: 1,
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {onboardingItems.every((i) => i.status === 'done') && (
                <div style={{ marginTop: '0.75rem', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎉 Onboarding complete! Welcome!</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDismissedOnboarding(true);
                      localStorage.setItem('dismiss_onboarding_completed', 'true');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, padding: 0 }}
                  >
                    Hide
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ANNOUNCEMENTS STREAM (Global & Committee) */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <Megaphone size={17} color="var(--color-primary)" />
                <h3 className="dashboard-card__title" style={{ fontSize: '0.9375rem' }}>
                  Announcements
                </h3>
              </div>
              <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                {allAnnouncements.length} Updates
              </span>
            </div>

            {allAnnouncements.length > 0 ? (
              <>
                <div className="dashboard-feed">
                  {allAnnouncements.slice(0, 4).map((ann) => (
                    <div
                      key={`${ann.type}-${ann.id}`}
                      className="dashboard-feed-item"
                      onClick={() => setSelectedAnnouncement(ann)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div
                        className="dashboard-feed-item__icon"
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          borderColor: 'rgba(139, 92, 246, 0.3)',
                          color: '#8b5cf6',
                        }}
                      >
                        {ann.isPinned ? <Pin size={13} /> : <Megaphone size={13} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="dashboard-feed-item__title">{ann.title}</div>
                        <div className="dashboard-feed-item__meta" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {ann.type === 'committee' ? (
                            <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                              {ann.committeeName || 'Committee'}
                            </span>
                          ) : (
                            <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                              Global
                            </span>
                          )}
                          <span>• {formatDate(ann.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {allAnnouncements.length > 4 && (
                  <button
                    type="button"
                    className="dashboard-feed-footer-btn"
                    onClick={() => {
                      setAnnouncementsSearch('');
                      setAnnouncementsCategoryFilter('all');
                      setAnnouncementsPage(1);
                      setIsAllAnnouncementsModalOpen(true);
                    }}
                  >
                    <span>View All Updates ({allAnnouncements.length})</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '1rem 0' }}>
                No recent announcements.
              </p>
            )}
          </div>

          {/* RECENT ACTIVITY TIMELINE */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <Activity size={17} color="var(--color-primary)" />
                <h3 className="dashboard-card__title" style={{ fontSize: '0.9375rem' }}>
                  Recent Activity
                </h3>
              </div>
            </div>

            {recentActivity.length > 0 ? (
              <>
                <div className="dashboard-feed">
                  {recentActivity.slice(0, 4).map((act) => (
                    <div key={act.id} className="dashboard-feed-item">
                      <div className="dashboard-feed-item__icon">
                        {getActivityIcon(act)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="dashboard-feed-item__title">
                          {act.title ? (
                            <>
                              <strong>{act.actorName || 'Member'}</strong> {act.title}
                            </>
                          ) : (
                            <>
                              <strong>{act.actorName || 'Member'}</strong> {act.action?.replace('_', ' ')}
                            </>
                          )}
                        </div>
                        <div className="dashboard-feed-item__meta">
                          {act.committeeName || act.committee_name || 'Committee'} &bull; {formatDate(act.createdAt || act.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {recentActivity.length > 4 && (
                  <button
                    type="button"
                    className="dashboard-feed-footer-btn"
                    onClick={() => {
                      setActivitySearch('');
                      setActivityScopeFilter('all');
                      setActivityPage(1);
                      setIsAllActivityModalOpen(true);
                    }}
                  >
                    <span>View All Activity ({recentActivity.length})</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '1rem 0' }}>
                No recent activity recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. ASSIGNMENT DELIVERY MODAL (Member) */}
      {deliveryModalAssignment && (
        <div className="workspace-modal-overlay" {...deliveryModalBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="workspace-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} color="var(--color-primary)" />
                <h3 className="workspace-modal__title">Deliver Assignment</h3>
              </div>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setDeliveryModalAssignment(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDelivery}>
              <div className="workspace-modal__body">
                <div>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {deliveryModalAssignment.committeeName}
                  </span>
                  <h4 style={{ margin: '0.35rem 0 0.15rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {deliveryModalAssignment.title}
                  </h4>
                  {deliveryModalAssignment.description && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                      {deliveryModalAssignment.description}
                    </p>
                  )}
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">
                    Upload Solution File (PDF, ZIP, IPYNB, DOCX) <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="file"
                    className="workspace-form-input"
                    onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Files are stored securely in the IEEE Cloud Storage repository.
                  </span>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Delivery Notes / Links (Optional)</label>
                  <textarea
                    className="workspace-form-textarea"
                    placeholder="Provide any context, links, or comments for the lead reviewing your work..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setDeliveryModalAssignment(null)}
                  disabled={submittingDelivery}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingDelivery}
                >
                  <Send size={14} />
                  <span>{submittingDelivery ? 'Uploading Solution…' : 'Submit Delivery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. REVIEW SUBMISSIONS MODAL (Lead on Dashboard) */}
      {viewingSubmissionsAssignment && (
        <div className="workspace-modal-overlay" {...submissionsModalBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="workspace-modal__header">
              <div>
                <h3 className="workspace-modal__title">Submissions: {viewingSubmissionsAssignment.title}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Max Points: {viewingSubmissionsAssignment.maxPoints} Pts
                </span>
              </div>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setViewingSubmissionsAssignment(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-modal__body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {loadingSubmissions ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1, 2].map((n) => (
                    <div key={n} className="dashboard-shimmer" style={{ height: '80px' }} />
                  ))}
                </div>
              ) : submissionsList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {submissionsList.map((sub) => {
                    const isGraded = sub.grade !== null && sub.grade !== undefined;
                    const isCurrentlyGrading = gradingSubmissionId === sub.id;

                    const viewingCommitteeInfo = committees.find((c) => c.id === viewingSubmissionsAssignment?.committeeId);
                    const viewingRole = viewingCommitteeInfo?.roleInCommittee || viewingCommitteeInfo?.role_in_committee;
                    const canGradeThisAssignment =
                      (user?.role === 'admin' ||
                       user?.role === 'officer' ||
                       viewingRole === 'lead' ||
                       viewingRole === 'admin') &&
                      viewingRole !== 'hr';

                    return (
                      <div
                        key={sub.id}
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="workspace-task-card__avatar">
                              {(sub.studentName || 'M').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                                {sub.studentName}
                              </strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {sub.studentEmail} &bull; {formatDate(sub.submittedAt)}
                              </div>
                            </div>
                          </div>

                          {isGraded ? (
                            <span className="badge badge-success">
                              Graded: {sub.grade}/{viewingSubmissionsAssignment.maxPoints}
                            </span>
                          ) : (
                            <span className="badge badge-warning">Pending Review</span>
                          )}
                        </div>

                        <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                          <Download size={14} color="var(--color-primary)" />
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                          >
                            {sub.fileName || 'Download Solution File'}
                          </a>
                        </div>

                        {sub.notes && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)', background: 'var(--color-card)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
                            <strong>Notes:</strong> {sub.notes}
                          </div>
                        )}

                        {isCurrentlyGrading && canGradeThisAssignment ? (
                          <div style={{ background: 'var(--color-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.35rem 0.65rem', gap: '0.35rem' }}>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={gradeInput}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                      setGradeInput('');
                                      return;
                                    }
                                    const num = Number(val);
                                    const max = viewingSubmissionsAssignment.maxPoints || 100;
                                    if (num > max) {
                                      setGradeInput(String(max));
                                    } else if (num < 0) {
                                      setGradeInput('0');
                                    } else {
                                      setGradeInput(val);
                                    }
                                  }}
                                  min={0}
                                  max={viewingSubmissionsAssignment.maxPoints}
                                  style={{
                                    width: '65px',
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '0',
                                    fontSize: '0.9375rem',
                                    fontWeight: 700,
                                    color: 'var(--color-text)',
                                    textAlign: 'center',
                                    outline: 'none',
                                  }}
                                />
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                  / {viewingSubmissionsAssignment.maxPoints} Pts
                                </span>
                              </div>

                              <input
                                type="text"
                                className="workspace-form-input"
                                placeholder="Feedback / Comments for student..."
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                style={{ flex: 1, minWidth: '200px' }}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                onClick={() => setGradingSubmissionId(null)}
                                disabled={savingGrade}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={() => handleGradeSubmission(sub.id)}
                                disabled={savingGrade}
                              >
                                {savingGrade ? 'Saving…' : 'Save Grade'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            {sub.feedback && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <em>Feedback: {sub.feedback}</em>
                              </span>
                            )}
                            {canGradeThisAssignment && (
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                style={{ marginLeft: 'auto' }}
                                onClick={() => {
                                  setGradingSubmissionId(sub.id);
                                  setGradeInput(sub.grade !== null ? String(sub.grade) : '');
                                  setFeedbackInput(sub.feedback || '');
                                }}
                              >
                                <Award size={12} />
                                <span>{isGraded ? 'Update Grade' : 'Grade Solution'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: '2rem 0' }}>
                  No members have submitted this assignment yet.
                </p>
              )}
            </div>

            <div className="workspace-modal__footer">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setViewingSubmissionsAssignment(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ANNOUNCEMENT DETAIL MODAL */}
      {selectedAnnouncement && (
        <div className="workspace-modal-overlay" {...announcementModalBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="workspace-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} color="var(--color-primary)" />
                <h3 className="workspace-modal__title">Announcement</h3>
              </div>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setSelectedAnnouncement(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-modal__body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {selectedAnnouncement.type === 'committee' ? (
                  <span className="badge badge-primary">{selectedAnnouncement.committeeName}</span>
                ) : (
                  <span className="badge badge-outline">Global Branch</span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {formatDate(selectedAnnouncement.createdAt)}
                </span>
              </div>

              <h3 style={{ margin: '0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {selectedAnnouncement.title}
              </h3>

              <div
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  color: 'var(--color-text)',
                }}
              >
                {selectedAnnouncement.body}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Author: <strong>{selectedAnnouncement.authorName || 'Committee Lead'}</strong>
              </div>
            </div>

            <div className="workspace-modal__footer">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. ALL ANNOUNCEMENTS ARCHIVE MODAL */}
      {isAllAnnouncementsModalOpen && (
        <div className="workspace-modal-overlay" {...allAnnouncementsModalBackdrop.getBackdropProps()}>
          <div
            className="workspace-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
          >
            <div className="workspace-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} color="var(--color-primary)" />
                <h3 className="workspace-modal__title">All Announcements & Updates</h3>
                <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                  {allAnnouncements.length} Total
                </span>
              </div>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setIsAllAnnouncementsModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-modal__body" style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {/* Search Bar */}
              <div className="dashboard-archive-search">
                <Search size={15} color="var(--color-text-muted)" />
                <input
                  type="text"
                  placeholder="Search updates by title, content, or author…"
                  value={announcementsSearch}
                  onChange={(e) => {
                    setAnnouncementsSearch(e.target.value);
                    setAnnouncementsPage(1);
                  }}
                />
                {announcementsSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnnouncementsSearch('');
                      setAnnouncementsPage(1);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'inline-flex' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="dashboard-archive-filters">
                <button
                  type="button"
                  className={`dashboard-archive-filter-btn ${announcementsCategoryFilter === 'all' ? 'dashboard-archive-filter-btn--active' : ''}`}
                  onClick={() => {
                    setAnnouncementsCategoryFilter('all');
                    setAnnouncementsPage(1);
                  }}
                >
                  All ({allAnnouncements.length})
                </button>
                <button
                  type="button"
                  className={`dashboard-archive-filter-btn ${announcementsCategoryFilter === 'global' ? 'dashboard-archive-filter-btn--active' : ''}`}
                  onClick={() => {
                    setAnnouncementsCategoryFilter('global');
                    setAnnouncementsPage(1);
                  }}
                >
                  Global Updates ({allAnnouncements.filter((a) => a.type === 'global').length})
                </button>
                <button
                  type="button"
                  className={`dashboard-archive-filter-btn ${announcementsCategoryFilter === 'committee' ? 'dashboard-archive-filter-btn--active' : ''}`}
                  onClick={() => {
                    setAnnouncementsCategoryFilter('committee');
                    setAnnouncementsPage(1);
                  }}
                >
                  Committee Updates ({allAnnouncements.filter((a) => a.type === 'committee').length})
                </button>
              </div>

              {/* Announcements List */}
              {paginatedModalAnnouncements.length > 0 ? (
                <div className="dashboard-archive-list">
                  {paginatedModalAnnouncements.map((ann) => (
                    <div
                      key={`modal-${ann.type}-${ann.id}`}
                      className="dashboard-archive-item"
                      onClick={() => {
                        setIsAllAnnouncementsModalOpen(false);
                        setSelectedAnnouncement(ann);
                      }}
                    >
                      <div
                        className="dashboard-feed-item__icon"
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          borderColor: 'rgba(139, 92, 246, 0.3)',
                          color: '#8b5cf6',
                          flexShrink: 0,
                        }}
                      >
                        {ann.isPinned ? <Pin size={14} /> : <Megaphone size={14} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                            {ann.title}
                          </h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                            {formatDate(ann.createdAt)}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 0.4rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {ann.body}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.725rem' }}>
                          {ann.type === 'committee' ? (
                            <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                              {ann.committeeName || 'Committee'}
                            </span>
                          ) : (
                            <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                              Global
                            </span>
                          )}
                          {ann.authorName && (
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              by <strong>{ann.authorName}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty" style={{ padding: '2rem 1rem' }}>
                  <Megaphone size={28} />
                  <p>No announcements found matching your filter criteria.</p>
                </div>
              )}
            </div>

            {/* Modal Pagination Footer */}
            {modalAnnouncements.length > ANNOUNCEMENTS_MODAL_PER_PAGE && (
              <div className="workspace-modal__footer" style={{ justifyContent: 'space-between' }}>
                <span className="dashboard-pagination__info">
                  Showing {(announcementsPage - 1) * ANNOUNCEMENTS_MODAL_PER_PAGE + 1}–{Math.min(announcementsPage * ANNOUNCEMENTS_MODAL_PER_PAGE, modalAnnouncements.length)} of {modalAnnouncements.length}
                </span>
                <div className="dashboard-pagination__controls">
                  <button
                    type="button"
                    className="dashboard-pagination__btn"
                    disabled={announcementsPage === 1}
                    onClick={() => setAnnouncementsPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0 0.35rem' }}>
                    Page {announcementsPage} of {totalAnnouncementsPages}
                  </span>
                  <button
                    type="button"
                    className="dashboard-pagination__btn"
                    disabled={announcementsPage === totalAnnouncementsPages}
                    onClick={() => setAnnouncementsPage((p) => Math.min(totalAnnouncementsPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. ALL ACTIVITY ARCHIVE MODAL */}
      {isAllActivityModalOpen && (
        <div className="workspace-modal-overlay" {...allActivityModalBackdrop.getBackdropProps()}>
          <div
            className="workspace-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
          >
            <div className="workspace-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="var(--color-primary)" />
                <h3 className="workspace-modal__title">Activity Log Archive</h3>
                <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                  {recentActivity.length} Total
                </span>
              </div>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setIsAllActivityModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-modal__body" style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {/* Search Bar */}
              <div className="dashboard-archive-search">
                <Search size={15} color="var(--color-text-muted)" />
                <input
                  type="text"
                  placeholder="Search activity by actor, action, or committee…"
                  value={activitySearch}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setActivityPage(1);
                  }}
                />
                {activitySearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivitySearch('');
                      setActivityPage(1);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'inline-flex' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Activity List */}
              {paginatedModalActivity.length > 0 ? (
                <div className="dashboard-archive-list">
                  {paginatedModalActivity.map((act) => (
                    <div
                      key={`modal-act-${act.id}`}
                      className="dashboard-archive-item"
                      style={{ cursor: 'default' }}
                    >
                      <div className="dashboard-feed-item__icon" style={{ flexShrink: 0 }}>
                        {getActivityIcon(act)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.4 }}>
                          {act.title ? (
                            <>
                              <strong>{act.actorName || 'Member'}</strong> {act.title}
                            </>
                          ) : (
                            <>
                              <strong>{act.actorName || 'Member'}</strong> {act.action?.replace('_', ' ')}
                            </>
                          )}
                        </div>
                        {formatActivityDetails(act.details) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                            {formatActivityDetails(act.details)}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          <span className="badge badge-outline" style={{ fontSize: '0.625rem' }}>
                            {act.committeeName || act.committee_name || 'Global'}
                          </span>
                          <span>&bull; {formatDate(act.createdAt || act.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty" style={{ padding: '2rem 1rem' }}>
                  <Activity size={28} />
                  <p>No activity records found matching your search.</p>
                </div>
              )}
            </div>

            {/* Modal Pagination Footer */}
            {modalActivity.length > ACTIVITY_MODAL_PER_PAGE && (
              <div className="workspace-modal__footer" style={{ justifyContent: 'space-between' }}>
                <span className="dashboard-pagination__info">
                  Showing {(activityPage - 1) * ACTIVITY_MODAL_PER_PAGE + 1}–{Math.min(activityPage * ACTIVITY_MODAL_PER_PAGE, modalActivity.length)} of {modalActivity.length}
                </span>
                <div className="dashboard-pagination__controls">
                  <button
                    type="button"
                    className="dashboard-pagination__btn"
                    disabled={activityPage === 1}
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0 0.35rem' }}>
                    Page {activityPage} of {totalActivityPages}
                  </span>
                  <button
                    type="button"
                    className="dashboard-pagination__btn"
                    disabled={activityPage === totalActivityPages}
                    onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
