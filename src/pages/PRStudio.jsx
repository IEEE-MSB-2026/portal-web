import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
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
  { value: 'all_members', label: 'All Branch Members', desc: 'Broadcast to all registered IEEE members' },
  { value: 'committee_members', label: 'Specific Committee Members', desc: 'Target members of a selected committee' },
  { value: 'committee_leads', label: 'Committee Leads Only', desc: 'Send executive notices to committee leaders' },
];

export default function PRStudio() {
  const { user } = useAuthStore();
  const toast = useToastStore();

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
    setSearchParams(newTab === 'announcements' ? {} : { tab: newTab }, { replace: true });
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
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('');
  const [campaignSegmentFilter, setCampaignSegmentFilter] = useState('');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState(null);
  const [selectedLogCampaign, setSelectedLogCampaign] = useState(null);
  const [campaignModalTab, setCampaignModalTab] = useState('form'); // 'form' | 'preview'

  // Form State for Campaign
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    subject: '',
    body: '',
    segmentType: 'all_members',
    committeeId: '',
    status: 'draft',
    scheduledFor: '',
  });

  // ── Load Initial Data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasAccess) return;

    loadCommittees();
    loadAnnouncements();
    loadCampaigns();
  }, [hasAccess]);

  // Close 3-dots action menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Keyboard shortcut (ESC) to close Lightbox modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function loadCommittees() {
    try {
      const data = await api.getCommittees();
      setCommittees(data || []);
    } catch (err) {
      console.warn('Failed to load committees for PR Studio:', err.message);
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
      const res = await api.getPRCampaigns({ limit: 100 });
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

  // ── Campaign Handlers ─────────────────────────────────────────────────────
  const handleOpenCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      title: '',
      subject: '',
      body: '',
      segmentType: 'all_members',
      committeeId: '',
      status: 'draft',
      scheduledFor: '',
    });
    setCampaignModalTab('form');
    setShowCampaignModal(true);
  };

  const handleOpenEditCampaign = (camp) => {
    setEditingCampaign(camp);
    setCampaignForm({
      title: camp.title || '',
      subject: camp.subject || '',
      body: camp.body || '',
      segmentType: camp.segmentType || 'all_members',
      committeeId: camp.committeeId || '',
      status: camp.status || 'draft',
      scheduledFor: camp.scheduledFor ? new Date(camp.scheduledFor).toISOString().slice(0, 16) : '',
    });
    setCampaignModalTab('form');
    setShowCampaignModal(true);
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
    if (campaignForm.segmentType === 'committee_members' && !campaignForm.committeeId) {
      toast.error('Validation Error', 'Please select the target committee for this campaign.');
      return;
    }

    setSavingCampaign(true);
    try {
      const payload = {
        title: campaignForm.title.trim(),
        subject: campaignForm.subject.trim(),
        body: campaignForm.body.trim(),
        segmentType: campaignForm.segmentType,
        committeeId: campaignForm.segmentType === 'committee_members' ? campaignForm.committeeId : null,
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
        `Dispatched to ${res?.recipientCount || camp.recipientCount || 'target'} recipients successfully.`
      );
      loadCampaigns();
    } catch (err) {
      toast.error('Dispatch Failed', err.message || 'Failed to dispatch email campaign.');
    } finally {
      setSendingCampaignId(null);
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
  const totalCampaigns = safeCampaigns.length;
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
          {/* Toolbar */}
          <div className="pr-toolbar">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreateCampaign}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>New Outreach Campaign</span>
            </button>

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
              onChange={(e) => setCampaignStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
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
              <Mail size={36} style={{ opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>No Campaigns Found</h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Create an email campaign to notify branch members and leads.</p>
            </div>
          ) : (
            <div className="pr-campaign-grid">
              {filteredCampaigns.map((camp) => {
                const isDraft = camp.status === 'draft';
                const isScheduled = camp.status === 'scheduled';
                const isSent = camp.status === 'sent';
                const isFailed = camp.status === 'failed';
                const isSending = sendingCampaignId === camp.id;

                const audienceLabel =
                  camp.segmentType === 'all_members'
                    ? 'All Branch Members'
                    : camp.segmentType === 'committee_leads'
                    ? 'Committee Leads'
                    : `Committee: ${camp.committeeName || 'Selected'}`;

                return (
                  <div key={camp.id} className="pr-campaign-card">
                    {/* Header */}
                    <div className="pr-campaign-card__header">
                      <h4 className="pr-campaign-card__title" title={camp.title}>
                        {camp.title}
                      </h4>
                      <span
                        className={`badge ${
                          isSent
                            ? 'badge-accent'
                            : isScheduled
                            ? 'badge-warning'
                            : isFailed
                            ? 'badge-destructive'
                            : 'badge-outline'
                        }`}
                        style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}
                      >
                        {camp.status}
                      </span>
                    </div>

                    {/* Subject Line */}
                    <div className="pr-campaign-card__subject" title={camp.subject}>
                      <Mail size={13} style={{ flexShrink: 0 }} />
                      <span>{camp.subject}</span>
                    </div>

                    {/* Audience Segment Pill */}
                    <div className="pr-campaign-card__badges">
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

                    {/* Actions */}
                    <div className="pr-campaign-card__actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setSelectedLogCampaign(camp)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                      >
                        <FileText size={13} />
                        <span>Details & Logs</span>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {(isDraft || isScheduled) && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => handleOpenEditCampaign(camp)}
                            style={{ fontSize: '0.75rem' }}
                          >
                            <Edit2 size={12} />
                          </button>
                        )}

                        {(isDraft || isScheduled) && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            disabled={isSending}
                            onClick={() => handleSendCampaign(camp)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
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

                        {isDraft && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleDeleteCampaign(camp)}
                            style={{ color: '#ef4444', padding: '0.2rem 0.4rem' }}
                            aria-label="Delete campaign"
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
          )}
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Create / Edit Announcement (Side-by-Side Split View)            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
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
      {/* MODAL: Create / Edit Campaign                                         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showCampaignModal && (
        <div className="modal-overlay" onClick={() => setShowCampaignModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h3>
                <Mail size={18} />
                <span>{editingCampaign ? 'Edit Campaign Draft' : 'New Email Outreach Campaign'}</span>
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCampaignModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ padding: '0.75rem 1.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <div className="pr-modal-tabs">
                <button
                  type="button"
                  className={`pr-modal-tab ${campaignModalTab === 'form' ? 'pr-modal-tab--active' : ''}`}
                  onClick={() => setCampaignModalTab('form')}
                >
                  Campaign Form
                </button>
                <button
                  type="button"
                  className={`pr-modal-tab ${campaignModalTab === 'preview' ? 'pr-modal-tab--active' : ''}`}
                  onClick={() => setCampaignModalTab('preview')}
                >
                  Email Preview
                </button>
              </div>
            </div>

            {campaignModalTab === 'form' ? (
              <form onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>
                  {/* Campaign Title */}
                  <div className="form-group">
                    <label className="form-label">Internal Campaign Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Weekly Member Tech Newsletter #14"
                      value={campaignForm.title}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, title: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Subject Line */}
                  <div className="form-group">
                    <label className="form-label">Email Subject Line *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 🚀 Don't miss IEEE Tech Day this Saturday!"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, subject: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Audience Segmentation */}
                  <div className="form-group">
                    <label className="form-label">Target Audience Segment *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {TARGET_SEGMENTS.map((seg) => {
                        const isSelected = campaignForm.segmentType === seg.value;
                        return (
                          <label
                            key={seg.value}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.65rem',
                              padding: '0.65rem 0.85rem',
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
                              style={{ marginTop: '0.2rem' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.84375rem', color: 'var(--color-text)' }}>
                                {seg.label}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {seg.desc}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Committee Selector (if committee_members selected) */}
                  {campaignForm.segmentType === 'committee_members' && (
                    <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
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

                  {/* Schedule Dispatch Option */}
                  <div className="form-group">
                    <label className="form-label">Schedule Dispatch (Optional)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={campaignForm.scheduledFor}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, scheduledFor: e.target.value }))}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '0.2rem' }}>
                      Leave empty to save as draft or dispatch manually.
                    </span>
                  </div>

                  {/* Email Body */}
                  <div className="form-group">
                    <label className="form-label">Email Body Content *</label>
                    <textarea
                      className="form-input"
                      rows={6}
                      placeholder="Write your email body content here..."
                      value={campaignForm.body}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, body: e.target.value }))}
                      required
                      style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
                    />
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
            ) : (
              /* Email Body Live Preview */
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#ffffff', color: '#0f172a', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>From: IEEE Menoufia Student Branch &lt;noreply@ieee.local&gt;</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      To: {campaignForm.segmentType === 'all_members' ? 'All Branch Members' : campaignForm.segmentType === 'committee_leads' ? 'Committee Leads' : 'Target Committee Members'}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
                      {campaignForm.subject || '(Subject line)'}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#334155' }}>
                    {campaignForm.body || 'Email body content preview will appear here...'}
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1.5rem', paddingTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                    &copy; 2026 IEEE Menoufia Student Branch &bull; Sent via PR Outreach Studio
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '1rem 0 0', marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCampaignModalTab('form')}
                  >
                    Back to Form
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveCampaign}
                    disabled={savingCampaign}
                  >
                    Save Campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Campaign Details & Delivery Logs                               */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {selectedLogCampaign && (
        <div className="modal-overlay" onClick={() => setSelectedLogCampaign(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h3>
                <FileText size={18} />
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  {selectedLogCampaign.title}
                </h4>
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
              </div>

              {/* Metric Breakdown */}
              <div className="pr-campaign-card__stats" style={{ marginBottom: '1.25rem' }}>
                <div className="pr-campaign-card__stat-item">
                  <span className="pr-campaign-card__stat-num">{selectedLogCampaign.recipientCount || 0}</span>
                  <span className="pr-campaign-card__stat-label">Total Recipients</span>
                </div>
                <div className="pr-campaign-card__stat-item">
                  <span className="pr-campaign-card__stat-num" style={{ color: '#10b981' }}>{selectedLogCampaign.sentCount || 0}</span>
                  <span className="pr-campaign-card__stat-label">Delivered</span>
                </div>
                <div className="pr-campaign-card__stat-item">
                  <span className="pr-campaign-card__stat-num" style={{ color: selectedLogCampaign.failedCount > 0 ? '#ef4444' : 'inherit' }}>
                    {selectedLogCampaign.failedCount || 0}
                  </span>
                  <span className="pr-campaign-card__stat-label">Failed</span>
                </div>
              </div>

              {/* Diagnostics Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Target Audience:</span>
                  <span style={{ fontWeight: 600 }}>{selectedLogCampaign.segmentType}</span>
                </div>
                {selectedLogCampaign.committeeName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Target Committee:</span>
                    <span style={{ fontWeight: 600 }}>{selectedLogCampaign.committeeName}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Created At:</span>
                  <span>{formatDate(selectedLogCampaign.createdAt)}</span>
                </div>
                {selectedLogCampaign.sentAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Sent At:</span>
                    <span>{new Date(selectedLogCampaign.sentAt).toLocaleString()}</span>
                  </div>
                )}
                {selectedLogCampaign.dispatchRequestId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Dispatch Request ID:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {selectedLogCampaign.dispatchRequestId}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message if Failed */}
              {selectedLogCampaign.lastError && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertCircle size={14} />
                    <span>Last Error Diagnostic</span>
                  </div>
                  <div className="pr-log-detail-box" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                    {selectedLogCampaign.lastError}
                  </div>
                </div>
              )}

              {/* Email Content */}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                  Email Message Body
                </div>
                <div className="pr-log-detail-box">
                  {selectedLogCampaign.body}
                </div>
              </div>
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
        <div className="pr-lightbox-backdrop" onClick={() => setSelectedImage(null)}>
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
