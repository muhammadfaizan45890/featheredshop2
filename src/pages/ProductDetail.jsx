/* eslint-disable no-unused-vars */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import {
  ArrowLeft,
  ShoppingBag,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle,
  CheckCircle2,
  Share2,
  Sparkles,
  Info,
  Ruler,
  X,
  ZoomIn,
  RefreshCw,
  Copy,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Award,
  Percent,
  Bell,
  Flag,
  Tag,
  Pause,
  Play,
} from "lucide-react";
import { FaFacebookF, FaWhatsapp, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import API from "@/utils/api";

/* ════════════════════════════════════════════════════════════
   HD CSS — Fraunces (display) + Public Sans (text)
   ════════════════════════════════════════════════════════════ */
const HD_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");

  .pd-hd-root {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-optical-sizing: auto;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  .pd-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 0, "WONK" 0;
    letter-spacing: -0.02em;
  }
  .pd-num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "kern" 1;
  }
  .pd-hd-root img { image-rendering: auto; }
  .pd-hd-root :focus-visible { outline: 2px solid #171717; outline-offset: 2px; }
  .dark .pd-hd-root :focus-visible { outline-color: #fafafa; }

  .pd-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .pd-scroll::-webkit-scrollbar-track { background: transparent; }
  .pd-scroll::-webkit-scrollbar-thumb { background: rgba(115,115,115,.35); border-radius: 999px; }
  .pd-rail::-webkit-scrollbar { display: none; }
  .pd-rail { scrollbar-width: none; -ms-overflow-style: none; }

  .pd-skeleton {
    background: linear-gradient(90deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.05) 100%);
    background-size: 200% 100%;
    animation: pd-shimmer 1.4s ease-in-out infinite;
  }
  .dark .pd-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.05) 100%);
    background-size: 200% 100%;
  }
  @keyframes pd-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pd-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
  .pd-shake { animation: pd-shake .35s ease-in-out; }
  @media (prefers-reduced-motion: reduce) {
    .pd-skeleton, .pd-shake { animation: none; }
  }

  .pd-prose { color: #404040; font-size: 1rem; line-height: 1.8; overflow-wrap: anywhere; }
  .dark .pd-prose { color: #d4d4d4; }
  .pd-prose > *:first-child { margin-top: 0; }
  .pd-prose p { margin: 0 0 1.15em; }
  .pd-prose h2, .pd-prose h3, .pd-prose h4 {
    font-family: 'Fraunces', Georgia, serif; font-weight: 500; letter-spacing: -0.02em;
    color: #171717; line-height: 1.2; margin: 1.8em 0 .6em; scroll-margin-top: 6rem;
  }
  .dark .pd-prose h2, .dark .pd-prose h3, .dark .pd-prose h4 { color: #fafafa; }
  .pd-prose h2 { font-size: 1.5rem; } .pd-prose h3 { font-size: 1.2rem; }
  .pd-prose ul, .pd-prose ol { margin: 0 0 1.15em; padding-left: 1.4em; }
  .pd-prose ul { list-style: disc; } .pd-prose ol { list-style: decimal; }
  .pd-prose li { margin: .35em 0; }
  .pd-prose a { color: #b45309; text-decoration: underline; text-underline-offset: 3px; }
  .pd-prose strong { color: #171717; font-weight: 700; } .dark .pd-prose strong { color: #fafafa; }
  .pd-prose img { max-width: 100%; height: auto; border-radius: 12px; margin: 1.2em 0; }
  .pd-prose blockquote { border-left: 3px solid #d4d4d4; padding-left: 1em; margin: 1.4em 0; font-style: italic; color: #525252; }
  .pd-prose table { width: 100%; border-collapse: collapse; margin: 1.4em 0; font-size: .9rem; display: block; overflow-x: auto; }
  .pd-prose th, .pd-prose td { border-bottom: 1px solid #e5e5e5; padding: .6em .8em; text-align: left; }
  .dark .pd-prose th, .dark .pd-prose td { border-color: #262626; }
  .pd-prose hr { border: 0; border-top: 1px solid #e5e5e5; margin: 2em 0; } .dark .pd-prose hr { border-color: #262626; }
`;

/* ════════════════════════════════════════════════════════════
   Keys
   ════════════════════════════════════════════════════════════ */
const LS_CART = "fs_cart";
const LS_CART_LEGACY = "feathered:cart";
const LS_RECENT = "feathered:recentlyViewed";

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */
const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {};
};

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (/^https?:\/\//.test(avatarPath)) return avatarPath;
  const base =
    (typeof API === "string" && API) ||
    API?.defaults?.baseURL ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "";
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}${avatarPath.startsWith("/") ? "" : "/"}${avatarPath}`;
};

const getApiInstance = () => {
  const instance =
    API && typeof API.get === "function"
      ? API
      : axios.create({
          baseURL:
            (typeof API === "string" && API) ||
            (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
            "http://localhost:8000",
          headers: { "Content-Type": "application/json" },
        });
  if (!instance.__navbarAuthAttached) {
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
    instance.__navbarAuthAttached = true;
  }
  return instance;
};
const api = getApiInstance();

/* ─── Auth helper ──────────────────────────────────── */
const isLoggedIn = () => {
  try {
    return !!localStorage.getItem("accessToken");
  } catch {
    return false;
  }
};

const formatPKR = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? `Rs ${num.toLocaleString("en-PK")}` : "Rs 0";
};

const FALLBACK_IMG =
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22600%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%22300%22%20y%3D%22300%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

const resolveImg = (img) =>
  typeof img === "string" && img.trim().length > 0 ? img : FALLBACK_IMG;

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
const canOptimize = (url = "") => CLOUDINARY_RE.test(url) || url.includes("images.unsplash.com");
const buildSrcSet = (url, widths = [480, 720, 960, 1280, 1600]) =>
  canOptimize(url) ? widths.map((w) => `${optimize(url, w)} ${w}w`).join(", ") : undefined;

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const prepareDescription = (raw) => {
  if (!raw) return { html: "", toc: [] };
  let input = String(raw);
  if (!/<\/?[a-z][\s\S]*>/i.test(input)) {
    input = input
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }
  if (typeof DOMParser === "undefined") {
    return { html: input.replace(/<script[\s\S]*?<\/script>/gi, ""), toc: [] };
  }
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  root
    .querySelectorAll("script,style,iframe,object,embed,link,meta,form,base,svg,math")
    .forEach((n) => n.remove());
  root.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((a) => {
      const n = a.name.toLowerCase();
      const v = a.value.trim().toLowerCase();
      if (n.startsWith("on") || n === "srcdoc" || n === "style") el.removeAttribute(a.name);
      else if (
        (n === "href" || n === "src") &&
        /^(javascript|vbscript|data):/.test(v) &&
        !(n === "src" && /^data:image\//.test(v))
      )
        el.removeAttribute(a.name);
    });
    if (el.tagName === "A") {
      el.setAttribute("rel", "noopener noreferrer nofollow");
      if (/^https?:/i.test(el.getAttribute("href") || "")) el.setAttribute("target", "_blank");
    }
    if (el.tagName === "IMG") {
      el.setAttribute("loading", "lazy");
      el.setAttribute("decoding", "async");
    }
  });
  const toc = [];
  root.querySelectorAll("h2,h3").forEach((h, i) => {
    const text = h.textContent.trim();
    if (!text) return;
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
    const id = h.id || `${slug}-${i + 1}`;
    h.id = id;
    toc.push({ id, text, level: h.tagName.toLowerCase() });
  });
  return { html: root.innerHTML, toc };
};

const updateCommentRecursively = (comments, id, updater) =>
  comments.map((c) => {
    if (c._id === id) return updater(c);
    if (c.replies?.length)
      return { ...c, replies: updateCommentRecursively(c.replies, id, updater) };
    return c;
  });
const addReplyRecursively = (comments, parentId, reply) =>
  comments.map((c) => {
    if (c._id === parentId) return { ...c, replies: [...(c.replies || []), reply] };
    if (c.replies?.length)
      return { ...c, replies: addReplyRecursively(c.replies, parentId, reply) };
    return c;
  });
const deleteCommentRecursively = (comments, id) =>
  comments
    .filter((c) => c._id !== id)
    .map((c) => ({
      ...c,
      replies: c.replies ? deleteCommentRecursively(c.replies, id) : [],
    }));
const normalizeLikes = (comment) => ({
  ...comment,
  likes: Array.isArray(comment.likes) ? comment.likes.length : comment.likes || 0,
  replies: comment.replies ? comment.replies.map(normalizeLikes) : [],
});

const conditionStyles = {
  Good: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  "Very Good": "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  Excellent: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  Premium: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  "Premium Plus": "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  "Premium+": "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
};

const getEstimatedDelivery = (days) => {
  const date = new Date();
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const d = date.getDay();
    if (d !== 0 && d !== 6) added++;
  }
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const trackEvent = (name, params = {}) => {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
  } catch {}
};
const haptic = (ms = 10) => {
  try {
    navigator.vibrate?.(ms);
  } catch {}
};

/* ════════════════════════════════════════════════════════════
   Cart — dual-write: localStorage (guest) + backend (auth)
   ════════════════════════════════════════════════════════════ */

/* Always write to localStorage — works for guests, keeps Navbar in sync */
const addToCartStorage = (product, size, qty) => {
  const raw = safeRead(LS_CART, []);
  const cart = Array.isArray(raw) ? raw : [];
  const id = `${product._id}__${size || "one"}`;
  const max = Math.min(Number(product.stockQuantity) || 99, 99);
  const price =
    Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.regularPrice)
      ? Number(product.salePrice)
      : Number(product.regularPrice) || 0;
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.qty = Math.min(max, (Number(existing.qty) || 0) + qty);
  else
    cart.push({
      id,
      productId: product._id,
      slug: product.slug,
      sku: product.sku,
      name: product.title,
      brand: product.brand,
      image: product.images?.[0],
      price,
      size: size || null,
      variant: size ? `Size ${size}` : undefined,
      qty: Math.min(qty, max),
      addedAt: Date.now(),
    });
  safeWrite(LS_CART, cart);
  try {
    window.dispatchEvent(new Event("feathered:cart:update"));
  } catch {}
};

/* If logged in, also sync to server (fire-and-forget) */
const addToCartServer = async (product, size, qty) => {
  if (!isLoggedIn()) return;
  try {
    await api.post("/api/cart/items", {
      productId: product._id,
      size: size || null,
      qty,
    });
  } catch (err) {
    /* Silent — local cart still holds the item. Next login will merge. */
    console.warn("Server cart sync failed:", err?.response?.data?.message || err?.message);
  }
};

/* Merge local cart into server cart after login */
const mergeLocalCartIntoServer = async () => {
  if (!isLoggedIn()) return;
  try {
    const local = safeRead(LS_CART, []);
    if (!Array.isArray(local) || local.length === 0) return;
    const items = local
      .map((i) => ({
        productId: i.productId,
        size: i.size,
        qty: i.qty,
      }))
      .filter((i) => i.productId);
    if (items.length === 0) return;
    await api.post("/api/cart/merge", { items });
    /* Server is now source of truth for logged-in users */
    safeWrite(LS_CART, []);
    window.dispatchEvent(new Event("feathered:cart:update"));
  } catch (err) {
    console.warn("Cart merge failed:", err?.response?.data?.message || err?.message);
  }
};

/* One-time migration from the old cart key */
const migrateLegacyCart = () => {
  try {
    const legacy = safeRead(LS_CART_LEGACY, null);
    if (!Array.isArray(legacy) || legacy.length === 0) return;
    const current = safeRead(LS_CART, []);
    const next = Array.isArray(current) ? [...current] : [];
    legacy.forEach((i) => {
      const id = i.key || `${i.productId}__${i.size || "one"}`;
      if (next.some((n) => n.id === id)) return;
      next.push({
        id,
        productId: i.productId,
        slug: i.slug,
        sku: i.sku,
        name: i.title,
        brand: i.brand,
        image: i.image,
        price: Number(i.price) || 0,
        size: i.size || null,
        variant: i.size ? `Size ${i.size}` : undefined,
        qty: Math.max(1, Number(i.qty) || 1),
      });
    });
    safeWrite(LS_CART, next);
    localStorage.removeItem(LS_CART_LEGACY);
    window.dispatchEvent(new Event("feathered:cart:update"));
  } catch {}
};

/* Focus trap + scroll lock + Esc + focus restore */
function useDialog(isOpen, ref, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      ref.current
        ? Array.from(ref.current.querySelectorAll(selector)).filter((el) => el.offsetParent !== null)
        : [];
    const t = setTimeout(() => focusables()[0]?.focus?.(), 60);
    const onKey = (e) => {
      if (e.key === "Escape") {
        closeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const body = document.body;
    const orig = { overflow: body.style.overflow, pr: body.style.paddingRight };
    const sb = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (sb > 0) body.style.paddingRight = `${sb}px`;
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      body.style.overflow = orig.overflow;
      body.style.paddingRight = orig.pr;
      previous?.focus?.();
    };
  }, [isOpen, ref]);
}

/* ════════════════════════════════════════════════════════════
   Small UI (unchanged)
   ════════════════════════════════════════════════════════════ */
const Breadcrumbs = memo(function Breadcrumbs({ items = [] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="pd-rail flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs"
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-neutral-300 dark:text-neutral-600" strokeWidth={2.5} aria-hidden="true" />}
          {item.to ? (
            <Link to={item.to} className="shrink-0 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="max-w-[220px] truncate font-medium text-neutral-900 dark:text-neutral-100 sm:max-w-none">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
});

const StarRating = memo(function StarRating({ rating = 0, count = 0, size = 16, showCount = true }) {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex items-center gap-0.5" role="img" aria-label={`${Number(rating).toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            style={{ width: size, height: size }}
            className={rating >= s - 0.5 ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700"}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ))}
      </div>
      {showCount && count > 0 && (
        <span className="pd-num text-xs font-medium text-neutral-500 dark:text-neutral-400 sm:text-[13px]">
          {Number(rating).toFixed(1)} · {count} {count === 1 ? "review" : "reviews"}
        </span>
      )}
    </div>
  );
});

const StarPicker = memo(function StarPicker({ value = 5, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="inline-flex items-center" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          disabled={disabled}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
          className="p-1.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Star
            size={22}
            className={s <= display ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
});

const ProductSkeleton = memo(function ProductSkeleton() {
  return (
    <div className="pd-hd-root min-h-dvh bg-white dark:bg-neutral-950" aria-busy="true" aria-label="Loading product">
      <style>{HD_CSS}</style>
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-10 3xl:max-w-[100rem]">
        <div className="mb-6 h-4 w-48 rounded pd-skeleton" />
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <div className="flex gap-2 sm:flex-col">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-14 w-14 rounded-xl pd-skeleton sm:h-[68px] sm:w-[68px]" />
              ))}
            </div>
            <div className="aspect-square flex-1 rounded-3xl pd-skeleton" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 rounded pd-skeleton" />
            <div className="h-9 w-3/4 rounded pd-skeleton" />
            <div className="h-5 w-1/3 rounded pd-skeleton" />
            <div className="h-10 w-1/2 rounded pd-skeleton" />
            <div className="h-20 w-full rounded pd-skeleton" />
            <div className="h-12 w-full rounded-full pd-skeleton" />
            <div className="h-12 w-full rounded-full pd-skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
});

const Lightbox = memo(function Lightbox({ images, index, onIndex, onClose, name }) {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map());
  const g = useRef({ dist: 0, scale: 1, pos: { x: 0, y: 0 }, pt: { x: 0, y: 0 } });
  const count = images.length;
  useDialog(true, ref, onClose);

  const clamp = (s) => Math.min(5, Math.max(1, s));
  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);
  const step = useCallback(
    (dir) => {
      onIndex((index + dir + count) % count);
    },
    [index, count, onIndex]
  );

  useEffect(reset, [index, reset]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setScale((s) => clamp(s - e.deltaY * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (count < 2) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, step]);

  const dist = () => {
    const [a, b] = Array.from(pointers.current.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e) => {
    stageRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      g.current.pt = { x: e.clientX, y: e.clientY };
      g.current.pos = pos;
      setDragging(true);
    } else if (pointers.current.size === 2) {
      g.current.dist = dist();
      g.current.scale = scale;
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      setScale(clamp((g.current.scale * dist()) / (g.current.dist || 1)));
    } else if (scale > 1) {
      setPos({
        x: g.current.pos.x + (e.clientX - g.current.pt.x),
        y: g.current.pos.y + (e.clientY - g.current.pt.y),
      });
    }
  };
  const endPointer = (e) => {
    const had = pointers.current.has(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (!had) return;
    if (pointers.current.size === 0) {
      setDragging(false);
      const dx = e.clientX - g.current.pt.x;
      const dy = e.clientY - g.current.pt.y;
      if (scale === 1 && count > 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        step(dx < 0 ? 1 : -1);
      }
    } else if (pointers.current.size === 1) {
      const [p] = Array.from(pointers.current.values());
      g.current.pt = p;
      g.current.pos = pos;
    }
  };
  const onDoubleClick = () => {
    if (scale > 1) reset();
    else setScale(2.5);
  };

  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setScale((s) => clamp(s - 0.5))} className={btn} aria-label="Zoom out">
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <span className="pd-num min-w-[44px] text-center text-xs font-semibold text-white/80">{scale.toFixed(1)}×</span>
          <button type="button" onClick={() => setScale((s) => clamp(s + 0.5))} className={btn} aria-label="Zoom in">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {scale > 1 && (
            <button type="button" onClick={reset} className="rounded-full bg-white/10 px-3.5 py-2.5 text-[11px] font-semibold text-white hover:bg-white/20">
              Reset
            </button>
          )}
        </div>
        <button type="button" onClick={onClose} className={btn} aria-label="Close viewer">
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {count > 1 && scale === 1 && (
        <>
          <button type="button" onClick={() => step(-1)} className={`${btn} absolute left-2 z-20 sm:left-4`} aria-label="Previous image">
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button type="button" onClick={() => step(1)} className={`${btn} absolute right-2 z-20 sm:right-4`} aria-label="Next image">
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </>
      )}

      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={onDoubleClick}
        className="flex h-full w-full items-center justify-center p-4"
        style={{ touchAction: "none", cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        <img
          key={index}
          src={optimize(images[index], 1600)}
          alt={name}
          draggable={false}
          className="max-h-full max-w-full select-none rounded-lg shadow-2xl"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform .15s ease-out",
          }}
        />
      </div>

      <p className="pd-num absolute bottom-[max(1rem,env(safe-area-inset-bottom))] rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur sm:text-xs">
        {index + 1} / {count} · Double-tap or scroll to zoom · Drag to pan
      </p>
    </motion.div>
  );
});

const ImageGallery = memo(function ImageGallery({ images = [], name = "" }) {
  const reduceMotion = useReducedMotion();
  const list = useMemo(() => images.filter(Boolean), [images]);
  const count = list.length;
  const multi = count > 1;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(!reduceMotion);
  const [hovering, setHovering] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const barRef = useRef(null);
  const stageRef = useRef(null);
  const railRef = useRef(null);
  const touch = useRef({ x: 0, y: 0 });

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const manual = useCallback(
    (i) => {
      setPlaying(false);
      go(i);
    },
    [go]
  );

  useEffect(() => {
    const bar = barRef.current;
    if (bar) bar.style.width = "0%";
    if (!multi || !playing || hovering || zoomOpen) return;
    const duration = 4000;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(((now - start) / duration) * 100, 100);
      if (bar) bar.style.width = `${p}%`;
      if (p >= 100) setIndex((i) => (i + 1) % count);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, multi, playing, hovering, zoomOpen, count]);

  useEffect(() => {
    const el = railRef.current?.children?.[index];
    el?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }, [index, reduceMotion]);

  useEffect(() => {
    if (!multi) return;
    [(index + 1) % count, (index - 1 + count) % count].forEach((i) => {
      const img = new Image();
      img.src = optimize(list[i], 960);
    });
  }, [index, multi, count, list]);

  const onPointerMove = (e) => {
    if (e.pointerType !== "mouse" || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    stageRef.current.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
    stageRef.current.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (multi && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) manual(index + (dx < 0 ? 1 : -1));
  };

  const onKeyDown = (e) => {
    if (!multi || e.target !== e.currentTarget) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      manual(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      manual(index + 1);
    }
  };

  const active = list[index];
  const overlayBtn =
    "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-neutral-900/90 dark:text-neutral-100 dark:hover:bg-neutral-800";

  return (
    <>
      <div
        className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4"
        role="group"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        tabIndex={multi ? 0 : -1}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
      >
        {multi && (
          <div
            ref={railRef}
            className="pd-rail flex shrink-0 gap-2 overflow-x-auto pb-1 sm:max-h-[640px] sm:flex-col sm:gap-2.5 sm:overflow-y-auto sm:pb-0"
            role="tablist"
            aria-label="Choose product image"
          >
            {list.map((img, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={index === i}
                aria-label={`Show image ${i + 1} of ${count}`}
                onClick={() => manual(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 sm:h-[68px] sm:w-[68px] lg:h-[76px] lg:w-[76px] lg:rounded-2xl ${
                  index === i
                    ? "border-neutral-900 ring-2 ring-neutral-900/10 dark:border-neutral-100 dark:ring-neutral-100/10"
                    : "border-neutral-200 opacity-80 hover:border-neutral-400 hover:opacity-100 dark:border-neutral-800 dark:hover:border-neutral-600"
                }`}
              >
                <img
                  src={optimize(img, 160)}
                  srcSet={buildSrcSet(img, [80, 160, 240])}
                  sizes="76px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                />
              </button>
            ))}
          </div>
        )}

        <div
          ref={stageRef}
          className="group relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 lg:rounded-3xl"
          onPointerMove={onPointerMove}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => active && setZoomOpen(true)}
        >
          {active ? (
            <>
              <AnimatePresence initial={false}>
                <motion.img
                  key={index}
                  src={optimize(active, 960)}
                  srcSet={buildSrcSet(active)}
                  sizes="(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw"
                  alt={`${name}${multi ? ` — image ${index + 1} of ${count}` : ""}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3 }}
                  fetchPriority={index === 0 ? "high" : undefined}
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out lg:group-hover:scale-[1.9]"
                  style={{ transformOrigin: "var(--zx, 50%) var(--zy, 50%)" }}
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                />
              </AnimatePresence>

              {multi && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={(e) => {
                      e.stopPropagation();
                      manual(index - 1);
                    }}
                    className={`${overlayBtn} absolute left-3 top-1/2 hidden -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 md:flex`}
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={(e) => {
                      e.stopPropagation();
                      manual(index + 1);
                    }}
                    className={`${overlayBtn} absolute right-3 top-1/2 hidden -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 md:flex`}
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                  </button>

                  <span className="pd-num pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur sm:bottom-4 sm:left-4 sm:text-xs">
                    {index + 1} / {count}
                  </span>

                  <button
                    type="button"
                    aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaying((v) => !v);
                    }}
                    className={`${overlayBtn} absolute right-3 top-3 sm:right-4 sm:top-4`}
                  >
                    {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                  </button>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/30" aria-hidden="true">
                    <div ref={barRef} className="h-full bg-white" style={{ width: 0 }} />
                  </div>
                </>
              )}

              <button
                type="button"
                aria-label="Open full-screen viewer"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomOpen(true);
                }}
                className={`${overlayBtn} absolute bottom-3 right-3 sm:bottom-4 sm:right-4`}
              >
                <ZoomIn className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-20 w-20 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {zoomOpen && count > 0 && (
          <Lightbox images={list} index={index} onIndex={manual} onClose={() => setZoomOpen(false)} name={name} />
        )}
      </AnimatePresence>
    </>
  );
});

const SizeSelector = memo(function SizeSelector({ sizes = [], selected, onSelect, onOpenSizeGuide, error, shake }) {
  return (
    <div className={`space-y-3 ${shake ? "pd-shake" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span id="size-label" className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 sm:text-xs">
            Select size
          </span>
          {selected && <span className="pd-num text-xs font-medium text-neutral-400">· {selected}</span>}
        </div>
        {onOpenSizeGuide && (
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 underline-offset-4 transition-colors hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100 sm:text-xs"
          >
            <Ruler className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
            Size guide
          </button>
        )}
      </div>

      <div role="radiogroup" aria-labelledby="size-label" className={`grid grid-cols-4 gap-2 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-7 ${error ? "rounded-xl ring-2 ring-red-400/60 ring-offset-4 ring-offset-white dark:ring-offset-neutral-950" : ""}`}>
        {sizes.map((s) => {
          const on = selected === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                onSelect(s);
                haptic(8);
              }}
              className={`pd-num min-h-[46px] rounded-xl border px-2 py-2 text-xs font-bold transition-all duration-150 ${
                on
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-md dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-100"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          Please choose a size to continue.
        </p>
      )}
    </div>
  );
});

const QuantitySelector = memo(function QuantitySelector({ value, onChange, max = 10, disabled = false }) {
  const btn =
    "flex h-12 w-11 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800";
  return (
    <div className={`inline-flex shrink-0 items-center overflow-hidden rounded-full border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 ${disabled ? "opacity-50" : ""}`}>
      <button type="button" onClick={() => { onChange(Math.max(1, value - 1)); haptic(6); }} disabled={disabled || value <= 1} className={btn} aria-label="Decrease quantity">
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      <span className="pd-num min-w-[40px] select-none text-center text-sm font-bold text-neutral-900 dark:text-neutral-100" aria-live="polite" aria-label={`Quantity ${value}`}>
        {value}
      </span>
      <button type="button" onClick={() => { onChange(Math.min(max, value + 1)); haptic(6); }} disabled={disabled || value >= max} className={btn} aria-label="Increase quantity">
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
});

const Tabs = memo(function Tabs({ tabs, activeId, onChange }) {
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === activeId);
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[n].id);
    document.getElementById(`pd-tab-${tabs[n].id}`)?.focus();
  };
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <div role="tablist" aria-label="Product information" onKeyDown={onKeyDown} className="pd-rail -mb-px flex overflow-x-auto">
        {tabs.map((tab) => {
          const active = activeId === tab.id;
          return (
            <button
              key={tab.id}
              id={`pd-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`pd-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-3.5 text-xs font-semibold transition-colors sm:px-6 sm:py-4 sm:text-[13px] ${
                active ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              {tab.label}
              {active && (
                <motion.span
                  layoutId="pd-active-tab"
                  className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-neutral-900 dark:bg-neutral-100"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const RatingSummary = memo(function RatingSummary({ reviews = [], rating = 0, count = 0 }) {
  const distribution = useMemo(() => {
    const total = reviews.filter((r) => r.rating > 0).length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const c = reviews.filter((r) => r.rating === star).length;
      return { star, count: c, pct: Math.round((c / total) * 100) };
    });
  }, [reviews]);

  return (
    <div className="grid gap-6 border-b border-neutral-100 pb-6 dark:border-neutral-800 md:grid-cols-3 md:gap-8 md:pb-8">
      <div>
        <p className="pd-serif pd-num text-5xl font-medium text-neutral-900 dark:text-neutral-100">{rating.toFixed(1)}</p>
        <div className="mt-2"><StarRating rating={rating} size={18} showCount={false} /></div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 sm:text-[13px]">
          Based on {count} {count === 1 ? "review" : "reviews"}
        </p>
      </div>
      <div className="space-y-2 md:col-span-2">
        {distribution.map((d) => (
          <div key={d.star} className="flex items-center gap-3">
            <span className="pd-num w-7 shrink-0 text-xs font-semibold text-neutral-600 dark:text-neutral-400">{d.star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${d.pct}%` }} />
            </div>
            <span className="pd-num w-8 shrink-0 text-right text-xs text-neutral-500 dark:text-neutral-400">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const TrustBadges = memo(function TrustBadges({ deliveryRange }) {
  const badges = [
    { icon: Truck, label: "Free shipping", sub: "Over Rs 8,000" },
    { icon: RotateCcw, label: "30-day returns", sub: "No questions" },
    { icon: Shield, label: "Authenticity", sub: "Guaranteed" },
    { icon: Award, label: "Quality checked", sub: "Every item" },
  ];
  return (
    <div className="space-y-4 border-t border-neutral-100 pt-5 dark:border-neutral-800 sm:pt-6">
      {deliveryRange && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 sm:text-[13px]">
            Order today — arrives <span className="font-bold">{deliveryRange[0]}</span> – <span className="font-bold">{deliveryRange[1]}</span>
          </p>
        </div>
      )}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {badges.map(({ icon: Icon, label, sub }) => (
          <li key={label} className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center sm:p-3">
            <span className="rounded-full bg-neutral-100 p-2.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 sm:p-3">
              <Icon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold leading-tight text-neutral-700 dark:text-neutral-300">{label}</span>
            <span className="text-[10px] leading-tight text-neutral-400">{sub}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

const CommentItem = ({ comment, onReply, onLike, onDelete, onReport, currentUser, isRoot = false }) => {
  const navigate = useNavigate();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const authorObj = typeof comment.author === "object" ? comment.author : null;
  const authorDisplay = authorObj?.fullname || authorObj?.username || "Anonymous";
  const avatarUrl = authorObj?.avatar ? getAvatarUrl(authorObj.avatar) : null;
  const isOwn = !!currentUser?._id && currentUser._id === authorObj?._id;
  const initials = authorDisplay.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const needLogin = (msg) =>
    toast.error(msg, { action: { label: "Log in", onClick: () => navigate("/login") }, duration: 4000 });

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment._id, replyText);
      setReplyText("");
      setShowReplyForm(false);
    } catch {
      /* toast shown by handler */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-b border-neutral-100 py-5 first:pt-0 last:border-0 dark:border-neutral-800 sm:py-6">
      <div className="flex items-start gap-3 sm:gap-4">
        {avatarUrl && !avatarBroken ? (
          <img src={avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-12 sm:w-12" onError={() => setAvatarBroken(true)} />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 text-xs font-bold text-neutral-600 dark:from-neutral-700 dark:to-neutral-800 dark:text-neutral-300 sm:h-12 sm:w-12">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 sm:text-sm">{authorDisplay}</p>
                {comment.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} /> Verified
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                {comment.rating > 0 && <StarRating rating={comment.rating} size={12} showCount={false} />}
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 sm:text-xs">
                  <Calendar className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                  {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
            {isOwn ? (
              <button onClick={() => onDelete(comment._id)} className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-red-500" aria-label="Delete review">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            ) : currentUser ? (
              <button onClick={() => onReport?.(comment._id)} className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-amber-500" aria-label="Report review" title="Report">
                <Flag className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            ) : null}
          </div>

          <p className="mt-2 break-words text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-sm">{comment.content}</p>

          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (!currentUser) return needLogin("Log in to mark reviews as helpful");
                haptic(8);
                onLike(comment._id);
              }}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors sm:text-xs ${comment.liked ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"}`}
              aria-pressed={!!comment.liked}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${comment.liked ? "fill-current" : ""}`} strokeWidth={2.5} aria-hidden="true" />
              Helpful {comment.likes > 0 ? `(${comment.likes})` : ""}
            </button>
            {isRoot && (
              <button
                type="button"
                onClick={() => (currentUser ? setShowReplyForm((v) => !v) : needLogin("Log in to reply"))}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 sm:text-xs"
              >
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> Reply
              </button>
            )}
          </div>

          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                aria-label="Write a reply"
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-100 sm:text-[13px]"
                disabled={submitting}
                autoFocus
              />
              <button type="submit" disabled={submitting || !replyText.trim()} className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900">
                {submitting ? "…" : "Send"}
              </button>
            </form>
          )}

          {comment.replies?.length > 0 && (
            <div className="ml-3 mt-3 space-y-1 border-l-2 border-neutral-100 pl-3 dark:border-neutral-800 sm:ml-6 sm:pl-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply._id} comment={reply} onReply={onReply} onLike={onLike} onDelete={onDelete} onReport={onReport} currentUser={currentUser} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Modal = ({ onClose, label, children, className = "sm:max-w-lg" }) => {
  const ref = useRef(null);
  useDialog(true, ref, onClose);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`relative flex max-h-[90dvh] w-full flex-col rounded-t-3xl border border-neutral-200/80 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </motion.div>
    </div>
  );
};

const SIZE_CHARTS = {
  footwear: {
    title: "Footwear sizes",
    head: ["EU", "UK", "US", "Foot length (cm)"],
    rows: [
      ["39", "6", "7", "24.5"], ["40", "6.5", "7.5", "25.0"], ["41", "7", "8", "25.7"], ["42", "8", "9", "26.3"],
      ["43", "8.5", "9.5", "27.0"], ["44", "9.5", "10.5", "27.7"], ["45", "10", "11", "28.3"], ["46", "11", "12", "29.0"],
    ],
    tip: "Measure your foot from heel to the longest toe, standing up. Choose the nearest size above your measurement.",
  },
  bottoms: {
    title: "Waist sizes",
    head: ["Waist (in)", "Waist (cm)", "Hip (cm)"],
    rows: [["28", "71", "89"], ["30", "76", "94"], ["32", "81", "99"], ["34", "86", "104"], ["36", "91", "109"], ["38", "96", "114"]],
    tip: "Measure around your natural waistline. If you're between sizes, size up for a relaxed fit.",
  },
  apparel: {
    title: "Apparel sizes",
    head: ["Size", "Chest (in)", "Waist (in)", "Length (in)"],
    rows: [["XS", "34", "28", "26"], ["S", "36", "30", "27"], ["M", "38–40", "32", "28"], ["L", "42", "34", "29"], ["XL", "44–46", "36", "30"], ["XXL", "48", "40", "31"]],
    tip: "Measure around the fullest part of your chest. These are body measurements — fits vary slightly by brand.",
  },
};

const pickChart = (product) => {
  const sizes = product?.sizes || [];
  const numeric = sizes.length > 0 && sizes.every((s) => /^\d+(\.\d+)?$/.test(String(s)));
  if (!numeric) return SIZE_CHARTS.apparel;
  const hint = /shoe|sneaker|boot|footwear|sandal|loafer|slipper|heel/i.test(`${product.title} ${product.category}`);
  return hint || sizes.every((s) => Number(s) >= 35) ? SIZE_CHARTS.footwear : SIZE_CHARTS.bottoms;
};

const SizeGuideModal = memo(function SizeGuideModal({ onClose, product }) {
  const chart = pickChart(product);
  return (
    <Modal onClose={onClose} label="Size guide">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800 sm:p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
          <Ruler className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> {chart.title}
        </h3>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Close size guide">
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      <div className="pd-scroll overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                {chart.head.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row) => (
                <tr key={row[0]} className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/40">
                  {row.map((cell, i) => (
                    <td key={i} className={`pd-num py-2.5 text-[13px] ${i === 0 ? "font-semibold text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 flex gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-3.5 text-xs leading-relaxed text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          {chart.tip}
        </p>
      </div>
    </Modal>
  );
});

const NotifyMeModal = memo(function NotifyMeModal({ onClose, product, size }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    toast.success("We'll let you know when it's back in stock");
    setTimeout(onClose, 1200);
  };
  return (
    <Modal onClose={onClose} label="Back in stock alert" className="sm:max-w-md">
      <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-start gap-3">
          <span className="shrink-0 rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"><Bell className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">Notify me when back in stock</h3>
            <p className="mt-1 text-xs text-neutral-500">{product?.title}{size && <span className="font-semibold"> · Size {size}</span>}</p>
          </div>
        </div>
        {submitted ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} /> <span className="text-xs font-semibold">You're on the list!</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label htmlFor="notify-email" className="sr-only">Email address</label>
            <input id="notify-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email" className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-base focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-100 sm:text-[13px]" />
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-neutral-200 py-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800">Cancel</button>
              <button type="submit" className="flex-1 rounded-xl bg-neutral-900 py-3 text-xs font-bold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900">Notify me</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
});

const ProductCard = memo(function ProductCard({ p }) {
  const reg = Number(p.regularPrice) || 0;
  const sale = Number(p.salePrice) || 0;
  const hasSale = sale > 0 && sale < reg;
  const discount = hasSale ? Math.round(((reg - sale) / reg) * 100) : 0;
  const image = Array.isArray(p.images) && p.images[0] ? p.images[0] : FALLBACK_IMG;
  return (
    <Link
      to={`/shop/${p.slug || p._id}`}
      className="group block overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-all duration-300 hover:border-neutral-300 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={optimize(image, 480)}
          srcSet={buildSrcSet(image, [240, 360, 480, 640])}
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
          alt={p.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
        />
        {discount > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">−{discount}%</span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-neutral-400 sm:text-[11px]">{p.brand}</p>
        <h3 className="mt-0.5 line-clamp-1 text-[13px] font-bold text-neutral-900 transition-colors group-hover:text-amber-600 dark:text-neutral-100 dark:group-hover:text-amber-400">{p.title}</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="pd-num text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatPKR(hasSale ? sale : reg)}</span>
          {hasSale && <span className="pd-num text-[11px] text-neutral-400 line-through">{formatPKR(reg)}</span>}
        </div>
      </div>
    </Link>
  );
});

const RelatedProducts = memo(function RelatedProducts({ products = [] }) {
  if (!products.length) return null;
  return (
    <section className="mt-14 sm:mt-16 lg:mt-20" aria-labelledby="related-heading">
      <h2 id="related-heading" className="pd-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-3xl">You may also like</h2>
      <p className="mb-6 mt-1 text-xs text-neutral-400 sm:mb-8 sm:text-[13px]">Curated recommendations based on this product</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {products.slice(0, 4).map((p) => (
          <li key={p._id}><ProductCard p={p} /></li>
        ))}
      </ul>
    </section>
  );
});

const RecentlyViewed = memo(function RecentlyViewed({ products = [] }) {
  if (!products.length) return null;
  return (
    <section className="mt-12 sm:mt-14" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="pd-serif mb-5 text-xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-2xl">Recently viewed</h2>
      <ul className="pd-rail -mx-4 grid snap-x snap-mandatory auto-cols-[46%] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:auto-cols-[30%] sm:px-0 md:auto-cols-[23%] lg:auto-cols-[18%]">
        {products.map((p) => (
          <li key={p._id} className="snap-start"><ProductCard p={p} /></li>
        ))}
      </ul>
    </section>
  );
});

const StickyMobileBuy = memo(function StickyMobileBuy({ visible, effectivePrice, hasSale, safeRegular, selectedSize, needsSize, onAction, isOutOfStock, addingToCart }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95 lg:hidden"
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="pd-num text-base font-bold text-neutral-900 dark:text-neutral-100">{formatPKR(effectivePrice)}</span>
                {hasSale && <span className="pd-num text-[11px] text-neutral-400 line-through">{formatPKR(safeRegular)}</span>}
              </div>
              <p className="mt-0.5 truncate text-[10px] text-neutral-400">{selectedSize ? `Size ${selectedSize}` : needsSize ? "Select a size" : "Ready to ship"}</p>
            </div>
            <button
              type="button"
              onClick={onAction}
              disabled={isOutOfStock || addingToCart}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
            >
              <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
              {isOutOfStock ? "Sold out" : addingToCart ? "Adding…" : needsSize ? "Select size" : "Add to bag"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/* ════════════════════════════════════════════════════════════
   ProductDetail — main
   ════════════════════════════════════════════════════════════ */
const ProductDetail = () => {
  const params = useParams();
  const identifier = params.slug || params.id;
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [skuCopied, setSkuCopied] = useState(false);

  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [shake, setShake] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const buyBoxRef = useRef(null);
  const sizeRef = useRef(null);
  const tabsRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(5);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentSort, setCommentSort] = useState("newest");
  const [commentFilter, setCommentFilter] = useState("all");
  const [visibleReviews, setVisibleReviews] = useState(5);

  /* ─── Cart migration + auth-time cart merge ────────── */
  useEffect(() => {
    migrateLegacyCart();
    /* If user is already logged in, merge any leftover guest cart */
    mergeLocalCartIntoServer();
  }, []);

  /* ─── Fetch product ────────────────────────────────── */
  useEffect(() => {
    if (!identifier) {
      setLoading(false);
      setError("Product not found");
      return;
    }
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/posts/${identifier}`, { signal: controller.signal });
        const data = res?.data?.data;
        if (!data) {
          setError("Product not found");
          return;
        }
        setProduct(data);
        setSelectedSize(null);
        setSizeError(false);
        setQuantity(1);
        setActiveTab("description");
        window.scrollTo({ top: 0, behavior: "auto" });

        trackEvent("view_item", {
          item_id: data._id,
          item_name: data.title,
          item_brand: data.brand,
          item_category: data.category,
          price: Number(data.salePrice) || Number(data.regularPrice) || 0,
        });

        const prev = safeRead(LS_RECENT, []);
        const others = (Array.isArray(prev) ? prev : []).filter((r) => r._id !== data._id);
        setRecent(others.slice(0, 8));
        safeWrite(
          LS_RECENT,
          [
            {
              _id: data._id,
              slug: data.slug,
              title: data.title,
              brand: data.brand,
              images: data.images?.slice(0, 1),
              regularPrice: data.regularPrice,
              salePrice: data.salePrice,
            },
            ...others,
          ].slice(0, 9)
        );

        if (data.category) {
          api
            .get("/api/posts", { params: { category: data.category, limit: 8, page: 1 }, signal: controller.signal })
            .then((r) => setRelated((r?.data?.data || []).filter((p) => p._id !== data._id).slice(0, 4)))
            .catch((e) => {
              if (!axios.isCancel?.(e)) console.warn("Related fetch failed:", e);
            });
        } else setRelated([]);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") return;
        const status = err?.response?.status;
        setError(status === 404 ? "Product not found" : err?.response?.data?.message || "Failed to load product");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [identifier, retryKey]);

  /* ─── Reviews ──────────────────────────────────────── */
  const fetchComments = useCallback(async () => {
    if (!identifier) return;
    try {
      setCommentsLoading(true);
      const res = await api.get(`/api/posts/${identifier}/comments`);
      setComments((res?.data?.data || []).map(normalizeLikes));
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  }, [identifier]);
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setCurrentUser(raw ? JSON.parse(raw) : null);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const el = buyBoxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product]);

  const ratingStats = useMemo(() => {
    const rated = comments.filter((c) => c.rating > 0);
    if (rated.length) return { avg: rated.reduce((a, c) => a + c.rating, 0) / rated.length, count: rated.length };
    return { avg: Number(product?.rating) || 0, count: Number(product?.numReviews) || 0 };
  }, [comments, product]);

  useEffect(() => {
    if (!product) return;
    const prevTitle = document.title;
    document.title = `${product.title}${product.brand ? ` · ${product.brand}` : ""} | FeatheredSHOP`;
    const reg = Number(product.regularPrice) || 0;
    const sale = Number(product.salePrice) || 0;
    const price = sale > 0 && sale < reg ? sale : reg;
    const ld = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      sku: product.sku,
      brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
      category: product.category,
      description: product.shortDescription || undefined,
      image: (product.images || []).filter((i) => /^https?:\/\//.test(i)),
      offers: {
        "@type": "Offer",
        priceCurrency: "PKR",
        price,
        url: window.location.href,
        availability:
          product.inStock === false || product.stockQuantity === 0
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
      },
      aggregateRating:
        ratingStats.count > 0
          ? { "@type": "AggregateRating", ratingValue: Number(ratingStats.avg.toFixed(1)), reviewCount: ratingStats.count }
          : undefined,
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => {
      document.title = prevTitle;
      s.remove();
    };
  }, [product, ratingStats]);

  const sortedComments = useMemo(() => {
    let list = [...comments];
    if (commentFilter === "withText") list = list.filter((c) => c.content?.trim());
    else if (commentFilter === "withRating") list = list.filter((c) => c.rating > 0);
    if (commentSort === "liked") list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    else if (commentSort === "oldest") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (commentSort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [comments, commentSort, commentFilter]);

  const images = useMemo(() => {
    const raw = product?.images;
    if (!Array.isArray(raw) || raw.length === 0) return [FALLBACK_IMG];
    return raw.map(resolveImg);
  }, [product?.images]);

  const longDesc = product?.longDescription || product?.description || "";
  const { html: descriptionHtml, toc } = useMemo(() => prepareDescription(longDesc), [longDesc]);
  const deliveryRange = useMemo(() => [getEstimatedDelivery(3), getEstimatedDelivery(6)], []);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/posts/${identifier}/comments`, { content: commentText.trim(), rating: commentRating });
      setComments((prev) => [normalizeLikes(res.data.data), ...prev]);
      setCommentText("");
      setCommentRating(5);
      toast.success("Review posted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Review failed to send");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = async (commentId, content) => {
    try {
      const res = await api.post(`/api/comments/${commentId}/replies`, { content });
      setComments((prev) => addReplyRecursively(prev, commentId, normalizeLikes(res.data.data)));
      toast.success("Reply posted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reply failed to send");
      throw err;
    }
  };

  const handleLike = async (commentId) => {
    const flip = (c) => ({ ...c, likes: (c.likes || 0) + (c.liked ? -1 : 1), liked: !c.liked });
    setComments((prev) => updateCommentRecursively(prev, commentId, flip));
    try {
      const res = await api.post(`/api/comments/${commentId}/like`);
      const { liked, likes } = res.data.data;
      setComments((prev) => updateCommentRecursively(prev, commentId, (c) => ({ ...c, likes, liked })));
    } catch {
      setComments((prev) => updateCommentRecursively(prev, commentId, flip));
      toast.error("Couldn't update. Please try again.");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments((prev) => deleteCommentRecursively(prev, commentId));
      toast.success("Review deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleReport = async (commentId) => {
    if (!window.confirm("Report this review?")) return;
    try {
      await api.post(`/api/comments/${commentId}/report`);
      toast.success("Reported. Thanks for helping us.");
    } catch {
      toast.error("Couldn't send the report. Please try again.");
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = product?.title || "Check out this product";
  const openShare = (url) => window.open(url, "_blank", "noopener,noreferrer");

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) await navigator.share({ title: product?.title, url: window.location.href });
      else await copyLink();
    } catch {}
  }, [product, copyLink]);

  const copySku = useCallback(async () => {
    if (!product?.sku) return;
    try {
      await navigator.clipboard.writeText(product.sku);
      setSkuCopied(true);
      haptic(8);
      toast.success("SKU copied");
      setTimeout(() => setSkuCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy SKU");
    }
  }, [product?.sku]);

  /* ─── Cart ─────────────────────────────────────────── */
  const needsSize = (product?.sizes?.length || 0) > 0 && !selectedSize;

  const requireSize = useCallback(() => {
    setSizeError(true);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    sizeRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    toast.error("Please select a size first");
  }, [reduceMotion]);

  const handleAddToCart = async () => {
    if (needsSize) return requireSize();
    if (product?.inStock === false || product?.stockQuantity === 0) return toast.error("This product is out of stock");

    setAddingToCart(true);
    haptic(15);

    try {
      /* 1️⃣ Always write to localStorage — works for guests, keeps Navbar in sync */
      addToCartStorage(product, selectedSize, quantity);

      /* 2️⃣ If logged in, also push to server (fire-and-forget safe) */
      await addToCartServer(product, selectedSize, quantity);

      trackEvent("add_to_cart", {
        item_id: product._id,
        item_name: product.title,
        quantity,
        price: Number(product.salePrice) || Number(product.regularPrice) || 0,
      });

      toast.success(`Added to bag · ${selectedSize || "One size"} · ×${quantity}`, {
        action: {
          label: "View bag",
          onClick: () => navigate("/cart"),
        },
        duration: 4000,
      });
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add to bag");
    } finally {
      setTimeout(() => setAddingToCart(false), 300);
    }
  };

  const handleBuyNow = () => {
    if (needsSize) return requireSize();
    navigate("/checkout", { state: { productId: product._id, size: selectedSize, qty: quantity } });
  };

  const goToReviews = () => {
    setActiveTab("reviews");
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 50);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: reduceMotion ? "auto" : "smooth" });
  };

  if (loading) return <ProductSkeleton />;

  if (error || !product) {
    return (
      <div className="pd-hd-root flex min-h-[70dvh] items-center justify-center bg-white px-4 dark:bg-neutral-950">
        <style>{HD_CSS}</style>
        <div className="w-full max-w-md text-center" role="alert">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
            <AlertCircle className="h-7 w-7 text-red-500" strokeWidth={1.5} />
          </div>
          <h1 className="pd-serif mb-2 text-2xl font-medium text-neutral-900 dark:text-neutral-100">{error || "Product not found"}</h1>
          <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">The product you're looking for doesn't exist or couldn't be loaded.</p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-[13px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} /> Go back
            </button>
            {error && error !== "Product not found" && (
              <button type="button" onClick={() => setRetryKey((k) => k + 1)} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-[13px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} /> Try again
              </button>
            )}
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { title, sku, brand, category, condition, sizes = [], regularPrice, salePrice, isPublished, isFeatured, inStock, stockQuantity } = product;
  const safeRegular = Number(regularPrice) || 0;
  const safeSale = Number(salePrice) || 0;
  const hasSale = safeSale > 0 && safeSale < safeRegular;
  const discount = hasSale ? Math.round(((safeRegular - safeSale) / safeRegular) * 100) : 0;
  const effectivePrice = hasSale ? safeSale : safeRegular;
  const isOutOfStock = inStock === false || stockQuantity === 0;
  const maxQty = Math.max(1, Math.min(Number(stockQuantity) || 99, 99));
  const lowStock = !isOutOfStock && Number(stockQuantity) > 0 && Number(stockQuantity) <= 5;
  const conditionClass = conditionStyles[condition] || conditionStyles.Good;

  const tabs = [
    { id: "description", label: "Description" },
    { id: "details", label: "Details" },
    { id: "reviews", label: `Reviews (${comments.length})` },
    { id: "shipping", label: "Shipping & returns" },
  ];

  const shownReviews = sortedComments.slice(0, visibleReviews);
  const fade = { initial: reduceMotion ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };
  const shareBtn = "flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:text-white dark:border-neutral-800 dark:text-neutral-400";

  return (
    <div className="pd-hd-root min-h-dvh bg-white pb-24 dark:bg-neutral-950 lg:pb-0">
      <style>{HD_CSS}</style>

      <div className="border-b border-neutral-100 bg-neutral-50/60 dark:border-neutral-900 dark:bg-neutral-950/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 md:px-8 lg:px-10 3xl:max-w-[100rem]">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "Shop", to: "/shop" },
              ...(brand ? [{ label: brand, to: `/shop?brand=${encodeURIComponent(brand)}` }] : []),
              { label: title },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 md:px-8 lg:px-10 lg:py-10 3xl:max-w-[100rem]">
        <div className="mb-5 flex items-center justify-between gap-3 sm:mb-8">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 sm:text-[13px]">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> Back
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 sm:text-[13px]">
            <Share2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" /> Share
          </button>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--navbar-h,3.5rem)+1.5rem)] lg:self-start">
            <ImageGallery key={product._id} images={images} name={title} />
          </div>

          <div ref={buyBoxRef} className="min-w-0 space-y-5 sm:space-y-6">
            <div>
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                {brand && (
                  <Link to={`/shop?brand=${encodeURIComponent(brand)}`} className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
                    {brand}
                  </Link>
                )}
                {condition && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-[11px] ${conditionClass}`}>{condition}</span>}
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 sm:text-[11px]">
                    <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" /> Featured
                  </span>
                )}
                {isPublished === false && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 sm:text-[11px]">Draft</span>}
              </div>

              <h1 className="pd-serif text-[1.75rem] font-medium leading-[1.12] text-neutral-900 dark:text-neutral-100 sm:text-4xl lg:text-[2.5rem]">{title}</h1>

              {sku && (
                <button type="button" onClick={copySku} className="group mt-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700" aria-label={`Copy SKU ${sku}`}>
                  <Tag className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">SKU</span>
                  <span className="pd-num text-neutral-900 dark:text-neutral-100">{sku}</span>
                  {skuCopied ? <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} /> : <Copy className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" strokeWidth={2.5} />}
                </button>
              )}
            </div>

            {(ratingStats.avg > 0 || ratingStats.count > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <button type="button" onClick={goToReviews} className="rounded-md transition-opacity hover:opacity-80" aria-label="Read reviews">
                  <StarRating rating={ratingStats.avg} count={ratingStats.count} size={16} />
                </button>
                {category && (
                  <Link to={`/shop?category=${encodeURIComponent(category)}`} className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 sm:text-xs">
                    Category: <span className="font-medium text-neutral-600 dark:text-neutral-400">{category}</span>
                  </Link>
                )}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="pd-num text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">{formatPKR(effectivePrice)}</span>
                {hasSale && (
                  <>
                    <span className="pd-num text-base text-neutral-400 line-through sm:text-lg">{formatPKR(safeRegular)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white sm:text-xs">
                      <Percent className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" /> Save {discount}%
                    </span>
                  </>
                )}
              </div>
              {hasSale && <p className="pd-num mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">You save {formatPKR(safeRegular - safeSale)}</p>}
            </div>

            {product.shortDescription && (
              <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">{product.shortDescription}</p>
            )}

            <p className="flex items-center gap-2 text-xs font-semibold sm:text-[13px]" role="status">
              {!isOutOfStock ? (
                <>
                  <span className={`h-2 w-2 rounded-full ${lowStock ? "bg-amber-500" : "animate-pulse bg-emerald-500"}`} aria-hidden="true" />
                  <span className={lowStock ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                    {lowStock ? `Only ${stockQuantity} left` : `In stock${stockQuantity > 0 ? ` · ${stockQuantity} available` : ""}`}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                  <span className="text-red-600 dark:text-red-400">Out of stock</span>
                </>
              )}
            </p>

            {sizes.length > 0 && (
              <div ref={sizeRef}>
                <SizeSelector
                  sizes={sizes}
                  selected={selectedSize}
                  error={sizeError && !selectedSize}
                  shake={shake}
                  onSelect={(s) => {
                    setSelectedSize(s);
                    setSizeError(false);
                    setQuantity(1);
                  }}
                  onOpenSizeGuide={() => setSizeGuideOpen(true)}
                />
              </div>
            )}

            <div className="space-y-3 pt-1 sm:space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 sm:text-xs">Quantity</span>
                <span className="text-[10px] text-neutral-400 sm:text-[11px]">Max {maxQty} per order</span>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                <QuantitySelector value={quantity} onChange={setQuantity} max={maxQty} disabled={isOutOfStock} />
                {!isOutOfStock ? (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-4 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                  >
                    <ShoppingBag className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    {addingToCart ? "Adding…" : "Add to bag"}
                  </button>
                ) : (
                  <button type="button" onClick={() => setNotifyOpen(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-amber-600">
                    <Bell className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> Notify me
                  </button>
                )}
              </div>
              {!isOutOfStock && (
                <button type="button" onClick={handleBuyNow} className="w-full rounded-full border border-neutral-200 py-4 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800">
                  Buy it now
                </button>
              )}
            </div>

            <TrustBadges deliveryRange={deliveryRange} />
          </div>
        </div>

        <div ref={tabsRef} className="mt-12 scroll-mt-24 sm:mt-14 lg:mt-16">
          <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

          <div className="py-6 sm:py-8" role="tabpanel" id={`pd-panel-${activeTab}`} aria-labelledby={`pd-tab-${activeTab}`}>
            {activeTab === "description" && (
              <motion.div key="description" {...fade} className="grid gap-10 xl:grid-cols-[minmax(0,48rem)_16rem] xl:justify-between">
                <div className="min-w-0">
                  {toc.length > 1 && (
                    <details className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900 xl:hidden">
                      <summary className="cursor-pointer text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">In this description</summary>
                      <ul className="mt-3 space-y-2">
                        {toc.map((item) => (
                          <li key={item.id} className={item.level === "h3" ? "ml-4" : ""}>
                            <button onClick={() => scrollToSection(item.id)} className="text-left text-[13px] text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">{item.text}</button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {longDesc ? (
                    <div className="pd-prose" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                  ) : (
                    <p className="text-sm italic text-neutral-400">{product.shortDescription || "No description provided for this product."}</p>
                  )}
                </div>
                {toc.length > 1 && (
                  <aside className="hidden xl:block">
                    <nav aria-label="Description sections" className="sticky top-28 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
                      <p className="mb-3 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">In this description</p>
                      <ul className="space-y-2 border-l border-neutral-200 dark:border-neutral-800">
                        {toc.map((item) => (
                          <li key={item.id} className={item.level === "h3" ? "pl-6" : "pl-3"}>
                            <button onClick={() => scrollToSection(item.id)} className="text-left text-xs text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">{item.text}</button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </aside>
                )}
              </motion.div>
            )}

            {activeTab === "details" && (
              <motion.div key="details" {...fade} className="max-w-3xl">
                <dl className="grid gap-x-8 sm:grid-cols-2">
                  {[
                    ["SKU", sku],
                    ["Brand", brand],
                    ["Category", category],
                    ["Condition", condition],
                    ["Available sizes", sizes.length ? sizes.join(", ") : "—"],
                    ["Stock", isOutOfStock ? "Out of stock" : `${stockQuantity || "In stock"}${stockQuantity ? " available" : ""}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-0.5 border-b border-neutral-100 py-3 dark:border-neutral-800">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 sm:text-[11px]">{label}</dt>
                      <dd className="flex items-center gap-2 break-words text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {value || "—"}
                        {label === "SKU" && value && (
                          <button type="button" onClick={copySku} className="text-neutral-400 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100" aria-label="Copy SKU">
                            {skuCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />}
                          </button>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div key="reviews" {...fade} className="max-w-3xl">
                <RatingSummary reviews={comments} rating={ratingStats.avg} count={ratingStats.count} />

                <div className="pt-6">
                  {currentUser ? (
                    <form onSubmit={handleAddComment} className="mb-6 space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Your rating</span>
                        <StarPicker value={commentRating} onChange={setCommentRating} disabled={submittingComment} />
                      </div>
                      <label htmlFor="review-text" className="sr-only">Your review</label>
                      <textarea
                        id="review-text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Share your thoughts on this product…"
                        rows={3}
                        maxLength={1000}
                        className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-100 sm:text-[13px]"
                        required
                        disabled={submittingComment}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span className="pd-num text-[11px] text-neutral-400">{commentText.length}/1000</span>
                        <button type="submit" disabled={submittingComment || !commentText.trim()} className="rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900">
                          {submittingComment ? "Posting…" : "Post review"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mb-6 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-[13px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                      <Link to="/login" className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100">Log in</Link> to leave a review.
                    </p>
                  )}

                  {!commentsLoading && comments.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        Sort
                        <select value={commentSort} onChange={(e) => setCommentSort(e.target.value)} className="cursor-pointer rounded-lg border border-neutral-200 bg-transparent px-2 py-1.5 text-xs text-neutral-700 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                          <option value="liked">Most helpful</option>
                          <option value="rating">Highest rated</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        Filter
                        <select value={commentFilter} onChange={(e) => setCommentFilter(e.target.value)} className="cursor-pointer rounded-lg border border-neutral-200 bg-transparent px-2 py-1.5 text-xs text-neutral-700 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                          <option value="all">All</option>
                          <option value="withText">With text</option>
                          <option value="withRating">With rating</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {commentsLoading ? (
                    <div className="space-y-4" aria-busy="true">
                      {[1, 2].map((n) => (
                        <div key={n} className="flex gap-3">
                          <div className="h-10 w-10 rounded-full pd-skeleton" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-32 rounded pd-skeleton" />
                            <div className="h-3 w-full rounded pd-skeleton" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="py-12 text-center sm:py-16">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"><Star className="h-7 w-7 text-neutral-400" strokeWidth={1.5} /></div>
                      <p className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">No reviews yet</p>
                      <p className="mt-1 text-[13px] text-neutral-400">Be the first to review this product</p>
                    </div>
                  ) : sortedComments.length === 0 ? (
                    <p className="py-8 text-center text-[13px] text-neutral-400">No reviews match this filter.</p>
                  ) : (
                    <>
                      <div>
                        {shownReviews.map((comment) => (
                          <CommentItem key={comment._id} comment={comment} onReply={handleReply} onLike={handleLike} onDelete={handleDelete} onReport={handleReport} currentUser={currentUser} isRoot />
                        ))}
                      </div>
                      {sortedComments.length > visibleReviews && (
                        <button type="button" onClick={() => setVisibleReviews((v) => v + 5)} className="mt-4 w-full rounded-full border border-neutral-200 py-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800">
                          Show more reviews ({sortedComments.length - visibleReviews} more)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "shipping" && (
              <motion.div key="shipping" {...fade} className="max-w-3xl space-y-6">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-neutral-900 dark:text-neutral-100"><Truck className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> Shipping</h3>
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Free standard shipping on orders over Rs 8,000. Orders under Rs 8,000 ship for a flat rate. Express shipping is available at checkout. Most orders ship within 1–2 business days.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Estimated delivery: {deliveryRange[0]} – {deliveryRange[1]}</p>
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-neutral-900 dark:text-neutral-100"><RotateCcw className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> Returns</h3>
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    We offer a 30-day return policy. Items must be unused, in original packaging, and in the same condition you received them.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <RelatedProducts products={related} />
        <RecentlyViewed products={recent} />

        <div className="mt-12 flex flex-wrap items-center gap-2.5 border-t border-neutral-100 pt-8 dark:border-neutral-800">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 sm:text-xs">Share</span>
          <button onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)} aria-label="Share on Facebook" className={`${shareBtn} hover:border-[#1877F2] hover:bg-[#1877F2]`}><FaFacebookF size={14} /></button>
          <button onClick={() => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`)} aria-label="Share on X" className={`${shareBtn} hover:border-neutral-900 hover:bg-neutral-900`}><FaXTwitter size={14} /></button>
          <button onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`)} aria-label="Share on WhatsApp" className={`${shareBtn} hover:border-[#25D366] hover:bg-[#25D366]`}><FaWhatsapp size={16} /></button>
          <button onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`)} aria-label="Share on LinkedIn" className={`${shareBtn} hover:border-[#0A66C2] hover:bg-[#0A66C2]`}><FaLinkedinIn size={14} /></button>
          <button onClick={copyLink} aria-label="Copy link" className={`${shareBtn} hover:border-neutral-900 hover:bg-neutral-900`}><Copy className="h-3.5 w-3.5" strokeWidth={2.5} /></button>
        </div>
      </div>

      <StickyMobileBuy
        visible={stickyVisible}
        effectivePrice={effectivePrice}
        hasSale={hasSale}
        safeRegular={safeRegular}
        selectedSize={selectedSize}
        needsSize={needsSize}
        onAction={handleAddToCart}
        isOutOfStock={isOutOfStock}
        actionDisabled={addingToCart}
        addingToCart={addingToCart}
      />

      <AnimatePresence>
        {sizeGuideOpen && <SizeGuideModal key="size" onClose={() => setSizeGuideOpen(false)} product={product} />}
        {notifyOpen && <NotifyMeModal key="notify" onClose={() => setNotifyOpen(false)} product={product} size={selectedSize} />}
      </AnimatePresence>
    </div>
  );
};

export default memo(ProductDetail);