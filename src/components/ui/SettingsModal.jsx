import React, { useEffect, useRef, useState } from 'react';
import { Check, Maximize, Minimize, Monitor, RadioTower, Settings, Sliders, Volume2, VolumeX, X } from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { setDisplayName, setPresenceEnabled } from '../../lib/presence';

const QUALITY_PRESETS = [
  { id: 'low', label: 'Rendah', description: 'DPR 1.0 untuk perangkat dengan GPU terbatas.' },
  { id: 'medium', label: 'Sedang', description: 'DPR hingga 1.25, seimbang untuk sebagian besar perangkat.' },
  { id: 'high', label: 'Tinggi', description: 'DPR hingga 1.5 untuk tampilan yang lebih tajam.' },
];

export function SettingsModal() {
  const overlay = useTourStore((state) => state.overlay);
  const closeOverlay = useTourStore((state) => state.closeOverlay);
  const graphicsQuality = useTourStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useTourStore((state) => state.setGraphicsQuality);
  const isAudioMuted = useTourStore((state) => state.isAudioMuted);
  const setIsAudioMuted = useTourStore((state) => state.setIsAudioMuted);
  const audioVolume = useTourStore((state) => state.audioVolume);
  const setAudioVolume = useTourStore((state) => state.setAudioVolume);
  const mouseSensitivity = useTourStore((state) => state.mouseSensitivity);
  const setMouseSensitivity = useTourStore((state) => state.setMouseSensitivity);
  const displayName = useTourStore((state) => state.displayName);
  const presenceEnabled = useTourStore((state) => state.presenceEnabled);
  const presenceStatus = useTourStore((state) => state.presenceStatus);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [fullscreenError, setFullscreenError] = useState('');
  const dialogRef = useRef(null);
  const isOpen = overlay?.type === 'settings';

  useFocusTrap(dialogRef, isOpen, { onEscape: closeOverlay });

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    setFullscreenError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError('Mode layar penuh tidak diizinkan oleh browser.');
    }
  };

  if (!isOpen) return null;
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6 focus:outline-none"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}
    >
      <section className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center bg-orange-500 text-zinc-950"><Settings size={18} /></span><div><p className="eyebrow">Preferensi</p><h2 id="settings-title" className="font-extrabold text-white">Pengaturan Virtual Tour</h2></div></div>
          <button onClick={closeOverlay} aria-label="Tutup pengaturan" className="grid h-11 w-11 place-items-center text-zinc-400 hover:bg-zinc-800 hover:text-white"><X size={19} /></button>
        </header>

        <div className="custom-scrollbar space-y-6 overflow-y-auto p-5 sm:p-6">
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400"><Monitor size={15} className="text-orange-400" />Kualitas Grafis</h3>
            <div className="grid gap-2">
              {QUALITY_PRESETS.map((preset) => {
                const selected = graphicsQuality === preset.id;
                return <button key={preset.id} onClick={() => setGraphicsQuality(preset.id)} aria-pressed={selected} className={`flex min-h-16 items-center justify-between border p-3 text-left ${selected ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'}`}><div><span className="text-sm font-bold text-white">{preset.label}</span>{preset.id === 'medium' && <span className="ml-2 font-mono text-[9px] uppercase text-orange-400">Default</span>}<p className="mt-1 text-xs text-zinc-500">{preset.description}</p></div><span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? 'border-orange-400 bg-orange-500 text-zinc-950' : 'border-zinc-700'}`}>{selected && <Check size={12} />}</span></button>;
              })}
            </div>
          </section>

          <section className="border-t border-zinc-800 pt-5">
            <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">{isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-orange-400" />}Audio Ambience</h3><button onClick={() => setIsAudioMuted(!isAudioMuted)} aria-pressed={!isAudioMuted} className={`min-h-9 border px-3 text-xs font-semibold ${isAudioMuted ? 'border-zinc-700 text-zinc-400' : 'border-orange-500 bg-orange-500 text-zinc-950'}`}>{isAudioMuted ? 'Nonaktif' : 'Aktif'}</button></div>
            <label className={`mt-3 flex items-center gap-3 border border-zinc-800 bg-zinc-900/60 p-3 ${isAudioMuted ? 'opacity-40' : ''}`}><span className="text-xs text-zinc-400">Volume</span><input aria-label="Volume ambience" type="range" min="0.05" max="1" step="0.05" value={audioVolume} disabled={isAudioMuted} onChange={(event) => setAudioVolume(Number(event.target.value))} className="flex-1 accent-orange-500" /><span className="w-10 text-right font-mono text-xs text-zinc-300">{Math.round(audioVolume * 100)}%</span></label>
          </section>

          <section className="border-t border-zinc-800 pt-5">
            <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400"><Sliders size={15} className="text-orange-400" />Sensitivitas Kamera</h3><span className="font-mono text-xs text-orange-400">{mouseSensitivity.toFixed(1)}x</span></div>
            <label className="mt-3 flex items-center gap-3 border border-zinc-800 bg-zinc-900/60 p-3"><span className="text-[10px] text-zinc-500">Lambat</span><input aria-label="Sensitivitas kamera" type="range" min="0.4" max="2" step="0.1" value={mouseSensitivity} onChange={(event) => setMouseSensitivity(Number(event.target.value))} className="flex-1 accent-orange-500" /><span className="text-[10px] text-zinc-500">Cepat</span></label>
          </section>

          <section className="border-t border-zinc-800 pt-5">
            <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400"><RadioTower size={15} className="text-orange-400" />Multiplayer</h3><button onClick={() => setPresenceEnabled(!presenceEnabled)} aria-pressed={presenceEnabled} className={`min-h-9 border px-3 text-xs font-semibold ${presenceEnabled ? 'border-orange-500 bg-orange-500 text-zinc-950' : 'border-zinc-700 text-zinc-400'}`}>{presenceEnabled ? 'Aktif' : 'Nonaktif'}</button></div>
            <label className="mt-3 flex items-center gap-3 border border-zinc-800 bg-zinc-900/60 p-3">
              <span className="shrink-0 text-xs text-zinc-400">Nama tampilan</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={20}
                aria-label="Nama tampilan pengunjung"
                placeholder="Pengunjung-42"
                className="h-9 min-w-0 flex-1 border border-zinc-800 bg-zinc-950 px-2 text-xs text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
              />
            </label>
            <p className="mt-2 text-xs text-zinc-500">Status: {presenceStatus === 'online' ? 'terhubung' : presenceStatus === 'connecting' ? 'menghubungkan...' : presenceStatus === 'disabled' ? 'tidak tersedia di build ini' : presenceStatus === 'error' ? 'gagal terhubung' : 'offline'}{presenceEnabled ? '' : ' (multiplayer nonaktif)'}.</p>
          </section>

          <section className="flex items-center justify-between gap-4 border-t border-zinc-800 pt-5"><div><h3 className="text-sm font-bold text-zinc-200">Layar Penuh</h3><p className="mt-1 text-xs text-zinc-500">Gunakan seluruh area layar untuk eksplorasi.</p>{fullscreenError && <p role="alert" className="mt-2 text-xs text-red-400">{fullscreenError}</p>}</div><button onClick={toggleFullscreen} className="flex min-h-11 shrink-0 items-center gap-2 border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 hover:border-orange-500">{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}{isFullscreen ? 'Keluar' : 'Fullscreen'}</button></section>
        </div>

        <footer className="flex justify-end border-t border-zinc-800 bg-zinc-900/60 p-4"><button onClick={closeOverlay} className="min-h-11 bg-orange-500 px-6 text-xs font-bold text-zinc-950 hover:bg-orange-400">Selesai</button></footer>
      </section>
    </div>
  );
}
