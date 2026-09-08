import { create } from 'zustand';

const THEME_STORAGE_KEY = 'ieee_portal_theme';

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
}

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (newTheme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.dataset.theme = newTheme;
    set({ theme: newTheme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  initTheme: () => {
    const initial = get().theme;
    document.documentElement.dataset.theme = initial;
  },
}));
