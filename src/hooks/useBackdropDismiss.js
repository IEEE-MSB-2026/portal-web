import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to safely dismiss modals on backdrop interaction.
 *
 * Prevents accidental modal closing when selecting text inside a dialog
 * or when dragging the mouse outside the modal.
 *
 * A backdrop dismiss is ONLY triggered if BOTH mousedown AND mouseup
 * originate on the backdrop container (e.target === e.currentTarget).
 *
 * Also handles Escape key dismissal when open.
 *
 * @param {Function} onClose - Callback invoked when a genuine backdrop click or Escape press occurs.
 * @param {Object} [options]
 * @param {boolean} [options.isOpen=true] - Whether the modal is currently open.
 * @param {boolean} [options.escapeClose=true] - Whether Escape key should trigger onClose.
 * @returns {{ onMouseDown: Function, onMouseUp: Function, getBackdropProps: Function }}
 */
export function useBackdropDismiss(onClose, { isOpen = true, escapeClose = true } = {}) {
  const isMouseDownOnBackdrop = useRef(false);

  const onMouseDown = useCallback((e) => {
    isMouseDownOnBackdrop.current = e.target === e.currentTarget;
  }, []);

  const onMouseUp = useCallback((e) => {
    if (isMouseDownOnBackdrop.current && e.target === e.currentTarget) {
      onClose?.(e);
    }
    isMouseDownOnBackdrop.current = false;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !escapeClose || !onClose) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, escapeClose, onClose]);

  const getBackdropProps = useCallback(
    (extraProps = {}) => ({
      onMouseDown: (e) => {
        onMouseDown(e);
        extraProps.onMouseDown?.(e);
      },
      onMouseUp: (e) => {
        onMouseUp(e);
        extraProps.onMouseUp?.(e);
      },
      ...extraProps,
    }),
    [onMouseDown, onMouseUp]
  );

  return {
    onMouseDown,
    onMouseUp,
    getBackdropProps,
  };
}

/**
 * Lightweight helper to attach safe backdrop dismiss handlers to an element without a hook.
 *
 * @param {Function} onClose
 * @returns {{ onMouseDown: Function, onMouseUp: Function }}
 */
export function createBackdropDismiss(onClose) {
  let isDown = false;
  return {
    onMouseDown: (e) => {
      isDown = e.target === e.currentTarget;
    },
    onMouseUp: (e) => {
      if (isDown && e.target === e.currentTarget) {
        onClose?.(e);
      }
      isDown = false;
    },
  };
}

export default useBackdropDismiss;
