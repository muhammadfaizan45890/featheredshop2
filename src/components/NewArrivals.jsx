import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Heart,
  Star,
  Clock,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import API from "@/utils/api";

/* ════════════════════════════════════════════════════════════
   HD CSS
   Layout lives here (not in Tailwind classes) so ONE list element
   is a grid on phones and a snap-scrolling rail on tablet+ — no JS
   breakpoint switch, no remounting, no hydration flash.
   ════════════════════════════════════════════════════════════ */
const HD_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");

  .na-hd-root {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: geometricPrecision;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    font-optical-sizing: auto;
  }
  .na-hd-root * { -webkit-tap-highlight-color: transparent; }
  .na-hd-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 0, "WONK" 0, "opsz" 96;
    font-feature-settings: "kern" 1, "liga" 1, "ss01" 1;
    letter-spacing: -0.02em;
  }
  .na-hd-sans {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  }
  .na-hd-num {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "kern" 1;
  }

  /* ── Responsive list: grid on phones, snap rail from 768px ── */
  .na-list {
    --na-cols: 2;
    --na-gap: 0.625rem;
    display: grid;
    grid-template-columns: repeat(var(--na-cols), minmax(0, 1fr));
    gap: var(--na-gap);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .na-item { min-width: 0; }

  @media (min-width: 640px) {
    .na-list { --na-cols: 3; --na-gap: 0.75rem; }
  }

  @media (min-width: 768px) {
    .na-list {
      --na-cols: 4;
      --na-gap: 1rem;
      display: flex;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
      /* room for hover shadows that overflow clipping would cut off */
      padding: 0.5rem 0.25rem 1rem;
      margin: -0.5rem -0.25rem 0;
      scroll-padding-inline: 0.25rem;
      cursor: grab;
    }
    .na-list.is-dragging { cursor: grabbing; scroll-snap-type: none; }
    .na-list.is-static { overflow: hidden; scroll-snap-type: none; cursor: default; }
    .na-item {
      flex: 0 0 calc((100% - (var(--na-cols) - 1) * var(--na-gap)) / var(--na-cols));
      scroll-snap-align: start;
    }
  }
  /* Desktop: exactly 6 columns, grid wraps into 2 rows of 6 */
  @media (min-width: 1024px) {
    .na-list {
      --na-cols: 6;
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 1rem;
      overflow: visible;
      padding: 0;
      margin: 0;
      scroll-snap-type: none;
      cursor: default;
    }
    .na-item {
      flex: none;
      scroll-snap-align: none;
    }
    .na-list.is-dragging { cursor: default; scroll-snap-type: none; }
  }
  @media (min-width: 1280px) { .na-list { --na-cols: 6; } }
  @media (min-width: 1920px) { .na-list { --na-cols: 6; --na-gap: 1.25rem; } }
  @media (min-width: 2560px) { .na-list { --na-cols: 6; --na-gap: 1.5rem; } }

  /* ── Card motion ── */
  .na-card-img {
    backface-visibility: hidden;
    transition: transform .7s cubic-bezier(.22,1,.36,1), filter .3s ease;
  }
  .na-card-alt { opacity: 0; transition: opacity .5s ease; }
  .na-wish { transition: opacity .2s ease, transform .2s ease, background-color .2s ease; }

  @media (hover: hover) {
    .na-card:hover .na-card-img { transform: scale(1.06); }
    .na-card:hover .na-card-alt { opacity: 1; }
    .na-wish:not(.is-on) { opacity: 0; }
    .na-card:hover .na-wish:not(.is-on),
    .na-wish:not(.is-on):focus-visible { opacity: 1; }
  }
  /* Touch screens: bigger, always-visible wishlist target */
  @media (pointer: coarse) {
    .na-wish { min-width: 2.25rem; min-height: 2.25rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .na-card-img, .na-card-alt, .na-wish { transition: none; }
    .na-card:hover .na-card-img { transform: none; }
  }

  .na-scroll::-webkit-scrollbar { display: none; }
  .na-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  .na-list::-webkit-scrollbar { display: none; }
  .na-list { -ms-overflow-style: none; scrollbar-width: none; }

  .na-shimmer {
    background: linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%);
    background-size: 200% 100%;
    animation: na-shimmer 1.4s ease-in-out infinite;
  }
  .dark .na-shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%);
    background-size: 200% 100%;
  }
  @keyframes na-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .na-shimmer { animation: none; }
  }
`;

/* ════════════════════════════════════════════════════════════
   API instance
   ════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════
   SAMPLE PRODUCTS — shown when server is offline
   (Filtered: ONLY shoes — sneakers, running shoes, boots.
    No shirts, caps, t-shirts, hoodies, bags, watches, etc.)
   ════════════════════════════════════════════════════════════ */
const SAMPLE_IMAGES = {
  sneakers:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxnhHuQOjuoidITBIq",
  sneakers2:
    "https://cdn.media.amplience.net/i/scvl/178740_416651_1?fmt=auto&w=640",
  running:
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
  boots:
    "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80",
  sneakers3:
    "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=80",
  running2:
    "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800&q=80",
  boots2:
    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&q=80",
  sneakers4:
    "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&q=80",
  running3:
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80",
};

const SAMPLE_PRODUCTS = [
  {
    _id: "sample-na-1",
    title: "Air Max 270 React",
    slug: "air-max-270-react-triple-black",
    brand: "Nike",
    category: "Men",
    condition: "Excellent",
    sizes: ["40", "41", "42", "43", "44"],
    images: [SAMPLE_IMAGES.sneakers, SAMPLE_IMAGES.sneakers2],
    shortDescription:
      "Iconic silhouette with responsive cushioning and a sleek all-black finish.",
    regularPrice: 32000,
    salePrice: 24999,
    isFeatured: true,
    inStock: true,
    stockQuantity: 24,
    rating: 4.7,
    numReviews: 128,
    sold: 340,
    views: 2100,
    createdAt: new Date(Date.now() - 1 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-2",
    title: "Ultraboost Light",
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
    createdAt: new Date(Date.now() - 2 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-3",
    title: "Chelsea Suede Boots",
    slug: "chelsea-suede-boots",
    brand: "Clarks",
    category: "Women",
    condition: "Premium Plus",
    sizes: ["37", "38", "39", "40", "41"],
    images: [SAMPLE_IMAGES.boots],
    shortDescription:
      "Handcrafted suede upper with elastic side panels and cushioned insole.",
    regularPrice: 28500,
    salePrice: 19999,
    isFeatured: true,
    inStock: true,
    stockQuantity: 9,
    rating: 4.7,
    numReviews: 39,
    sold: 62,
    views: 540,
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-4",
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
    createdAt: new Date(Date.now() - 4 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-5",
    title: "Fresh Foam 1080",
    slug: "fresh-foam-1080",
    brand: "New Balance",
    category: "Men",
    condition: "Excellent",
    sizes: ["40", "41", "42", "43", "44", "45"],
    images: [SAMPLE_IMAGES.sneakers3],
    shortDescription:
      "Premium cushioning with a breathable mesh upper for all-day wear.",
    regularPrice: 27500,
    salePrice: 21999,
    inStock: true,
    stockQuantity: 18,
    rating: 4.6,
    numReviews: 72,
    sold: 145,
    views: 920,
    createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-6",
    title: "Gel-Nimbus 25",
    slug: "gel-nimbus-25",
    brand: "Asics",
    category: "Unisex",
    condition: "Premium",
    sizes: ["39", "40", "41", "42", "43", "44"],
    images: [SAMPLE_IMAGES.running2],
    shortDescription:
      "Plush GEL technology for exceptional shock absorption and comfort.",
    regularPrice: 38000,
    salePrice: 31999,
    isFeatured: true,
    inStock: true,
    stockQuantity: 11,
    rating: 4.8,
    numReviews: 63,
    sold: 98,
    views: 830,
    createdAt: new Date(Date.now() - 6 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-7",
    title: "Leather Chukka Boots",
    slug: "leather-chukka-boots",
    brand: "Timberland",
    category: "Men",
    condition: "Very Good",
    sizes: ["41", "42", "43", "44", "45"],
    images: [SAMPLE_IMAGES.boots2],
    shortDescription:
      "Premium full-grain leather with a cushioned footbed and rugged outsole.",
    regularPrice: 32000,
    salePrice: 0,
    inStock: true,
    stockQuantity: 7,
    rating: 4.5,
    numReviews: 41,
    sold: 76,
    views: 620,
    createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-8",
    title: "Air Force 1 '07",
    slug: "air-force-1-07",
    brand: "Nike",
    category: "Unisex",
    condition: "Excellent",
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    images: [SAMPLE_IMAGES.sneakers4],
    shortDescription:
      "The classic hoops original with crisp leather and Nike Air cushioning.",
    regularPrice: 22000,
    salePrice: 17999,
    isFeatured: true,
    inStock: true,
    stockQuantity: 30,
    rating: 4.9,
    numReviews: 187,
    sold: 420,
    views: 2800,
    createdAt: new Date(Date.now() - 8 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-9",
    title: "Cloudrunner Running",
    slug: "cloudrunner-running",
    brand: "On",
    category: "Women",
    condition: "Premium Plus",
    sizes: ["36", "37", "38", "39", "40"],
    images: [SAMPLE_IMAGES.running3],
    shortDescription:
      "CloudTec cushioning with a supportive Speedboard for smooth transitions.",
    regularPrice: 36000,
    salePrice: 28999,
    inStock: true,
    stockQuantity: 14,
    rating: 4.7,
    numReviews: 58,
    sold: 112,
    views: 980,
    createdAt: new Date(Date.now() - 9 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-10",
    title: "Classic Leather Sneakers",
    slug: "classic-leather-sneakers",
    brand: "Reebok",
    category: "Unisex",
    condition: "Good",
    sizes: ["39", "40", "41", "42", "43"],
    images: [SAMPLE_IMAGES.sneakers],
    shortDescription:
      "Soft garment leather upper with a die-cut EVA midsole for lightweight comfort.",
    regularPrice: 12500,
    salePrice: 9999,
    inStock: true,
    stockQuantity: 22,
    rating: 4.3,
    numReviews: 48,
    sold: 89,
    views: 570,
    createdAt: new Date(Date.now() - 10 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-11",
    title: "D'Lites Sport",
    slug: "dlites-sport",
    brand: "Skechers",
    category: "Women",
    condition: "Very Good",
    sizes: ["36", "37", "38", "39", "40"],
    images: [SAMPLE_IMAGES.sneakers3, SAMPLE_IMAGES.sneakers4],
    shortDescription:
      "Chunky sporty design with air-cooled memory foam insole.",
    regularPrice: 16500,
    salePrice: 12999,
    inStock: true,
    stockQuantity: 16,
    rating: 4.4,
    numReviews: 37,
    sold: 68,
    views: 490,
    createdAt: new Date(Date.now() - 11 * 864e5).toISOString(),
  },
  {
    _id: "sample-na-12",
    title: "Hiking Boots Pro",
    slug: "hiking-boots-pro",
    brand: "Merrell",
    category: "Men",
    condition: "Premium",
    sizes: ["41", "42", "43", "44", "45"],
    images: [SAMPLE_IMAGES.boots2],
    shortDescription:
      "Waterproof leather with Vibram outsole for superior traction on any terrain.",
    regularPrice: 34000,
    salePrice: 0,
    isFeatured: true,
    inStock: true,
    stockQuantity: 6,
    rating: 4.8,
    numReviews: 52,
    sold: 84,
    views: 710,
    createdAt: new Date(Date.now() - 12 * 864e5).toISOString(),
  },
];

/* ════════════════════════════════════════════════════════════
   Offline detection + fetch
   ════════════════════════════════════════════════════════════ */
const isOfflineError = (err) => {
  if (!err) return false;
  if (err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") return true;
  if (err.message === "Network Error") return true;
  if (!err.response) return true;
  return false;
};

async function fetchNewArrivals({ limit, signal }) {
  const params = {
    page: 1,
    limit,
    sortBy: "createdAt",
    sort: "desc",
    published: "true",
  };

  const paths = ["/api/posts", "/posts"];
  let lastError;

  for (const path of paths) {
    try {
      const res = await api.get(path, { params, signal });
      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      return { data, path, offline: false };
    } catch (err) {
      if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") throw err;

      if (isOfflineError(err)) {
        throw Object.assign(err, { __offline: true });
      }

      lastError = err;
      const httpStatus = err?.response?.status;
      if (httpStatus !== 404) throw err;
      console.warn(`NewArrivals: ${path} returned 404, trying next...`);
    }
  }
  throw lastError;
}

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */
const FALLBACK_IMG =
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

const formatPKR = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Rs 0";
  return `Rs ${num.toLocaleString("en-PK")}`;
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
    ? [240, 320, 480, 640, 800, 1000].map((w) => `${optimize(url, w)} ${w}w`).join(", ")
    : undefined;

const isNewArrival = (createdAt, days = 21) => {
  if (!createdAt) return false;
  const age = Date.now() - new Date(createdAt).getTime();
  return age < days * 24 * 3600 * 1000;
};

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

const LS_WISHLIST = "fn_shop_wishlist";
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
const sameList = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/* Image `sizes` mirrors the CSS columns: 2 → 3 → 4 → 6 → 6 → 6 */
const MEDIA_SIZES =
  "(min-width: 1280px) 230px, (min-width: 1024px) 19vw, (min-width: 768px) 24vw, (min-width: 640px) 31vw, 48vw";

/* ════════════════════════════════════════════════════════════
   Motion variants
   ════════════════════════════════════════════════════════════ */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ════════════════════════════════════════════════════════════
   Rating — compact: one star, score, and review count
   ════════════════════════════════════════════════════════════ */
const Rating = memo(function Rating({ rating = 0, count = 0 }) {
  if (!rating) return null;
  return (
    <span
      className="na-hd-num inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 sm:text-[11px]"
      title={`${rating} out of 5${count ? ` · ${count} reviews` : ""}`}
    >
      <Star
        className="h-2.5 w-2.5 fill-amber-400 text-amber-400 sm:h-3 sm:w-3"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      {Number(rating).toFixed(1)}
      {count > 0 && (
        <span className="hidden text-neutral-400 xs:inline" aria-hidden="true">
          ({count})
        </span>
      )}
      <span className="sr-only">
        {rating} out of 5 stars{count ? `, ${count} reviews` : ""}
      </span>
    </span>
  );
});

/* ════════════════════════════════════════════════════════════
   CardImage
   ════════════════════════════════════════════════════════════ */
const CardImage = memo(function CardImage({
  src,
  alt = "",
  sizes,
  className,
  priority,
}) {
  return (
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
});

/* ════════════════════════════════════════════════════════════
   Skeleton — uses the same list/item classes as real cards
   ════════════════════════════════════════════════════════════ */
const NewArrivalSkeleton = memo(function NewArrivalSkeleton() {
  return (
    <li className="na-item" aria-hidden="true">
      <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl">
        <div className="aspect-square na-shimmer" />
        <div className="space-y-2 p-2 sm:p-3 lg:p-4">
          <div className="h-2.5 w-14 na-shimmer rounded" />
          <div className="h-3 w-full na-shimmer rounded" />
          <div className="h-3 w-2/3 na-shimmer rounded" />
          <div className="mt-2 h-4 w-20 na-shimmer rounded" />
        </div>
      </div>
    </li>
  );
});

/* ════════════════════════════════════════════════════════════
   NewArrivalCard
   ════════════════════════════════════════════════════════════ */
const NewArrivalCard = memo(function NewArrivalCard({
  product,
  index = 0,
  wishlisted,
  onToggleWishlist,
}) {
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
  const isRecent = isNewArrival(product.createdAt, 7);
  const reviewCount = product.numReviews || product.reviewCount || 0;
  const soldOut =
    product.inStock === false ||
    (typeof product.stockQuantity === "number" && product.stockQuantity <= 0);
  const lowStock =
    !soldOut &&
    typeof product.stockQuantity === "number" &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= 5;

  return (
    <motion.li
      variants={itemVariants}
      className="
        na-item na-card group relative flex flex-col
        overflow-hidden rounded-xl border border-neutral-200/80 bg-white
        transition-[box-shadow,border-color] duration-300
        hover:border-neutral-300 hover:shadow-xl
        dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700
        sm:rounded-2xl
      "
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <CardImage
          src={images[0]}
          alt={product.title}
          sizes={MEDIA_SIZES}
          priority={index < 6}
          className={`na-card-img absolute inset-0 h-full w-full object-cover ${
            soldOut ? "grayscale opacity-70" : ""
          }`}
        />
        {images[1] && !soldOut && (
          <CardImage
            src={images[1]}
            sizes={MEDIA_SIZES}
            className="na-card-alt absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Badges */}
        <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex flex-col items-start gap-1 sm:left-2 sm:top-2 sm:gap-1.5">
          {soldOut && (
            <span className="na-hd-sans rounded-full bg-neutral-900 px-1.5 py-0.5 text-[9.5px] font-bold leading-none text-white dark:bg-white dark:text-neutral-900 sm:px-2 sm:py-1 sm:text-[10.5px]">
              Sold out
            </span>
          )}
          {!soldOut && hasSale && (
            <span className="na-hd-sans na-hd-num rounded-full bg-red-500 px-1.5 py-0.5 text-[9.5px] font-bold leading-none text-white sm:px-2 sm:py-1 sm:text-[10.5px]">
              −{discount}%
            </span>
          )}
          {!soldOut && isRecent && (
            <span className="na-hd-sans inline-flex items-center gap-0.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[9.5px] font-bold leading-none text-white dark:bg-white dark:text-neutral-900 sm:gap-1 sm:px-2 sm:py-1 sm:text-[10.5px]">
              <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" strokeWidth={3} aria-hidden="true" />
              New
            </span>
          )}
        </div>

        {/* Time chip — tablet+ only */}
        {product.createdAt && (
          <span className="pointer-events-none absolute bottom-2 left-2 z-10 na-hd-sans hidden items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md md:inline-flex">
            <Clock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
            {timeAgo(product.createdAt)}
          </span>
        )}

        {/* Wishlist */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={() => onToggleWishlist(product._id)}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
            className={`na-wish absolute right-1.5 top-1.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-neutral-900/90 dark:focus-visible:outline-white sm:right-2 sm:top-2 sm:h-9 sm:w-9 ${
              wishlisted ? "is-on text-red-500" : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wishlisted ? "fill-red-500" : ""}`}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-2 sm:p-3 lg:p-4">
        <div className="mb-1 flex items-center justify-between gap-1.5">
          <span className="na-hd-sans min-w-0 truncate text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 sm:text-[10.5px]">
            {product.brand}
          </span>
          <Rating rating={product.rating} count={reviewCount} />
        </div>

        <h3 className="na-hd-sans line-clamp-2 min-h-[2.5em] text-[12px] font-semibold leading-tight text-neutral-900 transition-colors group-hover:text-amber-700 dark:text-neutral-100 dark:group-hover:text-amber-400 sm:text-[13px] lg:text-sm">
          <Link
            to={href}
            draggable={false}
            className="rounded-sm after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white"
          >
            {product.title}
          </Link>
        </h3>

        {lowStock && (
          <p className="na-hd-sans mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400 sm:text-[11px]">
            Only {product.stockQuantity} left
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-0 pt-2 sm:pt-2.5 md:pt-3">
          <span
            className={`na-hd-num text-[13px] font-bold tabular-nums sm:text-[14px] lg:text-[15px] ${
              soldOut
                ? "text-neutral-400 dark:text-neutral-500"
                : "text-neutral-900 dark:text-neutral-100"
            }`}
          >
            {formatPKR(hasSale ? product.salePrice : product.regularPrice)}
          </span>
          {hasSale && (
            <span className="na-hd-num text-[10px] tabular-nums text-neutral-400 line-through sm:text-[11px]">
              {formatPKR(product.regularPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
});

/* ════════════════════════════════════════════════════════════
   ScrollButton
   ════════════════════════════════════════════════════════════ */
const ScrollButton = memo(function ScrollButton({ direction, disabled, onClick }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Scroll ${direction}`}
      className="
        inline-flex h-9 w-9 items-center justify-center rounded-full
        border border-neutral-200 bg-white text-neutral-700 shadow-sm
        transition-all duration-200
        hover:scale-105 hover:border-neutral-400 active:scale-95
        disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900
        dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300
        dark:hover:border-neutral-600 dark:focus-visible:outline-white
        lg:h-10 lg:w-10
      "
    >
      <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
    </button>
  );
});

/* ════════════════════════════════════════════════════════════
   OfflineBanner
   ════════════════════════════════════════════════════════════ */
const OfflineBanner = memo(function OfflineBanner({ onRetry, loading }) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30 sm:mb-6 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
    >
      <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950 sm:h-8 sm:w-8">
        <WifiOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="na-hd-sans text-[12px] font-bold text-amber-900 dark:text-amber-200 sm:text-[13px]">
          You're offline — showing samples
        </p>
        <p className="na-hd-sans mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-300/70 sm:text-[11.5px]">
          Reconnect to see live inventory.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="na-hd-sans inline-flex h-8 items-center gap-1 rounded-full bg-amber-900 px-3 text-[11px] font-bold text-amber-50 transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-amber-200 dark:text-amber-950 sm:h-9 sm:gap-1.5 sm:px-3.5 sm:text-[12px]"
      >
        <RefreshCw
          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${loading ? "animate-spin" : ""}`}
          strokeWidth={2.5}
          aria-hidden="true"
        />
        {loading ? "Retrying…" : "Retry"}
      </button>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   NewArrivals — main
   ════════════════════════════════════════════════════════════ */
const NewArrivals = ({
  limit = 12,
  days = 21,
  title = "New Arrivals",
  subtitle = "Fresh drops, straight from the atelier",
  ctaLink = "/shop?sort=newest",
  ctaLabel = "View all",
  showScrollButtons = true,
  maxItems = 12,
}) => {
  const reduceMotion = useReducedMotion();

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [offlineMode, setOfflineMode] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [wishlist, setWishlist] = useState(() => {
    const saved = readLS(LS_WISHLIST, []);
    return Array.isArray(saved) ? saved : [];
  });
  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;

  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [thumb, setThumb] = useState({ w: 100, x: 0 });

  /* ── Fetch newest products ────────────────────────── */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        setStatus("loading");
        setErrorMsg("");

        const { data } = await fetchNewArrivals({
          limit: Math.max(limit, maxItems),
          signal: controller.signal,
        });

        if (cancelled) return;

        let list = Array.isArray(data) ? data : [];

        if (list.length > 0 && days > 0) {
          const fresh = list.filter((p) => isNewArrival(p.createdAt, days));
          if (fresh.length >= Math.min(3, maxItems)) {
            list = fresh;
          }
        }

        const sliced = list.slice(0, maxItems);
        setProducts(sliced);
        setOfflineMode(false);
        setStatus(sliced.length > 0 ? "ready" : "empty");
      } catch (err) {
        if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") return;
        if (cancelled) return;

        if (err?.__offline || isOfflineError(err)) {
          // Use the filtered sample list (ONLY shoes — sneakers, running, boots)
          const samples = SAMPLE_PRODUCTS.slice(0, maxItems);
          setProducts(samples);
          setOfflineMode(true);
          setStatus("ready");
          toast.warning("You're offline — showing sample products", {
            description: "Reconnect to browse live inventory.",
            duration: 5000,
          });
          return;
        }

        console.error("NewArrivals: fetch failed", err);
        const httpStatus = err?.response?.status;
        const url = err?.config?.url;
        const base = err?.config?.baseURL;

        setErrorMsg(
          httpStatus === 404
            ? `Endpoint not found (${base || ""}${url || ""}). Check your backend.`
            : err?.response?.data?.message ||
              err?.message ||
              "Failed to load products"
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [limit, days, maxItems, retryKey]);

  /* ── Scroll state (arrows, edge fades, progress thumb) ── */
  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(max > 4 && el.scrollLeft < max - 4);

    if (max > 4) {
      const w = Math.max((el.clientWidth / el.scrollWidth) * 100, 12);
      const x = (el.scrollLeft / max) * (100 - w);
      setThumb((prev) =>
        Math.abs(prev.w - w) < 0.5 && Math.abs(prev.x - x) < 0.5
          ? prev
          : { w: Math.round(w * 2) / 2, x: Math.round(x * 2) / 2 }
      );
    } else {
      setThumb((prev) => (prev.w === 100 ? prev : { w: 100, x: 0 }));
    }
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, products.length, status]);

  const scrollByAmount = useCallback(
    (direction) => {
      const el = scrollerRef.current;
      if (!el) return;
      const amount = Math.max(el.clientWidth * 0.8, 240);
      el.scrollBy({
        left: direction * amount,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [reduceMotion]
  );

  /* ── Mouse drag-to-scroll (touch uses native scrolling) ── */
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  const onPointerDown = useCallback((e) => {
    const el = scrollerRef.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
    if (el.scrollWidth <= el.clientWidth) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      moved: false,
    };
  }, []);

  const onPointerMove = useCallback((e) => {
    const d = drag.current;
    const el = scrollerRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      el.classList.add("is-dragging");
    }
    if (d.moved) el.scrollLeft = d.startLeft - dx;
  }, []);

  const endDrag = useCallback(() => {
    const el = scrollerRef.current;
    drag.current.active = false;
    if (el) el.classList.remove("is-dragging");
  }, []);

  /* A drag must never be treated as a click on a card link */
  const onClickCapture = useCallback((e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowRight") scrollByAmount(1);
      else if (e.key === "ArrowLeft") scrollByAmount(-1);
    },
    [scrollByAmount]
  );

  /* ── Wishlist (synced across components and tabs) ──── */
  const toggleWishlist = useCallback((id) => {
    const cur = wishlistRef.current;
    const adding = !cur.includes(id);
    const next = adding ? [...cur, id] : cur.filter((x) => x !== id);
    setWishlist(next);
    writeLS(LS_WISHLIST, next);
    try {
      window.dispatchEvent(
        new CustomEvent("feathered:wishlist:update", { detail: { list: next } })
      );
    } catch {}
    toast.success(adding ? "Added to wishlist" : "Removed from wishlist", {
      duration: 1800,
    });
  }, []);

  useEffect(() => {
    const onExternal = (e) => {
      const list = e?.detail?.list;
      if (Array.isArray(list)) {
        setWishlist((prev) => (sameList(prev, list) ? prev : list));
      }
    };
    const onStorage = (e) => {
      if (e.key !== LS_WISHLIST) return;
      const list = readLS(LS_WISHLIST, []);
      if (Array.isArray(list)) {
        setWishlist((prev) => (sameList(prev, list) ? prev : list));
      }
    };
    window.addEventListener("feathered:wishlist:update", onExternal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("feathered:wishlist:update", onExternal);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (status === "empty") return null;

  const showRail = status === "ready" && (canScrollLeft || canScrollRight);

  /* ═════════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════════ */
  return (
    <section
      className="na-hd-root relative w-full bg-white py-6 dark:bg-neutral-950 sm:py-10 lg:py-14 3xl:py-20"
      aria-labelledby="new-arrivals-heading"
    >
      <style>{HD_CSS}</style>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 3xl:max-w-[100rem] 4xl:max-w-[120rem]">
        {/* ── Header ──────────────────────────────────── */}
        <header className="mb-4 flex items-end justify-between gap-3 sm:mb-6 md:mb-8 lg:mb-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 flex-1"
          >
            <span className="na-hd-sans inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 sm:text-[11px]">
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={2.25} aria-hidden="true" />
              Just dropped
            </span>

            <h2
              id="new-arrivals-heading"
              className="cat-hd-serif
                font-medium mt-1.5 text-[clamp(1.5rem,1.1rem+1.8vw,2.75rem)] leading-[1.1] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100 sm:mt-2.5"
            >
              {title}
            </h2>

            {subtitle && (
              <p className="na-hd-sans mt-1 max-w-xl text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:mt-1.5 sm:text-[13px] lg:text-sm">
                {subtitle}
              </p>
            )}
          </motion.div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {showScrollButtons && status === "ready" && (
              <div className="hidden items-center gap-1.5 md:flex">
                <ScrollButton
                  direction="left"
                  disabled={!canScrollLeft}
                  onClick={() => scrollByAmount(-1)}
                />
                <ScrollButton
                  direction="right"
                  disabled={!canScrollRight}
                  onClick={() => scrollByAmount(1)}
                />
              </div>
            )}

            {ctaLink && (
              <Link
                to={ctaLink}
                className="na-hd-sans group inline-flex items-center gap-1 rounded-sm text-[12px] font-semibold text-neutral-700 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 dark:text-neutral-300 dark:hover:text-white dark:focus-visible:outline-white sm:gap-1.5 sm:text-[13px]"
              >
                {ctaLabel}
                <ArrowRight
                  className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
              </Link>
            )}
          </div>
        </header>

        {/* ── Offline banner ─────────────────────────── */}
        <AnimatePresence initial={false}>
          {offlineMode && (
            <OfflineBanner
              key="offline"
              onRetry={() => setRetryKey((k) => k + 1)}
              loading={status === "loading"}
            />
          )}
        </AnimatePresence>

        {/* ── Loading ─────────────────────────────────── */}
        {status === "loading" && !offlineMode && (
          <ul
            role="list"
            className="na-list is-static"
            aria-busy="true"
            aria-label="Loading new arrivals"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <NewArrivalSkeleton key={i} />
            ))}
          </ul>
        )}

        {/* ── Error ───────────────────────────────────── */}
        {status === "error" && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-900/60 dark:bg-amber-950/30 sm:rounded-2xl sm:p-10"
          >
            <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 sm:mb-3 sm:h-12 sm:w-12">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="na-hd-serif text-base font-medium text-neutral-900 dark:text-neutral-100 sm:text-lg">
              Couldn't load new arrivals
            </p>
            <p className="na-hd-sans mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-amber-900/80 dark:text-amber-200/70 sm:mt-2 sm:text-[12.5px]">
              {errorMsg || "Check your connection and try again."}
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="na-hd-sans mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-amber-900 px-4 py-2 text-[12px] font-semibold text-amber-50 transition-opacity hover:opacity-90 dark:bg-amber-200 dark:text-amber-950 sm:mt-4"
            >
              <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {/* ── Products ────────────────────────────────── */}
        {status === "ready" && (
          <>
            <div className="relative">
              {/* Edge fades — tablet+ only, only when there is more to scroll */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -left-1 bottom-4 top-0 z-10 hidden w-10 bg-gradient-to-r from-white to-transparent transition-opacity duration-300 dark:from-neutral-950 md:block lg:w-14 ${
                  canScrollLeft ? "opacity-100" : "opacity-0"
                }`}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -right-1 bottom-4 top-0 z-10 hidden w-10 bg-gradient-to-l from-white to-transparent transition-opacity duration-300 dark:from-neutral-950 md:block lg:w-14 ${
                  canScrollRight ? "opacity-100" : "opacity-0"
                }`}
              />

              <motion.ul
                ref={scrollerRef}
                role="list"
                aria-label={title}
                variants={containerVariants}
                initial={reduceMotion ? false : "hidden"}
                whileInView="visible"
                viewport={{ once: true, amount: 0.05 }}
                className="na-list"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
                onPointerCancel={endDrag}
                onClickCapture={onClickCapture}
                onDragStart={(e) => e.preventDefault()}
                onKeyDown={onKeyDown}
              >
                {products.map((p, i) => (
                  <NewArrivalCard
                    key={p._id}
                    product={p}
                    index={i}
                    wishlisted={wishlist.includes(p._id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </motion.ul>
            </div>

            {/* Scroll progress — tablet+ */}
            {showRail && (
              <div
                aria-hidden="true"
                className="relative mt-1 hidden h-0.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 md:block"
              >
                <div
                  className="absolute inset-y-0 rounded-full bg-neutral-900 transition-[left] duration-100 dark:bg-neutral-100"
                  style={{ width: `${thumb.w}%`, left: `${thumb.x}%` }}
                />
              </div>
            )}

            {/* "View all" — phones only (header link covers larger screens) */}
            {ctaLink && (
              <div className="mt-5 flex justify-center md:hidden">
                <Link
                  to={ctaLink}
                  className="na-hd-sans group inline-flex min-h-11 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-[13px] font-semibold text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-100 dark:hover:text-white"
                >
                  {ctaLabel}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default memo(NewArrivals);



















// import React, {
//   memo,
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { Link } from "react-router-dom";
// import {
//   Sparkles,
//   ChevronLeft,
//   ChevronRight,
//   ArrowRight,
//   Heart,
//   Star,
//   Clock,
//   RefreshCw,
//   WifiOff,
// } from "lucide-react";
// import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// import { toast } from "sonner";
// import axios from "axios";
// import API from "@/utils/api";

// /* ════════════════════════════════════════════════════════════
//    HD CSS
//    Layout lives here (not in Tailwind classes) so ONE list element
//    is a grid on phones and a snap-scrolling rail on tablet+ — no JS
//    breakpoint switch, no remounting, no hydration flash.
//    ════════════════════════════════════════════════════════════ */
// const HD_CSS = `
//   @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");

//   .na-hd-root {
//     -webkit-font-smoothing: antialiased;
//     -moz-osx-font-smoothing: grayscale;
//     text-rendering: geometricPrecision;
//     font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
//     -webkit-text-size-adjust: 100%;
//     text-size-adjust: 100%;
//     font-optical-sizing: auto;
//   }
//   .na-hd-root * { -webkit-tap-highlight-color: transparent; }
//   .na-hd-serif {
//     font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
//     font-optical-sizing: auto;
//     font-variation-settings: "SOFT" 0, "WONK" 0, "opsz" 96;
//     font-feature-settings: "kern" 1, "liga" 1, "ss01" 1;
//     letter-spacing: -0.02em;
//   }
//   .na-hd-sans {
//     font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//     font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
//   }
//   .na-hd-num {
//     font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//     font-variant-numeric: tabular-nums;
//     font-feature-settings: "tnum" 1, "kern" 1;
//   }

//   /* ── Responsive list: grid on phones, snap rail from 768px ── */
//   .na-list {
//     --na-cols: 2;
//     --na-gap: 0.625rem;
//     display: grid;
//     grid-template-columns: repeat(var(--na-cols), minmax(0, 1fr));
//     gap: var(--na-gap);
//     list-style: none;
//     margin: 0;
//     padding: 0;
//   }
//   .na-item { min-width: 0; }

//   @media (min-width: 640px) {
//     .na-list { --na-cols: 3; --na-gap: 0.75rem; }
//   }

//   @media (min-width: 768px) {
//     .na-list {
//       --na-cols: 4;
//       --na-gap: 1rem;
//       display: flex;
//       overflow-x: auto;
//       overflow-y: hidden;
//       scroll-snap-type: x mandatory;
//       overscroll-behavior-x: contain;
//       -webkit-overflow-scrolling: touch;
//       /* room for hover shadows that overflow clipping would cut off */
//       padding: 0.5rem 0.25rem 1rem;
//       margin: -0.5rem -0.25rem 0;
//       scroll-padding-inline: 0.25rem;
//       cursor: grab;
//     }
//     .na-list.is-dragging { cursor: grabbing; scroll-snap-type: none; }
//     .na-list.is-static { overflow: hidden; scroll-snap-type: none; cursor: default; }
//     .na-item {
//       flex: 0 0 calc((100% - (var(--na-cols) - 1) * var(--na-gap)) / var(--na-cols));
//       scroll-snap-align: start;
//     }
//   }
//   @media (min-width: 1024px) { .na-list { --na-cols: 5; } }
//   @media (min-width: 1280px) { .na-list { --na-cols: 6; } }
//   @media (min-width: 1920px) { .na-list { --na-cols: 7; --na-gap: 1.25rem; } }
//   @media (min-width: 2560px) { .na-list { --na-cols: 8; --na-gap: 1.5rem; } }

//   /* ── Card motion ── */
//   .na-card-img {
//     backface-visibility: hidden;
//     transition: transform .7s cubic-bezier(.22,1,.36,1), filter .3s ease;
//   }
//   .na-card-alt { opacity: 0; transition: opacity .5s ease; }
//   .na-wish { transition: opacity .2s ease, transform .2s ease, background-color .2s ease; }

//   @media (hover: hover) {
//     .na-card:hover .na-card-img { transform: scale(1.06); }
//     .na-card:hover .na-card-alt { opacity: 1; }
//     .na-wish:not(.is-on) { opacity: 0; }
//     .na-card:hover .na-wish:not(.is-on),
//     .na-wish:not(.is-on):focus-visible { opacity: 1; }
//   }
//   /* Touch screens: bigger, always-visible wishlist target */
//   @media (pointer: coarse) {
//     .na-wish { min-width: 2.25rem; min-height: 2.25rem; }
//   }
//   @media (prefers-reduced-motion: reduce) {
//     .na-card-img, .na-card-alt, .na-wish { transition: none; }
//     .na-card:hover .na-card-img { transform: none; }
//   }

//   .na-scroll::-webkit-scrollbar { display: none; }
//   .na-scroll { -ms-overflow-style: none; scrollbar-width: none; }
//   .na-list::-webkit-scrollbar { display: none; }
//   .na-list { -ms-overflow-style: none; scrollbar-width: none; }

//   .na-shimmer {
//     background: linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%);
//     background-size: 200% 100%;
//     animation: na-shimmer 1.4s ease-in-out infinite;
//   }
//   .dark .na-shimmer {
//     background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%);
//     background-size: 200% 100%;
//   }
//   @keyframes na-shimmer {
//     0% { background-position: 200% 0; }
//     100% { background-position: -200% 0; }
//   }
//   @media (prefers-reduced-motion: reduce) {
//     .na-shimmer { animation: none; }
//   }
// `;

// /* ════════════════════════════════════════════════════════════
//    API instance
//    ════════════════════════════════════════════════════════════ */
// const createApi = () => {
//   if (API && typeof API.get === "function") return API;
//   const instance = axios.create({
//     baseURL:
//       import.meta.env.VITE_API_URL ||
//       "https://featherednews-backend-production.up.railway.app",
//     headers: { "Content-Type": "application/json" },
//   });
//   instance.interceptors.request.use(
//     (config) => {
//       try {
//         const token = localStorage.getItem("accessToken");
//         if (token) config.headers.Authorization = `Bearer ${token}`;
//       } catch {}
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );
//   return instance;
// };
// const api = createApi();

// /* ════════════════════════════════════════════════════════════
//    SAMPLE PRODUCTS — shown when server is offline
//    ════════════════════════════════════════════════════════════ */
// const SAMPLE_IMAGES = {
//   sneakers:
//     "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
//   sneakers2:
//     "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
//   running:
//     "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
//   jacket:
//     "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
//   hoodie:
//     "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
//   tshirt:
//     "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
//   bag:
//     "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
//   watch:
//     "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
//   sunglasses:
//     "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
//   boots:
//     "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80",
//   cap: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80",
//   denim:
//     "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
// };

// const SAMPLE_PRODUCTS = [
//   {
//     _id: "sample-na-1",
//     title: "Air Max 270 React",
//     slug: "air-max-270-react-triple-black",
//     brand: "Nike",
//     category: "Men",
//     condition: "Excellent",
//     sizes: ["40", "41", "42", "43", "44"],
//     images: [SAMPLE_IMAGES.sneakers, SAMPLE_IMAGES.sneakers2],
//     shortDescription:
//       "Iconic silhouette with responsive cushioning and a sleek all-black finish.",
//     regularPrice: 32000,
//     salePrice: 24999,
//     isFeatured: true,
//     inStock: true,
//     stockQuantity: 24,
//     rating: 4.7,
//     numReviews: 128,
//     sold: 340,
//     views: 2100,
//     createdAt: new Date(Date.now() - 1 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-2",
//     title: "Ultraboost Light",
//     slug: "ultraboost-light-running-shoes",
//     brand: "Adidas",
//     category: "Unisex",
//     condition: "Premium",
//     sizes: ["39", "40", "41", "42", "43", "44", "45"],
//     images: [SAMPLE_IMAGES.running],
//     shortDescription:
//       "Lightweight BOOST midsole with a breathable knit upper for long-distance comfort.",
//     regularPrice: 42000,
//     salePrice: 0,
//     isFeatured: true,
//     inStock: true,
//     stockQuantity: 15,
//     rating: 4.9,
//     numReviews: 84,
//     sold: 210,
//     views: 1800,
//     createdAt: new Date(Date.now() - 2 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-3",
//     title: "Denim Trucker Jacket",
//     slug: "vintage-denim-trucker-jacket",
//     brand: "Zara",
//     category: "Women",
//     condition: "Very Good",
//     sizes: ["S", "M", "L", "XL"],
//     images: [SAMPLE_IMAGES.jacket],
//     shortDescription:
//       "Classic washed denim with a relaxed fit. Perfect layering piece.",
//     regularPrice: 12500,
//     salePrice: 8999,
//     inStock: true,
//     stockQuantity: 8,
//     rating: 4.4,
//     numReviews: 52,
//     sold: 96,
//     views: 720,
//     createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-4",
//     title: "Fleece Hoodie",
//     slug: "heavyweight-fleece-hoodie",
//     brand: "The North Face",
//     category: "Men",
//     condition: "Excellent",
//     sizes: ["S", "M", "L", "XL", "XXL"],
//     images: [SAMPLE_IMAGES.hoodie],
//     shortDescription:
//       "Ultra-soft 400gsm fleece with a relaxed fit and embroidered logo.",
//     regularPrice: 18500,
//     salePrice: 0,
//     inStock: true,
//     stockQuantity: 32,
//     rating: 4.6,
//     numReviews: 71,
//     sold: 154,
//     views: 940,
//     createdAt: new Date(Date.now() - 4 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-5",
//     title: "Cotton Crew Tee",
//     slug: "premium-cotton-crew-tee",
//     brand: "PUMA",
//     category: "Unisex",
//     condition: "Premium Plus",
//     sizes: ["XS", "S", "M", "L", "XL"],
//     images: [SAMPLE_IMAGES.tshirt],
//     shortDescription:
//       "Heavyweight combed cotton, pre-shrunk and garment-dyed.",
//     regularPrice: 4500,
//     salePrice: 2999,
//     isFeatured: true,
//     inStock: true,
//     stockQuantity: 120,
//     rating: 4.8,
//     numReviews: 210,
//     sold: 620,
//     views: 3400,
//     createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-6",
//     title: "Weekender Bag",
//     slug: "leather-weekender-bag",
//     brand: "Gucci",
//     category: "Unisex",
//     condition: "Premium",
//     sizes: ["One Size"],
//     images: [SAMPLE_IMAGES.bag],
//     shortDescription:
//       "Full-grain Italian leather with brass hardware. Fits a 2-night trip.",
//     regularPrice: 89000,
//     salePrice: 74999,
//     inStock: true,
//     stockQuantity: 3,
//     rating: 4.9,
//     numReviews: 34,
//     sold: 47,
//     views: 1180,
//     createdAt: new Date(Date.now() - 6 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-7",
//     title: "Chrono Watch",
//     slug: "chrono-classic-leather-watch",
//     brand: "Others",
//     category: "Men",
//     condition: "Excellent",
//     sizes: ["One Size"],
//     images: [SAMPLE_IMAGES.watch],
//     shortDescription:
//       "Japanese quartz movement, sapphire crystal, and genuine leather strap.",
//     regularPrice: 24999,
//     salePrice: 0,
//     inStock: true,
//     stockQuantity: 12,
//     rating: 4.5,
//     numReviews: 61,
//     sold: 88,
//     views: 610,
//     createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-8",
//     title: "Aviator Sunglasses",
//     slug: "aviator-polarized-sunglasses",
//     brand: "Prada",
//     category: "Unisex",
//     condition: "Very Good",
//     sizes: ["One Size"],
//     images: [SAMPLE_IMAGES.sunglasses],
//     shortDescription:
//       "UV400 polarized lenses in a lightweight titanium frame.",
//     regularPrice: 15500,
//     salePrice: 11999,
//     inStock: true,
//     stockQuantity: 26,
//     rating: 4.3,
//     numReviews: 45,
//     sold: 120,
//     views: 880,
//     createdAt: new Date(Date.now() - 8 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-9",
//     title: "Chelsea Boots",
//     slug: "chelsea-suede-boots",
//     brand: "Clarks",
//     category: "Women",
//     condition: "Premium Plus",
//     sizes: ["37", "38", "39", "40", "41"],
//     images: [SAMPLE_IMAGES.boots],
//     shortDescription:
//       "Handcrafted suede upper with elastic side panels and cushioned insole.",
//     regularPrice: 28500,
//     salePrice: 19999,
//     isFeatured: true,
//     inStock: true,
//     stockQuantity: 9,
//     rating: 4.7,
//     numReviews: 39,
//     sold: 62,
//     views: 540,
//     createdAt: new Date(Date.now() - 9 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-10",
//     title: "Snapback Cap",
//     slug: "snapback-cap-embroidered-logo",
//     brand: "New Balance",
//     category: "Unisex",
//     condition: "Good",
//     sizes: ["One Size"],
//     images: [SAMPLE_IMAGES.cap],
//     shortDescription:
//       "Structured 6-panel cap with an adjustable snap closure.",
//     regularPrice: 3500,
//     salePrice: 0,
//     inStock: true,
//     stockQuantity: 65,
//     rating: 4.2,
//     numReviews: 22,
//     sold: 78,
//     views: 320,
//     createdAt: new Date(Date.now() - 10 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-11",
//     title: "Slim Fit Denim",
//     slug: "slim-fit-stretch-denim",
//     brand: "Zara",
//     category: "Men",
//     condition: "Excellent",
//     sizes: ["30", "32", "34", "36"],
//     images: [SAMPLE_IMAGES.denim],
//     shortDescription:
//       "All-day comfort stretch denim with a modern slim leg.",
//     regularPrice: 8999,
//     salePrice: 6499,
//     inStock: true,
//     stockQuantity: 40,
//     rating: 4.5,
//     numReviews: 91,
//     sold: 180,
//     views: 1100,
//     createdAt: new Date(Date.now() - 11 * 864e5).toISOString(),
//   },
//   {
//     _id: "sample-na-12",
//     title: "Retro Court Sneakers",
//     slug: "retro-court-sneakers",
//     brand: "Reebok",
//     category: "Unisex",
//     condition: "Very Good",
//     sizes: ["38", "39", "40", "41", "42", "43"],
//     images: [SAMPLE_IMAGES.sneakers2, SAMPLE_IMAGES.sneakers],
//     shortDescription:
//       "Timeless tennis-inspired design with a durable rubber cupsole.",
//     regularPrice: 14500,
//     salePrice: 0,
//     inStock: true,
//     stockQuantity: 20,
//     rating: 4.4,
//     numReviews: 55,
//     sold: 130,
//     views: 760,
//     createdAt: new Date(Date.now() - 12 * 864e5).toISOString(),
//   },
// ];

// /* ════════════════════════════════════════════════════════════
//    Offline detection + fetch
//    ════════════════════════════════════════════════════════════ */
// const isOfflineError = (err) => {
//   if (!err) return false;
//   if (err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") return true;
//   if (err.message === "Network Error") return true;
//   if (!err.response) return true;
//   return false;
// };

// async function fetchNewArrivals({ limit, signal }) {
//   const params = {
//     page: 1,
//     limit,
//     sortBy: "createdAt",
//     sort: "desc",
//     published: "true",
//   };

//   const paths = ["/api/posts", "/posts"];
//   let lastError;

//   for (const path of paths) {
//     try {
//       const res = await api.get(path, { params, signal });
//       const data = Array.isArray(res?.data?.data) ? res.data.data : [];
//       return { data, path, offline: false };
//     } catch (err) {
//       if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") throw err;

//       if (isOfflineError(err)) {
//         throw Object.assign(err, { __offline: true });
//       }

//       lastError = err;
//       const httpStatus = err?.response?.status;
//       if (httpStatus !== 404) throw err;
//       console.warn(`NewArrivals: ${path} returned 404, trying next...`);
//     }
//   }
//   throw lastError;
// }

// /* ════════════════════════════════════════════════════════════
//    Helpers
//    ════════════════════════════════════════════════════════════ */
// const FALLBACK_IMG =
//   'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

// const formatPKR = (value) => {
//   const num = Number(value);
//   if (!Number.isFinite(num)) return "Rs 0";
//   return `Rs ${num.toLocaleString("en-PK")}`;
// };

// const CLOUDINARY_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;
// const optimize = (url, w) => {
//   if (!url) return url;
//   const m = url.match(CLOUDINARY_RE);
//   if (m) return `${m[1]}f_auto,q_auto,c_limit,w_${w}/${m[2]}`;
//   if (url.includes("images.unsplash.com")) {
//     return /([?&])w=\d+/.test(url)
//       ? url.replace(/([?&])w=\d+/, `$1w=${w}`)
//       : `${url}${url.includes("?") ? "&" : "?"}w=${w}`;
//   }
//   return url;
// };
// const canOptimize = (url = "") =>
//   CLOUDINARY_RE.test(url) || url.includes("images.unsplash.com");
// const buildSrcSet = (url) =>
//   canOptimize(url)
//     ? [240, 320, 480, 640, 800, 1000].map((w) => `${optimize(url, w)} ${w}w`).join(", ")
//     : undefined;

// const isNewArrival = (createdAt, days = 21) => {
//   if (!createdAt) return false;
//   const age = Date.now() - new Date(createdAt).getTime();
//   return age < days * 24 * 3600 * 1000;
// };

// const timeAgo = (date) => {
//   if (!date) return "";
//   const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
//   if (seconds < 60) return "just now";
//   const minutes = Math.floor(seconds / 60);
//   if (minutes < 60) return `${minutes}m ago`;
//   const hours = Math.floor(minutes / 60);
//   if (hours < 24) return `${hours}h ago`;
//   const days = Math.floor(hours / 24);
//   if (days < 7) return `${days}d ago`;
//   const weeks = Math.floor(days / 7);
//   return `${weeks}w ago`;
// };

// const LS_WISHLIST = "fn_shop_wishlist";
// const readLS = (key, fallback) => {
//   try {
//     const v = localStorage.getItem(key);
//     return v ? JSON.parse(v) : fallback;
//   } catch {
//     return fallback;
//   }
// };
// const writeLS = (key, value) => {
//   try {
//     localStorage.setItem(key, JSON.stringify(value));
//   } catch {}
// };
// const sameList = (a, b) =>
//   a.length === b.length && a.every((v, i) => v === b[i]);

// /* Image `sizes` mirrors the CSS columns: 2 → 3 → 4 → 5 → 6 → 7 → 8 */
// const MEDIA_SIZES =
//   "(min-width: 1280px) 230px, (min-width: 1024px) 19vw, (min-width: 768px) 24vw, (min-width: 640px) 31vw, 48vw";

// /* ════════════════════════════════════════════════════════════
//    Motion variants
//    ════════════════════════════════════════════════════════════ */
// const containerVariants = {
//   hidden: {},
//   visible: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 18 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
//   },
// };

// /* ════════════════════════════════════════════════════════════
//    Rating — compact: one star, score, and review count
//    ════════════════════════════════════════════════════════════ */
// const Rating = memo(function Rating({ rating = 0, count = 0 }) {
//   if (!rating) return null;
//   return (
//     <span
//       className="na-hd-num inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 sm:text-[11px]"
//       title={`${rating} out of 5${count ? ` · ${count} reviews` : ""}`}
//     >
//       <Star
//         className="h-2.5 w-2.5 fill-amber-400 text-amber-400 sm:h-3 sm:w-3"
//         strokeWidth={1.5}
//         aria-hidden="true"
//       />
//       {Number(rating).toFixed(1)}
//       {count > 0 && (
//         <span className="hidden text-neutral-400 xs:inline" aria-hidden="true">
//           ({count})
//         </span>
//       )}
//       <span className="sr-only">
//         {rating} out of 5 stars{count ? `, ${count} reviews` : ""}
//       </span>
//     </span>
//   );
// });

// /* ════════════════════════════════════════════════════════════
//    CardImage
//    ════════════════════════════════════════════════════════════ */
// const CardImage = memo(function CardImage({
//   src,
//   alt = "",
//   sizes,
//   className,
//   priority,
// }) {
//   return (
//     <img
//       src={src ? optimize(src, 640) : FALLBACK_IMG}
//       srcSet={src ? buildSrcSet(src) : undefined}
//       sizes={sizes}
//       alt={alt}
//       loading={priority ? "eager" : "lazy"}
//       fetchPriority={priority ? "high" : undefined}
//       decoding="async"
//       draggable={false}
//       className={className}
//       onError={(e) => {
//         const el = e.currentTarget;
//         if (el.dataset.fb) return;
//         el.dataset.fb = "1";
//         el.removeAttribute("srcset");
//         el.src = FALLBACK_IMG;
//       }}
//     />
//   );
// });

// /* ════════════════════════════════════════════════════════════
//    Skeleton — uses the same list/item classes as real cards
//    ════════════════════════════════════════════════════════════ */
// const NewArrivalSkeleton = memo(function NewArrivalSkeleton() {
//   return (
//     <li className="na-item" aria-hidden="true">
//       <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl">
//         <div className="aspect-square na-shimmer" />
//         <div className="space-y-2 p-2 sm:p-3 lg:p-4">
//           <div className="h-2.5 w-14 na-shimmer rounded" />
//           <div className="h-3 w-full na-shimmer rounded" />
//           <div className="h-3 w-2/3 na-shimmer rounded" />
//           <div className="mt-2 h-4 w-20 na-shimmer rounded" />
//         </div>
//       </div>
//     </li>
//   );
// });

// /* ════════════════════════════════════════════════════════════
//    NewArrivalCard
//    ════════════════════════════════════════════════════════════ */
// const NewArrivalCard = memo(function NewArrivalCard({
//   product,
//   index = 0,
//   wishlisted,
//   onToggleWishlist,
// }) {
//   const hasSale =
//     product.salePrice && product.salePrice > 0 && product.salePrice < product.regularPrice;
//   const discount = hasSale
//     ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
//     : 0;
//   const images = useMemo(
//     () => (Array.isArray(product.images) ? product.images.filter(Boolean) : []),
//     [product.images]
//   );
//   const href = `/shop/${product.slug || product._id}`;
//   const isRecent = isNewArrival(product.createdAt, 7);
//   const reviewCount = product.numReviews || product.reviewCount || 0;
//   const soldOut =
//     product.inStock === false ||
//     (typeof product.stockQuantity === "number" && product.stockQuantity <= 0);
//   const lowStock =
//     !soldOut &&
//     typeof product.stockQuantity === "number" &&
//     product.stockQuantity > 0 &&
//     product.stockQuantity <= 5;

//   return (
//     <motion.li
//       variants={itemVariants}
//       className="
//         na-item na-card group relative flex flex-col
//         overflow-hidden rounded-xl border border-neutral-200/80 bg-white
//         transition-[box-shadow,border-color] duration-300
//         hover:border-neutral-300 hover:shadow-xl
//         dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700
//         sm:rounded-2xl
//       "
//     >
//       <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
//         <CardImage
//           src={images[0]}
//           alt={product.title}
//           sizes={MEDIA_SIZES}
//           priority={index < 4}
//           className={`na-card-img absolute inset-0 h-full w-full object-cover ${
//             soldOut ? "grayscale opacity-70" : ""
//           }`}
//         />
//         {images[1] && !soldOut && (
//           <CardImage
//             src={images[1]}
//             sizes={MEDIA_SIZES}
//             className="na-card-alt absolute inset-0 h-full w-full object-cover"
//           />
//         )}

//         {/* Badges */}
//         <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex flex-col items-start gap-1 sm:left-2 sm:top-2 sm:gap-1.5">
//           {soldOut && (
//             <span className="na-hd-sans rounded-full bg-neutral-900 px-1.5 py-0.5 text-[9.5px] font-bold leading-none text-white dark:bg-white dark:text-neutral-900 sm:px-2 sm:py-1 sm:text-[10.5px]">
//               Sold out
//             </span>
//           )}
//           {!soldOut && hasSale && (
//             <span className="na-hd-sans na-hd-num rounded-full bg-red-500 px-1.5 py-0.5 text-[9.5px] font-bold leading-none text-white sm:px-2 sm:py-1 sm:text-[10.5px]">
//               −{discount}%
//             </span>
//           )}
//           {!soldOut && isRecent && (
//             <span className="na-hd-sans inline-flex items-center gap-0.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[9.5px] font-bold leading-none text-white dark:bg-white dark:text-neutral-900 sm:gap-1 sm:px-2 sm:py-1 sm:text-[10.5px]">
//               <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" strokeWidth={3} aria-hidden="true" />
//               New
//             </span>
//           )}
//         </div>

//         {/* Time chip — tablet+ only */}
//         {product.createdAt && (
//           <span className="pointer-events-none absolute bottom-2 left-2 z-10 na-hd-sans hidden items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md md:inline-flex">
//             <Clock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
//             {timeAgo(product.createdAt)}
//           </span>
//         )}

//         {/* Wishlist */}
//         {onToggleWishlist && (
//           <button
//             type="button"
//             onClick={() => onToggleWishlist(product._id)}
//             aria-pressed={wishlisted}
//             aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
//             className={`na-wish absolute right-1.5 top-1.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-neutral-900/90 dark:focus-visible:outline-white sm:right-2 sm:top-2 sm:h-9 sm:w-9 ${
//               wishlisted ? "is-on text-red-500" : "text-neutral-700 dark:text-neutral-300"
//             }`}
//           >
//             <Heart
//               className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wishlisted ? "fill-red-500" : ""}`}
//               strokeWidth={2}
//               aria-hidden="true"
//             />
//           </button>
//         )}
//       </div>

//       {/* Body */}
//       <div className="flex flex-1 flex-col p-2 sm:p-3 lg:p-4">
//         <div className="mb-1 flex items-center justify-between gap-1.5">
//           <span className="na-hd-sans min-w-0 truncate text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 sm:text-[10.5px]">
//             {product.brand}
//           </span>
//           <Rating rating={product.rating} count={reviewCount} />
//         </div>

//         <h3 className="na-hd-sans line-clamp-2 min-h-[2.5em] text-[12px] font-semibold leading-tight text-neutral-900 transition-colors group-hover:text-amber-700 dark:text-neutral-100 dark:group-hover:text-amber-400 sm:text-[13px] lg:text-sm">
//           <Link
//             to={href}
//             draggable={false}
//             className="rounded-sm after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white"
//           >
//             {product.title}
//           </Link>
//         </h3>

//         {lowStock && (
//           <p className="na-hd-sans mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400 sm:text-[11px]">
//             Only {product.stockQuantity} left
//           </p>
//         )}

//         <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-0 pt-2 sm:pt-2.5 md:pt-3">
//           <span
//             className={`na-hd-num text-[13px] font-bold tabular-nums sm:text-[14px] lg:text-[15px] ${
//               soldOut
//                 ? "text-neutral-400 dark:text-neutral-500"
//                 : "text-neutral-900 dark:text-neutral-100"
//             }`}
//           >
//             {formatPKR(hasSale ? product.salePrice : product.regularPrice)}
//           </span>
//           {hasSale && (
//             <span className="na-hd-num text-[10px] tabular-nums text-neutral-400 line-through sm:text-[11px]">
//               {formatPKR(product.regularPrice)}
//             </span>
//           )}
//         </div>
//       </div>
//     </motion.li>
//   );
// });

// /* ════════════════════════════════════════════════════════════
//    ScrollButton
//    ════════════════════════════════════════════════════════════ */
// const ScrollButton = memo(function ScrollButton({ direction, disabled, onClick }) {
//   const Icon = direction === "left" ? ChevronLeft : ChevronRight;
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={disabled}
//       aria-label={`Scroll ${direction}`}
//       className="
//         inline-flex h-9 w-9 items-center justify-center rounded-full
//         border border-neutral-200 bg-white text-neutral-700 shadow-sm
//         transition-all duration-200
//         hover:scale-105 hover:border-neutral-400 active:scale-95
//         disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100
//         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900
//         dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300
//         dark:hover:border-neutral-600 dark:focus-visible:outline-white
//         lg:h-10 lg:w-10
//       "
//     >
//       <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
//     </button>
//   );
// });

// /* ════════════════════════════════════════════════════════════
//    OfflineBanner
//    ════════════════════════════════════════════════════════════ */
// const OfflineBanner = memo(function OfflineBanner({ onRetry, loading }) {
//   return (
//     <motion.div
//       role="status"
//       initial={{ opacity: 0, y: -8 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, y: -8 }}
//       transition={{ duration: 0.25 }}
//       className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30 sm:mb-6 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
//     >
//       <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950 sm:h-8 sm:w-8">
//         <WifiOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden="true" />
//       </div>
//       <div className="min-w-0 flex-1">
//         <p className="na-hd-sans text-[12px] font-bold text-amber-900 dark:text-amber-200 sm:text-[13px]">
//           You're offline — showing samples
//         </p>
//         <p className="na-hd-sans mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-300/70 sm:text-[11.5px]">
//           Reconnect to see live inventory.
//         </p>
//       </div>
//       <button
//         type="button"
//         onClick={onRetry}
//         disabled={loading}
//         className="na-hd-sans inline-flex h-8 items-center gap-1 rounded-full bg-amber-900 px-3 text-[11px] font-bold text-amber-50 transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-amber-200 dark:text-amber-950 sm:h-9 sm:gap-1.5 sm:px-3.5 sm:text-[12px]"
//       >
//         <RefreshCw
//           className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${loading ? "animate-spin" : ""}`}
//           strokeWidth={2.5}
//           aria-hidden="true"
//         />
//         {loading ? "Retrying…" : "Retry"}
//       </button>
//     </motion.div>
//   );
// });

// /* ════════════════════════════════════════════════════════════
//    NewArrivals — main
//    ════════════════════════════════════════════════════════════ */
// const NewArrivals = ({
//   limit = 12,
//   days = 21,
//   title = "New Arrivals",
//   subtitle = "Fresh drops, straight from the atelier",
//   ctaLink = "/shop?sort=newest",
//   ctaLabel = "View all",
//   showScrollButtons = true,
//   maxItems = 12,
// }) => {
//   const reduceMotion = useReducedMotion();

//   const [products, setProducts] = useState([]);
//   const [status, setStatus] = useState("loading");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [offlineMode, setOfflineMode] = useState(false);
//   const [retryKey, setRetryKey] = useState(0);
//   const [wishlist, setWishlist] = useState(() => {
//     const saved = readLS(LS_WISHLIST, []);
//     return Array.isArray(saved) ? saved : [];
//   });
//   const wishlistRef = useRef(wishlist);
//   wishlistRef.current = wishlist;

//   const scrollerRef = useRef(null);
//   const [canScrollLeft, setCanScrollLeft] = useState(false);
//   const [canScrollRight, setCanScrollRight] = useState(false);
//   const [thumb, setThumb] = useState({ w: 100, x: 0 });

//   /* ── Fetch newest products ────────────────────────── */
//   useEffect(() => {
//     const controller = new AbortController();
//     let cancelled = false;

//     (async () => {
//       try {
//         setStatus("loading");
//         setErrorMsg("");

//         const { data } = await fetchNewArrivals({
//           limit: Math.max(limit, maxItems),
//           signal: controller.signal,
//         });

//         if (cancelled) return;

//         let list = Array.isArray(data) ? data : [];

//         if (list.length > 0 && days > 0) {
//           const fresh = list.filter((p) => isNewArrival(p.createdAt, days));
//           if (fresh.length >= Math.min(3, maxItems)) {
//             list = fresh;
//           }
//         }

//         const sliced = list.slice(0, maxItems);
//         setProducts(sliced);
//         setOfflineMode(false);
//         setStatus(sliced.length > 0 ? "ready" : "empty");
//       } catch (err) {
//         if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") return;
//         if (cancelled) return;

//         if (err?.__offline || isOfflineError(err)) {
//           const samples = SAMPLE_PRODUCTS.slice(0, maxItems);
//           setProducts(samples);
//           setOfflineMode(true);
//           setStatus("ready");
//           toast.warning("You're offline — showing sample products", {
//             description: "Reconnect to browse live inventory.",
//             duration: 5000,
//           });
//           return;
//         }

//         console.error("NewArrivals: fetch failed", err);
//         const httpStatus = err?.response?.status;
//         const url = err?.config?.url;
//         const base = err?.config?.baseURL;

//         setErrorMsg(
//           httpStatus === 404
//             ? `Endpoint not found (${base || ""}${url || ""}). Check your backend.`
//             : err?.response?.data?.message ||
//               err?.message ||
//               "Failed to load products"
//         );
//         setStatus("error");
//       }
//     })();

//     return () => {
//       cancelled = true;
//       controller.abort();
//     };
//   }, [limit, days, maxItems, retryKey]);

//   /* ── Scroll state (arrows, edge fades, progress thumb) ── */
//   const updateScrollState = useCallback(() => {
//     const el = scrollerRef.current;
//     if (!el) return;
//     const max = el.scrollWidth - el.clientWidth;
//     setCanScrollLeft(el.scrollLeft > 4);
//     setCanScrollRight(max > 4 && el.scrollLeft < max - 4);

//     if (max > 4) {
//       const w = Math.max((el.clientWidth / el.scrollWidth) * 100, 12);
//       const x = (el.scrollLeft / max) * (100 - w);
//       setThumb((prev) =>
//         Math.abs(prev.w - w) < 0.5 && Math.abs(prev.x - x) < 0.5
//           ? prev
//           : { w: Math.round(w * 2) / 2, x: Math.round(x * 2) / 2 }
//       );
//     } else {
//       setThumb((prev) => (prev.w === 100 ? prev : { w: 100, x: 0 }));
//     }
//   }, []);

//   useEffect(() => {
//     const el = scrollerRef.current;
//     if (!el) return;
//     updateScrollState();
//     el.addEventListener("scroll", updateScrollState, { passive: true });
//     const ro = new ResizeObserver(updateScrollState);
//     ro.observe(el);
//     window.addEventListener("resize", updateScrollState);
//     return () => {
//       el.removeEventListener("scroll", updateScrollState);
//       ro.disconnect();
//       window.removeEventListener("resize", updateScrollState);
//     };
//   }, [updateScrollState, products.length, status]);

//   const scrollByAmount = useCallback(
//     (direction) => {
//       const el = scrollerRef.current;
//       if (!el) return;
//       const amount = Math.max(el.clientWidth * 0.8, 240);
//       el.scrollBy({
//         left: direction * amount,
//         behavior: reduceMotion ? "auto" : "smooth",
//       });
//     },
//     [reduceMotion]
//   );

//   /* ── Mouse drag-to-scroll (touch uses native scrolling) ── */
//   const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

//   const onPointerDown = useCallback((e) => {
//     const el = scrollerRef.current;
//     if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
//     if (el.scrollWidth <= el.clientWidth) return;
//     drag.current = {
//       active: true,
//       startX: e.clientX,
//       startLeft: el.scrollLeft,
//       moved: false,
//     };
//   }, []);

//   const onPointerMove = useCallback((e) => {
//     const d = drag.current;
//     const el = scrollerRef.current;
//     if (!d.active || !el) return;
//     const dx = e.clientX - d.startX;
//     if (!d.moved && Math.abs(dx) > 6) {
//       d.moved = true;
//       el.classList.add("is-dragging");
//     }
//     if (d.moved) el.scrollLeft = d.startLeft - dx;
//   }, []);

//   const endDrag = useCallback(() => {
//     const el = scrollerRef.current;
//     drag.current.active = false;
//     if (el) el.classList.remove("is-dragging");
//   }, []);

//   /* A drag must never be treated as a click on a card link */
//   const onClickCapture = useCallback((e) => {
//     if (drag.current.moved) {
//       e.preventDefault();
//       e.stopPropagation();
//       drag.current.moved = false;
//     }
//   }, []);

//   const onKeyDown = useCallback(
//     (e) => {
//       if (e.key === "ArrowRight") scrollByAmount(1);
//       else if (e.key === "ArrowLeft") scrollByAmount(-1);
//     },
//     [scrollByAmount]
//   );

//   /* ── Wishlist (synced across components and tabs) ──── */
//   const toggleWishlist = useCallback((id) => {
//     const cur = wishlistRef.current;
//     const adding = !cur.includes(id);
//     const next = adding ? [...cur, id] : cur.filter((x) => x !== id);
//     setWishlist(next);
//     writeLS(LS_WISHLIST, next);
//     try {
//       window.dispatchEvent(
//         new CustomEvent("feathered:wishlist:update", { detail: { list: next } })
//       );
//     } catch {}
//     toast.success(adding ? "Added to wishlist" : "Removed from wishlist", {
//       duration: 1800,
//     });
//   }, []);

//   useEffect(() => {
//     const onExternal = (e) => {
//       const list = e?.detail?.list;
//       if (Array.isArray(list)) {
//         setWishlist((prev) => (sameList(prev, list) ? prev : list));
//       }
//     };
//     const onStorage = (e) => {
//       if (e.key !== LS_WISHLIST) return;
//       const list = readLS(LS_WISHLIST, []);
//       if (Array.isArray(list)) {
//         setWishlist((prev) => (sameList(prev, list) ? prev : list));
//       }
//     };
//     window.addEventListener("feathered:wishlist:update", onExternal);
//     window.addEventListener("storage", onStorage);
//     return () => {
//       window.removeEventListener("feathered:wishlist:update", onExternal);
//       window.removeEventListener("storage", onStorage);
//     };
//   }, []);

//   if (status === "empty") return null;

//   const showRail = status === "ready" && (canScrollLeft || canScrollRight);

//   /* ═════════════════════════════════════════════════════
//      Render
//      ═════════════════════════════════════════════════════ */
//   return (
//     <section
//       className="na-hd-root relative w-full bg-white py-6 dark:bg-neutral-950 sm:py-10 lg:py-14 3xl:py-20"
//       aria-labelledby="new-arrivals-heading"
//     >
//       <style>{HD_CSS}</style>

//       <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 3xl:max-w-[100rem] 4xl:max-w-[120rem]">
//         {/* ── Header ──────────────────────────────────── */}
//         <header className="mb-4 flex items-end justify-between gap-3 sm:mb-6 md:mb-8 lg:mb-10">
//           <motion.div
//             initial={reduceMotion ? false : { opacity: 0, y: 12 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//             className="min-w-0 flex-1"
//           >
//             <span className="na-hd-sans inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 sm:text-[11px]">
//               <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={2.25} aria-hidden="true" />
//               Just dropped
//             </span>

//             <h2
//               id="new-arrivals-heading"
//               className="cat-hd-serif
//                 font-medium mt-1.5 text-[clamp(1.5rem,1.1rem+1.8vw,2.75rem)] leading-[1.1] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100 sm:mt-2.5"
//             >
//               {title}
//             </h2>

//             {subtitle && (
//               <p className="na-hd-sans mt-1 max-w-xl text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:mt-1.5 sm:text-[13px] lg:text-sm">
//                 {subtitle}
//               </p>
//             )}
//           </motion.div>

//           <div className="flex shrink-0 items-center gap-2 sm:gap-3">
//             {showScrollButtons && status === "ready" && (
//               <div className="hidden items-center gap-1.5 md:flex">
//                 <ScrollButton
//                   direction="left"
//                   disabled={!canScrollLeft}
//                   onClick={() => scrollByAmount(-1)}
//                 />
//                 <ScrollButton
//                   direction="right"
//                   disabled={!canScrollRight}
//                   onClick={() => scrollByAmount(1)}
//                 />
//               </div>
//             )}

//             {ctaLink && (
//               <Link
//                 to={ctaLink}
//                 className="na-hd-sans group inline-flex items-center gap-1 rounded-sm text-[12px] font-semibold text-neutral-700 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 dark:text-neutral-300 dark:hover:text-white dark:focus-visible:outline-white sm:gap-1.5 sm:text-[13px]"
//               >
//                 {ctaLabel}
//                 <ArrowRight
//                   className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5"
//                   strokeWidth={2.25}
//                   aria-hidden="true"
//                 />
//               </Link>
//             )}
//           </div>
//         </header>

//         {/* ── Offline banner ─────────────────────────── */}
//         <AnimatePresence initial={false}>
//           {offlineMode && (
//             <OfflineBanner
//               key="offline"
//               onRetry={() => setRetryKey((k) => k + 1)}
//               loading={status === "loading"}
//             />
//           )}
//         </AnimatePresence>

//         {/* ── Loading ─────────────────────────────────── */}
//         {status === "loading" && !offlineMode && (
//           <ul
//             role="list"
//             className="na-list is-static"
//             aria-busy="true"
//             aria-label="Loading new arrivals"
//           >
//             {Array.from({ length: 8 }).map((_, i) => (
//               <NewArrivalSkeleton key={i} />
//             ))}
//           </ul>
//         )}

//         {/* ── Error ───────────────────────────────────── */}
//         {status === "error" && (
//           <div
//             role="alert"
//             className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-900/60 dark:bg-amber-950/30 sm:rounded-2xl sm:p-10"
//           >
//             <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 sm:mb-3 sm:h-12 sm:w-12">
//               <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden="true" />
//             </div>
//             <p className="na-hd-serif text-base font-medium text-neutral-900 dark:text-neutral-100 sm:text-lg">
//               Couldn't load new arrivals
//             </p>
//             <p className="na-hd-sans mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-amber-900/80 dark:text-amber-200/70 sm:mt-2 sm:text-[12.5px]">
//               {errorMsg || "Check your connection and try again."}
//             </p>
//             <button
//               type="button"
//               onClick={() => setRetryKey((k) => k + 1)}
//               className="na-hd-sans mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-amber-900 px-4 py-2 text-[12px] font-semibold text-amber-50 transition-opacity hover:opacity-90 dark:bg-amber-200 dark:text-amber-950 sm:mt-4"
//             >
//               <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden="true" />
//               Try again
//             </button>
//           </div>
//         )}

//         {/* ── Products ────────────────────────────────── */}
//         {status === "ready" && (
//           <>
//             <div className="relative">
//               {/* Edge fades — tablet+ only, only when there is more to scroll */}
//               <div
//                 aria-hidden="true"
//                 className={`pointer-events-none absolute -left-1 bottom-4 top-0 z-10 hidden w-10 bg-gradient-to-r from-white to-transparent transition-opacity duration-300 dark:from-neutral-950 md:block lg:w-14 ${
//                   canScrollLeft ? "opacity-100" : "opacity-0"
//                 }`}
//               />
//               <div
//                 aria-hidden="true"
//                 className={`pointer-events-none absolute -right-1 bottom-4 top-0 z-10 hidden w-10 bg-gradient-to-l from-white to-transparent transition-opacity duration-300 dark:from-neutral-950 md:block lg:w-14 ${
//                   canScrollRight ? "opacity-100" : "opacity-0"
//                 }`}
//               />

//               <motion.ul
//                 ref={scrollerRef}
//                 role="list"
//                 aria-label={title}
//                 variants={containerVariants}
//                 initial={reduceMotion ? false : "hidden"}
//                 whileInView="visible"
//                 viewport={{ once: true, amount: 0.05 }}
//                 className="na-list"
//                 onPointerDown={onPointerDown}
//                 onPointerMove={onPointerMove}
//                 onPointerUp={endDrag}
//                 onPointerLeave={endDrag}
//                 onPointerCancel={endDrag}
//                 onClickCapture={onClickCapture}
//                 onDragStart={(e) => e.preventDefault()}
//                 onKeyDown={onKeyDown}
//               >
//                 {products.map((p, i) => (
//                   <NewArrivalCard
//                     key={p._id}
//                     product={p}
//                     index={i}
//                     wishlisted={wishlist.includes(p._id)}
//                     onToggleWishlist={toggleWishlist}
//                   />
//                 ))}
//               </motion.ul>
//             </div>

//             {/* Scroll progress — tablet+ */}
//             {showRail && (
//               <div
//                 aria-hidden="true"
//                 className="relative mt-1 hidden h-0.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 md:block"
//               >
//                 <div
//                   className="absolute inset-y-0 rounded-full bg-neutral-900 transition-[left] duration-100 dark:bg-neutral-100"
//                   style={{ width: `${thumb.w}%`, left: `${thumb.x}%` }}
//                 />
//               </div>
//             )}

//             {/* "View all" — phones only (header link covers larger screens) */}
//             {ctaLink && (
//               <div className="mt-5 flex justify-center md:hidden">
//                 <Link
//                   to={ctaLink}
//                   className="na-hd-sans group inline-flex min-h-11 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-[13px] font-semibold text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-100 dark:hover:text-white"
//                 >
//                   {ctaLabel}
//                   <ArrowRight
//                     className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
//                     strokeWidth={2.25}
//                     aria-hidden="true"
//                   />
//                 </Link>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </section>
//   );
// };

// export default memo(NewArrivals);
