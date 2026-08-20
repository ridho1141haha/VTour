import React, { useState, useEffect } from 'react';
import { useTourStore } from '../../stores/useTourStore';
import { MapPin } from 'lucide-react';

export function ToastLocation() {
  const { currentZone } = useTourStore();
  const [visible, setVisible] = useState(false);
  const [zoneText, setZoneText] = useState('');

  useEffect(() => {
    if (!currentZone) return;

    setZoneText(currentZone);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, [currentZone]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 inset-x-0 flex justify-center pointer-events-none z-30 transition-all duration-500">
      <div className="bg-slate-900/90 border border-slate-700/80 px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-white animate-fadeIn">
        <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
          <MapPin size={16} />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
            Area Terdekat
          </span>
          <span className="text-xs font-bold text-white tracking-wide">
            {zoneText}
          </span>
        </div>
      </div>
    </div>
  );
}
