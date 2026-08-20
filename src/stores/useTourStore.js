import { create } from 'zustand';

export const useTourStore = create((set) => ({
  appState: 'exploring', // 'landing' | 'loading' | 'exploring' | 'modal_open'
  setAppState: (state) => set({ appState: state }),

  cameraMode: 'fps', // 'fps' | 'orbit'
  setCameraMode: (mode) => set({ cameraMode: mode }),

  isPointerLocked: false,
  setIsPointerLocked: (locked) => set({ isPointerLocked: locked }),

  activeRoom: null,
  openRoomModal: (room) => set({ activeRoom: room, appState: 'modal_open' }),
  closeRoomModal: () => set({ activeRoom: null, appState: 'exploring' }),

  currentZone: null,
  setCurrentZone: (zone) => set({ currentZone: zone }),
}));
