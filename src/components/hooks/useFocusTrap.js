import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Traps Tab/Shift+Tab focus cycling within `containerRef` while `isOpen`
 * is true, moves initial focus into the container, and restores focus to
 * the element that had it before opening once the trap deactivates.
 * Required for any `role="dialog"` drawer (mobile nav, cart) per WCAG 2.1
 * "no keyboard trap" + focus-order guidance.
 *
 * @param {import('react').RefObject<HTMLElement>} containerRef
 * @param {boolean} isOpen
 */
export default function useFocusTrap(containerRef, isOpen) {
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return undefined;

    previouslyFocused.current = document.activeElement;

    const container = containerRef.current;
    const getFocusable = () =>
      Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );

    const focusable = getFocusable();
    (focusable[0] || container).focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus({ preventScroll: true });
      }
    };
  }, [isOpen, containerRef]);
}
