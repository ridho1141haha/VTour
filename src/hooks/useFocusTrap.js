import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef, isActive, options = {}) {
  const { onEscape, initialFocusRef, returnFocus = true } = options;
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isActive) return undefined;

    previousActiveElementRef.current = document.activeElement;
    const container = containerRef.current;
    if (!container) return undefined;

    const timer = requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusable = container.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          container.focus();
        }
      }
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onEscape) {
        event.stopPropagation();
        onEscape();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first || document.activeElement === container) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (returnFocus && previousActiveElementRef.current?.focus) {
        try {
          previousActiveElementRef.current.focus();
        } catch {
          // Element may no longer exist
        }
      }
    };
  }, [containerRef, initialFocusRef, isActive, onEscape, returnFocus]);
}
