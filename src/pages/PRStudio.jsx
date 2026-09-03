import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Megaphone,
  Radio,
  Mail,
  Plus,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  Eye,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  X,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  MoreVertical,
  FileText,
  Layers,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Info,
  ZoomIn,
  User,
  Monitor,
  Smartphone,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Link2,
  Minus,
  Check,
  Code,
  FileSpreadsheet,
  Archive,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';
import { api } from '../services/api';
import '../styles/pr.css';

const ANNOUNCEMENT_CATEGORIES = [
  'General',
  'Technical',
  'Workshop',
  'Competition',
  'Event',
  'Announcement',
];

const getCategoryBadgeClass = (category) => {
  switch ((category || '').toLowerCase()) {
    case 'event':
      return 'badge-warning';
    case 'recruitment':
      return 'badge-success';
    case 'technical':
    case 'workshop':
      return 'badge-info';
    case 'competition':
      return 'badge-purple';
    case 'general':
    default:
      return 'badge-primary';
  }
};

const TARGET_SEGMENTS = [
  { value: 'all_members', label: 'All Branch Members', desc: 'Broadcast to all active IEEE branch members' },
  { value: 'committee_members', label: 'Specific Committee Members', desc: 'Target all members of a selected committee' },
  { value: 'committee_leads_all', label: 'All Committee Leads', desc: 'Send to committee leads across all branch committees' },
  { value: 'committee_leads_specific', label: 'Specific Committee Leads', desc: 'Send to leads of a selected committee only' },
  { value: 'specific_members', label: 'Specific Members', desc: 'Search and select individual branch members' },
  { value: 'custom_sheet', label: 'Custom Spreadsheet', desc: 'Upload CSV/Excel file with email and custom attributes' },
];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = lines[0].includes('\t') ? '\t' : ',';

  function parseLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values.map((v) => v.replace(/^["']|["']$/g, '').trim());
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function interpolatePreviewText(templateStr, context = {}) {
  if (!templateStr || typeof templateStr !== 'string') return '';
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
    const rawKey = key.trim();
    const lowerKey = rawKey.toLowerCase();

    if (context[rawKey] !== undefined && context[rawKey] !== null && context[rawKey] !== '') {
      return String(context[rawKey]);
    }
    if (context[lowerKey] !== undefined && context[lowerKey] !== null && context[lowerKey] !== '') {
      return String(context[lowerKey]);
    }

    if (context.customFields && typeof context.customFields === 'object') {
      if (context.customFields[rawKey] !== undefined && context.customFields[rawKey] !== null) {
        return String(context.customFields[rawKey]);
      }
      if (context.customFields[lowerKey] !== undefined && context.customFields[lowerKey] !== null) {
        return String(context.customFields[lowerKey]);
      }
      if (lowerKey.startsWith('sheet.')) {
        const subKey = rawKey.slice(6);
        if (context.customFields[subKey] !== undefined && context.customFields[subKey] !== null) {
          return String(context.customFields[subKey]);
        }
      }
    }

    if (lowerKey === 'user.name' || lowerKey === 'name') {
      return context.name || 'Yousef (Sample Recipient)';
    }
    if (lowerKey === 'user.email' || lowerKey === 'email') {
      return context.email || 'member@ieee.local';
    }
    if (lowerKey === 'user.committee' || lowerKey === 'committee' || lowerKey === 'committeename') {
      return context.committeeName || 'AI & Robotics';
    }
    if (lowerKey === 'user.role' || lowerKey === 'role') {
      return context.role || 'Member';
    }

    return match;
  });
}

function renderMarkdownToHtml(bodyText) {
  if (!bodyText) return '<p style="color:#94a3b8;font-style:italic;">Email body preview will appear here...</p>';
  const isHtml = /<[a-z][\s\S]*>/i.test(bodyText);
  if (isHtml) return bodyText;

  let formatted = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/### (.*?)\n/g, '<h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:16px 0 8px;">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 style="font-size:18px;font-weight:800;color:#0f172a;margin:18px 0 8px;">$1</h2>')
    .replace(/# (.*?)\n/g, '<h1 style="font-size:20px;font-weight:800;color:#002855;margin:20px 0 10px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;font-weight:600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" style="color:#00629b;text-decoration:underline;font-weight:500;" target="_blank">$1</a>')
    .replace(/---/g, '<hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 14px;line-height:1.65;color:#334155;">')
    .replace(/\n/g, '<br/>');

  return `<p style="margin:0 0 14px;line-height:1.65;color:#334155;">${formatted}</p>`;
}

function isFullHtmlDocument(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html');
}

function getDefaultEmailTemplate(contentHtml = '', title = 'IEEE Menoufia Student Branch') {
  const bodyContent = contentHtml && contentHtml.trim()
    ? contentHtml
    : '<p style="margin:0 0 16px;line-height:1.65;color:#334155;">Hello {{user.name}},</p>\n<p style="margin:0 0 16px;line-height:1.65;color:#334155;">Write your message here...</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title || 'IEEE Menoufia Student Branch'}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg, #002855 0%, #00629b 100%);padding:28px 24px;text-align:center;">
        <h1 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">IEEE Menoufia Student Branch</h1>
        <p style="margin:6px 0 0;font-size:13px;color:#93c5fd;font-weight:500;">Official Communications & Outreach</p>
      </td>
    </tr>
    <!-- Content Body -->
    <tr>
      <td style="padding:32px 28px;">
        <div style="font-size:15px;line-height:1.65;color:#1e293b;">
          ${bodyContent}
        </div>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#f1f5f9;padding:20px 24px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;line-height:1.5;">
        <div style="font-weight:600;color:#475569;margin-bottom:4px;">
          &copy; 2026 IEEE Menoufia Student Branch &bull; Menoufia University.
        </div>
        <div style="margin-top:8px;font-size:11px;color:#64748b;">
          sent via IEEE MSB Portal &bull; All Rights Reserved.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export default function PRStudio() {
  const { user } = useAuthStore();
  const toast = useToastStore();
  const bodyTextareaRef = useRef(null);

  // ── Authorization Checks ──────────────────────────────────────────────────
  const isGlobalAdmin =
    user?.role === 'admin' ||
    user?.availableScopes?.some((s) => s.role === 'admin');

  const isOfficer =
    user?.role === 'officer' ||
    user?.availableScopes?.some((s) => s.role === 'officer');

  const isPRLead = user?.availableScopes?.some(
    (s) =>
      (s.committeeSlug === 'pr' || s.committeeName?.toLowerCase().includes('public relation')) &&
      s.role === 'lead'
  );

  const hasAccess = isGlobalAdmin || isOfficer || isPRLead;

  // ── State Management ──────────────────────────────────────────────────────
  const VALID_PR_TABS = ['announcements', 'campaigns'];
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = VALID_PR_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'announcements';
  const [activeTab, setActiveTabState] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (VALID_PR_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [searchParams]);

  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newTab === 'announcements') {
          next.delete('tab');
        } else {
          next.set('tab', newTab);
        }
        return next;
      },
      { replace: true }
    );
  };
  const [committees, setCommittees] = useState([]);

  // Announcements Tab State
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Form State for Announcement
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    category: 'General',
    visibility: 'public',
    isPinned: false,
    authorName: user?.name || 'Branch Executive Board',
    imageUrl: null,
  });

  // Campaigns Tab State
  const [campaigns, setCampaigns] = useState([]);
  const [campaignSubTab, setCampaignSubTab] = useState('active'); // 'active' | 'archived'
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('');
  const [campaignSegmentFilter, setCampaignSegmentFilter] = useState('');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState(null);
  const [selectedLogCampaign, setSelectedLogCampaign] = useState(null);
  const [deliveryLogsData, setDeliveryLogsData] = useState(null);
  const [loadingDeliveryLogs, setLoadingDeliveryLogs] = useState(false);
  const [deliveryLogSearch, setDeliveryLogSearch] = useState('');
  const [detailsViewMode, setDetailsViewMode] = useState('logs'); // 'logs' | 'preview'

  // Enhanced Form State for Campaign
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    subject: '',
    body: '',
    segmentType: 'all_members',
    committeeId: '',
    status: 'draft',
    scheduledFor: '',
    recipientUserIds: [],
    customRecipients: [],
    editorMode: 'markdown', // 'markdown' | 'html'
  });

  // Dynamic preview & sheet state
  const [customSheetFileName, setCustomSheetFileName] = useState('');
  const [customSheetColumns, setCustomSheetColumns] = useState([]);
  const [previewRecipientsList, setPreviewRecipientsList] = useState([]);
  const [previewRecipientCount, setPreviewRecipientCount] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRowIndex, setPreviewRowIndex] = useState(0);
  const [previewDeviceMode, setPreviewDeviceMode] = useState('desktop'); // 'desktop' | 'mobile'

  // Member search state for 'specific_members' segment
  const [allBranchMembers, setAllBranchMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [loadingBranchMembers, setLoadingBranchMembers] = useState(false);

  // ── Load Initial Data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasAccess) return;

    loadCommittees();
    loadAnnouncements();
    loadCampaigns();
  }, [hasAccess]);

  // ── Modal Backdrop Dismiss Hooks ─────────────────────────────────────────
  const announcementBackdrop = useBackdropDismiss(() => setShowAnnouncementModal(false), {
    isOpen: showAnnouncementModal,
  });
  const campaignBackdrop = useBackdropDismiss(() => setShowCampaignModal(false), {
    isOpen: showCampaignModal,
  });
  const logsBackdrop = useBackdropDismiss(() => setSelectedLogCampaign(null), {
    isOpen: !!selectedLogCampaign,
  });
  const imageLightboxBackdrop = useBackdropDismiss(() => setSelectedImage(null), {
    isOpen: !!selectedImage,
  });

  async function loadCommittees() {
    try {
      const data = await api.getPublicCommittees();
      const list = data?.committees || data?.data || (Array.isArray(data) ? data : []);
      setCommittees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load committees for PR Studio:', err.message);
      setCommittees([]);
    }
  }

  async function loadAnnouncements() {
    setLoadingAnnouncements(true);
    try {
      const res = await api.getPRAnnouncements({ limit: 100 });
      const list = res?.announcements || res?.data || (Array.isArray(res) ? res : []);
      setAnnouncements(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Load Failed', err.message || 'Failed to fetch PR announcements');
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  }

  async function loadCampaigns() {
    setLoadingCampaigns(true);
    try {
      const res = await api.getPRCampaigns({ limit: 100, includeArchived: true, includeHr: true });
      const list = res?.campaigns || res?.data || (Array.isArray(res) ? res : []);
      setCampaigns(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Load Failed', err.message || 'Failed to fetch PR campaigns');
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  }

  // ── Announcement Handlers ─────────────────────────────────────────────────
  const handleOpenCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({
      title: '',
      body: '',
      category: 'General',
      visibility: 'public',
      isPinned: false,
      authorName: user?.name || 'Branch Executive Board',
      imageUrl: null,
    });
    setBannerPreview(null);
    setShowAnnouncementModal(true);
  };

  const handleOpenEditAnnouncement = (ann) => {
    setEditingAnnouncement(ann);
    setAnnouncementForm({
      title: ann.title || '',
      body: ann.body || '',
      category: ann.category || 'General',
      visibility: ann.visibility || 'public',
      isPinned: Boolean(ann.isPinned),
      authorName: ann.authorName || user?.name || 'Branch Executive Board',
      imageUrl: ann.imageUrl || null,
    });
    setBannerPreview(ann.imageUrl || null);
    setShowAnnouncementModal(true);
  };

  const handleBannerUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please upload a PNG, JPG, or WebP image file.');
      return;
    }

    setUploadingBanner(true);
    try {
      const uploadRes = await api.uploadDirectToCloudinary({
        file,
        folder: 'announcements',
        purpose: 'announcement_banner',
      });
      const secureUrl = uploadRes.secureUrl || uploadRes.url;
      setAnnouncementForm((prev) => ({ ...prev, imageUrl: secureUrl }));
      setBannerPreview(secureUrl);
      toast.success('Banner Uploaded', 'Image uploaded successfully.');
    } catch (err) {
      toast.error('Upload Failed', err.message || 'Failed to upload banner image.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim()) {
      toast.error('Validation Error', 'Announcement title is required.');
      return;
    }

    setSavingAnnouncement(true);
    try {
      if (editingAnnouncement) {
        await api.updatePRAnnouncement(editingAnnouncement.id, announcementForm);
        toast.success('Announcement Updated', 'Changes saved successfully.');
      } else {
        await api.createPRAnnouncement(announcementForm);
        toast.success('Announcement Created', 'New announcement published successfully.');
      }
      setShowAnnouncementModal(false);
      loadAnnouncements();
    } catch (err) {
      toast.error('Save Failed', err.message || 'Failed to save announcement.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleTogglePin = async (ann) => {
    try {
      await api.togglePinPRAnnouncement(ann.id, !ann.isPinned);
      toast.success(
        ann.isPinned ? 'Unpinned' : 'Pinned to Top',
        `Announcement has been ${ann.isPinned ? 'unpinned' : 'pinned to top'}.`
      );
      loadAnnouncements();
    } catch (err) {
      toast.error('Action Failed', err.message || 'Failed to toggle pin state.');
    }
  };

  const handleDeleteAnnouncement = async (ann) => {
    if (!window.confirm(`Are you sure you want to delete "${ann.title}"?`)) return;

    try {
      await api.deletePRAnnouncement(ann.id);
      toast.success('Announcement Deleted', 'Announcement removed successfully.');
      loadAnnouncements();
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Failed to delete announcement.');
    }
  };

  // Live member search with debounce (only when query is typed)
  useEffect(() => {
    if (campaignForm.segmentType !== 'specific_members') return;
    if (!memberSearchQuery.trim()) {
      setLoadingBranchMembers(false);
      return;
    }

    let isMounted = true;
    setLoadingBranchMembers(true);
    const timer = setTimeout(async () => {
      try {
        // if memberSearchquery is empty no search
        if (!memberSearchQuery)
          return;
        const res = await api.searchRegisteredUsers(memberSearchQuery.trim());
        const list = res?.users || res?.data || (Array.isArray(res) ? res : []);
        if (isMounted && Array.isArray(list)) {
          setAllBranchMembers((prev) => {
            const map = new Map();
            prev.forEach((item) => map.set(item.id || item.userId, item));
            list.forEach((item) => map.set(item.id || item.userId, item));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Member search failed:', err.message);
      } finally {
        if (isMounted) setLoadingBranchMembers(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [memberSearchQuery, campaignForm.segmentType]);

  // ── Real-Time Recipient Preview Calculation ───────────────────────────────
  useEffect(() => {
    if (!showCampaignModal) return;

    let isMounted = true;
    const calculateRecipients = async () => {
      setPreviewLoading(true);
      try {
        const targetCommitteeId =
          campaignForm.segmentType === 'committee_members' ||
          campaignForm.segmentType === 'committee_leads_specific'
            ? campaignForm.committeeId || null
            : null;

        const res = await api.previewPRCampaignRecipients({
          segmentType: campaignForm.segmentType,
          committeeId: targetCommitteeId,
          recipientUserIds: campaignForm.recipientUserIds,
          customRecipients: campaignForm.customRecipients,
        });

        if (isMounted && res) {
          setPreviewRecipientCount(res.recipientCount || res.totalCount || 0);
          setPreviewRecipientsList(res.recipients || res.sampleRecipients || []);
          if (previewRowIndex >= (res.recipients || res.sampleRecipients || []).length) {
            setPreviewRowIndex(0);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Preview calculation error:', err.message);
          setPreviewRecipientCount(
            campaignForm.segmentType === 'custom_sheet'
              ? campaignForm.customRecipients.length
              : campaignForm.segmentType === 'specific_members'
              ? campaignForm.recipientUserIds.length
              : 0
          );
        }
      } finally {
        if (isMounted) setPreviewLoading(false);
      }
    };

    const timer = setTimeout(calculateRecipients, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    showCampaignModal,
    campaignForm.segmentType,
    campaignForm.committeeId,
    campaignForm.recipientUserIds,
    campaignForm.customRecipients,
  ]);

  // ── Campaign Handlers ─────────────────────────────────────────────────────
  const handleOpenCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      title: '',
      subject: '',
      body: 'Hello {{user.name}},\n\nWe are excited to share this important update from the IEEE Menoufia Student Branch.\n\nBest regards,\nIEEE Menoufia Student Branch',
      segmentType: 'all_members',
      committeeId: '',
      status: 'draft',
      scheduledFor: '',
      recipientUserIds: [],
      customRecipients: [],
      templateMode: 'standard',
      editorMode: 'markdown',
    });
    setMemberSearchQuery('');
    setCustomSheetFileName('');
    setCustomSheetColumns([]);
    setPreviewRecipientsList([]);
    setPreviewRecipientCount(0);
    setPreviewRowIndex(0);
    setShowCampaignModal(true);
  };

  const handleOpenEditCampaign = (camp) => {
    setEditingCampaign(camp);
    const parsedUserIds = Array.isArray(camp.recipientUserIds)
      ? camp.recipientUserIds
      : Array.isArray(camp.recipient_user_ids)
      ? camp.recipient_user_ids
      : [];
    const parsedCustom = Array.isArray(camp.customRecipients)
      ? camp.customRecipients
      : Array.isArray(camp.custom_recipients)
      ? camp.custom_recipients
      : [];

    let segType = camp.segmentType || camp.segment_type || 'all_members';
    if (segType === 'committee_leads') {
      segType = camp.committeeId || camp.committee_id ? 'committee_leads_specific' : 'committee_leads_all';
    }

    const isFullHtml = isFullHtmlDocument(camp.body || '');

    setCampaignForm({
      title: camp.title || '',
      subject: camp.subject || '',
      body: camp.body || '',
      segmentType: segType,
      committeeId: camp.committeeId || camp.committee_id || '',
      status: camp.status || 'draft',
      scheduledFor: camp.scheduledFor || camp.scheduled_for ? new Date(camp.scheduledFor || camp.scheduled_for).toISOString().slice(0, 16) : '',
      recipientUserIds: parsedUserIds,
      customRecipients: parsedCustom,
      templateMode: isFullHtml ? 'full' : 'standard',
      editorMode: isFullHtml ? 'html' : (/<[a-z][\s\S]*>/i.test(camp.body || '') ? 'html' : 'markdown'),
    });

    setMemberSearchQuery('');
    if (parsedCustom.length > 0) {
      setCustomSheetFileName(camp.metadata?.sheetFileName || 'Uploaded_Spreadsheet.csv');
      const cols = new Set();
      parsedCustom.forEach((r) => {
        if (r.customFields && typeof r.customFields === 'object') {
          Object.keys(r.customFields).forEach((k) => cols.add(k));
        }
      });
      setCustomSheetColumns(Array.from(cols));
    } else {
      setCustomSheetFileName('');
      setCustomSheetColumns([]);
    }

    setPreviewRowIndex(0);
    setShowCampaignModal(true);
  };

  const handleToggleTemplateMode = (mode) => {
    if (mode === 'full') {
      const currentBody = campaignForm.body || '';
      const isAlreadyFull = isFullHtmlDocument(currentBody);
      const fullTemplate = isAlreadyFull
        ? currentBody
        : getDefaultEmailTemplate(renderMarkdownToHtml(currentBody), campaignForm.title || campaignForm.subject);
      setCampaignForm((p) => ({
        ...p,
        templateMode: 'full',
        editorMode: 'html',
        body: fullTemplate,
      }));
    } else {
      setCampaignForm((p) => ({
        ...p,
        templateMode: 'standard',
        editorMode: 'markdown',
      }));
    }
  };

  const handleResetToDefaultTemplate = () => {
    if (!window.confirm('Reset this template back to the official IEEE Menoufia default template?')) return;
    const standardHtml = getDefaultEmailTemplate('', campaignForm.title || campaignForm.subject);
    setCampaignForm((p) => ({
      ...p,
      body: standardHtml,
    }));
    toast.success('Template Reset', 'Restored official IEEE Menoufia template structure.');
  };

  const handleOpenDeliveryLogs = async (camp) => {
    setSelectedLogCampaign(camp);
    setDetailsViewMode('logs');
    setDeliveryLogsData(null);
    setLoadingDeliveryLogs(true);
    setDeliveryLogSearch('');
    try {
      const res = await api.getPRCampaignDeliveryLogs(camp.id);
      setDeliveryLogsData(res?.delivery || null);
    } catch (err) {
      toast.error('Logs Error', err.message || 'Failed to fetch delivery logs');
    } finally {
      setLoadingDeliveryLogs(false);
    }
  };

  const insertVariableTag = (tag) => {
    const token = `{{${tag}}}`;
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      setCampaignForm((p) => ({ ...p, body: p.body + ' ' + token }));
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentText = campaignForm.body || '';
    const newText = currentText.substring(0, start) + token + currentText.substring(end);

    setCampaignForm((p) => ({ ...p, body: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  const applyFormatting = (type) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const current = campaignForm.body || '';
    const selected = current.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case 'h2':
        replacement = `\n## ${selected || 'Section Heading'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'h3':
        replacement = `\n### ${selected || 'Subheading'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'list':
        replacement = `\n- ${selected || 'List item'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'link':
        replacement = `[${selected || 'Link label'}](https://)`;
        cursorOffset = replacement.length - 1;
        break;
      case 'divider':
        replacement = `\n---\n`;
        cursorOffset = replacement.length;
        break;
      default:
        return;
    }

    const newText = current.substring(0, start) + replacement + current.substring(end);
    setCampaignForm((p) => ({ ...p, body: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  const handleSpreadsheetUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result || '';
        const { headers, rows } = parseCSV(text);
        if (rows.length === 0) {
          toast.error('Empty File', 'The uploaded file does not contain any recipient rows.');
          return;
        }

        // Detect email column (case-insensitive)
        const emailHeader = headers.find((h) =>
          /email|e-mail|mail|student_email|user_email/i.test(h)
        ) || headers[0];

        const nameHeader = headers.find((h) =>
          /name|fullname|full_name|member_name/i.test(h)
        );

        const customRecipients = rows
          .map((r) => {
            const rawEmail = (r[emailHeader] || '').trim();
            if (!rawEmail || !rawEmail.includes('@')) return null;
            const rowCopy = { ...r };
            delete rowCopy.customFields;
            return {
              email: rawEmail,
              name: (nameHeader && r[nameHeader]) || r.name || 'Member',
              customFields: rowCopy,
            };
          })
          .filter(Boolean);

        if (customRecipients.length === 0) {
          toast.error('No Valid Emails', 'Could not detect any valid email addresses in the file.');
          return;
        }

        const detectedColumns = headers.filter((h) => h !== emailHeader);
        setCustomSheetFileName(file.name);
        setCustomSheetColumns(detectedColumns);
        setCampaignForm((p) => ({
          ...p,
          customRecipients,
          segmentType: 'custom_sheet',
        }));
        toast.success(
          'Spreadsheet Imported',
          `Parsed ${customRecipients.length} valid recipient rows with ${headers.length} columns.`
        );
      } catch (err) {
        toast.error('Parse Error', 'Failed to parse spreadsheet file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleToggleSpecificMember = (member) => {
    const memberId = member.id || member.userId;
    if (!memberId) return;

    setCampaignForm((p) => {
      const exists = p.recipientUserIds.includes(memberId);
      return {
        ...p,
        recipientUserIds: exists
          ? p.recipientUserIds.filter((id) => id !== memberId)
          : [...p.recipientUserIds, memberId],
      };
    });
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title.trim()) {
      toast.error('Validation Error', 'Campaign title is required.');
      return;
    }
    if (!campaignForm.subject.trim()) {
      toast.error('Validation Error', 'Email subject line is required.');
      return;
    }
    if (!campaignForm.body.trim()) {
      toast.error('Validation Error', 'Email body is required.');
      return;
    }
    if ((campaignForm.segmentType === 'committee_members' || campaignForm.segmentType === 'committee_leads_specific') && !campaignForm.committeeId) {
      toast.error('Validation Error', 'Please select the target committee for this campaign.');
      return;
    }
    if (campaignForm.segmentType === 'specific_members' && (!campaignForm.recipientUserIds || campaignForm.recipientUserIds.length === 0)) {
      toast.error('Validation Error', 'Please select at least one specific member to receive this campaign.');
      return;
    }
    if (campaignForm.segmentType === 'custom_sheet' && (!campaignForm.customRecipients || campaignForm.customRecipients.length === 0)) {
      toast.error('Validation Error', 'Please upload a valid spreadsheet file with recipient emails.');
      return;
    }

    setSavingCampaign(true);
    try {
      const targetCommitteeId =
        (campaignForm.segmentType === 'committee_members' || campaignForm.segmentType === 'committee_leads_specific')
          ? campaignForm.committeeId || null
          : null;

      const backendSegmentType =
        campaignForm.segmentType === 'committee_leads_all' || campaignForm.segmentType === 'committee_leads_specific'
          ? 'committee_leads'
          : campaignForm.segmentType;

      const payload = {
        title: campaignForm.title.trim(),
        subject: campaignForm.subject.trim(),
        body: campaignForm.body.trim(),
        segmentType: backendSegmentType,
        committeeId: targetCommitteeId,
        recipientUserIds: campaignForm.recipientUserIds,
        customRecipients: campaignForm.customRecipients,
        metadata: {
          sheetFileName: customSheetFileName || null,
          customColumns: customSheetColumns,
        },
        status: campaignForm.scheduledFor ? 'scheduled' : 'draft',
        scheduledFor: campaignForm.scheduledFor ? new Date(campaignForm.scheduledFor).toISOString() : null,
      };

      if (editingCampaign) {
        await api.updatePRCampaign(editingCampaign.id, payload);
        toast.success('Campaign Updated', 'Campaign draft saved successfully.');
      } else {
        await api.createPRCampaign(payload);
        toast.success('Campaign Created', 'Outreach campaign created successfully.');
      }
      setShowCampaignModal(false);
      loadCampaigns();
    } catch (err) {
      toast.error('Save Failed', err.message || 'Failed to save campaign.');
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleSendCampaign = async (camp) => {
    if (!window.confirm(`Are you ready to dispatch "${camp.title}" to target recipients now?`)) return;

    setSendingCampaignId(camp.id);
    try {
      const res = await api.sendPRCampaign(camp.id);
      toast.success(
        'Campaign Dispatched',
        `Dispatched to ${res?.dispatch?.sentCount || res?.recipientCount || camp.recipientCount || 'target'} recipients successfully.`
      );
      loadCampaigns();
      if (selectedLogCampaign?.id === camp.id) {
        handleOpenDeliveryLogs(camp);
      }
    } catch (err) {
      toast.error('Dispatch Failed', err.message || 'Failed to dispatch email campaign.');
    } finally {
      setSendingCampaignId(null);
    }
  };

  const handleArchiveCampaign = async (camp) => {
    try {
      await api.archivePRCampaign(camp.id);
      toast.success('Campaign Archived', `"${camp.title}" moved to archive.`);
      loadCampaigns();
    } catch (err) {
      toast.error('Archive Failed', err.message || 'Failed to archive campaign.');
    }
  };

  const handleUnarchiveCampaign = async (camp) => {
    try {
      await api.unarchivePRCampaign(camp.id);
      toast.success('Campaign Restored', `"${camp.title}" restored to active campaigns.`);
      loadCampaigns();
    } catch (err) {
      toast.error('Restore Failed', err.message || 'Failed to restore campaign.');
    }
  };

  const handleDuplicateCampaign = async (camp) => {
    try {
      const res = await api.duplicatePRCampaign(camp.id);
      toast.success('Campaign Duplicated', 'New draft copy created successfully.');
      loadCampaigns();
      if (res?.campaign) {
        handleOpenEditCampaign(res.campaign);
      }
    } catch (err) {
      toast.error('Duplicate Failed', err.message || 'Failed to duplicate campaign.');
    }
  };

  const handleDeleteCampaign = async (camp) => {
    if (!window.confirm(`Are you sure you want to delete "${camp.title}"?`)) return;

    try {
      await api.deletePRCampaign(camp.id);
      toast.success('Campaign Deleted', 'Outreach campaign deleted.');
      loadCampaigns();
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Failed to delete campaign.');
    }
  };

  // ── Filtered Lists ────────────────────────────────────────────────────────
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];

  const filteredAnnouncements = safeAnnouncements.filter((a) => {
    if (categoryFilter && a.category !== categoryFilter) return false;
    if (visibilityFilter && a.visibility !== visibilityFilter) return false;
    if (announcementSearch.trim()) {
      const q = announcementSearch.trim().toLowerCase();
      const match =
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.body && a.body.toLowerCase().includes(q)) ||
        (a.authorName && a.authorName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const filteredCampaigns = safeCampaigns.filter((c) => {
    const isHr = c.metadata?.category === 'hr_outreach' || c.metadata?.source === 'hr_studio';
    if (campaignSubTab === 'active') {
      if (c.status === 'archived' && campaignStatusFilter !== 'archived') return false;
      if (isHr) return false;
    } else if (campaignSubTab === 'hr') {
      if (!isHr) return false;
      if (c.status === 'archived' && campaignStatusFilter !== 'archived') return false;
    } else if (campaignSubTab === 'archived') {
      if (c.status !== 'archived') return false;
    }

    if (campaignStatusFilter && c.status !== campaignStatusFilter) return false;
    if (campaignSegmentFilter && c.segmentType !== campaignSegmentFilter) return false;
    if (campaignSearch.trim()) {
      const q = campaignSearch.trim().toLowerCase();
      const match =
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        (c.committeeName && c.committeeName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Calculate Metrics for KPI bar
  const totalAnnouncements = safeAnnouncements.length;
  const pinnedAnnouncements = safeAnnouncements.filter((a) => a.isPinned).length;
  const activeCampaignsCount = safeCampaigns.filter((c) => c.status !== 'archived' && c.metadata?.category !== 'hr_outreach' && c.metadata?.source !== 'hr_studio').length;
  const hrCampaignsCount = safeCampaigns.filter((c) => c.status !== 'archived' && (c.metadata?.category === 'hr_outreach' || c.metadata?.source === 'hr_studio')).length;
  const archivedCampaignsCount = safeCampaigns.filter((c) => c.status === 'archived').length;
  const totalCampaigns = activeCampaignsCount;
  const totalEmailReach = safeCampaigns.reduce((acc, c) => acc + (Number(c.sentCount) || 0), 0);

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  // ── Access Restricted Guard ───────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="pr-studio" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="bento-card" style={{ maxWidth: 520, textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Broadcasts & Outreach Studio is reserved for <strong>PR Leads</strong>, <strong>Branch Officers</strong>, and <strong>Global Administrators</strong>.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="pr-studio">
      {/* Studio Header */}
      <div className="pr-studio__header">
        <h1>
          <Megaphone size={26} color="var(--color-primary)" />
          <span>Broadcasts & Outreach Studio</span>
        </h1>
      </div>

      {/* Top Single-Row KPI Bar */}
      <div className="pr-kpi-grid">
        <div className="pr-kpi-card">
          <div className="pr-kpi-icon-wrap pr-kpi-icon-wrap--primary">
            <Radio size={22} />
          </div>
          <div className="pr-kpi-content">
            <span className="pr-kpi-value">{totalAnnouncements}</span>
            <span className="pr-kpi-label">Announcements</span>
          </div>
        </div>

        <div className="pr-kpi-card">
          <div className="pr-kpi-icon-wrap pr-kpi-icon-wrap--amber">
            <Pin size={22} />
          </div>
          <div className="pr-kpi-content">
            <span className="pr-kpi-value">{pinnedAnnouncements}</span>
            <span className="pr-kpi-label">Pinned Broadcasts</span>
          </div>
        </div>

        <div className="pr-kpi-card">
          <div className="pr-kpi-icon-wrap pr-kpi-icon-wrap--purple">
            <Mail size={22} />
          </div>
          <div className="pr-kpi-content">
            <span className="pr-kpi-value">{totalCampaigns}</span>
            <span className="pr-kpi-label">Email Campaigns</span>
          </div>
        </div>

        <div className="pr-kpi-card">
          <div className="pr-kpi-icon-wrap pr-kpi-icon-wrap--accent">
            <Users size={22} />
          </div>
          <div className="pr-kpi-content">
            <span className="pr-kpi-value">{totalEmailReach.toLocaleString()}</span>
            <span className="pr-kpi-label">Total Email Reach</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="pr-tabs">
        <button
          type="button"
          className={`pr-tab ${activeTab === 'announcements' ? 'pr-tab--active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <Radio size={16} />
          <span>Announcements & Broadcasts</span>
          <span className="pr-tab__badge">{safeAnnouncements.length}</span>
        </button>

        <button
          type="button"
          className={`pr-tab ${activeTab === 'campaigns' ? 'pr-tab--active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <Mail size={16} />
          <span>Email Outreach Campaigns</span>
          <span className="pr-tab__badge">{safeCampaigns.length}</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Announcements & Public Broadcasts                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'announcements' && (
        <>
          {/* Toolbar */}
          <div className="pr-toolbar">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreateAnnouncement}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>New Announcement</span>
            </button>

            <div className="pr-search-wrap">
              <Search size={15} />
              <input
                type="text"
                className="pr-search-input"
                placeholder="Search announcements by title, content, or author..."
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
              />
            </div>

            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 150 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 140 }}
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
            >
              <option value="">All Visibilities</option>
              <option value="public">Public</option>
              <option value="internal">Internal Only</option>
            </select>
          </div>

          {/* Announcements Grid */}
          {loadingAnnouncements ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-16)', color: 'var(--color-text-muted)' }}>
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading announcements...</span>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: 'var(--space-16)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              <Radio size={36} style={{ opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>No Announcements Found</h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Try adjusting your search criteria or publish a new broadcast.</p>
            </div>
          ) : (
            <div className="pr-portal-feed-grid">
              {filteredAnnouncements.map((ann) => (
                <article key={ann.id} className={`pr-portal-feed-card ${ann.isPinned ? 'pr-portal-feed-card--pinned' : ''}`}>
                  {/* Banner Image */}
                  <div
                    className="pr-portal-feed-card__banner"
                    style={{ cursor: ann.imageUrl ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (ann.imageUrl) setSelectedImage(ann.imageUrl);
                    }}
                    title={ann.imageUrl ? 'Click to view full resolution banner' : undefined}
                  >
                    {ann.imageUrl ? (
                      <img src={ann.imageUrl} alt={ann.title} loading="lazy" />
                    ) : (
                      <div className="pr-announcement-card__placeholder-banner">
                        <Megaphone size={32} style={{ opacity: 0.4 }} />
                      </div>
                    )}

                    {ann.isPinned && (
                      <div className="pr-announcement-card__pinned-badge" title="Pinned Announcement">
                        <Pin size={13} style={{ transform: 'rotate(45deg)' }} />
                      </div>
                    )}

                    <div className={`pr-announcement-card__visibility-badge pr-announcement-card__visibility-badge--${ann.visibility || 'public'}`}>
                      {ann.visibility === 'public' ? 'Public' : 'Internal'}
                    </div>

                    {ann.imageUrl && (
                      <button
                        type="button"
                        className="pr-announcement-card__enlarge-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(ann.imageUrl);
                        }}
                        title="Click to zoom image in full screen"
                      >
                        <ZoomIn size={12} />
                        <span>Enlarge Banner</span>
                      </button>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="pr-portal-feed-card__body">
                    <div className="pr-portal-feed-card__meta">
                      <span className={`badge ${getCategoryBadgeClass(ann.category)}`} style={{ fontSize: '0.71875rem' }}>
                        {ann.category || 'General'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <Calendar size={12} />
                        <span>{formatDate(ann.createdAt)}</span>
                      </div>
                    </div>

                    <h3 className="pr-portal-feed-card__title" title={ann.title}>
                      {ann.title}
                    </h3>

                    {ann.body && (
                      <p className="pr-portal-feed-card__excerpt">
                        {ann.body}
                      </p>
                    )}

                    {/* Footer & Actions */}
                    <div className="pr-portal-feed-card__footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={13} style={{ color: 'var(--color-primary)' }} />
                        <span>
                          Published by: <strong style={{ color: 'var(--color-text)' }}>{ann.authorName || 'Branch Executive Board'}</strong>
                        </span>
                      </div>

                      <div className="pr-action-menu-wrap">
                        <button
                          type="button"
                          className="pr-action-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId(openActionMenuId === ann.id ? null : ann.id);
                          }}
                          aria-label="Announcement actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openActionMenuId === ann.id && (
                          <div className="pr-action-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div
                              className="pr-action-menu-item"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleOpenEditAnnouncement(ann);
                              }}
                            >
                              <Edit2 size={14} />
                              <span>Edit Announcement</span>
                            </div>

                            <div
                              className="pr-action-menu-item"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleTogglePin(ann);
                              }}
                            >
                              {ann.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                              <span>{ann.isPinned ? 'Unpin Announcement' : 'Pin to Top'}</span>
                            </div>

                            <Link
                              to="/announcements"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pr-action-menu-item"
                              onClick={() => setOpenActionMenuId(null)}
                            >
                              <ExternalLink size={14} />
                              <span>View on Public Feed</span>
                            </Link>

                            <div className="pr-action-menu-divider" />

                            <div
                              className="pr-action-menu-item pr-action-menu-item--danger"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleDeleteAnnouncement(ann);
                              }}
                            >
                              <Trash2 size={14} />
                              <span>Delete Announcement</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Email Outreach Campaigns                                      */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <>
          {/* Sub-Tabs: Active vs HR vs Archived */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
            <div style={{ display: 'inline-flex', background: 'var(--color-surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', gap: '3px' }}>
              <button
                type="button"
                className={`btn btn-xs ${campaignSubTab === 'active' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setCampaignSubTab('active');
                  if (campaignStatusFilter === 'archived') setCampaignStatusFilter('');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
              >
                <Mail size={13} />
                <span>Active</span>
                <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>
                  ({activeCampaignsCount})
                </span>
              </button>
              <button
                type="button"
                className={`btn btn-xs ${campaignSubTab === 'hr' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setCampaignSubTab('hr');
                  if (campaignStatusFilter === 'archived') setCampaignStatusFilter('');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
              >
                <Users size={13} />
                <span>HR</span>
                <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>
                  ({hrCampaignsCount})
                </span>
              </button>
              <button
                type="button"
                className={`btn btn-xs ${campaignSubTab === 'archived' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setCampaignSubTab('archived');
                  setCampaignStatusFilter('archived');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem' }}
              >
                <Archive size={13} />
                <span>Archived</span>
                <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>
                  ({archivedCampaignsCount})
                </span>
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="pr-toolbar">
            {campaignSubTab === 'active' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenCreateCampaign}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} />
                <span>New Outreach Campaign</span>
              </button>
            )}

            {campaignSubTab === 'hr' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <Users size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Automated Candidate Recruitment &amp; Onboarding Outreach</span>
              </div>
            )}

            <div className="pr-search-wrap">
              <Search size={15} />
              <input
                type="text"
                className="pr-search-input"
                placeholder="Search campaigns by title, subject, or committee..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
              />
            </div>

            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 140 }}
              value={campaignStatusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setCampaignStatusFilter(val);
                if (val === 'archived') {
                  setCampaignSubTab('archived');
                } else if (campaignSubTab === 'archived' && val !== 'archived') {
                  setCampaignSubTab('active');
                }
              }}
            >
              <option value="">{campaignSubTab === 'archived' ? 'All Archived' : 'All Statuses'}</option>
              {campaignSubTab !== 'archived' && (
                <>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </>
              )}
              <option value="archived">Archived</option>
            </select>

            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 160 }}
              value={campaignSegmentFilter}
              onChange={(e) => setCampaignSegmentFilter(e.target.value)}
            >
              <option value="">All Audiences</option>
              <option value="all_members">All Members</option>
              <option value="committee_members">Committee Members</option>
              <option value="committee_leads">Committee Leads</option>
              <option value="specific_members">Specific Members</option>
              <option value="custom_sheet">Custom Spreadsheet / Candidates</option>
            </select>
          </div>

          {/* Campaigns Grid */}
          {loadingCampaigns ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-16)', color: 'var(--color-text-muted)' }}>
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading outreach campaigns...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: 'var(--space-16)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              {campaignSubTab === 'archived' ? (
                <>
                  <Archive size={36} style={{ opacity: 0.5 }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>No Archived Campaigns</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Archived email campaigns will appear here to keep your active lists clean.</p>
                </>
              ) : campaignSubTab === 'hr' ? (
                <>
                  <Users size={36} style={{ opacity: 0.5 }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>No HR Outreach Campaigns Found</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Automated applicant recruitment notices and onboarding welcome campaigns dispatched from HR Studio will appear here.</p>
                </>
              ) : (
                <>
                  <Mail size={36} style={{ opacity: 0.5 }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>No Active Campaigns Found</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Create an email campaign to notify branch members and leads.</p>
                </>
              )}
            </div>
          ) : (
            <div className="pr-campaign-grid">
              {filteredCampaigns.map((camp) => {
                const isDraft = camp.status === 'draft';
                const isScheduled = camp.status === 'scheduled';
                const isSent = camp.status === 'sent';
                const isFailed = camp.status === 'failed';
                const isArchived = camp.status === 'archived';
                const isSending = sendingCampaignId === camp.id;
                const isHrCampaign = camp.metadata?.category === 'hr_outreach' || camp.metadata?.source === 'hr_studio';

                const audienceLabel =
                  camp.segmentType === 'all_members'
                    ? 'All Branch Members'
                    : camp.segmentType === 'committee_leads'
                    ? 'Committee Leads'
                    : camp.segmentType === 'specific_members'
                    ? 'Specific Members'
                    : camp.segmentType === 'custom_sheet'
                    ? (isHrCampaign ? 'HR Candidate List' : 'Custom Sheet')
                    : `Committee: ${camp.committeeName || 'Selected'}`;

                return (
                  <div key={camp.id} className="pr-campaign-card" style={isArchived ? { opacity: 0.85, borderStyle: 'dashed' } : undefined}>
                    {/* Header */}
                    <div className="pr-campaign-card__header">
                      <h4 className="pr-campaign-card__title" title={camp.title}>
                        {camp.title}
                      </h4>
                      <span
                        className={`badge ${
                          isArchived
                            ? 'badge-outline'
                            : isSent
                            ? 'badge-accent'
                            : isScheduled
                            ? 'badge-warning'
                            : isFailed
                            ? 'badge-destructive'
                            : 'badge-outline'
                        }`}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: isArchived ? 'var(--color-text-muted)' : undefined,
                          borderColor: isArchived ? 'var(--color-border)' : undefined,
                        }}
                      >
                        {isArchived ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Archive size={10} />
                            <span>Archived</span>
                          </span>
                        ) : (
                          camp.status
                        )}
                      </span>
                    </div>

                    {/* Subject Line */}
                    <div className="pr-campaign-card__subject" title={camp.subject}>
                      <Mail size={13} style={{ flexShrink: 0 }} />
                      <span>{camp.subject}</span>
                    </div>

                    {/* Audience Segment & Category Badges */}
                    <div className="pr-campaign-card__badges">
                      {isHrCampaign && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={11} />
                          <span>HR Outreach</span>
                        </span>
                      )}

                      <span className="badge badge-committee" style={{ fontSize: '0.7rem' }}>
                        <Users size={11} />
                        <span>{audienceLabel}</span>
                      </span>

                      {camp.scheduledFor && (
                        <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                          <Clock size={11} />
                          <span>Scheduled: {formatDate(camp.scheduledFor)}</span>
                        </span>
                      )}
                    </div>

                    {/* Recipient Stats Box */}
                    <div className="pr-campaign-card__stats">
                      <div className="pr-campaign-card__stat-item">
                        <span className="pr-campaign-card__stat-num">{camp.recipientCount || 0}</span>
                        <span className="pr-campaign-card__stat-label">Recipients</span>
                      </div>
                      <div className="pr-campaign-card__stat-item">
                        <span className="pr-campaign-card__stat-num" style={{ color: '#10b981' }}>{camp.sentCount || 0}</span>
                        <span className="pr-campaign-card__stat-label">Sent</span>
                      </div>
                      <div className="pr-campaign-card__stat-item">
                        <span className="pr-campaign-card__stat-num" style={{ color: camp.failedCount > 0 ? '#ef4444' : 'inherit' }}>
                          {camp.failedCount || 0}
                        </span>
                        <span className="pr-campaign-card__stat-label">Failed</span>
                      </div>
                    </div>

                    {/* Actions: Icon Toolbar on Left, Send Now on Right */}
                    <div className="pr-campaign-card__actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
                      {/* Left Side: Icon Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleOpenDeliveryLogs(camp)}
                          title="Details & Delivery Logs"
                          style={{ padding: '0.25rem 0.4rem', color: 'var(--color-text-muted)' }}
                          aria-label="Details & Delivery Logs"
                        >
                          <FileText size={13} />
                        </button>

                        {isArchived ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleUnarchiveCampaign(camp)}
                              title="Restore campaign to active list"
                              style={{ padding: '0.25rem 0.4rem' }}
                            >
                              <RotateCcw size={12} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleDuplicateCampaign(camp)}
                              title="Duplicate into New Draft"
                              style={{ padding: '0.25rem 0.4rem' }}
                            >
                              <Copy size={12} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleDeleteCampaign(camp)}
                              style={{ color: '#ef4444', padding: '0.25rem 0.4rem' }}
                              aria-label="Delete campaign"
                              title="Delete permanently"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            {(isDraft || isScheduled) && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => handleOpenEditCampaign(camp)}
                                style={{ padding: '0.25rem 0.4rem' }}
                                title="Edit Campaign"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleDuplicateCampaign(camp)}
                              title="Duplicate into New Draft"
                              style={{ padding: '0.25rem 0.4rem' }}
                            >
                              <Copy size={12} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleArchiveCampaign(camp)}
                              title="Archive Campaign"
                              style={{ color: 'var(--color-text-muted)', padding: '0.25rem 0.4rem' }}
                            >
                              <Archive size={13} />
                            </button>

                            {isDraft && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => handleDeleteCampaign(camp)}
                                style={{ color: '#ef4444', padding: '0.25rem 0.4rem' }}
                                aria-label="Delete campaign"
                                title="Delete Draft"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Right Side: Send Now Button Alone */}
                      <div>
                        {!isArchived && (isDraft || isScheduled) && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            disabled={isSending}
                            onClick={() => handleSendCampaign(camp)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            {isSending ? (
                              <>
                                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                <span>Sending…</span>
                              </>
                            ) : (
                              <>
                                <Send size={12} />
                                <span>Send Now</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Create / Edit Announcement (Side-by-Side Split View)            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showAnnouncementModal && (
        <div className="modal-overlay" {...announcementBackdrop.getBackdropProps()}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 1020, width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h3>
                <Megaphone size={18} color="var(--color-primary)" />
                <span>{editingAnnouncement ? 'Edit Announcement' : 'New Public Announcement'}</span>
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAnnouncementModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>
                <div className="pr-composer-split">
                  {/* Left Column: Form Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Title */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Announcement Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. IEEE Menoufia Tech Week 2026 Announced!"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Category Pills */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Category *</label>
                      <div className="pr-category-pills">
                        {ANNOUNCEMENT_CATEGORIES.map((cat) => {
                          const isSelected = announcementForm.category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              className={`pr-category-pill ${isSelected ? 'pr-category-pill--active' : ''}`}
                              onClick={() => setAnnouncementForm((p) => ({ ...p, category: cat }))}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Body (Optional) */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Announcement Content</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Write the optional announcement details or summary..."
                        value={announcementForm.body}
                        onChange={(e) => setAnnouncementForm((p) => ({ ...p, body: e.target.value }))}
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    {/* Banner Image Uploader */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Banner Image</label>
                      {bannerPreview ? (
                        <div className="pr-uploader-file-bar">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
                            <FileText size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              Banner Image Attached
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                            <label className="btn btn-ghost btn-xs" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                disabled={uploadingBanner}
                                onChange={(e) => handleBannerUpload(e.target.files?.[0])}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-danger"
                              onClick={() => {
                                setBannerPreview(null);
                                setAnnouncementForm((p) => ({ ...p, imageUrl: null }));
                              }}
                              title="Remove banner image"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`pr-uploader-dropzone ${uploadingBanner ? 'pr-uploader-dropzone--active' : ''}`}>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            disabled={uploadingBanner}
                            onChange={(e) => handleBannerUpload(e.target.files?.[0])}
                          />
                          {uploadingBanner ? (
                            <>
                              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Uploading…</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={24} color="var(--color-primary)" />
                              <span style={{ fontSize: '0.84375rem', fontWeight: 600 }}>Click or drag banner image here</span>
                              <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>PNG, JPG, or WebP up to 5MB</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>

                    {/* Pin to Top Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.85rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <input
                        type="checkbox"
                        id="pr-pin-checkbox"
                        checked={announcementForm.isPinned}
                        onChange={(e) => setAnnouncementForm((p) => ({ ...p, isPinned: e.target.checked }))}
                      />
                      <label htmlFor="pr-pin-checkbox" style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer', margin: 0 }}>
                        Pin this announcement to top of the feed
                      </label>
                    </div>

                    {/* Visibility & Byline (2 columns) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Audience Visibility</label>
                        <select
                          className="form-input"
                          value={announcementForm.visibility}
                          onChange={(e) => setAnnouncementForm((p) => ({ ...p, visibility: e.target.value }))}
                        >
                          <option value="public">Public (Everyone)</option>
                          <option value="internal">Internal (Members Only)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Author</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Executive Board"
                          value={announcementForm.authorName}
                          onChange={(e) => setAnnouncementForm((p) => ({ ...p, authorName: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Card Preview */}
                  <div className="pr-composer-preview-panel">
                    <div className="pr-composer-preview-header">
                      <h4>
                        <span>Live Card Preview</span>
                      </h4>
                      <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>Live</span>
                    </div>

                    <article className={`pr-portal-feed-card ${announcementForm.isPinned ? 'pr-portal-feed-card--pinned' : ''}`}>
                      <div
                        className="pr-portal-feed-card__banner"
                        style={{ cursor: bannerPreview ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (bannerPreview) setSelectedImage(bannerPreview);
                        }}
                        title={bannerPreview ? 'Click to view full resolution banner' : undefined}
                      >
                        {bannerPreview ? (
                          <img src={bannerPreview} alt="Preview" loading="lazy" />
                        ) : (
                          <div className="pr-announcement-card__placeholder-banner">
                            <Megaphone size={32} style={{ opacity: 0.4 }} />
                          </div>
                        )}
                        {announcementForm.isPinned && (
                          <div className="pr-announcement-card__pinned-badge" title="Pinned Announcement">
                            <Pin size={13} style={{ transform: 'rotate(45deg)' }} />
                          </div>
                        )}
                        <div className={`pr-announcement-card__visibility-badge pr-announcement-card__visibility-badge--${announcementForm.visibility}`}>
                          {announcementForm.visibility === 'public' ? 'Public' : 'Internal'}
                        </div>
                        {bannerPreview && (
                          <button
                            type="button"
                            className="pr-announcement-card__enlarge-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(bannerPreview);
                            }}
                            title="Click to zoom image in full screen"
                          >
                            <ZoomIn size={12} />
                            <span>Enlarge Banner</span>
                          </button>
                        )}
                      </div>

                      <div className="pr-portal-feed-card__body">
                        <div className="pr-portal-feed-card__meta">
                          <span className={`badge ${getCategoryBadgeClass(announcementForm.category)}`} style={{ fontSize: '0.71875rem' }}>
                            {announcementForm.category || 'General'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <Calendar size={12} />
                            <span>Today</span>
                          </div>
                        </div>

                        <h3 className="pr-portal-feed-card__title">
                          {announcementForm.title || 'Untitled Announcement'}
                        </h3>

                        <p className="pr-portal-feed-card__excerpt">
                          {announcementForm.body || 'No description provided (optional).'}
                        </p>

                        <div className="pr-portal-feed-card__footer">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={13} style={{ color: 'var(--color-primary)' }} />
                            <span>
                              Published by: <strong style={{ color: 'var(--color-text)' }}>{announcementForm.authorName || 'Branch Executive Board'}</strong>
                            </span>
                          </div>
                          <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>Menoufia SB</span>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAnnouncementModal(false)}
                  disabled={savingAnnouncement}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingAnnouncement || uploadingBanner}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {savingAnnouncement ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>{editingAnnouncement ? 'Save Changes' : 'Publish Announcement'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Create / Edit Campaign (Side-by-Side Split View & Live Client)  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showCampaignModal && (
        <div className="modal-overlay" {...campaignBackdrop.getBackdropProps()}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 1260, width: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h3>
                <Mail size={18} color="var(--color-primary)" />
                <span>{editingCampaign ? 'Edit Email Outreach Campaign' : 'New Email Outreach Campaign'}</span>
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCampaignModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>
                <div className="pr-campaign-split">
                  {/* Left Column: Campaign Form & Target Configuration */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Internal Title */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Internal Campaign Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., General Membership Tech Brief #2"
                        value={campaignForm.title}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, title: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Email Subject */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Email Subject Line *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., 🚀 Welcome {{user.name}} - IEEE Menoufia Tech Week"
                        value={campaignForm.subject}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, subject: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Dynamic Variable Chips & Email Body */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <label className="form-label" style={{ margin: 0 }}>
                          {campaignForm.templateMode === 'full' ? 'Full Email HTML Template *' : 'Email Content Body *'}
                        </label>

                        <div style={{ display: 'inline-flex', background: 'var(--color-surface)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gap: '2px' }}>
                          <button
                            type="button"
                            className={`btn btn-xs ${campaignForm.templateMode !== 'full' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handleToggleTemplateMode('standard')}
                            style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                            title="Standard Content: Write simple text/markdown wrapped in default IEEE styling"
                          >
                            Standard Content
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs ${campaignForm.templateMode === 'full' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handleToggleTemplateMode('full')}
                            style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                            title="Full HTML Template: Edit the entire <!DOCTYPE html> template including outer table, gradient header & footer"
                          >
                            <Code size={11} />
                            <span>Full HTML Template</span>
                          </button>
                        </div>
                      </div>

                      {campaignForm.templateMode === 'full' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 98, 155, 0.08)', border: '1px solid rgba(0, 98, 155, 0.25)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            Editing complete <code style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>&lt;!DOCTYPE html&gt;</code> document.
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={handleResetToDefaultTemplate}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', flexShrink: 0 }}
                            title="Reset to default official IEEE Menoufia email structure"
                          >
                            <RotateCcw size={11} />
                            <span>Reset to Default</span>
                          </button>
                        </div>
                      )}

                      <div className="pr-vars-toolbar">
                        <span className="pr-vars-label">Insert Dynamic Tags:</span>
                        <button
                          type="button"
                          className="pr-var-chip"
                          onClick={() => insertVariableTag('user.name')}
                          title="Recipient's Full Name"
                        >
                          + &#123;&#123;user.name&#125;&#125;
                        </button>
                        <button
                          type="button"
                          className="pr-var-chip"
                          onClick={() => insertVariableTag('user.email')}
                          title="Recipient's Email Address"
                        >
                          + &#123;&#123;user.email&#125;&#125;
                        </button>
                        <button
                          type="button"
                          className="pr-var-chip"
                          onClick={() => insertVariableTag('user.committee')}
                          title="Assigned Committee Name"
                        >
                          + &#123;&#123;user.committee&#125;&#125;
                        </button>
                        <button
                          type="button"
                          className="pr-var-chip"
                          onClick={() => insertVariableTag('user.role')}
                          title="Member Role"
                        >
                          + &#123;&#123;user.role&#125;&#125;
                        </button>

                        {/* Custom Sheet Column Chips */}
                        {customSheetColumns.map((col) => (
                          <button
                            key={col}
                            type="button"
                            className="pr-var-chip pr-var-chip--custom"
                            onClick={() => insertVariableTag(`sheet.${col}`)}
                            title={`Custom column from uploaded spreadsheet: ${col}`}
                          >
                            + &#123;&#123;sheet.{col}&#125;&#125;
                          </button>
                        ))}
                      </div>

                      {/* Formatting Toolbar */}
                      <div className="pr-editor-toolbar">
                        <div className="pr-editor-btn-group">
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyFormatting('bold')}
                            title="Bold"
                          >
                            <Bold size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyFormatting('italic')}
                            title="Italic"
                          >
                            <Italic size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyFormatting('h2')}
                            title="Heading 2"
                          >
                            <Heading2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyFormatting('h3')}
                            title="Heading 3"
                          >
                            <Heading3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyFormatting('list')}
                            title="Bullet List"
                          >
                            <List size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyFormatting('link')}
                            title="Insert Link"
                          >
                            <Link2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyFormatting('divider')}
                            title="Horizontal Divider"
                          >
                            <Minus size={13} />
                          </button>
                        </div>

                        {campaignForm.templateMode !== 'full' && (
                          <button
                            type="button"
                            className="pr-editor-mode-toggle"
                            onClick={() =>
                              setCampaignForm((p) => ({
                                ...p,
                                editorMode: p.editorMode === 'markdown' ? 'html' : 'markdown',
                              }))
                            }
                          >
                            <Code size={12} />
                            <span>{campaignForm.editorMode === 'html' ? 'Custom HTML Mode' : 'Markdown Mode'}</span>
                          </button>
                        )}
                      </div>

                      {/* Textarea Body */}
                      <textarea
                        ref={bodyTextareaRef}
                        className="form-input"
                        rows={campaignForm.templateMode === 'full' ? 12 : 7}
                        placeholder={
                          campaignForm.templateMode === 'full'
                            ? '<!DOCTYPE html>\n<html>\n  <body>...</body>\n</html>'
                            : (campaignForm.editorMode === 'html'
                                ? '<h2>Hello {{user.name}}</h2>\n<p>Write custom HTML here...</p>'
                                : 'Hello {{user.name}},\n\nWrite your email body in Markdown or text...')
                        }
                        value={campaignForm.body}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, body: e.target.value }))}
                        required
                        style={{
                          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                          borderTop: 'none',
                          resize: 'vertical',
                          fontFamily: (campaignForm.templateMode === 'full' || campaignForm.editorMode === 'html') ? 'var(--font-mono)' : 'inherit',
                          fontSize: (campaignForm.templateMode === 'full' || campaignForm.editorMode === 'html') ? '0.78125rem' : '0.875rem',
                          lineHeight: '1.5',
                        }}
                      />
                    </div>

                    {/* Target Audience Segment Selection */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Target Audience Segment *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                        {TARGET_SEGMENTS.map((seg) => {
                          const isSelected = campaignForm.segmentType === seg.value;
                          return (
                            <label
                              key={seg.value}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                padding: '0.55rem 0.65rem',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                                background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <input
                                type="radio"
                                name="targetSegment"
                                value={seg.value}
                                checked={isSelected}
                                onChange={() => setCampaignForm((p) => ({ ...p, segmentType: seg.value }))}
                                style={{ marginTop: '0.15rem' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.78125rem', color: 'var(--color-text)' }}>
                                  {seg.label}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.25 }}>
                                  {seg.desc}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Specific Committee Dropdown (for Specific Committee Members or Specific Committee Leads) */}
                    {(campaignForm.segmentType === 'committee_members' || campaignForm.segmentType === 'committee_leads_specific') && (
                      <div className="form-group" style={{ margin: 0, animation: 'fadeIn 0.2s ease' }}>
                        <label className="form-label">Select Target Committee *</label>
                        <select
                          className="form-input"
                          value={campaignForm.committeeId}
                          onChange={(e) => setCampaignForm((p) => ({ ...p, committeeId: e.target.value }))}
                          required
                        >
                          <option value="">-- Choose Committee --</option>
                          {committees.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Specific Members Selector */}
                    {campaignForm.segmentType === 'specific_members' && (
                      <div className="pr-member-selector-box" style={{ animation: 'fadeIn 0.2s ease' }}>
                        <label className="form-label" style={{ margin: 0 }}>
                          Select Specific Members ({campaignForm.recipientUserIds.length} selected)
                        </label>
                        <div className="pr-search-wrap">
                          <Search size={14} />
                          <input
                            type="text"
                            className="pr-search-input"
                            placeholder="Search member by name or email..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                          />
                        </div>

                        {/* Selected Members Chips */}
                        {campaignForm.recipientUserIds.length > 0 && (
                          <div className="pr-member-selected-chips">
                            {campaignForm.recipientUserIds.map((uid) => {
                              const m = allBranchMembers.find((item) => (item.id || item.userId) === uid);
                              return (
                                <span key={uid} className="pr-member-chip">
                                  <span>{m?.name || m?.email || uid}</span>
                                  <X
                                    size={12}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleToggleSpecificMember({ id: uid })}
                                  />
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Search Results List */}
                        <div className="pr-member-search-results">
                          {loadingBranchMembers ? (
                            <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Searching branch members…</span>
                            </div>
                          ) :  (() => {
                            const q = memberSearchQuery.toLowerCase().trim();
                            const matches = allBranchMembers.filter((m) =>
                              (m.name && m.name.toLowerCase().includes(q)) ||
                              (m.email && m.email.toLowerCase().includes(q))
                            );

                            return matches.slice(0, 20).map((m) => {
                              const mid = m.id || m.userId;
                              const isSelected = campaignForm.recipientUserIds.includes(mid);
                              return (
                                <div
                                  key={mid}
                                  className="pr-member-search-item"
                                  onClick={() => handleToggleSpecificMember(m)}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                    <strong style={{ color: 'var(--color-text)' }}>{m.name || 'Branch Member'}</strong>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{m.email}</span>
                                  </div>
                                  <button
                                    type="button"
                                    className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                  >
                                    {isSelected ? <Check size={12} /> : <Plus size={12} />}
                                    <span>{isSelected ? 'Added' : 'Add'}</span>
                                  </button>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Custom Sheet Uploader */}
                    {campaignForm.segmentType === 'custom_sheet' && (
                      <div style={{ animation: 'fadeIn 0.2s ease', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="form-label" style={{ margin: 0 }}>
                          Upload Recipient Spreadsheet (CSV / TSV)
                        </label>
                        {customSheetFileName ? (
                          <div className="pr-sheet-status-box">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
                              <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                  {customSheetFileName}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                  {campaignForm.customRecipients.length} recipients loaded &bull; {customSheetColumns.length} dynamic tags available
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-danger"
                              onClick={() => {
                                setCustomSheetFileName('');
                                setCustomSheetColumns([]);
                                setCampaignForm((p) => ({ ...p, customRecipients: [] }));
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </div>
                        ) : (
                          <label className="pr-sheet-dropzone">
                            <input
                              type="file"
                              accept=".csv,.tsv,.txt"
                              style={{ display: 'none' }}
                              onChange={handleSpreadsheetUpload}
                            />
                            <UploadCloud size={24} color="var(--color-primary)" />
                            <span style={{ fontSize: '0.84375rem', fontWeight: 600 }}>Click to select CSV / Spreadsheet</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              Auto-detects email column and adds dynamic tags for all column headers
                            </span>
                          </label>
                        )}
                      </div>
                    )}

                    {/* Scheduled Dispatch & Expected Recipients Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem', alignItems: 'end' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Scheduled (Optional)</label>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={campaignForm.scheduledFor}
                          onChange={(e) => setCampaignForm((p) => ({ ...p, scheduledFor: e.target.value }))}
                        />
                      </div>

                      <div
                        style={{
                          padding: '0.55rem 0.75rem',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          height: '2.5rem',
                        }}
                      >
                        <Users size={16} color="var(--color-primary)" />
                        <div style={{ fontSize: '0.78125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {previewLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text-muted)' }}>
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Calculating…</span>
                            </span>
                          ) : (
                            <span>{previewRecipientCount} Expected Recipients</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Simulated Live Email Client Preview */}
                  <div className="pr-composer-preview-panel">
                    <div className="pr-composer-preview-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Left: Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Eye size={15} color="var(--color-primary)" />
                        <h4 style={{ margin: 0, fontSize: '0.84375rem', fontWeight: 700 }}>Client Preview</h4>
                      </div>

                      {/* Middle: Recipient Navigator on Same Line */}
                      {previewRecipientsList.length > 1 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            disabled={previewRowIndex === 0}
                            onClick={() => setPreviewRowIndex((p) => Math.max(0, p - 1))}
                            style={{ padding: '0.1rem 0.25rem', height: '1.35rem', minHeight: '1.35rem' }}
                            title="Previous Recipient"
                          >
                            <ChevronLeft size={12} />
                          </button>
                          <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                            {previewRowIndex + 1} of {previewRecipientsList.length}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            disabled={previewRowIndex >= previewRecipientsList.length - 1}
                            onClick={() => setPreviewRowIndex((p) => Math.min(previewRecipientsList.length - 1, p + 1))}
                            style={{ padding: '0.1rem 0.25rem', height: '1.35rem', minHeight: '1.35rem' }}
                            title="Next Recipient"
                          >
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      ) : previewRecipientsList.length === 1 ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          1 recipient targeted
                        </span>
                      ) : null}

                      {/* Right: Smaller PC & Mobile Device Switcher */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px', gap: '7px', marginLeft: '12px' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${previewDeviceMode === 'desktop' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setPreviewDeviceMode('desktop')}
                          title="Desktop View"
                          style={{ padding: '0.1rem 0.35rem', height: '1.35rem', minHeight: '1.35rem', borderRadius: 'calc(var(--radius-sm) - 1px)' }}
                        >
                          <Monitor size={11} />
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${previewDeviceMode === 'mobile' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setPreviewDeviceMode('mobile')}
                          title="Mobile View"
                          style={{ padding: '0.1rem 0.35rem', height: '1.35rem', minHeight: '1.35rem', borderRadius: 'calc(var(--radius-sm) - 1px)' }}
                        >
                          <Smartphone size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Email Mock Window */}
                    {(() => {
                      const activeRecipient =
                        previewRecipientsList[previewRowIndex] || {
                          name: 'Yousef (Sample Recipient)',
                          email: 'member@ieee.local',
                          committeeName: 'AI & Robotics',
                          role: 'Member',
                          customFields: {},
                        };

                      const liveSubject = interpolatePreviewText(campaignForm.subject, activeRecipient);
                      const liveBodyInterpolated = interpolatePreviewText(campaignForm.body, activeRecipient);
                      const renderedHtml = renderMarkdownToHtml(liveBodyInterpolated);

                      return (
                        <div className="pr-email-client">
                          {/* Window Bar */}
                          <div className="pr-email-client__window-bar">
                            <div className="pr-email-client__dots">
                              <span className="pr-email-client__dot pr-email-client__dot--red" />
                              <span className="pr-email-client__dot pr-email-client__dot--yellow" />
                              <span className="pr-email-client__dot pr-email-client__dot--green" />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                              IEEE Menoufia Outreach Client
                            </span>
                            <div style={{ width: 30 }} />
                          </div>

                          {/* Email Headers Meta */}
                          <div className="pr-email-client__meta">
                            <div className="pr-email-client__meta-row">
                              <span className="pr-email-client__meta-label">From:</span>
                              <span className="pr-email-client__meta-val">IEEE Menoufia Student Branch &lt;noreply@ieee.local&gt;</span>
                            </div>
                            <div className="pr-email-client__meta-row">
                              <span className="pr-email-client__meta-label">To:</span>
                              <span className="pr-email-client__meta-val">
                                {activeRecipient.name} &lt;{activeRecipient.email}&gt;
                              </span>
                            </div>
                            <div className="pr-email-client__subject">
                              {liveSubject || '(Subject line preview)'}
                            </div>
                          </div>

                          {/* Email Body Frame */}
                          <div className="pr-email-client__body-container">
                            <div className={`pr-email-card-frame ${previewDeviceMode === 'mobile' ? 'pr-email-card-frame--mobile' : ''}`}>
                              {isFullHtmlDocument(liveBodyInterpolated) ? (
                                <div
                                  className="pr-email-custom-document"
                                  style={{ background: '#ffffff', overflow: 'hidden' }}
                                  dangerouslySetInnerHTML={{ __html: liveBodyInterpolated }}
                                />
                              ) : (
                                <>
                                  {/* Branded Header */}
                                  <div className="pr-email-header-banner">
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                                      IEEE Menoufia Student Branch
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: '#93c5fd', fontWeight: 500, marginTop: '4px' }}>
                                      Official Communications & Outreach
                                    </div>
                                  </div>

                                  {/* Content Body */}
                                  <div
                                    className="pr-email-content-body"
                                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                  />

                                  {/* Branded Footer */}
                                  <div className="pr-email-footer-banner">
                                    <div style={{ fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                      &copy; 2026 IEEE Menoufia Student Branch &bull; Menoufia University.
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                                      sent via IEEE MSB Portal &bull; All Rights Reserved.
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCampaignModal(false)}
                  disabled={savingCampaign}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingCampaign}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {savingCampaign ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      <span>{campaignForm.scheduledFor ? 'Schedule Campaign' : 'Save Campaign Draft'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Campaign Details & Delivery Logs                               */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {selectedLogCampaign && (
        <div className="modal-overlay" {...logsBackdrop.getBackdropProps()}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 820, width: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h3>
                <FileText size={18} color="var(--color-primary)" />
                <span>Campaign Details & Delivery Logs</span>
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedLogCampaign(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                    {selectedLogCampaign.title}
                  </h4>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    Subject: <strong>{selectedLogCampaign.subject}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className={`badge ${
                      selectedLogCampaign.status === 'sent'
                        ? 'badge-accent'
                        : selectedLogCampaign.status === 'scheduled'
                        ? 'badge-warning'
                        : selectedLogCampaign.status === 'failed'
                        ? 'badge-destructive'
                        : 'badge-outline'
                    }`}
                    style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  >
                    {selectedLogCampaign.status}
                  </span>

                  {(selectedLogCampaign.status === 'draft' || selectedLogCampaign.status === 'scheduled') && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={sendingCampaignId === selectedLogCampaign.id}
                      onClick={() => handleSendCampaign(selectedLogCampaign)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {sendingCampaignId === selectedLogCampaign.id ? (
                        <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>Send Now</span>
                    </button>
                  )}
                </div>
              </div>

              {/* View Mode Toggle Bar */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <button
                  type="button"
                  className={`btn btn-xs ${detailsViewMode === 'logs' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailsViewMode('logs')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78125rem' }}
                >
                  <FileText size={13} />
                  <span>Delivery Audit Logs</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${detailsViewMode === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailsViewMode('preview')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78125rem' }}
                >
                  <Eye size={13} />
                  <span>View Email Preview</span>
                </button>
              </div>

              {/* Metric Breakdown Stats */}
              <div className="pr-campaign-card__stats" style={{ marginBottom: '1.25rem' }}>
                <div className="pr-campaign-card__stat-item">
                  <span className="pr-campaign-card__stat-num">
                    {deliveryLogsData?.expectedRecipientCount || deliveryLogsData?.recipientCount || selectedLogCampaign.recipientCount || 0}
                  </span>
                  <span className="pr-campaign-card__stat-label">Expected Recipients</span>
                </div>
                <div className="pr-campaign-card__stat-item">
                  <span className="pr-campaign-card__stat-num" style={{ color: '#10b981' }}>
                    {deliveryLogsData?.sentCount ?? selectedLogCampaign.sentCount ?? 0}
                  </span>
                  <span className="pr-campaign-card__stat-label">Delivered</span>
                </div>
                <div className="pr-campaign-card__stat-item">
                  <span className="pr-campaign-card__stat-num" style={{ color: (deliveryLogsData?.failedCount || selectedLogCampaign.failedCount) > 0 ? '#ef4444' : 'inherit' }}>
                    {deliveryLogsData?.failedCount ?? selectedLogCampaign.failedCount ?? 0}
                  </span>
                  <span className="pr-campaign-card__stat-label">Failed</span>
                </div>
              </div>

              {/* Metadata Diagnostics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem', background: 'var(--color-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.78125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Target Audience: </span>
                  <strong>{selectedLogCampaign.segmentType || selectedLogCampaign.segment_type}</strong>
                </div>
                {selectedLogCampaign.committeeName && (
                  <div style={{ fontSize: '0.78125rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Committee: </span>
                    <strong>{selectedLogCampaign.committeeName}</strong>
                  </div>
                )}
                <div style={{ fontSize: '0.78125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Created: </span>
                  <span>{formatDate(selectedLogCampaign.createdAt || selectedLogCampaign.created_at)}</span>
                </div>
                {(selectedLogCampaign.sentAt || selectedLogCampaign.sent_at) && (
                  <div style={{ fontSize: '0.78125rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Dispatched: </span>
                    <span>{new Date(selectedLogCampaign.sentAt || selectedLogCampaign.sent_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Tab 1: Delivery Audit Logs Table */}
              {detailsViewMode === 'logs' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      Recipient Delivery Audit Logs
                    </span>
                    <div className="pr-search-wrap" style={{ width: 220 }}>
                      <Search size={13} />
                      <input
                        type="text"
                        className="pr-search-input"
                        placeholder="Filter by email or name..."
                        value={deliveryLogSearch}
                        onChange={(e) => setDeliveryLogSearch(e.target.value)}
                        style={{ fontSize: '0.75rem', height: '1.85rem' }}
                      />
                    </div>
                  </div>

                  {loadingDeliveryLogs ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.4rem' }} />
                      <div>Fetching detailed delivery logs…</div>
                    </div>
                  ) : (
                    <div className="pr-delivery-table-container">
                      <table className="pr-delivery-table">
                        <thead>
                          <tr>
                            <th>Recipient Email</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Delivered At</th>
                            <th>Details / Errors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const attempts = deliveryLogsData?.attempts || [];
                            const allLogs = attempts.flatMap((att) =>
                              Array.isArray(att.logs)
                                ? att.logs.map((l) => ({ ...l, attemptCreatedAt: att.createdAt }))
                                : []
                            );

                            // If no dispatch attempts yet, fallback to expected recipients list
                            const dataSource =
                              allLogs.length > 0
                                ? allLogs
                                : Array.isArray(deliveryLogsData?.expectedRecipients) && deliveryLogsData.expectedRecipients.length > 0
                                ? deliveryLogsData.expectedRecipients.map((r) => ({
                                    email: r.email,
                                    name: r.name,
                                    status: selectedLogCampaign.status === 'scheduled' ? 'scheduled' : 'ready',
                                    sentAt: null,
                                    error: selectedLogCampaign.status === 'scheduled' ? 'Scheduled for automatic dispatch' : 'Ready for dispatch',
                                  }))
                                : [];

                            const filteredLogs = dataSource.filter((l) => {
                              if (!deliveryLogSearch.trim()) return true;
                              const q = deliveryLogSearch.toLowerCase();
                              return (
                                (l.email && l.email.toLowerCase().includes(q)) ||
                                (l.name && l.name.toLowerCase().includes(q))
                              );
                            });

                            if (filteredLogs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1.5rem' }}>
                                    {dataSource.length === 0
                                      ? 'No recipients found for this audience segment.'
                                      : 'No recipient logs matching your search filter.'}
                                  </td>
                                </tr>
                              );
                            }

                            return filteredLogs.map((l, idx) => (
                              <tr key={`${l.email}-${idx}`}>
                                <td style={{ fontWeight: 600 }}>{l.email}</td>
                                <td>{l.name || 'Member'}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      l.status === 'sent'
                                        ? 'badge-success'
                                        : l.status === 'failed'
                                        ? 'badge-destructive'
                                        : l.status === 'scheduled'
                                        ? 'badge-warning'
                                        : 'badge-outline'
                                    }`}
                                    style={{ fontSize: '0.6875rem' }}
                                  >
                                    {l.status}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                  {l.sentAt ? new Date(l.sentAt).toLocaleTimeString() : '—'}
                                </td>
                                <td style={{ fontSize: '0.72rem', color: l.error && l.status === 'failed' ? '#ef4444' : 'var(--color-text-muted)' }}>
                                  {l.error || 'Delivered successfully'}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Live Email Preview Tab */}
              {detailsViewMode === 'preview' && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  {(() => {
                    const sampleRecipient =
                      (Array.isArray(deliveryLogsData?.expectedRecipients) && deliveryLogsData.expectedRecipients[0]) || {
                        name: 'Member Name',
                        email: 'member@ieee.local',
                        committeeName: selectedLogCampaign.committeeName || 'IEEE Menoufia SB',
                        role: 'Member',
                      };

                    const renderedBody = renderMarkdownToHtml(
                      interpolatePreviewText(selectedLogCampaign.body, sampleRecipient)
                    );
                    const renderedSubject = interpolatePreviewText(
                      selectedLogCampaign.subject,
                      sampleRecipient
                    );

                    return (
                      <div className="pr-email-client" style={{ maxWidth: '100%' }}>
                        <div className="pr-email-client__window-bar">
                          <div className="pr-email-client__dots">
                            <span className="pr-email-client__dot pr-email-client__dot--red" />
                            <span className="pr-email-client__dot pr-email-client__dot--yellow" />
                            <span className="pr-email-client__dot pr-email-client__dot--green" />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                            Email Render Preview
                          </span>
                          <div style={{ width: 30 }} />
                        </div>

                        <div className="pr-email-client__meta">
                          <div className="pr-email-client__meta-row">
                            <span className="pr-email-client__meta-label">From:</span>
                            <span className="pr-email-client__meta-val">IEEE Menoufia Student Branch &lt;noreply@ieee.local&gt;</span>
                          </div>
                          <div className="pr-email-client__meta-row">
                            <span className="pr-email-client__meta-label">To:</span>
                            <span className="pr-email-client__meta-val">
                              {sampleRecipient.name} &lt;{sampleRecipient.email}&gt;
                            </span>
                          </div>
                          <div className="pr-email-client__subject">
                            {renderedSubject}
                          </div>
                        </div>

                        <div className="pr-email-client__body-container">
                          <div className="pr-email-card-frame">
                            {isFullHtmlDocument(selectedLogCampaign.body) ? (
                              <div
                                className="pr-email-custom-document"
                                style={{ background: '#ffffff', overflow: 'hidden' }}
                                dangerouslySetInnerHTML={{
                                  __html: interpolatePreviewText(selectedLogCampaign.body, sampleRecipient),
                                }}
                              />
                            ) : (
                              <>
                                <div className="pr-email-header-banner">
                                  <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                                    IEEE Menoufia Student Branch
                                  </div>
                                  <div style={{ fontSize: '0.8125rem', color: '#93c5fd', fontWeight: 500, marginTop: '4px' }}>
                                    Official Communications & Outreach
                                  </div>
                                </div>

                                <div
                                  className="pr-email-content-body"
                                  dangerouslySetInnerHTML={{ __html: renderedBody }}
                                />

                                <div className="pr-email-footer-banner">
                                  <div style={{ fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    &copy; 2026 IEEE Menoufia Student Branch &bull; Menoufia University.
                                  </div>
                                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                                    sent via IEEE MSB Portal &bull; All Rights Reserved.
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedLogCampaign(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Image Modal */}
      {selectedImage && (
        <div className="pr-lightbox-backdrop" {...imageLightboxBackdrop.getBackdropProps()}>
          <div className="pr-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pr-lightbox-close"
              onClick={() => setSelectedImage(null)}
              aria-label="Close image viewer"
            >
              <X size={18} />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged announcement banner"
              className="pr-lightbox-img"
            />
          </div>
        </div>
      )}
    </div>
  );
}
