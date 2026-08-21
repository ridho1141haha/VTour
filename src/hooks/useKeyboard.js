import { useEffect, useState } from 'react';

const EMPTY_KEYS = Object.freeze({
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  interact: false,
});

const KEY_BINDINGS = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  KeyE: 'interact',
};

export function useKeyboard(enabled = true) {
  const [keys, setKeys] = useState(EMPTY_KEYS);

  useEffect(() => {
    const clearKeys = () => {
      setKeys((current) => (
        Object.values(current).some(Boolean) ? EMPTY_KEYS : current
      ));
    };

    if (!enabled) {
      clearKeys();
      return undefined;
    }

    const setKey = (code, pressed) => {
      const key = KEY_BINDINGS[code];
      if (!key) return false;

      setKeys((current) => (
        current[key] === pressed ? current : { ...current, [key]: pressed }
      ));
      return true;
    };

    const handleKeyDown = (e) => {
      // Abaikan HANYA jika pengguna sedang mengetik teks di input form atau textarea
      if (e.target instanceof Element && e.target.closest('input, textarea, [contenteditable="true"]')) {
        return;
      }

      if (setKey(e.code, true)) {
        // Jangan scroll halaman dengan tombol panah/space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e) => {
      setKey(e.code, false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) clearKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  return keys;
}
