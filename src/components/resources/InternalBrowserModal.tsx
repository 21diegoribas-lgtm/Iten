import React, { useState, useEffect, useRef } from 'react';
import { ResourceItem } from '../../types';
import { soundFx } from '../../utils/sound';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  ExternalLink,
  X,
  AlertTriangle,
  Globe,
  Tv,
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';

interface InternalBrowserModalProps {
  resource: ResourceItem;
  onClose: () => void;
}

export const InternalBrowserModal: React.FC<InternalBrowserModalProps> = ({ resource, onClose }) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format URL if needed (e.g. youtube watch -> embed)
  const getEmbedUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    let url = rawUrl.trim();

    // Ensure http/https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Convert Youtube watch link to embed link
    if (url.includes('youtube.com/watch')) {
      const videoId = new URLSearchParams(url.split('?')[1] || '').get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    // Convert Google Drive view link to preview
    if (url.includes('drive.google.com/file/d/')) {
      return url.replace(/\/view.*$/, '/preview');
    }

    return url;
  };

  const formattedUrl = getEmbedUrl(resource.url);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut ESC to exit or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Controls auto-hide in Projector Mode
  const handleMouseMove = () => {
    if (isProjectorMode) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  const handleClose = () => {
    soundFx.playClick();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  const handleRefresh = () => {
    soundFx.playClick();
    setHasLoadError(false);
    setIframeKey(prev => prev + 1);
  };

  const handleZoomIn = () => {
    if (zoomLevel < 1.8) {
      soundFx.playClick();
      setZoomLevel(prev => Math.min(1.8, +(prev + 0.15).toFixed(2)));
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.6) {
      soundFx.playClick();
      setZoomLevel(prev => Math.max(0.6, +(prev - 0.15).toFixed(2)));
    }
  };

  const toggleFullscreen = async () => {
    soundFx.playClick();
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else {
          await document.documentElement.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const openInExternalTab = () => {
    soundFx.playClick();
    if (resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden select-none"
    >
      {/* 1. TOP BROWSER TOOLBAR */}
      <div
        className={`bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 transition-all duration-300 z-30 ${
          isProjectorMode && !showControls ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        {/* Navigation & Refresh Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => soundFx.playClick()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => soundFx.playClick()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Tiến tới"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Tải lại trang"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />

          {/* Title & Badge */}
          <div className="flex items-center gap-2 max-w-md truncate">
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-black uppercase tracking-wider shrink-0">
              TRÌNH DUYỆT ITEN
            </span>
            <span className="text-xs sm:text-sm font-black text-white truncate" title={resource.title}>
              {resource.title}
            </span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-slate-200">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.6}
              className="p-1 rounded-lg hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-[11px] font-black min-w-[45px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 1.8}
              className="p-1 rounded-lg hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Projector Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsProjectorMode(!isProjectorMode);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
              isProjectorMode
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
            }`}
            title="Tối ưu giao diện chiếu bài lên TV/máy chiếu"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chế độ máy chiếu</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Open in New Tab */}
          <button
            type="button"
            onClick={openInExternalTab}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Mở đường link trong tab trình duyệt mới"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mở trong tab mới</span>
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer"
            title="Thoát (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN IFRAME CONTENT DISPLAY */}
      <div className="flex-1 relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {hasLoadError || !formattedUrl ? (
          /* Requirement 4: Security Fallback for non-embeddable sites */
          <div className="bg-slate-900 p-8 sm:p-12 rounded-3xl max-w-lg text-center space-y-5 border-4 border-amber-400/40 shadow-2xl m-4 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-400 border-2 border-amber-400/30">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-white">
                Trang web không cho phép hiển thị trực tiếp trong ITEN
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Website này cài đặt chính sách bảo mật (<span className="text-amber-300 font-bold">X-Frame-Options</span> hoặc <span className="text-amber-300 font-bold">CSP</span>) ngăn cản việc nhúng vào ứng dụng khác.
              </p>
            </div>

            <div className="p-3 bg-slate-800 rounded-2xl text-[11px] text-slate-400 text-left space-y-1 font-mono">
              <div className="text-slate-300 font-bold">🔗 Đường link:</div>
              <div className="truncate text-sky-400">{resource.url || 'Chưa cung cấp đường link'}</div>
            </div>

            <button
              type="button"
              onClick={openInExternalTab}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-black text-sm rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Globe className="w-5 h-5" />
              <span>🌐 MỞ TRONG TAB MỚI</span>
            </button>
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center overflow-auto transition-all duration-200"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              width: `${100 / zoomLevel}%`,
              height: `${100 / zoomLevel}%`
            }}
          >
            <iframe
              key={iframeKey}
              src={formattedUrl}
              title={resource.title}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
              onError={() => setHasLoadError(true)}
            />
          </div>
        )}

        {/* Floating Help Banner for embedding check */}
        {!hasLoadError && formattedUrl && (
          <div className="absolute bottom-3 left-3 z-20 opacity-80 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setHasLoadError(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 cursor-pointer shadow-lg"
              title="Báo lỗi nếu trang trắng hoặc không load"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Trang trắng hoặc không tải được?</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
