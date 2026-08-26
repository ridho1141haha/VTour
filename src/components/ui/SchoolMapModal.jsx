import React, { useMemo, useRef, useState } from 'react';
import { Info, MapPin, Navigation, X } from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';
import { resolveTeleportPosition } from '../../lib/locationUtils';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function SchoolMapModal() {
  const overlay = useTourStore((state) => state.overlay);
  const closeOverlay = useTourStore((state) => state.closeOverlay);
  const locations = useTourStore((state) => state.locations);
  const openLocation = useTourStore((state) => state.openLocation);
  const teleportTo = useTourStore((state) => state.teleportTo);
  const [selectedId, setSelectedId] = useState(null);
  const dialogRef = useRef(null);
  const isOpen = overlay?.type === 'map';

  useFocusTrap(dialogRef, isOpen, { onEscape: closeOverlay });

  const mappedLocations = useMemo(() => locations.filter((location) => location.mapPosition), [locations]);
  const selected = locations.find((location) => location.id === selectedId) ?? null;

  if (!isOpen) return null;
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-title"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6 focus:outline-none"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}
    >
      <section className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div><p className="eyebrow">Navigasi kampus</p><h2 id="map-title" className="text-lg font-extrabold text-white">Denah Lokasi</h2></div>
          <button onClick={closeOverlay} aria-label="Tutup denah" className="grid h-11 w-11 place-items-center text-zinc-400 hover:bg-zinc-800 hover:text-white"><X size={19} /></button>
        </header>

        <div className="custom-scrollbar grid flex-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[1fr_300px]">
          <div className="bg-blueprint relative min-h-[430px] overflow-hidden border border-zinc-800 bg-zinc-900/35">
            <div className="absolute inset-5 border border-zinc-700/70" />
            <div className="absolute left-1/2 top-1/2 h-[28%] w-[25%] -translate-x-1/2 -translate-y-1/2 border border-dashed border-zinc-600 bg-zinc-950/50" />
            <div className="absolute right-4 top-4 border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-400"><span className="text-orange-400">U ↑</span></div>
            {mappedLocations.map((location, index) => {
              const selectedMarker = selectedId === location.id;
              return (
                <button
                  key={location.id}
                  onClick={() => setSelectedId(location.id)}
                  aria-label={location.name}
                  aria-pressed={selectedMarker}
                  style={{ left: `${location.mapPosition.x}%`, top: `${location.mapPosition.y}%` }}
                  className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 ${selectedMarker ? 'z-20' : ''}`}
                >
                  <span className={`grid h-8 w-8 place-items-center border font-mono text-[10px] font-bold transition-transform ${selectedMarker ? 'scale-110 border-orange-200 bg-orange-500 text-zinc-950' : 'border-zinc-500 bg-zinc-950 text-zinc-200 group-hover:border-orange-400'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={`absolute left-1/2 top-9 -translate-x-1/2 whitespace-nowrap bg-zinc-950/95 px-2 py-1 text-[10px] text-white ${selectedMarker ? 'block' : 'hidden group-hover:block group-focus-visible:block'}`}>{location.shortName}</span>
                </button>
              );
            })}
            <div className="absolute bottom-4 left-4 font-mono text-[10px] text-zinc-500">{mappedLocations.length} DARI {locations.length} TITIK TERKALIBRASI</div>
          </div>

          <aside className="flex min-h-52 flex-col justify-between border border-zinc-800 bg-zinc-900/45 p-5">
            {selected ? (
              <div className="animate-fadeIn">
                <p className="eyebrow">{selected.category}</p><h3 className="text-xl font-extrabold text-white">{selected.name}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{selected.description}</p>
                <div className="mt-6 grid gap-2">
                  <button onClick={() => openLocation(selected)} className="flex min-h-11 items-center justify-center gap-2 bg-zinc-100 text-xs font-bold text-zinc-950"><Info size={14} />Lihat Informasi</button>
                  <button onClick={() => teleportTo(selected)} disabled={!resolveTeleportPosition(selected)} className="flex min-h-11 items-center justify-center gap-2 border border-zinc-700 text-xs font-semibold text-zinc-200 enabled:hover:border-orange-500"><Navigation size={14} />Kunjungi Lokasi</button>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center text-zinc-500"><MapPin size={25} className="mx-auto mb-3 text-zinc-700" /><p className="text-sm font-semibold text-zinc-300">Pilih titik pada denah</p><p className="mt-1 text-xs">Nama muncul saat hover atau fokus.</p></div>
            )}
            <p className="mt-6 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-zinc-500">Denah hanya menampilkan lokasi dengan koordinat yang telah divalidasi terhadap model 3D.</p>
          </aside>
        </div>
      </section>
    </div>
  );
}
