import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';
import UserProfileModal from '../components/profile/UserProfileModal';
import { api } from '../services/api';
import '../styles/hr.css';
import '../styles/pr.css';
import {
  Users,
  Briefcase,
  ClipboardList,
  ListChecks,
  Plus,
  Search,
  Calendar,
  X,
  User,
  UserPlus,
  UserMinus,
  UserX,
  Shield,
  ShieldAlert,
  Star,
  Check,
  Clock,
  Eye,
  FileText,
  Download,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  BarChart3,
  Loader2,
  RefreshCw,
  Edit2,
  GripVertical,
  Filter,
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
  MoreVertical,
  Mail,
  Send,
  MessageSquare,
  Sparkles,
  Globe,
  CheckCircle2,
  Copy,
  Smartphone,
  Monitor,
  CheckCircle,
  Settings,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Link2,
  Minus,
  RotateCcw,
  Code,
  ChevronRight,
} from 'lucide-react';

const BASE_PIPELINE_STAGES = [
  { key: 'applied', label: 'Applied', color: '#3b82f6' },
  { key: 'screening', label: 'Screening', color: '#f59e0b' },
  { key: 'interview', label: 'Interview', color: '#8b5cf6' },
  { key: 'final_review', label: 'Final Review', color: '#10b981' },
];

const STAGE_NEXT = {
  applied: 'screening',
  screening: 'interview',
  interview: 'final_review',
};

const DEFAULT_ONBOARDING_CONFIG = {
  subject: 'Welcome to {{branch.name}}! 🎉 Your Next Steps',
  headline: 'Welcome to the {{candidate.committee}} Team!',
  templateMode: 'standard', // 'standard' | 'full'
  editorMode: 'markdown',   // 'markdown' | 'html'
  body: 'We are delighted to confirm your acceptance as an active volunteer member of **{{branch.name}}**.\n\nYour passion, drive, and technical acumen made your application to **{{candidate.committee}}** stand out. We look forward to achieving great milestones together!',
  whatsappUrl: 'https://chat.whatsapp.com/sample-committee-invite',
  discordUrl: 'https://discord.gg/sample-ieee-branch',
  orientationDate: 'Saturday, Oct 17, 2026 at 6:00 PM (Online)',
  checklistSteps: [
    { id: 's1', title: 'Complete Your Portal Profile', desc: 'Add your biography, avatar photo, and social links.' },
    { id: 's2', title: 'Join Our WhatsApp Community', desc: 'Connect with your team lead and fellow committee members.' },
    { id: 's3', title: 'Attend General Meeting', desc: 'Learn about ieee, branch culture, and annual milestones.' },
    { id: 's4', title: 'Explore Committee Workspace', desc: 'Check your assigned projects, sprint tasks, and resources.' },
  ],
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDatetimeForInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Markdown to HTML converter for email previews ──────────────────────────
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

// ── Clean empty email sections & buttons if variables evaluate to blank ────
function cleanEmptyEmailSections(html = '') {
  if (!html || typeof html !== 'string') return '';

  let cleaned = html;

  // 1. Remove <a> tags with empty, hash, null, or undefined href
  cleaned = cleaned.replace(/<a\b[^>]*\bhref=["'](?:#|undefined|null|)?["'][^>]*>[\s\S]*?<\/a>/gi, '');

  // 2. Remove CTA button container if it contains no <a> tags left
  cleaned = cleaned.replace(/<div\b[^>]*data-section=["']cta-buttons["'][^>]*>([\s\S]*?)<\/div>/gi, (match, inner) => {
    if (!/<a\b/i.test(inner)) {
      return '';
    }
    return match;
  });
  cleaned = cleaned.replace(/<div\b[^>]*style=["'][^"']*text-align:\s*center[^"']*["'][^>]*>\s*<\/div>/gi, '');

  // 3. Remove orientation block if date is empty or '—'
  cleaned = cleaned.replace(/<div\b[^>]*data-section=["']orientation["'][^>]*>([\s\S]*?)<\/div>/gi, (match, inner) => {
    const spanMatch = inner.match(/<span\b[^>]*>([\s\S]*?)<\/span>/i);
    if (!spanMatch || !spanMatch[1] || !spanMatch[1].trim() || spanMatch[1].trim() === '—') {
      return '';
    }
    return match;
  });
  cleaned = cleaned.replace(/<div\b[^>]*style=["'][^"']*rgba\(0,\s*98,\s*155,\s*0\.07\)[^"']*["'][^>]*>[\s\S]*?<span\b[^>]*>\s*(?:—)?\s*<\/span>[\s\S]*?<\/div>/gi, '');

  // 4. Remove empty description spans
  cleaned = cleaned.replace(/<span\b[^>]*style=["'][^"']*color:\s*#64748b[^"']*["'][^>]*>\s*<\/span>/gi, '');

  // 5. Remove checklist rows with empty <strong> title
  cleaned = cleaned.replace(/<tr\b[^>]*>[\s\S]*?<strong\b[^>]*>\s*<\/strong>[\s\S]*?<\/tr>/gi, '');

  // 6. Re-number checklist badges sequentially (1, 2, 3...)
  let stepIndex = 1;
  cleaned = cleaned.replace(/(<tr\b[^>]*>[\s\S]*?<(?:td|div)\b[^>]*?(?:background-color:#00629b|background:#00629b)[^>]*>)\s*\d+\s*(<\/(?:td|div)>[\s\S]*?<\/tr>)/gi, (match, before, after) => {
    return `${before}${stepIndex++}${after}`;
  });

  // 7. Remove checklist section if table has no <tr> rows left
  cleaned = cleaned.replace(/<div\b[^>]*data-section=["']checklist["'][^>]*>([\s\S]*?)<\/div>/gi, (match, inner) => {
    if (!/<tr\b/i.test(inner)) {
      return '';
    }
    return match;
  });
  cleaned = cleaned.replace(/<div\b[^>]*style=["'][^"']*margin-bottom:\s*24px[^"']*["'][^>]*>[\s\S]*?<table\b[^>]*>\s*<\/table>[\s\S]*?<\/div>/gi, '');

  return cleaned;
}

// ── Variable interpolation for email preview ───────────────────────────────
function interpolateVariables(template = '', context = {}) {
  if (!template) return '';
  const replaced = template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, rawKey) => {
    const lowerKey = rawKey.toLowerCase();
    if (context[rawKey] !== undefined && context[rawKey] !== null) return String(context[rawKey]);
    if (context[lowerKey] !== undefined && context[lowerKey] !== null) return String(context[lowerKey]);
    if (context.customFields && typeof context.customFields === 'object') {
      if (context.customFields[rawKey] !== undefined && context.customFields[rawKey] !== null) {
        return String(context.customFields[rawKey]);
      }
      if (context.customFields[lowerKey] !== undefined && context.customFields[lowerKey] !== null) {
        return String(context.customFields[lowerKey]);
      }
    }
    if (lowerKey === 'candidate.name' || lowerKey === 'user.name' || lowerKey === 'name') {
      return context.name || 'Candidate Name';
    }
    if (lowerKey === 'candidate.email' || lowerKey === 'user.email' || lowerKey === 'email') {
      return context.email || 'candidate@ieee.local';
    }
    if (lowerKey === 'candidate.committee' || lowerKey === 'committee') {
      return context.committeeName || 'Selected Committee';
    }
    if (lowerKey === 'candidate.stage' || lowerKey === 'stage') {
      return context.stage || 'Interview';
    }
    if (lowerKey === 'branch.name' || lowerKey === 'branch') {
      return 'IEEE Menoufia Student Branch';
    }
    return match;
  });

  return cleanEmptyEmailSections(replaced);
}

function isFullHtmlDocument(str = '') {
  if (typeof str !== 'string') return false;
  return /^\s*<!DOCTYPE\s+html/i.test(str) || /^\s*<html/i.test(str);
}

// ── Default standard IEEE Menoufia email wrapper ──────────────────────────
function getDefaultEmailTemplate(contentHtml = '', title = 'IEEE Menoufia Student Branch') {
  const bodyContent = contentHtml && contentHtml.trim()
    ? contentHtml
    : '<p style="margin:0 0 16px;line-height:1.65;color:#334155;">Hello {{candidate.name}},</p>\n<p style="margin:0 0 16px;line-height:1.65;color:#334155;">Write your message here...</p>';

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
        <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;margin-bottom:4px;">
          IEEE MENOUFIA STUDENT BRANCH
        </div>
        <div style="font-size:12px;font-weight:600;color:#93c5fd;letter-spacing:0.08em;text-transform:uppercase;">
          Human Resources & Talent Management
        </div>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding:32px 28px;font-size:15px;line-height:1.65;color:#334155;">
        ${bodyContent}
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
</html>`;
}

function upgradeLegacyOnboardingHtml(html = '') {
  if (!html || typeof html !== 'string') return '';
  if (!isFullHtmlDocument(html)) return html;

  let upgraded = html;
  if (!upgraded.includes('{{checklist.option1}}')) {
    upgraded = upgraded
      .replace(/Complete Your Portal Profile/g, '{{checklist.option1}}')
      .replace(/Add your biography, avatar photo, and social links\./g, '{{checklist.option1.desc}}')
      .replace(/Join Our WhatsApp Community/g, '{{checklist.option2}}')
      .replace(/Connect with your team lead and fellow committee members\./g, '{{checklist.option2.desc}}')
      .replace(/Attend General Meeting/g, '{{checklist.option3}}')
      .replace(/Learn about ieee, branch culture, and annual milestones\./g, '{{checklist.option3.desc}}')
      .replace(/Explore Committee Workspace/g, '{{checklist.option4}}')
      .replace(/Check your assigned projects, sprint tasks, and resources\./g, '{{checklist.option4.desc}}');
  }

  // Replace any div-based circular badges or older 24px badges with email-safe 26px table cell circle badges
  upgraded = upgraded.replace(
    /<div\b[^>]*style=["'][^"']*border-radius:\s*50%[^"']*["'][^>]*>\s*([0-9]+)\s*<\/div>/gi,
    '<table cellpadding="0" cellspacing="0" border="0" width="26" height="26" style="width:26px;height:26px;border-collapse:separate;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:0;padding:0;"><tr><td align="center" valign="middle" width="26" height="26" style="width:26px;height:26px;background-color:#00629b;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-align:center;line-height:26px;padding:0;margin:0;mso-line-height-rule:exactly;box-sizing:border-box;">$1</td></tr></table>'
  );
  upgraded = upgraded.replace(
    /<table\b[^>]*width="24"[^>]*>[\s\S]*?<td\b[^>]*style=["'][^"']*background-color:\s*#00629b[^"']*["'][^>]*>\s*([0-9]+)\s*<\/td>[\s\S]*?<\/table>/gi,
    '<table cellpadding="0" cellspacing="0" border="0" width="26" height="26" style="width:26px;height:26px;border-collapse:separate;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:0;padding:0;"><tr><td align="center" valign="middle" width="26" height="26" style="width:26px;height:26px;background-color:#00629b;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-align:center;line-height:26px;padding:0;margin:0;mso-line-height-rule:exactly;box-sizing:border-box;">$1</td></tr></table>'
  );

  return upgraded;
}

// ── Default welcome & onboarding email generator ───────────────────────────
function getDefaultWelcomeEmailTemplate({
  memberName = '{{candidate.name}}',
  committeeName = '{{candidate.committee}}',
  headline = 'Welcome to the {{candidate.committee}} Team! 🎉',
  welcomeMessage = '',
  whatsappUrl = '{{channels.whatsapp}}',
  discordUrl = '{{channels.discord}}',
  orientationDate = '{{orientation.date}}',
} = {}) {
  const orientationBlock = orientationDate && orientationDate.trim()
    ? `
        <div data-section="orientation" style="background:rgba(0,98,155,0.07);border:1px solid rgba(0,98,155,0.2);border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;">
          <div>
            <strong style="color:#00629b;font-size:13px;display:block;margin-bottom:2px;">📅 General Meeting</strong>
            <span style="font-size:13px;color:#334155;">${orientationDate}</span>
          </div>
        </div>`
    : '';

  const defaultSteps = [
    { num: 1, titleVar: '{{checklist.option1}}', descVar: '{{checklist.option1.desc}}' },
    { num: 2, titleVar: '{{checklist.option2}}', descVar: '{{checklist.option2.desc}}' },
    { num: 3, titleVar: '{{checklist.option3}}', descVar: '{{checklist.option3.desc}}' },
    { num: 4, titleVar: '{{checklist.option4}}', descVar: '{{checklist.option4.desc}}' },
  ];

  const stepsList = defaultSteps.map((s) => `
      <tr data-step="${s.num}" style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 0;vertical-align:top;width:34px;" width="34">
          <table cellpadding="0" cellspacing="0" border="0" width="26" height="26" style="width:26px;height:26px;border-collapse:separate;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:0;padding:0;">
            <tr>
              <td align="center" valign="middle" width="26" height="26" style="width:26px;height:26px;background-color:#00629b;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-align:center;line-height:26px;padding:0;margin:0;mso-line-height-rule:exactly;box-sizing:border-box;">
                ${s.num}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:10px 0 10px 8px;">
          <strong style="color:#0f172a;font-size:14px;display:block;margin-bottom:2px;">${s.titleVar}</strong>
          <span style="color:#64748b;font-size:13px;line-height:1.4;">${s.descVar}</span>
        </td>
      </tr>
  `).join('');

  const checklistBlock = `
        <!-- Checklist Section -->
        <div data-section="checklist" style="margin-bottom:24px;">
          <h4 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#00629b;margin:0 0 12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">
            Your Onboarding Checklist
          </h4>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${stepsList}
          </table>
        </div>`;

  const whatsappBtn = whatsappUrl && whatsappUrl.trim()
    ? `<a href="${whatsappUrl}" target="_blank" data-btn="whatsapp" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 18px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none;margin:0 6px 8px;">💬 Join Committee WhatsApp</a>`
    : '';

  const discordBtn = discordUrl && discordUrl.trim()
    ? `<a href="${discordUrl}" target="_blank" data-btn="discord" style="display:inline-block;background:#5865F2;color:#ffffff;padding:10px 18px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none;margin:0 6px 8px;">🎮 Join Discord Server</a>`
    : '';

  const buttonsBlock = (whatsappBtn || discordBtn)
    ? `
        <!-- Community CTA Buttons -->
        <div data-section="cta-buttons" style="text-align:center;padding:12px 0 8px;">
          ${whatsappBtn}
          ${discordBtn}
        </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to {{branch.name}}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.07);border:1px solid #e2e8f0;">
    <!-- Welcome Banner Header -->
    <tr>
      <td style="background:linear-gradient(135deg, #002F4C 0%, #00629B 60%, #00A6C4 100%);padding:32px 24px;text-align:center;color:#ffffff;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#7dd3fc;margin-bottom:6px;">
          Official Welcome & Onboarding
        </div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;margin-bottom:8px;color:#ffffff;">
          ${headline}
        </div>
        <div style="display:inline-block;background:rgba(255,255,255,0.2);backdrop-filter:blur(4px);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#ffffff;">
          ${committeeName}
        </div>
      </td>
    </tr>

    <!-- Body & Welcome Message -->
    <tr>
      <td style="padding:28px 24px 20px;font-size:15px;line-height:1.65;color:#334155;">
        <p style="margin:0 0 16px;font-size:16px;color:#0f172a;">
          Dear <strong>${memberName}</strong>,
        </p>
        <div style="margin:0 0 20px;color:#334155;line-height:1.65;">
          ${renderMarkdownToHtml(welcomeMessage || 'We are delighted to confirm your acceptance as an active volunteer member of **{{branch.name}}**.\n\nYour passion, drive, and technical acumen made your application to **{{candidate.committee}}** stand out. We look forward to achieving great milestones together!')}
        </div>

        ${orientationBlock}

        ${checklistBlock}

        ${buttonsBlock}
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
</html>`;
}

// ── Application CSV Export Helper ──────────────────────────────────────────
function exportApplicationsToCsv(appList = [], filename = 'ieee_hr_applications.csv', getCommitteeName) {
  if (!appList || appList.length === 0) {
    return false;
  }

  const headers = [
    'Application ID',
    'Candidate Name',
    'Email',
    'Phone',
    'Committee',
    'Campaign',
    'Current Stage',
    'Score / Rating',
    'Academic Year',
    'Faculty',
    'Department',
    'Relevant Skills',
    'Motivation Statement',
    'Portfolio / Profile URL',
    'CV / Resume URL',
    'Submitted Date',
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""').replace(/\r?\n/g, ' ');
    return `"${clean}"`;
  };

  const rows = appList.map((app) => {
    const answers = app.answers || {};
    const name = answers.fullName || app.applicantName || app.name || 'Unknown';
    const email = app.applicantEmail || app.email || answers.email || '—';
    const phone = answers.phone || app.phone || '—';
    const committee = app.committeeName || (getCommitteeName ? getCommitteeName(app.committeeId) : app.committeeId) || 'General';
    const campaign = app.campaignTitle || 'Recruitment Campaign';
    const stage = (app.currentStage || app.status || 'applied').toUpperCase();
    const score = app.score !== undefined && app.score !== null ? app.score : '—';
    const year = answers.academicYear || '—';
    const faculty = answers.faculty || '—';
    const dept = answers.department || '—';
    const skills = answers.skills || '—';
    const motivation = answers.motivation || '—';
    const portfolio = answers.portfolio || '—';
    const cvUrl = answers.cvUrl || '—';
    const submittedDate = app.submittedAt || app.createdAt ? new Date(app.submittedAt || app.createdAt).toLocaleString() : '—';

    return [
      escapeCsv(app.id),
      escapeCsv(name),
      escapeCsv(email),
      escapeCsv(phone),
      escapeCsv(committee),
      escapeCsv(campaign),
      escapeCsv(stage),
      escapeCsv(score),
      escapeCsv(year),
      escapeCsv(faculty),
      escapeCsv(dept),
      escapeCsv(skills),
      escapeCsv(motivation),
      escapeCsv(portfolio),
      escapeCsv(cvUrl),
      escapeCsv(submittedDate),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export default function HRStudio() {
  const { user } = useAuthStore();
  const toast = useToastStore();

  const isGlobalAdminOrOfficer = user?.scopeType === 'global' && ['admin', 'officer'].includes(user?.role);
  const isHrLead = user?.role === 'lead' && user?.committeeSlug === 'hr';
  const isHrAuthorized = isGlobalAdminOrOfficer || isHrLead;

  if (!isHrAuthorized) {
    return (
      <div className="hr-studio" style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-4)' }}>
        <div className="join-card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-6)' }}>
            The HR Studio is restricted to Global Administrators, Officers, and Human Resources Committee Leads.
          </p>
          <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const VALID_HR_TABS = ['campaigns', 'pipeline', 'members', 'onboarding'];
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = VALID_HR_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'campaigns';
  const [activeTab, setActiveTabState] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (VALID_HR_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [searchParams]);

  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newTab === 'campaigns') {
          next.delete('tab');
        } else {
          next.set('tab', newTab);
        }
        return next;
      },
      { replace: true }
    );
  };

  // ── Campaigns Tab ─────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [committees, setCommittees] = useState([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('');
  const [campaignCommitteeFilter, setCampaignCommitteeFilter] = useState('');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', committeeIds: [], description: '', opensAt: '', closesAt: '', status: 'draft' });
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editCampaignData, setEditCampaignData] = useState({ title: '', committeeIds: [], description: '', opensAt: '', closesAt: '', status: 'draft' });
  const [savingCampaign, setSavingCampaign] = useState(false);

  // ── Pipeline Tab ──────────────────────────────────────────────────────────
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [visibleStageCounts, setVisibleStageCounts] = useState({
    applied: 10,
    screening: 10,
    interview: 10,
    final_review: 10,
  });

  useEffect(() => {
    setVisibleStageCounts({
      applied: 10,
      screening: 10,
      interview: 10,
      final_review: 10,
    });
  }, [pipelineSearch, pipelineFilter]);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [candidateScore, setCandidateScore] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState(null);

  // ── Dedicated Rejected Modal State ────────────────────────────────────────
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [rejectedApplications, setRejectedApplications] = useState([]);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [rejectedSearch, setRejectedSearch] = useState('');

  // ── Member Management Tab ─────────────────────────────────────────────────
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedCommitteeFilters, setSelectedCommitteeFilters] = useState([]);
  const [selectedRoleFilters, setSelectedRoleFilters] = useState([]);
  const [joinedDateFrom, setJoinedDateFrom] = useState('');
  const [joinedDateTo, setJoinedDateTo] = useState('');
  const [openColumnFilter, setOpenColumnFilter] = useState(null);
  const [committeeFilterSearch, setCommitteeFilterSearch] = useState('');

  // Add Member Modal State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [targetCommitteeId, setTargetCommitteeId] = useState('');
  const [targetRole, setTargetRole] = useState('member');
  const [savingMembers, setSavingMembers] = useState(false);
  const [openActionMenuKey, setOpenActionMenuKey] = useState(null);

  // Close 3-dots action menu and column filters when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenActionMenuKey(null);
      setOpenColumnFilter(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // ── Campaign Details Modal State ──────────────────────────────────────────
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState(null);
  const [campaignDetailsApps, setCampaignDetailsApps] = useState([]);
  const [loadingCampaignDetailsApps, setLoadingCampaignDetailsApps] = useState(false);
  const [campaignDetailStageFilter, setCampaignDetailStageFilter] = useState('all'); // 'all' | 'accepted' | 'review'

  // ── Pipeline Three-Dot Options State ──────────────────────────────────────
  const [showPipelineMoreMenu, setShowPipelineMoreMenu] = useState(false);

  // ── HR Email Center Modal State ───────────────────────────────────────────
  const bodyTextareaRef = useRef(null);
  const onboardingBodyTextareaRef = useRef(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTargetCampaign, setEmailTargetCampaign] = useState(null);
  const [emailForm, setEmailForm] = useState({
    title: '',
    subject: '[IEEE MSB Recruitment] Important Update Regarding Your Application',
    templateMode: 'standard', // 'standard' | 'full'
    editorMode: 'markdown',   // 'markdown' | 'html'
    body: 'Hello {{candidate.name}},\n\nThank you for applying to the **{{candidate.committee}}** at IEEE Menoufia Student Branch.\n\nWe are pleased to inform you of an update regarding your application stage (**{{candidate.stage}}**).\n\nBest regards,\n**IEEE MSB**',
    recipientMode: 'stages', // 'stages' | 'candidates'
    selectedStages: ['applied', 'screening', 'interview', 'final_review'],
    selectedCandidateIds: [],
    candidateSearch: '',
    scheduledFor: '',
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailPreviewDevice, setEmailPreviewDevice] = useState('desktop');

  // ── Onboarding & Welcome Email State ──────────────────────────────────
  const [pipelineSummary, setPipelineSummary] = useState(null);
  const [showOnboardingSettingsModal, setShowOnboardingSettingsModal] = useState(false);
  const [onboardingConfig, setOnboardingConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ieee_msb_onboarding_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const tMode = parsed.templateMode === 'full' ? 'full' : 'standard';
          let bodyText = typeof parsed.body === 'string' ? parsed.body : DEFAULT_ONBOARDING_CONFIG.body;
          if (tMode === 'standard' && isFullHtmlDocument(bodyText)) {
            bodyText = DEFAULT_ONBOARDING_CONFIG.body;
          } else if (tMode === 'full') {
            bodyText = upgradeLegacyOnboardingHtml(bodyText);
          }
          return {
            subject: parsed.subject || DEFAULT_ONBOARDING_CONFIG.subject,
            headline: parsed.headline || DEFAULT_ONBOARDING_CONFIG.headline,
            templateMode: tMode,
            editorMode: parsed.editorMode || DEFAULT_ONBOARDING_CONFIG.editorMode,
            body: bodyText,
            whatsappUrl: parsed.whatsappUrl !== undefined ? parsed.whatsappUrl : DEFAULT_ONBOARDING_CONFIG.whatsappUrl,
            discordUrl: parsed.discordUrl !== undefined ? parsed.discordUrl : DEFAULT_ONBOARDING_CONFIG.discordUrl,
            orientationDate: parsed.orientationDate || DEFAULT_ONBOARDING_CONFIG.orientationDate,
            checklistSteps: Array.isArray(parsed.checklistSteps) && parsed.checklistSteps.length > 0 ? parsed.checklistSteps : DEFAULT_ONBOARDING_CONFIG.checklistSteps,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load onboarding config from localStorage:', e);
    }
    return DEFAULT_ONBOARDING_CONFIG;
  });

  // Auto-sync onboarding config to browser storage
  useEffect(() => {
    try {
      localStorage.setItem('ieee_msb_onboarding_config', JSON.stringify(onboardingConfig));
    } catch (e) {
      console.warn('Failed to auto-save onboarding config:', e);
    }
  }, [onboardingConfig]);

  const buildOnboardingVariableContext = (candidate = {}) => {
    const cName = candidate.name || candidate.applicantName || user?.name || 'Yousef';
    const cEmail = candidate.email || candidate.applicantEmail || user?.email || 'candidate@ieee.local';
    const cCommittee = candidate.committeeName || (candidate.committeeId ? getCommitteeName(candidate.committeeId) : 'Robotics & Automation (RAS)');
    const cStage = (candidate.currentStage || candidate.status || 'ACCEPTED').toUpperCase();
    const cFaculty = candidate.faculty || candidate.answers?.faculty || 'Faculty of Electronic Engineering';

    const orientationDateVal = onboardingConfig.orientationDate !== undefined ? onboardingConfig.orientationDate : DEFAULT_ONBOARDING_CONFIG.orientationDate;
    const whatsappVal = onboardingConfig.whatsappUrl !== undefined ? onboardingConfig.whatsappUrl : DEFAULT_ONBOARDING_CONFIG.whatsappUrl;
    const discordVal = onboardingConfig.discordUrl !== undefined ? onboardingConfig.discordUrl : DEFAULT_ONBOARDING_CONFIG.discordUrl;

    const steps = onboardingConfig.checklistSteps !== undefined ? onboardingConfig.checklistSteps : DEFAULT_ONBOARDING_CONFIG.checklistSteps;
    const s1 = steps?.[0];
    const s2 = steps?.[1];
    const s3 = steps?.[2];
    const s4 = steps?.[3];

    const customFields = {
      name: cName,
      email: cEmail,
      committee: cCommittee,
      stage: cStage,
      faculty: cFaculty,
      'candidate.name': cName,
      'candidate.email': cEmail,
      'candidate.committee': cCommittee,
      'candidate.stage': cStage,
      'candidate.faculty': cFaculty,
      'branch.name': 'IEEE Menoufia Student Branch',
      'orientation.date': orientationDateVal ?? '',
      'channels.whatsapp': whatsappVal ?? '',
      'channels.discord': discordVal ?? '',
      'checklist.option1': s1?.title ?? '',
      'checklist.option1.title': s1?.title ?? '',
      'checklist.option1.desc': s1?.desc ?? '',
      'checklist.step1': s1?.title ?? '',
      'checklist.step1.title': s1?.title ?? '',
      'checklist.step1.desc': s1?.desc ?? '',
      'checklist.option2': s2?.title ?? '',
      'checklist.option2.title': s2?.title ?? '',
      'checklist.option2.desc': s2?.desc ?? '',
      'checklist.step2': s2?.title ?? '',
      'checklist.step2.title': s2?.title ?? '',
      'checklist.step2.desc': s2?.desc ?? '',
      'checklist.option3': s3?.title ?? '',
      'checklist.option3.title': s3?.title ?? '',
      'checklist.option3.desc': s3?.desc ?? '',
      'checklist.step3': s3?.title ?? '',
      'checklist.step3.title': s3?.title ?? '',
      'checklist.step3.desc': s3?.desc ?? '',
      'checklist.option4': s4?.title ?? '',
      'checklist.option4.title': s4?.title ?? '',
      'checklist.option4.desc': s4?.desc ?? '',
      'checklist.step4': s4?.title ?? '',
      'checklist.step4.title': s4?.title ?? '',
      'checklist.step4.desc': s4?.desc ?? '',
    };

    return {
      name: cName,
      email: cEmail,
      committeeName: cCommittee,
      stage: cStage,
      faculty: cFaculty,
      customFields,
    };
  };

  const [onboardingPreviewDevice, setOnboardingPreviewDevice] = useState('desktop');
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [sendingTestWelcome, setSendingTestWelcome] = useState(false);
  const [dispatchingBulkWelcome, setDispatchingBulkWelcome] = useState(false);
  const [dispatchingSingleWelcomeId, setDispatchingSingleWelcomeId] = useState(null);

  // ── Onboarding Candidates Queue State ─────────────────────────────────────
  const [onboardingCandidates, setOnboardingCandidates] = useState([]);
  const [onboardingSummary, setOnboardingSummary] = useState({ totalAccepted: 0, unsentCount: 0, sentCount: 0 });
  const [loadingOnboardingCandidates, setLoadingOnboardingCandidates] = useState(false);
  const [showOnboardingQueueModal, setShowOnboardingQueueModal] = useState(false);
  const [onboardingFilterStatus, setOnboardingFilterStatus] = useState('unsent'); // 'unsent' | 'sent' | 'all'
  const [onboardingSearchQuery, setOnboardingSearchQuery] = useState('');

  const filteredOnboardingCandidates = useMemo(() => {
    return onboardingCandidates.filter((c) => {
      if (onboardingFilterStatus === 'unsent' && c.welcomeEmailSent) return false;
      if (onboardingFilterStatus === 'sent' && !c.welcomeEmailSent) return false;
      if (onboardingSearchQuery.trim()) {
        const q = onboardingSearchQuery.toLowerCase();
        const name = (c.answers?.fullName || c.applicantName || '').toLowerCase();
        const email = (c.applicantEmail || c.email || c.answers?.email || '').toLowerCase();
        const committee = (c.committeeName || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !committee.includes(q)) return false;
      }
      return true;
    });
  }, [onboardingCandidates, onboardingFilterStatus, onboardingSearchQuery]);

  // ── Modal Backdrop Dismiss Hooks ─────────────────────────────────────────
  const createCampaignBackdrop = useBackdropDismiss(() => setShowCreateCampaign(false), {
    isOpen: showCreateCampaign,
  });
  const editCampaignBackdrop = useBackdropDismiss(() => setEditingCampaign(null), {
    isOpen: !!editingCampaign,
  });
  const campaignDetailsBackdrop = useBackdropDismiss(() => setSelectedCampaignDetails(null), {
    isOpen: !!selectedCampaignDetails,
  });
  const rejectedModalBackdrop = useBackdropDismiss(() => setShowRejectedModal(false), {
    isOpen: showRejectedModal,
  });
  const addMemberBackdrop = useBackdropDismiss(() => setShowAddMember(false), {
    isOpen: showAddMember,
  });
  const candidateDetailsBackdrop = useBackdropDismiss(() => setSelectedCandidate(null), {
    isOpen: !!selectedCandidate,
  });
  const emailModalBackdrop = useBackdropDismiss(() => setShowEmailModal(false), {
    isOpen: showEmailModal,
  });
  const onboardingSettingsBackdrop = useBackdropDismiss(() => setShowOnboardingSettingsModal(false), {
    isOpen: showOnboardingSettingsModal,
  });
  const onboardingQueueBackdrop = useBackdropDismiss(() => setShowOnboardingQueueModal(false), {
    isOpen: showOnboardingQueueModal,
  });

  // ── Load Committees ───────────────────────────────────────────────────────
  useEffect(() => {
    async function loadCommittees() {
      try {
        const data = await api.getPublicCommittees();
        const comms = data.committees || [];
        setCommittees(comms);
        if (comms.length > 0 && !targetCommitteeId) {
          setTargetCommitteeId(comms[0].id);
        }
      } catch (err) {
        console.error('Failed to load committees:', err);
      }
    }
    loadCommittees();
  }, []);

  // ── Load Campaigns ────────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const data = await api.getHRCampaigns();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // ── Load Applications (Active Stages) ─────────────────────────────────────
  const loadApplications = useCallback(async () => {
    setLoadingApplications(true);
    try {
      const params = {};
      if (pipelineFilter) params.committeeId = pipelineFilter;
      const data = await api.getHRApplications(params);
      setApplications(data.applications || []);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingApplications(false);
    }
  }, [pipelineFilter]);

  useEffect(() => {
    if (activeTab === 'pipeline') loadApplications();
  }, [activeTab, loadApplications]);

  // ── Load Rejected Applications ────────────────────────────────────────────
  const loadRejectedApplications = useCallback(async () => {
    setLoadingRejected(true);
    try {
      const params = { includeRejected: true };
      if (pipelineFilter) params.committeeId = pipelineFilter;
      const data = await api.getHRApplications(params);
      const rejectedList = (data.applications || []).filter((a) => a.currentStage === 'rejected');
      setRejectedApplications(rejectedList);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingRejected(false);
    }
  }, [pipelineFilter]);

  const handleOpenRejectedModal = () => {
    setShowRejectedModal(true);
    loadRejectedApplications();
  };

  // ── Load All Members (Branch-wide) ────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await api.getAllCommitteeMemberships();
      setAllMembers(data.memberships || []);
    } catch (err) {
      toast.error('Load Failed', err.message);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'members') loadMembers();
  }, [activeTab, loadMembers]);

  // ── Load Pipeline Summary & Onboarding Candidates ────────────────────────
  const loadPipelineMetrics = useCallback(async () => {
    try {
      const data = await api.getHRPipelineSummary();
      setPipelineSummary(data);
    } catch (err) {
      console.warn('Failed to load pipeline summary:', err);
    }
  }, []);

  const loadOnboardingCandidates = useCallback(async () => {
    setLoadingOnboardingCandidates(true);
    try {
      const params = { welcomeEmailSent: 'all' };
      if (pipelineFilter) params.committeeId = pipelineFilter;
      const data = await api.getHROnboardingCandidates(params);
      setOnboardingCandidates(data.candidates || []);
      if (data.summary) {
        setOnboardingSummary(data.summary);
      }
    } catch (err) {
      console.warn('Failed to load onboarding candidates:', err);
    } finally {
      setLoadingOnboardingCandidates(false);
    }
  }, [pipelineFilter]);

  useEffect(() => {
    loadPipelineMetrics();
    loadOnboardingCandidates();
  }, [loadPipelineMetrics, loadOnboardingCandidates, activeTab]);

  // ── User Search in Add Member Modal ───────────────────────────────────────
  useEffect(() => {
    if (!userSearchQuery.trim() || !showAddMember) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const data = await api.searchRegisteredUsers(userSearchQuery);
        setUserSearchResults(data.users || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearchQuery, showAddMember]);

  // ── Candidate Notes & Score Local Storage ─────────────────────────────────
  const handleOpenCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    const savedNotes = localStorage.getItem(`hr_notes_${candidate.id}`) || '';
    const savedScore = localStorage.getItem(`hr_score_${candidate.id}`) || '';
    setCandidateNotes(savedNotes);
    setCandidateScore(savedScore);
  };

  const handleNotesChange = (val) => {
    setCandidateNotes(val);
    if (selectedCandidate) {
      localStorage.setItem(`hr_notes_${selectedCandidate.id}`, val);
    }
  };

  const handleScoreChange = (val) => {
    let scoreNum = '';
    if (val !== '') {
      const parsed = parseInt(val, 10);
      if (!Number.isNaN(parsed)) {
        scoreNum = Math.max(1, Math.min(10, parsed));
      }
    }
    setCandidateScore(scoreNum === '' ? '' : String(scoreNum));
    if (selectedCandidate) {
      localStorage.setItem(`hr_score_${selectedCandidate.id}`, scoreNum === '' ? '' : String(scoreNum));
    }
  };

  const clearCandidateDraft = (id) => {
    localStorage.removeItem(`hr_notes_${id}`);
    localStorage.removeItem(`hr_score_${id}`);
  };

  // ── Campaign CRUD ─────────────────────────────────────────────────────────
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaign.committeeIds.length) {
      toast.error('Validation Error', 'Please select at least one committee.');
      return;
    }
    setSavingCampaign(true);
    try {
      await api.createHRCampaign({
        committeeIds: newCampaign.committeeIds,
        committeeId: newCampaign.committeeIds[0],
        title: newCampaign.title.trim(),
        description: newCampaign.description.trim() || null,
        opensAt: new Date(newCampaign.opensAt).toISOString(),
        closesAt: new Date(newCampaign.closesAt).toISOString(),
        status: newCampaign.status,
      });
      toast.success('Campaign Created', `"${newCampaign.title}" has been created.`);
      setShowCreateCampaign(false);
      setNewCampaign({ title: '', committeeIds: [], description: '', opensAt: '', closesAt: '', status: 'draft' });
      loadCampaigns();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleOpenEditCampaign = (camp) => {
    setEditingCampaign(camp);
    const existingCIds = camp.committees?.length > 0
      ? camp.committees.map((c) => c.id)
      : (camp.committeeId ? [camp.committeeId] : []);
    setEditCampaignData({
      title: camp.title || '',
      committeeIds: existingCIds,
      description: camp.description || '',
      opensAt: formatDatetimeForInput(camp.opensAt),
      closesAt: formatDatetimeForInput(camp.closesAt),
      status: camp.status || 'draft',
    });
  };

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    if (!editCampaignData.committeeIds.length) {
      toast.error('Validation Error', 'Please select at least one committee.');
      return;
    }
    setSavingCampaign(true);
    try {
      await api.updateHRCampaign(editingCampaign.id, {
        title: editCampaignData.title.trim(),
        description: editCampaignData.description.trim() || null,
        opensAt: new Date(editCampaignData.opensAt).toISOString(),
        closesAt: new Date(editCampaignData.closesAt).toISOString(),
        status: editCampaignData.status,
        committeeIds: editCampaignData.committeeIds,
      });
      toast.success('Campaign Updated', `"${editCampaignData.title}" has been updated.`);
      setEditingCampaign(null);
      loadCampaigns();
    } catch (err) {
      toast.error('Update Failed', err.message);
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleToggleCampaignStatus = async (campaign, newStatus) => {
    try {
      await api.updateHRCampaignStatus(campaign.id, newStatus);
      toast.success('Status Updated', `Campaign is now "${newStatus}".`);
      loadCampaigns();
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  // ── Drag and Drop Pipeline Stage Handler ──────────────────────────────────
  const handleDropCandidateOnStage = async (targetStage) => {
    if (!draggedCandidate || draggedCandidate.currentStage === targetStage) return;
    const candidate = draggedCandidate;
    setDraggedCandidate(null);

    // Optimistically update UI
    setApplications((prev) =>
      prev.map((app) => (app.id === candidate.id ? { ...app, currentStage: targetStage } : app))
    );

    try {
      if (targetStage === 'accepted') {
        await api.acceptApplication(candidate.id, { notes: 'Moved via Kanban drag-and-drop' });
        toast.success('Candidate Accepted', `${candidate.answers?.fullName || 'Applicant'} accepted & enrolled.`);
      } else if (targetStage === 'rejected') {
        await api.rejectApplication(candidate.id, { notes: 'Moved via Kanban drag-and-drop' });
        toast.success('Application Rejected', `${candidate.answers?.fullName || 'Applicant'} rejected.`);
      } else {
        await api.updateApplicationStage(candidate.id, { stage: targetStage });
      }
      loadApplications();
    } catch (err) {
      toast.error('Move Failed', err.message);
      loadApplications();
    }
  };

  // ── Pipeline Actions Modal ────────────────────────────────────────────────
  const handleAdvanceStage = async (app) => {
    const nextStage = STAGE_NEXT[app.currentStage];
    if (!nextStage) return;
    setProcessingAction(true);
    try {
      await api.updateApplicationStage(app.id, {
        stage: nextStage,
        notes: candidateNotes.trim() || null,
        score: candidateScore ? parseInt(candidateScore, 10) : undefined,
      });
      clearCandidateDraft(app.id);
      toast.success('Stage Updated', `Moved to ${nextStage.replace('_', ' ')}.`);
      setSelectedCandidate(null);
      loadApplications();
    } catch (err) {
      toast.error('Update Failed', err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAccept = async (app) => {
    setProcessingAction(true);
    try {
      await api.acceptApplication(app.id, { notes: candidateNotes.trim() || null });
      clearCandidateDraft(app.id);
      toast.success('Accepted!', 'Candidate has been accepted and committee membership assigned.');
      setSelectedCandidate(null);
      loadApplications();
    } catch (err) {
      toast.error('Accept Failed', err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (app) => {
    setProcessingAction(true);
    try {
      await api.rejectApplication(app.id, { notes: candidateNotes.trim() || null });
      clearCandidateDraft(app.id);
      toast.success('Rejected', 'Application has been moved to Rejected archive.');
      setSelectedCandidate(null);
      loadApplications();
    } catch (err) {
      toast.error('Reject Failed', err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  // ── Batch Add Members ─────────────────────────────────────────────────────
  const toggleUserSelection = (u) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((item) => item.id === u.id);
      if (exists) return prev.filter((item) => item.id !== u.id);
      return [...prev, u];
    });
  };

  const handleBatchAddMembers = async (e) => {
    e.preventDefault();
    if (!selectedUsers.length) {
      toast.error('Validation Error', 'Please select at least one user.');
      return;
    }
    if (!targetCommitteeId) {
      toast.error('Validation Error', 'Please select a target committee.');
      return;
    }

    setSavingMembers(true);
    let successCount = 0;
    try {
      for (const u of selectedUsers) {
        await api.upsertCommitteeMembership({
          committeeId: targetCommitteeId,
          externalUserId: u.externalUserId || u.id,
          email: u.email,
          roleInCommittee: targetRole,
        });
        successCount++;
      }
      toast.success('Members Added', `Successfully added ${successCount} member(s) and synchronized IAM scopes.`);
      setShowAddMember(false);
      setSelectedUsers([]);
      setUserSearchQuery('');
      setUserSearchResults([]);
      loadMembers();
    } catch (err) {
      toast.error('Add Members Failed', err.message);
    } finally {
      setSavingMembers(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!confirm(`Remove ${member.name || member.email} from ${member.committeeName || 'the committee'}?`)) return;
    try {
      await api.removeCommitteeMembership(member.committeeId, member.externalUserId);
      toast.success('Removed', `${member.name || 'Member'} has been removed and permissions revoked.`);
      loadMembers();
    } catch (err) {
      toast.error('Remove Failed', err.message);
    }
  };

  const handleChangeRole = async (member, newRole) => {
    try {
      await api.upsertCommitteeMembership({
        committeeId: member.committeeId,
        externalUserId: member.externalUserId,
        email: member.email,
        roleInCommittee: newRole,
      });
      toast.success('Role Updated', `${member.name} is now ${newRole}.`);
      loadMembers();
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  // ── Export Members CSV ────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!filteredMembers.length) {
      toast.error('No Data', 'No member records to export.');
      return;
    }
    const headers = ['Name', 'Email', 'Committee', 'Role', 'Joined Date'];
    const rows = filteredMembers.map((m) => [
      `"${(m.name || 'Member').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.committeeName || '').replace(/"/g, '""')}"`,
      `"${(m.roleInCommittee || 'member').toUpperCase()}"`,
      `"${formatDate(m.createdAt)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ieee_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Complete', 'Downloaded member roster CSV.');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCommitteeName = (id) => committees.find((c) => c.id === id)?.name || 'General';

  const getCampaignCommitteesLabel = (camp) => {
    if (camp.committees && camp.committees.length > 0) {
      return camp.committees.map((c) => c.name).join(', ');
    }
    return getCommitteeName(camp.committeeId);
  };

  // ── Export Applications CSV ───────────────────────────────────────────────
  const handleExportApplications = (customList = null, filename = 'hr_applications_export.csv') => {
    const listToExport = customList || filteredApplications;
    if (!listToExport || listToExport.length === 0) {
      toast.error('No Data', 'There are no application records to export.');
      return;
    }
    const success = exportApplicationsToCsv(listToExport, filename, getCommitteeName);
    if (success) {
      toast.success('Export Complete', `Exported ${listToExport.length} application records to CSV.`);
    }
  };

  // ── Open Campaign Details Modal ───────────────────────────────────────────
  const handleOpenCampaignDetails = async (camp) => {
    setSelectedCampaignDetails(camp);
    setCampaignDetailStageFilter('all');
    setLoadingCampaignDetailsApps(true);
    try {
      const res = await api.getHRApplications({ campaignId: camp.id, all: true, includeAccepted: true, includeRejected: true });
      setCampaignDetailsApps(res.applications || []);
    } catch (err) {
      console.error('Failed to load campaign applications:', err);
      setCampaignDetailsApps([]);
    } finally {
      setLoadingCampaignDetailsApps(false);
    }
  };

  const handleExportCampaignApplications = async (campaign) => {
    try {
      const res = await api.getHRApplications({ campaignId: campaign.id, all: true, includeAccepted: true, includeRejected: true });
      const campaignApps = res.applications || [];
      if (campaignApps.length === 0) {
        toast.error('No Applications', `No applications found for "${campaign.title}".`);
        return;
      }
      const safeTitle = campaign.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      handleExportApplications(campaignApps, `campaign_${safeTitle}_applications.csv`);
    } catch (err) {
      toast.error('Export Failed', err.message);
    }
  };

  // ── HR Email Center Handlers ──────────────────────────────────────────────
  const handleToggleEmailTemplateMode = (mode) => {
    if (mode === 'full') {
      const currentBody = emailForm.body || '';
      const isAlreadyFull = isFullHtmlDocument(currentBody);
      const fullTemplate = isAlreadyFull
        ? currentBody
        : getDefaultEmailTemplate(renderMarkdownToHtml(currentBody), emailForm.title || emailForm.subject);
      setEmailForm((p) => ({
        ...p,
        templateMode: 'full',
        editorMode: 'html',
        body: fullTemplate,
      }));
    } else {
      setEmailForm((p) => ({
        ...p,
        templateMode: 'standard',
        editorMode: 'markdown',
      }));
    }
  };

  const handleResetEmailDefaultTemplate = () => {
    if (!window.confirm('Reset this template back to the official IEEE Menoufia default template?')) return;
    const standardHtml = getDefaultEmailTemplate('', emailForm.title || emailForm.subject);
    setEmailForm((p) => ({
      ...p,
      body: standardHtml,
    }));
    toast.success('Template Reset', 'Restored official IEEE Menoufia template structure.');
  };

  const insertEmailVariableTag = (tag) => {
    const token = `{{${tag}}}`;
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      setEmailForm((p) => ({ ...p, body: p.body + ' ' + token }));
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentText = emailForm.body || '';
    const newText = currentText.substring(0, start) + token + currentText.substring(end);

    setEmailForm((p) => ({ ...p, body: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  const applyEmailFormatting = (type) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const current = emailForm.body || '';
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
    setEmailForm((p) => ({ ...p, body: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  const insertOnboardingVariableTag = (tag) => {
    const token = `{{${tag}}}`;
    const textarea = onboardingBodyTextareaRef.current;
    if (!textarea) {
      setOnboardingConfig((p) => ({ ...p, body: p.body + ' ' + token }));
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentText = onboardingConfig.body || '';
    const newText = currentText.substring(0, start) + token + currentText.substring(end);

    setOnboardingConfig((p) => ({ ...p, body: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  const applyOnboardingFormatting = (type) => {
    const textarea = onboardingBodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const current = onboardingConfig.body || '';
    const selected = current.substring(start, end);
    const isHtml = onboardingConfig.editorMode === 'html';

    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = isHtml ? `<strong>${selected || 'bold text'}</strong>` : `**${selected || 'bold text'}**`;
        cursorOffset = isHtml ? (selected ? replacement.length : 8) : (selected ? replacement.length : 2);
        break;
      case 'italic':
        replacement = isHtml ? `<em>${selected || 'italic text'}</em>` : `*${selected || 'italic text'}*`;
        cursorOffset = isHtml ? (selected ? replacement.length : 4) : (selected ? replacement.length : 1);
        break;
      case 'h2':
        replacement = isHtml ? `<h2>${selected || 'Heading 2'}</h2>\n` : `\n## ${selected || 'Heading 2'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'h3':
        replacement = isHtml ? `<h3>${selected || 'Heading 3'}</h3>\n` : `\n### ${selected || 'Heading 3'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'list':
        replacement = isHtml ? `<ul>\n  <li>${selected || 'List item'}</li>\n</ul>\n` : `\n- ${selected || 'List item'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'link':
        replacement = isHtml ? `<a href="https://">${selected || 'Link label'}</a>` : `[${selected || 'Link label'}](https://)`;
        cursorOffset = replacement.length - (isHtml ? 4 : 1);
        break;
      case 'divider':
        replacement = isHtml ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />\n` : `\n---\n`;
        cursorOffset = replacement.length;
        break;
      default:
        return;
    }

    const newText = current.substring(0, start) + replacement + current.substring(end);
    setOnboardingConfig((p) => ({ ...p, body: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  const handleToggleOnboardingTemplateMode = (mode) => {
    if (mode === onboardingConfig.templateMode) return;
    if (mode === 'full') {
      const fullDoc = getDefaultWelcomeEmailTemplate({
        memberName: '{{candidate.name}}',
        committeeName: '{{candidate.committee}}',
        headline: onboardingConfig.headline || DEFAULT_ONBOARDING_CONFIG.headline,
        welcomeMessage: isFullHtmlDocument(onboardingConfig.body) ? DEFAULT_ONBOARDING_CONFIG.body : onboardingConfig.body,
        whatsappUrl: '{{channels.whatsapp}}',
        discordUrl: '{{channels.discord}}',
        orientationDate: '{{orientation.date}}',
      });
      setOnboardingConfig((prev) => ({
        ...prev,
        templateMode: 'full',
        body: fullDoc,
      }));
    } else {
      setOnboardingConfig((prev) => ({
        ...prev,
        templateMode: 'standard',
        body: isFullHtmlDocument(prev.body) ? DEFAULT_ONBOARDING_CONFIG.body : prev.body,
      }));
    }
  };

  const handleResetOnboardingDefaultTemplate = () => {
    if (window.confirm('Reset the onboarding welcome email to the default official IEEE Menoufia HTML template?')) {
      const defaultDoc = getDefaultWelcomeEmailTemplate({
        memberName: '{{candidate.name}}',
        committeeName: '{{candidate.committee}}',
        headline: onboardingConfig.headline || DEFAULT_ONBOARDING_CONFIG.headline,
        welcomeMessage: DEFAULT_ONBOARDING_CONFIG.body,
        whatsappUrl: '{{channels.whatsapp}}',
        discordUrl: '{{channels.discord}}',
        orientationDate: '{{orientation.date}}',
      });
      setOnboardingConfig((prev) => ({
        ...prev,
        templateMode: 'full',
        body: defaultDoc,
      }));
      toast.success('Template Reset', 'Reset to official IEEE Menoufia onboarding structure.');
    }
  };

  const handleOpenEmailModal = async (targetCampaign = null, presetCandidate = null) => {
    setEmailTargetCampaign(targetCampaign);
    if (presetCandidate) {
      setEmailForm((prev) => ({
        ...prev,
        title: `Outreach to ${presetCandidate.answers?.fullName || 'Candidate'}`,
        recipientMode: 'candidates',
        selectedCandidateIds: [presetCandidate.id],
        candidateSearch: '',
        scheduledFor: '',
      }));
    } else if (targetCampaign) {
      setEmailForm((prev) => ({
        ...prev,
        title: `Email Applicants: ${targetCampaign.title}`,
        recipientMode: 'stages',
        selectedStages: ['applied', 'screening', 'interview', 'final_review'],
        selectedCandidateIds: [],
        candidateSearch: '',
        scheduledFor: '',
      }));
      // Preload applications for this specific campaign so Expected Recipients resolves accurately
      try {
        const res = await api.getHRApplications({ campaignId: targetCampaign.id, includeRejected: true, includeAccepted: true, all: true });
        if (res?.applications && Array.isArray(res.applications)) {
          setApplications((prev) => {
            const map = new Map(prev.map((a) => [a.id, a]));
            res.applications.forEach((a) => map.set(a.id, a));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Could not preload campaign applications:', err);
      }
    } else {
      setEmailForm((prev) => ({
        ...prev,
        title: 'Recruitment & Pipeline Email Outreach',
        recipientMode: 'stages',
        selectedStages: ['applied', 'screening', 'interview', 'final_review'],
        selectedCandidateIds: [],
        candidateSearch: '',
        scheduledFor: '',
      }));
      if (applications.length === 0) {
        loadApplications();
      }
    }
    setShowEmailModal(true);
  };

  const handleQuickMailCandidate = (candidate) => {
    handleOpenEmailModal(null, candidate);
  };

  const handleSendHrEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailForm.subject.trim()) {
      toast.error('Validation Error', 'Email subject line is required.');
      return;
    }
    if (!emailForm.body.trim()) {
      toast.error('Validation Error', 'Email message body is required.');
      return;
    }

    let candidatePool = applications;
    if (emailTargetCampaign) {
      candidatePool = candidatePool.filter((a) => a.campaignId === emailTargetCampaign.id || a.campaign_id === emailTargetCampaign.id);
    }

    let targetApps = [];
    if (emailForm.recipientMode === 'stages') {
      if (!emailForm.selectedStages || emailForm.selectedStages.length === 0) {
        toast.error('Validation Error', 'Please select at least one recruitment stage.');
        return;
      }
      targetApps = candidatePool.filter((a) => emailForm.selectedStages.includes(a.currentStage));
      if (emailForm.selectedStages.includes('rejected')) {
        targetApps = [...targetApps, ...rejectedApplications];
      }
    } else {
      if (!emailForm.selectedCandidateIds || emailForm.selectedCandidateIds.length === 0) {
        toast.error('Validation Error', 'Please select at least one candidate.');
        return;
      }
      const allPossible = [...applications, ...rejectedApplications];
      targetApps = allPossible.filter((a) => emailForm.selectedCandidateIds.includes(a.id));
    }

    const customRecipientsMap = new Map();
    targetApps.forEach((a) => {
      const email = (a.applicantEmail || a.email || a.answers?.email || '').trim();
      if (email && email.includes('@')) {
        const name = a.answers?.fullName || a.applicantName || a.name || 'Candidate';
        const committeeName = getCommitteeName(a.committeeId);
        const stageName = (a.currentStage || a.status || 'applied').toUpperCase();
        const facultyName = a.answers?.faculty || 'Menoufia University';
        customRecipientsMap.set(email.toLowerCase(), {
          email,
          name,
          customFields: {
            name,
            email,
            committee: committeeName,
            stage: stageName,
            faculty: facultyName,
            university: 'Menoufia University',
            'candidate.name': name,
            'candidate.email': email,
            'candidate.committee': committeeName,
            'candidate.stage': stageName,
            'candidate.faculty': facultyName,
            'branch.name': 'IEEE Menoufia Student Branch',
          },
        });
      }
    });

    const customRecipients = Array.from(customRecipientsMap.values());
    if (customRecipients.length === 0) {
      toast.error('No Valid Recipients', 'No candidates with valid email addresses were found matching your criteria.');
      return;
    }

    const isScheduled = Boolean(emailForm.scheduledFor);
    const confirmMsg = isScheduled
      ? `Schedule this email outreach for ${customRecipients.length} candidate(s) at ${new Date(emailForm.scheduledFor).toLocaleString()}?`
      : `Are you ready to dispatch this email to ${customRecipients.length} candidate(s) now?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setSendingEmail(true);
    try {
      const isFull = emailForm.templateMode === 'full' || isFullHtmlDocument(emailForm.body);
      const fullHtmlBody = isFull
        ? emailForm.body
        : getDefaultEmailTemplate(renderMarkdownToHtml(emailForm.body), emailForm.subject);

      const campaignPayload = {
        title: `HR Outreach: ${emailForm.subject.slice(0, 45)}`,
        subject: emailForm.subject.trim(),
        body: fullHtmlBody,
        segmentType: 'custom_sheet',
        customRecipients,
        metadata: {
          category: 'hr_outreach',
          source: 'hr_studio',
          campaignType: 'recruitment_outreach',
        },
        status: isScheduled ? 'scheduled' : 'draft',
        scheduledFor: isScheduled ? new Date(emailForm.scheduledFor).toISOString() : null,
      };

      const created = await api.createPRCampaign(campaignPayload);
      if (!isScheduled) {
        const campId = created?.campaign?.id || created?.id;
        if (campId) {
          await api.sendPRCampaign(campId);
        }
        toast.success('Emails Dispatched', `Successfully dispatched email to ${customRecipients.length} candidate(s).`);
      } else {
        toast.success('Email Scheduled', `Scheduled email outreach to ${customRecipients.length} candidate(s) for ${new Date(emailForm.scheduledFor).toLocaleString()}.`);
      }
      setShowEmailModal(false);
    } catch (err) {
      console.error('HR email dispatch failed:', err);
      toast.error('Dispatch Failed', err.message || 'Could not send outreach emails.');
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Onboarding Studio Handlers ────────────────────────────────────────────
  const handleSaveOnboardingDefaults = () => {
    try {
      localStorage.setItem('ieee_msb_onboarding_config', JSON.stringify(onboardingConfig));
      toast.success('Defaults Saved', 'Onboarding welcome email & checklist template saved.');
    } catch {
      toast.success('Template Updated', 'Onboarding template updated in session.');
    }
  };

  const handleSendTestWelcomeEmail = async () => {
    if (!user?.email) {
      toast.error('No Email', 'Current user email not found.');
      return;
    }
    setSendingTestWelcome(true);
    try {
      const testContext = buildOnboardingVariableContext({
        name: user.name || 'HR Team Member',
        email: user.email,
        committeeName: 'Sample Committee (RAS)',
        stage: 'ACCEPTED',
      });

      const isFull = onboardingConfig.templateMode === 'full';
      const welcomeHtml = isFull
        ? onboardingConfig.body
        : getDefaultWelcomeEmailTemplate({
          memberName: '{{candidate.name}}',
          committeeName: '{{candidate.committee}}',
          headline: onboardingConfig.headline || DEFAULT_ONBOARDING_CONFIG.headline,
          welcomeMessage: onboardingConfig.body,
          whatsappUrl: '{{channels.whatsapp}}',
          discordUrl: '{{channels.discord}}',
          orientationDate: '{{orientation.date}}',
        });

      const payload = {
        title: `[TEST] ${onboardingConfig.subject.slice(0, 40)}`,
        subject: `[TEST] ${onboardingConfig.subject}`,
        body: welcomeHtml,
        segmentType: 'custom_sheet',
        customRecipients: [{
          email: user.email,
          name: user.name || 'HR Reviewer',
          customFields: testContext.customFields,
        }],
        metadata: {
          category: 'hr_outreach',
          source: 'hr_studio',
          campaignType: 'onboarding_welcome_test',
        },
        status: 'draft',
      };

      const created = await api.createPRCampaign(payload);
      if (created?.campaign?.id || created?.id) {
        await api.sendPRCampaign(created?.campaign?.id || created?.id);
      }
      toast.success('Test Email Sent', `Sent test welcome email to ${user.email}.`);
    } catch (err) {
      toast.error('Test Send Failed', err.message || 'Could not send test email.');
    } finally {
      setSendingTestWelcome(false);
    }
  };

  const handleDispatchBulkWelcome = async () => {
    const acceptedApps = onboardingCandidates.length > 0 ? onboardingCandidates : applications.filter((a) => a.currentStage === 'accepted');
    const unsentAccepted = acceptedApps.filter((a) => !a.welcomeEmailSent);
    const targetApps = unsentAccepted.length > 0 ? unsentAccepted : acceptedApps;

    if (targetApps.length === 0) {
      toast.error('No Accepted Candidates', 'There are currently no candidates in the Accepted stage.');
      return;
    }

    const confirmMsg = unsentAccepted.length > 0
      ? `Dispatch customized Welcome & Onboarding email to ${unsentAccepted.length} unsent candidate(s) (out of ${acceptedApps.length} total accepted)?`
      : `Dispatch customized Welcome & Onboarding email to all ${acceptedApps.length} accepted candidate(s)?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setDispatchingBulkWelcome(true);
    try {
      const customRecipients = targetApps.map((a) => {
        const candidateName = a.answers?.fullName || a.applicantName || 'New Member';
        const candidateEmail = a.applicantEmail || a.email || a.answers?.email;
        const committeeName = a.committeeName || getCommitteeName(a.committeeId);
        const candidateCtx = buildOnboardingVariableContext({
          name: candidateName,
          email: candidateEmail,
          committeeName,
          stage: 'ACCEPTED',
          faculty: a.answers?.faculty || a.faculty,
        });
        return {
          applicationId: a.id,
          email: candidateEmail,
          name: candidateName,
          customFields: { ...candidateCtx.customFields, applicationId: a.id },
        };
      }).filter((r) => r.email && r.email.includes('@'));

      const isFull = onboardingConfig.templateMode === 'full';
      const welcomeHtml = isFull
        ? onboardingConfig.body
        : getDefaultWelcomeEmailTemplate({
          memberName: '{{candidate.name}}',
          committeeName: '{{candidate.committee}}',
          headline: onboardingConfig.headline || DEFAULT_ONBOARDING_CONFIG.headline,
          welcomeMessage: onboardingConfig.body,
          whatsappUrl: '{{channels.whatsapp}}',
          discordUrl: '{{channels.discord}}',
          orientationDate: '{{orientation.date}}',
        });

      const payload = {
        title: `Welcome Dispatch: ${onboardingConfig.subject.slice(0, 40)}`,
        subject: onboardingConfig.subject,
        body: welcomeHtml,
        segmentType: 'custom_sheet',
        customRecipients,
        metadata: {
          category: 'hr_outreach',
          source: 'hr_studio',
          campaignType: 'onboarding_welcome',
          applicationIds: targetApps.map((a) => a.id),
        },
        status: 'draft',
      };

      const created = await api.createPRCampaign(payload);
      if (created?.campaign?.id || created?.id) {
        await api.sendPRCampaign(created?.campaign?.id || created?.id);
      }

      // Mark welcome email sent in DB & create onboarding checklist
      try {
        await api.markHRWelcomeEmailsSent(
          targetApps.map((a) => a.id),
          { checklistSteps: onboardingConfig.checklistSteps }
        );
      } catch (err) {
        console.warn('Could not mark welcome emails sent in DB:', err);
      }

      loadOnboardingCandidates();
      if (activeTab === 'pipeline') {
        loadApplications();
      }
      toast.success('Welcome Dispatched', `Dispatched welcome onboarding email to ${customRecipients.length} candidate(s).`);
    } catch (err) {
      toast.error('Dispatch Failed', err.message || 'Could not dispatch welcome emails.');
    } finally {
      setDispatchingBulkWelcome(false);
    }
  };

  const handleDispatchSingleWelcome = async (candidate) => {
    if (!candidate || dispatchingSingleWelcomeId) return;
    const candidateName = candidate.answers?.fullName || candidate.applicantName || 'New Member';
    const candidateEmail = candidate.applicantEmail || candidate.email || candidate.answers?.email;
    if (!candidateEmail || !candidateEmail.includes('@')) {
      toast.error('Invalid Email', 'Candidate does not have a valid email address.');
      return;
    }

    setDispatchingSingleWelcomeId(candidate.id);
    try {
      const committeeName = candidate.committeeName || getCommitteeName(candidate.committeeId);
      const candidateCtx = buildOnboardingVariableContext({
        name: candidateName,
        email: candidateEmail,
        committeeName,
        stage: 'ACCEPTED',
        faculty: candidate.answers?.faculty || candidate.faculty,
      });

      const customRecipients = [
        {
          applicationId: candidate.id,
          email: candidateEmail,
          name: candidateName,
          customFields: { ...candidateCtx.customFields, applicationId: candidate.id },
        },
      ];

      const isFull = onboardingConfig.templateMode === 'full';
      const welcomeHtml = isFull
        ? onboardingConfig.body
        : getDefaultWelcomeEmailTemplate({
          memberName: '{{candidate.name}}',
          committeeName: '{{candidate.committee}}',
          headline: onboardingConfig.headline || DEFAULT_ONBOARDING_CONFIG.headline,
          welcomeMessage: onboardingConfig.body,
          whatsappUrl: '{{channels.whatsapp}}',
          discordUrl: '{{channels.discord}}',
          orientationDate: '{{orientation.date}}',
        });

      const payload = {
        title: `Welcome Dispatch: ${candidateName} (${committeeName})`,
        subject: onboardingConfig.subject,
        body: welcomeHtml,
        segmentType: 'custom_sheet',
        customRecipients,
        metadata: {
          category: 'hr_outreach',
          source: 'hr_studio',
          campaignType: 'onboarding_welcome',
          applicationIds: [candidate.id],
        },
        status: 'draft',
      };

      const created = await api.createPRCampaign(payload);
      if (created?.campaign?.id || created?.id) {
        await api.sendPRCampaign(created?.campaign?.id || created?.id);
      }

      try {
        await api.markHRWelcomeEmailsSent(
          [candidate.id],
          { checklistSteps: onboardingConfig.checklistSteps }
        );
      } catch (err) {
        console.warn('Could not mark welcome email sent in DB:', err);
      }

      await loadOnboardingCandidates();
      toast.success('Welcome Email Dispatched', `Welcome email successfully sent to ${candidateName} (${candidateEmail}).`);
    } catch (err) {
      toast.error('Dispatch Failed', err.message || 'Could not dispatch welcome email.');
    } finally {
      setDispatchingSingleWelcomeId(null);
    }
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    if (campaignSearch) {
      const q = campaignSearch.toLowerCase();
      const matchTitle = camp.title?.toLowerCase().includes(q);
      const matchDesc = camp.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (campaignStatusFilter && camp.status !== campaignStatusFilter) return false;
    if (campaignCommitteeFilter) {
      const matchInList = camp.committees?.some((c) => c.id === campaignCommitteeFilter);
      if (!matchInList && camp.committeeId !== campaignCommitteeFilter) return false;
    }
    return true;
  });

  const filteredApplications = applications.filter((a) => {
    if (pipelineSearch) {
      const q = pipelineSearch.toLowerCase();
      const name = (a.answers?.fullName || a.applicantEmail || '').toLowerCase();
      const email = (a.applicantEmail || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }
    return true;
  });

  const appsByStage = {};
  for (const stage of BASE_PIPELINE_STAGES) {
    appsByStage[stage.key] = filteredApplications.filter((a) => a.currentStage === stage.key);
  }

  const filteredRejectedApplications = rejectedApplications.filter((a) => {
    if (rejectedSearch) {
      const q = rejectedSearch.toLowerCase();
      const name = (a.answers?.fullName || a.applicantEmail || '').toLowerCase();
      const email = (a.applicantEmail || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }
    return true;
  });

  const hasActiveColumnFilters =
    selectedCommitteeFilters.length > 0 ||
    selectedRoleFilters.length > 0 ||
    Boolean(joinedDateFrom) ||
    Boolean(joinedDateTo);

  const resetAllColumnFilters = () => {
    setSelectedCommitteeFilters([]);
    setSelectedRoleFilters([]);
    setJoinedDateFrom('');
    setJoinedDateTo('');
    setOpenColumnFilter(null);
  };

  const filteredMembers = allMembers.filter((m) => {
    if (memberSearch.trim()) {
      const q = memberSearch.trim().toLowerCase();
      const match =
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.roleInCommittee && m.roleInCommittee.toLowerCase().includes(q)) ||
        (m.committeeName && m.committeeName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedCommitteeFilters.length > 0 && !selectedCommitteeFilters.includes(m.committeeId)) {
      return false;
    }
    if (selectedRoleFilters.length > 0) {
      const r = (m.roleInCommittee || 'member').toLowerCase();
      if (!selectedRoleFilters.includes(r)) return false;
    }
    if (joinedDateFrom) {
      const created = new Date(m.createdAt);
      const fromDate = new Date(joinedDateFrom);
      if (created < fromDate) return false;
    }
    if (joinedDateTo) {
      const created = new Date(m.createdAt);
      const toDate = new Date(`${joinedDateTo}T23:59:59.999Z`);
      if (created > toDate) return false;
    }
    return true;
  });

  const toggleCommitteeSelection = (committeeId, isEdit = false) => {
    if (isEdit) {
      setEditCampaignData((prev) => {
        const exists = prev.committeeIds.includes(committeeId);
        const updated = exists ? prev.committeeIds.filter((id) => id !== committeeId) : [...prev.committeeIds, committeeId];
        return { ...prev, committeeIds: updated };
      });
    } else {
      setNewCampaign((prev) => {
        const exists = prev.committeeIds.includes(committeeId);
        const updated = exists ? prev.committeeIds.filter((id) => id !== committeeId) : [...prev.committeeIds, committeeId];
        return { ...prev, committeeIds: updated };
      });
    }
  };

  // ── Compute dynamic expected recipients & available stages for Email Outreach ──
  const expectedRecipientsCount = (() => {
    let candidatePool = applications;
    if (emailTargetCampaign) {
      candidatePool = candidatePool.filter((a) => a.campaignId === emailTargetCampaign.id);
    }
    if (emailForm.recipientMode === 'stages') {
      let targetApps = candidatePool.filter((a) => emailForm.selectedStages.includes(a.currentStage));
      if (emailForm.selectedStages.includes('rejected')) {
        targetApps = [...targetApps, ...rejectedApplications];
      }
      const uniqueEmails = new Set();
      targetApps.forEach((a) => {
        const em = (a.applicantEmail || a.email || a.answers?.email || '').trim().toLowerCase();
        if (em && em.includes('@')) uniqueEmails.add(em);
      });
      return uniqueEmails.size;
    } else {
      return emailForm.selectedCandidateIds.length;
    }
  })();

  const availableStagesForEmail = emailTargetCampaign
    ? [
      { key: 'applied', label: 'Applied' },
      { key: 'screening', label: 'Screening' },
      { key: 'interview', label: 'Interview' },
      { key: 'final_review', label: 'Final Review' },
      { key: 'accepted', label: 'Accepted' },
      { key: 'rejected', label: 'Rejected' },
    ]
    : [
      { key: 'applied', label: 'Applied' },
      { key: 'screening', label: 'Screening' },
      { key: 'interview', label: 'Interview' },
      { key: 'final_review', label: 'Final Review' },
    ];

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="studio-layout hr-studio">
      <div className="studio__header">
        <h1>
          <Briefcase size={26} /> HR Studio
        </h1>
      </div>

      {/* Top Branch & HR Pipeline Quick Metrics (Visible Across All Tabs) */}
      <div className="studio-kpi-grid">
        <div className="studio-kpi-card">
          <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--primary">
            <Briefcase size={22} />
          </div>
          <div className="studio-kpi-content">
            <span className="studio-kpi-value">
              {pipelineSummary?.totals?.applications ?? pipelineSummary?.totalApplications ?? applications.length ?? 0}
            </span>
            <span className="studio-kpi-label">Total Applications</span>
          </div>
        </div>

        <div className="studio-kpi-card">
          <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="studio-kpi-content">
            <span className="studio-kpi-value">
              {pipelineSummary?.stages?.accepted || onboardingSummary.totalAccepted || 0}
            </span>
            <span className="studio-kpi-label">Accepted Candidates</span>
          </div>
        </div>

        <div className="studio-kpi-card">
          <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--amber">
            <Users size={22} />
          </div>
          <div className="studio-kpi-content">
            <span className="studio-kpi-value">
              {(pipelineSummary?.stages?.applied || 0) +
                (pipelineSummary?.stages?.screening || 0) +
                (pipelineSummary?.stages?.interview || 0) +
                (pipelineSummary?.stages?.finalReview ?? pipelineSummary?.stages?.final_review ?? 0)}
            </span>
            <span className="studio-kpi-label">In Active Pipeline</span>
          </div>
        </div>

        <div className="studio-kpi-card">
          <div className="studio-kpi-icon-wrap studio-kpi-icon-wrap--danger">
            <UserX size={22} />
          </div>
          <div className="studio-kpi-content">
            <span className="studio-kpi-value">
              {pipelineSummary?.stages?.rejected ?? 0}
            </span>
            <span className="studio-kpi-label">Rejected Applications</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="studio-tabs">
        <button type="button" className={`studio-tab ${activeTab === 'campaigns' ? 'studio-tab--active' : ''}`} onClick={() => setActiveTab('campaigns')}>
          <ClipboardList size={16} /> Campaigns
          <span className="studio-tab__badge">{campaigns.length}</span>
        </button>
        <button type="button" className={`studio-tab ${activeTab === 'pipeline' ? 'studio-tab--active' : ''}`} onClick={() => setActiveTab('pipeline')}>
          <Users size={16} /> Candidate Pipeline
          <span className="studio-tab__badge">{applications.length}</span>
        </button>
        <button type="button" className={`studio-tab ${activeTab === 'members' ? 'studio-tab--active' : ''}`} onClick={() => setActiveTab('members')}>
          <Shield size={16} /> Member Management
          <span className="studio-tab__badge">{allMembers.length}</span>
        </button>
        <button type="button" className={`studio-tab ${activeTab === 'onboarding' ? 'studio-tab--active' : ''}`} onClick={() => setActiveTab('onboarding')}>
          <ListChecks size={16} /> Onboarding
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Campaigns                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <>
          <div className="studio-toolbar">
            <div className="studio-toolbar__left">
              <div className="studio-search-wrap">
                <Search size={16} />
                <input
                  type="text"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  placeholder="Search campaigns by title or description..."
                  className="form-input studio-search-input"
                />
              </div>

              <div className="studio-filter-pills">
                <button
                  type="button"
                  onClick={() => setCampaignStatusFilter('')}
                  className={`studio-pill ${!campaignStatusFilter ? 'studio-pill--active' : ''}`}
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignStatusFilter('open')}
                  className={`studio-pill ${campaignStatusFilter === 'open' ? 'studio-pill--active' : ''}`}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignStatusFilter('draft')}
                  className={`studio-pill ${campaignStatusFilter === 'draft' ? 'studio-pill--active' : ''}`}
                >
                  Drafts
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignStatusFilter('closed')}
                  className={`studio-pill ${campaignStatusFilter === 'closed' ? 'studio-pill--active' : ''}`}
                >
                  Closed
                </button>
              </div>

              <select
                className="form-input"
                style={{ width: 'auto', minWidth: 180 }}
                value={campaignCommitteeFilter}
                onChange={(e) => setCampaignCommitteeFilter(e.target.value)}
              >
                <option value="">All Committees</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="studio-toolbar__right">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCreateCampaign(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> New Campaign
              </button>
            </div>
          </div>

          {loadingCampaigns ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span>Loading campaigns...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <ClipboardList size={20} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span>No campaigns matching the selected filters.</span>
            </div>
          ) : (
            <div className="hr-campaign-grid">
              {filteredCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="hr-campaign-card"
                  onClick={() => handleOpenCampaignDetails(camp)}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div>
                    <div className="hr-campaign-card__header">
                      <h4 className="hr-campaign-card__title">{camp.title}</h4>
                      <span className={`hr-status-badge hr-status-badge--${camp.status}`}>{camp.status}</span>
                    </div>
                    <div className="hr-campaign-card__meta">
                      <span><Briefcase size={13} /> {getCampaignCommitteesLabel(camp)}</span>
                      <span><Calendar size={13} /> {formatDate(camp.opensAt)} — {formatDate(camp.closesAt)}</span>
                    </div>
                    {camp.description && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>{camp.description}</p>}
                  </div>
                  <div className="hr-campaign-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditCampaign(camp);
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    {camp.status === 'draft' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCampaignStatus(camp, 'open');
                        }}
                      >
                        Open
                      </button>
                    )}
                    {camp.status === 'open' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCampaignStatus(camp, 'closed');
                        }}
                      >
                        Close
                      </button>
                    )}
                    {camp.status === 'closed' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCampaignStatus(camp, 'open');
                        }}
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SIDE DRAWER: HR Campaign Details */}
          {selectedCampaignDetails && (
            <div className="studio-drawer-overlay" style={{ zIndex: 1200 }} {...campaignDetailsBackdrop.getBackdropProps()}>
              <div className="studio-drawer-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
                <div className="studio-drawer-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Briefcase size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{selectedCampaignDetails.title}</h3>
                  </div>
                  <button type="button" className="btn btn-secondary btn-icon" onClick={() => setSelectedCampaignDetails(null)}><X size={16} /></button>
                </div>
                <div className="studio-drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--color-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Status</span>
                      <span className={`hr-status-badge hr-status-badge--${selectedCampaignDetails.status}`} style={{ marginTop: '0.2rem' }}>
                        {selectedCampaignDetails.status}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Timeline</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {formatDate(selectedCampaignDetails.opensAt)} — {formatDate(selectedCampaignDetails.closesAt)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                      Target Technical Committees
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {selectedCampaignDetails.committees && selectedCampaignDetails.committees.length > 0 ? (
                        selectedCampaignDetails.committees.map((c) => (
                          <span key={c.id} className="badge badge-secondary" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}>
                            {c.name}
                          </span>
                        ))
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}>
                          {getCommitteeName(selectedCampaignDetails.committeeId)}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedCampaignDetails.description && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                        Description & Details
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.5, background: 'var(--color-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', margin: 0 }}>
                        {selectedCampaignDetails.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0 }}>
                        Applications & Pipeline Statistics
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Click card to filter submissions</span>
                    </div>
                    {loadingCampaignDetailsApps ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Fetching campaign application submissions...</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                          <div
                            onClick={() => setCampaignDetailStageFilter('all')}
                            style={{
                              background: campaignDetailStageFilter === 'all' ? 'var(--color-primary-light)' : 'var(--color-card)',
                              border: `1.5px solid ${campaignDetailStageFilter === 'all' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.65rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Click to view all submissions"
                          >
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{campaignDetailsApps.length}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Submissions</div>
                          </div>
                          <div
                            onClick={() => setCampaignDetailStageFilter('accepted')}
                            style={{
                              background: campaignDetailStageFilter === 'accepted' ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-card)',
                              border: `1.5px solid ${campaignDetailStageFilter === 'accepted' ? '#10b981' : 'var(--color-border)'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.65rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Click to view accepted candidates"
                          >
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                              {campaignDetailsApps.filter((a) => a.currentStage === 'accepted').length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Accepted</div>
                          </div>
                          <div
                            onClick={() => setCampaignDetailStageFilter('review')}
                            style={{
                              background: campaignDetailStageFilter === 'review' ? 'rgba(245, 158, 11, 0.12)' : 'var(--color-card)',
                              border: `1.5px solid ${campaignDetailStageFilter === 'review' ? '#f59e0b' : 'var(--color-border)'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.65rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Click to view candidates under review"
                          >
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>
                              {campaignDetailsApps.filter((a) => a.currentStage !== 'accepted' && a.currentStage !== 'rejected').length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Under Review</div>
                          </div>
                        </div>

                        {/* Interactive Submissions List */}
                        {(() => {
                          const filteredSubmissions = campaignDetailsApps.filter((a) => {
                            if (campaignDetailStageFilter === 'accepted') return a.currentStage === 'accepted';
                            if (campaignDetailStageFilter === 'review') return a.currentStage !== 'accepted' && a.currentStage !== 'rejected';
                            return true;
                          });

                          return (
                            <div style={{ marginTop: 'var(--space-3)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                                  Submissions ({filteredSubmissions.length} of {campaignDetailsApps.length})
                                </span>
                                {campaignDetailStageFilter !== 'all' && (
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => setCampaignDetailStageFilter('all')}
                                    style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem' }}
                                  >
                                    Show All
                                  </button>
                                )}
                              </div>

                              {filteredSubmissions.length === 0 ? (
                                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                  No application submissions found in this category.
                                </div>
                              ) : (
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)' }}>
                                  {filteredSubmissions.map((sub) => (
                                    <div
                                      key={sub.id}
                                      onClick={() => setSelectedCandidate(sub)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.45rem 0.65rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        transition: 'background 0.12s ease',
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-card)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                          {sub.answers?.fullName || sub.applicantName || 'Candidate'}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                          {sub.applicantEmail || sub.email} • {getCommitteeName(sub.committeeId)}
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span
                                          className={`hr-status-badge hr-status-badge--${sub.currentStage === 'accepted' ? 'open' : sub.currentStage === 'rejected' ? 'closed' : 'draft'}`}
                                          style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}
                                        >
                                          {(sub.currentStage || sub.status || 'applied').replace('_', ' ')}
                                        </span>
                                        <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>

                <div className="studio-drawer-footer" style={{ flexWrap: 'wrap', gap: '0.45rem', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => handleExportCampaignApplications(selectedCampaignDetails)}
                    >
                      <Download size={14} /> Export CSV
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => {
                        const c = selectedCampaignDetails;
                        setSelectedCampaignDetails(null);
                        handleOpenEmailModal(c);
                      }}
                    >
                      <Mail size={14} /> Email Applicants
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => {
                        const c = selectedCampaignDetails;
                        setSelectedCampaignDetails(null);
                        handleOpenEditCampaign(c);
                      }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem' }}
                      onClick={() => setSelectedCampaignDetails(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Campaign Modal */}
          {showCreateCampaign && (
            <div className="modal-overlay" {...createCampaignBackdrop.getBackdropProps()}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                  <h3><Plus size={18} /> New Recruitment Campaign</h3>
                  <button type="button" className="modal-close" onClick={() => setShowCreateCampaign(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleCreateCampaign}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Campaign Title *</label>
                      <input className="form-input" value={newCampaign.title} onChange={(e) => setNewCampaign((p) => ({ ...p, title: e.target.value }))} placeholder="e.g., Fall 2026 Recruitment" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Committees * (Select all that apply)</label>
                      <div className="committee-tag-list">
                        {committees.map((c) => {
                          const isSelected = newCampaign.committeeIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`committee-tag-btn ${isSelected ? 'committee-tag-btn--active' : ''}`}
                              onClick={() => toggleCommitteeSelection(c.id, false)}
                            >
                              {isSelected && <Check size={12} />} {c.name}
                            </button>
                          );
                        })}
                      </div>
                      {newCampaign.committeeIds.length === 0 && (
                        <p className="field-error-note">Please select at least one committee.</p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-input" rows={2} value={newCampaign.description} onChange={(e) => setNewCampaign((p) => ({ ...p, description: e.target.value }))} placeholder="Optional details for applicants..." />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div className="form-group">
                        <label className="form-label">Opens At *</label>
                        <input type="datetime-local" className="form-input" value={newCampaign.opensAt} onChange={(e) => setNewCampaign((p) => ({ ...p, opensAt: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Closes At *</label>
                        <input type="datetime-local" className="form-input" value={newCampaign.closesAt} onChange={(e) => setNewCampaign((p) => ({ ...p, closesAt: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Initial Status</label>
                      <select className="form-input" value={newCampaign.status} onChange={(e) => setNewCampaign((p) => ({ ...p, status: e.target.value }))}>
                        <option value="draft">Draft</option>
                        <option value="open">Open (Active)</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateCampaign(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingCampaign || newCampaign.committeeIds.length === 0}>
                      {savingCampaign ? 'Creating...' : 'Create Campaign'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Campaign Side Drawer */}
          {editingCampaign && (
            <div className="studio-drawer-overlay" {...editCampaignBackdrop.getBackdropProps()}>
              <div className="studio-drawer-content" onClick={(e) => e.stopPropagation()}>
                <div className="studio-drawer-header">
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.25rem', fontWeight: 800 }}>
                    <Edit2 size={18} /> Edit Recruitment Campaign
                  </h3>
                  <button type="button" className="btn btn-secondary btn-icon" onClick={() => setEditingCampaign(null)}>
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleUpdateCampaign} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="studio-drawer-body">
                    <div className="form-group">
                      <label className="form-label">Campaign Title *</label>
                      <input className="form-input" value={editCampaignData.title} onChange={(e) => setEditCampaignData((p) => ({ ...p, title: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Committees * (Select all that apply)</label>
                      <div className="committee-tag-list">
                        {committees.map((c) => {
                          const isSelected = editCampaignData.committeeIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`committee-tag-btn ${isSelected ? 'committee-tag-btn--active' : ''}`}
                              onClick={() => toggleCommitteeSelection(c.id, true)}
                            >
                              {isSelected && <Check size={12} />} {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-input" rows={3} value={editCampaignData.description} onChange={(e) => setEditCampaignData((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div className="form-group">
                        <label className="form-label">Opens At *</label>
                        <input type="datetime-local" className="form-input" value={editCampaignData.opensAt} onChange={(e) => setEditCampaignData((p) => ({ ...p, opensAt: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Closes At *</label>
                        <input type="datetime-local" className="form-input" value={editCampaignData.closesAt} onChange={(e) => setEditCampaignData((p) => ({ ...p, closesAt: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-input" value={editCampaignData.status} onChange={(e) => setEditCampaignData((p) => ({ ...p, status: e.target.value }))}>
                        <option value="draft">Draft</option>
                        <option value="open">Open (Active)</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div className="studio-drawer-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingCampaign(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingCampaign || editCampaignData.committeeIds.length === 0}>
                      {savingCampaign ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Candidate Pipeline Kanban                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipeline' && (
        <>
          <div className="hr-toolbar" style={{ justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, flexWrap: 'wrap' }}>
              <div className="hr-search-wrap">
                <Search size={15} />
                <input className="hr-search-input" placeholder="Search candidates by name or email..." value={pipelineSearch} onChange={(e) => setPipelineSearch(e.target.value)} />
              </div>
              <select className="form-input" style={{ width: 'auto', minWidth: 180 }} value={pipelineFilter} onChange={(e) => setPipelineFilter(e.target.value)}>
                <option value="">All Committees</option>
                {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenRejectedModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <UserX size={15} style={{ color: 'var(--color-danger, #ef4444)' }} />
                <span>Rejected Applications</span>
              </button>
            </div>

            {/* Pipeline Options Menu */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPipelineMoreMenu((p) => !p);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', minWidth: 'auto' }}
                title="More Pipeline Actions"
              >
                <MoreVertical size={16} />
              </button>

              {showPipelineMoreMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
                    padding: '0.35rem',
                    minWidth: 210,
                    zIndex: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                    onClick={() => {
                      setShowPipelineMoreMenu(false);
                      loadApplications();
                    }}
                  >
                    <RefreshCw size={14} style={{ marginRight: '0.5rem' }} /> Refresh Pipeline
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                    onClick={() => {
                      setShowPipelineMoreMenu(false);
                      handleOpenEmailModal();
                    }}
                  >
                    <Mail size={14} style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }} /> Campaign Emails
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                    onClick={() => {
                      setShowPipelineMoreMenu(false);
                      handleExportApplications();
                    }}
                  >
                    <Download size={14} style={{ marginRight: '0.5rem' }} /> Export Pipeline CSV
                  </button>
                </div>
              )}
            </div>
          </div>

          {loadingApplications ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span>Loading applications...</span>
            </div>
          ) : (
            <div className="hr-pipeline">
              {BASE_PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage.key}
                  className="hr-pipeline-column"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('drag-over');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    handleDropCandidateOnStage(stage.key);
                  }}
                >
                  <div className="hr-pipeline-column__header">
                    <div className="hr-pipeline-column__title">
                      <span className={`hr-pipeline-column__dot hr-pipeline-column__dot--${stage.key}`} />
                      {stage.label}
                    </div>
                    <span className="hr-pipeline-column__count">{appsByStage[stage.key]?.length || 0}</span>
                  </div>
                  <div className="hr-pipeline-column__cards">
                    {(() => {
                      const allStageApps = appsByStage[stage.key] || [];
                      const limit = visibleStageCounts[stage.key] || 10;
                      const visibleApps = allStageApps.slice(0, limit);
                      const hasMore = allStageApps.length > limit;

                      return (
                        <>
                          {visibleApps.map((app) => (
                            <div
                              key={app.id}
                              className={`hr-candidate-card ${draggedCandidate?.id === app.id ? 'dragging' : ''}`}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', app.id);
                                setDraggedCandidate(app);
                              }}
                              onDragEnd={() => setDraggedCandidate(null)}
                              onClick={() => handleOpenCandidate(app)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="hr-candidate-card__name">{app.answers?.fullName || 'Unknown Applicant'}</div>
                                <GripVertical size={13} style={{ color: 'var(--color-text-subtle)', opacity: 0.6 }} />
                              </div>
                              <div className="hr-candidate-card__email">{app.applicantEmail || '—'}</div>
                              <div className="hr-candidate-card__footer">
                                <span className="hr-candidate-card__committee">{getCommitteeName(app.committeeId)}</span>
                                <span className="hr-candidate-card__date">{formatDate(app.submittedAt)}</span>
                              </div>
                            </div>
                          ))}

                          {allStageApps.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-subtle)', fontSize: '0.8rem' }}>
                              Drop candidates here
                            </div>
                          )}

                          {hasMore && (
                            <button
                              type="button"
                              className="hr-pipeline-load-more"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVisibleStageCounts((prev) => ({
                                  ...prev,
                                  [stage.key]: (prev[stage.key] || 10) + 10,
                                }));
                              }}
                            >
                              <span>+ {allStageApps.length - limit} more (Load next 10)</span>
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dedicated Rejected Applications Modal */}
          {showRejectedModal && (
            <div className="modal-overlay" {...rejectedModalBackdrop.getBackdropProps()}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
                <div className="modal-header">
                  <h3><UserX size={18} style={{ color: 'var(--color-danger, #ef4444)' }} /> Rejected Applications</h3>
                  <button type="button" className="modal-close" onClick={() => setShowRejectedModal(false)}><X size={18} /></button>
                </div>
                <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <div className="hr-search-wrap" style={{ marginBottom: '1rem' }}>
                    <Search size={15} />
                    <input
                      className="hr-search-input"
                      placeholder="Search rejected candidates by name or email..."
                      value={rejectedSearch}
                      onChange={(e) => setRejectedSearch(e.target.value)}
                    />
                  </div>

                  {loadingRejected ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Loading rejected archive...</span>
                    </div>
                  ) : filteredRejectedApplications.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <UserX size={20} style={{ opacity: 0.6 }} />
                      <span>No rejected applications found.</span>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table className="hr-roster" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '0.65rem 0.85rem' }}>CANDIDATE</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>COMMITTEE</th>
                            <th style={{ padding: '0.65rem 0.85rem' }}>DATE</th>
                            <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRejectedApplications.map((app) => (
                            <tr key={app.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                              <td style={{ padding: '0.65rem 0.85rem' }}>
                                <div style={{ fontWeight: 600 }}>{app.answers?.fullName || 'Unknown'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{app.applicantEmail}</div>
                              </td>
                              <td style={{ padding: '0.65rem 0.85rem' }}>
                                <span className="badge badge-primary">{getCommitteeName(app.committeeId)}</span>
                              </td>
                              <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                {formatDate(app.submittedAt)}
                              </td>
                              <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                    onClick={() => handleOpenCandidate(app)}
                                  >
                                    <Eye size={12} /> Details
                                  </button>
                                  {app.answers?.cvUrl && (
                                    <a
                                      href={app.answers.cvUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                      <Download size={12} /> CV
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRejectedModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Member Management (Direct Add / Remove / Role Change)       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'members' && (
        <>
          <div className="hr-toolbar">
            <div className="hr-search-wrap">
              <Search size={15} />
              <input className="hr-search-input" placeholder="Search members by name, email, or role..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
            </div>
            {hasActiveColumnFilters && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={resetAllColumnFilters}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <X size={14} /> Clear Filters
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setShowAddMember(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserPlus size={16} /> Add Member
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileSpreadsheet size={16} /> Export
            </button>
          </div>

          {loadingMembers ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span>Loading members...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: 'var(--space-12)', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              <Users size={20} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span>No members found matching the search or filter criteria.</span>
            </div>
          ) : (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'visible' }}>
              <table className="hr-roster" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'var(--color-bg)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>MEMBER</th>
                    <th style={{ padding: '0.75rem 1rem' }}>EMAIL</th>

                    {/* COMMITTEE COLUMN WITH FILTER */}
                    <th style={{ padding: '0.75rem 1rem', position: 'relative' }}>
                      <div
                        className="hr-col-header-filter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColumnFilter(openColumnFilter === 'committee' ? null : 'committee');
                        }}
                      >
                        <span>COMMITTEE</span>
                        <button
                          type="button"
                          className={`hr-col-filter-btn ${selectedCommitteeFilters.length > 0 ? 'hr-col-filter-btn--active' : ''}`}
                          aria-label="Filter committees"
                        >
                          <Filter size={13} />
                          {selectedCommitteeFilters.length > 0 && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>({selectedCommitteeFilters.length})</span>
                          )}
                        </button>
                      </div>

                      {openColumnFilter === 'committee' && (
                        <div className="hr-col-filter-popover" onClick={(e) => e.stopPropagation()}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                            Filter by Committee
                          </div>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Search committees..."
                            value={committeeFilterSearch}
                            onChange={(e) => setCommitteeFilterSearch(e.target.value)}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', marginBottom: '0.4rem' }}
                          />
                          <div className="hr-col-filter-list">
                            {committees
                              .filter((c) => !committeeFilterSearch || c.name.toLowerCase().includes(committeeFilterSearch.toLowerCase()))
                              .map((c) => {
                                const isChecked = selectedCommitteeFilters.includes(c.id);
                                return (
                                  <label key={c.id} className="hr-col-filter-item">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setSelectedCommitteeFilters((prev) =>
                                          isChecked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                        );
                                      }}
                                    />
                                    <span>{c.name}</span>
                                  </label>
                                );
                              })}
                          </div>
                          <div className="hr-col-filter-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => setSelectedCommitteeFilters([])}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => setOpenColumnFilter(null)}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* ROLE COLUMN WITH FILTER */}
                    <th style={{ padding: '0.75rem 1rem', position: 'relative' }}>
                      <div
                        className="hr-col-header-filter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColumnFilter(openColumnFilter === 'role' ? null : 'role');
                        }}
                      >
                        <span>ROLE</span>
                        <button
                          type="button"
                          className={`hr-col-filter-btn ${selectedRoleFilters.length > 0 ? 'hr-col-filter-btn--active' : ''}`}
                          aria-label="Filter roles"
                        >
                          <Filter size={13} />
                          {selectedRoleFilters.length > 0 && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>({selectedRoleFilters.length})</span>
                          )}
                        </button>
                      </div>

                      {openColumnFilter === 'role' && (
                        <div className="hr-col-filter-popover" onClick={(e) => e.stopPropagation()}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                            Filter by Role
                          </div>
                          <div className="hr-col-filter-list">
                            {[
                              { key: 'lead', label: 'Lead' },
                              { key: 'member', label: 'Member' },
                              { key: 'hr', label: 'HR' },
                            ].map((r) => {
                              const isChecked = selectedRoleFilters.includes(r.key);
                              return (
                                <label key={r.key} className="hr-col-filter-item">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedRoleFilters((prev) =>
                                        isChecked ? prev.filter((k) => k !== r.key) : [...prev, r.key]
                                      );
                                    }}
                                  />
                                  <span>{r.label}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="hr-col-filter-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => setSelectedRoleFilters([])}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => setOpenColumnFilter(null)}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* JOINED COLUMN WITH FILTER */}
                    <th style={{ padding: '0.75rem 1rem', position: 'relative' }}>
                      <div
                        className="hr-col-header-filter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColumnFilter(openColumnFilter === 'joined' ? null : 'joined');
                        }}
                      >
                        <span>JOINED</span>
                        <button
                          type="button"
                          className={`hr-col-filter-btn ${joinedDateFrom || joinedDateTo ? 'hr-col-filter-btn--active' : ''}`}
                          aria-label="Filter joined date"
                        >
                          <Filter size={13} />
                          {(joinedDateFrom || joinedDateTo) && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>•</span>
                          )}
                        </button>
                      </div>

                      {openColumnFilter === 'joined' && (
                        <div className="hr-col-filter-popover hr-col-filter-popover--right" onClick={(e) => e.stopPropagation()}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                            Filter Joined Date
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>From:</label>
                              <input
                                type="date"
                                className="form-input"
                                value={joinedDateFrom}
                                onChange={(e) => setJoinedDateFrom(e.target.value)}
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>To:</label>
                              <input
                                type="date"
                                className="form-input"
                                value={joinedDateTo}
                                onChange={(e) => setJoinedDateTo(e.target.value)}
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                              />
                            </div>
                          </div>
                          <div className="hr-col-filter-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                setJoinedDateFrom('');
                                setJoinedDateTo('');
                              }}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => setOpenColumnFilter(null)}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={`${m.committeeId}-${m.externalUserId || m.id}`} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                      <td
                        style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-primary)' }}
                        onClick={() => setSelectedProfileUserId(m.externalUserId || m.userId || m.id)}
                        title={`View ${m.name || 'Member'}'s profile`}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{m.name || 'Member'}</span>
                          {/* <ExternalLink size={12} style={{ opacity: 0.6 }} /> */}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{m.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge badge-committee">{m.committeeName || getCommitteeName(m.committeeId)}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${m.roleInCommittee === 'lead' ? 'badge-warning' : m.roleInCommittee === 'hr' ? 'badge-hr' : 'badge-outline'}`}>
                          {m.roleInCommittee === 'hr' ? 'HR' : m.roleInCommittee === 'lead' ? 'Lead' : 'Member'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{formatDate(m.createdAt)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', position: 'relative' }}>
                        <div className="hr-action-menu-wrap">
                          <button
                            type="button"
                            className="hr-action-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const key = `${m.committeeId}-${m.externalUserId || m.id}`;
                              setOpenActionMenuKey(openActionMenuKey === key ? null : key);
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openActionMenuKey === `${m.committeeId}-${m.externalUserId || m.id}` && (
                            <div className="hr-action-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                              {/* Set as Member */}
                              {m.roleInCommittee !== 'member' && (
                                <div
                                  className="hr-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuKey(null);
                                    handleChangeRole(m, 'member');
                                  }}
                                >
                                  Set as member
                                </div>
                              )}

                              {/* Set as HR */}
                              {m.roleInCommittee !== 'hr' && (
                                <div
                                  className="hr-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuKey(null);
                                    handleChangeRole(m, 'hr');
                                  }}
                                >
                                  Set as HR
                                </div>
                              )}

                              {/* Set as Lead (Admins & Officers only) */}
                              {isGlobalAdminOrOfficer && m.roleInCommittee !== 'lead' && (
                                <div
                                  className="hr-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuKey(null);
                                    handleChangeRole(m, 'lead');
                                  }}
                                >
                                  Set as Lead
                                </div>
                              )}

                              {/* Divider */}
                              {(m.roleInCommittee !== 'lead' || isGlobalAdminOrOfficer) && (
                                <div className="hr-action-menu-divider" />
                              )}

                              {/* Remove Member */}
                              {(m.roleInCommittee !== 'lead' || isGlobalAdminOrOfficer) && (
                                <div
                                  className="hr-action-menu-item hr-action-menu-item--danger"
                                  onClick={() => {
                                    setOpenActionMenuKey(null);
                                    handleRemoveMember(m);
                                  }}
                                >
                                  Remove member
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Member Modal with User Search Autocomplete */}
          {showAddMember && (
            <div className="modal-overlay" {...addMemberBackdrop.getBackdropProps()}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                  <h3><UserPlus size={18} /> Add Members to Committee</h3>
                  <button type="button" className="modal-close" onClick={() => setShowAddMember(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleBatchAddMembers}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Search Registered Portal Users *</label>
                      <div className="hr-search-wrap">
                        <Search size={15} />
                        <input
                          className="hr-search-input"
                          placeholder="Type name or email to search..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Search Results / Selected Users List */}
                      {searchingUsers && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: 4 }} /> Searching users...
                        </div>
                      )}

                      {userSearchResults.length > 0 && (
                        <div className="user-picker-list">
                          {userSearchResults.map((u) => {
                            const isSelected = selectedUsers.some((item) => item.id === u.id);
                            return (
                              <div
                                key={u.id}
                                className={`user-picker-item ${isSelected ? 'user-picker-item--selected' : ''}`}
                                onClick={() => toggleUserSelection(u)}
                              >
                                {isSelected ? <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} /> : <Square size={16} style={{ color: 'var(--color-text-subtle)' }} />}
                                <div>
                                  <div className="user-picker-item__name">{u.name}</div>
                                  <div className="user-picker-item__email">{u.email}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedUsers.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                            Selected Users ({selectedUsers.length}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {selectedUsers.map((u) => (
                              <span
                                key={u.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: 'var(--radius-md)',
                                  background: 'var(--color-primary-light)',
                                  color: 'var(--color-primary)',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                {u.name} ({u.email})
                                <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleUserSelection(u)} />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Assign To Committee *</label>
                      <select className="form-input" value={targetCommitteeId} onChange={(e) => setTargetCommitteeId(e.target.value)} required>
                        {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role in Committee</label>
                      <select className="form-input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                        <option value="member">Member</option>
                        <option value="hr">HR</option>
                        {isGlobalAdminOrOfficer && <option value="lead">Lead</option>}
                      </select>
                      {!isGlobalAdminOrOfficer && targetRole !== 'lead' && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          Note: Committee Lead role assignment is reserved for Officers.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingMembers || selectedUsers.length === 0}>
                      {savingMembers ? 'Adding...' : `Add ${selectedUsers.length} Member(s)`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: Onboarding & Welcome Email                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'onboarding' && (
        <div className="hr-onboarding-studio">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <ListChecks size={22} style={{ color: 'var(--color-primary)' }} />
                <span>Onboarding & Welcome Email</span>
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                Manage official welcome emails and configure member checklists.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowOnboardingSettingsModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}
              >
                <Settings size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Template Settings</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowOnboardingQueueModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
                title="View & manage accepted candidates queue"
              >
                <Users size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Accepted Queue</span>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', marginLeft: '0.15rem' }}>
                  {onboardingSummary.unsentCount}
                </span>
                {/* {onboardingSummary.unsentCount > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }} title="Pending welcome dispatch">
                    {onboardingSummary.unsentCount} Unsent
                  </span>
                )} */}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={dispatchingBulkWelcome || onboardingSummary.unsentCount === 0}
                onClick={handleDispatchBulkWelcome}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}
              >
                {dispatchingBulkWelcome ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                <span>
                  {onboardingSummary.unsentCount > 0 ? `Send Emails (${onboardingSummary.unsentCount})` : 'All Welcomed'}
                </span>
              </button>
            </div>
          </div>

          {/* 2-Column Overview: Left Workflow & Config / Right Live Client Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
            {/* Left Column: Checklist Workflow Customizer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Card 1: 4-Step Checklist Direct Inline Customizer */}
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} />
                    <span>Onboarding Checklist Workflow</span>
                  </h4>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleSaveOnboardingDefaults}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Check size={12} /> Save Steps
                  </button>
                </div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: 'var(--space-3)' }}>
                  These 4 sequential action steps appear in the welcome email and create personal dashboard tasks for accepted candidates.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {onboardingConfig.checklistSteps.map((stepItem, idx) => (
                    <div
                      key={stepItem.id || idx}
                      style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div
                          style={{
                            width: '1.35rem',
                            height: '1.35rem',
                            borderRadius: '50%',
                            background: 'var(--color-primary)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontWeight: 600, fontSize: '0.8125rem', padding: '0.3rem 0.5rem' }}
                          value={stepItem.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOnboardingConfig((p) => {
                              const updated = [...p.checklistSteps];
                              updated[idx] = { ...updated[idx], title: val };
                              return { ...p, checklistSteps: updated };
                            });
                          }}
                          placeholder={`Step ${idx + 1} Title`}
                        />
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--color-text-muted)' }}
                        value={stepItem.desc}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOnboardingConfig((p) => {
                            const updated = [...p.checklistSteps];
                            updated[idx] = { ...updated[idx], desc: val };
                            return { ...p, checklistSteps: updated };
                          });
                        }}
                        placeholder="Brief instruction or purpose..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Official Community Channels Inline Customizer */}
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Globe size={16} style={{ color: 'var(--color-primary)' }} />
                    <span>Official Community Channels</span>
                  </h4>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleSaveOnboardingDefaults}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Check size={12} /> Save Channels
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                      WhatsApp Group Invite URL
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      style={{ fontSize: '0.8125rem' }}
                      value={onboardingConfig.whatsappUrl}
                      onChange={(e) => setOnboardingConfig((p) => ({ ...p, whatsappUrl: e.target.value }))}
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                      Discord / Slack Invite URL
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      style={{ fontSize: '0.8125rem' }}
                      value={onboardingConfig.discordUrl}
                      onChange={(e) => setOnboardingConfig((p) => ({ ...p, discordUrl: e.target.value }))}
                      placeholder="https://discord.gg/..."
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Automated Onboarding Process */}
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', color: 'var(--color-primary)' }}>
                  Automated Candidate Onboarding Trigger
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  When an HR reviewer clicks <strong>Accept &amp; Enroll</strong> in Final Review, the candidate is automatically assigned committee member permissions, initialized with the 4-step checklist on their portal dashboard, and queued to receive this welcome package.
                </p>
              </div>
            </div>

            {/* Right Column: Live Simulated Welcome Email Preview */}
            <div style={{ position: 'sticky', top: '5.5rem' }}>
              <div className="pr-email-client">
                <div className="pr-email-client__window-bar">
                  <div className="pr-email-client__dots">
                    <span className="pr-email-client__dot pr-email-client__dot--red" />
                    <span className="pr-email-client__dot pr-email-client__dot--yellow" />
                    <span className="pr-email-client__dot pr-email-client__dot--green" />
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Client Preview
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      className={`btn btn-xs ${onboardingPreviewDevice === 'desktop' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOnboardingPreviewDevice('desktop')}
                      style={{ padding: '0.15rem 0.4rem', height: 'auto' }}
                      title="Desktop Client View"
                    >
                      <Monitor size={12} />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${onboardingPreviewDevice === 'mobile' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOnboardingPreviewDevice('mobile')}
                      style={{ padding: '0.15rem 0.4rem', height: 'auto' }}
                      title="Mobile Device View"
                    >
                      <Smartphone size={12} />
                    </button>
                  </div>
                </div>

                <div className="pr-email-client__meta">
                  <div className="pr-email-client__meta-row">
                    <span className="pr-email-client__meta-label">From:</span>
                    <span className="pr-email-client__meta-val">IEEE Menoufia HR Team &lt;hr@ieeemsb.org&gt;</span>
                  </div>
                  <div className="pr-email-client__meta-row">
                    <span className="pr-email-client__meta-label">To:</span>
                    <span className="pr-email-client__meta-val">Yousef (Accepted Candidate) &lt;candidate@ieee.local&gt;</span>
                  </div>
                  <div className="pr-email-client__meta-row">
                    <span className="pr-email-client__meta-label">Subject:</span>
                    <span className="pr-email-client__meta-val" style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {onboardingConfig.subject || 'Welcome to IEEE Menoufia Student Branch!'}
                    </span>
                  </div>
                </div>

                <div className="pr-email-client__body-container" style={{ padding: '1.25rem', background: '#f8fafc', minHeight: 'auto', maxHeight: 'none', height: 'auto', overflow: 'visible' }}>
                  {(() => {
                    const rawHtml = onboardingConfig.templateMode === 'full'
                      ? onboardingConfig.body
                      : getDefaultWelcomeEmailTemplate({
                        memberName: '{{candidate.name}}',
                        committeeName: '{{candidate.committee}}',
                        headline: onboardingConfig.headline || DEFAULT_ONBOARDING_CONFIG.headline,
                        welcomeMessage: onboardingConfig.body,
                        whatsappUrl: '{{channels.whatsapp}}',
                        discordUrl: '{{channels.discord}}',
                        orientationDate: '{{orientation.date}}',
                      });

                    const previewContext = buildOnboardingVariableContext({
                      name: 'Yousef',
                      committeeName: 'Robotics & Automation (RAS)',
                      stage: 'ACCEPTED',
                    });

                    const previewHtml = interpolateVariables(rawHtml, previewContext);

                    return (
                      <div
                        style={{
                          maxWidth: onboardingPreviewDevice === 'mobile' ? '340px' : '100%',
                          width: '100%',
                          margin: '0 auto',
                          transition: 'max-width 0.25s ease',
                          background: '#ffffff',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                        }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding Welcome Email Template Settings Modal */}
          {showOnboardingSettingsModal && (
            <div className="modal-overlay" style={{ zIndex: 1250 }} {...onboardingSettingsBackdrop.getBackdropProps()}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ margin: 0 }}>Welcome Email Template Settings</h3>
                  </div>
                  <button type="button" className="modal-close" onClick={() => setShowOnboardingSettingsModal(false)}><X size={18} /></button>
                </div>

                <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Email Subject */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Email Subject Line *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={onboardingConfig.subject}
                      onChange={(e) => setOnboardingConfig((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="Welcome to IEEE Menoufia Student Branch!"
                    />
                  </div>

                  {/* Welcome Message (PR Studio Parity) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <label className="form-label" style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700 }}>
                        {onboardingConfig.templateMode === 'full' ? 'Welcome Letter HTML Template *' : 'Welcome Letter Body *'}
                      </label>

                      <div style={{ display: 'inline-flex', background: 'var(--color-surface)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gap: '2px' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${onboardingConfig.templateMode !== 'full' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleToggleOnboardingTemplateMode('standard')}
                          style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                          title="Standard Content: Write text/markdown inside the official IEEE Menoufia onboarding structure"
                        >
                          Standard Content
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${onboardingConfig.templateMode === 'full' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleToggleOnboardingTemplateMode('full')}
                          style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                          title="Full HTML Template: Edit complete <!DOCTYPE html> template including checklist, links & branding"
                        >
                          <Code size={11} />
                          <span>Full HTML Template</span>
                        </button>
                      </div>
                    </div>

                    {onboardingConfig.templateMode === 'full' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 98, 155, 0.08)', border: '1px solid rgba(0, 98, 155, 0.25)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          Editing complete <code style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>&lt;!DOCTYPE html&gt;</code> document.
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={handleResetOnboardingDefaultTemplate}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', flexShrink: 0 }}
                          title="Reset to default official IEEE Menoufia onboarding structure"
                        >
                          <RotateCcw size={11} />
                          <span>Reset to Default</span>
                        </button>
                      </div>
                    )}

                    <div className="pr-vars-toolbar" style={{ flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span className="pr-vars-label">Insert Dynamic Tags:</span>
                      {[
                        { label: 'Name', code: 'candidate.name' },
                        { label: 'Committee', code: 'candidate.committee' },
                        { label: 'Stage', code: 'candidate.stage' },
                        { label: 'Email', code: 'candidate.email' },
                        { label: 'Faculty', code: 'candidate.faculty' },
                        { label: 'Option 1 Title', code: 'checklist.option1' },
                        { label: 'Option 1 Desc', code: 'checklist.option1.desc' },
                        { label: 'Option 2 Title', code: 'checklist.option2' },
                        { label: 'Option 2 Desc', code: 'checklist.option2.desc' },
                        { label: 'Option 3 Title', code: 'checklist.option3' },
                        { label: 'Option 3 Desc', code: 'checklist.option3.desc' },
                        { label: 'Option 4 Title', code: 'checklist.option4' },
                        { label: 'Option 4 Desc', code: 'checklist.option4.desc' },
                        { label: 'WhatsApp', code: 'channels.whatsapp' },
                        { label: 'Discord', code: 'channels.discord' },
                        { label: 'Orientation', code: 'orientation.date' },
                        { label: 'Branch Name', code: 'branch.name' },
                      ].map((v) => (
                        <button
                          key={v.code}
                          type="button"
                          className="pr-var-chip"
                          onClick={() => insertOnboardingVariableTag(v.code)}
                          title={`Insert {{${v.code}}}`}
                        >
                          + &#123;&#123;{v.code}&#125;&#125;
                        </button>
                      ))}
                    </div>

                    {/* Formatting Toolbar in Standard Mode */}
                    {onboardingConfig.templateMode !== 'full' && (
                      <div className="pr-editor-toolbar">
                        <div className="pr-editor-btn-group">
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyOnboardingFormatting('bold')}
                            title="Bold"
                          >
                            <Bold size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyOnboardingFormatting('italic')}
                            title="Italic"
                          >
                            <Italic size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyOnboardingFormatting('h2')}
                            title="Heading 2"
                          >
                            <Heading2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyOnboardingFormatting('h3')}
                            title="Heading 3"
                          >
                            <Heading3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyOnboardingFormatting('list')}
                            title="Bullet List"
                          >
                            <List size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyOnboardingFormatting('link')}
                            title="Insert Link"
                          >
                            <Link2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyOnboardingFormatting('divider')}
                            title="Horizontal Divider"
                          >
                            <Minus size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="pr-editor-mode-toggle"
                          onClick={() =>
                            setOnboardingConfig((p) => ({
                              ...p,
                              editorMode: p.editorMode === 'markdown' ? 'html' : 'markdown',
                            }))
                          }
                        >
                          <Code size={12} />
                          <span>{onboardingConfig.editorMode === 'html' ? 'Custom HTML Mode' : 'Markdown Mode'}</span>
                        </button>
                      </div>
                    )}

                    <textarea
                      ref={onboardingBodyTextareaRef}
                      className="form-input"
                      rows={onboardingConfig.templateMode === 'full' ? 14 : 9}
                      value={onboardingConfig.body}
                      onChange={(e) => setOnboardingConfig((p) => ({ ...p, body: e.target.value }))}
                      style={{
                        fontFamily: (onboardingConfig.templateMode === 'full' || onboardingConfig.editorMode === 'html') ? 'var(--font-mono)' : 'inherit',
                        fontSize: (onboardingConfig.templateMode === 'full' || onboardingConfig.editorMode === 'html') ? '0.78125rem' : '0.875rem',
                        resize: 'vertical',
                        lineHeight: 1.5,
                      }}
                      placeholder={
                        onboardingConfig.templateMode === 'full'
                          ? '<!DOCTYPE html>\n<html>\n  <body>...</body>\n</html>'
                          : (onboardingConfig.editorMode === 'html'
                            ? '<h2>Congratulations & Welcome!</h2>\n<p>Write custom HTML here...</p>'
                            : 'We are delighted to confirm your acceptance...\n\nWrite your welcome message in Markdown or text...')
                      }
                      required
                    />
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {onboardingConfig.templateMode === 'full'
                        ? 'Full HTML mode: complete control over outer wrapper, responsive styles, and checklist markup.'
                        : 'Supports Markdown formatting and dynamic candidate placeholders.'}
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowOnboardingSettingsModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      handleSaveOnboardingDefaults();
                      setShowOnboardingSettingsModal(false);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Check size={14} />
                    <span>Save Template Defaults</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Accepted Candidates & Welcome Email Dispatch Queue */}
          {showOnboardingQueueModal && (
            <div className="modal-overlay" style={{ zIndex: 1150 }} {...onboardingQueueBackdrop.getBackdropProps()}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: 960,
                  width: '95%',
                  maxHeight: '88vh',
                  display: 'flex',
                  flexDirection: 'column',
                  margin: 'auto',
                  zIndex: 1151,
                }}
              >
                <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Users size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Accepted Candidates Queue</h3>
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                      {onboardingSummary.totalAccepted} Accepted
                    </span>
                    {onboardingSummary.unsentCount > 0 && (
                      <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                        {onboardingSummary.unsentCount} Unsent
                      </span>
                    )}
                  </div>
                  <button type="button" className="modal-close" onClick={() => setShowOnboardingQueueModal(false)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Filter & Search Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div className="hr-search-wrap" style={{ maxWidth: 320, flex: 1, position: 'relative' }}>
                      <Search size={15} />
                      <input
                        type="text"
                        className="hr-search-input"
                        placeholder="Search candidate, email, committee..."
                        value={onboardingSearchQuery}
                        onChange={(e) => setOnboardingSearchQuery(e.target.value)}
                        style={{ paddingRight: onboardingSearchQuery ? '2rem' : '0.85rem' }}
                      />
                      {onboardingSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setOnboardingSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '0.65rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'inline-flex', background: 'var(--color-surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', gap: '4px' }}>
                      <button
                        type="button"
                        className={`btn btn-xs ${onboardingFilterStatus === 'unsent' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setOnboardingFilterStatus('unsent')}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                      >
                        Unsent ({onboardingSummary.unsentCount})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs ${onboardingFilterStatus === 'sent' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setOnboardingFilterStatus('sent')}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                      >
                        Sent ({onboardingCandidates.filter((c) => c.welcomeEmailSent).length})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs ${onboardingFilterStatus === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setOnboardingFilterStatus('all')}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                      >
                        All ({onboardingCandidates.length})
                      </button>
                    </div>
                  </div>

                  {/* Candidates List / Table */}
                  {loadingOnboardingCandidates ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: 6 }} />
                      <span>Loading accepted candidates...</span>
                    </div>
                  ) : filteredOnboardingCandidates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                      {onboardingCandidates.length === 0
                        ? 'No accepted candidates found. When candidates are accepted in Final Review, they appear here ready for onboarding.'
                        : 'No candidates match the selected search or filter criteria.'}
                    </div>
                  ) : (
                    <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <table className="data-table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ textAlign: 'left', padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem', width: '28%' }}>Candidate</th>
                            <th style={{ textAlign: 'left', padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem', width: '22%' }}>Committee</th>
                            <th style={{ textAlign: 'left', padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem', width: '24%' }}>Faculty</th>
                            <th style={{ textAlign: 'left', padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem', width: '12%' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem', width: '14%' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOnboardingCandidates.map((candidate) => {
                            const candidateName = candidate.answers?.fullName || candidate.applicantName || 'New Member';
                            const candidateEmail = candidate.applicantEmail || candidate.email || candidate.answers?.email;
                            const isSendingThis = dispatchingSingleWelcomeId === candidate.id;
                            return (
                              <tr key={candidate.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ textAlign: 'left', padding: '0.65rem 0.85rem', verticalAlign: 'middle' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{candidateName}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{candidateEmail}</div>
                                </td>
                                <td style={{ textAlign: 'left', padding: '0.65rem 0.85rem', verticalAlign: 'middle' }}>
                                  <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                                    {candidate.committeeName || getCommitteeName(candidate.committeeId)}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'left', padding: '0.65rem 0.85rem', verticalAlign: 'middle', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                  {candidate.answers?.faculty || '—'}
                                </td>
                                <td style={{ textAlign: 'left', padding: '0.65rem 0.85rem', verticalAlign: 'middle' }}>
                                  {candidate.welcomeEmailSent ? (
                                    <span className="badge badge-success" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <Check size={11} /> Sent
                                    </span>
                                  ) : (
                                    <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                                      Unsent
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right', padding: '0.65rem 0.85rem', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs"
                                      onClick={() => setSelectedCandidate(candidate)}
                                      title="View candidate details & answers"
                                      style={{ padding: '0.25rem 0.5rem' }}
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-xs"
                                      disabled={isSendingThis || dispatchingBulkWelcome}
                                      onClick={() => handleDispatchSingleWelcome(candidate)}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                                      title={candidate.welcomeEmailSent ? 'Resend welcome email to this candidate' : 'Send welcome email to this candidate'}
                                    >
                                      {isSendingThis ? (
                                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                      ) : (
                                        <Send size={12} />
                                      )}
                                      <span>{candidate.welcomeEmailSent ? 'Resend' : 'Send'}</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Showing {filteredOnboardingCandidates.length} of {onboardingCandidates.length} accepted candidate(s)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowOnboardingQueueModal(false)}>
                      Close
                    </button>
                    {onboardingSummary.unsentCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={dispatchingBulkWelcome}
                        onClick={handleDispatchBulkWelcome}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {dispatchingBulkWelcome ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                        <span>Send ({onboardingSummary.unsentCount})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SIDE DRAWER: Candidate Details */}
      {selectedCandidate && (
        <div className="studio-drawer-overlay" style={{ zIndex: 1250 }} {...candidateDetailsBackdrop.getBackdropProps()}>
          <div className="studio-drawer-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="studio-drawer-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.25rem', fontWeight: 800 }}>
                <Eye size={18} /> Candidate Details
              </h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setSelectedCandidate(null)}><X size={16} /></button>
            </div>
            <div className="studio-drawer-body" style={{ overflowY: 'auto' }}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selectedCandidate.answers?.fullName || 'Unknown'}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{selectedCandidate.applicantEmail}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`hr-status-badge hr-status-badge--${selectedCandidate.currentStage === 'final_review' || selectedCandidate.currentStage === 'accepted' ? 'open' : 'draft'}`}>
                      {selectedCandidate.currentStage?.replace('_', ' ')}
                    </span>
                    <span className="hr-candidate-card__committee">{getCommitteeName(selectedCandidate.committeeId)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleQuickMailCandidate(selectedCandidate)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                    >
                      <Mail size={13} />
                      <span>Mail Candidate</span>
                    </button>

                    {(selectedCandidate.applicantUserId || selectedCandidate.userId) && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => setSelectedProfileUserId(selectedCandidate.applicantUserId || selectedCandidate.userId)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                      >
                        <User size={13} />
                        <span>View Profile</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CV / Resume Download Button */}
              {selectedCandidate.answers?.cvUrl && (
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedCandidate.answers.cvFileName || 'Applicant_CV.pdf'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Curriculum Vitae / Resume</div>
                    </div>
                  </div>
                  <a
                    href={selectedCandidate.answers.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <ExternalLink size={13} /> View / Download
                  </a>
                </div>
              )}

              {/* Application Answers */}
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Application Form Responses</h5>
                {Object.entries(selectedCandidate.answers || {}).map(([key, val]) => (
                  val && key !== 'cvUrl' && key !== 'cvFileName' && (
                    <div key={key} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: 120, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span style={{ fontWeight: 500 }}>{String(val)}</span>
                    </div>
                  )
                ))}
              </div>

              {/* Notes & Score */}
              <div className="form-group">
                <label className="form-label">Review Notes</label>
                <textarea className="form-input" rows={3} value={candidateNotes} onChange={(e) => handleNotesChange(e.target.value)} placeholder="Type interview observations or candidate evaluation..." />
              </div>
              {selectedCandidate.currentStage !== 'final_review' && selectedCandidate.currentStage !== 'accepted' && (
                <div className="form-group">
                  <label className="form-label">Evaluation Rating (1 to 10)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="10"
                    value={candidateScore}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    placeholder="Rate candidate from 1 to 10"
                  />
                </div>
              )}
            </div>
            <div className="studio-drawer-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              {STAGE_NEXT[selectedCandidate.currentStage] && (
                <button type="button" className="btn btn-primary" disabled={processingAction} onClick={() => handleAdvanceStage(selectedCandidate)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ArrowRight size={14} /> Move to {STAGE_NEXT[selectedCandidate.currentStage].replace('_', ' ')}
                </button>
              )}
              {selectedCandidate.currentStage === 'final_review' && (
                <button type="button" className="btn btn-primary" disabled={processingAction} onClick={() => handleAccept(selectedCandidate)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#10b981' }}>
                  <ThumbsUp size={14} /> Accept & Enroll
                </button>
              )}
              {selectedCandidate.currentStage !== 'rejected' && selectedCandidate.currentStage !== 'accepted' && (
                <button type="button" className="btn" disabled={processingAction} onClick={() => handleReject(selectedCandidate)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--color-destructive)', color: '#fff', border: 'none' }}>
                  <ThumbsDown size={14} /> Reject
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedCandidate(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HR Email Outreach Center Modal (2-Column PR Studio Style Layout)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showEmailModal && (
        <div className="modal-overlay" style={{ zIndex: 1300 }} {...emailModalBackdrop.getBackdropProps()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1120, width: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0 }}>{emailForm.title || 'Campaign & Pipeline Email Outreach'}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowEmailModal(false)}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: 'var(--space-5)' }}>
              {/* 2-Column Responsive Grid: Form on Left, Live Rendered Preview on Right */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-5)', alignItems: 'start' }}>
                {/* Left Column: Targeting, Subject, Markdown Editor, Scheduling */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* 1. Recipient Targeting Mode */}
                  <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>1. Select Target Candidates</label>
                        <span className="badge badge-primary" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={11} /> Expected Recipients: {expectedRecipientsCount}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${emailForm.recipientMode === 'stages' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setEmailForm((p) => ({ ...p, recipientMode: 'stages' }))}
                        >
                          By Stages
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${emailForm.recipientMode === 'candidates' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setEmailForm((p) => ({ ...p, recipientMode: 'candidates' }))}
                        >
                          Specific Candidates ({emailForm.selectedCandidateIds.length})
                        </button>
                      </div>
                    </div>

                    {/* Mode: Stages */}
                    {emailForm.recipientMode === 'stages' ? (
                      <div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-2)' }}>
                          Select all candidate stages that should receive this email:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {availableStagesForEmail.map((stageItem) => {
                            const isSelected = emailForm.selectedStages.includes(stageItem.key);
                            return (
                              <button
                                key={stageItem.key}
                                type="button"
                                className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => {
                                  setEmailForm((p) => ({
                                    ...p,
                                    selectedStages: isSelected
                                      ? p.selectedStages.filter((k) => k !== stageItem.key)
                                      : [...p.selectedStages, stageItem.key],
                                  }));
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                              >
                                {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                                <span>{stageItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Mode: Specific Candidates */
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-2)' }}
                          placeholder="Search candidates by name or email..."
                          value={emailForm.candidateSearch}
                          onChange={(e) => setEmailForm((p) => ({ ...p, candidateSearch: e.target.value }))}
                        />
                        <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
                          {[...applications, ...rejectedApplications]
                            .filter((cand) => {
                              if (!emailForm.candidateSearch) return true;
                              const q = emailForm.candidateSearch.toLowerCase();
                              const name = (cand.answers?.fullName || cand.applicantName || '').toLowerCase();
                              const email = (cand.applicantEmail || cand.email || '').toLowerCase();
                              return name.includes(q) || email.includes(q);
                            })
                            .map((cand) => {
                              const isChecked = emailForm.selectedCandidateIds.includes(cand.id);
                              return (
                                <label
                                  key={cand.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    background: isChecked ? 'var(--color-primary-light)' : 'transparent',
                                    fontSize: '0.8125rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setEmailForm((p) => ({
                                          ...p,
                                          selectedCandidateIds: checked
                                            ? [...p.selectedCandidateIds, cand.id]
                                            : p.selectedCandidateIds.filter((id) => id !== cand.id),
                                        }));
                                      }}
                                    />
                                    <div>
                                      <strong>{cand.answers?.fullName || 'Candidate'}</strong>
                                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                                        {cand.applicantEmail || cand.email}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                                    {(cand.currentStage || cand.status || 'applied').replace('_', ' ')}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Subject Line */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>2. Email Subject Line *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="e.g., [IEEE MSB Recruitment] Next Steps & Interview Schedule"
                      required
                    />
                  </div>

                  {/* 3. Dynamic Variable Chips & Email Body (PR Studio Parity) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <label className="form-label" style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700 }}>
                        {emailForm.templateMode === 'full' ? '3. Full Email HTML Template *' : '3. Email Content Body *'}
                      </label>

                      <div style={{ display: 'inline-flex', background: 'var(--color-surface)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', gap: '2px' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${emailForm.templateMode !== 'full' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleToggleEmailTemplateMode('standard')}
                          style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                          title="Standard Content: Write simple text/markdown wrapped in default IEEE styling"
                        >
                          Standard Content
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${emailForm.templateMode === 'full' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleToggleEmailTemplateMode('full')}
                          style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                          title="Full HTML Template: Edit the entire <!DOCTYPE html> template including outer table, gradient header & footer"
                        >
                          <Code size={11} />
                          <span>Full HTML Template</span>
                        </button>
                      </div>
                    </div>

                    {emailForm.templateMode === 'full' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 98, 155, 0.08)', border: '1px solid rgba(0, 98, 155, 0.25)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          Editing complete <code style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>&lt;!DOCTYPE html&gt;</code> document.
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={handleResetEmailDefaultTemplate}
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
                      {[
                        { label: 'Name', code: 'candidate.name' },
                        { label: 'Committee', code: 'candidate.committee' },
                        { label: 'Stage', code: 'candidate.stage' },
                        { label: 'Email', code: 'candidate.email' },
                        { label: 'Faculty', code: 'candidate.faculty' },
                        { label: 'Branch Name', code: 'branch.name' },
                      ].map((v) => (
                        <button
                          key={v.code}
                          type="button"
                          className="pr-var-chip"
                          onClick={() => insertEmailVariableTag(v.code)}
                          title={`Insert {{${v.code}}}`}
                        >
                          + &#123;&#123;{v.code}&#125;&#125;
                        </button>
                      ))}
                    </div>

                    {/* Formatting Toolbar in Standard Mode */}
                    {emailForm.templateMode !== 'full' && (
                      <div className="pr-editor-toolbar">
                        <div className="pr-editor-btn-group">
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyEmailFormatting('bold')}
                            title="Bold"
                          >
                            <Bold size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyEmailFormatting('italic')}
                            title="Italic"
                          >
                            <Italic size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyEmailFormatting('h2')}
                            title="Heading 2"
                          >
                            <Heading2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyEmailFormatting('h3')}
                            title="Heading 3"
                          >
                            <Heading3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyEmailFormatting('list')}
                            title="Bullet List"
                          >
                            <List size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyEmailFormatting('link')}
                            title="Insert Link"
                          >
                            <Link2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="pr-editor-btn"
                            onClick={() => applyEmailFormatting('divider')}
                            title="Horizontal Divider"
                          >
                            <Minus size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="pr-editor-mode-toggle"
                          onClick={() =>
                            setEmailForm((p) => ({
                              ...p,
                              editorMode: p.editorMode === 'markdown' ? 'html' : 'markdown',
                            }))
                          }
                        >
                          <Code size={12} />
                          <span>{emailForm.editorMode === 'html' ? 'Custom HTML Mode' : 'Markdown Mode'}</span>
                        </button>
                      </div>
                    )}

                    <textarea
                      ref={bodyTextareaRef}
                      className="form-input"
                      rows={emailForm.templateMode === 'full' ? 12 : 7}
                      value={emailForm.body}
                      onChange={(e) => setEmailForm((p) => ({ ...p, body: e.target.value }))}
                      style={{
                        fontFamily: (emailForm.templateMode === 'full' || emailForm.editorMode === 'html') ? 'var(--font-mono)' : 'inherit',
                        fontSize: (emailForm.templateMode === 'full' || emailForm.editorMode === 'html') ? '0.78125rem' : '0.875rem',
                        resize: 'vertical',
                        lineHeight: 1.5,
                      }}
                      placeholder={
                        emailForm.templateMode === 'full'
                          ? '<!DOCTYPE html>\n<html>\n  <body>...</body>\n</html>'
                          : (emailForm.editorMode === 'html'
                            ? '<h2>Important Recruitment Update</h2>\n<p>Write custom HTML here...</p>'
                            : 'Hello {{candidate.name}},\n\nWrite your email body in Markdown or text...')
                      }
                      required
                    />
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {emailForm.templateMode === 'full'
                        ? 'Full HTML mode: complete control over outer wrapper, responsive meta tags, styling, and typography.'
                        : 'Supports Markdown formatting and dynamic candidate placeholders.'}
                    </div>
                  </div>

                  {/* 4. Scheduled Dispatch */}
                  <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                      <span>4. Scheduled (Optional)</span>
                    </label>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                      Leave empty to dispatch immediately, or choose a future date &amp; time.
                    </p>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={emailForm.scheduledFor}
                      onChange={(e) => setEmailForm((p) => ({ ...p, scheduledFor: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Right Column: Sticky Live Rendered Client Preview */}
                <div style={{ position: 'sticky', top: '0.5rem' }}>
                  <div className="pr-email-client" style={{ borderRadius: 'var(--radius-md)' }}>
                    <div className="pr-email-client__window-bar">
                      <div className="pr-email-client__dots">
                        <span className="pr-email-client__dot pr-email-client__dot--red" />
                        <span className="pr-email-client__dot pr-email-client__dot--yellow" />
                        <span className="pr-email-client__dot pr-email-client__dot--green" />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        Client Preview
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${emailPreviewDevice === 'desktop' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setEmailPreviewDevice('desktop')}
                          style={{ padding: '0.15rem 0.4rem' }}
                        >
                          <Monitor size={11} /> Desktop
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${emailPreviewDevice === 'mobile' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setEmailPreviewDevice('mobile')}
                          style={{ padding: '0.15rem 0.4rem' }}
                        >
                          <Smartphone size={11} /> Mobile
                        </button>
                      </div>
                    </div>

                    <div className="pr-email-client__meta">
                      <div className="pr-email-client__meta-row">
                        <span className="pr-email-client__meta-label">From:</span>
                        <span className="pr-email-client__meta-val">IEEE Menoufia HR Team &lt;hr@ieeemsb.org&gt;</span>
                      </div>
                      <div className="pr-email-client__meta-row">
                        <span className="pr-email-client__meta-label">Subject:</span>
                        <span className="pr-email-client__meta-val" style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {emailForm.subject}
                        </span>
                      </div>
                    </div>

                    <div className="pr-email-client__body-container" style={{ padding: '1rem', background: '#f8fafc', minHeight: '520px', maxHeight: '620px', overflowY: 'auto' }}>
                      {(() => {
                        const interpolatedBody = interpolateVariables(emailForm.body, {
                          name: 'Yousef (Sample Candidate)',
                          email: 'candidate@ieee.local',
                          committeeName: emailTargetCampaign ? getCampaignCommitteesLabel(emailTargetCampaign) : 'Robotics & Automation',
                          stage: 'Interview',
                        });
                        const isFullDoc = isFullHtmlDocument(interpolatedBody) || emailForm.templateMode === 'full';
                        return isFullDoc ? (
                          <div
                            style={{
                              maxWidth: emailPreviewDevice === 'mobile' ? '320px' : '100%',
                              margin: '0 auto',
                              transition: 'max-width 0.25s ease',
                              background: '#ffffff',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                              borderRadius: '8px',
                              overflow: 'hidden',
                            }}
                            dangerouslySetInnerHTML={{ __html: interpolatedBody }}
                          />
                        ) : (
                          <div
                            style={{
                              maxWidth: emailPreviewDevice === 'mobile' ? '320px' : '100%',
                              margin: '0 auto',
                              transition: 'max-width 0.25s ease',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                              borderRadius: '8px',
                              overflow: 'hidden',
                            }}
                            dangerouslySetInnerHTML={{
                              __html: getDefaultEmailTemplate(
                                renderMarkdownToHtml(interpolatedBody),
                                emailForm.subject
                              ),
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={sendingEmail || !emailForm.subject.trim() || !emailForm.body.trim()}
                onClick={handleSendHrEmail}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {sendingEmail ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Processing Outreach...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{emailForm.scheduledFor ? 'Schedule' : 'Send'}</span>
                  </>
                )}
              </button>
            </div>
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
}
