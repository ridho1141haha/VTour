import { useEffect, useRef, useState } from 'react';

const EMPTY_KEYS = Object.freeze({
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  interact: false,
  jump: false,
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
  Space: 'jump',
};

function deriveKeysFromCodes(codes) {
  return {
    forward: codes.has('KeyW') || codes.has('ArrowUp'),
    backward: codes.has('KeyS') || codes.has('ArrowDown'),
    left: codes.has('KeyA') || codes.has('ArrowLeft'),
    right: codes.has('KeyD') || codes.has('ArrowRight'),
    sprint: codes.has('ShiftLeft') || codes.has('ShiftRight'),
    interact: codes.has('KeyE'),
    jump: codes.has('Space'),
  };
}

export function useKeyboard(enabled = true) {
  const [keys, setKeys] = useState(EMPTY_KEYS);
  const pressedCodesRef = useRef(new Set());

  useEffect(() => {
    const pressedCodes = pressedCodesRef.current;

    const clearKeys = () => {
      pressedCodes.clear();
      setKeys((current) => (
        Object.values(current).some(Boolean) ? EMPTY_KEYS : current
      ));
    };

    if (!enabled) {
      clearKeys();
      return undefined;
    }

    const updateFromSet = () => {
      const derived = deriveKeysFromCodes(pressedCodes);
      setKeys((current) => {
        const hasChanged = Object.keys(derived).some((k) => derived[k] !== current[k]);
        return hasChanged ? derived : current;
      });
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      if (KEY_BINDINGS[e.code]) {
        pressedCodes.add(e.code);
        updateFromSet();
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (KEY_BINDINGS[e.code]) {
        pressedCodes.delete(e.code);
        updateFromSet();
      }
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
