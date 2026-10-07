import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  FiArrowUp,
  FiCalendar,
  FiFeather,
  FiChevronRight,
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";

const TABS = ["mission", "vision", "values"];

const TAB_CONTENT = {
  mission: {
    heading: "To Inspire Curiosity",
    body: "Our mission is to make the wonders of space and science accessible to everyone. We believe that understanding the universe is a fundamental human right, and we're committed to delivering accurate, engaging, and thought-provoking content that sparks curiosity and fuels imagination.",
  },
  vision: {
    heading: "A Future of Discovery",
    body: "We envision a world where space exploration is a shared human endeavor, where the boundaries of knowledge are pushed daily, and where every person can look up at the stars with a sense of wonder and understanding. Our vision is to be at the forefront of this journey, bridging the gap between science and the public.",
  },
};

const SOCIAL_LINKS = [
  { name: "Facebook", href: "https://facebook.com/featheredpen", Icon: FaFacebookF },
  { name: "X (Twitter)", href: "https://x.com/featheredpen", Icon: FaXTwitter },
  { name: "Instagram", href: "https://instagram.com/featheredpen", Icon: FaInstagram },
  { name: "LinkedIn", href: "https://linkedin.com/company/featheredpen", Icon: FaLinkedinIn },
  { name: "YouTube", href: "https://youtube.com/featheredpen1", Icon: FaYoutube },
];

const About = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeTab, setActiveTab] = useState("mission");
  const [panelVisible, setPanelVisible] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Small fade/slide-in whenever the active tab changes, skipped entirely
  // for users who prefer reduced motion via the motion-safe: variants below.
  useEffect(() => {
    setPanelVisible(false);
    const t = setTimeout(() => setPanelVisible(true), 20);
    return () => clearTimeout(t);
  }, [activeTab]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const timeline = [
    { year: "2020", event: "Blog Launched", description: "Started with a single post about Mars." },
    { year: "2021", event: "First Milestone", description: "Reached 1,000 monthly readers." },
    { year: "2022", event: "Team Expansion", description: "Welcomed our first writers." },
    { year: "2023", event: "Award Recognition", description: "Won Best Science Blog." },
    { year: "2024", event: "Global Reach", description: "Readers from over 50 countries." },
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    // No newsletter endpoint wired up yet — this simulates the round trip
    // so the flow is complete; swap in a real API call when one exists.
    setTimeout(() => {
      toast.success("Subscribed! Welcome aboard.");
      setEmail("");
      setSubscribing(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 overflow-x-hidden" ref={contentRef}>
      {/* ─── Hero Section ────────────────────────────────── */}
      <section className="border-b border-gray-200 dark:border-zinc-800 py-14 xs:py-16 sm:py-20 md:py-24 lg:py-28 px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* <div className="inline-flex items-center justify-center text-lg xs:text-xl font-black tracking-tight mb-4">
            <FiFeather className="text-black dark:text-white mr-2" size={20} />
            <span className="font-light text-gray-800 dark:text-gray-200">FEATHERED</span>
            <span className="font-extrabold text-black dark:text-white">PEN</span>
          </div> */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white leading-tight">
            Stories That
            <br className="sm:hidden" />{" "}
            <span className="text-gray-500 dark:text-gray-400">Inspire & Inform</span>
          </h1>
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-sm xs:text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed px-1">
            We're a team of passionate writers, scientists, and storytellers
            dedicated to bringing you the latest in space exploration,
            technology, and the wonders of the universe.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 px-5 xs:px-6 py-2.5 xs:py-3 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs xs:text-sm uppercase tracking-wider motion-safe:transition-transform motion-safe:duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
            >
              Explore Our Stories
              <FiChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#mission"
              className="inline-flex items-center gap-2 px-5 xs:px-6 py-2.5 xs:py-3 border-2 border-black dark:border-white text-black dark:text-white font-semibold text-xs xs:text-sm uppercase tracking-wider motion-safe:transition-transform motion-safe:duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ─── Mission / Vision / Values ────────────────────── */}
      <section id="mission" className="py-14 sm:py-20 scroll-mt-4">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-black dark:text-white">
              Our Mission
            </h2>
            <p className="mt-2 text-xs xs:text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              What drives us to share the stories of the cosmos.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Mission, vision and values"
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10"
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 xs:px-5 py-2 text-xs xs:text-sm font-medium border-2 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${
                  activeTab === tab
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-gray-300 text-gray-700 dark:border-zinc-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 xs:p-6 sm:p-8 md:p-10 motion-safe:transition-all motion-safe:duration-300 ${
              panelVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
          >
            {activeTab === "values" ? (
              <div>
                <h3 className="text-xl xs:text-2xl font-bold text-black dark:text-white mb-4">
                  Excellence, Integrity, Community
                </h3>
                <ul className="space-y-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span><strong>Excellence:</strong> We strive for the highest quality in every article and story we publish.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span><strong>Integrity:</strong> We are committed to factual accuracy, transparency, and ethical reporting.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span><strong>Community:</strong> We believe in the power of a curious community – we learn together, share together, and grow together.</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div>
                <h3 className="text-xl xs:text-2xl font-bold text-black dark:text-white mb-4">
                  {TAB_CONTENT[activeTab].heading}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                  {TAB_CONTENT[activeTab].body}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Timeline ────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-t border-gray-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-black dark:text-white">
              Our Journey
            </h2>
            <p className="mt-2 text-xs xs:text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Milestones that shaped our story.
            </p>
          </div>

          <div className="relative">
            {/* Mobile rail: a left-hand connector so the timeline still
                reads as a timeline below the sm breakpoint, instead of
                disconnected cards. */}
            <div className="sm:hidden absolute left-[15px] top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-zinc-700" />
            {/* Desktop rail: centered connector for the alternating layout. */}
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-zinc-700 transform -translate-x-1/2" />

            {timeline.map((item, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col sm:flex-row items-start sm:items-center mb-8 sm:mb-12 last:mb-0 pl-9 sm:pl-0 ${
                  idx % 2 === 0 ? "sm:pr-12" : "sm:pl-12"
                } ${idx % 2 === 0 ? "sm:text-right" : "sm:text-left"}`}
              >
                {/* Mobile dot */}
                <span className="sm:hidden absolute left-[15px] top-1.5 w-3 h-3 rounded-full bg-black dark:bg-white ring-4 ring-white dark:ring-zinc-900 -translate-x-1/2 z-10" />
                {/* Desktop dot */}
                <div className="hidden sm:block absolute left-1/2 w-4 h-4 rounded-full bg-black dark:bg-white border-4 border-white dark:border-black transform -translate-x-1/2 -translate-y-1/2 top-1 z-10" />

                <div
                  className={`w-full sm:w-1/2 p-4 xs:p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 motion-safe:transition-shadow motion-safe:duration-150 hover:shadow-sm ${
                    idx % 2 === 0 ? "sm:mr-auto" : "sm:ml-auto"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-500 dark:text-gray-400 sm:justify-inherit">
                    <FiCalendar size={14} />
                    <span className="font-semibold">{item.year}</span>
                  </div>
                  <h3 className="text-base xs:text-lg font-bold text-black dark:text-white mt-1">
                    {item.event}
                  </h3>
                  <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Media ────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-t border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-black dark:text-white mb-3 sm:mb-4">
            Follow Us
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">
            Stay connected and join the conversation.
          </p>
          <div className="flex flex-wrap justify-center gap-2 xs:gap-3 text-gray-600 dark:text-gray-400">
            {SOCIAL_LINKS.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="p-3 xs:p-3.5 rounded-full motion-safe:transition-colors motion-safe:duration-150 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
              >
                <Icon size={22} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Call to Action / Newsletter ─────────────────── */}
      <section className="border-t border-gray-200 dark:border-zinc-800 py-14 sm:py-20 bg-black dark:bg-white">
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-white dark:text-black">
            Join Our Community
          </h2>
          <p className="mt-3 sm:mt-4 text-sm xs:text-base sm:text-lg text-gray-300 dark:text-gray-600 max-w-2xl mx-auto">
            Subscribe to our newsletter and never miss a story from the cosmos.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={subscribing}
              className="flex-1 min-w-0 px-4 py-3 bg-white/10 dark:bg-black/10 border border-white/20 dark:border-black/20 text-white dark:text-black placeholder-white/50 dark:placeholder-black/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-black disabled:opacity-60"
              required
            />
            <button
              type="submit"
              disabled={subscribing}
              className="px-6 py-3 bg-white dark:bg-black text-black dark:text-white font-semibold text-xs xs:text-sm uppercase tracking-wider motion-safe:transition-opacity disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-black dark:focus-visible:ring-offset-white"
            >
              {subscribing ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        </div>
      </section>

      {/* ─── Back to Top ────────────────────────────────── */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 bg-black dark:bg-white text-white dark:text-black p-2.5 sm:p-3 rounded-full shadow-lg motion-safe:transition-all motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <FiArrowUp size={18} className="sm:hidden" />
        <FiArrowUp size={20} className="hidden sm:block" />
      </button>
    </div>
  );
};

export default About;
