import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiArrowUp, FiFeather } from "react-icons/fi";

const Privacy = () => {
  // const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      // Update active section for TOC
      const sections = ["intro", "collection", "cookies", "thirdparty", "rights", "security", "contact", "changes"];
      const scrollPos = window.scrollY + 120;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // ─── Table of contents ────────────────────────────────
  const toc = [
    { id: "intro", label: "Introduction" },
    { id: "collection", label: "Information We Collect" },
    { id: "cookies", label: "Cookies" },
    { id: "thirdparty", label: "Third‑Party Services" },
    { id: "rights", label: "Your Rights" },
    { id: "security", label: "Data Security" },
    { id: "contact", label: "Contact Us" },
    { id: "changes", label: "Changes to This Policy" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900" ref={contentRef}>
      {/* ─── Hero Header ────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-zinc-800 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* (Optional logo – updated to Feathered News)
          <div className="inline-flex items-center gap-2 text-xl font-black tracking-tight mb-4">
            <FiFeather className="text-black dark:text-white" />
            <span className="font-light text-gray-800 dark:text-gray-200">Feathered</span>
            <span className="font-extrabold text-black dark:text-white">NEWS</span>
          </div> */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ─── Table of Contents (Sidebar) ──────────────── */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="sticky top-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                On this page
              </h2>
              <nav className="space-y-2">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm py-1.5 px-2 border-l-2 transition ${
                      activeSection === item.id
                        ? "border-black dark:border-white text-black dark:text-white font-medium"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(item.id);
                      if (el) {
                        const offset = 80;
                        const top = el.getBoundingClientRect().top + window.scrollY - offset;
                        window.scrollTo({ top, behavior: "smooth" });
                      }
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* ─── Content ────────────────────────────────────── */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-black dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-red-500 prose-a:no-underline hover:prose-a:underline">
              {/* ─── Introduction ────────────────────────────── */}
              <section id="intro" className="scroll-mt-20">
                <h2>Introduction</h2>
                <p>
                  At <strong>Feathered News</strong>, we take your privacy seriously. This policy explains how we collect,
                  use, and protect your personal information when you visit our website. By using our site, you agree to
                  the practices described here.
                </p>
                <p>
                  We are committed to being transparent about our data practices and to giving you control over your
                  information. If you have any questions, please see the <a href="#contact">Contact</a> section below.
                </p>
              </section>

              {/* ─── Information We Collect ──────────────────── */}
              <section id="collection" className="scroll-mt-20">
                <h2>Information We Collect</h2>
                <p>We collect only the information necessary to provide and improve our service:</p>
                <ul>
                  <li>
                    <strong>Personal data:</strong> When you comment, subscribe, or contact us, we may collect your name,
                    email address, and any message you send.
                  </li>
                  <li>
                    <strong>Usage data:</strong> We automatically collect information about your device and how you use
                    our site, including IP address, browser type, pages visited, and time spent.
                  </li>
                  <li>
                    <strong>Cookies:</strong> We use cookies to remember your preferences, analyse traffic, and show
                    personalised ads. You can manage cookie settings in your browser.
                  </li>
                </ul>
              </section>

              {/* ─── Cookies ──────────────────────────────────── */}
              <section id="cookies" className="scroll-mt-20">
                <h2>Cookies</h2>
                <p>
                  Cookies are small text files stored on your device. We use them to:
                </p>
                <ul>
                  <li>Remember your settings and preferences.</li>
                  <li>Analyse site traffic and performance (via Google Analytics).</li>
                  <li>Deliver relevant ads (via Google AdSense).</li>
                </ul>
                <p>
                  You can disable cookies in your browser settings, but this may affect some features of the site.
                </p>
              </section>

              {/* ─── Third‑Party Services ────────────────────── */}
              <section id="thirdparty" className="scroll-mt-20">
                <h2>Third‑Party Services</h2>
                <p>We use trusted third‑party services to enhance our site:</p>
                <ul>
                  <li>
                    <strong>Google Analytics:</strong> Tracks visitor behaviour to help us improve content. Data is
                    anonymised where possible.
                  </li>
                  <li>
                    <strong>Google AdSense:</strong> Shows personalised ads. AdSense uses cookies and may collect data
                    about your browsing history.
                  </li>
                  <li>
                    <strong>Social media platforms:</strong> If you share our content, those platforms may collect data
                    according to their own privacy policies.
                  </li>
                </ul>
                <p>
                  These services have their own privacy policies, and we encourage you to review them.
                </p>
              </section>

              {/* ─── Your Rights ────────────────────────────── */}
              <section id="rights" className="scroll-mt-20">
                <h2>Your Rights</h2>
                <p>Depending on your location, you may have the following rights:</p>
                <ul>
                  <li>Access the personal data we hold about you.</li>
                  <li>Request correction or deletion of your data.</li>
                  <li>Object to processing of your data.</li>
                  <li>Withdraw consent at any time.</li>
                </ul>
                <p>
                  To exercise any of these rights, contact us using the details in the <a href="#contact">Contact</a> section.
                </p>
              </section>

              {/* ─── Data Security ───────────────────────────── */}
              <section id="security" className="scroll-mt-20">
                <h2>Data Security</h2>
                <p>
                  We take reasonable steps to protect your personal data from loss, misuse, and unauthorised access.
                  However, no transmission over the internet is completely secure, so we cannot guarantee absolute security.
                </p>
                <p>
                  We store data only as long as necessary for the purposes described in this policy.
                </p>
              </section>

              {/* ─── Contact Us ──────────────────────────────── */}
              <section id="contact" className="scroll-mt-20">
                <h2>Contact Us</h2>
                <p>
                  If you have any questions, concerns, or requests regarding this privacy policy, please reach out:
                </p>
                <ul>
                  <li><strong>Email:</strong> <a href="mailto:info@featherednews.com">info@featherednews.com</a></li>
                  <li><strong>Website:</strong> <a href="/">featherednews.com</a></li>
                </ul>
                <p>We aim to respond within 5 business days.</p>
              </section>

              {/* ─── Changes to This Policy ──────────────────── */}
              <section id="changes" className="scroll-mt-20">
                <h2>Changes to This Policy</h2>
                <p>
                  We may update this policy from time to time. The latest version will always be posted on this page,
                  with the “last updated” date at the top. We encourage you to review it periodically.
                </p>
                <p>
                  If we make significant changes, we will notify you via a notice on our website.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Back to Top ────────────────────────────────── */}
      {/* <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 bg-black dark:bg-white text-white dark:text-black p-3 shadow-lg transition-opacity duration-300 ${
          showBackToTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <FiArrowUp size={20} />
      </button> */}
    </div>
  );
};

export default Privacy;
