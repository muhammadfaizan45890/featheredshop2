import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios"; // ✅ Required for fallback instance
import API from "../../utils/api";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiImage,
  FiChevronUp,
  FiChevronDown,
  FiEye,
  FiEyeOff,
  FiX,
  FiMove,
} from "react-icons/fi";

// ─── Helper: reliable API instance ──────────────────
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

// ─── Slide Preview Component ──────────────────────────
const SlidePreview = ({ slide }) => {
  return (
    <div className="relative w-full h-32 sm:h-40 bg-[#2b2b30] overflow-hidden rounded-lg">
      <div className="absolute top-0 right-0 w-full h-full">
        <img
          src={slide.image}
          alt={slide.title}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="absolute left-2 top-2 p-2 bg-white/95 shadow-lg max-w-[60%] rounded">
        <p className="uppercase text-[6px] text-gray-500 tracking-wider">{slide.category}</p>
        <h3 className="text-[8px] sm:text-[10px] font-bold leading-tight line-clamp-1">{slide.title}</h3>
        <span className="text-[6px] border border-black px-1 py-0.5 inline-block mt-0.5">
          {slide.buttonText || "Read More"}
        </span>
      </div>
    </div>
  );
};

const AdminHero = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    category: "",
    buttonText: "Read More",
    alt: "",
    link: "/news",
    order: 0,
    isActive: true,
  });

  // ─── Fetch slides ────────────────────────────────────
  const fetchSlides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/hero/admin');
      setSlides(res.data.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch slides');
      toast.error('Error loading slides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // ─── Open modal for create/edit ──────────────────────
  const openCreateModal = () => {
    setEditingSlide(null);
    setFormData({
      title: "",
      description: "",
      image: "",
      category: "",
      buttonText: "Read More",
      alt: "",
      link: "/news",
      order: slides.length,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || "",
      description: slide.description || "",
      image: slide.image || "",
      category: slide.category || "",
      buttonText: slide.buttonText || "Read More",
      alt: slide.alt || "",
      link: slide.link || "/news",
      order: slide.order || 0,
      isActive: slide.isActive !== undefined ? slide.isActive : true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSlide(null);
    setFormData({
      title: "",
      description: "",
      image: "",
      category: "",
      buttonText: "Read More",
      alt: "",
      link: "/news",
      order: 0,
      isActive: true,
    });
  };

  // ─── Handle form changes ─────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ─── Submit form ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };

      if (!payload.title || !payload.image) {
        toast.error('Title and image are required');
        setSubmitting(false);
        return;
      }

      let res;
      if (editingSlide) {
        res = await api.put(`/api/hero/${editingSlide._id}`, payload);
        toast.success('Slide updated successfully');
        setSlides(slides.map(s => s._id === editingSlide._id ? res.data.data : s));
      } else {
        res = await api.post('/api/hero', payload);
        toast.success('Slide created successfully');
        setSlides([...slides, res.data.data]);
      }
      closeModal();
      fetchSlides();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete slide ─────────────────────────────────────
  const handleDelete = async (slideId) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    try {
      await api.delete(`/api/hero/${slideId}`);
      toast.success('Slide deleted');
      setSlides(slides.filter(s => s._id !== slideId));
      fetchSlides();
    } catch (err) {
      toast.error('Failed to delete slide');
    }
  };

  // ─── Toggle active status ────────────────────────────
  const toggleActive = async (slide) => {
    try {
      const res = await api.patch(`/api/hero/${slide._id}`, {
        isActive: !slide.isActive,
      });
      setSlides(slides.map(s => s._id === slide._id ? res.data.data : s));
      toast.success(slide.isActive ? 'Slide hidden' : 'Slide published');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // ─── Move slide up/down (reorder) ────────────────────
  const moveSlide = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[newIndex];
    newSlides[newIndex] = temp;

    // Update order values
    const orderMap = newSlides.map((slide, idx) => ({
      id: slide._id,
      order: idx,
    }));

    try {
      await api.post('/api/hero/reorder', { orderMap });
      setSlides(newSlides);
      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to reorder');
      fetchSlides();
    }
  };

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Hero Slides</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your homepage hero carousel</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 text-sm font-semibold"
        >
          <FiPlus size={18} /> New Slide
        </button>
      </div>

      {/* ─── Refresh ─── */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchSlides}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
        >
          <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ─── Slides Grid ─── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No slides found. Create your first hero slide!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {slides.map((slide, index) => (
            <div
              key={slide._id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="relative">
                <SlidePreview slide={slide} />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold bg-white/90 backdrop-blur-sm">
                  #{index + 1}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm line-clamp-1 flex-1">{slide.title}</h3>
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`p-1 rounded ${slide.isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}
                    title={slide.isActive ? 'Published' : 'Hidden'}
                  >
                    {slide.isActive ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                  </button>
                </div>
                <p className="text-gray-500 text-xs">{slide.category || 'Uncategorized'}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span className="truncate max-w-[60%]">{slide.buttonText}</span>
                  <span>{new Date(slide.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(slide)}
                      className="p-1.5 text-gray-500 hover:text-black transition rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(slide._id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 transition rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveSlide(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-gray-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <FiChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveSlide(index, 'down')}
                      disabled={index === slides.length - 1}
                      className="p-1.5 text-gray-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <FiChevronDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal ───────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">
                {editingSlide ? 'Edit Slide' : 'Create New Slide'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-full transition">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="https://images.unsplash.com/..."
                    required
                  />
                  {formData.image && (
                    <div className="mt-2 w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="News • Featured"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    name="buttonText"
                    value={formData.buttonText}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="Read More"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm resize-none"
                    placeholder="Brief description for the slide..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link (slug or URL)</label>
                  <input
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="/news/my-post"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                  <input
                    type="text"
                    name="alt"
                    value={formData.alt}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="Image description for accessibility"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-black"
                    />
                    Active / Published
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-semibold"
                >
                  {submitting ? 'Saving...' : editingSlide ? 'Update Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHero;
