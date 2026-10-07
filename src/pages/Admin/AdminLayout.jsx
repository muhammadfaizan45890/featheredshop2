import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  CheckCircle2,
  AlertCircle,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  User,
  Home,
  Shield,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getData } from "@/context/userContext";
import useClickOutside from "../../components/hooks/useClickOutside";
import AdminSidebar from "./AdminSidebar";

/* ────────────────────────────────────────────────────────────
 * Page title resolver
 * ──────────────────────────────────────────────────────────── */
const PAGE_TITLES = {
  dashboard: "Dashboard",
  profile: "Profile",
  users: "Users",
  "create-posts": "Create Posts",
  "admin-hero": "Hero Slides",
  "admin-messages": "Messages",
  "admin-advertise": "Advertise Inquiry",
  "admin-featured": "Featured",
  "admin-audio": "Audio",
  advertisements: "Advertisements",
};

const COLOR_MAP = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" },
};

/* ────────────────────────────────────────────────────────────
 * Topbar
 * ──────────────────────────────────────────────────────────── */
const Topbar = memo(function Topbar({ onMenuClick, user, onLogout, title }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useClickOutside([notifRef], () => setNotifOpen(false), notifOpen);
  useClickOutside([userRef], () => setUserOpen(false), userOpen);

  // ✅ Escape key closes both dropdowns (a11y)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials = useMemo(() => {
    if (user?.fullname) {
      return user.fullname.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email ? user.email[0].toUpperCase() : "A";
  }, [user]);

  const notifications = [
    { icon: ShoppingCart, text: "New order #ORD-7841", time: "2 min ago", color: "blue", unread: true },
    { icon: AlertCircle, text: "Low stock alert", time: "2 hr ago", color: "amber", unread: true },
    { icon: Users, text: "New customer registered", time: "15 min ago", color: "violet", unread: false },
    { icon: CheckCircle2, text: "Payment received", time: "1 hr ago", color: "emerald", unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800">
      <div className="h-16 flex items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 outline-none focus:outline-none focus-visible:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 shrink-0">
              Admin
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span className="text-[13px] text-neutral-400 truncate">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="hidden lg:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" strokeWidth={2} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search…"
              className="w-56 xl:w-64 pl-9 pr-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 rounded-full text-[13px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 transition-colors outline-none focus:outline-none focus-visible:outline-none"
              aria-label="Search admin"
            />
          </div>

          <button
            type="button"
            className="hidden sm:inline-flex p-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors outline-none focus:outline-none focus-visible:outline-none"
            aria-label="Refresh"
          >
            <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors outline-none focus:outline-none focus-visible:outline-none"
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-haspopup="true"
              aria-expanded={notifOpen}
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Notifications
                    </h3>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline outline-none focus:outline-none focus-visible:outline-none"
                    >
                      Mark all read
                    </button>
                  </div>
                  <ul className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-neutral-100 dark:divide-neutral-800">
                    {notifications.map((n, i) => {
                      const Icon = n.icon;
                      const colors = COLOR_MAP[n.color] || COLOR_MAP.blue;
                      return (
                        <li
                          key={i}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer ${
                            n.unread ? "bg-blue-50/40 dark:bg-blue-950/10" : ""
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} shrink-0`}>
                            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {n.text}
                            </p>
                            <p className="text-[11px] text-neutral-400 mt-0.5">{n.time}</p>
                          </div>
                          {n.unread && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div ref={userRef} className="relative">
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="flex items-center gap-2 p-0.5 pl-0.5 pr-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors outline-none focus:outline-none focus-visible:outline-none"
              aria-haspopup="true"
              aria-expanded={userOpen}
              aria-label="Admin account menu"
            >
              <Avatar className="h-8 w-8 border border-neutral-200 dark:border-neutral-700">
                <AvatarFallback className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black text-[11px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown
                className={`h-3.5 w-3.5 text-neutral-400 transition-transform hidden sm:block ${
                  userOpen ? "rotate-180" : ""
                }`}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-neutral-100 dark:divide-neutral-800"
                >
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <Avatar className="h-10 w-10 border border-neutral-200 dark:border-neutral-700 shrink-0">
                      <AvatarFallback className="bg-neutral-900 text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {user?.fullname || "Admin User"}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {user?.email || "admin@featheredshop.com"}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-amber-950">
                        <Shield className="h-2.5 w-2.5" strokeWidth={2.5} />
                        ADMIN
                      </span>
                    </div>
                  </div>

                  <div className="py-1.5">
                    <Link
                      to="/admin/profile"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                    >
                      <User className="h-4 w-4 text-neutral-400 shrink-0" strokeWidth={2} />
                      My Profile
                    </Link>
                    <Link
                      to="/admin/settings"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                    >
                      <Settings className="h-4 w-4 text-neutral-400 shrink-0" strokeWidth={2} />
                      Settings
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                    >
                      <Home className="h-4 w-4 text-neutral-400 shrink-0" strokeWidth={2} />
                      Back to Store
                    </Link>
                  </div>

                  <div className="py-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onLogout?.();
                        setUserOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left outline-none focus:outline-none focus-visible:outline-none"
                    >
                      <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
});

/* ────────────────────────────────────────────────────────────
 * AdminLayout
 * ──────────────────────────────────────────────────────────── */
function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = getData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = location?.pathname || "/admin/dashboard";

  // ✅ Pretty page title via map (falls back to capitalized segment)
  const pageTitle = useMemo(() => {
    const seg = currentPath.split("/").filter(Boolean).pop() || "dashboard";
    return PAGE_TITLES[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
  }, [currentPath]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPath]);

  // Scroll content to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [currentPath]);

  // Lock body scroll while mobile sidebar is open
  useEffect(() => {
    if (!sidebarOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [sidebarOpen]);

  const handleLogout = useCallback(() => {
    logout?.();
    navigate("/login");
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={currentPath}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          onLogout={handleLogout}
          title={pageTitle}
        />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="px-3 py-4 pb-24 sm:px-5 sm:py-5 sm:pb-6 lg:px-6 lg:py-6 max-w-[1600px] mx-auto w-full transition-[padding] duration-300 ease-in-out">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default memo(AdminLayout);