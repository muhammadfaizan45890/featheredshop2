import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  Camera,
  Pencil,
  Save,
  X,
  Loader2,
  AtSign,
  Globe,
  MapPin,
  Briefcase,
  LogOut,
  Shield,
  CheckCircle2,
  Heart,
  Package,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  Home,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import API from "@/utils/api";
import { getData } from "@/context/userContext";

/* ════════════════════════════════════════════════════════════
   Config
   ════════════════════════════════════════════════════════════ */
/* Adjust if your orders route differs. A 404 simply shows the empty state. */
const ORDERS_ENDPOINT = "/api/orders/my-orders";

const CART_KEY = "fs_cart";
const WISHLIST_KEY = "fn_shop_wishlist";
const BIO_MAX = 300;
const AVATAR_MAX_MB = 5;
const FREE_SHIPPING_THRESHOLD = 8000;

const TABS = [
  { id: "overview", label: "Overview", Icon: User },
  { id: "orders", label: "Orders", Icon: Package },
  { id: "saved", label: "Bag & wishlist", Icon: ShoppingBag },
];

const SOCIAL_FIELDS = [
  { name: "twitter", label: "X (Twitter)", Icon: FaXTwitter, hover: "hover:bg-black hover:text-white", placeholder: "https://x.com/username" },
  { name: "facebook", label: "Facebook", Icon: FaFacebookF, hover: "hover:bg-blue-600 hover:text-white", placeholder: "https://facebook.com/username" },
  { name: "instagram", label: "Instagram", Icon: FaInstagram, hover: "hover:bg-pink-600 hover:text-white", placeholder: "https://instagram.com/username" },
  { name: "youtube", label: "YouTube", Icon: FaYoutube, hover: "hover:bg-red-600 hover:text-white", placeholder: "https://youtube.com/@channel" },
  { name: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn, hover: "hover:bg-blue-700 hover:text-white", placeholder: "https://linkedin.com/in/username" },
];

const URL_FIELDS = ["website", ...SOCIAL_FIELDS.map((s) => s.name)];

const ORDER_STATUS = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  processing: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  shipped: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950";

const HD_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");
  .fp-root { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: geometricPrecision; font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
  .fp-serif { font-family: 'Fraunces', 'Playfair Display', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
  .fp-num { font-variant-numeric: tabular-nums; }
  .fp-tabs::-webkit-scrollbar { display: none; }
  .fp-tabs { -ms-overflow-style: none; scrollbar-width: none; }
`;

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */
const safeGet = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const safeRemove = (k) => {
  try {
    localStorage.removeItem(k);
  } catch {}
};
const readJSON = (k, fb) => {
  try {
    const v = safeGet(k);
    return v ? JSON.parse(v) : fb;
  } catch {
    return fb;
  }
};

/* `API` may be a base-URL string or an axios instance across the app — support both */
const resolveBase = () => {
  if (typeof API === "string") return API;
  if (API?.defaults?.baseURL) return API.defaults.baseURL;
  return import.meta.env?.VITE_API_URL || "";
};

const createHttp = () => {
  const instance =
    API && typeof API.get === "function"
      ? API
      : axios.create({ baseURL: resolveBase() });
  if (!instance.__navbarAuthAttached) {
    instance.interceptors.request.use((config) => {
      const token = safeGet("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    instance.__navbarAuthAttached = true;
  }
  return instance;
};
const http = createHttp();

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (/^https?:\/\//i.test(avatarPath)) return avatarPath;
  const base = resolveBase().replace(/\/+$/, "");
  return base ? `${base}/${avatarPath.replace(/^\/+/, "")}` : null;
};

const hueFor = (str) => {
  if (!str) return 220;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

const formatPKR = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? `Rs ${n.toLocaleString("en-PK")}` : "—";
};

const formatDate = (d, opts = { day: "numeric", month: "short", year: "numeric" }) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", opts);
};

const hydrateForm = (u) => ({
  fullname: u?.fullname || "",
  username: u?.username || "",
  bio: u?.bio || "",
  website: u?.website || "",
  location: u?.location || "",
  occupation: u?.occupation || "",
  twitter: u?.twitter || "",
  facebook: u?.facebook || "",
  instagram: u?.instagram || "",
  youtube: u?.youtube || "",
  linkedin: u?.linkedin || "",
});

const normalizeUrl = (v) => {
  const t = (v || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};
const isValidUrl = (v) => {
  try {
    return new URL(normalizeUrl(v)).hostname.includes(".");
  } catch {
    return false;
  }
};

const validate = (f) => {
  const e = {};
  const name = f.fullname.trim();
  if (!name) e.fullname = "Enter your full name";
  else if (name.length < 2) e.fullname = "Name is too short";
  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(f.username.trim()))
    e.username = "3–30 characters: letters, numbers, dots or underscores";
  if (f.bio.length > BIO_MAX) e.bio = `Keep it under ${BIO_MAX} characters`;
  URL_FIELDS.forEach((k) => {
    if (f[k].trim() && !isValidUrl(f[k])) e[k] = "Enter a valid link";
  });
  return e;
};

/* ════════════════════════════════════════════════════════════
   Local shop data (bag + wishlist), synced with Navbar & pages
   ════════════════════════════════════════════════════════════ */
const readCart = () => {
  const raw = readJSON(CART_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i) => i && i.id != null)
    .map((i) => ({ ...i, qty: Math.max(1, Number(i.qty) || 1), price: Number(i.price) || 0 }));
};

function useCartItems() {
  const [cart, setCart] = useState(readCart);
  useEffect(() => {
    const sync = () => setCart(readCart());
    const onStorage = (e) => (!e.key || e.key === CART_KEY) && sync();
    window.addEventListener("feathered:cart:update", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("feathered:cart:update", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return cart;
}

function useWishlistCount() {
  const read = () => {
    const l = readJSON(WISHLIST_KEY, []);
    return Array.isArray(l) ? l.length : 0;
  };
  const [count, setCount] = useState(read);
  useEffect(() => {
    const onCustom = (e) => {
      const list = e?.detail?.list;
      setCount(Array.isArray(list) ? list.length : read());
    };
    const onStorage = (e) => e.key === WISHLIST_KEY && setCount(read());
    window.addEventListener("feathered:wishlist:update", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("feathered:wishlist:update", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return count;
}

/* ════════════════════════════════════════════════════════════
   Small components
   ════════════════════════════════════════════════════════════ */
const Card = ({ className = "", children, ...rest }) => (
  <div
    className={`rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    {...rest}
  >
    {children}
  </div>
);

const CardTitle = ({ icon: Icon, children, action }) => (
  <div className="mb-3 flex items-center justify-between gap-2">
    <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </h3>
    {action}
  </div>
);

const Field = memo(function Field({
  id,
  icon: Icon,
  label,
  value,
  onChange,
  isEditing,
  error,
  multiline = false,
  type = "text",
  placeholder,
  maxLength,
  readOnly = false,
  inputMode,
  autoComplete,
  hint,
  span2 = false,
}) {
  const editable = isEditing && !readOnly;
  const Label = editable ? "label" : "p";
  const inputClass = `mt-1.5 w-full rounded-xl border bg-white px-3 py-2 text-base text-neutral-900 transition-colors placeholder:text-neutral-400 focus:outline-none focus:ring-2 dark:bg-neutral-950 dark:text-neutral-100 sm:text-sm ${
    error
      ? "border-red-400 focus:ring-red-200 dark:focus:ring-red-900/50"
      : "border-neutral-200 focus:border-neutral-900 focus:ring-neutral-200 dark:border-neutral-700 dark:focus:border-neutral-300 dark:focus:ring-neutral-800"
  }`;

  return (
    <div
      className={`flex items-start gap-3 border-b border-neutral-100 py-3 last:border-0 dark:border-neutral-800 ${
        span2 ? "sm:col-span-2" : ""
      }`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <Icon size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <Label
          {...(editable ? { htmlFor: id } : {})}
          className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400"
        >
          {label}
        </Label>
        {editable ? (
          multiline ? (
            <textarea
              id={id}
              name={id}
              value={value}
              onChange={onChange}
              rows={3}
              maxLength={maxLength ? maxLength + 50 : undefined}
              placeholder={placeholder}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-err` : undefined}
              className={`${inputClass} resize-none`}
            />
          ) : (
            <input
              id={id}
              name={id}
              type={type}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              inputMode={inputMode}
              autoComplete={autoComplete}
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-err` : undefined}
              className={inputClass}
            />
          )
        ) : (
          <p className="mt-0.5 break-words text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {value || <span className="font-normal italic text-neutral-400">Not set</span>}
          </p>
        )}
        {editable && (error || hint || maxLength) && (
          <div className="mt-1 flex items-start justify-between gap-2 text-[11px]">
            <span id={`${id}-err`} className={error ? "text-red-600" : "text-neutral-400"} role={error ? "alert" : undefined}>
              {error || hint}
            </span>
            {maxLength && (
              <span className={`fp-num shrink-0 ${value.length > maxLength ? "text-red-600" : "text-neutral-400"}`}>
                {value.length}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

const StatTile = ({ label, value, loading, to, onClick, Icon }) => {
  const inner = (
    <>
      <span className="flex items-center justify-between text-neutral-400">
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon size={13} aria-hidden="true" />
      </span>
      {loading ? (
        <span className="mt-1.5 block h-6 w-10 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      ) : (
        <span className="fp-num mt-1 block truncate text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          {value}
        </span>
      )}
    </>
  );
  const cls = `block rounded-xl border border-neutral-200/80 bg-neutral-50 p-3 text-left transition-colors dark:border-neutral-800 dark:bg-neutral-950/60 ${
    to || onClick ? "hover:border-neutral-300 hover:bg-white dark:hover:border-neutral-700 dark:hover:bg-neutral-900" : ""
  } ${focusRing}`;
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} w-full`}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
};

const CompletenessRing = ({ pct }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="stroke-amber-500 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="fp-num absolute inset-0 flex items-center justify-center text-sm font-bold text-neutral-900 dark:text-neutral-100">
        {pct}%
      </span>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center px-4 py-12 text-center sm:py-16">
    <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
      <Icon size={24} className="text-neutral-400" aria-hidden="true" />
    </span>
    <p className="fp-serif text-lg font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
    <p className="mt-1 max-w-xs text-sm text-neutral-500">{subtitle}</p>
    {action}
  </div>
);

const SkeletonProfile = () => (
  <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950" aria-busy="true" aria-label="Loading your account">
    <div className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-6 sm:pt-8 lg:px-8 3xl:max-w-7xl">
      <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="h-24 animate-pulse bg-neutral-200 dark:bg-neutral-800 sm:h-32" />
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-300 ring-4 ring-white dark:bg-neutral-700 dark:ring-neutral-900 sm:h-24 sm:w-24" />
            <div className="flex-1 space-y-2 pb-2">
              <div className="h-6 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-3 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[70px] animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="hidden h-64 animate-pulse rounded-2xl bg-white dark:bg-neutral-900 lg:block" />
        <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-neutral-900" />
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   Orders panel
   ════════════════════════════════════════════════════════════ */
const OrdersPanel = memo(function OrdersPanel({ orders, onRetry }) {
  if (orders.status === "loading") {
    return (
      <div className="space-y-3 p-4 sm:p-6" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </div>
    );
  }
  if (orders.status === "error") {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load your orders"
        subtitle="Check your connection and try again."
        action={
          <button
            type="button"
            onClick={onRetry}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-black ${focusRing}`}
          >
            <RefreshCw size={13} aria-hidden="true" /> Try again
          </button>
        }
      />
    );
  }
  if (orders.items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        subtitle="When you place an order, you can track it here."
        action={
          <Link
            to="/shop"
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-black ${focusRing}`}
          >
            Start shopping <ArrowRight size={13} aria-hidden="true" />
          </Link>
        }
      />
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {orders.items.map((o) => {
          const id = o.orderNumber || o.orderId || String(o._id || "").slice(-8).toUpperCase();
          const status = String(o.status || o.orderStatus || "pending").toLowerCase();
          const items = o.items || o.orderItems || [];
          const total = o.totalAmount ?? o.total ?? o.totalPrice;
          return (
            <li key={o._id || id} className="py-4 first:pt-0 last:pb-0">
              <Link
                to="/orders"
                className={`flex items-center gap-3 rounded-xl sm:gap-4 ${focusRing}`}
              >
                <span className="flex -space-x-2">
                  {items.slice(0, 3).map((it, i) => (
                    <span
                      key={i}
                      className="h-12 w-12 overflow-hidden rounded-lg border-2 border-white bg-neutral-100 dark:border-neutral-900 dark:bg-neutral-800 sm:h-14 sm:w-14"
                    >
                      {(it.image || it.images?.[0]) && (
                        <img src={it.image || it.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </span>
                  ))}
                  {items.length === 0 && (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 dark:bg-neutral-800 sm:h-14 sm:w-14">
                      <Package size={18} aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="fp-num truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      #{id}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${ORDER_STATUS[status] || "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"}`}>
                      {status}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {formatDate(o.createdAt)}
                    {items.length > 0 && ` · ${items.length} item${items.length > 1 ? "s" : ""}`}
                  </span>
                </span>
                <span className="fp-num shrink-0 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {total != null ? formatPKR(total) : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        to="/orders"
        className={`mt-5 inline-flex items-center gap-1.5 rounded text-xs font-bold text-amber-600 hover:text-amber-700 ${focusRing}`}
      >
        View all orders <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   Bag & wishlist panel
   ════════════════════════════════════════════════════════════ */
const SavedPanel = memo(function SavedPanel({ cart, wishCount }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_240px]">
      <section aria-label="Items in your bag">
        <CardTitle icon={ShoppingBag}>In your bag</CardTitle>
        {cart.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
            Your bag is empty.{" "}
            <Link to="/shop" className="font-semibold text-amber-600 hover:underline">
              Browse the shop
            </Link>
          </p>
        ) : (
          <>
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {cart.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <Link
                    to={`/shop/${item.slug || item.id}`}
                    className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 ${focusRing}`}
                  >
                    {item.image && <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</p>
                    {item.variant && <p className="truncate text-[11px] text-neutral-400">{item.variant}</p>}
                    <p className="fp-num mt-0.5 text-xs text-neutral-500">Qty {item.qty}</p>
                  </div>
                  <span className="fp-num shrink-0 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {formatPKR(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950/60">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="fp-num font-bold text-neutral-900 dark:text-neutral-100">{formatPKR(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                {remaining > 0
                  ? `Add ${formatPKR(remaining)} more for free shipping`
                  : "You've unlocked free shipping"}
              </p>
              <Link
                to="/checkout"
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-black ${focusRing}`}
              >
                Checkout <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </section>

      <section aria-label="Wishlist">
        <CardTitle icon={Heart}>Wishlist</CardTitle>
        <Link
          to="/wishlist"
          className={`group flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50 p-4 transition-colors hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/60 dark:hover:bg-neutral-900 ${focusRing}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40">
            <Heart size={18} className={wishCount ? "fill-red-500" : ""} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="fp-num block text-xl font-bold text-neutral-900 dark:text-neutral-100">{wishCount}</span>
            <span className="block text-xs text-neutral-500">saved {wishCount === 1 ? "item" : "items"}</span>
          </span>
          <ArrowUpRight size={15} className="text-neutral-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════ */
const UserProfile = () => {
  const { user: contextUser, setUser, logout: ctxLogout } = getData();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [user, setUserState] = useState(contextUser || null);
  const [authStatus, setAuthStatus] = useState(contextUser ? "ready" : "loading");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(() => hydrateForm(contextUser));
  const [errors, setErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [orders, setOrders] = useState({ status: "loading", items: [], total: null });
  const [tab, setTab] = useState(() => {
    const h = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    return TABS.some((t) => t.id === h) ? h : "overview";
  });

  const cart = useCartItems();
  const wishCount = useWishlistCount();
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const uid = user?._id || user?.id;
  const baseline = useMemo(() => hydrateForm(user), [user]);
  const dirty = useMemo(
    () => !!avatarFile || Object.keys(baseline).some((k) => baseline[k] !== form[k]),
    [baseline, form, avatarFile]
  );

  useEffect(() => {
    const prev = document.title;
    document.title = "My account · FeatheredSHOP";
    return () => {
      document.title = prev;
    };
  }, []);

  /* Keep local state in sync with the shared user context */
  useEffect(() => {
    if (contextUser) {
      setUserState(contextUser);
      setAuthStatus("ready");
    }
  }, [contextUser]);

  useEffect(() => {
    if (!isEditing) setForm(baseline);
  }, [baseline, isEditing]);

  /* ─── Refresh profile from the server once ─────────── */
  useEffect(() => {
    const token = safeGet("accessToken");
    if (!token) {
      if (!contextUser) setAuthStatus("unauth");
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await http.get("/user/profile", { signal: controller.signal });
        const data = res.data?.data;
        if (data) {
          setUserState(data);
          setUser?.(data);
          safeSet("user", JSON.stringify(data));
          setAuthStatus("ready");
        } else if (!contextUser) {
          setAuthStatus("error");
        }
      } catch (err) {
        if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") return;
        if (err?.response?.status === 401) {
          if (!contextUser) setAuthStatus("unauth");
        } else if (!contextUser) {
          setAuthStatus("error");
        }
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  /* ─── Orders (summary + recent list) ───────────────── */
  const [ordersKey, setOrdersKey] = useState(0);
  useEffect(() => {
    if (!uid) return;
    if (!safeGet("accessToken")) {
      setOrders({ status: "ready", items: [], total: null });
      return;
    }
    const controller = new AbortController();
    setOrders((o) => ({ ...o, status: "loading" }));
    (async () => {
      try {
        const res = await http.get(ORDERS_ENDPOINT, {
          params: { page: 1, limit: 5 },
          signal: controller.signal,
        });
        const d = res.data;
        const list = Array.isArray(d) ? d : d?.data || d?.orders || [];
        const total = d?.total ?? d?.pagination?.total ?? d?.count ?? list.length;
        setOrders({ status: "ready", items: list.slice(0, 5), total });
      } catch (err) {
        if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") return;
        const s = err?.response?.status;
        setOrders({ status: s === 404 ? "ready" : "error", items: [], total: s === 404 ? null : null });
      }
    })();
    return () => controller.abort();
  }, [uid, ordersKey]);

  /* ─── Tabs ──────────────────────────────────────────── */
  const selectTab = useCallback((id) => {
    setTab(id);
    try {
      window.history.replaceState(null, "", id === "overview" ? window.location.pathname + window.location.search : `#${id}`);
    } catch {}
  }, []);

  const onTabKeyDown = (e) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    selectTab(TABS[next].id);
    document.getElementById(`tab-${TABS[next].id}`)?.focus();
  };

  /* ─── Form handlers ─────────────────────────────────── */
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }, []);

  const clearPreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);
  useEffect(() => clearPreview, [clearPreview]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      toast.error(`Image must be under ${AVATAR_MAX_MB} MB`);
      return;
    }
    clearPreview();
    objectUrlRef.current = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(objectUrlRef.current);
    setAvatarBroken(false);
  };

  const startEditing = useCallback(() => {
    selectTab("overview");
    setIsEditing(true);
  }, [selectTab]);

  const handleCancel = useCallback(() => {
    clearPreview();
    setForm(baseline);
    setErrors({});
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  }, [baseline, clearPreview]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    const found = validate(form);
    if (Object.keys(found).length) {
      setErrors(found);
      toast.error("Please fix the highlighted fields");
      selectTab("overview");
      setTimeout(() => document.getElementById(Object.keys(found)[0])?.focus(), 50);
      return;
    }

    setIsSaving(true);
    try {
      if (!safeGet("accessToken")) {
        toast.error("Your session expired. Please sign in again.");
        navigate("/login");
        return;
      }

      const payload = {};
      Object.keys(form).forEach((k) => {
        const v = form[k].trim();
        payload[k] = URL_FIELDS.includes(k) ? normalizeUrl(v) : v;
      });

      const body = new FormData();
      Object.entries(payload).forEach(([k, v]) => body.append(k, v));
      if (avatarFile) body.append("avatar", avatarFile);

      const res = await http.put("/user/profile", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data?.data || { ...user, ...payload };
      setUserState(updated);
      setUser?.(updated);
      safeSet("user", JSON.stringify(updated));
      clearPreview();
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarBroken(false);
      setErrors({});
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update profile";
      if (/username/i.test(message)) setErrors((p) => ({ ...p, username: message }));
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [form, avatarFile, isSaving, navigate, setUser, user, clearPreview, selectTab]);

  /* Ctrl/⌘+S saves while editing; warn before leaving with unsaved changes */
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty) handleSave();
      }
    };
    const onBeforeUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isEditing, dirty, handleSave]);

  /* ─── Logout (only clears auth keys — bag & wishlist stay) ── */
  const handleLogout = async () => {
    try {
      if (safeGet("accessToken")) await http.post("/user/logout", {});
    } catch {
      /* local sign-out still proceeds */
    } finally {
      setUser?.(null);
      ctxLogout?.();
      ["accessToken", "refreshToken", "user", "userId"].forEach(safeRemove);
      toast.success("Signed out");
      navigate("/", { replace: true });
    }
  };

  /* ─── Derived ───────────────────────────────────────── */
  const hue = hueFor(user?.username || user?.email);
  const avatarSrc = avatarPreview || getAvatarUrl(user?.avatar);
  const showAvatarImg = !!avatarSrc && !avatarBroken;
  const initials = (user?.fullname || user?.username || user?.email || "U")
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const memberSince = user?.createdAt
    ? formatDate(user.createdAt, { month: "short", year: "numeric" })
    : "—";
  const isAdmin = (user?.role || user?.userRole) === "admin";
  const hasSocials = SOCIAL_FIELDS.some((s) => user?.[s.name]);

  const completeness = useMemo(() => {
    const steps = [
      { done: !!user?.avatar, hint: "Add a profile photo" },
      { done: !!user?.fullname, hint: "Add your full name" },
      { done: !!user?.username, hint: "Choose a username" },
      { done: !!user?.bio, hint: "Write a short bio" },
      { done: !!user?.location, hint: "Add your city" },
      { done: !!user?.occupation, hint: "Add your occupation" },
      { done: !!user?.website, hint: "Add a website" },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      pct: Math.round((done / steps.length) * 100),
      hints: steps.filter((s) => !s.done).map((s) => s.hint),
    };
  }, [user]);

  /* ─── Non-ready states ──────────────────────────────── */
  if (authStatus === "loading") return <SkeletonProfile />;

  if (authStatus === "unauth" || authStatus === "error" || !user) {
    const isError = authStatus === "error";
    return (
      <div className="fp-root flex min-h-[70dvh] items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
        <style>{HD_CSS}</style>
        <Card className="w-full max-w-sm p-8 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            {isError ? <RefreshCw size={26} className="text-neutral-400" aria-hidden="true" /> : <User size={26} className="text-neutral-400" aria-hidden="true" />}
          </span>
          <h1 className="fp-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100">
            {isError ? "Couldn't load your account" : "Sign in to your account"}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {isError
              ? "Check your connection and try again."
              : "View your orders, wishlist and saved details."}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {isError ? (
              <button
                type="button"
                onClick={() => {
                  setAuthStatus("loading");
                  setRetryKey((k) => k + 1);
                }}
                className={`rounded-full bg-neutral-900 py-2.5 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-black ${focusRing}`}
              >
                Try again
              </button>
            ) : (
              <Link
                to="/login"
                className={`rounded-full bg-neutral-900 py-2.5 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-black ${focusRing}`}
              >
                Sign in
              </Link>
            )}
            <Link to="/shop" className={`rounded-full py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white ${focusRing}`}>
              Continue shopping
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const fieldProps = (name) => ({
    id: name,
    value: form[name],
    onChange: handleInputChange,
    isEditing,
    error: errors[name],
  });

  const saveBtn = (
    <button
      type="button"
      onClick={handleSave}
      disabled={isSaving || !dirty}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-black ${focusRing}`}
    >
      {isSaving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
      {isSaving ? "Saving…" : "Save changes"}
    </button>
  );
  const cancelBtn = (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isSaving}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-neutral-100 px-5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 ${focusRing}`}
    >
      <X size={14} aria-hidden="true" /> Cancel
    </button>
  );

  /* ─── Render ────────────────────────────────────────── */
  return (
    <div className="fp-root min-h-dvh bg-neutral-50 pb-28 dark:bg-neutral-950 sm:pb-16">
      <style>{HD_CSS}</style>

      <div className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-6 sm:pt-8 lg:px-8 3xl:max-w-7xl">
        {/* ─── Masthead ─────────────────────────────── */}
        <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900" aria-label="Account summary">
          <div
            className="h-24 sm:h-32 md:h-36"
            style={{
              background: `linear-gradient(120deg, hsl(${hue} 65% 40%), hsl(${(hue + 45) % 360} 70% 24%))`,
            }}
            aria-hidden="true"
          />
          <div className="px-4 pb-5 sm:px-6">
            <div className="-mt-10 flex flex-wrap items-end gap-x-4 gap-y-3 sm:-mt-12">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white ring-4 ring-white dark:ring-neutral-900 sm:h-24 sm:w-24 sm:text-3xl md:h-28 md:w-28"
                  style={{ backgroundColor: showAvatarImg ? undefined : `hsl(${hue} 65% 42%)` }}
                >
                  {showAvatarImg ? (
                    <img
                      src={avatarSrc}
                      alt={`${user.fullname || user.username || "Your"} profile photo`}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <span aria-hidden="true">{initials}</span>
                  )}
                </div>
                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg ring-2 ring-white transition-transform hover:scale-105 dark:bg-neutral-100 dark:text-black dark:ring-neutral-900 ${focusRing}`}
                      aria-label="Change profile photo"
                    >
                      <Camera size={15} aria-hidden="true" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {/* Identity */}
              <div className="min-w-0 flex-1 basis-52 pb-1">
                <h1 className="fp-serif truncate text-2xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                  {user.fullname || user.username}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                  <span>@{user.username}</span>
                  {user.location && (
                    <>
                      <span className="text-neutral-300 dark:text-neutral-700" aria-hidden="true">•</span>
                      <span className="inline-flex items-center gap-1"><MapPin size={11} aria-hidden="true" />{user.location}</span>
                    </>
                  )}
                  <span className="text-neutral-300 dark:text-neutral-700" aria-hidden="true">•</span>
                  <span className="inline-flex items-center gap-1"><Calendar size={11} aria-hidden="true" />Member since {memberSince}</span>
                </div>
                {(user.role || user.isVerified) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {user.role && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        <Shield size={10} aria-hidden="true" /> {user.role}
                      </span>
                    )}
                    {user.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        <CheckCircle2 size={10} aria-hidden="true" /> Verified
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions (≥ sm; phones get the bottom bar while editing) */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={startEditing}
                    className={`inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-black ${focusRing}`}
                  >
                    <Pencil size={13} aria-hidden="true" /> Edit profile
                  </button>
                ) : (
                  <div className="hidden items-center gap-2 sm:flex">
                    {dirty && <span className="mr-1 text-[11px] font-medium text-amber-600">Unsaved changes</span>}
                    {cancelBtn}
                    {saveBtn}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile
                label="Orders"
                Icon={Package}
                loading={orders.status === "loading"}
                value={orders.total != null ? orders.total : "—"}
                onClick={() => selectTab("orders")}
              />
              <StatTile label="Wishlist" Icon={Heart} value={wishCount} to="/wishlist" />
              <StatTile label="In bag" Icon={ShoppingBag} value={cartCount} onClick={() => selectTab("saved")} />
              <StatTile label="Profile" Icon={Sparkles} value={`${completeness.pct}%`} onClick={startEditing} />
            </div>
          </div>
        </section>

        {/* ─── Body ─────────────────────────────────── */}
        <div className="mt-4 grid items-start gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="order-2 space-y-4 sm:space-y-6 lg:order-1 lg:sticky lg:top-24">
            {completeness.pct < 100 && (
              <Card className="p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <CompletenessRing pct={completeness.pct} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Complete your profile</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-neutral-500">
                      {completeness.hints.slice(0, 2).map((h) => (
                        <li key={h}>• {h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className={`mt-4 w-full rounded-full border border-neutral-200 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:border-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-neutral-300 ${focusRing}`}
                  >
                    Finish setting up
                  </button>
                )}
              </Card>
            )}

            <Card className="p-4 sm:p-5">
              <CardTitle icon={Sparkles}>About</CardTitle>
              <p className="fp-serif break-words text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {user.bio || (
                  <span className="font-sans text-sm italic text-neutral-400">No bio yet.</span>
                )}
              </p>
              {user.occupation && (
                <p className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3 text-sm text-neutral-500 dark:border-neutral-800">
                  <Briefcase size={13} aria-hidden="true" /> {user.occupation}
                </p>
              )}
              {user.website && (
                <a
                  href={normalizeUrl(user.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 inline-flex items-center gap-1.5 rounded text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100 ${focusRing}`}
                >
                  <Globe size={13} aria-hidden="true" />
                  <span className="break-all">{user.website.replace(/^https?:\/\//, "")}</span>
                  <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              )}
            </Card>

            <Card className="overflow-hidden">
              <nav aria-label="Account shortcuts">
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {[
                    { to: "/orders", label: "My orders", Icon: Package },
                    { to: "/wishlist", label: "Wishlist", Icon: Heart, count: wishCount },
                    { to: "/addresses", label: "Saved addresses", Icon: Home },
                    ...(isAdmin ? [{ to: "/admin/dashboard", label: "Admin dashboard", Icon: Shield }] : []),
                  ].map(({ to, label, Icon, count }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/60 ${focusRing}`}
                      >
                        <Icon size={16} className="text-neutral-400" aria-hidden="true" />
                        <span className="flex-1">{label}</span>
                        {count > 0 && (
                          <span className="fp-num rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            {count}
                          </span>
                        )}
                        <ArrowRight size={14} className="text-neutral-300" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </Card>

            <button
              type="button"
              onClick={handleLogout}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 ${focusRing}`}
            >
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </aside>

          {/* Main */}
          <main className="order-1 min-w-0 lg:order-2">
            <div
              role="tablist"
              aria-label="Account sections"
              onKeyDown={onTabKeyDown}
              className="fp-tabs -mx-3 mb-4 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:mb-5 sm:px-0"
            >
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    id={`tab-${id}`}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    aria-controls={`panel-${id}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => selectTab(id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${focusRing} ${
                      active
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                    }`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>

            <motion.div
              key={tab}
              id={`panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {tab === "overview" && (
                <div className="space-y-4 sm:space-y-6">
                  <Card className="p-4 sm:p-6">
                    <CardTitle icon={User}>Personal information</CardTitle>
                    <div className="grid gap-x-8 sm:grid-cols-2">
                      <Field {...fieldProps("fullname")} icon={User} label="Full name" placeholder="Your full name" autoComplete="name" />
                      <Field {...fieldProps("username")} icon={AtSign} label="Username" placeholder="username" autoComplete="username" hint="Letters, numbers, dots and underscores" />
                      <Field id="email" icon={Mail} label="Email" value={user.email || ""} isEditing={isEditing} readOnly hint="Email can't be changed here" />
                      <Field id="role" icon={Shield} label="Account type" value={user.role || ""} isEditing={isEditing} readOnly />
                      <Field {...fieldProps("location")} icon={MapPin} label="Location" placeholder="City, Country" autoComplete="address-level2" />
                      <Field {...fieldProps("occupation")} icon={Briefcase} label="Occupation" placeholder="Your job title" autoComplete="organization-title" />
                      <Field {...fieldProps("website")} icon={Globe} label="Website" placeholder="https://example.com" inputMode="url" autoComplete="url" span2 />
                      <Field {...fieldProps("bio")} icon={Sparkles} label="Bio" placeholder="Tell us a little about yourself" multiline maxLength={BIO_MAX} span2 />
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-6">
                    <CardTitle icon={Globe}>Social links</CardTitle>
                    {isEditing ? (
                      <div className="grid gap-x-8 sm:grid-cols-2">
                        {SOCIAL_FIELDS.map(({ name, label, Icon, placeholder }) => (
                          <Field
                            key={name}
                            {...fieldProps(name)}
                            icon={Icon}
                            label={label}
                            placeholder={placeholder}
                            inputMode="url"
                          />
                        ))}
                      </div>
                    ) : hasSocials ? (
                      <div className="flex flex-wrap gap-2">
                        {SOCIAL_FIELDS.filter((s) => user[s.name]).map(({ name, label, Icon, hover }) => (
                          <a
                            key={name}
                            href={normalizeUrl(user[name])}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            title={label}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:border-transparent dark:border-neutral-700 dark:text-neutral-300 ${hover} ${focusRing}`}
                          >
                            <Icon size={17} aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-neutral-400">No links added yet.</p>
                    )}
                  </Card>
                </div>
              )}

              {tab === "orders" && (
                <Card>
                  <OrdersPanel orders={orders} onRetry={() => setOrdersKey((k) => k + 1)} />
                </Card>
              )}

              {tab === "saved" && (
                <Card>
                  <SavedPanel cart={cart} wishCount={wishCount} />
                </Card>
              )}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Phone action bar while editing */}
      {isEditing && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/90 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90 sm:hidden">
          <div className="grid grid-cols-2 gap-2">
            {cancelBtn}
            {saveBtn}
          </div>
          {dirty && <p className="mt-1 text-center text-[11px] font-medium text-amber-600">Unsaved changes</p>}
        </div>
      )}
    </div>
  );
};

export default UserProfile;