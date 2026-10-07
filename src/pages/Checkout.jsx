/* eslint-disable no-unused-vars */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Lock,
  Shield,
  Truck,
  RotateCcw,
  Award,
  Tag,
  User,
  MapPin,
  Mail,
  Phone,
  Home,
  Building2,
  CreditCard,
  Wallet,
  Banknote,
  Package,
  Loader2,
  ChevronDown,
  Info,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Receipt,
  Copy,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import API from "@/utils/api";

/* ════════════════════════════════════════════════════════════
   HD CSS — same design language as Cart / ProductDetail
   ════════════════════════════════════════════════════════════ */
const HD_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Public+Sans:wght@400..800&display=swap");

  .co-hd-root {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  .co-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 0, "WONK" 0;
    letter-spacing: -0.02em;
  }
  .co-num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "kern" 1;
  }
  .co-hd-root :focus-visible { outline: 2px solid #171717; outline-offset: 2px; }
  .dark .co-hd-root :focus-visible { outline-color: #fafafa; }
`;

/* ════════════════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════════════════ */
const LS_CART = "fs_cart";
const LS_COUPON = "fs_cart_coupon";
const LS_ADDRESSES = "fs_checkout_addresses";
const LS_CUSTOMER = "fs_checkout_customer";
const LS_ORDERS = "fs_orders";
const LS_CART_SERVER = "fs_cart_server_snapshot";

const FREE_SHIP_THRESHOLD = 8000;
const SHIPPING_FLAT = 350;
const EXPRESS_SURCHARGE = 800;
const GST_RATE = 0.05;

const COUPONS = {
  FEATHER10: { type: "percent", value: 10, label: "10% off" },
  SAVE500: { type: "flat", value: 500, label: "Rs 500 off" },
  FREESHIP: { type: "freeship", value: 0, label: "Free shipping" },
};

const SHIPPING_METHODS = [
  { id: "standard", label: "Standard", sub: "2–4 business days", icon: Truck, surcharge: 0 },
  { id: "express", label: "Express", sub: "1–2 business days", icon: Sparkles, surcharge: EXPRESS_SURCHARGE },
];

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on delivery", sub: "Pay when your order arrives", icon: Banknote },
  { id: "card", label: "Credit / Debit card", sub: "Visa · Mastercard · UnionPay", icon: CreditCard },
  { id: "wallet", label: "Mobile wallet", sub: "JazzCash · EasyPaisa", icon: Wallet },
];

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
const removeLS = (key) => {
  try {
    localStorage.removeItem(key);
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
  if (!instance.__checkoutAuthAttached) {
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
    instance.__checkoutAuthAttached = true;
  }
  return instance;
};
const api = getApiInstance();

/* ─── Image optimizer ─────────────────────────────── */
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

/* ─── Validation ──────────────────────────────────── */
const validators = {
  fullName: (v) =>
    !v?.trim() ? "Full name is required" : v.trim().length < 2 ? "Name is too short" : null,
  email: (v) =>
    !v?.trim()
      ? "Email is required"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
      ? "Enter a valid email"
      : null,
  phone: (v) =>
    !v?.trim()
      ? "Phone is required"
      : !/^(\+92|0)?[0-9\s-]{10,15}$/.test(v.trim())
      ? "Enter a valid Pakistani phone"
      : null,
  addressLine1: (v) =>
    !v?.trim() ? "Street address is required" : v.trim().length < 5 ? "Address is too short" : null,
  city: (v) => (!v?.trim() ? "City is required" : null),
  province: (v) => (!v?.trim() ? "Province is required" : null),
  postalCode: (v) =>
    !v?.trim() ? "Postal code is required" : !/^\d{5}$/.test(v.trim()) ? "Use a 5-digit code" : null,
  cardNumber: (v) =>
    !v?.replace(/\s/g, "").trim()
      ? "Card number is required"
      : !/^\d{13,19}$/.test(v.replace(/\s/g, ""))
      ? "Enter a valid card number"
      : null,
  cardName: (v) => (!v?.trim() ? "Name on card is required" : null),
  cardExpiry: (v) => {
    if (!v?.trim()) return "Expiry is required";
    const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!m) return "Use MM/YY";
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) return "Invalid month";
    const now = new Date();
    const expiry = new Date(year, month, 0, 23, 59, 59);
    if (expiry < now) return "Card has expired";
    return null;
  },
  cardCvc: (v) =>
    !v?.trim() ? "CVC required" : !/^\d{3,4}$/.test(v.trim()) ? "3–4 digits" : null,
};

const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

/* ════════════════════════════════════════════════════════════
   Cart loader
   ════════════════════════════════════════════════════════════ */
const useCartLoader = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const loggedIn = useMemo(() => isLoggedIn(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (loggedIn) {
          const res = await api.get("/api/cart");
          const server = res?.data?.data?.items || [];
          if (!cancelled) {
            setItems(
              server.map((i) => ({
                id: `${i.productId}__${i.size || "one"}`,
                productId: i.productId,
                slug: i.slug,
                sku: i.sku,
                name: i.name,
                brand: i.brand,
                image: i.image,
                price: Number(i.price) || 0,
                size: i.size || null,
                qty: Number(i.qty) || 1,
              }))
            );
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
        console.warn("Cart load failed, falling back to local:", err?.message);
        const local = readLS(LS_CART, []);
        if (!cancelled) setItems(Array.isArray(local) ? local : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  return { items, loading, loggedIn };
};

/* ════════════════════════════════════════════════════════════
   Small UI pieces
   ════════════════════════════════════════════════════════════ */
const Field = memo(function Field({ label, required, error, hint, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 sm:text-[12px]">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-neutral-400">{hint}</p>
      ) : null}
    </div>
  );
});

const inputBase =
  "w-full rounded-xl border bg-white px-3.5 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0 transition-colors dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 sm:text-[13.5px]";

const inputCls = (error) =>
  `${inputBase} ${
    error
      ? "border-red-300 focus:border-red-500 dark:border-red-900/60"
      : "border-neutral-200 focus:border-neutral-900 dark:border-neutral-800 dark:focus:border-neutral-100"
  }`;

/* ════════════════════════════════════════════════════════════
   Step indicator
   ════════════════════════════════════════════════════════════ */
const Stepper = memo(function Stepper({ current, steps }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Checkout progress">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.id}>
            <li className="flex items-center gap-2">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors sm:h-8 sm:w-8 sm:text-[12px] ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`hidden text-[12px] font-semibold sm:inline ${
                  active ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </li>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px flex-1 transition-colors sm:w-8 sm:flex-none ${
                  done ? "bg-emerald-400" : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
});

/* ════════════════════════════════════════════════════════════
   Order summary sidebar
   ════════════════════════════════════════════════════════════ */
const SummaryRow = ({ label, value, muted, bold, accent }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span
      className={`text-[12.5px] ${
        muted ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-700 dark:text-neutral-300"
      } ${bold ? "font-semibold text-neutral-900 dark:text-neutral-100" : ""}`}
    >
      {label}
    </span>
    <span
      className={`co-num text-[13.5px] ${
        bold ? "font-bold text-neutral-900 dark:text-neutral-100" : ""
      } ${accent ? "font-bold text-emerald-600 dark:text-emerald-400" : ""} ${
        !bold && !accent ? "font-medium text-neutral-800 dark:text-neutral-200" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

const OrderSummarySidebar = memo(function OrderSummarySidebar({
  items,
  subtotal,
  discount,
  coupon,
  shipping,
  gst,
  total,
  itemCount,
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, 3);
  const more = Math.max(0, items.length - 3);

  return (
    <aside
      aria-label="Order summary"
      className="lg:sticky lg:top-[calc(var(--navbar-h,3.5rem)+1.5rem)] lg:self-start"
    >
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="co-serif text-xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
            Your order
          </h2>
          <span className="co-num text-[11.5px] font-semibold text-neutral-400">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </div>

        <ul className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {shown.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={optimize(item.image, 160) || FALLBACK_IMG}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                  />
                  <span className="co-num absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:bg-neutral-100 dark:text-neutral-900 dark:ring-neutral-900">
                    {item.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[12.5px] font-semibold text-neutral-900 dark:text-neutral-100">
                    {item.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-400">
                    {item.size && <span>Size {item.size}</span>}
                    {item.size && <span className="h-0.5 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />}
                    <span className="co-num">{formatPKR(item.price)}</span>
                  </p>
                </div>
                <span className="co-num shrink-0 text-[12.5px] font-bold text-neutral-900 dark:text-neutral-100">
                  {formatPKR((item.price || 0) * (item.qty || 1))}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {more > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            {expanded ? "Show less" : `Show ${more} more`}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              strokeWidth={2.5}
            />
          </button>
        )}

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

        <ul className="mt-5 grid grid-cols-2 gap-2 text-[10.5px] sm:text-[11px]">
          {[
            { icon: Lock, label: "Secure checkout" },
            { icon: RotateCcw, label: "30-day returns" },
            { icon: Truck, label: "Fast shipping" },
            { icon: Shield, label: "Buyer protection" },
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
   Success screen
   ════════════════════════════════════════════════════════════ */
const SuccessScreen = memo(function SuccessScreen({ order, onContinue }) {
  const [copied, setCopied] = useState(false);

  const copyNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success("Order number copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  }, [order.orderNumber]);

  const eta = useMemo(() => {
    const date = new Date();
    let added = 0;
    const target = order.shippingMethod === "express" ? 2 : 4;
    while (added < target) {
      date.setDate(date.getDate() + 1);
      const d = date.getDay();
      if (d !== 0 && d !== 6) added++;
    }
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [order.shippingMethod]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl"
    >
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 text-center dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-10">
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 sm:h-20 sm:w-20"
        >
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2.2} />
        </motion.div>

        <h1 className="co-serif text-3xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
          Order confirmed
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-[15px]">
          Thank you, {order.customer.fullName.split(" ")[0]}. We've sent a confirmation to{" "}
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {order.customer.email}
          </span>
          .
        </p>

        <div className="mt-7 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-950/40 sm:p-5">
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500">
                Order number
              </p>
              <p className="co-num mt-1 text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-xl">
                {order.orderNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={copyNumber}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[11.5px] font-semibold text-neutral-700 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800/80 dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.4} />
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Estimated delivery
              </p>
            </div>
            <p className="mt-2 text-[13.5px] font-semibold text-neutral-900 dark:text-neutral-100">
              {eta}
            </p>
            <p className="mt-0.5 text-[11.5px] text-neutral-400">
              {order.shippingMethod === "express" ? "Express · 1–2 business days" : "Standard · 2–4 business days"}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800/80 dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={2.4} />
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Shipping to
              </p>
            </div>
            <p className="mt-2 text-[13.5px] font-semibold text-neutral-900 dark:text-neutral-100">
              {order.customer.fullName}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              {order.address.line1}
              {order.address.line2 && `, ${order.address.line2}`}
              <br />
              {order.address.city}, {order.address.province} {order.address.postalCode}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-neutral-200/80 bg-white p-4 text-left dark:border-neutral-800/80 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Payment method
              </p>
              <p className="mt-1 text-[13.5px] font-semibold text-neutral-900 dark:text-neutral-100">
                {order.paymentMethod === "cod"
                  ? "Cash on delivery"
                  : order.paymentMethod === "card"
                  ? "Credit / Debit card"
                  : "Mobile wallet"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Total paid
              </p>
              <p className="co-num mt-1 text-base font-black text-neutral-900 dark:text-neutral-100">
                {formatPKR(order.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link
            to="/shop"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-[13.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2.4} />
            Continue shopping
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <Receipt className="h-4 w-4" strokeWidth={2.4} />
            View receipt
          </button>
        </div>
      </div>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   Main Checkout
   ════════════════════════════════════════════════════════════ */
const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const { items, loading, loggedIn } = useCartLoader();

  const [step, setStep] = useState(0);

  const [coupon, setCoupon] = useState(() => {
    const initial = location.state?.coupon;
    if (initial && COUPONS[initial]) {
      return { code: initial, ...COUPONS[initial] };
    }
    return readLS(LS_COUPON, null);
  });

  const savedCustomer = useMemo(() => readLS(LS_CUSTOMER, {}), []);
  const savedAddresses = useMemo(() => {
    const raw = readLS(LS_ADDRESSES, []);
    return Array.isArray(raw) ? raw : [];
  }, []);

  const [customer, setCustomer] = useState({
    fullName: savedCustomer.fullName || "",
    email: savedCustomer.email || "",
    phone: savedCustomer.phone || "",
  });

  const [address, setAddress] = useState({
    line1: savedCustomer.address?.line1 || "",
    line2: savedCustomer.address?.line2 || "",
    city: savedCustomer.address?.city || "",
    province: savedCustomer.address?.province || "",
    postalCode: savedCustomer.address?.postalCode || "",
    country: "Pakistan",
  });

  const [saveAddress, setSaveAddress] = useState(true);
  const [shippingMethod, setShippingMethod] = useState("standard");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [saveCard, setSaveCard] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [order, setOrder] = useState(null);
  const [successMode, setSuccessMode] = useState(false);

  const [fieldTouched, setFieldTouched] = useState({});

  const stepTopRef = useRef(null);
  useEffect(() => {
    if (stepTopRef.current && step > 0) {
      stepTopRef.current.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }, [step, reduceMotion]);

  /* ─── Totals ─── */
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
    if (coupon.type === "percent") return Math.round((subtotal * coupon.value) / 100);
    if (coupon.type === "flat") return Math.min(coupon.value, subtotal);
    return 0;
  }, [coupon, subtotal]);

  const baseShipping = useMemo(() => {
    if (items.length === 0) return 0;
    if (coupon?.type === "freeship") return 0;
    if (subtotal - discount >= FREE_SHIP_THRESHOLD) return 0;
    return SHIPPING_FLAT;
  }, [coupon, items.length, subtotal, discount]);

  const shipping = useMemo(() => {
    const surcharge =
      SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.surcharge || 0;
    return baseShipping + surcharge;
  }, [baseShipping, shippingMethod]);

  const gst = useMemo(
    () => Math.round((subtotal - discount) * GST_RATE),
    [subtotal, discount]
  );

  const total = Math.max(0, subtotal - discount + shipping + gst);

  /* ─── Validation ─── */
  const validateInfo = useCallback(() => {
    const errs = {};
    const e1 = validators.fullName(customer.fullName);
    const e2 = validators.email(customer.email);
    const e3 = validators.phone(customer.phone);
    if (e1) errs.fullName = e1;
    if (e2) errs.email = e2;
    if (e3) errs.phone = e3;
    return errs;
  }, [customer]);

  const validateAddress = useCallback(() => {
    const errs = {};
    const e1 = validators.addressLine1(address.line1);
    const e2 = validators.city(address.city);
    const e3 = validators.province(address.province);
    const e4 = validators.postalCode(address.postalCode);
    if (e1) errs.addressLine1 = e1;
    if (e2) errs.city = e2;
    if (e3) errs.province = e3;
    if (e4) errs.postalCode = e4;
    return errs;
  }, [address]);

  const validatePayment = useCallback(() => {
    if (paymentMethod !== "card") return {};
    const errs = {};
    const e1 = validators.cardNumber(card.number);
    const e2 = validators.cardName(card.name);
    const e3 = validators.cardExpiry(card.expiry);
    const e4 = validators.cardCvc(card.cvc);
    if (e1) errs.cardNumber = e1;
    if (e2) errs.cardName = e2;
    if (e3) errs.cardExpiry = e3;
    if (e4) errs.cardCvc = e4;
    return errs;
  }, [paymentMethod, card]);

  /* ─── Card input formatting ─── */
  const formatCardNumber = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 19)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExpiry = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  /* ─── Step transitions ─── */
  const goToStep = useCallback(
    (next) => {
      if (next > step) {
        if (step === 0) {
          const errs = validateInfo();
          if (Object.keys(errs).length) {
            setErrors(errs);
            setFieldTouched((prev) => ({ ...prev, fullName: true, email: true, phone: true }));
            toast.error("Please fix the highlighted fields");
            return;
          }
        } else if (step === 1) {
          const errs = validateAddress();
          if (Object.keys(errs).length) {
            setErrors(errs);
            setFieldTouched((prev) => ({
              ...prev,
              addressLine1: true,
              city: true,
              province: true,
              postalCode: true,
            }));
            toast.error("Please fix the highlighted fields");
            return;
          }
        }
      }
      setErrors({});
      setStep(next);
    },
    [step, validateInfo, validateAddress]
  );

  /* ═════════════════════════════════════════════════════════
     SUBMIT ORDER — now always hits the backend
     ═════════════════════════════════════════════════════════ */
  const handlePlaceOrder = useCallback(async () => {
    /* Final validation pass on all steps */
    const infoErrs = validateInfo();
    const addrErrs = validateAddress();
    const payErrs = validatePayment();
    const allErrs = { ...infoErrs, ...addrErrs, ...payErrs };

    if (Object.keys(allErrs).length) {
      setErrors(allErrs);
      if (Object.keys(infoErrs).length) setStep(0);
      else if (Object.keys(addrErrs).length) setStep(1);
      else setStep(2);
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);

    try {
      /* ─── Sanitize items so backend accepts them ─── */
      const sanitizedItems = items
        .map((i) => {
          const pid = i.productId || i._id;
          if (!pid) return null;
          return {
            productId: pid,
            name: i.name,
            brand: i.brand || "",
            image: i.image || "",
            size: i.size || null,
            qty: Number(i.qty) || 1,
            price: Number(i.price) || 0,
          };
        })
        .filter(Boolean);

      if (sanitizedItems.length === 0) {
        toast.error("Your bag is empty or has invalid items");
        setSubmitting(false);
        return;
      }

      /* ─── Build order payload ─── */
      const payload = {
        customer: {
          fullName: customer.fullName.trim(),
          email: customer.email.trim(),
          phone: customer.phone.trim(),
        },
        address: {
          line1: address.line1.trim(),
          line2: address.line2.trim(),
          city: address.city.trim(),
          province: address.province,
          postalCode: address.postalCode.trim(),
          country: address.country,
        },
        items: sanitizedItems,
        shippingMethod,
        paymentMethod,
        couponCode: coupon?.code || null,
        totals: { subtotal, discount, shipping, gst, total },
      };

      /* ─── Always submit to backend (guests allowed) ─── */
      let serverOrder = null;
      let networkFailure = false;

      try {
        const res = await api.post("/api/orders", payload);
        serverOrder = res?.data?.data;

        if (!serverOrder?.orderNumber) {
          throw new Error("Server did not return an order number");
        }
      } catch (err) {
        networkFailure = !err?.response;
        const message =
          err?.response?.data?.message ||
          (networkFailure
            ? "Network error — we'll save this order and sync later."
            : "Could not place your order.");

        /* If the server explicitly rejects it, DO NOT silently succeed */
        if (!networkFailure) {
          console.error("Order rejected by server:", err?.response?.data || err);
          toast.error(message);
          setSubmitting(false);
          return;
        }

        console.warn("Network error, using local fallback:", err?.message);
      }

      /* ─── Persist customer + address ─── */
      writeLS(LS_CUSTOMER, {
        fullName: customer.fullName.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        address: {
          line1: address.line1.trim(),
          line2: address.line2.trim(),
          city: address.city.trim(),
          province: address.province,
          postalCode: address.postalCode.trim(),
        },
      });

      if (saveAddress) {
        const key = `${address.line1}|${address.city}|${address.postalCode}`.toLowerCase();
        const existing = savedAddresses.some(
          (a) => `${a.line1}|${a.city}|${a.postalCode}`.toLowerCase() === key
        );
        if (!existing) {
          writeLS(LS_ADDRESSES, [
            {
              line1: address.line1.trim(),
              line2: address.line2.trim(),
              city: address.city.trim(),
              province: address.province,
              postalCode: address.postalCode.trim(),
              country: address.country,
            },
            ...savedAddresses,
          ].slice(0, 10));
        }
      }

      /* ─── Build final order object ─── */
      const orderNumber =
        serverOrder?.orderNumber ||
        `FS-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

      const finalOrder = {
        orderNumber,
        customer: payload.customer,
        address: payload.address,
        items: payload.items,
        shippingMethod,
        paymentMethod,
        totals: payload.totals,
        total,
        createdAt: serverOrder?.createdAt || new Date().toISOString(),
        serverId: serverOrder?._id || null,
        synced: !!serverOrder,
      };

      /* ─── Persist order locally for /orders ─── */
      const history = readLS(LS_ORDERS, []);
      writeLS(
        LS_ORDERS,
        [finalOrder, ...(Array.isArray(history) ? history : [])].slice(0, 50)
      );

      /* ─── Clear cart (local + server) ─── */
      writeLS(LS_CART, []);
      removeLS(LS_CART);
      removeLS(LS_COUPON);
      try {
        window.dispatchEvent(new Event("feathered:cart:update"));
      } catch {}

      if (loggedIn) {
        try {
          await api.delete("/api/cart");
        } catch (err) {
          console.warn("Cart clear failed:", err?.message);
        }
      }

      /* ─── Analytics ─── */
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "purchase",
          transaction_id: orderNumber,
          value: total,
          currency: "PKR",
          items: payload.items.map((i) => ({
            item_id: i.productId,
            item_name: i.name,
            quantity: i.qty,
            price: i.price,
          })),
        });
      } catch {}

      setOrder(finalOrder);
      setSuccessMode(true);

      if (serverOrder) {
        toast.success("Order placed successfully!", {
          description: `Order ${orderNumber} confirmed.`,
        });
      } else {
        toast.success("Order placed", {
          description: "Saved locally — we'll sync when you're back online.",
        });
      }
    } catch (err) {
      console.error("Order submission error:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    customer,
    address,
    items,
    shippingMethod,
    paymentMethod,
    coupon,
    subtotal,
    discount,
    shipping,
    gst,
    total,
    loggedIn,
    saveAddress,
    savedAddresses,
    validateInfo,
    validateAddress,
    validatePayment,
  ]);

  /* ═════════════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="co-hd-root min-h-dvh bg-neutral-50/60 pb-16 dark:bg-neutral-950">
        <style>{HD_CSS}</style>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8 lg:px-10">
          <div className="h-8 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
            <div className="space-y-4">
              <div className="h-32 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
              <div className="h-32 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
            </div>
            <div className="h-96 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
          </div>
        </div>
      </div>
    );
  }

  if (successMode && order) {
    return (
      <div className="co-hd-root min-h-dvh bg-neutral-50/60 pb-16 dark:bg-neutral-950">
        <style>{HD_CSS}</style>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-10 lg:py-20">
          <SuccessScreen order={order} onContinue={() => navigate("/orders")} />
        </div>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="co-hd-root min-h-dvh bg-neutral-50/60 pb-16 dark:bg-neutral-950">
        <style>{HD_CSS}</style>
        <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <ShoppingBag className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
          </div>
          <h1 className="co-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            Your bag is empty
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-sm">
            Add items to your bag before checking out.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-[13.5px] font-bold text-white transition-all hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: "info", label: "Information" },
    { id: "shipping", label: "Shipping" },
    { id: "payment", label: "Payment" },
  ];

  const canAdvance =
    step === 0
      ? customer.fullName && customer.email && customer.phone
      : step === 1
      ? address.line1 && address.city && address.province && address.postalCode
      : true;

  return (
    <div className="co-hd-root min-h-dvh bg-neutral-50/60 pb-24 dark:bg-neutral-950 lg:pb-10">
      <style>{HD_CSS}</style>

      {/* Breadcrumb + back */}
      <div className="border-b border-neutral-200/70 bg-white dark:border-neutral-800/70 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8 lg:px-10">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs"
          >
            <Link to="/" className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100">
              Home
            </Link>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <Link to="/cart" className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100">
              Bag
            </Link>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <span aria-current="page" className="font-medium text-neutral-900 dark:text-neutral-100">
              Checkout
            </span>
          </nav>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 sm:text-[12px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
            Back to bag
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 md:px-8 lg:px-10 lg:pt-12">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-px w-8 bg-zinc-900 dark:bg-white" />
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-600 dark:text-neutral-400">
                  Secure checkout
                </span>
              </div>
              <h1 className="co-serif mt-3 text-[clamp(1.9rem,1.3rem+2.4vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                Complete your order
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 sm:text-[11.5px]">
                SSL secured
              </span>
            </div>
          </div>

          <div ref={stepTopRef} className="scroll-mt-24 pt-2">
            <Stepper current={step} steps={steps} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 md:px-8 lg:px-10 lg:pt-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {/* STEP 0 — INFO */}
              {step === 0 && (
                <motion.section
                  key="step-info"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  aria-labelledby="step-info-heading"
                  className="space-y-5"
                >
                  {!loggedIn && (
                    <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={2.4} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-blue-900 dark:text-blue-200">
                          Checking out as guest
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-blue-800/80 dark:text-blue-300/70">
                          <Link
                            to="/login"
                            className="font-semibold underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100"
                          >
                            Log in
                          </Link>{" "}
                          to save your details and track this order.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-6">
                    <h2 id="step-info-heading" className="co-serif text-lg font-medium text-neutral-900 dark:text-neutral-100 sm:text-xl">
                      Contact information
                    </h2>
                    <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                      We'll use this to send your order updates.
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Full name"
                        required
                        error={fieldTouched.fullName && errors.fullName}
                        className="sm:col-span-2"
                      >
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={2.4} />
                          <input
                            type="text"
                            value={customer.fullName}
                            onChange={(e) => {
                              setCustomer({ ...customer, fullName: e.target.value });
                              if (errors.fullName)
                                setErrors((prev) => ({ ...prev, fullName: null }));
                            }}
                            onBlur={() => setFieldTouched((p) => ({ ...p, fullName: true }))}
                            placeholder="Ahmed Khan"
                            autoComplete="name"
                            className={`${inputCls(fieldTouched.fullName && errors.fullName)} pl-10`}
                          />
                        </div>
                      </Field>

                      <Field label="Email" required error={fieldTouched.email && errors.email}>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={2.4} />
                          <input
                            type="email"
                            value={customer.email}
                            onChange={(e) => {
                              setCustomer({ ...customer, email: e.target.value });
                              if (errors.email)
                                setErrors((prev) => ({ ...prev, email: null }));
                            }}
                            onBlur={() => setFieldTouched((p) => ({ ...p, email: true }))}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className={`${inputCls(fieldTouched.email && errors.email)} pl-10`}
                          />
                        </div>
                      </Field>

                      <Field
                        label="Phone"
                        required
                        error={fieldTouched.phone && errors.phone}
                        hint="We'll only use this for delivery updates"
                      >
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={2.4} />
                          <input
                            type="tel"
                            value={customer.phone}
                            onChange={(e) => {
                              setCustomer({ ...customer, phone: e.target.value });
                              if (errors.phone)
                                setErrors((prev) => ({ ...prev, phone: null }));
                            }}
                            onBlur={() => setFieldTouched((p) => ({ ...p, phone: true }))}
                            placeholder="+92 300 1234567"
                            autoComplete="tel"
                            className={`${inputCls(fieldTouched.phone && errors.phone)} pl-10`}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <Link
                      to="/cart"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Back to bag
                    </Link>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      disabled={!canAdvance}
                      className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-[13.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      Continue to shipping
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </motion.section>
              )}

              {/* STEP 1 — SHIPPING */}
              {step === 1 && (
                <motion.section
                  key="step-shipping"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  aria-labelledby="step-shipping-heading"
                  className="space-y-5"
                >
                  <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 id="step-shipping-heading" className="co-serif text-lg font-medium text-neutral-900 dark:text-neutral-100 sm:text-xl">
                          Shipping address
                        </h2>
                        <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                          Where should we deliver your order?
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Street address"
                        required
                        error={fieldTouched.addressLine1 && errors.addressLine1}
                        className="sm:col-span-2"
                      >
                        <div className="relative">
                          <Home className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={2.4} />
                          <input
                            type="text"
                            value={address.line1}
                            onChange={(e) => {
                              setAddress({ ...address, line1: e.target.value });
                              if (errors.addressLine1)
                                setErrors((prev) => ({ ...prev, addressLine1: null }));
                            }}
                            onBlur={() => setFieldTouched((p) => ({ ...p, addressLine1: true }))}
                            placeholder="House 12, Street 5, Block A"
                            autoComplete="address-line1"
                            className={`${inputCls(fieldTouched.addressLine1 && errors.addressLine1)} pl-10`}
                          />
                        </div>
                      </Field>

                      <Field label="Apartment, suite, etc." hint="Optional" className="sm:col-span-2">
                        <input
                          type="text"
                          value={address.line2}
                          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                          placeholder="Apartment 4B, Floor 3"
                          autoComplete="address-line2"
                          className={inputCls(false)}
                        />
                      </Field>

                      <Field label="City" required error={fieldTouched.city && errors.city}>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => {
                            setAddress({ ...address, city: e.target.value });
                            if (errors.city) setErrors((prev) => ({ ...prev, city: null }));
                          }}
                          onBlur={() => setFieldTouched((p) => ({ ...p, city: true }))}
                          placeholder="Karachi"
                          autoComplete="address-level2"
                          className={inputCls(fieldTouched.city && errors.city)}
                        />
                      </Field>

                      <Field label="Province" required error={fieldTouched.province && errors.province}>
                        <select
                          value={address.province}
                          onChange={(e) => {
                            setAddress({ ...address, province: e.target.value });
                            if (errors.province) setErrors((prev) => ({ ...prev, province: null }));
                          }}
                          onBlur={() => setFieldTouched((p) => ({ ...p, province: true }))}
                          autoComplete="address-level1"
                          className={`${inputCls(fieldTouched.province && errors.province)} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10`}
                          style={{
                            backgroundImage:
                              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                          }}
                        >
                          <option value="">Select province</option>
                          {PAKISTAN_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Postal code" required error={fieldTouched.postalCode && errors.postalCode}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={address.postalCode}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                            setAddress({ ...address, postalCode: v });
                            if (errors.postalCode)
                              setErrors((prev) => ({ ...prev, postalCode: null }));
                          }}
                          onBlur={() => setFieldTouched((p) => ({ ...p, postalCode: true }))}
                          placeholder="75500"
                          autoComplete="postal-code"
                          className={`${inputCls(fieldTouched.postalCode && errors.postalCode)} co-num`}
                          maxLength={5}
                        />
                      </Field>

                      <Field label="Country">
                        <input
                          type="text"
                          value="Pakistan"
                          disabled
                          className={`${inputCls(false)} cursor-not-allowed bg-neutral-50 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400`}
                        />
                      </Field>
                    </div>

                    <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-[13px] text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-950"
                      />
                      Save this address for next time
                    </label>
                  </div>

                  <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-6">
                    <h3 className="co-serif text-lg font-medium text-neutral-900 dark:text-neutral-100 sm:text-xl">
                      Shipping method
                    </h3>
                    <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                      Choose how quickly you'd like your order to arrive.
                    </p>

                    <div role="radiogroup" className="mt-5 space-y-2.5">
                      {SHIPPING_METHODS.map((method) => {
                        const Icon = method.icon;
                        const active = shippingMethod === method.id;
                        const price = baseShipping + method.surcharge;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setShippingMethod(method.id)}
                            className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                              active
                                ? "border-neutral-900 bg-neutral-50 shadow-sm dark:border-neutral-100 dark:bg-neutral-950"
                                : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
                            }`}
                          >
                            <span
                              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                active
                                  ? "border-neutral-900 dark:border-neutral-100"
                                  : "border-neutral-300 dark:border-neutral-600"
                              }`}
                            >
                              {active && (
                                <span className="h-2.5 w-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                              )}
                            </span>
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                              <Icon className="h-4 w-4" strokeWidth={2.4} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100">
                                {method.label}
                              </p>
                              <p className="mt-0.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">
                                {method.sub}
                              </p>
                            </div>
                            <span className="co-num shrink-0 text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                              {price === 0 ? "Free" : formatPKR(price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => goToStep(0)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      disabled={!canAdvance}
                      className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-[13.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      Continue to payment
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </motion.section>
              )}

              {/* STEP 2 — PAYMENT */}
              {step === 2 && (
                <motion.section
                  key="step-payment"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  aria-labelledby="step-payment-heading"
                  className="space-y-5"
                >
                  <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800/80 dark:bg-neutral-900 sm:p-6">
                    <h2 id="step-payment-heading" className="co-serif text-lg font-medium text-neutral-900 dark:text-neutral-100 sm:text-xl">
                      Payment method
                    </h2>
                    <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                      All transactions are encrypted and secure.
                    </p>

                    <div role="radiogroup" className="mt-5 space-y-2.5">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const active = paymentMethod === method.id;
                        return (
                          <div key={method.id}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => {
                                setPaymentMethod(method.id);
                                setErrors({});
                              }}
                              className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                                active
                                  ? "border-neutral-900 bg-neutral-50 shadow-sm dark:border-neutral-100 dark:bg-neutral-950"
                                  : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
                              }`}
                            >
                              <span
                                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                  active
                                    ? "border-neutral-900 dark:border-neutral-100"
                                    : "border-neutral-300 dark:border-neutral-600"
                                }`}
                              >
                                {active && (
                                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                                )}
                              </span>
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                <Icon className="h-4 w-4" strokeWidth={2.4} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100">
                                  {method.label}
                                </p>
                                <p className="mt-0.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">
                                  {method.sub}
                                </p>
                              </div>
                            </button>

                            <AnimatePresence initial={false}>
                              {active && method.id === "card" && (
                                <motion.div
                                  key="card-fields"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.28 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40 sm:grid-cols-2 sm:p-5">
                                    <Field
                                      label="Card number"
                                      required
                                      error={fieldTouched.cardNumber && errors.cardNumber}
                                      className="sm:col-span-2"
                                    >
                                      <div className="relative">
                                        <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={2.4} />
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={card.number}
                                          onChange={(e) => {
                                            setCard({ ...card, number: formatCardNumber(e.target.value) });
                                            if (errors.cardNumber)
                                              setErrors((prev) => ({ ...prev, cardNumber: null }));
                                          }}
                                          onBlur={() => setFieldTouched((p) => ({ ...p, cardNumber: true }))}
                                          placeholder="4242 4242 4242 4242"
                                          autoComplete="cc-number"
                                          maxLength={23}
                                          className={`${inputCls(fieldTouched.cardNumber && errors.cardNumber)} co-num pl-10`}
                                        />
                                      </div>
                                    </Field>

                                    <Field
                                      label="Name on card"
                                      required
                                      error={fieldTouched.cardName && errors.cardName}
                                      className="sm:col-span-2"
                                    >
                                      <input
                                        type="text"
                                        value={card.name}
                                        onChange={(e) => {
                                          setCard({ ...card, name: e.target.value });
                                          if (errors.cardName)
                                            setErrors((prev) => ({ ...prev, cardName: null }));
                                        }}
                                        onBlur={() => setFieldTouched((p) => ({ ...p, cardName: true }))}
                                        placeholder="AHMED KHAN"
                                        autoComplete="cc-name"
                                        className={`${inputCls(fieldTouched.cardName && errors.cardName)} uppercase`}
                                      />
                                    </Field>

                                    <Field label="Expiry" required error={fieldTouched.cardExpiry && errors.cardExpiry}>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={card.expiry}
                                        onChange={(e) => {
                                          setCard({ ...card, expiry: formatExpiry(e.target.value) });
                                          if (errors.cardExpiry)
                                            setErrors((prev) => ({ ...prev, cardExpiry: null }));
                                        }}
                                        onBlur={() => setFieldTouched((p) => ({ ...p, cardExpiry: true }))}
                                        placeholder="MM/YY"
                                        autoComplete="cc-exp"
                                        maxLength={5}
                                        className={`${inputCls(fieldTouched.cardExpiry && errors.cardExpiry)} co-num`}
                                      />
                                    </Field>

                                    <Field label="CVC" required error={fieldTouched.cardCvc && errors.cardCvc}>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={card.cvc}
                                        onChange={(e) => {
                                          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                          setCard({ ...card, cvc: v });
                                          if (errors.cardCvc)
                                            setErrors((prev) => ({ ...prev, cardCvc: null }));
                                        }}
                                        onBlur={() => setFieldTouched((p) => ({ ...p, cardCvc: true }))}
                                        placeholder="123"
                                        autoComplete="cc-csc"
                                        maxLength={4}
                                        className={`${inputCls(fieldTouched.cardCvc && errors.cardCvc)} co-num`}
                                      />
                                    </Field>

                                    <label className="sm:col-span-2 flex cursor-pointer items-center gap-2.5 text-[12.5px] text-neutral-700 dark:text-neutral-300">
                                      <input
                                        type="checkbox"
                                        checked={saveCard}
                                        onChange={(e) => setSaveCard(e.target.checked)}
                                        className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-950"
                                      />
                                      Save card for faster checkout next time
                                    </label>

                                    <p className="sm:col-span-2 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-[11px] leading-relaxed text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                                      <Shield className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" strokeWidth={2.4} />
                                      Demo only — no real charge. Do not enter real card details.
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 text-[12px] leading-relaxed text-neutral-600 dark:border-neutral-800/80 dark:bg-neutral-900 dark:text-neutral-400 sm:text-[12.5px]">
                    By placing this order, you agree to FeatheredShop's{" "}
                    <Link to="/terms" className="font-semibold text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="font-semibold text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
                      Privacy Policy
                    </Link>
                    .
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-[13.5px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={submitting}
                      className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-[13.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                          Placing order…
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" strokeWidth={2.4} />
                          Place order · {formatPKR(total)}
                        </>
                      )}
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          <OrderSummarySidebar
            items={items}
            subtotal={subtotal}
            discount={discount}
            coupon={coupon}
            shipping={shipping}
            gst={gst}
            total={total}
            itemCount={itemCount}
          />
        </div>
      </main>
    </div>
  );
};

export default Checkout;