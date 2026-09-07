import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';
import { api } from '../services/api';
import EventRegistrationModal from '../components/events/EventRegistrationModal';
import {
  formatEventDateRange,
  getEventRegistrationState,
  formatCapacity,
  isEventPast,
  getEventLifecycleStatus,
} from '../utils/eventDateUtils';
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
  Archive,
  Copy,
  Shield,
  ShieldCheck,
  CheckCheck,
  Upload,
  FileText,
  ExternalLink,
  Layers,
  Infinity as InfinityIcon,
  RefreshCw,
  EyeOff,
  Info,
  GripVertical,
  ArrowLeftRight,
  MoreVertical,
  UserCheck,
  ShieldAlert,
  Ticket,
  Paperclip,
  Maximize2,
  Minimize2,
  Share2,
  Code,
  RotateCcw,
  Minus,
  Bold,
  Italic,
  Image as ImageIcon,
  Trophy,
  BarChart2,
} from 'lucide-react';

function SelectOptionsChipsEditor({ options = [], onChange }) {
  const [inputValue, setInputValue] = useState('');

  const addOptions = (items) => {
    const listToAdd = (Array.isArray(items) ? items : [items])
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean);

    if (listToAdd.length === 0) return;

    const newOptions = [...options];
    for (const item of listToAdd) {
      if (!newOptions.some((opt) => opt.toLowerCase() === item.toLowerCase())) {
        newOptions.push(item);
      }
    }
    onChange(newOptions);
    setInputValue('');
  };

  const removeOption = (indexToRemove) => {
    onChange(options.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addOptions(inputValue.split(','));
    } else if (e.key === 'Backspace' && !inputValue && options.length > 0) {
      removeOption(options.length - 1);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData?.getData('text');
    if (pasted && pasted.includes(',')) {
      e.preventDefault();
      addOptions(pasted.split(','));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addOptions(inputValue.split(','));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        padding: '0.65rem 0.75rem',
        borderRadius: 'var(--radius-sm, 6px)',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        {options.map((opt, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              background: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '4px',
            }}
          >
            {opt}
            <button
              type="button"
              onClick={() => removeOption(i)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                opacity: 0.75,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
              title={`Remove "${opt}"`}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: '170px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder={options.length === 0 ? 'Type option and press Enter or comma...' : 'Add another option...'}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.8rem',
              color: 'var(--color-text)',
              padding: '0.2rem 0.25rem',
            }}
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => addOptions(inputValue.split(','))}
              className="btn btn-primary"
              style={{
                padding: '0.15rem 0.5rem',
                fontSize: '0.72rem',
                height: '24px',
                borderRadius: '4px',
              }}
            >
              + Add
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Press <kbd style={{ padding: '0.05rem 0.25rem', background: 'var(--color-surface)', borderRadius: '3px', border: '1px solid var(--color-border)', fontSize: '0.68rem' }}>Enter</kbd> or <kbd style={{ padding: '0.05rem 0.25rem', background: 'var(--color-surface)', borderRadius: '3px', border: '1px solid var(--color-border)', fontSize: '0.68rem' }}>,</kbd> to add options</span>
        <span>{options.length} option{options.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

function renderMarkdownToHtml(bodyText) {
  if (!bodyText) return '';
  const isHtml = /<[a-z][\s\S]*>/i.test(bodyText);
  if (isHtml) return bodyText;

  let formatted = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/### (.*?)\n/g, '<h3 style="font-size:15px;font-weight:700;color:#002855;margin:14px 0 6px;">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 style="font-size:17px;font-weight:700;color:#002855;margin:16px 0 6px;">$1</h2>')
    .replace(/# (.*?)\n/g, '<h1 style="font-size:19px;font-weight:800;color:#002855;margin:18px 0 8px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;font-weight:600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#e2e8f0;padding:2px 5px;border-radius:4px;font-family:monospace;font-size:12px;color:#0f172a;">$1</code>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" style="color:#00629b;text-decoration:underline;font-weight:500;" target="_blank">$1</a>')
    .replace(/---/g, '<hr style="border:0;border-top:1px solid #e2e8f0;margin:16px 0;"/>')
    .replace(/^\s*[-*]\s+(.*)$/gm, '<li style="margin:4px 0;color:#334155;">$1</li>')
    .replace(/(<li.*<\/li>\s*)+/gs, '<ul style="margin:8px 0;padding-left:20px;">$&</ul>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 12px;line-height:1.65;color:#334155;">')
    .replace(/\n/g, '<br/>');

  return `<p style="margin:0 0 12px;line-height:1.65;color:#334155;">${formatted}</p>`;
}

const DEFAULT_STANDARD_EMAIL_BODY = `We look forward to welcoming you to **{{eventName}}**. Please ensure you have this pass ready on your smartphone when arriving at the venue.
If you have any questions, reply directly to this email!`;

function getDefaultEmailTemplate(contentHtml = '', title = 'IEEE Menoufia Student Branch') {
  const notesHtml = contentHtml && contentHtml.trim() ? `
        <!-- Custom Notes / Content -->
        <p>
          ${contentHtml}
        </p>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title || 'IEEE Event Ticket & Access Pass'}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,40,85,0.08);border:1px solid #e2e8f0;margin:0 auto;">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg, #002855 0%, #004d80 50%, #00629b 100%);padding:30px 24px 22px;text-align:center;color:#ffffff;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.8px;color:#93c5fd;margin-bottom:8px;">
          IEEE MSB &bull; Official Event Ticket
        </div>
        <h1 style="margin:0;font-size:23px;font-weight:800;letter-spacing:-0.03em;color:#ffffff;line-height:1.25;">
          {{eventName}}
        </h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:26px 24px 20px;">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1e293b;">
          Dear <strong>{{name}}</strong>,
        </p>

        ${notesHtml}

        
        <!-- Event Logistics Table -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:20px;font-size:13px;border-collapse:collapse;">
          <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <td style="padding:11px 16px;font-weight:600;color:#475569;width:28%;">Event Title</td>
            <td style="padding:11px 16px;font-weight:700;color:#002855;">{{eventName}}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:11px 16px;font-weight:600;color:#475569;">Date &amp; Time</td>
            <td style="padding:11px 16px;color:#1e293b;font-weight:500;">{{eventDate}}</td>
          </tr>
          <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <td style="padding:11px 16px;font-weight:600;color:#475569;">Venue</td>
            <td style="padding:11px 16px;color:#1e293b;font-weight:500;">{{venue}}</td>
          </tr>
        </table>

        <!-- Perforated Ticket Pass Stub -->
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#fcfdfe;border:2px dashed #93c5fd;border-radius:12px;margin:20px 0;overflow:hidden;">
          <tr>
            <td style="padding:22px 18px;text-align:center;">
              <div style="display:inline-block;background:#ffffff;padding:14px;border-radius:10px;box-shadow:0 4px 16px rgba(0,40,85,0.08);border:1px solid #cbd5e1;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&amp;data={{ticketId}}&amp;color=002855" alt="Ticket QR Code" width="200" height="200" style="display:block;margin:0 auto;border:0;" />
              </div>
              <div style="margin-top:10px;font-size:11px;color:#64748b;line-height:1.4;">
                &#128161; <strong>Tip:</strong> Set your smartphone screen brightness to maximum at check-in for instant scanner reading.
              </div>
            </td>
          </tr>

          <!-- Quick Action Buttons Inside Pass -->
          <tr>
            <td style="background:#f8fafc;padding:12px 16px;border-top:1px dashed #bfdbfe;text-align:center;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:4px 6px;">
                    <a href="{{calendarUrl}}" target="_blank" style="display:inline-block;padding:8px 14px;background:#00629b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">
                      &#128197; Add to Google Calendar
                    </a>
                  </td>
                  <td style="padding:4px 6px;">
                    <a href="{{venueMapUrl}}" target="_blank" style="display:inline-block;padding:8px 14px;background:#ffffff;border:1px solid #cbd5e1;color:#1e293b;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">
                      &#128205; View Venue on Map
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Attachment Notice Box -->
        <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="width:28px;vertical-align:middle;font-size:20px;">&#128206;</td>
              <td style="vertical-align:middle;font-size:12px;color:#475569;line-height:1.45;">
                <strong style="color:#0f172a;">Attachment Included:</strong>
                <code style="font-family:monospace;color:#00629b;font-size:11px;font-weight:600;">ticket-{{ticketId}}.png</code>
                is attached to this email. You can save it to your phone photos or Apple Wallet / Google Keep for quick offline access!
              </td>
            </tr>
          </table>
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

export default function OperationsStudio() {
  const { user } = useAuthStore();
  const toast = useToastStore();
  const [searchParams] = useSearchParams();

  // ── Core Data State (Declared first for authorization & scanner checks) ───
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Authorization Checks ──────────────────────────────────────────────────
  const isGlobalAdminOrOfficer =
    ['admin', 'officer'].includes(user?.role) ||
    user?.availableScopes?.some((s) => ['admin', 'officer'].includes(s.role));

  const isOCLead =
    (user?.role === 'lead' && ['oc', 'operations', 'organizing'].includes(user?.committeeSlug?.toLowerCase())) ||
    user?.availableScopes?.some(
      (s) =>
        s.role === 'lead' &&
        (s.committeeSlug === 'oc' ||
          s.committeeSlug === 'operations' ||
          s.committeeName?.toLowerCase().includes('operations') ||
          s.committeeName?.toLowerCase().includes('organizing'))
    );

  const currentUserId = String(user?.id || user?._id || '');

  const isAssignedScanner = useMemo(() => {
    if (user?.isAssignedScanner || user?.role === 'scanner' || user?.role === 'event_scanner' || user?.availableScopes?.some((s) => s.role === 'scanner')) {
      return true;
    }
    return events.some(
      (e) =>
        Array.isArray(e.scannerUserIds) &&
        e.scannerUserIds.some((id) => String(typeof id === 'object' ? id.id || id._id : id) === currentUserId)
    );
  }, [user, events, currentUserId]);

  const hasAccess = isGlobalAdminOrOfficer || isOCLead || isAssignedScanner;
  const isScannerOnlyUser = isAssignedScanner && !isGlobalAdminOrOfficer && !isOCLead;

  // Helper to keep activities sorted by points descending
  const sortActivities = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
  };

  // Tab State: 'events' | 'scanner' | 'roster' (scanner-only users are locked to 'scanner')
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['events', 'scanner', 'roster'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'events';
  });

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (isScannerOnlyUser) {
      if (activeTab !== 'scanner') setActiveTab('scanner');
      return;
    }
    if (tabFromUrl && ['events', 'scanner', 'roster'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, isScannerOnlyUser]);

  // Selected Event Details & Items
  const [activities, setActivities] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [eventStats, setEventStats] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [copiedScannerLink, setCopiedScannerLink] = useState(false);
  const emailBodyRef = useRef(null);

  const handleSelectActivity = (actId) => {
    setSelectedActivityId(actId);
  };

  const handleShareScannerLink = () => {
    if (!selectedEventId) {
      toast.error('No Event Selected', 'Please select an event first.');
      return;
    }
    const currentUrl = new URL(window.location.origin + window.location.pathname);
    currentUrl.searchParams.set('tab', 'scanner');
    currentUrl.searchParams.set('eventId', selectedEventId);
    if (selectedActivityId) {
      currentUrl.searchParams.set('activityId', selectedActivityId);
    }
    navigator.clipboard.writeText(currentUrl.toString());
    setCopiedScannerLink(true);
    setTimeout(() => setCopiedScannerLink(false), 2000);
  };

  const insertEmailVariable = (varTag) => {
    const textarea = emailBodyRef.current;
    const isFull = emailTemplate.templateMode === 'full';
    const fieldKey = isFull ? 'fullHtmlBody' : 'standardBody';
    const currentText = emailTemplate[fieldKey] || '';

    if (!textarea) {
      setEmailTemplate((prev) => ({
        ...prev,
        [fieldKey]: currentText ? `${currentText} ${varTag}` : varTag,
      }));
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const nextText = currentText.substring(0, start) + varTag + currentText.substring(end);
    setEmailTemplate((prev) => ({ ...prev, [fieldKey]: nextText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varTag.length, start + varTag.length);
    }, 0);
  };

  // Drawers & Modals State
  const [drawerEvent, setDrawerEvent] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview'); // 'overview' | 'preview'
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dragEnabledIdx, setDragEnabledIdx] = useState(null);
  const [draggedCustomFieldIdx, setDraggedCustomFieldIdx] = useState(null);
  const [dragOverCustomFieldIdx, setDragOverCustomFieldIdx] = useState(null);
  const [hasAttemptedStage1, setHasAttemptedStage1] = useState(false);
  const [hasAttemptedStage2, setHasAttemptedStage2] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityEditForm, setActivityEditForm] = useState({
    name: '',
    type: 'workshop',
    points: 15,
    checkInMode: 'staff_scanner',
    description: '',
  });
  const [showEmailDispatchModal, setShowEmailDispatchModal] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [kioskActivity, setKioskActivity] = useState(null);
  const [showEventMenu, setShowEventMenu] = useState(false);
  const [activeActivityMenuId, setActiveActivityMenuId] = useState(null);
  const [isProjectorFullscreen, setIsProjectorFullscreen] = useState(false);
  const [showLeaderboardShareModal, setShowLeaderboardShareModal] = useState(false);
  const [leaderboardCopied, setLeaderboardCopied] = useState(false);
  const [isQrFullscreen, setIsQrFullscreen] = useState(false);
  const qrFullscreenRef = useRef(null);

  // Listen for native HTML5 fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsQrFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleQrFullscreen = () => {
    if (!document.fullscreenElement) {
      if (qrFullscreenRef.current?.requestFullscreen) {
        qrFullscreenRef.current.requestFullscreen().catch((err) => {
          console.error('Fullscreen request failed:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Global System Stats State (Decoupled from local presentation filters)
  const [globalStats, setGlobalStats] = useState(null);

  // Attendees Sheet Import Modal State (Append vs Replace)
  const [showImportSheetModal, setShowImportSheetModal] = useState(false);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [selectedSheetFile, setSelectedSheetFile] = useState(null);
  const [sheetPreviewRows, setSheetPreviewRows] = useState([]);
  const [sheetPreviewCols, setSheetPreviewCols] = useState([]);
  const [importingSheet, setImportingSheet] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Event Cover Upload & Click-to-Enlarge Lightbox State
  const [lightboxImage, setLightboxImage] = useState(null); // { url, title }
  const [uploadingCover, setUploadingCover] = useState(false);

  // Scanners Management State
  const [showScannersModal, setShowScannersModal] = useState(false);
  const [scannersList, setScannersList] = useState([]);
  const [scannerUserSearch, setScannerUserSearch] = useState('');
  const [scannerSearchResults, setScannerSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [savingScanners, setSavingScanners] = useState(false);

  // Whitelist Modal State
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [whitelistActivity, setWhitelistActivity] = useState(null);
  const [whitelistParticipantIds, setWhitelistParticipantIds] = useState([]);
  const [whitelistEmailsText, setWhitelistEmailsText] = useState('');
  const [whitelistSearch, setWhitelistSearch] = useState('');
  const [whitelistRestrictedToggle, setWhitelistRestrictedToggle] = useState(false);
  const [whitelistTab, setWhitelistTab] = useState('roster'); // 'roster' | 'sheet'

  // Multi-Stage Event Creator State
  const [creationStage, setCreationStage] = useState(1);
  const [initialActivities, setInitialActivities] = useState([]);
  const [newActivityDraft, setNewActivityDraft] = useState({
    name: '',
    type: 'workshop',
    points: 15,
    checkInMode: 'staff_scanner',
    description: '',
  });

  // Copied Key State
  const [copiedKey, setCopiedKey] = useState('');

  // Event Form State
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    location: 'Faculty of Electronic Engineering',
    venue: 'Main Auditorium',
    category: 'General',
    startDate: '',
    endDate: '',
    capacity: 100,
    isUnlimitedCapacity: false,
    isRegistrationOpen: true,
    allowedAudience: 'public',
    status: 'published',
    customFields: [],
    coverImageUrl: '',
    bannerUrl: '',
  });

  // Activity Form State
  const [activityForm, setActivityForm] = useState({
    name: '',
    type: 'workshop',
    points: 15,
    isLocked: false,
    checkInMode: 'staff_scanner',
    description: '',
    isRestricted: false,
  });

  // Email Template State
  const [emailTemplate, setEmailTemplate] = useState({
    subject: '🎟️ Your Ticket & Access Pass for {{eventName}}',
    standardBody: DEFAULT_STANDARD_EMAIL_BODY,
    fullHtmlBody: '',
    previewName: 'Yousef Ahmed',
    templateMode: 'standard', // 'standard' | 'full'
    editorMode: 'markdown',   // 'markdown' | 'html'
    scheduledFor: '',
  });
  const [dispatchingEmails, setDispatchingEmails] = useState(false);

  const handleToggleEmailTemplateMode = (mode) => {
    if (mode === emailTemplate.templateMode) return;
    if (mode === 'full') {
      setEmailTemplate((p) => ({
        ...p,
        templateMode: 'full',
        fullHtmlBody: p.fullHtmlBody && p.fullHtmlBody.trim().length > 0
          ? p.fullHtmlBody
          : getDefaultEmailTemplate(
              p.editorMode === 'html' ? p.standardBody : renderMarkdownToHtml(p.standardBody || ''),
              selectedEvent?.name || 'IEEE Event Pass'
            ),
      }));
    } else {
      setEmailTemplate((p) => ({
        ...p,
        templateMode: 'standard',
      }));
    }
  };

  const handleResetEmailToDefaultTemplate = () => {
    if (emailTemplate.templateMode === 'full') {
      setEmailTemplate((p) => ({
        ...p,
        fullHtmlBody: getDefaultEmailTemplate(
          p.editorMode === 'html' ? p.standardBody : renderMarkdownToHtml(p.standardBody || ''),
          selectedEvent?.name || 'IEEE Event Pass'
        ),
      }));
      toast.info('Template Reset', 'Reset to full default ticket email template');
    } else {
      setEmailTemplate((p) => ({
        ...p,
        standardBody: DEFAULT_STANDARD_EMAIL_BODY,
      }));
      toast.info('Message Reset', 'Reset to standard announcement message');
    }
  };

  const applyEmailFormatting = (format) => {
    const textarea = emailBodyRef.current;
    if (!textarea) return;
    const isFull = emailTemplate.templateMode === 'full';
    const fieldKey = isFull ? 'fullHtmlBody' : 'standardBody';
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = emailTemplate[fieldKey] || '';
    const selectedText = text.substring(start, end);

    let replacement = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        newCursorPos = start + (selectedText ? replacement.length : 2);
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        newCursorPos = start + (selectedText ? replacement.length : 1);
        break;
      case 'link':
        replacement = selectedText ? `[${selectedText}](https://)` : '[link text](https://)';
        newCursorPos = start + replacement.length - 1;
        break;
      case 'divider':
        replacement = '\n\n---\n\n';
        newCursorPos = start + replacement.length;
        break;
      default:
        return;
    }

    const nextText = text.substring(0, start) + replacement + text.substring(end);
    setEmailTemplate((p) => ({ ...p, [fieldKey]: nextText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

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
  const [eventStatusFilter, setEventStatusFilter] = useState('active'); // 'active' | 'past' | 'archived' | 'all'
  const [eventSearch, setEventSearch] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState('all');

  // Backdrop dismiss hooks
  const eventModalBackdrop = useBackdropDismiss(() => setShowEventModal(false), { isOpen: showEventModal });
  const activityModalBackdrop = useBackdropDismiss(() => setShowActivityModal(false), { isOpen: showActivityModal });
  const editActivityModalBackdrop = useBackdropDismiss(() => setShowEditActivityModal(false), { isOpen: showEditActivityModal });
  const emailModalBackdrop = useBackdropDismiss(() => setShowEmailDispatchModal(false), { isOpen: showEmailDispatchModal });
  const whitelistModalBackdrop = useBackdropDismiss(() => setShowWhitelistModal(false), { isOpen: showWhitelistModal });
  const scannersModalBackdrop = useBackdropDismiss(() => setShowScannersModal(false), { isOpen: showScannersModal });
  const eventMenuBackdrop = useBackdropDismiss(() => setShowEventMenu(false), { isOpen: showEventMenu });
  const importSheetModalBackdrop = useBackdropDismiss(() => setShowImportSheetModal(false), { isOpen: showImportSheetModal });
  const lightboxBackdrop = useBackdropDismiss(() => setLightboxImage(null), { isOpen: Boolean(lightboxImage) });

  // Event Switcher Popover State (Unified Event Context Bar)
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [pickerStatusFilter, setPickerStatusFilter] = useState('active'); // 'active' | 'past' | 'archived' | 'all'
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerEvents, setPickerEvents] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const eventPickerBackdrop = useBackdropDismiss(() => setShowEventPicker(false), { isOpen: showEventPicker });

  // Fetch events when event picker is opened or status filter changes
  useEffect(() => {
    if (!showEventPicker) return;
    let isMounted = true;
    setPickerLoading(true);
    api.getEvents({ status: pickerStatusFilter })
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data.events || []);
        setPickerEvents(list);
      })
      .catch((err) => {
        console.error('Failed to load events for picker:', err);
      })
      .finally(() => {
        if (isMounted) setPickerLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [showEventPicker, pickerStatusFilter]);

  const filteredPickerEvents = useMemo(() => {
    let list = pickerEvents.length > 0 ? pickerEvents : events;
    if (isScannerOnlyUser) {
      list = list.filter(
        (e) =>
          Array.isArray(e.scannerUserIds) &&
          e.scannerUserIds.some((id) => String(typeof id === 'object' ? id.id || id._id : id) === currentUserId)
      );
    }
    if (!pickerSearch.trim()) return list;
    const q = pickerSearch.toLowerCase().trim();
    return list.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
    );
  }, [pickerEvents, events, pickerSearch, isScannerOnlyUser, currentUserId]);

  const handleSelectPickerEvent = (ev) => {
    const evId = ev._id || ev.id;
    setSelectedEventId(evId);
    setEvents((prev) => (prev.some((e) => (e._id || e.id) === evId) ? prev : [ev, ...prev]));
    setShowEventPicker(false);
  };

  // Fetch Decoupled Global System Stats
  const fetchGlobalStats = useCallback(async () => {
    try {
      const res = await api.getGlobalEventStats();
      const statsData = res?.stats || res?.kpis || res;
      if (statsData && typeof statsData === 'object') {
        setGlobalStats(statsData);
      }
    } catch (err) {
      console.warn('Failed to load global event stats:', err);
    }
  }, []);

  // Load Events on Mount and when Status Filter Changes
  useEffect(() => {
    loadEvents();
    fetchGlobalStats();
  }, [eventStatusFilter, fetchGlobalStats]);

  // When selected event changes, load activities, participants, and stats
  useEffect(() => {
    if (selectedEventId) {
      loadEventDetails(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (eventStatusFilter === 'archived') {
        params.status = 'archived';
      } else if (eventStatusFilter === 'past') {
        params.status = 'past';
      } else if (eventStatusFilter === 'active') {
        params.status = 'active';
      } else if (eventStatusFilter === 'all') {
        params.status = 'all';
      }
      const data = await api.getEvents(params);
      const list = Array.isArray(data) ? data : (data.events || []);
      setEvents(list);

      const myAssigned = list.filter(
        (e) =>
          Array.isArray(e.scannerUserIds) &&
          e.scannerUserIds.some((id) => String(typeof id === 'object' ? id.id || id._id : id) === currentUserId)
      );
      if (myAssigned.length > 0 && !user?.isAssignedScanner) {
        useAuthStore.getState().updateUser({ isAssignedScanner: true });
      }

      const urlEventId = searchParams.get('eventId');
      if (urlEventId && list.some((e) => (e._id || e.id) === urlEventId)) {
        setSelectedEventId(urlEventId);
      } else if (!isGlobalAdminOrOfficer && !isOCLead && myAssigned.length > 0) {
        setSelectedEventId(myAssigned[0]._id || myAssigned[0].id);
      } else if (list.length > 0 && !selectedEventId) {
        setSelectedEventId(list[0]._id || list[0].id);
      }
      fetchGlobalStats();
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
      const sortedActs = sortActivities(actList);

      setActivities(sortedActs);
      setParticipants(partList);
      setEventStats(stats?.stats || null);

      if (sortedActs.length > 0) {
        const urlActId = searchParams.get('activityId') || searchParams.get('activity');
        const matchedAct = urlActId
          ? sortedActs.find((a) => (a.qrId || a._id) === urlActId || a._id === urlActId)
          : null;

        if (matchedAct) {
          if (matchedAct.isLocked) {
            const firstUnlocked = sortedActs.find((a) => !a.isLocked);
            if (firstUnlocked) {
              setSelectedActivityId(firstUnlocked.qrId || firstUnlocked._id);
              toast.warning('Activity Locked', `"${matchedAct.name}" is locked. Defaulted to "${firstUnlocked.name}".`);
            } else {
              setSelectedActivityId(matchedAct.qrId || matchedAct._id);
              toast.warning('Activity Locked', `"${matchedAct.name}" is locked.`);
            }
          } else {
            setSelectedActivityId(matchedAct.qrId || matchedAct._id);
          }
        } else {
          const currentValid = sortedActs.find(
            (a) => (a.qrId === selectedActivityId || a._id === selectedActivityId) && !a.isLocked
          );
          if (!currentValid) {
            const firstUnlocked = sortedActs.find((a) => !a.isLocked) || sortedActs[0];
            if (firstUnlocked) {
              setSelectedActivityId(firstUnlocked.qrId || firstUnlocked._id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
    }
  };

  const selectedEvent = useMemo(() => {
    return events.find((e) => (e._id || e.id) === selectedEventId) || null;
  }, [events, selectedEventId]);

  const isAuthorizedScanner = useMemo(() => {
    if (!selectedEvent) return true;
    const assigned = selectedEvent.scannerUserIds || [];
    if (!Array.isArray(assigned) || assigned.length === 0) return true;

    // Admin and Officer roles always have scanning authorization
    if (user?.role === 'admin' || user?.role === 'officer') return true;

    const currentUserId = user?.id || user?._id;
    if (selectedEvent.createdBy && selectedEvent.createdBy === currentUserId) return true;

    return assigned.some((id) => (typeof id === 'object' ? id.id || id._id : id) === currentUserId);
  }, [selectedEvent, user]);

  // Overall Studio KPIs (Always Global & System-Wide, never collapses to single event)
  const studioKPIs = useMemo(() => {
    if (globalStats) {
      return {
        totalEvents: globalStats.totalEvents ?? events.length,
        totalRegistrations: globalStats.totalRegistrations ?? 0,
        totalCheckedIn: globalStats.totalCheckedIn ?? 0,
        totalPoints: globalStats.totalPoints ?? 0,
      };
    }
    const totalEvents = events.length;
    let totalRegistrations = 0;
    let totalCheckedIn = 0;
    let totalPoints = 0;

    events.forEach((ev) => {
      totalRegistrations += (ev.registeredCount || 0);
      totalCheckedIn += (ev.checkedInCount || 0);
    });

    participants.forEach((p) => {
      totalPoints += (p.pointsAwarded || 0);
    });

    return {
      totalEvents,
      totalRegistrations,
      totalCheckedIn,
      totalPoints: totalPoints || 0,
    };
  }, [globalStats, events, participants]);

  // Active Scanning Activity & Whitelist Helper
  const currentScannerActivity = useMemo(() => {
    return activities.find((a) => (a.qrId || a._id) === selectedActivityId) || activities[0] || null;
  }, [activities, selectedActivityId]);

  const isAttendeeWhitelisted = useCallback((p) => {
    if (!currentScannerActivity?.isRestricted) return true;
    const pId = String(p._id || p.id || '');
    const pEmail = (p.email || '').trim().toLowerCase();
    const inAllowedIds = Array.isArray(currentScannerActivity.allowedParticipantIds) &&
      currentScannerActivity.allowedParticipantIds.some((id) => String(id) === pId);
    const inAllowedEmails = Array.isArray(currentScannerActivity.allowedEmails) &&
      currentScannerActivity.allowedEmails.some((e) => e.trim().toLowerCase() === pEmail);
    return Boolean(inAllowedIds || inAllowedEmails);
  }, [currentScannerActivity]);

  // ── Event Form & Custom Fields Handlers ─────────────────────────────────────
  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setCreationStage(1);
    setInitialActivities([
      {
        name: 'Main Check-In',
        type: 'check-in',
        points: 25,
        checkInMode: 'staff_scanner',
        description: 'Primary event check-in',
        isRestricted: false,
      },
    ]);
    setNewActivityDraft({
      name: '',
      type: 'workshop',
      points: 15,
      checkInMode: 'staff_scanner',
      description: '',
      isRestricted: false,
    });
    setEventForm({
      name: '',
      description: '',
      location: 'Faculty of Electronic Engineering',
      venue: 'Main Auditorium',
      category: 'General',
      startDate: '',
      endDate: '',
      capacity: 100,
      isUnlimitedCapacity: false,
      isRegistrationOpen: true,
      allowedAudience: 'public',
      status: 'published',
      customFields: [],
      coverImageUrl: '',
      bannerUrl: '',
    });
    setCreationStage(1);
    setHasAttemptedStage1(false);
    setHasAttemptedStage2(false);
    setTouchedFields({});
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (ev) => {
    setEditingEvent(ev);
    setCreationStage(1);
    setHasAttemptedStage1(false);
    setHasAttemptedStage2(false);
    setTouchedFields({});
    const isUnlimited = ev.capacity === -1 || ev.capacity === '-1' || ev.capacity === null;
    const startIso = ev.startDate
      ? new Date(ev.startDate).toISOString().split('T')[0]
      : (ev.date ? new Date(ev.date).toISOString().split('T')[0] : '');
    const endIso = ev.endDate ? new Date(ev.endDate).toISOString().split('T')[0] : '';

    setEventForm({
      name: ev.name || '',
      description: ev.description || '',
      location: ev.location || '',
      venue: ev.venue || '',
      category: ev.category || 'General',
      startDate: startIso,
      endDate: endIso,
      capacity: isUnlimited ? -1 : (ev.capacity || 100),
      isUnlimitedCapacity: isUnlimited,
      isRegistrationOpen: ev.isRegistrationOpen !== false,
      allowedAudience: ev.allowedAudience || 'public',
      status: ev.status || 'active',
      customFields: ev.customFields || [],
      coverImageUrl: ev.coverImageUrl || '',
      bannerUrl: ev.bannerUrl || '',
    });
    const evId = ev._id || ev.id;
    if (evId) {
      loadEventDetails(evId);
    }
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

  const handleReorderCustomField = (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
    setEventForm((prev) => {
      const list = [...prev.customFields];
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      const reordered = list.map((item, idx) => ({ ...item, order: idx }));
      return { ...prev, customFields: reordered };
    });
  };

  // Validation Helpers for Event Form Stages
  const getStage1Errors = () => {
    const errs = {};
    if (!eventForm.name.trim()) errs.name = 'Event name is required';
    if (!eventForm.description.trim()) errs.description = 'Description is required';
    if (!eventForm.location.trim()) errs.location = 'Location is required';
    if (eventForm.startDate && eventForm.endDate && new Date(eventForm.endDate) < new Date(eventForm.startDate)) {
      errs.endDate = 'End date cannot be earlier than start date';
    }
    return errs;
  };

  const isStage1Valid = Object.keys(getStage1Errors()).length === 0;

  const getStage2Errors = () => {
    const errs = [];
    eventForm.customFields.forEach((field, idx) => {
      if (!field.label?.trim()) {
        errs.push(`Question #${idx + 1} is missing a title`);
      } else if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        errs.push(`Question #${idx + 1} ("${field.label}") requires at least one dropdown option`);
      }
    });
    return errs;
  };

  const isStage2Valid = getStage2Errors().length === 0;

  // Draft activities for creation stage 3
  const handleAddDraftActivity = (e) => {
    if (e) e.preventDefault();
    if (!newActivityDraft.name.trim()) return;
    setInitialActivities((prev) => [
      ...prev,
      {
        ...newActivityDraft,
        name: newActivityDraft.name.trim(),
        points: Number(newActivityDraft.points) || 10,
      },
    ]);
    setNewActivityDraft({
      name: '',
      type: 'workshop',
      points: 15,
      checkInMode: 'staff_scanner',
      description: '',
      isRestricted: false,
    });
  };

  const handleRemoveDraftActivity = (index) => {
    setInitialActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLiveActivity = async (e) => {
    if (e) e.preventDefault();
    const evId = editingEvent?._id || editingEvent?.id;
    if (!evId || !newActivityDraft.name.trim()) return;
    try {
      await api.createEventActivity(evId, {
        name: newActivityDraft.name.trim(),
        type: newActivityDraft.type,
        points: Number(newActivityDraft.points) || 15,
        isLocked: false,
        checkInMode: 'staff_scanner',
      });
      setNewActivityDraft({
        name: '',
        type: 'workshop',
        points: 15,
        checkInMode: 'staff_scanner',
        description: '',
        isRestricted: false,
      });
      await loadEventDetails(evId);
    } catch (err) {
      console.error('Error adding activity:', err);
      toast.error('Add Failed', err.message || 'Could not add activity');
    }
  };

  const handleDeleteActivity = async (act, eventObj = drawerEvent || editingEvent) => {
    const evId = eventObj?._id || eventObj?.id || selectedEventId;
    const actId = act?._id || act?.id;
    if (!evId || !actId) return;
    if (!window.confirm(`Are you sure you want to delete activity "${act.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteEventActivity(evId, actId);
      await loadEventDetails(evId);
      toast.success('Activity Deleted', `Activity "${act.name}" removed.`);
    } catch (err) {
      console.error('Error deleting activity:', err);
      toast.error('Delete Failed', err.message || 'Could not delete activity');
    }
  };

  const handleDeleteLiveActivity = (act) => handleDeleteActivity(act, editingEvent);

  const handleSaveEvent = async (e) => {
    if (e) e.preventDefault();

    // 1. Enforce Stage 1 Validation
    const s1Errors = getStage1Errors();
    if (Object.keys(s1Errors).length > 0) {
      setCreationStage(1);
      setHasAttemptedStage1(true);
      setTouchedFields((prev) => ({ ...prev, name: true, description: true, location: true, endDate: true }));
      toast.error('Incomplete Core Details', Object.values(s1Errors)[0]);
      return;
    }

    // 2. Enforce Stage 2 Validation
    const s2Errors = getStage2Errors();
    if (s2Errors.length > 0) {
      setCreationStage(2);
      setHasAttemptedStage2(true);
      setTouchedFields((prev) => ({ ...prev, questions: true }));
      toast.error('Incomplete Questions', s2Errors[0]);
      return;
    }

    try {
      const payload = {
        name: eventForm.name.trim(),
        description: eventForm.description.trim(),
        location: eventForm.location.trim(),
        venue: eventForm.venue ? eventForm.venue.trim() : eventForm.location.trim(),
        category: eventForm.category,
        startDate: eventForm.startDate ? new Date(eventForm.startDate) : null,
        endDate: eventForm.endDate ? new Date(eventForm.endDate) : null,
        capacity: eventForm.isUnlimitedCapacity ? -1 : (Number(eventForm.capacity) || -1),
        isRegistrationOpen: Boolean(eventForm.isRegistrationOpen),
        allowedAudience: eventForm.allowedAudience,
        status: eventForm.status || 'published',
        customFields: eventForm.customFields,
        coverImageUrl: eventForm.coverImageUrl ? eventForm.coverImageUrl.trim() : null,
        bannerUrl: eventForm.bannerUrl ? eventForm.bannerUrl.trim() : null,
      };

      if (editingEvent) {
        const evId = editingEvent._id || editingEvent.id;
        await api.updateEvent(evId, payload);
        toast.success('Event Updated', 'Event changes saved successfully.');
      } else {
        payload.initialActivities = initialActivities;
        const res = await api.createEvent(payload);
        if (res?.event) {
          setSelectedEventId(res.event._id || res.event.id);
        }
      }
      setShowEventModal(false);
      loadEvents();
      fetchGlobalStats();
    } catch (err) {
      console.error('Error saving event:', err);
      toast.error('Save Error', err.message || 'Failed to save event');
    }
  };

  const handleToggleEventRegistration = async (ev, e) => {
    if (e) e.stopPropagation();
    const evId = ev._id || ev.id;
    const nextState = !ev.isRegistrationOpen;
    try {
      await api.updateEvent(evId, { isRegistrationOpen: nextState });
      setEvents((prev) =>
        prev.map((item) => ((item._id || item.id) === evId ? { ...item, isRegistrationOpen: nextState } : item))
      );
      if (drawerEvent && (drawerEvent._id || drawerEvent.id) === evId) {
        setDrawerEvent((prev) => ({ ...prev, isRegistrationOpen: nextState }));
      }
    } catch (err) {
      console.error('Error toggling registration:', err);
      toast.error('Update Failed', err.message || 'Could not update registration status');
    }
  };

  const handleToggleEventArchive = async (ev, e) => {
    if (e) e.stopPropagation();
    const evId = ev._id || ev.id;
    const isArchived = ev.status === 'archived';
    const nextStatus = isArchived ? 'published' : 'archived';
    try {
      await api.updateEvent(evId, { status: nextStatus });
      setEvents((prev) =>
        prev.map((item) => ((item._id || item.id) === evId ? { ...item, status: nextStatus } : item))
      );
      if (drawerEvent && (drawerEvent._id || drawerEvent.id) === evId) {
        setDrawerEvent((prev) => ({ ...prev, status: nextStatus }));
      }
      toast.success(
        isArchived ? 'Event Restored' : 'Event Archived',
        `Event "${ev.name}" is now ${isArchived ? 'restored' : 'archived'}.`
      );
      loadEvents();
    } catch (err) {
      console.error('Error toggling archive status:', err);
      toast.error('Update Failed', err.message || 'Could not update event status');
    }
  };

  const handleCopyKey = (keyText, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    toast.success('Key Copied', `Activity key ${keyText} copied to clipboard!`);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // ── Whitelist Handlers ─────────────────────────────────────────────────────
  const handleOpenWhitelistModal = (act, e) => {
    if (e) e.stopPropagation();
    setWhitelistActivity(act);
    const existingCount = (act.allowedParticipantIds?.length || 0) + (act.allowedEmails?.length || 0);
    // Auto-activate whitelist toggle by default on open
    setWhitelistRestrictedToggle(act.isRestricted ?? true);
    setWhitelistParticipantIds((act.allowedParticipantIds || []).map(String));
    setWhitelistEmailsText((act.allowedEmails || []).join('\n'));
    setWhitelistSearch('');
    setWhitelistTab('roster');
    setShowWhitelistModal(true);
  };

  const handleSaveWhitelist = async () => {
    if (!whitelistActivity) return;
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    const actId = whitelistActivity._id || whitelistActivity.id;

    const parsedEmails = whitelistEmailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    const hasEntries = whitelistParticipantIds.length > 0 || parsedEmails.length > 0;
    const isRestricted = hasEntries ? (whitelistRestrictedToggle ?? true) : Boolean(whitelistRestrictedToggle);

    try {
      const res = await api.updateActivityWhitelist(evId, actId, {
        isRestricted,
        participantIds: whitelistParticipantIds,
        emails: parsedEmails,
        append: false,
      });

      setActivities((prev) =>
        prev.map((a) => ((a._id || a.id) === actId ? res.activity : a))
      );
      setShowWhitelistModal(false);
      toast.success('Whitelist Saved', `Updated access list: ${res.totalWhitelistedCount} enrolled attendees (${isRestricted ? 'Active' : 'Inactive'}).`);
    } catch (err) {
      console.error('Error saving whitelist:', err);
      toast.error('Save Failed', err.message || 'Could not save activity whitelist');
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
        isRestricted: false,
      });
      loadEventDetails(evId);
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
    } catch (err) {
      console.error('Error toggling lock:', err);
      toast.error('Lock Error', err.message || 'Failed to toggle activity lock');
    }
  };

  const handleToggleActivityMode = async (act) => {
    const nextMode = act.checkInMode === 'self_service' ? 'staff_scanner' : 'self_service';
    handleSetActivityMode(act, nextMode);
  };

  const handleSetActivityMode = async (act, targetMode) => {
    if (act.checkInMode === targetMode) return;
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    try {
      const actId = act._id || act.id;
      const res = await api.setActivityMode(evId, actId, targetMode);
      setActivities((prev) =>
        prev.map((a) => ((a._id || a.id) === actId ? { ...a, checkInMode: res.activity?.checkInMode || targetMode } : a))
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

  const toggleProjectorFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
      setIsProjectorFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsProjectorFullscreen(false);
    }
  };

  // Close activity dropdown on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      if (activeActivityMenuId) {
        setActiveActivityMenuId(null);
      }
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [activeActivityMenuId]);

  // Projector fullscreen change and ESC key listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsProjectorFullscreen(Boolean(document.fullscreenElement));
    };
    const handleKeyDown = (e) => {
      if (showKioskModal && e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setShowKioskModal(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showKioskModal]);

  // ── Edit Activity Handlers ────────────────────────────────────────────
  const handleOpenEditActivityModal = (act) => {
    setEditingActivity(act);
    setActivityEditForm({
      name: act.name || '',
      type: act.type || 'workshop',
      points: act.points ?? 15,
      checkInMode: act.checkInMode || 'staff_scanner',
      description: act.description || '',
    });
    setShowEditActivityModal(true);
  };

  const handleSaveEditedActivity = async () => {
    if (!activityEditForm.name.trim()) {
      toast.error('Validation Error', 'Activity name is required');
      return;
    }
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    const actId = editingActivity?._id || editingActivity?.id;
    try {
      const res = await api.updateEventActivity(evId, actId, {
        name: activityEditForm.name.trim(),
        type: activityEditForm.type,
        points: Number(activityEditForm.points) || 0,
        checkInMode: activityEditForm.checkInMode,
        description: activityEditForm.description?.trim() || '',
      });
      const updated = res.activity || res;
      setActivities((prev) =>
        sortActivities(prev.map((a) => ((a._id || a.id) === actId ? { ...a, ...updated } : a)))
      );
      setShowEditActivityModal(false);
      setEditingActivity(null);
      toast.success('Activity Updated', `activity "${updated.name || activityEditForm.name}" updated successfully.`);
    } catch (err) {
      console.error('Failed to update activity:', err);
      toast.error('Update Failed', err.message || 'Failed to update activity');
    }
  };

  // ── Scanners Assignment Handlers & Search ─────────────────────────────────
  const handleOpenScannersModal = async () => {
    const rawList = drawerEvent?.scannerUserIds || [];
    const initialList = rawList.map((item) => {
      if (typeof item === 'object' && item.id) {
        const hasValidName = item.name && item.name !== item.id;
        return {
          id: item.id,
          name: hasValidName ? item.name : '',
          email: item.email || '',
          loading: !hasValidName,
          isUnresolved: false,
        };
      }
      return { id: item, name: '', email: '', loading: true, isUnresolved: false };
    });

    setScannersList(initialList);
    setScannerUserSearch('');
    setScannerSearchResults([]);
    setShowScannersModal(true);

    const needingResolution = initialList.filter((s) => s.loading);
    if (needingResolution.length === 0) return;

    try {
      const resolved = await Promise.all(
        needingResolution.map(async (scanner) => {
          try {
            const res = await api.getUserProfile(scanner.id);
            const p = res?.profile || res?.user || res;
            if (p && (p.name || p.email)) {
              return {
                id: scanner.id,
                name: p.name || p.fullName || '',
                email: p.email || '',
                avatarUrl: p.avatarUrl || null,
                role: p.defaultRole || '',
                loading: false,
                isUnresolved: false,
              };
            }
          } catch (e) {
            // Profile not found / deleted / legacy
          }
          return {
            id: scanner.id,
            name: '',
            email: '',
            loading: false,
            isUnresolved: true,
          };
        })
      );

      const map = new Map();
      resolved.forEach((r) => map.set(r.id, r));

      setScannersList((prev) =>
        prev.map((item) => {
          const match = map.get(item.id);
          return match ? { ...item, ...match } : item;
        })
      );
    } catch (err) {
      console.warn('Could not resolve scanner profiles:', err);
    }
  };

  const handleAddScannerUser = (u) => {
    const uId = u.id || u._id;
    if (scannersList.some((s) => s.id === uId)) {
      toast.info('Already Added', `${u.name || u.email} is already in the scanner list.`);
      return;
    }
    setScannersList((prev) => [
      ...prev,
      {
        id: uId,
        name: u.name || u.fullName || u.email,
        email: u.email,
        role: u.role || u.defaultRole,
        loading: false,
        isUnresolved: false,
      },
    ]);
    setScannerUserSearch('');
    setScannerSearchResults([]);
  };

  const handleRemoveScannerUser = (uId) => {
    setScannersList((prev) => prev.filter((s) => s.id !== uId));
  };

  const handleSaveAssignedScanners = async () => {
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    setSavingScanners(true);
    try {
      const ids = scannersList.map((s) => s.id);
      await api.assignEventScanners(evId, ids);
      setEvents((prev) =>
        prev.map((e) => ((e._id || e.id) === evId ? { ...e, scannerUserIds: ids } : e))
      );
      if (drawerEvent) {
        setDrawerEvent((prev) => ({ ...prev, scannerUserIds: ids }));
      }
      setShowScannersModal(false);
      toast.success('Scanners Assigned', `Updated authorized scanners (${ids.length} assigned).`);
    } catch (err) {
      console.error('Failed to assign scanners:', err);
      toast.error('Assignment Failed', err.message || 'Failed to save assigned scanners');
    } finally {
      setSavingScanners(false);
    }
  };

  useEffect(() => {
    if (!scannerUserSearch || scannerUserSearch.trim().length < 2) {
      setScannerSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await api.searchRegisteredUsers(scannerUserSearch.trim());
        const users = res?.users || (Array.isArray(res) ? res : []);
        setScannerSearchResults(users);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [scannerUserSearch]);

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
      toast.warning('Camera Notice', 'Webcam preview simulated. You can scan via input or mobile.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const executeCheckInScan = async (ticketPayload, allowOverride = false) => {
    if (!selectedEventId || !ticketPayload) return;
    setScanning(true);

    const targetActivity = activities.find((a) => a.qrId === selectedActivityId || a._id === selectedActivityId) || activities[0];
    const activityQrId = targetActivity?.qrId || selectedActivityId;

    try {
      const res = await api.scanAttendeeQR(selectedEventId, {
        ticketId: ticketPayload,
        activityQrId,
        allowOverride,
        scannerUserId: user?.id || user?._id,
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
      const isRestricted = err.isRestricted || err.status === 403 || err.message?.includes('whitelist');
      const errRecord = {
        type: isDuplicate ? 'duplicate' : isRestricted ? 'restricted' : 'error',
        message: err.message || 'Scan verification failed',
        isRestricted,
        ticketPayload,
        activityQrId,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastScanResult(errRecord);
      setScanFeed((prev) => [errRecord, ...prev.slice(0, 19)]);
      if (isDuplicate) {
        toast.warning('Already Scanned', 'Attendee has already been scanned for this activity.');
      } else if (isRestricted) {
        toast.warning('Whitelist Required', 'Attendee is not enrolled on this activity whitelist.');
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

  const handleResetCheckIn = async (participant) => {
    const pId = participant._id || participant.id;
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    if (!evId || !pId) return;
    if (!window.confirm(`Undo check-in for ${participant.name}? This will reset their attendance status and points for this event.`)) {
      return;
    }
    try {
      await api.resetParticipantCheckIn(evId, pId);
      toast.success('Check-In Reset', `Check-in reverted for ${participant.name}`);
      loadEventDetails(evId);
    } catch (err) {
      console.error('Failed to reset check-in:', err);
      toast.error('Reset Failed', err.message || 'Could not reset check-in status');
    }
  };

  // ── Email Template Dispatcher ──────────────────────────────────────────────
  const handleDispatchQREmails = async () => {
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    if (!evId) return;
    setDispatchingEmails(true);
    try {
      const targetEvent = events.find((e) => (e._id || e.id) === evId) || drawerEvent || selectedEvent;
      const isFull = emailTemplate.templateMode === 'full';
      const finalBody = isFull
        ? (emailTemplate.fullHtmlBody || '')
        : getDefaultEmailTemplate(
            emailTemplate.editorMode === 'html'
              ? emailTemplate.standardBody
              : renderMarkdownToHtml(emailTemplate.standardBody || ''),
            targetEvent?.name || 'IEEE Event Pass'
          );

      const isScheduled = Boolean(emailTemplate.scheduledFor);
      const scheduledIso = isScheduled ? new Date(emailTemplate.scheduledFor).toISOString() : null;

      // 1. Prepare attendee ticket payloads and personalized QR buffers via event-register
      let prepRes;
      try {
        prepRes = await api.prepareEventQRCampaign(evId, {
          sendToAllUnsent: true,
          scheduledFor: scheduledIso,
        });
      } catch (prepErr) {
        console.warn('Fallback to standalone event-register send:', prepErr);
      }

      if (prepRes && Array.isArray(prepRes.recipients) && prepRes.recipients.length > 0) {
        // 2. Dispatch or Schedule via Core Platform Campaign Engine
        const campaign = await api.createPRCampaign({
          title: `Event Tickets: ${targetEvent?.name || 'Event'}`,
          subject: emailTemplate.subject,
          body: finalBody,
          segmentType: 'custom_sheet',
          status: isScheduled ? 'scheduled' : 'draft',
          scheduledFor: scheduledIso,
          customRecipients: prepRes.recipients,
          metadata: {
            category: 'event_ticket_dispatch',
            source: 'operations_studio',
            eventId: evId,
            eventName: targetEvent?.name,
            participantIds: prepRes.recipients.map((r) => r.participantId),
          },
        });

        if (isScheduled) {
          toast.success(
            'Campaign Scheduled',
            `Tickets scheduled for ${new Date(emailTemplate.scheduledFor).toLocaleString()} via Core Campaign Engine.`
          );
        } else {
          await api.sendPRCampaign(campaign.id);
          toast.success('Campaign Dispatched', `QR tickets dispatched to ${prepRes.recipients.length} attendees via Core Campaign Engine!`);
        }
      } else {
        // Fallback to standalone direct send if no recipients from prepare or standalone mode
        const res = await api.sendEventQRCodes(evId, {
          emailSubject: emailTemplate.subject,
          emailBody: finalBody,
          subject: emailTemplate.subject,
          bodyTemplate: finalBody,
          scheduledFor: scheduledIso,
          templateMode: emailTemplate.templateMode,
        });
        toast.success('Emails Dispatched', res.message || 'QR ticket emails dispatched to registered attendees!');
      }

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

  const handleExportCSV = async () => {
    const evId = drawerEvent?._id || drawerEvent?.id || selectedEventId;
    if (!evId) return;
    try {
      const csvData = await api.exportAttendanceCsv(evId);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${evId}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export Ready', 'Attendance CSV downloaded successfully.');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      toast.error('Export Failed', err.message || 'Failed to export attendance CSV');
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select an image file (PNG, JPG, WebP).');
      return;
    }
    setUploadingCover(true);
    try {
      const res = await api.uploadDirectToCloudinary({
        file,
        folder: 'events',
        purpose: 'event_cover',
      });
      const uploadedUrl = res.secureUrl || res.url;
      setEventForm((prev) => ({
        ...prev,
        coverImageUrl: uploadedUrl,
        bannerUrl: prev.bannerUrl || uploadedUrl,
      }));
      toast.success('Cover Uploaded', 'Event cover image uploaded successfully.');
    } catch (err) {
      console.error('Failed to upload cover image:', err);
      toast.error('Upload Error', err.message || 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSheetFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedSheetFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (!text || typeof text !== 'string') return;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const parseLine = (line) => {
          const row = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              row.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          row.push(current.trim());
          return row;
        };

        const headers = parseLine(lines[0]);
        setSheetPreviewCols(headers);
        const previewRows = lines.slice(1, 6).map((l) => parseLine(l));
        setSheetPreviewRows(previewRows);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadAttendeesSheet = async () => {
    if (!selectedSheetFile) {
      toast.error('No file selected', 'Please choose a CSV file to upload.');
      return;
    }
    const targetEventId = selectedEventId || drawerEvent?._id || drawerEvent?.id;
    if (!targetEventId) {
      toast.error('No Event Selected', 'Please select an event before importing attendees.');
      return;
    }

    setImportingSheet(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedSheetFile);
      formData.append('mode', importMode);
      const res = await api.uploadParticipantsCsv(targetEventId, formData);
      setImportResult(res);
      const added = res?.successful || 0;
      const updated = res?.updated || 0;
      const totalProcessed = res?.processed !== undefined ? res.processed : (added + updated);
      toast.success(
        'Attendees Imported',
        `${totalProcessed} participants processed (${added} added, ${updated} updated).`
      );
      loadEventDetails(targetEventId);
      loadEvents();
      fetchGlobalStats();
    } catch (err) {
      console.error('Failed to upload attendee sheet:', err);
      toast.error('Import Failed', err.message || 'Failed to upload attendee sheet');
    } finally {
      setImportingSheet(false);
    }
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

  const renderUnifiedEventBar = (deskMode = 'scanner') => {
    const regState = getEventRegistrationState(selectedEvent);
    const checkedInCount = participants.filter((p) => p.checkedIn || p.status === 'checked_in').length;

    return (
      <div className="ops-unified-event-bar">
        <div className="ops-unified-event-bar__main">
          <div className="ops-unified-event-bar__badges">
            <span className="badge badge-primary">{selectedEvent?.category || 'Event'}</span>
            {selectedEvent && (
              <span className={`badge ${regState.badgeClass}`}>
                {regState.label}
              </span>
            )}
            {selectedEvent?.status === 'archived' && (
              <span className="badge badge-danger">Archived</span>
            )}
            <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              {deskMode === 'scanner' ? <Camera size={12} /> : <FileSpreadsheet size={12} />}
              {deskMode === 'scanner' ? 'Scanner' : 'Attendance'}
            </span>
          </div>

          <div className="ops-unified-event-bar__headline">
            <h2 className="ops-unified-event-bar__title">
              {selectedEvent?.name || 'No Event Selected'}
            </h2>
            <button
              type="button"
              className="btn btn-secondary ops-event-switch-btn"
              onClick={() => {
                setPickerStatusFilter('active');
                setPickerSearch('');
                setShowEventPicker(true);
              }}
              title="Switch active event desk"
            >
              <ArrowLeftRight size={14} />
              <span>Switch Event</span>
            </button>
          </div>

          <div className="ops-unified-event-bar__meta">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={13} /> {formatEventDateRange(selectedEvent?.startDate, selectedEvent?.endDate, selectedEvent?.date)}</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={13} /> {selectedEvent?.venue || selectedEvent?.location || 'Faculty of Electronic Engineering'}</span>
            {!isScannerOnlyUser && (
              <>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Users size={13} /> {participants.length} Registered ({checkedInCount} Checked In)</span>
              </>
            )}
          </div>

          {deskMode === 'scanner' && (
            <div className="ops-scanner-activities-bar">
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>
                Scanning Activity:
              </span>
              {activities.map((a) => {
                const isCur = selectedActivityId === (a.qrId || a._id);
                const isLocked = Boolean(a.isLocked);
                return (
                  <button
                    key={a._id || a.id}
                    type="button"
                    disabled={isLocked}
                    className={`ops-activity-chip ${isCur ? 'ops-activity-chip--active' : ''} ${isLocked ? 'ops-activity-chip--locked' : ''}`}
                    onClick={() => {
                      if (isLocked) {
                        toast.error('Activity Locked', `"${a.name}" is locked and cannot be selected for scanning.`);
                        return;
                      }
                      handleSelectActivity(a.qrId || a._id);
                    }}
                    title={isLocked ? `Locked: "${a.name}" cannot be scanned` : `Scan tickets for ${a.name}`}
                  >
                    <span>{a.name}</span>
                    <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={10} fill="currentColor" /> +{a.points || 10} pts
                    </span>
                    {isLocked && (
                      <span title="Locked" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Lock size={11} color="var(--color-danger, #ef4444)" />
                      </span>
                    )}
                    {a.isRestricted && (
                      <span className="badge badge-purple" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.4rem' }} title="Whitelist Restricted Activity">
                        <Shield size={10} /> Whitelist
                      </span>
                    )}
                  </button>
                );
              })}
              {activities.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No activities created for this event.
                </span>
              )}

              {/* Share Direct Scanner Link Button */}
              {activities.length > 0 && (
                <button
                  type="button"
                  onClick={handleShareScannerLink}
                  className={`btn ${copiedScannerLink ? 'btn-success' : 'btn-secondary'}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s ease',
                  }}
                  title="Copy direct scanner link with selected activity for team members"
                >
                  {copiedScannerLink ? <Check size={13} /> : <Share2 size={13} />}
                  <span>{copiedScannerLink ? 'Link Copied!' : 'Share Link'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Loading Guard while verifying permissions ──────────────────────────────
  if (loading && !isGlobalAdminOrOfficer && !isOCLead && !user?.isAssignedScanner && user?.role !== 'scanner' && user?.role !== 'event_scanner') {
    return (
      <div className="ops-studio" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={32} className="ops-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary)' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Verifying Operations permissions...</p>
        </div>
      </div>
    );
  }

  // ── Access Restricted Guard ───────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="ops-studio" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 'var(--space-8) var(--space-4)' }}>
        <div className="bento-card" style={{ maxWidth: 520, textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Operations Studio is reserved for <strong>Organizing Committee Leads</strong>, <strong>Branch Officers</strong>, <strong>Global Administrators</strong>, and <strong>Assigned Event Scanners</strong>.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-layout ops-studio">

      {/* ── Studio Header ───────────────────────────────────────────────────── */}
      <div className="studio__header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <QrCode size={26} /> {isScannerOnlyUser ? 'Operations (Scanner)' : 'Operations Studio'}
          </h1>
        </div>
      </div>

      {/* ── Top KPI Metrics Bar (4 Columns - Shown across tabs for Admins/Officers/OC Leads) ───── */}
      {!isScannerOnlyUser && (
        <div className="studio-kpi-grid">
          <div className="studio-kpi-card">
            <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--primary">
              <Calendar size={22} />
            </div>
            <div className="studio-kpi-content">
              <span className="studio-kpi-value">{studioKPIs.totalEvents}</span>
              <span className="studio-kpi-label">Active Events</span>
            </div>
          </div>

          <div className="studio-kpi-card">
            <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--purple">
              <Users size={22} />
            </div>
            <div className="studio-kpi-content">
              <span className="studio-kpi-value">{studioKPIs.totalRegistrations}</span>
              <span className="studio-kpi-label">Registered Attendees</span>
            </div>
          </div>

          <div className="studio-kpi-card">
            <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--emerald">
              <CheckCircle2 size={22} />
            </div>
            <div className="studio-kpi-content">
              <span className="studio-kpi-value">{studioKPIs.totalCheckedIn}</span>
              <span className="studio-kpi-label">Live Check-Ins</span>
            </div>
          </div>

          <div className="studio-kpi-card">
            <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--amber">
              <Award size={22} />
            </div>
            <div className="studio-kpi-content">
              <span className="studio-kpi-value">{studioKPIs.totalPoints}</span>
              <span className="studio-kpi-label">Points Awarded</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Tabs (Hidden for dedicated scanner-only users) ───────── */}
      {!isScannerOnlyUser && (
        <div className="studio-tabs">
          <button
            type="button"
            className={`studio-tab ${activeTab === 'events' ? 'studio-tab--active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={16} /> Event Management
            <span className="studio-tab__badge">{events.length}</span>
          </button>

          <button
            type="button"
            className={`studio-tab ${activeTab === 'scanner' ? 'studio-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('scanner');
              if (!cameraActive) startCamera();
            }}
          >
            <Scan size={16} /> QR Scanner
          </button>

          <button
            type="button"
            className={`studio-tab ${activeTab === 'roster' ? 'studio-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('roster');
              stopCamera();
            }}
          >
            <Users size={16} /> Attendance Report
            <span className="studio-tab__badge">{participants.length}</span>
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: EVENT BUILDER & ACTIVITIES MANAGEMENT
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Toolbar */}
          <div className="studio-toolbar">
            <div className="studio-toolbar__left">
              <div className="studio-search-wrap">
                <Search size={16} />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events by name or location..."
                  className="form-input studio-search-input"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="studio-filter-pills">
                <button
                  type="button"
                  onClick={() => setEventStatusFilter('active')}
                  className={`studio-pill ${eventStatusFilter === 'active' ? 'studio-pill--active' : ''}`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setEventStatusFilter('past')}
                  className={`studio-pill ${eventStatusFilter === 'past' ? 'studio-pill--active' : ''}`}
                >
                  Past
                </button>
                <button
                  type="button"
                  onClick={() => setEventStatusFilter('archived')}
                  className={`studio-pill ${eventStatusFilter === 'archived' ? 'studio-pill--active' : ''}`}
                >
                  Archived
                </button>
                <button
                  type="button"
                  onClick={() => setEventStatusFilter('all')}
                  className={`studio-pill ${eventStatusFilter === 'all' ? 'studio-pill--active' : ''}`}
                >
                  All Statuses
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="studio-filter-pills">
                <button
                  type="button"
                  onClick={() => setEventCategoryFilter('all')}
                  className={`studio-pill ${eventCategoryFilter === 'all' ? 'studio-pill--active' : ''}`}
                >
                  All Categories
                </button>
                <button
                  type="button"
                  onClick={() => setEventCategoryFilter('Conference')}
                  className={`studio-pill ${eventCategoryFilter === 'Conference' ? 'studio-pill--active' : ''}`}
                >
                  Conference
                </button>
                <button
                  type="button"
                  onClick={() => setEventCategoryFilter('Workshop')}
                  className={`studio-pill ${eventCategoryFilter === 'Workshop' ? 'studio-pill--active' : ''}`}
                >
                  Workshop
                </button>
                <button
                  type="button"
                  onClick={() => setEventCategoryFilter('Hackathon')}
                  className={`studio-pill ${eventCategoryFilter === 'Hackathon' ? 'studio-pill--active' : ''}`}
                >
                  Hackathon
                </button>
                <button
                  type="button"
                  onClick={() => setEventCategoryFilter('Summit')}
                  className={`studio-pill ${eventCategoryFilter === 'Summit' ? 'studio-pill--active' : ''}`}
                >
                  Summit
                </button>
              </div>
            </div>

            <div className="studio-toolbar__right">
              <button
                type="button"
                onClick={handleOpenCreateEvent}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> New Event
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
                const isUnlimited = ev.capacity === -1 || ev.capacity === '-1' || ev.capacity === null;
                const cap = isUnlimited ? '∞' : (ev.capacity || 100);
                const pct = isUnlimited ? 100 : Math.min(100, Math.round((regCount / Number(cap)) * 100));
                const regState = getEventRegistrationState(ev);
                const dateRangeStr = formatEventDateRange(ev.startDate, ev.endDate, ev.date);

                return (
                  <div
                    key={ev._id || ev.id}
                    className={`ops-event-card ${isSelected ? 'ops-event-card--active' : ''} ${ev.status === 'archived' ? 'ops-event-card--archived' : ''}`}
                    onClick={() => {
                      setSelectedEventId(ev._id || ev.id);
                      setDrawerEvent(ev);
                      setDrawerTab('overview');
                    }}
                  >
                    <div className="ops-event-card__header">
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge badge-primary">{ev.category || 'Event'}</span>
                        {ev.status === 'archived' ? (
                          <span className="badge badge-danger">Archived</span>
                        ) : (ev.status === 'past' || isEventPast(ev)) ? (
                          <span className="badge badge-secondary">Past</span>
                        ) : (
                          <span className={`badge ${regState.badgeClass}`}>
                            {regState.label}
                          </span>
                        )}
                      </div>
                      {ev.status === 'archived' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Archive size={12} /> Hidden from Public
                        </span>
                      )}
                    </div>

                    {/* Event Cover Image or Background Icon Placeholder (like /events) */}
                    {ev.coverImageUrl ? (
                      <div
                        style={{
                          width: '100%',
                          height: '120px',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          position: 'relative',
                          margin: '0.4rem 0 0.6rem',
                          backgroundColor: 'var(--color-bg-alt)',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({ url: ev.coverImageUrl, title: ev.name });
                        }}
                        title="Click to enlarge cover image"
                      >
                        <img
                          src={ev.coverImageUrl}
                          alt={ev.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            borderRadius: '3px',
                            padding: '2px 5px',
                            fontSize: '0.68rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Maximize2 size={10} /> Enlarge
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '120px',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          position: 'relative',
                          margin: '0.4rem 0 0.6rem',
                          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, var(--color-bg-alt) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-primary)',
                        }}
                      >
                        <Calendar size={36} style={{ opacity: 0.35 }} />
                      </div>
                    )}

                    <div>
                      <h3 className="ops-event-card__title">{ev.name}</h3>
                      <p className="ops-event-card__desc">{ev.description}</p>
                    </div>

                    <div className="ops-event-card__meta">
                      <div className="ops-event-card__meta-item">
                        <Calendar size={14} />
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{dateRangeStr}</span>
                      </div>
                      <div className="ops-event-card__meta-item">
                        <MapPin size={14} />
                        <span>{ev.venue || ev.location}</span>
                      </div>
                      <div className="ops-event-card__meta-item">
                        <Users size={14} />
                        <span>Audience: {ev.allowedAudience || 'Public'}</span>
                      </div>
                    </div>

                    {!isUnlimited ? (
                      <div className="ops-capacity-progress">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          <span>Capacity ({regCount} / {cap})</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="ops-capacity-bar">
                          <div
                            className="ops-capacity-bar__fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, padding: '0.2rem 0' }}>
                        <span>Registered Attendees: <span>{regCount}</span></span>
                        <span className="badge badge-accent" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <InfinityIcon size={12} /> Unlimited
                        </span>
                      </div>
                    )}

                    <div className="ops-event-card__footer">
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        Manage <ArrowRight size={13} />
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleEventRegistration(ev, e)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          title={ev.isRegistrationOpen !== false ? 'Registration is Open (Click to Close)' : 'Registration is Closed (Click to Open)'}
                        >
                          {ev.isRegistrationOpen !== false ? (
                            <Unlock size={14} style={{ color: '#10b981' }} />
                          ) : (
                            <Lock size={14} style={{ color: '#ef4444' }} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditEvent(ev);
                          }}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          title="Edit Event"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleEventArchive(ev, e)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          title={ev.status === 'archived' ? 'Restore Event' : 'Archive Event'}
                        >
                          <Archive size={14} style={{ color: ev.status === 'archived' ? '#3b82f6' : 'inherit' }} />
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
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="badge badge-primary">
                    {drawerEvent.category || 'Event Detail'}
                  </span>
                  {drawerEvent.status === 'archived' && (
                    <span className="badge badge-danger">Archived</span>
                  )}
                  <span className={`badge ${getEventRegistrationState(drawerEvent).badgeClass}`}>
                    {getEventRegistrationState(drawerEvent).label}
                  </span>
                </div>
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

            {/* Drawer Tabs: Overview vs Live Registration Form Preview */}
            <div className="ops-drawer-tabs">
              <button
                type="button"
                className={`ops-drawer-tab ${drawerTab === 'overview' ? 'ops-drawer-tab--active' : ''}`}
                onClick={() => setDrawerTab('overview')}
              >
                <Layers size={14} /> Overview & Activities
              </button>
              <button
                type="button"
                className={`ops-drawer-tab ${drawerTab === 'preview' ? 'ops-drawer-tab--active' : ''}`}
                onClick={() => setDrawerTab('preview')}
              >
                <Eye size={14} /> Registration Form Preview
                {drawerEvent.customFields?.length > 0 && (
                  <span className="badge badge-accent" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                    {drawerEvent.customFields.length} Qs
                  </span>
                )}
              </button>
            </div>

            <div className="ops-drawer-body">
              {drawerTab === 'overview' ? (
                <>
                  {/* Executive Event Summary Card */}
                  <div className="ops-event-summary-card">
                    {/* Executive Event Summary Cover */}
                    {drawerEvent.coverImageUrl ? (
                      <div
                        style={{
                          width: '100%',
                          height: '180px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          marginBottom: '1rem',
                          position: 'relative',
                          cursor: 'pointer',
                          backgroundColor: 'var(--color-bg-alt)',
                        }}
                        onClick={() => setLightboxImage({ url: drawerEvent.coverImageUrl, title: drawerEvent.name })}
                        title="Click to enlarge cover image"
                      >
                        <img
                          src={drawerEvent.coverImageUrl}
                          alt={drawerEvent.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Maximize2 size={12} /> Click to enlarge
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '140px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          marginBottom: '1rem',
                          position: 'relative',
                          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, var(--color-bg-alt) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-primary)',
                        }}
                      >
                        <Calendar size={44} style={{ opacity: 0.35 }} />
                      </div>
                    )}
                    {drawerEvent.description && (
                      <p className="ops-event-summary-desc">
                        {drawerEvent.description}
                      </p>
                    )}

                    <div className="ops-event-meta-grid">
                      <div className="ops-event-meta-chip">
                        <span className="ops-event-meta-chip__icon"><Calendar size={18} /></span>
                        <div className="ops-event-meta-chip__content">
                          <span className="ops-event-meta-chip__label">Dates & Schedule</span>
                          <span className="ops-event-meta-chip__value" title={formatEventDateRange(drawerEvent.startDate, drawerEvent.endDate, drawerEvent.date)}>
                            {formatEventDateRange(drawerEvent.startDate, drawerEvent.endDate, drawerEvent.date)}
                          </span>
                        </div>
                      </div>

                      <div className="ops-event-meta-chip">
                        <span className="ops-event-meta-chip__icon"><MapPin size={18} /></span>
                        <div className="ops-event-meta-chip__content">
                          <span className="ops-event-meta-chip__label">Location & Venue</span>
                          <span className="ops-event-meta-chip__value" title={drawerEvent.venue || drawerEvent.location || 'Faculty of Electronic Engineering'}>
                            {drawerEvent.venue || drawerEvent.location || 'Faculty of Electronic Engineering'}
                          </span>
                        </div>
                      </div>

                      <div className="ops-event-meta-chip">
                        <span className="ops-event-meta-chip__icon"><Users size={18} /></span>
                        <div className="ops-event-meta-chip__content">
                          <span className="ops-event-meta-chip__label">Target Audience</span>
                          <span className="ops-event-meta-chip__value" style={{ textTransform: 'capitalize' }}>
                            {drawerEvent.allowedAudience ? drawerEvent.allowedAudience.replace(/_/g, ' ') : 'Public (Everyone)'}
                          </span>
                        </div>
                      </div>

                      <div className="ops-event-meta-chip">
                        <span className="ops-event-meta-chip__icon"><Ticket size={18} /></span>
                        <div className="ops-event-meta-chip__content">
                          <span className="ops-event-meta-chip__label">Capacity & Enrolled</span>
                          <span className="ops-event-meta-chip__value">
                            {drawerEvent.registeredCount || participants.length} / {formatCapacity(drawerEvent.capacity)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Event Performance & Leadership KPIs */}
                    {(() => {
                      const totalRegisteredKpi = eventStats?.totalRegistered ?? (drawerEvent.registeredCount || participants.length);
                      const totalCheckedInKpi = eventStats?.totalCheckedIn ?? participants.filter((p) => p.checkedIn || p.status === 'checked_in' || (p.scannedActivities && p.scannedActivities.length > 0)).length;
                      const totalPointsKpi = eventStats?.totalPointsDistributed ?? participants.reduce((sum, p) => sum + (p.pointsAwarded || 0), 0);
                      const rankedScorersKpi = participants.filter((p) => (p.pointsAwarded || 0) > 0).length;
                      const checkInRateKpi = totalRegisteredKpi > 0 ? Math.round((totalCheckedInKpi / totalRegisteredKpi) * 100) : 0;

                      return (
                        <div
                          style={{
                            margin: '1rem 0 1.25rem',
                            padding: '0.4rem',
                            background: 'var(--color-bg-alt, rgba(0,0,0,0.03))',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg, 12px)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <BarChart2 size={13} color="var(--color-primary)" /> Event KPIs
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                              gap: '0.65rem',
                            }}
                          >
                            <div style={{ background: 'var(--color-surface)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--color-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'block' }}>Total Enrolled</span>
                              <strong style={{ fontSize: '1.15rem', color: 'var(--color-text)' }}>{totalRegisteredKpi}</strong>
                            </div>
                            <div style={{ background: 'var(--color-surface)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--color-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'block' }}>Checked In</span>
                              <strong style={{ fontSize: '1.15rem', color: '#10b981' }}>{totalCheckedInKpi} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>({checkInRateKpi}%)</span></strong>
                            </div>
                            <div style={{ background: 'var(--color-surface)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--color-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'block' }}>Points Awarded</span>
                              <strong style={{ fontSize: '1.15rem', color: '#f59e0b' }}>{totalPointsKpi} pts</strong>
                            </div>
                            <div style={{ background: 'var(--color-surface)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--color-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'block' }}>Ranked Scorers</span>
                              <strong style={{ fontSize: '1.15rem', color: '#38bdf8' }}>{rankedScorersKpi}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="ops-event-action-bar">
                      <button
                        type="button"
                        onClick={() => setShowActivityModal(true)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
                      >
                        <Plus size={14} /> Add Activity
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditEvent(drawerEvent)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
                      >
                        <Edit2 size={14} /> Edit Event
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenScannersModal}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
                        title="Assign authorized ticket scanners for this event"
                      >
                        <UserCheck size={14} /> Scanners ({drawerEvent.scannerUserIds?.length || 0})
                      </button>

                      <div className="ops-dropdown-wrapper">
                        <button
                          type="button"
                          onClick={() => setShowEventMenu((prev) => !prev)}
                          className="btn btn-secondary btn-icon"
                          style={{ padding: '0.45rem 0.6rem' }}
                          title="More event actions"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {showEventMenu && (
                          <div className="ops-dropdown-menu" {...eventMenuBackdrop.getBackdropProps()}>
                            <button
                              type="button"
                              className="ops-dropdown-item"
                              onClick={() => {
                                setShowEventMenu(false);
                                setSelectedEventId(drawerEvent._id || drawerEvent.id);
                                setSelectedSheetFile(null);
                                setSheetPreviewRows([]);
                                setSheetPreviewCols([]);
                                setImportResult(null);
                                setShowImportSheetModal(true);
                              }}
                            >
                              <Upload size={14} /> Import Attendees
                            </button>
                            <button
                              type="button"
                              className="ops-dropdown-item"
                              onClick={() => {
                                setShowEventMenu(false);
                                setShowEmailDispatchModal(true);
                              }}
                            >
                              <Mail size={14} /> Dispatch QR Tickets
                            </button>
                            <button
                              type="button"
                              className="ops-dropdown-item"
                              onClick={() => {
                                setShowEventMenu(false);
                                setShowLeaderboardShareModal(true);
                              }}
                            >
                              <Trophy size={14} /> Share Leaderboard
                            </button>
                            <button
                              type="button"
                              className="ops-dropdown-item"
                              onClick={() => {
                                setShowEventMenu(false);
                                handleExportCSV();
                              }}
                            >
                              <FileSpreadsheet size={14} /> Export CSV Report
                            </button>
                            <div className="ops-dropdown-divider" />
                            <button
                              type="button"
                              className="ops-dropdown-item"
                              onClick={(e) => {
                                setShowEventMenu(false);
                                handleToggleEventRegistration(drawerEvent, e);
                              }}
                            >
                              {drawerEvent.isRegistrationOpen !== false ? <EyeOff size={14} /> : <CheckCircle2 size={14} />}
                              {drawerEvent.isRegistrationOpen !== false ? 'Close Registration' : 'Open Registration'}
                            </button>
                            <button
                              type="button"
                              className="ops-dropdown-item"
                              style={{ color: drawerEvent.status === 'archived' ? 'var(--color-primary)' : 'var(--color-danger, #ef4444)' }}
                              onClick={(e) => {
                                setShowEventMenu(false);
                                handleToggleEventArchive(drawerEvent, e);
                              }}
                            >
                              {drawerEvent.status === 'archived' ? <RefreshCw size={14} /> : <Archive size={14} />}
                              {drawerEvent.status === 'archived' ? 'Restore Event' : 'Archive Event'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Activities Bento List */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                        Activities ({activities.length})
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        Configure points, whitelist restrictions, and projection
                      </span>
                    </div>

                    <div className="ops-activity-list">
                      {activities.map((act, idx) => {
                        const isRestricted = Boolean(act.isRestricted);
                        const enrolledCount = (act.allowedParticipantIds?.length || 0) + (act.allowedEmails?.length || 0);
                        const aId = act._id || act.id;
                        const isMenuOpen = activeActivityMenuId === aId;
                        const isNearBottom = idx >= activities.length - 2 && activities.length > 2;

                        return (
                          <div
                            key={aId}
                            className={`ops-activity-card ${act.isLocked ? 'ops-activity-card--locked' : ''} ${isMenuOpen ? 'ops-activity-card--menu-open' : ''}`}
                            style={{ zIndex: isMenuOpen ? 100 : undefined }}
                          >
                            <div className="ops-activity-card__info">
                              <div className="ops-activity-card__title">
                                <span style={{ fontWeight: 700 }}>{act.name}</span>
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                  {act.type}
                                </span>
                                <span className="badge badge-accent" style={{ fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Star size={11} fill="currentColor" /> +{act.points || 10} pts
                                </span>
                                {act.isLocked && (
                                  <span className="badge badge-danger" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Lock size={10} /> Locked
                                  </span>
                                )}
                                {isRestricted && (
                                  <span className="badge badge-purple" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Shield size={10} /> Whitelist ({enrolledCount})
                                  </span>
                                )}
                              </div>
                              {act.description && (
                                <div className="ops-activity-card__meta">
                                  <span>{act.description}</span>
                                </div>
                              )}
                            </div>

                            <div className="ops-activity-card__actions" style={{ position: 'relative' }}>
                              {/* Segmented Mode Switcher */}
                              <div className="ops-segmented-mode">
                                <button
                                  type="button"
                                  className={`ops-segmented-btn ${act.checkInMode !== 'self_service' ? 'ops-segmented-btn--active' : ''}`}
                                  onClick={() => handleSetActivityMode(act, 'staff_scanner')}
                                  title="Staff Scanner: Organizers scan attendee tickets"
                                >
                                  <Camera size={12} /> Staff Scan
                                </button>
                                <button
                                  type="button"
                                  className={`ops-segmented-btn ${act.checkInMode === 'self_service' ? 'ops-segmented-btn--active' : ''}`}
                                  onClick={() => handleSetActivityMode(act, 'self_service')}
                                  title="Self-Service Kiosk: Attendees scan projected QR"
                                >
                                  <Smartphone size={12} /> Self Scan
                                </button>
                              </div>

                              {/* Conditional Project Button (only for self_service mode!) */}
                              {act.checkInMode === 'self_service' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenKioskProjector(act)}
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                  title="Project QR code in full-screen on room screen"
                                >
                                  <Tv size={12} /> Project
                                </button>
                              )}

                              {/* Three-Dots Actions Droplist */}
                              <div className="ops-dropdown-wrapper" style={{ zIndex: isMenuOpen ? 1010 : undefined }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActivityMenuId((prev) => (prev === aId ? null : aId));
                                  }}
                                  className="btn btn-secondary btn-icon"
                                  style={{ padding: '0.35rem 0.55rem' }}
                                  title="More activity actions"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {isMenuOpen && (
                                  <div
                                    className="ops-dropdown-menu"
                                    style={{
                                      right: 0,
                                      [isNearBottom ? 'bottom' : 'top']: 'calc(100% + 4px)',
                                      minWidth: '150px',
                                      zIndex: 1050,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      className="ops-dropdown-item"
                                      onClick={() => {
                                        setActiveActivityMenuId(null);
                                        handleToggleActivityLock(act);
                                      }}
                                      title={act.isLocked ? 'Unlock activity' : 'Lock activity'}
                                    >
                                      {act.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                      {act.isLocked ? 'Unlock' : 'Lock'}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={act.isLocked}
                                      className={`ops-dropdown-item ${act.isLocked ? 'ops-dropdown-item--disabled' : ''}`}
                                      onClick={() => {
                                        if (act.isLocked) return;
                                        setActiveActivityMenuId(null);
                                        handleOpenEditActivityModal(act);
                                      }}
                                      title={act.isLocked ? 'Unlock activity to edit' : 'Edit activity'}
                                    >
                                      <Edit2 size={14} /> Edit
                                      {act.isLocked && <Lock size={11} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={act.isLocked}
                                      className={`ops-dropdown-item ${act.isLocked ? 'ops-dropdown-item--disabled' : ''}`}
                                      onClick={(e) => {
                                        if (act.isLocked) return;
                                        setActiveActivityMenuId(null);
                                        handleOpenWhitelistModal(act, e);
                                      }}
                                      title={act.isLocked ? 'Unlock activity to edit whitelist' : 'Activity whitelist'}
                                    >
                                      <Shield size={14} /> Whitelist
                                      {act.isLocked && <Lock size={11} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                                    </button>

                                    <div className="ops-dropdown-divider" />

                                    <button
                                      type="button"
                                      disabled={act.isLocked}
                                      className={`ops-dropdown-item ${act.isLocked ? 'ops-dropdown-item--disabled' : ''}`}
                                      style={{ color: act.isLocked ? undefined : 'var(--color-danger, #ef4444)' }}
                                      onClick={() => {
                                        if (act.isLocked) return;
                                        setActiveActivityMenuId(null);
                                        handleDeleteActivity(act, drawerEvent);
                                      }}
                                      title={act.isLocked ? 'Unlock activity to delete' : 'Delete activity'}
                                    >
                                      <Trash2 size={14} /> Delete
                                      {act.isLocked && <Lock size={11} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {activities.length === 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '2.5rem 1.5rem',
                            background: 'var(--color-bg)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px dashed var(--color-border)',
                          }}
                        >
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              background: 'rgba(59, 130, 246, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '0.75rem',
                              color: 'var(--color-primary)',
                            }}
                          >
                            <Layers size={22} style={{ opacity: 0.8 }} />
                          </div>
                          <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                            No activities created yet
                          </p>
                          <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '360px', lineHeight: 1.45 }}>
                            Create workshops, check-in desks, or sessions to award points to attendees.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowActivityModal(true)}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Plus size={14} /> Create First Activity
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Registration Form Live Preview - 100% Exact Parity using authentic EventRegistrationModal */
                <div style={{ padding: '0.5rem 0' }}>
                  <EventRegistrationModal
                    event={drawerEvent}
                    isOpen={true}
                    isPreview={true}
                    embedded={true}
                    onClose={() => {}}
                  />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Unified Event Context Bar & Switcher */}
          {renderUnifiedEventBar('scanner')}

          {!isAuthorizedScanner ? (
            <div className="ops-scanner-guard-card">
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger, #ef4444)' }}>
                <ShieldAlert size={32} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Scanner Access Restricted</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                This event has designated scanner staff assigned. Your account is not authorized to scan attendees for <strong>{selectedEvent?.name || 'this event'}</strong>.
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Please contact the event organizer, an IEEE Officer, or Portal Administrator if you need scanner permissions.
              </p>
            </div>
          ) : (
            <div className="ops-scanner-layout">

            {/* Left Column: Camera Viewport */}
            <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    Live Camera Scanner
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Point camera at attendee QR ticket pass to record attendance and award points
                  </span>
                </div>
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
                  placeholder="Paste attendee ticket ID..."
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
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {lastScanResult.type === 'success' ? (
                        <><CheckCircle2 size={16} /> Check-In Confirmed!</>
                      ) : lastScanResult.type === 'duplicate' ? (
                        <><AlertTriangle size={16} /> Already Scanned</>
                      ) : lastScanResult.isRestricted ? (
                        <><Shield size={16} /> Not On Activity Whitelist</>
                      ) : (
                        <><X size={16} /> Scan Rejected</>
                      )}
                    </span>
                    <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                      {lastScanResult.timestamp}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
                    {lastScanResult.message}
                  </div>
                  {lastScanResult.participant && (
                    <div style={{ fontSize: '0.8125rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{lastScanResult.participant.university}</span>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>Total: {lastScanResult.participant.pointsAwarded || 0} pts</span>
                    </div>
                  )}

                  {/* Organizer Whitelist Override Action */}
                  {lastScanResult.isRestricted && (isGlobalAdminOrOfficer || isOCLead) && (
                    <button
                      type="button"
                      onClick={() => executeCheckInScan(lastScanResult.ticketPayload, true)}
                      className="btn btn-primary"
                      style={{ marginTop: '0.65rem', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
                    >
                      <ShieldCheck size={16} /> Organizer Override & Admit Attendee
                    </button>
                  )}
                </div>
              )}

              {/* Manual Reception Desk Lookup */}
              <div className="bento-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                    Reception Lookup Desk
                  </h4>
                  {currentScannerActivity?.isRestricted && (
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Shield size={10} /> Restricted Mode
                    </span>
                  )}
                </div>
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
                    .filter((p) => {
                      const matchesSearch =
                        !manualSearchQuery ||
                        p.name?.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
                        p.email?.toLowerCase().includes(manualSearchQuery.toLowerCase());
                      if (!matchesSearch) return false;

                      // If current activity has active whitelist and user is not an organizer (scanner-only), hide non-whitelisted attendees
                      const hasOrganizerAccess = isGlobalAdminOrOfficer || isOCLead;
                      if (currentScannerActivity?.isRestricted && !hasOrganizerAccess) {
                        return isAttendeeWhitelisted(p);
                      }
                      return true;
                    })
                    .slice(0, 8)
                    .map((p) => {
                      const isCheckedIn = (p.scannedActivities || []).length > 0 || p.status === 'checked_in';
                      const whitelisted = isAttendeeWhitelisted(p);
                      const isRestrictedAct = Boolean(currentScannerActivity?.isRestricted);
                      const canOverride = isGlobalAdminOrOfficer || isOCLead;

                      return (
                        <div
                          key={p._id || p.id}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{p.name}</span>
                              {isRestrictedAct && !whitelisted && (
                                <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                  Not Whitelisted
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.email}</div>
                          </div>
                          {isCheckedIn ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className="badge badge-accent" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Check size={11} /> Scanned
                              </span>
                              {isGlobalAdminOrOfficer && (
                                <button
                                  type="button"
                                  onClick={() => handleResetCheckIn(p)}
                                  className="btn btn-ghost btn-xs text-danger"
                                  style={{ padding: '0.15rem 0.35rem', fontSize: '0.68rem' }}
                                  title="Undo check-in (Admin/Officer only)"
                                >
                                  Undo
                                </button>
                              )}
                            </div>
                          ) : isRestrictedAct && !whitelisted ? (
                            canOverride ? (
                              <button
                                type="button"
                                onClick={() => executeCheckInScan(p._id || p.id, true)}
                                className="btn btn-warning"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                title="Override whitelist and admit attendee"
                              >
                                <ShieldCheck size={13} /> Override
                              </button>
                            ) : null
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickManualCheckIn(p)}
                              className="btn btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            >
                              Scan
                            </button>
                          )}
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
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3: ATTENDANCE REPORT
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Unified Event Context Bar & Switcher */}
          {renderUnifiedEventBar('roster')}

          {/* Controls Bar */}
          <div className="ops-toolbar">
            <div className="ops-toolbar__group">
              <div className="ops-search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Search by name or email..."
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
                onClick={() => setShowLeaderboardShareModal(true)}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title="View & share public event points & leadership URL"
              >
                <Trophy size={15} /> Public Leaderboard
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
                onClick={() => {
                  setSelectedSheetFile(null);
                  setSheetPreviewRows([]);
                  setSheetPreviewCols([]);
                  setImportResult(null);
                  setShowImportSheetModal(true);
                }}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title="Import attendee roster from CSV/Excel sheet"
              >
                <Upload size={15} /> Import Sheet
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
          <div className="ops-table-scroll-container">
            <table className="ops-attendance-table">
              <thead>
                <tr>
                  <th className="ops-table-sticky-col-left">Attendee Name</th>
                  <th>Email</th>
                  <th>Faculty & Org</th>
                  <th>Status</th>
                  <th>Activities Scanned</th>
                  <th>Points</th>
                  {selectedEvent?.customFields?.map((f) => (
                    <th key={f.id}>{f.label}</th>
                  ))}
                  <th className="ops-table-sticky-col-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((p) => {
                  const scans = p.scannedActivities || [];
                  const isCheckedIn = scans.length > 0 || p.status === 'checked_in';
                  return (
                    <tr key={p._id || p.id}>
                      <td className="ops-table-sticky-col-left" style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {p.name}
                      </td>
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
                      <td className="ops-table-sticky-col-right">
                        {isCheckedIn ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}>
                              <Check size={11} /> Checked In
                            </span>
                            {isGlobalAdminOrOfficer && (
                              <button
                                type="button"
                                onClick={() => handleResetCheckIn(p)}
                                className="btn btn-ghost btn-xs text-danger"
                                style={{ padding: '0.15rem 0.35rem', fontSize: '0.68rem' }}
                                title="Undo check-in (Admin/Officer only)"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickManualCheckIn(p)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                          >
                            Check In
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredParticipants.length === 0 && (
                  <tr>
                    <td colSpan={7 + (selectedEvent?.customFields?.length || 0)} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={28} style={{ opacity: 0.35 }} />
                        <span style={{ fontWeight: 600 }}>No attendee records matching criteria</span>
                        <span style={{ fontSize: '0.78rem' }}>Try clearing the search query or changing the filter.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SIDE DRAWER: CREATE / EDIT EVENT (3-STAGE STEPPER)
         ════════════════════════════════════════════════════════════════════════ */}
      {showEventModal && (
        <div className="studio-drawer-overlay ops-modal--drawer-top" {...eventModalBackdrop.getBackdropProps()}>
          <div className="studio-drawer-content" style={{ maxWidth: '740px' }} onClick={(e) => e.stopPropagation()}>
            <div className="studio-drawer-header">
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {editingEvent ? 'Edit ' : `Stage ${creationStage} of 3: `}
                  {creationStage === 1 ? 'Core Details & Dates' : creationStage === 2 ? 'Custom Questions' : 'Activities'}
                </span>
              </div>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowEventModal(false)}>
                <X size={16} />
              </button>
            </div>

            {/* 3-Stage Stepper / Tabs Bar (Both Create & Edit Modes) */}
            <div className="ops-wizard-stepper">
              <div
                className={`ops-wizard-step ${
                  creationStage === 1
                    ? 'ops-wizard-step--active'
                    : !isStage1Valid && hasAttemptedStage1
                    ? 'ops-wizard-step--error'
                    : isStage1Valid
                    ? 'ops-wizard-step--completed'
                    : ''
                }`}
                onClick={() => setCreationStage(1)}
                title={!isStage1Valid && hasAttemptedStage1 ? 'Core details incomplete' : '1. Core'}
                style={{ cursor: 'pointer' }}
              >
                <div className="ops-wizard-step__number">
                  {creationStage === 1 ? (
                    1
                  ) : isStage1Valid ? (
                    <Check size={12} />
                  ) : hasAttemptedStage1 ? (
                    <AlertTriangle size={12} />
                  ) : (
                    1
                  )}
                </div>
                <span>1. Core</span>
              </div>
              <div className="ops-wizard-stepper__connector" />
              <div
                className={`ops-wizard-step ${
                  creationStage === 2
                    ? 'ops-wizard-step--active'
                    : !isStage2Valid && hasAttemptedStage2
                    ? 'ops-wizard-step--error'
                    : isStage2Valid && hasAttemptedStage2
                    ? 'ops-wizard-step--completed'
                    : ''
                }`}
                onClick={() => {
                  setHasAttemptedStage1(true);
                  setCreationStage(2);
                }}
                title={!isStage2Valid && hasAttemptedStage2 ? 'Questions incomplete' : '2. Questions'}
                style={{ cursor: 'pointer' }}
              >
                <div className="ops-wizard-step__number">
                  {creationStage === 2 ? (
                    2
                  ) : isStage2Valid && hasAttemptedStage2 ? (
                    <Check size={12} />
                  ) : !isStage2Valid && hasAttemptedStage2 ? (
                    <AlertTriangle size={12} />
                  ) : (
                    2
                  )}
                </div>
                <span>2. Questions</span>
              </div>
              <div className="ops-wizard-stepper__connector" />
              <div
                className={`ops-wizard-step ${creationStage === 3 ? 'ops-wizard-step--active' : ''}`}
                onClick={() => {
                  setHasAttemptedStage1(true);
                  setHasAttemptedStage2(true);
                  setCreationStage(3);
                }}
                title="3. Activities"
                style={{ cursor: 'pointer' }}
              >
                <div className="ops-wizard-step__number">3</div>
                <span>3. Activities</span>
              </div>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="studio-drawer-body" style={{ overflowY: 'auto' }}>

                {/* ── STAGE 1: CORE DETAILS & DATES ───────────────────────── */}
                {creationStage === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Event Name *</label>
                      <input
                        type="text"
                        required
                        value={eventForm.name}
                        onChange={(e) => {
                          setEventForm({ ...eventForm, name: e.target.value });
                          if (touchedFields.name) setTouchedFields((prev) => ({ ...prev, name: false }));
                        }}
                        onBlur={() => setTouchedFields((prev) => ({ ...prev, name: true }))}
                        placeholder="e.g. AI Summit & Hackathon 2026"
                        className="form-input"
                        style={{
                          borderColor: (touchedFields.name || hasAttemptedStage1) && !eventForm.name.trim() ? 'var(--color-danger, #ef4444)' : undefined,
                        }}
                      />
                      {(touchedFields.name || hasAttemptedStage1) && !eventForm.name.trim() && (
                        <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '0.2rem', display: 'block' }}>
                          Event name is required
                        </span>
                      )}
                    </div>

                    {/* Event Cover Image (Cloudinary Direct File Upload & Click-to-Enlarge) */}
                    <div className="form-group" style={{ background: 'var(--color-bg)', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                          <ImageIcon size={15} /> Event Cover Image
                        </label>
                        {eventForm.coverImageUrl && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setEventForm((prev) => ({ ...prev, coverImageUrl: '', bannerUrl: '' }))}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>

                      {eventForm.coverImageUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                          <img
                            src={eventForm.coverImageUrl}
                            alt="Cover Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => setLightboxImage({ url: eventForm.coverImageUrl, title: eventForm.name || 'Cover Preview' })}
                              style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Maximize2 size={12} /> Enlarge
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1.5rem',
                            border: '2px dashed var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: uploadingCover ? 'not-allowed' : 'pointer',
                            background: 'var(--color-surface)',
                            transition: 'border-color 0.2s',
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingCover}
                            onChange={handleCoverImageUpload}
                            style={{ display: 'none' }}
                          />
                          {uploadingCover ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                              <RefreshCw size={24} className="ops-spin" />
                              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <Upload size={22} style={{ color: 'var(--color-primary)', marginBottom: '0.4rem' }} />
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                Click or drag & drop event cover
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                PNG, JPG, WebP (16:9 aspect ratio recommended)
                              </span>
                            </>
                          )}
                        </label>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description *</label>
                      <textarea
                        rows={3}
                        required
                        value={eventForm.description}
                        onChange={(e) => {
                          setEventForm({ ...eventForm, description: e.target.value });
                          if (touchedFields.description) setTouchedFields((prev) => ({ ...prev, description: false }));
                        }}
                        onBlur={() => setTouchedFields((prev) => ({ ...prev, description: true }))}
                        placeholder="Event agenda, keynote topics, instructions..."
                        className="form-input"
                        style={{
                          resize: 'vertical',
                          borderColor: (touchedFields.description || hasAttemptedStage1) && !eventForm.description.trim() ? 'var(--color-danger, #ef4444)' : undefined,
                        }}
                      />
                      {(touchedFields.description || hasAttemptedStage1) && !eventForm.description.trim() && (
                        <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '0.2rem', display: 'block' }}>
                          Description is required
                        </span>
                      )}
                    </div>

                    {/* Start Date & End Date (Unified Range in UI) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Start Date *</label>
                        <input
                          type="date"
                          required
                          value={eventForm.startDate}
                          onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Date (Optional for multi-day)</label>
                        <input
                          type="date"
                          value={eventForm.endDate}
                          min={eventForm.startDate}
                          onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                          className="form-input"
                          style={{
                            borderColor: eventForm.startDate && eventForm.endDate && new Date(eventForm.endDate) < new Date(eventForm.startDate) ? 'var(--color-danger, #ef4444)' : undefined,
                          }}
                        />
                        {eventForm.startDate && eventForm.endDate && new Date(eventForm.endDate) < new Date(eventForm.startDate) && (
                          <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '0.2rem', display: 'block' }}>
                            End date cannot be earlier than start date
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Location / City *</label>
                        <input
                          type="text"
                          required
                          value={eventForm.location}
                          onChange={(e) => {
                            setEventForm({ ...eventForm, location: e.target.value });
                            if (touchedFields.location) setTouchedFields((prev) => ({ ...prev, location: false }));
                          }}
                          onBlur={() => setTouchedFields((prev) => ({ ...prev, location: true }))}
                          placeholder="e.g. Menoufia"
                          className="form-input"
                          style={{
                            borderColor: (touchedFields.location || hasAttemptedStage1) && !eventForm.location.trim() ? 'var(--color-danger, #ef4444)' : undefined,
                          }}
                        />
                        {(touchedFields.location || hasAttemptedStage1) && !eventForm.location.trim() && (
                          <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '0.2rem', display: 'block' }}>
                            Location is required
                          </span>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Venue *</label>
                        <input
                          type="text"
                          required
                          value={eventForm.venue}
                          onChange={(e) => {
                            setEventForm({ ...eventForm, venue: e.target.value });
                            if (touchedFields.venue) setTouchedFields((prev) => ({ ...prev, venue: false }));
                          }}
                          onBlur={() => setTouchedFields((prev) => ({ ...prev, venue: true }))}
                          placeholder="e.g. Hall 1, Faculty of Electronic Engineering"
                          className="form-input"
                          style={{
                            borderColor: (touchedFields.venue || hasAttemptedStage1) && !eventForm.venue.trim() ? 'var(--color-danger, #ef4444)' : undefined,
                          }}
                        />
                        {(touchedFields.venue || hasAttemptedStage1) && !eventForm.venue.trim() && (
                          <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '0.2rem', display: 'block' }}>
                            Venue is required
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                          <option value="Summit">Summit</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Allowed Audience</label>
                        <select
                          value={eventForm.allowedAudience}
                          onChange={(e) => setEventForm({ ...eventForm, allowedAudience: e.target.value })}
                          className="form-input"
                        >
                          <option value="public">Public (Anyone)</option>
                          <option value="authenticated">Logged-In Portal Users</option>
                          <option value="members_only">Branch Members Only</option>
                          <option value="leads_only">Committee Leads Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Capacity with Unlimited Toggle (-1) */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label" style={{ margin: 0 }}>Capacity Limit</label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                          <input
                            type="checkbox"
                            checked={eventForm.isUnlimitedCapacity}
                            onChange={(e) => setEventForm({ ...eventForm, isUnlimitedCapacity: e.target.checked })}
                          />
                          <span>Unlimited Capacity (<strong>∞</strong>)</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        min={1}
                        disabled={eventForm.isUnlimitedCapacity}
                        value={eventForm.isUnlimitedCapacity ? '' : eventForm.capacity}
                        onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                        placeholder={eventForm.isUnlimitedCapacity ? 'Unlimited attendees permitted' : '100'}
                        className="form-input"
                        style={{ marginTop: '0.4rem' }}
                      />
                    </div>

                    {/* Quick Registration Open Toggle */}
                    <div
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            Open Registration Immediately
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                            Allow attendees to submit registration responses right away
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          id="open-registration-toggle"
                          checked={eventForm.isRegistrationOpen}
                          onChange={(e) => setEventForm({ ...eventForm, isRegistrationOpen: e.target.checked })}
                          style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                        />
                      </div>
                    </div>

                    {/* Info Section */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm, 6px)',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.76rem',
                        lineHeight: 1.45,
                      }}
                    >
                      <Info size={14} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                      <span>
                        Attendees can register until midnight on the day before the event date (based on end date, or start date if no end date).
                      </span>
                    </div>
                  </div>
                )}

                {/* ── STAGE 2: CUSTOM REGISTRATION QUESTIONS ───────────────── */}
                {creationStage === 2 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                          Custom Registration Questions ({eventForm.customFields.length})
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          Ask attendees specific questions during registration (e.g. T-Shirt Size, GitHub, Dietary)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      >
                        <Plus size={12} /> Add Field
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {eventForm.customFields.map((field, idx) => {
                        const isDragging = draggedCustomFieldIdx === idx;
                        const isDragOver = dragOverCustomFieldIdx === idx && !isDragging;

                        return (
                          <div
                            key={field.id || idx}
                            draggable={dragEnabledIdx === idx}
                            onDragStart={(e) => {
                              setDraggedCustomFieldIdx(idx);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', String(idx));
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverCustomFieldIdx !== idx) {
                                setDragOverCustomFieldIdx(idx);
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverCustomFieldIdx === idx) {
                                setDragOverCustomFieldIdx(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleReorderCustomField(draggedCustomFieldIdx, idx);
                              setDragEnabledIdx(null);
                              setDraggedCustomFieldIdx(null);
                              setDragOverCustomFieldIdx(null);
                            }}
                            onDragEnd={() => {
                              setDragEnabledIdx(null);
                              setDraggedCustomFieldIdx(null);
                              setDragOverCustomFieldIdx(null);
                            }}
                            className="bento-card"
                            style={{
                              padding: '0.75rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem',
                              opacity: isDragging ? 0.45 : 1,
                              border: isDragOver
                                ? '1px dashed var(--color-primary)'
                                : '1px solid var(--color-border)',
                              background: isDragOver ? 'rgba(59, 130, 246, 0.05)' : undefined,
                              transition: 'border 0.15s, background 0.15s, opacity 0.15s',
                              position: 'relative',
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 2fr 1.2fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                              <div
                                onMouseDown={() => setDragEnabledIdx(idx)}
                                onMouseUp={() => setDragEnabledIdx(null)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'grab',
                                  color: 'var(--color-text-muted)',
                                  padding: '0.2rem',
                                  userSelect: 'none',
                                }}
                                title="Drag to reorder question"
                              >
                                <GripVertical size={16} />
                              </div>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => {
                                  handleUpdateCustomField(idx, { label: e.target.value });
                                  if (touchedFields.questions) setTouchedFields((prev) => ({ ...prev, questions: false }));
                                }}
                                onBlur={() => setTouchedFields((prev) => ({ ...prev, questions: true }))}
                                placeholder="Question (e.g. T-Shirt Size)"
                                className="form-input"
                                style={{
                                  fontSize: '0.85rem',
                                  borderColor: (hasAttemptedStage2 || touchedFields.questions) && !field.label?.trim() ? 'var(--color-danger, #ef4444)' : undefined,
                                }}
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
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
                                style={{ width: '36px', height: '36px', color: 'var(--color-danger)' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {(hasAttemptedStage2 || touchedFields.questions) && !field.label?.trim() && (
                              <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem' }}>
                                Question title is required
                              </span>
                            )}

                            {field.type === 'select' && (
                              <div>
                                <SelectOptionsChipsEditor
                                  options={Array.isArray(field.options) ? field.options : []}
                                  onChange={(newOpts) => handleUpdateCustomField(idx, { options: newOpts })}
                                />
                                {(!field.options || field.options.length === 0) && (hasAttemptedStage2 || touchedFields.questions) && (
                                  <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '0.2rem', display: 'block' }}>
                                    Dropdown questions require at least 1 option.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {eventForm.customFields.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                          No custom questions added yet. You can add fields or skip this stage!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── STAGE 3: ACTIVITIES & POINTS (CREATE & EDIT MODES) ─────────────── */}
                {creationStage === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        {editingEvent ? 'Manage Event Activities' : 'Initial Activities'}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        All points belong to activities. When an attendee is scanned for an activity, points are awarded immediately!
                      </span>
                    </div>

                    {/* Add Activity Mini-Form */}
                    <div className="bento-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-bg)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>+ Add Activity to Event</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={newActivityDraft.name}
                          onChange={(e) => setNewActivityDraft({ ...newActivityDraft, name: e.target.value })}
                          placeholder="Activity Name (e.g. Workshop: ML)"
                          className="form-input"
                          style={{ fontSize: '0.84rem' }}
                        />
                        <select
                          value={newActivityDraft.type}
                          onChange={(e) => setNewActivityDraft({ ...newActivityDraft, type: e.target.value })}
                          className="form-select"
                          style={{ fontSize: '0.84rem' }}
                        >
                          <option value="workshop">Workshop</option>
                          <option value="check-in">Check-In</option>
                          <option value="talk">Keynote / Talk</option>
                          <option value="meal">Meal / Catering</option>
                          <option value="session">Session</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={newActivityDraft.points}
                          onChange={(e) => setNewActivityDraft({ ...newActivityDraft, points: Number(e.target.value) })}
                          placeholder="Points (e.g. 15)"
                          className="form-input"
                          style={{ fontSize: '0.84rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={editingEvent ? handleAddLiveActivity : handleAddDraftActivity}
                          disabled={!newActivityDraft.name.trim()}
                          className="btn btn-primary"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                        >
                          <Plus size={12} /> Add Activity
                        </button>
                      </div>
                    </div>

                    {/* Activities List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {editingEvent ? (
                        /* Edit mode: Live activities from backend */
                        activities.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            No activities created yet for this event.
                          </div>
                        ) : (
                          activities.map((act) => {
                            const actId = act._id || act.id;
                            return (
                              <div
                                key={actId}
                                className="bento-card"
                                style={{
                                  padding: '0.75rem 1rem',
                                  display: 'flex',
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  width: '100%',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{act.name}</span>
                                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{act.type}</span>
                                  <span className="badge badge-accent" style={{ fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Star size={11} fill="currentColor" /> +{act.points || 15} pts
                                  </span>
                                  {act.isLocked && (
                                    <span className="badge badge-danger" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Lock size={10} /> Locked</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleActivityLock(act)}
                                    className={`btn ${act.isLocked ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                                    style={{ width: '36px', height: '36px' }}
                                    title={act.isLocked ? 'Unlock' : 'Lock'}
                                  >
                                    {act.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLiveActivity(act)}
                                    className="btn btn-secondary btn-icon"
                                    style={{ width: '36px', height: '36px', color: 'var(--color-danger)' }}
                                    title="Delete activity"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )
                      ) : (
                        /* Create mode: Draft activities */
                        initialActivities.map((act, idx) => (
                          <div
                            key={idx}
                            className="bento-card"
                            style={{
                              padding: '0.75rem 1rem',
                              display: 'flex',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.75rem',
                              width: '100%',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{act.name}</span>
                              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{act.type}</span>
                              <span className="badge badge-accent" style={{ fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Star size={11} fill="currentColor" /> +{act.points || 15} pts
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftActivity(idx)}
                              className="btn btn-secondary btn-icon"
                              style={{ width: '36px', height: '36px', color: 'var(--color-danger)', flexShrink: 0 }}
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Stepper Footer Controls */}
              <div className="studio-drawer-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {creationStage > 1 && !editingEvent && (
                    <button
                      type="button"
                      onClick={() => setCreationStage((prev) => prev - 1)}
                      className="btn btn-secondary"
                    >
                      ← Back
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>

                  {/* Stage 1 Actions */}
                  {creationStage === 1 && !editingEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasAttemptedStage1(true);
                        setTouchedFields((prev) => ({ ...prev, name: true, description: true, location: true, endDate: true }));
                        const s1Errors = getStage1Errors();
                        if (Object.keys(s1Errors).length > 0) {
                          toast.warning('Incomplete Details', Object.values(s1Errors)[0]);
                          return;
                        }
                        setCreationStage(2);
                      }}
                      className="btn btn-primary"
                    >
                      Next →
                    </button>
                  )}

                  {/* Stage 2 Actions */}
                  {creationStage === 2 && !editingEvent && (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveEvent}
                        className="btn btn-secondary"
                        title="Skip adding activities right now and create event immediately"
                      >
                        Skip & Create Event
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasAttemptedStage2(true);
                          setTouchedFields((prev) => ({ ...prev, questions: true }));
                          const s2Errors = getStage2Errors();
                          if (s2Errors.length > 0) {
                            toast.warning('Incomplete Questions', s2Errors[0]);
                            return;
                          }
                          setCreationStage(3);
                        }}
                        className="btn btn-primary"
                      >
                        Next →
                      </button>
                    </>
                  )}

                  {/* Stage 3 Action (or Editing Event) */}
                  {(creationStage === 3 || editingEvent) && (
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      {editingEvent ? 'Save Changes' : 'Finish & Create Event ✓'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: ADD ACTIVITY
         ════════════════════════════════════════════════════════════════════════ */}
      {showActivityModal && (
        <div className="modal-backdrop" {...activityModalBackdrop.getBackdropProps()}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Add Activity
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

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={13} style={{ color: 'var(--color-primary)' }} />
                    Activity Type
                  </label>
                  <div className="ops-select-wrapper">
                    <select
                      value={activityForm.type}
                      onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                      className="form-select"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="check-in">General Check-In</option>
                      <option value="talk">Talk / Keynote</option>
                      <option value="session">Technical Session</option>
                      <option value="meal">Meal / Catering</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="competition">Competition</option>
                      <option value="booth">Exhibition Booth</option>
                      <option value="general">Other Activity</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Award size={13} style={{ color: '#f59e0b' }} />
                    Activity Points
                  </label>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {activityForm.checkInMode === 'self_service' ? (
                      <Smartphone size={13} style={{ color: '#a855f7' }} />
                    ) : (
                      <Camera size={13} style={{ color: 'var(--color-primary)' }} />
                    )}
                    Check-In Mode
                  </label>
                  <span
                    className={`badge ${activityForm.checkInMode === 'self_service' ? 'badge-purple' : 'badge-primary'}`}
                    style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}
                  >
                    {activityForm.checkInMode === 'self_service' ? 'Self-Service Kiosk' : 'Staff Scanner'}
                  </span>
                </div>

                <div className="ops-select-wrapper">
                  <select
                    value={activityForm.checkInMode}
                    onChange={(e) => setActivityForm({ ...activityForm, checkInMode: e.target.value })}
                    className="form-select"
                  >
                    <option value="staff_scanner">Staff QR Scanner (Organizer scans attendee tickets)</option>
                    <option value="self_service">Self-Service Kiosk (Attendee scans room projector QR)</option>
                  </select>
                </div>

                <div className={`ops-mode-preview ${activityForm.checkInMode === 'self_service' ? 'ops-mode-preview--kiosk' : 'ops-mode-preview--scanner'}`}>
                  {activityForm.checkInMode === 'self_service' ? (
                    <>
                      <Smartphone size={15} style={{ color: '#a855f7', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: 'var(--color-text)' }}>Kiosk Display Mode:</strong> Attendees scan the activity's projected QR code with their mobile devices and enter their registered email to self check-in.
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={15} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: 'var(--color-text)' }}>Staff Scanner Mode:</strong> Authorized organizers and scanners scan attendees' personalized QR badges from the Operations Studio Scanner desk.
                      </div>
                    </>
                  )}
                </div>
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
          MODAL 3: QR EMAIL DISPATCHER (MATCHING PR & HR STUDIO DESIGN)
         ════════════════════════════════════════════════════════════════════════ */}
      {showEmailDispatchModal && (
        <div className="modal-overlay" {...emailModalBackdrop.getBackdropProps()}>
          <div
            className="modal-content"
            style={{ maxWidth: 1100, width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Mail size={18} color="var(--color-primary)" />
                <span>Dispatch QR Ticket</span>
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEmailDispatchModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>
              <div className="ops-email-split">
                {/* Left Column: Form Controls & Variable Pills */}
                <div className="ops-email-left-col">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Email Subject Line *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={emailTemplate.subject}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
                      placeholder="e.g. 🎟️ Your QR Ticket for {{eventName}}"
                    />
                  </div>

                  {/* Mode Selector & Body Header */}
                  <div className="ops-email-editor-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        {emailTemplate.templateMode === 'full' ? 'Full Email HTML Template *' : 'Email Body *'}
                      </label>

                      <div style={{ display: 'inline-flex', background: 'var(--color-surface)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gap: '2px' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${emailTemplate.templateMode !== 'full' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleToggleEmailTemplateMode('standard')}
                          style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                          title="Standard Content: Write announcement/instructions wrapped inside official IEEE ticket pass layout"
                        >
                          Standard Content
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${emailTemplate.templateMode === 'full' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleToggleEmailTemplateMode('full')}
                          style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                          title="Full HTML Template: Edit the entire <!DOCTYPE html> template from scratch"
                        >
                          <Code size={11} />
                          <span>Full HTML Template</span>
                        </button>
                      </div>
                    </div>

                    {emailTemplate.templateMode === 'full' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 98, 155, 0.08)', border: '1px solid rgba(0, 98, 155, 0.25)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          Editing complete <code style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>&lt;!DOCTYPE html&gt;</code> document.
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={handleResetEmailToDefaultTemplate}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', flexShrink: 0 }}
                          title="Reset to default official IEEE ticket email structure"
                        >
                          <RotateCcw size={11} />
                          <span>Reset to Default</span>
                        </button>
                      </div>
                    )}

                    <div className="ops-var-pills-wrap">
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.2rem' }}>Insert Tags:</span>
                      {[
                        { tag: '{{name}}', label: 'Attendee Name' },
                        { tag: '{{ticketId}}', label: 'Ticket ID' },
                        { tag: '{{eventName}}', label: 'Event Title' },
                        { tag: '{{venue}}', label: 'Event Venue' },
                        { tag: '{{eventDate}}', label: 'Event Date' },
                        { tag: '{{email}}', label: 'Attendee Email' },
                        { tag: '{{calendarUrl}}', label: 'Google Calendar Link' },
                        { tag: '{{venueMapUrl}}', label: 'Venue Map Link' },
                      ].map((v) => (
                        <button
                          key={v.tag}
                          type="button"
                          className="ops-var-pill"
                          onClick={() => insertEmailVariable(v.tag)}
                          title={`Insert ${v.label} into message body`}
                        >
                          + {v.tag}
                        </button>
                      ))}
                    </div>

                    {emailTemplate.templateMode !== 'full' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)', borderBottom: 'none', background: 'var(--color-surface)', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => applyEmailFormatting('bold')}
                            title="Bold text (**text**)"
                            style={{ padding: '0.15rem 0.35rem' }}
                          >
                            <Bold size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => applyEmailFormatting('italic')}
                            title="Italic text (*text*)"
                            style={{ padding: '0.15rem 0.35rem' }}
                          >
                            <Italic size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => applyEmailFormatting('link')}
                            title="Hyperlink ([text](url))"
                            style={{ padding: '0.15rem 0.35rem' }}
                          >
                            <ExternalLink size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => applyEmailFormatting('divider')}
                            title="Horizontal Divider (---)"
                            style={{ padding: '0.15rem 0.35rem' }}
                          >
                            <Minus size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() =>
                            setEmailTemplate((p) => ({
                              ...p,
                              editorMode: p.editorMode === 'markdown' ? 'html' : 'markdown',
                            }))
                          }
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}
                        >
                          <Code size={12} />
                          <span>{emailTemplate.editorMode === 'html' ? 'Custom HTML Mode' : 'Markdown Mode'}</span>
                        </button>
                      </div>
                    )}

                    <textarea
                      ref={emailBodyRef}
                      value={emailTemplate.templateMode === 'full' ? (emailTemplate.fullHtmlBody || '') : (emailTemplate.standardBody || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (emailTemplate.templateMode === 'full') {
                          setEmailTemplate((p) => ({ ...p, fullHtmlBody: val }));
                        } else {
                          setEmailTemplate((p) => ({ ...p, standardBody: val }));
                        }
                      }}
                      className="form-input ops-email-editor-textarea"
                      style={{
                        fontSize: (emailTemplate.templateMode === 'full' || emailTemplate.editorMode === 'html') ? '0.78125rem' : '0.84rem',
                        fontFamily: (emailTemplate.templateMode === 'full' || emailTemplate.editorMode === 'html') ? 'var(--font-mono)' : 'inherit',
                        lineHeight: 1.55,
                        minHeight: emailTemplate.templateMode === 'full' ? '340px' : '330px',
                        borderRadius: emailTemplate.templateMode === 'full' ? 'var(--radius-md)' : '0 0 var(--radius-md) var(--radius-md)',
                      }}
                      placeholder={
                        emailTemplate.templateMode === 'full'
                          ? '<!DOCTYPE html>\n<html>\n  <body>...</body>\n</html>'
                          : 'Write ticket dispatch message body in Markdown or text...'
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        Schedule (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        style={{ fontSize: '0.8125rem' }}
                        value={emailTemplate.scheduledFor}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setEmailTemplate((p) => ({ ...p, scheduledFor: e.target.value }))}
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
                        <span>{participants.length} Expected Recipients</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Simulated Email Client */}
                <div className="ops-email-preview-col">
                  <div className="pr-email-client">
                    {/* Window Bar (Matching PR & HR Studio) */}
                    <div className="pr-email-client__window-bar">
                      <div className="pr-email-client__dots">
                        <span className="pr-email-client__dot pr-email-client__dot--red" />
                        <span className="pr-email-client__dot pr-email-client__dot--yellow" />
                        <span className="pr-email-client__dot pr-email-client__dot--green" />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        Client Preview
                      </span>
                      <div style={{ width: 30 }} />
                    </div>

                    {/* Meta Header */}
                    <div className="pr-email-client__meta">
                      <div className="pr-email-client__meta-row">
                        <span className="pr-email-client__meta-label">From:</span>
                        <span className="pr-email-client__meta-val">IEEE Menoufia Student Branch &lt;noreply@ieeemsb.org&gt;</span>
                      </div>
                      <div className="pr-email-client__meta-row">
                        <span className="pr-email-client__meta-label">To:</span>
                        <span className="pr-email-client__meta-val">
                          {emailTemplate.previewName || 'Yousef Mansour'} &lt;attendee@ieeemsb.org&gt;
                        </span>
                      </div>
                      <div className="pr-email-client__subject">
                        {(emailTemplate.subject || '🎟️ Your QR Ticket for {{eventName}}')
                          .replace(/\{\{eventName\}\}/g, selectedEvent?.name || 'AI Summit 2026')
                          .replace(/\{\{name\}\}/g, emailTemplate.previewName || 'Yousef Mansour') || '(Subject line preview)'}
                      </div>
                    </div>

                    {/* Authentic Simulated Attachment Bar */}
                    <div className="pr-email-client__attachment-bar">
                      <div className="pr-email-client__attachment-chip">
                        <Paperclip size={13} color="var(--color-primary, #00629b)" />
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                          ticket-TKT-89241.png
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>· 128 KB</span>
                        <span className="pr-email-client__attachment-badge">PNG IMAGE PASS</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          1 Attachment Attached
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary, #00629b)', fontWeight: 600 }}>
                          Download
                        </span>
                      </div>
                    </div>

                    {/* Simulated Body Frame */}
                    <div className="pr-email-client__body-container" style={{ padding: '1.25rem', background: '#f1f5f9', display: 'flex', justifyContent: 'center' }}>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '600px',
                          background: '#ffffff',
                          borderRadius: '16px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          overflow: 'hidden',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (emailTemplate.templateMode === 'full'
                            ? (emailTemplate.fullHtmlBody || '')
                            : getDefaultEmailTemplate(
                                emailTemplate.editorMode === 'html'
                                  ? emailTemplate.standardBody
                                  : renderMarkdownToHtml(emailTemplate.standardBody || ''),
                                selectedEvent?.name
                              )
                          )
                            .replace(/\{\{name\}\}/g, emailTemplate.previewName || 'Yousef Mansour')
                            .replace(/\{\{email\}\}/g, 'attendee@ieeemsb.org')
                            .replace(/\{\{eventName\}\}/g, selectedEvent?.name || 'AI Summit 2026')
                            .replace(/\{\{eventDate\}\}/g, formatEventDateRange(selectedEvent?.startDate, selectedEvent?.endDate, selectedEvent?.date) || 'October 15, 2026')
                            .replace(/\{\{venue\}\}/g, selectedEvent?.venue || selectedEvent?.location || 'Main Auditorium, FEE Campus')
                            .replace(/\{\{venueMapUrl\}\}/g, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent?.venue || selectedEvent?.location || 'Faculty of Electronic Engineering, Menoufia University')}`)
                            .replace(/\{\{calendarUrl\}\}/g, `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedEvent?.name || 'AI Summit 2026')}&location=${encodeURIComponent(selectedEvent?.venue || selectedEvent?.location || 'Main Auditorium')}`)
                            .replace(/\{\{ticketId\}\}/g, 'TKT-89241'),
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEmailDispatchModal(false)}
                disabled={dispatchingEmails}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchQREmails}
                disabled={dispatchingEmails || participants.length === 0}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                {dispatchingEmails ? (
                  <>
                    <RefreshCw size={14} className="ops-spin" />
                    <span>{emailTemplate.scheduledFor ? 'Scheduling Tickets…' : 'Dispatching Emails…'}</span>
                  </>
                ) : (
                  <>
                    {emailTemplate.scheduledFor ? <Clock size={14} /> : <Send size={14} />}
                    <span>{emailTemplate.scheduledFor ? 'Schedule' : 'Send'} Tickets to {participants.length} Attendees</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 4: FULL-SCREEN KIOSK PROJECTOR OVERLAY
         ════════════════════════════════════════════════════════════════════════ */}
      {showKioskModal && kioskActivity && (
        <div className="ops-projector-fullscreen" onClick={(e) => e.stopPropagation()}>
          {/* Top Floating Toolbar */}
          <div className="ops-projector-toolbar">
            <button
              type="button"
              onClick={toggleProjectorFullscreen}
              className="btn btn-secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
              }}
              title="Toggle Browser Fullscreen"
            >
              {isProjectorFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {isProjectorFullscreen ? 'Windowed' : 'Fullscreen'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                setShowKioskModal(false);
              }}
              className="btn btn-secondary"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
              }}
              title="Exit Projector Mode (or press Esc)"
            >
              <X size={16} /> Exit Projector
            </button>
          </div>

          {/* Centered Stage Content */}
          <div className="ops-projector-stage">
            <span className="ops-projector-event-tag">
              {drawerEvent?.name || selectedEvent?.name || 'IEEE Event Check-In'}
            </span>

            <h1 className="ops-projector-title">
              {kioskActivity.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className="badge badge-accent" style={{ fontSize: '0.9rem', padding: '0.4rem 0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Star size={13} fill="currentColor" /> +{kioskActivity.points || 10} IEEE Points
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                {kioskActivity.type || 'Session'}
              </span>
            </div>

            {/* Giant High-Res QR Code Frame */}
            <div className="ops-projector-qr-frame">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=10&data=${encodeURIComponent(
                  `${window.location.origin}/checkin/${kioskActivity.qrId}`
                )}`}
                alt="Kiosk Check-In QR"
                className="ops-projector-qr-img"
              />
            </div>

            <p className="ops-projector-instructions">
              <Smartphone size={20} style={{ color: '#38bdf8' }} />
              Scan with your mobile camera to check in instantly
            </p>

            {/* Direct Attendee URL Pill */}
            <button
              type="button"
              className="ops-projector-url-chip"
              onClick={(e) => handleCopyKey(`${window.location.origin}/checkin/${kioskActivity.qrId}`, e)}
              title="Click to copy direct link"
            >
              <span className="ops-pulse-dot" />
              <span>{window.location.origin}/checkin/{kioskActivity.qrId}</span>
              {copiedKey === `${window.location.origin}/checkin/${kioskActivity.qrId}` ? (
                <Check size={14} color="#10b981" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 5: ACTIVITY WHITELIST MANAGEMENT
         ════════════════════════════════════════════════════════════════════════ */}
      {showWhitelistModal && whitelistActivity && (
        <div className="modal-backdrop" {...whitelistModalBackdrop.getBackdropProps()}>
          <div className="modal-content" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span className="badge badge-purple">
                    <Shield size={11} /> Access Control
                  </span>
                  <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={11} fill="currentColor" /> +{whitelistActivity.points || 10} pts
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Whitelist: {whitelistActivity.name}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setShowWhitelistModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {/* Restriction Toggle Banner */}
              <div
                className={`ops-whitelist-toggle-card ${whitelistRestrictedToggle ? 'ops-whitelist-toggle-card--active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md, 0.5rem)',
                  border: `1.5px solid ${whitelistRestrictedToggle ? '#a855f7' : 'var(--color-border)'}`,
                  background: whitelistRestrictedToggle ? 'rgba(168, 85, 247, 0.08)' : 'var(--color-bg)',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div className="ops-whitelist-toggle-card__text" style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="ops-whitelist-toggle-card__title-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="ops-whitelist-toggle-card__title" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                      Activate Whitelist
                    </span>
                    <span
                      className={`badge ${whitelistRestrictedToggle ? 'badge-purple' : ''}`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {whitelistRestrictedToggle ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="ops-whitelist-toggle-card__desc" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                    When active, only whitelisted attendees can be scanned for this activity.
                  </p>
                </div>

                <label
                  className={`ops-toggle-switch ${whitelistRestrictedToggle ? 'ops-toggle-switch--active' : ''}`}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: '48px',
                    height: '26px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    userSelect: 'none',
                    margin: 0,
                  }}
                  title={whitelistRestrictedToggle ? 'Deactivate whitelist' : 'Activate whitelist'}
                >
                  <input
                    type="checkbox"
                    checked={whitelistRestrictedToggle}
                    onChange={(e) => setWhitelistRestrictedToggle(e.target.checked)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                  />
                  <span
                    className="ops-toggle-switch__slider"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: whitelistRestrictedToggle ? '#a855f7' : 'var(--color-border, #cbd5e1)',
                      borderRadius: '26px',
                      transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                  <span
                    className="ops-toggle-switch__thumb"
                    style={{
                      position: 'absolute',
                      height: '20px',
                      width: '20px',
                      left: '3px',
                      bottom: '3px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transform: whitelistRestrictedToggle ? 'translateX(22px)' : 'translateX(0)',
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
                    }}
                  />
                </label>
              </div>

              {/* Whitelist Mode Tabs: Select from Roster vs Paste / Upload Sheet */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${whitelistTab === 'roster' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setWhitelistTab('roster')}
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
                >
                  <Users size={13} /> Select From Registered ({whitelistParticipantIds.length})
                </button>
                <button
                  type="button"
                  className={`btn ${whitelistTab === 'sheet' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setWhitelistTab('sheet')}
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
                >
                  <FileText size={13} /> Upload Sheet / Paste Emails
                </button>
              </div>

              {whitelistTab === 'roster' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="text"
                        value={whitelistSearch}
                        onChange={(e) => setWhitelistSearch(e.target.value)}
                        placeholder="Search attendees by name or email..."
                        className="form-input"
                        style={{ paddingLeft: '2.2rem', fontSize: '0.84rem' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = participants.map((p) => String(p._id || p.id));
                        setWhitelistRestrictedToggle(true);
                        setWhitelistParticipantIds(allIds);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhitelistParticipantIds([])}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                    >
                      Clear
                    </button>
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {participants
                      .filter(
                        (p) =>
                          !whitelistSearch ||
                          p.name?.toLowerCase().includes(whitelistSearch.toLowerCase()) ||
                          p.email?.toLowerCase().includes(whitelistSearch.toLowerCase())
                      )
                      .map((p) => {
                        const pId = String(p._id || p.id);
                        const isChecked = whitelistParticipantIds.includes(pId);

                        return (
                          <div
                            key={pId}
                            className="ops-whitelist-participant-row"
                            onClick={() => {
                              setWhitelistRestrictedToggle(true);
                              setWhitelistParticipantIds((prev) =>
                                isChecked ? prev.filter((id) => id !== pId) : [...prev, pId]
                              );
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => { }} // Handled by row click
                                style={{ cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.85rem' }}>{p.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.email}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {p.university || p.faculty || ''}
                            </span>
                          </div>
                        );
                      })}

                    {participants.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
                        No registered attendees available for this event yet.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Sheet Import / Email Paste Tab */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Paste Approved Attendee Emails (1 per line or comma-separated):</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        {whitelistEmailsText
                          .split(/[\n,;]+/)
                          .map((e) => e.trim())
                          .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).length}{' '}
                        valid emails
                      </span>
                    </label>
                    <textarea
                      rows={7}
                      value={whitelistEmailsText}
                      onChange={(e) => {
                        setWhitelistEmailsText(e.target.value);
                        if (e.target.value.trim()) setWhitelistRestrictedToggle(true);
                      }}
                      placeholder="attendee1@example.com&#10;attendee2@ieee.org&#10;attendee3@university.edu"
                      className="form-input"
                      style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.84rem' }}
                    />
                  </div>

                  {/* File Upload Helper */}
                  <div
                    style={{
                      border: '1px dashed var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--color-bg)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>Upload Attendee Sheet</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Accepts CSV or TXT file containing email addresses
                      </div>
                    </div>
                    <label className="btn btn-secondary" style={{ fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Upload size={13} /> Choose File
                      <input
                        type="file"
                        accept=".csv,.txt"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const text = event.target?.result || '';
                            const extracted = text
                              .match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                            if (extracted.length > 0) {
                              const unique = Array.from(new Set(extracted.map((e) => e.toLowerCase())));
                              setWhitelistRestrictedToggle(true);
                              setWhitelistEmailsText((prev) =>
                                prev ? `${prev}\n${unique.join('\n')}` : unique.join('\n')
                              );
                              toast.success('Sheet Imported', `Extracted ${unique.length} email addresses from sheet.`);
                            } else {
                              toast.warning('No Emails Found', 'Could not detect valid email addresses in uploaded file.');
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Total Enrolled:{' '}
                <strong style={{ color: 'var(--color-primary)' }}>
                  {whitelistParticipantIds.length +
                    whitelistEmailsText
                      .split(/[\n,;]+/)
                      .map((e) => e.trim())
                      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).length}
                </strong>{' '}
                attendees
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setShowWhitelistModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWhitelist}
                  className="btn btn-primary"
                >
                  Save Whitelist Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 6: EDIT ACTIVITY
         ════════════════════════════════════════════════════════════════════════ */}
      {showEditActivityModal && editingActivity && (
        <div className="modal-backdrop" {...editActivityModalBackdrop.getBackdropProps()}>
          <div className="modal-content" style={{ maxWidth: '540px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-primary">
                    <Edit2 size={11} /> Edit Activity
                  </span>
                  <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={11} fill="currentColor" /> {activityEditForm.points || 0} pts
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {editingActivity.name}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setShowEditActivityModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEditedActivity();
              }}
              className="modal-body"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Activity Title *</label>
                <input
                  type="text"
                  required
                  value={activityEditForm.name}
                  onChange={(e) => setActivityEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Keynote Speech, Hands-on Workshop, Day 1 Check-In"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={13} style={{ color: 'var(--color-primary)' }} />
                    Activity Type
                  </label>
                  <div className="ops-select-wrapper">
                    <select
                      value={activityEditForm.type}
                      onChange={(e) => setActivityEditForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="form-select"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="check-in">General Check-In</option>
                      <option value="talk">Talk / Keynote</option>
                      <option value="session">Technical Session</option>
                      <option value="meal">Meal / Catering</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="competition">Competition</option>
                      <option value="booth">Exhibition Booth</option>
                      <option value="general">Other Activity</option>
                      {!['workshop', 'check-in', 'talk', 'session', 'meal', 'hackathon', 'competition', 'booth', 'general'].includes(activityEditForm.type) && (
                        <option value={activityEditForm.type}>{activityEditForm.type}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Award size={13} style={{ color: '#f59e0b' }} />
                    Points Awarded
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={activityEditForm.points}
                    onChange={(e) => setActivityEditForm((prev) => ({ ...prev, points: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {activityEditForm.checkInMode === 'self_service' ? (
                      <Smartphone size={13} style={{ color: '#a855f7' }} />
                    ) : (
                      <Camera size={13} style={{ color: 'var(--color-primary)' }} />
                    )}
                    Check-In Mode
                  </label>
                  <span
                    className={`badge ${activityEditForm.checkInMode === 'self_service' ? 'badge-purple' : 'badge-primary'}`}
                    style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}
                  >
                    {activityEditForm.checkInMode === 'self_service' ? 'Self-Service Kiosk' : 'Staff Scanner'}
                  </span>
                </div>

                <div className="ops-select-wrapper">
                  <select
                    value={activityEditForm.checkInMode}
                    onChange={(e) => setActivityEditForm((prev) => ({ ...prev, checkInMode: e.target.value }))}
                    className="form-select"
                  >
                    <option value="staff_scanner">Staff QR Scanner (Organizer scans attendee tickets)</option>
                    <option value="self_service">Self-Service Kiosk (Attendee scans room projector QR)</option>
                  </select>
                </div>

                <div className={`ops-mode-preview ${activityEditForm.checkInMode === 'self_service' ? 'ops-mode-preview--kiosk' : 'ops-mode-preview--scanner'}`}>
                  {activityEditForm.checkInMode === 'self_service' ? (
                    <>
                      <Smartphone size={15} style={{ color: '#a855f7', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: 'var(--color-text)' }}>Kiosk Display Mode:</strong> Attendees scan the activity's projected QR code with their mobile devices and enter their registered email to self check-in.
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={15} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: 'var(--color-text)' }}>Staff Scanner Mode:</strong> Authorized organizers and scanners scan attendees' personalized QR badges from the Operations Studio Scanner desk.
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={activityEditForm.description}
                  onChange={(e) => setActivityEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief note about this session or check-in rules..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* QR Key Information */}
              <div
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Activity Key</span>
                  <code style={{ fontSize: '0.82rem', color: 'var(--color-primary)' }}>{editingActivity.qrId}</code>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleCopyKey(editingActivity.qrId, e)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  {copiedKey === editingActivity.qrId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  {copiedKey === editingActivity.qrId ? 'Copied' : 'Copy Key'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEditActivityModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 7: ASSIGN AUTHORIZED SCANNERS
         ════════════════════════════════════════════════════════════════════════ */}
      {showScannersModal && (
        <div className="modal-backdrop" {...scannersModalBackdrop.getBackdropProps()}>
          <div className="modal-content ops-scanners-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header ops-scanners-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span className="badge badge-primary">
                    <UserCheck size={11} /> Access Control
                  </span>
                  <span className="badge badge-accent">
                    {scannersList.length} Assigned
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Assign Scanners
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Designate team members authorized to scan attendee tickets for {drawerEvent?.name || 'this event'}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setShowScannersModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="ops-scanners-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Search user bar */}
              <div>
                <label className="form-label">Search Users</label>
                <div className="ops-search-input-wrap">
                  <Search size={15} />
                  <input
                    type="text"
                    value={scannerUserSearch}
                    onChange={(e) => setScannerUserSearch(e.target.value)}
                    placeholder="Search registered members by name or email..."
                    className="form-input ops-search-input"
                    style={{ fontSize: '0.84rem' }}
                  />
                  {searchingUsers && (
                    <RefreshCw size={14} className="ops-spin" style={{ position: 'absolute', right: '0.75rem', color: 'var(--color-text-muted)', zIndex: 1 }} />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {scannerSearchResults.length > 0 && (
                  <div className="ops-scanner-search-results">
                    {scannerSearchResults.map((u) => {
                      const uId = u.id || u._id;
                      const isAdded = scannersList.some((s) => s.id === uId);

                      return (
                        <div
                          key={uId}
                          className="ops-scanner-user-item"
                          onClick={() => !isAdded && handleAddScannerUser(u)}
                          style={{ opacity: isAdded ? 0.6 : 1, cursor: isAdded ? 'default' : 'pointer' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name || u.fullName || u.email}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email} {u.role ? `• ${u.role}` : ''}</div>
                          </div>
                          {isAdded ? (
                            <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                              <Check size={11} /> Added
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                            >
                              <Plus size={11} /> Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {scannerUserSearch.trim().length >= 2 && !searchingUsers && scannerSearchResults.length === 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                    No users matching "{scannerUserSearch}" found.
                  </div>
                )}
              </div>

              {/* Currently Assigned Scanners */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Assigned Scanner Staff ({scannersList.length})
                  </label>
                  {scannersList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setScannersList([])}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {scannersList.length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem 1.25rem',
                      background: 'var(--color-bg)',
                      border: '1px dashed var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'var(--color-surface, #ffffff)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <Info size={18} />
                    </div>
                    <p style={{ margin: '0 0 0.15rem', fontWeight: 600, fontSize: '0.86rem', color: 'var(--color-text)' }}>
                      No specific scanners assigned
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', maxWidth: 360, lineHeight: 1.45 }}>
                      When this list is empty, any organizer, officer, or admin can scan tickets for this event.
                    </span>
                  </div>
                ) : (
                  <div className="ops-assigned-scanners-list">
                    {scannersList.map((scanner) => {
                      const isUnresolved = !scanner.loading && (!scanner.name && !scanner.email);
                      const shortId = scanner.id && typeof scanner.id === 'string' && scanner.id.length > 12
                        ? `${scanner.id.slice(0, 8)}...${scanner.id.slice(-4)}`
                        : (scanner.id || 'ID');
                      const displayName = scanner.name || (isUnresolved ? 'Authorized Member' : shortId);
                      const initial = (scanner.name || (isUnresolved ? 'M' : '?')).charAt(0).toUpperCase();

                      return (
                        <div key={scanner.id} className="ops-scanner-chip">
                          <div className="ops-scanner-chip__avatar">
                            {scanner.loading ? (
                              <RefreshCw size={11} className="ops-spin" />
                            ) : (
                              initial
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {scanner.loading ? 'Resolving profile…' : displayName}
                              </span>
                              {isUnresolved && (
                                <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontFamily: 'monospace' }}>
                                  {shortId}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {scanner.loading
                                ? 'Fetching details…'
                                : (scanner.email || (isUnresolved ? 'Assigned via User ID' : ''))}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveScannerUser(scanner.id)}
                            className="ops-scanner-chip__remove"
                            title="Remove scanner permission"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {scannersList.length === 0 ? '' : `${scannersList.length} Authorized Scanner(s)`}
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setShowScannersModal(false)}
                  className="btn btn-secondary"
                  disabled={savingScanners}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignedScanners}
                  disabled={savingScanners}
                  className="btn btn-primary"
                >
                  {savingScanners ? 'Saving...' : 'Save Assigned Scanners'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          EVENT PICKER & SWITCHER MODAL
         ════════════════════════════════════════════════════════════════════════ */}
      {showEventPicker && (
        <div className="ops-drawer-overlay" onClick={() => setShowEventPicker(false)}>
          <div className="ops-event-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ops-event-picker-header">
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Switch Event Context
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Select an event to load its activities, attendees, and reception scanner
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setShowEventPicker(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="ops-event-picker-toolbar">
              <div className="ops-search-input-wrap">
                <Search size={15} />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search by title, location, or venue..."
                  className="form-input ops-search-input"
                  style={{ fontSize: '0.82rem' }}
                  autoFocus
                />
              </div>

              <div className="ops-event-picker-filters">
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginRight: '0.2rem' }}>
                  Filter:
                </span>
                {[
                  { id: 'active', label: 'Active Events' },
                  { id: 'past', label: 'Past Events' },
                  { id: 'archived', label: 'Archived' },
                  { id: 'all', label: 'All' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`ops-event-picker-pill ${pickerStatusFilter === f.id ? 'ops-event-picker-pill--active' : ''}`}
                    onClick={() => setPickerStatusFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ops-event-picker-list">
              {pickerLoading ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  <RefreshCw size={24} className="spin-slow" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.84rem', margin: 0 }}>Loading events...</p>
                </div>
              ) : filteredPickerEvents.length > 0 ? (
                filteredPickerEvents.map((ev) => {
                  const evId = ev._id || ev.id;
                  const isCur = evId === selectedEventId;
                  const reg = getEventRegistrationState(ev);

                  return (
                    <div
                      key={evId}
                      className={`ops-event-picker-item ${isCur ? 'ops-event-picker-item--active' : ''}`}
                      onClick={() => handleSelectPickerEvent(ev)}
                    >
                      <div className="ops-event-picker-item__info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                            {ev.category || 'General'}
                          </span>
                          <span className={`badge ${reg.badgeClass}`} style={{ fontSize: '0.68rem' }}>
                            {reg.label}
                          </span>
                          {ev.status === 'archived' && (
                            <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>Archived</span>
                          )}
                        </div>
                        <div className="ops-event-picker-item__title">{ev.name}</div>
                        <div className="ops-event-picker-item__meta">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12} /> {formatEventDateRange(ev.startDate, ev.endDate, ev.date)}</span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12} /> {ev.venue || ev.location || 'Faculty'}</span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Users size={12} /> {ev.participantCount || ev.registeredCount || 0} enrolled</span>
                        </div>
                      </div>

                      {isCur ? (
                        <span className="badge badge-accent" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          <Check size={12} /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  <p style={{ margin: '0 0 0.35rem', fontWeight: 600 }}>No events found</p>
                  <span style={{ fontSize: '0.8rem' }}>Try adjusting your search or status filter</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ATTENDEES SHEET IMPORT MODAL (Append vs Replace Modes)
         ════════════════════════════════════════════════════════════════════════ */}
      {showImportSheetModal && (
        <div className="studio-drawer-overlay ops-modal--drawer-top" {...importSheetModalBackdrop.getBackdropProps()}>
          <div className="studio-drawer-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="studio-drawer-header">
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Import Attendees Sheet
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Target Event: <strong>{selectedEvent?.name || drawerEvent?.name || 'Selected Event'}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setShowImportSheetModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="studio-drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
              {/* Mode Selection Cards */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', fontWeight: 700 }}>
                  Select Import Mode *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    onClick={() => setImportMode('append')}
                    style={{
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: importMode === 'append' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: importMode === 'append' ? 'rgba(var(--color-primary-rgb, 0, 98, 155), 0.06)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                      />
                      <strong style={{ fontSize: '0.88rem', color: 'var(--color-text)' }}>Append Mode</strong>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Adds new participants and updates existing ones matching by email. Existing roster is preserved.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode('replace')}
                    style={{
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: importMode === 'replace' ? '2px solid var(--color-danger, #ef4444)' : '1px solid var(--color-border)',
                      background: importMode === 'replace' ? 'rgba(239, 68, 68, 0.06)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                      />
                      <strong style={{ fontSize: '0.88rem', color: 'var(--color-danger, #ef4444)' }}>Replace Mode</strong>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                      ⚠️ Wipes existing attendees for this event and replaces the roster entirely with this sheet.
                    </p>
                  </div>
                </div>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.4rem', fontWeight: 700 }}>
                  Upload CSV File *
                </label>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.75rem',
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: 'var(--color-surface)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleSheetFileSelect}
                    style={{ display: 'none' }}
                  />
                  <FileSpreadsheet size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
                  {selectedSheetFile ? (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                        {selectedSheetFile.name}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        {(selectedSheetFile.size / 1024).toFixed(1)} KB • Click to choose another file
                      </div>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                        Click or drag & drop CSV attendee roster
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Expected columns: Name, Email, Phone, Faculty, University, etc.
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Sheet Preview Table (First 5 Rows) */}
              {sheetPreviewRows.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                      Sheet Preview ({sheetPreviewCols.length} Columns Detected)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      Showing first {sheetPreviewRows.length} rows
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)'}}>
                    <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--color-bg-alt)', position: 'sticky', top: 0 }}>
                        <tr>
                          {sheetPreviewCols.map((col, idx) => (
                            <th key={idx} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', borderBottom: '1px solid var(--color-border)', fontWeight: 700 }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sheetPreviewRows.map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} style={{ padding: '0.35rem 0.6rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                {cell || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Result Alert */}
              {importResult && (
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: importResult.errors?.length ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    border: `1px solid ${importResult.errors?.length ? 'var(--color-danger, #ef4444)' : 'var(--color-success, #22c55e)'}`,
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: importResult.errors?.length ? 'var(--color-danger, #ef4444)' : 'var(--color-success, #22c55e)', marginBottom: '0.25rem' }}>
                    {importResult.message || 'Import Processed'}
                  </div>
                  <div style={{ color: 'var(--color-text)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>Total Processed: <strong>{importResult.processed !== undefined ? importResult.processed : ((importResult.successful || 0) + (importResult.updated || 0))}</strong></span>
                    <span>•</span>
                    <span>New Added: <strong>{importResult.successful || 0}</strong></span>
                    <span>•</span>
                    <span>Updated: <strong>{importResult.updated || 0}</strong></span>
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--color-danger, #ef4444)', fontSize: '0.78rem' }}>
                      Errors encountered:
                      <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                        {importResult.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{typeof err === 'string' ? err : err.error || JSON.stringify(err)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="studio-drawer-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={importingSheet}
                onClick={() => setShowImportSheetModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={`btn ${importMode === 'replace' ? 'btn-danger' : 'btn-primary'}`}
                disabled={!selectedSheetFile || importingSheet}
                onClick={handleUploadAttendeesSheet}
              >
                {importingSheet ? (
                  <>
                    <RefreshCw size={14} className="ops-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Start {importMode === 'replace' ? 'Replace' : 'Append'} Import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          CLICK-TO-ENLARGE LIGHTBOX MODAL
         ════════════════════════════════════════════════════════════════════════ */}
      {lightboxImage && (
        <div
          className="ops-lightbox-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1600,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          {...lightboxBackdrop.getBackdropProps()}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',

              maxHeight: '92vh',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                {lightboxImage.title || 'Event Cover Image'}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-icon btn-sm"
                onClick={() => setLightboxImage(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '1rem' }}>
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title || 'Enlarged Banner'}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 8: PUBLIC EVENT LEADERBOARD SHARING & QR
         ════════════════════════════════════════════════════════════════════════ */}
      {showLeaderboardShareModal && (
        <div className="modal-backdrop" onClick={() => setShowLeaderboardShareModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '520px', width: '92vw', background: 'var(--color-card)', color: 'var(--color-text)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                  }}
                >
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0, color: 'var(--color-text)' }}>
                    Event Standings & Leaderboard
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    {drawerEvent?.name || selectedEvent?.name || 'Event Leaderboard'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowLeaderboardShareModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
              {/* QR Code Presentation Box with Enlarge / Fullscreen Button */}
              <div
                ref={qrFullscreenRef}
                style={
                  isQrFullscreen
                    ? {
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        background: '#070a13',
                        color: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        gap: '1.5rem',
                      }
                    : {
                        background: 'var(--color-bg-alt, rgba(0,0,0,0.03))',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '0.75rem',
                        position: 'relative',
                      }
                }
              >
                {/* Enlarge / Fullscreen Exit Button */}
                <button
                  type="button"
                  onClick={toggleQrFullscreen}
                  className="btn btn-secondary btn-xs btn-icon"
                  style={{
                    position: 'absolute',
                    top: isQrFullscreen ? '1.5rem' : '0.75rem',
                    right: isQrFullscreen ? '1.5rem' : '0.75rem',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                  title={isQrFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand QR Code to Fullscreen'}
                >
                  {isQrFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={15} />}
                </button>

                {isQrFullscreen && (
                  <div style={{ textAlign: 'center', maxWidth: 650 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      IEEE Menoufia Student Branch
                    </span>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.4rem 0 0', color: '#ffffff' }}>
                      {drawerEvent?.name || selectedEvent?.name || 'Event Standings & Leaderboard'}
                    </h1>
                  </div>
                )}

                <div
                  style={{
                    background: '#ffffff',
                    padding: isQrFullscreen ? '24px' : '12px',
                    borderRadius: isQrFullscreen ? '20px' : 'var(--radius-md)',
                    boxShadow: isQrFullscreen ? '0 12px 40px rgba(0,0,0,0.5)' : '0 4px 15px rgba(0,0,0,0.1)',
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=${isQrFullscreen ? '500x500' : '200x200'}&margin=${isQrFullscreen ? '12' : '8'}&data=${encodeURIComponent(
                      `${window.location.origin}/leaderboard/${drawerEvent?._id || drawerEvent?.id || selectedEventId}`
                    )}`}
                    alt="Event Leaderboard QR Code"
                    width={isQrFullscreen ? 380 : 180}
                    height={isQrFullscreen ? 380 : 180}
                    style={{ display: 'block', border: 0, maxWidth: '100%', height: 'auto' }}
                  />
                </div>

                <div
                  style={{
                    fontSize: isQrFullscreen ? '1.15rem' : '0.78rem',
                    fontWeight: isQrFullscreen ? 600 : 400,
                    color: isQrFullscreen ? '#94a3b8' : 'var(--color-text-muted)',
                    maxWidth: isQrFullscreen ? 550 : 360,
                    textAlign: 'center',
                  }}
                >
                  {isQrFullscreen
                    ? 'Scan with your smartphone camera to view live points, honors podium & attendee standings.'
                    : 'Scan to view live points, top honors.'}
                </div>
              </div>

              {/* Public URL Field with Copy Button */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem', color: 'var(--color-text)', fontWeight: 600 }}>
                  Public Shareable URL
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    className="form-input"
                    style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}
                    value={`${window.location.origin}/leaderboard/${drawerEvent?._id || drawerEvent?.id || selectedEventId}`}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const url = `${window.location.origin}/leaderboard/${drawerEvent?._id || drawerEvent?.id || selectedEventId}`;
                      navigator.clipboard.writeText(url);
                      setLeaderboardCopied(true);
                      setTimeout(() => setLeaderboardCopied(false), 2500);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
                  >
                    {leaderboardCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{leaderboardCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)' }}>
              <a
                href={`/leaderboard/${drawerEvent?._id || drawerEvent?.id || selectedEventId}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
              >
                <ExternalLink size={13} />
                <span>Open in New Tab</span>
              </a>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=15&data=${encodeURIComponent(
                    `${window.location.origin}/leaderboard/${drawerEvent?._id || drawerEvent?.id || selectedEventId}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  download={`leaderboard-qr-${drawerEvent?._id || selectedEventId}.png`}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={13} />
                  <span>Download QR</span>
                </a>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowLeaderboardShareModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
