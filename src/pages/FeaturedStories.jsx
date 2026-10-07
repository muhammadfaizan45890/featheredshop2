import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Pagination, Keyboard, A11y } from 'swiper/modules';
import { Clock, Calendar, User, ArrowUpRight, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import axios from 'axios';
import API from '../utils/api';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

// ─── API instance ──────────────────────────────────────────
const api = axios.create({
  baseURL: API || import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Static fallback data ──────────────────────────────────
const staticStories = [
  // ... (your existing static data)
];

const AUTOPLAY_DELAY = 3000;

// Fluid slide width — continuous scaling
const SLIDE_WIDTH = 'clamp(240px, 26vw, 440px)';

// ─── Helper: strip HTML ──────────────────────────────────
const stripHtml = (html) => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || '';
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
};

// ─── Skeleton Card ─────────────────────────────────────────
const SkeletonCard = () => (
  <div className="shrink-0" style={{ width: SLIDE_WIDTH }}>
    <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/9] bg-gray-200 dark:bg-zinc-800 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
    <div className="mt-2 space-y-1.5">
      <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800" />
    </div>
  </div>
);

// ─── Individual Card ────────────────────────────────────────
const Card = ({ post, isActive, index, total, paused }) => {
  const slug = post.slug || post.id || post._id;
  const [loaded, setLoaded] = useState(false);

  return (
    <Link
      to={`/article/${slug}`}
      aria-label={`${post.title} — story ${index + 1} of ${total}`}
      className={`
        block relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] border border-transparent
        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
        ${isActive ? 'scale-100 shadow-[0_2px_0_0_rgba(239,68,68,1)]' : 'scale-[0.92] opacity-50 blur-[0.5px]'}
        group bg-white dark:bg-zinc-800
      `}
    >
      {/* index tag */}
      <span className="absolute top-0 left-0 z-10 bg-black/80 text-white text-[10px] font-bold tracking-widest px-2 py-1">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* autoplay progress bar */}
      {isActive && (
        <span className="absolute top-0 left-0 right-0 z-10 h-[2px] bg-black/10 dark:bg-white/10">
          <span
            className="block h-full bg-red-500 origin-left"
            style={{
              animation: paused ? 'none' : `progress ${AUTOPLAY_DELAY}ms linear forwards`,
            }}
          />
        </span>
      )}

      <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/9] relative bg-gray-100 dark:bg-zinc-900">
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.8s_ease-in-out_infinite]" />
        )}
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1280px) 440px, 26vw"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
          } group-hover:scale-[1.08]`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
            setLoaded(true);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between mb-1.5">
            {post.category && (
              // ─── Category badge – now solid red background with white text ───
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-red-600 text-white">
                {post.category}
              </span>
            )}
            <ArrowUpRight
              size={16}
              className="text-white/0 group-hover:text-white translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300"
            />
          </div>

          <h3 className="text-base sm:text-lg md:text-xl 2xl:text-2xl font-bold leading-snug line-clamp-2">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-[11px] sm:text-xs md:text-sm text-white/75 leading-snug line-clamp-2 mt-1 max-w-[95%]">
              {stripHtml(post.excerpt)}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-white/65 mt-1.5">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <User size={11} />
              {post.author?.name || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─── Main Component ─────────────────────────────────────────
const FeaturedStories = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const swiperRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/featured');
      if (res.data.success && res.data.data.length > 0) {
        setPosts(res.data.data);
      } else {
        setPosts(staticStories);
      }
    } catch (err) {
      console.error('Error fetching featured stories:', err);
      setError('Failed to load featured stories');
      setPosts(staticStories);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  // ─── Render header ──────────────────────────────────────
  const renderHeader = () => (
    <div className="mb-4 sm:mb-5 flex items-end justify-between gap-4">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[3px] text-red-500">
          Featured Stories
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl 2xl:text-4xl font-bold text-black dark:text-white leading-tight">
          Editor&apos;s Picks
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 max-w-2xl">
          Our handpicked selection of the most compelling stories from around the world.
        </p>
      </div>

      {/* Prev/Next controls — hidden on mobile, visible on sm+ */}
      {!loading && !error && posts.length > 0 && (
        <div className="hidden sm:flex items-center gap-2 shrink-0 mb-1">
          <button
            type="button"
            aria-label="Previous story"
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:border-red-500 hover:text-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next story"
            onClick={() => swiperRef.current?.slideNext()}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:border-red-500 hover:text-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );

  // ─── Content area ─────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex gap-3 sm:gap-4 md:gap-5 2xl:gap-6 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-500 bg-red-50 dark:bg-red-900/10 border border-dashed border-red-200 dark:border-red-800">
          <p>{error}</p>
          <button
            onClick={fetchFeatured}
            className="inline-flex items-center gap-2 mt-2.5 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      );
    }

    if (!posts.length) {
      return (
        <div className="text-center py-14 text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No featured stories available</p>
        </div>
      );
    }

    return (
      <>
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          modules={[Autoplay, EffectCoverflow, Pagination, Keyboard, A11y]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{
            prevSlideMessage: 'Previous story',
            nextSlideMessage: 'Next story',
            slideLabelMessage: 'Story {{index}} of {{slidesLength}}',
          }}
          coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 1.4, slideShadows: false }}
          autoplay={
            reducedMotion
              ? false
              : { delay: AUTOPLAY_DELAY, disableOnInteraction: true, pauseOnMouseEnter: true }
          }
          onAutoplayPause={() => setPaused(true)}
          onAutoplayResume={() => setPaused(false)}
          pagination={{ clickable: true, el: '.featured-pagination' }}
          speed={reducedMotion ? 0 : 700}
          loop
          className="hero-slider"
        >
          {posts.map((post, index) => (
            <SwiperSlide key={post.id || post._id} className="py-2" style={{ width: SLIDE_WIDTH }}>
              {({ isActive }) => (
                <Card post={post} isActive={isActive} index={index} total={posts.length} paused={paused} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>

        {/* live region for screen readers */}
        <span className="sr-only" aria-live="polite">
          {`Showing story ${activeIndex + 1} of ${posts.length}: ${posts[activeIndex]?.title || ''}`}
        </span>
      </>
    );
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900 py-5 sm:py-6 overflow-hidden">
      {/* ─── Container width – max-w-7xl ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {renderHeader()}
        {renderContent()}
        {/* progress dots */}
        <div className="featured-pagination flex items-center justify-center gap-1 sm:gap-1.5 mt-3 flex-wrap" />
      </div>

      {/* ─── Custom Styles ────────────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }

        .hero-slider .swiper-slide {
          transition-property: transform, opacity, filter;
          transition-duration: 500ms;
          transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Fluid pagination dots */
        .featured-pagination .swiper-pagination-bullet {
          width: clamp(12px, 2.4vw, 22px);
          height: clamp(2px, 0.3vw, 3px);
          border-radius: 0;
          background: rgba(0,0,0,0.15);
          opacity: 1;
          margin: 0 !important;
          transition: background 0.3s ease, width 0.3s ease;
          cursor: pointer;
        }
        .dark .featured-pagination .swiper-pagination-bullet {
          background: rgba(255,255,255,0.2);
        }
        .featured-pagination .swiper-pagination-bullet-active {
          background: #ef4444;
          width: clamp(20px, 3.6vw, 36px);
        }
      `}</style>
    </div>
  );
};

export default FeaturedStories;
