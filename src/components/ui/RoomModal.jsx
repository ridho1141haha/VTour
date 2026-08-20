import React, { useState, useEffect } from 'react';
import { useTourStore } from '../../stores/useTourStore';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  Maximize2 
} from 'lucide-react';

export function RoomModal() {
  const { activeRoom, closeRoomModal } = useTourStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsLightboxOpen(false);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          closeRoomModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRoom, isLightboxOpen, closeRoomModal]);

  if (!activeRoom) return null;

  const images = activeRoom.images || [];
  const currentImage = images[currentImageIndex];

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Lightbox Fullscreen Preview jika user klik foto */}
      {isLightboxOpen && currentImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X size={24} />
          </button>
          <img 
            src={currentImage.url} 
            alt={currentImage.caption || activeRoom.name} 
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
          {currentImage.caption && (
            <p className="text-sm text-slate-300 mt-3 text-center">{currentImage.caption}</p>
          )}
        </div>
      )}

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {activeRoom.category || 'Ruangan'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" />
                {activeRoom.building} • Lantai {activeRoom.floor || 1}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              {activeRoom.name}
            </h2>
          </div>

          <button
            onClick={closeRoomModal}
            className="p-2 rounded-2xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          {/* Photo Gallery Carousel */}
          {images.length > 0 && (
            <div className="relative w-full aspect-video sm:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group">
              <img
                src={currentImage.url}
                alt={currentImage.caption || activeRoom.name}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 cursor-pointer"
                onClick={() => setIsLightboxOpen(true)}
              />

              {/* Lightbox / Zoom Hint Overlay */}
              <button 
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-900/70 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 size={16} />
              </button>

              {/* Image Controls (Prev / Next) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 text-white hover:bg-blue-600 backdrop-blur-sm transition-all shadow-md"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 text-white hover:bg-blue-600 backdrop-blur-sm transition-all shadow-md"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Indicator Counter Badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 text-[11px] font-mono text-slate-300 backdrop-blur-sm border border-slate-700">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}

              {/* Caption Bar */}
              {currentImage.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-3 pt-6 text-xs text-slate-200">
                  {currentImage.caption}
                </div>
              )}
            </div>
          )}

          {/* Deskripsi Ruangan */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Deskripsi Ruangan
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeRoom.description}
            </p>
          </div>

          {/* Fasilitas Ruangan */}
          {activeRoom.facilities && activeRoom.facilities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fasilitas Utama
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeRoom.facilities.map((fac, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200"
                  >
                    <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> untuk menutup</span>
          <button
            onClick={closeRoomModal}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all"
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
}
