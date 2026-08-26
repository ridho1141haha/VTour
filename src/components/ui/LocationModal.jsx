import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  X,
} from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';
import { resolveTeleportPosition } from '../../lib/locationUtils';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function LocationModal() {
  const overlay = useTourStore((state) => state.overlay);
  const closeOverlay = useTourStore((state) => state.closeOverlay);
  const teleportTo = useTourStore((state) => state.teleportTo);
  const location = overlay?.type === 'location' ? overlay.location : null;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const dialogRef = useRef(null);
  const lightboxRef = useRef(null);
  const swipeStartRef = useRef(null);

  const images = location?.images ?? [];
  const safeIndex = images.length > 0 ? Math.min(Math.max(0, currentImageIndex), images.length - 1) : 0;
  const currentImage = images[safeIndex] ?? null;
  const isImageFailed = currentImage?.src ? Boolean(failedImages[currentImage.src]) : false;

  useFocusTrap(dialogRef, Boolean(location) && !isLightboxOpen, { onEscape: closeOverlay });
  useFocusTrap(lightboxRef, isLightboxOpen, { onEscape: () => setIsLightboxOpen(false) });

  const showImage = useCallback((index) => {
    if (images.length === 0) return;
    setCurrentImageIndex((index + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!location) return;
    setCurrentImageIndex(0);
    setIsLightboxOpen(false);
  }, [location]);

  useEffect(() => {
    if (!isLightboxOpen || images.length < 2) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') showImage(safeIndex - 1);
      if (event.key === 'ArrowRight') showImage(safeIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, isLightboxOpen, safeIndex, showImage]);

  if (!location) return null;

  const canVisit = Boolean(resolveTeleportPosition(location));
  const locationMeta = [location.building, location.floor ? `LT. ${location.floor}` : null].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}
    >
      {isLightboxOpen && currentImage && !isImageFailed && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto"
          tabIndex={-1}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/95 p-4 focus:outline-none"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setIsLightboxOpen(false); }}
          onTouchStart={(event) => { swipeStartRef.current = event.changedTouches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (swipeStartRef.current == null) return;
            const distance = (event.changedTouches[0]?.clientX ?? swipeStartRef.current) - swipeStartRef.current;
            if (Math.abs(distance) > 50) showImage(safeIndex + (distance < 0 ? 1 : -1));
            swipeStartRef.current = null;
          }}
        >
          <button aria-label="Tutup pratinjau foto" className="absolute right-5 top-5 grid h-11 w-11 place-items-center border border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => setIsLightboxOpen(false)}>
            <X size={20} />
          </button>
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            onError={() => setFailedImages((prev) => ({ ...prev, [currentImage.src]: true }))}
            className="max-h-[82vh] max-w-[92vw] object-contain"
          />
          <div className="mt-4 flex items-center gap-4 text-xs text-zinc-300">
            <span>{currentImage.caption}</span>
            <span className="font-mono text-orange-400">{safeIndex + 1} / {images.length}</span>
          </div>
        </div>
      )}

      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-hidden={isLightboxOpen}
        aria-labelledby="location-title"
        className="relative z-[105] flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden border border-zinc-700 bg-zinc-950 shadow-2xl focus:outline-none"
      >
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 bg-orange-500 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-950">{location.category}</span>
            {locationMeta.length > 0 && (
              <span className="hidden items-center gap-1.5 truncate font-mono text-xs text-zinc-400 sm:flex"><Building2 size={13} />{locationMeta.join(' · ')}</span>
            )}
          </div>
          <button onClick={closeOverlay} aria-label="Tutup informasi lokasi" className="grid h-10 w-10 shrink-0 place-items-center text-zinc-400 hover:bg-zinc-800 hover:text-white"><X size={19} /></button>
        </header>

        <div className="custom-scrollbar overflow-y-auto">
          <div className="grid lg:grid-cols-[1.2fr_.8fr]">
            <div className="border-b border-zinc-800 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              {images.length > 0 ? (
                <div>
                  <div className="group relative aspect-[16/10] overflow-hidden bg-zinc-900">
                    {currentImage && !isImageFailed ? (
                      <img
                        src={currentImage.src}
                        alt={currentImage.alt}
                        onError={() => setFailedImages((prev) => ({ ...prev, [currentImage.src]: true }))}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500"><ImageOff size={30} /><span className="text-xs">Foto tidak dapat dimuat</span></div>
                    )}
                    {currentImage && !isImageFailed && (
                      <button onClick={() => setIsLightboxOpen(true)} aria-label="Perbesar foto" className="absolute right-3 top-3 grid h-11 w-11 place-items-center bg-black/70 text-white hover:bg-black/90"><Maximize2 size={17} /></button>
                    )}
                    {images.length > 1 && (
                      <>
                        <button onClick={() => showImage(safeIndex - 1)} aria-label="Foto sebelumnya" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-black/70 text-white hover:bg-black/90"><ChevronLeft size={20} /></button>
                        <button onClick={() => showImage(safeIndex + 1)} aria-label="Foto berikutnya" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-black/70 text-white hover:bg-black/90"><ChevronRight size={20} /></button>
                      </>
                    )}
                    {currentImage && (
                      <div className="absolute bottom-0 inset-x-0 flex items-end justify-between bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-10 text-xs text-white">
                        <span className="line-clamp-1">{currentImage.caption}</span>
                        <span className="ml-4 shrink-0 font-mono text-orange-300">{safeIndex + 1} / {images.length}</span>
                      </div>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="custom-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                      {images.map((image, index) => {
                        const hasThumbFailed = failedImages[image.thumbnail];
                        return (
                          <button key={image.thumbnail} onClick={() => showImage(index)} aria-label={`Tampilkan foto ${index + 1}`} aria-current={index === safeIndex} className={`h-14 w-20 shrink-0 overflow-hidden border ${index === safeIndex ? 'border-orange-400' : 'border-zinc-800 opacity-60 hover:opacity-100'}`}>
                            {!hasThumbFailed ? (
                              <img
                                src={image.thumbnail}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                onError={() => setFailedImages((prev) => ({ ...prev, [image.thumbnail]: true }))}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center bg-zinc-800 text-zinc-500"><ImageOff size={14} /></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 border border-dashed border-zinc-700 bg-zinc-900/50 text-center text-zinc-500">
                  <ImageOff size={30} /><div><p className="text-sm font-semibold text-zinc-300">Foto belum tersedia</p><p className="mt-1 text-xs">Dokumentasi akan ditambahkan setelah tersedia.</p></div>
                </div>
              )}
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <p className="eyebrow">Informasi lokasi</p>
                <h2 id="location-title" className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">{location.name}</h2>
                <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-zinc-500"><MapPin size={12} />ID: {location.id}</p>
              </div>
              <p className="text-sm leading-7 text-zinc-300">{location.description}</p>

              {location.details?.length > 0 && (
                <dl className="grid gap-2">
                  {location.details.map((detail) => (
                    <div key={detail.label ?? detail} className="flex justify-between border-b border-zinc-800 py-2 text-xs"><dt className="text-zinc-500">{detail.label ?? 'Detail'}</dt><dd className="text-zinc-200">{detail.value ?? detail}</dd></div>
                  ))}
                </dl>
              )}

              {location.facilities?.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400"><Layers size={14} />Fasilitas</h3>
                  <div className="grid gap-2">
                    {location.facilities.map((facility) => <div key={facility} className="flex items-start gap-2 border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-xs text-zinc-200"><Check size={13} className="mt-0.5 shrink-0 text-orange-400" />{facility}</div>)}
                  </div>
                </div>
              )}

              {!canVisit && <p className="border-l-2 border-amber-500 pl-3 text-xs leading-relaxed text-zinc-500">Posisi 3D lokasi ini belum terkalibrasi. Informasi dan foto tetap dapat dilihat.</p>}
            </div>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-zinc-800 bg-zinc-900/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button onClick={() => teleportTo(location)} disabled={!canVisit} className="flex min-h-11 items-center justify-center gap-2 border border-zinc-700 px-4 text-xs font-semibold text-zinc-200 enabled:hover:border-orange-400 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Navigation size={14} />Kunjungi Lokasi</button>
          <button onClick={closeOverlay} className="min-h-11 bg-zinc-100 px-5 text-xs font-bold text-zinc-950 hover:bg-white">Tutup Informasi</button>
        </footer>
      </section>
    </div>
  );
}
