import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronRight,
  FiFilter,
  FiGrid,
  FiHeart,
  FiSearch,
  FiShield,
  FiStar,
  FiX,
  FiAward,
  FiCheckCircle,
  FiTrendingUp,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import API from "../utils/api";

/* ═════════════════════════════════════════════════════════════
 * Conditions — Shop by Grade
 * Premium+ · Premium · Excellent · Very Good · Good
 * Fully functional · image-free · responsive
 * ═════════════════════════════════════════════════════════════ */

/* ─── Grade definitions ─────────────────────────── */
/* `condition` field maps to the exact value your Shop page expects */
const CONDITIONS = [
  {
    id: "premium-plus",
    condition: "Premium Plus",
    label: "Premium+",
    tagline: "Unworn · Tags attached",
    description:
      "Indistinguishable from new. Original tags, packaging, and dust bag included — the pinnacle of our grading scale.",
    badge: "Top Tier",
    accent: "#0A0A0A",
    tier: "01",
    icon: FiAward,
    count: 0,
    rating: 5.0,
    highlights: ["Original tags", "Sealed packaging", "Full guarantee"],
  },
  {
    id: "premium",
    condition: "Premium",
    label: "Premium",
    tagline: "Worn once · Flawless",
    description:
      "Worn once, in pristine condition. No visible signs of wear, retains shape, color, and finish perfectly.",
    badge: "Most Wanted",
    accent: "#1E40AF",
    tier: "02",
    icon: FiCheckCircle,
    count: 0,
    rating: 4.9,
    highlights: ["No visible wear", "Inspected twice", "Full guarantee"],
  },
  {
    id: "excellent",
    condition: "Excellent",
    label: "Excellent",
    tagline: "Barely worn · Near-perfect",
    description:
      "Minimal signs of use, if any. Kept with care — an outstanding find at a fraction of retail.",
    badge: "Editor's Pick",
    accent: "#059669",
    tier: "03",
    icon: FiTrendingUp,
    count: 0,
    rating: 4.8,
    highlights: ["Minimal wear", "Deep-cleaned", "Quality assured"],
  },
  {
    id: "very-good",
    condition: "Very Good",
    label: "Very Good",
    tagline: "Lightly worn · Well kept",
    description:
      "Light, honest signs of use that don't affect function or appearance. Character with plenty of life ahead.",
    badge: "Best Value",
    accent: "#D97706",
    tier: "04",
    icon: FiPackage,
    count: 0,
    rating: 4.7,
    highlights: ["Light wear", "Fully functional", "Honest grading"],
  },
  {
    id: "good",
    condition: "Good",
    label: "Good",
    tagline: "Worn · Full of character",
    description:
      "Noticeable wear from regular use, but structurally sound and ready to keep going. Unbeatable value.",
    badge: "Entry Point",
    accent: "#B45309",
    tier: "05",
    icon: FiShield,
    count: 0,
    rating: 4.6,
    highlights: ["Visible wear", "Guaranteed usable", "Best price"],
  },
];

const SORT_OPTIONS = [
  { id: "grade", label: "Grade (High → Low)" },
  { id: "grade-asc", label: "Grade (Low → High)" },
  { id: "rating", label: "Top Rated" },
  { id: "count", label: "Largest Selection" },
];

const LS_FAVS = "fn_shop_conditions_favs";

/* ─── LocalStorage helpers ───────────────────────── */
const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

/* ─── API instance (mirrors Shop.jsx) ────────────── */
const createApi = () => {
  if (API && typeof API.get === "function") return API;
  const instance = axios.create({
    baseURL:
      import.meta.env.VITE_API_URL ||
      "https://featherednews-backend-production.up.railway.app",
    headers: { "Content-Type": "application/json" },
  });
  instance.interceptors.request.use(
    (config) => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {}
      return config;
    },
    (error) => Promise.reject(error)
  );
  return instance;
};
const api = createApi();

const isOfflineError = (err) => {
  if (!err) return false;
  if (err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") return true;
  if (err.message === "Network Error") return true;
  if (!err.response) return true;
  return false;
};

/* ─── Motion variants ────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

/* ═════════════════════════════════════════════════════════════
 * Skeleton card
 * ═════════════════════════════════════════════════════════════ */
const CardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
    <div className="h-32 sm:h-36 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
    <div className="space-y-3 p-5 sm:p-6">
      <div className="h-6 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="flex gap-1.5 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-6 w-20 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  </div>
);

/* ═════════════════════════════════════════════════════════════
 * Condition Card
 * ═════════════════════════════════════════════════════════════ */
const ConditionCard = ({ condition, favorite, onToggleFav, countLoading }) => {
  const Icon = condition.icon;
  const href = `/shop?condition=${encodeURIComponent(condition.condition)}`;

  return (
    <motion.article
      layout
      variants={cardVariants}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="
        group relative flex flex-col
        overflow-hidden rounded-3xl
        border border-zinc-200/80 dark:border-zinc-800/80
        bg-white dark:bg-zinc-900
        shadow-sm hover:shadow-xl
        transition-shadow
      "
    >
      {/* ─── Accent header ─────────────────────── */}
      <div
        className="relative h-32 sm:h-36 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${condition.accent} 0%, ${condition.accent}dd 60%, ${condition.accent}99 100%)`,
        }}
      >
        <div
          aria-hidden="true"
          className="
            absolute inset-0 opacity-[0.18]
            [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)]
            [background-size:14px_14px]
          "
        />

        <span
          aria-hidden="true"
          className="
            absolute -bottom-6 -right-2
            text-[7rem] sm:text-[8rem] leading-none font-black
            text-white/15 select-none pointer-events-none
            tabular-nums tracking-tighter
          "
        >
          {condition.tier}
        </span>

        <div className="relative h-full flex items-start justify-between p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 text-white">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md ring-1 ring-white/25 text-white">
              {condition.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFav(condition.id);
            }}
            aria-label={favorite ? "Remove from favourites" : "Add to favourites"}
            aria-pressed={favorite}
            className="
              inline-flex items-center justify-center
              h-9 w-9 rounded-full
              bg-white/15 backdrop-blur-md
              ring-1 ring-white/25
              text-white
              hover:bg-white/25
              active:scale-90
              transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
            "
          >
            <FiHeart
              className="h-4 w-4 transition-colors"
              style={favorite ? { color: "#FCA5A5", fill: "#FCA5A5" } : undefined}
            />
          </button>
        </div>

        <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
            Grade {condition.tier}
          </p>
        </div>
      </div>

      {/* ─── Body ─────────────────────────────── */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            {condition.label}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-zinc-700 dark:text-zinc-300">
            <FiStar
              className="h-3.5 w-3.5 text-amber-500"
              fill="#F59E0B"
              aria-hidden="true"
            />
            {condition.rating.toFixed(1)}
          </span>
        </div>

        <p className="mt-1 text-[12px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          {condition.tagline}
        </p>

        <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {condition.description}
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {condition.highlights.map((h) => (
            <li
              key={h}
              className="
                inline-flex items-center gap-1
                rounded-full
                border border-zinc-200/80 dark:border-zinc-800/80
                bg-zinc-50 dark:bg-zinc-900/60
                px-2.5 py-1
                text-[11px] font-medium
                text-zinc-600 dark:text-zinc-400
              "
            >
              <FiShield className="h-3 w-3" aria-hidden="true" />
              {h}
            </li>
          ))}
        </ul>

        {/* Count + verified */}
        <div className="mt-5 flex items-center gap-3 text-[11.5px] text-zinc-500 dark:text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <FiGrid className="h-3.5 w-3.5" aria-hidden="true" />
            {countLoading ? (
              <span className="inline-block h-3 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            ) : condition.count > 0 ? (
              `${condition.count.toLocaleString("en-PK")} items`
            ) : (
              "No items"
            )}
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>Verified grading</span>
        </div>

        {/* CTA */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/70">
          <Link
            to={href}
            className="
              group/btn inline-flex items-center gap-1.5
              text-[13.5px] font-bold
              text-zinc-900 dark:text-white
              hover:gap-2.5
              transition-all
            "
          >
            Shop {condition.label}
            <FiArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            to={href}
            aria-label={`Go to ${condition.label}`}
            className="
              inline-flex items-center justify-center
              h-9 w-9 rounded-full
              border border-zinc-200 dark:border-zinc-800
              text-zinc-500 dark:text-zinc-400
              transition-all duration-300
            "
            onMouseEnter={(e) => {
              e.currentTarget.style.background = condition.accent;
              e.currentTarget.style.borderColor = condition.accent;
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.color = "";
            }}
          >
            <FiChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="
          absolute bottom-0 left-0 right-0 h-[3px]
          origin-left scale-x-0 group-hover:scale-x-100
          transition-transform duration-500
        "
        style={{ background: condition.accent }}
      />
    </motion.article>
  );
};

/* ═════════════════════════════════════════════════════════════
 * Grade Legend
 * ═════════════════════════════════════════════════════════════ */
const GradeLegend = () => (
  <div
    className="
      mt-10 sm:mt-14
      rounded-3xl
      border border-zinc-200/80 dark:border-zinc-800/80
      bg-white/70 dark:bg-zinc-900/40
      backdrop-blur
      px-5 py-6 sm:px-8 sm:py-8
    "
  >
    <div className="flex items-center gap-3 mb-5">
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      <span className="text-[10.5px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500 font-bold">
        Grading scale
      </span>
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>

    <div className="relative mb-6">
      <div className="flex h-2 rounded-full overflow-hidden">
        {CONDITIONS.map((c) => (
          <div
            key={c.id}
            className="flex-1"
            style={{ background: c.accent }}
            title={c.label}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Highest
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Lowest
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {CONDITIONS.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="
              flex items-center gap-3
              rounded-2xl
              border border-zinc-200/70 dark:border-zinc-800/70
              bg-white dark:bg-zinc-900
              px-3.5 py-3
            "
          >
            <span
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-white shrink-0"
              style={{ background: c.accent }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-zinc-900 dark:text-white truncate">
                {c.label}
              </p>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-500 truncate">
                {c.tagline}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ═════════════════════════════════════════════════════════════
 * Main
 * ═════════════════════════════════════════════════════════════ */
const Conditions = () => {
  const prefersReducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  /* URL-driven state */
  const query = searchParams.get("q") || "";
  const sortBy = searchParams.get("sort") || "grade";
  const favOnly = searchParams.get("fav") === "1";

  /* Local input mirrors URL */
  const [searchInput, setSearchInput] = useState(query);
  const pushedQRef = useRef(query);

  /* Favourites from localStorage */
  const [favorites, setFavorites] = useState(() => {
    const saved = readLS(LS_FAVS, []);
    return Array.isArray(saved) ? saved : [];
  });

  /* Live counts from API */
  const [counts, setCounts] = useState({});
  const [countsStatus, setCountsStatus] = useState("idle"); // idle | loading | ready | offline
  const abortRef = useRef(null);

  /* ─── Sync input when URL changes externally ───── */
  useEffect(() => {
    if (query !== pushedQRef.current) {
      pushedQRef.current = query;
      setSearchInput(query);
    }
  }, [query]);

  /* ─── Debounced search → URL ───────────────────── */
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === pushedQRef.current) return;
    const t = setTimeout(() => {
      pushedQRef.current = trimmed;
      const next = new URLSearchParams(searchParams);
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  /* ─── Persist favourites ───────────────────────── */
  useEffect(() => {
    writeLS(LS_FAVS, favorites);
  }, [favorites]);

  const toggleFav = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  /* ─── Update URL helper ────────────────────────── */
  const patchParams = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "" || v === false) next.delete(k);
        else next.set(k, String(v));
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  /* ─── Fetch live counts per grade ──────────────── */
  const fetchCounts = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setCountsStatus("loading");

    try {
      /* Fetch in parallel: one call per grade, limit=1, we only need `total` */
      const results = await Promise.all(
        CONDITIONS.map((c) =>
          api
            .get("/api/posts", {
              params: {
                condition: c.condition,
                published: "true",
                page: 1,
                limit: 1,
              },
              signal: controller.signal,
            })
            .then((res) => res?.data?.pagination?.total ?? 0)
            .catch(() => 0)
        )
      );

      const next = {};
      CONDITIONS.forEach((c, i) => {
        next[c.id] = results[i];
      });
      setCounts(next);
      setCountsStatus("ready");
    } catch (err) {
      if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return;
      if (isOfflineError(err)) {
        setCountsStatus("offline");
        // keep counts at 0
      } else {
        console.error("Conditions counts fetch failed:", err);
        setCountsStatus("ready"); // fall back to 0s silently
      }
    }
  }, []);

  /* Kick off counts on mount */
  useEffect(() => {
    fetchCounts();
    return () => abortRef.current?.abort();
  }, [fetchCounts]);

  /* Merge counts into conditions */
  const conditionsWithCounts = useMemo(
    () =>
      CONDITIONS.map((c) => ({
        ...c,
        count: counts[c.id] ?? 0,
      })),
    [counts]
  );

  /* ─── Filtered + sorted list ───────────────────── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = conditionsWithCounts.filter((c) =>
      !q
        ? true
        : c.label.toLowerCase().includes(q) ||
          c.condition.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
    );

    if (favOnly) {
      list = list.filter((c) => favorites.includes(c.id));
    }

    switch (sortBy) {
      case "grade-asc":
        list = [...list].reverse();
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "count":
        list = [...list].sort((a, b) => b.count - a.count);
        break;
      default:
        break;
    }
    return list;
  }, [query, sortBy, favOnly, favorites, conditionsWithCounts]);

  /* ─── Sort dropdown state ──────────────────────── */
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    if (!showSort) return;
    const onDown = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setShowSort(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showSort]);

  const hasAnyFav = favorites.length > 0;
  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label || SORT_OPTIONS[0].label;

  /* ═════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════ */
  return (
    <section
      aria-labelledby="conditions-heading"
      className="
        relative w-full
        bg-gradient-to-b from-white via-zinc-50/60 to-white
        dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950
        py-14 sm:py-20 lg:py-24
        px-4 sm:px-6 lg:px-8
      "
    >
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[10%] h-72 w-72 sm:h-96 sm:w-96 rounded-full blur-3xl opacity-40 bg-gradient-to-tr from-amber-200/50 to-rose-200/30 dark:from-amber-500/10 dark:to-rose-500/10" />
        <div className="absolute -bottom-24 left-[5%] h-72 w-72 sm:h-96 sm:w-96 rounded-full blur-3xl opacity-40 bg-gradient-to-tr from-sky-200/50 to-violet-200/30 dark:from-sky-500/10 dark:to-violet-500/10" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* ─── Header ─────────────────────────────── */}
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2">
                <span className="h-px w-8 bg-zinc-900 dark:bg-white" />
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                  Shop by Grade
                </span>
              </div>

              <h2
                id="conditions-heading"
                className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white"
              >
                Every piece is graded.
                <span className="block text-zinc-400 dark:text-zinc-600">
                  Choose your standard.
                </span>
              </h2>

              <p className="mt-4 text-[14.5px] sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                From <strong className="text-zinc-900 dark:text-white">Premium+</strong> to{" "}
                <strong className="text-zinc-900 dark:text-white">Good</strong> — every item is
                inspected by our team, graded on a strict 5-tier scale, and backed by
                our condition guarantee.
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
              {/* Search */}
              <div
                className="
                  relative flex items-center
                  rounded-2xl
                  border border-zinc-200 dark:border-zinc-800
                  bg-white dark:bg-zinc-900
                  focus-within:border-zinc-900 dark:focus-within:border-white
                  focus-within:ring-4 focus-within:ring-zinc-900/5 dark:focus-within:ring-white/10
                  transition-all
                  pl-3.5 pr-1.5 py-1.5
                  w-full sm:w-64
                  shadow-sm
                "
              >
                <FiSearch className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setSearchInput("")}
                  placeholder="Search grades..."
                  aria-label="Search grades"
                  className="flex-1 min-w-0 bg-transparent py-2 pl-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      pushedQRef.current = "";
                      setSearchInput("");
                      patchParams({ q: "" });
                    }}
                    aria-label="Clear search"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div ref={sortRef} className="relative w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowSort((s) => !s)}
                  aria-haspopup="listbox"
                  aria-expanded={showSort}
                  className="
                    inline-flex w-full sm:w-auto items-center justify-between gap-2
                    rounded-2xl
                    border border-zinc-200 dark:border-zinc-800
                    bg-white dark:bg-zinc-900
                    px-4 py-3
                    text-sm font-semibold
                    text-zinc-700 dark:text-zinc-200
                    hover:border-zinc-300 dark:hover:border-zinc-700
                    transition-colors
                    shadow-sm
                  "
                >
                  <span className="inline-flex items-center gap-2">
                    <FiFilter className="h-3.5 w-3.5" />
                    {currentSortLabel}
                  </span>
                  <FiChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${showSort ? "rotate-90" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showSort && (
                    <motion.ul
                      role="listbox"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="
                        absolute right-0 z-40 mt-2 w-60
                        overflow-hidden rounded-2xl
                        border border-zinc-200 dark:border-zinc-800
                        bg-white dark:bg-zinc-900
                        shadow-xl shadow-zinc-900/10 dark:shadow-black/40
                        py-1.5
                      "
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <li key={opt.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={sortBy === opt.id}
                            onClick={() => {
                              patchParams({
                                sort: opt.id === "grade" ? "" : opt.id,
                              });
                              setShowSort(false);
                            }}
                            className={`
                              w-full text-left px-3.5 py-2.5 text-[13.5px] font-medium
                              transition-colors
                              ${
                                sortBy === opt.id
                                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
                              }
                            `}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Favourites-only chip + status row */}
          <div className="flex flex-wrap items-center gap-3">
            {hasAnyFav && (
              <button
                type="button"
                onClick={() => patchParams({ fav: favOnly ? "" : "1" })}
                aria-pressed={favOnly}
                className={`
                  inline-flex items-center gap-1.5
                  rounded-full px-3 py-1.5
                  text-[12px] font-semibold
                  transition-colors
                  ${
                    favOnly
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600"
                  }
                `}
              >
                <FiHeart
                  className="h-3.5 w-3.5"
                  style={favOnly ? { fill: "#FCA5A5", color: "#FCA5A5" } : undefined}
                />
                Favourites ({favorites.length})
              </button>
            )}

            {countsStatus === "offline" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11.5px] font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                Live counts unavailable
                <button
                  type="button"
                  onClick={fetchCounts}
                  aria-label="Retry loading counts"
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-amber-200/50 dark:hover:bg-amber-900/40"
                >
                  <FiRefreshCw className="h-3 w-3" />
                </button>
              </span>
            )}

            {countsStatus === "loading" && (
              <span className="text-[11.5px] text-zinc-500 dark:text-zinc-500">
                Loading counts…
              </span>
            )}
          </div>
        </div>

        {/* ─── Grid ───────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial={prefersReducedMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-10 sm:mt-14 grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {countsStatus === "loading" && Object.keys(counts).length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  favorite={favorites.includes(condition.id)}
                  onToggleFav={toggleFav}
                  countLoading={countsStatus === "loading"}
                />
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* ─── Empty state ────────────────────────── */}
        {filtered.length === 0 && countsStatus !== "loading" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              mt-12 text-center
              rounded-3xl
              border border-dashed border-zinc-300 dark:border-zinc-800
              bg-white/60 dark:bg-zinc-900/40
              px-6 py-14
            "
          >
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              <FiSearch className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
              {favOnly && query
                ? `No favourites match "${query}"`
                : favOnly
                ? "No favourites yet"
                : `No grades match "${query}"`}
            </h3>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              {favOnly
                ? "Tap the heart on any grade card to save it here."
                : "Try a different keyword, or browse all grades."}
            </p>
            <button
              type="button"
              onClick={() => {
                if (favOnly) patchParams({ fav: "" });
                else {
                  pushedQRef.current = "";
                  setSearchInput("");
                  patchParams({ q: "" });
                }
              }}
              className="
                mt-6 inline-flex items-center gap-2
                rounded-xl
                bg-zinc-900 dark:bg-white
                px-5 py-2.5
                text-sm font-semibold
                text-white dark:text-zinc-900
                hover:bg-zinc-800 dark:hover:bg-zinc-200
                active:scale-[0.98]
                transition-all
              "
            >
              {favOnly ? "Show all grades" : "Clear search"}
            </button>
          </motion.div>
        )}

        {/* ─── Grade legend ───────────────────────── */}
        {filtered.length > 0 && <GradeLegend />}

        {/* ─── Footer CTA ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="
            mt-12 sm:mt-16
            relative overflow-hidden
            rounded-3xl
            border border-zinc-200 dark:border-zinc-800
            bg-gradient-to-br from-zinc-900 to-zinc-800
            dark:from-zinc-900 dark:to-black
            px-6 py-10 sm:px-10 sm:py-14
            text-center
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2
              h-56 w-[420px] rounded-full blur-3xl opacity-40
              bg-gradient-to-r from-amber-400/40 via-rose-400/30 to-violet-400/30
            "
          />
          <div className="relative">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Not sure which grade to pick?
            </h3>
            <p className="mt-3 text-[14.5px] sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
              Our grading guide walks you through every tier with inspection notes
              and what to expect. Two minutes and you'll shop like an expert.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/guide"
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl
                  bg-white text-zinc-900
                  px-6 py-3
                  text-sm font-semibold
                  hover:bg-zinc-100
                  active:scale-[0.98]
                  transition-all
                  shadow-lg shadow-black/30
                "
              >
                Read the grading guide
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shop"
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl
                  border border-white/20
                  bg-white/5 backdrop-blur
                  text-white
                  px-6 py-3
                  text-sm font-semibold
                  hover:bg-white/10
                  active:scale-[0.98]
                  transition-all
                "
              >
                Browse all items
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Conditions;