import React, { useState } from 'react';
import { useTourStore } from '../../stores/useTourStore';
import { X, Navigation, MapPin, Compass, Info } from 'lucide-react';

export function SchoolMapModal() {
  const { isMapOpen, closeMap, teleportTo } = useTourStore();
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  if (!isMapOpen) return null;

  const hotspots = [
    {
      id: 'gerbang-utama',
      name: 'Gerbang Utama & Pos Keamanan',
      building: 'Area Depan',
      pos: [0, 2, 8],
      x: 50,
      y: 85,
      color: 'bg-emerald-500',
      description: 'Pintu gerbang akses masuk utama kampus SMKN 2 Surakarta.',
    },
    {
      id: 'ruang-guru-tu',
      name: 'Gedung Utama (A) • Tata Usaha',
      building: 'Gedung Utama (A)',
      pos: [-7, 2, -25],
      x: 35,
      y: 55,
      color: 'bg-blue-500',
      description: 'Pusat administrasi, kantor kepala sekolah, dan ruang guru.',
    },
    {
      id: 'perpustakaan',
      name: 'Gedung B • Perpustakaan Digital',
      building: 'Gedung B',
      pos: [-16, 2, -7],
      x: 25,
      y: 35,
      color: 'bg-amber-500',
      description: 'Perpustakaan Ki Hajar Dewantara dan ruang baca multimedia.',
    },
    {
      id: 'lab-pplg-1',
      name: 'Gedung C • Laboratorium PPLG',
      building: 'Gedung C',
      pos: [14, 2, -15],
      x: 70,
      y: 40,
      color: 'bg-indigo-500',
      description: 'Laboratorium praktik rekayasa software dan game development.',
    },
    {
      id: 'aula-masjid',
      name: 'Gedung Pertemuan & Masjid',
      building: 'Gedung Pertemuan',
      pos: [22, 2, -32],
      x: 80,
      y: 20,
      color: 'bg-purple-500',
      description: 'Aula serbaguna kapasitas besar dan masjid sekolah.',
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMap();
      }}
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-[105]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Denah Skematis Kampus</h2>
              <p className="text-xs text-slate-400">Klik titik hotspot gedung untuk navigasi instan</p>
            </div>
          </div>

          <button
            onClick={closeMap}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Floorplan Layout Canvas Area */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-6 items-center">
          {/* Interactive Map Visual */}
          <div className="relative w-full max-w-lg aspect-square bg-slate-950 rounded-2xl border-2 border-slate-800 p-6 flex flex-col justify-between overflow-hidden shadow-inner select-none">
            {/* Compass Indicator */}
            <div className="absolute top-4 right-4 flex flex-col items-center gap-1 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono">
              <span className="text-red-400 font-bold">U</span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
              <span>S</span>
            </div>

            {/* Schematic Buildings (Zone Blocks) */}
            <div className="relative w-full h-full">
              {/* Lapangan Utama di Tengah */}
              <div className="absolute left-[38%] top-[35%] w-[26%] h-[32%] bg-emerald-950/40 border border-dashed border-emerald-600/40 rounded-xl flex items-center justify-center text-center p-1">
                <span className="text-[10px] font-semibold text-emerald-400/80">Lapangan Utama</span>
              </div>

              {/* Hotspot Markers */}
              {hotspots.map((spot) => {
                const isSelected = selectedHotspot?.id === spot.id;
                return (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedHotspot(spot)}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center gap-2 p-1.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-white ring-4 ring-blue-500/40 scale-110 z-20 shadow-xl'
                        : 'bg-slate-900/90 border-slate-700 hover:border-slate-400 z-10'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${spot.color} animate-pulse`}></div>
                    <span className="text-[11px] font-bold text-white whitespace-nowrap px-1">
                      {spot.building}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Legend */}
            <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-850 pt-2">
              <span>* Peta representasi skematis</span>
              <span className="text-blue-400">Pilih titik untuk info</span>
            </div>
          </div>

          {/* Selected Hotspot Detail Panel */}
          <div className="w-full lg:w-72 flex flex-col justify-between bg-slate-950/70 border border-slate-800 rounded-2xl p-5 gap-4">
            {selectedHotspot ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-blue-500/20 text-blue-400">
                    <MapPin size={15} />
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {selectedHotspot.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedHotspot.description}
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      teleportTo(selectedHotspot.pos, {
                        building: selectedHotspot.building,
                        shortName: selectedHotspot.name,
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Navigation size={14} />
                    <span>Teleport ke Gedung Ini</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Info size={28} className="text-slate-600" />
                <p className="text-xs font-medium text-slate-300">Pilih salah satu gedung pada denah</p>
                <p className="text-[11px] text-slate-500">Klik titik di denah untuk melihat info & tombol teleport</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> untuk menutup</span>
          <button
            onClick={closeMap}
            className="px-5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            Tutup Denah
          </button>
        </div>
      </div>
    </div>
  );
}
