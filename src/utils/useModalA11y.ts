import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessibility helper for modal dialogs.
 *
 * - Locks body scroll while open
 * - Moves focus into the dialog on open
 * - Traps Tab / Shift+Tab focus within the dialog
 * - Closes on Escape
 * - Restores focus to the previously focused element on close
 *
 * Attach the returned ref to the dialog's inner container (give it tabIndex={-1}).
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = requestAnimationFrame(() => {
      if (!container) return;
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusables[0] || container).focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const focusables: HTMLElement[] = [];
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach((el) => {
        if (el.offsetParent !== null || el === document.activeElement) focusables.push(el);
      });

      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return containerRef;
}
