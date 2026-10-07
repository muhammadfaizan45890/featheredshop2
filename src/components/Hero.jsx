import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../utils/api";
import { ArrowRight, ArrowDown, Sparkles, Footprints, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

// ─── Helper: reliable API instance ──────────────────
const getApiInstance = () => {
  let instance;
  if (API && typeof API.get === "function") {
    instance = API;
  } else {
    instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "https://featherednews.vercel.app",
      headers: { "Content-Type": "application/json" },
    });
  }
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
  return instance;
};

const api = getApiInstance();

// ─── Palette (from the hero design) ─────────────────
const palette = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F5F5",
  ink: "#171717",
  inkSoft: "#525252",
  inkMuted: "#A3A3A3",
  border: "#E5E5E5",
  accent: "#171717",
  accentDeep: "#0A0A0A",
  gold: "#F59E0B",
  success: "#10B981",
};

// ─── Static fallback slides ──────────────────────────
const staticSlides = [
  {
    _id: 1,
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&q=80",
    category: "News • Featured",
    title: "At daybreak of the fifteenth day of my search",
    description:
      "When the amphitheater had cleared I crept stealthily to the top and, as the great excavation lay far from the plaza...",
    alt: "City architecture",
    buttonText: "Read More",
    link: "/news",
    order: 0,
    isActive: true,
  },
  {
    _id: 2,
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1400&q=80",
    category: "Travel • Adventure",
    title: "Beyond the horizon lies a world of wonder",
    description:
      "The journey of a thousand miles begins with a single step. Explore the unknown and discover the beauty that awaits.",
    alt: "Mountain landscape",
    buttonText: "Explore Now",
    link: "/news",
    order: 1,
    isActive: true,
  },
  {
    _id: 3,
    image:
      "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=1400&q=80",
    category: "Culture • Heritage",
    title: "Whispers of ancient civilizations",
    description:
      "Through the corridors of time, stories of forgotten empires echo, inviting us to uncover their timeless secrets.",
    alt: "Ancient ruins",
    buttonText: "Discover More",
    link: "/news",
    order: 2,
    isActive: true,
  },
  {
    _id: 4,
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=80",
    category: "Nature • Serenity",
    title: "Where the mountains meet the sky",
    description:
      "In the quiet embrace of nature, find peace that transcends the chaos of everyday life and rejuvenates the soul.",
    alt: "Mountain lake",
    buttonText: "View Gallery",
    link: "/news",
    order: 3,
    isActive: true,
  },
  {
    _id: 5,
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1400&q=80",
    category: "Business • Markets",
    title: "The quiet forces reshaping the global economy",
    description:
      "Behind every headline number is a chain of decisions. We trace the ones that matter most this quarter.",
    alt: "City skyline at dusk",
    buttonText: "Read More",
    link: "/news",
    order: 4,
    isActive: true,
  },
  {
    _id: 6,
    image:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1400&q=80",
    category: "Politics • Analysis",
    title: "Inside the negotiations no one was supposed to see",
    description:
      "Three sources, two continents, one deal that almost fell apart at the final hour.",
    alt: "Government building columns",
    buttonText: "Read More",
    link: "/news",
    order: 5,
    isActive: true,
  },
];

const SLIDE_DURATION = 2500;
const INPUT_LOCK_MS = 200;

// ─── Hero height: match the design's tall-immersive feel ──
const HERO_HEIGHT_CLASSES =
  "h-[clamp(420px,72vh,780px)] min-h-[420px]";

/* ─────────────────────────────────────────────────────────────
 * HD TEXT CSS — copied from the design
 * ───────────────────────────────────────────────────────────── */
const HD_CSS = `
  .hero-hd-root {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: geometricPrecision;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "ss01" 1;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
  .hero-hd-serif {
    font-family: 'Fraunces', 'Playfair Display', Georgia, serif;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 0, "WONK" 0, "opsz" 96;
    font-feature-settings: "kern" 1, "liga" 1, "ss01" 1;
  }
  .hero-hd-sans {
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "tnum" 1;
  }
  .hero-hd-num { font-variant-numeric: tabular-nums; }
  @keyframes hero-scroll-hint {
    0% { transform: translateY(-100%); opacity: 0; }
    40% { opacity: 1; }
    100% { transform: translateY(100%); opacity: 0; }
  }
  .hero-scroll-hint-bar { animation: hero-scroll-hint 1.8s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .hero-scroll-hint-bar { animation: none !important; }
  }
`;

/* ─────────────────────────────────────────────────────────────
 * Motion variants
 * ───────────────────────────────────────────────────────────── */
const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─────────────────────────────────────────────────────────────
 * ScrollHint (from the design)
 * ───────────────────────────────────────────────────────────── */
const ScrollHint = memo(function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.6 }}
      aria-hidden="true"
      className="
        absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2
        hidden sm:flex flex-col items-center gap-2
        z-10 pointer-events-none
      "
    >
      <span
        className="hero-hd-sans text-[10px] font-semibold uppercase tracking-[0.25em]"
        style={{ color: "rgba(255, 255, 255, 0.7)" }}
      >
        Scroll
      </span>
      <span
        className="relative w-px h-10 overflow-hidden"
        style={{ background: "rgba(255, 255, 255, 0.25)" }}
      >
        <span
          className="hero-scroll-hint-bar absolute inset-x-0 top-0 h-1/2"
          style={{ background: "#FFFFFF" }}
        />
      </span>
      <ArrowDown
        className="h-3.5 w-3.5"
        style={{ color: "rgba(255, 255, 255, 0.7)" }}
        strokeWidth={2.25}
      />
    </motion.div>
  );
});

/* ═════════════════════════════════════════════════════════════
 * Hero
 * ═════════════════════════════════════════════════════════════ */
const Hero = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  const autoPlayRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const liveRegionRef = useRef(null);

  // Parallax for the active slide's image
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const totalSlides = slides.length;

  // ─── Fetch slides ──────────────────────────────────
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/hero");
        let fetched = [];
        if (res.data.success && res.data.data.length > 0) {
          fetched = res.data.data;
        } else {
          fetched = staticSlides;
        }

        const active = fetched.filter((s) => s.isActive !== false);
        const sorted = active.sort((a, b) => (a.order || 0) - (b.order || 0));

        setSlides(sorted);
        setError(null);
      } catch (err) {
        console.error("Error fetching hero slides:", err);
        setError("Failed to load hero slides");
        const active = staticSlides.filter((s) => s.isActive !== false);
        const sorted = active.sort((a, b) => (a.order || 0) - (b.order || 0));
        setSlides(sorted);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // ─── Navigation ────────────────────────────────────
  const goToSlide = useCallback(
    (index) => {
      if (isLocked || totalSlides === 0) return;
      const targetIndex = ((index % totalSlides) + totalSlides) % totalSlides;
      setIsLocked(true);
      setCurrentIndex(targetIndex);

      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = setTimeout(() => {
        setIsLocked(false);
        lockTimeoutRef.current = null;
      }, INPUT_LOCK_MS);
    },
    [isLocked, totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // ─── Auto-play ─────────────────────────────────────
  useEffect(() => {
    if (totalSlides === 0 || isPaused) return;
    autoPlayRef.current = setInterval(nextSlide, SLIDE_DURATION);
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [nextSlide, totalSlides, isPaused]);

  // ─── Preload images ──────────────────────────────
  useEffect(() => {
    if (totalSlides === 0) return;
    const nextIndex = (currentIndex + 1) % totalSlides;
    const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    [nextIndex, prevIndex].forEach((i) => {
      const img = new Image();
      img.src = slides[i]?.image;
    });
  }, [currentIndex, slides, totalSlides]);

  // ─── Screen reader ──────────────────────────────
  useEffect(() => {
    if (totalSlides === 0 || !liveRegionRef.current) return;
    liveRegionRef.current.textContent = `Slide ${currentIndex + 1} of ${totalSlides}: ${
      slides[currentIndex]?.title || ""
    }`;
  }, [currentIndex, slides, totalSlides]);

  // ─── Keyboard ─────────────────────────────────────
  useEffect(() => {
    if (totalSlides === 0) return;
    const node = containerRef.current;
    if (!node) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      }
    };
    node.addEventListener("keydown", handleKeyDown);
    return () => node.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, totalSlides]);

  // ─── Touch ──────────────────────────────────────
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setIsPaused(true);
  };
  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };
  const handleTouchEnd = () => {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    setTouchStartX(0);
    setTouchEndX(0);
    setIsPaused(false);
  };

  // ─── Pause on hover / focus ─────────────────────
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleFocus = () => setIsPaused(true);
  const handleBlur = (e) => {
    if (!containerRef.current?.contains(e.relatedTarget)) setIsPaused(false);
  };

  // ─── Cleanup ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  // ─── Loading skeleton ────────────────────────────
  if (loading) {
    return (
      <section className="hero-hd-root w-full" style={{ background: palette.bg }}>
        <style>{HD_CSS}</style>
        <div className={`w-full bg-neutral-100 animate-pulse ${HERO_HEIGHT_CLASSES}`} />
      </section>
    );
  }

  if (totalSlides === 0) return null;

  const activeSlide = slides[currentIndex] || {};
  const targetLink = activeSlide.link || "/news";
  const goToLink = () => navigate(targetLink);

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured stories"
      className={`hero-hd-root relative w-full overflow-hidden ${HERO_HEIGHT_CLASSES}`}
      style={{ background: palette.accentDeep }}
    >
      <style>{HD_CSS}</style>
      <span ref={liveRegionRef} className="sr-only" aria-live="polite" />

      {/* ─── Background image (parallax) ─────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{ y: imageY }}
        className="absolute inset-0 w-full h-[120%]"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeSlide._id || currentIndex}
            src={activeSlide.image}
            alt=""
            fetchpriority="high"
            loading="eager"
            decoding="async"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/1400x780?text=Image+Unavailable";
            }}
          />
        </AnimatePresence>
      </motion.div>

      {/* ─── Gradient overlays (from the design) ─────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              to top,
              rgba(0, 0, 0, 0.75) 0%,
              rgba(0, 0, 0, 0.55) 30%,
              rgba(0, 0, 0, 0.25) 60%,
              rgba(0, 0, 0, 0.35) 100%
            )
          `,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              transparent 40%,
              rgba(0, 0, 0, 0.3) 100%
            )
          `,
        }}
      />

      {/* ─── Content ──────────────────────────────────────── */}
      <div className="relative h-full w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex items-center">
        <motion.div
          style={{ y: contentY, opacity }}
          className="max-w-2xl w-full"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide._id || currentIndex}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              {/* Eyebrow pill */}
              <motion.div variants={itemVariants}>
                <span
                  className="
                    hero-hd-sans inline-flex items-center gap-2
                    px-3 py-1.5
                    rounded-full
                    text-[10.5px] font-semibold uppercase tracking-[0.2em]
                    backdrop-blur-md
                  "
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                  }}
                >
                  <Footprints
                    className="h-3 w-3"
                    style={{ color: palette.gold }}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                  {activeSlide.category}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={itemVariants}
                id="hero-heading"
                className="
                  hero-hd-serif
                  mt-5 sm:mt-6
                  text-[clamp(1.75rem,5.5vw,4.5rem)]
                  font-medium
                  leading-[1.05]
                  tracking-[-0.035em]
                  line-clamp-3
                "
                style={{ color: "#FFFFFF" }}
              >
                {activeSlide.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="
                  hero-hd-sans
                  mt-5 sm:mt-6
                  max-w-lg
                  text-[14.5px] sm:text-base
                  leading-relaxed
                  line-clamp-2 sm:line-clamp-3
                "
                style={{ color: "rgba(255, 255, 255, 0.75)" }}
              >
                {activeSlide.description}
              </motion.p>

              {/* CTA */}
              <motion.div
                variants={itemVariants}
                className="mt-7 sm:mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToLink();
                  }}
                  className="
                    hero-hd-sans group
                    inline-flex items-center justify-center gap-2
                    h-12 px-6
                    rounded-full
                    text-[13.5px] font-semibold tracking-[-0.005em]
                    transition-[background-color,transform,box-shadow]
                    duration-200
                    active:scale-[0.99]
                    outline-none focus:outline-none focus-visible:outline-none
                  "
                  style={{
                    background: "#FFFFFF",
                    color: palette.ink,
                    boxShadow: "0 10px 24px -12px rgba(0,0,0,0.5)",
                  }}
                >
                  {activeSlide.buttonText || "Read More"}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ─── Slide counter (design-style, minimal) ───────── */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-8 z-20 pointer-events-none">
        <span
          className="hero-hd-sans hero-hd-num text-[11px] font-semibold tracking-[0.2em] tabular-nums"
          style={{ color: "rgba(255, 255, 255, 0.85)" }}
        >
          {String(currentIndex + 1).padStart(2, "0")}
          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>
            {" "}
            / {String(totalSlides).padStart(2, "0")}
          </span>
        </span>
      </div>

      {/* ─── Minimal arrow navigation (design-style) ─────── */}
      {totalSlides > 1 && (
        <div className="absolute bottom-6 right-5 sm:right-8 z-20 flex items-center gap-1">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="
              inline-flex items-center justify-center
              h-10 w-10 rounded-full
              transition-all duration-200
              backdrop-blur-md
              outline-none focus:outline-none focus-visible:outline-none
              hover:scale-105 active:scale-95
            "
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#FFFFFF",
            }}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="
              inline-flex items-center justify-center
              h-10 w-10 rounded-full
              transition-all duration-200
              backdrop-blur-md
              outline-none focus:outline-none focus-visible:outline-none
              hover:scale-105 active:scale-95
            "
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#FFFFFF",
            }}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      )}

      {/* ─── Scroll hint (design-style, desktop only) ────── */}
      <ScrollHint />

      {/* ─── Progress bar (per slide) ─────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 pb-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex}
                className="relative h-[2px] flex-1 max-w-[60px] overflow-hidden rounded-full outline-none focus:outline-none focus-visible:outline-none"
                style={{
                  background:
                    index === currentIndex
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(255, 255, 255, 0.15)",
                }}
              >
                {index === currentIndex && (
                  <motion.span
                    key={currentIndex}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: isPaused ? 0 : SLIDE_DURATION / 1000,
                      ease: "linear",
                    }}
                    className="absolute inset-y-0 left-0 right-0 origin-left"
                    style={{ background: "#FFFFFF" }}
                  />
                )}
                {index < currentIndex && (
                  <span
                    className="absolute inset-y-0 left-0 right-0"
                    style={{ background: "rgba(255, 255, 255, 0.5)" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;