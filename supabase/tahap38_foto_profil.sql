-- Tahap 38: warga dapat memasang FOTO PROFIL sendiri lewat Area Warga.
-- Foto disimpan pada data anggota (docs.keluarga.anggota[].foto) sehingga otomatis tampil di Area Pengurus.
-- Aman dijalankan ulang. Jalankan di Supabase > SQL Editor.
create or replace function public.warga_foto(p_kk text, p_nik text, p_nama text, p_foto text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d jsonb := public._warga_cek(p_kk,p_nik); arr jsonb; f text := coalesce(p_foto,'');
begin
  if d ? 'error' then return d; end if;
  if f <> '' and (f !~ '^data:image/(jpeg|png|webp);base64,' or length(f) > 60000) then
    return jsonb_build_object('error','foto_tidak_valid');
  end if;
  if not exists (select 1 from jsonb_array_elements(coalesce(d->'anggota','[]'::jsonb)) x
                 where x->>'nama' = p_nama and coalesce(x->>'status','Aktif') = 'Aktif') then
    return jsonb_build_object('error','anggota_tidak_ditemukan');
  end if;
  select jsonb_agg(case when x->>'nama' = p_nama
                        then (case when f = '' then x - 'foto' else x || jsonb_build_object('foto', f) end)
                        else x end order by ord)
    into arr from jsonb_array_elements(d->'anggota') with ordinality t(x, ord);
  update docs set data = jsonb_set(data, '{anggota}', arr), updated_at = now() where coll = 'keluarga' and id = d->>'id';
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.warga_foto(text,text,text,text) to anon, authenticated;
