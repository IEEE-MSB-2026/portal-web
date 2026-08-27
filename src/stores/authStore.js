import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'ieee_portal_auth_state';

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.token && parsed.user) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse stored auth state:', err);
  }
  return null;
}

function saveStoredAuth(data) {
  try {
    if (data) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to write auth state to localStorage:', err);
  }
}

const initialAuth = loadStoredAuth();

export const useAuthStore = create((set, get) => ({
  token: initialAuth?.token || null,
  refreshToken: initialAuth?.refreshToken || null,
  user: initialAuth?.user || null,
  isAuthenticated: Boolean(initialAuth?.token && initialAuth?.user),
  isLoading: false,

  setAuth: ({ token, refreshToken, user }) => {
    const nextState = {
      token,
      refreshToken: refreshToken || get().refreshToken,
      user,
      isAuthenticated: Boolean(token && user),
    };
    saveStoredAuth({
      token: nextState.token,
      refreshToken: nextState.refreshToken,
      user: nextState.user,
    });
    set(nextState);
  },

  updateTokens: ({ token, refreshToken }) => {
    const current = get();
    const nextState = {
      token,
      refreshToken: refreshToken || current.refreshToken,
    };
    saveStoredAuth({
      token: nextState.token,
      refreshToken: nextState.refreshToken,
      user: current.user,
    });
    set(nextState);
  },

  updateUser: (partialUser) => {
    const current = get();
    if (!current.user) return;
    const updatedUser = { ...current.user, ...partialUser };
    saveStoredAuth({
      token: current.token,
      refreshToken: current.refreshToken,
      user: updatedUser,
    });
    set({ user: updatedUser });
  },

  updateAvatar: (avatarUrl) => {
    const current = get();
    if (!current.user) return;
    const updatedUser = { ...current.user, avatarUrl };
    saveStoredAuth({
      token: current.token,
      refreshToken: current.refreshToken,
      user: updatedUser,
    });
    set({ user: updatedUser });
  },

  logout: () => {
    saveStoredAuth(null);
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  initSync: () => {
    // Listen for storage events across browser tabs
    window.addEventListener('storage', (event) => {
      if (event.key === AUTH_STORAGE_KEY) {
        const stored = loadStoredAuth();
        if (stored) {
          set({
            token: stored.token,
            refreshToken: stored.refreshToken,
            user: stored.user,
            isAuthenticated: true,
          });
        } else {
          set({
            token: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
          });
        }
      }
    });
  },
}));
