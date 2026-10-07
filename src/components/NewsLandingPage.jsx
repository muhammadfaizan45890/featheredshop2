import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaRegClock,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiFeather, FiSearch, FiMenu, FiX } from "react-icons/fi";
import Footer from "./Footer";

// ─── Category color system (signature motif — every headline carries
// its category's color as a small kicker square, so the palette itself
// functions as a taxonomy the reader learns to read at a glance) ──────
const CATEGORIES = {
  News: "#B91C2B",
  Business: "#111111",
  Technology: "#1D4E89",
  Lifestyle: "#B8860B",
  Travel: "#2F6F4E",
  Fashion: "#6B2C5F",
  Food: "#C2571B",
};

const CategoryTag = ({ category, size = "sm" }) => (
  <span
    className={`inline-flex items-center gap-2 font-bold uppercase tracking-widest text-white ${
      size === "lg" ? "text-xs px-3 py-1.5" : "text-[11px] px-2.5 py-1"
    }`}
    style={{ backgroundColor: CATEGORIES[category] || "#111111" }}
  >
    {category}
  </span>
);

// ─── Sample data ──────────────────────────────────────────────────
const featuredStory = {
  category: "News",
  title:
    "Inside the Newsroom: How Independent Journalism Is Rebuilding Reader Trust",
  excerpt:
    "As legacy outlets shed staff and consolidate, a wave of reader-funded publications is proving that accountability journalism still has a viable business model.",
  author: "Maren Okafor",
  date: "July 16, 2026",
  readTime: "8 min read",
  image: "https://picsum.photos/seed/feathered-hero/1200/900",
};

const secondaryStories = [
  {
    category: "Technology",
    title: "The Quiet Rise of On-Device AI in Everyday Newsrooms",
    author: "Priya Shah",
    date: "July 15, 2026",
    readTime: "5 min",
    image: "https://picsum.photos/seed/feathered-tech/600/400",
  },
  {
    category: "Business",
    title: "Why Regional Publishers Are Betting Big on Local Advertising Again",
    author: "Tomas Reyes",
    date: "July 14, 2026",
    readTime: "6 min",
    image: "https://picsum.photos/seed/feathered-biz/600/400",
  },
];

const trendingStories = [
  { title: "The Last Print Shop in a Digital City", category: "Lifestyle" },
  { title: "Five Cities Where Journalism Still Pays the Bills", category: "Travel" },
  { title: "What Fashion Weeks Reveal About the Economy", category: "Fashion" },
  { title: "The Restaurant Critics Refusing to Go Anonymous", category: "Food" },
  { title: "Why Business Reporters Are Learning to Code", category: "Business" },
];

const latestStories = [
  {
    category: "Lifestyle",
    title: "The Slow Living Movement Has a Marketing Problem",
    excerpt:
      "What began as a rejection of hustle culture is now a hashtag — and the people who started it aren't sure how to feel.",
    author: "Dana Whitfield",
    date: "July 17, 2026",
    readTime: "7 min",
    image: "https://picsum.photos/seed/feathered-lifestyle/700/500",
    size: "large",
  },
  {
    category: "Travel",
    title: "Overlooked Coastlines to Visit Before Everyone Else Does",
    author: "Yusuf Demir",
    date: "July 17, 2026",
    readTime: "4 min",
    image: "https://picsum.photos/seed/feathered-travel/500/500",
  },
  {
    category: "Food",
    title: "The Chefs Bringing Fermentation Back to Fine Dining",
    author: "Elena Popescu",
    date: "July 16, 2026",
    readTime: "5 min",
    image: "https://picsum.photos/seed/feathered-food/500/500",
  },
  {
    category: "Fashion",
    title: "Secondhand Is No Longer the Budget Option",
    author: "Grace Liu",
    date: "July 16, 2026",
    readTime: "6 min",
    image: "https://picsum.photos/seed/feathered-fashion/500/500",
  },
  {
    category: "Technology",
    title: "Inside the Fight Over Who Owns Your Reading Data",
    author: "Marcus Webb",
    date: "July 15, 2026",
    readTime: "9 min",
    image: "https://picsum.photos/seed/feathered-data/500/500",
  },
];

const NewsLandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");

  const navLinks = [
    "Home",
    "News",
    "Business",
    "Technology",
    "Lifestyle",
    "Travel",
    "Fashion",
  ];

  return (
    <div className="bg-white text-[#111111]">
      {/* ─── Utility bar ─────────────────────────────────── */}
      <div className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs">
          <span className="font-semibold tracking-wide hidden sm:inline">
            Saturday, July 18, 2026
          </span>
          <span className="font-semibold tracking-wide sm:hidden">Sat, Jul 18</span>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="hover:text-[#B91C2B]">
              <FaFacebookF className="text-[11px]" />
            </a>
            <a href="#" aria-label="X" className="hover:text-[#B91C2B]">
              <FaXTwitter className="text-[11px]" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-[#B91C2B]">
              <FaInstagram className="text-[11px]" />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-[#B91C2B]">
              <FaYoutube className="text-[11px]" />
            </a>
          </div>
        </div>
      </div>

      {/* ─── Header / Nav ────────────────────────────────── */}
      <header className="border-b-2 border-[#111111] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <FiFeather className="text-2xl sm:text-3xl" />
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                <span className="font-light">FEATHERED</span>
                <span className="font-black">PEN</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-sm font-bold uppercase tracking-wide hover:text-[#B91C2B]"
                >
                  {link}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                aria-label="Search"
                className="w-10 h-10 flex items-center justify-center border-2 border-[#111111] hover:bg-[#111111] hover:text-white"
              >
                <FiSearch className="text-base" />
              </button>
              <a
                href="#subscribe"
                className="hidden sm:inline-flex items-center bg-[#B91C2B] text-white font-bold uppercase tracking-wide text-sm px-5 py-2.5 hover:bg-[#111111]"
              >
                Subscribe
              </a>
              <button
                aria-label="Toggle menu"
                onClick={() => setMenuOpen((v) => !v)}
                className="lg:hidden w-10 h-10 flex items-center justify-center border-2 border-[#111111]"
              >
                {menuOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {menuOpen && (
            <nav className="lg:hidden border-t-2 border-[#111111] py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-base font-bold uppercase tracking-wide py-3 border-b border-[#E5E3DD]"
                >
                  {link}
                </a>
              ))}
              <a
                href="#subscribe"
                className="mt-3 inline-flex items-center justify-center bg-[#B91C2B] text-white font-bold uppercase tracking-wide text-sm px-5 py-3"
              >
                Subscribe
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Featured story */}
          <div className="lg:col-span-2 border-2 border-[#111111]">
            <img
              src={featuredStory.image}
              alt={featuredStory.title}
              className="w-full h-64 sm:h-80 md:h-[420px] object-cover border-b-2 border-[#111111]"
            />
            <div className="p-5 sm:p-8">
              <CategoryTag category={featuredStory.category} size="lg" />
              <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black leading-[1.05] tracking-tight">
                {featuredStory.title}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#4A4A4A] max-w-2xl">
                {featuredStory.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6B6B6B]">
                <span className="font-bold text-[#111111]">
                  By {featuredStory.author}
                </span>
                <span>{featuredStory.date}</span>
                <span className="flex items-center gap-1.5">
                  <FaRegClock className="text-xs" />
                  {featuredStory.readTime}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary stories */}
          <div className="flex flex-col gap-6 sm:gap-8">
            {secondaryStories.map((story, idx) => (
              <a
                key={idx}
                href="#"
                className="flex flex-col sm:flex-row lg:flex-col border-2 border-[#111111]"
              >
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full sm:w-40 lg:w-full h-48 sm:h-auto lg:h-40 object-cover shrink-0"
                />
                <div className="p-4 sm:p-5 flex-1">
                  <CategoryTag category={story.category} />
                  <h3 className="mt-3 text-lg sm:text-xl font-black leading-tight">
                    {story.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B6B6B]">
                    <span className="font-bold text-[#111111]">{story.author}</span>
                    <span>{story.readTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trending Now ────────────────────────────────── */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#B91C2B] mb-6">
            Trending Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
            {trendingStories.map((story, idx) => (
              <a
                key={idx}
                href="#"
                className="border-t-2 border-white/20 pt-4 flex flex-col gap-3 hover:border-white"
              >
                <span className="text-3xl sm:text-4xl font-black text-white/20">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div>
                  <CategoryTag category={story.category} />
                  <h3 className="mt-2 text-base font-bold leading-snug">
                    {story.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Latest Stories ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Latest Stories
          </h2>
          <a
            href="#"
            className="hidden sm:flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:text-[#B91C2B]"
          >
            View all <FaArrowRight className="text-xs" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestStories.map((story, idx) => (
            <a
              key={idx}
              href="#"
              className={`border-2 border-[#111111] flex flex-col ${
                story.size === "large" ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : ""
              }`}
            >
              <img
                src={story.image}
                alt={story.title}
                className={`w-full object-cover border-b-2 border-[#111111] ${
                  story.size === "large" ? "h-64 sm:h-72 lg:h-80" : "h-48 sm:h-56"
                }`}
              />
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <CategoryTag category={story.category} />
                <h3
                  className={`mt-3 font-black leading-tight ${
                    story.size === "large" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
                  }`}
                >
                  {story.title}
                </h3>
                {story.excerpt && (
                  <p className="mt-3 text-sm sm:text-base text-[#4A4A4A]">
                    {story.excerpt}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B6B6B] mt-auto pt-4">
                  <span className="font-bold text-[#111111]">{story.author}</span>
                  <span>{story.date}</span>
                  <span className="flex items-center gap-1.5">
                    <FaRegClock className="text-[10px]" />
                    {story.readTime}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <a
          href="#"
          className="sm:hidden mt-8 flex items-center justify-center gap-2 border-2 border-[#111111] py-3.5 text-sm font-bold uppercase tracking-wide"
        >
          View all stories <FaArrowRight className="text-xs" />
        </a>
      </section>

      {/* ─── Editor's Pick / Pull Quote ──────────────────── */}
      <section className="border-y-2 border-[#111111] bg-[#FAFAF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#B91C2B]">
            Editor's Pick
          </span>
          <p className="mt-6 text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight">
            "Trust isn't rebuilt with a headline. It's rebuilt one accurate,
            unglamorous story at a time — published even when nobody's watching."
          </p>
          <p className="mt-6 text-sm sm:text-base font-bold text-[#6B6B6B]">
            — Maren Okafor, Editor-in-Chief
          </p>
        </div>
      </section>

      {/* ─── Newsletter CTA ──────────────────────────────── */}
      <section id="subscribe" className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Never miss a story worth reading
              </h2>
              <p className="mt-3 text-base sm:text-lg text-white/60">
                One curated email every week. Original reporting, no filler,
                unsubscribe whenever you want.
              </p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 max-w-md lg:max-w-none"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 min-w-0 bg-white text-[#111111] placeholder-[#6B6B6B] text-base px-5 py-4 outline-none border-2 border-white"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#B91C2B] text-white font-bold uppercase tracking-wide text-sm px-7 py-4 border-2 border-[#B91C2B] hover:bg-white hover:text-[#111111] hover:border-white"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Category strip ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-8">
          Explore By Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {Object.entries(CATEGORIES).map(([name, color]) => (
            <a
              key={name}
              href="#"
              className="flex flex-col items-start justify-between h-28 sm:h-32 p-4 text-white border-2 border-[#111111] hover:opacity-90"
              style={{ backgroundColor: color }}
            >
              <span className="text-xs font-black uppercase tracking-widest">
                Section
              </span>
              <span className="text-lg sm:text-xl font-black">{name}</span>
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NewsLandingPage;