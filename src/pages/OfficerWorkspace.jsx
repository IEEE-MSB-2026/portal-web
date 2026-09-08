import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  Layers,
  ListTodo,
  FolderDown,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Edit3,
  Archive,
  RotateCcw,
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  UserCheck,
  Briefcase,
  TrendingUp,
  Activity,
  Award,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Mail,
  Loader2,
  FileDown,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import '../styles/officerWorkspace.css';

const VALID_TABS = ['kanban', 'cockpit', 'vault', 'excom'];
const TAG_SUGGESTIONS = ['All', 'Plan', 'Approvals', 'Budgets', 'Sponsorship', 'Guidelines', 'Other'];
const POSITION_OPTIONS = [
  { value: 'chairman', label: 'Chairman (Branch Chair)' },
  { value: 'vice_chairman', label: 'Vice Chairman' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'General Secretary' },
  { value: 'webmaster', label: 'Webmaster' },
  { value: 'custom', label: 'Custom Officer Position...' },
];

export default function OfficerWorkspace() {
  const { user } = useAuthStore();
  const toast = useToastStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'kanban';

  const setActiveTab = (tab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'kanban') next.delete('tab');
        else next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  const isAdmin = user?.role === 'admin';

  // ---------------------------------------------------------------------------
  // State: Tab 1 (Board Tasks)
  // ---------------------------------------------------------------------------
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigneeUserId: '',
    dueDate: '',
  });

  // ---------------------------------------------------------------------------
  // State: Tab 2 (Cockpit)
  // ---------------------------------------------------------------------------
  const [cockpitData, setCockpitData] = useState(null);
  const [loadingCockpit, setLoadingCockpit] = useState(true);

  // ---------------------------------------------------------------------------
  // State: Tab 3 (Governance Vault)
  // ---------------------------------------------------------------------------
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docTagFilter, setDocTagFilter] = useState('All');
  const [docSearch, setDocSearch] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    tag: 'Plan',
    customTag: '',
    description: '',
    file: null,
  });

  // ---------------------------------------------------------------------------
  // State: Tab 4 (Excom Roster & Role Assignment)
  // ---------------------------------------------------------------------------
  const [excomMembers, setExcomMembers] = useState([]);
  const [loadingExcom, setLoadingExcom] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('2025/2026');
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [appointing, setAppointing] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidateResults, setCandidateResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [appointForm, setAppointForm] = useState({
    position: 'vice_chairman',
    customTitle: '',
    season: '2025/2026',
  });

  // ---------------------------------------------------------------------------
  // Initial Loaders
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadTasks();
    loadCockpit();
    loadDocuments();
    loadExcom();
  }, []);

  // ---------------------------------------------------------------------------
  // Data Fetching Functions
  // ---------------------------------------------------------------------------
  async function loadTasks() {
    setLoadingTasks(true);
    try {
      const res = await api.getBoardTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      toast.error('Failed to load board tasks', err.message);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function loadArchivedTasks() {
    try {
      const res = await api.getArchivedBoardTasks();
      setArchivedTasks(res.tasks || []);
    } catch (err) {
      toast.error('Failed to load archive', err.message);
    }
  }

  async function loadCockpit() {
    setLoadingCockpit(true);
    try {
      const res = await api.getBranchCockpitStats();
      setCockpitData(res);
    } catch (err) {
      toast.error('Failed to load cockpit metrics', err.message);
    } finally {
      setLoadingCockpit(false);
    }
  }

  async function loadDocuments() {
    setLoadingDocs(true);
    try {
      const params = {};
      if (docTagFilter && docTagFilter !== 'All') params.tag = docTagFilter;
      if (docSearch.trim()) params.search = docSearch.trim();
      const res = await api.getGovernanceDocuments(params);
      setDocuments(res.documents || []);
    } catch (err) {
      toast.error('Failed to load vault documents', err.message);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function loadExcom() {
    setLoadingExcom(true);
    try {
      const res = await api.getExcomMembers({ season: selectedSeason });
      setExcomMembers(res.members || []);
    } catch (err) {
      toast.error('Failed to load Excom roster', err.message);
    } finally {
      setLoadingExcom(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Tab 1: Task Actions
  // ---------------------------------------------------------------------------
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Validation Error', 'Task title is required.');
      return;
    }

    try {
      if (editingTask) {
        await api.updateBoardTask(editingTask.id, {
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          priority: taskForm.priority,
          assigneeUserId: taskForm.assigneeUserId || null,
          dueDate: taskForm.dueDate || null,
        });
        toast.success('Task Updated', 'Board objective was updated.');
      } else {
        await api.createBoardTask({
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          priority: taskForm.priority,
          assigneeUserId: taskForm.assigneeUserId || null,
          dueDate: taskForm.dueDate || null,
        });
        toast.success('Task Created', 'New strategic objective added to board.');
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', priority: 'medium', assigneeUserId: '', dueDate: '' });
      loadTasks();
    } catch (err) {
      toast.error('Task Action Failed', err.message);
    }
  };

  const handleMoveTaskStatus = async (task, newStatus) => {
    try {
      await api.updateBoardTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      toast.success('Status Updated', `Task moved to ${newStatus.replace('_', ' ')}.`);
    } catch (err) {
      toast.error('Failed to move task', err.message);
    }
  };

  const handleArchiveTask = async (task, isArchived) => {
    try {
      await api.archiveBoardTask(task.id, isArchived);
      toast.success(isArchived ? 'Task Archived' : 'Task Restored');
      loadTasks();
      if (showArchiveDrawer) loadArchivedTasks();
    } catch (err) {
      toast.error('Archive Action Failed', err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this board task?')) return;
    try {
      await api.deleteBoardTask(taskId);
      toast.success('Task Deleted', 'Board objective removed.');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      toast.error('Failed to delete task', err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 3: Governance Vault Actions
  // ---------------------------------------------------------------------------
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docForm.title.trim()) {
      toast.error('Validation Error', 'Document title is required.');
      return;
    }
    if (!docForm.file) {
      toast.error('Validation Error', 'Please select a document file to upload (PDF, DOCX, XLSX, etc.).');
      return;
    }

    setUploadingDoc(true);
    try {
      // 1. Upload to Cloudinary via File Service with 10MB limit
      const cldRes = await api.uploadDirectToCloudinary({
        file: docForm.file,
        folder: 'governance',
        resourceType: 'raw',
      });

      const fileUrl = cldRes.secureUrl || cldRes.url;
      const fileSizeBytes = cldRes.bytes || docForm.file.size;
      const resolvedTag = docForm.tag === 'Other' && docForm.customTag.trim() ? docForm.customTag.trim() : docForm.tag;

      // 2. Register document record in core-platform
      await api.createGovernanceDocument({
        title: docForm.title.trim(),
        fileUrl,
        fileSizeBytes,
        tag: resolvedTag,
        description: docForm.description.trim(),
      });

      toast.success('Document Vaulted', 'Official document uploaded and secured in vault.');
      setShowDocModal(false);
      setDocForm({ title: '', tag: 'Plan', customTag: '', description: '', file: null });
      loadDocuments();
    } catch (err) {
      toast.error('Upload Failed', err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document from the Governance Vault? The file will be scheduled for permanent destruction.')) return;
    try {
      await api.deleteGovernanceDocument(docId);
      toast.success('Document Deleted', 'Record and file asset queued for deletion.');
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 4: Excom Team Actions (Admin Only)
  // ---------------------------------------------------------------------------
  const handleSearchCandidates = async (query) => {
    setCandidateQuery(query);
    if (!query.trim()) {
      setCandidateResults([]);
      return;
    }
    try {
      const res = await api.searchCandidateOfficers(query);
      setCandidateResults(res.candidates || []);
    } catch (err) {
      console.error('Failed to search candidate users:', err);
    }
  };

  const handleAppointOfficer = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      toast.error('Validation Error', 'Please search and select a member to appoint.');
      return;
    }

    setAppointing(true);
    try {
      await api.assignExcomMember({
        userId: selectedCandidate.id,
        position: appointForm.position,
        customTitle: appointForm.position === 'custom' ? appointForm.customTitle.trim() : undefined,
        season: appointForm.season,
      });

      toast.success('Officer Appointed', `${selectedCandidate.name} appointed to Excom with global officer privileges.`);
      setShowAppointModal(false);
      setSelectedCandidate(null);
      setCandidateQuery('');
      setCandidateResults([]);
      setAppointForm({ position: 'vice_chairman', customTitle: '', season: selectedSeason });
      loadExcom();
    } catch (err) {
      toast.error('Appointment Failed', err.message);
    } finally {
      setAppointing(false);
    }
  };

  const handleRemoveOfficer = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the Executive Committee roster?`)) return;
    try {
      await api.removeExcomMember(memberId);
      toast.success('Officer Removed', `${memberName} removed from active Excom roster.`);
      setExcomMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      toast.error('Failed to remove officer', err.message);
    }
  };

  // Filter tasks for columns
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="section officer-page">
      <div className="container">
        {/* ================================================================= */}
        {/* Executive Header Banner */}
        {/* ================================================================= */}
        <div className="officer-header">
          <div className="officer-header__glow" />
          <div className="officer-header__content">
            <div className="officer-header__title-area">
              <div className="officer-header__badge-icon">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h1 className="officer-header__title">Executive Workspace</h1>
                <p className="officer-header__subtitle">
                  IEEE Menoufia Student Branch Board Command & Governance Center
                </p>
              </div>
            </div>

            <div className="officer-header__meta">
              <div className="officer-season-pill">
                <Calendar size={14} />
                <span>Season {selectedSeason}</span>
              </div>
              {isAdmin && (
                <span className="badge badge-danger" style={{ padding: '0.35rem 0.75rem' }}>
                  Branch Administrator Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Tab Navigation Pills */}
        {/* ================================================================= */}
        <div className="officer-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'kanban'}
            onClick={() => setActiveTab('kanban')}
            className={`officer-tab-btn ${activeTab === 'kanban' ? 'officer-tab-btn--active' : ''}`}
          >
            <ListTodo size={17} />
            <span>Board Objectives</span>
            <span className="officer-tab-btn__badge">{tasks.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cockpit'}
            onClick={() => setActiveTab('cockpit')}
            className={`officer-tab-btn ${activeTab === 'cockpit' ? 'officer-tab-btn--active' : ''}`}
          >
            <Activity size={17} />
            <span>Committee Cockpit</span>
            <span className="officer-tab-btn__badge">{cockpitData?.committees?.length || 8}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vault'}
            onClick={() => setActiveTab('vault')}
            className={`officer-tab-btn ${activeTab === 'vault' ? 'officer-tab-btn--active' : ''}`}
          >
            <FolderDown size={17} />
            <span>Governance Vault</span>
            <span className="officer-tab-btn__badge">{documents.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'excom'}
            onClick={() => setActiveTab('excom')}
            className={`officer-tab-btn ${activeTab === 'excom' ? 'officer-tab-btn--active' : ''}`}
          >
            <Users size={17} />
            <span>Excom Roster</span>
            <span className="officer-tab-btn__badge">{excomMembers.length}</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* Tab 1: Board Kanban & Strategic Objectives */}
        {/* ================================================================= */}
        {activeTab === 'kanban' && (
          <div className="officer-tab-pane">
            <div className="board-kanban-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                  Strategic Objectives & Action Items
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  High-level branch tasks owned and driven collectively by all Executive Officers.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowArchiveDrawer(!showArchiveDrawer);
                    if (!showArchiveDrawer) loadArchivedTasks();
                  }}
                  className={`btn btn-sm ${showArchiveDrawer ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ gap: '0.4rem' }}
                >
                  <Archive size={15} />
                  <span>{showArchiveDrawer ? 'Hide Archive' : 'View Archive'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setTaskForm({ title: '', description: '', priority: 'medium', assigneeUserId: '', dueDate: '' });
                    setShowTaskModal(true);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <Plus size={16} />
                  <span>New Objective</span>
                </button>
              </div>
            </div>

            {/* Archive Drawer */}
            {showArchiveDrawer && (
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-6)',
                  marginBottom: 'var(--space-8)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Archive size={16} color="var(--officer-gold)" />
                    <span>Archived Board Tasks</span>
                  </h3>
                  <button type="button" onClick={() => setShowArchiveDrawer(false)} className="btn btn-icon btn-sm">
                    <X size={16} />
                  </button>
                </div>

                {archivedTasks.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>No archived tasks found.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {archivedTasks.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {t.title}
                          </div>
                          <span className={`priority-pill priority-${t.priority}`}>{t.priority}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleArchiveTask(t, false)}
                          className="btn btn-secondary btn-sm"
                          title="Restore task to board"
                          style={{ padding: '0.25rem 0.5rem', gap: '0.25rem' }}
                        >
                          <RotateCcw size={13} />
                          <span>Restore</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Kanban Columns */}
            {loadingTasks ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
                <Loader2 size={32} className="spinner" color="var(--officer-gold)" />
              </div>
            ) : (
              <div className="board-kanban-cols">
                {/* Column 1: To Do */}
                <div className="board-col">
                  <div className="board-col__header">
                    <div className="board-col__title">
                      <Clock size={16} color="var(--officer-gold)" />
                      <span>Planned & Backlog</span>
                    </div>
                    <span className="board-col__count">{todoTasks.length}</span>
                  </div>
                  <div className="board-col__cards">
                    {todoTasks.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)', fontSize: '0.8125rem' }}>
                        No planned tasks
                      </div>
                    ) : (
                      todoTasks.map((task) => (
                        <div key={task.id} className="board-card">
                          <div className="board-card__top">
                            <span className={`priority-pill priority-${task.priority}`}>{task.priority}</span>
                            <div className="board-card__actions">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTask(task);
                                  setTaskForm({
                                    title: task.title,
                                    description: task.description || '',
                                    priority: task.priority,
                                    assigneeUserId: task.assigneeUserId || '',
                                    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                                  });
                                  setShowTaskModal(true);
                                }}
                                className="btn btn-icon btn-sm"
                                title="Edit objective"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleArchiveTask(task, true)}
                                className="btn btn-icon btn-sm"
                                title="Archive objective"
                              >
                                <Archive size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="btn btn-icon btn-sm"
                                title="Delete objective"
                              >
                                <Trash2 size={13} color="var(--color-danger)" />
                              </button>
                            </div>
                          </div>
                          <div className="board-card__title">{task.title}</div>
                          {task.description && <p className="board-card__desc">{task.description}</p>}
                          <div className="board-card__footer">
                            <div className="board-card__assignee">
                              {task.assigneeName ? (
                                <>
                                  <div className="board-card__avatar">
                                    {task.assigneeName.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{task.assigneeName.split(' ')[0]}</span>
                                </>
                              ) : (
                                <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Unassigned</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMoveTaskStatus(task, 'in_progress')}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                            >
                              <span>Start</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="board-col">
                  <div className="board-col__header">
                    <div className="board-col__title">
                      <TrendingUp size={16} color="#3B82F6" />
                      <span>In Execution</span>
                    </div>
                    <span className="board-col__count">{inProgressTasks.length}</span>
                  </div>
                  <div className="board-col__cards">
                    {inProgressTasks.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)', fontSize: '0.8125rem' }}>
                        No tasks in execution
                      </div>
                    ) : (
                      inProgressTasks.map((task) => (
                        <div key={task.id} className="board-card">
                          <div className="board-card__top">
                            <span className={`priority-pill priority-${task.priority}`}>{task.priority}</span>
                            <div className="board-card__actions">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTask(task);
                                  setTaskForm({
                                    title: task.title,
                                    description: task.description || '',
                                    priority: task.priority,
                                    assigneeUserId: task.assigneeUserId || '',
                                    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                                  });
                                  setShowTaskModal(true);
                                }}
                                className="btn btn-icon btn-sm"
                                title="Edit objective"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleArchiveTask(task, true)}
                                className="btn btn-icon btn-sm"
                                title="Archive objective"
                              >
                                <Archive size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="board-card__title">{task.title}</div>
                          {task.description && <p className="board-card__desc">{task.description}</p>}
                          <div className="board-card__footer">
                            <button
                              type="button"
                              onClick={() => handleMoveTaskStatus(task, 'todo')}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                            >
                              <ArrowLeft size={12} />
                              <span>Back</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveTaskStatus(task, 'done')}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                            >
                              <span>Complete</span>
                              <CheckCircle2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 3: Done */}
                <div className="board-col">
                  <div className="board-col__header">
                    <div className="board-col__title">
                      <CheckCircle2 size={16} color="#10B981" />
                      <span>Completed</span>
                    </div>
                    <span className="board-col__count">{doneTasks.length}</span>
                  </div>
                  <div className="board-col__cards">
                    {doneTasks.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)', fontSize: '0.8125rem' }}>
                        No completed objectives yet
                      </div>
                    ) : (
                      doneTasks.map((task) => (
                        <div key={task.id} className="board-card" style={{ opacity: 0.9 }}>
                          <div className="board-card__top">
                            <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>Done</span>
                            <div className="board-card__actions">
                              <button
                                type="button"
                                onClick={() => handleArchiveTask(task, true)}
                                className="btn btn-icon btn-sm"
                                title="Archive completed task"
                              >
                                <Archive size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="board-card__title" style={{ textDecoration: 'line-through', opacity: 0.8 }}>
                            {task.title}
                          </div>
                          <div className="board-card__footer">
                            <button
                              type="button"
                              onClick={() => handleMoveTaskStatus(task, 'in_progress')}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                            >
                              <RotateCcw size={12} />
                              <span>Reopen</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* Tab 2: Cross-Committee Health & Progress Cockpit */}
        {/* ================================================================= */}
        {activeTab === 'cockpit' && (
          <div className="officer-tab-pane">
            {loadingCockpit ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
                <Loader2 size={32} className="spinner" color="var(--officer-gold)" />
              </div>
            ) : (
              <>
                {/* Master KPIs Grid */}
                <div className="cockpit-kpi-grid">
                  <div className="kpi-bento-card">
                    <div className="kpi-bento-card__title">
                      <ListTodo size={15} color="var(--officer-gold)" />
                      <span>Total Branch Tasks</span>
                    </div>
                    <div className="kpi-bento-card__val">{cockpitData?.kpis?.totalTasks || 0}</div>
                    <div className="kpi-bento-card__sub">
                      {cockpitData?.kpis?.inProgressTasks || 0} in progress · {cockpitData?.kpis?.todoTasks || 0} backlog
                    </div>
                  </div>

                  <div className="kpi-bento-card">
                    <div className="kpi-bento-card__title">
                      <TrendingUp size={15} color="#10B981" />
                      <span>Completion Velocity</span>
                    </div>
                    <div className="kpi-bento-card__val" style={{ color: '#10B981' }}>
                      {cockpitData?.kpis?.completionRate || 0}%
                    </div>
                    <div className="kpi-bento-card__sub">
                      {cockpitData?.kpis?.completedTasks || 0} tasks delivered branch-wide
                    </div>
                  </div>

                  <div className="kpi-bento-card">
                    <div className="kpi-bento-card__title">
                      <Users size={15} color="#3B82F6" />
                      <span>Branch Members</span>
                    </div>
                    <div className="kpi-bento-card__val">{cockpitData?.kpis?.totalMembers || 0}</div>
                    <div className="kpi-bento-card__sub">Active volunteers across 8 committees</div>
                  </div>

                  <div className="kpi-bento-card">
                    <div className="kpi-bento-card__title">
                      <Briefcase size={15} color="#8B5CF6" />
                      <span>Recruitment Funnel</span>
                    </div>
                    <div className="kpi-bento-card__val">{cockpitData?.kpis?.activeApplicants || 0}</div>
                    <div className="kpi-bento-card__sub">Active applications in review pipeline</div>
                  </div>
                </div>

                {/* 8 Committees Bento Matrix */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                    Committee Pulse & Operational Health
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    Real-time operational overview with 1-click inspection shortcut into each committee workspace.
                  </p>
                </div>

                <div className="cockpit-committees-grid">
                  {(cockpitData?.committees || []).map((comm) => (
                    <div key={comm.id} className="committee-bento-card">
                      <div className="committee-bento-card__header">
                        <div>
                          <div className="committee-bento-card__slug">{comm.slug}</div>
                          <h4 className="committee-bento-card__name">{comm.name}</h4>
                        </div>
                        <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                          {comm.memberCount} Members
                        </span>
                      </div>

                      {/* Lead */}
                      <div className="committee-bento-card__lead">
                        {comm.lead ? (
                          <>
                            <div className="board-card__avatar">
                              {comm.lead.avatarUrl ? (
                                <img
                                  src={comm.lead.avatarUrl}
                                  alt={comm.lead.name}
                                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                comm.lead.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{comm.lead.name}</div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Committee Lead</div>
                            </div>
                          </>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            No lead currently assigned
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="committee-bento-card__progress-wrap">
                        <div className="committee-bento-card__progress-label">
                          <span>Task Delivery</span>
                          <span>{comm.tasks.completionRate}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${comm.tasks.completionRate}%` }} />
                        </div>
                      </div>

                      {/* Tasks breakdown */}
                      <div className="committee-bento-card__stats-row">
                        <div className="committee-stat-col">
                          <div className="committee-stat-col__val">{comm.tasks.total}</div>
                          <div className="committee-stat-col__label">Total</div>
                        </div>
                        <div className="committee-stat-col">
                          <div className="committee-stat-col__val" style={{ color: 'var(--officer-gold)' }}>
                            {comm.tasks.inProgress}
                          </div>
                          <div className="committee-stat-col__label">In Progress</div>
                        </div>
                        <div className="committee-stat-col">
                          <div className="committee-stat-col__val" style={{ color: '#10B981' }}>
                            {comm.tasks.done}
                          </div>
                          <div className="committee-stat-col__label">Done</div>
                        </div>
                      </div>

                      {/* 1-Click Shortcut Button */}
                      <button
                        type="button"
                        onClick={() => navigate(`/workspace?committee=${comm.id}`)}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', fontWeight: 600 }}
                      >
                        <span>Inspect Committee Workspace</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* Tab 3: Governance Vault & Branch Archives */}
        {/* ================================================================= */}
        {activeTab === 'vault' && (
          <div className="officer-tab-pane">
            <div className="board-kanban-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                  Branch Governance Vault
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  Official branch constitution, university approvals, budget balance sheets, and IEEE guidelines.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDocForm({ title: '', tag: 'Plan', customTag: '', description: '', file: null });
                  setShowDocModal(true);
                }}
                className="btn btn-primary btn-sm"
                style={{ gap: '0.4rem' }}
              >
                <UploadCloud size={16} />
                <span>Upload Document</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="vault-filter-bar">
              <div className="vault-tags">
                {TAG_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setDocTagFilter(tag);
                      loadDocuments();
                    }}
                    className={`vault-tag-pill ${docTagFilter === tag ? 'vault-tag-pill--active' : ''}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
                />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadDocuments();
                  }}
                  placeholder="Search documents..."
                  className="form-control"
                  style={{ paddingLeft: '34px', fontSize: '0.875rem', height: '36px' }}
                />
              </div>
            </div>

            {/* Documents Grid */}
            {loadingDocs ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
                <Loader2 size={32} className="spinner" color="var(--officer-gold)" />
              </div>
            ) : documents.length === 0 ? (
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-12)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                <FolderDown size={40} style={{ margin: '0 auto var(--space-3) auto', opacity: 0.5 }} />
                <h4 style={{ color: 'var(--color-text-bright)', marginBottom: '0.5rem' }}>No Documents Found</h4>
                <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.875rem' }}>
                  No governance documents match your current filter. Click "Upload Document" to secure an official branch file.
                </p>
              </div>
            ) : (
              <div className="vault-docs-grid">
                {documents.map((doc) => {
                  const sizeMb = doc.fileSizeBytes ? (doc.fileSizeBytes / (1024 * 1024)).toFixed(2) : null;
                  return (
                    <div key={doc.id} className="vault-card">
                      <div>
                        <div className="vault-card__header">
                          <div className="vault-card__icon">
                            <FileText size={22} />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            {doc.tag && (
                              <span className="badge badge-warning" style={{ fontSize: '0.6875rem', marginBottom: '0.35rem' }}>
                                {doc.tag}
                              </span>
                            )}
                            <h4 className="vault-card__title">{doc.title}</h4>
                          </div>
                        </div>

                        {doc.description && <p className="vault-card__desc">{doc.description}</p>}
                      </div>

                      <div className="vault-card__footer">
                        <div>
                          {sizeMb && <span>{sizeMb} MB · </span>}
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem', gap: '0.3rem' }}
                            title="Download official file"
                          >
                            <FileDown size={13} />
                            <span>Download</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="btn btn-icon btn-sm"
                            title="Delete document"
                          >
                            <Trash2 size={13} color="var(--color-danger)" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* Tab 4: Excom Team & Role Assignment */}
        {/* ================================================================= */}
        {activeTab === 'excom' && (
          <div className="officer-tab-pane">
            <div className="board-kanban-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                  Branch Executive Committee (Excom) Team
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  Internal roster of appointed officers holding platform governance and leadership roles.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setCandidateQuery('');
                    setCandidateResults([]);
                    setAppointForm({ position: 'vice_chairman', customTitle: '', season: selectedSeason });
                    setShowAppointModal(true);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <Plus size={16} />
                  <span>Appoint Officer</span>
                </button>
              )}
            </div>

            {loadingExcom ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
                <Loader2 size={32} className="spinner" color="var(--officer-gold)" />
              </div>
            ) : excomMembers.length === 0 ? (
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-12)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Users size={40} style={{ margin: '0 auto var(--space-3) auto', opacity: 0.5 }} />
                <h4 style={{ color: 'var(--color-text-bright)' }}>No Officers Appointed Yet</h4>
                <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.875rem' }}>
                  {isAdmin
                    ? 'Click "Appoint Officer" to assign authenticated members to branch executive offices.'
                    : 'The branch administrator has not yet configured the Excom roster for this season.'}
                </p>
              </div>
            ) : (
              <div className="excom-roster-grid">
                {excomMembers.map((member) => (
                  <div key={member.id} className="excom-member-card">
                    <div className="excom-member-card__banner">
                      <div className="excom-member-card__avatar-wrap">
                        {member.user?.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt={member.user.name} className="excom-member-card__avatar" />
                        ) : (
                          <div
                            className="excom-member-card__avatar"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--officer-gold)' }}
                          >
                            {member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'O'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="excom-member-card__body">
                      <div>
                        <h4 className="excom-member-card__name">{member.user?.name}</h4>
                        <div className="excom-position-badge">
                          <Award size={12} />
                          <span>{member.customTitle || member.position.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="excom-member-card__contact">
                        <Mail size={13} />
                        <span>{member.user?.email}</span>
                      </div>

                      {member.user?.department && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {member.user.department} · {member.user.faculty || 'Engineering'}
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="excom-member-card__actions">
                        <button
                          type="button"
                          onClick={() => handleRemoveOfficer(member.id, member.user?.name)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)', gap: '0.3rem', fontSize: '0.75rem' }}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* Modal: New / Edit Board Objective */}
        {/* ================================================================= */}
        {showTaskModal && (
          <div className="modal-backdrop" onClick={() => setShowTaskModal(false)}>
            <div className="modal-content bento-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {editingTask ? 'Edit Board Objective' : 'New Strategic Objective'}
                </h3>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-icon btn-sm">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Objective Title *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="e.g., Finalize Annual IEEE Student Branch Report"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Provide context, required outcomes, or cross-committee dependencies..."
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="form-control"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assignee (Officer)</label>
                  <select
                    value={taskForm.assigneeUserId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeUserId: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Unassigned (Board Collective)</option>
                    {excomMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name} ({m.customTitle || m.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'var(--space-4)' }}>
                  <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTask ? 'Save Changes' : 'Create Objective'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* Modal: Upload Governance Document */}
        {/* ================================================================= */}
        {showDocModal && (
          <div className="modal-backdrop" onClick={() => !uploadingDoc && setShowDocModal(false)}>
            <div className="modal-content bento-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Upload Governance Document
                </h3>
                {!uploadingDoc && (
                  <button type="button" onClick={() => setShowDocModal(false)} className="btn btn-icon btn-sm">
                    <X size={18} />
                  </button>
                )}
              </div>

              <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="e.g., IEEE Menoufia Plan 2026 / University Dean Approval"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Document Category / Tag</label>
                  <select
                    value={docForm.tag}
                    onChange={(e) => setDocForm({ ...docForm, tag: e.target.value })}
                    className="form-control"
                  >
                    <option value="Plan">Plan</option>
                    <option value="Approvals">University Approvals</option>
                    <option value="Budgets">Budget Sheets</option>
                    <option value="Sponsorship">Sponsorship Proposals</option>
                    <option value="Guidelines">IEEE Guidelines</option>
                    <option value="Other">Other Category...</option>
                  </select>
                </div>

                {docForm.tag === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Custom Tag Name</label>
                    <input
                      type="text"
                      value={docForm.customTag}
                      onChange={(e) => setDocForm({ ...docForm, customTag: e.target.value })}
                      placeholder="e.g., Annual Report, Section Charter"
                      className="form-control"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={docForm.description}
                    onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                    placeholder="Key document notes, date signed, approval parties..."
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select File (PDF, DOCX, XLSX up to 10MB) *</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                    onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'var(--space-4)' }}>
                  <button
                    type="button"
                    disabled={uploadingDoc}
                    onClick={() => setShowDocModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={uploadingDoc} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                    {uploadingDoc ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        <span>Uploading File...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Upload & Vault</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* Modal: Appoint Officer (Admin Only) */}
        {/* ================================================================= */}
        {showAppointModal && isAdmin && (
          <div className="modal-backdrop" onClick={() => !appointing && setShowAppointModal(false)}>
            <div className="modal-content bento-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Appoint Branch Officer
                </h3>
                {!appointing && (
                  <button type="button" onClick={() => setShowAppointModal(false)} className="btn btn-icon btn-sm">
                    <X size={18} />
                  </button>
                )}
              </div>

              <form onSubmit={handleAppointOfficer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Search Candidate Member */}
                <div className="form-group">
                  <label className="form-label">Search Registered Member *</label>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={15}
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
                    />
                    <input
                      type="text"
                      value={candidateQuery}
                      onChange={(e) => handleSearchCandidates(e.target.value)}
                      placeholder="Search member by name or email..."
                      className="form-control"
                      style={{ paddingLeft: '34px' }}
                    />
                  </div>

                  {/* Candidate Selection Dropdown */}
                  {candidateResults.length > 0 && !selectedCandidate && (
                    <div
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        marginTop: '0.25rem',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                      }}
                    >
                      {candidateResults.map((cand) => (
                        <div
                          key={cand.id}
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setCandidateQuery(cand.name);
                            setCandidateResults([]);
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cand.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cand.email}</div>
                          </div>
                          <span className="badge badge-secondary" style={{ fontSize: '0.6875rem' }}>
                            {cand.defaultRole}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedCandidate && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        marginTop: '0.35rem',
                        border: '1px solid var(--officer-gold)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCheck size={16} color="var(--officer-gold)" />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          Selected: {selectedCandidate.name} ({selectedCandidate.email})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(null);
                          setCandidateQuery('');
                        }}
                        className="btn btn-icon btn-sm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Position Selection */}
                <div className="form-group">
                  <label className="form-label">Executive Office / Position *</label>
                  <select
                    value={appointForm.position}
                    onChange={(e) => setAppointForm({ ...appointForm, position: e.target.value })}
                    className="form-control"
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {appointForm.position === 'custom' && (
                  <div className="form-group">
                    <label className="form-label">Custom Officer Title *</label>
                    <input
                      type="text"
                      required
                      value={appointForm.customTitle}
                      onChange={(e) => setAppointForm({ ...appointForm, customTitle: e.target.value })}
                      placeholder="e.g. Chapter Advisor, Activity Director"
                      className="form-control"
                    />
                  </div>
                )}

                {/* Season */}
                <div className="form-group">
                  <label className="form-label">Season Term</label>
                  <input
                    type="text"
                    required
                    value={appointForm.season}
                    onChange={(e) => setAppointForm({ ...appointForm, season: e.target.value })}
                    placeholder="2025/2026"
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'var(--space-4)' }}>
                  <button
                    type="button"
                    disabled={appointing}
                    onClick={() => setShowAppointModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={appointing || !selectedCandidate} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                    {appointing ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        <span>Appointing...</span>
                      </>
                    ) : (
                      <>
                        <Award size={16} />
                        <span>Confirm Appointment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
