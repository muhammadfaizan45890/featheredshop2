import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import API from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiCalendar, FiUser } from 'react-icons/fi';

const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AdminAudio = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    embedCode: '',
    coverImage: '',
    duration: '',
    author: 'Feathered Pen',
    isActive: true,
    publishedAt: new Date().toISOString().slice(0, 16),
  });

  const fetchAudio = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/audio/admin/all');
      if (res.data.success) {
        setAudioList(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load audio');
      }
    } catch (error) {
      toast.error('Error loading audio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudio();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await api.put(`/api/audio/admin/${editingItem._id}`, formData);
        if (res.data.success) {
          toast.success('Audio updated');
          setShowModal(false);
          fetchAudio();
        } else {
          toast.error(res.data.message || 'Update failed');
        }
      } else {
        const res = await api.post('/api/audio/admin', formData);
        if (res.data.success) {
          toast.success('Audio added');
          setShowModal(false);
          fetchAudio();
        } else {
          toast.error(res.data.message || 'Creation failed');
        }
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this audio?')) return;
    try {
      const res = await api.delete(`/api/audio/admin/${id}`);
      if (res.data.success) {
        toast.success('Audio deleted');
        fetchAudio();
      } else {
        toast.error(res.data.message || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      embedCode: item.embedCode,
      coverImage: item.coverImage || '',
      duration: item.duration || '',
      author: item.author || 'Feathered Pen',
      isActive: item.isActive,
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      embedCode: '',
      coverImage: '',
      duration: '',
      author: 'Feathered Pen',
      isActive: true,
      publishedAt: new Date().toISOString().slice(0, 16),
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
            Audio Library
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({audioList.length})
            </span>
          </h1>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity w-full sm:w-auto"
          >
            <FiPlus size={20} /> Add Audio
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-zinc-700 rounded-lg h-32" />
            ))}
          </div>
        ) : audioList.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-xl">No audio entries yet.</p>
            <p className="text-sm mt-2">Click "Add Audio" to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table (hidden on small screens) */}
            <div className="hidden md:block bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                <thead className="bg-gray-50 dark:bg-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Author</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Published</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {audioList.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                      <td className="px-4 py-3 text-sm font-medium text-black dark:text-white">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{item.author}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.isActive ? (
                          <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">Active</span>
                        ) : (
                          <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">
                          <FiEdit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800">
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (visible on small screens) */}
            <div className="md:hidden space-y-3">
              {audioList.map((item) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 border border-gray-200 dark:border-zinc-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-black dark:text-white truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <FiUser size={12} /> {item.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} /> {new Date(item.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2">
                        {item.isActive ? (
                          <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs">Active</span>
                        ) : (
                          <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 p-1">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800 p-1">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── Modal (fully responsive) ────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                {editingItem ? 'Edit Audio' : 'Add Audio'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 rounded dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border p-2 rounded dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Embed Code * (iframe from Spotify/Anchor)</label>
                <textarea
                  name="embedCode"
                  value={formData.embedCode}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder='<iframe src="https://open.spotify.com/embed/episode/..." ...></iframe>'
                  className="w-full border p-2 rounded font-mono text-sm dark:bg-zinc-800 dark:border-zinc-700"
                />
                <p className="text-xs text-gray-500 mt-1">Paste the embed code from Spotify/Anchor.</p>
              </div>
              <div>
                <label className="block text-sm font-medium">Cover Image URL (optional)</label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  className="w-full border p-2 rounded dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Duration (e.g., "15:30")</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full border p-2 rounded dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Author</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className="w-full border p-2 rounded dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Published At</label>
                <input
                  type="datetime-local"
                  name="publishedAt"
                  value={formData.publishedAt}
                  onChange={handleChange}
                  className="w-full border p-2 rounded dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Active</label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  {editingItem ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAudio;
