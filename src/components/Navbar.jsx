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
import {
  Search,
  Menu,
  ChevronDown,
  X,
  User,
  Feather,
  ShoppingBag,
  Heart,
  LogOut,
  Settings,
  Package,
  MapPin,
  Minus,
  Plus,
  ArrowRight,
  Sparkles,
  Shield,
  Command,
  Clock,
  TrendingUp,
  Tag,
  Truck,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getData } from "@/context/userContext";
import axios from "axios";
import { toast } from "sonner";
import API from "@/utils/api";

/* ════════════════════════════════════════════════════════════
   Config
   ════════════════════════════════════════════════════════════ */
const BRAND_NAME = "FeatheredSHOP";
const BRAND_TAGLINE = "Curated Luxury";
const BRAND_DOT = ".";
const FREE_SHIPPING_THRESHOLD = 8000;

const SOCIALS = [
  { label: "Facebook", href: "#", Icon: FaFacebookF },
  { label: "X (Twitter)", href: "https://x.com/feathered_pen", Icon: FaXTwitter },
  { label: "Instagram", href: "#", Icon: FaInstagram },
  { label: "YouTube", href: "#", Icon: FaYoutube },
];

const FALLBACK_CATEGORIES = [
  { name: "Women", slug: "Women", featured: "New Dresses" },
  { name: "Men", slug: "Men", featured: "Streetwear" },
  { name: "Accessories", slug: "Accessories", featured: "Leather Goods" },
  { name: "Footwear", slug: "Footwear", featured: "Sneakers" },
  { name: "Beauty", slug: "Beauty", featured: "Skincare" },
  { name: "Home", slug: "Home", featured: "Decor" },
];

const RECENT_KEY = "fs_recent_searches";
const CATEGORY_CACHE_KEY = "fs_categories_v1";
const CATEGORY_CACHE_TTL = 1000 * 60 * 30;
const CART_KEY = "fs_cart";
const WISHLIST_KEY = "fn_shop_wishlist";
const TOPBAR_KEY = "fs_topbar_dismissed";

/* ════════════════════════════════════════════════════════════
   Palette (category icon accents)
   ════════════════════════════════════════════════════════════ */
const PALETTE = ["#DC2626", "#2563EB", "#D97706", "#059669", "#7C3AED", "#0891B2"];
const accentFor = (label = "") => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */
const safeStorage = {
  get(key, storage = "local") {
    try {
      return (storage === "session" ? sessionStorage : localStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value, storage = "local") {
    try {
      (storage === "session" ? sessionStorage : localStorage).setItem(key, value);
    } catch {}
  },
  remove(key, storage = "local") {
    try {
      (storage === "session" ? sessionStorage : localStorage).removeItem(key);
    } catch {}
  },
};

const readJSON = (key, fallback) => {
  try {
    const v = safeStorage.get(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const getAvatarUrl = (avatarPath, apiBase) => {
  if (!avatarPath) return null;
  if (/^https?:\/\//.test(avatarPath)) return avatarPath;
  const base =
    (typeof API === "string" && API) ||
    apiBase ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "";
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/${avatarPath.replace(/^\/+/, "")}`;
};

const getApiInstance = () => {
  const instance =
    API && typeof API.get === "function"
      ? API
      : axios.create({
          baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
          headers: { "Content-Type": "application/json" },
        });

  if (!instance.__navbarAuthAttached) {
    instance.interceptors.request.use(
      (config) => {
        const token = safeStorage.get("accessToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    instance.__navbarAuthAttached = true;
  }
  return instance;
};

const api = getApiInstance();

const readRecentSearches = () => {
  const parsed = readJSON(RECENT_KEY, []);
  return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
};

const formatPrice = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "Rs 0";
  return `Rs ${num.toLocaleString("en-PK")}`;
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950";

const iconBtn = `relative inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 ${focusRing}`;

const CountBadge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-bold leading-none text-white tabular-nums dark:bg-white dark:text-neutral-900">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

/* ════════════════════════════════════════════════════════════
   Hooks
   ════════════════════════════════════════════════════════════ */

/* Focus trap + scroll lock + Esc + focus restore for any dialog */
function useDialog(isOpen, ref, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      ref.current
        ? Array.from(ref.current.querySelectorAll(selector)).filter(
            (el) => el.offsetParent !== null
          )
        : [];

    const focusTimer = setTimeout(() => {
      const target = ref.current?.querySelector("[data-autofocus]") || focusables()[0];
      target?.focus?.();
    }, 60);

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
    const original = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      body.style.overflow = original.overflow;
      body.style.paddingRight = original.paddingRight;
      previous?.focus?.();
    };
  }, [isOpen, ref]);
}

/* Cart persisted in localStorage and synced across components/tabs.
   Item shape: { id, name, image, price, qty, variant?, slug? }
   Other pages can add items by writing `fs_cart` and dispatching
   window.dispatchEvent(new Event("feathered:cart:update")). */
const readCart = () => {
  const raw = readJSON(CART_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i) => i && i.id != null)
    .map((i) => ({
      ...i,
      qty: Math.max(1, Number(i.qty) || 1),
      price: Number(i.price) || 0,
    }));
};

function useCart() {
  const [cart, setCart] = useState(readCart);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => {
    const sync = () => setCart(readCart());
    const onStorage = (e) => {
      if (!e.key || e.key === CART_KEY) sync();
    };
    window.addEventListener("feathered:cart:update", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("feathered:cart:update", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const persist = useCallback((next) => {
    safeStorage.set(CART_KEY, JSON.stringify(next));
    setCart(next);
    try {
      window.dispatchEvent(new Event("feathered:cart:update"));
    } catch {}
  }, []);

  const increment = useCallback(
    (id) =>
      persist(
        cartRef.current.map((i) =>
          i.id === id ? { ...i, qty: Math.min(99, i.qty + 1) } : i
        )
      ),
    [persist]
  );
  const decrement = useCallback(
    (id) =>
      persist(
        cartRef.current.map((i) =>
          i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i
        )
      ),
    [persist]
  );
  const remove = useCallback(
    (id) => persist(cartRef.current.filter((i) => i.id !== id)),
    [persist]
  );

  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    [cart]
  );

  return { cart, count, subtotal, increment, decrement, remove };
}

function useWishlistCount() {
  const [count, setCount] = useState(() => {
    const l = readJSON(WISHLIST_KEY, []);
    return Array.isArray(l) ? l.length : 0;
  });
  useEffect(() => {
    const onCustom = (e) => {
      const list = e?.detail?.list;
      if (Array.isArray(list)) setCount(list.length);
    };
    const onStorage = (e) => {
      if (e.key !== WISHLIST_KEY) return;
      const l = readJSON(WISHLIST_KEY, []);
      setCount(Array.isArray(l) ? l.length : 0);
    };
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
   SocialIcons
   ════════════════════════════════════════════════════════════ */
const SocialIcons = memo(function SocialIcons({
  size = 16,
  compact = false,
  className = "",
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {SOCIALS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          {...(href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className={`inline-flex items-center justify-center rounded-full transition-colors ${
            compact
              ? "h-6 w-6 text-neutral-400 hover:text-white"
              : "h-9 w-9 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
          } ${focusRing}`}
        >
          <Icon size={size} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   TopBar — slim, dismissible, scrolls away with the page
   ════════════════════════════════════════════════════════════ */
const TopBar = memo(function TopBar({ onDismiss }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const date = useMemo(
    () =>
      now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [now]
  );
  const time = useMemo(
    () =>
      now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    [now]
  );

  return (
    <div className="border-b border-neutral-800/80 bg-neutral-950 text-[11px] font-medium tracking-wide text-neutral-300">
      <div className="mx-auto flex h-7 w-full max-w-7xl items-center gap-3 px-3 sm:px-6 lg:px-8 3xl:max-w-[100rem]">
        <span className="hidden min-w-0 shrink-0 items-center gap-2 text-neutral-400 sm:flex">
          <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          <span className="truncate">{date}</span>
        </span>

        <p className="flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate">
          <Sparkles className="h-3 w-3 shrink-0 text-amber-400" aria-hidden="true" />
          <span className="truncate">
            Free shipping on orders over{" "}
            <span className="font-semibold text-amber-400">Rs&nbsp;8,000</span>
          </span>
        </p>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <span className="font-mono tabular-nums text-neutral-400">{time}</span>
          <span className="h-3 w-px bg-neutral-800" aria-hidden="true" />
          <SocialIcons size={12} compact />
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className={`-mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-white ${focusRing}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   BrandLogo
   ════════════════════════════════════════════════════════════ */
const BrandLogo = memo(function BrandLogo({
  showTagline = true,
  onClick,
  className = "",
}) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label={`${BRAND_NAME} home`}
      className={`group flex shrink-0 flex-col items-start rounded-lg px-1 ${focusRing} ${className}`}
    >
      <span className="flex items-center gap-1">
        <Feather
          className="h-4 w-4 text-neutral-900 transition-transform duration-300 group-hover:-rotate-12 dark:text-neutral-100 sm:h-5 sm:w-5"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="text-[15px] font-black leading-none tracking-tighter text-neutral-900 dark:text-neutral-100 xs:text-lg sm:text-xl">
          {BRAND_NAME}
          <span className="text-amber-500">{BRAND_DOT}</span>
        </span>
      </span>
      {showTagline && (
        <span className="mt-0.5 hidden whitespace-nowrap pl-5 text-[8px] font-light uppercase leading-none tracking-[0.25em] text-neutral-400 sm:block">
          {BRAND_TAGLINE}
        </span>
      )}
    </Link>
  );
});

/* ════════════════════════════════════════════════════════════
   DesktopNav — inline in the header row (lg+)
   ════════════════════════════════════════════════════════════ */
const DesktopNav = memo(function DesktopNav({
  navItems,
  currentPath,
  categoriesLoading,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const listRef = useRef(null);
  const closeTimeout = useRef(null);

  useEffect(() => {
    setOpenDropdown(null);
  }, [currentPath]);

  useEffect(() => {
    if (!openDropdown) return;
    const onDown = (e) => {
      if (listRef.current && !listRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openDropdown]);

  useEffect(
    () => () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    },
    []
  );

  const handleEnter = useCallback((label, hasSub) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    if (hasSub) setOpenDropdown(label);
  }, []);

  const handleLeave = useCallback(() => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setOpenDropdown(null), 160);
  }, []);

  const isActive = useCallback(
    (link) => {
      if (!link) return false;
      if (link === "/") return currentPath === "/";
      return currentPath === link || currentPath.startsWith(`${link}/`);
    },
    [currentPath]
  );

  return (
    <nav
      className="hidden flex-1 self-stretch lg:flex"
      aria-label="Primary navigation"
    >
      <ul
        ref={listRef}
        onKeyDown={(e) => e.key === "Escape" && setOpenDropdown(null)}
        className="mx-auto flex items-stretch gap-0.5 text-[11px] font-semibold uppercase tracking-wider xl:gap-1.5 xl:text-xs"
      >
        {navItems.map((item) => {
          const subItems = item.sub || [];
          const hasSub = subItems.length > 0;
          const isOpen = openDropdown === item.label;
          const active = isActive(item.link || item.match);
          const dropdownId = `desktop-dropdown-${item.label
            .replace(/\s+/g, "-")
            .toLowerCase()}`;

          return (
            <li
              key={item.label}
              className="relative flex items-center"
              onMouseEnter={() => handleEnter(item.label, hasSub)}
              onMouseLeave={handleLeave}
            >
              {hasSub ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors xl:px-3 ${focusRing} ${
                      isOpen || active
                        ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-white"
                    }`}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    aria-controls={dropdownId}
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-1">
                        <motion.div
                          id={dropdownId}
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          className="w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 p-3 shadow-2xl backdrop-blur-xl normal-case tracking-normal dark:border-neutral-800 dark:bg-neutral-900/95"
                        >
                          <div className="mb-2 flex items-center justify-between px-1">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[2px] text-neutral-400">
                              <Sparkles size={10} className="text-amber-500" aria-hidden="true" />
                              Shop by category
                            </p>
                            {!categoriesLoading && (
                              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-400 dark:bg-neutral-800">
                                {subItems.length}
                              </span>
                            )}
                          </div>

                          {categoriesLoading && subItems.length === 0 ? (
                            <div className="grid grid-cols-2 gap-2" aria-busy="true">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="h-10 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {subItems.map((sub) => (
                                <Link
                                  key={sub.label}
                                  to={sub.link}
                                  onClick={() => setOpenDropdown(null)}
                                  className={`group flex items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 ${focusRing}`}
                                >
                                  <span className="flex min-w-0 items-center gap-2">
                                    <Tag
                                      size={12}
                                      style={{ color: accentFor(sub.label) }}
                                      aria-hidden="true"
                                    />
                                    <span className="truncate">{sub.label}</span>
                                  </span>
                                  {sub.featured && (
                                    <span className="max-w-[90px] truncate text-[10px] font-medium text-neutral-400">
                                      {sub.featured}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                            <Link
                              to="/shop"
                              onClick={() => setOpenDropdown(null)}
                              className={`group inline-flex items-center gap-1.5 rounded text-xs font-bold text-amber-600 transition-colors hover:text-amber-700 ${focusRing}`}
                            >
                              Shop all products
                              <ArrowRight
                                size={13}
                                className="transition-transform group-hover:translate-x-0.5"
                                aria-hidden="true"
                              />
                            </Link>
                            <Link
                              to="/new-arrivals"
                              onClick={() => setOpenDropdown(null)}
                              className={`rounded text-[11px] font-semibold text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white ${focusRing}`}
                            >
                              New drops
                            </Link>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link
                  to={item.link}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors xl:px-3 ${focusRing} ${
                    item.isSale
                      ? "text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      : active
                      ? "font-bold text-neutral-900 dark:text-white"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="inline-flex items-center rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold leading-none tracking-normal text-amber-950">
                      {item.badge}
                    </span>
                  )}
                  {active && !item.isSale && (
                    <motion.span
                      layoutId="active-nav-indicator"
                      className="absolute inset-x-2.5 -bottom-[7px] h-0.5 rounded-full bg-neutral-900 dark:bg-white"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

/* ════════════════════════════════════════════════════════════
   SearchOverlay — command palette on every screen size
   (opens with the search button, "/" or Ctrl/⌘+K)
   ════════════════════════════════════════════════════════════ */
const SearchOverlay = memo(function SearchOverlay({
  isOpen,
  onClose,
  onSearch,
  onGo,
  recent,
  onClearRecent,
  categories,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  useDialog(isOpen, panelRef, onClose);

  const q = query.trim();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setActive(0);
    }
  }, [isOpen]);

  /* Debounced live product suggestions */
  useEffect(() => {
    if (!isOpen || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/api/products", {
          params: { search: q, q, limit: 24, page: 1 },
          signal: controller.signal,
        });
        const needle = q.toLowerCase();
        const list = (res.data?.data || [])
          .filter((p) =>
            [p.title, p.brand, p.category].some((v) =>
              String(v || "").toLowerCase().includes(needle)
            )
          )
          .slice(0, 6);
        setResults(list);
        setActive(0);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, isOpen]);

  const productPath = (p) => `/shop/${p.slug || p._id}`;

  const matchedCategories = useMemo(() => {
    if (q.length < 2) return [];
    const needle = q.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(needle)).slice(0, 3);
  }, [q, categories]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!q) return;
      if (active > 0 && results[active - 1]) onGo(productPath(results[active - 1]));
      else onSearch(q);
    }
  };

  const rowClass = (on) =>
    `flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
      on ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-0 z-[61] mx-auto flex max-h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-neutral-900 sm:top-[7vh] sm:max-h-[78dvh] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-neutral-200 sm:dark:border-neutral-800"
          >
            {/* Input row */}
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-100 px-3 dark:border-neutral-800 sm:px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-neutral-400" strokeWidth={2} aria-hidden="true" />
              <input
                ref={inputRef}
                data-autofocus
                type="text"
                role="combobox"
                aria-expanded={q.length > 0}
                aria-controls="search-results"
                aria-activedescendant={q ? `search-opt-${active}` : undefined}
                aria-label="Search products, brands and categories"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search products, brands…"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                enterKeyHint="search"
                className="min-w-0 flex-1 bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white ${focusRing}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg border border-neutral-200 px-2 py-1 text-[11px] font-semibold text-neutral-500 transition-colors hover:text-neutral-900 dark:border-neutral-700 dark:hover:text-white ${focusRing}`}
              >
                <span className="sm:hidden">Cancel</span>
                <kbd className="hidden font-mono sm:inline">Esc</kbd>
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
              {!q ? (
                <div className="space-y-5">
                  {recent.length > 0 && (
                    <section aria-label="Recent searches">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          <Clock size={11} aria-hidden="true" /> Recent
                        </h3>
                        <button
                          type="button"
                          onClick={onClearRecent}
                          className="rounded text-[11px] font-medium text-neutral-400 transition-colors hover:text-red-600"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => onSearch(r)}
                            className={`rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 ${focusRing}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {categories.length > 0 && (
                    <section aria-label="Trending categories">
                      <h3 className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        <TrendingUp size={11} className="text-amber-500" aria-hidden="true" /> Trending
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 8).map((cat) => (
                          <Link
                            key={cat.name}
                            to={`/shop?category=${encodeURIComponent(cat.slug || cat.name)}`}
                            className={`inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-300 dark:hover:text-white ${focusRing}`}
                          >
                            <Tag size={11} style={{ color: accentFor(cat.name) }} aria-hidden="true" />
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  <p className="hidden text-[11px] text-neutral-400 sm:block">
                    Tip: press <kbd className="rounded border border-neutral-200 px-1 font-mono dark:border-neutral-700">/</kbd> or{" "}
                    <kbd className="rounded border border-neutral-200 px-1 font-mono dark:border-neutral-700">Ctrl K</kbd> anywhere to search.
                  </p>
                </div>
              ) : (
                <ul id="search-results" role="listbox" aria-label="Search suggestions" className="space-y-1">
                  <li role="presentation">
                    <button
                      id="search-opt-0"
                      role="option"
                      aria-selected={active === 0}
                      type="button"
                      onMouseEnter={() => setActive(0)}
                      onClick={() => onSearch(q)}
                      className={rowClass(active === 0)}
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
                        <Search size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-neutral-900 dark:text-neutral-100">
                        Search for <strong className="font-semibold">“{q}”</strong>
                      </span>
                      <ArrowRight size={14} className="shrink-0 text-neutral-400" aria-hidden="true" />
                    </button>
                  </li>

                  {matchedCategories.map((c) => (
                    <li key={`cat-${c.name}`} role="presentation">
                      <Link
                        to={`/shop?category=${encodeURIComponent(c.slug || c.name)}`}
                        className={rowClass(false)}
                      >
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                          <Tag size={16} style={{ color: accentFor(c.name) }} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-neutral-900 dark:text-neutral-100">
                          Category: <strong className="font-semibold">{c.name}</strong>
                        </span>
                      </Link>
                    </li>
                  ))}

                  {loading &&
                    results.length === 0 &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <li key={i} aria-hidden="true" className="flex items-center gap-3 px-2.5 py-2">
                        <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                        </div>
                      </li>
                    ))}

                  {results.map((p, i) => {
                    const idx = i + 1;
                    const price =
                      p.salePrice && p.salePrice > 0 && p.salePrice < p.regularPrice
                        ? p.salePrice
                        : p.regularPrice ?? p.price;
                    return (
                      <li key={p._id} role="presentation">
                        <Link
                          id={`search-opt-${idx}`}
                          role="option"
                          aria-selected={active === idx}
                          to={productPath(p)}
                          onMouseEnter={() => setActive(idx)}
                          className={rowClass(active === idx)}
                        >
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                            {p.images?.[0] && (
                              <img
                                src={p.images[0]}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {p.title}
                            </span>
                            <span className="block truncate text-[11px] text-neutral-400">
                              {[p.brand, p.category].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {price != null && (
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                              {formatPrice(price)}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}

                  {!loading && q.length >= 2 && results.length === 0 && matchedCategories.length === 0 && (
                    <li role="presentation" className="px-2.5 py-4 text-center text-xs text-neutral-400">
                      No quick matches. Press Enter to search the full catalogue.
                    </li>
                  )}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

/* ════════════════════════════════════════════════════════════
   AccountMenu
   ════════════════════════════════════════════════════════════ */
const AccountMenu = memo(function AccountMenu({ user, userRole, apiBase, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = useMemo(() => {
    if (user?.fullname) {
      return user.fullname
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email ? user.email[0].toUpperCase() : "U";
  }, [user]);

  const menuLinks = useMemo(
    () => [
      { icon: Package, label: "Orders", to: "/orders" },
      { icon: Heart, label: "Wishlist", to: "/wishlist" },
      { icon: MapPin, label: "Addresses", to: "/addresses" },
      { icon: Settings, label: "Settings", to: "/profile" },
    ],
    []
  );

  const handleLogoutClick = useCallback(() => {
    setOpen(false);
    onLogout?.();
  }, [onLogout]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center rounded-full p-0.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${focusRing}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar className="h-8 w-8 border border-neutral-200 dark:border-neutral-700">
          <AvatarImage src={getAvatarUrl(user?.avatar, apiBase)} loading="lazy" alt="" />
          <AvatarFallback className="bg-neutral-900 text-xs font-bold text-white dark:bg-neutral-100 dark:text-black">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-1.5rem))] origin-top-right divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/95"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-9 w-9 shrink-0 border border-neutral-200 dark:border-neutral-700">
                <AvatarImage src={getAvatarUrl(user?.avatar, apiBase)} loading="lazy" alt="" />
                <AvatarFallback className="bg-neutral-900 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {user?.fullname || "Account"}
                </p>
                <p className="truncate text-xs text-neutral-400">{user?.email}</p>
              </div>
            </div>

            <div className="py-1.5">
              {menuLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/60 ${focusRing}`}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={2} aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
              {userRole === "admin" && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 ${focusRing}`}
                >
                  <Shield className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                  Admin Dashboard
                </Link>
              )}
            </div>

            <div className="py-1.5">
              <button
                type="button"
                onClick={handleLogoutClick}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 ${focusRing}`}
              >
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   MobileDrawer — slides from the left, swipe left to close
   ════════════════════════════════════════════════════════════ */
const MobileDrawer = memo(function MobileDrawer({
  isOpen,
  onClose,
  navItems,
  currentPath,
  categoriesLoading,
  user,
  userRole,
  profileRoute,
  apiBase,
  onLogout,
  onOpenSearch,
  wishCount,
}) {
  const drawerRef = useRef(null);
  const [openGroup, setOpenGroup] = useState(null);
  useDialog(isOpen, drawerRef, onClose);

  useEffect(() => {
    if (!isOpen) setOpenGroup(null);
  }, [isOpen]);

  const handleLogoutClick = useCallback(() => {
    onClose?.();
    onLogout?.();
  }, [onClose, onLogout]);

  const isActive = (link) =>
    link === "/" ? currentPath === "/" : currentPath === link || currentPath.startsWith(`${link}/`);

  const initials = (user?.fullname || user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
          <motion.aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) onClose?.();
            }}
            className="fixed inset-y-0 left-0 z-[61] flex h-dvh w-[88%] max-w-sm flex-col bg-white shadow-2xl dark:bg-neutral-900 lg:hidden"
          >
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-100 px-3 dark:border-neutral-800">
              <BrandLogo showTagline={false} onClick={onClose} />
              <button
                type="button"
                onClick={onClose}
                className={iconBtn}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Search shortcut */}
              <div className="p-3 pb-0">
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className={`flex h-11 w-full items-center gap-2.5 rounded-full bg-neutral-100 px-4 text-sm text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 ${focusRing}`}
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Search products, brands…
                </button>
              </div>

              {/* Account */}
              <div className="p-3">
                {user ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
                    <Avatar className="h-10 w-10 shrink-0 border border-neutral-200 dark:border-neutral-700">
                      <AvatarImage src={getAvatarUrl(user?.avatar, apiBase)} loading="lazy" alt="" />
                      <AvatarFallback className="bg-neutral-900 text-xs font-bold text-white dark:bg-neutral-100 dark:text-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {user?.fullname || "Account"}
                      </p>
                      <p className="truncate text-xs text-neutral-400">{user?.email}</p>
                    </div>
                    <Link
                      to={profileRoute || "/profile"}
                      onClick={onClose}
                      className={`shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-neutral-100 ${focusRing}`}
                    >
                      Profile
                    </Link>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={onClose}
                    className={`flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-900 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-black ${focusRing}`}
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    Sign in
                  </Link>
                )}

                {user && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { to: "/orders", label: "Orders", Icon: Package },
                      { to: "/wishlist", label: "Wishlist", Icon: Heart, count: wishCount },
                      { to: "/addresses", label: "Addresses", Icon: MapPin },
                    ].map(({ to, label, Icon, count }) => (
                      <Link
                        key={label}
                        to={to}
                        onClick={onClose}
                        className={`relative flex flex-col items-center gap-1 rounded-xl border border-neutral-100 py-2.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800/60 ${focusRing}`}
                      >
                        <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} aria-hidden="true" />
                        {label}
                        {count > 0 && (
                          <span className="absolute right-2 top-1.5 min-w-[16px] rounded-full bg-neutral-900 px-1 text-center text-[9px] font-bold leading-4 text-white dark:bg-white dark:text-neutral-900">
                            {count}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Nav */}
              <nav className="px-3 pb-3" aria-label="Mobile navigation">
                <ul>
                  {navItems.map((item) => {
                    const subItems = item.sub || [];
                    const hasSub = subItems.length > 0 || item.sub;
                    const isExpanded = openGroup === item.label;

                    if (hasSub) {
                      return (
                        <li key={item.label} className="border-b border-neutral-100 dark:border-neutral-800/60">
                          <button
                            type="button"
                            onClick={() => setOpenGroup(isExpanded ? null : item.label)}
                            className={`flex min-h-12 w-full items-center justify-between rounded-md px-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200 ${focusRing}`}
                            aria-expanded={isExpanded}
                          >
                            {item.label}
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                {categoriesLoading && subItems.length === 0 ? (
                                  <div className="space-y-2 pb-3 pl-3" aria-busy="true">
                                    {[0, 1, 2, 3].map((i) => (
                                      <div key={i} className="h-8 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800" />
                                    ))}
                                  </div>
                                ) : (
                                  <ul className="space-y-0.5 pb-2 pl-3">
                                    <li>
                                      <Link
                                        to="/shop"
                                        onClick={onClose}
                                        className={`block rounded-md px-2 py-2.5 text-xs font-semibold text-amber-600 ${focusRing}`}
                                      >
                                        Shop all
                                      </Link>
                                    </li>
                                    {subItems.map((sub) => (
                                      <li key={sub.label}>
                                        <Link
                                          to={sub.link}
                                          onClick={onClose}
                                          className={`block rounded-md px-2 py-2.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-white ${focusRing}`}
                                        >
                                          {sub.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    }

                    const active = isActive(item.link);
                    return (
                      <li key={item.label} className="border-b border-neutral-100 dark:border-neutral-800/60">
                        <Link
                          to={item.link}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-12 items-center justify-between rounded-md px-1 text-sm font-semibold transition-colors ${focusRing} ${
                            item.isSale
                              ? "text-red-500 hover:text-red-600"
                              : active
                              ? "text-neutral-900 dark:text-white"
                              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {active && !item.isSale && (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                            )}
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="inline-flex items-center rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-950">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Footer */}
            <div className="shrink-0 space-y-3 border-t border-neutral-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-neutral-800">
              <SocialIcons className="justify-center" size={17} />
              {user && (
                <div className="grid gap-2">
                  {userRole === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      onClick={onClose}
                      className={`block w-full rounded-xl bg-amber-50 py-2.5 text-center text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/60 ${focusRing}`}
                    >
                      Admin dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className={`block w-full rounded-xl bg-red-50 py-2.5 text-center text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60 ${focusRing}`}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
});

/* ════════════════════════════════════════════════════════════
   CartDrawer
   ════════════════════════════════════════════════════════════ */
const CartDrawer = memo(function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  count = 0,
  subtotal = 0,
  onIncrement,
  onDecrement,
  onRemove,
}) {
  const drawerRef = useRef(null);
  useDialog(isOpen, drawerRef, onClose);

  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 || info.velocity.x > 500) onClose?.();
            }}
            className="fixed inset-y-0 right-0 z-[61] flex h-dvh w-full flex-col bg-white shadow-2xl dark:bg-neutral-900 sm:w-[420px]"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-100 px-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-neutral-900 dark:text-neutral-100" strokeWidth={2} aria-hidden="true" />
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Shopping bag <span className="font-mono text-neutral-400">({count})</span>
                </h2>
              </div>
              <button type="button" onClick={onClose} className={iconBtn} aria-label="Close bag">
                <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            {cart.length > 0 && (
              <div className="shrink-0 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                <p className="mb-2 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                  <Truck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  {remaining > 0 ? (
                    <span>
                      Add <strong className="font-semibold">{formatPrice(remaining)}</strong> more for free shipping
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-600">You've unlocked free shipping</span>
                  )}
                </p>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  aria-label="Progress to free shipping"
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <ShoppingBag className="h-7 w-7 text-neutral-400" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Your bag is empty</p>
                    <p className="mt-1 text-xs text-neutral-500">Add items to start your order</p>
                  </div>
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className={`inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-black ${focusRing}`}
                  >
                    Start shopping
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4 divide-y divide-neutral-100 dark:divide-neutral-800">
                  {cart.map((item) => (
                    <li key={item.id} className="flex gap-3 pt-4 first:pt-0 sm:gap-4">
                      <Link
                        to={`/shop/${item.slug || item.id}`}
                        onClick={onClose}
                        className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 sm:h-24 sm:w-20 ${focusRing}`}
                      >
                        {item.image ? (
                          <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center font-mono text-xs text-neutral-400">
                            N/A
                          </span>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 sm:text-sm">
                              {item.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemove?.(item.id)}
                              className={`shrink-0 rounded p-1 text-neutral-400 transition-colors hover:text-red-500 ${focusRing}`}
                              aria-label={`Remove ${item.name}`}
                            >
                              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                            </button>
                          </div>
                          {item.variant && (
                            <p className="mt-0.5 truncate text-[11px] text-neutral-400">{item.variant}</p>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                            <button
                              type="button"
                              onClick={() => onDecrement?.(item.id)}
                              disabled={item.qty <= 1}
                              className={`rounded-l-full p-2 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800 ${focusRing}`}
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                            </button>
                            <span className="min-w-[24px] px-1 text-center font-mono text-xs tabular-nums" aria-live="polite">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onIncrement?.(item.id)}
                              className={`rounded-r-full p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${focusRing}`}
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                            </button>
                          </div>
                          <span className="font-mono text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 sm:text-sm">
                            {formatPrice(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="shrink-0 space-y-3 border-t border-neutral-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-mono text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="text-center text-[11px] text-neutral-400">
                  Shipping &amp; taxes calculated at checkout
                </p>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className={`flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-black ${focusRing}`}
                >
                  Checkout now
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
});

/* ════════════════════════════════════════════════════════════
   Navbar (main)
   ════════════════════════════════════════════════════════════ */
const Navbar = ({ apiBase = "" }) => {
  const { user, setUser, logout: ctxLogout } = getData();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [topBarDismissed, setTopBarDismissed] = useState(
    () => safeStorage.get(TOPBAR_KEY, "session") === "1"
  );

  const { cart, count: cartCount, subtotal, increment, decrement, remove } = useCart();
  const wishCount = useWishlistCount();

  const userRole = user?.role || user?.userRole || "user";
  const isAdmin = userRole === "admin";
  const profileRoute = isAdmin ? "/admin/profile" : "/profile";
  const anyOverlayOpen = sidebarOpen || searchOpen || cartOpen;

  /* ─── Categories (session-cached, abortable) ────────── */
  useEffect(() => {
    const controller = new AbortController();

    try {
      const cached = JSON.parse(safeStorage.get(CATEGORY_CACHE_KEY, "session") || "null");
      if (cached && Date.now() - cached.t < CATEGORY_CACHE_TTL && cached.items?.length) {
        setCategories(cached.items);
        setCategoriesLoading(false);
        return () => controller.abort();
      }
    } catch {}

    (async () => {
      try {
        setCategoriesLoading(true);
        const res = await api.get("/api/products", {
          params: { limit: 100, page: 1 },
          signal: controller.signal,
        });
        const products = res.data?.data || [];
        const uniqueNames = [...new Set(products.map((p) => p.category).filter(Boolean))];
        const items = uniqueNames.length
          ? uniqueNames.map((name) => ({ name, slug: name, featured: "" }))
          : FALLBACK_CATEGORIES;
        setCategories(items);
        safeStorage.set(CATEGORY_CACHE_KEY, JSON.stringify({ t: Date.now(), items }), "session");
      } catch (error) {
        if (axios.isCancel?.(error) || error?.code === "ERR_CANCELED") return;
        console.error("Failed to fetch categories:", error);
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  /* ─── Nav items ──────────────────────────────────────── */
  const shopSub = useMemo(
    () =>
      categories.map((c) => ({
        label: c.name,
        link: `/shop?category=${encodeURIComponent(c.slug || c.name)}`,
        featured: c.featured,
      })),
    [categories]
  );

  const desktopNavItems = useMemo(
    () => [
      { label: "Home", link: "/" },
      { label: "New Drops", link: "/new-arrivals", badge: "NEW" },
      { label: "Sale", link: "/sale", isSale: true },
      { label: "Shop", match: "/shop", sub: shopSub },
      { label: "Brands", link: "/brands" },
      { label: "Releases", link: "/releases" },
    ],
    [shopSub]
  );

  const mobileNavItems = useMemo(
    () => [
      { label: "Home", link: "/" },
      { label: "New Arrivals", link: "/new-arrivals", badge: "NEW" },
      { label: "Sale", link: "/sale", isSale: true },
      { label: "Categories", sub: shopSub },
      { label: "Collections", link: "/collections" },
      { label: "Brands", link: "/brands" },
      { label: "About", link: "/about" },
      { label: "Contact", link: "/contact" },
    ],
    [shopSub]
  );

  /* ─── Close overlays on route change ────────────────── */
  useEffect(() => {
    setSidebarOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [location.pathname, location.search]);

  /* ─── Open helpers (only one overlay at a time) ─────── */
  const openSearch = useCallback(() => {
    setSidebarOpen(false);
    setCartOpen(false);
    setSearchOpen(true);
  }, []);
  const openCart = useCallback(() => {
    setSidebarOpen(false);
    setSearchOpen(false);
    setCartOpen(true);
  }, []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  /* ─── Keyboard: "/" and Ctrl/Cmd+K (Esc handled per dialog) ── */
  useEffect(() => {
    const onKeyDown = (e) => {
      const el = document.activeElement;
      const isTyping =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.tagName === "SELECT" ||
        el?.isContentEditable;

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => {
          if (!v) {
            setSidebarOpen(false);
            setCartOpen(false);
          }
          return !v;
        });
        return;
      }
      if (e.key === "/" && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  /* ─── Scroll: shadow + hide on scroll down / show on up ── */
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = Math.max(window.scrollY, 0);
        setIsScrolled(y > 8);
        const delta = y - last;
        if (Math.abs(delta) > 6) {
          if (delta > 0 && y > 160) setHideOnScroll(true);
          else if (delta < 0) setHideOnScroll(false);
          last = y;
        }
        if (y <= 8) setHideOnScroll(false);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerHidden = hideOnScroll && !anyOverlayOpen && !focusWithin;

  /* ─── Search ─────────────────────────────────────────── */
  const handleSearchNavigate = useCallback(
    (queryText) => {
      const query = (queryText ?? "").trim();
      if (!query) return;
      const next = [
        query,
        ...readRecentSearches().filter((r) => r.toLowerCase() !== query.toLowerCase()),
      ].slice(0, 6);
      safeStorage.set(RECENT_KEY, JSON.stringify(next));
      setRecentSearches(next);
      navigate(`/shop?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    },
    [navigate]
  );

  const handleGo = useCallback(
    (path) => {
      navigate(path);
      setSearchOpen(false);
    },
    [navigate]
  );

  const clearRecent = useCallback(() => {
    safeStorage.remove(RECENT_KEY);
    setRecentSearches([]);
  }, []);

  /* ─── Logout ─────────────────────────────────────────── */
  const logoutHandler = useCallback(async () => {
    try {
      const token = safeStorage.get("accessToken");
      const res = await api.post(
        "/user/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        if (typeof setUser === "function") setUser(null);
        ctxLogout?.();
        toast.success(res.data.message);
        ["accessToken", "refreshToken", "user"].forEach((k) => safeStorage.remove(k));
        setSidebarOpen(false);
        navigate("/login", { replace: true });
      } else {
        toast.error("Logout failed");
      }
    } catch {
      toast.error("Logout failed");
    }
  }, [setUser, ctxLogout, navigate]);

  const dismissTopBar = useCallback(() => {
    safeStorage.set(TOPBAR_KEY, "1", "session");
    setTopBarDismissed(true);
  }, []);

  return (
    <>
      {!topBarDismissed && <TopBar onDismiss={dismissTopBar} />}

      <header
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={() => setFocusWithin(false)}
        className={`sticky top-0 z-50 w-full transition-transform duration-300 ease-out ${
          headerHidden ? "-translate-y-full" : ""
        }`}
      >
        <div
          className={`border-b bg-white/80 backdrop-blur-xl transition-[box-shadow,border-color] duration-300 dark:bg-neutral-950/80 ${
            isScrolled
              ? "border-neutral-200 shadow-md shadow-black/5 dark:border-neutral-800"
              : "border-neutral-200/60 dark:border-neutral-800/60"
          }`}
        >
          <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-14 sm:gap-4 sm:px-6 lg:px-8 3xl:max-w-[100rem]">
            {/* Left: menu + logo */}
            <div className="flex min-w-0 shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setCartOpen(false);
                  setSidebarOpen(true);
                }}
                className={`-ml-1.5 lg:hidden ${iconBtn}`}
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
              >
                <Menu className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </button>
              <BrandLogo />
            </div>

            {/* Center: desktop nav */}
            <DesktopNav
              navItems={desktopNavItems}
              currentPath={location.pathname}
              categoriesLoading={categoriesLoading}
            />

            {/* Right: actions */}
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={openSearch}
                className={`hidden h-9 w-52 items-center gap-2 rounded-full bg-neutral-100 px-3 text-xs text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 xl:inline-flex ${focusRing}`}
                aria-label="Search (press slash or Ctrl K)"
              >
                <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                <span className="flex-1 text-left">Search products…</span>
                <kbd className="inline-flex items-center gap-0.5 rounded-md border border-neutral-200 bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900/80">
                  <Command className="h-2.5 w-2.5" aria-hidden="true" />K
                </kbd>
              </button>
              <button
                type="button"
                onClick={openSearch}
                className={`xl:hidden ${iconBtn}`}
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </button>

              <Link
                to="/wishlist"
                className={`hidden sm:inline-flex ${iconBtn}`}
                aria-label={`Wishlist, ${wishCount} items`}
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
                <CountBadge count={wishCount} />
              </Link>

              <button
                type="button"
                onClick={openCart}
                className={iconBtn}
                aria-label={`Shopping bag, ${cartCount} items`}
                aria-haspopup="dialog"
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
                <CountBadge count={cartCount} />
              </button>

              {user ? (
                <AccountMenu
                  user={user}
                  userRole={userRole}
                  apiBase={apiBase}
                  onLogout={logoutHandler}
                />
              ) : (
                <Link to="/login" className={iconBtn} aria-label="Sign in">
                  <User className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Overlays live outside the header so transforms/blur can't trap them */}
      <MobileDrawer
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        navItems={mobileNavItems}
        currentPath={location.pathname}
        categoriesLoading={categoriesLoading}
        user={user}
        userRole={userRole}
        profileRoute={profileRoute}
        apiBase={apiBase}
        onLogout={logoutHandler}
        onOpenSearch={openSearch}
        wishCount={wishCount}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={closeSearch}
        onSearch={handleSearchNavigate}
        onGo={handleGo}
        recent={recentSearches}
        onClearRecent={clearRecent}
        categories={categories}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={closeCart}
        cart={cart}
        count={cartCount}
        subtotal={subtotal}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={remove}
      />
    </>
  );
};

export default memo(Navbar);