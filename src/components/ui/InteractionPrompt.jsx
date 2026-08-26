import React from 'react';
import { Info } from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';

export function InteractionPrompt() {
  const nearbyLocation = useTourStore((state) => state.nearbyLocation);
  const openLocation = useTourStore((state) => state.openLocation);
  const overlay = useTourStore((state) => state.overlay);
  if (!nearbyLocation || overlay) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 hidden justify-center sm:flex">
      <button onClick={() => openLocation(nearbyLocation)} className="pointer-events-auto flex min-h-12 items-center gap-3 border border-orange-400/60 bg-zinc-950/95 px-4 text-white shadow-2xl backdrop-blur-md">
        <Info size={16} className="text-orange-400" /><span className="text-xs"><strong>{nearbyLocation.shortName}</strong><span className="ml-2 text-zinc-400">Tekan</span> <kbd>E</kbd></span>
      </button>
    </div>
  );
}
