import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  FolderPlus,
  Upload,
  Trash2,
  Edit2,
  Eye,
  Download,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  RefreshCw,
  Layers,
  Shield,
  Film,
  FileText,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2,
  FolderArchive,
  Palette,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';
import { api } from '../services/api';
import '../styles/media.css';

const ALBUM_CATEGORIES = [
  'General',
  'Workshop',
  'Hackathon',
  'Summit',
  'Ceremony',
  'Competition',
  'Social',
  'Conference',
];

const BRAND_CATEGORIES = [
  { id: 'all', label: 'All Brand Assets' },
  { id: 'logos', label: 'Logos & Vectors' },
  { id: 'templates', label: 'Templates & Decks' },
  { id: 'badges', label: 'Badges & Crests' },
  { id: 'documents', label: 'Guidelines & Docs' },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function MediaStudio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'brand' ? 'brand' : 'albums';

  const { user } = useAuthStore();
  const toast = useToastStore();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState({
    totalAlbums: 0,
    totalAssets: 0,
    publishedAlbums: 0,
    totalBrandAssets: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [committees, setCommittees] = useState([]);

  // ── Albums Tab State ─────────────────────────────────────────────────────────
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [albumFilter, setAlbumFilter] = useState('all'); // all, published, draft
  const [selectedCommittee, setSelectedCommittee] = useState('all');
  const [albumSearch, setAlbumSearch] = useState('');

  // Modal / Wizard
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [albumFormData, setAlbumFormData] = useState({
    title: '',
    committeeId: '',
    description: '',
    category: 'General',
    eventDate: '',
    tags: [],
    tagInput: '',
    coverImageUrl: '',
    assets: [],
  });
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [deletingAlbumId, setDeletingAlbumId] = useState(null);
  const [publishingAlbumId, setPublishingAlbumId] = useState(null);

  // Lightbox
  const [activeAlbumLightbox, setActiveAlbumLightbox] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // ── Brand Kit Tab State ─────────────────────────────────────────────────────
  const [brandAssets, setBrandAssets] = useState([]);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [brandCategory, setBrandCategory] = useState('all');
  const [brandSearch, setBrandSearch] = useState('');

  // Brand Asset Modal
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrandAsset, setEditingBrandAsset] = useState(null);
  const [brandFormData, setBrandFormData] = useState({
    title: '',
    description: '',
    category: 'logos',
    fileUrl: '',
    thumbnailUrl: '',
    fileFormat: '',
    fileSizeBytes: 0,
    tags: [],
    tagInput: '',
  });
  const [uploadingBrandFile, setUploadingBrandFile] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [deletingBrandId, setDeletingBrandId] = useState(null);
  const [copiedAssetId, setCopiedAssetId] = useState(null);

  const fileInputRef = useRef(null);
  const brandFileInputRef = useRef(null);

  // Modal backdrops
  const albumModalBackdrop = useBackdropDismiss(() => !savingAlbum && setIsAlbumModalOpen(false), {
    isOpen: isAlbumModalOpen,
  });
  const brandModalBackdrop = useBackdropDismiss(() => !savingBrand && setIsBrandModalOpen(false), {
    isOpen: isBrandModalOpen,
  });

  // Access check
  const isMediaAuthorized =
    (user?.scopeType === 'global' && ['admin', 'officer'].includes(user?.role)) ||
    (user?.role === 'lead' && user?.committeeSlug === 'media') ||
    ['admin', 'officer'].includes(user?.role);

  // Synchronize Tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'brand' ? { tab: 'brand' } : {});
  };

  // Fetch KPI Stats & Committees
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.getMediaStats();
      setStats({
        totalAlbums: res.totalAlbums || 0,
        totalAssets: res.totalAssets || 0,
        publishedAlbums: res.publishedAlbums || 0,
        totalBrandAssets: res.totalBrandAssets || 0,
      });
    } catch (err) {
      console.error('Error fetching media stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadCommittees = async () => {
    try {
      const res = await api.getCommittees();
      setCommittees(res.committees || []);
    } catch (err) {
      console.error('Error fetching committees:', err);
    }
  };

  // Fetch Albums
  const loadAlbums = async () => {
    try {
      setLoadingAlbums(true);
      const params = {};
      if (albumFilter !== 'all') params.status = albumFilter;
      if (selectedCommittee !== 'all') params.committeeId = selectedCommittee;
      if (albumSearch.trim()) params.search = albumSearch.trim();

      const res = await api.getMediaAlbums(params);
      setAlbums(res.albums || []);
    } catch (err) {
      console.error('Error fetching media albums:', err);
      toast.error('Load Failed', err.message || 'Could not fetch media albums');
    } finally {
      setLoadingAlbums(false);
    }
  };

  // Fetch Brand Assets
  const loadBrandAssets = async () => {
    try {
      setLoadingBrand(true);
      const params = {};
      if (brandCategory !== 'all') params.category = brandCategory;
      if (brandSearch.trim()) params.search = brandSearch.trim();

      const res = await api.getBrandAssets(params);
      setBrandAssets(res.assets || []);
    } catch (err) {
      console.error('Error fetching brand assets:', err);
      toast.error('Load Failed', err.message || 'Could not fetch brand assets');
    } finally {
      setLoadingBrand(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadCommittees();
  }, []);

  useEffect(() => {
    if (activeTab === 'albums') {
      loadAlbums();
    } else {
      loadBrandAssets();
    }
  }, [activeTab, albumFilter, selectedCommittee, albumSearch, brandCategory, brandSearch]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!activeAlbumLightbox) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveAlbumLightbox(null);
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIdx((prev) =>
          prev < (activeAlbumLightbox.assets?.length || 1) - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIdx((prev) =>
          prev > 0 ? prev - 1 : (activeAlbumLightbox.assets?.length || 1) - 1
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlbumLightbox]);

  // ── Album Creation / Edit Handlers ──────────────────────────────────────────
  const openCreateAlbumModal = () => {
    const defaultCommId =
      user?.committeeId || (committees.length > 0 ? committees[0].id : '');
    setEditingAlbum(null);
    setAlbumFormData({
      title: '',
      committeeId: defaultCommId,
      description: '',
      category: 'General',
      eventDate: new Date().toISOString().split('T')[0],
      tags: [],
      tagInput: '',
      coverImageUrl: '',
      assets: [],
    });
    setUploadingFiles([]);
    setIsAlbumModalOpen(true);
  };

  const openEditAlbumModal = (album) => {
    setEditingAlbum(album);
    setAlbumFormData({
      title: album.title || '',
      committeeId: album.committeeId || '',
      description: album.description || '',
      category: album.category || 'General',
      eventDate: album.eventDate ? album.eventDate.split('T')[0] : '',
      tags: Array.isArray(album.tags) ? [...album.tags] : [],
      tagInput: '',
      coverImageUrl: album.coverImageUrl || '',
      assets: Array.isArray(album.assets) ? [...album.assets] : [],
    });
    setUploadingFiles([]);
    setIsAlbumModalOpen(true);
  };

  // Multi-File Upload to Cloudinary
  const handleBatchFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newUploads = files.map((file, idx) => ({
      id: `up_${Date.now()}_${idx}`,
      file,
      name: file.name,
      progress: 0,
      status: 'uploading', // uploading, done, error
      url: null,
      caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    }));

    setUploadingFiles((prev) => [...prev, ...newUploads]);

    for (const item of newUploads) {
      try {
        const isVideo = item.file.type.startsWith('video/');
        const res = await api.uploadDirectToCloudinary({
          file: item.file,
          folder: 'media_albums',
          resourceType: isVideo ? 'video' : 'image',
          purpose: 'media_album',
        });

        const assetUrl = res.secureUrl || res.url;
        const newAsset = {
          assetUrl,
          assetType: isVideo ? 'video' : 'image',
          caption: item.caption,
          isNew: true,
        };

        setAlbumFormData((prev) => {
          const updatedAssets = [...prev.assets, newAsset];
          const cover = prev.coverImageUrl || assetUrl;
          return {
            ...prev,
            assets: updatedAssets,
            coverImageUrl: cover,
          };
        });

        setUploadingFiles((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'done', progress: 100, url: assetUrl } : u))
        );
      } catch (err) {
        console.error('File upload failed:', err);
        setUploadingFiles((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'error', progress: 0 } : u))
        );
        toast.error('Upload Error', `Failed to upload ${item.name}: ${err.message}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAlbumAsset = async (index, asset) => {
    if (editingAlbum && asset.id && !asset.isNew) {
      if (!window.confirm('Delete this asset from the album permanently?')) return;
      try {
        await api.deleteMediaAlbumAsset(editingAlbum.id, asset.id);
        toast.success('Asset Deleted', 'Asset removed from album');
      } catch (err) {
        toast.error('Delete Failed', err.message);
        return;
      }
    }

    setAlbumFormData((prev) => {
      const nextAssets = prev.assets.filter((_, i) => i !== index);
      let nextCover = prev.coverImageUrl;
      if (prev.coverImageUrl === asset.assetUrl) {
        nextCover = nextAssets.length > 0 ? nextAssets[0].assetUrl : '';
      }
      return {
        ...prev,
        assets: nextAssets,
        coverImageUrl: nextCover,
      };
    });
  };

  const handleSetCoverImage = (url) => {
    setAlbumFormData((prev) => ({ ...prev, coverImageUrl: url }));
    toast.info('Cover Image Updated', 'Selected image set as album cover');
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = albumFormData.tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (val && !albumFormData.tags.includes(val)) {
        setAlbumFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, val],
          tagInput: '',
        }));
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setAlbumFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSaveAlbum = async (publishImmediate = false) => {
    if (!albumFormData.title.trim()) {
      toast.warning('Validation Error', 'Album title is required');
      return;
    }

    if (publishImmediate && albumFormData.assets.length === 0) {
      toast.warning('Publish Guard', 'Cannot publish an empty album. Please add at least 1 image.');
      return;
    }

    try {
      setSavingAlbum(true);

      const payload = {
        committeeId: albumFormData.committeeId || null,
        title: albumFormData.title.trim(),
        description: albumFormData.description.trim() || null,
        category: albumFormData.category,
        eventDate: albumFormData.eventDate ? albumFormData.eventDate : null,
        coverImageUrl: albumFormData.coverImageUrl || (albumFormData.assets[0]?.assetUrl || null),
        tags: albumFormData.tags,
      };

      if (editingAlbum) {
        await api.updateMediaAlbum(editingAlbum.id, payload);

        // Add any newly uploaded assets that weren't yet saved
        const newAssets = albumFormData.assets.filter((a) => a.isNew);
        for (const asset of newAssets) {
          await api.addMediaAlbumAsset(editingAlbum.id, {
            assetUrl: asset.assetUrl,
            assetType: asset.assetType,
            caption: asset.caption,
          });
        }

        if (publishImmediate && editingAlbum.status !== 'published') {
          await api.publishMediaAlbum(editingAlbum.id);
        }

        toast.success('Album Updated', `"${payload.title}" saved successfully.`);
      } else {
        payload.assets = albumFormData.assets.map((a) => ({
          assetUrl: a.assetUrl,
          assetType: a.assetType,
          caption: a.caption,
        }));

        const res = await api.createMediaAlbum(payload);
        const createdId = res.album.id;

        if (publishImmediate && payload.assets.length > 0) {
          await api.publishMediaAlbum(createdId);
        }

        toast.success('Album Created', `"${payload.title}" created successfully.`);
      }

      setIsAlbumModalOpen(false);
      loadAlbums();
      loadStats();
    } catch (err) {
      console.error('Save album error:', err);
      toast.error('Save Failed', err.message || 'Could not save album');
    } finally {
      setSavingAlbum(false);
    }
  };

  const handleTogglePublishAlbum = async (album) => {
    try {
      setPublishingAlbumId(album.id);
      if (album.status === 'published') {
        await api.unpublishMediaAlbum(album.id);
        toast.info('Album Unpublished', `"${album.title}" returned to draft.`);
      } else {
        if (!album.assets || album.assets.length === 0) {
          toast.warning('Publish Guard', 'Cannot publish an empty album. Add at least 1 image first.');
          return;
        }
        await api.publishMediaAlbum(album.id);
        toast.success('Album Published', `"${album.title}" is now live in the Public Gallery!`);
      }
      loadAlbums();
      loadStats();
    } catch (err) {
      toast.error('Status Change Failed', err.message);
    } finally {
      setPublishingAlbumId(null);
    }
  };

  const handleDeleteAlbum = async (album) => {
    if (!window.confirm(`Are you sure you want to delete album "${album.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      setDeletingAlbumId(album.id);
      await api.deleteMediaAlbum(album.id);
      toast.success('Album Deleted', `"${album.title}" has been deleted.`);
      loadAlbums();
      loadStats();
    } catch (err) {
      toast.error('Delete Failed', err.message);
    } finally {
      setDeletingAlbumId(null);
    }
  };

  // ── Brand Kit Handlers ──────────────────────────────────────────────────────
  const openCreateBrandModal = () => {
    setEditingBrandAsset(null);
    setBrandFormData({
      title: '',
      description: '',
      category: 'logos',
      fileUrl: '',
      thumbnailUrl: '',
      fileFormat: '',
      fileSizeBytes: 0,
      tags: [],
      tagInput: '',
    });
    setIsBrandModalOpen(true);
  };

  const openEditBrandModal = (asset) => {
    setEditingBrandAsset(asset);
    setBrandFormData({
      title: asset.title || '',
      description: asset.description || '',
      category: asset.category || 'logos',
      fileUrl: asset.fileUrl || '',
      thumbnailUrl: asset.thumbnailUrl || '',
      fileFormat: asset.fileFormat || '',
      fileSizeBytes: asset.fileSizeBytes || 0,
      tags: Array.isArray(asset.tags) ? [...asset.tags] : [],
      tagInput: '',
    });
    setIsBrandModalOpen(true);
  };

  const handleBrandFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin';
    const isImage = file.type.startsWith('image/') || ['svg', 'png', 'jpg', 'jpeg', 'webp'].includes(ext);

    try {
      setUploadingBrandFile(true);
      const res = await api.uploadDirectToCloudinary({
        file,
        folder: 'brand_kit',
        resourceType: isImage ? 'image' : 'raw',
        purpose: 'brand_kit',
      });

      const secureUrl = res.secureUrl || res.url;
      setBrandFormData((prev) => ({
        ...prev,
        fileUrl: secureUrl,
        thumbnailUrl: isImage ? secureUrl : null,
        fileFormat: ext,
        fileSizeBytes: file.size,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }));

      toast.success('File Uploaded', `${file.name} uploaded successfully.`);
    } catch (err) {
      console.error('Brand file upload failed:', err);
      toast.error('Upload Failed', err.message);
    } finally {
      setUploadingBrandFile(false);
      if (brandFileInputRef.current) brandFileInputRef.current.value = '';
    }
  };

  const handleSaveBrandAsset = async () => {
    if (!brandFormData.title.trim()) {
      toast.warning('Validation', 'Asset title is required');
      return;
    }
    if (!brandFormData.fileUrl.trim()) {
      toast.warning('Validation', 'Please upload a brand file');
      return;
    }

    try {
      setSavingBrand(true);
      const payload = {
        title: brandFormData.title.trim(),
        description: brandFormData.description.trim() || null,
        category: brandFormData.category,
        fileUrl: brandFormData.fileUrl.trim(),
        thumbnailUrl: brandFormData.thumbnailUrl || null,
        fileFormat: brandFormData.fileFormat || null,
        fileSizeBytes: brandFormData.fileSizeBytes || 0,
        tags: brandFormData.tags,
      };

      if (editingBrandAsset) {
        await api.updateBrandAsset(editingBrandAsset.id, payload);
        toast.success('Asset Updated', `"${payload.title}" saved.`);
      } else {
        await api.createBrandAsset(payload);
        toast.success('Asset Created', `"${payload.title}" added to Brand Kit.`);
      }

      setIsBrandModalOpen(false);
      loadBrandAssets();
      loadStats();
    } catch (err) {
      toast.error('Save Failed', err.message);
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrandAsset = async (asset) => {
    if (!window.confirm(`Delete brand asset "${asset.title}"?`)) return;
    try {
      setDeletingBrandId(asset.id);
      await api.deleteBrandAsset(asset.id);
      toast.success('Asset Deleted', `"${asset.title}" removed.`);
      loadBrandAssets();
      loadStats();
    } catch (err) {
      toast.error('Delete Failed', err.message);
    } finally {
      setDeletingBrandId(null);
    }
  };

  const handleCopyAssetUrl = (asset) => {
    if (!asset.fileUrl) return;
    navigator.clipboard.writeText(asset.fileUrl);
    setCopiedAssetId(asset.id);
    toast.info('Copied', 'Asset URL copied to clipboard');
    setTimeout(() => setCopiedAssetId(null), 2000);
  };

  const handleDownloadAsset = (asset) => {
    if (!asset.fileUrl) return;
    const a = document.createElement('a');
    a.href = asset.fileUrl;
    a.download = asset.title || 'brand_asset';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Render Guard ────────────────────────────────────────────────────────────
  if (!isMediaAuthorized) {
    return (
      <div className="section">
        <div className="container container-narrow">
          <div className="bento-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <Shield size={48} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-4)' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>Media Studio Access Restricted</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
              Direct access to Media Operations & Brand Studio is reserved for Media Committee Leads, Global Officers, and System Administrators.
            </p>
            <Link to="/dashboard" className="btn btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-layout media-studio">
      {/* Studio Header */}
      <div className="studio__header">
        <h1>
          <Camera size={26} /> Media Studio
        </h1>
      </div>

      {/* Top Single-Row KPI Bar */}
      <div className="studio-kpi-grid">
        <div className="studio-kpi-card">
          <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--primary">
            <FolderArchive size={22} />
          </div>
          <div className="studio-kpi-content">
            <span className="studio-kpi-value">
              {loadingStats ? <Loader2 size={20} className="spin" /> : stats.totalAlbums}
            </span>
            <span className="studio-kpi-label">Total Albums</span>
          </div>
        </div>

        <div className="studio-kpi-card">
          <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--emerald">
            <Globe size={22} />
          </div>
          <div className="studio-kpi-content">
            <span className="studio-kpi-value">
              {loadingStats ? <Loader2 size={20} className="spin" /> : stats.publishedAlbums}
            </span>
            <span className="studio-kpi-label">Published Albums</span>
          </div>
        </div>

        <div className="studio-kpi-card">
          <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--amber">
            <ImageIcon size={22} />
          </div>
          <div className="studio-kpi-content">
            <span className="studio-kpi-value">
              {loadingStats ? <Loader2 size={20} className="spin" /> : stats.totalAssets}
            </span>
            <span className="studio-kpi-label">Total Media Assets</span>
          </div>
        </div>

        <div className="studio-kpi-card">
          <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--purple">
            <Palette size={22} />
          </div>
          <div className="studio-kpi-content">
            <span className="studio-kpi-value">
              {loadingStats ? <Loader2 size={20} className="spin" /> : stats.totalBrandAssets}
            </span>
            <span className="studio-kpi-label">Brand Kit Files</span>
          </div>
        </div>
      </div>

      {/* Studio Tabs Navigation */}
      <div className="studio-tabs">
        <button
          type="button"
          onClick={() => handleTabChange('albums')}
          className={`studio-tab ${activeTab === 'albums' ? 'studio-tab--active' : ''}`}
        >
          <Camera size={16} /> Event Albums & Publisher
          <span className="studio-tab__badge">{stats.totalAlbums}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('brand')}
          className={`studio-tab ${activeTab === 'brand' ? 'studio-tab--active' : ''}`}
        >
          <Palette size={16} /> Brand & Design Kit
          <span className="studio-tab__badge">{stats.totalBrandAssets}</span>
        </button>
      </div>

      {/* ── TAB 1: ALBUMS & PUBLISHER ────────────────────────────────────────── */}
      {activeTab === 'albums' && (
        <div>
          {/* Toolbar */}
          <div className="media-toolbar">
            <div className="media-toolbar__left">
              {/* Search */}
              <div className="media-search-wrap">
                <Search size={16} className="media-search-icon" />
                <input
                  type="text"
                  placeholder="Search albums by title or tag..."
                  value={albumSearch}
                  onChange={(e) => setAlbumSearch(e.target.value)}
                  className="media-search-input"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="media-filter-pills">
                <button
                  type="button"
                  onClick={() => setAlbumFilter('all')}
                  className={`media-pill-btn ${albumFilter === 'all' ? 'media-pill-btn--active' : ''}`}
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumFilter('published')}
                  className={`media-pill-btn ${albumFilter === 'published' ? 'media-pill-btn--active' : ''}`}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumFilter('draft')}
                  className={`media-pill-btn ${albumFilter === 'draft' ? 'media-pill-btn--active' : ''}`}
                >
                  Drafts
                </button>
              </div>

              {/* Committee Filter */}
              <select
                value={selectedCommittee}
                onChange={(e) => setSelectedCommittee(e.target.value)}
                className="media-filter-select"
              >
                <option value="all">All Committees</option>
                {committees.map((comm) => (
                  <option key={comm.id} value={comm.id}>
                    {comm.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="media-toolbar__right">
              <button
                type="button"
                onClick={openCreateAlbumModal}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>New Event Album</span>
              </button>
            </div>
          </div>

          {/* Albums Content Grid */}
          {loadingAlbums ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-muted)' }}>
              <Loader2 size={36} className="spin" style={{ margin: '0 auto var(--space-3)' }} />
              <p>Loading media albums...</p>
            </div>
          ) : albums.length === 0 ? (
            <div
              className="bento-card"
              style={{ textAlign: 'center', padding: 'var(--space-16)', maxWidth: '640px', margin: '2rem auto' }}
            >
              <FolderArchive size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto var(--space-4)', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Albums Found</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
                {albumSearch || albumFilter !== 'all' || selectedCommittee !== 'all'
                  ? 'Try adjusting your filters or search query.'
                  : 'Start by creating your first event coverage album with batch photo uploads.'}
              </p>
              <button type="button" onClick={openCreateAlbumModal} className="btn btn-primary">
                <Plus size={16} />
                <span>Create First Album</span>
              </button>
            </div>
          ) : (
            <div className="media-albums-grid">
              {albums.map((album) => {
                const isPub = album.status === 'published';
                const count = album.assetsCount || album.assets?.length || 0;
                return (
                  <div key={album.id} className="media-album-card">
                    {/* Album Cover */}
                    <div
                      className="media-album-cover-wrap"
                      onClick={() => {
                        setActiveAlbumLightbox(album);
                        setActivePhotoIdx(0);
                      }}
                      title="Click to open full lightbox preview"
                    >
                      {album.coverImageUrl ? (
                        <img
                          src={album.coverImageUrl}
                          alt={album.title}
                          className="media-album-cover-img"
                        />
                      ) : (
                        <div className="media-album-cover-placeholder">
                          <ImageIcon size={36} />
                          <span style={{ fontSize: '0.8125rem' }}>No Cover Image</span>
                        </div>
                      )}

                      <div className="media-album-overlay">
                        <div className="media-album-overlay-top">
                          <span
                            className={`media-badge-status ${
                              isPub ? 'media-badge-status--published' : 'media-badge-status--draft'
                            }`}
                          >
                            {isPub ? <Globe size={11} /> : <FileText size={11} />}
                            {isPub ? 'Published' : 'Draft'}
                          </span>

                          <span className="media-asset-count-pill">
                            <ImageIcon size={12} />
                            <span>{count}</span>
                          </span>
                        </div>

                        <div className="media-album-overlay-bottom">
                          <span
                            style={{
                              color: '#fff',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            {album.eventDate
                              ? new Date(album.eventDate).toLocaleDateString()
                              : new Date(album.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Album Body */}
                    <div className="media-album-body">
                      <div className="media-album-meta-row">
                        {album.committeeName && (
                          <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                            {album.committeeName}
                          </span>
                        )}
                        {album.category && (
                          <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                            {album.category}
                          </span>
                        )}
                      </div>

                      <h3 className="media-album-title" title={album.title}>
                        {album.title}
                      </h3>

                      <p className="media-album-desc">
                        {album.description || 'No detailed description provided.'}
                      </p>

                      {album.tags && album.tags.length > 0 && (
                        <div className="media-album-tags">
                          {album.tags.slice(0, 4).map((tag, idx) => (
                            <span key={idx} className="media-tag-chip">
                              #{tag}
                            </span>
                          ))}
                          {album.tags.length > 4 && (
                            <span className="media-tag-chip">+{album.tags.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Album Card Footer Actions */}
                    <div className="media-album-footer">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAlbumLightbox(album);
                          setActivePhotoIdx(0);
                        }}
                        className="btn btn-secondary btn-sm"
                        title="View Lightbox"
                      >
                        <Eye size={14} />
                        <span>Preview</span>
                      </button>

                      <div className="media-album-actions-group">
                        <button
                          type="button"
                          onClick={() => handleTogglePublishAlbum(album)}
                          disabled={publishingAlbumId === album.id}
                          className={`btn btn-sm ${isPub ? 'btn-outline' : 'btn-success'}`}
                          title={isPub ? 'Unpublish to draft' : 'Publish to gallery'}
                        >
                          {publishingAlbumId === album.id ? (
                            <Loader2 size={13} className="spin" />
                          ) : isPub ? (
                            'Unpublish'
                          ) : (
                            'Publish'
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditAlbumModal(album)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Edit album"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAlbum(album)}
                          disabled={deletingAlbumId === album.id}
                          className="btn btn-secondary btn-icon btn-sm"
                          style={{ color: 'var(--color-destructive)' }}
                          title="Delete album"
                        >
                          {deletingAlbumId === album.id ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
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

      {/* ── TAB 2: BRAND & DESIGN KIT ────────────────────────────────────────── */}
      {activeTab === 'brand' && (
        <div>
          {/* Toolbar */}
          <div className="media-toolbar">
            <div className="media-toolbar__left">
              {/* Search */}
              <div className="media-search-wrap">
                <Search size={16} className="media-search-icon" />
                <input
                  type="text"
                  placeholder="Search brand assets by name or tag..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="media-search-input"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="media-filter-pills">
                {BRAND_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setBrandCategory(cat.id)}
                    className={`media-pill-btn ${brandCategory === cat.id ? 'media-pill-btn--active' : ''}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="media-toolbar__right">
              <button
                type="button"
                onClick={openCreateBrandModal}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Upload Brand Asset</span>
              </button>
            </div>
          </div>

          {/* Brand Grid */}
          {loadingBrand ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-muted)' }}>
              <Loader2 size={36} className="spin" style={{ margin: '0 auto var(--space-3)' }} />
              <p>Loading brand assets...</p>
            </div>
          ) : brandAssets.length === 0 ? (
            <div
              className="bento-card"
              style={{ textAlign: 'center', padding: 'var(--space-16)', maxWidth: '640px', margin: '2rem auto' }}
            >
              <Palette size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto var(--space-4)', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Brand Assets Found</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
                Upload official logos, vector files, templates, or badges to the central design repository.
              </p>
              <button type="button" onClick={openCreateBrandModal} className="btn btn-primary">
                <Plus size={16} />
                <span>Upload First Asset</span>
              </button>
            </div>
          ) : (
            <div className="brand-grid">
              {brandAssets.map((asset) => {
                const format = (asset.fileFormat || 'file').toLowerCase();
                const isImg = ['svg', 'png', 'jpg', 'jpeg', 'webp'].includes(format);
                const formatBadgeClass = `brand-format-badge--${format}`;

                return (
                  <div key={asset.id} className="brand-card">
                    {/* Visual Preview Box */}
                    <div className="brand-preview-wrap">
                      <span className={`brand-format-badge ${formatBadgeClass}`}>
                        {format}
                      </span>

                      {isImg ? (
                        <img
                          src={asset.thumbnailUrl || asset.fileUrl}
                          alt={asset.title}
                          className="brand-preview-img"
                        />
                      ) : (
                        <div className="brand-doc-preview">
                          {format === 'pdf' ? (
                            <FileText size={48} />
                          ) : format === 'csv' || format === 'xlsx' ? (
                            <FileSpreadsheet size={48} />
                          ) : (
                            <FileCode size={48} />
                          )}
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {format} Document
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="brand-card-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                          {asset.category?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {formatBytes(asset.fileSizeBytes)}
                        </span>
                      </div>

                      <h4 className="brand-card-title" title={asset.title}>
                        {asset.title}
                      </h4>

                      <p className="brand-card-desc">
                        {asset.description || 'Official IEEE branch design asset.'}
                      </p>

                      {asset.tags && asset.tags.length > 0 && (
                        <div className="media-album-tags">
                          {asset.tags.map((t, idx) => (
                            <span key={idx} className="media-tag-chip">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="brand-card-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyAssetUrl(asset)}
                          className="btn btn-secondary btn-sm"
                          title="Copy asset link"
                        >
                          {copiedAssetId === asset.id ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                          <span>{copiedAssetId === asset.id ? 'Copied' : 'Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadAsset(asset)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Download asset"
                        >
                          <Download size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => openEditBrandModal(asset)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Edit metadata"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBrandAsset(asset)}
                          disabled={deletingBrandId === asset.id}
                          className="btn btn-secondary btn-icon btn-sm"
                          style={{ color: 'var(--color-destructive)' }}
                          title="Delete asset"
                        >
                          {deletingBrandId === asset.id ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
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

      {/* ── SIDE DRAWER: ALBUM CREATION & EDITING WIZARD ───────────────────── */}
      {isAlbumModalOpen && (
        <div className="studio-drawer-overlay" {...albumModalBackdrop.getBackdropProps()}>
          <div
            className="studio-drawer-content"
            style={{ maxWidth: '780px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="studio-drawer-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
                  {editingAlbum ? `Edit Album: ${editingAlbum.title}` : 'Create New Event Album'}
                </h3>
                <p style={{ fontSize: '0.84375rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
                  Organize high-resolution photos and highlights for public display.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => !savingAlbum && setIsAlbumModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="studio-drawer-body" style={{ overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {/* Title */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Album Title <span style={{ color: 'var(--color-destructive)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hackathon 2026 Grand Finale"
                    value={albumFormData.title}
                    onChange={(e) => setAlbumFormData({ ...albumFormData, title: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                {/* Committee Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Committee (Optional)
                  </label>
                  <select
                    value={albumFormData.committeeId}
                    onChange={(e) => setAlbumFormData({ ...albumFormData, committeeId: e.target.value })}
                    className="form-input"
                  >
                    <option value="">None / Branch-wide (General)</option>
                    {committees.map((comm) => (
                      <option key={comm.id} value={comm.id}>
                        {comm.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={albumFormData.category}
                    onChange={(e) => setAlbumFormData({ ...albumFormData, category: e.target.value })}
                    className="form-input"
                  >
                    {ALBUM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={albumFormData.eventDate}
                    onChange={(e) => setAlbumFormData({ ...albumFormData, eventDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* Tags Manager */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Tags (Press Enter)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. keynote, awards, 2026"
                    value={albumFormData.tagInput}
                    onChange={(e) => setAlbumFormData({ ...albumFormData, tagInput: e.target.value })}
                    onKeyDown={handleAddTag}
                    className="form-input"
                  />
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                    {albumFormData.tags.map((t) => (
                      <span
                        key={t}
                        className="badge badge-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem' }}
                      >
                        #{t}
                        <X size={10} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Description / Story
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide highlights, event context, and key moments captured in this album..."
                    value={albumFormData.description}
                    onChange={(e) => setAlbumFormData({ ...albumFormData, description: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Multi-File Upload Dropzone */}
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                    Album Media Assets ({albumFormData.assets.length})
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Direct upload • JPG, PNG, WEBP, MP4
                  </span>
                </div>

                <div
                  className="media-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={handleBatchFileSelect}
                  />
                  <div className="media-dropzone-icon">
                    <Upload size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                      Click to browse or drag & drop files here
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                      Select multiple high-resolution photos or event clips
                    </div>
                  </div>
                </div>

                {/* Asset Preview / Queue Grid */}
                {albumFormData.assets.length > 0 && (
                  <div className="media-upload-queue">
                    {albumFormData.assets.map((asset, idx) => {
                      const isCover = albumFormData.coverImageUrl === asset.assetUrl;
                      return (
                        <div
                          key={idx}
                          className={`media-upload-item ${isCover ? 'media-upload-item--cover' : ''}`}
                        >
                          <img
                            src={asset.assetUrl}
                            alt=""
                            className="media-upload-item-thumb"
                          />

                          <div className="media-upload-item-body">
                            <input
                              type="text"
                              placeholder="Caption..."
                              value={asset.caption || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAlbumFormData((prev) => {
                                  const updated = [...prev.assets];
                                  updated[idx] = { ...updated[idx], caption: val };
                                  return { ...prev, assets: updated };
                                });
                              }}
                              className="media-upload-caption-input"
                            />

                            <div className="media-upload-item-actions">
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(asset.assetUrl)}
                                className={`btn btn-sm ${isCover ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '0.6875rem', padding: '0.15rem 0.45rem' }}
                              >
                                {isCover ? '★ Cover' : 'Set Cover'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveAlbumAsset(idx, asset)}
                                className="btn btn-secondary btn-icon btn-sm"
                                style={{ color: 'var(--color-destructive)' }}
                                title="Remove asset"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => !savingAlbum && setIsAlbumModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={savingAlbum}
                >
                  Cancel
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => handleSaveAlbum(false)}
                  disabled={savingAlbum}
                  className="btn btn-secondary"
                >
                  {savingAlbum ? <Loader2 size={15} className="spin" /> : 'Save as Draft'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAlbum(true)}
                  disabled={savingAlbum}
                  className="btn btn-primary"
                >
                  {savingAlbum ? <Loader2 size={15} className="spin" /> : 'Save & Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDE DRAWER: BRAND ASSET UPLOAD & EDIT ────────────────────────── */}
      {isBrandModalOpen && (
        <div className="studio-drawer-overlay" {...brandModalBackdrop.getBackdropProps()}>
          <div
            className="studio-drawer-content"
            style={{ maxWidth: '620px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="studio-drawer-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {editingBrandAsset ? 'Edit Brand Asset' : 'Upload Brand Asset'}
                </h3>
                <p style={{ fontSize: '0.84375rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0 0' }}>
                  Add vectors, logos, badges, or brand documents to the design kit.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => !savingBrand && setIsBrandModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="studio-drawer-body" style={{ overflowY: 'auto' }}>
              {/* File Uploader */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Asset File (SVG, PNG, PDF, AI, FIG, ZIP) <span style={{ color: 'var(--color-destructive)' }}>*</span>
                </label>

                <div
                  className="media-dropzone"
                  onClick={() => brandFileInputRef.current?.click()}
                  style={{ padding: '1.5rem 1rem' }}
                >
                  <input
                    ref={brandFileInputRef}
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.ai,.psd,.fig,.zip"
                    style={{ display: 'none' }}
                    onChange={handleBrandFileSelect}
                  />

                  {uploadingBrandFile ? (
                    <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} />
                  ) : brandFormData.fileUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>File Ready</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Format: {brandFormData.fileFormat?.toUpperCase()} • {formatBytes(brandFormData.fileSizeBytes)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="media-dropzone-icon">
                        <Upload size={22} />
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Click to select brand file</div>
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Asset Title <span style={{ color: 'var(--color-destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. IEEE Menoufia Primary Vector Logo"
                  value={brandFormData.title}
                  onChange={(e) => setBrandFormData({ ...brandFormData, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Category <span style={{ color: 'var(--color-destructive)' }}>*</span>
                </label>
                <select
                  value={brandFormData.category}
                  onChange={(e) => setBrandFormData({ ...brandFormData, category: e.target.value })}
                  className="form-input"
                >
                  <option value="logo">Logo &amp; Emblems</option>
                  <option value="guidelines">Brand Guidelines</option>
                  <option value="templates">Design Templates</option>
                  <option value="badges">Badges &amp; Icons</option>
                  <option value="other">Other Assets</option>
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Usage instructions, color codes, vector specifications..."
                  value={brandFormData.description}
                  onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                  className="form-input"
                  rows={3}
                />
              </div>

              {/* Target Committee */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Associated Committee (Optional)
                </label>
                <select
                  value={brandFormData.committeeId}
                  onChange={(e) => setBrandFormData({ ...brandFormData, committeeId: e.target.value })}
                  className="form-input"
                >
                  <option value="">Branch-Wide (All Committees)</option>
                  {(committees || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Tags (Press Enter to add)
                </label>
                <input
                  type="text"
                  placeholder="e.g. vector, dark-mode, official, banner"
                  value={brandFormData.tagInput}
                  onChange={(e) => setBrandFormData({ ...brandFormData, tagInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = brandFormData.tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                      if (val && !brandFormData.tags.includes(val)) {
                        setBrandFormData((prev) => ({
                          ...prev,
                          tags: [...prev.tags, val],
                          tagInput: '',
                        }));
                      }
                    }
                  }}
                  className="form-input"
                />
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {brandFormData.tags.map((t) => (
                    <span
                      key={t}
                      className="badge badge-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem' }}
                    >
                      #{t}
                      <X
                        size={10}
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          setBrandFormData((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== t) }))
                        }
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="studio-drawer-footer">
              <button
                type="button"
                onClick={() => !savingBrand && setIsBrandModalOpen(false)}
                className="btn btn-secondary"
                disabled={savingBrand}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBrandAsset}
                disabled={savingBrand || uploadingBrandFile}
                className="btn btn-primary"
              >
                {savingBrand ? <Loader2 size={15} className="spin" /> : 'Save Asset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE FULLSCREEN LIGHTBOX MODAL ────────────────────────────── */}
      {activeAlbumLightbox && (
        <div className="media-lightbox-backdrop" onClick={() => setActiveAlbumLightbox(null)}>
          {/* Header */}
          <div className="media-lightbox-header" onClick={(e) => e.stopPropagation()}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{activeAlbumLightbox.title}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {activeAlbumLightbox.committeeName} • Photo {activePhotoIdx + 1} of{' '}
                {activeAlbumLightbox.assets?.length || 1}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeAlbumLightbox.assets?.[activePhotoIdx]?.assetUrl && (
                <a
                  href={activeAlbumLightbox.assets[activePhotoIdx].assetUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setActiveAlbumLightbox(null)}
                className="btn btn-secondary btn-icon btn-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Viewport */}
          <div className="media-lightbox-viewport" onClick={(e) => e.stopPropagation()}>
            {activeAlbumLightbox.assets && activeAlbumLightbox.assets.length > 0 ? (
              <>
                <img
                  src={activeAlbumLightbox.assets[activePhotoIdx]?.assetUrl || activeAlbumLightbox.coverImageUrl}
                  alt={activeAlbumLightbox.assets[activePhotoIdx]?.caption || activeAlbumLightbox.title}
                  className="media-lightbox-img"
                />

                {activeAlbumLightbox.assets[activePhotoIdx]?.caption && (
                  <div className="media-lightbox-caption">
                    {activeAlbumLightbox.assets[activePhotoIdx].caption}
                  </div>
                )}

                {activeAlbumLightbox.assets.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="media-lightbox-nav-btn media-lightbox-nav-btn--prev"
                      onClick={() =>
                        setActivePhotoIdx((prev) =>
                          prev > 0 ? prev - 1 : activeAlbumLightbox.assets.length - 1
                        )
                      }
                      title="Previous (Left Arrow)"
                    >
                      <ChevronLeft size={24} />
                    </button>

                    <button
                      type="button"
                      className="media-lightbox-nav-btn media-lightbox-nav-btn--next"
                      onClick={() =>
                        setActivePhotoIdx((prev) =>
                          prev < activeAlbumLightbox.assets.length - 1 ? prev + 1 : 0
                        )
                      }
                      title="Next (Right Arrow)"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{ color: '#fff', textAlign: 'center' }}>No assets in this album.</div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {activeAlbumLightbox.assets && activeAlbumLightbox.assets.length > 1 && (
            <div className="media-lightbox-strip" onClick={(e) => e.stopPropagation()}>
              {activeAlbumLightbox.assets.map((asset, idx) => (
                <div
                  key={asset.id || idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`media-lightbox-thumb ${
                    idx === activePhotoIdx ? 'media-lightbox-thumb--active' : ''
                  }`}
                >
                  <img src={asset.assetUrl} alt="" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
