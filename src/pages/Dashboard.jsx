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
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const toast = useToastStore();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');
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

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getMyDashboard();
      setDashboardData(data);
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
    const targetScopeId = matchingScope?.id || matchingScope?.scopeId || committee.id;

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
      toast.error('Switch Failed', err.message || 'Could not switch active workspace.');
    } finally {
      setSwitchingScopeId(null);
    }
  };

  // Submit Assignment Delivery
  const handleSubmitDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryModalAssignment) return;

    if (!deliveryFile) {
      toast.error('File Required', 'Please choose a solution file to upload.');
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

    setSavingGrade(true);
    try {
      await api.gradeAssignmentSubmission({
        committeeId: viewingSubmissionsAssignment.committeeId,
        assignmentId: viewingSubmissionsAssignment.id,
        submissionId,
        grade: Number(gradeInput),
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

  // Determine which assignments to show on dashboard:
  // - If user is Lead in that committee: show active assignment with "Review Submissions"
  // - If user is Member in that committee: only show if unsubmitted (!isSubmitted) with "Deliver Solution"
  const actionableAssignments = pendingAssignments.filter((assignment) => {
    const committeeInfo = committees.find((c) => c.id === assignment.committeeId);
    const isLeadForThisCommittee =
      user?.role === 'admin' ||
      user?.role === 'officer' ||
      committeeInfo?.roleInCommittee === 'lead' ||
      committeeInfo?.role_in_committee === 'lead';

    if (isLeadForThisCommittee) return true;
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
              <span>Committee Workspace</span>
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
                  onClick={() => setTaskFilter('all')}
                >
                  All ({tasks.length})
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-tab ${taskFilter === 'todo' ? 'dashboard-filter-tab--active' : ''}`}
                  onClick={() => setTaskFilter('todo')}
                >
                  To Do ({taskStats.todo})
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-tab ${taskFilter === 'in_progress' ? 'dashboard-filter-tab--active' : ''}`}
                  onClick={() => setTaskFilter('in_progress')}
                >
                  In Progress ({taskStats.inProgress})
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-tab ${taskFilter === 'done' ? 'dashboard-filter-tab--active' : ''}`}
                  onClick={() => setTaskFilter('done')}
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
              <div className="dashboard-task-list">
                {filteredTasks.map((task) => {
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
                  const isLeadForThisCommittee =
                    user?.role === 'admin' ||
                    user?.role === 'officer' ||
                    committeeInfo?.roleInCommittee === 'lead' ||
                    committeeInfo?.role_in_committee === 'lead';

                  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && !assignment.isSubmitted;

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
                          {isOverdue && !isLeadForThisCommittee && (
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
                        {isLeadForThisCommittee ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenSubmissions(assignment)}
                          >
                            <Eye size={14} />
                            <span>Review Submissions</span>
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

          {/* MY COMMITTEES GRID */}
          <div className="dashboard-card" id="my-committees-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <Building size={18} color="var(--color-primary)" />
                <h2 className="dashboard-card__title">My Committees</h2>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                {committees.length} Assigned
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {[1, 2].map((n) => (
                  <div key={n} className="dashboard-shimmer" style={{ height: '90px' }} />
                ))}
              </div>
            ) : committees.length > 0 ? (
              <div className="dashboard-committee-grid">
                {committees.map((c) => {
                  const isSwitching = switchingScopeId === c.id;
                  const committeeRole = (c.roleInCommittee || c.role_in_committee || 'member').toUpperCase();

                  return (
                    <div key={c.id} className="dashboard-committee-card">
                      <div className="dashboard-committee-card__header">
                        <div>
                          <div className="dashboard-committee-card__name">{c.name}</div>
                          <div className="dashboard-committee-card__role">
                            Role:{' '}
                            <strong style={{ color: 'var(--color-text)' }}>
                              {committeeRole}
                            </strong>
                          </div>
                        </div>
                        <span className="badge badge-outline" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          {c.slug}
                        </span>
                      </div>

                      <div className="dashboard-committee-card__footer">
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Committee Workspace
                        </span>

                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          disabled={isSwitching}
                          onClick={() => handleSwitchAndOpen(c)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                        >
                          {isSwitching ? (
                            'Opening…'
                          ) : (
                            <>
                              <span>Workspace</span>
                              <ChevronRight size={13} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-empty">
                <Building size={32} />
                <p>You have not been assigned to any committees yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / SIDEBAR COLUMN */}
        <div className="dashboard-bento-sidebar">
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
              <div className="dashboard-feed">
                {allAnnouncements.slice(0, 6).map((ann) => (
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
              <div className="dashboard-feed">
                {recentActivity.slice(0, 6).map((act) => (
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
        <div className="workspace-modal-overlay" onClick={() => setDeliveryModalAssignment(null)}>
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
        <div className="workspace-modal-overlay" onClick={() => setViewingSubmissionsAssignment(null)}>
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

                        {isCurrentlyGrading ? (
                          <div style={{ background: 'var(--color-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <input
                                type="number"
                                className="workspace-form-input"
                                placeholder={`Grade (out of ${viewingSubmissionsAssignment.maxPoints})`}
                                value={gradeInput}
                                onChange={(e) => setGradeInput(e.target.value)}
                                min={0}
                                max={viewingSubmissionsAssignment.maxPoints}
                                style={{ width: '130px' }}
                              />
                              <input
                                type="text"
                                className="workspace-form-input"
                                placeholder="Feedback / Comments for student..."
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                style={{ flex: 1 }}
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
        <div className="workspace-modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
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
    </div>
  );
}
