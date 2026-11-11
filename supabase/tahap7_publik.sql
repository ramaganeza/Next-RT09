-- TAHAP 7: halaman depan umum + formulir laporan/pesanan/UMKM/sewa.
-- Tempel SELURUH isi berkas ini di SQL Editor Supabase (query baru), klik Run. Aman dijalankan berulang.

-- 1) Yang boleh dibaca TANPA login (tidak ada data pribadi warga di sini).
drop policy if exists "baca publik" on public.docs;
create policy "baca publik" on public.docs for select
  using (coll in ('pengaturan','kegiatan','pertemuan','umkm','produk','kalender','aset'));

-- 2) Kotak masuk: publik hanya boleh MENGIRIM lewat fungsi ini, tidak boleh membaca.
drop function if exists public.kirim_masukan(text,jsonb);
create or replace function public.kirim_masukan(p_jenis text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  if p_jenis is null or p_jenis not in ('laporan','pesanan','umkm','sewa') then
    return jsonb_build_object('error','jenis_tidak_valid');
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 6000 then
    return jsonb_build_object('error','data_tidak_valid');
  end if;
  -- batas pengaman: maksimal 60 kiriman per jam untuk seluruh RT (anti-spam)
  if (select count(*) from public.docs where coll = 'masukan' and updated_at > now() - interval '1 hour') >= 60 then
    return jsonb_build_object('error','terlalu_sering');
  end if;
  v_id := 'm-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text || '-' || substr(md5(random()::text), 1, 5);
  insert into public.docs(coll, id, data, updated_at)
  values ('masukan', v_id,
    jsonb_build_object('jenis', p_jenis, 'status', 'baru', 'dibuat', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'isi', p_data),
    now());
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.kirim_masukan(text,jsonb) from public;
grant execute on function public.kirim_masukan(text,jsonb) to anon, authenticated;

-- 3) Produk awal: baju spesial edisi RT 09 (foto dan harga diisi pengurus kemudian).
insert into public.docs(coll,id,data) values ('produk','baju-rt09',
 '{"nama":"Baju Spesial Edisi RT 09","deskripsi":"Baju seragam warga RT 09 edisi spesial. Foto dan harga menyusul.","harga":null,"ukuran":["S","M","L","XL","XXL","3XL"],"status":"Pre-order dibuka","foto":"","aktif":true,"urut":1}'::jsonb)
on conflict (coll,id) do nothing;
