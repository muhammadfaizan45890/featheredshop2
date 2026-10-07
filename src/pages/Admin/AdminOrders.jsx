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
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Eye,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  User,
  CreditCard,
  Banknote,
  Wallet,
  Receipt,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Calendar,
  MoreVertical,
  MessageSquare,
  Save,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import API from "@/utils/api";

/* ════════════════════════════════════════════════════════════
   HD CSS — same language across the app
   ════════════════════════════════════════════════════════════ */
const HD_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");

  .ao-hd-root {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    -webkit-tap-highlight-color: transparent;
  }
  .ao-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    letter-spacing: -0.02em;
  }
  .ao-num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "kern" 1;
  }
  .ao-hd-root :focus-visible { outline: 2px solid #171717; outline-offset: 2px; }
  .dark .ao-hd-root :focus-visible { outline-color: #fafafa; }
  .ao-rail::-webkit-scrollbar { display: none; }
  .ao-rail { scrollbar-width: none; -ms-overflow-style: none; }

  .ao-skeleton {
    background: linear-gradient(90deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.05) 100%);
    background-size: 200% 100%;
    animation: ao-shimmer 1.4s ease-in-out infinite;
  }
  .dark .ao-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.05) 100%);
    background-size: 200% 100%;
  }
  @keyframes ao-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .ao-skeleton { animation: none; } }
`;

/* ════════════════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════════════════ */
const LS_ORDERS = "fs_orders";
const PAGE_SIZE = 15;

const STATUS_META = {
  pending: { label: "Pending", color: "#F59E0B", Icon: Clock, bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/50" },
  confirmed: { label: "Confirmed", color: "#3B82F6", Icon: CheckCircle2, bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900/50" },
  processing: { label: "Processing", color: "#8B5CF6", Icon: Package, bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-400", border: "border-violet-200 dark:border-violet-900/50" },
  shipped: { label: "Shipped", color: "#06B6D4", Icon: Truck, bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-900/50" },
  delivered: { label: "Delivered", color: "#10B981", Icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/50" },
  cancelled: { label: "Cancelled", color: "#EF4444", Icon: XCircle, bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900/50" },
  returned: { label: "Returned", color: "#737373", Icon: AlertCircle, bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-700 dark:text-neutral-300", border: "border-neutral-200 dark:border-neutral-700" },
};

const PAYMENT_META = {
  pending: { label: "Unpaid", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  paid: { label: "Paid", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  failed: { label: "Failed", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40" },
  refunded: { label: "Refunded", color: "text-neutral-700 dark:text-neutral-300", bg: "bg-neutral-100 dark:bg-neutral-800" },
};

const PAYMENT_ICONS = {
  cod: Banknote,
  card: CreditCard,
  wallet: Wallet,
};

const STATUS_OPTIONS = Object.keys(STATUS_META);
const PAYMENT_STATUS_OPTIONS = Object.keys(PAYMENT_META);

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
    hour: "2-digit",
    minute: "2-digit",
  });
};

const relativeTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* ─── Safe LS ─────────────────────────────────────── */
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
const getUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const isAdmin = () => {
  const u = getUser();
  return !!u && (u.role === "admin" || u.isAdmin === true);
};

/* ─── API ─────────────────────────────────────────── */
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
  if (!instance.__adminOrdersAuthAttached) {
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
    instance.__adminOrdersAuthAttached = true;
  }
  return instance;
};
const api = getApiInstance();

/* ─── Normalize orders (works with server or local) ─── */
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
    updatedAt: raw.updatedAt || raw.createdAt,
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
    adminNotes: raw.adminNotes || "",
    trackingNumber: raw.trackingNumber || "",
    statusHistory: raw.statusHistory || [],
  };
};

/* ════════════════════════════════════════════════════════════
   Small UI pieces
   ════════════════════════════════════════════════════════════ */
const StatusPill = memo(function StatusPill({ status, size = "md" }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.Icon;
  const sizeCls =
    size === "sm"
      ? "h-6 px-2 text-[10.5px] gap-1"
      : "h-7 px-2.5 text-[11.5px] gap-1.5";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold ${meta.bg} ${meta.text} ${meta.border} ${sizeCls}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.6} />
      {meta.label}
    </span>
  );
});

const PaymentPill = memo(function PaymentPill({ status }) {
  const meta = PAYMENT_META[status] || PAYMENT_META.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${meta.bg} px-2 py-0.5 text-[10.5px] font-bold ${meta.color}`}
    >
      {meta.label}
    </span>
  );
});

const StatCard = memo(function StatCard({ icon: Icon, label, value, sub, accent = "neutral", delay = 0 }) {
  const accentMap = {
    neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    red: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">
            {label}
          </p>
          <p className="ao-num mt-2 text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {sub}
            </p>
          )}
        </div>
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentMap[accent]}`}>
          <Icon className="h-4 w-4" strokeWidth={2.4} />
        </span>
      </div>
    </motion.div>
  );
});

const SkeletonRow = () => (
  <tr className="border-b border-neutral-100 dark:border-neutral-800">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 w-full rounded ao-skeleton" />
      </td>
    ))}
  </tr>
);

/* ════════════════════════════════════════════════════════════
   Order details drawer
   ════════════════════════════════════════════════════════════ */
const OrderDrawer = memo(function OrderDrawer({ order, onClose, onUpdate, onDelete }) {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState("items");
  const [statusDraft, setStatusDraft] = useState(order.status);
  const [paymentDraft, setPaymentDraft] = useState(order.paymentStatus);
  const [trackingDraft, setTrackingDraft] = useState(order.trackingNumber || "");
  const [notesDraft, setNotesDraft] = useState(order.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const ref = useRef(null);

  /* Focus trap + Esc + scroll lock */
  useEffect(() => {
    const prev = document.activeElement;
    const body = document.body;
    const orig = { overflow: body.style.overflow, pr: body.style.paddingRight };
    const sb = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (sb > 0) body.style.paddingRight = `${sb}px`;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    setTimeout(() => ref.current?.focus?.(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = orig.overflow;
      body.style.paddingRight = orig.pr;
      prev?.focus?.();
    };
  }, [onClose]);

  const copyOrderNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success("Order number copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [order.orderNumber]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onUpdate(order._id, {
        status: statusDraft,
        paymentStatus: paymentDraft,
        trackingNumber: trackingDraft,
      });
      if (notesDraft !== order.adminNotes) {
        await onUpdate(order._id, { adminNotes: notesDraft }, { notesOnly: true });
      }
      toast.success("Order updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  }, [order, statusDraft, paymentDraft, trackingDraft, notesDraft, onUpdate]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const meta = STATUS_META[order.status] || STATUS_META.pending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.orderNumber}`}
      className="fixed inset-0 z-[100] flex justify-end"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <motion.aside
        ref={ref}
        tabIndex={-1}
        initial={reduceMotion ? false : { x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 34, stiffness: 340 }}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:max-w-2xl"
      >
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 p-4 dark:border-neutral-800 sm:p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">
                Order
              </span>
              <StatusPill status={order.status} size="sm" />
            </div>
            <button
              onClick={copyOrderNumber}
              className="group mt-1.5 inline-flex items-center gap-2 text-left"
            >
              <span className="ao-num truncate text-base font-black tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-lg">
                {order.orderNumber}
              </span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
              ) : (
                <Copy className="h-3.5 w-3.5 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2.5} />
              )}
            </button>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              {formatDate(order.createdAt)} · {relativeTime(order.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print order"
              className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Printer className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(order._id)}
              aria-label="Delete order"
              className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav
          role="tablist"
          aria-label="Order details"
          className="flex shrink-0 items-center gap-1 border-b border-neutral-100 px-2 dark:border-neutral-800 sm:px-3"
        >
          {[
            { id: "items", label: "Items" },
            { id: "customer", label: "Customer" },
            { id: "shipping", label: "Shipping" },
            { id: "notes", label: "Notes" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`relative px-3 py-3 text-[12.5px] font-semibold transition-colors ${
                  active
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                {t.label}
                {active && (
                  <motion.span
                    layoutId="ao-active-tab"
                    className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-neutral-900 dark:bg-neutral-100"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* ITEMS */}
          {tab === "items" && (
            <div>
              <ul className="space-y-3">
                {order.items.map((item, i) => (
                  <li
                    key={`${item.productId}-${i}`}
                    className="flex gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-950/40"
                  >
                    {item.image ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                        <img
                          src={item.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                        <Package className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100">
                        {item.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-neutral-500 dark:text-neutral-400">
                        {item.brand && <span>{item.brand}</span>}
                        {item.size && <span>Size {item.size}</span>}
                        <span className="ao-num">{formatPKR(item.price)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-neutral-100 dark:text-neutral-900">
                          × {item.qty}
                        </span>
                        <span className="ao-num text-[13px] font-black text-neutral-900 dark:text-neutral-100">
                          {formatPKR((item.price || 0) * (item.qty || 1))}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="mt-5 rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                  Order total
                </h4>
                <dl className="mt-3 space-y-1.5">
                  {[
                    ["Subtotal", formatPKR(order.totals.subtotal)],
                    order.totals.discount > 0 && [
                      `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`,
                      `− ${formatPKR(order.totals.discount)}`,
                      true,
                    ],
                    ["Shipping", order.totals.shipping === 0 ? "Free" : formatPKR(order.totals.shipping), false, order.totals.shipping === 0],
                    ["GST (5%)", formatPKR(order.totals.gst)],
                    ["Total", formatPKR(order.totals.total), false, false, true],
                  ]
                    .filter(Boolean)
                    .map((row, i) => {
                      const [label, value, isDiscount, isAccent, isTotal] = row;
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between gap-3 ${
                            isTotal
                              ? "border-t border-neutral-200 pt-2.5 mt-2.5 dark:border-neutral-800"
                              : ""
                          }`}
                        >
                          <dt
                            className={`text-[12.5px] ${
                              isTotal
                                ? "font-bold text-neutral-900 dark:text-neutral-100"
                                : "text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            {label}
                          </dt>
                          <dd
                            className={`ao-num text-[13px] ${
                              isTotal
                                ? "text-base font-black text-neutral-900 dark:text-neutral-100"
                                : isDiscount || isAccent
                                ? "font-bold text-emerald-600 dark:text-emerald-400"
                                : "font-semibold text-neutral-800 dark:text-neutral-200"
                            }`}
                          >
                            {value}
                          </dd>
                        </div>
                      );
                    })}
                </dl>
              </div>
            </div>
          )}

          {/* CUSTOMER */}
          {tab === "customer" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                  Contact
                </h4>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <User className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={2.4} />
                    <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                      {order.customer.fullName}
                    </span>
                  </div>
                  <a
                    href={`mailto:${order.customer.email}`}
                    className="flex items-center gap-2.5 text-[12.5px] text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                    <span className="truncate">{order.customer.email}</span>
                  </a>
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="flex items-center gap-2.5 text-[12.5px] text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                    <span className="ao-num">{order.customer.phone}</span>
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                  Payment
                </h4>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[12.5px] text-neutral-600 dark:text-neutral-400">
                      {React.createElement(PAYMENT_ICONS[order.paymentMethod] || CreditCard, {
                        className: "h-3.5 w-3.5",
                        strokeWidth: 2.4,
                      })}
                      {order.paymentMethod === "cod"
                        ? "Cash on delivery"
                        : order.paymentMethod === "card"
                        ? "Credit / Debit card"
                        : "Mobile wallet"}
                    </span>
                    <PaymentPill status={order.paymentStatus} />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="text-neutral-600 dark:text-neutral-400">Shipping method</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
                      {order.shippingMethod}
                    </span>
                  </div>
                  {order.trackingNumber && (
                    <div className="flex items-center justify-between gap-3 text-[12.5px]">
                      <span className="text-neutral-600 dark:text-neutral-400">Tracking</span>
                      <span className="ao-num font-semibold text-neutral-900 dark:text-neutral-100">
                        {order.trackingNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SHIPPING */}
          {tab === "shipping" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                  Delivery address
                </h4>
                <div className="mt-3 flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={2.4} />
                  <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {order.address.line1}
                    {order.address.line2 && (
                      <>
                        <br />
                        {order.address.line2}
                      </>
                    )}
                    <br />
                    {order.address.city}, {order.address.province} {order.address.postalCode}
                    <br />
                    {order.address.country}
                  </p>
                </div>
              </div>

              {/* Update status form */}
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                  Update status
                </h4>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-neutral-700 dark:text-neutral-300">
                      Order status
                    </label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-neutral-700 dark:text-neutral-300">
                      Payment status
                    </label>
                    <select
                      value={paymentDraft}
                      onChange={(e) => setPaymentDraft(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100"
                    >
                      {PAYMENT_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {PAYMENT_META[s].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-neutral-700 dark:text-neutral-300">
                      Tracking number
                    </label>
                    <input
                      type="text"
                      value={trackingDraft}
                      onChange={(e) => setTrackingDraft(e.target.value)}
                      placeholder="e.g. TCS-123456789"
                      className="ao-num w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-100"
                    />
                  </div>
                </div>
              </div>

              {/* Status history */}
              {order.statusHistory?.length > 0 && (
                <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                    History
                  </h4>
                  <ol className="mt-3 space-y-3">
                    {[...order.statusHistory].reverse().map((h, i) => {
                      const m = STATUS_META[h.status] || STATUS_META.pending;
                      const Icon = m.Icon;
                      return (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${m.bg} ${m.text}`}>
                            <Icon className="h-3 w-3" strokeWidth={2.6} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-semibold text-neutral-900 dark:text-neutral-100">
                              {m.label}
                            </p>
                            <p className="text-[11px] text-neutral-400">
                              {formatDate(h.at)}
                              {h.note && ` · ${h.note}`}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* NOTES */}
          {tab === "notes" && (
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Internal notes
              </label>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={6}
                placeholder="Add notes visible only to your team…"
                className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-3.5 text-[13px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-100"
              />
              <p className="mt-1.5 text-[11px] text-neutral-400">
                Notes are saved when you click "Save changes" below.
              </p>
            </div>
          )}
        </div>

        {/* Footer — Save */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" strokeWidth={2.5} />
                Save changes
              </>
            )}
          </button>
        </footer>
      </motion.aside>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   Main — AdminOrders
   ════════════════════════════════════════════════════════════ */
const AdminOrders = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  /* Gate: admin only */
  const admin = useMemo(() => isAdmin(), []);
  const loggedIn = useMemo(() => isLoggedIn(), []);

  /* Data */
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingLocal, setUsingLocal] = useState(false);

  /* Filters + sort + pagination */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  /* Selected order drawer */
  const [selected, setSelected] = useState(null);

  /* Debounced search */
  const [searchDebounced, setSearchDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* Reset page on filter change */
  useEffect(() => {
    setPage(1);
  }, [searchDebounced, statusFilter, paymentFilter, sortBy, sortDir]);

  /* Fetch orders + stats */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (admin && loggedIn) {
        const res = await api.get("/api/orders", {
          params: {
            page,
            limit: PAGE_SIZE,
            search: searchDebounced,
            status: statusFilter,
            paymentStatus: paymentFilter,
            sort: sortBy,
            dir: sortDir,
          },
        });

        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        const pag = res?.data?.pagination || {};

        setOrders(data.map(normalizeOrder));
        setTotal(pag.total || data.length);
        setHasMore(!!pag.hasMore);
        setUsingLocal(false);

        /* Load stats separately */
        try {
          const statsRes = await api.get("/api/orders/stats");
          setStats(statsRes?.data?.data || null);
        } catch (e) {
          // Non-fatal
        }
      } else {
        /* Fallback: read local orders from fs_orders (guest/checkout-placed) */
        const local = readLS(LS_ORDERS, []);
        const normalized = (Array.isArray(local) ? local : []).map(normalizeOrder);
        const filtered = normalized.filter((o) => {
          if (statusFilter && o.status !== statusFilter) return false;
          if (paymentFilter && o.paymentStatus !== paymentFilter) return false;
          if (searchDebounced) {
            const q = searchDebounced.toLowerCase();
            return (
              o.orderNumber.toLowerCase().includes(q) ||
              o.customer.fullName?.toLowerCase().includes(q) ||
              o.customer.email?.toLowerCase().includes(q) ||
              o.customer.phone?.toLowerCase().includes(q)
            );
          }
          return true;
        });

        const sorted = [...filtered].sort((a, b) => {
          const av = a[sortBy];
          const bv = b[sortBy];
          if (sortBy === "createdAt") {
            const d = new Date(a.createdAt) - new Date(b.createdAt);
            return sortDir === "asc" ? d : -d;
          }
          if (typeof av === "string") {
            return sortDir === "asc"
              ? av.localeCompare(bv)
              : bv.localeCompare(av);
          }
          return sortDir === "asc" ? av - bv : bv - av;
        });

        const start = (page - 1) * PAGE_SIZE;
        const paged = sorted.slice(start, start + PAGE_SIZE);

        setOrders(paged);
        setTotal(sorted.length);
        setHasMore(start + paged.length < sorted.length);
        setUsingLocal(true);
        setStats(null);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, statusFilter, paymentFilter, sortBy, sortDir, admin, loggedIn]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* Update order */
  const handleUpdate = useCallback(
    async (id, patch, opts = {}) => {
      /* Optimistic */
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, ...patch } : o))
      );
      setSelected((prev) => (prev && prev._id === id ? { ...prev, ...patch } : prev));

      if (!usingLocal && admin && loggedIn) {
        if (opts.notesOnly) {
          await api.patch(`/api/orders/${id}/notes`, {
            adminNotes: patch.adminNotes,
          });
        } else {
          await api.patch(`/api/orders/${id}/status`, patch);
        }
      } else {
        /* Persist to fs_orders */
        const all = readLS(LS_ORDERS, []);
        const next = (Array.isArray(all) ? all : []).map((o) =>
          (o._id || o.orderNumber) === id ? { ...o, ...patch } : o
        );
        writeLS(LS_ORDERS, next);
      }
    },
    [usingLocal, admin, loggedIn]
  );

  /* Delete order */
  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this order permanently?")) return;
      try {
        if (!usingLocal && admin && loggedIn) {
          await api.delete(`/api/orders/${id}`);
        } else {
          const all = readLS(LS_ORDERS, []);
          const next = (Array.isArray(all) ? all : []).filter(
            (o) => (o._id || o.orderNumber) !== id
          );
          writeLS(LS_ORDERS, next);
        }
        setOrders((prev) => prev.filter((o) => o._id !== id));
        setSelected(null);
        toast.success("Order deleted");
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to delete");
      }
    },
    [usingLocal, admin, loggedIn]
  );

  /* Refresh */
  const refresh = useCallback(() => {
    fetchOrders();
    toast.success("Orders refreshed");
  }, [fetchOrders]);

  /* Export CSV */
  const exportCSV = useCallback(() => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = [
      "Order Number",
      "Date",
      "Customer",
      "Email",
      "Phone",
      "City",
      "Province",
      "Items",
      "Subtotal",
      "Discount",
      "Shipping",
      "GST",
      "Total",
      "Payment",
      "Status",
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      formatDate(o.createdAt),
      o.customer.fullName,
      o.customer.email,
      o.customer.phone,
      o.address.city,
      o.address.province,
      o.items.reduce((s, i) => s + (i.qty || 0), 0),
      o.totals.subtotal,
      o.totals.discount,
      o.totals.shipping,
      o.totals.gst,
      o.totals.total,
      o.paymentMethod,
      o.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `featheredshop-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }, [orders]);

  /* ─── Auth gate ─────────────────────────────── */
  if (!loggedIn || !admin) {
    return (
      <div className="ao-hd-root flex min-h-dvh items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
        <style>{HD_CSS}</style>
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
            <AlertCircle className="h-7 w-7 text-red-500" strokeWidth={1.5} />
          </div>
          <h1 className="ao-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            {loggedIn ? "Admin access required" : "Please log in"}
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            {loggedIn
              ? "You don't have permission to view this page."
              : "Log in with your admin account to manage orders."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
              Go home
            </Link>
            {!loggedIn && (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search || statusFilter || paymentFilter;

  return (
    <div className="ao-hd-root min-h-dvh bg-neutral-50/60 pb-10 dark:bg-neutral-950">
      <style>{HD_CSS}</style>

      {/* Header */}
      <header className="border-b border-neutral-200/70 bg-white dark:border-neutral-800/70 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 sm:pt-10 md:px-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-px w-8 bg-zinc-900 dark:bg-white" />
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-600 dark:text-neutral-400">
                  Admin · Orders
                </span>
              </div>
              <h1 className="ao-serif mt-3 text-[clamp(1.9rem,1.3rem+2.4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                Orders
              </h1>
              <p className="mt-2 text-[13px] text-neutral-500 dark:text-neutral-400 sm:text-[13.5px]">
                {total.toLocaleString()} order{total === 1 ? "" : "s"}
                {hasFilters && " · filtered"}
                {usingLocal && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    Local data
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={refresh}
                aria-label="Refresh orders"
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2.4} />
                Refresh
              </button>
              <button
                type="button"
                onClick={exportCSV}
                disabled={orders.length === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 md:px-8 lg:px-10">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            <StatCard icon={ShoppingBag} label="Total Orders" value={stats.counts.total.toLocaleString()} sub={`${stats.counts.today} today`} delay={0.02} />
            <StatCard icon={Clock} label="Pending" value={stats.counts.pending.toLocaleString()} sub="Awaiting action" accent="amber" delay={0.06} />
            <StatCard icon={Package} label="Processing" value={stats.counts.processing.toLocaleString()} sub="Being prepared" accent="violet" delay={0.1} />
            <StatCard icon={Truck} label="Shipped" value={stats.counts.shipped.toLocaleString()} sub="In transit" accent="blue" delay={0.14} />
            <StatCard icon={TrendingUp} label="Revenue" value={formatPKR(stats.revenue.allTime)} sub={`${formatPKR(stats.revenue.month)} this month`} accent="emerald" delay={0.18} />
          </div>
        )}

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={2.4} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer, email, phone…"
              aria-label="Search orders"
              className="w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-neutral-700 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:focus:border-neutral-100"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>

          {/* Payment filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="Filter by payment"
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-neutral-700 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:focus:border-neutral-100"
          >
            <option value="">All payments</option>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_META[s].label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split(":");
              setSortBy(sb);
              setSortDir(sd);
            }}
            aria-label="Sort orders"
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-neutral-700 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:focus:border-neutral-100"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="totals.total:desc">Highest total</option>
            <option value="totals.total:asc">Lowest total</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPaymentFilter("");
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
              Clear
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" strokeWidth={2.4} />
            <div className="flex-1 text-[12.5px] text-red-700 dark:text-red-300">
              {error}
            </div>
            <button
              type="button"
              onClick={refresh}
              className="shrink-0 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
            >
              Retry
            </button>
          </div>
        )}

        {/* Orders table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800/80 dark:bg-neutral-900">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full">
              <thead className="border-b border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-950/40">
                <tr>
                  {["Order", "Customer", "Items", "Total", "Payment", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <Package className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
                      </div>
                      <p className="mt-3 text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
                        {hasFilters ? "No orders match these filters" : "No orders yet"}
                      </p>
                      <p className="mt-1 text-[12px] text-neutral-400">
                        {hasFilters ? "Try clearing filters" : "New orders will appear here"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const itemCount = o.items.reduce((s, i) => s + (i.qty || 0), 0);
                    return (
                      <tr
                        key={o._id}
                        onClick={() => setSelected(o)}
                        className="cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/60 dark:border-neutral-800 dark:hover:bg-neutral-950/40"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="ao-num text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                              {o.orderNumber}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {relativeTime(o.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="line-clamp-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                              {o.customer.fullName}
                            </span>
                            <span className="truncate text-[11.5px] text-neutral-400">
                              {o.customer.email}
                            </span>
                          </div>
                        </td>
                        <td className="ao-num whitespace-nowrap px-4 py-3.5 text-[13px] text-neutral-700 dark:text-neutral-300">
                          {itemCount}
                        </td>
                        <td className="ao-num whitespace-nowrap px-4 py-3.5 text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                          {formatPKR(o.totals.total)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <PaymentPill status={o.paymentStatus} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <StatusPill status={o.status} size="sm" />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <ChevronRight className="inline h-4 w-4 text-neutral-400" strokeWidth={2.4} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 lg:hidden">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex gap-3 p-4">
                  <div className="h-16 w-16 shrink-0 rounded-xl ao-skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded ao-skeleton" />
                    <div className="h-3 w-1/2 rounded ao-skeleton" />
                  </div>
                </li>
              ))
            ) : orders.length === 0 ? (
              <li className="py-16 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Package className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
                  {hasFilters ? "No orders match" : "No orders yet"}
                </p>
              </li>
            ) : (
              orders.map((o) => {
                const itemCount = o.items.reduce((s, i) => s + (i.qty || 0), 0);
                const firstItem = o.items[0];
                return (
                  <li key={o._id}>
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-950/40"
                    >
                      {firstItem?.image ? (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <img
                            src={firstItem.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <Package className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="ao-num truncate text-[12.5px] font-bold text-neutral-900 dark:text-neutral-100">
                            {o.orderNumber}
                          </span>
                          <StatusPill status={o.status} size="sm" />
                        </div>
                        <p className="mt-1 truncate text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
                          {o.customer.fullName}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="ao-num text-[13px] font-black text-neutral-900 dark:text-neutral-100">
                            {formatPKR(o.totals.total)}
                          </span>
                          <span className="text-[10.5px] text-neutral-400">
                            {itemCount} item{itemCount === 1 ? "" : "s"} · {relativeTime(o.createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <nav
            aria-label="Orders pagination"
            className="mt-5 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="ao-num text-[12.5px] text-neutral-500 dark:text-neutral-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
                Prev
              </button>
              <span className="ao-num rounded-full bg-neutral-100 px-3.5 py-2 text-[12px] font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
            </div>
          </nav>
        )}
      </main>

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <OrderDrawer
            key={selected._id}
            order={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;