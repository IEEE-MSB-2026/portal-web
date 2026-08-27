import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: ({ title, message, type = 'info', duration = 4000 }) => {
    const id = nextId++;
    const toast = { id, title, message, type };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  success: (title, message) => get().addToast({ title, message, type: 'success' }),
  error: (title, message) => get().addToast({ title, message, type: 'error', duration: 6000 }),
  info: (title, message) => get().addToast({ title, message, type: 'info' }),
  warning: (title, message) => get().addToast({ title, message, type: 'warning' }),
}));
