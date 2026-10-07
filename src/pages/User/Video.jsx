import React, { useRef, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";

// ─── Helper: extract video ID ───────────────────────────
const getVideoId = (url) => {
  if (!url) return null;
  const regex = /(?:youtube\.com.*(?:v=|\/embed\/|\/shorts\/)|youtu\.be\/)([^&?/\s]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// ─── Main Component ─────────────────────────────────────
const Video = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const youtubeUrl = location.state?.youtubeUrl;

  // ── Refs ──
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  // ── State ──
  const [videoId, setVideoId] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState("default");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Init video ID ──
  useEffect(() => {
    const id = getVideoId(youtubeUrl);
    setVideoId(id);
  }, [youtubeUrl]);

  // ── Timer: update current time every second ──
  useEffect(() => {
    if (playerReady && playing) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => clearInterval(intervalRef.current);
  }, [playerReady, playing]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!playerRef.current) return;
      const target = e.target;
      if (target.tagName === "INPUT" || target.tagName === "SELECT") return;

      switch (e.key) {
        case " ":
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(-5);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerReady, playing, currentTime, duration]);

  // ── Fullscreen change listener ──
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // ── Pause on unmount ──
  useEffect(() => {
    return () => {
      if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();
    };
  }, []);

  // ── Player events ──
  const onReady = (event) => {
    playerRef.current = event.target;
    const player = event.target;
    setDuration(player.getDuration());
    setVolume(player.getVolume());
    setMuted(player.isMuted());
    setPlayerReady(true);
    player.playVideo();
    setPlaying(true);
  };

  const onStateChange = (event) => {
    const state = event.data;
    if (state === 1) setPlaying(true);
    else if (state === 2) setPlaying(false);
  };

  // ── Controls ──
  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (playing) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setPlaying(!playing);
  };

  const seek = (seconds) => {
    if (!playerRef.current) return;
    const newTime = Math.min(Math.max(currentTime + seconds, 0), duration);
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.seekTo(val, true);
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val === 0) {
        setMuted(true);
      } else if (muted) {
        setMuted(false);
        playerRef.current.unMute();
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
      setVolume(playerRef.current.getVolume());
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  };

  const handlePlaybackRateChange = (e) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);
    if (playerRef.current) playerRef.current.setPlaybackRate(rate);
  };

  const handleQualityChange = (e) => {
    const q = e.target.value;
    setQuality(q);
    if (playerRef.current && playerRef.current.setPlaybackQuality) {
      playerRef.current.setPlaybackQuality(q);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen();
    }
  };

  // ── Format time ──
  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ── Render ──
  if (!videoId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">No Video Found</h2>
          <p className="text-gray-400 mb-6">The video link is invalid or missing.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-6">
      {/* ── Top bar ── */}
      <div className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition backdrop-blur-sm text-sm sm:text-base"
        >
          <span>←</span> Stop Video
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Video Container ── */}
      <div
        ref={containerRef}
        id="video-container"
        className="w-full max-w-7xl aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative"
      >
        {/* YouTube iframe – pointer-events: none to block native controls */}
        <div className="w-full h-full pointer-events-none">
          {videoId && (
            <YouTube
              videoId={videoId}
              className="w-full h-full"
              opts={{
                width: "100%",
                height: "100%",
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  rel: 0,
                  modestbranding: 1,
                  fs: 0,
                  disablekb: 1,
                  iv_load_policy: 3,
                },
              }}
              onReady={onReady}
              onStateChange={onStateChange}
            />
          )}
        </div>

        {/* Overlay play/pause button (mobile friendly) */}
        {playerReady && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 w-full h-full flex items-center justify-center text-white/30 hover:text-white/60 transition-opacity duration-300 opacity-0 hover:opacity-100 focus:opacity-100"
            aria-label={playing ? "Pause" : "Play"}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
              {playing ? (
                <span className="text-4xl mb-2">⏸</span>
              ) : (
                <span className="text-4xl ml-2.5 mb-0.5">▶</span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* ── Custom Controls ── */}
      {playerReady && (
        <div className="w-full max-w-7xl mt-4 sm:mt-5 space-y-3">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
              style={{
                background: `linear-gradient(to right, white 0%, white ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`,
              }}
            />
            <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Control buttons group */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "⏸" : "▶"}
            </button>

            {/* Skip backward */}
            <button
              onClick={() => seek(-10)}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Rewind 10 seconds"
            >
              ⏪
            </button>

            {/* Skip forward */}
            <button
              onClick={() => seek(10)}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Forward 10 seconds"
            >
              ⏩
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? "🔇" : volume > 50 ? "🔊" : volume > 0 ? "🔉" : "🔈"}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Playback speed */}
            <select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <option key={rate} value={rate} className="bg-black">
                  {rate}x
                </option>
              ))}
            </select>

            {/* Quality */}
            <select
              value={quality}
              onChange={handleQualityChange}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {["default", "small", "medium", "large", "hd720", "hd1080", "highres"].map((q) => (
                <option key={q} value={q} className="bg-black">
                  {q === "default" ? "Auto" : q.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? "⛶" : "⛶"}
            </button>
          </div>

          {/* Remaining time */}
          <div className="text-center text-xs text-gray-500">
            Remaining: {formatTime(duration - currentTime)}
          </div>
        </div>
      )}

      {!playerReady && videoId && (
        <div className="w-full max-w-7xl mt-5 text-center text-gray-400 text-sm animate-pulse">
          Loading player...
        </div>
      )}
    </div>
  );
};

export default Video;