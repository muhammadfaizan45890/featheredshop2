import { useEffect, useState } from "react";

/**
 * Debounces a fast-changing value so consumers only react after the value
 * has settled for `delay` ms. Used to avoid firing a search request on
 * every keystroke.
 *
 * @template T
 * @param {T} value - The value to debounce (e.g. a search query string).
 * @param {number} [delay=300] - Milliseconds to wait after the last change.
 * @returns {T} The debounced value.
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
