import React, { useEffect } from 'react';
import { Scene } from './components/3d/Scene';
import { RoomModal } from './components/ui/RoomModal';
import { InteractionPrompt } from './components/ui/InteractionPrompt';
import { ToastLocation } from './components/ui/ToastLocation';
import { SearchSidebar } from './components/ui/SearchSidebar';
import { SchoolMapModal } from './components/ui/SchoolMapModal';
import { useTourStore } from './stores/useTourStore';
import { 
  Eye, 
  Footprints, 
  MousePointerClick, 
  Sparkles, 
  Search, 
  Map, 
  Compass,
  Layers
} from 'lucide-react';

export default function App() {
  const { 
    cameraMode, 
    setCameraMode, 
    isPointerLocked, 
    appState, 
    openSearch, 
    openMap,
    isSearchOpen,
    isMapOpen,
    rooms,
    teleportTo,
    openRoomModal
  } = useTourStore();

  // Deep Link URL Support (?room=lab-pplg-1)
  useEffect(() => {
    if (rooms.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const targetRoomId = params.get('room');

    if (targetRoomId) {
      const found = rooms.find((r) => r.id === targetRoomId);
      if (found) {
        teleportTo(found.teleportPosition || found.position, found);
        // Buka modal info setelah delay singkat agar kamera siap
        setTimeout(() => {
          openRoomModal(found);
        }, 500);
      }
    }
  }, [rooms, teleportTo, openRoomModal]);

  // Global Keyboard Shortcuts (M untuk Search, F untuk Denah)
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;

      if (e.key === 'm' || e.key === 'M') {
        if (!isSearchOpen && appState !== 'modal_open') {
          openSearch();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!isMapOpen && appState !== 'modal_open') {
          openMap();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [isSearchOpen, isMapOpen, appState, openSearch, openMap]);

  return (
    <main className="w-screen h-screen relative bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 3D Scene Viewport */}
      <Scene />

      {/* Crosshair di tengah layar saat mode FPS & mouse terkunci */}
      {cameraMode === 'fps' && isPointerLocked && appState !== 'modal_open' && !isSearchOpen && !isMapOpen && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="w-2 h-2 rounded-full bg-white/80 border border-slate-900 shadow-md"></div>
        </div>
      )}

      {/* Prompt Interaksi Tombol [E] saat dekat marker */}
      <InteractionPrompt />

      {/* Notifikasi Banner Lokasi Gedung */}
      <ToastLocation />

      {/* Modal Popup Informasi Ruangan & Galeri Foto */}
      <RoomModal />

      {/* Sidebar Pencarian & Direktori Ruangan */}
      <SearchSidebar />

      {/* Modal Denah 2D Skematis Sekolah */}
      <SchoolMapModal />

      {/* Overlay 'Klik Layar untuk Menjelajah' saat mode FPS belum diklik / terkunci */}
      {cameraMode === 'fps' && !isPointerLocked && appState !== 'modal_open' && !isSearchOpen && !isMapOpen && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20 bg-slate-950/40 backdrop-blur-[2px] transition-all">
          <div className="bg-slate-900/90 border border-slate-700 px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 text-center max-w-sm pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center animate-bounce">
              <MousePointerClick size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">Klik Layar untuk Menjelajah</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gunakan tombol <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">W</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">S</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">D</kbd> untuk berjalan dan dekati marker <kbd className="px-1.5 py-0.5 bg-blue-600 rounded text-white font-mono">E</kbd> untuk info.
            </p>
            <div className="text-[11px] text-slate-500 mt-1">
              Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">ESC</kbd> kapan saja untuk melepas kursor
            </div>
          </div>
        </div>
      )}

      {/* Top Header HUD */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 pointer-events-auto flex items-center gap-3 shadow-lg">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-wide text-white">SMKN 2 SURAKARTA</h1>
            <p className="text-[10px] sm:text-xs text-slate-400">Virtual Tour 3D</p>
          </div>
        </div>

        {/* Navigation & Mode Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Actions (Cari & Denah) */}
          <div className="bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-lg">
            <button
              onClick={openSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Pencarian & Direktori Ruangan (M)"
            >
              <Search size={14} className="text-blue-400" />
              <span className="hidden sm:inline">Cari Ruangan</span>
            </button>
            <button
              onClick={openMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Denah Skematis Kampus (F)"
            >
              <Map size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">Denah</span>
            </button>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-lg">
            <button
              onClick={() => setCameraMode('fps')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                cameraMode === 'fps'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Footprints size={14} />
              <span className="hidden md:inline">Jalan Kaki</span>
            </button>
            <button
              onClick={() => setCameraMode('orbit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                cameraMode === 'orbit'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye size={14} />
              <span className="hidden md:inline">Inspeksi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Status & Key Hints */}
      <footer className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none z-10">
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 pointer-events-auto flex items-center gap-2 shadow-lg">
          <Sparkles size={14} className="text-amber-400" />
          <span>{cameraMode === 'fps' ? 'Dekati titik informasi lalu tekan [E]' : 'Mode Inspeksi Orbit'}</span>
        </div>

        {cameraMode === 'fps' && isPointerLocked && (
          <div className="hidden sm:flex bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 pointer-events-auto items-center gap-3 shadow-lg">
            <span><strong className="text-white font-mono">WASD</strong> Jalan</span>
            <span><strong className="text-white font-mono">Shift</strong> Lari</span>
            <span><strong className="text-white font-mono">E</strong> Info</span>
            <span><strong className="text-white font-mono">M</strong> Direktori</span>
            <span><strong className="text-white font-mono">F</strong> Denah</span>
            <span><strong className="text-white font-mono">ESC</strong> Kursor</span>
          </div>
        )}
      </footer>
    </main>
  );
}
