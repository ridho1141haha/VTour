import React, { useState, useEffect } from 'react';
import { useTourStore } from '../../stores/useTourStore';
import { MapPin } from 'lucide-react';

export function ToastLocation() {
  const currentZone = useTourStore((state) => state.currentZone);
  const [visible, setVisible] = useState(false);
  const [zoneText, setZoneText] = useState('');

  useEffect(() => {
    if (!currentZone) {
      setVisible(false);
      setZoneText('');
      return undefined;
    }

    setZoneText(currentZone);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, [currentZone]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-16 sm:top-20 inset-x-0 px-3 flex justify-center pointer-events-none z-30 transition-all duration-500"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="bg-slate-900/90 border border-slate-700/80 px-4 sm:px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-white animate-fadeIn max-w-full">
        <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
          <MapPin size={16} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
            Area Terdekat
          </span>
          <span className="text-xs font-bold text-white tracking-wide block truncate">
            {zoneText}
          </span>
        </div>
      </div>
    </div>
  );
}
