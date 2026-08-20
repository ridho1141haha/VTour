# 🏫 Virtual Tour 3D SMKN 2 Surakarta

Aplikasi **Virtual Tour 3D Berbasis Web** untuk menjelajahi lingkungan, gedung, dan fasilitas di SMKN 2 Surakarta secara interaktif langsung dari browser tanpa perlu instalasi aplikasi tambahan.

## 🚀 Fitur Utama
- **First-Person Walkthrough**: Eksplorasi sudut pandang orang pertama (WASD + Mouse Look).
- **Mode Inspeksi Orbit**: Mode kamera bebas untuk melihat layout dan arsitektur sekolah secara menyeluruh.
- **Deteksi Ketinggian Lantai**: Sistem raycasting agar player berdiri stabil di atas permukaan tanah/lantai.
- **Pencahayaan Dinamis**: Kombinasi directional sunlight dan ambient lighting untuk lingkungan luar dan dalam ruangan.
- **Real Progress Loader**: Indikator persentase loading aset 3D asli.

## 🛠️ Teknologi & Tools
- **React 18** + **Vite**
- **Three.js** + **React Three Fiber (@react-three/fiber)** + **Drei (@react-three/drei)**
- **Tailwind CSS** + **Lucide Icons**
- **Zustand** (State Management)

## 📦 Menjalankan Proyek Secara Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/ridho1141haha/VTour.git
   cd VTour
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173/` di browser.

4. **Build untuk produksi:**
   ```bash
   npm run build
   ```
