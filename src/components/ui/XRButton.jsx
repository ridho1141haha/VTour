import React, { useCallback, useEffect, useState } from 'react';
import { Glasses } from 'lucide-react';
import { xrStore } from '../../lib/xrStore';

/**
 * XRButton — tombol "Masuk VR" / "Masuk AR" di header HUD.
 *
 * Hanya ditampilkan jika browser mendukung WebXR immersive-vr.
 * Saat diklik, memanggil xrStore.enterVR() untuk memulai sesi VR.
 */
export function XRButton() {
  const [vrSupported, setVrSupported] = useState(false);

  useEffect(() => {
    if (!navigator.xr) return;
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
      setVrSupported(supported);
    }).catch(() => {
      // WebXR API tidak tersedia
    });
  }, []);

  const handleEnterVR = useCallback(() => {
    try {
      xrStore.enterVR();
    } catch (error) {
      console.warn('Gagal memulai sesi VR:', error);
    }
  }, []);

  if (!vrSupported) return null;

  return (
    <button
      onClick={handleEnterVR}
      className="hud-button"
      title="Masuk Mode VR"
      aria-label="Masuk mode virtual reality"
    >
      <Glasses size={16} />
      <span className="hidden md:inline">VR</span>
    </button>
  );
}
