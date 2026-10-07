import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import API from "../../utils/api";
import {
  FiMail,
  FiCheckCircle,
  FiCircle,
  FiTrash2,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";

// ─── Helper: create a reliable API instance ──────────
const getApiInstance = () => {
  let instance;
  if (API && typeof API.get === 'function') {
    instance = API;
  } else {
    instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
      headers: { 'Content-Type': 'application/json' },
    });
  }
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  return instance;
};

const api = getApiInstance();

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [limit] = useState(10);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/contact", {
        params: {
          page,
          limit,
          status: filterStatus !== "all" ? filterStatus : undefined,
        },
      });
      setMessages(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalMessages(res.data.pagination.total);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again.");
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, filterStatus]);

  const handleMarkAsRead = async (id, isRead) => {
    try {
      await api.patch(`/api/contact/${id}/read`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === id ? { ...msg, isRead: !isRead } : msg
        )
      );
      toast.success(isRead ? "Marked as unread" : "Marked as read");
    } catch (err) {
      toast.error("Failed to update message status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/api/contact/${id}`);
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
      setTotalMessages((prev) => prev - 1);
      toast.success("Message deleted");
      if (messages.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  const handleRefresh = () => {
    fetchMessages();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Messages</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            {totalMessages} messages received
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleRefresh}
            className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <FiRefreshCw size={14} className="sm:w-4 sm:h-4" className={loading ? "animate-spin" : ""} /> <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Filter Bar ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
          <FiFilter size={14} className="sm:w-4 sm:h-4" />
          <span>Filter:</span>
        </div>
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border ${
            filterStatus === "all"
              ? "bg-black text-white border-black"
              : "bg-white text-gray-700 border-gray-300 hover:border-black"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus("unread")}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border ${
            filterStatus === "unread"
              ? "bg-black text-white border-black"
              : "bg-white text-gray-700 border-gray-300 hover:border-black"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilterStatus("read")}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border ${
            filterStatus === "read"
              ? "bg-black text-white border-black"
              : "bg-white text-gray-700 border-gray-300 hover:border-black"
          }`}
        >
          Read
        </button>
      </div>

      {/* ─── Messages List ─────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-black border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-8 sm:py-12 text-red-500 text-sm sm:text-base">{error}</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FiMail size={32} className="sm:w-10 sm:h-10 mx-auto text-gray-400" />
          <p className="text-gray-500 text-sm sm:text-lg mt-3 sm:mt-4">No messages found</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`bg-white border rounded-lg p-3 sm:p-4 md:p-6 shadow-sm hover:shadow-md transition ${
                msg.isRead ? "border-gray-200" : "border-black border-l-4"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-semibold text-black truncate">
                      {msg.name}
                    </h3>
                    <span
                      className={`text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full ${
                        msg.isRead
                          ? "bg-gray-100 text-gray-600"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {msg.isRead ? "Read" : "Unread"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 break-all">
                    <a href={`mailto:${msg.email}`} className="hover:underline">
                      {msg.email}
                    </a>
                  </p>
                  {msg.subject && (
                    <p className="text-xs sm:text-sm font-medium text-gray-800 mt-1">
                      Subject: {msg.subject}
                    </p>
                  )}
                  <p className="text-gray-700 text-xs sm:text-sm mt-1.5 sm:mt-2 whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                    Received: {formatDate(msg.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleMarkAsRead(msg._id, msg.isRead)}
                    className="p-1.5 sm:p-2 text-gray-500 hover:text-black transition"
                    title={msg.isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {msg.isRead ? (
                      <FiCircle size={16} className="sm:w-4 sm:h-4" />
                    ) : (
                      <FiCheckCircle size={16} className="sm:w-4 sm:h-4 text-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(msg._id)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <FiTrash2 size={16} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination ────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1.5 sm:p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FiChevronLeft size={16} className="sm:w-4 sm:h-4" />
          </button>
          <span className="text-xs sm:text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-1.5 sm:p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FiChevronRight size={16} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;