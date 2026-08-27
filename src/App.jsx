import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Footprints, HelpCircle, Map, MousePointerClick, Search, Settings, X } from 'lucide-react';
import { Scene } from './components/3d/Scene';
import { LocationModal } from './components/ui/LocationModal';
import { InteractionPrompt } from './components/ui/InteractionPrompt';
import { ToastLocation } from './components/ui/ToastLocation';
import { SearchSidebar } from './components/ui/SearchSidebar';
import { SchoolMapModal } from './components/ui/SchoolMapModal';
import { SettingsModal } from './components/ui/SettingsModal';
import { VirtualJoystick } from './components/ui/VirtualJoystick';
import { AudioAmbience } from './components/ui/AudioAmbience';
import { PresencePanel } from './components/ui/PresencePanel';
import { ChatPanel } from './components/ui/ChatPanel';
import { XRButton } from './components/ui/XRButton';
import { useTourStore } from './stores/useTourStore';
import { findDeepLinkedLocation, getDeepLinkLocationId, resolveTeleportPosition } from './lib/locationUtils';
import { initializePresenceSettings, presence } from './lib/presence';

export default function App() {
  const cameraMode = useTourStore((state) => state.cameraMode);
  const setCameraMode = useTourStore((state) => state.setCameraMode);
  const isPointerLocked = useTourStore((state) => state.isPointerLocked);
  const overlay = useTourStore((state) => state.overlay);
  const openSearch = useTourStore((state) => state.openSearch);
  const openMap = useTourStore((state) => state.openMap);
  const openSettings = useTourStore((state) => state.openSettings);
  const openLocation = useTourStore((state) => state.openLocation);
  const teleportTo = useTourStore((state) => state.teleportTo);
  const locations = useTourStore((state) => state.locations);
  const locationsStatus = useTourStore((state) => state.locationsStatus);
  const presenceEnabled = useTourStore((state) => state.presenceEnabled);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneUnavailable, setSceneUnavailable] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showIntroHelp, setShowIntroHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [notice, setNotice] = useState('');
  const deepLinkHandledRef = useRef(false);

  const handleStartExploring = useCallback((event) => {
    setHasStarted(true);
    if (sessionStorage.getItem('virtual-tour-tutorial-seen') !== '1') setShowTutorial(true);
    if (cameraMode !== 'fps') return;
    const isDirectTouch = event?.nativeEvent?.pointerType === 'touch' || event?.touches?.length > 0;
    if (!isDirectTouch) {
      const canvas = document.querySelector('canvas');
      if (canvas?.requestPointerLock) {
        try { canvas.requestPointerLock(); } catch { /* ignore */ }
      }
    }
  }, [cameraMode]);

  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleSceneUnavailable = useCallback(() => setSceneUnavailable(true), []);
  const handleSceneRestored = useCallback(() => setSceneUnavailable(false), []);

  const closeTutorial = () => {
    sessionStorage.setItem('virtual-tour-tutorial-seen', '1');
    setShowTutorial(false);
  };

  useEffect(() => {
    if (locationsStatus !== 'ready' || deepLinkHandledRef.current) return undefined;
    const requestedId = getDeepLinkLocationId(window.location.search);
    if (!requestedId) {
      deepLinkHandledRef.current = true;
      return undefined;
    }

    deepLinkHandledRef.current = true;
    const location = findDeepLinkedLocation(locations, window.location.search);
    if (!location) {
      setNotice(`Lokasi “${requestedId}” tidak ditemukan.`);
      return undefined;
    }

    setHasStarted(true);
    if (resolveTeleportPosition(location)) teleportTo(location);
    openLocation(location);
    return undefined;
  }, [locations, locationsStatus, openLocation, teleportTo]);

  useEffect(() => {
    const handleGlobalKeys = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (key === 'm') openSearch();
      if (key === 'f') openMap();
      if (key === 'o') openSettings();
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [openMap, openSearch, openSettings]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Multiplayer presence: inisialisasi preferensi lalu hubungkan setelah tur dimulai.
  useEffect(() => {
    initializePresenceSettings();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    if (presenceEnabled) presence.connect();
    else presence.disconnect();
  }, [hasStarted, presenceEnabled]);

  useEffect(() => () => presence.disconnect(), []);

  // Sembunyikan latar dari assistive technology saat overlay terbuka.
  useEffect(() => {
    const background = [
      document.getElementById('canvas-container'),
      document.querySelector('.tour-header'),
      document.querySelector('.tour-footer'),
    ].filter(Boolean);
    background.forEach((element) => { element.inert = overlay != null; });
    return () => background.forEach((element) => { element.inert = false; });
  }, [overlay]);

  const showIntro = sceneReady && !hasStarted && !overlay;

  return (
    <main className="tour-shell relative w-screen overflow-hidden text-slate-100">
      <Scene controlsEnabled={hasStarted && !sceneUnavailable} onReady={handleSceneReady} onUnavailable={handleSceneUnavailable} onRestored={handleSceneRestored} />
      <AudioAmbience />
      <VirtualJoystick />

      {sceneUnavailable && (
        <div role="alert" className="fixed inset-0 z-[150] grid place-items-center bg-zinc-950 p-6 text-center text-white">
          <div className="max-w-sm"><p className="eyebrow">WebGL tidak tersedia</p><h2 className="text-2xl font-extrabold">Virtual Tour tidak dapat ditampilkan</h2><p className="mt-3 text-sm text-zinc-400">Aktifkan akselerasi grafis atau gunakan browser dan perangkat lain.</p><button onClick={() => window.location.reload()} className="mt-6 min-h-11 bg-orange-500 px-5 text-sm font-bold text-zinc-950">Muat Ulang</button></div>
        </div>
      )}

      {cameraMode === 'fps' && isPointerLocked && !overlay && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><div className="crosshair" /></div>
      )}

      <InteractionPrompt />
      <ToastLocation />
      {hasStarted && !sceneUnavailable && <PresencePanel />}
      {hasStarted && <ChatPanel />}

      {overlay?.type === 'location' && <LocationModal key={overlay.location.id} />}
      {overlay?.type === 'search' && <SearchSidebar />}
      {overlay?.type === 'map' && <SchoolMapModal />}
      {overlay?.type === 'settings' && <SettingsModal />}

      {notice && <div role="alert" className="fixed left-1/2 top-24 z-[90] -translate-x-1/2 border border-amber-500/50 bg-zinc-950 px-4 py-3 text-sm text-amber-200 shadow-2xl">{notice}</div>}

      {showIntro && (
        <div className="start-screen absolute inset-0 z-40 flex items-center justify-center p-5">
          <section className="start-card relative w-full max-w-xl overflow-hidden text-left">
            <div className="start-index">VT / 01</div><div className="start-icon"><MousePointerClick size={24} /></div>
            <div className="mt-10 sm:mt-14"><p className="eyebrow">Virtual Tour</p><h2 className="start-title">SMKN 2<br />Surakarta.</h2><p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">Jelajahi lingkungan dan fasilitas sekolah secara interaktif dalam tampilan 3D.</p></div>
            {showIntroHelp && <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-y border-zinc-800 py-4 font-mono text-xs text-zinc-400"><span><kbd>WASD</kbd> Bergerak</span><span><kbd>Mouse</kbd> Melihat</span><span><kbd>Shift</kbd> Jalan cepat</span><span><kbd>E</kbd> Interaksi</span><p className="col-span-2 mt-2 text-zinc-500">Dekati ikon informasi untuk membuka detail lokasi.</p></div>}
            <button onClick={handleStartExploring} className="start-action mt-7"><span>Mulai Virtual Tour</span><span aria-hidden="true">→</span></button>
            <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={openMap} className="min-h-11 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:border-orange-500"><Map size={14} className="mr-2 inline" />Denah</button><button onClick={() => setShowIntroHelp((visible) => !visible)} aria-expanded={showIntroHelp} className="min-h-11 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:border-orange-500"><HelpCircle size={14} className="mr-2 inline" />Petunjuk</button></div>
          </section>
        </div>
      )}

      {showTutorial && !overlay && (
        <aside className="fixed left-1/2 top-24 z-30 w-[min(92vw,420px)] -translate-x-1/2 border border-zinc-700 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-md" aria-label="Petunjuk eksplorasi">
          <button onClick={closeTutorial} aria-label="Tutup petunjuk" className="absolute right-2 top-2 grid h-9 w-9 place-items-center text-zinc-500 hover:text-white"><X size={16} /></button>
          <p className="eyebrow">Petunjuk singkat</p><p className="pr-8 text-sm font-bold">Dekati ikon informasi untuk melihat detail lokasi.</p>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] text-zinc-400"><span><kbd>WASD</kbd> Bergerak</span><span><kbd>Shift</kbd> Cepat</span><span><kbd>E</kbd> Informasi</span></div>
        </aside>
      )}

      <header className="tour-header pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between">
        <div className="brand-lockup pointer-events-auto flex items-stretch"><div className="brand-mark">02</div><div><p className="eyebrow">Virtual campus</p><h1 className="brand-title">SMKN 2 <span>Surakarta</span></h1></div></div>
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <nav className="hud-panel flex items-center" aria-label="Navigasi tur">
            <button onClick={openSearch} className="hud-button" title="Cari Lokasi (M)" aria-label="Cari lokasi"><Search size={16} /><span className="hidden md:inline">Lokasi</span></button>
            <button onClick={openMap} className="hud-button" title="Denah (F)" aria-label="Buka denah"><Map size={16} /><span className="hidden md:inline">Denah</span></button>
            <button onClick={openSettings} className="hud-button" title="Pengaturan (O)" aria-label="Buka pengaturan"><Settings size={16} /><span className="hidden lg:inline">Pengaturan</span></button>
            <XRButton />
          </nav>
          <div className="mode-switch flex items-center"><button onClick={() => setCameraMode('fps')} aria-pressed={cameraMode === 'fps'} className={`mode-button ${cameraMode === 'fps' ? 'is-active' : ''}`}><Footprints size={14} /><span className="hidden sm:inline">Jalan</span></button><button onClick={() => setCameraMode('orbit')} aria-pressed={cameraMode === 'orbit'} className={`mode-button ${cameraMode === 'orbit' ? 'is-active' : ''}`}><Eye size={14} /><span className="hidden sm:inline">Orbit</span></button></div>
        </div>
      </header>

      {hasStarted && (
        <footer className="tour-footer pointer-events-none absolute inset-x-0 flex items-end justify-between">
          <div className="status-strip pointer-events-auto flex items-center gap-3"><span className="status-dot" /><span>{cameraMode === 'fps' ? 'Dekati penanda untuk informasi lokasi' : 'Mode inspeksi orbit'}</span></div>
          {cameraMode === 'fps' && isPointerLocked && <div className="key-strip pointer-events-auto hidden items-center sm:flex"><span><strong>WASD</strong> Jalan</span><span><strong>Shift</strong> Cepat</span><span><strong>E</strong> Info</span><span><strong>M</strong> Lokasi</span><span><strong>F</strong> Denah</span><span><strong>ESC</strong> Kursor</span></div>}
        </footer>
      )}
    </main>
  );
}
