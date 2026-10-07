import React, { useState } from "react";
import { toast } from "sonner";
import {
  FiFeather,
  FiMail,
  FiPhone,
  FiSend,
  FiUser,
  FiGlobe,
  FiFileText,
  FiList,
  FiCheckCircle,
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import API from "../utils/api";

const WriteForUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    website: "",
    bio: "",
    topics: "",
    sample: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.bio || !formData.topics || !formData.sample) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Replace with your actual endpoint
      const res = await API.post("/api/guest-post", formData);
      if (res.data.success) {
        toast.success("Your application has been submitted! We'll review it and get back to you.");
        setFormData({
          name: "",
          email: "",
          website: "",
          bio: "",
          topics: "",
          sample: "",
        });
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error(err.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* ─── Hero Header ────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-zinc-800 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* <div className="inline-flex items-center justify-center text-xl font-black tracking-tight mb-4">
            <FiFeather className="text-black mr-2 dark:text-white" />
            <span className="font-light text-gray-800 dark:text-gray-200">Feathered</span>
            <span className="font-extrabold text-black dark:text-white">PEN</span>
          </div> */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white">
            Write for Us
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Share your story, expertise, and passion with our community.<br />
            We’re looking for fresh voices and unique perspectives.
          </p>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* ─── Form ──────────────────────────────────────────── */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
              Guest Post Application
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website / Blog URL
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="https://yourblog.com"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio / About You <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  placeholder="Tell us about yourself and your writing experience..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proposed Topics <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="topics"
                  name="topics"
                  rows="2"
                  value={formData.topics}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  placeholder="List 2–3 topics you'd like to write about..."
                />
              </div>
              <div>
                <label htmlFor="sample" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sample Article <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="sample"
                  name="sample"
                  rows="6"
                  value={formData.sample}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  placeholder="Paste your sample article (or a link to it) here..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-semibold text-sm uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>

          {/* ─── Guidelines Sidebar ───────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <FiCheckCircle className="text-red-500" />
                What We Look For
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Original content:</strong> Articles must be unpublished and not posted elsewhere.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Relevance:</strong> Topics should align with our niches – tech, travel, lifestyle, culture, business.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Quality writing:</strong> Clear, engaging, and well‑researched.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Word count:</strong> 800–1500 words is ideal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Author bio:</strong> A short bio with links to your social profiles.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Why Write for Us?</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✓</span>
                  <span>Exposure to a growing community of readers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✓</span>
                  <span>Author credit with a link to your website.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✓</span>
                  <span>Build your portfolio and authority.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✓</span>
                  <span>Join a supportive community of writers.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Follow Us</h3>
              <div className="flex gap-4 text-gray-600 dark:text-gray-400">
                <a
                  href="https://x.com/feathered_pen"
                  aria-label="X (Twitter)"
                  className="hover:text-black dark:hover:text-white"
                >
                  <FaXTwitter size={22} />
                </a>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="hover:text-black dark:hover:text-white"
                >
                  <FaFacebookF size={22} />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="hover:text-black dark:hover:text-white"
                >
                  <FaInstagram size={22} />
                </a>
                <a
                  href="https://youtube.com/@featheredpen1"
                  aria-label="YouTube"
                  className="hover:text-black dark:hover:text-white"
                >
                  <FaYoutube size={22} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteForUs;