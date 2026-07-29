# AmertaSign — Spesifikasi Kebutuhan API Backend

> Dokumen ini untuk tim backend (Next.js API Routes / Route Handlers).
> Frontend: aplikasi mobile **React Native + Expo SDK 54** (expo-router v6, Zustand, TypeScript).
> Semua service saat ini masih **mock in-memory** di sisi mobile dan siap diganti dengan panggilan API.

---

## 1. Gambaran Proyek

**AmertaSign** adalah aplikasi penerjemah bahasa isyarat Indonesia (BISINDO) dua arah:

| Fitur | Deskripsi | Layar |
|---|---|---|
| **Isyarat → Teks/Audio** | Kamera → teks & suara (TTS di sisi client via expo-speech) | `translate/camera` |
| **Teks/Audio → Isyarat** | Teks → visual peragaan isyarat | `translate/text-to-sign` |
| **Kamus Isyarat** | Cari kata BISINDO per kategori, favorit & riwayat pencarian | Tab **Dictionary** |
| **Riwayat Terjemahan** | **Hanya user login** yang riwayatnya tersimpan; **tamu tidak** | Tab **Home** |
| **Pengaturan** | Info bahasa isyarat (BISINDO), notifikasi, dsb. | Tab **Setting** |

**Aturan bisnis utama:**
1. Autentikasi memakai **username + password saja** (tanpa email, tanpa OAuth/Google).
2. Ada **mode tamu** (guest): bisa memakai semua fitur terjemahan, tetapi **riwayat tidak disimpan**.
3. Riwayat terjemahan user login tersimpan per akun (maks. tampil 50 terbaru di client).

---

## 2. Model Data (TypeScript types yang dipakai frontend)

```ts
type SignLanguageType = 'bisindo';
type DictionaryCategory = 'alfabet' | 'angka' | 'kata_umum' | 'frasa';

interface User {
  id: string;
  name: string;              // display name, boleh digenerate dari username
  username: string;          // unik, lowercase, regex: ^[a-z0-9._-]{3,20}$
  preferredSignLanguage: SignLanguageType;   // default 'bisindo'
  streak: number;
  avatarUrl?: string;
}

// Riwayat terjemahan (fitur inti yang butuh persist)
type TranslationKind = 'isyarat-ke-teks' | 'teks-ke-isyarat';

interface TranslationHistoryItem {
  id: string;
  kind: TranslationKind;
  text: string;                          // hasil terjemahan / teks input
  signLanguageType: SignLanguageType;
  createdAt: string;                     // ISO 8601
}

interface DictionaryEntry {
  id: string;
  word: string;
  category: DictionaryCategory;
  type: SignLanguageType;
  description: string;
  imageUrl: string;
  videoUrl: string;
}

// Hasil teks → isyarat
interface TextToSignResult {
  visualUrl: string;      // URL gambar/video peragaan
  description: string;
}
```

---

## 3. Endpoint yang Dibutuhkan

Base URL disarankan: `/api/v1`. Format response konsisten:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "USERNAME_TAKEN", "message": "..." } }
```

### 3.1 Auth (username + password)

| Method | Path | Body | Response | Catatan |
|---|---|---|---|---|
| POST | `/auth/register` | `{ username, password }` | `{ user, accessToken, refreshToken }` | Validasi username: `^[a-z0-9._-]{3,20}$`, password min. 6 karakter. Hash pakai bcrypt/argon2 |
| POST | `/auth/login` | `{ username, password }` | `{ user, accessToken, refreshToken }` | |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken }` | |
| POST | `/auth/logout` | — (Bearer) | `{ success }` | Invalidasi refresh token |
| GET | `/auth/me` | — (Bearer) | `{ user }` | Dipanggil saat app start (restore sesi) |

> **Mode tamu tidak butuh endpoint** — ditangani sepenuhnya di client (tidak ada data yang disimpan).

### 3.2 Riwayat Terjemahan (butuh auth — endpoint terpenting)

| Method | Path | Body/Query | Response |
|---|---|---|---|
| GET | `/history` | `?limit=50&cursor=...&kind=isyarat-ke-teks` | `{ items: TranslationHistoryItem[], nextCursor }` |
| POST | `/history` | `{ kind, text, signLanguageType }` | `{ item: TranslationHistoryItem }` |
| DELETE | `/history/:id` | — | `{ success }` |
| DELETE | `/history` | — | `{ success }` (hapus semua) |

Aturan: user hanya bisa akses riwayat miliknya (scope by user ID dari token). Request tanpa token valid → `401`.

### 3.3 Kamus

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/dictionary` | `?type=bisindo&category=alfabet&search=halo&limit&cursor` | `{ items: DictionaryEntry[], nextCursor }` |
| GET | `/dictionary/:id` | — | `{ entry: DictionaryEntry, related: DictionaryEntry[] }` |
| GET | `/dictionary/daily` | — | `{ entry: DictionaryEntry }` (kata pilihan hari ini) |
| GET | `/favorites` | — (Bearer) | `{ ids: string[] }` |
| PUT | `/favorites/:entryId` | — (Bearer) | `{ success }` (toggle/simpan) |
| DELETE | `/favorites/:entryId` | — (Bearer) | `{ success }` |

### 3.4 Terjemahan (integrasi model AI — bisa fase 2)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/translate/sign-to-text` | multipart `stage` + `file` (publik, tanpa token) | `{ text, kind, confidence, candidates, ... }` |
| POST | `/translate/text-to-sign` | `{ text, signLanguageType, avatar? }` | `TextToSignResult` |
| GET | `/translate/avatars` | — | `{ avatars: AvatarInfo[], default }` |

> Catatan: deteksi live kemungkinan berjalan on-device (TFLite/MediaPipe) atau via WebSocket streaming — perlu diskusi arsitektur. Untuk MVP, endpoint `text-to-sign` cukup mengembalikan URL aset video/gambar peragaan dari kamus.
>
> Deteksi otomatis huruf/angka/kata pada `sign-to-text` (usulan `stage=auto` + field `kind`) dijelaskan terpisah di [`BACKEND-AUTO-DETECT.txt`](./BACKEND-AUTO-DETECT.txt).

#### POST `/translate/sign-to-text`

Endpoint publik (tanpa `Authorization`). Body `multipart/form-data`:

| Field | Nilai |
|---|---|
| `stage` | `"abjad"` \| `"kata"` \| `"auto"` |
| `file` | gambar (`image/jpeg`, `image/png`, …) atau video (`video/mp4`, `video/quicktime`, …) maks **40 MB** |

- `stage="abjad"` — hanya gambar (video → `400 STAGE_MEDIA_MISMATCH`). Model huruf A–Z.
- `stage="kata"` — hanya video (gambar → `400 STAGE_MEDIA_MISMATCH`). Model angka + kata.
- `stage="auto"` — **baru**; server menentukan sendiri jenis isyarat:
  - `file` video → model kata dijalankan pada urutan frame **dan** model abjad pada
    sampling 5 frame diam (35%–65% durasi); kandidat terbaik kedua model dibandingkan,
    pemenangnya dikembalikan.
  - `file` gambar → cukup model abjad.
- Rekaman disarankan ≤15 detik, 720p, tanpa audio. Timeout proxy ≥300 detik
  (klien mobile memakai 120 detik).

Response `200` (contoh video peragaan huruf):

```json
{
  "success": true,
  "data": {
    "text": "A",
    "kind": "huruf",
    "confidence": 0.93,
    "stage": "auto",
    "mode": "BISINDO",
    "model_loaded": true,
    "candidates": [
      { "label": "A", "kind": "huruf", "confidence": 0.93 },
      { "label": "10", "kind": "angka", "confidence": 0.21 },
      { "label": "Mereka", "kind": "kata", "confidence": 0.08 }
    ],
    "note": null
  }
}
```

- `kind` (baru, additive): `"huruf" | "angka" | "kata"` — ditentukan **server** dari
  model/kelas asal label, bukan dari bentuk string. Juga hadir pada tiap elemen
  `candidates`. `null` bila `text` kosong.
- **Multi-gerakan** (baru, hanya `stage="auto"` + video): bila rekaman berisi
  beberapa isyarat berurutan, server membacanya dari awal lalu **menyambung**
  hasilnya di `text` — ejaan huruf digabung tanpa spasi (`"ABC"`), kata dipisah
  spasi (`"Makan Minum"`). Rinciannya ada di field additive `segments`
  (urut waktu; `null` bila hanya satu gerakan):

  ```json
  "text": "ABC",
  "kind": "huruf",
  "segments": [
    { "label": "A", "kind": "huruf", "confidence": 0.98, "startMs": 0,    "endMs": 933 },
    { "label": "B", "kind": "huruf", "confidence": 0.97, "startMs": 1000, "endMs": 1933 },
    { "label": "C", "kind": "huruf", "confidence": 0.99, "startMs": 2000, "endMs": 2933 }
  ]
  ```

  Cara kerja: ejaan huruf dideteksi dari run label stabil per frame (tahan tiap
  huruf ±0,5 dtk); rangkaian kata dipisah dengan **menurunkan tangan sejenak**
  (±0,5 dtk) di antara kata. Hold statis di tengah satu kata tidak dibaca
  sebagai ejaan selama model kata yakin (≥0,9), kecuali ada ≥3 huruf berbeda.
- Format label tidak berubah: huruf = satu karakter kapital (`"A"`), angka = digit
  (`"10"`), kata = kata biasa (`"Mereka"`).
- `text` diisi hanya bila `confidence >= 0.6` (`min_confidence` di `/health`). Di bawah
  ambang: `text=""`, `kind=null`, `note="Isyarat belum dikenali, coba ulangi."`.
- Tanpa tangan terdeteksi: `note="Tidak ada tangan terdeteksi."`.
- `stage="abjad"`/`"kata"` lama tetap berfungsi tanpa perubahan; `kind` ikut terkirim
  (klien lama aman mengabaikannya).

Error (envelope tetap):

```json
{ "success": false, "error": { "code": "STAGE_MEDIA_MISMATCH", "message": "Mode abjad membutuhkan gambar." } }
```

| Kode | Kondisi |
|---|---|
| `STAGE_MEDIA_MISMATCH` (400) | abjad+video atau kata+gambar |
| `UNSUPPORTED_MEDIA` (415) | ekstensi bukan gambar/video yang didukung |
| `MEDIA_TOO_LARGE` (413) | berkas > 40 MB |

> Catatan: model video belum memiliki kelas huruf (dataset `Dataset/Video/Huruf`
> belum tersedia di server). Pada `stage="auto"`, deteksi huruf dari video
> mengandalkan sampling frame diam → model abjad. Setelah dataset video huruf
> dikirim, model kata akan dilatih ulang dan pemisahan model angka dipertimbangkan.

#### POST `/translate/text-to-sign`

Body (field tak dikenal diabaikan — kompatibel dengan APK lama):

```json
{
  "text": "makan",
  "signLanguageType": "bisindo",
  "avatar": "female"
}
```

- `avatar` opsional: `"male" | "female"`. Tanpa field ini (atau nilai tak dikenal)
  server memakai avatar default (`male`).
- **Fallback, bukan error**: bila media untuk avatar yang diminta belum tersedia,
  server memakai avatar yang ada dan menandai `avatarFallback: true`.

Response `200`:

```json
{
  "success": true,
  "data": {
    "text": "makan",
    "signLanguageType": "bisindo",
    "avatar": "male",
    "avatarRequested": "female",
    "avatarFallback": true,
    "units": [
      {
        "token": "makan",
        "word": "Makan",
        "category": "kata_umum",
        "description": "Isyarat Makan",
        "videoUrl": "https://amertasign.lab-if.tech/api/v1/media/bisindo/kata/makan.mp4?v=2a9fd439a5",
        "imageUrl": "https://amertasign.lab-if.tech/api/v1/media/bisindo/kata/makan.jpg?v=31b29889b7",
        "mediaUrl": "https://amertasign.lab-if.tech/api/v1/media/bisindo/kata/makan.mp4?v=2a9fd439a5",
        "mediaType": "video",
        "matchType": "exact",
        "durationMs": 4534,
        "avatar": "male"
      }
    ],
    "unmatched": []
  }
}
```

- `durationMs` per unit: video = durasi asli (ms, hasil ffprobe saat ingest);
  image = durasi tahan yang disarankan untuk ejaan huruf (default `1600`);
  `null` hanya bila benar-benar tidak diketahui. Mobile memakainya untuk
  menjadwalkan gerakan berikutnya + timer cadangan.
- `avatar` (level `data`) = avatar yang benar-benar dipakai; `avatarRequested` =
  yang diminta klien / default; `avatarFallback` = `true` bila ada unit yang
  dialihkan ke avatar lain karena medianya belum ada.
- `avatar` per unit bisa berbeda-beda bila cakupan media avatar baru parsial.
- `description` ringkas untuk caption ≤ 2 baris: `matchType: "spelling"` →
  `"Huruf H"` / `"Angka 1"`; `matchType: "exact"` → maks ~60 karakter, tanpa
  mengulang kata "BISINDO".
- URL media berversi (`?v=<hash>`) dan dilayani dengan
  `Cache-Control: public, max-age=31536000, immutable` + dukungan `Range`
  (`206 Partial Content`) — aman di-cache permanen oleh player.

#### GET `/translate/avatars`

Ketersediaan karakter peraga; mobile memakainya untuk menonaktifkan pilihan
yang datanya belum siap. Response `200`:

```json
{
  "success": true,
  "data": {
    "avatars": [
      { "id": "male",   "label": "Laki-laki", "available": true,  "coverage": 1.0 },
      { "id": "female", "label": "Perempuan", "available": false, "coverage": 0.0 }
    ],
    "default": "male"
  }
}
```

`coverage` = rasio entri kamus yang sudah punya media untuk avatar tersebut
(0.0–1.0).

### 3.5 Profil & Preferensi

| Method | Path | Body | Response |
|---|---|---|---|
| PATCH | `/users/me` | `{ name?, avatarUrl?, preferredSignLanguage? }` | `{ user }` |
| PATCH | `/users/me/password` | `{ currentPassword, newPassword }` | `{ success }` |

---

## 4. Autentikasi & Keamanan

- **JWT Bearer** (access token pendek ~15 menit + refresh token). Client menyimpan token di `expo-secure-store`.
- Password: **argon2id/bcrypt**, jangan pernah dikembalikan di response.
- Rate limiting di `/auth/*` (mis. 5 percobaan/menit) untuk cegah brute force.
- Username disimpan lowercase & unik (unique index).
- CORS: batasi ke scheme app / origin dev Expo.
- Semua endpoint riwayat & favorit **wajib** memverifikasi kepemilikan resource.

---

## 5. Skema Database yang Disarankan (Prisma/PostgreSQL)

```prisma
model User {
  id                     String   @id @default(cuid())
  username               String   @unique
  passwordHash           String
  name                   String
  avatarUrl              String?
  preferredSignLanguage  String   @default("bisindo") // 'bisindo'
  streak                 Int      @default(0)
  createdAt              DateTime @default(now())
  histories              TranslationHistory[]
  favorites              Favorite[]
}

model TranslationHistory {
  id                String   @id @default(cuid())
  userId            String
  kind              String   // 'isyarat-ke-teks' | 'teks-ke-isyarat'
  text              String
  signLanguageType  String   // 'bisindo'
  createdAt         DateTime @default(now())
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
}

model DictionaryEntry {
  id          String @id @default(cuid())
  word        String
  category    String // 'alfabet' | 'angka' | 'kata_umum' | 'frasa'
  type        String // 'bisindo'
  description String
  imageUrl    String
  videoUrl    String
  favorites   Favorite[]

  @@index([type, category])
}

model Favorite {
  userId   String
  entryId  String
  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  entry    DictionaryEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@id([userId, entryId])
}
```

---

## 6. Titik Integrasi di Frontend (file yang akan diganti dari mock → API)

| File frontend | Fungsi mock sekarang | Diganti dengan |
|---|---|---|
| `services/auth.ts` | `signInWithUsername`, `signUpWithUsername`, `getCurrentUser`, `signOut` | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout` |
| `store/useHistoryStore.ts` | Simpan riwayat in-memory per userId | `GET/POST/DELETE /history` |
| `services/translation.ts` | `detectSign` (return teks dummy setelah 2s), `textToSign` (URL dummy) | `/translate/*` |
| `services/database.ts` | Favorit & riwayat pencarian kamus in-memory | `/favorites`, (opsional `/search-history`) |
| `constants/MockData.ts` | Data kamus statis (`dictionaryEntries`, `dailyWords`) | `GET /dictionary`, `/dictionary/daily` |

---

## 7. Prioritas Implementasi

1. **Fase 1 (MVP):** Auth (register/login/me/refresh) + Riwayat Terjemahan (CRUD) — ini yang membedakan user login vs tamu.
2. **Fase 2:** Kamus (list/detail/daily) + Favorit.
3. **Fase 3:** Endpoint terjemahan AI / streaming, profil lengkap, notifikasi.

---

## 8. Contoh Alur

```
[App start]  GET /auth/me (token dari secure-store) → restore sesi / redirect login
[Login]      POST /auth/login { username, password } → simpan token → tabs
[Tamu]       tidak ada request — semua lokal, riwayat tidak disimpan
[Terjemah]   user login selesai terjemah → POST /history { kind, text, signLanguageType }
[Home]       GET /history?limit=5 → tampilkan "Riwayat Terjemahan"
[Logout]     POST /auth/logout → hapus token lokal → layar login
```
