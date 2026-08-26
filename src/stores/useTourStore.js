import { create } from 'zustand';
import { resolveTeleportPosition } from '../lib/locationUtils.js';

function releasePointer() {
  if (typeof document !== 'undefined' && document.pointerLockElement) {
    document.exitPointerLock();
  }
}

// Sinkronkan deep link agar lokasi bisa dibagikan dan reload tidak membuka ulang modal.
function syncLocationUrl(locationId) {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  if (locationId) url.searchParams.set('location', locationId);
  else url.searchParams.delete('location');
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

export const useTourStore = create((set, get) => ({
  cameraMode: 'fps',
  setCameraMode: (cameraMode) => {
    if (cameraMode !== 'fps') {
      releasePointer();
    }
    set({
      cameraMode,
      isPointerLocked: false,
      ...(cameraMode === 'orbit' ? { nearbyLocation: null, currentLocation: null } : {}),
    });
  },

  isPointerLocked: false,
  setIsPointerLocked: (locked) => set((state) => ({
    isPointerLocked: state.overlay || state.cameraMode !== 'fps' ? false : Boolean(locked),
  })),

  overlay: null,
  openLocation: (location) => {
    releasePointer();
    syncLocationUrl(location.id);
    set({ overlay: { type: 'location', location }, isPointerLocked: false });
  },
  openSearch: () => {
    releasePointer();
    set({ overlay: { type: 'search' }, isPointerLocked: false });
  },
  openMap: () => {
    releasePointer();
    set({ overlay: { type: 'map' }, isPointerLocked: false });
  },
  openSettings: () => {
    releasePointer();
    set({ overlay: { type: 'settings' }, isPointerLocked: false });
  },
  closeOverlay: () => {
    syncLocationUrl(null);
    set({ overlay: null });
  },

  locations: [],
  locationsStatus: 'idle',
  locationsError: null,
  setLocationsLoading: () => set({ locationsStatus: 'loading', locationsError: null }),
  setLocations: (locations) => set({ locations, locationsStatus: 'ready', locationsError: null }),
  setLocationsError: (error) => set({ locationsStatus: 'error', locationsError: error }),

  nearbyLocation: null,
  setNearbyLocation: (nearbyLocation) => set({ nearbyLocation }),
  currentLocation: null,
  setCurrentLocation: (currentLocation) => set({ currentLocation }),

  graphicsQuality: 'medium',
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  isAudioMuted: true,
  setIsAudioMuted: (isAudioMuted) => set({ isAudioMuted }),
  audioVolume: 0.3,
  setAudioVolume: (audioVolume) => set({ audioVolume }),
  mouseSensitivity: 1,
  setMouseSensitivity: (mouseSensitivity) => set({ mouseSensitivity }),

  touchMoveVector: { x: 0, y: 0 },
  setTouchMoveVector: (touchMoveVector) => set({ touchMoveVector }),
  touchSprint: false,
  setTouchSprint: (touchSprint) => set({ touchSprint }),

  targetTeleport: null,
  teleportTo: (location) => {
    const position = resolveTeleportPosition(location);
    if (!position) return false;

    releasePointer();
    set({
      targetTeleport: {
        position,
        lookAt: location.teleportLookAt ?? location.position,
        locationId: location.id,
      },
      overlay: null,
      cameraMode: 'fps',
      isPointerLocked: false,
      nearbyLocation: null,
      currentLocation: location,
    });
    return true;
  },
  clearTeleport: () => set({ targetTeleport: null }),

  resetExplorationState: () => {
    releasePointer();
    set({
      overlay: null,
      isPointerLocked: false,
      nearbyLocation: null,
      currentLocation: null,
      targetTeleport: null,
      touchMoveVector: { x: 0, y: 0 },
      touchSprint: false,
    });
  },

  getActiveLocation: () => {
    const { overlay } = get();
    return overlay?.type === 'location' ? overlay.location : null;
  },
}));
