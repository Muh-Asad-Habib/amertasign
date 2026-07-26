# Setup Login/Daftar dengan Google — Amerta Sign

Panduan mengaktifkan tombol **"Masuk dengan Google"** (login) dan **"Daftar dengan Google"** (register).

> **Mode saat ini: alur WEB via backend** (arahan dosen — client Android menyusul
> setelah rilis). Aplikasi TIDAK memakai expo-auth-session/client ID lokal lagi.

## Cara kerja singkat (alur web)

```
[App] tombol Google → buka browser ke {API}/api/v1/auth/google/start
  → [Backend] 302 ke halaman login Google (client_id WEB + redirect_uri https publik)
  → [Google] login → redirect ke {AMERTASIGN_PUBLIC_BASE_URL}/api/v1/auth/google/callback?code=...
  → [Backend] tukar code + CLIENT SECRET → verifikasi id_token → buat/ikat akun
  → [Backend] 302 deep link amertasign://google-auth?accessToken=...&refreshToken=...
  → [App] simpan token → GET /auth/me → masuk beranda
```

Semua konfigurasi ada di **server** (`~/amertasign-llm/backend/.env`):

| Variabel | Isi |
|---|---|
| `AMERTASIGN_GOOGLE_CLIENT_IDS` | Client ID Web (boleh + Android/iOS nanti, dipisah koma) |
| `AMERTASIGN_GOOGLE_CLIENT_SECRET` | Client secret dari client Web |
| `AMERTASIGN_PUBLIC_BASE_URL` | `https://amertasign.lab-if.tech` (domain gateway, tanpa trailing slash) |

## Syarat di Google Cloud Console (client tipe "Web application")

1. **Authorized redirect URIs** WAJIB memuat:
   `{AMERTASIGN_PUBLIC_BASE_URL}/api/v1/auth/google/callback`
   → `https://amertasign.lab-if.tech/api/v1/auth/google/callback`
2. **Authorized JavaScript origins** (opsional): `https://amertasign.lab-if.tech`
3. **OAuth consent screen → Authorized domains**: `lab-if.tech`
4. Selama consent screen berstatus **Testing**, hanya akun di daftar **Test users**
   yang bisa login — tambahkan akun Google penguji.

> ⚠️ Nilai `AMERTASIGN_PUBLIC_BASE_URL` di server dan redirect URI di Console harus
> **sama persis**. Backend memakai env tersebut untuk menyusun `redirect_uri`; kalau
> env masih menunjuk URL lama (mis. tunnel `*.trycloudflare.com`), Google menolak
> dengan `redirect_uri_mismatch` walaupun URI domain sudah didaftarkan.
> APK TIDAK perlu di-build ulang bila base URL server berubah.

## Verifikasi redirect URI yang benar-benar dipakai server

Jalankan dari mana saja (tidak perlu akses SSH) — periksa parameter `redirect_uri`
pada header `Location`:

```powershell
curl.exe -s -D - -o NUL "https://amertasign.lab-if.tech/api/v1/auth/google/start" |
  Select-String -Pattern "^location"
```

Hasil benar memuat `redirect_uri=https%3A%2F%2Famertasign.lab-if.tech%2Fapi%2Fv1%2Fauth%2Fgoogle%2Fcallback`.
Bila masih memuat host lain, perbaiki di server lalu restart backend:

```bash
cd ~/amertasign-llm/backend
sed -i 's|^AMERTASIGN_PUBLIC_BASE_URL=.*|AMERTASIGN_PUBLIC_BASE_URL=https://amertasign.lab-if.tech|' .env
grep PUBLIC_BASE .env
bash ~/deploy-server.sh
```

## Nanti, saat beralih ke client Android (setelah rilis)

1. Buat OAuth client tipe **Android**: package `com.devnolife.amertasign`,
   SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   (ambil ulang bila ganti keystore — lihat perintah di bawah).
2. Tambahkan client ID Android ke `AMERTASIGN_GOOGLE_CLIENT_IDS` di server.
3. Kembalikan `hooks/useGoogleAuth.ts` ke expo-auth-session (riwayat git commit
   sebelum alur web) dan isi `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` di `.env`.

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v `
  -keystore "D:\Coding\AmertaSign\AmertaSign-mobile\android\app\debug.keystore" `
  -alias androiddebugkey -storepass android | Select-String "SHA1"
```

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `Error 400: redirect_uri_mismatch` di halaman Google | Bandingkan `redirect_uri` pada pesan error dengan yang terdaftar di Console. Bila `redirect_uri` menunjuk host lama (mis. `*.trycloudflare.com`) padahal app memakai `amertasign.lab-if.tech`, berarti `AMERTASIGN_PUBLIC_BASE_URL` di server belum diperbarui/backend belum restart — lihat bagian "Verifikasi redirect URI". Bila host-nya sudah benar, tambahkan URI itu di **Authorized redirect URIs**. |
| `Error 403: access_denied` | Consent screen masih **Testing** dan akun bukan test user — tambahkan akunnya atau Publish app. |
| Alert `GOOGLE_LOGIN_DISABLED` | Salah satu env server kosong (`CLIENT_IDS`/`CLIENT_SECRET`/`PUBLIC_BASE_URL`) atau backend belum restart. |
| Alert `EXCHANGE_FAILED` | Client secret salah, atau redirect URI di console beda dengan `PUBLIC_BASE_URL` server. |
| Alert `INVALID_STATE` | Login didiamkan >10 menit — ulangi. |
| `Browser menampilkan JSON/error 502` | Gateway/backend mati — cek `https://amertasign.lab-if.tech/health` (harus 200), lalu restart backend di server. |
| `GOOGLE_UNREACHABLE` | Server tidak bisa mengakses internet/Google. |

