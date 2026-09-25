import React, { useState, useEffect, useRef } from 'react';
import { PresentationItem } from '../../types';
import { soundFx } from '../../utils/sound';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  FileText
} from 'lucide-react';

interface PresentationModeModalProps {
  presentation: PresentationItem;
  onClose: () => void;
  onUpdateLastViewed?: (slideIndex: number) => void;
  onDownloadOriginal?: (presentation: PresentationItem) => void;
}

export const PresentationModeModal: React.FC<PresentationModeModalProps> = ({
  presentation,
  onClose,
  onUpdateLastViewed,
  onDownloadOriginal
}) => {
  const totalSlides = presentation.slideImages?.length || presentation.slideCount || 1;
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [showPromptResume, setShowPromptResume] = useState<boolean>(
    presentation.lastViewedSlide > 1 && presentation.lastViewedSlide <= totalSlides
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (safety rule)
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, totalSlides]);

  // Handle auto-hide floating control bar on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3200);
  };

  useEffect(() => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3200);

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    soundFx.playClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen API not supported or blocked:', err);
    }
  };

  const goToNextSlide = () => {
    if (currentSlide < totalSlides) {
      soundFx.playClick();
      const next = currentSlide + 1;
      setCurrentSlide(next);
      if (onUpdateLastViewed) onUpdateLastViewed(next);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 1) {
      soundFx.playClick();
      const prev = currentSlide - 1;
      setCurrentSlide(prev);
      if (onUpdateLastViewed) onUpdateLastViewed(prev);
    }
  };

  const handleClose = () => {
    soundFx.playClick();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (onUpdateLastViewed) onUpdateLastViewed(currentSlide);
    onClose();
  };

  const handleSlideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.3) {
      goToPrevSlide();
    } else {
      goToNextSlide();
    }
  };

  const activeSlideImage = presentation.slideImages?.[currentSlide - 1] || presentation.thumbnail;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden select-none"
    >
      {/* 1. Resume Prompt Dialog Overlay */}
      {showPromptResume && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-amber-300 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto border-2 border-amber-300">
              📌
            </div>
            <h3 className="text-xl font-black text-slate-800">
              Tiếp tục bài trình chiếu?
            </h3>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              Lần trước thầy/cô đã dừng ở <span className="text-amber-600 underline">Slide {presentation.lastViewedSlide}</span> / {totalSlides}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setCurrentSlide(presentation.lastViewedSlide);
                  setShowPromptResume(false);
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-2xl shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tiếp tục (Slide {presentation.lastViewedSlide})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setCurrentSlide(1);
                  setShowPromptResume(false);
                }}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Trình chiếu từ đầu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Minimal Bar (Fades out when controls hide) */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between transition-opacity duration-300 bg-gradient-to-b from-slate-950/80 to-transparent ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
            {presentation.format.toUpperCase()}
          </span>
          <h2 className="text-sm sm:text-base font-black text-white truncate max-w-md sm:max-w-xl">
            {presentation.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadOriginal && (
            <button
              type="button"
              onClick={() => onDownloadOriginal(presentation)}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              title="Tải file trình chiếu gốc về máy"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải file gốc</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="p-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black border border-rose-500 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            title="Thoát trình chiếu"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Thoát (ESC)</span>
          </button>
        </div>
      </div>

      {/* 3. Main Slide Viewing Area (Aspect 16:9 Fit) */}
      <div
        onClick={handleSlideClick}
        className="flex-1 flex items-center justify-center p-2 sm:p-6 cursor-pointer relative w-full h-full overflow-hidden"
      >
        {activeSlideImage ? (
          <img
            src={activeSlideImage}
            alt={`Slide ${currentSlide}`}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-all duration-200 border border-slate-800"
          />
        ) : (
          <div className="w-[1280px] h-[720px] max-w-full max-h-full bg-slate-900 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-3">
            <FileText className="w-16 h-16 text-slate-500" />
            <div className="text-xl font-black text-slate-200">Slide #{currentSlide}</div>
            <p className="text-xs text-slate-400">Đang chuẩn bị hiển thị nội dung slide...</p>
          </div>
        )}

        {/* Hover Click Indicators */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/40 text-white p-3 rounded-full border border-white/20 pointer-events-none">
          <ChevronLeft className="w-8 h-8" />
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/40 text-white p-3 rounded-full border border-white/20 pointer-events-none">
          <ChevronRight className="w-8 h-8" />
        </div>
      </div>

      {/* 4. Bottom Floating Slide Controls (Auto-hiding) */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-3xl border border-slate-700 shadow-2xl flex items-center gap-3">
          <button
            type="button"
            disabled={currentSlide <= 1}
            onClick={(e) => {
              e.stopPropagation();
              goToPrevSlide();
            }}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white transition-all cursor-pointer"
            title="Slide trước (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-black min-w-24 text-center">
            {currentSlide} / {totalSlides}
          </div>

          <button
            type="button"
            disabled={currentSlide >= totalSlides}
            onClick={(e) => {
              e.stopPropagation();
              goToNextSlide();
            }}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white transition-all cursor-pointer"
            title="Slide tiếp theo (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-700 my-auto mx-1" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold px-3"
            title="Toàn màn hình (F11/Esc)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">Toàn màn hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
