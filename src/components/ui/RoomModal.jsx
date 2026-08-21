import React, { useEffect, useRef, useState } from 'react';
import { useTourStore } from '../../stores/useTourStore';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';

const FOCUSABLE_ELEMENTS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function RoomModal() {
  const activeRoom = useTourStore((state) => state.activeRoom);
  const closeRoomModal = useTourStore((state) => state.closeRoomModal);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const imageButtonRef = useRef(null);
  const lightboxRef = useRef(null);
  const lightboxCloseButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const isOpen = Boolean(activeRoom);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsLightboxOpen(false);
    setFailedImageUrl(null);
  }, [activeRoom]);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    const frame = requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      const previousFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      requestAnimationFrame(() => previousFocus?.focus?.());
    };
  }, [isOpen]);

  useEffect(() => {
    if (!activeRoom) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
          requestAnimationFrame(() => imageButtonRef.current?.focus());
        } else {
          closeRoomModal();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const container = isLightboxOpen ? lightboxRef.current : dialogRef.current;
      const focusable = [...(container?.querySelectorAll(FOCUSABLE_ELEMENTS) || [])]
        .filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        container?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && (document.activeElement === first || !container?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !container?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeRoom, closeRoomModal, isLightboxOpen]);

  if (!activeRoom) return null;

  const images = activeRoom.images || [];
  const currentImage = images[currentImageIndex];
  const imageFailed = currentImage?.url === failedImageUrl;

  const handleNext = () => {
    if (images.length > 1) {
      setCurrentImageIndex((previous) => (previous + 1) % images.length);
    }
  };

  const handlePrev = () => {
    if (images.length > 1) {
      setCurrentImageIndex((previous) => (previous - 1 + images.length) % images.length);
    }
  };

  const openLightbox = () => {
    if (imageFailed) return;
    setIsLightboxOpen(true);
    requestAnimationFrame(() => lightboxCloseButtonRef.current?.focus());
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    requestAnimationFrame(() => imageButtonRef.current?.focus());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRoomModal();
      }}
    >
      {isLightboxOpen && currentImage && !imageFailed && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Pratinjau foto ${activeRoom.name}`}
          tabIndex={-1}
          className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <button
            ref={lightboxCloseButtonRef}
            type="button"
            aria-label="Tutup pratinjau foto"
            className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 transition-all cursor-pointer"
            onClick={closeLightbox}
          >
            <X size={24} aria-hidden="true" />
          </button>
          <img
            src={currentImage.url}
            alt={currentImage.caption || activeRoom.name}
            decoding="async"
            referrerPolicy="no-referrer"
            aria-describedby={currentImage.caption ? 'lightbox-caption' : undefined}
            className="max-h-[80dvh] sm:max-h-[85vh] max-w-[94vw] sm:max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onError={() => {
              setFailedImageUrl(currentImage.url);
              setIsLightboxOpen(false);
              requestAnimationFrame(() => closeButtonRef.current?.focus());
            }}
          />
          {currentImage.caption && (
            <p
              id="lightbox-caption"
              className="text-sm text-slate-300 mt-4 text-center font-medium bg-slate-900/80 px-4 py-1.5 rounded-2xl sm:rounded-full border border-slate-800 max-w-2xl"
            >
              {currentImage.caption}
            </p>
          )}
        </div>
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-modal-title"
        aria-describedby="room-modal-description"
        aria-hidden={isLightboxOpen || undefined}
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-[105]"
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {activeRoom.category || 'Ruangan'}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
                {activeRoom.building} • Lantai {activeRoom.floor || 1}
              </span>
            </div>
            <h2 id="room-modal-title" className="text-lg sm:text-xl font-bold text-white tracking-wide">
              {activeRoom.name}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label={`Tutup informasi ${activeRoom.name}`}
            onClick={closeRoomModal}
            className="p-2 shrink-0 rounded-2xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 transition-all cursor-pointer"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 sm:space-y-6 custom-scrollbar">
          {images.length > 0 && currentImage && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group">
              {imageFailed ? (
                <div className="grid h-full place-items-center px-6 text-center text-sm text-slate-400" role="img" aria-label="Foto tidak dapat dimuat">
                  Foto tidak dapat dimuat. Informasi ruangan tetap tersedia di bawah.
                </div>
              ) : (
                <>
                  <button
                    ref={imageButtonRef}
                    type="button"
                    aria-label={`Perbesar foto ${currentImageIndex + 1} dari ${images.length}`}
                    onClick={openLightbox}
                    className="block w-full h-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-500"
                  >
                    <img
                      src={currentImage.url}
                      alt={currentImage.caption || activeRoom.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() => setFailedImageUrl(currentImage.url)}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={openLightbox}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 text-white backdrop-blur-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="Perbesar foto"
                    title="Perbesar foto"
                  >
                    <Maximize2 size={16} aria-hidden="true" />
                  </button>
                </>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Tampilkan foto sebelumnya"
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/85 text-white hover:bg-blue-600 backdrop-blur-md transition-all shadow-lg border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Tampilkan foto berikutnya"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/85 text-white hover:bg-blue-600 backdrop-blur-md transition-all shadow-lg border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/85 text-[11px] font-mono text-slate-300 backdrop-blur-md border border-slate-700" aria-live="polite" aria-atomic="true">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}

              {currentImage.caption && (
                <div className="absolute bottom-0 inset-x-0 pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3.5 pt-7 text-xs text-slate-200">
                  {currentImage.caption}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Deskripsi Ruangan
            </h3>
            <p id="room-modal-description" className="text-sm text-slate-300 leading-relaxed select-text">
              {activeRoom.description}
            </p>
            {activeRoom.contentNote && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
                {activeRoom.contentNote}
              </p>
            )}
          </div>

          {activeRoom.facilities?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fasilitas Utama
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeRoom.facilities.map((facility) => (
                  <div
                    key={facility}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200"
                  >
                    <CheckCircle2 size={16} className="text-blue-400 shrink-0" aria-hidden="true" />
                    <span>{facility}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex flex-col-reverse sm:flex-row justify-between sm:items-center gap-2.5 text-xs text-slate-400">
          <span className="text-center sm:text-left">Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> untuk menutup</span>
          <button
            type="button"
            onClick={closeRoomModal}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 transition-all cursor-pointer"
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
}
