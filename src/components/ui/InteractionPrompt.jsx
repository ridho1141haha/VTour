import React from 'react';
import { useTourStore } from '../../stores/useTourStore';
import { Info } from 'lucide-react';

export function InteractionPrompt() {
  const { nearbyRoom, openRoomModal, appState } = useTourStore();

  if (!nearbyRoom || appState === 'modal_open') return null;

  return (
    <div className="fixed bottom-20 inset-x-0 flex justify-center items-center pointer-events-none z-30 animate-bounce">
      <button
        onClick={() => openRoomModal(nearbyRoom)}
        className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 border border-blue-500/50 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-105 hover:bg-slate-800 ring-4 ring-blue-500/20"
      >
        <kbd className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-mono font-bold shadow-inner">
          E
        </kbd>
        <div className="text-left">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Lihat Informasi</span>
            <span className="text-blue-400">• {nearbyRoom.shortName}</span>
          </div>
          <p className="text-[10px] text-slate-400">Tekan [E] atau klik tombol ini</p>
        </div>
      </button>
    </div>
  );
}
