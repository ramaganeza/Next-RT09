-- Tahap 10: data Tanah Wakaf MBM ikut tampil di Area Warga (hanya untuk KK yang bersangkutan).
-- TAHAP 9: Area Warga menampilkan album foto dan CCTV khusus warga (hanya setelah login KK + NIK).
-- Jalankan di Supabase > SQL Editor. Aman diulang.
create or replace function public.warga_masuk(p_kk text, p_nik text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d jsonb := public._warga_cek(p_kk,p_nik); tag jsonb := '[]'::jsonb; sur jsonb; cam jsonb; alb text; seen text[] := '{}'; r record; e jsonb;
begin
  if d ? 'error' then return d; end if;
  for r in select data from docs where coll = 'piutang' order by data->>'periode' desc loop
    continue when (r.data->>'jenis') = any(seen);
    seen := seen || (r.data->>'jenis');
    for e in select * from jsonb_array_elements(coalesce(r.data->'items','[]'::jsonb)) loop
      if e->>'kkId' = d->>'id' then
        tag := tag || jsonb_build_object('jenis', r.data->>'jenis', 'periode', r.data->>'periode', 'jumlah', e->'jumlah', 'keterangan', e->>'keterangan', 'sementara', coalesce((r.data->>'sementara')::boolean,false));
      end if;
    end loop;
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'jenis',data->>'jenis','status',data->>'status','nomor',data->>'nomor','tanggal',data->>'tanggal','nama',data->>'nama') order by data->>'tanggal' desc), '[]'::jsonb)
    into sur from docs where coll = 'surat' and data->>'kkId' = d->>'id';
  select data->>'url' into alb from docs where coll='rahasia' and id='album';
  select coalesce(jsonb_agg(jsonb_build_object('nama',data->>'nama','lokasi',data->>'lokasi','tipe',data->>'tipe','url',data->>'url') order by data->>'nama'),'[]'::jsonb)
    into cam from docs where coll='cctv' and data->>'akses'='warga' and coalesce(data->>'aktif','true')<>'false';
  return jsonb_build_object('album', coalesce(alb,''), 'cctv', cam, 'keluarga', jsonb_build_object('kepala',d->>'kepala','alamat',d->>'alamat','hp',d->>'hp','hunian',d->>'hunian','waqaf',coalesce(d->>'waqaf',''),'kk',d->>'kk','anggota',coalesce(d->'anggota','[]'::jsonb)), 'tagihan', tag, 'surat', sur);
end $$;
grant execute on function public.warga_masuk(text,text) to anon, authenticated;
