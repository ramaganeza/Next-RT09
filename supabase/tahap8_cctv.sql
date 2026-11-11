-- TAHAP 8: kamera CCTV boleh dibaca umum HANYA bila diberi akses "umum".
-- Jalankan di Supabase > SQL Editor > New query > Run. Aman dijalankan berulang.
drop policy if exists "baca publik" on public.docs;
create policy "baca publik" on public.docs for select
  using (
    coll in ('pengaturan','kegiatan','pertemuan','umkm','produk','kalender','aset')
    or (coll = 'cctv' and data->>'akses' = 'umum')
  );
-- Koleksi 'iuran' (status iuran per KK) TIDAK dibuka untuk umum: hanya pengurus (aturan admin yang sudah ada).
