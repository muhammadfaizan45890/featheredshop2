// src/hooks/useClickOutside.js
import { useEffect } from "react";

/**
 * Calls `handler` when a click/touch happens outside all provided refs.
 *
 * @param {React.RefObject | React.RefObject[]} refs - One ref or an array of refs
 * @param {(event: Event) => void} handler - Called when click is outside
 * @param {boolean} [enabled=true] - Toggle the listener on/off
 */
export default function useClickOutside(refs, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event) => {
      const list = Array.isArray(refs) ? refs : [refs];
      const clickedInside = list.some((ref) =>
        ref?.current?.contains(event.target)
      );
      if (!clickedInside) handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler, enabled]);
}