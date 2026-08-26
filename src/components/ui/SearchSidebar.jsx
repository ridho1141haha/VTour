import React, { useMemo, useRef, useState } from 'react';
import { Building2, Folder, ImageOff, Info, Navigation, Search, X } from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';
import { filterLocations, resolveTeleportPosition } from '../../lib/locationUtils';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function SearchSidebar() {
  const overlay = useTourStore((state) => state.overlay);
  const closeOverlay = useTourStore((state) => state.closeOverlay);
  const locations = useTourStore((state) => state.locations);
  const openLocation = useTourStore((state) => state.openLocation);
  const teleportTo = useTourStore((state) => state.teleportTo);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [failedThumbnails, setFailedThumbnails] = useState({});
  const dialogRef = useRef(null);
  const isOpen = overlay?.type === 'search';

  useFocusTrap(dialogRef, isOpen, { onEscape: closeOverlay });

  const categories = useMemo(() => ['Semua', ...new Set(locations.map((location) => location.category).filter(Boolean))], [locations]);
  const filteredLocations = useMemo(() => filterLocations(locations, query, selectedCategory), [locations, query, selectedCategory]);
  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="directory-title"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex justify-end bg-black/65 backdrop-blur-sm focus:outline-none"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}
    >
      <section className="flex h-full w-full max-w-md flex-col border-l border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-5">
          <div><p className="eyebrow">23 titik utama</p><h2 id="directory-title" className="text-lg font-extrabold text-white">Daftar Lokasi</h2></div>
          <button onClick={closeOverlay} aria-label="Tutup daftar lokasi" className="grid h-11 w-11 place-items-center text-zinc-400 hover:bg-zinc-800 hover:text-white"><X size={19} /></button>
        </header>

        <div className="space-y-3 border-b border-zinc-800 p-4">
          <label className="relative block">
            <span className="sr-only">Cari lokasi</span><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, kategori, deskripsi..." autoFocus className="h-11 w-full border border-zinc-700 bg-zinc-900 pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none" />
            {query && <button onClick={() => setQuery('')} aria-label="Hapus pencarian" className="absolute right-1 top-1 grid h-9 w-9 place-items-center text-zinc-500 hover:text-white"><X size={15} /></button>}
          </label>
          <div className="custom-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button key={category} onClick={() => setSelectedCategory(category)} aria-pressed={selectedCategory === category} className={`shrink-0 border px-3 py-1.5 font-mono text-[11px] ${selectedCategory === category ? 'border-orange-500 bg-orange-500 text-zinc-950' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'}`}>{category}</button>
            ))}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
          {filteredLocations.length === 0 ? (
            <div className="flex h-52 flex-col items-center justify-center text-center"><Folder size={30} className="mb-3 text-zinc-700" /><p className="text-sm font-semibold text-zinc-300">Lokasi tidak ditemukan</p><p className="mt-1 text-xs text-zinc-500">Coba kata kunci atau kategori lain.</p></div>
          ) : filteredLocations.map((location, index) => {
            const thumbnail = location.images[0]?.thumbnail;
            const hasFailed = thumbnail ? failedThumbnails[thumbnail] : false;
            const canVisit = Boolean(resolveTeleportPosition(location));
            return (
              <article key={location.id} className="border border-zinc-800 bg-zinc-900/55 p-3.5 hover:border-zinc-600">
                <div className="flex gap-3">
                  {thumbnail && !hasFailed ? (
                    <img
                      src={thumbnail}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={() => setFailedThumbnails((prev) => ({ ...prev, [thumbnail]: true }))}
                      className="h-16 w-20 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-20 shrink-0 place-items-center bg-zinc-800 text-zinc-500">
                      {hasFailed ? <ImageOff size={16} /> : <Building2 size={19} />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500"><span>#{String(index + 1).padStart(2, '0')}</span><span className="text-orange-400">{location.category}</span></div>
                    <h3 className="mt-1 truncate text-sm font-bold text-white">{location.name}</h3>
                    <p className="mt-1 text-[11px] text-zinc-500">{canVisit ? 'Tersedia di tur 3D' : 'Koordinat menunggu kalibrasi'}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
                  <button onClick={() => openLocation(location)} className="flex min-h-10 items-center justify-center gap-1.5 bg-zinc-100 px-2 text-xs font-bold text-zinc-950 hover:bg-white"><Info size={13} />Lihat Informasi</button>
                  <button onClick={() => teleportTo(location)} disabled={!canVisit} className="flex min-h-10 items-center justify-center gap-1.5 border border-zinc-700 px-2 text-xs font-semibold text-zinc-200 enabled:hover:border-orange-500 disabled:cursor-not-allowed disabled:opacity-35"><Navigation size={13} />Kunjungi Lokasi</button>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="flex justify-between border-t border-zinc-800 px-5 py-3 font-mono text-[10px] text-zinc-500"><span aria-live="polite">{filteredLocations.length} LOKASI</span><span>SMKN 2 SURAKARTA</span></footer>
      </section>
    </div>
  );
}
