import { createXRStore } from '@react-three/xr';

// Singleton XR store — digunakan oleh Scene.jsx (<XR store={xrStore}>)
// dan App.jsx (xrStore.enterVR() / xrStore.enterAR()).
export const xrStore = createXRStore({
  // Minta fitur local-floor agar pengguna bisa berdiri atau duduk.
  // Jika perangkat tidak mendukung, sesi tetap bisa dimulai tanpa error.
  requiredFeatures: ['local-floor'],
});
