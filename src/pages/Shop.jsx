import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Grid3x3,
  List,
  Heart,
  Star,
  Check,
  ArrowUpDown,
  Package,
  Sparkles,
  RefreshCw,
  ArrowUp,
  Truck,
  WifiOff,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useDragControls,
} from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import API from "../utils/api";

/* ════════════════════════════════════════════════════════════
   HD CSS — matches Navbar / Hero / ProductDetail
   ════════════════════════════════════════════════════════════ */
const HD_CSS = `
  .shop-hd-root {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: geometricPrecision;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "ss01" 1, "tnum" 1;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    font-optical-sizing: auto;
  }
  .shop-hd-root * { -webkit-tap-highlight-color: transparent; }
  .shop-hd-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 0, "WONK" 0, "opsz" 96;
    font-feature-settings: "kern" 1, "liga" 1, "ss01" 1;
  }
  .shop-hd-sans {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "tnum" 1;
  }
  .shop-hd-num {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "kern" 1;
  }

  /* Smooth, un-pixelated product photos */
  .shop-card-img {
    backface-visibility: hidden;
    transition: transform .7s cubic-bezier(.22,1,.36,1);
  }
  .shop-card-alt { opacity: 0; transition: opacity .5s ease; }
  .shop-wish { transition: opacity .2s ease, transform .2s ease, background-color .2s ease; }

  @media (hover: hover) {
    .shop-card:hover .shop-card-img { transform: scale(1.04); }
    .shop-card:hover .shop-card-alt { opacity: 1; }
    .shop-wish:not(.is-on) { opacity: 0; }
    .shop-card:hover .shop-wish:not(.is-on),
    .shop-wish:not(.is-on):focus-visible { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .shop-card-img, .shop-card-alt, .shop-wish { transition: none; }
    .shop-card:hover .shop-card-img { transform: none; }
  }

  .shop-hd-scroll { overscroll-behavior: contain; }
  .shop-hd-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .shop-hd-scroll::-webkit-scrollbar-track { background: transparent; }
  .shop-hd-scroll::-webkit-scrollbar-thumb {
    background: rgba(115, 115, 115, 0.35);
    border-radius: 999px;
  }
  .shop-hd-scroll::-webkit-scrollbar-thumb:hover { background: rgba(115, 115, 115, 0.55); }
  .shop-no-scrollbar { scrollbar-width: none; }
  .shop-no-scrollbar::-webkit-scrollbar { display: none; }

  /* ✅ Removed visible focus outline everywhere inside the shop
     NOTE: This hurts keyboard accessibility. If you change your mind,
     swap this block for a subtle box-shadow based ring. */
  .shop-hd-root,
  .shop-hd-root *,
  .shop-hd-root *::before,
  .shop-hd-root *::after {
    outline: none !important;
  }
  .shop-hd-root :focus,
  .shop-hd-root :focus-visible,
  .shop-hd-root :focus-within {
    outline: none !important;
    box-shadow: none !important;
  }
`;

/* ════════════════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════════════════ */
const CATEGORIES = ["All", "Men", "Women", "Unisex", "Kids"];
const CONDITIONS = ["All", "Good", "Very Good", "Excellent", "Premium", "Premium Plus"];
const BRANDS = [
  "All",
  "Adidas", "ASICS", "Birkenstock", "Brooks", "Clarks", "Columbia Sportswear",
  "Converse", "Crocs", "Dr. Martens", "FILA", "Geox", "Gucci", "HOKA",
  "Jimmy Choo", "Louis Vuitton", "Merrell", "Mizuno", "New Balance", "Nike",
  "Prada", "PUMA", "Reebok", "Saucony", "Skechers", "The North Face",
  "Timberland", "TOMS", "Under Armour", "Zara", "Others",
];
const SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size",
  "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46",
];
const APPAREL_SIZES = SIZES.filter((s) => Number.isNaN(Number(s)));
const FOOTWEAR_SIZES = SIZES.filter((s) => !Number.isNaN(Number(s)));

const SORT_OPTIONS = [
  { key: "newest", label: "Newest", sortBy: "createdAt", dir: "desc" },
  { key: "price-asc", label: "Price: Low to High", sortBy: "regularPrice", dir: "asc" },
  { key: "price-desc", label: "Price: High to Low", sortBy: "regularPrice", dir: "desc" },
  { key: "popular", label: "Best Selling", sortBy: "sold", dir: "desc" },
  { key: "rating", label: "Top Rated", sortBy: "rating", dir: "desc" },
];
const DEFAULT_SORT = "newest";

const PRICE_PRESETS = [
  { label: "Under Rs 5,000", min: "", max: "5000" },
  { label: "Rs 5,000 – 15,000", min: "5000", max: "15000" },
  { label: "Rs 15,000 – 40,000", min: "15000", max: "40000" },
  { label: "Over Rs 40,000", min: "40000", max: "" },
];

const PAGE_SIZE = 12;
const LS_VIEW = "fn_shop_view";
const LS_WISHLIST = "fn_shop_wishlist";

const conditionStyles = {
  Good: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  "Very Good": "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300",
  Excellent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
  Premium: "bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300",
  "Premium Plus": "bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
};

const FALLBACK_IMG =
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

/* ════════════════════════════════════════════════════════════
   ✅ SAMPLE PRODUCTS — shown when offline / API unreachable
   ════════════════════════════════════════════════════════════ */
const SAMPLE_IMAGES = {
  sneakers:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  sneakers2:
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
  running:
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
  jacket:
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
  hoodie:
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
  tshirt:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  bag:
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
  watch:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
  sunglasses:
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
  boots:
    "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80",
  cap: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80",
  denim:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
};

const SAMPLE_PRODUCTS = [
  {
    _id: "sample-1",
    title: "Air Max 270 React — Triple Black",
    slug: "air-max-270-react-triple-black",
    brand: "Nike",
    category: "Men",
    condition: "Excellent",
    sizes: ["40", "41", "42", "43", "44"],
    images: [SAMPLE_IMAGES.sneakers, SAMPLE_IMAGES.sneakers2],
    shortDescription:
      "Iconic silhouette with responsive cushioning and a sleek all-black finish. A staple for everyday wear.",
    regularPrice: 32000,
    salePrice: 24999,
    isFeatured: true,
    inStock: true,
    stockQuantity: 24,
    rating: 4.7,
    numReviews: 128,
    sold: 340,
    views: 2100,
    createdAt: new Date(Date.now() - 2 * 864e5).toISOString(),
  },
  {
    _id: "sample-2",
    title: "Ultraboost Light Running Shoes",
    slug: "ultraboost-light-running-shoes",
    brand: "Adidas",
    category: "Unisex",
    condition: "Premium",
    sizes: ["39", "40", "41", "42", "43", "44", "45"],
    images: [SAMPLE_IMAGES.running],
    shortDescription:
      "Lightweight BOOST midsole with a breathable knit upper for long-distance comfort.",
    regularPrice: 42000,
    salePrice: 0,
    isFeatured: true,
    inStock: true,
    stockQuantity: 15,
    rating: 4.9,
    numReviews: 84,
    sold: 210,
    views: 1800,
    createdAt: new Date(Date.now() - 4 * 864e5).toISOString(),
  },
  {
    _id: "sample-3",
    title: "Vintage Denim Trucker Jacket",
    slug: "vintage-denim-trucker-jacket",
    brand: "Zara",
    category: "Women",
    condition: "Very Good",
    sizes: ["S", "M", "L", "XL"],
    images: [SAMPLE_IMAGES.jacket],
    shortDescription:
      "Classic washed denim with a relaxed fit. Perfect layering piece for every season.",
    regularPrice: 12500,
    salePrice: 8999,
    inStock: true,
    stockQuantity: 8,
    rating: 4.4,
    numReviews: 52,
    sold: 96,
    views: 720,
    createdAt: new Date(Date.now() - 6 * 864e5).toISOString(),
  },
  {
    _id: "sample-4",
    title: "Heavyweight Fleece Hoodie",
    slug: "heavyweight-fleece-hoodie",
    brand: "The North Face",
    category: "Men",
    condition: "Excellent",
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [SAMPLE_IMAGES.hoodie],
    shortDescription:
      "Ultra-soft 400gsm fleece with a relaxed fit, kangaroo pocket, and embroidered logo.",
    regularPrice: 18500,
    salePrice: 0,
    inStock: true,
    stockQuantity: 32,
    rating: 4.6,
    numReviews: 71,
    sold: 154,
    views: 940,
    createdAt: new Date(Date.now() - 8 * 864e5).toISOString(),
  },
  {
    _id: "sample-5",
    title: "Premium Cotton Crew Tee",
    slug: "premium-cotton-crew-tee",
    brand: "PUMA",
    category: "Unisex",
    condition: "Premium Plus",
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [SAMPLE_IMAGES.tshirt],
    shortDescription:
      "Heavyweight combed cotton, pre-shrunk and garment-dyed for a lived-in feel.",
    regularPrice: 4500,
    salePrice: 2999,
    isFeatured: true,
    inStock: true,
    stockQuantity: 120,
    rating: 4.8,
    numReviews: 210,
    sold: 620,
    views: 3400,
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
  },
  {
    _id: "sample-6",
    title: "Leather Weekender Bag",
    slug: "leather-weekender-bag",
    brand: "Gucci",
    category: "Unisex",
    condition: "Premium",
    sizes: ["One Size"],
    images: [SAMPLE_IMAGES.bag],
    shortDescription:
      "Full-grain Italian leather with brass hardware. Fits a 2-night trip with ease.",
    regularPrice: 89000,
    salePrice: 74999,
    inStock: true,
    stockQuantity: 3,
    rating: 4.9,
    numReviews: 34,
    sold: 47,
    views: 1180,
    createdAt: new Date(Date.now() - 10 * 864e5).toISOString(),
  },
  {
    _id: "sample-7",
    title: "Chrono Classic Leather Watch",
    slug: "chrono-classic-leather-watch",
    brand: "Others",
    category: "Men",
    condition: "Excellent",
    sizes: ["One Size"],
    images: [SAMPLE_IMAGES.watch],
    shortDescription:
      "Japanese quartz movement, sapphire crystal, and genuine leather strap.",
    regularPrice: 24999,
    salePrice: 0,
    inStock: true,
    stockQuantity: 12,
    rating: 4.5,
    numReviews: 61,
    sold: 88,
    views: 610,
    createdAt: new Date(Date.now() - 12 * 864e5).toISOString(),
  },
  {
    _id: "sample-8",
    title: "Aviator Polarized Sunglasses",
    slug: "aviator-polarized-sunglasses",
    brand: "Prada",
    category: "Unisex",
    condition: "Very Good",
    sizes: ["One Size"],
    images: [SAMPLE_IMAGES.sunglasses],
    shortDescription:
      "UV400 polarized lenses in a lightweight titanium frame. Timeless aviator shape.",
    regularPrice: 15500,
    salePrice: 11999,
    inStock: true,
    stockQuantity: 26,
    rating: 4.3,
    numReviews: 45,
    sold: 120,
    views: 880,
    createdAt: new Date(Date.now() - 14 * 864e5).toISOString(),
  },
  {
    _id: "sample-9",
    title: "Chelsea Suede Boots",
    slug: "chelsea-suede-boots",
    brand: "Clarks",
    category: "Women",
    condition: "Premium Plus",
    sizes: ["37", "38", "39", "40", "41"],
    images: [SAMPLE_IMAGES.boots],
    shortDescription:
      "Handcrafted suede upper with elastic side panels and a cushioned insole.",
    regularPrice: 28500,
    salePrice: 19999,
    isFeatured: true,
    inStock: true,
    stockQuantity: 9,
    rating: 4.7,
    numReviews: 39,
    sold: 62,
    views: 540,
    createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
  },
  {
    _id: "sample-10",
    title: "Snapback Cap — Embroidered Logo",
    slug: "snapback-cap-embroidered-logo",
    brand: "New Balance",
    category: "Unisex",
    condition: "Good",
    sizes: ["One Size"],
    images: [SAMPLE_IMAGES.cap],
    shortDescription:
      "Structured 6-panel cap with an adjustable snap closure and embroidered logo.",
    regularPrice: 3500,
    salePrice: 0,
    inStock: true,
    stockQuantity: 65,
    rating: 4.2,
    numReviews: 22,
    sold: 78,
    views: 320,
    createdAt: new Date(Date.now() - 18 * 864e5).toISOString(),
  },
  {
    _id: "sample-11",
    title: "Slim Fit Stretch Denim",
    slug: "slim-fit-stretch-denim",
    brand: "Zara",
    category: "Men",
    condition: "Excellent",
    sizes: ["30", "32", "34", "36"],
    images: [SAMPLE_IMAGES.denim],
    shortDescription:
      "All-day comfort stretch denim with a modern slim leg and mid-rise waist.",
    regularPrice: 8999,
    salePrice: 6499,
    inStock: true,
    stockQuantity: 40,
    rating: 4.5,
    numReviews: 91,
    sold: 180,
    views: 1100,
    createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
  },
  {
    _id: "sample-12",
    title: "Retro Court Sneakers",
    slug: "retro-court-sneakers",
    brand: "Reebok",
    category: "Unisex",
    condition: "Very Good",
    sizes: ["38", "39", "40", "41", "42", "43"],
    images: [SAMPLE_IMAGES.sneakers2, SAMPLE_IMAGES.sneakers],
    shortDescription:
      "Timeless tennis-inspired design with a durable rubber cupsole.",
    regularPrice: 14500,
    salePrice: 0,
    inStock: true,
    stockQuantity: 20,
    rating: 4.4,
    numReviews: 55,
    sold: 130,
    views: 760,
    createdAt: new Date(Date.now() - 9 * 864e5).toISOString(),
  },
];

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */
const stripHtml = (html) => {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return String(html).replace(/<[^>]*>/g, "");
  return new DOMParser().parseFromString(String(html), "text/html").body.textContent || "";
};

const formatPKR = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Rs 0";
  return `Rs ${num.toLocaleString("en-PK")}`;
};

const readLS = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const CLOUDINARY_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;
const optimize = (url, w) => {
  if (!url) return url;
  const m = url.match(CLOUDINARY_RE);
  if (m) return `${m[1]}f_auto,q_auto,c_limit,w_${w}/${m[2]}`;
  if (url.includes("images.unsplash.com")) {
    return /([?&])w=\d+/.test(url)
      ? url.replace(/([?&])w=\d+/, `$1w=${w}`)
      : `${url}${url.includes("?") ? "&" : "?"}w=${w}`;
  }
  return url;
};
const canOptimize = (url = "") =>
  CLOUDINARY_RE.test(url) || url.includes("images.unsplash.com");
const buildSrcSet = (url) =>
  canOptimize(url)
    ? [320, 480, 640, 800, 1000].map((w) => `${optimize(url, w)} ${w}w`).join(", ")
    : undefined;

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

const buildParams = (f, page) => {
  const sort = SORT_OPTIONS.find((o) => o.key === f.sort) || SORT_OPTIONS[0];
  const params = {
    page,
    limit: PAGE_SIZE,
    sort: sort.dir,
    sortBy: sort.sortBy,
    published: "true",
  };
  if (f.q) params.search = f.q;
  if (f.category !== "All") params.category = f.category;
  if (f.brand !== "All") params.brand = f.brand;
  if (f.condition !== "All") params.condition = f.condition;
  if (f.size !== "All") params.size = f.size;
  if (f.minPrice !== "" && !Number.isNaN(Number(f.minPrice))) params.minPrice = Number(f.minPrice);
  if (f.maxPrice !== "" && !Number.isNaN(Number(f.maxPrice))) params.maxPrice = Number(f.maxPrice);
  return params;
};

const mergeUnique = (prev, next) => {
  const seen = new Set(prev.map((p) => p._id));
  return [...prev, ...next.filter((p) => !seen.has(p._id))];
};

/* ✅ Detect if an error is a network / offline failure */
const isOfflineError = (err) => {
  if (!err) return false;
  if (err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") return true;
  if (err.message === "Network Error") return true;
  if (!err.response) return true; // no HTTP response = connection failed
  return false;
};

/* ✅ Client-side filter for sample products (mirrors server behavior) */
const applyFiltersToSamples = (filters) => {
  const sort = SORT_OPTIONS.find((o) => o.key === filters.sort) || SORT_OPTIONS[0];
  let list = [...SAMPLE_PRODUCTS];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.shortDescription || "").toLowerCase().includes(q)
    );
  }
  if (filters.category !== "All") list = list.filter((p) => p.category === filters.category);
  if (filters.brand !== "All") list = list.filter((p) => p.brand === filters.brand);
  if (filters.condition !== "All") list = list.filter((p) => p.condition === filters.condition);
  if (filters.size !== "All") list = list.filter((p) => p.sizes?.includes(filters.size));

  if (filters.minPrice !== "") {
    const min = Number(filters.minPrice);
    list = list.filter((p) => {
      const price = p.salePrice > 0 ? p.salePrice : p.regularPrice;
      return price >= min;
    });
  }
  if (filters.maxPrice !== "") {
    const max = Number(filters.maxPrice);
    list = list.filter((p) => {
      const price = p.salePrice > 0 ? p.salePrice : p.regularPrice;
      return price <= max;
    });
  }

  const dir = sort.dir === "asc" ? 1 : -1;
  list.sort((a, b) => {
    let av = a[sort.sortBy];
    let bv = b[sort.sortBy];
    if (sort.sortBy === "createdAt") {
      av = new Date(av).getTime();
      bv = new Date(bv).getTime();
    }
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  return list;
};

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};

/* ════════════════════════════════════════════════════════════
   Small UI pieces
   ════════════════════════════════════════════════════════════ */
const Pill = ({ active, onClick, children, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`shop-hd-sans inline-flex h-10 flex-shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-4 text-[12px] font-semibold transition-colors sm:h-9 ${
      active
        ? "border-transparent bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600"
    } ${className}`}
  >
    {children}
  </button>
);

const StarRating = memo(function StarRating({ rating = 0, count = 0, size = 12 }) {
  if (!rating) return null;
  return (
    <div className="inline-flex items-center gap-1" title={`${rating} out of 5`}>
      <div className="inline-flex items-center" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            style={{ width: size, height: size }}
            className={
              rating >= star - 0.5
                ? "fill-amber-400 text-amber-400"
                : "fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700"
            }
            strokeWidth={1.5}
          />
        ))}
      </div>
      <span className="sr-only">{rating} out of 5 stars</span>
      {count > 0 && (
        <span className="shop-hd-num text-[10px] font-medium text-neutral-400">({count})</span>
      )}
    </div>
  );
});

const CardImage = ({ src, alt = "", sizes, className, priority }) => (
  <img
    src={src ? optimize(src, 640) : FALLBACK_IMG}
    srcSet={src ? buildSrcSet(src) : undefined}
    sizes={sizes}
    alt={alt}
    loading={priority ? "eager" : "lazy"}
    fetchPriority={priority ? "high" : undefined}
    decoding="async"
    draggable={false}
    className={className}
    onError={(e) => {
      const el = e.currentTarget;
      if (el.dataset.fb) return;
      el.dataset.fb = "1";
      el.removeAttribute("srcset");
      el.src = FALLBACK_IMG;
    }}
  />
);

/* ════════════════════════════════════════════════════════════
   Skeleton
   ════════════════════════════════════════════════════════════ */
const ProductSkeleton = memo(function ProductSkeleton({ view }) {
  const bar = "animate-pulse rounded bg-neutral-100 dark:bg-neutral-800";
  const isList = view === "list";
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${
        isList ? "flex" : ""
      }`}
    >
      <div
        className={`animate-pulse bg-neutral-100 dark:bg-neutral-800 ${
          isList ? "aspect-square w-32 shrink-0 sm:w-44 md:w-56" : "aspect-square"
        }`}
      />
      <div className="flex-1 space-y-2.5 p-3 sm:p-4">
        <div className={`h-3 w-20 ${bar}`} />
        <div className={`h-4 w-full ${bar}`} />
        <div className={`h-4 w-2/3 ${bar}`} />
        <div className={`mt-4 h-5 w-24 ${bar}`} />
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   ProductCard
   ════════════════════════════════════════════════════════════ */
const ProductCard = memo(function ProductCard({
  product,
  index = 0,
  view = "grid",
  wishlisted,
  onToggleWishlist,
  animate = true,
}) {
  const isList = view === "list";
  const hasSale =
    product.salePrice && product.salePrice > 0 && product.salePrice < product.regularPrice;
  const discount = hasSale
    ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
    : 0;
  const images = useMemo(
    () => (Array.isArray(product.images) ? product.images.filter(Boolean) : []),
    [product.images]
  );
  const href = `/shop/${product.slug || product._id}`;
  const description = useMemo(
    () => stripHtml(product.shortDescription).trim(),
    [product.shortDescription]
  );
  const isNew = useMemo(
    () =>
      product.createdAt &&
      Date.now() - new Date(product.createdAt).getTime() < 14 * 24 * 3600 * 1000,
    [product.createdAt]
  );
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const maxSizes = isList ? 8 : 4;
  const conditionClass = conditionStyles[product.condition] || conditionStyles.Good;
  const mediaSizes = isList
    ? "(min-width: 768px) 224px, (min-width: 640px) 176px, 128px"
    : "(min-width: 1536px) 18vw, (min-width: 1280px) 21vw, (min-width: 1024px) 26vw, (min-width: 640px) 32vw, 48vw";
  const reviewCount = product.numReviews || product.reviewCount || 0;

  return (
    <motion.article
      initial={animate ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min((index % PAGE_SIZE) * 0.03, 0.3) }}
      className={`shop-card group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-[box-shadow,border-color] duration-300 hover:border-neutral-300 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 ${
        isList ? "flex" : "flex flex-col"
      }`}
    >
      <div
        className={`relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800 ${
          isList ? "w-32 shrink-0 sm:w-44 md:w-56" : ""
        }`}
      >
        <CardImage
          src={images[0]}
          alt={product.title}
          sizes={mediaSizes}
          priority={index < 4}
          className="shop-card-img absolute inset-0 h-full w-full object-cover"
        />
        {images[1] && (
          <CardImage
            src={images[1]}
            sizes={mediaSizes}
            className="shop-card-alt absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5 sm:left-2.5 sm:top-2.5">
          {hasSale && (
            <span className="shop-hd-sans shop-hd-num rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold leading-none text-white">
              −{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="shop-hd-sans rounded-full bg-amber-400 px-2 py-1 text-[10px] font-bold leading-none text-amber-950">
              Featured
            </span>
          )}
          {isNew && !product.isFeatured && (
            <span className="shop-hd-sans rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-bold leading-none text-white dark:bg-white dark:text-neutral-900">
              New
            </span>
          )}
        </div>

        {product.condition && (
          <span
            className={`shop-hd-sans pointer-events-none absolute bottom-2 left-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold leading-none shadow-sm sm:bottom-2.5 sm:left-2.5 ${conditionClass}`}
          >
            {product.condition}
          </span>
        )}

        {onToggleWishlist && (
          <button
            type="button"
            onClick={() => onToggleWishlist(product._id)}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`shop-wish absolute right-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm hover:scale-105 active:scale-95 dark:bg-neutral-900/90 sm:right-2.5 sm:top-2.5 ${
              wishlisted ? "is-on text-red-500" : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${wishlisted ? "fill-red-500" : ""}`}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col p-3 sm:p-4 ${isList ? "sm:p-5" : ""}`}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="shop-hd-sans truncate text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {product.brand}
          </span>
          <StarRating rating={product.rating} count={reviewCount} size={11} />
        </div>

        <h3 className="shop-hd-sans line-clamp-2 text-[13px] font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-amber-700 dark:text-neutral-100 dark:group-hover:text-amber-400 sm:text-sm">
          <Link to={href} className="after:absolute after:inset-0 after:z-[1] after:content-['']">
            {product.title}
          </Link>
        </h3>

        {isList && description && (
          <div className="mt-2 hidden sm:block">
            <p className="shop-hd-sans line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          </div>
        )}

        {(product.category || sizes.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {product.category && (
              <span className="shop-hd-sans mr-1 text-[11px] text-neutral-400">
                {product.category}
              </span>
            )}
            {sizes.slice(0, maxSizes).map((s) => (
              <span
                key={s}
                className="shop-hd-num rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              >
                {s}
              </span>
            ))}
            {sizes.length > maxSizes && (
              <span className="shop-hd-num text-[10px] font-medium text-neutral-400">
                +{sizes.length - maxSizes}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-3">
          <span className="shop-hd-num text-[15px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100 sm:text-base">
            {formatPKR(hasSale ? product.salePrice : product.regularPrice)}
          </span>
          {hasSale && (
            <span className="shop-hd-num text-[11px] tabular-nums text-neutral-400 line-through sm:text-xs">
              {formatPKR(product.regularPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
});

/* ════════════════════════════════════════════════════════════
   Filters
   ════════════════════════════════════════════════════════════ */
const FilterSection = ({ title, active = false, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-b border-neutral-200/80 py-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="shop-hd-sans flex items-center gap-2 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
          {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Filter applied" />}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        id={id}
        className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ${
          open ? "visible mt-3 grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="p-1 -m-1">{children}</div>
        </div>
      </div>
    </div>
  );
};

const inputCls =
  "shop-hd-num h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-base tabular-nums text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 sm:h-10 sm:text-[13px]";

const PriceFilter = ({ min, max, onCommit }) => {
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  const lastRef = useRef({ min, max });

  useEffect(() => {
    if (min !== lastRef.current.min || max !== lastRef.current.max) {
      lastRef.current = { min, max };
      setLo(min);
      setHi(max);
    }
  }, [min, max]);

  const valid = (a, b) => a === "" || b === "" || Number(a) <= Number(b);

  const commit = (a, b) => {
    let x = a;
    let y = b;
    if (!valid(x, y)) [x, y] = [y, x];
    lastRef.current = { min: x, max: y };
    setLo(x);
    setHi(y);
    onCommit(x, y);
  };

  useEffect(() => {
    if (lo === lastRef.current.min && hi === lastRef.current.max) return;
    if (!valid(lo, hi)) return;
    const t = setTimeout(() => commit(lo, hi), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lo, hi]);

  const onKey = (e) => {
    if (e.key === "Enter") commit(lo, hi);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Min"
          aria-label="Minimum price in PKR"
          value={lo}
          onChange={(e) => setLo(e.target.value)}
          onBlur={() => commit(lo, hi)}
          onKeyDown={onKey}
          className={inputCls}
        />
        <span className="text-neutral-400" aria-hidden="true">–</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Max"
          aria-label="Maximum price in PKR"
          value={hi}
          onChange={(e) => setHi(e.target.value)}
          onBlur={() => commit(lo, hi)}
          onKeyDown={onKey}
          className={inputCls}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRICE_PRESETS.map((p) => (
          <Pill
            key={p.label}
            active={min === p.min && max === p.max}
            onClick={() =>
              min === p.min && max === p.max ? commit("", "") : commit(p.min, p.max)
            }
            className="!h-9 !px-3 !text-[11.5px]"
          >
            {p.label}
          </Pill>
        ))}
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, onChange }) => {
  const [brandQuery, setBrandQuery] = useState("");
  const brands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    return BRANDS.filter((b) => b !== "All" && b.toLowerCase().includes(q));
  }, [brandQuery]);

  const toggle = (key, value) => onChange({ [key]: filters[key] === value ? "" : value });

  return (
    <div>
      <FilterSection title="Condition" active={filters.condition !== "All"}>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.filter((c) => c !== "All").map((c) => (
            <Pill key={c} active={filters.condition === c} onClick={() => toggle("condition", c)}>
              {c}
            </Pill>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Size" active={filters.size !== "All"}>
        <p className="shop-hd-sans mb-2 text-[11px] font-medium text-neutral-400">Apparel</p>
        <div className="grid grid-cols-4 gap-2">
          {APPAREL_SIZES.map((s) => (
            <Pill key={s} active={filters.size === s} onClick={() => toggle("size", s)} className="!px-0">
              {s}
            </Pill>
          ))}
        </div>
        <p className="shop-hd-sans mb-2 mt-4 text-[11px] font-medium text-neutral-400">Footwear</p>
        <div className="grid grid-cols-4 gap-2">
          {FOOTWEAR_SIZES.map((s) => (
            <Pill key={s} active={filters.size === s} onClick={() => toggle("size", s)} className="!px-0">
              {s}
            </Pill>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brand" active={filters.brand !== "All"} defaultOpen={false}>
        <input
          type="text"
          value={brandQuery}
          onChange={(e) => setBrandQuery(e.target.value)}
          placeholder="Search brands"
          aria-label="Search brands"
          className={`${inputCls} shop-hd-sans mb-2`}
        />
        <div className="shop-hd-scroll max-h-56 overflow-y-auto pr-1">
          {brands.length === 0 && (
            <p className="shop-hd-sans py-3 text-center text-[12px] text-neutral-400">No brands match</p>
          )}
          {brands.map((b) => {
            const active = filters.brand === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggle("brand", b)}
                aria-pressed={active}
                className={`shop-hd-sans flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[13px] transition-colors ${
                  active
                    ? "bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                }`}
              >
                {b}
                {active && <Check className="h-4 w-4 text-amber-500" strokeWidth={3} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Price (PKR)" active={filters.minPrice !== "" || filters.maxPrice !== ""}>
        <PriceFilter
          min={filters.minPrice}
          max={filters.maxPrice}
          onCommit={(min, max) => onChange({ minPrice: min, maxPrice: max })}
        />
      </FilterSection>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   Sheet
   ════════════════════════════════════════════════════════════ */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const Sheet = ({ open, onClose, title, footer, children }) => {
  const isSide = useMediaQuery("(min-width: 640px)");
  const reduce = useReducedMotion();
  const dragControls = useDragControls();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
      (n) => getComputedStyle(n).visibility !== "hidden"
    );
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const hidden = isSide ? { x: "100%" } : { y: "100%" };
  const shown = isSide ? { x: 0 } : { y: 0 };

  return createPortal(
    <div className="shop-hd-root">
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]"
            aria-hidden="true"
          />
        )}
        {open && (
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={reduce ? { duration: 0 } : { type: "spring", damping: 34, stiffness: 340 }}
            drag={isSide ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[90svh] flex-col rounded-t-3xl bg-white shadow-2xl outline-none dark:bg-neutral-900 sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-3xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div
              className="flex cursor-grab touch-none justify-center pb-1 pt-3 sm:hidden"
              onPointerDown={(e) => dragControls.start(e)}
              aria-hidden="true"
            >
              <span className="h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-2 sm:pt-5">
              <h2 className="shop-hd-serif text-2xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="shop-hd-scroll flex-1 overflow-y-auto border-t border-neutral-200/80 px-5 py-5 dark:border-neutral-800">
              {children}
            </div>

            {footer && (
              <div className="border-t border-neutral-200/80 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                {footer}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

/* ════════════════════════════════════════════════════════════
   Toolbar controls
   ════════════════════════════════════════════════════════════ */
const toolbarBtn =
  "shop-hd-sans inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200/80 bg-white px-4 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600";

const SortMenu = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const current = SORT_OPTIONS.find((o) => o.key === value) || SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={toolbarBtn}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">Sort</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Sort products"
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white py-1.5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            {SORT_OPTIONS.map((opt) => {
              const active = opt.key === current.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onChange(opt.key);
                    setOpen(false);
                  }}
                  className={`shop-hd-sans flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-[13px] font-medium transition-colors [outline-offset:-2px] sm:py-2.5 ${
                    active
                      ? "bg-neutral-50 text-neutral-900 dark:bg-neutral-800/60 dark:text-neutral-100"
                      : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  {opt.label}
                  {active && <Check className="h-4 w-4 text-amber-500" strokeWidth={3} aria-hidden="true" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ViewToggle = ({ view, onChange }) => (
  <div
    role="group"
    aria-label="Product layout"
    className="inline-flex h-10 items-center rounded-full border border-neutral-200/80 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
  >
    {[
      { v: "grid", Icon: Grid3x3, label: "Grid view" },
      { v: "list", Icon: List, label: "List view" },
    ].map(({ v, Icon, label }) => (
      <button
        key={v}
        type="button"
        onClick={() => onChange(v)}
        aria-pressed={view === v}
        aria-label={label}
        className={`inline-flex h-8 w-9 items-center justify-center rounded-full transition-colors ${
          view === v
            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
    ))}
  </div>
);

/* ════════════════════════════════════════════════════════════
   Offline banner
   ════════════════════════════════════════════════════════════ */
const OfflineBanner = memo(function OfflineBanner({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
    >
      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950">
        <WifiOff className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="shop-hd-sans text-[13px] font-bold text-amber-900 dark:text-amber-200">
          You're offline — showing sample products
        </p>
        <p className="shop-hd-sans text-[11.5px] text-amber-800/80 dark:text-amber-300/70 mt-0.5">
          These are demo items. Reconnect to see live inventory and prices.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="shop-hd-sans inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-900 px-3.5 text-[12px] font-bold text-amber-50 transition-opacity hover:opacity-90 dark:bg-amber-200 dark:text-amber-950"
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        Retry
      </button>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   Shop (main)
   ════════════════════════════════════════════════════════════ */
const Shop = () => {
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [moreStatus, setMoreStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [meta, setMeta] = useState({ total: 0, hasMore: false });
  const [offlineMode, setOfflineMode] = useState(false);

  const [view, setView] = useState(() => (readLS(LS_VIEW, "grid") === "list" ? "list" : "grid"));
  const [wishlist, setWishlist] = useState(() => {
    const saved = readLS(LS_WISHLIST, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const isLg = useMediaQuery("(min-width: 1024px)");

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "All",
      brand: searchParams.get("brand") || "All",
      condition: searchParams.get("condition") || "All",
      size: searchParams.get("size") || "All",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sort: searchParams.get("sort") || DEFAULT_SORT,
    }),
    [searchParams]
  );

  const paramsRef = useRef(searchParams);
  paramsRef.current = searchParams;

  const updateParams = useCallback(
    (patch = {}) => {
      const next = new URLSearchParams(paramsRef.current);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "" || v === "All" || (k === "sort" && v === DEFAULT_SORT)) {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      });
      paramsRef.current = next;
      setSearchParams(next, { replace: true });
    },
    [setSearchParams]
  );
  const updateRef = useRef(updateParams);
  updateRef.current = updateParams;

  const [searchInput, setSearchInput] = useState(filters.q);
  const pushedQRef = useRef(filters.q);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (filters.q !== pushedQRef.current) {
      pushedQRef.current = filters.q;
      setSearchInput(filters.q);
    }
  }, [filters.q]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === pushedQRef.current) return;
    const t = setTimeout(() => {
      pushedQRef.current = trimmed;
      updateRef.current({ q: trimmed });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ─── Data fetching ─── */
  const pageRef = useRef(1);
  const abortRef = useRef(null);
  const moreInFlight = useRef(false);

  const run = useCallback(
    async (pageNum, append) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (append) {
        moreInFlight.current = true;
        setMoreStatus("loading");
      } else {
        moreInFlight.current = false;
        setMoreStatus("idle");
        setStatus("loading");
      }

      try {
        const res = await api.get("/api/posts", {
          params: buildParams(filters, pageNum),
          signal: controller.signal,
        });
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        const pagination = res?.data?.pagination || {};

        pageRef.current = pageNum;
        setProducts((prev) => (append ? mergeUnique(prev, data) : data));
        setMeta({
          total: pagination.total || data.length,
          hasMore: Boolean(pagination.hasMore),
        });
        setOfflineMode(false);
        if (append) setMoreStatus("idle");
        else setStatus("ready");
      } catch (err) {
        if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return;
        console.error("Fetch products error:", err);

        /* ✅ Offline / network failure → show samples */
        if (isOfflineError(err)) {
          if (append) {
            setMoreStatus("idle");
            setMeta((m) => ({ ...m, hasMore: false }));
            return;
          }
          const samples = applyFiltersToSamples(filters);
          setProducts(samples);
          setMeta({ total: samples.length, hasMore: false });
          setOfflineMode(true);
          setStatus("ready");
          toast.warning("You're offline — showing sample products", {
            description: "Reconnect to browse live inventory.",
            duration: 5000,
          });
          return;
        }

        /* Server error (4xx/5xx) */
        if (append) {
          setMoreStatus("error");
          toast.error("Couldn't load more products");
        } else {
          setErrorMsg(err.response?.data?.message || "Failed to load products");
          setProducts([]);
          setMeta({ total: 0, hasMore: false });
          setStatus("error");
          toast.error("Failed to load products");
        }
      } finally {
        if (append) moreInFlight.current = false;
      }
    },
    [filters]
  );

  const firstRun = useRef(true);
  const resultsRef = useRef(null);

  useEffect(() => {
    run(1, false);
    if (!firstRun.current) {
      const el = resultsRef.current;
      if (el && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    }
    firstRun.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const loadMore = useCallback(() => {
    if (moreInFlight.current) return;
    run(pageRef.current + 1, true);
  }, [run]);

  /* ─── Infinite scroll ─── */
  const sentinelRef = useRef(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !meta.hasMore || moreStatus !== "idle" || status !== "ready") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [meta.hasMore, moreStatus, status, loadMore, products.length]);

  const toggleWishlist = useCallback((id) => {
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  }, []);
  useEffect(() => writeLS(LS_WISHLIST, wishlist), [wishlist]);
  useEffect(() => writeLS(LS_VIEW, view), [view]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setShowTop(window.scrollY > 900));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (isLg) setFiltersOpen(false);
  }, [isLg]);

  const sidebarCount = useMemo(() => {
    let n = 0;
    if (filters.brand !== "All") n++;
    if (filters.condition !== "All") n++;
    if (filters.size !== "All") n++;
    if (filters.minPrice !== "" || filters.maxPrice !== "") n++;
    return n;
  }, [filters]);

  const chips = useMemo(() => {
    const list = [];
    const n = (v) => Number(v).toLocaleString("en-PK");
    if (filters.q) list.push({ key: "q", label: `“${filters.q}”`, clear: { q: "" } });
    if (filters.category !== "All") list.push({ key: "category", label: filters.category, clear: { category: "" } });
    if (filters.brand !== "All") list.push({ key: "brand", label: filters.brand, clear: { brand: "" } });
    if (filters.condition !== "All") list.push({ key: "condition", label: filters.condition, clear: { condition: "" } });
    if (filters.size !== "All") list.push({ key: "size", label: `Size ${filters.size}`, clear: { size: "" } });
    if (filters.minPrice !== "" || filters.maxPrice !== "") {
      const label =
        filters.minPrice !== "" && filters.maxPrice !== ""
          ? `Rs ${n(filters.minPrice)} – ${n(filters.maxPrice)}`
          : filters.minPrice !== ""
          ? `From Rs ${n(filters.minPrice)}`
          : `Up to Rs ${n(filters.maxPrice)}`;
      list.push({ key: "price", label, clear: { minPrice: "", maxPrice: "" } });
    }
    return list;
  }, [filters]);

  const clearAll = useCallback(() => {
    const next = new URLSearchParams();
    const sort = paramsRef.current.get("sort");
    if (sort) next.set("sort", sort);
    paramsRef.current = next;
    pushedQRef.current = "";
    setSearchInput("");
    setSearchParams(next, { replace: true });
  }, [setSearchParams]);

  const isRefetching = status === "loading" && products.length > 0;
  const plural = meta.total === 1 ? "" : "s";
  const countText =
    status === "error"
      ? ""
      : status === "loading" && products.length === 0
      ? "Loading products…"
      : meta.total > 0
      ? `${meta.total.toLocaleString("en-PK")} product${plural}`
      : "No products found";

  const gridClass =
    view === "list"
      ? "grid grid-cols-1 gap-3 sm:gap-4 2xl:grid-cols-2"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 xl:gap-5 2xl:grid-cols-5";

  /* ═════════════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════════════ */
  return (
    <div className="shop-hd-root min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <style>{HD_CSS}</style>

      {/* ─── Page header ─── */}
      <header className="border-b border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-[1640px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" strokeWidth={2} aria-hidden="true" />
                <span className="shop-hd-sans text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
                  Curated Luxury
                </span>
              </div>
              <h1 className="cat-hd-serif mt-3 text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.03em] text-neutral-900 dark:text-neutral-100">
  Shop All
</h1>
              <p className="shop-hd-sans mt-3 max-w-xl text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-[15px]">
                Discover sneakers, apparel, and accessories from the world's best brands.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchInput("");
                  }}
                  placeholder="Search products, brands, categories…"
                  aria-label="Search products"
                  className="shop-hd-sans h-12 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-11 pr-12 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 sm:text-[14px]"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                ) : (
                  <kbd
                    aria-hidden="true"
                    className="shop-hd-sans pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 lg:block"
                  >
                    /
                  </kbd>
                )}
              </div>
              <p className="shop-hd-sans mt-3 flex items-center gap-2 text-[12px] font-medium text-neutral-600 dark:text-neutral-400">
                <Truck className="h-4 w-4 text-emerald-500" strokeWidth={2} aria-hidden="true" />
                Free shipping over Rs 8,000
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="mx-auto max-w-[1640px] px-5 py-6 sm:px-8 lg:px-12 lg:py-8 xl:px-16">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-10">
          {/* Sidebar */}
          <aside
            aria-label="Filters"
            className="shop-hd-scroll hidden self-start rounded-2xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="shop-hd-serif text-xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                Filters
              </h2>
              {chips.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="shop-hd-sans text-[12px] font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Clear all
                </button>
              )}
            </div>
            <FilterPanel filters={filters} onChange={updateParams} />
          </aside>

          {/* Results column */}
          <main className="min-w-0">
            {/* ✅ Offline banner */}
            <AnimatePresence>
              {offlineMode && <OfflineBanner key="offline" onRetry={() => run(1, false)} />}
            </AnimatePresence>

            {/* Category chips */}
            <div
              role="group"
              aria-label="Category"
              className="shop-no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            >
              {CATEGORIES.map((cat) => (
                <Pill
                  key={cat}
                  active={filters.category === cat}
                  onClick={() => updateParams({ category: cat })}
                  className="snap-start"
                >
                  {cat}
                </Pill>
              ))}
            </div>

            {/* Toolbar */}
            <div ref={resultsRef} className="mt-4 scroll-mt-24">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className={`${toolbarBtn} lg:hidden`}
                    aria-haspopup="dialog"
                    aria-expanded={filtersOpen}
                  >
                    <SlidersHorizontal className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    Filters
                    {sidebarCount > 0 && (
                      <span className="shop-hd-num inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-amber-950">
                        {sidebarCount}
                      </span>
                    )}
                  </button>
                  <p
                    role="status"
                    aria-live="polite"
                    className="shop-hd-sans hidden truncate text-[13px] font-medium text-neutral-500 dark:text-neutral-400 sm:block"
                  >
                    {countText}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <ViewToggle view={view} onChange={setView} />
                  <SortMenu value={filters.sort} onChange={(key) => updateParams({ sort: key })} />
                </div>
              </div>

              <p className="shop-hd-sans mt-3 text-[13px] font-medium text-neutral-500 dark:text-neutral-400 sm:hidden">
                {countText}
              </p>
            </div>

            {/* Active chips */}
            <AnimatePresence initial={false}>
              {chips.length > 0 && (
                <motion.div
                  key="chips"
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-2 pt-4">
                    {chips.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => {
                          if (c.key === "q") {
                            pushedQRef.current = "";
                            setSearchInput("");
                          }
                          updateParams(c.clear);
                        }}
                        aria-label={`Remove filter: ${c.label}`}
                        className="shop-hd-sans group inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-white pl-3 pr-2 text-[12px] font-semibold text-neutral-800 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600"
                      >
                        {c.label}
                        <X className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100" strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={clearAll}
                      className="shop-hd-sans px-2 text-[12px] font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      Clear all
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="mt-5 sm:mt-6">
              {status === "loading" && products.length === 0 ? (
                <div className={gridClass} aria-busy="true" aria-label="Loading products">
                  {Array.from({ length: view === "list" ? 6 : 8 }).map((_, i) => (
                    <ProductSkeleton key={i} view={view} />
                  ))}
                </div>
              ) : status === "error" ? (
                <div className="rounded-2xl border border-red-200/80 bg-white p-8 text-center dark:border-red-900/60 dark:bg-neutral-900 sm:p-12">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
                    <X className="h-7 w-7 text-red-500" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h2 className="shop-hd-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                    Couldn't load products
                  </h2>
                  <p className="shop-hd-sans mx-auto mb-6 mt-2 max-w-md text-[14px] text-neutral-500 dark:text-neutral-400">
                    {errorMsg || "Something went wrong. Check your connection and try again."}
                  </p>
                  <button
                    type="button"
                    onClick={() => run(1, false)}
                    className="shop-hd-sans inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-6 text-[13px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    Try again
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900 sm:p-12">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <Package className="h-7 w-7 text-neutral-400" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h2 className="shop-hd-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                    No products found
                  </h2>
                  <p className="shop-hd-sans mx-auto mb-6 mt-2 max-w-md text-[14px] text-neutral-500 dark:text-neutral-400">
                    Try removing a filter or searching for something broader.
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="shop-hd-sans inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-6 text-[13px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    Reset filters
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className={`${gridClass} transition-opacity duration-200 ${
                      isRefetching ? "pointer-events-none opacity-60" : "opacity-100"
                    }`}
                    aria-busy={isRefetching}
                  >
                    {products.map((item, i) => (
                      <ProductCard
                        key={item._id}
                        product={item}
                        index={i}
                        view={view}
                        animate={!reduceMotion}
                        wishlisted={wishlist.includes(item._id)}
                        onToggleWishlist={toggleWishlist}
                      />
                    ))}
                  </div>

                  {/* ✅ Hide load-more / "you've seen all" when in offline mode */}
                  {!offlineMode && (
                    <>
                      {meta.hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}
                      <div className="mt-10 flex flex-col items-center gap-4">
                        <div className="w-full max-w-xs text-center">
                          <p className="shop-hd-sans shop-hd-num text-[12px] text-neutral-500 dark:text-neutral-400">
                            Showing {products.length.toLocaleString("en-PK")} of{" "}
                            {meta.total.toLocaleString("en-PK")}
                          </p>
                          <div
                            className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={meta.total}
                            aria-valuenow={products.length}
                            aria-label="Products loaded"
                          >
                            <div
                              className="h-full rounded-full bg-neutral-900 transition-[width] duration-500 dark:bg-neutral-100"
                              style={{
                                width: `${Math.min(100, (products.length / Math.max(meta.total, 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {moreStatus === "loading" && (
                          <div className="flex items-center gap-3" role="status">
                            <svg
                              className="h-5 w-5 animate-spin text-neutral-900 dark:text-neutral-100"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span className="shop-hd-sans text-[13px] text-neutral-600 dark:text-neutral-400">
                              Loading more products…
                            </span>
                          </div>
                        )}

                        {moreStatus === "error" && (
                          <button
                            type="button"
                            onClick={loadMore}
                            className="shop-hd-sans inline-flex h-11 items-center gap-2 rounded-full border border-red-200 bg-white px-6 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <RefreshCw className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                            Couldn't load more — retry
                          </button>
                        )}

                        {meta.hasMore && moreStatus === "idle" && (
                          <button
                            type="button"
                            onClick={loadMore}
                            className="shop-hd-sans inline-flex h-11 items-center rounded-full border border-neutral-300 bg-white px-6 text-[13px] font-semibold text-neutral-900 transition-colors hover:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-300"
                          >
                            Load more
                          </button>
                        )}

                        {!meta.hasMore && (
                          <p className="shop-hd-sans border-t border-neutral-200/80 pt-5 text-[12px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                            You've seen all {meta.total.toLocaleString("en-PK")} product{plural}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {offlineMode && (
                    <p className="shop-hd-sans mt-8 text-center text-[12px] text-neutral-500 dark:text-neutral-400">
                      Showing {products.length} sample product{products.length === 1 ? "" : "s"} · Reconnect for live inventory
                    </p>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Filters drawer */}
      <Sheet
        open={filtersOpen && !isLg}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className="flex items-center gap-3">
            {chips.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="shop-hd-sans h-12 rounded-full px-5 text-[13px] font-semibold text-neutral-600 underline underline-offset-2 dark:text-neutral-300"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="shop-hd-sans h-12 flex-1 rounded-full bg-neutral-900 px-6 text-[14px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
            >
              {status === "loading"
                ? "Updating…"
                : meta.total > 0
                ? `Show ${meta.total.toLocaleString("en-PK")} product${plural}`
                : "Show results"}
            </button>
          </div>
        }
      >
        <FilterPanel filters={filters} onChange={updateParams} />
      </Sheet>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            key="top"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
            aria-label="Back to top"
            className="fixed bottom-5 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-neutral-100 dark:text-neutral-900 sm:right-6"
            style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;