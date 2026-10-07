import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiArrowLeft,
  FiBookOpen,
  FiSearch,
  FiShoppingBag,
  FiMail,
  FiCompass,
  FiRefreshCw,
  FiAlertTriangle,
  FiWifiOff,
  FiClock,
  FiX,
  FiTrendingUp,
  FiCornerDownLeft,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/* ─────────────────────────────────────────────────────────────
 * Constants
 * ───────────────────────────────────────────────────────────── */
const QUICK_LINKS = [
  { to: "/", label: "Home", icon: FiHome },
  { to: "/shop", label: "Shop", icon: FiShoppingBag },
  { to: "/news", label: "Articles", icon: FiBookOpen },
  { to: "/contact", label: "Contact", icon: FiMail },
];

const SUGGESTED_SEARCHES = [
  "New arrivals",
  "Best sellers",
  "Sale",
  "Featured",
];

const POPULAR_DESTINATIONS = [
  { to: "/shop", label: "All products" },
  { to: "/brands", label: "Browse brands" },
  { to: "/orders", label: "My orders" },
  { to: "/cart", label: "Shopping bag" },
];

/* Common typo → real path map (extend as needed) */
const PATH_FIXES = [
  { from: /^\/shopp?$/i, to: "/shop", label: "/shop" },
  { from: /^\/product?s?$/i, to: "/shop", label: "/shop" },
  { from: /^\/prodcut?s?$/i, to: "/shop", label: "/shop" },
  { from: /^\/cartt?$/i, to: "/cart", label: "/cart" },
  { from: /^\/orde?rs?$/i, to: "/orders", label: "/orders" },
  { from: /^\/brans?ds?$/i, to: "/brands", label: "/brands" },
  { from: /^\/newsa?rticles?$/i, to: "/news", label: "/news" },
  { from: /^\/contac?t$/i, to: "/contact", label: "/contact" },
  { from: /^\/abou?t$/i, to: "/about", label: "/about" },
  { from: /^\/lo?gin$/i, to: "/login", label: "/login" },
  { from: /^\/signup$/i, to: "/register", label: "/register" },
  { from: /^\/registe?r$/i, to: "/register", label: "/register" },
];

const RECENT_KEY = "fs_recent_searches";

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */
const readRecentSearches = () => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
};

const findPathFix = (pathname = "") => {
  const p = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  for (const fix of PATH_FIXES) {
    if (fix.from.test(p)) {
      if (p !== fix.to) return fix;
    }
  }
  return null;
};

/* ─────────────────────────────────────────────────────────────
 * NotFound
 * ───────────────────────────────────────────────────────────── */
const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [glitchIndex, setGlitchIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [copied, setCopied] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const glitchFrames = ["404", "4Ø4", "4◯4", "404"];
  const referrer = useMemo(() => {
    try {
      if (!document.referrer) return null;
      const url = new URL(document.referrer);
      if (url.origin === window.location.origin) return url.pathname;
      return url.hostname;
    } catch {
      return null;
    }
  }, []);

  const pathFix = useMemo(
    () => findPathFix(location?.pathname || ""),
    [location?.pathname]
  );

  /* ─── Mount flag ─────────────────────────────── */
  useEffect(() => {
    setMounted(true);
    setRecentSearches(readRecentSearches());
  }, []);

  /* ─── Glitch loop ────────────────────────────── */
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setGlitchIndex((i) => (i + 1) % glitchFrames.length);
    }, 2200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  /* ─── Page title ─────────────────────────────── */
  useEffect(() => {
    const prev = document.title;
    document.title = "404 — Page Not Found | FeatheredShop";
    return () => {
      document.title = prev;
    };
  }, []);

  /* ─── Online/offline ─────────────────────────── */
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  /* ─── Keyboard shortcuts: "/" focus, Esc clear, H home ─── */
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const typing =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
        return;
      }
      if (e.key === "Escape") {
        if (document.activeElement === inputRef.current) {
          setQuery("");
          setShowSuggestions(false);
          inputRef.current?.blur();
        }
        return;
      }
      if ((e.key === "h" || e.key === "H") && !typing && !e.metaKey && !e.ctrlKey) {
        navigate("/");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  /* ─── Handlers ───────────────────────────────── */
  const runSearch = (term) => {
    const q = String(term || "").trim();
    if (!q) return;
    /* Persist recent */
    try {
      const next = [
        q,
        ...readRecentSearches().filter(
          (r) => r.toLowerCase() !== q.toLowerCase()
        ),
      ].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleSuggested = (term) => runSearch(term);

  const handleClearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href || location.pathname
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  /* ─── Motion ─────────────────────────────────── */
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: mounted ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  });

  /* ─── Autocomplete suggestions ───────────────── */
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [
        ...recentSearches.map((s) => ({ type: "recent", value: s })),
        ...SUGGESTED_SEARCHES.slice(0, 4).map((s) => ({
          type: "popular",
          value: s,
        })),
      ].slice(0, 6);
    }
    const pool = [...new Set([...recentSearches, ...SUGGESTED_SEARCHES])];
    return pool
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 6)
      .map((s) => ({ type: "match", value: s }));
  }, [query, recentSearches]);

  return (
    <main
      role="main"
      aria-labelledby="notfound-title"
      className="
        relative min-h-[100svh] w-full overflow-hidden
        bg-gradient-to-b from-white via-zinc-50 to-white
        dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950
        flex items-center justify-center
        px-4 sm:px-6 lg:px-8
        py-10 sm:py-14 lg:py-16
      "
    >
      {/* ─── Ambient background ─────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="
            absolute -top-32 left-1/2 -translate-x-1/2
            h-[420px] w-[420px] sm:h-[560px] sm:w-[560px]
            rounded-full blur-3xl opacity-60
            bg-gradient-to-tr from-amber-200/40 via-rose-200/30 to-transparent
            dark:from-amber-500/10 dark:via-rose-500/10 dark:to-transparent
          "
        />
        <div
          className="
            absolute inset-0 opacity-[0.035] dark:opacity-[0.06]
            [background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]
            dark:[background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
            [background-size:32px_32px]
            [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]
          "
        />
        <motion.div
          className="absolute top-24 left-[12%] h-2 w-2 rounded-full bg-amber-400/70 dark:bg-amber-300/50"
          animate={
            prefersReducedMotion
              ? {}
              : { y: [0, -14, 0], opacity: [0.6, 1, 0.6] }
          }
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 right-[14%] h-3 w-3 rounded-full bg-rose-400/60 dark:bg-rose-300/40"
          animate={
            prefersReducedMotion
              ? {}
              : { y: [0, 12, 0], opacity: [0.5, 1, 0.5] }
          }
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 right-[8%] h-1.5 w-1.5 rounded-full bg-zinc-400/60 dark:bg-zinc-500/60"
          animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ─── Offline banner ─────────────────────────────── */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="
              fixed top-3 left-1/2 -translate-x-1/2 z-40
              inline-flex items-center gap-2
              rounded-full
              bg-zinc-900 text-white dark:bg-white dark:text-zinc-900
              px-3.5 py-1.5 text-[11.5px] font-semibold
              shadow-lg
            "
          >
            <FiWifiOff className="h-3.5 w-3.5" />
            You're offline — some links may not work
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Card ──────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0)}
        className="
          relative z-10 w-full max-w-3xl
          rounded-3xl
          border border-zinc-200/70 dark:border-zinc-800/70
          bg-white/70 dark:bg-zinc-900/60
          backdrop-blur-xl
          shadow-[0_20px_60px_-25px_rgba(0,0,0,0.25)]
          dark:shadow-[0_20px_60px_-25px_rgba(0,0,0,0.7)]
          px-4 xs:px-6 sm:px-10 lg:px-14
          py-8 xs:py-10 sm:py-14
          text-center
        "
      >
        {/* Eyebrow */}
        <motion.div {...fadeUp(0.05)} className="mb-4 sm:mb-6">
          <Link
            to="/"
            className="
              inline-flex items-center gap-2
              text-[11px] sm:text-xs font-semibold
              uppercase tracking-[0.22em]
              text-zinc-500 dark:text-zinc-400
              hover:text-zinc-900 dark:hover:text-white
              transition-colors
            "
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            FeatheredShop
          </Link>
        </motion.div>

        {/* 404 headline with chromatic glitch */}
        <motion.div {...fadeUp(0.1)} className="relative select-none">
          <h1
            aria-hidden="true"
            className="
              text-[6rem] xs:text-[7rem] sm:text-[10rem] md:text-[12rem]
              font-black leading-none tracking-tighter
              bg-gradient-to-b from-zinc-200 to-zinc-100
              dark:from-zinc-800 dark:to-zinc-900
              bg-clip-text text-transparent
            "
          >
            404
          </h1>

          {/* Foreground glitch layer */}
          <span
            aria-hidden="true"
            className="
              pointer-events-none absolute inset-0
              flex items-center justify-center
              text-[5rem] xs:text-[6rem] sm:text-[9rem] md:text-[11rem]
              font-black leading-none tracking-tighter
              bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900
              dark:from-white dark:via-zinc-300 dark:to-white
              bg-clip-text text-transparent
              drop-shadow-[0_2px_10px_rgba(0,0,0,0.08)]
            "
          >
            {prefersReducedMotion ? "404" : glitchFrames[glitchIndex]}
          </span>

          {/* Tiny icon badge */}
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={mounted ? { scale: 1, rotate: 0 } : {}}
            transition={{
              delay: 0.35,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              absolute -bottom-2 right-1/2 translate-x-1/2
              sm:right-8 sm:translate-x-0 sm:-bottom-2
              inline-flex items-center justify-center
              h-11 w-11 xs:h-12 xs:w-12 sm:h-14 sm:w-14
              rounded-2xl
              bg-zinc-900 dark:bg-white
              text-white dark:text-zinc-900
              shadow-lg shadow-zinc-900/20 dark:shadow-white/10
            "
          >
            <FiSearch className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.div>
        </motion.div>

        {/* Copy */}
        <motion.h2
          {...fadeUp(0.2)}
          id="notfound-title"
          className="
            mt-7 xs:mt-8 sm:mt-10
            text-[22px] xs:text-2xl sm:text-3xl md:text-4xl
            font-black tracking-tight
            text-zinc-900 dark:text-white
          "
        >
          We couldn't find that page
        </motion.h2>

        <motion.p
          {...fadeUp(0.25)}
          className="
            mt-3 sm:mt-4
            text-[13.5px] xs:text-sm sm:text-base
            text-zinc-600 dark:text-zinc-400
            max-w-xl mx-auto leading-relaxed
          "
        >
          The link may be broken, or the page may have been moved or removed.
          Try a search, or head back to a safe place.
        </motion.p>

        {/* Diagnostics block */}
        {location?.pathname && location.pathname !== "/404" && (
          <motion.div
            {...fadeUp(0.28)}
            className="
              mt-5 sm:mt-6 mx-auto max-w-xl
              rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80
              bg-zinc-50/70 dark:bg-zinc-900/40
              p-3 sm:p-4
              text-left
            "
          >
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                <FiAlertTriangle className="h-3 w-3" />
                Debug info
              </p>
              <button
                type="button"
                onClick={handleCopyPath}
                className="
                  inline-flex items-center gap-1
                  rounded-full
                  px-2.5 py-1
                  text-[10.5px] font-semibold
                  text-zinc-500 dark:text-zinc-400
                  hover:text-zinc-900 dark:hover:text-white
                  hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70
                  transition-colors
                "
                aria-label="Copy full URL"
              >
                {copied ? (
                  <>
                    <FiCheck className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <FiCopy className="h-3 w-3" /> Copy URL
                  </>
                )}
              </button>
            </div>

            <dl className="mt-2.5 space-y-1.5 font-mono text-[11px] xs:text-[11.5px] text-zinc-700 dark:text-zinc-300">
              <div className="flex gap-2">
                <dt className="shrink-0 text-zinc-500 dark:text-zinc-500">
                  Path:
                </dt>
                <dd className="min-w-0 break-all">{location.pathname}</dd>
              </div>
              {location.search && (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-zinc-500 dark:text-zinc-500">
                    Query:
                  </dt>
                  <dd className="min-w-0 break-all">{location.search}</dd>
                </div>
              )}
              {referrer && (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-zinc-500 dark:text-zinc-500">
                    From:
                  </dt>
                  <dd className="min-w-0 break-all">{referrer}</dd>
                </div>
              )}
            </dl>

            {pathFix && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                <span className="text-[11.5px] text-amber-800 dark:text-amber-300">
                  Did you mean{" "}
                  <Link
                    to={pathFix.to}
                    className="font-bold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-200"
                  >
                    {pathFix.label}
                  </Link>
                  ?
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Search */}
        <motion.form
          {...fadeUp(0.3)}
          onSubmit={handleSearch}
          role="search"
          className="mt-6 xs:mt-7 sm:mt-9 max-w-xl mx-auto"
        >
          <div className="relative">
            <div
              className="
                group flex items-center gap-2
                rounded-2xl
                border border-zinc-200 dark:border-zinc-800
                bg-white dark:bg-zinc-900
                focus-within:border-zinc-900 dark:focus-within:border-white
                focus-within:ring-4 focus-within:ring-zinc-900/5 dark:focus-within:ring-white/10
                transition-all
                pl-4 pr-1.5 py-1.5
                shadow-sm
              "
            >
              <FiSearch
                className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowSuggestions(false), 180)
                }
                placeholder="Search products, articles..."
                aria-label="Search FeatheredShop"
                aria-autocomplete="list"
                aria-expanded={showSuggestions && suggestions.length > 0}
                className="
                  flex-1 min-w-0 bg-transparent
                  py-2.5 text-[14px] xs:text-sm sm:text-[15px]
                  text-zinc-900 dark:text-white
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  outline-none
                "
              />
              {query && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="
                    inline-flex h-7 w-7 shrink-0 items-center justify-center
                    rounded-full
                    text-zinc-400 dark:text-zinc-500
                    hover:bg-zinc-100 dark:hover:bg-zinc-800
                    hover:text-zinc-900 dark:hover:text-white
                    transition-colors
                  "
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="
                  shrink-0
                  inline-flex items-center gap-1.5
                  h-10 px-3.5 xs:px-4
                  rounded-xl
                  bg-zinc-900 dark:bg-white
                  text-white dark:text-zinc-900
                  text-[13px] font-semibold
                  hover:bg-zinc-800 dark:hover:bg-zinc-200
                  active:scale-[0.98]
                  transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  focus-visible:ring-zinc-900 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900
                "
              >
                <FiCompass className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">Search</span>
              </button>
            </div>

            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.14 }}
                  role="listbox"
                  className="
                    absolute left-0 right-0 top-full z-20 mt-2
                    overflow-hidden rounded-2xl
                    border border-zinc-200 dark:border-zinc-800
                    bg-white dark:bg-zinc-900
                    shadow-xl
                    text-left
                  "
                >
                  {suggestions.map((s, i) => (
                    <li key={`${s.type}-${s.value}-${i}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => runSearch(s.value)}
                        className="
                          flex w-full items-center gap-2.5
                          px-3.5 py-2.5
                          text-left text-[13px]
                          text-zinc-700 dark:text-zinc-300
                          hover:bg-zinc-50 dark:hover:bg-zinc-800/60
                          transition-colors
                        "
                      >
                        {s.type === "recent" ? (
                          <FiClock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        ) : s.type === "popular" ? (
                          <FiTrendingUp className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        ) : (
                          <FiSearch className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {s.value}
                        </span>
                        <FiCornerDownLeft className="h-3 w-3 shrink-0 text-zinc-400" />
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Suggested chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Try:
            </span>
            {SUGGESTED_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSuggested(term)}
                className="
                  text-[12px] font-medium
                  px-2.5 py-1
                  rounded-full
                  border border-zinc-200 dark:border-zinc-800
                  text-zinc-600 dark:text-zinc-400
                  hover:border-zinc-900 dark:hover:border-white
                  hover:text-zinc-900 dark:hover:text-white
                  transition-colors
                "
              >
                {term}
              </button>
            ))}
          </div>
        </motion.form>

        {/* Primary actions */}
        <motion.div
          {...fadeUp(0.4)}
          className="
            mt-7 xs:mt-8 sm:mt-10
            flex flex-col sm:flex-row
            gap-2.5 xs:gap-3 sm:gap-4
            justify-center items-stretch sm:items-center
          "
        >
          <Link
            to="/"
            className="
              group inline-flex items-center justify-center gap-2
              h-11 xs:h-12 px-5 xs:px-6
              rounded-xl
              bg-zinc-900 dark:bg-white
              text-white dark:text-zinc-900
              font-semibold text-sm
              hover:bg-zinc-800 dark:hover:bg-zinc-200
              active:scale-[0.98]
              shadow-sm hover:shadow-md
              transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-zinc-900 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900
            "
          >
            <FiHome className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Back to Home
          </Link>

          <Link
            to="/shop"
            className="
              group inline-flex items-center justify-center gap-2
              h-11 xs:h-12 px-5 xs:px-6
              rounded-xl
              border border-zinc-200 dark:border-zinc-800
              bg-white dark:bg-zinc-900
              text-zinc-800 dark:text-zinc-200
              font-semibold text-sm
              hover:bg-zinc-50 dark:hover:bg-zinc-800
              hover:border-zinc-300 dark:hover:border-zinc-700
              active:scale-[0.98]
              transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-zinc-900 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900
            "
          >
            <FiShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" />
            Continue Shopping
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              group inline-flex items-center justify-center gap-2
              h-11 xs:h-12 px-5 xs:px-6
              rounded-xl
              text-zinc-600 dark:text-zinc-400
              font-semibold text-sm
              hover:text-zinc-900 dark:hover:text-white
              hover:bg-zinc-100 dark:hover:bg-zinc-800
              active:scale-[0.98]
              transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-zinc-900 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900
            "
          >
            <FiArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Go Back
          </button>
        </motion.div>

        {/* Popular destinations */}
        <motion.div {...fadeUp(0.45)} className="mt-8 sm:mt-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[10.5px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500 font-semibold">
              Popular
            </span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {POPULAR_DESTINATIONS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="
                  inline-flex items-center gap-1.5
                  rounded-full
                  border border-zinc-200 dark:border-zinc-800
                  bg-white dark:bg-zinc-900
                  px-3.5 py-1.5
                  text-[12px] font-semibold
                  text-zinc-700 dark:text-zinc-300
                  hover:border-zinc-900 dark:hover:border-white
                  hover:text-zinc-900 dark:hover:text-white
                  transition-colors
                "
              >
                {label}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Quick links */}
        <motion.div {...fadeUp(0.5)} className="mt-8 sm:mt-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[10.5px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500 font-semibold">
              Quick Links
            </span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="
                  group flex flex-col items-center justify-center gap-2
                  px-3 py-3.5 xs:py-4
                  rounded-2xl
                  border border-zinc-200/80 dark:border-zinc-800/80
                  bg-white/60 dark:bg-zinc-900/40
                  text-zinc-700 dark:text-zinc-300
                  hover:bg-white dark:hover:bg-zinc-900
                  hover:border-zinc-300 dark:hover:border-zinc-700
                  hover:text-zinc-900 dark:hover:text-white
                  hover:-translate-y-0.5
                  shadow-sm hover:shadow-md
                  transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  focus-visible:ring-zinc-900 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900
                "
              >
                <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[12.5px] font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Helper footer */}
        <motion.div
          {...fadeUp(0.6)}
          className="
            mt-7 xs:mt-8 sm:mt-10 pt-5 xs:pt-6
            border-t border-zinc-200/70 dark:border-zinc-800/70
            flex flex-col sm:flex-row items-center justify-center
            gap-2.5 xs:gap-3 sm:gap-5
            text-[12px] xs:text-[12.5px] text-zinc-500 dark:text-zinc-400
          "
        >
          <span className="inline-flex items-center gap-1.5">
            <FiRefreshCw className="h-3.5 w-3.5" />
            Still stuck?
          </span>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">
            •
          </span>
          <Link
            to="/contact"
            className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white underline-offset-4 hover:underline transition"
          >
            Contact support
          </Link>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">
            •
          </span>
          <Link
            to="/about"
            className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white underline-offset-4 hover:underline transition"
          >
            About FeatheredShop
          </Link>
        </motion.div>

        {/* Keyboard hints */}
        <motion.div
          {...fadeUp(0.7)}
          className="
            mt-6 hidden sm:flex items-center justify-center gap-3
            text-[11px] text-zinc-400 dark:text-zinc-500
          "
        >
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">
              /
            </kbd>
            focus search
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">
              H
            </kbd>
            go home
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">
              Esc
            </kbd>
            clear
          </span>
        </motion.div>
      </motion.div>

      {/* Bottom tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="
          pointer-events-none absolute bottom-3 xs:bottom-4 sm:bottom-6 left-0 right-0
          text-center text-[11px] sm:text-xs
          text-zinc-400 dark:text-zinc-600
        "
      >
        Lost? We've got your back.
      </motion.p>
    </main>
  );
};

export default NotFound;