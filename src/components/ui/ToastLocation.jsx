import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';

export function ToastLocation() {
  const currentLocation = useTourStore((state) => state.currentLocation);
  const [visibleLocation, setVisibleLocation] = useState(null);

  useEffect(() => {
    if (!currentLocation) {
      setVisibleLocation(null);
      return undefined;
    }
    setVisibleLocation(currentLocation);
    const timer = setTimeout(() => setVisibleLocation(null), 3200);
    return () => clearTimeout(timer);
  }, [currentLocation]);

  if (!visibleLocation) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-30 flex justify-center px-4" role="status" aria-live="polite" aria-atomic="true">
      <div className="flex items-center gap-3 border border-zinc-700 bg-zinc-950/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
        <MapPin size={16} className="text-orange-400" /><div><p className="font-mono text-[10px] uppercase tracking-wider text-orange-400">{visibleLocation.category}</p><p className="text-sm font-bold">{visibleLocation.name}</p></div>
      </div>
    </div>
  );
}
