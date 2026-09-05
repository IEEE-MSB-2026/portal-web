/**
 * IEEE Menoufia Student Branch Portal — Centralized API Client & JWT Lifecycle Interceptor
 */
import { useAuthStore } from '../stores/authStore';

const API_BASE = '';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function performTokenRefresh() {
  const { refreshToken, logout, updateTokens } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    throw new Error('No refresh token available');
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();
    if (!res.ok || !data.token) {
      logout();
      throw new Error(data?.error || 'Token refresh failed');
    }

    updateTokens({ token: data.token, refreshToken: data.refreshToken });
    return data.token;
  } catch (err) {
    logout();
    throw err;
  }
}

async function request(endpoint, options = {}, isRetry = false) {
  const url = `${API_BASE}${endpoint}`;
  const authStore = useAuthStore.getState();
  const token = authStore.token;

  const headers = { ...options.headers };

  // Set Content-Type only if not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject Bearer token if present and not already provided
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    // Handle 401 Unauthorized with token refresh (except for auth endpoints)
    const isAuthEndpoint =
      endpoint.startsWith('/api/auth/login') ||
      endpoint.startsWith('/api/auth/register') ||
      endpoint.startsWith('/api/auth/refresh');

    if (res.status === 401 && !isRetry && !isAuthEndpoint && authStore.refreshToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            request(endpoint, { ...options, headers: retryHeaders }, true)
              .then(resolve)
              .catch(reject);
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await performTokenRefresh();
        isRefreshing = false;
        onRefreshed(newToken);

        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        return request(endpoint, { ...options, headers: retryHeaders }, true);
      } catch (refreshErr) {
        isRefreshing = false;
        refreshSubscribers = [];
        throw refreshErr;
      }
    }

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!options.silent) {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
    }
    throw err;
  }
}

export const api = {
  // Authentication & Session
  login: async ({ email, password }) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.token && data.user) {
      useAuthStore.getState().setAuth(data);
    }
    return data;
  },

  register: async ({ email, password, name, membershipId }) => {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: { email, password, name, membershipId },
    });
    if (data.token && data.user) {
      useAuthStore.getState().setAuth(data);
    }
    return data;
  },

  switchContext: async ({ targetScopeId }) => {
    const data = await request('/api/auth/switch-context', {
      method: 'POST',
      body: { targetScopeId },
    });
    if (data.token && data.user) {
      useAuthStore.getState().setAuth({
        token: data.token,
        user: data.user,
      });
    }
    return data;
  },

  getMe: async () => {
    const data = await request('/api/auth/me');
    if (data.user) {
      useAuthStore.getState().updateUser(data.user);
    }
    return data;
  },

  logout: async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      await request('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        silent: true,
      });
    } catch {
      // Ignore network errors during logout
    } finally {
      useAuthStore.getState().logout();
    }
  },

  // Member Profile & User Settings
  updateProfile: ({ membershipId, name }) =>
    request('/api/core/me/profile', {
      method: 'PATCH',
      body: { membershipId, name },
    }),

  updateAvatar: ({ avatarUrl, cloudinaryPublicId, cloudinaryAssetId }) =>
    request('/api/core/me/avatar', {
      method: 'PATCH',
      body: {
        files: [
          {
            identifier: 'avatar',
            fileurl: avatarUrl,
            cloudinaryPublicId,
            cloudinaryAssetId,
          },
        ],
      },
    }),

  uploadAvatar: async (file) => {
    const uploadRes = await api.uploadDirectToCloudinary({
      file,
      folder: 'avatars',
      resourceType: 'image',
    });
    const resolvedUrl = uploadRes.secureUrl || uploadRes.url;
    if (!resolvedUrl) {
      throw new Error('Upload succeeded but no secure URL returned');
    }
    return api.updateAvatar({
      avatarUrl: resolvedUrl,
      cloudinaryPublicId: uploadRes.publicId,
      cloudinaryAssetId: uploadRes.assetId,
    });
  },

  getMyDashboard: () => request('/api/core/me/dashboard'),
  getMyStats: () => request('/api/core/me/stats'),
  getMyProfile: () => request('/api/core/me/profile'),
  getUserProfile: (userId) => request(`/api/core/users/${encodeURIComponent(userId)}/profile`),
  updateMyPublicProfile: (payload) =>
    request('/api/core/me/profile', {
      method: 'PATCH',
      body: payload,
    }),

  changePassword: ({ currentPassword, newPassword, confirmPassword }) =>
    request('/api/auth/password', {
      method: 'PATCH',
      body: { currentPassword, newPassword, confirmPassword },
    }),

  // 3-Step Password Reset & OTP Recovery
  requestPasswordResetOtp: ({ email }) =>
    request('/api/auth/forgot-password/request-otp', {
      method: 'POST',
      body: { email },
    }),

  verifyPasswordResetOtp: ({ email, otp }) =>
    request('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: { email, otp },
    }),

  resetPasswordWithToken: ({ resetToken, newPassword, confirmPassword }) =>
    request('/api/auth/forgot-password/reset', {
      method: 'POST',
      body: { resetToken, newPassword, confirmPassword },
    }),

  // Cloudinary Direct Upload Architecture
  getFileUploadSignature: ({ folder = 'general', resourceType = 'auto', tags, publicId } = {}) =>
    request('/api/files/signature', {
      method: 'POST',
      body: { folder, resourceType, tags, publicId },
    }),

  registerFileAsset: ({
    cloudinaryAssetId,
    cloudinaryPublicId,
    secureUrl,
    resourceType = 'image',
    format,
    bytes,
    purpose = 'general',
  }) =>
    request('/api/files/assets', {
      method: 'POST',
      body: {
        cloudinaryAssetId,
        cloudinaryPublicId,
        secureUrl,
        resourceType,
        format,
        bytes,
        purpose,
      },
    }),

  uploadDirectToCloudinary: async ({
    file,
    folder = 'general',
    resourceType = 'auto',
    purpose = 'general',
    tags,
  }) => {
    const isImage = file.type && file.type.startsWith('image/');
    const resolvedResourceType = resourceType === 'auto' ? (isImage ? 'image' : 'raw') : resourceType;

    // 1. Request signed upload parameters from File Service
    const sigData = await api.getFileUploadSignature({
      folder,
      resourceType: resolvedResourceType,
      tags: tags || ['ieee_portal', folder],
    });

    // 2. Direct upload to Cloudinary CDN
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigData.apiKey);
    formData.append('timestamp', String(sigData.timestamp));
    formData.append('signature', sigData.signature);
    formData.append('folder', sigData.folder);

    if (sigData.eager) {
      formData.append('eager', sigData.eager);
    }
    if (sigData.tags) {
      formData.append('tags', sigData.tags);
    }
    if (sigData.publicId) {
      formData.append('public_id', sigData.publicId);
    }

    const cldRes = await fetch(sigData.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const cldData = await cldRes.json();
    if (!cldRes.ok || (!cldData.secure_url && !cldData.url)) {
      const errorMsg = cldData?.error?.message || 'Direct upload to Cloudinary failed';
      throw new Error(errorMsg);
    }

    const secureUrl = cldData.secure_url || cldData.url;
    const publicId = cldData.public_id;
    const assetId = cldData.asset_id || `asset_${publicId}`;

    // 3. Register asset metadata in central file_assets table (Two-Step Registry)
    const registered = await api.registerFileAsset({
      cloudinaryAssetId: assetId,
      cloudinaryPublicId: publicId,
      secureUrl,
      resourceType: cldData.resource_type || (isImage ? 'image' : 'raw'),
      format: cldData.format || (file.name.includes('.') ? file.name.split('.').pop() : 'bin'),
      bytes: cldData.bytes || file.size,
      purpose,
    });

    return {
      assetId: registered.asset?.id,
      secureUrl,
      publicId,
      asset: registered.asset,
      cloudinary: cldData,
    };
  },

  // Public Catalog
  getPublicCommittees: () => request('/api/core/public/committees'),
  getCommittees: () => request('/api/core/public/committees'),
  getPublicAnnouncements: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    const qs = query.toString();
    return request(`/api/core/public/announcements${qs ? `?${qs}` : ''}`);
  },
  getPublicAlbums: () => request('/api/core/public/media/albums'),
  getPublicEvents: () => request('/api/events'),
  getEventById: (id) => request(`/api/events/${id}`),
  registerParticipant: (eventId, payload) =>
    request(`/api/events/${eventId}/participants`, {
      method: 'POST',
      body: payload,
    }),

  // Branch Leadership ("Meet the Brains")
  getPublicOfficers: (params = {}) => {
    const query = params.season ? `?season=${encodeURIComponent(params.season)}` : '';
    return request(`/api/core/public/officers${query}`);
  },
  getPublicSeasons: () => request('/api/core/public/officers/seasons'),

  // Milestone 4: Workspace & Task Management
  getCommitteeWorkspace: (committeeId, params = {}) => {
    const query = new URLSearchParams();
    if (params.isArchived !== undefined) query.append('isArchived', params.isArchived);
    if (params.limit) query.append('limit', params.limit);
    if (params.cursor) query.append('cursor', params.cursor);
    const qs = query.toString();
    return request(`/api/core/committees/${committeeId}/workspace${qs ? `?${qs}` : ''}`);
  },
  createTask: ({ committeeId, title, description, priority = 'medium', assigneeUserId, dueAt }) =>
    request(`/api/core/committees/${committeeId}/tasks`, {
      method: 'POST',
      body: { title, description, priority, assigneeUserId, dueAt },
    }),
  updateTask: (taskId, payload) =>
    request(`/api/core/tasks/${taskId}`, {
      method: 'PATCH',
      body: payload,
    }),
  updateTaskStatus: ({ taskId, status }) =>
    request(`/api/core/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  claimTask: (taskId) =>
    request(`/api/core/tasks/${taskId}/claim`, {
      method: 'PATCH',
    }),
  archiveTask: ({ taskId, isArchived = true }) =>
    request(`/api/core/tasks/${taskId}/archive`, {
      method: 'PATCH',
      body: { isArchived },
    }),
  deleteTask: (taskId) =>
    request(`/api/core/tasks/${taskId}`, {
      method: 'DELETE',
    }),
  getCommitteeResources: (committeeId) => request(`/api/core/committees/${committeeId}/resources`),
  createCommitteeResource: ({ committeeId, title, url, resourceType = 'link', description }) =>
    request(`/api/core/committees/${committeeId}/resources`, {
      method: 'POST',
      body: { title, url, resourceType, description },
    }),
  updateCommitteeResource: ({ committeeId, resourceId, title, description }) =>
    request(`/api/core/committees/${committeeId}/resources/${resourceId}`, {
      method: 'PATCH',
      body: { title, description },
    }),
  deleteCommitteeResource: (committeeId, resourceId) =>
    request(`/api/core/committees/${committeeId}/resources/${resourceId}`, {
      method: 'DELETE',
    }),
  getCommitteeMemberships: (committeeId) => request(`/api/core/committees/${committeeId}/memberships`),
  getCommitteeMembers: (committeeId, params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.id) query.append('id', params.id);
    const qs = query.toString();
    return request(`/api/core/committees/${committeeId}/members${qs ? `?${qs}` : ''}`);
  },
  getCommitteeAnnouncements: (committeeId) => request(`/api/core/committees/${committeeId}/announcements`),
  createCommitteeAnnouncement: ({ committeeId, title, body, isPinned = false }) =>
    request(`/api/core/committees/${committeeId}/announcements`, {
      method: 'POST',
      body: { title, body, isPinned },
    }),
  deleteCommitteeAnnouncement: (committeeId, announcementId) =>
    request(`/api/core/committees/${committeeId}/announcements/${announcementId}`, {
      method: 'DELETE',
    }),
  toggleCommitteeAnnouncementPin: ({ committeeId, announcementId, isPinned }) =>
    request(`/api/core/committees/${committeeId}/announcements/${announcementId}/pin`, {
      method: 'PATCH',
      body: { isPinned },
    }),
  getCommitteeAssignments: (committeeId) => request(`/api/core/committees/${committeeId}/assignments`),
  createCommitteeAssignment: ({ committeeId, title, description, dueDate, maxPoints, attachmentUrl, attachmentName }) =>
    request(`/api/core/committees/${committeeId}/assignments`, {
      method: 'POST',
      body: { title, description, dueDate, maxPoints, attachmentUrl, attachmentName },
    }),
  updateCommitteeAssignment: ({ committeeId, assignmentId, title, description, dueDate, maxPoints, attachmentUrl, attachmentName }) =>
    request(`/api/core/committees/${committeeId}/assignments/${assignmentId}`, {
      method: 'PATCH',
      body: { title, description, dueDate, maxPoints, attachmentUrl, attachmentName },
    }),
  deleteCommitteeAssignment: (committeeId, assignmentId) =>
    request(`/api/core/committees/${committeeId}/assignments/${assignmentId}`, {
      method: 'DELETE',
    }),
  submitAssignment: ({ committeeId, assignmentId, fileUrl, fileName, notes }) =>
    request(`/api/core/committees/${committeeId}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: { fileUrl, fileName, notes },
    }),
  getAssignmentSubmissions: (committeeId, assignmentId) =>
    request(`/api/core/committees/${committeeId}/assignments/${assignmentId}/submissions`),
  gradeAssignmentSubmission: ({ committeeId, assignmentId, submissionId, grade, feedback, status }) =>
    request(`/api/core/committees/${committeeId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      body: { grade, feedback, status },
    }),

  // ── HR Campaigns ──────────────────────────────────────────────────────────
  getHRCampaigns: (params = {}) => {
    const query = new URLSearchParams();
    if (params.committeeId) query.append('committeeId', params.committeeId);
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return request(`/api/core/hr/campaigns${qs ? `?${qs}` : ''}`);
  },
  getOpenCampaigns: () => request('/api/core/hr/campaigns/open'),
  createHRCampaign: (data) =>
    request('/api/core/hr/campaigns', {
      method: 'POST',
      body: data,
    }),
  updateHRCampaign: (campaignId, data) =>
    request(`/api/core/hr/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: data,
    }),
  updateHRCampaignStatus: (campaignId, status) =>
    request(`/api/core/hr/campaigns/${campaignId}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  getHRApplications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.committeeId) query.append('committeeId', params.committeeId);
    if (params.campaignId) query.append('campaignId', params.campaignId);
    if (params.stage) query.append('stage', params.stage);
    if (params.includeRejected) query.append('includeRejected', 'true');
    if (params.includeAccepted) query.append('includeAccepted', 'true');
    if (params.all || params.includeAll) query.append('all', 'true');
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return request(`/api/core/hr/applications${qs ? `?${qs}` : ''}`);
  },
  getMyApplications: () => request('/api/core/me/applications'),
  submitHRApplication: (data) =>
    request('/api/core/hr/applications', {
      method: 'POST',
      body: data,
    }),
  updateApplicationStage: (applicationId, data) =>
    request(`/api/core/hr/applications/${applicationId}/stage`, {
      method: 'PATCH',
      body: data,
    }),
  acceptApplication: (applicationId, data = {}) =>
    request(`/api/core/hr/applications/${applicationId}/accept`, {
      method: 'POST',
      body: data,
    }),
  rejectApplication: (applicationId, data = {}) =>
    request(`/api/core/hr/applications/${applicationId}/reject`, {
      method: 'POST',
      body: data,
    }),
  markHRWelcomeEmailsSent: (applicationIds = [], options = {}) =>
    request('/api/core/hr/applications/mark-welcome-sent', {
      method: 'POST',
      body: {
        applicationIds,
        checklistSteps: options.checklistSteps || options.checklistItems,
      },
    }),

  // ── HR Onboarding ─────────────────────────────────────────────────────────
  getHROnboardingCandidates: (params = {}) => {
    const query = new URLSearchParams();
    if (params.committeeId) query.append('committeeId', params.committeeId);
    if (params.campaignId) query.append('campaignId', params.campaignId);
    if (params.welcomeEmailSent !== undefined) query.append('welcomeEmailSent', String(params.welcomeEmailSent));
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    const qs = query.toString();
    return request(`/api/core/hr/onboarding/candidates${qs ? `?${qs}` : ''}`);
  },
  getHROnboarding: (userId) => request(`/api/core/hr/onboarding/${userId}`),
  updateOnboardingItem: (itemId, status) =>
    request(`/api/core/hr/onboarding/${itemId}`, {
      method: 'PATCH',
      body: { status },
    }),

  // ── HR Reports ────────────────────────────────────────────────────────────
  getHRPipelineSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.committeeId) query.append('committeeId', params.committeeId);
    if (params.campaignId) query.append('campaignId', params.campaignId);
    const qs = query.toString();
    return request(`/api/core/hr/reports/pipeline-summary${qs ? `?${qs}` : ''}`);
  },
  getHRPipelineTimeline: (params = {}) => {
    const query = new URLSearchParams();
    if (params.committeeId) query.append('committeeId', params.committeeId);
    if (params.campaignId) query.append('campaignId', params.campaignId);
    if (params.granularity) query.append('granularity', params.granularity);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    const qs = query.toString();
    return request(`/api/core/hr/reports/pipeline-timeline${qs ? `?${qs}` : ''}`);
  },

  // ── Member Management (Direct Add / Remove / Role Change) ─────────────────
  getAllCommitteeMemberships: () => request('/api/core/committees/memberships/all'),
  searchRegisteredUsers: (q) => request(`/api/core/users/search?q=${encodeURIComponent(q)}`),
  upsertCommitteeMembership: ({ committeeId, externalUserId, email, roleInCommittee }) =>
    request(`/api/core/committees/${committeeId}/memberships`, {
      method: 'POST',
      body: { externalUserId, email, roleInCommittee },
    }),
  removeCommitteeMembership: (committeeId, userId) =>
    request(`/api/core/committees/${committeeId}/memberships/${userId}`, {
      method: 'DELETE',
    }),

  // ── PR Announcements (Public & Internal Broadcasts) ───────────────────────
  getPRAnnouncements: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.visibility) query.append('visibility', params.visibility);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    if (params.cursor) query.append('cursor', params.cursor);
    const qs = query.toString();
    return request(`/api/core/pr/announcements${qs ? `?${qs}` : ''}`);
  },
  createPRAnnouncement: (data) =>
    request('/api/core/pr/announcements', {
      method: 'POST',
      body: data,
    }),
  updatePRAnnouncement: (id, data) =>
    request(`/api/core/pr/announcements/${id}`, {
      method: 'PATCH',
      body: data,
    }),
  togglePinPRAnnouncement: (id, isPinned) =>
    request(`/api/core/pr/announcements/${id}/pin`, {
      method: 'PATCH',
      body: { isPinned },
    }),
  deletePRAnnouncement: (id) =>
    request(`/api/core/pr/announcements/${id}`, {
      method: 'DELETE',
    }),

  // ── PR Email Outreach Campaigns ───────────────────────────────────────────
  getPRCampaigns: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.includeArchived) query.append('includeArchived', 'true');
    if (params.category) query.append('category', params.category);
    if (params.includeHr) query.append('includeHr', 'true');
    if (params.segmentType) query.append('segmentType', params.segmentType);
    if (params.committeeId) query.append('committeeId', params.committeeId);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return request(`/api/core/pr/campaigns${qs ? `?${qs}` : ''}`);
  },
  createPRCampaign: (data) =>
    request('/api/core/pr/campaigns', {
      method: 'POST',
      body: data,
    }),
  updatePRCampaign: (id, data) =>
    request(`/api/core/pr/campaigns/${id}`, {
      method: 'PATCH',
      body: data,
    }),
  sendPRCampaign: (id) =>
    request(`/api/core/pr/campaigns/${id}/send`, {
      method: 'POST',
    }),
  archivePRCampaign: (id) =>
    request(`/api/core/pr/campaigns/${id}/archive`, {
      method: 'POST',
    }),
  unarchivePRCampaign: (id) =>
    request(`/api/core/pr/campaigns/${id}/unarchive`, {
      method: 'POST',
    }),
  duplicatePRCampaign: (id) =>
    request(`/api/core/pr/campaigns/${id}/duplicate`, {
      method: 'POST',
    }),
  deletePRCampaign: (id) =>
    request(`/api/core/pr/campaigns/${id}`, {
      method: 'DELETE',
    }),
  previewPRCampaignRecipients: (data) =>
    request('/api/core/pr/campaigns/recipients-preview', {
      method: 'POST',
      body: data,
    }),
  getPRCampaignDeliveryLogs: (id) =>
    request(`/api/core/pr/campaigns/${id}/delivery-logs`),

  // ── Media Operations & Brand Studio ─────────────────────────────────────
  getMediaStats: () => request('/api/core/media/stats'),
  getMediaAlbums: (params = {}) => {
    const query = new URLSearchParams();
    if (params.committeeId) query.append('committeeId', params.committeeId);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    const qs = query.toString();
    return request(`/api/core/media/albums${qs ? `?${qs}` : ''}`);
  },
  getMediaAlbum: (albumId) => request(`/api/core/media/albums/${albumId}`),
  createMediaAlbum: (data) =>
    request('/api/core/media/albums', {
      method: 'POST',
      body: data,
    }),
  updateMediaAlbum: (albumId, data) =>
    request(`/api/core/media/albums/${albumId}`, {
      method: 'PATCH',
      body: data,
    }),
  deleteMediaAlbum: (albumId) =>
    request(`/api/core/media/albums/${albumId}`, {
      method: 'DELETE',
    }),
  addMediaAlbumAsset: (albumId, data) =>
    request(`/api/core/media/albums/${albumId}/assets`, {
      method: 'POST',
      body: data,
    }),
  deleteMediaAlbumAsset: (albumId, assetId) =>
    request(`/api/core/media/albums/${albumId}/assets/${assetId}`, {
      method: 'DELETE',
    }),
  publishMediaAlbum: (albumId) =>
    request(`/api/core/media/albums/${albumId}/publish`, {
      method: 'POST',
    }),
  unpublishMediaAlbum: (albumId) =>
    request(`/api/core/media/albums/${albumId}/unpublish`, {
      method: 'POST',
    }),
  createMediaCoverageRequest: (data) =>
    request('/api/core/media/coverage-requests', {
      method: 'POST',
      body: data,
    }),
  updateMediaCoverageStatus: (requestId, data) =>
    request(`/api/core/media/coverage-requests/${requestId}/status`, {
      method: 'PATCH',
      body: data,
    }),

  // ── Brand & Design Asset Kit ───────────────────────────────────────────
  getBrandAssets: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    const qs = query.toString();
    return request(`/api/core/media/brand-assets${qs ? `?${qs}` : ''}`);
  },
  createBrandAsset: (data) =>
    request('/api/core/media/brand-assets', {
      method: 'POST',
      body: data,
    }),
  updateBrandAsset: (assetId, data) =>
    request(`/api/core/media/brand-assets/${assetId}`, {
      method: 'PATCH',
      body: data,
    }),
  deleteBrandAsset: (assetId) =>
    request(`/api/core/media/brand-assets/${assetId}`, {
      method: 'DELETE',
    }),

  // ── Operations Studio & Events Management ──────────────────────────────────
  getEvents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.audience) query.append('audience', params.audience);
    const qs = query.toString();
    return request(`/api/events${qs ? `?${qs}` : ''}`);
  },
  getEventById: (eventId) => request(`/api/events/${eventId}`),
  createEvent: (data) =>
    request('/api/events', {
      method: 'POST',
      body: data,
    }),
  updateEvent: (eventId, data) =>
    request(`/api/events/${eventId}`, {
      method: 'PATCH',
      body: data,
    }),
  deleteEvent: (eventId) =>
    request(`/api/events/${eventId}`, {
      method: 'DELETE',
    }),
  assignEventScanners: (eventId, scannerUserIds) =>
    request(`/api/events/${eventId}/scanners`, {
      method: 'POST',
      body: { scannerUserIds },
    }),
  getEventStats: (eventId) => request(`/api/events/${eventId}/stats`),

  // Activities
  getEventActivities: (eventId) => request(`/api/events/${eventId}/activities`),
  createEventActivity: (eventId, data) =>
    request(`/api/events/${eventId}/activities`, {
      method: 'POST',
      body: data,
    }),
  updateEventActivity: (eventId, activityId, data) =>
    request(`/api/events/${eventId}/activities/${activityId}`, {
      method: 'PATCH',
      body: data,
    }),
  toggleActivityLock: (eventId, activityId, isLocked) =>
    request(`/api/events/${eventId}/activities/${activityId}/lock`, {
      method: 'PATCH',
      body: { isLocked },
    }),
  setActivityMode: (eventId, activityId, checkInMode) =>
    request(`/api/events/${eventId}/activities/${activityId}/mode`, {
      method: 'PATCH',
      body: { checkInMode },
    }),
  deleteEventActivity: (eventId, activityId) =>
    request(`/api/events/${eventId}/activities/${activityId}`, {
      method: 'DELETE',
    }),
  getActivityByQrId: (qrId) => request(`/api/events/activities/qr/${qrId}`),
  selfCheckInActivity: (qrId, email) =>
    request(`/api/events/activities/qr/${qrId}/self-checkin`, {
      method: 'POST',
      body: { email },
    }),

  // Participants & Registration
  registerForEvent: (eventId, data) =>
    request(`/api/events/${eventId}/participants`, {
      method: 'POST',
      body: data,
    }),
  getEventParticipants: (eventId, params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    const qs = query.toString();
    return request(`/api/events/${eventId}/participants${qs ? `?${qs}` : ''}`);
  },
  getParticipantById: (eventId, participantId) => request(`/api/events/${eventId}/participants/${participantId}`),
  manualCheckInParticipant: (eventId, participantId, activityId = null) =>
    request(`/api/events/${eventId}/participants/${participantId}/check-in`, {
      method: 'POST',
      body: { activityId },
    }),
  deleteParticipant: (eventId, participantId) =>
    request(`/api/events/${eventId}/participants/${participantId}`, {
      method: 'DELETE',
    }),
  uploadParticipantsCsv: (eventId, formData) =>
    request(`/api/events/${eventId}/participants/upload`, {
      method: 'POST',
      body: formData,
    }),

  // Live QR & Scanning
  scanAttendeeQR: (eventId, data) =>
    request(`/api/events/${eventId}/qr/scan`, {
      method: 'POST',
      body: data,
    }),
  sendEventQRCodes: (eventId, data = {}) =>
    request(`/api/events/${eventId}/qr/send`, {
      method: 'POST',
      body: data,
    }),

  // Attendance & Reports
  getEventAttendanceReport: (eventId) => request(`/api/events/${eventId}/attendance/report`),
  awardEventActivityPoints: (eventId, data = {}) =>
    request(`/api/events/${eventId}/attendance/points`, {
      method: 'POST',
      body: data,
    }),
};

