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
  Sparkles,
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
      // Optimistic update
      setDashboardData((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
        const updatedTasks = currentTasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        );
        // Recalculate stats
        const todo = updatedTasks.filter((t) => t.status === 'todo').length;
        const inProgress = updatedTasks.filter((t) => t.status === 'in_progress').length;
        const done = updatedTasks.filter((t) => t.status === 'done').length;
        return {
          ...prev,
          tasks: updatedTasks,
          taskStats: { total: updatedTasks.length, todo, inProgress, done },
        };
      });
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

  const rawTasks = dashboardData?.tasks;
  const tasks = Array.isArray(rawTasks) ? rawTasks : (rawTasks?.items || []);
  const committees = dashboardData?.committees || [];
  const recentAnnouncements = dashboardData?.recentAnnouncements || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const taskStats = dashboardData?.taskStats || { total: 0, todo: 0, inProgress: 0, done: 0 };

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

  return (
    <div className="dashboard-page">
      {/* 1. HERO GREETING BANNER */}
      <section className="dashboard-hero">
        <div className="dashboard-hero__layout">
          <div>
            <div className="dashboard-hero__greeting">IEEE Menoufia Student Branch</div>
            <h1 className="dashboard-hero__name">
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'Member'}! 👋
            </h1>
            <div className="dashboard-hero__meta">
              <div className="dashboard-hero__scope-pill">
                <span className="dashboard-hero__pulse" />
                <span>
                  Active Context:{' '}
                  {user?.committeeSlug
                    ? `${user.committeeSlug.toUpperCase()} Committee`
                    : user?.role === 'admin'
                    ? 'Global Branch'
                    : 'IEEE Portal'}
                </span>
              </div>
              <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>
                Role: <strong>{user?.role?.toUpperCase()}</strong>
              </span>
            </div>
          </div>

          <Link to="/workspace" className="dashboard-hero__cta" id="btn-open-workspace">
            <Layers size={17} />
            <span>Open Committee Workspace</span>
            <ArrowRight size={16} />
          </Link>
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
            <Building size={20} />
          </div>
          <div className="dashboard-stat-card__content">
            <div className="dashboard-stat-card__value">{committees.length}</div>
            <div className="dashboard-stat-card__label">Committees</div>
          </div>
        </div>
      </section>

      {/* 3. BENTO LAYOUT (Main Tasks & Committees + Sidebar Stream) */}
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

          {/* MY COMMITTEES GRID */}
          <div className="dashboard-card" id="my-committees-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <Building size={18} color="var(--color-primary)" />
                <h2 className="dashboard-card__title">My Committees</h2>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                {committees.length} Active
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
                  const matchingScope = user?.availableScopes?.find(
                    (s) => s.committeeId === c.id || s.scopeId === c.id
                  );
                  const isCurrentScope =
                    user?.scopeId === (matchingScope?.scopeId || matchingScope?.id || c.id) &&
                    user?.scopeType === 'committee';
                  const isSwitching = switchingScopeId === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`dashboard-committee-card ${isCurrentScope ? 'dashboard-committee-card--active' : ''}`}
                    >
                      <div className="dashboard-committee-card__header">
                        <div>
                          <div className="dashboard-committee-card__name">{c.name}</div>
                          <div className="dashboard-committee-card__role">
                            Role:{' '}
                            <strong style={{ color: 'var(--color-text)' }}>
                              {c.role_in_committee?.toUpperCase() || 'MEMBER'}
                            </strong>
                          </div>
                        </div>
                        <span className="badge badge-outline" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          {c.slug}
                        </span>
                      </div>

                      <div className="dashboard-committee-card__footer">
                        {isCurrentScope ? (
                          <span
                            className="badge badge-success"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}
                          >
                            <span className="dashboard-hero__pulse" style={{ width: '6px', height: '6px' }} />
                            ACTIVE WORKSPACE
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Assigned Member
                          </span>
                        )}

                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          disabled={isSwitching}
                          onClick={() => handleSwitchAndOpen(c)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                        >
                          {isSwitching ? (
                            'Switching…'
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
          {/* RECENT ANNOUNCEMENTS */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-wrap">
                <Bell size={17} color="var(--color-primary)" />
                <h3 className="dashboard-card__title" style={{ fontSize: '0.9375rem' }}>
                  Announcements
                </h3>
              </div>
              <Link to="/announcements" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                View All
              </Link>
            </div>

            {recentAnnouncements.length > 0 ? (
              <div className="dashboard-feed">
                {recentAnnouncements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="dashboard-feed-item">
                    <div className="dashboard-feed-item__icon">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <div className="dashboard-feed-item__title">{ann.title}</div>
                      <div className="dashboard-feed-item__meta">
                        {ann.category} • {formatDate(ann.createdAt)}
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
                {recentActivity.slice(0, 5).map((act, idx) => (
                  <div key={act.id || idx} className="dashboard-feed-item">
                    <div className="dashboard-feed-item__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <div className="dashboard-feed-item__title">
                        <strong>{act.actorName || 'Member'}</strong> {act.action}{' '}
                        {act.taskTitle ? `"${act.taskTitle}"` : 'a task'}
                      </div>
                      <div className="dashboard-feed-item__meta">
                        {formatDate(act.createdAt || act.timestamp)}
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
    </div>
  );
}
