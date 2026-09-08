import React, { useState, useEffect } from 'react';
import {
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
  Play,
  Calendar,
  Shield,
  ShieldCheck,
  Sparkles,
  CheckSquare,
  Square,
  UserPlus,
  Download,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { api } from '../../services/api';
import UserProfileModal from '../profile/UserProfileModal';

const TAG_SUGGESTIONS = ['All', 'Plan', 'Approvals', 'Budgets', 'Sponsorship', 'Guidelines', 'Other'];
const POSITION_OPTIONS = [
  { value: 'chairman', label: 'Chairman (Branch Chair)' },
  { value: 'vice_chairman', label: 'Vice Chairman' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'General Secretary' },
  { value: 'webmaster', label: 'Webmaster' },
  { value: 'custom', label: 'Custom Officer Position...' },
];

export default function ExecutiveBoardView({
  activeTab,
  setActiveTab,
  onSwitchWorkspace,
  isAdmin,
  isOfficer,
}) {
  const { user } = useAuthStore();
  const toast = useToastStore();

  // ---------------------------------------------------------------------------
  // Tab 1: Board Tasks State
  // ---------------------------------------------------------------------------
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigneeUserId: '',
    dueDate: '',
  });

  // ---------------------------------------------------------------------------
  // Tab 2: Cockpit State
  // ---------------------------------------------------------------------------
  const [cockpitData, setCockpitData] = useState(null);
  const [loadingCockpit, setLoadingCockpit] = useState(true);

  // ---------------------------------------------------------------------------
  // Tab 3: Governance Vault State
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
  // Tab 4: Excom Team State
  // ---------------------------------------------------------------------------
  const [excomMembers, setExcomMembers] = useState([]);
  const [loadingExcom, setLoadingExcom] = useState(true);
  const [excomSearchQuery, setExcomSearchQuery] = useState('');
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [appointing, setAppointing] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidateResults, setCandidateResults] = useState([]);
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [appointForm, setAppointForm] = useState({
    position: 'vice_chairman',
    customTitle: '',
  });

  // ---------------------------------------------------------------------------
  // Initial Loaders
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadTasks();
    loadArchivedTasks();
    loadCockpit();
    loadDocuments();
    loadExcom();
  }, []);

  async function loadTasks() {
    setLoadingTasks(true);
    try {
      const res = await api.getBoardTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      toast.error('Load Error', err.message || 'Failed to load board tasks.');
    } finally {
      setLoadingTasks(false);
    }
  }

  async function loadArchivedTasks() {
    setLoadingArchived(true);
    try {
      const res = await api.getArchivedBoardTasks();
      setArchivedTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load archived board tasks:', err);
    } finally {
      setLoadingArchived(false);
    }
  }

  async function loadCockpit() {
    setLoadingCockpit(true);
    try {
      const res = await api.getBranchCockpitStats();
      setCockpitData(res);
    } catch (err) {
      console.error('Failed to load cockpit data:', err);
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
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function loadExcom() {
    setLoadingExcom(true);
    try {
      const res = await api.getExcomMembers();
      setExcomMembers(res.members || []);
    } catch (err) {
      console.error('Failed to load excom members:', err);
    } finally {
      setLoadingExcom(false);
    }
  }

  const filteredExcomMembers = excomMembers.filter((m) => {
    if (!excomSearchQuery.trim()) return true;
    const q = excomSearchQuery.toLowerCase();
    const name = (m.user?.name || m.userName || '').toLowerCase();
    const role = (m.positionLabel || m.customTitle || m.position || '').toLowerCase();
    const email = (m.user?.email || m.userEmail || '').toLowerCase();
    return name.includes(q) || role.includes(q) || email.includes(q);
  });

  // Debounced Candidate Search
  useEffect(() => {
    if (!candidateQuery.trim() || !showAppointModal) {
      setCandidateResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCandidates(true);
      try {
        const data = await api.searchRegisteredUsers(candidateQuery.trim());
        setCandidateResults(data.users || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearchingCandidates(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [candidateQuery, showAppointModal]);

  // ---------------------------------------------------------------------------
  // Tab 1: Task Actions & Drag & Drop
  // ---------------------------------------------------------------------------
  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== col) setDragOverColumn(col);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    await handleMoveTaskStatus(task, targetStatus);
  };

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
        toast.success('Task Updated', 'Strategic task details saved.');
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
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      if (selectedTaskDetails && selectedTaskDetails.id === task.id) {
        setSelectedTaskDetails((prev) => ({ ...prev, status: newStatus }));
      }
      await api.updateBoardTask(task.id, { status: newStatus });
    } catch (err) {
      loadTasks();
      toast.error('Update Failed', err.message);
    }
  };

  const handleToggleArchiveTask = async (task, isArchived) => {
    try {
      await api.archiveBoardTask(task.id, isArchived);
      if (selectedTaskDetails?.id === task.id) {
        setSelectedTaskDetails(null);
      }
      loadTasks();
      loadArchivedTasks();
    } catch (err) {
      toast.error('Archive Failed', err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this objective?')) return;
    try {
      await api.deleteBoardTask(taskId);
      toast.success('Task Deleted', 'Objective removed permanently.');
      if (selectedTaskDetails?.id === taskId) {
        setSelectedTaskDetails(null);
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  const handleClaimTask = async (task) => {
    try {
      const myId = user?.id || user?.userRefId || user?.externalUserId;
      await api.updateBoardTask(task.id, { assigneeUserId: myId });
      toast.success('Task Claimed', 'You are now assigned to this strategic objective.');
      loadTasks();
      if (selectedTaskDetails?.id === task.id) {
        setSelectedTaskDetails((prev) => ({
          ...prev,
          assigneeUserId: myId,
          assigneeName: user?.name,
          assigneeEmail: user?.email,
        }));
      }
    } catch (err) {
      toast.error('Claim Failed', err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 3: Document Actions
  // ---------------------------------------------------------------------------
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docForm.title.trim() || !docForm.file) {
      toast.error('Validation Error', 'Document title and file are required.');
      return;
    }

    setUploadingDoc(true);
    try {
      const cldRes = await api.uploadDirectToCloudinary({
        file: docForm.file,
        folder: 'resources',
        resourceType: 'auto',
      });

      const chosenTag = docForm.tag === 'Other' && docForm.customTag.trim()
        ? docForm.customTag.trim()
        : docForm.tag;

      await api.createGovernanceDocument({
        title: docForm.title.trim(),
        fileUrl: cldRes.secureUrl || cldRes.url,
        fileSizeBytes: docForm.file.size,
        tag: chosenTag,
        description: docForm.description.trim() || null,
      });

      toast.success('Document Vaulted', `"${docForm.title}" uploaded to repository.`);
      setShowDocModal(false);
      setDocForm({ title: '', tag: 'Plan', customTag: '', description: '', file: null });
      loadDocuments();
    } catch (err) {
      toast.error('Upload Failed', err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`Permanently delete "${doc.title}" from branch archives?`)) return;
    try {
      await api.deleteGovernanceDocument(doc.id);
      toast.success('Document Deleted', 'Document file queued for deletion.');
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 4: Excom Actions
  // ---------------------------------------------------------------------------
  const handleAppointExcomMember = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      toast.error('Validation Error', 'Please search and select a candidate.');
      return;
    }

    setAppointing(true);
    try {
      await api.assignExcomMember({
        userId: selectedCandidate.id,
        position: appointForm.position === 'custom' ? (appointForm.customTitle.trim() || 'officer') : appointForm.position,
        customTitle: appointForm.position === 'custom' ? appointForm.customTitle.trim() : null,
      });

      toast.success('Officer Appointed', `${selectedCandidate.name} assigned to leadership.`);
      setShowAppointModal(false);
      setSelectedCandidate(null);
      setCandidateQuery('');
      setCandidateResults([]);
      setAppointForm({ position: 'vice_chairman', customTitle: '' });
      loadExcom();
    } catch (err) {
      toast.error('Appointment Failed', err.message);
    } finally {
      setAppointing(false);
    }
  };

  const handleRemoveExcomMember = async (member) => {
    const displayName = member.user?.name || member.userName || member.name || 'Officer';
    if (!window.confirm(`Remove ${displayName} from Excom leadership?`)) return;
    try {
      await api.removeExcomMember(member.id);
      toast.success('Appointment Removed', `${displayName} removed from Excom.`);
      setExcomMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      toast.error('Removal Failed', err.message);
    }
  };

  // Helpers
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  // ---------------------------------------------------------------------------
  // Render Tab Content
  // ---------------------------------------------------------------------------
  return (
    <div style={{ marginTop: 'var(--space-6)' }}>
      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: BOARD KANBAN TASKS */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'kanban' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Strategic Objectives Board</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                High-level strategic objectives tasks across the branch executive board.
              </p>
            </div>
            <button
              type="button"
              id="btn-exec-create-task"
              onClick={() => {
                setEditingTask(null);
                setTaskForm({ title: '', description: '', priority: 'medium', assigneeUserId: '', dueDate: '' });
                setShowTaskModal(true);
              }}
              className="workspace-btn-primary"
            >
              <Plus size={16} />
              <span>New Strategic Task</span>
            </button>
          </div>

          {loadingTasks ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
              <Loader2 size={32} className="spinner" color="var(--color-primary)" />
            </div>
          ) : (
            <section className="workspace-kanban-board" aria-label="Executive Strategic Objectives Kanban">
              {/* COLUMN 1: TO DO */}
              <div
                className={`workspace-kanban-column ${dragOverColumn === 'todo' ? 'workspace-kanban-column--drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'todo')}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, 'todo')}
              >
                <div className="workspace-kanban-column__header">
                  <div className="workspace-kanban-column__title-wrap">
                    <span className="workspace-kanban-column__dot workspace-kanban-column__dot--todo" />
                    <h3 className="workspace-kanban-column__title">To Do</h3>
                  </div>
                  <span className="workspace-kanban-column__count">{todoTasks.length}</span>
                </div>

                <div className="workspace-kanban-column__body">
                  {todoTasks.map((task) => renderTaskCard(task))}
                  {todoTasks.length === 0 && (
                    <div className="workspace-empty-dropzone">
                      <ListTodo size={24} />
                      <p>Drop tasks here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 2: IN PROGRESS */}
              <div
                className={`workspace-kanban-column ${dragOverColumn === 'in_progress' ? 'workspace-kanban-column--drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'in_progress')}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, 'in_progress')}
              >
                <div className="workspace-kanban-column__header">
                  <div className="workspace-kanban-column__title-wrap">
                    <span className="workspace-kanban-column__dot workspace-kanban-column__dot--in-progress" />
                    <h3 className="workspace-kanban-column__title">In Progress</h3>
                  </div>
                  <span className="workspace-kanban-column__count">{inProgressTasks.length}</span>
                </div>

                <div className="workspace-kanban-column__body">
                  {inProgressTasks.map((task) => renderTaskCard(task))}
                  {inProgressTasks.length === 0 && (
                    <div className="workspace-empty-dropzone">
                      <Clock size={24} />
                      <p>Drop tasks in progress</p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 3: DONE */}
              <div
                className={`workspace-kanban-column ${dragOverColumn === 'done' ? 'workspace-kanban-column--drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'done')}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, 'done')}
              >
                <div className="workspace-kanban-column__header">
                  <div className="workspace-kanban-column__title-wrap">
                    <span className="workspace-kanban-column__dot workspace-kanban-column__dot--done" />
                    <h3 className="workspace-kanban-column__title">Done</h3>
                  </div>
                  <span className="workspace-kanban-column__count">{doneTasks.length}</span>
                </div>

                <div className="workspace-kanban-column__body">
                  {doneTasks.map((task) => renderTaskCard(task))}
                  {doneTasks.length === 0 && (
                    <div className="workspace-empty-dropzone">
                      <CheckCircle2 size={24} />
                      <p>Drop completed tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: HEALTH COCKPIT */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'cockpit' && (
        <div>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Executive Health Cockpit</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Real-time branch operational analytics across committees, task velocity, and recruitment health.
            </p>
          </div>

          {loadingCockpit ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
              <Loader2 size={32} className="spinner" color="var(--color-primary)" />
            </div>
          ) : cockpitData ? (
            <div>
              {/* KPI Summary Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-8)',
                }}
              >
                <div className="bento-card" style={{ padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Task Completion</span>
                    <TrendingUp size={18} color="var(--color-primary)" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{(cockpitData.kpis?.completionRate ?? cockpitData.masterStats?.completionRate ?? 0)}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                    {(cockpitData.kpis?.completedTasks ?? cockpitData.masterStats?.completedTasks ?? 0)} of {(cockpitData.kpis?.totalTasks ?? cockpitData.masterStats?.totalTasks ?? 0)} tasks done
                  </div>
                </div>

                <div className="bento-card" style={{ padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active In-Flight Tasks</span>
                    <ListTodo size={18} color="var(--color-primary)" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{(cockpitData.kpis?.inProgressTasks ?? cockpitData.masterStats?.inProgressTasks ?? 0)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                    {(cockpitData.kpis?.todoTasks ?? cockpitData.masterStats?.todoTasks ?? 0)} pending in backlog
                  </div>
                </div>

                <div className="bento-card" style={{ padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Team Members</span>
                    <Users size={18} color="var(--color-primary)" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{(cockpitData.kpis?.totalMembers ?? cockpitData.masterStats?.totalMembers ?? 0)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                    Across all 8 branch committees
                  </div>
                </div>

                <div className="bento-card" style={{ padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Recruitment Pipeline</span>
                    <Activity size={18} color="var(--color-primary)" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{(cockpitData.kpis?.activeApplicants ?? cockpitData.masterStats?.activeApplicants ?? 0)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                    Applicants in review
                  </div>
                </div>
              </div>

              {/* Committee Breakdown Cards */}
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Committees Breakdown</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--space-5)',
                }}
              >
                {(cockpitData.committees || []).map((comm) => {
                  const commTotalTasks = comm.tasks?.total ?? comm.totalTasks ?? 0;
                  const commDoneTasks = comm.tasks?.done ?? comm.doneTasks ?? 0;
                  const compRate = comm.tasks?.completionRate ?? (commTotalTasks > 0 ? Math.round((commDoneTasks / commTotalTasks) * 100) : 0);
                  const leadObj = comm.lead;
                  const leadName = leadObj?.name || comm.leadName || 'Unassigned';
                  const leadAvatar = leadObj?.avatarUrl || comm.leadAvatarUrl;

                  return (
                    <div key={comm.id} className="bento-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                          <div>
                            <span className="badge badge-primary" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                              {comm.slug}
                            </span>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{comm.name}</h4>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {comm.memberCount} members
                          </span>
                        </div>

                        {/* Appointed Lead - resolved accurately */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-4)' }}>
                          {leadAvatar ? (
                            <img src={leadAvatar} alt={leadName} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary-light, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                              {leadName.charAt(0)}
                            </div>
                          )}
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                            Lead: <strong>{leadName}</strong>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                            <span>Progress</span>
                            <span>{commDoneTasks}/{commTotalTasks} tasks ({compRate}%)</span>
                          </div>
                          <div style={{ height: '6px', width: '100%', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${compRate}%`,
                                background: compRate === 100 ? '#10B981' : 'var(--color-primary)',
                                borderRadius: '999px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Inspect Button */}
                      <button
                        type="button"
                        onClick={() => onSwitchWorkspace && onSwitchWorkspace(comm.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', gap: '0.35rem', marginTop: 'var(--space-3)' }}
                      >
                        <span>Inspect Workspace</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: GOVERNANCE VAULT (Matching Committee Resources UI) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'vault' && (
        <section className="workspace-resources-section" aria-label="Governance Vault Documents">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Governance Vault & Legal Library</h2>
              <p className="workspace-section-subtitle">
                Official repository for branch plan, university approvals, budgets, proposals, and guidelines.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDocForm({ title: '', tag: 'Plan', customTag: '', description: '', file: null });
                setShowDocModal(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <Plus size={15} />
              <span>Upload Document</span>
            </button>
          </div>

          {/* Search and Tag Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
                placeholder="Search archive by title or description..."
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {TAG_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setDocTagFilter(tag);
                    setTimeout(loadDocuments, 50);
                  }}
                  className={`btn btn-sm ${docTagFilter === tag ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-pill)', padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {loadingDocs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
              <Loader2 size={32} className="spinner" color="var(--color-primary)" />
            </div>
          ) : documents.length === 0 ? (
            <div className="workspace-empty-dropzone" style={{ padding: '3.5rem 1.5rem' }}>
              <FolderDown size={32} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                No Documents in Vault
              </h3>
              <p>Upload branch plan, approvals, or balance sheets to build the repository.</p>
            </div>
          ) : (
            <div className="workspace-resources-grid">
              {documents.map((doc) => (
                <div key={doc.id} className="workspace-resource-card">
                  <div className="workspace-resource-card__header">
                    <div className="workspace-resource-card__icon">
                      <FileText size={18} />
                    </div>
                    <span className="badge badge-outline" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {doc.tag || 'Plan'}
                    </span>
                  </div>

                  <div className="workspace-resource-card__body">
                    <h4 className="workspace-resource-card__title">{doc.title}</h4>
                    {doc.description && (
                      <p className="workspace-resource-card__desc">{doc.description}</p>
                    )}
                  </div>

                  <div className="workspace-resource-card__footer">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="workspace-resource-card__link"
                      download
                    >
                      <span>Download File</span>
                      <ExternalLink size={13} />
                    </a>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {formatBytes(doc.fileSizeBytes)} &bull; {formatDate(doc.createdAt)}
                      </span>
                      <button
                        type="button"
                        className="btn-icon-subtle"
                        title="Delete Document"
                        onClick={() => handleDeleteDocument(doc)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 4: EXCOM TEAM */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'excom' && (
        <section className="workspace-roster-section" aria-label="Executive Committee Team Directory">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Executive Committee (Excom) Team</h2>
              <p className="workspace-section-subtitle">
                Internal roster of authorized branch officers with executive governance permissions.
              </p>
            </div>

            <div className="workspace-roster-actions">
              <div className="workspace-search-bar">
                <Search size={16} className="workspace-search-icon" />
                <input
                  type="text"
                  placeholder="Search officers or roles..."
                  value={excomSearchQuery}
                  onChange={(e) => setExcomSearchQuery(e.target.value)}
                  className="workspace-search-input"
                />
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setCandidateQuery('');
                    setCandidateResults([]);
                    setAppointForm({ position: 'vice_chairman', customTitle: '' });
                    setShowAppointModal(true);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.35rem' }}
                >
                  <UserCheck size={15} />
                  <span>Appoint Officer</span>
                </button>
              )}
            </div>
          </div>

          {loadingExcom ? (
            <div className="workspace-roster-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="dashboard-shimmer" style={{ height: '80px' }} />
              ))}
            </div>
          ) : filteredExcomMembers.length > 0 ? (
            <div className="workspace-roster-grid">
              {filteredExcomMembers.map((member) => {
                const memberName = member.user?.name || member.userName || 'Officer';
                const memberAvatar = member.user?.avatarUrl || member.userAvatarUrl;
                const memberEmail = member.user?.email || member.userEmail;
                const positionText = member.positionLabel || member.customTitle || member.position || 'Officer';

                return (
                  <div
                    key={member.id}
                    className="workspace-member-card"
                    onClick={() => setSelectedProfileUserId(member.userId)}
                    style={{ cursor: 'pointer' }}
                    title={`View ${memberName}'s profile`}
                  >
                    <div className="workspace-member-card__avatar">
                      {memberAvatar ? (
                        <img src={memberAvatar} alt={memberName} />
                      ) : (
                        <span>{memberName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="workspace-member-card__info" style={{ flex: 1, minWidth: 0 }}>
                      <div className="workspace-member-card__name-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="workspace-member-card__name">{memberName}</span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveExcomMember(member);
                            }}
                            className="btn-icon-subtle"
                            title="Revoke Officer Role"
                            style={{ color: 'var(--color-danger)', padding: '2px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                          {positionText}
                        </span>
                      </div>
                      {memberEmail && (
                        <span className="workspace-member-card__email" style={{ marginTop: '0.2rem' }}>
                          {memberEmail}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="workspace-empty-dropzone" style={{ padding: '3.5rem 1.5rem' }}>
              <Users size={32} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {excomSearchQuery ? 'No Matching Officers' : 'No Excom Officers Appointed'}
              </h3>
              <p>
                {excomSearchQuery
                  ? 'Try searching with another name or role.'
                  : isAdmin
                    ? 'Click "Appoint Officer" above to select and promote members to executive roles.'
                    : 'Officers will appear here once appointed.'}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 5: ARCHIVED STRATEGIC TASKS */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'archived' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Archived Strategic Objectives</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Historical log of completed or archived governance tasks.
              </p>
            </div>
          </div>

          {loadingArchived ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
              <Loader2 size={32} className="spinner" color="var(--color-primary)" />
            </div>
          ) : archivedTasks.length === 0 ? (
            <div className="workspace-empty-dropzone" style={{ padding: '3.5rem 1.5rem' }}>
              <Archive size={32} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                No Archived Objectives
              </h3>
              <p>Completed strategic objectives archived from the Kanban board will be recorded here.</p>
            </div>
          ) : (
            <div className="workspace-archived-list">
              {archivedTasks.map((task) => (
                <div key={task.id} className="workspace-archived-item">
                  <div className="workspace-archived-item__content">
                    <h4 className="workspace-archived-item__title">{task.title}</h4>
                    {task.description && <p className="workspace-archived-item__desc">{task.description}</p>}
                    <div className="workspace-archived-item__meta">
                      <span>Status: <strong>{task.status?.toUpperCase()}</strong></span>
                      &bull;
                      <span>Priority: <strong>{task.priority?.toUpperCase()}</strong></span>
                      &bull;
                      <span>Assignee: {task.assigneeName || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="workspace-archived-item__actions">
                    <button
                      type="button"
                      onClick={() => handleToggleArchiveTask(task, false)}
                      className="btn btn-outline btn-xs"
                      style={{ gap: '0.35rem' }}
                    >
                      <RotateCcw size={12} />
                      <span>Restore to Board</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="btn btn-danger btn-xs"
                      title="Permanently delete"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* Modal 1: New / Edit Strategic Objective Modal */}
      {/* ================================================================= */}
      {showTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {editingTask ? 'Edit Strategic Objective' : 'New Strategic Objective'}
              </h3>
              <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-icon btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Objective Title *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="e.g., Finalize Region 8 Annual Branch Report"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Key milestones, deliverables, or background details..."
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="form-input"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Priority</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select
                    value={taskForm.assigneeUserId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeUserId: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Unassigned (Open for Claim)</option>
                    {excomMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name || m.userName || 'Officer'} ({m.positionLabel || m.customTitle || m.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
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
      {/* Modal 2: Strategic Task Details Modal */}
      {/* ================================================================= */}
      {selectedTaskDetails && (
        <div className="modal-backdrop" onClick={() => setSelectedTaskDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`workspace-task-card__priority-badge workspace-task-card__priority-badge--${(selectedTaskDetails.priority || 'medium').toLowerCase()}`}>
                  {(selectedTaskDetails.priority || 'medium').toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Status: <strong>{selectedTaskDetails.status?.replace('_', ' ').toUpperCase()}</strong>
                </span>
              </div>
              <button type="button" onClick={() => setSelectedTaskDetails(null)} className="btn btn-icon btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                {selectedTaskDetails.title}
              </h2>

              {/* Status Transition Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-xs ${selectedTaskDetails.status === 'todo' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleMoveTaskStatus(selectedTaskDetails, 'todo')}
                >
                  To Do
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${selectedTaskDetails.status === 'in_progress' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleMoveTaskStatus(selectedTaskDetails, 'in_progress')}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${selectedTaskDetails.status === 'done' ? 'btn-success' : 'btn-outline'}`}
                  onClick={() => handleMoveTaskStatus(selectedTaskDetails, 'done')}
                >
                  Done
                </button>
              </div>

              {/* Assignee Information */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: selectedTaskDetails.assigneeUserId ? 'var(--color-primary-light)' : 'var(--color-border)',
                      color: selectedTaskDetails.assigneeUserId ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                    }}
                  >
                    {!selectedTaskDetails.assigneeUserId ? '?' : (selectedTaskDetails.assigneeName || 'O').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {selectedTaskDetails.assigneeName || 'Unassigned Objective'}
                    </div>
                    {selectedTaskDetails.assigneeEmail && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {selectedTaskDetails.assigneeEmail}
                      </div>
                    )}
                  </div>
                </div>

                {!selectedTaskDetails.assigneeUserId && (
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => handleClaimTask(selectedTaskDetails)}
                  >
                    <UserPlus size={12} />
                    <span>Claim Objective</span>
                  </button>
                )}
              </div>

              {/* Due Date & Timestamp */}
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {selectedTaskDetails.dueDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} />
                    <span>Due: <strong>{formatDate(selectedTaskDetails.dueDate)}</strong></span>
                  </div>
                )}
                {selectedTaskDetails.createdAt && (
                  <div>
                    Created: {formatDate(selectedTaskDetails.createdAt)}
                  </div>
                )}
              </div>

              {/* Description Body */}
              {selectedTaskDetails.description ? (
                <div style={{ padding: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--color-text)' }}>
                  {selectedTaskDetails.description}
                </div>
              ) : (
                <div style={{ fontStyle: 'italic', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  No extra description provided for this strategic objective.
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setEditingTask(selectedTaskDetails);
                    setTaskForm({
                      title: selectedTaskDetails.title,
                      description: selectedTaskDetails.description || '',
                      priority: selectedTaskDetails.priority || 'medium',
                      assigneeUserId: selectedTaskDetails.assigneeUserId || '',
                      dueDate: selectedTaskDetails.dueDate ? selectedTaskDetails.dueDate.split('T')[0] : '',
                    });
                    setSelectedTaskDetails(null);
                    setShowTaskModal(true);
                  }}
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleToggleArchiveTask(selectedTaskDetails, !selectedTaskDetails.isArchived)}
                >
                  <Archive size={13} />
                  <span>{selectedTaskDetails.isArchived ? 'Restore' : 'Archive'}</span>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteTask(selectedTaskDetails.id)}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* Modal 3: Vault Document */}
      {/* ================================================================= */}
      {showDocModal && (
        <div className="modal-backdrop" onClick={() => !uploadingDoc && setShowDocModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Vault Governance Document</h3>
              {!uploadingDoc && (
                <button type="button" onClick={() => setShowDocModal(false)} className="btn btn-icon btn-sm">
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleUploadDocument}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="e.g., IEEE Menoufia Plan 2025/2026"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category / Tag</label>
                  <select
                    value={docForm.tag}
                    onChange={(e) => setDocForm({ ...docForm, tag: e.target.value })}
                    className="form-input"
                  >
                    {TAG_SUGGESTIONS.filter((t) => t !== 'All').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {docForm.tag === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Custom Tag Name</label>
                    <input
                      type="text"
                      value={docForm.customTag}
                      onChange={(e) => setDocForm({ ...docForm, customTag: e.target.value })}
                      placeholder="e.g., Regional Approval"
                      className="form-input"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={docForm.description}
                    onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                    placeholder="Summary of this document's purpose..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">File (PDF, DOCX, XLSX, ZIP up to 10MB) *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] })}
                    className="form-input"
                    style={{ padding: 'var(--space-2)' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowDocModal(false)} disabled={uploadingDoc} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={uploadingDoc} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                  {uploadingDoc ? <Loader2 size={16} className="spinner" /> : <UploadCloud size={16} />}
                  <span>{uploadingDoc ? 'Uploading...' : 'Vault Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* Modal 4: Appoint Excom Officer (with HR Studio search pattern) */}
      {/* ================================================================= */}
      {showAppointModal && isAdmin && (
        <div className="modal-backdrop" onClick={() => !appointing && setShowAppointModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="var(--color-primary)" />
                <span>Appoint Branch Officer</span>
              </h3>
              {!appointing && (
                <button type="button" onClick={() => setShowAppointModal(false)} className="btn btn-icon btn-sm">
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleAppointExcomMember}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Search Registered Portal Users (HR Studio style) */}
                <div className="form-group">
                  <label className="form-label">Search Registered Portal Users *</label>
                  <div className="hr-search-wrap">
                    <Search size={15} />
                    <input
                      className="hr-search-input"
                      placeholder="Type name or email to search candidates..."
                      value={candidateQuery}
                      onChange={(e) => setCandidateQuery(e.target.value)}
                    />
                  </div>

                  {searchingCandidates && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      <Loader2 size={16} className="spinner" style={{ display: 'inline', marginRight: 4 }} /> Searching candidates...
                    </div>
                  )}

                  {candidateResults.length > 0 && (
                    <div className="user-picker-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {candidateResults.map((u) => {
                        const isSelected = selectedCandidate?.id === u.id;
                        return (
                          <div
                            key={u.id}
                            className={`user-picker-item ${isSelected ? 'user-picker-item--selected' : ''}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCandidate(null);
                              } else {
                                setSelectedCandidate(u);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {isSelected ? (
                              <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} />
                            ) : (
                              <Square size={16} style={{ color: 'var(--color-text-subtle)' }} />
                            )}
                            <div>
                              <div className="user-picker-item__name">{u.name}</div>
                              <div className="user-picker-item__email">{u.email}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedCandidate && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                        Selected Candidate:
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                        }}
                      >
                        <span>{selectedCandidate.name} ({selectedCandidate.email})</span>
                        <X size={13} style={{ cursor: 'pointer' }} onClick={() => setSelectedCandidate(null)} />
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Position / Executive Role *</label>
                  <select
                    value={appointForm.position}
                    onChange={(e) => setAppointForm({ ...appointForm, position: e.target.value })}
                    className="form-input"
                  >
                    {POSITION_OPTIONS.map((pos) => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
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
                      placeholder="e.g., Student Activities Chair"
                      className="form-input"
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAppointModal(false)} disabled={appointing} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appointing || !selectedCandidate}
                  className="btn btn-primary"
                  style={{ gap: '0.4rem' }}
                >
                  {appointing && <Loader2 size={16} className="spinner" />}
                  <span>{appointing ? 'Appointing...' : 'Confirm Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Quick-View Modal */}
      <UserProfileModal
        userId={selectedProfileUserId}
        isOpen={Boolean(selectedProfileUserId)}
        onClose={() => setSelectedProfileUserId(null)}
      />
    </div>
  );

  // ---------------------------------------------------------------------------
  // Helper: Render Task Card matching Workspace.jsx exactly
  // ---------------------------------------------------------------------------
  function renderTaskCard(task) {
    const priority = (task.priority || 'medium').toLowerCase();
    const isUnassigned = !task.assigneeUserId;
    const assigneeName = isUnassigned ? null : (task.assigneeName || 'Officer');

    return (
      <div
        key={task.id}
        className="workspace-task-card"
        draggable={true}
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={() => setSelectedTaskDetails(task)}
      >
        <div className="workspace-task-card__header">
          <span className={`workspace-task-card__priority-badge workspace-task-card__priority-badge--${priority}`}>
            {priority.toUpperCase()}
          </span>
          {task.dueDate ? (
            <span className="workspace-task-card__due">
              <Calendar size={12} />
              {formatDate(task.dueDate)}
            </span>
          ) : null}
        </div>

        <h4 className="workspace-task-card__title">{task.title}</h4>
        {task.description && <p className="workspace-task-card__desc">{task.description}</p>}

        <div className="workspace-task-card__footer" onClick={(e) => e.stopPropagation()}>
          <div className="workspace-task-card__assignee">
            <div
              className="workspace-task-card__avatar"
              style={isUnassigned ? { background: 'var(--color-border)', color: 'var(--color-text-muted)' } : undefined}
            >
              {isUnassigned ? '?' : assigneeName.charAt(0).toUpperCase()}
            </div>
            <span
              className="workspace-task-card__assignee-name"
              style={isUnassigned ? { fontStyle: 'italic', color: 'var(--color-text-muted)' } : undefined}
            >
              {isUnassigned ? 'Unassigned' : assigneeName}
            </span>
          </div>

          <div className="workspace-task-card__actions">
            {isUnassigned ? (
              <button
                type="button"
                className="workspace-task-card__btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                onClick={() => handleClaimTask(task)}
                title="Claim this strategic objective"
              >
                <UserPlus size={12} />
                <span>Claim</span>
              </button>
            ) : null}

            {task.status !== 'todo' && (
              <button
                type="button"
                className="workspace-task-card__btn"
                title="Move to previous stage"
                onClick={() => handleMoveTaskStatus(task, task.status === 'done' ? 'in_progress' : 'todo')}
              >
                <ArrowLeft size={12} />
              </button>
            )}

            {task.status !== 'done' && (
              <button
                type="button"
                className="workspace-task-card__btn"
                title="Advance to next stage"
                onClick={() => handleMoveTaskStatus(task, task.status === 'todo' ? 'in_progress' : 'done')}
              >
                <ArrowRight size={12} />
              </button>
            )}

            <button
              type="button"
              className="workspace-task-card__btn"
              title="Edit objective"
              onClick={() => {
                setEditingTask(task);
                setTaskForm({
                  title: task.title,
                  description: task.description || '',
                  priority: task.priority || 'medium',
                  assigneeUserId: task.assigneeUserId || '',
                  dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                });
                setShowTaskModal(true);
              }}
            >
              <Edit3 size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }
}
