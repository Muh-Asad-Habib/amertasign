# Amerta Sign — Mobile

Aplikasi mobile penerjemah bahasa isyarat (SIBI/BISINDO) dua arah berbasis **React Native + Expo**. Amerta Sign membantu komunikasi antara teman Tuli dan pengguna dengar melalui penerjemahan isyarat ke teks/suara dan sebaliknya.

## Fitur

- **Terjemahan Isyarat → Teks/Suara** — deteksi bahasa isyarat secara live melalui kamera, hasil dapat dibacakan dengan text-to-speech.
- **Terjemahan Teks/Suara → Isyarat** — ketik atau ucapkan kalimat, aplikasi menampilkan video peraga isyarat.
- **Kamus Isyarat** — jelajahi kosakata isyarat per kategori, lengkap dengan video peraga dan favorit.
- **Riwayat Terjemahan** — simpan dan lihat kembali hasil terjemahan.
- **Akun & Mode Tamu** — login/registrasi untuk sinkronisasi data, atau gunakan tanpa akun (data lokal).
- **Pengaturan** — tema, preferensi suara, dan bahasa isyarat.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Framework | React Native 0.81 + Expo SDK 54 |
| Routing | Expo Router (file-based) |
| State | Zustand |
| Styling | NativeWind (Tailwind CSS) + design tokens kustom |
| Kamera & Media | expo-camera, expo-video, expo-image-picker |
| Suara | expo-speech (TTS), expo-speech-recognition (STT) |
| Penyimpanan | expo-secure-store |
| Bahasa | TypeScript |

## Struktur Proyek

```
app/                # Halaman (Expo Router)
  (auth)/           # Splash, onboarding, login, register
  (tabs)/           # Beranda, terjemahan, kamus, pengaturan
  dictionary/[id]   # Detail kata isyarat
  translate/        # Kamera live & teks-ke-isyarat
components/         # Komponen UI (dictionary, translate, ui)
services/           # API client, auth, kamus, terjemahan, TTS
store/              # Zustand stores (auth, kamus, riwayat, setting)
hooks/              # Custom hooks
theme/              # Design tokens (warna, tipografi, layout)
constants/          # Konstanta & data statis
types/              # Tipe TypeScript
docs/               # Spesifikasi API
```

## Prasyarat

- Node.js 20+
- Aplikasi [Expo Go](https://expo.dev/go) di perangkat, atau emulator Android/iOS
- Backend Amerta Sign yang berjalan (untuk fitur non-tamu)

## Menjalankan (Development)

```bash
# 1. Install dependensi
npm install

# 2. Salin dan sesuaikan environment
cp .env.example .env

# 3. Jalankan dev server
npx expo start
```

Pindai QR code dengan Expo Go, atau tekan `a` untuk membuka di emulator Android.

### Konfigurasi Environment

| Variabel | Keterangan |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base URL backend FastAPI (tanpa trailing slash). Saat development boleh dikosongkan agar otomatis memakai host Metro (`http://<host-dev>:8000`). Untuk build APK/production **wajib diisi** URL backend yang bisa diakses dari perangkat. |

## Build APK (Android)

```bash
# Generate project native lalu build release
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

Hasil build ada di `android/app/build/outputs/apk/release/`.

Alternatif dengan EAS Build:

```bash
npx eas build --platform android --profile preview
```

## Dokumentasi API

Kontrak API backend tersedia di [`docs/API-SPEC.md`](docs/API-SPEC.md).

## Lisensi

Lihat berkas [LICENSE](LICENSE).

