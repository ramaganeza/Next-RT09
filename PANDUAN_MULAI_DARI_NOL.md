# Panduan Memasang Ulang dari Nol (RT 09 / RW 01)

Ada 2 paket:
- **rt09-KODE-GITHUB.zip**: kode situs. BOLEH diunggah ke GitHub. Tidak berisi data warga.
- **rt09-DATA-RAHASIA.zip**: data asli warga dan keuangan. JANGAN diunggah ke GitHub, jangan dibagikan.

## A. Supabase (database)
1. supabase.com > New project (catat Project URL dan anon key di Settings > API; jangan pakai service_role).
2. SQL Editor > New query > tempel isi `supabase/SETUP_LENGKAP.sql` (di paket kode) > Run. Tidak boleh ada tulisan merah.
3. SQL Editor > New query > tempel isi `2_DATA_AWAL_ASLI.sql` (paket rahasia) > Run. Ini memasukkan 52 KK, kas, piutang, notulen, pengaturan.
4. Authentication > Users > Add user (email + kata sandi, centang Auto Confirm). Lalu Edit user > app_metadata: `{"rt_role":"owner"}` (Ketua RT) atau `{"rt_role":"admin"}` (pengurus lain).
5. Authentication > URL Configuration: isi Site URL dengan alamat situs GitHub Pages Anda.

## B. GitHub
1. Ekstrak `rt09-KODE-GITHUB.zip` ke folder repo (repo yang sama dengan sebelumnya boleh; ganti semua file).
2. Buka `src/config.js`, isi Project URL dan anon key dari langkah A1.
3. GitHub Desktop: Commit, Push. Settings > Pages > Source: GitHub Actions. Tunggu sekitar 2 menit.

## C. Cek
- Alamat situs: halaman depan tampil, tombol **Area Warga** dan **Area Pengurus** ada.
- Area Pengurus: masuk dengan email tadi. Data warga 52 KK dan keuangan tampil.
- Orang tanpa login tidak boleh melihat KK/NIK/kas (sudah diuji: hanya pengumuman, kegiatan, notulen, pertemuan, produk yang terbuka).

## D. Data warga lewat Google Sheets
`1_DATA_WARGA_ASLI.xlsx` (paket rahasia) berisi sheet Warga, Anggota, Iuran. Unggah ke Google Drive pribadi, edit, unduh .xlsx, lalu Data warga > Google Sheets > Impor. Setelah selesai, hapus salinan di komputer bersama.

## E. Yang masih perlu Anda isi
Kas ibu-ibu & piutang ibu-ibu (terakhir Jan 2026), laporan kas 16 Apr–14 Mei 2026, kolom November tulisan tangan, QRIS, foto & harga baju, UMKM, inventaris, aset, CCTV, nama sekretaris/seksi.
