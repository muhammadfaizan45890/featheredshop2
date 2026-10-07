import React, { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import API from "../utils/api";
import {
  FiMail,
  FiPhone,
  FiSend,
  FiFeather,
} from "react-icons/fi";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// ─── Helper: create a reliable API instance ──────────
const getApiInstance = () => {
  let instance;
  if (API && typeof API.post === 'function') {
    instance = API;
  } else {
    instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
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

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/api/contact", formData);
      if (res.data.success) {
        toast.success(res.data.message || "Your message has been sent!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error(res.data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      const errorMsg = err.response?.data?.message || "Failed to send message. Please try again later.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* ─── Hero Header ────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-zinc-800 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* (Optional logo – commented out)
          <div className="inline-flex items-center justify-center text-xl font-black tracking-tight mb-4">
            <FiFeather className="text-black mr-2 dark:text-white" />
            <span className="font-light text-gray-800 dark:text-gray-200">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
            <span className="font-extrabold text-black dark:text-white">NEWS</span>
          </div> */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white">
            Let’s Talk
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have a question, a story idea, or just want to say hello?<br />
            Reach out – we'd love to connect with you.
          </p>
        </div>
      </div>

      {/* ─── Contact Content ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* ─── Contact Form ────────────────────────────────── */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
              Send a Message
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  placeholder="Subject of your message"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none"
                  placeholder="Write your message here..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-semibold text-sm uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* ─── Contact Info ────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <FiMail className="text-red-500" />
                Email Us
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <a href="mailto:featherednews1@gmail.com" className="hover:underline">
                  featherednews@gmail.com
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                <a href="mailto:support@featherednews.com" className="hover:underline">
                  support@featherednews.com
                </a>
              </p>
            </div>

            {/* Phone */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <FiPhone className="text-red-500" />
                Call Us
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <a href="tel:+8801208388" className="hover:underline">
                  +88 (012) 083 88
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Mon–Fri: 9:00 AM – 6:00 PM
              </p>
            </div>

            {/* WhatsApp Channel */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <FaWhatsapp className="text-green-500" />
                WhatsApp
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <a
                  href="https://wa.me/8801208388?text=Hello%20Feathered%20News"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Chat with us on WhatsApp
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Quick replies within 24 hours.
              </p>
            </div>

            {/* Social Links */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Follow Us</h3>
              <div className="flex gap-4 text-gray-600 dark:text-gray-400">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="hover:text-black dark:hover:text-white"
                >
                  <FaFacebookF size={22} />
                </a>
                <a
                  href="https://x.com/feathered_pen"
                  aria-label="X (Twitter)"
                  className="hover:text-black dark:hover:text-white"
                >
                  <FaXTwitter size={22} />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="hover:text-black dark:hover:text-white"
                >
                  <FaInstagram size={22} />
                </a>
                <a
                  href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
                  aria-label="YouTube"
                  className="hover:text-black dark:hover:text-white"
                >
                  <FaYoutube size={22} />
                </a>
                <a
                  href="https://wa.me/8801208388"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="hover:text-green-600 dark:hover:text-green-400"
                >
                  <FaWhatsapp size={22} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;