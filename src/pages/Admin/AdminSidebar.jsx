import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Feather,
  Users,
  MousePointerSquareDashed,
  Sliders,
  MessagesSquare,
  AlignEndVertical,
  Globe,
  Music,
  DollarSign,
  Sparkles,
  Shield,
  Home,
  Package,
} from "lucide-react";
import { getData } from "@/context/userContext";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { setUser } = getData();

  const NAVBAR_HEIGHT = 64;

  const [collapsed, setCollapsed] = useState(false);
  const [, setIsMobile] = useState(false);

  // Responsive collapse
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setCollapsed(mobile ? true : false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { title: "Users",             icon: Users,                    path: "/admin/dashboard" },
    { title: "Orders",            icon: Package,                  path: "/admin/orders" },
    { title: "Create Posts",      icon: MousePointerSquareDashed, path: "/admin/create-posts", badge: 3 },
    { title: "Hero Slides",       icon: Sliders,                  path: "/admin/admin-hero" },
    { title: "Messages",          icon: MessagesSquare,           path: "/admin/admin-messages", badge: 5 },
    { title: "Advertise Inquiry", icon: AlignEndVertical,         path: "/admin/admin-advertise" },
    { title: "Featured",          icon: Globe,                    path: "/admin/admin-featured" },
    { title: "Audio",             icon: Music,                    path: "/admin/admin-audio" },
    { title: "Advertisements",    icon: DollarSign,               path: "/admin/advertisements" },
  ];

  const logoutHandler = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside
        style={{
          top: NAVBAR_HEIGHT,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        }}
        className={`
          fixed left-0 z-40
          flex flex-col
          bg-white dark:bg-neutral-950
          text-neutral-900 dark:text-neutral-100
          border-r border-neutral-200/80 dark:border-neutral-800
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[80px]" : "w-[280px]"}
        `}
        aria-label="Admin sidebar"
      >
        {/* ─── Header ─────────────────────────────── */}
        <div
          className={`
            h-16 flex items-center shrink-0
            border-b border-neutral-200/80 dark:border-neutral-800
            px-4
            ${collapsed ? "justify-center" : "justify-between"}
          `}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center shrink-0">
              <Shield
                className="h-4 w-4 text-white dark:text-neutral-900"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="text-sm font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                  Admin<span className="text-amber-500">.</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-medium mt-0.5 truncate">
                  FeatheredSHOP
                </span>
              </div>
            )}
          </div>

          {!collapsed ? (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors outline-none focus-visible:outline-none"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full p-1 shadow-sm hover:scale-105 transition-transform outline-none focus-visible:outline-none"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* ─── Nav ────────────────────────────────── */}
        <nav
          className={`
            flex-1 px-3 py-4
            ${collapsed ? "overflow-visible" : "overflow-y-auto overscroll-contain"}
          `}
        >
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 px-3 mb-2">
              Main Menu
            </p>
          )}

          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      group relative flex items-center
                      ${collapsed ? "justify-center" : "justify-start"}
                      gap-3 px-3 py-2.5 rounded-xl
                      text-[13px] font-medium
                      transition-all duration-200
                      outline-none focus:outline-none focus-visible:outline-none
                      ${
                        isActive
                          ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100"
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? "" : "text-neutral-400"
                          }`}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.title}</span>
                        )}
                        {!collapsed && item.badge && (
                          <span
                            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? "bg-white/20 text-white dark:bg-neutral-900/20 dark:text-neutral-900"
                                : "bg-amber-400 text-amber-950"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Tooltip when collapsed */}
                        {collapsed && (
                          <span
                            className="
                              absolute left-full ml-4 px-3 py-1.5
                              bg-neutral-900 dark:bg-neutral-100
                              text-white dark:text-neutral-900
                              text-xs font-medium rounded-lg shadow-lg
                              opacity-0 group-hover:opacity-100
                              transition-opacity duration-200
                              whitespace-nowrap pointer-events-none z-50
                            "
                          >
                            {item.title}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* ─── Quick Links ───────────────────────── */}
          <div className="mt-6 pt-4 border-t border-neutral-200/80 dark:border-neutral-800">
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 px-3 mb-2">
                Quick Links
              </p>
            )}
            <ul className="space-y-0.5">
              <li>
                <NavLink
                  to="/"
                  className={`
                    group relative flex items-center
                    ${collapsed ? "justify-center" : "justify-start"}
                    gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                    text-neutral-600 dark:text-neutral-400
                    hover:bg-neutral-100 dark:hover:bg-neutral-900
                    hover:text-neutral-900 dark:hover:text-neutral-100
                    transition-colors outline-none focus-visible:outline-none
                  `}
                >
                  <Home
                    className="h-[18px] w-[18px] shrink-0 text-neutral-400 transition-transform group-hover:scale-110"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="flex-1 truncate">Back to Store</span>}
                  {collapsed && (
                    <span
                      className="
                        absolute left-full ml-4 px-3 py-1.5
                        bg-neutral-900 dark:bg-neutral-100
                        text-white dark:text-neutral-900
                        text-xs font-medium rounded-lg shadow-lg
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                        whitespace-nowrap pointer-events-none z-50
                      "
                    >
                      Back to Store
                    </span>
                  )}
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* ─── Footer: Pro Card + Logout ──────────── */}
        <div className="p-3 shrink-0 space-y-3">
          {/* Pro upsell – hidden when collapsed */}
          {!collapsed && (
            <div className="relative rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 p-4 overflow-hidden">
              <Sparkles
                className="absolute -top-2 -right-2 h-16 w-16 text-amber-400/20"
                strokeWidth={1}
                aria-hidden="true"
              />
              <p className="text-[11px] font-bold text-white mb-1 relative">
                Pro Analytics
              </p>
              <p className="text-[10px] text-neutral-400 leading-relaxed mb-3 relative">
                Unlock AI-powered insights & forecasts.
              </p>
              <button
                type="button"
                className="w-full py-2 rounded-lg bg-amber-400 text-amber-950 text-[11px] font-bold hover:bg-amber-300 transition-colors outline-none focus-visible:outline-none"
              >
                Upgrade Now
              </button>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logoutHandler}
            className={`
              group relative w-full flex items-center
              ${collapsed ? "justify-center" : "justify-start"}
              gap-3 px-3 py-2.5 rounded-xl
              text-[13px] font-medium
              text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-950/40
              transition-all duration-200
              outline-none focus-visible:outline-none
            `}
          >
            <LogOut
              size={18}
              strokeWidth={2}
              className="shrink-0 transition-transform group-hover:scale-110"
              aria-hidden="true"
            />
            {!collapsed && <span className="flex-1 text-left">Logout</span>}
            {collapsed && (
              <span
                className="
                  absolute left-full ml-4 px-3 py-1.5
                  bg-neutral-900 dark:bg-neutral-100
                  text-white dark:text-neutral-900
                  text-xs font-medium rounded-lg shadow-lg
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  whitespace-nowrap pointer-events-none z-50
                "
              >
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ─── Spacer ─────────────────────────────── */}
      <div
        className={`
          transition-all duration-300
          ${collapsed ? "w-[80px]" : "w-[280px]"}
        `}
      />
    </>
  );
};

export default AdminSidebar;