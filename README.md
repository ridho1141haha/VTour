# Virtual Tour 3D SMKN 2 Surakarta

Aplikasi web untuk menjelajahi lingkungan luar SMKN 2 Surakarta dengan navigasi first-person, titik informasi lokasi, denah, pencarian, teleport, dan galeri foto asli.

## Fitur

- First-person outdoor exploration dengan WASD, mouse look, sprint, dan interaksi `E`.
- Collision horizontal ringan terhadap bangunan/pagar dan ground raycast khusus permukaan walkable.
- Mode Orbit untuk inspeksi lingkungan sekolah.
- Satu dataset `locations.json` untuk marker, proximity, modal, search, teleport, denah, dan deep link.
- 23 lokasi final dengan kategori dan fallback konten yang jelas.
- 64 foto asli terkurasi dalam dua ukuran WebP: thumbnail dan gallery.
- Search nama, kategori, deskripsi, detail, dan fasilitas.
- Denah yang hanya membaca `mapPosition` dari dataset lokasi.
- Kontrol FPS mobile: joystick kiri, drag sisi kanan, sprint, dan tombol interaksi.
- Preset DPR Low/Medium/High, sensitivitas kamera, audio opsional, dan fullscreen.
- Loading progress aset 3D, fallback error, tutorial sesi pertama, dan deep link `?location=pplg`.

## Status Lokasi

Dataset berisi tepat 23 lokasi. Sembilan anchor telah divalidasi terhadap nama mesh dan geometri model GLB. Empat belas lokasi belum memiliki bukti koordinat yang cukup pada model, sehingga sengaja berstatus `pending`, tidak menampilkan marker, dan tidak dapat diteleport agar aplikasi tidak menyajikan posisi palsu.

Pada development, overlay `DEV POSITION` menampilkan posisi kamera dan tombol salin untuk mempercepat kalibrasi. Utility ini tidak masuk tampilan production.

## Stack

- React 18 + Vite
- Three.js + React Three Fiber + Drei
- Zustand
- Tailwind CSS
- Lucide React

## Menjalankan Project

Prasyarat: Node.js 22.13+ dan npm 10.9+.

```bash
npm ci
npm run dev
```

Buka `http://localhost:5173/`.

## Kontrol

| Input | Aksi |
| --- | --- |
| `WASD` / panah | Bergerak |
| Mouse | Melihat |
| `Shift` | Jalan cepat |
| `E` | Informasi lokasi terdekat |
| `Esc` | Lepas pointer / tutup dialog |
| `M` | Daftar lokasi |
| `F` | Denah |
| `O` | Pengaturan |

## Data Lokasi

Sumber data tunggal:

```text
public/data/locations.json
```

Field lokasi seperti `position`, `teleportPosition`, `teleportLookAt`, `mapPosition`, `building`, `floor`, `details`, dan `facilities` bersifat optional sesuai kebutuhan lokasi. Entri tanpa koordinat menggunakan `anchorStatus: "pending"` dan nilai posisi `null`.

## Foto

Archive mentah tidak dipublikasikan. Pipeline memilih 64 foto dari archive sumber, menghapus metadata EXIF/GPS, lalu menghasilkan:

- Gallery WebP: sisi terpanjang maksimum 1600 px, quality 80.
- Thumbnail WebP: sisi terpanjang maksimum 480 px, quality 76.

Jalankan ulang pipeline pada Windows dengan FFmpeg dan PowerShell 7:

```bash
npm run optimize:images
```

Output berada di `public/images/locations/`. Perpustakaan, Pembuangan Akhir, dan Labas belum memiliki foto sumber dan menggunakan fallback UI "Foto belum tersedia".

## Quality Check

```bash
npm run check
```

Perintah tersebut menjalankan lint, test Node, dan production build. Test mencakup schema 23 lokasi, aset foto, search, nearest POI, deep link, teleport fallback, collision primitive, state overlay, static path, dan struktur GLB.

## Deployment

```bash
npm run build
```

Hasil build berada di `dist/`. Seluruh URL runtime menggunakan `import.meta.env.BASE_URL` atau path relatif sehingga dapat dipasang pada root domain maupun subpath static hosting.

Deep link memakai query string (`?location=pplg`), bukan path, sehingga tidak membutuhkan rewrite routing khusus.

### Netlify

Konfigurasi sudah disiapkan di `netlify.toml` (build command, publish `dist/`, cache headers, dan SPA fallback):

1. Push repository ini ke GitHub.
2. Di Netlify: **Add new site → Import an existing project** → pilih repo.
3. Biarkan pengaturan dari `netlify.toml`, lalu **Deploy**.

### Render.com

Konfigurasi sudah disiapkan di `render.yaml` (Blueprint static site):

1. Push repository ini ke GitHub.
2. Di Render: **New → Blueprint** → pilih repo → Render membaca `render.yaml` otomatis.
3. **Apply** untuk membuat static site.

Kedua platform mendukung deploy otomatis setiap push ke `main` dan preview URL untuk pull request.

