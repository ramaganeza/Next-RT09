# Sistem Informasi RT 09 / RW 01

Aplikasi web statis (HTML, CSS, JavaScript) tanpa proses build. Data disimpan di Supabase (Postgres).

## Struktur
- `index.html`: HALAMAN DEPAN UMUM (tanpa login): info, kalender 12 bulan, struktur pengurus, UMKM, produk baju, fasilitas, laporan, rekening & QRIS.
- SATU TAUTAN SAJA: bagikan alamat `index.html` (alamat utama situs). Di halaman itu ada tombol **Area Warga** (login No. KK + NIK) dan **Area Pengurus** (login email). Setelah pengurus masuk, halaman otomatis berubah menjadi aplikasi pengurus.
- `pengurus.html` dan `warga.html` hanya mengarahkan ke `index.html` (supaya tautan lama tetap jalan).
- `src/app.js`: seluruh logika aplikasi (warga, surat, keuangan, pengingat, sosial & qurban, pengaturan).
- `src/shim.js`: lapisan data. Aplikasi memanggil `claude.use("db")`; berkas ini menjawabnya dengan Supabase. Untuk memakai backend lain (Firebase, API sendiri), ganti hanya berkas ini.
- `src/config.js`: alamat dan kunci publik Supabase.
- `supabase/schema.sql`: tabel dan aturan keamanan (RLS).
- `.github/workflows/pages.yml`: penayangan otomatis ke GitHub Pages.

## Langkah pemasangan
1. Buat repositori **privat** di GitHub dan unggah isi folder ini.
2. Buat proyek di supabase.com, jalankan `supabase/schema.sql`, lalu isi `src/config.js`.
3. Di Supabase Authentication, tambahkan pengurus dan beri `app_metadata` `{"rt_role":"owner"}` (Ketua RT) atau `{"rt_role":"admin"}`.
4. Aktifkan GitHub Pages (Settings > Pages > Source: GitHub Actions).
5. Pindahkan data dari versi Claude (minta Claude mengekspor koleksi ke JSON), lalu impor ke tabel `docs` (kolom `coll`, `id`, `data`).

Panduan uji coba: lihat `UJI_COBA.md`.

## Tahap 6: portal warga (`warga.html`)
Warga masuk dengan No. KK + NIK anggota keluarga, lalu melihat data keluarganya, tagihan iuran sendiri, dan mengajukan surat (masuk ke tab Surat pengurus sebagai "Menunggu"). Jalankan `supabase/tahap6_warga.sql` setelah `schema.sql`.
- Tabel `docs` tetap tertutup; warga hanya lewat fungsi `warga_masuk` dan `warga_ajukan_surat`, yang hanya mengembalikan data keluarganya sendiri.
- Salah memasukkan KK/NIK 5 kali mengunci keluarga itu 15 menit.
- Keluarga yang No. KK-nya belum tercatat (id `nokk-...`) belum bisa masuk; lengkapi dulu datanya.
- Keterbatasan: No. KK dan NIK adalah data yang relatif mudah diketahui orang dekat. Untuk keamanan lebih kuat tambahkan verifikasi OTP WhatsApp/SMS atau PIN yang dibagikan pengurus.

## Catatan keamanan
- Jangan menaruh data warga (NIK, KK, piutang) di repositori. Data hanya di Supabase.
- Halaman GitHub Pages bersifat publik walau repositori privat; keamanan data ada di RLS, bukan di halaman.
- `shim.js` belum diuji dengan proyek Supabase sungguhan; uji di proyek percobaan dulu.
- Login warga dengan KK (Tahap 6) perlu fungsi server (RPC) dengan pembatasan percobaan; lihat komentar di akhir `schema.sql`.

## Tahap 7: halaman depan umum dan akses pengurus
1. Jalankan `supabase/tahap7_publik.sql` di SQL Editor (aman diulang). Ini membuka baca-publik untuk umkm, produk, kalender, aset, dan membuat fungsi `kirim_masukan` untuk formulir (laporan, pesanan baju, usulan UMKM, pengajuan sewa). Kiriman masuk ke Kotak masuk pengurus; publik tidak bisa membacanya. Batas 60 kiriman per jam se-RT (anti spam).
2. Pengurus: buat pengguna di Supabase (Authentication > Users > Add user, isi email + kata sandi, centang Auto Confirm), lalu Edit user > app_metadata `{"rt_role":"owner"}` atau `{"rt_role":"admin"}`. Masuk lewat tombol Area Pengurus di halaman utama.
3. Untuk tautan masuk via email: Authentication > URL Configuration > Site URL dan Redirect URLs diisi alamat situs Pages Anda.
4. Rekening, QRIS, struktur, UMKM, produk, kalender, inventaris dan fasilitas diatur di aplikasi pengurus (menu Konten publik, Aset & inventaris, Konten publik > Pembayaran).
5. Foto disimpan di database (dikecilkan otomatis, di bawah 190 KB per gambar).

## Tahap 8 (CCTV Hikvision, Google Sheets, status iuran)
1. Supabase > SQL Editor: jalankan `supabase/tahap8_cctv.sql`.
2. Salin file baru ke repo (JANGAN menimpa `src/config.js` milik Anda), lalu Commit + Push di GitHub Desktop.
3. Area Pengurus > Data warga > **Google Sheets**: unduh template, isi di Google Sheets, unduh .xlsx, impor.
4. Aset & inventaris > **CCTV**; Keuangan > **Status iuran**. Baca `PANDUAN_CCTV.md`.

## Tahap 9 (album & CCTV khusus warga, halaman depan bersih)
1. Supabase > SQL Editor: jalankan `supabase/tahap9_album_cctv_warga.sql` (atau seluruh `SETUP_LENGKAP.sql`).
2. Album foto kini hanya tampil di **Area Warga setelah login**. Isi tautannya lagi di aplikasi pengurus (Pengaturan > Album foto); tautan disimpan tertutup, tidak lagi di data publik.
3. CCTV: di form kamera pilih akses **Warga (setelah login Area Warga)**.

## Tahap 10 – Area Warga ikonik, notifikasi, Tanah Wakaf
- Jalankan `supabase/tahap10_waqaf_warga.sql` di SQL Editor (atau gunakan `SETUP_LENGKAP.sql` terbaru untuk proyek baru). Ini menambahkan status Tanah Wakaf ke data keluarga yang dilihat warga setelah login.
- Area Warga: header bergaya aplikasi bank, lonceng notifikasi (tagihan, surat, pertemuan, pengumuman, wakaf), menu ikon.
- Jangan timpa `src/config.js` milik Anda saat menyalin paket baru.

## Tahap 11 – Login fleksibel, Area Warga bertab, struktur pop-up
- Jalankan `supabase/tahap11_login_fleksibel.sql` (atau `SETUP_LENGKAP.sql` terbaru untuk proyek baru): warga bisa masuk dengan No. KK ATAU NIK (kepala/anggota). Cara lama tetap berfungsi.
- Area Warga: menu ikon bertab (Beranda, Data keluarga, Iuran & tagihan, Surat RT, Info RT).
- Struktur pengurus tampil sebagai pop-up; data disinkronkan dengan Pengaturan (Ketua RT, Sekretaris, Bendahara). Ketua RW tampil di atas Ketua RT.

## Tahap 12 – Status iuran Jan–Des di Area Warga
- Jalankan `supabase/tahap12_iuran_bulan.sql` (atau `SETUP_LENGKAP.sql` terbaru). Warga melihat kolom Jan–Des (Lunas / Belum) berdasarkan "Lunas s.d" di menu Keuangan > Status iuran.
- Tombol Keluar diperbaiki; animasi grafik tetap bisa diputar dengan tombol ↻ walau HP memakai mode hemat gerak.
