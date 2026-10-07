import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck } from 'react-icons/fi';
import API from '../../utils/api';

// ─── Create API instance with interceptors ─────────────
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
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
  return instance;
};

const api = getApiInstance();

const Advertisements = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    image: '',
    title: '',
    ctaText: 'Learn More',
    ctaLink: '/advertise',
    slot: 'top',
    isActive: true,
  });

  // ─── Fetch ads ──────────────────────────────────────
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/ads');
      setAds(res.data.data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // ─── Form handlers ──────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      image: '',
      title: '',
      ctaText: 'Learn More',
      ctaLink: '/advertise',
      slot: 'top',
      isActive: true,
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image || !formData.title) {
      toast.error('Image and title are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/api/ads/${editingId}`, formData);
        toast.success('Ad updated successfully');
      } else {
        await api.post('/api/ads', formData);
        toast.success('Ad created successfully');
      }
      fetchAds();
      resetForm();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error(error.response?.data?.message || 'Failed to save ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ad) => {
    setFormData({
      image: ad.image,
      title: ad.title,
      ctaText: ad.ctaText || 'Learn More',
      ctaLink: ad.ctaLink || '/advertise',
      slot: ad.slot || 'top',
      isActive: ad.isActive,
    });
    setEditingId(ad._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    try {
      await api.delete(`/api/ads/${id}`);
      toast.success('Ad deleted');
      fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad');
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await api.put(`/api/ads/${ad._id}`, { ...ad, isActive: !ad.isActive });
      toast.success(`Ad ${!ad.isActive ? 'activated' : 'deactivated'}`);
      fetchAds();
    } catch (error) {
      console.error('Error toggling ad:', error);
      toast.error('Failed to update ad');
    }
  };

  // ─── Render ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Manage Advertisements</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Create and manage ads displayed on the site (top, middle, bottom slots)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-black text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-gray-800 transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          <FiPlus size={16} className="sm:size-18" />
          <span>Add New Ad</span>
        </button>
      </div>

      {/* ─── Form Modal ────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg mx-2 sm:mx-0 p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold">{editingId ? 'Edit Ad' : 'New Ad'}</h2>
              <button
                onClick={resetForm}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX size={22} className="sm:size-24" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/ad-banner.jpg"
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
                {formData.image && (
                  <div className="mt-1.5 sm:mt-2 w-full aspect-[4/3] bg-gray-100 rounded-md overflow-hidden max-h-32 sm:max-h-48">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/400x300/cccccc/666666?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Special offer – 20% off!"
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleInputChange}
                  placeholder="Learn More"
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  CTA Link
                </label>
                <input
                  type="text"
                  name="ctaLink"
                  value={formData.ctaLink}
                  onChange={handleInputChange}
                  placeholder="/advertise"
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* ─── Slot selection ───────────────────── */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Slot <span className="text-red-500">*</span>
                </label>
                <select
                  name="slot"
                  value={formData.slot}
                  onChange={handleInputChange}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="top">Top (above article)</option>
                  <option value="middle">Middle (after TOC)</option>
                  <option value="bottom">Bottom (before author bio)</option>
                </select>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  Choose where this ad will appear on the post detail page.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  id="isActive"
                  className="h-4 w-4 sm:h-4 sm:w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-xs sm:text-sm text-gray-700">
                  Active (show on site)
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Ads List ────────────────────────────────── */}
      {ads.length === 0 ? (
        <div className="text-center py-8 sm:py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-sm sm:text-base">No advertisements yet.</p>
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="mt-2 sm:mt-3 text-sm text-black underline hover:no-underline"
          >
            Create your first ad
          </button>
        </div>
      ) : (
        <>
          {/* ─── Desktop Table (hidden on small screens) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slot
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTA
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="w-14 h-10 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={ad.image}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/80/cccccc/666666?text=No+Image';
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                      {ad.title}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 capitalize">
                      {ad.slot || 'top'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {ad.ctaText}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ad.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(ad)}
                          className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                            ad.isActive ? 'text-gray-500' : 'text-green-600'
                          }`}
                          title={ad.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <FiCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(ad)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ad._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── Mobile/Tablet Card View (visible on small screens) ── */}
          <div className="md:hidden space-y-3">
            {ads.map((ad) => (
              <div
                key={ad._id}
                className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/80/cccccc/666666?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {ad.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs font-medium text-gray-600 capitalize bg-gray-100 px-2 py-0.5 rounded">
                        {ad.slot || 'top'}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          ad.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      <span className="font-medium">CTA:</span> {ad.ctaText}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                        ad.isActive ? 'text-gray-500' : 'text-green-600'
                      }`}
                      title={ad.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <FiCheck size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(ad)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(ad._id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
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
  );
};

export default Advertisements;
