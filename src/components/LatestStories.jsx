import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Clock, MessageCircle, RefreshCw } from "lucide-react";
import API from "../utils/api";

// ─────────────────────────────────────────────────────────────
// API instance
// ─────────────────────────────────────────────────────────────
const getApiInstance = () => {
  let instance;
  if (API && typeof API.get === "function") {
    instance = API;
  } else {
    instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
      headers: { "Content-Type": "application/json" },
    });
  }

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

const api = getApiInstance();

const FALLBACK_IMG =
  "https://via.placeholder.com/900x700/111111/FFFFFF?text=No+Image";

const IMG_W = "clamp(88px, 30vw, 215px)";
const IMG_H = "clamp(70px, 23.7vw, 170px)";
const CARD_GAP = "clamp(6px, 3vw, 24px)";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const isNew = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const diff = Date.now() - date.getTime();
  return diff < 24 * 60 * 60 * 1000;
};

const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
};

const readingTime = (text) => {
  const words = stripHtml(text).trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
};

// ─────────────────────────────────────────────────────────────
// Blur‑up image (no hover scale, no transitions)
// ─────────────────────────────────────────────────────────────
const Thumb = ({ src, alt, onError, badge }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="relative shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-800"
      style={{ width: IMG_W, height: IMG_H }}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.6s_infinite]" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        sizes="(min-width: 1024px) 215px, 30vw"
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={`h-full w-full object-cover ${
          loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105"
        }`}
      />
      {badge}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Skeleton – matches the new layout (no overlap)
// ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex w-full items-start animate-pulse" style={{ gap: CARD_GAP }}>
    <div
      className="relative shrink-0 overflow-hidden bg-gray-200 dark:bg-zinc-800"
      style={{ width: IMG_W, height: IMG_H }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.6s_infinite]" />
    </div>
    <div className="relative min-w-0 w-full flex-1" style={{ paddingTop: "clamp(2px, 1vw, 14px)" }}>
      <div className="mb-2 sm:mb-3 bg-white dark:bg-zinc-900 px-[12px] sm:px-[20px] py-[4px] sm:py-[8px]">
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="h-3 w-full bg-gray-200 dark:bg-zinc-800" />
        <div className="h-3 w-2/3 bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-1">
        <div className="h-[17px] w-14 bg-gray-200 dark:bg-zinc-800" />
        <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800" />
        <div className="h-3 w-14 bg-gray-200 dark:bg-zinc-800" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Story Card – no transitions, extra‑tight spacing on mobile
// ─────────────────────────────────────────────────────────────
const StoryCard = React.memo(function StoryCard({ post, isBroken, onImgError }) {
  const src = isBroken
    ? FALLBACK_IMG
    : post.images && post.images.length > 0
    ? post.images[0]
    : FALLBACK_IMG;

  const cleanExcerpt = stripHtml(post.excerpt || post.description || "");
  const formattedDate = formatDate(post.createdAt);
  const authorName = post.author?.fullname || post.author?.username || "Admin";
  const commentCount = post.comments?.length || 0;

  return (
    <li className="list-none">
      <article className="flex w-full items-start" style={{ gap: CARD_GAP }}>
        <Link
          to={`/news/${post.slug || post._id}`}
          aria-label={`Read story: ${post.title}`}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Thumb
            src={src}
            alt={post.title}
            onError={() => onImgError(post._id)}
            badge={
              isNew(post.createdAt) && (
                <span className="absolute top-1.5 left-1.5 text-[7px] sm:text-[8px] font-bold uppercase tracking-wider bg-green-500 text-white px-1.5 py-0.5">
                  New
                </span>
              )
            }
          />
        </Link>

        <div
          className="relative min-w-0 w-full flex-1"
          style={{ paddingTop: "clamp(2px, 1vw, 14px)" }}
        >
          <div className="mb-2 sm:mb-3 bg-white dark:bg-zinc-900 px-[12px] sm:px-[20px] py-[4px] sm:py-[8px]">
            <Link
              to={`/news/${post.slug || post._id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <h2
                className="m-0 max-w-[590px] font-[800] leading-[1.14] tracking-[-0.4px] text-[#151515] dark:text-white line-clamp-2"
                style={{ fontSize: "clamp(14px, 4vw, 21px)" }}
              >
                {post.title}
              </h2>
            </Link>
          </div>

          <p
            className="mb-2 sm:mb-3 max-w-[515px] font-normal leading-[1.55] text-[#999] dark:text-gray-400 line-clamp-2 sm:line-clamp-3"
            style={{ fontSize: "clamp(10.5px, 2.6vw, 12px)" }}
          >
            {cleanExcerpt}
          </p>

          <div
            className="flex flex-wrap items-center gap-x-[6px] sm:gap-x-[9px] gap-y-[4px]"
            style={{ fontSize: "clamp(7px, 1.8vw, 8px)" }}
          >
            {post.category && (
              <span className="inline-flex h-[17px] items-center px-[9px] font-bold uppercase tracking-[0.2px] bg-red-100 text-red-700">
                {post.category}
              </span>
            )}
            <span className="font-medium uppercase text-[#aaa] dark:text-gray-500">
              {formattedDate}
            </span>
            <span className="text-[#aaa] dark:text-gray-500">/</span>
            <span className="font-medium uppercase text-[#aaa] dark:text-gray-500">
              BY {authorName}
            </span>
            <span className="text-[#aaa] dark:text-gray-500">/</span>
            <span className="inline-flex items-center gap-1 font-medium text-[#aaa] dark:text-gray-500">
              <Clock className="w-2.5 h-2.5" />
              {readingTime(cleanExcerpt)}
            </span>
            <span className="text-[#aaa] dark:text-gray-500">/</span>
            <span className="inline-flex items-center gap-1 font-medium text-[#aaa] dark:text-gray-500">
              <MessageCircle className="w-2.5 h-2.5" />
              {commentCount}
            </span>
          </div>
        </div>
      </article>
    </li>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const LatestStories = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [brokenImages, setBrokenImages] = useState(() => new Set());

  const abortRef = useRef(null);
  const sentinelRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // 🔄 CHANGED: limit from 10 → 20
      const params = { page: pageNum, limit: 20, sort: "desc" };

      const res = await api.get("/api/posts", { params, signal: controller.signal });
      const { data, pagination } = res.data;

      setPosts((prev) => (append ? [...prev, ...data] : data));

      // 🔄 CHANGED: Always set hasMore to false – we only want the first 20
      setHasMore(false);
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      console.error("Fetch posts error:", err);
      setError(err.response?.data?.message || "Failed to load stories");
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts(1, false);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // loadMore is kept but will never be called because hasMore is false
  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;
    setPage((prev) => {
      const nextPage = prev + 1;
      fetchPosts(nextPage, true);
      return nextPage;
    });
  }, [fetchPosts]);

  // IntersectionObserver still observes the sentinel, but it never triggers loadMore
  // because hasMore is false. We keep it to avoid changing the design.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleImgError = useCallback((id) => {
    setBrokenImages((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const showEmptyState = useMemo(
    () => !loading && !error && posts.length === 0,
    [loading, error, posts.length]
  );

  return (
    <section aria-labelledby="latest-stories-heading" className="w-full bg-white dark:bg-zinc-900">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-[16px] py-[20px] sm:px-[30px] sm:py-[25px]">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-4 sm:mb-6">
          <div>
            <p className="uppercase text-red-500 tracking-[3px] text-xs sm:text-sm font-bold">
              Browse &amp; Read
            </p>
            <h2
              id="latest-stories-heading"
              className="text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-bold mt-1 text-black dark:text-white"
            >
              Latest Stories
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Stay up to date with the most recent posts from our writers.
            </p>
          </div>
          <Link
            to="/news"
            aria-label="View all stories"
            className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors inline-block mt-2 sm:mt-0"
          >
            View All →
          </Link>
        </div>

        {/* ─── Story List ─── */}
        {loading && initialLoad ? (
          <div className="flex flex-col gap-[10px] sm:gap-[20px] md:gap-[30px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="text-center py-12 border border-dashed border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
          >
            <p className="text-red-500 font-medium mb-3">{error}</p>
            <button
              type="button"
              onClick={() => fetchPosts(1, false)}
              aria-label="Retry loading stories"
              className="inline-flex items-center gap-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-white hover:text-black dark:hover:bg-transparent dark:hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : showEmptyState ? (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-zinc-700">
            <p className="text-gray-500 dark:text-gray-400">No stories found.</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-[10px] sm:gap-[20px] md:gap-[30px]">
              {posts.map((post) => (
                <StoryCard
                  key={post._id}
                  post={post}
                  isBroken={brokenImages.has(post._id)}
                  onImgError={handleImgError}
                />
              ))}
            </ul>

            {/* sentinel still rendered, but hasMore is false so it won't trigger further loads */}
            {hasMore && <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />}

            {isLoadingMore && (
              <div className="text-center mt-6" role="status" aria-live="polite">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading more...
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default LatestStories;
