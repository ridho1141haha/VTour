import React from 'react';
import { Scene } from './components/3d/Scene';
import { useTourStore } from './stores/useTourStore';
import { Eye, Footprints, MousePointerClick, Sparkles } from 'lucide-react';

export default function App() {
  const { cameraMode, setCameraMode, isPointerLocked } = useTourStore();

  return (
    <main className="w-screen h-screen relative bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 3D Scene Viewport */}
      <Scene />

      {/* Crosshair di tengah layar saat mode FPS & mouse terkunci */}
      {cameraMode === 'fps' && isPointerLocked && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="w-2 h-2 rounded-full bg-white/80 border border-slate-900 shadow-md"></div>
        </div>
      )}

      {/* Overlay Klik untuk Menjelajah */}
      {cameraMode === 'fps' && !isPointerLocked && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20 bg-slate-950/40 backdrop-blur-[2px] transition-all">
          <div className="bg-slate-900/90 border border-slate-700 px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 text-center max-w-sm pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center animate-bounce">
              <MousePointerClick size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">Klik Layar untuk Menjelajah</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gunakan tombol <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">W</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">S</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">D</kbd> untuk berjalan dan gerakkan mouse untuk melihat sekeliling.
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

        {/* Mode Switcher Buttons */}
        <div className="bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-800 pointer-events-auto flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setCameraMode('fps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              cameraMode === 'fps'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints size={14} />
            <span>Jalan Kaki (WASD)</span>
          </button>
          <button
            onClick={() => setCameraMode('orbit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              cameraMode === 'orbit'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye size={14} />
            <span>Inspeksi (Orbit)</span>
          </button>
        </div>
      </header>

      {/* Bottom Status & Key Hints */}
      <footer className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none z-10">
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 pointer-events-auto flex items-center gap-2 shadow-lg">
          <Sparkles size={14} className="text-amber-400" />
          <span>{cameraMode === 'fps' ? 'Mode Jalan Kaki Aktif' : 'Mode Inspeksi Orbit Aktif'}</span>
        </div>

        {cameraMode === 'fps' && isPointerLocked && (
          <div className="hidden sm:flex bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 pointer-events-auto items-center gap-3 shadow-lg">
            <span><strong className="text-white font-mono">WASD</strong> Bergerak</span>
            <span><strong className="text-white font-mono">Shift</strong> Lari Cepat</span>
            <span><strong className="text-white font-mono">ESC</strong> Buka Kursor</span>
          </div>
        )}
      </footer>
    </main>
  );
}
