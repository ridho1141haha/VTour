import React, { useState, useMemo, useEffect } from 'react';
import { useTourStore } from '../../stores/useTourStore';
import { 
  Search, 
  X, 
  MapPin, 
  Navigation, 
  Building2, 
  Info, 
  Compass
} from 'lucide-react';

export function SearchSidebar() {
  const { 
    isSearchOpen, 
    closeSearch, 
    rooms, 
    openRoomModal, 
    teleportTo 
  } = useTourStore();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  // Ekstrak daftar kategori unik
  const categories = useMemo(() => {
    const cats = new Set(rooms.map((r) => r.category || 'Lainnya'));
    return ['Semua', ...Array.from(cats)];
  }, [rooms]);

  // Filter ruangan berdasarkan query dan kategori
  const filteredRooms = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchQuery = 
        !trimmed ||
        room.name.toLowerCase().includes(trimmed) ||
        room.shortName.toLowerCase().includes(trimmed) ||
        room.building.toLowerCase().includes(trimmed) ||
        (room.description && room.description.toLowerCase().includes(trimmed));

      const matchCategory = 
        selectedCategory === 'Semua' || room.category === selectedCategory;

      return matchQuery && matchCategory;
    });
  }, [rooms, query, selectedCategory]);

  if (!isSearchOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex justify-end bg-slate-950/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
    >
      {/* Sidebar Drawer Container */}
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-[105]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Compass size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Direktori & Pencarian</h2>
              <p className="text-[11px] text-slate-400">Temukan ruangan & fasilitas SMKN 2</p>
            </div>
          </div>
          <button
            onClick={closeSearch}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari lab, ruang kelas, kantor, aula..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Room List Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredRooms.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <MapPin size={32} className="text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">Ruangan tidak ditemukan</p>
              <p className="text-[11px] text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const thumbnail = room.images?.[0]?.url;
              return (
                <div
                  key={room.id}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3.5 transition-all group flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={room.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <Building2 size={20} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {room.category || 'Ruangan'}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                        {room.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 size={12} />
                        {room.building} • Lt. {room.floor || 1}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Teleport & Info) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => teleportTo(room.teleportPosition || room.position, room)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      <Navigation size={13} />
                      <span>Teleport ke Lokasi</span>
                    </button>
                    <button
                      onClick={() => openRoomModal(room)}
                      className="flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Lihat Detail Ruangan"
                    >
                      <Info size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Menampilkan {filteredRooms.length} dari {rooms.length} lokasi
        </div>
      </div>
    </div>
  );
}
