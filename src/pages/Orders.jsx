/* eslint-disable no-unused-vars */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import {
  ArrowRight,
  Package,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  X,
  ChevronDown,
  Copy,
  Check,
  MapPin,
  CreditCard,
  Banknote,
  Wallet,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Info,
  Lock,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import API from "@/utils/api";
import { getData } from "@/context/userContext";

/* ════════════════════════════════════════════════════════════
   CONFIG
   ════════════════════════════════════════════════════════════ */
const TOKEN_KEY = "accessToken";
const USER_KEY = "user";
const LS_ORDERS = "fs_orders";
const LS_CART = "fs_cart";
const CART_EVENT = "feathered:cart:update";
const ORDERS_EVENT = "feathered:orders:update";
const CANCELLABLE_STATUSES = ["pending", "confirmed", "processing"];

/* ════════════════════════════════════════════════════════════
   HD CSS
   ════════════════════════════════════════════════════════════ */
const HD_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");

  .or-hd-root {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  .or-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 0, "WONK" 0;
    letter-spacing: -0.02em;
  }
  .or-num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "kern" 1;
  }
  .or-hd-root :focus-visible { outline: 2px solid #171717; outline-offset: 2px; }
  .dark .or-hd-root :focus-visible { outline-color: #fafafa; }

  .or-skeleton {
    background: linear-gradient(90deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.05) 100%);
    background-size: 200% 100%;
    animation: or-shimmer 1.4s ease-in-out infinite;
  }
  .dark .or-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.05) 100%);
    background-size: 200% 100%;
  }
  @keyframes or-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .or-skeleton { animation: none; } }
`;

/* ════════════════════════════════════════════════════════════
   Status metadata
   ════════════════════════════════════════════════════════════ */
const STATUS_META = {
  pending: {
    label: "Pending",
    Icon: Clock,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900/50",
    description: "Order received — awaiting confirmation",
  },
  confirmed: {
    label: "Confirmed",
    Icon: CheckCircle2,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900/50",
    description: "Order confirmed — being prepared",
  },
  processing: {
    label: "Processing",
    Icon: Package,
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-900/50",
    description: "Order is being packed",
  },
  shipped: {
    label: "Shipped",
    Icon: Truck,
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-900/50",
    description: "Order is on its way",
  },
  delivered: {
    label: "Delivered",
    Icon: PackageCheck,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900/50",
    description: "Order delivered successfully",
  },
  cancelled: {
    label: "Cancelled",
    Icon: XCircle,
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-900/50",
    description: "Order was cancelled",
  },
  returned: {
    label: "Returned",
    Icon: AlertCircle,
    bg: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-700 dark:text-neutral-300",
    border: "border-neutral-200 dark:border-neutral-700",
    description: "Order was returned",
  },
};

const STATUS_ORDER = ["pending", "confirmed", "processing", "shipped", "delivered"];
const STATUS_FILTERS = ["all", ...Object.keys(STATUS_META)];

const PAYMENT_ICONS = { cod: Banknote, card: CreditCard, wallet: Wallet };

const formatPKR = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? `Rs ${num.toLocaleString("en-PK")}` : "Rs 0";
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const FALLBACK_IMG =
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22600%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%22300%22%20y%3D%22300%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

/* ─── Safe LS ─── */
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

/* ─── Auth ─── */
const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const isLoggedIn = () => !!getToken();

/* ─── API instance ─── */
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
  if (!instance.__ordersAuthAttached) {
    instance.interceptors.request.use(
      (config) => {
        try {
          const token = getToken();
          if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch {}
        return config;
      },
      (error) => Promise.reject(error)
    );
    instance.__ordersAuthAttached = true;
  }
  return instance;
};
const api = getApiInstance();

/* ─── Image optimizer ─── */
const CLOUDINARY_RE =
  /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;
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

/* ─── Normalize order ─── */
const normalizeOrder = (raw) => {
  if (!raw) return null;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const totals = raw.totals || {};
  return {
    _id: raw._id || raw.id || raw.orderNumber,
    orderNumber:
      raw.orderNumber ||
      `FS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    createdAt: raw.createdAt || new Date().toISOString(),
    customer: raw.customer || {},
    address: raw.address || {},
    items,
    shippingMethod: raw.shippingMethod || "standard",
    paymentMethod: raw.paymentMethod || "cod",
    paymentStatus: raw.paymentStatus || "pending",
    status: raw.status || "pending",
    couponCode: raw.couponCode || null,
    totals: {
      subtotal: Number(totals.subtotal) || 0,
      discount: Number(totals.discount) || 0,
      shipping: Number(totals.shipping) || 0,
      gst: Number(totals.gst) || 0,
      total: Number(totals.total) || Number(raw.total) || 0,
    },
    trackingNumber: raw.trackingNumber || "",
    cancelledReason: raw.cancelledReason || "",
    statusHistory: Array.isArray(raw.statusHistory) ? raw.statusHistory : [],
    userEmail: raw.userEmail || raw.customer?.email || null,
    userId: raw.userId || raw.user?._id || raw.user || null,
  };
};

/* ─── Merge server + local ─── */
const mergeOrders = (serverOrders, localOrders) => {
  const map = new Map();
  serverOrders.forEach((o) => map.set(o.orderNumber, o));
  localOrders.forEach((o) => {
    if (!map.has(o.orderNumber)) map.set(o.orderNumber, o);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
};

/* ════════════════════════════════════════════════════════════
   Ownership — single source of truth
   An order belongs to the current user iff its userId matches
   the user's _id, OR its email (userEmail or customer.email)
   matches the user's email. Blank on either side never matches.
   ════════════════════════════════════════════════════════════ */
const isOwnedBy = (order, currentUser) => {
  if (!order || !currentUser) return false;

  const userId = currentUser._id || currentUser.id || null;
  const userEmail = (currentUser.email || "").toLowerCase().trim();

  const orderUserId = order.userId || order.user?._id || order.user || null;
  const orderEmail = (order.userEmail || order.customer?.email || "")
    .toLowerCase()
    .trim();

  const idMatch =
    !!userId && !!orderUserId && String(orderUserId) === String(userId);
  const emailMatch =
    !!userEmail && !!orderEmail && orderEmail === userEmail;

  return idMatch || emailMatch;
};

/* ─── Filter local orders belonging to current user ─── */
const filterMine = (list, currentUser) =>
  list.filter((o) => isOwnedBy(o, currentUser));

/* ════════════════════════════════════════════════════════════
   Login gate
   ════════════════════════════════════════════════════════════ */
const LoginRequiredScreen = memo(function LoginRequiredScreen() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md"
    >
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 text-center dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Lock className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
        </div>
        <h1 className="or-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-3xl">
          Sign in to track orders
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-sm">
          Your order history and tracking details are protected. Log in or
          create an account to continue.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              navigate("/login", { state: { redirectTo: "/orders" } })
            }
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-[13.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900"
          >
            Log in
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Create account
          </Link>
        </div>

        <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-neutral-800">
          <p className="text-[11.5px] leading-relaxed text-neutral-400">
            Just checking out?{" "}
            <Link
              to="/shop"
              className="font-semibold text-neutral-700 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              Continue shopping
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   Timeline
   ════════════════════════════════════════════════════════════ */
const OrderTimeline = memo(function OrderTimeline({ status, history = [] }) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const cancelled = status === "cancelled" || status === "returned";
  const meta = STATUS_META[status] || STATUS_META.pending;
  const MetaIcon = meta.Icon;

  const steps = STATUS_ORDER.map((s) => {
    const sm = STATUS_META[s];
    const i = STATUS_ORDER.indexOf(s);
    return {
      id: s,
      label: sm.label,
      Icon: sm.Icon,
      done: !cancelled && i <= currentIndex,
    };
  });

  const shippedEntry = history.find((h) => h.status === "shipped");
  const trackingNumber = shippedEntry?.tracking;

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.text}`}
        >
          <MetaIcon className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100">
            {meta.label}
          </p>
          <p className="mt-0.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">
            {meta.description}
          </p>
        </div>
      </div>

      {!cancelled && (
        <div className="mt-5">
          <div className="relative flex items-center justify-between">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-100 dark:bg-neutral-800"
            />
            <div
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-emerald-500 transition-[width] duration-700"
              style={{
                width: `${Math.max(
                  0,
                  (currentIndex / (steps.length - 1)) * 100
                )}%`,
              }}
            />
            {steps.map((step) => {
              const StepIcon = step.Icon;
              return (
                <div
                  key={step.id}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white transition-colors dark:ring-neutral-950 ${
                      step.done
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                    }`}
                  >
                    <StepIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                  </span>
                  <span
                    className={`absolute top-full mt-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider sm:text-[10.5px] ${
                      step.done
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-6" aria-hidden="true" />
        </div>
      )}

      {trackingNumber && (
        <p className="mt-2 flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-[11.5px] font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
          <Truck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
          Tracking: <span className="or-num">{trackingNumber}</span>
        </p>
      )}
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   Confirm dialog
   ════════════════════════════════════════════════════════════ */
const ConfirmDialog = memo(function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Back",
  busy = false,
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-neutral-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={busy ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:rounded-2xl"
      >
        <h3 className="or-serif text-xl font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-opacity disabled:opacity-60 ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-neutral-900 hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
            }`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   Order card
   ════════════════════════════════════════════════════════════ */
const OrderCard = memo(function OrderCard({
  order,
  index,
  currentUser,
  onReorder,
  onCancel,
  onRefreshOne,
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const reduceMotion = useReducedMotion();

  const display = detail || order;
  const meta = STATUS_META[display.status] || STATUS_META.pending;
  const StatusIcon = meta.Icon;
  const PaymentIcon = PAYMENT_ICONS[display.paymentMethod] || CreditCard;
  const itemCount = display.items.reduce((s, i) => s + (i.qty || 0), 0);
  const canCancel = CANCELLABLE_STATUSES.includes(display.status);

  const handleToggle = useCallback(async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !detail && !detailLoading) {
      setDetailLoading(true);
      try {
        const res = await api.get(`/api/orders/${order._id}`);
        const fresh = normalizeOrder(res?.data?.data);
        /* ─── Only accept the fresh detail if it belongs to us ─── */
        if (fresh && isOwnedBy(fresh, currentUser)) {
          setDetail(fresh);
        } else if (fresh) {
          console.warn("[Orders] Refused to display unowned order detail");
        }
      } catch {
        /* silent — fall back to list data */
      } finally {
        setDetailLoading(false);
      }
    }
  }, [expanded, detail, detailLoading, order._id, currentUser]);

  const copyNumber = useCallback(
    async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(display.orderNumber);
        setCopied(true);
        toast.success("Order number copied");
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error("Couldn't copy");
      }
    },
    [display.orderNumber]
  );

  const handleReorder = useCallback(
    (e) => {
      e.stopPropagation();
      onReorder(display);
    },
    [display, onReorder]
  );

  const handleCancelConfirm = useCallback(async () => {
    setCancelling(true);
    try {
      const res = await api.patch(`/api/orders/${order._id}/cancel`, {
        reason: "Cancelled by customer",
      });
      const updated = normalizeOrder(res?.data?.data);
      /* ─── Only accept if owned ─── */
      if (updated && isOwnedBy(updated, currentUser)) {
        setDetail(updated);
        toast.success("Order cancelled");
        onCancel?.(updated);
      } else if (updated) {
        toast.error("Unexpected response — please refresh");
      } else {
        onCancel?.(order);
      }
      setConfirmCancel(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to cancel order"
      );
    } finally {
      setCancelling(false);
    }
  }, [order, currentUser, onCancel]);

  return (
    <>
      <motion.li
        layout
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
        className="group overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-shadow hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900"
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
          className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-950/40 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
        >
          <span
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.bg} ${meta.text}`}
          >
            <StatusIcon className="h-5 w-5" strokeWidth={2.4} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="or-num text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                {display.orderNumber}
              </span>
              <button
                type="button"
                onClick={copyNumber}
                aria-label="Copy order number"
                className="inline-flex h-5 w-5 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
                ) : (
                  <Copy className="h-3 w-3" strokeWidth={2.5} />
                )}
              </button>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-neutral-500 dark:text-neutral-400">
              <span>{formatDate(display.createdAt)}</span>
              <span className="h-0.5 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span>
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
              <span className="h-0.5 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span className="inline-flex items-center gap-1">
                <PaymentIcon className="h-3 w-3" strokeWidth={2.4} />
                {display.paymentMethod === "cod"
                  ? "COD"
                  : display.paymentMethod === "card"
                  ? "Card"
                  : "Wallet"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <p className="or-num text-[15px] font-black tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-base">
                {formatPKR(display.totals.total)}
              </p>
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text} ${meta.border}`}
              >
                {meta.label}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              strokeWidth={2.5}
            />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-neutral-100 dark:border-neutral-800"
            >
              <div className="space-y-5 p-4 sm:p-5">
                {detailLoading && (
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[11.5px] text-neutral-500 dark:bg-neutral-950/40 dark:text-neutral-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading latest details…
                  </div>
                )}

                <OrderTimeline
                  status={display.status}
                  history={display.statusHistory}
                />

                <div>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                    Items ({display.items.length})
                  </h4>
                  <ul className="space-y-2.5">
                    {display.items.map((item, i) => (
                      <li
                        key={`${item.productId}-${i}`}
                        className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-950/40"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                          <img
                            src={optimize(item.image, 200) || FALLBACK_IMG}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                            onError={(e) =>
                              (e.currentTarget.src = FALLBACK_IMG)
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                            {item.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                            {item.brand && <span>{item.brand}</span>}
                            {item.size && (
                              <>
                                <span className="h-0.5 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                <span>Size {item.size}</span>
                              </>
                            )}
                            <span className="h-0.5 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                            <span className="or-num">
                              {formatPKR(item.price)} × {item.qty}
                            </span>
                          </div>
                        </div>
                        <span className="or-num shrink-0 self-center text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                          {formatPKR((item.price || 0) * (item.qty || 1))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="h-3.5 w-3.5 text-neutral-400"
                        strokeWidth={2.4}
                      />
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                        {display.status === "delivered"
                          ? "Delivered to"
                          : "Shipping to"}
                      </h4>
                    </div>
                    <p className="mt-2 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                      {display.customer.fullName}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {display.address.line1}
                      {display.address.line2 && `, ${display.address.line2}`}
                      <br />
                      {display.address.city}, {display.address.province}{" "}
                      {display.address.postalCode}
                    </p>
                    {display.trackingNumber && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-cyan-50 px-2 py-1 text-[10.5px] font-bold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                        <Truck className="h-3 w-3" strokeWidth={2.4} />
                        <span className="or-num">
                          {display.trackingNumber}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                    <div className="flex items-center gap-2">
                      <Receipt
                        className="h-3.5 w-3.5 text-neutral-400"
                        strokeWidth={2.4}
                      />
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                        Summary
                      </h4>
                    </div>
                    <dl className="mt-2 space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <dt className="text-neutral-500 dark:text-neutral-400">
                          Subtotal
                        </dt>
                        <dd className="or-num font-semibold text-neutral-800 dark:text-neutral-200">
                          {formatPKR(display.totals.subtotal)}
                        </dd>
                      </div>
                      {display.totals.discount > 0 && (
                        <div className="flex justify-between text-[12px]">
                          <dt className="text-neutral-500 dark:text-neutral-400">
                            Discount
                            {display.couponCode
                              ? ` (${display.couponCode})`
                              : ""}
                          </dt>
                          <dd className="or-num font-semibold text-emerald-600 dark:text-emerald-400">
                            − {formatPKR(display.totals.discount)}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between text-[12px]">
                        <dt className="text-neutral-500 dark:text-neutral-400">
                          Shipping
                        </dt>
                        <dd className="or-num font-semibold text-neutral-800 dark:text-neutral-200">
                          {display.totals.shipping === 0
                            ? "Free"
                            : formatPKR(display.totals.shipping)}
                        </dd>
                      </div>
                      {display.totals.gst > 0 && (
                        <div className="flex justify-between text-[12px]">
                          <dt className="text-neutral-500 dark:text-neutral-400">
                            GST
                          </dt>
                          <dd className="or-num font-semibold text-neutral-800 dark:text-neutral-200">
                            {formatPKR(display.totals.gst)}
                          </dd>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800">
                        <dt className="text-[12.5px] font-bold text-neutral-900 dark:text-neutral-100">
                          Total
                        </dt>
                        <dd className="or-num text-[14px] font-black text-neutral-900 dark:text-neutral-100">
                          {formatPKR(display.totals.total)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {display.statusHistory.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                      History
                    </h4>
                    <ol className="relative space-y-3 border-l-2 border-dashed border-neutral-200 pl-5 dark:border-neutral-800">
                      {[...display.statusHistory]
                        .reverse()
                        .map((h, i) => {
                          const hm =
                            STATUS_META[h.status] || STATUS_META.pending;
                          return (
                            <li key={i} className="relative">
                              <span
                                className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-2 ring-white dark:ring-neutral-950 ${hm.bg}`}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${hm.bg} ${hm.text}`}
                                >
                                  {hm.label}
                                </span>
                                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                  {formatDate(h.at || h.date)}
                                </span>
                              </div>
                              {h.note && (
                                <p className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-400">
                                  {h.note}
                                </p>
                              )}
                            </li>
                          );
                        })}
                    </ol>
                  </div>
                )}

                {display.cancelledReason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                    <strong className="font-bold">Cancelled:</strong>{" "}
                    {display.cancelledReason}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {display.status === "delivered" && (
                    <button
                      type="button"
                      onClick={handleReorder}
                      className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2.5 text-[12px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.4} />
                      Buy again
                    </button>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmCancel(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2.5 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <XCircle className="h-3.5 w-3.5" strokeWidth={2.4} />
                      Cancel order
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefreshOne?.(order._id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Refresh
                  </button>
                  <Link
                    to="/contact"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-[12px] font-semibold text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    Need help?
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.li>

      <AnimatePresence>
        {confirmCancel && (
          <ConfirmDialog
            open
            destructive
            busy={cancelling}
            title="Cancel this order?"
            message={`Order ${display.orderNumber} will be cancelled. This cannot be undone. ${
              display.paymentStatus === "paid"
                ? "Any payment will be refunded to your original method."
                : ""
            }`}
            confirmLabel={cancelling ? "Cancelling…" : "Yes, cancel"}
            cancelLabel="Keep order"
            onConfirm={handleCancelConfirm}
            onCancel={() => !cancelling && setConfirmCancel(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
});

/* ════════════════════════════════════════════════════════════
   Empty state
   ════════════════════════════════════════════════════════════ */
const EmptyOrders = memo(function EmptyOrders({ hasFilters, onClearFilters }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md rounded-3xl border border-dashed border-neutral-300 bg-white/70 px-6 py-14 text-center dark:border-neutral-800 dark:bg-neutral-900/50 sm:px-10 sm:py-16"
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <Package className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
      </div>
      <h2 className="or-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {hasFilters ? "No orders match" : "No orders yet"}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-sm">
        {hasFilters
          ? "Try adjusting your filters or search to see more orders."
          : "When you place your first order, it'll appear here with full tracking."}
      </p>
      <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
        {hasFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            Clear filters
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   Skeleton
   ════════════════════════════════════════════════════════════ */
const SkeletonOrder = () => (
  <li className="flex items-center gap-4 rounded-2xl border border-neutral-200/70 bg-white p-4 dark:border-neutral-800/70 dark:bg-neutral-900 sm:p-5">
    <div className="h-12 w-12 shrink-0 rounded-2xl or-skeleton" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-32 rounded or-skeleton" />
      <div className="h-3 w-40 rounded or-skeleton" />
    </div>
    <div className="text-right">
      <div className="h-4 w-20 rounded or-skeleton" />
      <div className="mt-1 h-3 w-16 rounded or-skeleton" />
    </div>
  </li>
);

/* ════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════ */
const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  /* Auth from context (falls back to localStorage) */
  const { user: ctxUser } = getData();

  const currentUser = useMemo(() => {
    if (ctxUser) return ctxUser;
    return getCurrentUser();
  }, [ctxUser]);

  const loggedIn = useMemo(() => {
    return !!getToken() && !!currentUser;
  }, [currentUser]);

  /* "Just placed" toast after checkout */
  useEffect(() => {
    const justPlaced = location.state?.justPlaced;
    if (!justPlaced) return;
    toast.success(`Order ${justPlaced} placed successfully`, {
      description: "You'll get a confirmation email shortly.",
      duration: 5000,
    });
    navigate(location.pathname + location.search, {
      replace: true,
      state: {},
    });
  }, [location, navigate]);

  const query = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const [searchInput, setSearchInput] = useState(query);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [usingLocal, setUsingLocal] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

  /* Fetch orders — server + local merge (ownership enforced) */
  const fetchOrders = useCallback(async () => {
    if (!loggedIn) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/orders", {
        params: { page: 1, limit: 100, sort: "createdAt", dir: "desc" },
      });

      const data = Array.isArray(res?.data?.data) ? res.data.data : [];

      /* ─── Ownership guard on server response ─── */
      const normalized = data.map(normalizeOrder).filter(Boolean);
      const serverOrders = normalized.filter((o) =>
        isOwnedBy(o, currentUser)
      );
      if (serverOrders.length !== normalized.length) {
        console.warn(
          `[Orders] Dropped ${normalized.length - serverOrders.length} order(s) not owned by current user`
        );
      }

      const localRaw = readLS(LS_ORDERS, []);
      const localArr = Array.isArray(localRaw) ? localRaw : [];
      const localMine = filterMine(
        localArr.map(normalizeOrder).filter(Boolean),
        currentUser
      );

      if (!mountedRef.current) return;
      setOrders(mergeOrders(serverOrders, localMine));
      setUsingLocal(false);
    } catch (err) {
      if (!err?.response) {
        /* Server unreachable → local only (ownership filtered) */
        const localRaw = readLS(LS_ORDERS, []);
        const localArr = Array.isArray(localRaw) ? localRaw : [];
        const owned = filterMine(
          localArr.map(normalizeOrder).filter(Boolean),
          currentUser
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (!mountedRef.current) return;
        setOrders(owned);
        setUsingLocal(true);
        setError(null);
      } else {
        console.error("Fetch orders error:", err);
        if (!mountedRef.current) return;
        setError(
          err?.response?.data?.message || "Failed to load your orders"
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [loggedIn, currentUser]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, retryKey]);

  /* Auto-refresh when checkout fires the orders-update event */
  useEffect(() => {
    const onOrdersUpdate = () => setRetryKey((k) => k + 1);
    window.addEventListener(ORDERS_EVENT, onOrdersUpdate);
    return () => window.removeEventListener(ORDERS_EVENT, onOrdersUpdate);
  }, []);

  /* Refresh one (ownership enforced) */
  const refreshOne = useCallback(
    async (orderId) => {
      try {
        const res = await api.get(`/api/orders/${orderId}`);
        const fresh = normalizeOrder(res?.data?.data);
        if (!fresh) return;
        if (!isOwnedBy(fresh, currentUser)) {
          console.warn("[Orders] Refused to display unowned order");
          return;
        }
        setOrders((prev) =>
          prev.map((o) => (o._id === fresh._id ? fresh : o))
        );
      } catch {
        /* silent */
      }
    },
    [currentUser]
  );

  /* Update one in-place after cancel (ownership enforced) */
  const updateOne = useCallback(
    (updated) => {
      if (!updated) return;
      if (!isOwnedBy(updated, currentUser)) return;
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
    },
    [currentUser]
  );

  /* Filter + search (search runs on already-owned list) */
  const filtered = useMemo(() => {
    let list = [...orders];
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.customer?.fullName || "").toLowerCase().includes(q) ||
          (o.customer?.email || "").toLowerCase().includes(q) ||
          (o.customer?.phone || "").toLowerCase().includes(q) ||
          o.items.some((item) => item.name?.toLowerCase().includes(q)) ||
          o.items.some((item) => item.brand?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, statusFilter, query]);

  /* Stats */
  const stats = useMemo(
    () => ({
      total: orders.length,
      active: orders.filter((o) =>
        ["confirmed", "processing", "shipped"].includes(o.status)
      ).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    }),
    [orders]
  );

  /* Reorder */
  const handleReorder = useCallback(
    (order) => {
      if (!isOwnedBy(order, currentUser)) return;
      try {
        const existing = readLS(LS_CART, []);
        const cart = Array.isArray(existing) ? [...existing] : [];
        order.items.forEach((item) => {
          const id = `${item.productId}__${item.size || "one"}`;
          const found = cart.find((c) => c.id === id);
          if (found) {
            found.qty = Math.min(99, (found.qty || 0) + (item.qty || 1));
          } else {
            cart.push({
              id,
              productId: item.productId,
              name: item.name,
              brand: item.brand,
              image: item.image,
              price: item.price,
              size: item.size || null,
              qty: item.qty || 1,
              addedAt: Date.now(),
            });
          }
        });
        writeLS(LS_CART, cart);
        window.dispatchEvent(new Event(CART_EVENT));
        toast.success("Items added to your bag", {
          action: {
            label: "View bag",
            onClick: () => navigate("/cart"),
          },
          duration: 4000,
        });
      } catch {
        toast.error("Couldn't add items to bag");
      }
    },
    [navigate, currentUser]
  );

  /* Filter updaters */
  const setStatus = useCallback(
    (s) => {
      const next = new URLSearchParams(searchParams);
      if (s === "all") next.delete("status");
      else next.set("status", s);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setSearchInput("");
  }, [setSearchParams]);

  /* ─── Render ─── */

  if (!loggedIn) {
    return (
      <div className="or-hd-root min-h-dvh bg-neutral-50/60 pb-16 dark:bg-neutral-950">
        <style>{HD_CSS}</style>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:px-8 lg:px-10">
          <LoginRequiredScreen />
        </div>
      </div>
    );
  }

  const hasFilters = statusFilter !== "all" || query !== "";

  return (
    <div className="or-hd-root min-h-dvh bg-neutral-50/60 pb-16 dark:bg-neutral-950">
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
              My Orders
            </span>
          </nav>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 sm:text-[12px]"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.4} />
            Continue shopping
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
                My Account
              </span>
            </div>
            <h1 className="or-serif mt-3 text-[clamp(1.9rem,1.3rem+2.4vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
              Track Your Orders
            </h1>
            <p className="mt-2 text-[13px] text-neutral-500 dark:text-neutral-400 sm:text-[13.5px]">
              {loading
                ? "Loading your orders…"
                : stats.total === 0
                ? "You haven't placed any orders yet"
                : `${stats.total} order${
                    stats.total === 1 ? "" : "s"
                  } · ${stats.active} active · ${stats.delivered} delivered`}
              {usingLocal && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  <Info className="h-3 w-3" strokeWidth={2.5} />
                  Offline
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            aria-label="Refresh orders"
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              strokeWidth={2.4}
            />
            Refresh
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 md:px-8 lg:px-10">
        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            strokeWidth={2.4}
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order #, product, name, email, phone…"
            aria-label="Search orders"
            className="w-full rounded-full border border-neutral-200 bg-white pl-10 pr-10 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-100"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                const next = new URLSearchParams(searchParams);
                next.delete("q");
                setSearchParams(next, { replace: true });
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div
          role="tablist"
          aria-label="Filter by order status"
          className="mt-4 -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          <div className="flex gap-2">
            {STATUS_FILTERS.map((s) => {
              const active = statusFilter === s;
              const label = s === "all" ? "All orders" : STATUS_META[s].label;
              const count =
                s === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === s).length;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(s)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                    active
                      ? "border-transparent bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        active
                          ? "bg-white/20 text-white dark:bg-neutral-900/20 dark:text-neutral-900"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
              strokeWidth={2.4}
            />
            <div className="flex-1 text-[12.5px] text-red-700 dark:text-red-300">
              {error}
            </div>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="shrink-0 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <ul className="space-y-3" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonOrder key={i} />
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <EmptyOrders
              hasFilters={hasFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <ul className="space-y-3" aria-label="Your orders">
              <AnimatePresence initial={false}>
                {filtered.map((order, idx) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    index={idx}
                    currentUser={currentUser}
                    onReorder={handleReorder}
                    onCancel={updateOne}
                    onRefreshOne={refreshOne}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="mt-8 text-center text-[11.5px] text-neutral-400">
            Showing {filtered.length} of {orders.length} order
            {orders.length === 1 ? "" : "s"}
            {hasFilters && " · filtered"}
          </p>
        )}
      </main>
    </div>
  );
};

export default Orders;