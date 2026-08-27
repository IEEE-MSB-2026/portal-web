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

  getMyDashboard: () => request('/api/core/me/dashboard'),

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
    // 1. Request signed upload parameters from File Service
    const sigData = await api.getFileUploadSignature({
      folder,
      resourceType,
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
      resourceType: cldData.resource_type || (file.type.startsWith('video/') ? 'video' : 'image'),
      format: cldData.format || file.name.split('.').pop(),
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
};
