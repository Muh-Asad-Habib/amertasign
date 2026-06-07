# AmertaSign — Redesign UI & Design System

**Tanggal:** 2026-06-07
**Status:** Disetujui (menunggu review spec)
**Topik:** Atur ulang UI menjadi lebih modern, konsisten, dan menghilangkan elemen yang "berdempetan".

## Latar Belakang & Masalah

AmertaSign adalah aplikasi mobile penerjemah & pembelajaran bahasa isyarat (BISINDO/SIBI) berbasis Expo SDK 54 + React Native 0.81 + expo-router. Scaffold UI sudah lengkap dan berjalan di atas data mock.

Masalah pada UI saat ini:

1. **Token tersebar/duplikat.** `constants/Colors.ts` dan `constants/Layout.ts` ada, tetapi banyak komponen mendefinisikan ulang warna sendiri secara hardcode (mis. `components/ui/Card.tsx`, `components/ui/Button.tsx`, `components/home/QuickActions.tsx` masing-masing punya blok `COLORS`). Tidak konsisten dan sulit dirawat.
2. **Elemen berdempetan.** Jarak antar elemen diterapkan manual dan tidak konsisten. Contoh konkret: `components/home/QuickActions.tsx` menyusun dua kartu dengan `flexDirection: 'row'` tanpa `gap`, sehingga kedua kartu saling menempel. Pola `marginTop` manual berulang di `app/(tabs)/index.tsx`.
3. **Tampilan generik.** Karakter visual standar (biru + amber, kartu putih datar), font sistem, tanpa identitas yang kuat.
4. **NativeWind tidak aktif.** `nativewind` ada di `package.json`, tetapi commit `f217bb0` menghapus file konfigurasinya. Semua layar memakai `StyleSheet.create`.

## Tujuan

- Membangun **design system terpusat** sebagai satu sumber kebenaran.
- Tampilan **modern friendly** yang konsisten di **semua layar**.
- **Menghilangkan masalah berdempetan** di akarnya melalui komponen layout berbasis `gap`.
- Mempertahankan **aksesibilitas**: target sentuh ≥48px, kontras WCAG AA, label aksesibilitas yang sudah ada.

## Non-Tujuan (YAGNI)

- Tidak menambah mode gelap (light-only, dipoles).
- Tidak mengganti palet brand secara total (biru + amber dipertahankan, hanya disegarkan).
- Tidak mengaktifkan ulang NativeWind (tetap `StyleSheet`).
- Tidak mengubah logika/fitur (auth, translation, database tetap mock seperti sekarang).
- Tidak ada refactor di luar styling/layout.

## Keputusan Desain

| Aspek | Keputusan |
|---|---|
| Estetika | Modern friendly |
| Cakupan | Semua layar + design system |
| Tema | Terang saja, dipoles |
| Palet | Biru + amber yang disegarkan (palet lengkap) |
| Tipografi | Plus Jakarta Sans (judul) + Lexend (teks) |
| Teknik | Design system terpusat + `StyleSheet` (Pendekatan A) |

### Pendekatan yang Dipertimbangkan

- **A. Design system terpusat + StyleSheet (DIPILIH).** Selaras dengan kode yang ada, performa baik, konsisten, memperbaiki akar masalah dempet via `gap`.
- **B. Aktifkan ulang NativeWind.** Ditolak: harus re-setup yang baru dihapus, menulis ulang semua styling, risiko konfigurasi.
- **C. Perbaikan ringan saja.** Ditolak: tidak memenuhi target "semua layar + design system", hardcode tetap tersebar.

## Arsitektur

### 1. Fondasi token (`theme/`)

Folder `theme/` menjadi satu sumber kebenaran, menggantikan `constants/Colors.ts` dan `constants/Layout.ts`.

**Warna — biru + amber disegarkan:**

```
Primary (biru):  50 #EFF6FF · 100 #DBEAFE · 500 #3B82F6 · 600 #2563EB (brand) · 700 #1D4ED8 (pressed)
Accent (amber):  50 #FFFBEB · 400 #FBBF24 · 500 #F59E0B (brand) · 600 #D97706
Netral (slate):  ink #0F172A · textSecondary #64748B · textTertiary #94A3B8
                 border #E2E8F0 · surfaceMuted #F1F5F9 · background #F8FAFC · surface #FFFFFF
Semantic:        success #10B981 (+tint #ECFDF5) · error #EF4444 (+tint #FEF2F2) · warning #F59E0B
```

Surface bertingkat (background → surfaceMuted → surface) memberi kedalaman tanpa terlihat ramai.

**Spacing — kelipatan 4 + token semantik:**

```
Skala:    xs 4 · sm 8 · md 12 · base 16 · lg 24 · xl 32 · xxl 48
Semantik: screenPadding 20 · sectionGap 24 · cardPadding 16 · stackGap 12
```

**Tipografi — Plus Jakarta Sans (judul) + Lexend (teks):**

```
Peran       Font              Size/LineHeight   Weight
hero        PlusJakartaSans   36/42             800
title       PlusJakartaSans   28/34             700
h2          PlusJakartaSans   20/26             700
body        Lexend            16/24             400
bodyStrong  Lexend            16/24             600
caption     Lexend            13/18             500
label       Lexend            12/16             600
```

**Radius & shadow:**

```
Radius: sm 10 · md 14 · lg 18 · xl 24 · full 9999
Shadow: sm (halus) · md (kartu) · lg (modal/FAB) — opacity rendah, lembut
```

### 2. Komponen primitif & layout (`components/ui/`)

Komponen kecil dengan satu tugas jelas, menerima token dari `theme/`, dapat diuji terpisah.

- **`Screen`** — pembungkus layar: `SafeAreaView` + `screenPadding` + background konsisten + opsi `scroll`.
- **`Stack`** — susun vertikal dengan `gap` (default `stackGap`). Pengganti `marginTop` manual.
- **`Row`** — susun horizontal dengan `gap` + `align`/`justify`. Memperbaiki dempet di `QuickActions`.
- **`Section`** — judul + konten dengan `sectionGap`. Menggantikan `SectionTitle` lokal di Home.
- **`Divider`** — garis pemisah tipis.
- **`Text`** — wrapper Lexend dengan `variant` (`body|caption|label`) + warna token.
- **`Heading`** — Plus Jakarta Sans dengan `variant` (`hero|title|h2`).

### 3. Poles komponen inti

Konsumsi token (hapus blok `COLORS` hardcode), tampil lebih modern:

- **`Card`** — radius `lg`, `shadow.md` lebih lembut, varian `default`/`elevated`/`muted`.
- **`Button`** — 4 varian (primary/secondary/outline/ghost), warna dari token, radius `md`, `pressed` = `primary 700`, target sentuh ≥48px.
- **`Badge`** — pill `radius.full`, varian semantik dengan pasangan warna + tint.
- **`AuthInput` → `Input`** — label, ikon, state focus/error, helper text.
- **`SearchBar`, `CategoryTabs`, `ProgressRing`, `EmptyState`, `LoadingIndicator`, `TabIcon`** — disamakan ke token.
- Komponen fitur (`home`, `dictionary`, `learn`, `translate`) memakai primitif + komponen inti, bukan styling lokal.

### 4. Penerapan per layar (incremental)

Setiap layar dibungkus `Screen`; jarak pakai `Stack`/`Row`/`Section`; warna/font dari token.

- **Auth** (`splash`, `onboarding`, `login`, `register`) — branding konsisten, `Input` baru, field pakai `Stack gap="md"`.
- **Home** (`(tabs)/index.tsx`) — `QuickActions` → `Row gap="md"`; section pakai `<Section>`; kartu horizontal berjarak konsisten.
- **Translate** (`(tabs)/translate`, `translate/camera`, `translate/text-to-sign`) — toggle BISINDO/SIBI lebih jelas, area kamera/output rapi, tombol besar.
- **Dictionary** (`(tabs)/dictionary`, `dictionary/[id]`) — `SearchBar` + `CategoryTabs` rapi, daftar `WordCard` ber-`gap`, detail dengan hierarki.
- **Learn** (`(tabs)/learn`, `learn/[moduleId]`) — `ModuleCard` (badge + `ProgressRing`), daftar `Stack gap="md"`, detail dengan `VideoPlayer`.
- **Profile** (`(tabs)/profile`) — header profil, daftar pengaturan + `Divider`, logout.
- **Tab bar** (`(tabs)/_layout.tsx`) — warna/border token, aman terhadap safe-area.

### 5. Setup font (`expo-font`)

- Tambah `@expo-google-fonts/plus-jakarta-sans` + `@expo-google-fonts/lexend` (atau `.ttf` di `assets/fonts/`).
- Muat via `useFonts(...)` di `app/_layout.tsx`; tahan render dengan `expo-splash-screen` (sudah ada) agar tidak kedip.
- Daftarkan nama keluarga font di `theme/typography`; `Text`/`Heading` memetakan weight ke keluarga yang benar.
- Fallback: jika font gagal dimuat, jatuh ke font sistem.

## Aliran Data / Dependensi

```
theme/ (token)
   ▲
   │ dikonsumsi
components/ui/ (primitif + inti)
   ▲
   │ dipakai
app/ (layar) + components/{home,dictionary,learn,translate}
```

Komponen inti tidak bergantung pada layar tertentu — hanya props + token. Bisa diubah internalnya tanpa merusak pemanggil.

## Penanganan Error

- Font gagal dimuat → fallback ke font sistem; app tetap jalan.
- Komponen defensif: progress di-clamp 0–1 (seperti `store/useLearningStore.ts` sekarang).
- Tidak ada perubahan pada layer service/mock, sehingga error path data tetap sama.

## Verifikasi / Testing

- **Visual:** `npm run web` untuk cek cepat, lalu device/emulator; periksa tiap layar utama setelah diubah.
- **TypeScript:** `npx tsc --noEmit` harus bersih setelah refactor token & komponen.
- **Checklist anti-dempet:** tiap layar punya `screenPadding`; antar elemen pakai `gap`; tidak ada elemen menempel.
- **Aksesibilitas:** target sentuh ≥48px; kontras WCAG AA (palet sudah diverifikasi); `accessibilityLabel` dijaga.

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Menyentuh banyak file sekaligus → rawan rusak | Penerapan incremental layar-demi-layar, verifikasi tiap langkah |
| Penghapusan `constants/Colors.ts`/`Layout.ts` memutus import | Cari semua import lama, ganti ke `theme/` (shim sementara bila perlu) |
| Font gagal di SDK 54 | Fallback font sistem + tahan render sampai siap |

## Urutan Implementasi (ringkas)

1. Bangun `theme/` (token).
2. Buat primitif & layout (`Screen`, `Stack`, `Row`, `Section`, `Text`, `Heading`).
3. Setup font di `app/_layout.tsx`.
4. Poles komponen inti.
5. Terapkan per layar (incremental).
6. Verifikasi (`tsc`, web/device, checklist).
