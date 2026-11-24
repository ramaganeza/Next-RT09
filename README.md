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

## Tahap 17 – Berkas Excel/PDF/Word, Pengeluaran, Qurban ringkas
- Tidak perlu SQL baru. Cukup salin file baru (jangan timpa `src/config.js`), Commit, Push.
- Keuangan: tab **Pengeluaran** (daftar) + tombol **Berkas** (unduh Excel/PDF/Word, unggah Excel/CSV bila ada perubahan).
- Asal informasi ditambah: Pemkot Tangerang, DKM / Masjid, Lainnya (bisa diketik sendiri).
- Daftar penerima qurban dibuat ringkas; beranda umum hanya 3 pengumuman + tombol "Lihat semua".
- Data warga diurutkan menurut alamat pada KK.

## Tahap 18 – Aturan & SOP RT, beranda 3/4 pengumuman
- Tidak perlu SQL baru. Salin file baru (jangan timpa `src/config.js`), Commit, Push.
- Profil RT > tab **Aturan & SOP** (draf awal, bisa diubah di Pengaturan > Profil RT).
- Beranda: 3 pengumuman di HP, 4 di layar lebar; tombol "Lihat semua".
- Data contoh + keluarga Siti Hodijah: jalankan `supabase/tahap18_data_contoh.sql` di SQL Editor Supabase (sekali saja).

## Tahap 19 – Beranda UMKM/Fasilitas/Pengumuman, kas ibu-ibu, bahasa baku
- Tidak perlu SQL baru untuk kode. Salin berkas (jangan timpa `src/config.js`), Commit, Push. Label versi di sidebar: **v19**.
- Beranda: UMKM 2 (HP) / 6 (web), Fasilitas 2 / 6, Pengumuman 2 / 4; visi RT 09 di bagian paling bawah.
- Istilah pada tampilan disesuaikan ke bahasa formal dan baku.
- Pembaruan data (KK, kas ibu-ibu) memakai berkas SQL terpisah `tahap18_update_data_RAHASIA.sql` yang TIDAK boleh dimasukkan ke GitHub.

## Tahap 20 (v20) – Perbaikan tautan
- Tautan (album, Google Maps, CCTV, UMKM) kini dinormalkan otomatis menjadi `https://`; skema berbahaya (`javascript:`) ditolak.
- Nomor WhatsApp: mendukung `08…`, `+62…`, `8…`, serta beberapa nomor (diambil yang pertama); nomor tidak valid tidak menampilkan tombol.
- Tautan masuk (email) kini kembali ke alamat situs yang sama.

## Tahap 21 (v21)
- Beranda: kelurahan/kecamatan/kota kini di bawah "RT 09 / RW 01", ukuran kecil, maksimal 2 baris (HP dan web).
- Keuangan: tombol "Status iuran" membuka pengaturan status per bulan (Lunas / Belum / Perlu dicek).
- Jendela (modal) tampil di tengah layar; ikon panah carousel dipusatkan.
- Tombol "Lihat struktur pengurus" pada beranda pengurus dihapus.
- Foto contoh produk dan logo contoh UMKM: jalankan `supabase/tahap21_foto_contoh.sql` di Supabase (aman).
- Data keluarga tanpa hitungan ganda: gunakan `tahap21_data_keluarga_RAHASIA.sql` (terpisah; JANGAN ke GitHub).

## Tahap 22 (v22)
- Perbaikan: tombol status iuran membuka formulir "Tambah barang" karena atribut `data-iedit` bentrok dengan inventaris. Kini memakai `data-uied` dan tombol berlabel "Atur status".

Catatan Tahap 21: `supabase/tahap21_foto_contoh.sql` juga menambah 3 contoh pengumuman berposter (id `pg-contoh-*`). Foto produk dan logo UMKM baru tampil di situs publik setelah file SQL ini dijalankan di Supabase.

## Tahap 23 (v23) – Iuran Bapak-Bapak dan Ibu-Ibu
- Area Pengurus: tombol "Atur status" memuat dua bagian (Kas Bapak-Bapak dan Kas Ibu-Ibu), disimpan di dokumen iuran (`bulan` dan `ibu.bulan`).
- Area Warga: Iuran & tagihan menampilkan dua kotak bulanan terpisah.
- WAJIB: jalankan `supabase/tahap22_iuran_ibu.sql` di Supabase agar Area Warga dapat membaca status bulanan (Bapak-Bapak dan Ibu-Ibu).

## Tahap 24 (v24)
- Status bulanan menjadi acuan tunggakan: saat status iuran disimpan, daftar piutang (Bapak-Bapak dan Ibu-Ibu), total, keterangan otomatis ("Iuran bulan Mei s.d Juli + September 2026 (4 x Rp 30.000)"), tampilan Area Warga, dan grafik ikut menyesuaikan. Keterangan lama disimpan di `ketLama`. Iuran Ibu-Ibu per bulan: pengaturan `iuranIbu` (bawaan Rp100.000).
- Carousel di beranda publik: nomor, titik, tombol, dan geser otomatis kini aktif.
- Area Warga di HP: menu berada di bilah bawah.
- Data keuangan (Area Pengurus): status bulan Bapak-Bapak dan Ibu-Ibu disusun rapi per baris.

## Tahap 25 (v25)
- Area Warga: sesi login disimpan di peramban (localStorage, 24 jam). Setelah refresh, warga tetap masuk; tombol keluar menghapus sesi.
- Berkas JavaScript dan CSS di `index.html` kini memakai `?v=25` agar peramban tidak memakai berkas lama (cache). Naikkan angkanya setiap rilis.

## Tahap 26 (v26)
- Perbaikan: tombol **Batal** pada form Status iuran kini menutup form.
- Baru: Keuangan > Status iuran punya tombol **+ Tambah KK ke daftar iuran** dan **Keluarkan** per KK. KK yang dikeluarkan tidak dihitung di status, tunggakan, dan piutang (data tidak dihapus, bisa diikutkan lagi).
- Data warga kini memuat pendidikan, pekerjaan, dan status kawin (dari foto KK), serta KK baru Irwan Erlangga. Untuk situs GitHub Pages, jalankan `tahap26_data_keluarga_RAHASIA.sql` di Supabase (jangan diunggah ke GitHub).

## Tahap 27 (v27)
- Hero Pengaturan punya tombol **Kembali ke Beranda**.
- Pengaturan > Pembayaran: **Iuran bulanan** dibagi dua kartu (Bapak-Bapak dan Ibu-Ibu), masing-masing berisi komponen dan total. Nominal menjadi acuan hitungan tunggakan; saat diubah, jumlah dan keterangan piutang bulan berjalan dihitung ulang dari status bulanan tiap KK. Tidak perlu SQL baru.

## Tahap 28 (v28)
- Tombol kembali di hero Pengaturan kini hanya ikon, hanya tampil di HP.
- Struktur pengurus: tiap jabatan bisa diberi foto kecil (otomatis dikecilkan); tanpa foto tampil inisial. Bagan ditata ulang (kotak lebih ringkas, 2 kolom di HP, garis penghubung antar tingkat). Tidak perlu SQL baru.

## Tahap 29 (v29): Branding, Tampilan, dan Mode Demo
- **Pengaturan > Tampilan > Branding**: logo, nama aplikasi, judul & baris hero, tagline. Dipakai di sudut atas, hero, judul tab, kop surat, PDF, dan Area Warga.
- **Pengaturan > Tampilan > Tampilan & tata letak**: sudut kotak (Tajam/Sedang/Bulat), kerapatan, gaya hero (Gradasi/Polos/Ringkas), ukuran kotak menu, dan menu admin yang ditampilkan.
- **Mode Demo** (`src/demo.js`): buka `https://<situs>/?demo=1` untuk melihat aplikasi lengkap dengan data FIKTIF (RT 05 / RW 03, 14 KK contoh). Semua fitur pengurus bisa dicoba dan dikustomisasi (logo, nama, warna, tata letak); perubahan hanya tersimpan di tab browser pengunjung dan hilang saat ditutup atau tombol "Setel ulang" ditekan.
  - **Aman**: saat mode demo aktif, koneksi Supabase dimatikan sebelum dimuat, jadi data warga asli tidak pernah dibaca atau ditulis.
  - **Link khusus (opsional)**: tambahkan `DEMO_KODE:"rahasia123"` ke `src/config.js` milikmu (jangan menimpa kunci Supabase), lalu bagikan `?demo=rahasia123`. Tanpa baris itu, `?demo=1` berlaku untuk siapa pun.
  - Area Warga (login No. KK) tidak tersedia di mode demo.
- Tidak perlu SQL baru.

## Tahap 30 (v30)
- **Nominal iuran per KK**: di form Status iuran ada "Nominal khusus Bapak-Bapak / Ibu-Ibu" (kosong = standar). Tunggakan dan piutang memakai nominal khusus itu.
- **Excel iuran**: ekspor/impor sheet Iuran kini punya kolom `Lunas s.d Ibu (YYYY-MM)`, `Nominal khusus Bapak`, `Nominal khusus Ibu`, `Ikut iuran`. Perbaikan: impor tidak lagi menghapus status bulanan yang sudah ada.
- **Foto Ketua RW** bisa diatur di Pengaturan > Identitas & pengurus. Foto pengurus dan Ketua RW tampil di Area Warga > Info RT.
- **Mode demo** kini punya tombol "Lihat sebagai warga" untuk mencoba Area Warga (login dengan No. KK contoh yang tertera di pita merah) dan "Kembali ke pengurus".

## Tahap 31 (v31): Aplikasi bisa dipasang (PWA)
Situs kini bisa dipasang di layar utama Android dan iPhone (manifest, service worker, ikon, pita "Pasang aplikasi"). Lihat `PANDUAN_PASANG_APLIKASI.md` untuk cara pasang, serta jalur Google Play dan App Store.


## Tahap 32
- Spanduk lama pada Status iuran dihapus; diganti keterangan hanya bila ada baris 'Perlu konfirmasi'.
- Cache PWA naik ke v32.


## Tahap 33
- Menu ikon beranda pengurus dinamis (maks 2 baris; bila lebih ada ikon "Lainnya").
- Jarak kosong di bawah menu dihilangkan.
- Beranda warga: Surat diajukan di bawah Iuran; kotak bulan 6 kolom di HP/tablet.


## Tahap 34
- Menu ikon berwarna (beranda pengurus dan warga), tampilan login baru.
- Beranda pengurus: Perlu tindakan, kartu kas, statistik warga (L/P, umur).
- Inventaris berupa daftar avatar + tombol tambah; linimasa kegiatan dengan galeri, filter tahun, dan pencarian.


## Tahap 35-36
- Tema putih (06.00-17.30) dan hitam (petang-malam) otomatis; tombol matahari/bulan untuk Otomatis/Terang/Gelap.
- Palet baru senada (tosca), preset warna: Tosca (bawaan), Perunggu, Biru tegas, dll.
- Login pengurus (jendela dari halaman depan) dan login warga bergaya baru.
- Info dobel dihapus: kartu statistik beranda digabung ke Statistik warga; pintasan dobel di warga dan menu ikon di komputer disembunyikan.


## Tahap 37
- Tombol tema di pojok kanan atas hero halaman depan.
- Data warga di HP berupa daftar avatar ringkas; grafik saldo, pengingat, dan kartu kegiatan dirapikan.

## Tahap 38
- Filter kegiatan ringkas (pencarian + pilihan tahun + jenis yang bisa digeser).
- Foto asli barang inventaris dan foto fasum/fasos (ketuk gambar untuk mengganti).
- Halaman Keuangan HP lebih simpel (pilihan bagian + tombol Aksi; Berkas pindah ke Aksi).
- Menu halaman depan satu baris, sisanya masuk "Lainnya".
- Tombol WhatsApp Bendahara di bawah rekening/QRIS (nomor dapat diubah di Pengaturan > Pembayaran).
- Foto profil warga dari Area Warga, tampil di data warga pengurus. **Jalankan `supabase/tahap38_foto_profil.sql` sekali di Supabase SQL Editor.**

## Tahap 39
- Pengaturan > Pembayaran: kartu "WhatsApp Bendahara" (nomor dan nama dapat diubah kapan saja).
- Foto profil warga: tanpa foto tampil siluet sesuai jenis kelamin + inisial; pesan galat lebih jelas (jalankan `supabase/tahap38_foto_profil.sql` bila belum).
- Data warga di layar lebar tidak lagi dobel; Pertemuan dan Sosial & qurban dirapikan sesuai tema.
- Baru: absensi pertemuan per KK dan rekap kehadiran.
- Perbaikan: tombol Pengaturan > Tampilan (galat warna bawaan), visi-misi di Area Warga.

## Tahap 40
- Menu bawah HP berbentuk gelembung mengambang (gaya iOS) dengan ikon berwarna.
- Pilihan tema warna baru: Digital, Pastel, Luxury. Warna terang dan gelap disesuaikan otomatis sehingga teks selalu terbaca.

## Tahap 41
- Mode demo dilengkapi: NIK/KK, foto profil, UMKM, produk, inventaris, fasum, qurban, pengumuman, absensi, kas dan iuran terisi (data fiktif, ilustrasi sebagai foto sampel).
- Foto sampel ada di `src/demo_img.js`; boleh diganti dengan foto asli lewat menu Ubah foto.
- Nama aplikasi untuk warga: SIRUTA (tautan pasang https://bit.ly/SIRUTA09, demo https://bit.ly/SIRATA-Demo).
