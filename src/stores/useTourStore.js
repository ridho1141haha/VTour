import { create } from 'zustand';

export const useTourStore = create((set, get) => ({
  // Status Aplikasi: 'exploring' | 'modal_open' | 'search_open' | 'map_open'
  appState: 'exploring',
  setAppState: (state) => set({ appState: state }),

  // Mode Kamera: 'fps' | 'orbit'
  cameraMode: 'fps',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // Status Pointer Lock (mouse terkunci)
  isPointerLocked: false,
  setIsPointerLocked: (locked) => set({ isPointerLocked: locked }),

  // Data seluruh ruangan
  rooms: [],
  setRooms: (rooms) => set({ rooms }),

  // Ruangan dalam jangkauan interaksi player (< 4.5 meter)
  nearbyRoom: null,
  setNearbyRoom: (room) => set({ nearbyRoom: room }),

  // Ruangan yang sedang dibuka di modal informasi
  activeRoom: null,
  openRoomModal: (room) => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    set({ activeRoom: room, appState: 'modal_open', isPointerLocked: false });
  },
  closeRoomModal: () => set({ activeRoom: null, appState: 'exploring' }),

  // Modal Pencarian & Direktori Ruangan
  isSearchOpen: false,
  openSearch: () => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    set({ isSearchOpen: true, isMapOpen: false, isPointerLocked: false });
  },
  closeSearch: () => set({ isSearchOpen: false }),

  // Modal Denah 2D Interaktif Sekolah
  isMapOpen: false,
  openMap: () => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    set({ isMapOpen: true, isSearchOpen: false, isPointerLocked: false });
  },
  closeMap: () => set({ isMapOpen: false }),

  // Trigger Teleportasi ke Lokasi Tertentu
  targetTeleport: null,
  teleportTo: (position, roomInfo = null) => {
    set({ 
      targetTeleport: position, 
      isSearchOpen: false, 
      isMapOpen: false, 
      cameraMode: 'fps' 
    });
    if (roomInfo) {
      set({ currentZone: `${roomInfo.building} • ${roomInfo.shortName}` });
    }
  },
  clearTeleport: () => set({ targetTeleport: null }),

  // Notifikasi lokasi / zone saat player berpindah gedung
  currentZone: null,
  setCurrentZone: (zone) => set({ currentZone: zone }),
}));
