import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiTrash2, FiRefreshCw, FiEye } from 'react-icons/fi';
import API from '../../utils/api'; // adjust path if needed

// ─── Axios instance with the shared base URL ────────────
const api = axios.create({
  baseURL: API, // e.g., 'http://localhost:8000'
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor – attach token ────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor – handle 401 ──────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const AdminAdvertise = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/advertise', {
        params: { page, limit: 10, status: statusFilter || undefined },
      });
      if (res.data.success) {
        setInquiries(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        toast.error(res.data.message || 'Failed to load inquiries.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.response?.data?.message || 'Error fetching inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [page, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.put(`/api/advertise/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success('Status updated.');
        fetchInquiries();
      } else {
        toast.error(res.data.message || 'Update failed.');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || 'Error updating status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      const res = await api.delete(`/api/advertise/${id}`);
      if (res.data.success) {
        toast.success('Inquiry deleted.');
        fetchInquiries();
      } else {
        toast.error(res.data.message || 'Deletion failed.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Error deleting inquiry.');
    }
  };

  const statusOptions = ['new', 'read', 'contacted', 'closed'];

  const openModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedInquiry(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Advertising Inquiries
          </h1>
          <button
            onClick={fetchInquiries}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-80"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-white dark:bg-zinc-800 p-4 rounded shadow">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            Total: {total} {total === 1 ? 'inquiry' : 'inquiries'}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No inquiries found.</div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-zinc-800 rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
              <thead className="bg-gray-50 dark:bg-zinc-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Name / Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Budget
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Received
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {inquiries.map((inq) => (
                  <tr key={inq._id} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">{inq.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{inq.email}</div>
                      {inq.phone && <div className="text-gray-400 text-xs">{inq.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {inq.company || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {inq.budget || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                      {inq.message}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={inq.status}
                        onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                        className="border border-gray-300 dark:border-zinc-600 rounded px-2 py-1 text-xs bg-white dark:bg-zinc-800"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openModal(inq)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View details"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(inq._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ─── Detail Modal ────────────────────────────────────── */}
      {showModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-lg w-full rounded-lg shadow-xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Inquiry Details</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {selectedInquiry.name}</p>
              <p><strong>Email:</strong> {selectedInquiry.email}</p>
              <p><strong>Phone:</strong> {selectedInquiry.phone || '—'}</p>
              <p><strong>Company:</strong> {selectedInquiry.company || '—'}</p>
              <p><strong>Budget:</strong> {selectedInquiry.budget || '—'}</p>
              <p><strong>Status:</strong> {selectedInquiry.status}</p>
              <p><strong>Received:</strong> {new Date(selectedInquiry.createdAt).toLocaleString()}</p>
              <div className="mt-3">
                <strong>Message:</strong>
                <p className="mt-1 p-3 bg-gray-100 dark:bg-zinc-800 rounded whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdvertise;