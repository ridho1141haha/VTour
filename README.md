# Virtual Tour 3D SMKN 2 Surakarta

Aplikasi **Virtual Tour 3D Berbasis Web** untuk menjelajahi lingkungan, gedung, dan fasilitas di SMKN 2 Surakarta secara interaktif langsung dari browser tanpa perlu instalasi aplikasi tambahan.

## Fitur Utama

- **First-Person Walkthrough**: Eksplorasi sudut pandang orang pertama (WASD + Mouse Look).
- **Mode Inspeksi Orbit**: Mode kamera bebas untuk melihat layout dan arsitektur sekolah secara menyeluruh.
- **Deteksi Ketinggian Lantai**: Sistem raycasting agar player berdiri stabil di atas permukaan tanah/lantai.
- **Collision Dasar**: Pergerakan FPS dibatasi oleh geometri bangunan dan tepi lantai.
- **Pencahayaan Dinamis**: Kombinasi directional sunlight dan ambient lighting untuk lingkungan luar dan dalam ruangan.
- **Real Progress Loader**: Indikator persentase loading aset 3D asli.
- **Mode Mobile**: Perangkat sentuh otomatis memakai mode Orbit.

## Teknologi & Tools

- **React 18** + **Vite**
- **Three.js** + **React Three Fiber (@react-three/fiber)** + **Drei (@react-three/drei)**
- **Tailwind CSS** + **Lucide Icons**
- **Zustand** (State Management)

## Menjalankan Proyek Secara Lokal

Prasyarat: Node.js 22.13 atau lebih baru dan npm 10.9 atau lebih baru.

1. **Clone repository:**
   ```bash
   git clone https://github.com/ridho1141haha/VTour.git
   cd VTour
   ```

2. **Install dependensi dari lockfile:**
   ```bash
   npm ci
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

## Pemeriksaan Kualitas

Jalankan lint, test, dan build sekaligus sebelum mengirim perubahan:

```bash
npm run check
```

## Deployment

Hasil build tersedia di folder `dist/` dan dapat diunggah ke static hosting. Konfigurasi menggunakan URL relatif sehingga aplikasi dapat dijalankan dari root domain maupun subpath, termasuk GitHub Pages.

Model utama telah memakai tekstur maksimal 2K, GPU instancing, dan kompresi Meshopt. Ukuran aset turun dari sekitar 47 MiB menjadi sekitar 14 MiB.

## Status Konten

Foto galeri saat ini adalah foto ilustrasi eksternal, bukan dokumentasi SMKN 2 Surakarta. Setiap ruangan diberi catatan verifikasi agar konten prototipe tidak dianggap sebagai data resmi. Ganti URL foto dan konfirmasi detail fasilitas bersama pihak sekolah sebelum publikasi resmi.
