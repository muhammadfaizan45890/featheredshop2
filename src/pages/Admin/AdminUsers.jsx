import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import API from "../../utils/api";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Filter,
  User,
  BookOpen,
  CreditCard,
  Calendar,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ---------- Custom Hooks ----------
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

// ---------- Custom Confirmation Modal ----------
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Main Component ----------
const AdminUsers = () => {
  // ================= STATE =================
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");

  // Sorting
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // ================= FETCH ENROLLMENTS =================
  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/enroll/all`);
      setEnrollments(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load enrollments");
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // ================= PROCESSED DATA (filter + sort) =================
  const processedEnrollments = useMemo(() => {
    let result = [...enrollments];

    // Search (user name or email)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.userId?.username?.toLowerCase().includes(q) ||
          item.userId?.email?.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((item) => item.status === filterStatus);
    }

    // Filter by payment method
    if (filterPayment !== "all") {
      result = result.filter((item) => item.paymentMethod === filterPayment);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal, bVal;
      if (sortField === "user") {
        aVal = a.userId?.username || "";
        bVal = b.userId?.username || "";
      } else if (sortField === "course") {
        aVal = a.courseId?.title || "";
        bVal = b.courseId?.title || "";
      } else if (sortField === "payment") {
        aVal = a.paymentMethod || "";
        bVal = b.paymentMethod || "";
      } else if (sortField === "status") {
        aVal = a.status || "";
        bVal = b.status || "";
      } else { // createdAt
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [enrollments, debouncedSearch, filterStatus, filterPayment, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedEnrollments.length / itemsPerPage);
  const paginatedEnrollments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedEnrollments.slice(start, start + itemsPerPage);
  }, [processedEnrollments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, filterPayment, sortField, sortOrder]);

  // ================= STATS =================
  const total = enrollments.length;
  const pending = enrollments.filter((e) => e.status === "pending").length;
  const active = enrollments.filter((e) => e.status === "active").length;
  const refund = enrollments.filter((e) => e.status === "refund").length;

  // ================= STATUS STYLE =================
  const getStatusStyle = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "refund":
        return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700";
    }
  };

  // ================= ACTIONS =================
  const updateStatus = useCallback(
    async (id, status) => {
      try {
        await axios.put(`${API}/enroll/status/${id}`, { status });
        setEnrollments((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status } : item))
        );
        toast.success(`Status updated to ${status}`);
      } catch (error) {
        console.error(error);
        toast.error("Failed to update status");
      }
    },
    []
  );

  const deleteEnrollment = useCallback(
    (id) => {
      setModalAction({
        type: "delete",
        payload: [id],
        message: "Delete this enrollment?",
      });
      setModalOpen(true);
    },
    []
  );

  const bulkDelete = useCallback(() => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one enrollment");
      return;
    }
    setModalAction({
      type: "delete",
      payload: selectedIds,
      message: `Delete ${selectedIds.length} enrollment(s)?`,
    });
    setModalOpen(true);
  }, [selectedIds]);

  const bulkStatusUpdate = useCallback(
    (status) => {
      if (selectedIds.length === 0) {
        toast.error("Select at least one enrollment");
        return;
      }
      setModalAction({
        type: "status",
        payload: { ids: selectedIds, status },
        message: `Set ${selectedIds.length} enrollment(s) to ${status}?`,
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
        await Promise.all(payload.map((id) => axios.delete(`${API}/enroll/delete/${id}`)));
        setEnrollments((prev) => prev.filter((item) => !payload.includes(item._id)));
        toast.success(`${payload.length} enrollment(s) deleted`);
        setSelectedIds([]);
      } else if (type === "status") {
        const { ids, status } = payload;
        await Promise.all(
          ids.map((id) => axios.put(`${API}/enroll/status/${id}`, { status }))
        );
        setEnrollments((prev) =>
          prev.map((item) =>
            ids.includes(item._id) ? { ...item, status } : item
          )
        );
        toast.success(`${ids.length} enrollment(s) updated to ${status}`);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setModalAction(null);
    }
  }, [modalAction]);

  // ================= SELECTION =================
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedEnrollments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedEnrollments.map((e) => e._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ================= SORT HANDLER =================
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-zinc-900 dark:text-white">
              Enrollment Requests
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm md:text-base">
              Manage all course enrollments
            </p>
          </div>
          <button
            onClick={fetchEnrollments}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold text-black dark:text-white">{total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-xl font-bold text-black dark:text-white">{pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-xl font-bold text-black dark:text-white">{active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Refund</p>
                <p className="text-xl font-bold text-black dark:text-white">{refund}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="refund">Refund</option>
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Payments</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
            </select>
          </div>
        </div>

        {/* BULK ACTIONS */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex-wrap">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.length} selected
            </span>
            <button
              onClick={bulkDelete}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={() => bulkStatusUpdate("pending")}
              className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
            >
              Set Pending
            </button>
            <button
              onClick={() => bulkStatusUpdate("active")}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              Set Active
            </button>
            <button
              onClick={() => bulkStatusUpdate("refund")}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Set Refund
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* ================= TABLE ================= */}
        {loading ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-8 text-center">
            <div className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
              Loading enrollments...
            </div>
          </div>
        ) : paginatedEnrollments.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-12 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              No Matching Results
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] md:min-w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-700/50">
                    <tr>
                      <th className="p-2 md:p-3 w-10">
                        <input
                          type="checkbox"
                          checked={
                            paginatedEnrollments.length > 0 &&
                            selectedIds.length === paginatedEnrollments.length
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
                        />
                      </th>
                      <th
                        className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                        onClick={() => handleSort("user")}
                      >
                        <div className="flex items-center gap-1">
                          User
                          {sortField === "user" &&
                            (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th
                        className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                        onClick={() => handleSort("course")}
                      >
                        <div className="flex items-center gap-1">
                          Course
                          {sortField === "course" &&
                            (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th
                        className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                        onClick={() => handleSort("payment")}
                      >
                        <div className="flex items-center gap-1">
                          Payment
                          {sortField === "payment" &&
                            (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th
                        className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortField === "status" &&
                            (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th
                        className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap hidden lg:table-cell"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-1">
                          Enrolled At
                          {sortField === "createdAt" &&
                            (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </th>
                      <th className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEnrollments.map((item, index) => (
                      <tr
                        key={item._id}
                        className={`border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors ${
                          index % 2 === 0 ? "bg-white dark:bg-zinc-800" : "bg-zinc-50/50 dark:bg-zinc-800/50"
                        }`}
                      >
                        <td className="p-2 md:p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item._id)}
                            onChange={() => toggleSelect(item._id)}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
                          />
                        </td>
                        <td className="p-2 md:p-3">
                          <div>
                            <p className="font-medium text-sm md:text-base text-zinc-900 dark:text-white">
                              {item.userId?.username || "N/A"}
                            </p>
                            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 break-all max-w-[180px]">
                              {item.userId?.email || "No Email"}
                            </p>
                          </div>
                        </td>
                        <td className="p-2 md:p-3">
                          <div>
                            <p className="font-medium text-sm md:text-base text-zinc-900 dark:text-white">
                              {item.courseId?.title || "N/A"}
                            </p>
                            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-[200px]">
                              {item.courseId?.description || "No Description"}
                            </p>
                          </div>
                        </td>
                        <td className="p-2 md:p-3">
                          <span className="bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap">
                            {item.paymentMethod || "N/A"}
                          </span>
                        </td>
                        <td className="p-2 md:p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase whitespace-nowrap ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2 md:p-3 text-xs md:text-sm text-zinc-600 dark:text-zinc-400 hidden lg:table-cell whitespace-nowrap">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
                        </td>
                        <td className="p-2 md:p-3">
                          <div className="flex flex-wrap gap-1.5">
                            {item.status !== "pending" && (
                              <button
                                onClick={() => updateStatus(item._id, "pending")}
                                className="px-2 py-1 text-[10px] md:text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 whitespace-nowrap"
                              >
                                Pending
                              </button>
                            )}
                            {item.status !== "active" && (
                              <button
                                onClick={() => updateStatus(item._id, "active")}
                                className="px-2 py-1 text-[10px] md:text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                              >
                                Active
                              </button>
                            )}
                            {item.status !== "refund" && (
                              <button
                                onClick={() => updateStatus(item._id, "refund")}
                                className="px-2 py-1 text-[10px] md:text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 whitespace-nowrap"
                              >
                                Refund
                              </button>
                            )}
                            <button
                              onClick={() => deleteEnrollment(item._id)}
                              className="px-2 py-1 text-[10px] md:text-xs bg-black dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-600 transition whitespace-nowrap"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            {!loading && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, processedEnrollments.length)} of{" "}
                  {processedEnrollments.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-black dark:text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= CONFIRM MODAL ================= */}
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

export default AdminUsers;