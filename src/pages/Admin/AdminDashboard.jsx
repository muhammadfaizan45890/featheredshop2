import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../utils/api";
import {
  Users,
  UserCog,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  X,
  Shield,
  LogIn,
  ChevronUp,
  ChevronDown,
  UserCheck,
  UserX,
  Sparkles,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
 * Color map for status / role chips
 * ───────────────────────────────────────────────────────────────── */
const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
    solid: "bg-blue-500",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-600 dark:text-violet-400",
    solid: "bg-violet-500",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    solid: "bg-emerald-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    solid: "bg-amber-500",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-600 dark:text-red-400",
    solid: "bg-red-500",
  },
};

/* ─────────────────────────────────────────────────────────────────
 * useDebounce hook (unchanged)
 * ───────────────────────────────────────────────────────────────── */
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

/* ─────────────────────────────────────────────────────────────────
 * ConfirmModal — redesigned
 * ───────────────────────────────────────────────────────────────── */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200/80 dark:border-neutral-800"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {title}
                </h3>
                <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors outline-none focus:outline-none focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 transition-colors outline-none focus:outline-none focus-visible:outline-none shadow-sm"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────────────────────────
 * StatCard
 * ───────────────────────────────────────────────────────────────── */
const StatCard = React.memo(function StatCard({ label, value, icon: Icon, color, index }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="group bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.text} shrink-0 transition-transform group-hover:scale-105`}>
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-0.5">
            {label}
          </p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

/* ─────────────────────────────────────────────────────────────────
 * SortHeader
 * ───────────────────────────────────────────────────────────────── */
const SortHeader = ({ label, field, sortField, sortOrder, onSort }) => {
  const active = sortField === field;
  return (
    <th
      className="p-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400 whitespace-nowrap cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="inline-flex items-center gap-1">
        {label}
        {active && (
          sortOrder === "asc"
            ? <ChevronUp size={12} strokeWidth={3} className="text-amber-500" />
            : <ChevronDown size={12} strokeWidth={3} className="text-amber-500" />
        )}
      </div>
    </th>
  );
};

/* ─────────────────────────────────────────────────────────────────
 * AdminDashboard
 * ───────────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  const debouncedSearch = useDebounce(search, 300);
  const itemsPerPage = 10;

  /* ================= FETCH USERS ================= */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/users`);
      setUsers(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ================= FILTER / SORT / PAGINATE ================= */
  const processedUsers = useMemo(() => {
    let result = [...users];

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    if (filterRole !== "all") {
      result = result.filter((u) => u.role === filterRole);
    }

    if (filterVerified !== "all") {
      const verified = filterVerified === "verified";
      result = result.filter((u) => u.isVerified === verified);
    }

    result.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (sortField === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, debouncedSearch, filterRole, filterVerified, sortField, sortOrder]);

  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedUsers.slice(start, start + itemsPerPage);
  }, [processedUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterRole, filterVerified, sortField, sortOrder]);

  /* ================= STATS ================= */
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const unverifiedCount = totalUsers - verifiedCount;

  /* ================= ACTIONS ================= */
  const deleteUser = useCallback((id, role) => {
    if (role === "admin") {
      toast.error("Admin cannot be deleted");
      return;
    }
    setModalAction({ type: "delete", payload: [id], message: "Delete this user?" });
    setModalOpen(true);
  }, []);

  const verifyUser = useCallback((id, isVerified) => {
    const newStatus = !isVerified;
    setModalAction({
      type: "verify",
      payload: { ids: [id], verify: newStatus },
      message: newStatus ? "Verify this user?" : "Unverify this user?",
    });
    setModalOpen(true);
  }, []);

  const bulkDelete = useCallback(() => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one user");
      return;
    }
    setModalAction({
      type: "delete",
      payload: selectedIds,
      message: `Delete ${selectedIds.length} user(s)?`,
    });
    setModalOpen(true);
  }, [selectedIds]);

  const bulkVerify = useCallback(
    (verify) => {
      if (selectedIds.length === 0) {
        toast.error("Select at least one user");
        return;
      }
      setModalAction({
        type: "verify",
        payload: { ids: selectedIds, verify },
        message: `${verify ? "Verify" : "Unverify"} ${selectedIds.length} user(s)?`,
      });
      setModalOpen(true);
    },
    [selectedIds]
  );

  const confirmAction = useCallback(async () => {
    if (!modalAction) return;
    const { type, payload } = modalAction;

    try {
      if (type === "delete") {
        const ids = payload;
        const adminInList = users.some(
          (u) => ids.includes(u._id) && u.role === "admin"
        );
        if (adminInList) {
          toast.error("Admins cannot be deleted");
          return;
        }
        await Promise.all(ids.map((id) => axios.delete(`${API}/admin/user/${id}`)));
        setUsers((prev) => prev.filter((u) => !ids.includes(u._id)));
        toast.success(`${ids.length} user(s) deleted`);
        setSelectedIds([]);
      } else if (type === "verify") {
        const { ids, verify } = payload;
        await Promise.all(
          ids.map((id) =>
            axios.put(`${API}/admin/verify-user/${id}`, { isVerified: verify })
          )
        );
        setUsers((prev) =>
          prev.map((u) =>
            ids.includes(u._id) ? { ...u, isVerified: verify } : u
          )
        );
        toast.success(`${ids.length} user(s) ${verify ? "verified" : "unverified"}`);
        setSelectedIds([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setModalAction(null);
    }
  }, [modalAction, users]);

  /* ================= SELECTION ================= */
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedUsers.map((u) => u._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  /* ================= SORT HANDLER ================= */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="space-y-5">
      {/* ─── HEADER ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 p-5 sm:p-6"
      >
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-500 blur-3xl" />
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" strokeWidth={2} aria-hidden="true" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
                User Management
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-400 mt-1.5 max-w-lg">
              Manage users, roles, and verification status across your platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold backdrop-blur-sm border border-white/10 transition-colors outline-none focus:outline-none focus-visible:outline-none"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={2.5} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── STATS ──────────────────────────────── */}
      <section aria-label="User statistics" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Users" value={totalUsers} icon={Users} color="blue" index={0} />
        <StatCard label="Admins" value={adminCount} icon={UserCog} color="violet" index={1} />
        <StatCard label="Verified" value={verifiedCount} icon={CheckCircle} color="emerald" index={2} />
        <StatCard label="Unverified" value={unverifiedCount} icon={XCircle} color="red" index={3} />
      </section>

      {/* ─── CONTROLS ───────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-900 rounded-xl text-[13px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 transition-colors outline-none focus:outline-none focus-visible:outline-none"
              aria-label="Search users"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 rounded-xl text-[13px] font-medium text-neutral-700 dark:text-neutral-300 outline-none focus:outline-none cursor-pointer"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 rounded-xl text-[13px] font-medium text-neutral-700 dark:text-neutral-300 outline-none focus:outline-none cursor-pointer"
              aria-label="Filter by verification"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── BULK ACTIONS ───────────────────────── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 sm:gap-3 p-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-2xl shadow-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-900 animate-pulse" />
                {selectedIds.length} selected
              </span>

              <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                <button
                  onClick={bulkDelete}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 outline-none focus:outline-none focus-visible:outline-none"
                >
                  <Trash2 size={13} strokeWidth={2.5} />
                  Delete
                </button>
                <button
                  onClick={() => bulkVerify(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 outline-none focus:outline-none focus-visible:outline-none"
                >
                  <Check size={13} strokeWidth={2.5} />
                  Verify
                </button>
                <button
                  onClick={() => bulkVerify(false)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 outline-none focus:outline-none focus-visible:outline-none"
                >
                  <X size={13} strokeWidth={2.5} />
                  Unverify
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 dark:bg-neutral-900/10 dark:hover:bg-neutral-900/20 text-white dark:text-neutral-900 rounded-lg text-[12px] font-semibold transition-colors outline-none focus:outline-none focus-visible:outline-none"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TABLE ──────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800">
              <tr>
                <th className="p-3 w-10">
                  {loading ? (
                    <div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                  ) : (
                    <input
                      type="checkbox"
                      checked={
                        paginatedUsers.length > 0 &&
                        selectedIds.length === paginatedUsers.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                      aria-label="Select all"
                    />
                  )}
                </th>

                {loading ? (
                  ["", "", "", "", "", "", "", ""].map((_, i) => (
                    <th key={i} className="p-3">
                      <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    </th>
                  ))
                ) : (
                  <>
                    <SortHeader label="Username" field="username" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                    <SortHeader label="Email" field="email" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                    <SortHeader label="Role" field="role" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                    <th className="p-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400 whitespace-nowrap">Verified</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400 whitespace-nowrap">Logged In</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400 whitespace-nowrap">Google ID</th>
                    <SortHeader label="Created" field="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                    <th className="p-3 text-right text-[10px] uppercase tracking-wider font-bold text-neutral-400 whitespace-nowrap">Action</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-3"><div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-5 w-14 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" /></td>
                    <td className="p-3"><div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-10 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                    <td className="p-3 text-right"><div className="h-6 w-16 ml-auto bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user._id)}
                        onChange={() => toggleSelect(user._id)}
                        className="w-4 h-4 rounded accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                        aria-label={`Select ${user.username}`}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-300 shrink-0">
                          {(user.username || user.email || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {user.username || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[12px] text-neutral-600 dark:text-neutral-400 break-all">
                        {user.email}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                          user.role === "admin"
                            ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {user.role === "admin" && <Shield className="h-3 w-3" strokeWidth={2.5} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => verifyUser(user._id, user.isVerified)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                          user.isVerified
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isVerified ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                        {user.isVerified ? "Verified" : "Unverified"}
                      </button>
                    </td>
                    <td className="p-3">
                      {user.isLoggedIn ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <LogIn size={13} strokeWidth={2.5} />
                          Yes
                        </span>
                      ) : (
                        <span className="text-[12px] text-neutral-400">No</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 break-all">
                        {user.googleId || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-[12px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteUser(user._id, user.role)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 text-[11px] font-semibold transition-colors outline-none focus:outline-none focus-visible:outline-none"
                        aria-label={`Delete ${user.username}`}
                      >
                        <Trash2 size={12} strokeWidth={2.5} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                      <Users className="h-8 w-8 opacity-40" strokeWidth={1.5} aria-hidden="true" />
                      <p className="text-[13px] font-medium">No users found</p>
                      <p className="text-[11px]">Try adjusting your filters or search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── PAGINATION ───────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
              Showing{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, processedUsers.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {processedUsers.length}
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <span className="px-3 py-1.5 text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                aria-label="Next page"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── CONFIRM MODAL ──────────────────────── */}
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalAction(null);
        }}
        onConfirm={confirmAction}
        title="Confirm Action"
        message={modalAction?.message || "Are you sure?"}
      />
    </div>
  );
};

export default AdminDashboard;