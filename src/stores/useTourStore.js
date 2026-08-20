import { create } from 'zustand';

export const useTourStore = create((set, get) => ({
  // Status Aplikasi: 'exploring' | 'modal_open'
  appState: 'exploring',
  setAppState: (state) => set({ appState: state }),

  // Mode Kamera: 'fps' | 'orbit'
  cameraMode: 'fps',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // Status Pointer Lock (mouse terkunci untuk look-around)
  isPointerLocked: false,
  setIsPointerLocked: (locked) => set({ isPointerLocked: locked }),

  // Data seluruh ruangan yang terdaftar
  rooms: [],
  setRooms: (rooms) => set({ rooms }),

  // Ruangan yang sedang berada dalam jangkauan interaksi player (< 5 meter)
  nearbyRoom: null,
  setNearbyRoom: (room) => set({ nearbyRoom: room }),

  // Ruangan yang sedang aktif dibuka di modal informasi
  activeRoom: null,
  openRoomModal: (room) => {
    // Keluar dari pointer lock saat buka modal
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    set({ activeRoom: room, appState: 'modal_open', isPointerLocked: false });
  },
  closeRoomModal: () => set({ activeRoom: null, appState: 'exploring' }),

  // Notifikasi lokasi / zone saat player berpindah gedung
  currentZone: null,
  setCurrentZone: (zone) => set({ currentZone: zone }),
}));
