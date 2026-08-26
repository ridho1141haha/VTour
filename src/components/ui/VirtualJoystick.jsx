import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Info, Zap } from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';

export function VirtualJoystick() {
  const cameraMode = useTourStore((state) => state.cameraMode);
  const overlay = useTourStore((state) => state.overlay);
  const setTouchMoveVector = useTourStore((state) => state.setTouchMoveVector);
  const touchSprint = useTourStore((state) => state.touchSprint);
  const setTouchSprint = useTourStore((state) => state.setTouchSprint);
  const nearbyLocation = useTourStore((state) => state.nearbyLocation);
  const openLocation = useTourStore((state) => state.openLocation);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickRef = useRef(null);
  const thumbRef = useRef(null);
  const touchIdRef = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const pendingTouchRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
  }, []);

  const resetInput = useCallback(() => {
    touchIdRef.current = null;
    pendingTouchRef.current = null;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate(0px, 0px)';
    }
    setTouchMoveVector({ x: 0, y: 0 });
  }, [setTouchMoveVector]);

  useEffect(() => {
    if (cameraMode !== 'fps' || overlay) {
      resetInput();
      setTouchSprint(false);
    }
    const handleVisibility = () => {
      if (document.hidden) resetInput();
    };
    window.addEventListener('blur', resetInput);
    window.addEventListener('pagehide', resetInput);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      resetInput();
      window.removeEventListener('blur', resetInput);
      window.removeEventListener('pagehide', resetInput);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [cameraMode, overlay, resetInput, setTouchSprint]);

  const scheduleUpdate = () => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (!pendingTouchRef.current) return;
      const { clientX, clientY } = pendingTouchRef.current;
      const maxRadius = 42;
      let x = clientX - centerRef.current.x;
      let y = clientY - centerRef.current.y;
      const distance = Math.hypot(x, y);
      if (distance > maxRadius) {
        x = (x / distance) * maxRadius;
        y = (y / distance) * maxRadius;
      }
      if (thumbRef.current) {
        thumbRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
      setTouchMoveVector({ x: x / maxRadius, y: -y / maxRadius });
    });
  };

  const handleTouchStart = (event) => {
    if (touchIdRef.current !== null || !joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    centerRef.current.x = rect.left + rect.width / 2;
    centerRef.current.y = rect.top + rect.height / 2;
    const touch = event.changedTouches[0];
    touchIdRef.current = touch.identifier;
    pendingTouchRef.current = { clientX: touch.clientX, clientY: touch.clientY };
    scheduleUpdate();
  };

  const handleTouchMove = (event) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < event.changedTouches.length; i += 1) {
      const touch = event.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        pendingTouchRef.current = { clientX: touch.clientX, clientY: touch.clientY };
        scheduleUpdate();
        break;
      }
    }
  };

  const handleTouchEnd = (event) => {
    for (let i = 0; i < event.changedTouches.length; i += 1) {
      if (event.changedTouches[i].identifier === touchIdRef.current) {
        resetInput();
        break;
      }
    }
  };

  if (!isTouchDevice || cameraMode !== 'fps' || overlay) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-30 touch-none select-none">
      <div
        ref={joystickRef}
        aria-label="Joystick gerak"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="mobile-joystick pointer-events-auto absolute flex h-28 w-28 items-center justify-center rounded-full"
      >
        <div
          ref={thumbRef}
          style={{ transform: 'translate(0px, 0px)' }}
          className="pointer-events-none grid h-12 w-12 place-items-center rounded-full border border-orange-200 bg-orange-500 shadow-lg"
        >
          <span className="h-3 w-3 rounded-full bg-white/70" />
        </div>
      </div>
      <div className="mobile-actions pointer-events-auto absolute flex flex-col items-center gap-3">
        <button onClick={() => setTouchSprint(!touchSprint)} aria-pressed={touchSprint} className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border text-[9px] font-bold shadow-xl ${touchSprint ? 'border-orange-300 bg-orange-600 text-white ring-2 ring-orange-300/50' : 'border-slate-700 bg-slate-900/85 text-slate-300'}`}><Zap size={18} />LARI</button>
        {nearbyLocation && <button onClick={() => openLocation(nearbyLocation)} aria-label={`Lihat informasi ${nearbyLocation.name}`} className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-orange-300 bg-orange-600 text-[9px] font-bold text-white shadow-2xl ring-4 ring-orange-500/30"><Info size={20} />INFO</button>}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-4"><div className="hud-panel px-3.5 py-2 text-xs text-slate-300">Joystick kiri untuk bergerak · Geser sisi kanan untuk melihat</div></div>
    </div>
  );
}
