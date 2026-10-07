/* eslint-disable no-unused-vars */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  Check,
  X,
  Truck,
  RotateCcw,
  Shield,
  Award,
  Tag,
  Heart,
  Bookmark,
  Info,
  AlertCircle,
  Package,
  Sparkles,
  Lock,
  Percent,
  ChevronDown,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import API from "@/utils/api";

/* ════════════════════════════════════════════════════════════
   HD CSS — same language as ProductDetail / Shop
   ════════════════════════════════════════════════════════════ */
const HD_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");

  .cart-hd-root {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  .cart-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 0, "WONK" 0;
    letter-spacing: -0.02em;
  }
  .cart-num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "kern" 1;
  }
  .cart-hd-root :focus-visible { outline: 2px solid #171717; outline-offset: 2px; }
  .dark .cart-hd-root :focus-visible { outline-color: #fafafa; }

  .cart-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .cart-scroll::-webkit-scrollbar-track { background: transparent; }
  .cart-scroll::-webkit-scrollbar-thumb { background: rgba(115,115,115,.35); border-radius: 999px; }

  .cart-skeleton {
    background: linear-gradient(90deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.05) 100%);
    background-size: 200% 100%;
    animation: cart-shimmer 1.4s ease-in-out infinite;
  }
  .dark .cart-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.05) 100%);
    background-size: 200% 100%;
  }
  @keyframes cart-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .cart-skeleton { animation: none; } }
`;

/* ════════════════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════════════════ */
const LS_CART = "fs_cart";
const LS_SAVED = "fs_cart_saved"; // save-for-later bucket
const LS_COUPON = "fs_cart_coupon";
const LS_VIEW = "fs_cart_view";

const FREE_SHIP_THRESHOLD = 8000;
const SHIPPING_FLAT = 350;
const GST_RATE = 0.05;
const COUPON_MIN_SUBTOTAL = 3000;

/* Demo coupons — swap for a real API call when ready */
const COUPONS = {
  FEATHER10: { type: "percent", value: 10, label: "10% off" },
  SAVE500: { type: "flat", value: 500, label: "Rs 500 off" },
  FREESHIP: { type: "freeship", value: 0, label: "Free shipping" },
};

const formatPKR = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? `Rs ${num.toLocaleString("en-PK")}` : "Rs 0";
};

const FALLBACK_IMG =
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22600%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%22300%22%20y%3D%22300%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

/* ─── Safe LS helpers ─────────────────────────────── */
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

/* ─── Auth ────────────────────────────────────────── */
const isLoggedIn = () => {
  try {
    return !!localStorage.getItem("accessToken");
  } catch {
    return false;
  }
};

/* ─── API instance ────────────────────────────────── */
const getApiInstance = () => {
  const instance =
    API && typeof API.get === "function"
      ? API
      : axios.create({
          baseURL:
            (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
            "http://localhost:8000",
          headers: { "Content-Type": "application/json" },
        });
  if (!instance.__cartAuthAttached) {
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
    instance.__cartAuthAttached = true;
  }
  return instance;
};
const api = getApiInstance();

/* ─── Image optimizer (Cloudinary + Unsplash) ─────── */
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

/* ════════════════════════════════════════════════════════════
   Cart state engine
   - Reads from localStorage (guest) OR /api/cart (logged in)
   - Writes to both when logged in
   ════════════════════════════════════════════════════════════ */
const useCartState = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const loggedIn = useMemo(() => isLoggedIn(), []);

  /* ─── Normalize server items to local shape ──────── */
  const normalizeServer = useCallback((raw) => {
    if (!Array.isArray(raw)) return [];
    return raw.map((i) => ({
      id: `${i.productId}__${i.size || "one"}`,
      productId: i.productId,
      slug: i.slug,
      sku: i.sku,
      name: i.name,
      brand: i.brand,
      image: i.image,
      price: Number(i.price) || 0,
      size: i.size || null,
      variant: i.variant,
      qty: Number(i.qty) || 1,
      addedAt: i.addedAt ? new Date(i.addedAt).getTime() : Date.now(),
      stockQuantity: i.stockQuantity, // server doesn't always return, may be undefined
    }));
  }, []);

  /* ─── Load cart ──────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (loggedIn) {
          const res = await api.get("/api/cart");
          const serverItems = res?.data?.data?.items || [];
          if (!cancelled) {
            setItems(normalizeServer(serverItems));
          }
        } else {
          const local = readLS(LS_CART, []);
          if (!cancelled) {
            setItems(
              Array.isArray(local)
                ? local.map((i) => ({
                    ...i,
                    qty: Number(i.qty) || 1,
                    price: Number(i.price) || 0,
                  }))
                : []
            );
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Load cart error:", err);
        // Fallback to local on server failure
        const local = readLS(LS_CART, []);
        setItems(Array.isArray(local) ? local : []);
        setError(err?.response?.data?.message || "Couldn't load your bag");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loggedIn, retryKey, normalizeServer]);

  /* ─── Persist local mirror on any change (for guests & Navbar) ─── */
  useEffect(() => {
    if (loading) return;
    writeLS(LS_CART, items);
    try {
      window.dispatchEvent(new Event("feathered:cart:update"));
    } catch {}
  }, [items, loading]);

  /* ─── Update quantity ────────────────────────────── */
  const updateQty = useCallback(
    async (id, qty) => {
      const q = Math.max(1, Math.min(99, Number(qty) || 1));

      /* Optimistic update */
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, qty: q } : i))
      );

      if (loggedIn) {
        try {
          await api.patch(`/api/cart/items/${encodeURIComponent(id)}`, { qty: q });
        } catch (err) {
          toast.error(err?.response?.data?.message || "Couldn't update quantity");
          setRetryKey((k) => k + 1); // refresh to reconcile
        }
      }
    },
    [loggedIn]
  );

  /* ─── Remove item ────────────────────────────────── */
  const removeItem = useCallback(
    async (id) => {
      const removed = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));

      if (loggedIn) {
        try {
          await api.delete(`/api/cart/items/${encodeURIComponent(id)}`);
        } catch (err) {
          toast.error(err?.response?.data?.message || "Couldn't remove item");
          setRetryKey((k) => k + 1);
        }
      }

      return removed;
    },
    [loggedIn, items]
  );

  /* ─── Clear cart ─────────────────────────────────── */
  const clearCart = useCallback(async () => {
    const backup = items;
    setItems([]);
    if (loggedIn) {
      try {
        await api.delete("/api/cart");
      } catch (err) {
        toast.error("Couldn't clear your bag");
        setItems(backup);
      }
    }
  }, [loggedIn, items]);

  /* ─── Add item back (from saved) ─────────────────── */
  const addItem = useCallback(
    async (item) => {
      const existing = items.find((i) => i.id === item.id);
      if (existing) {
        return updateQty(item.id, (existing.qty || 0) + (item.qty || 1));
      }

      setItems((prev) => [...prev, { ...item, addedAt: Date.now() }]);

      if (loggedIn) {
        try {
          await api.post("/api/cart/items", {
            productId: item.productId,
            size: item.size || null,
            qty: item.qty || 1,
          });
        } catch (err) {
          toast.error(err?.response?.data?.message || "Couldn't add item");
          setRetryKey((k) => k + 1);
        }
      }
    },
    [items, updateQty, loggedIn]
  );

  return {
    items,
    loading,
    error,
    loggedIn,
    updateQty,
    removeItem,
    clearCart,
    addItem,
    refresh: () => setRetryKey((k) => k + 1),
  };
};

/* ════════════════════════════════════════════════════════════
   Save-for-later bucket (local only — user-scoped for simplicity)
   ════════════════════════════════════════════════════════════ */
const useSavedForLater = () => {
  const [saved, setSaved] = useState(() => {
    const raw = readLS(LS_SAVED, []);
    return Array.isArray(raw) ? raw : [];
  });

  useEffect(() => {
    writeLS(LS_SAVED, saved);
  }, [saved]);

  const save = useCallback((item) => {
    setSaved((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [{ ...item, savedAt: Date.now() }, ...prev];
    });
  }, []);

  const unsave = useCallback((id) => {
    setSaved((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const removeSaved = useCallback((id) => {
    setSaved((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { saved, save, unsave, removeSaved };
};

/* ════════════════════════════════════════════════════════════
   Small UI
   ════════════════════════════════════════════════════════════ */
const Qty = memo(function Qty({ value, onChange, max = 99, disabled }) {
  const btn =
    "flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className={btn}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      <span
        className="cart-num min-w-[36px] select-none text-center text-sm font-bold text-neutral-900 dark:text-neutral-100"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={btn}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
});

const SkeletonRow = () => (
  <div className="flex gap-4 rounded-2xl border border-neutral-200/70 bg-white p-4 dark:border-neutral-800/70 dark:bg-neutral-900">
    <div className="h-24 w-24 shrink-0 rounded-xl cart-skeleton sm:h-28 sm:w-28" />
    <div className="min-w-0 flex-1 space-y-2.5">
      <div className="h-3 w-20 rounded cart-skeleton" />
      <div className="h-4 w-3/4 rounded cart-skeleton" />
      <div className="h-4 w-1/3 rounded cart-skeleton" />
      <div className="h-9 w-32 rounded-full cart-skeleton" />
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   CartItem row
   ════════════════════════════════════════════════════════════ */
const CartItemRow = memo(function CartItemRow({
  item,
  onQty,
  onRemove,
  onSaveLater,
  index,
}) {
  const lineTotal = (Number(item.price) || 0) * (Number(item.qty) || 1);
  const href = `/shop/${item.slug || item.productId}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.15) }}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-3 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900 dark:hover:border-neutral-700 sm:p-4"
    >
      <div className="flex gap-3 sm:gap-4">
        <Link
          to={href}
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 sm:h-28 sm:w-28"
        >
          <img
            src={optimize(item.image, 300) || FALLBACK_IMG}
            alt={item.name || "Product"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {item.brand && (
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400 sm:text-[11px]">
                  {item.brand}
                </p>
              )}
              <Link
                to={href}
                className="cart-serif mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug text-neutral-900 transition-colors hover:text-amber-700 dark:text-neutral-100 dark:hover:text-amber-400 sm:text-base"
              >
                {item.name}
              </Link>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {item.size && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 sm:text-[11px]">
                    Size {item.size}
                  </span>
                )}
                {item.sku && (
                  <span className="cart-num text-[10px] text-neutral-400 sm:text-[11px]">
                    SKU {item.sku}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.name} from bag`}
              className="shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
            <div className="flex flex-col gap-1">
              <span className="cart-num text-base font-bold text-neutral-900 dark:text-neutral-100 sm:text-lg">
                {formatPKR(item.price)}
              </span>
              <span className="text-[10.5px] text-neutral-400 sm:text-[11.5px]">
                Line total · <span className="cart-num font-semibold">{formatPKR(lineTotal)}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Qty value={item.qty} onChange={(q) => onQty(item.id, q)} />
              <button
                type="button"
                onClick={() => onSaveLater(item)}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-100 sm:text-[12px]"
              >
                <Bookmark className="h-3 w-3" strokeWidth={2.4} />
                Save for later
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  );
});

/* ════════════════════════════════════════════════════════════
   Saved-item row
   ════════════════════════════════════════════════════════════ */
const SavedItemRow = memo(function SavedItemRow({ item, onMoveToCart, onRemove, index }) {
  const href = `/shop/${item.slug || item.productId}`;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.15) }}
      className="flex gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/50 sm:p-4"
    >
      <Link to={href} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 sm:h-24 sm:w-24">
        <img
          src={optimize(item.image, 240) || FALLBACK_IMG}
          alt={item.name || "Saved product"}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
        />
      </Link>
      <div className="min-w-0 flex-1">
        {item.brand && (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            {item.brand}
          </p>
        )}
        <Link to={href} className="cart-serif mt-0.5 line-clamp-1 text-[14px] font-medium text-neutral-900 hover:text-amber-700 dark:text-neutral-100 dark:hover:text-amber-400">
          {item.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="cart-num text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {formatPKR(item.price)}
          </span>
          {item.size && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              Size {item.size}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onMoveToCart(item)}
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900 sm:text-[12px]"
          >
            <ShoppingBag className="h-3 w-3" strokeWidth={2.5} />
            Move to bag
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-neutral-500 transition-colors hover:text-red-500 sm:text-[12px]"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
            Remove
          </button>
        </div>
      </div>
    </motion.li>
  );
});

/* ════════════════════════════════════════════════════════════
   Order Summary (sticky sidebar)
   ════════════════════════════════════════════════════════════ */
const SummaryRow = ({ label, value, muted, bold, accent }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span
      className={`text-[12.5px] ${muted ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-700 dark:text-neutral-300"} ${
        bold ? "font-semibold text-neutral-900 dark:text-neutral-100" : ""
      }`}
    >
      {label}
    </span>
    <span
      className={`cart-num text-[13.5px] ${
        bold ? "font-bold text-neutral-900 dark:text-neutral-100" : ""
      } ${accent ? "font-bold text-emerald-600 dark:text-emerald-400" : ""} ${
        !bold && !accent ? "font-medium text-neutral-800 dark:text-neutral-200" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

const OrderSummary = memo(function OrderSummary({
  subtotal,
  discount,
  coupon,
  shipping,
  gst,
  total,
  freeShipRemaining,
  itemCount,
  onCheckout,
  onApplyCoupon,
  onRemoveCoupon,
  applyingCoupon,
  reduceMotion,
}) {
  const [couponInput, setCouponInput] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    onApplyCoupon(code, () => setCouponInput(""));
  };

  return (
    <aside
      aria-label="Order summary"
      className="lg:sticky lg:top-[calc(var(--navbar-h,3.5rem)+1.5rem)] lg:self-start"
    >
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-6">
        <h2 className="cart-serif text-xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          Order Summary
        </h2>
        <p className="mt-1 text-[11.5px] text-neutral-400 sm:text-xs">
          {itemCount} item{itemCount === 1 ? "" : "s"} in your bag
        </p>

        {/* Free shipping progress */}
        {freeShipRemaining > 0 ? (
          <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-amber-900 dark:text-amber-300 sm:text-[12.5px]">
              <Truck className="h-3.5 w-3.5" strokeWidth={2.4} />
              Add {formatPKR(freeShipRemaining)} more for free shipping
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-900/40">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100)}%`,
                }}
                transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-amber-500"
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-800 dark:text-emerald-300 sm:text-[12.5px]">
              <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
              You've unlocked free shipping
            </p>
          </div>
        )}

        {/* Coupon */}
        <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          {coupon ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                <div className="flex flex-col">
                  <span className="cart-num text-[12px] font-bold text-emerald-800 dark:text-emerald-300">
                    {coupon.code}
                  </span>
                  <span className="text-[10.5px] text-emerald-700/70 dark:text-emerald-400/70">
                    {coupon.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveCoupon}
                aria-label="Remove coupon"
                className="rounded-full p-1 text-emerald-700 transition-colors hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowCoupon((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-[12.5px] font-semibold text-neutral-700 dark:text-neutral-300"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Have a coupon?
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showCoupon ? "rotate-180" : ""}`}
                  strokeWidth={2.5}
                />
              </button>
              <AnimatePresence initial={false}>
                {showCoupon && (
                  <motion.form
                    key="coupon-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        aria-label="Coupon code"
                        className="cart-num min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base uppercase tracking-wider text-neutral-900 placeholder:normal-case placeholder:tracking-normal focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100 sm:text-[13px]"
                        maxLength={20}
                      />
                      <button
                        type="submit"
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
                      >
                        {applyingCoupon ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-[10.5px] text-neutral-400">
                      Try <span className="font-semibold">FEATHER10</span>,{" "}
                      <span className="font-semibold">SAVE500</span>, or{" "}
                      <span className="font-semibold">FREESHIP</span>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Totals */}
        <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <SummaryRow label="Subtotal" value={formatPKR(subtotal)} />
          {discount > 0 && (
            <SummaryRow
              label={`Discount (${coupon?.code || ""})`}
              value={`− ${formatPKR(discount)}`}
              accent
            />
          )}
          <SummaryRow
            label="Shipping"
            value={shipping === 0 ? "Free" : formatPKR(shipping)}
            accent={shipping === 0}
          />
          <SummaryRow label="GST (5%)" value={formatPKR(gst)} muted />
          <div className="my-3 border-t border-neutral-100 dark:border-neutral-800" />
          <SummaryRow label="Total" value={formatPKR(total)} bold />
        </div>

        {/* Checkout */}
        <button
          type="button"
          onClick={onCheckout}
          className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-4 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] dark:bg-neutral-100 dark:text-neutral-900"
        >
          <Lock className="h-4 w-4" strokeWidth={2.4} />
          Secure checkout
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Trust badges */}
        <ul className="mt-5 grid grid-cols-2 gap-2 text-[10.5px] sm:text-[11px]">
          {[
            { icon: RotateCcw, label: "30-day returns" },
            { icon: Shield, label: "Secure payment" },
            { icon: Truck, label: "Fast shipping" },
            { icon: Award, label: "Authenticity" },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-2 text-neutral-600 dark:bg-neutral-950/60 dark:text-neutral-400"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
});

/* ════════════════════════════════════════════════════════════
   Empty state
   ════════════════════════════════════════════════════════════ */
const EmptyCart = memo(function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md rounded-3xl border border-dashed border-neutral-300 bg-white/70 px-6 py-14 text-center dark:border-neutral-800 dark:bg-neutral-900/50 sm:px-10 sm:py-16"
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <ShoppingBag className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
      </div>
      <h2 className="cart-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        Your bag is empty
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-sm">
        Looks like you haven't added anything yet. Explore our curated collection and
        find something you'll love.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
        <Link
          to="/shop"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-[13.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2.4} />
          Start shopping
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          to="/conditions"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Browse by grade
        </Link>
      </div>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   Sticky mobile checkout bar
   ════════════════════════════════════════════════════════════ */
const StickyCheckout = memo(function StickyCheckout({ visible, total, itemCount, onCheckout }) {
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Total · {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
              <p className="cart-num text-base font-bold text-neutral-900 dark:text-neutral-100">
                {formatPKR(total)}
              </p>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-3 text-xs font-bold text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
              Checkout
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/* ════════════════════════════════════════════════════════════
   Main Cart page
   ════════════════════════════════════════════════════════════ */
const Cart = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const {
    items,
    loading,
    error,
    loggedIn,
    updateQty,
    removeItem,
    clearCart,
    addItem,
    refresh,
  } = useCartState();

  const { saved, save, removeSaved } = useSavedForLater();

  /* Coupon state */
  const [coupon, setCoupon] = useState(() => readLS(LS_COUPON, null));
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    writeLS(LS_COUPON, coupon);
  }, [coupon]);

  /* Sticky bar visibility */
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setShowSticky(window.scrollY > 400));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Clear-all confirm */
  const [confirmClear, setConfirmClear] = useState(false);

  /* ─── Totals ───────────────────────────────────── */
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1),
        0
      ),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0),
    [items]
  );

  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (subtotal < COUPON_MIN_SUBTOTAL) return 0;
    if (coupon.type === "percent") {
      return Math.round((subtotal * coupon.value) / 100);
    }
    if (coupon.type === "flat") {
      return Math.min(coupon.value, subtotal);
    }
    return 0;
  }, [coupon, subtotal]);

  const freeShipRemaining = Math.max(0, FREE_SHIP_THRESHOLD - (subtotal - discount));

  const shipping = useMemo(() => {
    if (items.length === 0) return 0;
    if (coupon?.type === "freeship") return 0;
    if (subtotal >= FREE_SHIP_THRESHOLD) return 0;
    return SHIPPING_FLAT;
  }, [coupon, items.length, subtotal]);

  const gst = useMemo(
    () => Math.round((subtotal - discount) * GST_RATE),
    [subtotal, discount]
  );

  const total = Math.max(0, subtotal - discount + shipping + gst);

  /* ─── Handlers ─────────────────────────────────── */
  const handleSaveLater = useCallback(
    (item) => {
      save(item);
      removeItem(item.id);
      toast.success("Moved to save for later", {
        action: {
          label: "Undo",
          onClick: () => {
            addItem(item);
            removeSaved(item.id);
          },
        },
        duration: 4000,
      });
    },
    [save, removeItem, addItem, removeSaved]
  );

  const handleMoveToCart = useCallback(
    (item) => {
      removeSaved(item.id);
      addItem(item);
      toast.success("Moved to bag", {
        action: {
          label: "Undo",
          onClick: () => {
            save(item);
            removeItem(item.id);
          },
        },
        duration: 4000,
      });
    },
    [removeSaved, addItem, save, removeItem]
  );

  const handleRemove = useCallback(
    (id) => {
      const removed = removeItem(id);
      toast.success("Removed from bag", {
        action: removed
          ? {
              label: "Undo",
              onClick: () => addItem(removed),
            }
          : undefined,
        duration: 4000,
      });
    },
    [removeItem, addItem]
  );

  const handleClearAll = useCallback(async () => {
    setConfirmClear(false);
    await clearCart();
    toast.success("Bag cleared");
  }, [clearCart]);

  const handleApplyCoupon = useCallback(
    (code, onSuccess) => {
      if (subtotal < COUPON_MIN_SUBTOTAL) {
        toast.error(`Minimum order of ${formatPKR(COUPON_MIN_SUBTOTAL)} required`);
        return;
      }
      setApplyingCoupon(true);
      setTimeout(() => {
        const found = COUPONS[code];
        if (!found) {
          toast.error("Invalid coupon code");
        } else {
          setCoupon({ code, ...found });
          toast.success(`Coupon applied · ${found.label}`);
          onSuccess?.();
        }
        setApplyingCoupon(false);
      }, 400);
    },
    [subtotal]
  );

  const handleRemoveCoupon = useCallback(() => {
    setCoupon(null);
    toast.success("Coupon removed");
  }, []);

  const handleCheckout = useCallback(() => {
    navigate("/checkout", {
      state: { source: "cart", coupon: coupon?.code || null },
    });
  }, [navigate, coupon]);

  /* ═════════════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════════════ */
  const isEmpty = !loading && items.length === 0;

  return (
    <div className="cart-hd-root min-h-dvh bg-neutral-50/60 pb-24 dark:bg-neutral-950 lg:pb-10">
      <style>{HD_CSS}</style>

      {/* Breadcrumb strip */}
      <div className="border-b border-neutral-200/70 bg-white dark:border-neutral-800/70 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8 lg:px-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
            <Link to="/" className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100">
              Home
            </Link>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <span aria-current="page" className="font-medium text-neutral-900 dark:text-neutral-100">
              Bag
            </span>
          </nav>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 sm:text-[12px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
            Continue shopping
          </Link>
        </div>
      </div>

      {/* Page header */}
      <header className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 md:px-8 lg:px-10 lg:pt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-zinc-900 dark:bg-white" />
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-600 dark:text-neutral-400">
                Your Bag
              </span>
            </div>
            <h1 className="cart-serif mt-3 text-[clamp(1.9rem,1.3rem+2.4vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
              Shopping Bag
            </h1>
            <p className="mt-2 text-[13px] text-neutral-500 dark:text-neutral-400 sm:text-[13.5px]">
              {isEmpty
                ? "Your bag is empty"
                : `${itemCount} item${itemCount === 1 ? "" : "s"} · ${items.length} unique`}
            </p>
          </div>

          {!isEmpty && (
            <div className="flex items-center gap-3">
              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3.5 py-2 text-[11.5px] font-semibold text-neutral-600 transition-colors hover:border-red-300 hover:text-red-500 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-red-900 dark:hover:text-red-400 sm:text-[12.5px]"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                  Clear bag
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 dark:border-red-900/50 dark:bg-red-950/30">
                  <span className="text-[11.5px] font-semibold text-red-700 dark:text-red-400">
                    Clear all?
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="rounded-full px-2 py-1 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 md:px-8 lg:px-10 lg:pt-10">
        {/* Loading */}
        {loading && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
            <div className="space-y-3">
              {[0, 1, 2].map((n) => (
                <SkeletonRow key={n} />
              ))}
            </div>
            <div className="hidden rounded-3xl border border-neutral-200/70 bg-white p-6 dark:border-neutral-800/70 dark:bg-neutral-900 lg:block">
              <div className="h-6 w-40 rounded cart-skeleton" />
              <div className="mt-5 space-y-3">
                {[0, 1, 2, 3].map((n) => (
                  <div key={n} className="h-4 w-full rounded cart-skeleton" />
                ))}
              </div>
              <div className="mt-5 h-12 w-full rounded-full cart-skeleton" />
            </div>
          </div>
        )}

        {/* Error (non-fatal) */}
        {!loading && error && items.length > 0 && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
            <div className="min-w-0 flex-1 text-[12.5px] sm:text-[13px]">
              {error} — showing your last known bag.
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-900 px-3 py-1.5 text-[11px] font-bold text-amber-50 transition-opacity hover:opacity-90 dark:bg-amber-200 dark:text-amber-950"
            >
              <RefreshCw className="h-3 w-3" strokeWidth={2.5} />
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {isEmpty && <EmptyCart />}

        {/* Items + summary */}
        {!loading && items.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
            {/* Items column */}
            <div className="min-w-0 space-y-6">
              {/* Items list */}
              <ul className="space-y-3" aria-label="Items in your bag">
                <AnimatePresence initial={false}>
                  {items.map((item, idx) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      index={idx}
                      onQty={updateQty}
                      onRemove={handleRemove}
                      onSaveLater={handleSaveLater}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              {/* Delivery + returns strip */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800/80 dark:bg-neutral-900">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Truck className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-neutral-900 dark:text-neutral-100">
                      Fast delivery
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Free over {formatPKR(FREE_SHIP_THRESHOLD)} · 2–4 business days
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800/80 dark:bg-neutral-900">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-neutral-900 dark:text-neutral-100">
                      30-day returns
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Free returns on unused items in original packaging
                    </p>
                  </div>
                </div>
              </div>

              {/* Saved for later */}
              {saved.length > 0 && (
                <section aria-labelledby="saved-heading" className="pt-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2
                      id="saved-heading"
                      className="cart-serif text-lg font-medium text-neutral-900 dark:text-neutral-100 sm:text-xl"
                    >
                      Saved for later
                    </h2>
                    <span className="text-[11.5px] text-neutral-400">
                      {saved.length} item{saved.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    <AnimatePresence initial={false}>
                      {saved.map((item, idx) => (
                        <SavedItemRow
                          key={item.id}
                          item={item}
                          index={idx}
                          onMoveToCart={handleMoveToCart}
                          onRemove={(id) => {
                            removeSaved(id);
                            toast.success("Removed from saved");
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              )}
            </div>

            {/* Summary column */}
            <OrderSummary
              subtotal={subtotal}
              discount={discount}
              coupon={coupon}
              shipping={shipping}
              gst={gst}
              total={total}
              freeShipRemaining={freeShipRemaining}
              itemCount={itemCount}
              onCheckout={handleCheckout}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              applyingCoupon={applyingCoupon}
              reduceMotion={reduceMotion}
            />
          </div>
        )}
      </main>

      {/* Sticky mobile checkout bar */}
      {!isEmpty && (
        <StickyCheckout
          visible={showSticky}
          total={total}
          itemCount={itemCount}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
};

export default Cart;