import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import {
  Users,
  Linkedin,
  Mail,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  Loader2,
  X,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export default function About() {
  const { user } = useAuthStore();
  const toast = useToastStore();
  const isAdmin = Boolean(
    user?.role === 'admin' ||
    (user?.availableScopes && user.availableScopes.some((s) => s.role === 'admin'))
  );

  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drag and Drop state
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Modals state
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [savingOfficer, setSavingOfficer] = useState(false);
  const [officerForm, setOfficerForm] = useState({
    name: '',
    role: '',
    season: '',
    isCurrentSeason: true,
    bio: '',
    linkedinUrl: '',
    email: '',
    displayOrder: 1,
    avatarFile: null,
    avatarUrl: '',
  });

  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [newSeasonInput, setNewSeasonInput] = useState('');
  const [isNewSeasonCurrent, setIsNewSeasonCurrent] = useState(false);
  const [settingActiveSeason, setSettingActiveSeason] = useState(false);

  function sortSeasonsDesc(list) {
    return [...list].sort((a, b) => {
      const yearA = parseInt((a.season || '').split('/')[0], 10) || 0;
      const yearB = parseInt((b.season || '').split('/')[0], 10) || 0;
      return yearB - yearA;
    });
  }

  useEffect(() => {
    loadSeasonsAndOfficers();
  }, []);

  async function loadSeasonsAndOfficers() {
    setLoading(true);
    try {
      const seasonsRes = await api.getPublicSeasons();
      const seasonList = sortSeasonsDesc(seasonsRes.seasons || []);
      setSeasons(seasonList);

      const currentSeason = seasonList.find((s) => s.isCurrent)?.season || seasonList[0]?.season || '2025/2026';
      setSelectedSeason(currentSeason);

      const officersRes = await api.getPublicOfficers({ season: currentSeason });
      setOfficers(officersRes.officers || []);
    } catch (err) {
      console.error('Failed to load leadership data:', err);
      toast.error('Load Error', 'Failed to load leadership officers.');
    } finally {
      setLoading(false);
    }
  }

  const handleSeasonChange = async (season) => {
    setSelectedSeason(season);
    setLoading(true);
    try {
      const res = await api.getPublicOfficers({ season });
      setOfficers(res.officers || []);
    } catch (err) {
      console.error('Failed to fetch officers for season:', err);
      toast.error('Load Error', 'Failed to load officers for selected season.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveSeason = async () => {
    if (!selectedSeason || !isAdmin) return;
    setSettingActiveSeason(true);
    try {
      await api.setActiveSeason(selectedSeason);
      toast.success('Active Season Set', `${selectedSeason} is now marked as the active leadership season.`);
      const seasonsRes = await api.getPublicSeasons();
      const seasonList = sortSeasonsDesc(seasonsRes.seasons || []);
      setSeasons(seasonList);
      handleSeasonChange(selectedSeason);
    } catch (err) {
      toast.error('Failed to Set Active Season', err.message);
    } finally {
      setSettingActiveSeason(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Drag and Drop Reordering (Admin Only)
  // ---------------------------------------------------------------------------
  const handleDragStart = (e, index) => {
    if (!isAdmin) return;
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    if (!isAdmin) return;
    e.preventDefault();
    if (dropTargetIdx !== index) {
      setDropTargetIdx(index);
    }
  };

  const handleDragLeave = () => {
    setDropTargetIdx(null);
  };

  const handleDrop = async (e, targetIndex) => {
    if (!isAdmin || draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      setDropTargetIdx(null);
      return;
    }
    e.preventDefault();

    const updated = [...officers];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIndex, 0, moved);

    setOfficers(updated);
    setDraggedIdx(null);
    setDropTargetIdx(null);

    await persistReorder(updated);
  };

  // Fallback Move Left / Right
  const handleShiftPosition = async (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= officers.length) return;

    const updated = [...officers];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[targetIndex];
    updated[targetIndex] = temp;

    setOfficers(updated);
    await persistReorder(updated);
  };

  const persistReorder = async (updatedList) => {
    setSavingOrder(true);
    try {
      const orderedItems = updatedList.map((off, idx) => ({
        id: off.id,
        displayOrder: idx + 1,
      }));
      await api.reorderPublicOfficers(orderedItems);
    } catch (err) {
      toast.error('Reorder Failed', err.message);
      handleSeasonChange(selectedSeason); // rollback on error
    } finally {
      setSavingOrder(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Officer CRUD (Admin Only)
  // ---------------------------------------------------------------------------
  const handleSaveOfficer = async (e) => {
    e.preventDefault();
    if (!officerForm.name.trim() || !officerForm.role.trim() || !officerForm.season.trim()) {
      toast.error('Validation Error', 'Name, role, and season are required.');
      return;
    }

    setSavingOfficer(true);
    try {
      let avatarUrl = officerForm.avatarUrl;

      // Upload avatar to Cloudinary if new file selected (up to 10MB)
      if (officerForm.avatarFile) {
        const cldRes = await api.uploadDirectToCloudinary({
          file: officerForm.avatarFile,
          folder: 'avatars',
          resourceType: 'image',
        });
        avatarUrl = cldRes.secureUrl || cldRes.url;
      }

      const payload = {
        name: officerForm.name.trim(),
        role: officerForm.role.trim(),
        season: officerForm.season.trim(),
        isCurrentSeason: Boolean(officerForm.isCurrentSeason),
        bio: officerForm.bio.trim() || null,
        linkedinUrl: officerForm.linkedinUrl.trim() || null,
        email: officerForm.email.trim() || null,
        avatarUrl: avatarUrl || null,
        displayOrder: officerForm.displayOrder || officers.length + 1,
      };

      if (editingOfficer) {
        await api.updatePublicOfficer(editingOfficer.id, payload);
        toast.success('Officer Updated', `${payload.name} details updated.`);
      } else {
        await api.createPublicOfficer(payload);
        toast.success('Officer Added', `${payload.name} added to ${payload.season} leadership.`);
      }

      setShowOfficerModal(false);
      setEditingOfficer(null);
      handleSeasonChange(selectedSeason);
    } catch (err) {
      toast.error('Save Failed', err.message);
    } finally {
      setSavingOfficer(false);
    }
  };

  const handleDeleteOfficer = async (officerId, officerName) => {
    if (!window.confirm(`Are you sure you want to delete ${officerName}? Their profile and avatar will be permanently removed.`)) {
      return;
    }

    try {
      await api.deletePublicOfficer(officerId);
      toast.success('Officer Deleted', `${officerName} was removed from the leadership roster.`);
      setOfficers((prev) => prev.filter((o) => o.id !== officerId));
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Season Creation
  // ---------------------------------------------------------------------------
  const handleCreateSeason = (e) => {
    e.preventDefault();
    const seasonRegex = /^(\d{4})\/(\d{4})$/;
    const match = newSeasonInput.trim().match(seasonRegex);
    if (!match || parseInt(match[2], 10) !== parseInt(match[1], 10) + 1) {
      toast.error('Invalid Format', 'Season must follow YYYY/YYYY format where end year is start year + 1 (e.g., 2026/2027).');
      return;
    }

    const newSeason = newSeasonInput.trim();
    if (!seasons.some((s) => s.season === newSeason)) {
      setSeasons([{ season: newSeason, isCurrent: isNewSeasonCurrent }, ...seasons]);
    }
    setSelectedSeason(newSeason);
    setShowSeasonModal(false);
    setNewSeasonInput('');

    // Pre-fill officer modal for this new season
    setEditingOfficer(null);
    setOfficerForm({
      name: '',
      role: 'Branch Chair',
      season: newSeason,
      isCurrentSeason: isNewSeasonCurrent,
      bio: '',
      linkedinUrl: '',
      email: '',
      displayOrder: 1,
      avatarFile: null,
      avatarUrl: '',
    });
    setShowOfficerModal(true);
  };

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="section-title-wrap">
          <h1 className="section-title">Meet the Brains</h1>
          <p className="section-subtitle">
            The passionate leaders and officers driving IEEE Menoufia Student Branch across the whole season.
          </p>
        </div>

        {/* Admin Management Toolbar */}
        {isAdmin && (
          <div
            className="bento-card"
            style={{
              padding: 'var(--space-4) var(--space-6)',
              marginBottom: 'var(--space-8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={12} />
                <span>Admin Edit Mode</span>
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Drag cards or use arrows to reorder hierarchy. Edit details directly on each card below.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(() => {
                const selObj = seasons.find((s) => s.season === selectedSeason);
                if (selObj && !selObj.isCurrent) {
                  return (
                    <button
                      type="button"
                      onClick={handleSetActiveSeason}
                      disabled={settingActiveSeason}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '0.35rem', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                      title={`Mark ${selectedSeason} as the active current season`}
                    >
                      {settingActiveSeason ? <Loader2 size={14} className="spinner" /> : <CheckCircle2 size={14} />}
                      <span>Set as Active Season</span>
                    </button>
                  );
                }
                return null;
              })()}

              <button
                type="button"
                onClick={() => {
                  setNewSeasonInput('');
                  setIsNewSeasonCurrent(false);
                  setShowSeasonModal(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.35rem' }}
              >
                <Calendar size={14} />
                <span>New Season</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingOfficer(null);
                  setOfficerForm({
                    name: '',
                    role: '',
                    season: selectedSeason,
                    isCurrentSeason: true,
                    bio: '',
                    linkedinUrl: '',
                    email: '',
                    displayOrder: officers.length + 1,
                    avatarFile: null,
                    avatarUrl: '',
                  });
                  setShowOfficerModal(true);
                }}
                className="btn btn-primary btn-sm"
                style={{ gap: '0.35rem' }}
              >
                <Plus size={15} />
                <span>Add Officer</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Season Filter Pills */}
        {seasons.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-10)',
            }}
          >
            {seasons.map((s) => (
              <button
                key={s.season}
                type="button"
                className={`btn btn-sm ${selectedSeason === s.season ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSeasonChange(s.season)}
                style={{
                  borderRadius: 'var(--radius-pill)',
                  padding: '0.45rem 1.15rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Calendar size={14} />
                <span>{s.season}</span>
                {s.isCurrent && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: selectedSeason === s.season ? '#FFFFFF' : '#10B981',
                      display: 'inline-block',
                      boxShadow: selectedSeason === s.season ? '0 0 6px rgba(255,255,255,0.8)' : '0 0 6px #10B981',
                    }}
                    title="Current Active Season"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Officers Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
            <Loader2 size={32} className="spinner" color="var(--color-primary)" />
          </div>
        ) : officers.length === 0 ? (
          <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            <Users size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Officers Found for {selectedSeason}</h3>
            <p style={{ marginBottom: isAdmin ? 'var(--space-6)' : 0 }}>
              {isAdmin
                ? 'Click "Add Officer" in the toolbar above to feature branch leadership for this season.'
                : 'Officers data will appear here once announced for this season.'}
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingOfficer(null);
                  setOfficerForm({
                    name: '',
                    role: 'Branch Chair',
                    season: selectedSeason,
                    isCurrentSeason: true,
                    bio: '',
                    linkedinUrl: '',
                    email: '',
                    displayOrder: 1,
                    avatarFile: null,
                    avatarUrl: '',
                  });
                  setShowOfficerModal(true);
                }}
                className="btn btn-primary"
                style={{ gap: '0.4rem' }}
              >
                <Plus size={16} />
                <span>Add First Officer</span>
              </button>
            )}
          </div>
        ) : (
          <div className={`officers-grid ${officers.length < 5 ? 'officers-grid--few' : ''}`}>
            {officers.map((officer, index) => {
              const isBeingDragged = draggedIdx === index;
              const isDropTarget = dropTargetIdx === index;

              return (
                <div
                  key={officer.id}
                  draggable={isAdmin}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`bento-card ${isBeingDragged ? 'officer-card--dragging' : ''} ${isDropTarget ? 'officer-card--drop-target' : ''}`}
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all var(--transition-fast)',
                    border: isDropTarget ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}
                >
                  {/* Admin Drag Handle & Quick Actions Overlay */}
                  {isAdmin && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        right: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 10,
                        background: 'var(--color-surface)',
                        backdropFilter: 'blur(8px)',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <div
                        className="officer-drag-handle"
                        title="Drag to reorder card hierarchy"
                        style={{
                          color: 'var(--color-text)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          whiteSpace: 'nowrap',
                          lineHeight: 1,
                        }}
                      >
                        <GripVertical size={16} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: 1 }}>
                          #{index + 1}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleShiftPosition(index, -1)}
                            className="btn btn-icon btn-sm"
                            title="Move left/up"
                            style={{ width: '24px', height: '24px' }}
                          >
                            <ArrowLeft size={13} />
                          </button>
                        )}

                        {index < officers.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleShiftPosition(index, 1)}
                            className="btn btn-icon btn-sm"
                            title="Move right/down"
                            style={{ width: '24px', height: '24px' }}
                          >
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Portrait Image Container */}
                  <div
                    style={{
                      width: '100%',
                      height: '290px',
                      backgroundColor: 'var(--color-bg-alt)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {officer.avatarUrl ? (
                      <img
                        src={officer.avatarUrl}
                        alt={officer.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                          transition: 'transform var(--transition-slow)',
                        }}
                        className="officer-img"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-primary)',
                          fontWeight: 800,
                          fontSize: '3rem',
                        }}
                      >
                        {officer.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name, Role Badge, and Contact Icons Row */}
                  <div style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.375rem' }}>{officer.name}</h3>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {officer.role}
                      </span>
                    </div>

                    {officer.bio && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {officer.bio}
                      </p>
                    )}

                    {/* Contact Row directly under image details */}
                    <div
                      style={{
                        borderTop: '1px solid var(--color-border)',
                        paddingTop: 'var(--space-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      {officer.linkedinUrl && (
                        <a
                          href={officer.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-icon"
                          style={{ width: '2.25rem', height: '2.25rem', padding: 0 }}
                          title={`LinkedIn Profile for ${officer.name}`}
                        >
                          <Linkedin size={15} style={{ color: 'var(--color-primary)' }} />
                        </a>
                      )}
                      {officer.email && (
                        <a
                          href={`mailto:${officer.email}`}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '2.25rem', height: '2.25rem', padding: 0 }}
                          title={`Send email to ${officer.name}`}
                        >
                          <Mail size={15} style={{ color: 'var(--color-accent)' }} />
                        </a>
                      )}
                    </div>

                    {/* Prominent Admin Action Row */}
                    {isAdmin && (
                      <div
                        style={{
                          marginTop: 'var(--space-4)',
                          paddingTop: 'var(--space-3)',
                          borderTop: '1px solid var(--color-border)',
                          display: 'flex',
                          gap: '0.5rem',
                          width: '100%',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOfficer(officer);
                            setOfficerForm({
                              name: officer.name,
                              role: officer.role,
                              season: officer.season,
                              isCurrentSeason: officer.isCurrentSeason,
                              bio: officer.bio || '',
                              linkedinUrl: officer.linkedinUrl || '',
                              email: officer.email || '',
                              displayOrder: officer.displayOrder || index + 1,
                              avatarFile: null,
                              avatarUrl: officer.avatarUrl || '',
                            });
                            setShowOfficerModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, gap: '0.35rem', justifyContent: 'center' }}
                          title={`Edit ${officer.name}`}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOfficer(officer.id, officer.name)}
                          className="btn btn-danger btn-sm btn-icon"
                          style={{ padding: '0 0.6rem' }}
                          title={`Delete ${officer.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================================= */}
        {/* Modal: Add / Edit Public Officer (Admin Only) */}
        {/* ================================================================= */}
        {showOfficerModal && isAdmin && (
          <div className="modal-backdrop" onClick={() => !savingOfficer && setShowOfficerModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  {editingOfficer ? 'Edit Leadership Officer' : 'Add Public Officer'}
                </h3>
                {!savingOfficer && (
                  <button type="button" onClick={() => setShowOfficerModal(false)} className="btn btn-icon btn-sm">
                    <X size={18} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveOfficer}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={officerForm.name}
                      onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                      placeholder="e.g., Yousef Abdelwahed"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Public Role / Title *</label>
                    <input
                      type="text"
                      required
                      value={officerForm.role}
                      onChange={(e) => setOfficerForm({ ...officerForm, role: e.target.value })}
                      placeholder="e.g., Branch Chair, Vice Chair, Secretary"
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">Season *</label>
                      <input
                        type="text"
                        required
                        value={officerForm.season}
                        onChange={(e) => setOfficerForm({ ...officerForm, season: e.target.value })}
                        placeholder="2025/2026"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Display Order</label>
                      <input
                        type="number"
                        value={officerForm.displayOrder}
                        onChange={(e) => setOfficerForm({ ...officerForm, displayOrder: parseInt(e.target.value, 10) || 1 })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Avatar Image (Upload up to 10MB)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setOfficerForm({ ...officerForm, avatarFile: e.target.files[0] })}
                      className="form-input"
                      style={{ padding: 'var(--space-2)' }}
                    />
                    {officerForm.avatarUrl && !officerForm.avatarFile && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Current avatar active. Choose a new file to replace it.
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Short Bio (Optional)</label>
                    <textarea
                      rows={2}
                      value={officerForm.bio}
                      onChange={(e) => setOfficerForm({ ...officerForm, bio: e.target.value })}
                      placeholder="Brief description of responsibilities or vision..."
                      className="form-textarea"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">LinkedIn URL</label>
                      <input
                        type="url"
                        value={officerForm.linkedinUrl}
                        onChange={(e) => setOfficerForm({ ...officerForm, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Public Contact Email</label>
                      <input
                        type="email"
                        value={officerForm.email}
                        onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                        placeholder="chair@ieee.menoufia.org"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="isCurrentSeasonCheck"
                      checked={officerForm.isCurrentSeason}
                      onChange={(e) => setOfficerForm({ ...officerForm, isCurrentSeason: e.target.checked })}
                    />
                    <label htmlFor="isCurrentSeasonCheck" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                      Active season leadership
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    disabled={savingOfficer}
                    onClick={() => setShowOfficerModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={savingOfficer} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                    {savingOfficer && <Loader2 size={16} className="spinner" />}
                    <span>{editingOfficer ? 'Update Officer' : 'Publish Officer'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* Modal: New Season Creation */}
        {/* ================================================================= */}
        {showSeasonModal && isAdmin && (
          <div className="modal-backdrop" onClick={() => setShowSeasonModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Create New Season
                </h3>
                <button type="button" onClick={() => setShowSeasonModal(false)} className="btn btn-icon btn-sm">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSeason}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Season Term (YYYY/YYYY) *</label>
                    <input
                      type="text"
                      required
                      value={newSeasonInput}
                      onChange={(e) => setNewSeasonInput(e.target.value)}
                      placeholder="e.g., 2026/2027"
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="newSeasonIsCurrent"
                      checked={isNewSeasonCurrent}
                      onChange={(e) => setIsNewSeasonCurrent(e.target.checked)}
                    />
                    <label htmlFor="newSeasonIsCurrent" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                      Set as Current Active Season
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowSeasonModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create & Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Officers Grid & Card Styling */}
      <style>{`
        .officers-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: var(--space-5);
          margin-bottom: var(--space-12);
        }
        .officers-grid--few {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: var(--space-5);
        }
        .officers-grid--few > .bento-card {
          width: 260px;
          max-width: 100%;
        }
        @media (max-width: 1200px) {
          .officers-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 992px) {
          .officers-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .officers-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .officers-grid {
            grid-template-columns: 1fr;
          }
        }
        .officer-drag-handle {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          white-space: nowrap;
          cursor: grab;
          user-select: none;
        }
        .officer-drag-handle:active {
          cursor: grabbing;
        }
        .bento-card:hover .officer-img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
