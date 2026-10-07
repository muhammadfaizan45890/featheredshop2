import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  User,
  BookOpen,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BookKeyIcon,
  DollarSignIcon,
  BookCheck,
  Book,
  GraduationCap,
  Map,
  AtomIcon,
  AirVent,
  CircleDashed,
  Pencil,
  Award,
  GraduationCapIcon,
} from "lucide-react";

// Import user context to clear state on logout
import { getData } from "@/context/userContext";

const UserSidebar = () => {
  const navigate = useNavigate();
  const { setUser } = getData(); // to clear global user

  const NAVBAR_HEIGHT = 64;

  // ================= STATES =================
  const [collapsed, setCollapsed] = useState(false);
  const [, setIsMobile] = useState(false);

  // ================= RESPONSIVE =================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ================= MENU =================
  const menuItems = [
    // { title: "Courses", icon: <GraduationCapIcon size={20} />, path: "/courses" },
    // { title: "Profile", icon: <User size={20} />, path: "/profile" },
    // { title: "Active Courses", icon: <BookOpen size={20} />, path: "/active-courses" },
    // { title: "Notes", icon: <Pencil size={20} />, path: "/notes" },
    // { title: "Apply for Refund", icon: <DollarSignIcon size={20} />, path: "/apply-refund" },
    // { title: "Certificate", icon: <Award size={20} />, path: "/certificate" },
    // { title: "LMS Guide", icon: <Map size={20} />, path: "/guide" },
  ];

  // ================= LOGOUT =================
  const logoutHandler = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login", { replace: true });
    window.location.reload();
  };

  return (
    <>
      {/* ================= SIDEBAR ================= */}
      <aside
        style={{
          top: NAVBAR_HEIGHT,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        }}
        className={`
          fixed left-0
          mt-24
          text-gray-900
          border-r border-gray-200
          flex flex-col
          transition-all duration-300 ease-in-out
          bg-white
          ${collapsed ? "w-[80px]" : "w-[280px]"}
        `}
      >
        {/* ================= HEADER ================= */}
        <div
          className={`
            flex items-center
            px-4 py-5
            border-b border-gray-200
            ${collapsed ? "justify-center" : "justify-between"}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-full">
              <GraduationCap size={20} />
            </div>

            {!collapsed && (
              <div>
                <h1 className="font-bold text-sm text-gray-900">Student Panel</h1>
                <p className="text-xs text-gray-500">LMS Dashboard</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-6 bg-black text-white rounded-full p-1 hover:bg-gray-800 transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* ================= MENU ================= */}
        <div
          className={`
            flex-1 px-3 py-4 space-y-1
            ${collapsed ? "overflow-hidden" : "overflow-y-auto"}
          `}
        >
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center
                ${collapsed ? "justify-center" : "justify-start"}
                gap-3
                px-4 py-3
                rounded-xl
                transition-all duration-200
                ${isActive
                  ? "bg-gray-100 text-black"
                  : "text-gray-700 hover:bg-gray-50 hover:text-black"
                }
                ${collapsed ? "relative group" : ""}
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>

              {!collapsed && (
                <span className="text-sm font-medium">{item.title}</span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <span className="
                  absolute left-full ml-4 px-3 py-1.5
                  bg-gray-900 text-white text-xs font-medium
                  rounded-lg shadow-lg
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  whitespace-nowrap
                  pointer-events-none
                  z-50
                ">
                  {item.title}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={logoutHandler}
            className={`
              w-full flex items-center
              ${collapsed ? "justify-center" : "justify-start"}
              gap-3
              px-4 py-3
              rounded-xl
              text-red-600 hover:text-red-700
              hover:bg-red-50
              transition-all duration-200
              ${collapsed ? "relative group" : ""}
            `}
          >
            <LogOut size={20} />

            {!collapsed && <span className="text-sm font-medium">Logout</span>}

            {/* Tooltip for collapsed state */}
            {collapsed && (
              <span className="
                absolute left-full ml-4 px-3 py-1.5
                bg-gray-900 text-white text-xs font-medium
                rounded-lg shadow-lg
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                whitespace-nowrap
                pointer-events-none
                z-50
              ">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ================= CONTENT SPACER ================= */}
      <div
        className={`
          transition-all duration-300
          ${collapsed ? "w-[80px]" : "w-[280px]"}
        `}
      />
    </>
  );
};

export default UserSidebar;