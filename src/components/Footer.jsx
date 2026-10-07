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
  Feather,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowUp,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  Globe,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPinterestP,
  FaTiktok,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcPaypal,
  FaApplePay,
  FaGooglePay,
} from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────
 * CONSTANTS
 * ───────────────────────────────────────────────────────────────── */
const BRAND_NAME = "FeatherdShop";
const BRAND_TAGLINE = "Curated Luxury";
const BRAND_BLURB =
  "Timeless essentials, thoughtfully sourced. From atelier to doorstep — luxury without compromise.";

const SOCIAL_LINKS = [
  { icon: FaFacebookF, label: "Facebook", href: "#" },
  { icon: FaXTwitter, label: "Twitter", href: "https://x.com/feathered_pen" },
  { icon: FaInstagram, label: "Instagram", href: "#" },
  { icon: FaYoutube, label: "YouTube", href: "#" },
  { icon: FaPinterestP, label: "Pinterest", href: "#" },
  { icon: FaTiktok, label: "TikTok", href: "#" },
];

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", to: "/new" },
      { label: "Best Sellers", to: "/best-sellers" },
      { label: "Women", to: "/shop?category=Women" },
      { label: "Men", to: "/shop?category=Men" },
      { label: "Accessories", to: "/shop?category=Accessories" },
      { label: "Sale", to: "/sale", isSale: true },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "Shipping & Delivery", to: "/shipping" },
      { label: "Returns & Exchanges", to: "/returns" },
      { label: "Size Guide", to: "/size-guide" },
      { label: "Track Your Order", to: "/track" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Our Story", to: "/story" },
      { label: "Sustainability", to: "/sustainability" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
      { label: "Affiliates", to: "/affiliates" },
    ],
  },
];

const CONTACT_INFO = [
  {
    icon: MapPin,
    label: "Visit",
    value: "12 Savile Row, Mayfair, London W1S 3PQ",
  },
  { icon: Phone, label: "Call", value: "+44 20 7946 0123", href: "tel:+442079460123" },
  {
    icon: Mail,
    label: "Email",
    value: "care@featherdshop.com",
    href: "mailto:care@featherdshop.com",
  },
  { icon: Clock, label: "Hours", value: "Mon–Sat · 10:00 – 19:00 GMT" },
];

const TRUST_BADGES = [
  { title: "Secure Checkout", subtitle: "256-bit SSL encryption" },
  { title: "30-Day Returns", subtitle: "No questions asked" },
  { title: "Free Shipping", subtitle: "On orders over $100" },
  { title: "Authenticity", subtitle: "Guaranteed on all items" },
];

const PAYMENT_METHODS = [
  { icon: FaCcVisa, label: "Visa" },
  { icon: FaCcMastercard, label: "Mastercard" },
  { icon: FaCcAmex, label: "American Express" },
  { icon: FaCcPaypal, label: "PayPal" },
  { icon: FaApplePay, label: "Apple Pay" },
  { icon: FaGooglePay, label: "Google Pay" },
];

const LOCALES = [
  { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
  { code: "ar-SA", label: "العربية", flag: "🇸🇦" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD" },
  { code: "EUR", symbol: "€", label: "EUR" },
  { code: "GBP", symbol: "£", label: "GBP" },
  { code: "AED", symbol: "د.إ", label: "AED" },
];

const LEGAL_LINKS = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Cookies", to: "/cookies" },
  { label: "Accessibility", to: "/accessibility" },
];

/* ─────────────────────────────────────────────────────────────────
 * UTILITIES
 * ───────────────────────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ─────────────────────────────────────────────────────────────────
 * BackToTop — floating button
 * ───────────────────────────────────────────────────────────────── */
const BackToTop = memo(function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setVisible(window.scrollY > 600);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 inline-flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xl hover:scale-105 active:scale-95 transition-transform outline-none focus:outline-none focus-visible:outline-none"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
});

/* ─────────────────────────────────────────────────────────────────
 * NewsletterForm
 * ───────────────────────────────────────────────────────────────── */
const NewsletterForm = memo(function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (status === "loading") return;

      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) {
        setStatus("error");
        setMessage("Please enter a valid email address.");
        return;
      }
      if (!agree) {
        setStatus("error");
        setMessage("Please accept the privacy policy to continue.");
        return;
      }

      setStatus("loading");
      setMessage("");

      // Simulated request — swap with your real API call
      try {
        await new Promise((res) => setTimeout(res, 900));
        setStatus("success");
        setMessage("You're in. Watch your inbox for 10% off.");
        setEmail("");
        setAgree(false);

        resetTimerRef.current = setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 4000);
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    },
    [email, agree, status]
  );

  const isLoading = status === "loading";

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3" noValidate>
      <div className="relative">
        <Mail
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-neutral-400 pointer-events-none"
          strokeWidth={2}
          aria-hidden="true"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          placeholder="your@email.com"
          autoComplete="email"
          aria-label="Email address"
          aria-invalid={status === "error"}
          disabled={isLoading}
          className="w-full pl-10 pr-32 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-neutral-900 dark:focus:border-white rounded-full text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 transition-colors outline-none focus:outline-none focus-visible:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity outline-none focus:outline-none focus-visible:outline-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span className="hidden sm:inline">Joining…</span>
            </>
          ) : (
            <>
              Subscribe
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      <label className="flex items-start gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 cursor-pointer select-none">
        <span className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked);
              if (status === "error") {
                setStatus("idle");
                setMessage("");
              }
            }}
            className="peer sr-only"
          />
          <span className="h-4 w-4 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 peer-checked:bg-neutral-900 dark:peer-checked:bg-white peer-checked:border-neutral-900 dark:peer-checked:border-white transition-colors flex items-center justify-center">
            <Check
              className="h-3 w-3 text-white dark:text-neutral-900 opacity-0 peer-checked:opacity-100 transition-opacity"
              strokeWidth={3}
              aria-hidden="true"
            />
          </span>
        </span>
        <span>
          I agree to receive marketing emails and accept the{" "}
          <Link
            to="/privacy"
            className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white outline-none focus:outline-none focus-visible:outline-none"
          >
            privacy policy
          </Link>
          .
        </span>
      </label>

      <AnimatePresence mode="wait">
        {message && (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className={`flex items-center gap-1.5 text-xs font-medium ${
              status === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
            role={status === "error" ? "alert" : "status"}
          >
            {status === "success" ? (
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            )}
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
});

/* ─────────────────────────────────────────────────────────────────
 * SocialRow
 * ───────────────────────────────────────────────────────────────── */
const SocialRow = memo(function SocialRow({ size = 15, className = "" }) {
  return (
    <ul className={`flex items-center gap-1 ${className}`}>
      {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all outline-none focus:outline-none focus-visible:outline-none"
          >
            <Icon size={size} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
});

/* ─────────────────────────────────────────────────────────────────
 * LocaleSwitcher — dropdown
 * ───────────────────────────────────────────────────────────────── */
const LocaleSwitcher = memo(function LocaleSwitcher() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState(LOCALES[0]);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors outline-none focus:outline-none focus-visible:outline-none"
      >
        <Globe className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        <span className="tabular-nums">
          {locale.flag} {locale.label}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden py-1 z-50"
          >
            {LOCALES.map((l) => (
              <li key={l.code} role="option" aria-selected={l.code === locale.code}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                    l.code === locale.code
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <span aria-hidden="true">{l.flag}</span>
                  <span className="truncate">{l.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
 * CurrencySwitcher — dropdown
 * ───────────────────────────────────────────────────────────────── */
const CurrencySwitcher = memo(function CurrencySwitcher() {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change currency"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors outline-none focus:outline-none focus-visible:outline-none"
      >
        <span className="tabular-nums">
          {currency.symbol} {currency.label}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-36 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden py-1 z-50"
          >
            {CURRENCIES.map((c) => (
              <li key={c.code} role="option" aria-selected={c.code === currency.code}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency(c);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                    c.code === currency.code
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <span className="truncate">
                    {c.symbol} {c.label}
                  </span>
                  {c.code === currency.code && (
                    <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
 * FooterColumn
 * ───────────────────────────────────────────────────────────────── */
const FooterColumn = memo(function FooterColumn({ title, links, index = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={index}
    >
      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-900 dark:text-neutral-100 mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className={`group inline-flex items-center gap-1.5 text-sm transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                link.isSale
                  ? "text-red-500 hover:text-red-600 font-semibold"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <span className="relative">
                {link.label}
                <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-current origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
});

/* ─────────────────────────────────────────────────────────────────
 * Footer — main
 * ───────────────────────────────────────────────────────────────── */
function Footer() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <>
      <footer
        className="relative w-full bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800"
        role="contentinfo"
      >
        {/* Top newsletter band */}
        <div className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-neutral-900 dark:text-neutral-100 leading-tight">
                  Join the FeatherdShop list.
                </h2>
                <p className="mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-md">
                  Early access to new drops, private sales, and stories from the atelier.
                  Get <span className="text-neutral-900 dark:text-white font-semibold">10% off</span> your first order.
                </p>
              </div>
              <div className="w-full max-w-md lg:ml-auto">
                <NewsletterForm />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Brand block */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="sm:col-span-2 lg:col-span-4 space-y-5"
            >
              <Link
                to="/"
                aria-label={`${BRAND_NAME} Home`}
                className="inline-flex flex-col group outline-none focus:outline-none focus-visible:outline-none"
              >
                <div className="flex items-center gap-2">
                  <Feather
                    className="h-6 w-6 text-neutral-900 dark:text-neutral-100 transition-transform duration-300 group-hover:-rotate-12"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="text-2xl font-black tracking-tighter text-neutral-900 dark:text-neutral-100">
                    {BRAND_NAME}
                    <span className="text-amber-500">.</span>
                  </span>
                </div>
                <span className="text-[9px] tracking-[0.3em] font-light uppercase text-neutral-400 mt-1">
                  {BRAND_TAGLINE}
                </span>
              </Link>

              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
                {BRAND_BLURB}
              </p>

              <div className="pt-1">
                <SocialRow />
              </div>

              {/* App badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href="#"
                  aria-label="Download on the App Store"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity outline-none focus:outline-none focus-visible:outline-none"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[8px] uppercase tracking-wider opacity-80">
                      Download on the
                    </span>
                    <span className="text-xs font-semibold">App Store</span>
                  </span>
                </a>
                <a
                  href="#"
                  aria-label="Get it on Google Play"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity outline-none focus:outline-none focus-visible:outline-none"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.09 12l2.608-2.492zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z" />
                  </svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[8px] uppercase tracking-wider opacity-80">
                      Get it on
                    </span>
                    <span className="text-xs font-semibold">Google Play</span>
                  </span>
                </a>
              </div>
            </motion.div>

            {/* Link columns */}
            <div className="sm:col-span-2 lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-6 lg:pl-4">
              {FOOTER_COLUMNS.map((col, i) => (
                <FooterColumn
                  key={col.title}
                  title={col.title}
                  links={col.links}
                  index={i}
                />
              ))}
            </div>

            {/* Contact block */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={3}
              className="sm:col-span-2 lg:col-span-3 space-y-4"
            >
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-900 dark:text-neutral-100">
                Get in touch
              </h3>
              <ul className="space-y-3">
                {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="block text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors break-words outline-none focus:outline-none focus-visible:outline-none"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 break-words">
                          {value}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {TRUST_BADGES.map((badge) => (
                <li
                  key={badge.title}
                  className="flex items-start gap-3"
                >
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {badge.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {badge.subtitle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Copyright + legal */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[11px] text-neutral-500 dark:text-neutral-400 text-center sm:text-left">
                <p>
                  © {year} {BRAND_NAME}. All rights reserved.
                </p>
                <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                  {LEGAL_LINKS.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="hover:text-neutral-900 dark:hover:text-white transition-colors outline-none focus:outline-none focus-visible:outline-none"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment + locale/currency */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ul
                  className="flex items-center gap-2"
                  aria-label="Accepted payment methods"
                >
                  {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                    <li key={label}>
                      <span
                        title={label}
                        aria-label={label}
                        className="inline-flex items-center justify-center h-7 w-10 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-1">
                  <LocaleSwitcher />
                  <CurrencySwitcher />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </>
  );
}

export default memo(Footer);