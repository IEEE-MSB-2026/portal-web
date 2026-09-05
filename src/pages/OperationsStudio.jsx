import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';
import { api } from '../services/api';
import '../styles/operations.css';
import {
  QrCode,
  Calendar,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  Smartphone,
  Scan,
  Mail,
  Plus,
  Search,
  Download,
  RefreshCw,
  Sliders,
  Eye,
  Tv,
  Sparkles,
  AlertTriangle,
  X,
  ChevronRight,
  MapPin,
  Clock,
  ArrowRight,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Star,
  Check,
  Award,
  Send,
  Camera,
  Activity as ActivityIcon,
} from 'lucide-react';

export default function OperationsStudio() {
  const { user } = useAuthStore();
  const toast = useToastStore();

  // Tab State: 'events' | 'scanner' | 'roster'
  const [activeTab, setActiveTab] = useState('events');

  // Core Data State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Event Details & Sub-Items
  const [activities, setActivities] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [eventStats, setEventStats] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState('');

  // Drawers & Modals State
  const [drawerEvent, setDrawerEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEmailDispatchModal, setShowEmailDispatchModal] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [kioskActivity, setKioskActivity] = useState(null);

  // Event Form State
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    location: '',
    venue: '',
    category: 'Conference',
    capacity: 100,
    isRegistrationOpen: true,
    allowedAudience: 'public',
    points: 25,
    customFields: [],
  });

  // Activity Form State
  const [activityForm, setActivityForm] = useState({
    name: '',
    type: 'workshop',
    points: 15,
    isLocked: false,
    checkInMode: 'staff_scanner',
    description: '',
  });

  // Email Template State
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Your Entry Ticket for {{eventName}} - IEEE Menoufia',
    bodyTemplate: 'Dear {{name}},\n\nWe are delighted to confirm your registration for {{eventName}}!\n\nDate: {{eventDate}}\nVenue: {{venue}}\nTicket Reference: {{ticketId}}\n\nPlease show this QR code at the reception desk upon arrival.',
    previewName: 'Yousef Mansour',
  });
  const [dispatchingEmails, setDispatchingEmails] = useState(false);

  // Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [manualTicketInput, setManualTicketInput] = useState('');
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanFeed, setScanFeed] = useState([]);
  const videoRef = useRef(null);

  // Filters
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
  const [eventSearch, setEventSearch] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState('all');

  // Backdrop dismiss hooks
  const eventModalBackdrop = useBackdropDismiss(() => setShowEventModal(false), { isOpen: showEventModal });
  const activityModalBackdrop = useBackdropDismiss(() => setShowActivityModal(false), { isOpen: showActivityModal });
  const emailModalBackdrop = useBackdropDismiss(() => setShowEmailDispatchModal(false), { isOpen: showEmailDispatchModal });

  // Load Events on Mount
  useEffect(() => {
    loadEvents();
  }, []);

  // When selected event changes, load activities, participants, and stats
  useEffect(() => {
    if (selectedEventId) {
      loadEventDetails(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents();
      const list = Array.isArray(data) ? data : (data.events || []);
      setEvents(list);
      if (list.length > 0 && !selectedEventId) {
        setSelectedEventId(list[0]._id || list[0].id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error('Load Failed', err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadEventDetails = async (eventId) => {
    try {
      const [acts, parts, stats] = await Promise.all([
        api.getEventActivities(eventId).catch(() => []),
        api.getEventParticipants(eventId).catch(() => ({ participants: [] })),
        api.getEventStats(eventId).catch(() => null),
      ]);

      const actList = Array.isArray(acts) ? acts : (acts.activities || []);
      const partList = Array.isArray(parts) ? parts : (parts.participants || []);

      setActivities(actList);
      setParticipants(partList);
      setEventStats(stats?.stats || null);

      if (actList.length > 0 && !selectedActivityId) {
        setSelectedActivityId(actList[0].qrId || actList[0]._id);
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
    }
  };

  const selectedEvent = useMemo(() => {
    return events.find((e) => (e._id || e.id) === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Overall Studio KPIs
  const studioKPIs = useMemo(() => {
    const totalEvents = events.length;
    let totalRegistrations = 0;
    let totalCheckedIn = 0;
    let totalPoints = 0;

    events.forEach((ev) => {
      totalRegistrations += (ev.registeredCount || 0);
      totalCheckedIn += (ev.checkedInCount || 0);
    });

    if (eventStats) {
      totalRegistrations = eventStats.totalRegistered || totalRegistrations;
      totalCheckedIn = eventStats.totalCheckedIn || totalCheckedIn;
    }

    participants.forEach((p) => {
      totalPoints += (p.pointsAwarded || 0);
    });

    return {
      totalEvents,
      totalRegistrations,
      totalCheckedIn,
      totalPoints: totalPoints || (totalCheckedIn * 25),
    };
  }, [events, eventStats, participants]);

  // ── Event Form & Custom Fields Handlers ─────────────────────────────────────
  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({
      name: '',
      description: '',
      location: 'Faculty of Electronic Engineering',
      venue: 'Main Auditorium',
      category: 'Conference',
      capacity: 100,
      isRegistrationOpen: true,
      allowedAudience: 'public',
      points: 25,
      customFields: [],
    });
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      name: ev.name || '',
      description: ev.description || '',
      location: ev.location || '',
      venue: ev.venue || '',
      category: ev.category || 'Conference',
      capacity: ev.capacity || 100,
      isRegistrationOpen: ev.isRegistrationOpen !== false,
      allowedAudience: ev.allowedAudience || 'public',
      points: ev.points || 25,
      customFields: ev.customFields || [],
    });
    setShowEventModal(true);
  };

  const handleAddCustomField = () => {
    setEventForm((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        {
          id: `field_${Date.now()}`,
          label: 'New Question',
          type: 'text',
          options: [],
          required: false,
          placeholder: '',
          order: prev.customFields.length,
        },
      ],
    }));
  };

  const handleUpdateCustomField = (index, updates) => {
    setEventForm((prev) => {
      const updated = [...prev.customFields];
      updated[index] = { ...updated[index], ...updates };
      return { ...prev, customFields: updated };
    });
  };

  const handleRemoveCustomField = (index) => {
    setEventForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        const evId = editingEvent._id || editingEvent.id;
        await api.updateEvent(evId, eventForm);
        toast.success('Event Updated', 'Event changes saved successfully.');
      } else {
        const res = await api.createEvent(eventForm);
        toast.success('Event Created', 'Event created with default Check-In activity!');
        if (res?.event) {
          setSelectedEventId(res.event._id || res.event.id);
        }
      }
      setShowEventModal(false);
      loadEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      toast.error('Save Error', err.message || 'Failed to save event');
    }
  };

  // ── Activity Handlers ──────────────────────────────────────────────────────
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    if (!evId) return;
    try {
      await api.createEventActivity(evId, activityForm);
      setShowActivityModal(false);
      setActivityForm({
        name: '',
        type: 'workshop',
        points: 15,
        isLocked: false,
        checkInMode: 'staff_scanner',
        description: '',
      });
      loadEventDetails(evId);
      toast.success('Activity Added', 'Sub-activity registered successfully.');
    } catch (err) {
      console.error('Error adding activity:', err);
      toast.error('Activity Error', err.message || 'Failed to add activity');
    }
  };

  const handleToggleActivityLock = async (act) => {
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    try {
      const actId = act._id || act.id;
      const res = await api.toggleActivityLock(evId, actId, !act.isLocked);
      setActivities((prev) =>
        prev.map((a) => ((a._id || a.id) === actId ? { ...a, isLocked: res.activity?.isLocked } : a))
      );
      toast.success(
        res.activity?.isLocked ? 'Activity Locked' : 'Activity Unlocked',
        `Activity "${act.name}" is now ${res.activity?.isLocked ? 'closed for scanning' : 'open for check-ins'}.`
      );
    } catch (err) {
      console.error('Error toggling lock:', err);
      toast.error('Lock Error', err.message || 'Failed to toggle activity lock');
    }
  };

  const handleToggleActivityMode = async (act) => {
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    const nextMode = act.checkInMode === 'self_service' ? 'staff_scanner' : 'self_service';
    try {
      const actId = act._id || act.id;
      const res = await api.setActivityMode(evId, actId, nextMode);
      setActivities((prev) =>
        prev.map((a) => ((a._id || a.id) === actId ? { ...a, checkInMode: res.activity?.checkInMode } : a))
      );
      toast.success(
        'Mode Changed',
        `Check-in mode set to ${nextMode === 'self_service' ? 'Self-Service Kiosk' : 'Staff Scanner'}.`
      );
    } catch (err) {
      console.error('Error switching mode:', err);
      toast.error('Mode Error', err.message || 'Failed to update check-in mode');
    }
  };

  const handleOpenKioskProjector = (act) => {
    setKioskActivity(act);
    setShowKioskModal(true);
  };

  // ── Scanner & Check-In Handlers ───────────────────────────────────────────
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Webcam permission denied or unavailable:', err);
      toast.info('Camera Notice', 'Webcam preview simulated. You can scan via input or mobile.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const executeCheckInScan = async (ticketPayload) => {
    if (!selectedEventId || !ticketPayload) return;
    setScanning(true);
    setLastScanResult(null);

    const targetActivity = activities.find((a) => a.qrId === selectedActivityId || a._id === selectedActivityId) || activities[0];
    const activityQrId = targetActivity?.qrId || selectedActivityId;

    try {
      const res = await api.scanAttendeeQR(selectedEventId, {
        ticketId: ticketPayload,
        activityQrId,
      });

      const successRecord = {
        type: 'success',
        message: `Checked in: ${res.participant?.name || 'Attendee'}`,
        participant: res.participant,
        activity: res.activity,
        timestamp: new Date().toLocaleTimeString(),
      };

      setLastScanResult(successRecord);
      setScanFeed((prev) => [successRecord, ...prev.slice(0, 19)]);
      toast.success('Check-In Confirmed', `${res.participant?.name} checked in (+${res.participant?.pointsEarned || 0} pts)!`);

      // Refresh stats & participants
      loadEventDetails(selectedEventId);
    } catch (err) {
      console.error('Scan error:', err);
      const isDuplicate = err.alreadyScanned || err.status === 409 || err.message?.includes('already');
      const errRecord = {
        type: isDuplicate ? 'duplicate' : 'error',
        message: err.message || 'Scan verification failed',
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastScanResult(errRecord);
      setScanFeed((prev) => [errRecord, ...prev.slice(0, 19)]);
      if (isDuplicate) {
        toast.warning('Already Scanned', 'Attendee has already been scanned for this activity.');
      } else {
        toast.error('Scan Failed', err.message || 'Ticket verification failed');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleManualCheckInSubmit = (e) => {
    e.preventDefault();
    if (!manualTicketInput.trim()) return;
    executeCheckInScan(manualTicketInput.trim());
    setManualTicketInput('');
  };

  const handleQuickManualCheckIn = async (participant) => {
    const pId = participant._id || participant.id;
    executeCheckInScan(pId);
  };

  // ── Email Template Dispatcher ──────────────────────────────────────────────
  const handleDispatchQREmails = async () => {
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    if (!evId) return;
    setDispatchingEmails(true);
    try {
      const res = await api.sendEventQRCodes(evId, {
        subject: emailTemplate.subject,
        bodyTemplate: emailTemplate.bodyTemplate,
      });
      toast.success('Emails Dispatched', res.message || 'QR ticket emails dispatched to registered attendees!');
      setShowEmailDispatchModal(false);
      loadEventDetails(evId);
    } catch (err) {
      console.error('Error dispatching emails:', err);
      toast.error('Dispatch Error', err.message || 'Failed to dispatch emails');
    } finally {
      setDispatchingEmails(false);
    }
  };

  const handleAwardBonusPoints = async () => {
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    const pointsInput = prompt('Enter bonus activity points to award to all checked-in attendees:', '25');
    if (!pointsInput) return;
    const points = Number(pointsInput);
    if (Number.isNaN(points) || points <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      const res = await api.awardEventActivityPoints(evId, { pointsOverride: points });
      toast.success('Points Distributed', res.message || `Awarded ${points} points!`);
      loadEventDetails(evId);
    } catch (err) {
      console.error('Error awarding points:', err);
      toast.error('Points Error', err.message || 'Failed to award points');
    }
  };

  const handleExportCSV = () => {
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    if (!evId) return;
    const exportUrl = `/api/events/${evId}/attendance/export`;
    window.open(exportUrl, '_blank');
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        !eventSearch ||
        ev.name?.toLowerCase().includes(eventSearch.toLowerCase()) ||
        ev.location?.toLowerCase().includes(eventSearch.toLowerCase()) ||
        ev.venue?.toLowerCase().includes(eventSearch.toLowerCase());

      const matchesCategory =
        eventCategoryFilter === 'all' ||
        ev.category?.toLowerCase() === eventCategoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [events, eventSearch, eventCategoryFilter]);

  // Filtered Participants Roster
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        !rosterSearch ||
        p.name?.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        p.email?.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        p.phoneNumber?.includes(rosterSearch);

      const matchesStatus =
        rosterStatusFilter === 'all' ||
        (rosterStatusFilter === 'checked_in' && (p.scannedActivities?.length > 0 || p.status === 'checked_in')) ||
        (rosterStatusFilter === 'registered' && (!p.scannedActivities || p.scannedActivities.length === 0));

      return matchesSearch && matchesStatus;
    });
  }, [participants, rosterSearch, rosterStatusFilter]);

  return (
    <div className="ops-studio">
      
      {/* ── Studio Header ───────────────────────────────────────────────────── */}
      <div className="ops-studio__header">
        <div className="ops-studio__header-content">
          <h1>
            <QrCode size={26} /> Operations Studio
          </h1>
          <p>
            Event operations management, dynamic registration builder, live web camera QR scanner, and kiosk projection.
          </p>
        </div>
        <div className="ops-studio__header-actions">
          <button
            onClick={handleOpenCreateEvent}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> New Event
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!selectedEventId}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Top KPI Metrics Bar (4 Columns) ────────────────────────────────── */}
      <div className="ops-kpi-grid">
        <div className="ops-kpi-card">
          <div className="ops-kpi-icon-wrap ops-kpi-icon-wrap--primary">
            <Calendar size={22} />
          </div>
          <div className="ops-kpi-content">
            <span className="ops-kpi-value">{studioKPIs.totalEvents}</span>
            <span className="ops-kpi-label">Active Events</span>
          </div>
        </div>

        <div className="ops-kpi-card">
          <div className="ops-kpi-icon-wrap ops-kpi-icon-wrap--purple">
            <Users size={22} />
          </div>
          <div className="ops-kpi-content">
            <span className="ops-kpi-value">{studioKPIs.totalRegistrations}</span>
            <span className="ops-kpi-label">Registered Attendees</span>
          </div>
        </div>

        <div className="ops-kpi-card">
          <div className="ops-kpi-icon-wrap ops-kpi-icon-wrap--emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="ops-kpi-content">
            <span className="ops-kpi-value">{studioKPIs.totalCheckedIn}</span>
            <span className="ops-kpi-label">Live Check-Ins</span>
          </div>
        </div>

        <div className="ops-kpi-card">
          <div className="ops-kpi-icon-wrap ops-kpi-icon-wrap--amber">
            <Award size={22} />
          </div>
          <div className="ops-kpi-content">
            <span className="ops-kpi-value">{studioKPIs.totalPoints}</span>
            <span className="ops-kpi-label">Points Awarded</span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="ops-tabs">
        <button
          type="button"
          className={`ops-tab ${activeTab === 'events' ? 'ops-tab--active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Calendar size={16} /> Event Management
          <span className="ops-tab__badge">{events.length}</span>
        </button>

        <button
          type="button"
          className={`ops-tab ${activeTab === 'scanner' ? 'ops-tab--active' : ''}`}
          onClick={() => {
            setActiveTab('scanner');
            if (!cameraActive) startCamera();
          }}
        >
          <Scan size={16} /> Live QR Scanner & Desk
        </button>

        <button
          type="button"
          className={`ops-tab ${activeTab === 'roster' ? 'ops-tab--active' : ''}`}
          onClick={() => {
            setActiveTab('roster');
            stopCamera();
          }}
        >
          <Users size={16} /> Attendance Roster & Dispatcher
          <span className="ops-tab__badge">{participants.length}</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: EVENT BUILDER & ACTIVITIES MANAGEMENT
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Toolbar */}
          <div className="ops-toolbar">
            <div className="ops-toolbar__group">
              <div className="ops-search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events by name or location..."
                  className="form-input ops-search-input"
                />
              </div>

              <select
                className="form-input"
                style={{ width: 'auto', minWidth: 150 }}
                value={eventCategoryFilter}
                onChange={(e) => setEventCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>

            <div className="ops-toolbar__group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadEvents}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
              Loading events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Calendar size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.5 }} />
              <h3>No events found matching criteria.</h3>
            </div>
          ) : (
            <div className="ops-event-grid">
              {filteredEvents.map((ev) => {
                const isSelected = (ev._id || ev.id) === selectedEventId;
                const regCount = ev.registeredCount || 0;
                const cap = ev.capacity || 100;
                const pct = Math.min(100, Math.round((regCount / cap) * 100));

                return (
                  <div
                    key={ev._id || ev.id}
                    className={`ops-event-card ${isSelected ? 'ops-event-card--active' : ''}`}
                    onClick={() => {
                      setSelectedEventId(ev._id || ev.id);
                      setDrawerEvent(ev);
                    }}
                  >
                    <div className="ops-event-card__header">
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary">{ev.category || 'Event'}</span>
                        <span className={`badge ${ev.isRegistrationOpen !== false ? 'badge-accent' : 'badge-danger'}`}>
                          {ev.isRegistrationOpen !== false ? 'Registration Open' : 'Closed'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        ⭐ {ev.points || 25} pts
                      </span>
                    </div>

                    <div>
                      <h3 className="ops-event-card__title">{ev.name}</h3>
                      <p className="ops-event-card__desc">{ev.description}</p>
                    </div>

                    <div className="ops-event-card__meta">
                      <div className="ops-event-card__meta-item">
                        <MapPin size={14} />
                        <span>{ev.venue || ev.location}</span>
                      </div>
                      <div className="ops-event-card__meta-item">
                        <Users size={14} />
                        <span>Audience: {ev.allowedAudience || 'Public'}</span>
                      </div>
                    </div>

                    <div className="ops-capacity-progress">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        <span>Capacity ({regCount} / {cap})</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="ops-capacity-bar">
                        <div className="ops-capacity-bar__fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="ops-event-card__footer">
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        Activities & Details →
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditEvent(ev)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          title="Edit Event"
                        >
                          <Edit2 size={14} />
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

      {/* ════════════════════════════════════════════════════════════════════════
          EVENT DETAIL DRAWER (Slide-In Right)
         ════════════════════════════════════════════════════════════════════════ */}
      {drawerEvent && (
        <div className="ops-drawer-overlay" onClick={() => setDrawerEvent(null)}>
          <div className="ops-drawer-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="ops-drawer-header">
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.35rem' }}>
                  {drawerEvent.category || 'Event Detail'}
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                  {drawerEvent.name}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setDrawerEvent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ops-drawer-body">
              
              {/* Event Overview Card */}
              <div className="bento-card" style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 1rem' }}>
                  {drawerEvent.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  <div>📍 <strong>Venue:</strong> {drawerEvent.venue || drawerEvent.location}</div>
                  <div>👥 <strong>Audience:</strong> {drawerEvent.allowedAudience || 'Public'}</div>
                  <div>⭐ <strong>Points:</strong> {drawerEvent.points || 25} pts</div>
                  <div>🎟️ <strong>Capacity:</strong> {drawerEvent.capacity || 'Unlimited'}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityModal(true);
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Plus size={14} /> Add Sub-Activity
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailDispatchModal(true)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Mail size={14} /> Dispatch QR Tickets
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
                  >
                    <FileSpreadsheet size={14} /> CSV Report
                  </button>
                </div>
              </div>

              {/* Sub-Activities Bento List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                    Sub-Activities ({activities.length})
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    Lock activities or switch to kiosk projection
                  </span>
                </div>

                <div className="ops-activity-list">
                  {activities.map((act) => (
                    <div
                      key={act._id || act.id}
                      className={`ops-activity-card ${act.isLocked ? 'ops-activity-card--locked' : ''}`}
                    >
                      <div className="ops-activity-card__info">
                        <div className="ops-activity-card__title">
                          <span>{act.name}</span>
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                            {act.type}
                          </span>
                          {act.isLocked && (
                            <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                              🔒 Locked
                            </span>
                          )}
                          <span className={`badge ${act.checkInMode === 'self_service' ? 'badge-accent' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                            {act.checkInMode === 'self_service' ? '📱 Kiosk Self-Scan' : '📷 Staff Scan'}
                          </span>
                        </div>
                        <div className="ops-activity-card__meta">
                          <span>⭐ +{act.points || 10} pts</span>
                          <span>• Key: <code style={{ color: 'var(--color-primary)' }}>{act.qrId}</code></span>
                          {act.description && <span>• {act.description}</span>}
                        </div>
                      </div>

                      <div className="ops-activity-card__actions">
                        <button
                          type="button"
                          onClick={() => handleToggleActivityLock(act)}
                          className={`btn ${act.isLocked ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          title={act.isLocked ? 'Unlock for scanning' : 'Lock activity'}
                        >
                          {act.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                          {act.isLocked ? 'Unlock' : 'Lock'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActivityMode(act)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          title="Toggle between Staff Scan and Self-Service Kiosk"
                        >
                          {act.checkInMode === 'self_service' ? 'Staff' : 'Kiosk'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenKioskProjector(act)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', color: 'var(--color-primary)' }}
                          title="Project QR on room screen"
                        >
                          <Tv size={12} /> Project
                        </button>
                      </div>
                    </div>
                  ))}

                  {activities.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                      No sub-activities registered.
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Registration Fields */}
              {drawerEvent.customFields && drawerEvent.customFields.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                    Registration Custom Questions ({drawerEvent.customFields.length})
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {drawerEvent.customFields.map((f) => (
                      <div key={f.id} className="badge badge-primary" style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}>
                        {f.label} ({f.type}) {f.required ? ' *' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2: LIVE WEB QR SCANNER & RECEPTION DESK
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'scanner' && (
        <div className="ops-scanner-layout">
          
          {/* Left Column: Camera Viewport */}
          <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Live Camera Scanner
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Point web camera at attendee QR ticket pass
                </span>
              </div>

              {/* Active Activity Dropdown */}
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: 200, fontSize: '0.85rem' }}
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
              >
                {activities.map((a) => (
                  <option key={a._id || a.id} value={a.qrId || a._id}>
                    {a.name} ({a.points || 10} pts) {a.isLocked ? '[LOCKED]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Video Box */}
            <div className="ops-video-container">
              <video
                ref={videoRef}
                playsInline
                muted
                className="ops-video-feed"
              />
              <div className="ops-scanner-laser" />
              <div className="ops-scanner-reticle-frame" />

              {!cameraActive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.85)', gap: '1rem' }}>
                  <Camera size={44} style={{ color: 'var(--color-primary)' }} />
                  <button
                    type="button"
                    onClick={startCamera}
                    className="btn btn-primary"
                  >
                    Start Web Camera
                  </button>
                </div>
              )}
            </div>

            {/* Manual Ticket Input Fallback */}
            <form onSubmit={handleManualCheckInSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={manualTicketInput}
                onChange={(e) => setManualTicketInput(e.target.value)}
                placeholder="Paste attendee ticket ID or JSON QR payload..."
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={scanning}
                className="btn btn-primary"
              >
                {scanning ? 'Verifying...' : 'Check-In'}
              </button>
            </form>
          </div>

          {/* Right Column: Feedback, Manual Desk & Scan Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            {/* Last Scan Result Card */}
            {lastScanResult && (
              <div className={`ops-scan-badge-feedback ops-scan-badge-feedback--${lastScanResult.type}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    {lastScanResult.type === 'success' ? '✅ Check-In Confirmed!' : lastScanResult.type === 'duplicate' ? '⚠️ Already Scanned' : '❌ Scan Rejected'}
                  </span>
                  <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                    {lastScanResult.timestamp}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem' }}>
                  {lastScanResult.message}
                </div>
                {lastScanResult.participant && (
                  <div style={{ fontSize: '0.8125rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{lastScanResult.participant.university}</span>
                    <span style={{ fontWeight: 700 }}>Total: {lastScanResult.participant.pointsAwarded || 0} pts</span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Reception Desk Lookup */}
            <div className="bento-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.65rem' }}>
                Reception Lookup Desk
              </h4>
              <input
                type="text"
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                placeholder="Search attendee by name or email..."
                className="form-input"
                style={{ marginBottom: '0.65rem' }}
              />

              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {participants
                  .filter((p) =>
                    !manualSearchQuery ||
                    p.name?.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
                    p.email?.toLowerCase().includes(manualSearchQuery.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((p) => {
                    const isCheckedIn = (p.scannedActivities || []).length > 0;
                    return (
                      <div
                        key={p._id || p.id}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickManualCheckIn(p)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          {isCheckedIn ? 'Scan Next' : 'Check In'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Recent Scan Feed */}
            <div className="bento-card" style={{ padding: '1.25rem', flex: 1 }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.65rem' }}>
                Recent Scan Log ({scanFeed.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {scanFeed.map((item, idx) => (
                  <div
                    key={idx}
                    style={{ fontSize: '0.8125rem', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{item.message}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{item.timestamp}</span>
                  </div>
                ))}
                {scanFeed.length === 0 && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem' }}>
                    No scans in this session yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3: ATTENDANCE ROSTER & DISPATCHER
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Controls Bar */}
          <div className="ops-toolbar">
            <div className="ops-toolbar__group">
              <div className="ops-search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="form-input ops-search-input"
                />
              </div>

              <select
                className="form-input"
                style={{ width: 'auto', minWidth: 160 }}
                value={rosterStatusFilter}
                onChange={(e) => setRosterStatusFilter(e.target.value)}
              >
                <option value="all">All Attendees ({participants.length})</option>
                <option value="checked_in">Checked-In Only</option>
                <option value="registered">Registered Only</option>
              </select>
            </div>

            <div className="ops-toolbar__group">
              <button
                type="button"
                onClick={() => setShowEmailDispatchModal(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Mail size={15} /> Dispatch QR Tickets
              </button>

              <button
                type="button"
                onClick={handleAwardBonusPoints}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Award size={15} /> Award Points
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Attendee Name</th>
                    <th>Email</th>
                    <th>Faculty & Org</th>
                    <th>Status</th>
                    <th>Activities Scanned</th>
                    <th>Points</th>
                    {selectedEvent?.customFields?.map((f) => (
                      <th key={f.id}>{f.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p) => {
                    const scans = p.scannedActivities || [];
                    const isCheckedIn = scans.length > 0 || p.status === 'checked_in';
                    return (
                      <tr key={p._id || p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{p.email}</td>
                        <td>{p.faculty || p.university || '—'}</td>
                        <td>
                          <span className={`badge ${isCheckedIn ? 'badge-accent' : 'badge-primary'}`}>
                            {isCheckedIn ? 'Checked In' : 'Registered'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {scans.length} scans
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#f59e0b' }}>
                          {p.pointsAwarded || 0} pts
                        </td>
                        {selectedEvent?.customFields?.map((f) => {
                          const val = (p.customResponses || {})[f.id];
                          return (
                            <td key={f.id} style={{ color: 'var(--color-text-muted)' }}>
                              {Array.isArray(val) ? val.join(', ') : (val != null ? String(val) : '—')}
                            </td>
                          );
                        })}
                        <td>
                          <button
                            type="button"
                            onClick={() => handleQuickManualCheckIn(p)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                          >
                            Check In
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredParticipants.length === 0 && (
                    <tr>
                      <td colSpan={7 + (selectedEvent?.customFields?.length || 0)} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        No attendee records matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: CREATE / EDIT EVENT
         ════════════════════════════════════════════════════════════════════════ */}
      {showEventModal && (
        <div className="modal-backdrop" {...eventModalBackdrop.getBackdropProps()}>
          <div className="modal-content" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowEventModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input
                  type="text"
                  required
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="e.g. AI Summit & Hackathon 2026"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Event agenda, keynote topics, instructions..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Venue / Location *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="e.g. Hall 1, Faculty of Electronic Engineering"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="form-input"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Seminar">Seminar</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Capacity Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Allowed Audience</label>
                  <select
                    value={eventForm.allowedAudience}
                    onChange={(e) => setEventForm({ ...eventForm, allowedAudience: e.target.value })}
                    className="form-input"
                  >
                    <option value="public">Public (Anyone)</option>
                    <option value="registered_users">Logged-In Portal Users</option>
                    <option value="active_members">Active Branch Members</option>
                    <option value="leads_only">Committee Leads Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Points</label>
                  <input
                    type="number"
                    min={0}
                    value={eventForm.points}
                    onChange={(e) => setEventForm({ ...eventForm, points: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Dynamic Custom Registration Fields Builder */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                      Registration Custom Questions
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      Dynamic attendee questionnaire fields asked during stage 2
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                  >
                    <Plus size={12} /> Add Field
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {eventForm.customFields.map((field, idx) => (
                    <div
                      key={field.id || idx}
                      className="bento-card"
                      style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateCustomField(idx, { label: e.target.value })}
                          placeholder="Question (e.g. T-Shirt Size)"
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                        />
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateCustomField(idx, { type: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <option value="text">Text Input</option>
                          <option value="select">Dropdown Select</option>
                          <option value="number">Number</option>
                          <option value="textarea">Textarea</option>
                          <option value="checkbox">Checkbox</option>
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(e) => handleUpdateCustomField(idx, { required: e.target.checked })}
                          />
                          Req
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(idx)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '28px', height: '28px', color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {field.type === 'select' && (
                        <input
                          type="text"
                          value={Array.isArray(field.options) ? field.options.join(', ') : ''}
                          onChange={(e) =>
                            handleUpdateCustomField(idx, {
                              options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Options separated by commas: S, M, L, XL"
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: ADD SUB-ACTIVITY
         ════════════════════════════════════════════════════════════════════════ */}
      {showActivityModal && (
        <div className="modal-backdrop" {...activityModalBackdrop.getBackdropProps()}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Add Sub-Activity
              </h2>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowActivityModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Activity Name *</label>
                <input
                  type="text"
                  required
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  placeholder="e.g. Workshop: Deep Learning"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Activity Type</label>
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                    className="form-input"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="check-in">Check-In</option>
                    <option value="meal">Meal / Catering</option>
                    <option value="talk">Talk / Keynote</option>
                    <option value="session">Session</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Activity Points</label>
                  <input
                    type="number"
                    min={0}
                    value={activityForm.points}
                    onChange={(e) => setActivityForm({ ...activityForm, points: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Check-In Mode</label>
                <select
                  value={activityForm.checkInMode}
                  onChange={(e) => setActivityForm({ ...activityForm, checkInMode: e.target.value })}
                  className="form-input"
                >
                  <option value="staff_scanner">Staff Scanner (OC Scans Attendee)</option>
                  <option value="self_service">Self-Service Kiosk (Attendee Scans & Inputs Email)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  placeholder="Instructor or location notes..."
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 3: QR EMAIL DISPATCHER (LIVE PREVIEW)
         ════════════════════════════════════════════════════════════════════════ */}
      {showEmailDispatchModal && (
        <div className="modal-backdrop" {...emailModalBackdrop.getBackdropProps()}>
          <div className="modal-content" style={{ maxWidth: '780px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Dispatch QR Ticket Emails
                </h2>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Send custom formatted QR ticket passes to {participants.length} registered attendees.
                </span>
              </div>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowEmailDispatchModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              
              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Subject</label>
                  <input
                    type="text"
                    value={emailTemplate.subject}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email Body Template (Variables: <code>{'{{name}}'}</code>, <code>{'{{eventName}}'}</code>, <code>{'{{venue}}'}</code>, <code>{'{{ticketId}}'}</code>)
                  </label>
                  <textarea
                    rows={8}
                    value={emailTemplate.bodyTemplate}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, bodyTemplate: e.target.value })}
                    className="form-input"
                    style={{ resize: 'vertical', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Real-time Email Preview */}
              <div className="bento-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-bg-alt)' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Subject</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                    {emailTemplate.subject.replace(/\{\{eventName\}\}/g, selectedEvent?.name || 'IEEE Event')}
                  </div>
                </div>

                <div style={{ fontSize: '0.84rem', lineHeight: 1.5, whiteSpace: 'pre-line', color: 'var(--color-text-muted)' }}>
                  {emailTemplate.bodyTemplate
                    .replace(/\{\{name\}\}/g, emailTemplate.previewName)
                    .replace(/\{\{eventName\}\}/g, selectedEvent?.name || 'AI Summit 2026')
                    .replace(/\{\{eventDate\}\}/g, 'October 15, 2026')
                    .replace(/\{\{venue\}\}/g, selectedEvent?.venue || 'Main Auditorium')
                    .replace(/\{\{ticketId\}\}/g, 'TKT-89241')}
                </div>

                <div style={{ background: 'var(--color-card)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', margin: '0.5rem 0' }}>
                  <QrCode size={36} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-2)' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>[QR Code Ticket Embedded]</div>
                </div>
              </div>

            </div>

            <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowEmailDispatchModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchQREmails}
                disabled={dispatchingEmails}
                className="btn btn-primary"
              >
                {dispatchingEmails ? 'Dispatching...' : `Send Tickets to ${participants.length} Attendees →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 4: FULL-SCREEN KIOSK PROJECTOR OVERLAY
         ════════════════════════════════════════════════════════════════════════ */}
      {showKioskModal && kioskActivity && (
        <div className="ops-projector-modal">
          <button
            type="button"
            onClick={() => setShowKioskModal(false)}
            className="btn btn-secondary"
            style={{ position: 'absolute', top: '2rem', right: '2rem' }}
          >
            ✕ Exit Projector Mode
          </button>

          <div className="ops-projector-card">
            <span style={{ fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {selectedEvent?.name}
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-text)', margin: 0 }}>
              {kioskActivity.name}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
              Scan the QR Code with your mobile phone camera to check in and earn <strong>+{kioskActivity.points || 10} IEEE Points</strong>!
            </p>

            {/* Projected QR Display */}
            <div className="ops-projector-qr">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                  `${window.location.origin}/checkin/${kioskActivity.qrId}`
                )}`}
                alt="Kiosk Check-In QR"
                style={{ width: '240px', height: '240px', display: 'block' }}
              />
            </div>

            <div className="ops-projector-link-badge">
              <span>🟢 Direct URL:</span>
              <code style={{ background: 'var(--color-bg)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)' }}>
                {window.location.origin}/checkin/{kioskActivity.qrId}
              </code>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
