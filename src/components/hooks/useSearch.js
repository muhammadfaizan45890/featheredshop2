import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import useDebounce from "./useDebounce";
import API from "@/utils/api";

/**
 * Drives the navbar's live-search box: debounces the query, fetches
 * suggestions, tracks loading/error state, and exposes a keyboard-nav
 * "active index" so ArrowUp/ArrowDown + Enter work in the suggestion list.
 *
 * @param {number} [delay=300] - Debounce delay in ms before firing a request.
 * @returns {{
 *   query: string,
 *   setQuery: (q: string) => void,
 *   suggestions: Array<{ id: string, name: string, image?: string }>,
 *   isLoading: boolean,
 *   error: string | null,
 *   activeIndex: number,
 *   setActiveIndex: (i: number) => void,
 *   moveActiveIndex: (delta: number) => void,
 *   reset: () => void,
 * }}
 */
export default function useSearch(delay = 300) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, delay);
  const abortRef = useRef(null);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    setActiveIndex(-1);

    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    axios
      .get(`${API}/products/search`, {
        params: { q: trimmed, limit: 6 },
        signal: controller.signal,
      })
      .then((res) => {
        setSuggestions(res.data?.products ?? []);
      })
      .catch((err) => {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        setError("Couldn't load suggestions right now");
        setSuggestions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const moveActiveIndex = useCallback(
    (delta) => {
      setActiveIndex((prev) => {
        const count = suggestions.length;
        if (count === 0) return -1;
        const next = (prev + delta + count) % count;
        return next;
      });
    },
    [suggestions.length],
  );

  const reset = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setActiveIndex(-1);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    activeIndex,
    setActiveIndex,
    moveActiveIndex,
    reset,
  };
}
