# Panduan: Aplikasi RT 09 di HP (Android & iPhone)

Situs ini sudah menjadi **PWA** (Progressive Web App): bisa dipasang di layar utama HP seperti aplikasi biasa, tanpa toko aplikasi, gratis, dan otomatis ikut pembaruan setiap kali kamu Push ke GitHub.

## 1. Pasang langsung dari browser (gratis, sudah siap)
**Android (Chrome):** buka situs, tunggu pita "Pasang aplikasi RT 09" muncul, ketuk **Pasang**. Atau menu titik tiga > *Instal aplikasi* / *Tambahkan ke layar utama*.
**iPhone/iPad (wajib Safari):** buka situs, ketuk ikon **Bagikan** (kotak dengan panah), pilih **Tambahkan ke Layar Utama**, lalu **Tambah**.
**Komputer (Chrome/Edge):** ikon pasang di ujung kanan kolom alamat.

Setelah terpasang, aplikasi terbuka layar penuh dengan ikon RT 9. Tampilan dasar tetap terbuka saat offline, tetapi data warga butuh internet.
Bagikan ke warga cukup dengan **link situs + petunjuk di atas** (atau poster panduan).

## 2. Google Play Store (Android) — opsional
Pilih "Trusted Web Activity" (membungkus PWA ini jadi aplikasi Play Store, tanpa menulis ulang kode).
1. Daftar **Google Play Console** (biaya sekali bayar sekitar US$25; verifikasi identitas).
2. Buka **pwabuilder.com**, masukkan alamat situs, pilih paket **Android**, unduh paket (.aab) dan file penanda tangan.
3. Tambahkan berkas `/.well-known/assetlinks.json` yang diberikan PWABuilder ke repo (agar bilah alamat browser hilang).
4. Unggah .aab ke Play Console, isi deskripsi, tangkapan layar (pakai gambar dari buku panduan), kebijakan privasi, lalu ajukan tinjau.
Catatan: aplikasi yang memuat data pribadi (NIK, KK) wajib punya **halaman kebijakan privasi** dan formulir "Data safety".

## 3. Apple App Store (iOS) — opsional, lebih sulit
Apple menolak aplikasi yang hanya "bungkus situs" tanpa fungsi tambahan (Pedoman 4.2). Jalur yang realistis:
1. Siapkan **Mac** dengan Xcode dan akun **Apple Developer** (US$99 per tahun).
2. Bungkus dengan **Capacitor** (`npx cap add ios`), tambahkan fungsi asli seperti notifikasi atau berbagi file agar lolos tinjau.
3. Unggah lewat Xcode ke App Store Connect dan ajukan tinjau.
Rekomendasi: untuk iPhone, cukup pakai langkah 1 (Tambahkan ke Layar Utama). Pertimbangkan App Store hanya bila aplikasi dijual ke banyak RT.

## 4. Berkas yang ditambahkan
`manifest.webmanifest`, `sw.js`, `icons/` (192, 512, maskable 512, apple-touch 180), `src/pwa.js` (pita pasang). Tidak perlu SQL baru. Setelah Push, tekan Ctrl+F5; di HP, tutup lalu buka ulang aplikasi untuk memuat versi baru.
