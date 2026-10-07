/* eslint-disable no-unused-vars */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import {
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Tag,
  Star,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertCircle,
  Grid2x2,
  List,
  SlidersHorizontal,
  Package,
  Shield,
  Truck,
  Award,
  Info,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import API from "@/utils/api";

/* ════════════════════════════════════════════════════════════
   CONFIG
   ════════════════════════════════════════════════════════════ */
const CACHE_KEY = "fs_brands_v1";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const FALLBACK_BRANDS = [
  { name: "Nike", slug: "nike", productCount: 48, featured: true },
  { name: "Adidas", slug: "adidas", productCount: 42, featured: true },
  { name: "Zara", slug: "zara", productCount: 36 },
  { name: "H&M", slug: "h-m", productCount: 30 },
  { name: "Levi's", slug: "levis", productCount: 28, featured: true },
  { name: "Puma", slug: "puma", productCount: 24 },
  { name: "Gucci", slug: "gucci", productCount: 18, featured: true },
  { name: "Prada", slug: "prada", productCount: 16 },
  { name: "Uniqlo", slug: "uniqlo", productCount: 22 },
  { name: "Mango", slug: "mango", productCount: 20 },
  { name: "Bershka", slug: "bershka", productCount: 14 },
  { name: "Pull&Bear", slug: "pull-bear", productCount: 12 },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "products-desc", label: "Most products" },
  { value: "products-asc", label: "Fewest products" },
];

/* ════════════════════════════════════════════════════════════
   HD CSS
   ════════════════════════════════════════════════════════════ */
const HD_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");

  .br-hd-root {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  }
  .br-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 0, "WONK" 0;
    letter-spacing: -0.02em;
  }
  .br-num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "kern" 1;
  }
  .br-hd-root :focus-visible { outline: 2px solid #171717; outline-offset: 2px; }
  .dark .br-hd-root :focus-visible { outline-color: #fafafa; }

  .br-skeleton {
    background: linear-gradient(90deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.05) 100%);
    background-size: 200% 100%;
    animation: br-shimmer 1.4s ease-in-out infinite;
  }
  .dark .br-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.05) 100%);
    background-size: 200% 100%;
  }
  @keyframes br-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .br-skeleton { animation: none; } }

  .br-scroll::-webkit-scrollbar { height: 6px; }
  .br-scroll::-webkit-scrollbar-track { background: transparent; }
  .br-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 9999px; }
  .dark .br-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); }
`;

/* ════════════════════════════════════════════════════════════
   Palette — deterministic per-brand accent
   ════════════════════════════════════════════════════════════ */
const PALETTE = [
  { bg: "#FEE2E2", text: "#991B1B", ring: "#FCA5A5" },
  { bg: "#DBEAFE", text: "#1E40AF", ring: "#93C5FD" },
  { bg: "#FEF3C7", text: "#92400E", ring: "#FCD34D" },
  { bg: "#D1FAE5", text: "#065F46", ring: "#6EE7B7" },
  { bg: "#EDE9FE", text: "#5B21B6", ring: "#C4B5FD" },
  { bg: "#CFFAFE", text: "#155E75", ring: "#67E8F9" },
  { bg: "#FCE7F3", text: "#9D174D", ring: "#F9A8D4" },
  { bg: "#FFEDD5", text: "#9A3412", ring: "#FDBA74" },
];

const hashToIndex = (str = "", mod = PALETTE.length) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % mod;
};

const accentFor = (label) => PALETTE[hashToIndex(label)];

const initialsFor = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const slugify = (s = "") =>
  s
    .toLowerCase()
    .trim()
    .replace(/&/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ════════════════════════════════════════════════════════════
   API
   ════════════════════════════════════════════════════════════ */
const getApiInstance = () => {
  const instance =
    API && typeof API.get === "function"
      ? API
      : axios.create({
          baseURL:
            (typeof import.meta !== "undefined" &&
              import.meta.env?.VITE_API_URL) ||
            "http://localhost:5000",
          headers: { "Content-Type": "application/json" },
        });
  if (!instance.__brandsAuthAttached) {
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
    instance.__brandsAuthAttached = true;
  }
  return instance;
};
const api = getApiInstance();

/* ════════════════════════════════════════════════════════════
   Cache helpers
   ════════════════════════════════════════════════════════════ */
const readCache = (key, ttl) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.t || !parsed?.items) return null;
    if (Date.now() - parsed.t > ttl) return null;
    return parsed.items;
  } catch {
    return null;
  }
};
const writeCache = (key, items) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), items }));
  } catch {}
};

/* ════════════════════════════════════════════════════════════
   Data normalizers
   ════════════════════════════════════════════════════════════ */
const normalizeBrandRecord = (raw, index = 0) => {
  if (!raw) return null;
  const name =
    raw.name || raw.brand || raw.title || raw.label || raw.slug || "";
  if (!name) return null;
  return {
    name: String(name).trim(),
    slug: raw.slug || slugify(name),
    logo: raw.logo || raw.image || null,
    description: raw.description || "",
    productCount:
      Number(raw.productCount ?? raw.productsCount ?? raw.count) || 0,
    featured: !!raw.featured,
  };
};

/* Derive from products list: unique brands + count */
const deriveBrandsFromProducts = (products = []) => {
  const map = new Map();
  products.forEach((p) => {
    const raw = p.brand || p.brandName;
    if (!raw) return;
    const name = String(raw).trim();
    if (!name) return;
    const key = name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.productCount += 1;
      if (!existing.logo && p.images?.[0]) existing.logo = p.images[0];
    } else {
      map.set(key, {
        name,
        slug: slugify(name),
        logo: p.images?.[0] || null,
        productCount: 1,
        featured: false,
      });
    }
  });
  return Array.from(map.values());
};

/* ════════════════════════════════════════════════════════════
   Icons / badges
   ════════════════════════════════════════════════════════════ */
const FeaturedBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm">
    <Star className="h-2.5 w-2.5 fill-amber-950" strokeWidth={0} />
    Featured
  </span>
);

const BrandLogo = memo(function BrandLogo({ brand, size = "md" }) {
  const accent = accentFor(brand.name);
  const dims =
    size === "sm"
      ? "h-12 w-12 text-base"
      : size === "lg"
      ? "h-20 w-20 text-2xl"
      : "h-16 w-16 text-lg";

  if (brand.logo) {
    return (
      <div
        className={`relative flex ${dims} shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900`}
      >
        <img
          src={brand.logo}
          alt={brand.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-2"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement?.classList.add(
              "bg-neutral-100",
              "dark:bg-neutral-800"
            );
            const sib = document.createElement("span");
            sib.className = `font-black tracking-tight ${dims.split(" ")[2]}`;
            sib.style.color = accent.text;
            sib.textContent = initialsFor(brand.name);
            e.currentTarget.parentElement?.appendChild(sib);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-2xl font-black tracking-tight`}
      style={{ background: accent.bg, color: accent.text }}
    >
      {initialsFor(brand.name)}
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   Brand card — grid view
   ════════════════════════════════════════════════════════════ */
const BrandCard = memo(function BrandCard({ brand, index }) {
  const reduceMotion = useReducedMotion();
  const accent = accentFor(brand.name);

  return (
    <motion.li
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.24) }}
    >
      <Link
        to={`/shop?brand=${encodeURIComponent(brand.name)}`}
        aria-label={`Shop ${brand.name}, ${brand.productCount} products`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-900/5 dark:border-neutral-800/80 dark:bg-neutral-900 dark:hover:border-neutral-700"
      >
        {/* Decorative corner accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: accent.bg }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <BrandLogo brand={brand} size="md" />
          {brand.featured && <FeaturedBadge />}
        </div>

        <div className="relative mt-4 flex-1">
          <h3 className="br-serif text-lg font-medium leading-tight text-neutral-900 dark:text-neutral-100">
            {brand.name}
          </h3>
          {brand.description ? (
            <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              {brand.description}
            </p>
          ) : (
            <p className="mt-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">
              Explore our {brand.name} collection
            </p>
          )}
        </div>

        <div className="relative mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <span className="br-num inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-neutral-500 dark:text-neutral-400">
            <Package className="h-3.5 w-3.5" strokeWidth={2.4} />
            {brand.productCount > 0
              ? `${brand.productCount} product${brand.productCount === 1 ? "" : "s"}`
              : "Coming soon"}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11.5px] font-bold transition-transform group-hover:translate-x-0.5"
            style={{ color: accent.text }}
          >
            Shop
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
        </div>
      </Link>
    </motion.li>
  );
});

/* ════════════════════════════════════════════════════════════
   Brand row — list view
   ════════════════════════════════════════════════════════════ */
const BrandRow = memo(function BrandRow({ brand, index }) {
  const reduceMotion = useReducedMotion();
  const accent = accentFor(brand.name);

  return (
    <motion.li
      layout
      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.02, 0.16) }}
    >
      <Link
        to={`/shop?brand=${encodeURIComponent(brand.name)}`}
        className="group flex items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900 dark:hover:border-neutral-700"
      >
        <BrandLogo brand={brand} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
              {brand.name}
            </h3>
            {brand.featured && <FeaturedBadge />}
          </div>
          {brand.description && (
            <p className="mt-0.5 line-clamp-1 text-[12px] text-neutral-500 dark:text-neutral-400">
              {brand.description}
            </p>
          )}
        </div>
        <span className="br-num hidden shrink-0 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 sm:inline-flex sm:items-center sm:gap-1.5">
          <Package className="h-3.5 w-3.5" strokeWidth={2.4} />
          {brand.productCount}
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.6}
        />
      </Link>
    </motion.li>
  );
});

/* ════════════════════════════════════════════════════════════
   Skeleton
   ════════════════════════════════════════════════════════════ */
const SkeletonCard = () => (
  <li className="flex h-52 flex-col rounded-2xl border border-neutral-200/70 bg-white p-5 dark:border-neutral-800/70 dark:bg-neutral-900">
    <div className="h-16 w-16 rounded-2xl br-skeleton" />
    <div className="mt-4 h-5 w-2/3 rounded br-skeleton" />
    <div className="mt-2 h-3 w-1/2 rounded br-skeleton" />
    <div className="mt-auto flex justify-between pt-4">
      <div className="h-3 w-20 rounded br-skeleton" />
      <div className="h-3 w-12 rounded br-skeleton" />
    </div>
  </li>
);

const SkeletonRow = () => (
  <li className="flex items-center gap-4 rounded-2xl border border-neutral-200/70 bg-white p-4 dark:border-neutral-800/70 dark:bg-neutral-900">
    <div className="h-12 w-12 shrink-0 rounded-xl br-skeleton" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-32 rounded br-skeleton" />
      <div className="h-3 w-48 rounded br-skeleton" />
    </div>
    <div className="h-4 w-12 rounded br-skeleton" />
  </li>
);

/* ════════════════════════════════════════════════════════════
   Empty state
   ════════════════════════════════════════════════════════════ */
const EmptyBrands = memo(function EmptyBrands({ hasFilters, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md rounded-3xl border border-dashed border-neutral-300 bg-white/70 px-6 py-14 text-center dark:border-neutral-800 dark:bg-neutral-900/50 sm:px-10 sm:py-16"
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <Tag className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
      </div>
      <h2 className="br-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {hasFilters ? "No brands match" : "No brands yet"}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-sm">
        {hasFilters
          ? "Try a different search term or clear your filters."
          : "Brands will appear here once products are added."}
      </p>
      <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            Clear filters
          </button>
        ) : (
          <Link
            to="/shop"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-[13.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.4} />
            Shop everything
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════ */
const Brands = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "featured";
  const letter = searchParams.get("letter") || "all";
  const featuredOnly = searchParams.get("featured") === "1";
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem("fs_brands_view") || "grid";
    } catch {
      return "grid";
    }
  });

  const [searchInput, setSearchInput] = useState(query);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* Persist view mode */
  useEffect(() => {
    try {
      localStorage.setItem("fs_brands_view", view);
    } catch {}
  }, [view]);

  /* Sync input with URL */
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  /* Debounce search → URL */
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === query) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  /* Fetch brands (cache → /api/brands → /api/products fallback) */
  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /* 1. Cache */
      const cached = readCache(CACHE_KEY, CACHE_TTL);
      if (cached && cached.length) {
        if (!mountedRef.current) return;
        setBrands(cached);
        setLoading(false);
        return;
      }

      /* 2. Try /api/brands */
      let result = [];
      try {
        const res = await api.get("/api/brands", { params: { limit: 200 } });
        const raw = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        result = raw.map(normalizeBrandRecord).filter(Boolean);
      } catch (e) {
        if (e?.response?.status !== 404) {
          console.warn("Brands endpoint failed:", e?.message);
        }
      }

      /* 3. Fallback: derive from products */
      if (!result.length) {
        const res = await api.get("/api/products", {
          params: { limit: 500, page: 1 },
        });
        const products = Array.isArray(res?.data?.data) ? res.data.data : [];
        result = deriveBrandsFromProducts(products);
      }

      /* 4. Final fallback */
      if (!result.length) {
        result = FALLBACK_BRANDS.map(normalizeBrandRecord).filter(Boolean);
      }

      if (!mountedRef.current) return;
      setBrands(result);
      writeCache(CACHE_KEY, result);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("Fetch brands error:", err);
      /* Even on failure, show fallback so the page isn't empty */
      setBrands(FALLBACK_BRANDS);
      setError(
        err?.response?.data?.message ||
          "Couldn't load brands — showing a starter list"
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands, retryKey]);

  /* Alphabet — from loaded brands */
  const alphabet = useMemo(() => {
    const set = new Set(
      brands
        .map((b) => b.name?.[0]?.toUpperCase())
        .filter((c) => /[A-Z]/.test(c))
    );
    return Array.from(set).sort();
  }, [brands]);

  /* Filter + search + sort */
  const filtered = useMemo(() => {
    let list = [...brands];

    if (featuredOnly) list = list.filter((b) => b.featured);
    if (letter !== "all") {
      list = list.filter(
        (b) => b.name[0]?.toUpperCase() === letter.toUpperCase()
      );
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.description || "").toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "products-desc":
        list.sort((a, b) => b.productCount - a.productCount);
        break;
      case "products-asc":
        list.sort((a, b) => a.productCount - b.productCount);
        break;
      case "featured":
      default:
        list.sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return b.productCount - a.productCount;
        });
    }

    return list;
  }, [brands, query, sort, letter, featuredOnly]);

  /* URL updaters */
  const setParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value === null || value === "" || value === "all") next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setSearchInput("");
  }, [setSearchParams]);

  const hasFilters =
    query !== "" || letter !== "all" || featuredOnly || sort !== "featured";

  /* Stats */
  const stats = useMemo(() => {
    const totalProducts = brands.reduce((s, b) => s + (b.productCount || 0), 0);
    const featured = brands.filter((b) => b.featured).length;
    return { total: brands.length, totalProducts, featured };
  }, [brands]);

  return (
    <div className="br-hd-root min-h-dvh bg-neutral-50/60 pb-16 dark:bg-neutral-950">
      <style>{HD_CSS}</style>

      {/* Breadcrumb */}
      <div className="border-b border-neutral-200/70 bg-white dark:border-neutral-800/70 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8 lg:px-10">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs"
          >
            <Link
              to="/"
              className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Home
            </Link>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <span
              aria-current="page"
              className="font-medium text-neutral-900 dark:text-neutral-100"
            >
              Brands
            </span>
          </nav>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 sm:text-[12px]"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
            Shop all
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 md:px-8 lg:px-10 lg:pt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-zinc-900 dark:bg-white" />
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-600 dark:text-neutral-400">
                Discover
              </span>
            </div>
            <h1 className="br-serif mt-3 text-[clamp(1.9rem,1.3rem+2.4vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
              Shop by Brand
            </h1>
            <p className="mt-2 text-[13px] text-neutral-500 dark:text-neutral-400 sm:text-[13.5px]">
              {loading
                ? "Loading brands…"
                : stats.total === 0
                ? "No brands available yet"
                : `${stats.total} brand${
                    stats.total === 1 ? "" : "s"
                  } · ${stats.totalProducts.toLocaleString()} products · ${
                    stats.featured
                  } featured`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            {/* View toggle */}
            <div
              role="group"
              aria-label="View mode"
              className="inline-flex overflow-hidden rounded-full border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Grid view"
                className={`inline-flex h-9 w-10 items-center justify-center transition-colors ${
                  view === "grid"
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <Grid2x2 className="h-4 w-4" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label="List view"
                className={`inline-flex h-9 w-10 items-center justify-center transition-colors ${
                  view === "list"
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <List className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              aria-label="Refresh brands"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Loader2
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : "hidden"}`}
                strokeWidth={2.4}
              />
              {!loading && (
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Trust strip */}
        {!loading && brands.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { Icon: Shield, label: "Authentic", sub: "100% genuine" },
              { Icon: Truck, label: "Fast delivery", sub: "Pakistan-wide" },
              { Icon: Award, label: "Curated", sub: "Only top brands" },
              { Icon: Tag, label: "Best prices", sub: "Guaranteed" },
            ].map(({ Icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-white p-3 dark:border-neutral-800/70 dark:bg-neutral-900"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-bold text-neutral-900 dark:text-neutral-100">
                    {label}
                  </p>
                  <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 md:px-8 lg:px-10">
        {/* Search + sort row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              strokeWidth={2.4}
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search brands…"
              aria-label="Search brands"
              className="w-full rounded-full border border-neutral-200 bg-white pl-10 pr-10 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-100"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setParam("q", null);
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              aria-label="Sort brands"
              className="w-full appearance-none rounded-full border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-[13px] font-semibold text-neutral-800 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-100 sm:w-auto"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              strokeWidth={2.4}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setParam("featured", featuredOnly ? null : "1")}
            aria-pressed={featuredOnly}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors ${
              featuredOnly
                ? "border-transparent bg-amber-400 text-amber-950"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${
                featuredOnly ? "fill-amber-950" : ""
              }`}
              strokeWidth={featuredOnly ? 0 : 2.4}
            />
            Featured only
          </button>

          <span className="hidden h-5 w-px bg-neutral-200 dark:bg-neutral-800 sm:block" />

          {/* Alphabet rail */}
          <div className="br-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => setParam("letter", null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors ${
                letter === "all"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              All
            </button>
            {alphabet.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setParam("letter", c)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors ${
                  letter === c
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              strokeWidth={2.4}
            />
            <div className="flex-1 text-[12.5px] text-amber-800 dark:text-amber-300">
              {error}
            </div>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="shrink-0 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            view === "grid" ? (
              <ul
                aria-busy="true"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </ul>
            ) : (
              <ul aria-busy="true" className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </ul>
            )
          ) : filtered.length === 0 ? (
            <EmptyBrands hasFilters={hasFilters} onClear={clearFilters} />
          ) : view === "grid" ? (
            <ul
              aria-label="Brands"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {filtered.map((brand, i) => (
                  <BrandCard
                    key={`${brand.slug}-${brand.name}`}
                    brand={brand}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <ul aria-label="Brands" className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {filtered.map((brand, i) => (
                  <BrandRow
                    key={`${brand.slug}-${brand.name}`}
                    brand={brand}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="mt-8 text-center text-[11.5px] text-neutral-400">
            Showing {filtered.length} of {brands.length} brand
            {brands.length === 1 ? "" : "s"}
            {hasFilters && " · filtered"}
          </p>
        )}
      </main>
    </div>
  );
};

export default Brands;