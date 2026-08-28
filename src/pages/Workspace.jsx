import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ListTodo,
  FolderDown,
  Users,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  ExternalLink,
  X,
  FileText,
  Building,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Check,
  Archive,
  Trash2,
  Edit3,
  UploadCloud,
  Link2,
  Search,
  Shield,
  User,
  FileDown,
  Loader2,
  Lock,
  Eye,
  Info,
  CalendarClock,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import '../styles/workspace.css';

export default function Workspace() {
  const { user, updateUser } = useAuthStore();
  const toast = useToastStore();

  // Navigation tabs: 'kanban' | 'archived' | 'resources' | 'roster'
  const [activeTab, setActiveTab] = useState('kanban');
  const [workspaceData, setWorkspaceData] = useState(null);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Drag and Drop state
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Modals state
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [deletingResourceId, setDeletingResourceId] = useState(null);

  // Task Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Resource Form state (Dual-Mode: 'file' | 'link')
  const [resourceMode, setResourceMode] = useState('file'); // 'file' | 'link'
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingResource, setSavingResource] = useState(false);

  // Roster Search state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Active committee ID resolution
  const activeCommitteeId = user?.committeeId || (user?.scopeType === 'committee' ? user?.scopeId : null);
  const isLead =
    user?.role === 'lead' ||
    user?.role === 'admin' ||
    user?.role === 'officer' ||
    workspaceData?.committee?.myRole === 'lead';

  // Permission helper: Check if the current user is allowed to move / update a given task
  const canMoveTask = (task) => {
    if (!task) return false;
    if (isLead) return true;
    const myId = user?.id || user?.userRefId || user?.externalUserId;
    const taskAssignee = task.assigneeUserId || task.assignee_user_id;
    return !!(taskAssignee && myId && taskAssignee === myId);
  };

  const fetchWorkspace = async (cid) => {
    if (!cid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getCommitteeWorkspace(cid, { isArchived: false });
      setWorkspaceData(data);
    } catch (err) {
      console.error('Failed to load workspace:', err);
      toast.error('Workspace Error', err.message || 'Could not load committee workspace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedTasks = async (cid) => {
    if (!cid) return;
    try {
      setLoadingArchived(true);
      const data = await api.getCommitteeWorkspace(cid, { isArchived: true });
      const raw = data?.tasks;
      const items = Array.isArray(raw) ? raw : (raw?.items || []);
      setArchivedTasks(items);
    } catch (err) {
      console.error('Failed to load archived tasks:', err);
    } finally {
      setLoadingArchived(false);
    }
  };

  const fetchRoster = async (cid, query = '') => {
    if (!cid) return;
    try {
      setLoadingRoster(true);
      const data = query.trim()
        ? await api.getCommitteeMembers(cid, { search: query.trim() })
        : await api.getCommitteeMemberships(cid);
      setMemberships(data.memberships || data.members || []);
    } catch (err) {
      console.error('Failed to load committee team:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (activeCommitteeId) {
      fetchWorkspace(activeCommitteeId);
      fetchRoster(activeCommitteeId);
    } else {
      setLoading(false);
    }
  }, [activeCommitteeId]);

  useEffect(() => {
    if (activeTab === 'archived' && activeCommitteeId) {
      fetchArchivedTasks(activeCommitteeId);
    }
  }, [activeTab, activeCommitteeId]);

  // Handle Roster Search
  const handleSearchMembers = (e) => {
    const q = e.target.value;
    setMemberSearchQuery(q);
    fetchRoster(activeCommitteeId, q);
  };

  // Safe extraction of tasks array
  const rawTasks = workspaceData?.tasks;
  const allTasks = Array.isArray(rawTasks) ? rawTasks : (rawTasks?.items || []);
  const committee = workspaceData?.committee || {};
  const resources = workspaceData?.resources || [];

  const todoTasks = allTasks.filter((t) => (t.status || 'todo') === 'todo');
  const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress');
  const doneTasks = allTasks.filter((t) => t.status === 'done');

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (!canMoveTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnStatus) {
      setDragOverColumn(columnStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    if (!canMoveTask(task)) {
      toast.error('Permission Denied', 'You can only update tasks assigned to you.');
      return;
    }

    await handleUpdateTaskStatus(taskId, targetStatus);
  };

  // Update Task Status (Supports bi-directional transitions for assignees & leads)
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    const currentTask = allTasks.find((t) => t.id === taskId);
    if (currentTask && !canMoveTask(currentTask)) {
      toast.error('Permission Denied', 'You can only update tasks assigned to you.');
      return;
    }

    // Optimistic UI Update
    setWorkspaceData((prev) => {
      if (!prev) return prev;
      const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
      const updatedTasks = currentTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
      return { ...prev, tasks: updatedTasks };
    });

    if (selectedTaskDetails && selectedTaskDetails.id === taskId) {
      setSelectedTaskDetails((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      await api.updateTaskStatus({ taskId, status: newStatus });
      toast.success('Task Status Updated', `Task moved to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      // Revert optimistic update
      fetchWorkspace(activeCommitteeId);
      toast.error('Status Update Failed', err.message || 'Could not update task status.');
    }
  };

  // Create Task Form Submit
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error('Validation Error', 'Task title is required.');
      return;
    }
    if (!taskAssigneeId) {
      toast.error('Validation Error', 'Please select an assignee from the committee team.');
      return;
    }

    setSavingTask(true);
    try {
      const res = await api.createTask({
        committeeId: activeCommitteeId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        assigneeUserId: taskAssigneeId,
        dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      });

      const assigneeObj = memberships.find((m) => (m.externalUserId || m.id) === taskAssigneeId);
      const newTask = {
        id: res.task?.id || `task_${Date.now()}`,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        isArchived: false,
        status: 'todo',
        dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        due_at: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        assigneeUserId: taskAssigneeId,
        assigneeName: assigneeObj?.name || 'Assigned Member',
        assignee_name: assigneeObj?.name || 'Assigned Member',
        assigneeEmail: assigneeObj?.email || '',
        created_at: new Date().toISOString(),
      };

      setWorkspaceData((prev) => {
        const currentTasks = Array.isArray(prev?.tasks) ? prev.tasks : (prev?.tasks?.items || []);
        return {
          ...prev,
          tasks: [newTask, ...currentTasks],
        };
      });

      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setTaskAssigneeId('');
      setTaskDueDate('');
      setCreateTaskModalOpen(false);
      toast.success('Task Created', 'New task assigned successfully.');
    } catch (err) {
      toast.error('Create Task Failed', err.message || 'Could not create task.');
    } finally {
      setSavingTask(false);
    }
  };

  // Open Edit Task Modal
  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title || '');
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority || 'medium');
    setTaskAssigneeId(task.assigneeUserId || '');
    setTaskDueDate(task.dueAt || task.due_date || '');
    setEditTaskModalOpen(true);
    if (selectedTaskDetails) {
      setSelectedTaskDetails(null);
    }
  };

  // Submit Edit Task
  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    setSavingTask(true);
    try {
      const res = await api.updateTask(editingTask.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        assigneeUserId: taskAssigneeId || undefined,
        dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      });

      // Update in active workspace data
      setWorkspaceData((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
        const updatedTasks = currentTasks.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: taskTitle.trim(),
                description: taskDescription.trim() || null,
                priority: taskPriority,
                assigneeUserId: taskAssigneeId || t.assigneeUserId,
                dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : null,
                due_at: taskDueDate ? new Date(taskDueDate).toISOString() : null,
              }
            : t
        );
        return { ...prev, tasks: updatedTasks };
      });

      setEditTaskModalOpen(false);
      setEditingTask(null);
      toast.success('Task Updated', 'Task details updated successfully.');
    } catch (err) {
      toast.error('Edit Failed', err.message || 'Could not update task.');
    } finally {
      setSavingTask(false);
    }
  };

  // Archive / Restore Task
  const handleToggleArchiveTask = async (taskId, shouldArchive = true) => {
    try {
      await api.archiveTask({ taskId, isArchived: shouldArchive });
      toast.success(
        shouldArchive ? 'Task Archived' : 'Task Restored',
        shouldArchive ? 'Task moved to archive.' : 'Task returned to active board.'
      );

      if (selectedTaskDetails && selectedTaskDetails.id === taskId) {
        setSelectedTaskDetails(null);
      }

      if (shouldArchive) {
        // Remove from active board
        setWorkspaceData((prev) => {
          if (!prev) return prev;
          const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
          return { ...prev, tasks: currentTasks.filter((t) => t.id !== taskId) };
        });
      } else {
        // Restore to board
        setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId));
        fetchWorkspace(activeCommitteeId);
      }
    } catch (err) {
      toast.error('Archive Failed', err.message || 'Could not archive/restore task.');
    }
  };

  // Open Delete Confirm
  const handleOpenDeleteConfirm = (taskId) => {
    setDeletingTaskId(taskId);
    setDeleteConfirmModalOpen(true);
    if (selectedTaskDetails) {
      setSelectedTaskDetails(null);
    }
  };

  // Confirm Delete Task
  const handleConfirmDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      await api.deleteTask(deletingTaskId);
      setWorkspaceData((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
        return { ...prev, tasks: currentTasks.filter((t) => t.id !== deletingTaskId) };
      });
      setArchivedTasks((prev) => prev.filter((t) => t.id !== deletingTaskId));
      setDeleteConfirmModalOpen(false);
      setDeletingTaskId(null);
      toast.success('Task Deleted', 'Task permanently removed.');
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete task.');
    }
  };

  // Add Resource Form Submit (Dual-Mode: Cloudinary upload vs External link)
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resourceTitle.trim()) {
      toast.error('Validation Error', 'Resource title is required.');
      return;
    }

    setSavingResource(true);
    try {
      let finalUrl = resourceUrl.trim();
      let resType = resourceMode;

      if (resourceMode === 'file') {
        if (!selectedFile) {
          toast.error('Validation Error', 'Please choose a document or file to upload.');
          setSavingResource(false);
          return;
        }
        setUploadingFile(true);
        const uploaded = await api.uploadDirectToCloudinary({
          file: selectedFile,
          folder: 'resources',
          purpose: 'committee_resource',
        });
        finalUrl = uploaded.secureUrl;
        setUploadingFile(false);
      } else {
        if (!resourceUrl.trim()) {
          toast.error('Validation Error', 'Please provide a valid web URL.');
          setSavingResource(false);
          return;
        }
      }

      const res = await api.createCommitteeResource({
        committeeId: activeCommitteeId,
        title: resourceTitle.trim(),
        url: finalUrl,
        resourceType: resType,
        description: resourceDesc.trim() || undefined,
      });

      setWorkspaceData((prev) => {
        if (!prev) return prev;
        const newRes = res.resource || {
          id: `res_${Date.now()}`,
          title: resourceTitle.trim(),
          url: finalUrl,
          resourceType: resType,
          description: resourceDesc.trim() || null,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          resources: [newRes, ...(prev.resources || [])],
        };
      });

      setResourceTitle('');
      setResourceUrl('');
      setResourceDesc('');
      setSelectedFile(null);
      setAddResourceModalOpen(false);
      toast.success('Resource Added', 'New resource published to repository.');
    } catch (err) {
      toast.error('Resource Error', err.message || 'Could not add resource.');
    } finally {
      setUploadingFile(false);
      setSavingResource(false);
    }
  };

  // Delete Resource Handler (for Leads)
  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.deleteCommitteeResource(activeCommitteeId, resourceId);
      setWorkspaceData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          resources: (prev.resources || []).filter((r) => r.id !== resourceId),
        };
      });
      toast.success('Resource Deleted', 'Resource removed from repository.');
    } catch (err) {
      toast.error('Delete Resource Failed', err.message || 'Could not delete resource.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'workspace-task-card__priority-badge--urgent';
      case 'high':
        return 'workspace-task-card__priority-badge--high';
      case 'medium':
        return 'workspace-task-card__priority-badge--medium';
      case 'low':
      default:
        return 'workspace-task-card__priority-badge--low';
    }
  };

  // If user is not scoped to a committee (e.g. global officer/admin viewing /workspace directly)
  if (!activeCommitteeId) {
    const committeeScopes = (user?.availableScopes || []).filter((s) => s.scopeType === 'committee');
    return (
      <div className="workspace-page">
        <div className="workspace-header">
          <div className="workspace-header__layout">
            <div className="workspace-header__identity">
              <div className="workspace-header__icon-badge">
                <Building size={32} />
              </div>
              <div>
                <h1 className="workspace-header__title">Committee Workspaces</h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.875rem' }}>
                  Select an active committee workspace to manage tasks, resources, and roster.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="workspace-picker-grid">
          {committeeScopes.map((scope) => (
            <div key={scope.scopeId} className="workspace-picker-card">
              <div className="workspace-picker-card__header">
                <div className="workspace-picker-card__icon">
                  <Layers size={22} />
                </div>
                <span className="badge badge-primary" style={{ textTransform: 'uppercase' }}>
                  {scope.role}
                </span>
              </div>
              <h3 className="workspace-picker-card__title">
                {scope.committeeName || scope.name || 'Committee Workspace'}
              </h3>
              <p className="workspace-picker-card__desc">
                Access Kanban task boards, collaborative learning repositories, and committee team.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={async () => {
                  try {
                    const switched = await api.switchContext({
                      scopeType: 'committee',
                      scopeId: scope.scopeId,
                    });
                    if (switched?.user) {
                      updateUser(switched.user);
                    }
                  } catch (err) {
                    toast.error('Context Switch Failed', err.message || 'Could not switch to committee.');
                  }
                }}
              >
                <span>Enter Workspace</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      {/* 1. WORKSPACE HEADER HERO */}
      <header className="workspace-header">
        <div className="workspace-header__layout">
          <div className="workspace-header__identity">
            <div className="workspace-header__icon-badge">
              <Layers size={30} />
            </div>
            <div>
              <h1 className="workspace-header__title">{committee.name || 'Committee Workspace'}</h1>
              <div className="workspace-header__badges">
                <span
                  className={`workspace-header__badge ${
                    isLead
                      ? 'workspace-header__badge--role-lead'
                      : 'workspace-header__badge--role-member'
                  }`}
                >
                  {isLead ? <Shield size={12} /> : <User size={12} />}
                  {isLead ? 'TEAM LEAD' : 'MEMBER'}
                </span>
                <span className="badge badge-outline" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  {workspaceData?.committee?.slug || user?.committeeSlug}
                </span>
                <span style={{ fontSize: '0.8125rem', opacity: 0.9 }}>
                  {allTasks.length} Active Tasks &bull; {resources.length} Resources
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs for Leads */}
          <div className="workspace-header__actions">
            {isLead && (
              <>
                <button
                  type="button"
                  className="workspace-btn-primary"
                  id="btn-create-task"
                  onClick={() => setCreateTaskModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>New Task</span>
                </button>

                <button
                  type="button"
                  className="workspace-btn-secondary"
                  id="btn-add-resource"
                  onClick={() => setAddResourceModalOpen(true)}
                >
                  <Plus size={15} />
                  <span>Add Resource</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. TAB NAVIGATION */}
      <nav className="workspace-tabs" aria-label="Workspace Sections">
        <button
          type="button"
          className={`workspace-tab ${activeTab === 'kanban' ? 'workspace-tab--active' : ''}`}
          onClick={() => setActiveTab('kanban')}
        >
          <ListTodo size={16} />
          <span>Task Board</span>
          <span className="workspace-tab__badge">{allTasks.length}</span>
        </button>

        <button
          type="button"
          className={`workspace-tab ${activeTab === 'archived' ? 'workspace-tab--active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          <Archive size={16} />
          <span>Archived</span>
          {archivedTasks.length > 0 && <span className="workspace-tab__badge">{archivedTasks.length}</span>}
        </button>

        <button
          type="button"
          className={`workspace-tab ${activeTab === 'resources' ? 'workspace-tab--active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <FolderDown size={16} />
          <span>Resources</span>
          <span className="workspace-tab__badge">{resources.length}</span>
        </button>

        <button
          type="button"
          className={`workspace-tab ${activeTab === 'roster' ? 'workspace-tab--active' : ''}`}
          onClick={() => setActiveTab('roster')}
        >
          <Users size={16} />
          <span>Team</span>
          <span className="workspace-tab__badge">{memberships.length}</span>
        </button>
      </nav>

      {/* 3. TAB 1: KANBAN BOARD */}
      {activeTab === 'kanban' && (
        <section className="workspace-kanban-board" aria-label="Task Management Kanban Board">
          {/* COLUMN 1: TO DO */}
          <div
            className={`workspace-kanban-column ${
              dragOverColumn === 'todo' ? 'workspace-kanban-column--drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'todo')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'todo')}
          >
            <div className="workspace-kanban-column__header">
              <div className="workspace-kanban-column__title">
                <span className="workspace-kanban-column__dot workspace-kanban-column__dot--todo" />
                <span>To Do</span>
              </div>
              <span className="workspace-kanban-column__count">{todoTasks.length}</span>
            </div>

            <div className="workspace-kanban-column__cards">
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1, 2].map((n) => (
                    <div key={n} className="dashboard-shimmer" style={{ height: '110px' }} />
                  ))}
                </div>
              ) : todoTasks.length > 0 ? (
                todoTasks.map((task) => {
                  const priority = task.priority || 'medium';
                  const dueDate = task.dueAt || task.due_at;
                  const assigneeName = task.assigneeName || task.assignee_name;
                  const isDragging = draggingTaskId === task.id;
                  const isOwnerOrLead = canMoveTask(task);
                  return (
                    <div
                      key={task.id}
                      draggable={isOwnerOrLead}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => setDraggingTaskId(null)}
                      onClick={() => setSelectedTaskDetails(task)}
                      className={`workspace-task-card workspace-task-card--priority-${priority} ${
                        isDragging ? 'workspace-task-card--dragging' : ''
                      } ${!isOwnerOrLead ? 'workspace-task-card--view-only' : ''}`}
                    >
                      <div className="workspace-task-card__top">
                        <span className={`workspace-task-card__priority-badge ${getPriorityBadgeClass(priority)}`}>
                          {priority.toUpperCase()}
                        </span>
                        {dueDate && (
                          <span className="workspace-task-card__due">
                            <Calendar size={11} />
                            {formatDate(dueDate)}
                          </span>
                        )}
                      </div>

                      <h3 className="workspace-task-card__title">{task.title}</h3>
                      {task.description && (
                        <div className="workspace-task-card__desc">
                          {task.description}
                        </div>
                      )}

                      <div className="workspace-task-card__footer" onClick={(e) => e.stopPropagation()}>
                        <div className="workspace-task-card__assignee">
                          <div className="workspace-task-card__avatar">
                            {assigneeName ? assigneeName.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <span className="workspace-task-card__assignee-name">
                            {assigneeName || 'Assigned'}
                          </span>
                        </div>

                        <div className="workspace-task-card__actions">
                          {isOwnerOrLead ? (
                            <button
                              type="button"
                              className="workspace-task-card__btn"
                              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                            >
                              Start &rarr;
                            </button>
                          ) : (
                            <span className="workspace-task-card__locked" title="Assigned to another team member">
                              <Lock size={12} />
                            </span>
                          )}

                          {isLead && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                title="Edit Task"
                                onClick={() => handleOpenEditTask(task)}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                title="Archive Task"
                                onClick={() => handleToggleArchiveTask(task.id, true)}
                              >
                                <Archive size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="workspace-empty-dropzone">
                  <ListTodo size={24} />
                  <p>No tasks in To Do</p>
                  {isLead && (
                    <button
                      type="button"
                      onClick={() => setCreateTaskModalOpen(true)}
                      className="btn btn-ghost btn-xs"
                      style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                    >
                      + Add Task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: IN PROGRESS */}
          <div
            className={`workspace-kanban-column ${
              dragOverColumn === 'in_progress' ? 'workspace-kanban-column--drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'in_progress')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'in_progress')}
          >
            <div className="workspace-kanban-column__header">
              <div className="workspace-kanban-column__title">
                <span className="workspace-kanban-column__dot workspace-kanban-column__dot--in_progress" />
                <span>In Progress</span>
              </div>
              <span className="workspace-kanban-column__count">{inProgressTasks.length}</span>
            </div>

            <div className="workspace-kanban-column__cards">
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1].map((n) => (
                    <div key={n} className="dashboard-shimmer" style={{ height: '110px' }} />
                  ))}
                </div>
              ) : inProgressTasks.length > 0 ? (
                inProgressTasks.map((task) => {
                  const priority = task.priority || 'medium';
                  const dueDate = task.dueAt || task.due_at;
                  const assigneeName = task.assigneeName || task.assignee_name;
                  const isDragging = draggingTaskId === task.id;
                  const isOwnerOrLead = canMoveTask(task);
                  return (
                    <div
                      key={task.id}
                      draggable={isOwnerOrLead}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => setDraggingTaskId(null)}
                      onClick={() => setSelectedTaskDetails(task)}
                      className={`workspace-task-card workspace-task-card--priority-${priority} ${
                        isDragging ? 'workspace-task-card--dragging' : ''
                      } ${!isOwnerOrLead ? 'workspace-task-card--view-only' : ''}`}
                    >
                      <div className="workspace-task-card__top">
                        <span className={`workspace-task-card__priority-badge ${getPriorityBadgeClass(priority)}`}>
                          {priority.toUpperCase()}
                        </span>
                        {dueDate && (
                          <span className="workspace-task-card__due">
                            <Clock size={11} />
                            {formatDate(dueDate)}
                          </span>
                        )}
                      </div>

                      <h3 className="workspace-task-card__title">{task.title}</h3>
                      {task.description && (
                        <div className="workspace-task-card__desc">
                          {task.description}
                        </div>
                      )}

                      <div className="workspace-task-card__footer" onClick={(e) => e.stopPropagation()}>
                        <div className="workspace-task-card__assignee">
                          <div className="workspace-task-card__avatar" style={{ background: '#3b82f6' }}>
                            {assigneeName ? assigneeName.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <span className="workspace-task-card__assignee-name">
                            {assigneeName || 'Assigned'}
                          </span>
                        </div>

                        <div className="workspace-task-card__actions">
                          {isOwnerOrLead ? (
                            <>
                              <button
                                type="button"
                                className="workspace-task-card__btn"
                                style={{ background: '#10b981', color: '#fff', borderColor: '#10b981' }}
                                onClick={() => handleUpdateTaskStatus(task.id, 'done')}
                              >
                                Done ✓
                              </button>
                              <button
                                type="button"
                                className="workspace-task-card__btn"
                                title="Move back to To Do"
                                onClick={() => handleUpdateTaskStatus(task.id, 'todo')}
                              >
                                &larr;
                              </button>
                            </>
                          ) : (
                            <span className="workspace-task-card__locked" title="Assigned to another team member">
                              <Lock size={12} />
                            </span>
                          )}

                          {isLead && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                title="Edit Task"
                                onClick={() => handleOpenEditTask(task)}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                title="Archive Task"
                                onClick={() => handleToggleArchiveTask(task.id, true)}
                              >
                                <Archive size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="workspace-empty-dropzone">
                  <Play size={24} />
                  <p>Drag active tasks here</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: COMPLETED */}
          <div
            className={`workspace-kanban-column ${
              dragOverColumn === 'done' ? 'workspace-kanban-column--drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'done')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'done')}
          >
            <div className="workspace-kanban-column__header">
              <div className="workspace-kanban-column__title">
                <span className="workspace-kanban-column__dot workspace-kanban-column__dot--done" />
                <span>Completed</span>
              </div>
              <span className="workspace-kanban-column__count">{doneTasks.length}</span>
            </div>

            <div className="workspace-kanban-column__cards">
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1].map((n) => (
                    <div key={n} className="dashboard-shimmer" style={{ height: '110px' }} />
                  ))}
                </div>
              ) : doneTasks.length > 0 ? (
                doneTasks.map((task) => {
                  const dueDate = task.dueAt || task.due_at;
                  const assigneeName = task.assigneeName || task.assignee_name;
                  const isDragging = draggingTaskId === task.id;
                  const isOwnerOrLead = canMoveTask(task);
                  return (
                    <div
                      key={task.id}
                      draggable={isOwnerOrLead}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => setDraggingTaskId(null)}
                      onClick={() => setSelectedTaskDetails(task)}
                      className={`workspace-task-card workspace-task-card--priority-low ${
                        isDragging ? 'workspace-task-card--dragging' : ''
                      } ${!isOwnerOrLead ? 'workspace-task-card--view-only' : ''}`}
                      style={{ opacity: 0.9 }}
                    >
                      <div className="workspace-task-card__top">
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                          <Check size={10} /> DONE
                        </span>
                        {dueDate && (
                          <span className="workspace-task-card__due">
                            {formatDate(dueDate)}
                          </span>
                        )}
                      </div>

                      <h3 className="workspace-task-card__title" style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <div className="workspace-task-card__desc">
                          {task.description}
                        </div>
                      )}

                      <div className="workspace-task-card__footer" onClick={(e) => e.stopPropagation()}>
                        <div className="workspace-task-card__assignee">
                          <div className="workspace-task-card__avatar" style={{ background: '#10b981' }}>
                            ✓
                          </div>
                          <span className="workspace-task-card__assignee-name">
                            {assigneeName || 'Completed'}
                          </span>
                        </div>

                        <div className="workspace-task-card__actions">
                          {isOwnerOrLead ? (
                            <button
                              type="button"
                              className="workspace-task-card__btn"
                              title="Reopen Task"
                              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                            >
                              <RotateCcw size={12} />
                            </button>
                          ) : (
                            <span className="workspace-task-card__locked" title="Assigned to another team member">
                              <Lock size={12} />
                            </span>
                          )}

                          {isLead && (
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              title="Archive Completed Task"
                              onClick={() => handleToggleArchiveTask(task.id, true)}
                            >
                              <Archive size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="workspace-empty-dropzone">
                  <CheckCircle2 size={24} />
                  <p>Drop completed tasks here</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. TAB 2: ARCHIVED TASKS */}
      {activeTab === 'archived' && (
        <section className="workspace-archived-section" aria-label="Archived Tasks Repository">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Archived Tasks</h2>
              <p className="workspace-section-subtitle">
                Completed or retired tasks preserved for committee records and accountability.
              </p>
            </div>
          </div>

          {loadingArchived ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="dashboard-shimmer" style={{ height: '70px' }} />
              ))}
            </div>
          ) : archivedTasks.length > 0 ? (
            <div className="workspace-archived-list">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="workspace-archived-item"
                  onClick={() => setSelectedTaskDetails(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="workspace-archived-item__info">
                    <div className="workspace-archived-item__title-row">
                      <span className={`workspace-task-card__priority-badge ${getPriorityBadgeClass(task.priority)}`}>
                        {(task.priority || 'medium').toUpperCase()}
                      </span>
                      <h4 className="workspace-archived-item__title">{task.title}</h4>
                    </div>

                    {task.description && (
                      <p className="workspace-archived-item__desc">{task.description}</p>
                    )}

                    <div className="workspace-archived-item__meta">
                      <span>Status: <strong>{task.status?.toUpperCase()}</strong></span>
                      &bull;
                      <span>Assignee: {task.assigneeName || task.assignee_name || 'Member'}</span>
                      {task.creatorName && (
                        <>
                          &bull;
                          <span>Created by: {task.creatorName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isLead && (
                    <div className="workspace-archived-item__actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => handleToggleArchiveTask(task.id, false)}
                      >
                        <RotateCcw size={12} />
                        <span>Restore to Board</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => handleOpenDeleteConfirm(task.id)}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="workspace-empty-dropzone" style={{ padding: '3.5rem 1.5rem' }}>
              <Archive size={32} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>No Archived Tasks</h3>
              <p>Tasks archived by committee leads will appear here for historical reference.</p>
            </div>
          )}
        </section>
      )}

      {/* 5. TAB 3: LEARNING RESOURCES REPOSITORY */}
      {activeTab === 'resources' && (
        <section className="workspace-resources-section" aria-label="Learning Resources">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Learning & Operational Resources</h2>
              <p className="workspace-section-subtitle">
                Repository of technical docs, workshop materials, drive repositories, and references.
              </p>
            </div>
            {isLead && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setAddResourceModalOpen(true)}
              >
                <Plus size={15} />
                <span>Add Resource</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="workspace-resources-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="dashboard-shimmer" style={{ height: '140px' }} />
              ))}
            </div>
          ) : resources.length > 0 ? (
            <div className="workspace-resources-grid">
              {resources.map((res) => {
                const isFile = res.resourceType === 'file' || res.resource_type === 'file';
                return (
                  <div key={res.id} className="workspace-resource-card">
                    <div className="workspace-resource-card__header">
                      <div className={`workspace-resource-card__icon ${isFile ? 'workspace-resource-card__icon--file' : 'workspace-resource-card__icon--link'}`}>
                        {isFile ? <FileText size={20} /> : <Link2 size={20} />}
                      </div>
                      <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                        {isFile ? 'FILE' : 'WEB LINK'}
                      </span>
                    </div>

                    <h3 className="workspace-resource-card__title">{res.title}</h3>
                    {res.description && (
                      <p className="workspace-resource-card__desc">{res.description}</p>
                    )}

                    <div className="workspace-resource-card__footer">
                      <span className="workspace-resource-card__date">
                        {formatDate(res.createdAt || res.created_at)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="workspace-resource-card__link"
                        >
                          <span>{isFile ? 'Download' : 'Open Link'}</span>
                          {isFile ? <FileDown size={13} /> : <ExternalLink size={13} />}
                        </a>
                        {isLead && (
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            title="Delete Resource"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteResource(res.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="workspace-empty-dropzone" style={{ padding: '3.5rem 1.5rem' }}>
              <FolderDown size={32} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                No Resources Uploaded Yet
              </h3>
              <p>Committee leads can upload training materials, drive links, and project repositories.</p>
              {isLead && (
                <button
                  type="button"
                  onClick={() => setAddResourceModalOpen(true)}
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '0.5rem' }}
                >
                  <Plus size={14} />
                  <span>Add First Resource</span>
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* 6. TAB 4: MEMBERS ROSTER & SEARCH */}
      {activeTab === 'roster' && (
        <section className="workspace-roster-section" aria-label="Committee Roster Directory">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Committee Members Directory</h2>
              <p className="workspace-section-subtitle">
                Official team and active contributor registry for {committee.name}.
              </p>
            </div>

            <div className="workspace-search-bar">
              <Search size={16} className="workspace-search-icon" />
              <input
                type="text"
                placeholder="Search member name, email or role..."
                value={memberSearchQuery}
                onChange={handleSearchMembers}
                className="workspace-search-input"
              />
            </div>
          </div>

          {loadingRoster ? (
            <div className="workspace-roster-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="dashboard-shimmer" style={{ height: '80px' }} />
              ))}
            </div>
          ) : memberships.length > 0 ? (
            <div className="workspace-roster-grid">
              {memberships.map((m) => {
                const memberName = m.name || m.userName || 'Member';
                const memberRole = m.roleInCommittee || m.role_in_committee || 'member';
                return (
                  <div key={m.id || m.userId} className="workspace-member-card">
                    <div className="workspace-member-card__avatar">
                      {memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="workspace-member-card__info">
                      <div className="workspace-member-card__name-wrap">
                        <span className="workspace-member-card__name">{memberName}</span>
                        {memberRole === 'lead' && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                            LEAD
                          </span>
                        )}
                      </div>
                      <span className="workspace-member-card__email">{m.email}</span>
                      {m.membershipId && (
                        <span className="workspace-member-card__mid">MID: {m.membershipId}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="workspace-empty-dropzone" style={{ padding: '3.5rem 1.5rem' }}>
              <Users size={32} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>No Members Found</h3>
              <p>Try searching with another keyword or invite members to join.</p>
            </div>
          )}
        </section>
      )}

      {/* 7. TASK DETAILS MODAL */}
      {selectedTaskDetails && (
        <div className="workspace-modal-overlay" onClick={() => setSelectedTaskDetails(null)}>
          <div className="workspace-modal workspace-modal--details" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`workspace-task-card__priority-badge ${getPriorityBadgeClass(selectedTaskDetails.priority)}`}>
                  {(selectedTaskDetails.priority || 'medium').toUpperCase()}
                </span>
                <span className="badge badge-outline" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  {selectedTaskDetails.status?.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setSelectedTaskDetails(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-modal__body">
              <h2 className="workspace-details-title">{selectedTaskDetails.title}</h2>

              {/* Status transition quick-bar */}
              {canMoveTask(selectedTaskDetails) && (
                <div className="workspace-details-status-bar">
                  <span className="workspace-details-label">Quick Status:</span>
                  <div className="workspace-details-status-btns">
                    <button
                      type="button"
                      className={`btn btn-xs ${selectedTaskDetails.status === 'todo' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => handleUpdateTaskStatus(selectedTaskDetails.id, 'todo')}
                    >
                      To Do
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${selectedTaskDetails.status === 'in_progress' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => handleUpdateTaskStatus(selectedTaskDetails.id, 'in_progress')}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${selectedTaskDetails.status === 'done' ? 'btn-success' : 'btn-outline'}`}
                      onClick={() => handleUpdateTaskStatus(selectedTaskDetails.id, 'done')}
                    >
                      Done ✓
                    </button>
                  </div>
                </div>
              )}

              {/* Assignee & Dates metadata */}
              <div className="workspace-details-meta-grid">
                <div className="workspace-details-meta-item">
                  <span className="workspace-details-label">Assignee</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <div className="workspace-task-card__avatar">
                      {(selectedTaskDetails.assigneeName || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {selectedTaskDetails.assigneeName || selectedTaskDetails.assignee_name || 'Assigned Member'}
                      </div>
                      {selectedTaskDetails.assigneeEmail && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {selectedTaskDetails.assigneeEmail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="workspace-details-meta-item">
                  <span className="workspace-details-label">Due Date</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    <Calendar size={14} />
                    <span>
                      {selectedTaskDetails.dueAt || selectedTaskDetails.due_at
                        ? new Date(selectedTaskDetails.dueAt || selectedTaskDetails.due_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No due date set'}
                    </span>
                  </div>
                </div>

                {selectedTaskDetails.creatorName && (
                  <div className="workspace-details-meta-item">
                    <span className="workspace-details-label">Created By</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem' }}>
                      {selectedTaskDetails.creatorName}
                    </div>
                  </div>
                )}

                <div className="workspace-details-meta-item">
                  <span className="workspace-details-label">Created On</span>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {formatDate(selectedTaskDetails.createdAt || selectedTaskDetails.created_at)}
                  </div>
                </div>
              </div>

              {/* Description body */}
              <div className="workspace-details-desc-section">
                <span className="workspace-details-label">Task Description</span>
                {selectedTaskDetails.description ? (
                  <div className="workspace-details-desc-box">
                    <p className="workspace-desc-text" style={{ whiteSpace: 'pre-line' }}>
                      {selectedTaskDetails.description}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    No description provided for this task.
                  </p>
                )}
              </div>
            </div>

            <div className="workspace-modal__footer">
              {isLead && (
                <div style={{ display: 'flex', gap: '0.5rem', marginRight: 'auto' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleOpenEditTask(selectedTaskDetails)}
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleToggleArchiveTask(selectedTaskDetails.id, !selectedTaskDetails.isArchived)}
                  >
                    <Archive size={14} />
                    <span>{selectedTaskDetails.isArchived ? 'Restore' : 'Archive'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleOpenDeleteConfirm(selectedTaskDetails.id)}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setSelectedTaskDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CREATE TASK MODAL */}
      {createTaskModalOpen && (
        <div className="workspace-modal-overlay" onClick={() => setCreateTaskModalOpen(false)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h2 className="workspace-modal__title">Create Committee Task</h2>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setCreateTaskModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="workspace-modal__body">
                <div className="workspace-form-group">
                  <label className="workspace-form-label">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="workspace-form-input"
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Priority Level</label>
                  <div className="workspace-priority-selector">
                    {[
                      { key: 'urgent', label: '🔴 Urgent' },
                      { key: 'high', label: '🟠 High' },
                      { key: 'medium', label: '🔵 Medium' },
                      { key: 'low', label: '⚪ Low' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setTaskPriority(p.key)}
                        className={`workspace-priority-option ${
                          taskPriority === p.key ? 'workspace-priority-option--selected' : ''
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Description / Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Provide scope, deliverables, relevant links..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="workspace-form-textarea"
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Assignee *</label>
                  <select
                    required
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="workspace-form-select"
                  >
                    <option value="">-- Select Member --</option>
                    {memberships.map((m) => (
                      <option key={m.id || m.userId || m.externalUserId} value={m.externalUserId || m.userId || m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="workspace-form-input"
                  />
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCreateTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="btn btn-primary"
                >
                  {savingTask ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. EDIT TASK MODAL */}
      {editTaskModalOpen && (
        <div className="workspace-modal-overlay" onClick={() => setEditTaskModalOpen(false)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h2 className="workspace-modal__title">Edit Task Details</h2>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setEditTaskModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditTaskSubmit}>
              <div className="workspace-modal__body">
                <div className="workspace-form-group">
                  <label className="workspace-form-label">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="workspace-form-input"
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Priority Level</label>
                  <div className="workspace-priority-selector">
                    {[
                      { key: 'urgent', label: '🔴 Urgent' },
                      { key: 'high', label: '🟠 High' },
                      { key: 'medium', label: '🔵 Medium' },
                      { key: 'low', label: '⚪ Low' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setTaskPriority(p.key)}
                        className={`workspace-priority-option ${
                          taskPriority === p.key ? 'workspace-priority-option--selected' : ''
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Description / Instructions</label>
                  <textarea
                    rows={3}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="workspace-form-textarea"
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Assignee</label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="workspace-form-select"
                  >
                    <option value="">-- Keep Current Assignee --</option>
                    {memberships.map((m) => (
                      <option key={m.id || m.userId || m.externalUserId} value={m.externalUserId || m.userId || m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate ? taskDueDate.slice(0, 10) : ''}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="workspace-form-input"
                  />
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="btn btn-primary"
                >
                  {savingTask ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. DELETE CONFIRMATION MODAL */}
      {deleteConfirmModalOpen && (
        <div className="workspace-modal-overlay" onClick={() => setDeleteConfirmModalOpen(false)}>
          <div className="workspace-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h2 className="workspace-modal__title" style={{ color: '#ef4444' }}>
                Delete Task Permanently?
              </h2>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setDeleteConfirmModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-modal__body">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                This action is irreversible. The task, its history, and associated records will be permanently deleted from the database.
              </p>
            </div>

            <div className="workspace-modal__footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteConfirmModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDeleteTask}
              >
                Yes, Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. DUAL-MODE ADD RESOURCE MODAL */}
      {addResourceModalOpen && (
        <div className="workspace-modal-overlay" onClick={() => setAddResourceModalOpen(false)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h2 className="workspace-modal__title">Add Committee Resource</h2>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setAddResourceModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="workspace-modal-tabs">
              <button
                type="button"
                className={`workspace-modal-tab ${resourceMode === 'file' ? 'workspace-modal-tab--active' : ''}`}
                onClick={() => setResourceMode('file')}
              >
                <UploadCloud size={15} />
                <span>Upload Document</span>
              </button>
              <button
                type="button"
                className={`workspace-modal-tab ${resourceMode === 'link' ? 'workspace-modal-tab--active' : ''}`}
                onClick={() => setResourceMode('link')}
              >
                <Link2 size={15} />
                <span>External Web Link</span>
              </button>
            </div>

            <form onSubmit={handleAddResource}>
              <div className="workspace-modal__body">
                <div className="workspace-form-group">
                  <label className="workspace-form-label">Resource Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI & ML Technical Workshop Guide"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    className="workspace-form-input"
                  />
                </div>

                {resourceMode === 'file' ? (
                  <div className="workspace-form-group">
                    <label className="workspace-form-label">Choose File (PDF, DOCX, ZIP, PPTX, Image) *</label>
                    <input
                      type="file"
                      required={!selectedFile}
                      onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                      className="workspace-form-input"
                    />
                    <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                      Files will be stored securely on Cloudinary CDN for instant download.
                    </span>
                  </div>
                ) : (
                  <div className="workspace-form-group">
                    <label className="workspace-form-label">Target URL (Drive, GitHub, Figma) *</label>
                    <input
                      type="url"
                      required={resourceMode === 'link'}
                      placeholder="https://drive.google.com/..."
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      className="workspace-form-input"
                    />
                  </div>
                )}

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of this resource..."
                    value={resourceDesc}
                    onChange={(e) => setResourceDesc(e.target.value)}
                    className="workspace-form-textarea"
                  />
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setAddResourceModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile || savingResource}
                  className="btn btn-primary"
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : savingResource ? (
                    'Saving...'
                  ) : (
                    'Publish Resource'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
