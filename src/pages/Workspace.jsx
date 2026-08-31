import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Bell,
  Megaphone,
  Upload,
  Send,
  Download,
  Award,
  FileCheck,
  Pin,
  PinOff,
  UserPlus,
  ShieldCheck,
  UserMinus,
  UserCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';
import { api } from '../services/api';
import '../styles/workspace.css';

export default function Workspace() {
  const { user, updateUser } = useAuthStore();
  const toast = useToastStore();
  const VALID_WORKSPACE_TABS = ['kanban', 'assignments', 'announcements', 'resources', 'roster', 'archived'];
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = VALID_WORKSPACE_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'kanban';
  const [activeTab, setActiveTabState] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (VALID_WORKSPACE_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [searchParams]);

  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newTab === 'kanban') {
          next.delete('tab');
        } else {
          next.set('tab', newTab);
        }
        return next;
      },
      { replace: true }
    );
  };
  const [workspaceData, setWorkspaceData] = useState(null);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [committeeAnnouncements, setCommitteeAnnouncements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

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
  const [editingResource, setEditingResource] = useState(null);
  const [editResourceTitle, setEditResourceTitle] = useState('');
  const [editResourceDesc, setEditResourceDesc] = useState('');
  const [savingResourceEdit, setSavingResourceEdit] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [deletingResourceId, setDeletingResourceId] = useState(null);

  // Assignment Modals state
  const [createAssignmentModalOpen, setCreateAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewingSubmissionsAssignment, setViewingSubmissionsAssignment] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Member Assignment Delivery Modal state
  const [memberDeliveryModalAssignment, setMemberDeliveryModalAssignment] = useState(null);
  const [deliveryFile, setDeliveryFile] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Assignment Form state
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentMaxPoints, setAssignmentMaxPoints] = useState(100);
  const [assignmentAttachmentFile, setAssignmentAttachmentFile] = useState(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState(null);
  const [existingAttachmentName, setExistingAttachmentName] = useState(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Announcement Modals & Form state
  const [createAnnouncementModalOpen, setCreateAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Task Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Resource Form state (Dual-Mode: 'file' | 'link')
  const [resourceMode, setResourceMode] = useState('file');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingResource, setSavingResource] = useState(false);

  // Roster Search state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // ── Modal Backdrop Dismiss Hooks ─────────────────────────────────────────
  const createAssignmentBackdrop = useBackdropDismiss(() => setCreateAssignmentModalOpen(false), {
    isOpen: createAssignmentModalOpen,
  });
  const viewSubmissionsBackdrop = useBackdropDismiss(() => setViewingSubmissionsAssignment(null), {
    isOpen: !!viewingSubmissionsAssignment,
  });
  const memberDeliveryBackdrop = useBackdropDismiss(() => setMemberDeliveryModalAssignment(null), {
    isOpen: !!memberDeliveryModalAssignment,
  });
  const createAnnouncementBackdrop = useBackdropDismiss(() => setCreateAnnouncementModalOpen(false), {
    isOpen: createAnnouncementModalOpen,
  });
  const taskDetailsBackdrop = useBackdropDismiss(() => setSelectedTaskDetails(null), {
    isOpen: !!selectedTaskDetails,
  });
  const createTaskBackdrop = useBackdropDismiss(() => setCreateTaskModalOpen(false), {
    isOpen: createTaskModalOpen,
  });
  const editTaskBackdrop = useBackdropDismiss(() => setEditTaskModalOpen(false), {
    isOpen: editTaskModalOpen,
  });
  const deleteConfirmBackdrop = useBackdropDismiss(() => setDeleteConfirmModalOpen(false), {
    isOpen: deleteConfirmModalOpen,
  });
  const addResourceBackdrop = useBackdropDismiss(() => setAddResourceModalOpen(false), {
    isOpen: addResourceModalOpen,
  });
  const editResourceBackdrop = useBackdropDismiss(() => setEditingResource(null), {
    isOpen: !!editingResource,
  });

  // Active committee ID resolution (supports query param ?committee=<id> for follow-up navigation)
  const queryCommitteeId = searchParams.get('committee') || searchParams.get('committeeId');
  const activeCommitteeId = queryCommitteeId || user?.committeeId || (user?.scopeType === 'committee' ? user?.scopeId : null);
  
  // Committee & Follow-up permissions resolution
  const isAdmin = user?.role === 'admin' || user?.availableScopes?.some((s) => s.role === 'admin');
  const isOfficer = user?.role === 'officer' || user?.availableScopes?.some((s) => s.role === 'officer');
  const isHRLead = user?.availableScopes?.some(
    (s) => (s.committeeSlug === 'hr' || s.committeeName?.toLowerCase().includes('human resource')) && s.role === 'lead'
  );
  const myRoleInCommittee = workspaceData?.committee?.myRole || user?.role;
  const isHRObserver = myRoleInCommittee === 'hr';
  const isCommitteeLead = myRoleInCommittee === 'lead';
  const isCommitteeMember = myRoleInCommittee === 'member';

  const isHR = isHRObserver || isHRLead;

  // Read-only follow-up mode is active if user is HR Observer OR (Officer / HR Lead viewing this committee without being its lead/member)
  const isReadOnlyHR =
    !isAdmin &&
    (isHRObserver || (!isCommitteeLead && !isCommitteeMember && (isHRLead || isOfficer)));

  // Committee-accurate lead detection (resolves 403 error across committees)
  const isLead = !isReadOnlyHR && (isAdmin || isCommitteeLead);
  const canManageContent = isLead || isHR || isAdmin || isOfficer;

  const canMoveTask = (task) => {
    if (isReadOnlyHR) return false;
    if (!task) return false;
    if (isLead) return true;
    const myId = user?.id || user?.userRefId || user?.externalUserId;
    const taskAssignee = task.assigneeUserId || task.assignee_user_id;
    return !!(taskAssignee && myId && taskAssignee === myId);
  };

  const hrObservers = memberships.filter((m) => m.roleInCommittee === 'hr');

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

  const fetchAssignments = async (cid) => {
    if (!cid) return;
    try {
      setLoadingAssignments(true);
      const data = await api.getCommitteeAssignments(cid);
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error('Failed to load committee assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchAnnouncements = async (cid) => {
    if (!cid) return;
    try {
      setLoadingAnnouncements(true);
      const data = await api.getCommitteeAnnouncements(cid);
      setCommitteeAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Failed to load committee announcements:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    if (activeCommitteeId) {
      fetchWorkspace(activeCommitteeId);
      fetchRoster(activeCommitteeId);
      fetchAssignments(activeCommitteeId);
      fetchAnnouncements(activeCommitteeId);
    } else {
      setLoading(false);
    }
  }, [activeCommitteeId]);

  useEffect(() => {
    if (activeTab === 'archived' && activeCommitteeId) {
      fetchArchivedTasks(activeCommitteeId);
    }
    if (activeTab === 'assignments' && activeCommitteeId) {
      fetchAssignments(activeCommitteeId);
    }
    if (activeTab === 'announcements' && activeCommitteeId) {
      fetchAnnouncements(activeCommitteeId);
    }
    if (activeTab === 'roster' && activeCommitteeId) {
      fetchRoster(activeCommitteeId);
    }
  }, [activeTab, activeCommitteeId]);

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

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    const currentTask = allTasks.find((t) => t.id === taskId);
    if (currentTask && !canMoveTask(currentTask)) {
      toast.error('Permission Denied', 'You can only update tasks assigned to you.');
      return;
    }

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

    setSavingTask(true);
    try {
      const res = await api.createTask({
        committeeId: activeCommitteeId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        assigneeUserId: taskAssigneeId || undefined,
        dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      });

      const assigneeObj = taskAssigneeId ? memberships.find((m) => (m.externalUserId || m.id) === taskAssigneeId) : null;
      const newTask = {
        id: res.task?.id || `task_${Date.now()}`,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        isArchived: false,
        status: 'todo',
        dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        due_at: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        assigneeUserId: taskAssigneeId || null,
        assigneeName: assigneeObj?.name || null,
        assignee_name: assigneeObj?.name || null,
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

      toast.success(
        'Task Created',
        taskAssigneeId ? `"${taskTitle}" assigned to ${assigneeObj?.name || 'member'}` : `"${taskTitle}" created as open task.`
      );
      setCreateTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setTaskAssigneeId('');
      setTaskDueDate('');
    } catch (err) {
      toast.error('Task Creation Failed', err.message || 'Could not create task.');
    } finally {
      setSavingTask(false);
    }
  };

  // Edit Task
  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title || '');
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority || 'medium');
    setTaskAssigneeId(task.assigneeUserId || task.assignee_user_id || '');
    setTaskDueDate(task.dueAt || task.due_at ? new Date(task.dueAt || task.due_at).toISOString().split('T')[0] : '');
    setEditTaskModalOpen(true);
    setSelectedTaskDetails(null);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    setSavingTask(true);
    try {
      await api.updateTask(editingTask.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        assigneeUserId: taskAssigneeId || null,
        dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      });

      const assigneeObj = taskAssigneeId ? memberships.find((m) => (m.externalUserId || m.id) === taskAssigneeId) : null;

      setWorkspaceData((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
        const updatedTasks = currentTasks.map((t) => {
          if (t.id === editingTask.id) {
            return {
              ...t,
              title: taskTitle.trim(),
              description: taskDescription.trim() || null,
              priority: taskPriority,
              dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : null,
              due_at: taskDueDate ? new Date(taskDueDate).toISOString() : null,
              assigneeUserId: taskAssigneeId || null,
              assigneeName: assigneeObj?.name || null,
              assignee_name: assigneeObj?.name || null,
              assigneeEmail: assigneeObj?.email || '',
            };
          }
          return t;
        });
        return { ...prev, tasks: updatedTasks };
      });

      toast.success('Task Updated', `"${taskTitle}" has been modified.`);
      setEditTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      toast.error('Update Failed', err.message || 'Could not update task.');
    } finally {
      setSavingTask(false);
    }
  };

  // Archive / Restore Task
  const handleToggleArchiveTask = async (taskId, isArchived) => {
    try {
      await api.archiveTask({ taskId, isArchived });
      toast.success(
        isArchived ? 'Task Archived' : 'Task Restored',
        isArchived ? 'Task moved to committee archive repository.' : 'Task restored to active kanban board.'
      );

      if (isArchived) {
        setWorkspaceData((prev) => {
          if (!prev) return prev;
          const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
          return { ...prev, tasks: currentTasks.filter((t) => t.id !== taskId) };
        });
        if (selectedTaskDetails?.id === taskId) {
          setSelectedTaskDetails(null);
        }
      } else {
        setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId));
        fetchWorkspace(activeCommitteeId);
      }
    } catch (err) {
      toast.error('Action Failed', err.message || 'Could not change task archive status.');
    }
  };

  // Delete Task
  const handleOpenDeleteConfirm = (taskId) => {
    setDeletingTaskId(taskId);
    setDeleteConfirmModalOpen(true);
    setSelectedTaskDetails(null);
  };

  const handleConfirmDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      await api.deleteTask(deletingTaskId);
      toast.success('Task Deleted', 'Task permanently removed.');
      setWorkspaceData((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : (prev.tasks?.items || []);
        return { ...prev, tasks: currentTasks.filter((t) => t.id !== deletingTaskId) };
      });
      setArchivedTasks((prev) => prev.filter((t) => t.id !== deletingTaskId));
      setDeleteConfirmModalOpen(false);
      setDeletingTaskId(null);
    } catch (err) {
      toast.error('Deletion Failed', err.message || 'Could not delete task.');
    }
  };

  // Resource Create
  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!resourceTitle.trim()) {
      toast.error('Validation Error', 'Resource title is required.');
      return;
    }

    setSavingResource(true);
    try {
      let finalUrl = resourceUrl.trim();
      let resType = resourceMode === 'file' ? 'document' : 'link';

      if (resourceMode === 'file') {
        if (!selectedFile) {
          toast.error('File Required', 'Please select a file to upload.');
          setSavingResource(false);
          return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast.error('File Too Large', 'Maximum resource file size is 10MB.');
          setSavingResource(false);
          return;
        }

        setUploadingFile(true);
        const uploadRes = await api.uploadDirectToCloudinary({
          file: selectedFile,
          folder: 'resources',
          purpose: 'committee_resource',
        });
        finalUrl = uploadRes.secureUrl;
        setUploadingFile(false);
      }

      await api.createCommitteeResource({
        committeeId: activeCommitteeId,
        title: resourceTitle.trim(),
        url: finalUrl,
        resourceType: resType,
        description: resourceDesc.trim() || undefined,
      });

      toast.success('Resource Added', `"${resourceTitle}" is now available to the committee.`);
      setAddResourceModalOpen(false);
      setResourceTitle('');
      setResourceUrl('');
      setResourceDesc('');
      setSelectedFile(null);
      fetchWorkspace(activeCommitteeId);
    } catch (err) {
      toast.error('Upload Failed', err.message || 'Could not add resource.');
    } finally {
      setSavingResource(false);
      setUploadingFile(false);
    }
  };

  // Resource Edit
  const handleOpenEditResource = (res) => {
    setEditingResource(res);
    setEditResourceTitle(res.title || '');
    setEditResourceDesc(res.description || '');
  };

  const handleSaveResourceEdit = async (e) => {
    e.preventDefault();
    if (!editingResource) return;
    if (!editResourceTitle.trim()) {
      toast.error('Validation Error', 'Resource title is required.');
      return;
    }

    setSavingResourceEdit(true);
    try {
      await api.updateCommitteeResource({
        committeeId: activeCommitteeId,
        resourceId: editingResource.id,
        title: editResourceTitle.trim(),
        description: editResourceDesc.trim() || null,
      });

      toast.success('Resource Updated', `"${editResourceTitle}" has been updated.`);
      setEditingResource(null);
      fetchWorkspace(activeCommitteeId);
    } catch (err) {
      toast.error('Update Failed', err.message || 'Could not update resource.');
    } finally {
      setSavingResourceEdit(false);
    }
  };

  // Claim unassigned task
  const handleClaimTask = async (taskId) => {
    try {
      await api.claimTask(taskId);
      toast.success('Task Claimed', 'You have claimed this task. It is now assigned to you.');
      fetchWorkspace(activeCommitteeId);
      if (selectedTaskDetails && selectedTaskDetails.id === taskId) {
        setSelectedTaskDetails((prev) => ({
          ...prev,
          assigneeUserId: user?.id || user?.externalUserId,
          assigneeName: user?.name,
          assigneeEmail: user?.email,
        }));
      }
    } catch (err) {
      toast.error('Claim Failed', err.message || 'Could not claim this task.');
    }
  };

  // Resource Delete
  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.deleteCommitteeResource(activeCommitteeId, resourceId);
      toast.success('Resource Deleted', 'Resource removed from committee files.');
      fetchWorkspace(activeCommitteeId);
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete resource.');
    }
  };

  // ==========================================
  // ASSIGNMENTS ACTIONS
  // ==========================================
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) {
      toast.error('Validation Error', 'Assignment title is required.');
      return;
    }

    setSavingAssignment(true);
    try {
      let attachmentUrl = undefined;
      let attachmentName = undefined;

      if (assignmentAttachmentFile) {
        if (assignmentAttachmentFile.size > 10 * 1024 * 1024) {
          toast.error('File Too Large', 'Maximum assignment attachment size is 10MB.');
          setSavingAssignment(false);
          return;
        }
        const uploadRes = await api.uploadDirectToCloudinary({
          file: assignmentAttachmentFile,
          folder: 'resources',
          purpose: 'assignment_attachment',
        });
        attachmentUrl = uploadRes.secureUrl;
        attachmentName = assignmentAttachmentFile.name;
      } else if (removeExistingAttachment) {
        attachmentUrl = null;
        attachmentName = null;
      } else if (editingAssignment) {
        attachmentUrl = existingAttachmentUrl;
        attachmentName = existingAttachmentName;
      }

      if (editingAssignment) {
        await api.updateCommitteeAssignment({
          committeeId: activeCommitteeId,
          assignmentId: editingAssignment.id,
          title: assignmentTitle.trim(),
          description: assignmentDesc.trim() || null,
          dueDate: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null,
          maxPoints: Number(assignmentMaxPoints) || 100,
          attachmentUrl,
          attachmentName,
        });
        toast.success('Assignment Updated', `"${assignmentTitle}" modified.`);
      } else {
        await api.createCommitteeAssignment({
          committeeId: activeCommitteeId,
          title: assignmentTitle.trim(),
          description: assignmentDesc.trim() || null,
          dueDate: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null,
          maxPoints: Number(assignmentMaxPoints) || 100,
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
        });
        toast.success('Assignment Published', `"${assignmentTitle}" created for team members.`);
      }

      setCreateAssignmentModalOpen(false);
      setEditingAssignment(null);
      setAssignmentTitle('');
      setAssignmentDesc('');
      setAssignmentDueDate('');
      setAssignmentMaxPoints(100);
      setAssignmentAttachmentFile(null);
      setExistingAttachmentUrl(null);
      setExistingAttachmentName(null);
      setRemoveExistingAttachment(false);
      fetchAssignments(activeCommitteeId);
    } catch (err) {
      toast.error('Assignment Error', err.message || 'Could not save assignment.');
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.deleteCommitteeAssignment(activeCommitteeId, assignmentId);
      toast.success('Assignment Deleted', 'Assignment and related submissions removed.');
      fetchAssignments(activeCommitteeId);
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete assignment.');
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    setViewingSubmissionsAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const data = await api.getAssignmentSubmissions(activeCommitteeId, assignment.id);
      setSubmissionsList(data.submissions || []);
    } catch (err) {
      toast.error('Submissions Error', err.message || 'Could not load submissions.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

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
        committeeId: activeCommitteeId,
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

  const handleMemberSubmitDelivery = async (e) => {
    e.preventDefault();
    if (!memberDeliveryModalAssignment || !deliveryFile) {
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
        committeeId: activeCommitteeId,
        assignmentId: memberDeliveryModalAssignment.id,
        fileUrl: uploadRes.secureUrl,
        fileName: deliveryFile.name,
        notes: deliveryNotes.trim() || null,
      });

      toast.success('Delivery Submitted', 'Your assignment solution has been delivered.');
      setMemberDeliveryModalAssignment(null);
      setDeliveryFile(null);
      setDeliveryNotes('');
      fetchAssignments(activeCommitteeId);
    } catch (err) {
      toast.error('Submission Failed', err.message || 'Could not deliver assignment.');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // ==========================================
  // ANNOUNCEMENTS ACTIONS
  // ==========================================
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      toast.error('Validation Error', 'Title and announcement body are required.');
      return;
    }

    setSavingAnnouncement(true);
    try {
      await api.createCommitteeAnnouncement({
        committeeId: activeCommitteeId,
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
        isPinned: announcementPinned,
      });

      toast.success('Announcement Posted', 'Broadcasted to all committee members.');
      setCreateAnnouncementModalOpen(false);
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setAnnouncementPinned(false);
      fetchAnnouncements(activeCommitteeId);
    } catch (err) {
      toast.error('Posting Failed', err.message || 'Could not create announcement.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.deleteCommitteeAnnouncement(activeCommitteeId, announcementId);
      toast.success('Announcement Deleted', 'Announcement removed from board.');
      fetchAnnouncements(activeCommitteeId);
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete announcement.');
    }
  };

  const handleTogglePinAnnouncement = async (announcementId, currentPinned) => {
    const nextPinned = !currentPinned;
    try {
      await api.toggleCommitteeAnnouncementPin({
        committeeId: activeCommitteeId,
        announcementId,
        isPinned: nextPinned,
      });
      toast.success(
        nextPinned ? 'Announcement Pinned' : 'Announcement Unpinned',
        nextPinned ? 'Announcement pinned to top of committee stream.' : 'Announcement unpinned.'
      );
      fetchAnnouncements(activeCommitteeId);
    } catch (err) {
      toast.error('Action Failed', err.message || 'Could not update pin status.');
    }
  };

  const getPriorityBadgeClass = (p) => {
    const priority = (p || 'medium').toLowerCase();
    return `workspace-task-card__priority-badge--${priority}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!activeCommitteeId && !loading) {
    return (
      <div className="workspace-picker-container">
        <div className="workspace-picker-header">
          <Layers size={36} color="var(--color-primary)" />
          <h1 className="workspace-picker-title">Select Committee Workspace</h1>
          <p className="workspace-picker-subtitle">
            Choose a committee from your available authorizations to manage tasks and resources.
          </p>
        </div>

        <div className="workspace-picker-grid">
          {(user?.availableScopes || []).map((scope) => (
            <div key={scope.id || scope.scopeId} className="workspace-picker-card">
              <div className="workspace-picker-card__icon">
                <Building size={24} />
              </div>
              <div className="workspace-picker-card__title">{scope.committeeName || scope.label}</div>
              <p className="workspace-picker-card__desc">
                Role: <strong>{scope.role.toUpperCase()}</strong> &bull; Access workspace operations
              </p>
              <button
                type="button"
                className="workspace-picker-card__btn"
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
                  className={`badge ${
                    isLead
                      ? 'badge-warning'
                      : isReadOnlyHR
                      ? 'badge-hr'
                      : 'badge-outline'
                  }`}
                >
                  {isLead ? <Shield size={12} /> : isReadOnlyHR ? <ShieldCheck size={12} /> : <User size={12} />}
                  {isLead ? 'TEAM LEAD' : isReadOnlyHR ? 'HR' : 'MEMBER'}
                </span>
                <span className="badge badge-committee" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  {workspaceData?.committee?.slug || user?.committeeSlug}
                </span>
                <span style={{ fontSize: '0.8125rem', opacity: 0.9 }}>
                  {allTasks.length} Tasks &bull; {assignments.length} Assignments &bull; {resources.length} Resources
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
                  onClick={() => setCreateAnnouncementModalOpen(true)}
                >
                  <Plus size={15} />
                  <span>Post Announcement</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HR Banner */}
      {isReadOnlyHR && (
        <div
          className="workspace-hr-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-card)',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            boxShadow: '0 4px 16px -2px rgba(124, 58, 237, 0.12)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <Eye size={16} />
            </div>
            <span>
              <strong>HR:</strong> You are viewing this workspace as HR. Task board editing is restricted to committee team members.
            </span>
          </div>
          <span
            className="badge"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
            }}
          >
            HR
          </span>
        </div>
      )}

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
          className={`workspace-tab ${activeTab === 'assignments' ? 'workspace-tab--active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FileText size={16} />
          <span>Assignments</span>
          <span className="workspace-tab__badge">{assignments.length}</span>
        </button>

        <button
          type="button"
          className={`workspace-tab ${activeTab === 'announcements' ? 'workspace-tab--active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <Megaphone size={16} />
          <span>Announcements</span>
          <span className="workspace-tab__badge">{committeeAnnouncements.length}</span>
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

        <button
          type="button"
          className={`workspace-tab ${activeTab === 'archived' ? 'workspace-tab--active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          <Archive size={16} />
          <span>Archived</span>
          {archivedTasks.length > 0 && <span className="workspace-tab__badge">{archivedTasks.length}</span>}
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
              <div className="workspace-kanban-column__title-wrap">
                <span className="workspace-kanban-column__dot workspace-kanban-column__dot--todo" />
                <h3 className="workspace-kanban-column__title">To Do</h3>
              </div>
              <span className="workspace-kanban-column__count">{todoTasks.length}</span>
            </div>

            <div className="workspace-kanban-column__body">
              {todoTasks.length > 0 ? (
                todoTasks.map((task) => {
                  const isUnassigned = !task.assigneeUserId && !task.assignee_user_id;
                  const assigneeName = isUnassigned ? null : (task.assigneeName || task.assignee_name);
                  const isOwnerOrLead = canMoveTask(task);
                  return (
                    <div
                      key={task.id}
                      className={`workspace-task-card ${!isOwnerOrLead && !isUnassigned ? 'workspace-task-card--view-only' : ''}`}
                      draggable={isOwnerOrLead}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTaskDetails(task)}
                    >
                      <div className="workspace-task-card__header">
                        <span className={`workspace-task-card__priority-badge ${getPriorityBadgeClass(task.priority)}`}>
                          {(task.priority || 'medium').toUpperCase()}
                        </span>
                        {task.dueAt || task.due_at ? (
                          <span className="workspace-task-card__due">
                            <Calendar size={12} />
                            {formatDate(task.dueAt || task.due_at)}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="workspace-task-card__title">{task.title}</h4>
                      {task.description && <p className="workspace-task-card__desc">{task.description}</p>}

                      <div className="workspace-task-card__footer" onClick={(e) => e.stopPropagation()}>
                        <div className="workspace-task-card__assignee">
                          <div className="workspace-task-card__avatar" style={isUnassigned ? { background: 'var(--color-border)', color: 'var(--color-text-muted)' } : undefined}>
                            {isUnassigned ? '?' : (assigneeName || 'M').charAt(0).toUpperCase()}
                          </div>
                          <span className="workspace-task-card__assignee-name" style={isUnassigned ? { fontStyle: 'italic', color: 'var(--color-text-muted)' } : undefined}>
                            {isUnassigned ? 'Unassigned' : (assigneeName || 'Assigned')}
                          </span>
                        </div>

                        <div className="workspace-task-card__actions">
                          {isUnassigned ? (
                            <button
                              type="button"
                              className="workspace-task-card__btn"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                              onClick={() => handleClaimTask(task.id)}
                              title="Claim this unassigned task"
                            >
                              <UserPlus size={12} />
                              <span>Claim</span>
                            </button>
                          ) : isOwnerOrLead ? (
                            <button
                              type="button"
                              className="workspace-task-card__btn workspace-task-card__btn--start"
                              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                            >
                              <Play size={12} />
                              <span>Start</span>
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
                              title="Edit Task"
                              onClick={() => handleOpenEditTask(task)}
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="workspace-empty-dropzone">
                  <ListTodo size={24} />
                  <p>Drop tasks here</p>
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
              <div className="workspace-kanban-column__title-wrap">
                <span className="workspace-kanban-column__dot workspace-kanban-column__dot--in_progress" />
                <h3 className="workspace-kanban-column__title">In Progress</h3>
              </div>
              <span className="workspace-kanban-column__count">{inProgressTasks.length}</span>
            </div>

            <div className="workspace-kanban-column__body">
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map((task) => {
                  const isUnassigned = !task.assigneeUserId && !task.assignee_user_id;
                  const assigneeName = isUnassigned ? null : (task.assigneeName || task.assignee_name);
                  const isOwnerOrLead = canMoveTask(task);
                  return (
                    <div
                      key={task.id}
                      className={`workspace-task-card ${!isOwnerOrLead && !isUnassigned ? 'workspace-task-card--view-only' : ''}`}
                      draggable={isOwnerOrLead}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTaskDetails(task)}
                    >
                      <div className="workspace-task-card__header">
                        <span className={`workspace-task-card__priority-badge ${getPriorityBadgeClass(task.priority)}`}>
                          {(task.priority || 'medium').toUpperCase()}
                        </span>
                        {task.dueAt || task.due_at ? (
                          <span className="workspace-task-card__due">
                            <Calendar size={12} />
                            {formatDate(task.dueAt || task.due_at)}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="workspace-task-card__title">{task.title}</h4>
                      {task.description && <p className="workspace-task-card__desc">{task.description}</p>}

                      <div className="workspace-task-card__footer" onClick={(e) => e.stopPropagation()}>
                        <div className="workspace-task-card__assignee">
                          <div className="workspace-task-card__avatar" style={isUnassigned ? { background: 'var(--color-border)', color: 'var(--color-text-muted)' } : undefined}>
                            {isUnassigned ? '?' : (assigneeName || 'M').charAt(0).toUpperCase()}
                          </div>
                          <span className="workspace-task-card__assignee-name" style={isUnassigned ? { fontStyle: 'italic', color: 'var(--color-text-muted)' } : undefined}>
                            {isUnassigned ? 'Unassigned' : (assigneeName || 'Assigned')}
                          </span>
                        </div>

                        <div className="workspace-task-card__actions">
                          {isUnassigned ? (
                            <button
                              type="button"
                              className="workspace-task-card__btn"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                              onClick={() => handleClaimTask(task.id)}
                              title="Claim this unassigned task"
                            >
                              <UserPlus size={12} />
                              <span>Claim</span>
                            </button>
                          ) : isOwnerOrLead ? (
                            <button
                              type="button"
                              className="workspace-task-card__btn workspace-task-card__btn--done"
                              onClick={() => handleUpdateTaskStatus(task.id, 'done')}
                            >
                              <Check size={12} />
                              <span>Done</span>
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
                              title="Edit Task"
                              onClick={() => handleOpenEditTask(task)}
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="workspace-empty-dropzone">
                  <Clock size={24} />
                  <p>Drop tasks in progress</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: DONE */}
          <div
            className={`workspace-kanban-column ${
              dragOverColumn === 'done' ? 'workspace-kanban-column--drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'done')}
            onDragLeave={handleDragLeave}
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
              {doneTasks.length > 0 ? (
                doneTasks.map((task) => {
                  const isUnassigned = !task.assigneeUserId && !task.assignee_user_id;
                  const assigneeName = isUnassigned ? null : (task.assigneeName || task.assignee_name);
                  const isOwnerOrLead = canMoveTask(task);
                  return (
                    <div
                      key={task.id}
                      className={`workspace-task-card workspace-task-card--completed ${
                        !isOwnerOrLead && !isUnassigned ? 'workspace-task-card--view-only' : ''
                      }`}
                      draggable={isOwnerOrLead}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTaskDetails(task)}
                    >
                      <div className="workspace-task-card__header">
                        <span className={`workspace-task-card__priority-badge ${getPriorityBadgeClass(task.priority)}`}>
                          {(task.priority || 'medium').toUpperCase()}
                        </span>
                        {task.dueAt || task.due_at ? (
                          <span className="workspace-task-card__due">
                            <Calendar size={12} />
                            {formatDate(task.dueAt || task.due_at)}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="workspace-task-card__title">{task.title}</h4>
                      {task.description && <p className="workspace-task-card__desc">{task.description}</p>}

                      <div className="workspace-task-card__footer" onClick={(e) => e.stopPropagation()}>
                        <div className="workspace-task-card__assignee">
                          <div className="workspace-task-card__avatar" style={isUnassigned ? { background: 'var(--color-border)', color: 'var(--color-text-muted)' } : undefined}>
                            {isUnassigned ? '?' : (assigneeName || 'M').charAt(0).toUpperCase()}
                          </div>
                          <span className="workspace-task-card__assignee-name" style={isUnassigned ? { fontStyle: 'italic', color: 'var(--color-text-muted)' } : undefined}>
                            {isUnassigned ? 'Unassigned' : (assigneeName || 'Completed')}
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
                          ) : isUnassigned ? (
                            <button
                              type="button"
                              className="workspace-task-card__btn"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                              onClick={() => handleClaimTask(task.id)}
                              title="Claim this unassigned task"
                            >
                              <UserPlus size={12} />
                              <span>Claim</span>
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

      {/* 4. TAB 2: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <section className="workspace-resources-section" aria-label="Committee Assignments">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Committee Assignments</h2>
              <p className="workspace-section-subtitle">
                Hands-on practical exercises, tasks, and project milestone deliveries.
              </p>
            </div>

            {canManageContent && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingAssignment(null);
                  setAssignmentTitle('');
                  setAssignmentDesc('');
                  setAssignmentDueDate('');
                  setAssignmentMaxPoints(100);
                  setAssignmentAttachmentFile(null);
                  setExistingAttachmentUrl(null);
                  setExistingAttachmentName(null);
                  setRemoveExistingAttachment(false);
                  setCreateAssignmentModalOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Create Assignment</span>
              </button>
            )}
          </div>

          {loadingAssignments ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="dashboard-shimmer" style={{ height: '140px' }} />
              ))}
            </div>
          ) : assignments.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {assignments.map((assignment) => {
                const mySub = assignment.mySubmission;
                const isGraded = mySub && mySub.grade !== null && mySub.grade !== undefined;

                return (
                  <div key={assignment.id} className="workspace-resource-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        {canManageContent ? (
                          <>
                            <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                              Max {assignment.maxPoints} Points
                            </span>
                            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                              {assignment.totalSubmissionsCount || 0} Submissions
                            </span>
                          </>
                        ) : mySub && isGraded ? (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            Score: {mySub.grade}/{assignment.maxPoints}
                          </span>
                        ) : (
                          <>
                            <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                              Max {assignment.maxPoints} Points
                            </span>
                            {mySub ? (
                              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                                Submitted &bull; Pending Review
                              </span>
                            ) : (
                              <span className="badge badge-outline" style={{ fontSize: '0.7rem', color: 'var(--color-warning)' }}>
                                Pending Submission
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {assignment.title}
                      </h3>

                      {assignment.description && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                          {assignment.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {assignment.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={13} />
                            <span>Due Date: <strong>{formatDate(assignment.dueDate)}</strong></span>
                          </div>
                        )}
                        {assignment.attachmentUrl && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Download size={13} color="var(--color-primary)" />
                            <a
                              href={assignment.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                            >
                              {assignment.attachmentName || 'Download Starter Material'}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {canManageContent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => handleOpenSubmissions(assignment)}
                          >
                            <Eye size={13} />
                            <span>Review Submissions ({assignment.totalSubmissionsCount || 0})</span>
                          </button>

                          {isLead && (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                title="Edit Assignment"
                                onClick={() => {
                                  setEditingAssignment(assignment);
                                  setAssignmentTitle(assignment.title || '');
                                  setAssignmentDesc(assignment.description || '');
                                  setAssignmentDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '');
                                  setAssignmentMaxPoints(assignment.maxPoints || 100);
                                  setExistingAttachmentUrl(assignment.attachmentUrl || null);
                                  setExistingAttachmentName(assignment.attachmentName || null);
                                  setRemoveExistingAttachment(false);
                                  setAssignmentAttachmentFile(null);
                                  setCreateAssignmentModalOpen(true);
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                title="Delete Assignment"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                          {isGraded ? (
                            <span className="badge badge-success" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle2 size={13} /> Graded ({mySub.grade}/{assignment.maxPoints})
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={`btn ${mySub ? 'btn-outline' : 'btn-primary'} btn-xs`}
                              onClick={() => setMemberDeliveryModalAssignment(assignment)}
                            >
                              <Upload size={13} />
                              <span>{mySub ? 'Update Delivery' : 'Deliver Assignment'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="workspace-empty-dropzone" style={{ padding: '3.5rem 1.5rem' }}>
              <FileText size={32} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                No Assignments Created Yet
              </h3>
              <p>Committee leads and HR can post exercises, challenges, and review member solutions here.</p>
              {canManageContent && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAssignment(null);
                    setAssignmentTitle('');
                    setAssignmentDesc('');
                    setAssignmentDueDate('');
                    setAssignmentMaxPoints(100);
                    setAssignmentAttachmentFile(null);
                    setExistingAttachmentUrl(null);
                    setExistingAttachmentName(null);
                    setRemoveExistingAttachment(false);
                    setCreateAssignmentModalOpen(true);
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '0.5rem' }}
                >
                  <Plus size={14} />
                  <span>Create First Assignment</span>
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* 5. TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <section className="workspace-resources-section" aria-label="Committee Announcements">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Committee Announcements</h2>
              <p className="workspace-section-subtitle">
                Official notices, meeting schedules, and broadcast messages for {committee.name}.
              </p>
            </div>

            {canManageContent && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setAnnouncementTitle('');
                  setAnnouncementBody('');
                  setAnnouncementPinned(false);
                  setCreateAnnouncementModalOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Post Announcement</span>
              </button>
            )}
          </div>

          {loadingAnnouncements ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2].map((n) => (
                <div key={n} className="dashboard-shimmer" style={{ height: '90px' }} />
              ))}
            </div>
          ) : committeeAnnouncements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {committeeAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {ann.isPinned && (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem' }}>
                          <Pin size={11} /> PINNED
                        </span>
                      )}
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        {ann.title}
                      </h3>
                    </div>

                    {isLead && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          title={ann.isPinned ? 'Unpin Announcement' : 'Pin Announcement to Top'}
                          onClick={() => handleTogglePinAnnouncement(ann.id, ann.isPinned)}
                          style={ann.isPinned ? { color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.12)' } : undefined}
                        >
                          {ann.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                        </button>
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          title="Delete Announcement"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line',
                      color: 'var(--color-text)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {ann.body}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <div className="workspace-task-card__avatar" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.6rem' }}>
                      {(ann.authorName || 'L').charAt(0).toUpperCase()}
                    </div>
                    <span>Posted by <strong>{ann.authorName || 'Lead'}</strong></span>
                    <span>&bull; {formatDate(ann.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="workspace-empty-dropzone" style={{ padding: '3.5rem 1.5rem' }}>
              <Megaphone size={32} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                No Committee Announcements Yet
              </h3>
              <p>Post official committee announcements, notices, and updates for all members.</p>
              {canManageContent && (
                <button
                  type="button"
                  onClick={() => {
                    setAnnouncementTitle('');
                    setAnnouncementBody('');
                    setAnnouncementPinned(false);
                    setCreateAnnouncementModalOpen(true);
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '0.5rem' }}
                >
                  <Plus size={14} />
                  <span>Post First Announcement</span>
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* 6. TAB 4: RESOURCES */}
      {activeTab === 'resources' && (
        <section className="workspace-resources-section" aria-label="Committee Shared Resources">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Committee Drive & Resources</h2>
              <p className="workspace-section-subtitle">
                Official documentation, design templates, and technical assets for {committee.name}.
              </p>
            </div>

            {canManageContent && (
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

          {resources.length > 0 ? (
            <div className="workspace-resources-grid">
              {resources.map((res) => {
                const resType = (res.resourceType || res.resource_type || 'link').toLowerCase();
                const isDoc = resType === 'document' || resType === 'file';
                return (
                  <div key={res.id} className="workspace-resource-card">
                    <div className="workspace-resource-card__header">
                      <div className="workspace-resource-card__icon">
                        {isDoc ? <FileText size={18} /> : <Link2 size={18} />}
                      </div>
                      <span className="badge badge-outline" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {resType}
                      </span>
                    </div>

                    <div className="workspace-resource-card__body">
                      <h4 className="workspace-resource-card__title">{res.title}</h4>
                      {res.description && (
                        <p className="workspace-resource-card__desc">{res.description}</p>
                      )}
                    </div>

                    <div className="workspace-resource-card__footer">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="workspace-resource-card__link"
                        download={isDoc ? true : undefined}
                      >
                        <span>{isDoc ? 'Download File' : 'Open Link'}</span>
                        <ExternalLink size={13} />
                      </a>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {formatDate(res.created_at)}
                        </span>
                        {canManageContent && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              title="Edit Resource"
                              onClick={() => handleOpenEditResource(res)}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              title="Delete Resource"
                              onClick={() => handleDeleteResource(res.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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
              <p>Share learning resources, documentation, design files, and guides with the committee.</p>
              {canManageContent && (
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

      {/* 7. TAB 5: MEMBERS ROSTER & SEARCH (Merged with HR Observers) */}
      {activeTab === 'roster' && (
        <section className="workspace-roster-section" aria-label="Committee Team Directory">
          <div className="workspace-section-header">
            <div>
              <h2 className="workspace-section-title">Committee Team Directory</h2>
              <p className="workspace-section-subtitle">
                Official team members, active leads, and assigned HR for {committee.name}.
              </p>
            </div>

            <div className="workspace-roster-actions">
              <div className="workspace-search-bar">
                <Search size={16} className="workspace-search-icon" />
                <input
                  type="text"
                  placeholder="Search members or roles..."
                  value={memberSearchQuery}
                  onChange={handleSearchMembers}
                  className="workspace-search-input"
                />
              </div>
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
                const memberRole = (m.roleInCommittee || m.role_in_committee || 'member').toLowerCase();
                const isMemberHR = memberRole === 'hr';
                const isMemberLead = memberRole === 'lead';

                return (
                  <div key={m.id || m.userId} className="workspace-member-card">
                    <div className="workspace-member-card__avatar">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={memberName} />
                      ) : (
                        <span>{memberName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="workspace-member-card__info">
                      <div className="workspace-member-card__name-wrap">
                        <span className="workspace-member-card__name">{memberName}</span>
                        {isMemberLead && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                            LEAD
                          </span>
                        )}
                        {isMemberHR && (
                          <span className="badge badge-hr" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                            HR
                          </span>
                        )}
                      </div>
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

      {/* 8. TAB 6: ARCHIVED TASKS */}
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
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                No Archived Tasks
              </h3>
              <p>When tasks are completed, leads can archive them to preserve committee history.</p>
            </div>
          )}
        </section>
      )}

      {/* 9. CREATE / EDIT ASSIGNMENT MODAL (Lead) */}
      {createAssignmentModalOpen && (
        <div className="workspace-modal-overlay" {...createAssignmentBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h3 className="workspace-modal__title">
                {editingAssignment ? 'Edit Assignment' : 'Create Committee Assignment'}
              </h3>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setCreateAssignmentModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment}>
              <div className="workspace-modal__body">
                <div className="workspace-form-group">
                  <label className="workspace-form-label">
                    Assignment Title <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="workspace-form-input"
                    placeholder="e.g. Build PyTorch Classifier on CIFAR-10"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Description / Instructions</label>
                  <textarea
                    className="workspace-form-textarea"
                    placeholder="Describe requirements, deliverables, and guidelines for team members..."
                    value={assignmentDesc}
                    onChange={(e) => setAssignmentDesc(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="workspace-form-group">
                    <label className="workspace-form-label">Due Date</label>
                    <input
                      type="date"
                      className="workspace-form-input"
                      value={assignmentDueDate}
                      onChange={(e) => setAssignmentDueDate(e.target.value)}
                    />
                  </div>

                  <div className="workspace-form-group">
                    <label className="workspace-form-label">Max Score Points</label>
                    <input
                      type="number"
                      className="workspace-form-input"
                      value={assignmentMaxPoints}
                      onChange={(e) => setAssignmentMaxPoints(e.target.value)}
                      min={1}
                      max={1000}
                    />
                  </div>
                </div>

                {/* Existing Attachment View & Remove */}
                {editingAssignment && existingAttachmentUrl && !removeExistingAttachment && (
                  <div className="workspace-form-group">
                    <label className="workspace-form-label">Current Attached File</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                        <Download size={14} color="var(--color-primary)" />
                        <a
                          href={existingAttachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {existingAttachmentName || 'Current Attachment'}
                        </a>
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => setRemoveExistingAttachment(true)}
                        title="Delete current attachment"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="workspace-form-group">
                  <label className="workspace-form-label">
                    {editingAssignment && existingAttachmentUrl && !removeExistingAttachment
                      ? 'Replace Attachment (Optional)'
                      : 'Attachment (Optional)'}
                  </label>
                  <input
                    type="file"
                    className="workspace-form-input"
                    onChange={(e) => {
                      setAssignmentAttachmentFile(e.target.files?.[0] || null);
                      if (e.target.files?.[0]) setRemoveExistingAttachment(false);
                    }}
                  />
                  {removeExistingAttachment && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>
                      Current file will be removed upon saving unless a new file is selected.
                    </span>
                  )}
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setCreateAssignmentModalOpen(false)}
                  disabled={savingAssignment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingAssignment}
                >
                  {savingAssignment ? 'Saving Assignment…' : editingAssignment ? 'Update Assignment' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. SUBMISSIONS REVIEW MODAL (Lead) */}
      {viewingSubmissionsAssignment && (
        <div className="workspace-modal-overlay" {...viewSubmissionsBackdrop.getBackdropProps()}>
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
                            {isLead && (
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

      {/* 11. MEMBER DELIVER ASSIGNMENT MODAL */}
      {memberDeliveryModalAssignment && (
        <div className="workspace-modal-overlay" {...memberDeliveryBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="workspace-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} color="var(--color-primary)" />
                <h3 className="workspace-modal__title">Deliver Assignment</h3>
              </div>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setMemberDeliveryModalAssignment(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMemberSubmitDelivery}>
              <div className="workspace-modal__body">
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {memberDeliveryModalAssignment.title}
                  </h4>
                  {memberDeliveryModalAssignment.description && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {memberDeliveryModalAssignment.description}
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
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Delivery Notes / Explanations (Optional)</label>
                  <textarea
                    className="workspace-form-textarea"
                    placeholder="Provide any comments, model accuracy stats, or repository links..."
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
                  onClick={() => setMemberDeliveryModalAssignment(null)}
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

      {/* 12. CREATE COMMITTEE ANNOUNCEMENT MODAL (Lead) */}
      {createAnnouncementModalOpen && (
        <div className="workspace-modal-overlay" {...createAnnouncementBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="workspace-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} color="var(--color-primary)" />
                <h3 className="workspace-modal__title">Post Committee Announcement</h3>
              </div>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setCreateAnnouncementModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement}>
              <div className="workspace-modal__body">
                <div className="workspace-form-group">
                  <label className="workspace-form-label">
                    Announcement Title <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="workspace-form-input"
                    placeholder="e.g. Sync Meeting this Thursday at 7 PM"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">
                    Announcement Body <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <textarea
                    className="workspace-form-textarea"
                    placeholder="Write the full update or message for committee members..."
                    value={announcementBody}
                    onChange={(e) => setAnnouncementBody(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="checkbox"
                    id="chk-pinned"
                    checked={announcementPinned}
                    onChange={(e) => setAnnouncementPinned(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="chk-pinned" style={{ fontSize: '0.8125rem', color: 'var(--color-text)', cursor: 'pointer' }}>
                    Pin this announcement to top of committee stream
                  </label>
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setCreateAnnouncementModalOpen(false)}
                  disabled={savingAnnouncement}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingAnnouncement}
                >
                  <Send size={14} />
                  <span>{savingAnnouncement ? 'Broadcasting…' : 'Post Announcement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. TASK DETAILS MODAL */}
      {selectedTaskDetails && (
        <div className="workspace-modal-overlay" {...taskDetailsBackdrop.getBackdropProps()}>
          <div
            className="workspace-modal workspace-modal--details"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="workspace-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`workspace-task-card__priority-badge ${getPriorityBadgeClass(selectedTaskDetails.priority)}`}>
                  {(selectedTaskDetails.priority || 'medium').toUpperCase()}
                </span>
                <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                  Status: <strong>{selectedTaskDetails.status?.replace('_', ' ').toUpperCase()}</strong>
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

              <div className="workspace-details-meta-grid">
                <div className="workspace-details-meta-item">
                  <span className="workspace-details-label">Assignee</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div className="workspace-task-card__avatar" style={!selectedTaskDetails.assigneeUserId && !selectedTaskDetails.assignee_user_id ? { background: 'var(--color-border)', color: 'var(--color-text-muted)' } : undefined}>
                        {selectedTaskDetails.assigneeUserId || selectedTaskDetails.assignee_user_id
                          ? (selectedTaskDetails.assigneeName || 'M').charAt(0).toUpperCase()
                          : '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {selectedTaskDetails.assigneeUserId || selectedTaskDetails.assignee_user_id
                            ? (selectedTaskDetails.assigneeName || selectedTaskDetails.assignee_name || 'Assigned Member')
                            : 'Unassigned'}
                        </div>
                        {selectedTaskDetails.assigneeEmail && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {selectedTaskDetails.assigneeEmail}
                          </div>
                        )}
                      </div>
                    </div>
                    {(!selectedTaskDetails.assigneeUserId && !selectedTaskDetails.assignee_user_id) && (
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => handleClaimTask(selectedTaskDetails.id)}
                      >
                        <UserPlus size={12} /> Claim Task
                      </button>
                    )}
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

      {/* 14. CREATE TASK MODAL */}
      {createTaskModalOpen && (
        <div className="workspace-modal-overlay" {...createTaskBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h3 className="workspace-modal__title">Create Committee Task</h3>
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
                  <label className="workspace-form-label">
                    Task Title <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="workspace-form-input"
                    placeholder="e.g. Prepare Robotics Arena Schedule"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Description (Optional)</label>
                  <textarea
                    className="workspace-form-textarea"
                    placeholder="Provide details, scope, and objectives for this assignment..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">
                    Assignee (Optional)
                  </label>
                  <select
                    className="workspace-form-select"
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned (Open for team to take)</option>
                    {memberships.map((m) => (
                      <option key={m.id || m.externalUserId} value={m.externalUserId || m.id}>
                        {m.name || m.userName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Priority Level</label>
                  <div className="workspace-priority-selector">
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`workspace-priority-option ${
                          taskPriority === p ? 'workspace-priority-option--selected' : ''
                        }`}
                        onClick={() => setTaskPriority(p)}
                      >
                        <span className={`workspace-task-card__priority-badge workspace-task-card__priority-badge--${p}`}>
                          {p.toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Due Date (Optional)</label>
                  <input
                    type="date"
                    className="workspace-form-input"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setCreateTaskModalOpen(false)}
                  disabled={savingTask}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingTask}
                >
                  {savingTask ? 'Assigning Task…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 15. EDIT TASK MODAL */}
      {editTaskModalOpen && (
        <div className="workspace-modal-overlay" {...editTaskBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h3 className="workspace-modal__title">Edit Committee Task</h3>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setEditTaskModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTask}>
              <div className="workspace-modal__body">
                <div className="workspace-form-group">
                  <label className="workspace-form-label">Task Title</label>
                  <input
                    type="text"
                    className="workspace-form-input"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Description</label>
                  <textarea
                    className="workspace-form-textarea"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Assignee (Optional)</label>
                  <select
                    className="workspace-form-select"
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned (Open for team to take)</option>
                    {memberships.map((m) => (
                      <option key={m.id || m.externalUserId} value={m.externalUserId || m.id}>
                        {m.name || m.userName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Priority Level</label>
                  <div className="workspace-priority-selector">
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`workspace-priority-option ${
                          taskPriority === p ? 'workspace-priority-option--selected' : ''
                        }`}
                        onClick={() => setTaskPriority(p)}
                      >
                        <span className={`workspace-task-card__priority-badge workspace-task-card__priority-badge--${p}`}>
                          {p.toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Due Date</label>
                  <input
                    type="date"
                    className="workspace-form-input"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditTaskModalOpen(false)}
                  disabled={savingTask}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingTask}
                >
                  {savingTask ? 'Updating…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 16. DELETE TASK CONFIRM MODAL */}
      {deleteConfirmModalOpen && (
        <div className="workspace-modal-overlay" {...deleteConfirmBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="workspace-modal__header">
              <h3 className="workspace-modal__title">Delete Task</h3>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setDeleteConfirmModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-modal__body">
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                Are you sure you want to permanently delete this task? This action cannot be undone.
              </p>
            </div>

            <div className="workspace-modal__footer">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setDeleteConfirmModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDeleteTask}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 17. ADD RESOURCE MODAL (Dual File Upload / Link) */}
      {addResourceModalOpen && (
        <div className="workspace-modal-overlay" {...addResourceBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h3 className="workspace-modal__title">Add Committee Resource</h3>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setAddResourceModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Picker Tabs */}
            <div className="workspace-modal-tabs">
              <button
                type="button"
                className={`workspace-modal-tab ${resourceMode === 'file' ? 'workspace-modal-tab--active' : ''}`}
                onClick={() => setResourceMode('file')}
              >
                <UploadCloud size={15} />
                <span>Upload Document / File</span>
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

            <form onSubmit={handleCreateResource}>
              <div className="workspace-modal__body">
                <div className="workspace-form-group">
                  <label className="workspace-form-label">
                    Resource Title <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="workspace-form-input"
                    placeholder={resourceMode === 'file' ? 'e.g. Autonomous Navigation Whitepaper' : 'e.g. Team Google Drive Repository'}
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    required
                  />
                </div>

                {resourceMode === 'file' ? (
                  <div className="workspace-form-group">
                    <label className="workspace-form-label">
                      Choose File (PDF, DOCX, ZIP, XLSX, PPTX) <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="file"
                      className="workspace-form-input"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Files are delivered directly to committee members.
                    </span>
                  </div>
                ) : (
                  <div className="workspace-form-group">
                    <label className="workspace-form-label">
                      Destination URL <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="url"
                      className="workspace-form-input"
                      placeholder="https://drive.google.com/..."
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Description (Optional)</label>
                  <textarea
                    className="workspace-form-textarea"
                    placeholder="Brief description of this resource for committee members..."
                    value={resourceDesc}
                    onChange={(e) => setResourceDesc(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setAddResourceModalOpen(false)}
                  disabled={savingResource}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingResource || uploadingFile}
                >
                  {uploadingFile ? 'Uploading…' : savingResource ? 'Adding Resource…' : 'Publish Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 18. EDIT RESOURCE MODAL */}
      {editingResource && (
        <div className="workspace-modal-overlay" {...editResourceBackdrop.getBackdropProps()}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-modal__header">
              <h3 className="workspace-modal__title">Edit Committee Resource</h3>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setEditingResource(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResourceEdit}>
              <div className="workspace-modal__body">
                <div className="workspace-form-group">
                  <label className="workspace-form-label">
                    Resource Title <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="workspace-form-input"
                    value={editResourceTitle}
                    onChange={(e) => setEditResourceTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="workspace-form-group">
                  <label className="workspace-form-label">Description (Optional)</label>
                  <textarea
                    className="workspace-form-textarea"
                    placeholder="Brief description of this resource..."
                    value={editResourceDesc}
                    onChange={(e) => setEditResourceDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="workspace-modal__footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingResource(null)}
                  disabled={savingResourceEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingResourceEdit}
                >
                  {savingResourceEdit ? 'Saving Changes…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
