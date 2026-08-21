import React from 'react';
import { useTourStore } from '../../stores/useTourStore';

export function InteractionPrompt() {
  const nearbyRoom = useTourStore((state) => state.nearbyRoom);
  const openRoomModal = useTourStore((state) => state.openRoomModal);
  const cameraMode = useTourStore((state) => state.cameraMode);
  const isModalOpen = useTourStore((state) => Boolean(state.activeRoom));

  if (!nearbyRoom || cameraMode !== 'fps' || isModalOpen) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-20 inset-x-0 px-3 flex justify-center items-center pointer-events-none z-30 animate-bounce">
      <button
        type="button"
        onClick={() => openRoomModal(nearbyRoom)}
        aria-label={`Lihat informasi ${nearbyRoom.name || nearbyRoom.shortName}`}
        className="pointer-events-auto flex items-center gap-3 w-full max-w-sm sm:w-auto px-4 sm:px-5 py-3 rounded-2xl bg-slate-900/90 border border-blue-500/50 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-105 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 ring-4 ring-blue-500/20"
      >
        <kbd className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-mono font-bold shadow-inner shrink-0" aria-hidden="true">
          E
        </kbd>
        <span className="text-left min-w-0">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Lihat Informasi</span>
            <span className="text-blue-400 truncate">• {nearbyRoom.shortName}</span>
          </span>
          <span className="block text-[10px] text-slate-400">Tekan [E] atau klik tombol ini</span>
        </span>
      </button>
    </div>
  );
}
