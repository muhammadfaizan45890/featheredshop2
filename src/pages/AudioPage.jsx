import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import API from '../utils/api';
import {
  FiClock, FiCalendar, FiUser, FiPlay, FiPause, FiHeadphones,
  FiSearch, FiX, FiLoader, FiChevronLeft, FiChevronRight,
  FiStopCircle, FiVolume2, FiVolumeX
} from 'react-icons/fi';
import DOMPurify from 'dompurify';

const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

// ─── Helpers ────────────────────────────────────────────────
const extractMediaSrc = (embedCode) => {
  if (!embedCode) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(embedCode, 'text/html');
    const media = doc.querySelector('audio, video');
    if (media) {
      const directSrc = media.getAttribute('src');
      if (directSrc) return { type: 'media', src: directSrc };
      const source = media.querySelector('source');
      if (source && source.getAttribute('src')) {
        return { type: 'media', src: source.getAttribute('src') };
      }
    }
    const iframe = doc.querySelector('iframe');
    if (iframe && iframe.getAttribute('src')) {
      return { type: 'iframe', src: iframe.getAttribute('src'), raw: embedCode };
    }
  } catch (e) {
    console.error('Failed to parse embed code:', e);
  }
  return null;
};

const formatTime = (secs) => {
  if (!isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ─── Skeleton ──────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-zinc-800 overflow-hidden">
    <div className="aspect-square bg-gray-300 dark:bg-zinc-700" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-3/4" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-full" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-1/2" />
    </div>
  </div>
);

// ─── Tiny equalizer bars ──────────────────────────────────
const EqBars = () => (
  <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-[3px] bg-white rounded-full animate-[eq_0.9s_ease-in-out_infinite]"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

// ════════════════════════════════════════════════════════════
//  CUSTOM AUDIO CONTROLS (fully responsive, with loading)
// ════════════════════════════════════════════════════════════
const AudioControls = ({
  audioRef,
  isPlaying,
  isLoading,
  progress,
  onToggle,
  onStop,
  onSeek,
}) => {
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);

  // Sync volume with the audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 1);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <div className="space-y-3">
      {/* Top row: play/pause, stop, time, volume */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onToggle}
            disabled={isLoading}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="p-3 sm:p-3 bg-black dark:bg-white text-white dark:text-black rounded-full
                       hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50
                       active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-red-500
                       focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-800"
          >
            {isLoading ? (
              <FiLoader size={20} className="animate-spin" />
            ) : isPlaying ? (
              <FiPause size={20} />
            ) : (
              <FiPlay size={20} />
            )}
          </button>

          <button
            onClick={onStop}
            aria-label="Stop"
            className="p-2.5 sm:p-2.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-full
                       hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors
                       active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <FiStopCircle size={18} />
          </button>
        </div>

        <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums min-w-[80px]">
          {formatTime(progress.current)} / {formatTime(progress.duration)}
        </span>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={toggleMute}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                       outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full p-0.5"
          >
            {volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full appearance-none cursor-pointer
                       accent-red-500 outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Seek bar */}
      {progress.duration > 0 && (
        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={progress.duration}
          aria-valuenow={progress.current}
          tabIndex={0}
          onClick={onSeek}
          className="h-2 sm:h-1.5 w-full rounded-full bg-gray-200 dark:bg-zinc-700 cursor-pointer overflow-hidden"
        >
          <div
            className="h-full bg-red-500 rounded-full transition-[width] duration-150"
            style={{ width: `${(progress.current / progress.duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Player Overlay ───────────────────────────────────────
const AudioPlayerOverlay = ({
  audio,
  isOpen,
  onClose,
  media,
  sanitizedIframe,
  audioRef,
  isPlaying,
  isLoading,
  progress,
  handleToggle,
  handleStop,
  handleSeek,
  returnFocusRef,
}) => {
  const sheetRef = useRef(null);
  const closeBtnRef = useRef(null);
  const dragState = useRef({ startY: 0, currentY: 0, dragging: false });
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
      returnFocusRef?.current?.focus?.();
    };
  }, [isOpen, onClose, returnFocusRef]);

  const onDragStart = (e) => {
    dragState.current = { startY: e.clientY, currentY: e.clientY, dragging: true };
  };
  const onDragMove = (e) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientY - dragState.current.startY;
    if (delta > 0) {
      dragState.current.currentY = e.clientY;
      setDragOffset(delta);
    }
  };
  const onDragEnd = () => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    if (dragOffset > 90) onClose();
    setDragOffset(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={audio.title}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `translateY(${dragOffset}px)`, transition: dragOffset ? 'none' : undefined }}
        className="bg-white dark:bg-zinc-800 shadow-2xl w-full sm:max-w-md
                   rounded-t-3xl sm:rounded-2xl
                   max-h-[92dvh] overflow-y-auto
                   pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6
                   animate-[slideUp_0.28s_cubic-bezier(0.32,0.72,0,1)] sm:animate-[scaleIn_0.2s_ease-out]"
      >
        <div
          className="sm:hidden flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <span className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-zinc-600" />
        </div>

        <div className="px-5 sm:px-6 pt-2 sm:pt-6 relative">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close player"
            className="absolute top-2 sm:top-6 right-5 sm:right-6 text-gray-500 hover:text-gray-700
                       dark:text-gray-400 dark:hover:text-gray-200 outline-none
                       focus-visible:ring-2 focus-visible:ring-red-500 rounded-full p-1"
          >
            <FiX size={22} />
          </button>

          <div className="aspect-square w-full max-w-[220px] sm:max-w-none mx-auto rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-700 mb-4 mt-2 sm:mt-0 shadow-lg">
            <img
              src={audio.coverImage || 'https://via.placeholder.com/400x400/111111/FFFFFF?text=No+Image'}
              alt={audio.title}
              className="w-full h-full object-cover"
            />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white line-clamp-2 pr-8">{audio.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{audio.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span className="flex items-center gap-1"><FiUser size={12} /> {audio.author}</span>
            <span className="flex items-center gap-1"><FiCalendar size={12} /> {new Date(audio.publishedAt).toLocaleDateString()}</span>
          </div>

          <div className="mt-5">
            {media?.type === 'media' ? (
              <>
                {/* The native audio element is hidden – we use our custom controls */}
                <audio ref={audioRef} src={media.src} preload="none" className="hidden" />

                <AudioControls
                  audioRef={audioRef}
                  isPlaying={isPlaying}
                  isLoading={isLoading}
                  progress={progress}
                  onToggle={handleToggle}
                  onStop={handleStop}
                  onSeek={handleSeek}
                />
              </>
            ) : media?.type === 'iframe' ? (
              <div
                className="audio-embed-container rounded-lg overflow-hidden"
                dangerouslySetInnerHTML={{ __html: sanitizedIframe }}
              />
            ) : (
              <p className="text-red-500 text-sm">Unable to load audio.</p>
            )}
          </div>

          {isPlaying && media?.type === 'media' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-500">
              <EqBars />
              <span>Now playing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Individual Audio Card ────────────────────────────────
const AudioCard = ({ audio, onClick }) => {
  const coverUrl = audio.coverImage || 'https://via.placeholder.com/200x200/111111/FFFFFF?text=No+Image';
  const btnRef = useRef(null);

  const handleActivate = () => onClick(audio, btnRef);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleActivate}
      className="text-left bg-white dark:bg-zinc-800 overflow-hidden border border-gray-200 dark:border-zinc-700
                 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] group w-full
                 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
                 dark:focus-visible:ring-offset-zinc-900"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={coverUrl}
          alt={audio.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/200x200/111111/FFFFFF?text=No+Image';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 group-focus-visible:bg-black/25 transition-colors duration-300">
          <span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 transition-all duration-300">
            <FiPlay size={16} className="text-black translate-x-[1px]" />
          </span>
        </div>
        {audio.duration && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded">
            {audio.duration}
          </span>
        )}
      </div>
      <div className="p-2.5 sm:p-3">
        <h3 className="text-xs sm:text-sm font-bold text-black dark:text-white line-clamp-2 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
          {audio.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
          {audio.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          <span className="flex items-center gap-0.5">
            <FiUser size={10} /> {audio.author}
          </span>
          <span className="flex items-center gap-0.5">
            <FiCalendar size={10} /> {new Date(audio.publishedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </button>
  );
};

// ─── Search Bar ──────────────────────────────────────────────
const SearchBar = ({ value, onChange }) => (
  <div className="relative w-full sm:max-w-md">
    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search episodes, authors, topics…"
      className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-full border border-gray-200 dark:border-zinc-700
                 bg-white dark:bg-zinc-800 text-sm text-black dark:text-white
                 placeholder-gray-400 dark:placeholder-gray-500
                 transition-colors duration-200
                 outline-none"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                   dark:hover:text-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full p-0.5"
      >
        <FiX size={16} />
      </button>
    )}
  </div>
);

// ─── Main Component ─────────────────────────────────────────
const AudioPage = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [selectedAudio, setSelectedAudio] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const audioRef = useRef(null);
  const returnFocusRef = useRef(null);

  const fetchAudio = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/api/audio', { params: { page: pageNum, limit: 12 } });
      if (res.data.success) {
        setAudioList(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Fetch audio error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudio(page);
  }, [page, fetchAudio]);

  const filteredAudioList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audioList;
    return audioList.filter((a) =>
      [a.title, a.description, a.author]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [audioList, search]);

  // ─── Player handlers ─────────────────────────────────────
  const openPlayer = (audio, triggerRef) => {
    returnFocusRef.current = triggerRef?.current || null;
    setSelectedAudio(audio);
    setIsPlayerOpen(true);
    setProgress({ current: 0, duration: 0 });
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedAudio(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleToggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      setIsLoading(true);
      const playPromise = el.play();
      if (playPromise) playPromise.catch(() => setIsLoading(false));
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e) => {
    const el = audioRef.current;
    if (!el || !progress.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    el.currentTime = ratio * progress.duration;
  };

  // ─── Audio element events ──────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => { setIsPlaying(true); setIsLoading(false); };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => setIsPlaying(false);
    const onTimeUpdate = () =>
      setProgress({ current: el.currentTime, duration: el.duration || 0 });
    const onLoadedMeta = () =>
      setProgress((p) => ({ ...p, duration: el.duration || 0 }));

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMeta);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMeta);
    };
  }, [selectedAudio]);

  const selectedMedia = selectedAudio ? extractMediaSrc(selectedAudio.embedCode) : null;
  const sanitizedIframe = useMemo(() => {
    if (selectedMedia?.type !== 'iframe') return null;
    return DOMPurify.sanitize(selectedMedia.raw, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['src', 'allow', 'allowtransparency', 'allowfullscreen', 'loading', 'style', 'width', 'height', 'frameborder'],
    });
  }, [selectedMedia]);

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 py-6 sm:py-10 md:py-12 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-black dark:bg-white rounded-lg">
              <FiHeadphones className="text-white dark:text-black" size={18} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[4px] text-red-500">Listen</span>
          </div>
          <h1 className="text-[clamp(1.75rem,6vw,3rem)] font-bold text-black dark:text-white leading-tight">
            Audio Library
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-prose">
            Explore our latest episodes and audio content – tap any card to listen.
          </p>
          <div className="mt-4 sm:mt-5">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fill,minmax(135px,1fr))]">
            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : audioList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎧</div>
            <p className="text-lg text-gray-500 dark:text-gray-400">No audio content yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon for new episodes.</p>
          </div>
        ) : filteredAudioList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-lg text-gray-500 dark:text-gray-400">No results for "{search}".</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fill,minmax(135px,1fr))]">
              {filteredAudioList.map((audio) => (
                <AudioCard key={audio._id} audio={audio} onClick={openPlayer} />
              ))}
            </div>

            {totalPages > 1 && !search && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 sm:mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 dark:border-zinc-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <FiChevronLeft size={14} className="sm:hidden" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <span className="px-2 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 dark:border-zinc-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <span className="hidden sm:inline">Next</span>
                  <FiChevronRight size={14} className="sm:hidden" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isPlayerOpen && selectedAudio && (
        <AudioPlayerOverlay
          audio={selectedAudio}
          isOpen={isPlayerOpen}
          onClose={closePlayer}
          media={selectedMedia}
          sanitizedIframe={sanitizedIframe}
          audioRef={audioRef}
          isPlaying={isPlaying}
          isLoading={isLoading}
          progress={progress}
          handleToggle={handleToggle}
          handleStop={handleStop}
          handleSeek={handleSeek}
          returnFocusRef={returnFocusRef}
        />
      )}

      <style jsx>{`
        @keyframes eq {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .audio-embed-container iframe {
          width: 100%;
          max-width: 100%;
          height: 100px;
          border: 0;
        }
        @media (min-width: 640px) {
          .audio-embed-container iframe {
            height: 120px;
          }
        }
        @media (min-width: 768px) {
          .audio-embed-container iframe {
            height: 152px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioPage;
