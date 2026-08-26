/**
 * IEEE Menoufia Student Branch Portal — Centralized API Client
 */

const API_BASE = '';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

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

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

export const api = {
  // Public Catalog
  getPublicCommittees: () => request('/api/core/public/committees'),
  getPublicAnnouncements: () => request('/api/core/public/announcements'),
  getPublicAlbums: () => request('/api/core/public/media/albums'),
  getPublicEvents: () => request('/api/events'),
  getEventById: (id) => request(`/api/events/${id}`),
  registerParticipant: (eventId, payload) =>
    request(`/api/events/${eventId}/participants`, {
      method: 'POST',
      body: payload,
    }),
};
