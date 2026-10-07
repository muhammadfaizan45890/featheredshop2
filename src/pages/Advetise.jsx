import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiUsers,
  FiEye,
  FiTrendingUp,
  FiDollarSign,
  FiCheckCircle,
} from 'react-icons/fi';
import { FaXTwitter } from 'react-icons/fa6';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
  FaPinterest,
} from 'react-icons/fa';
import API from '@/utils/api'; // 👈 same API string as Login

// ─── Create Axios instance with the shared base URL ────
const api = axios.create({
  baseURL: API, // now uses the same string (e.g., 'http://localhost:8000')
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptors ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

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

const Advertise = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    budget: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ─── Authentication check ────────────────────────────
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Please log in to submit an inquiry.');
      navigate('/login', { state: { from: '/advertise' } });
      return;
    }

    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/api/advertise', formData);
      if (res.data.success) {
        toast.success("Thank you! We'll get back to you shortly.");
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          budget: '',
          message: '',
        });
      } else {
        toast.error(res.data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to send. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Stats ──────────────────────────────────────────────
  const stats = [
    { label: 'Monthly Readers', value: '50K+', icon: FiUsers },
    { label: 'Page Views', value: '120K+', icon: FiEye },
    { label: 'Engagement Rate', value: '4.2%', icon: FiTrendingUp },
    { label: 'Ad Revenue Growth', value: '28%', icon: FiDollarSign },
  ];

  // ─── Packages ────────────────────────────────────────────
  const packages = [
    {
      name: 'Standard',
      price: '$199',
      period: '/ month',
      features: [
        'Sidebar ad placement',
        'Up to 50K impressions',
        'Standard reporting',
        '1-month contract',
      ],
    },
    {
      name: 'Premium',
      price: '$399',
      period: '/ month',
      features: [
        'In-article ad placement',
        'Up to 120K impressions',
        'Detailed analytics',
        '3-month contract',
        'Priority support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Custom ad placements',
        'Unlimited impressions',
        'Full analytics suite',
        'Dedicated account manager',
        'Flexible contract terms',
      ],
    },
  ];

  // ─── Social Media Links ──────────────────────────────────
  const socialLinks = [
    {
      icon: FaXTwitter,
      href: 'https://x.com/feathered_pen',
      label: 'X (Twitter)',
      color: 'hover:text-black dark:hover:text-white',
    },
    {
      icon: FaFacebookF,
      href: 'https://facebook.com/featheredpen',
      label: 'Facebook',
      color: 'hover:text-blue-600',
    },
    {
      icon: FaInstagram,
      href: 'https://instagram.com/featheredpen',
      label: 'Instagram',
      color: 'hover:text-pink-600',
    },
    {
      icon: FaYoutube,
      href: 'https://youtube.com/@featheredpen1',
      label: 'YouTube',
      color: 'hover:text-red-600',
    },
    {
      icon: FaLinkedinIn,
      href: 'https://linkedin.com/company/featheredpen',
      label: 'LinkedIn',
      color: 'hover:text-blue-700',
    },
    {
      icon: FaPinterest,
      href: 'https://pinterest.com/featheredpen',
      label: 'Pinterest',
      color: 'hover:text-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* ─── Why Advertise ──────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-zinc-800 py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Why Advertise With Feathered Pen?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              We connect you with an audience that values quality content.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Stats cards */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 sm:p-5 md:p-6">
              <FiUsers className="text-red-500 w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">Targeted Audience</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 leading-relaxed">
                Reach readers interested in technology, travel, lifestyle, culture, and business.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 sm:p-5 md:p-6">
              <FiTrendingUp className="text-red-500 w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">High Engagement</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 leading-relaxed">
                Our readers are active, engaged, and trust our editorial voice.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 sm:p-5 md:p-6">
              <FiDollarSign className="text-red-500 w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">Flexible Packages</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 leading-relaxed">
                Choose from a variety of plans – from standard ads to full campaigns.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 sm:p-5 md:p-6">
              <FiCheckCircle className="text-red-500 w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">Transparent Reporting</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 leading-relaxed">
                Get clear, honest analytics on your campaign performance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Packages ────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-zinc-800 py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Advertising Packages
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              Choose the plan that fits your goals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {packages.map((pkg, idx) => (
              <div
                key={idx}
                className={`bg-white dark:bg-zinc-900 border ${
                  pkg.popular
                    ? 'border-black dark:border-white'
                    : 'border-gray-200 dark:border-zinc-800'
                } p-5 sm:p-6 relative`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-2 sm:px-3 py-0.5 sm:py-1">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-1 sm:mb-2">
                  {pkg.name}
                </h3>
                <div className="flex items-end gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-black dark:text-white">
                    {pkg.price}
                  </span>
                  {pkg.period && (
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {pkg.period}
                    </span>
                  )}
                </div>
                <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {pkg.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-1.5 sm:gap-2">
                      <span className="text-red-500 text-xs sm:text-sm">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    const form = document.getElementById('contact-form');
                    if (form) form.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full mt-4 sm:mt-6 py-1.5 sm:py-2 border-2 border-black dark:border-white text-black dark:text-white font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Contact Form ───────────────────────────────────── */}
      <div id="contact-form" className="py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Ready to Start?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
              Fill in the form and we'll get back to you within 24 hours.
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company / Brand Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                    placeholder="Your company"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="budget" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Budget Range
                </label>
                <select
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm sm:text-base"
                >
                  <option value="">Select a range</option>
                  <option value="Under $500">Under $500</option>
                  <option value="$500 – $1,000">$500 – $1,000</option>
                  <option value="$1,000 – $2,500">$1,000 – $2,500</option>
                  <option value="$2,500 – $5,000">$2,500 – $5,000</option>
                  <option value="$5,000+">$5,000+</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message / Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="4 sm:rows-5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none text-sm sm:text-base"
                  placeholder="Tell us about your advertising goals..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 sm:py-3 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs sm:text-sm uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Inquiry'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Social Media Follow ───────────────────────────── */}
      {/* <div className="border-b border-gray-200 dark:border-zinc-800 py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white mb-2 sm:mb-3">
            Follow Feathered Pen
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
            Stay connected and join our growing community.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {socialLinks.map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-gray-500 dark:text-gray-400 ${social.color} transition-colors duration-200 flex flex-col items-center gap-1`}
                aria-label={social.label}
                title={social.label}
              >
                <social.icon size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8" />
                <span className="text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500">
                  {social.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Advertise;