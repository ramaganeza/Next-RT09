-- Tahap 11: masuk Area Warga cukup dengan SATU isian: No. KK ATAU NIK (kepala keluarga / anggota).
-- Cara lama (No. KK + NIK) tetap berfungsi. Aman dijalankan ulang.
create or replace function public._warga_cek(p_kk text, p_nik text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_kk text := regexp_replace(coalesce(p_kk,''),'\D','','g'); v_nik text := regexp_replace(coalesce(p_nik,''),'\D','','g');
        d jsonb; v_n int; v_sejak timestamptz; ok boolean := false; q text; r record;
begin
  select n, sejak into v_n, v_sejak from warga_gagal where kk = v_kk;
  if found and v_sejak < now() - interval '15 minutes' then delete from warga_gagal where kk = v_kk; v_n := 0; end if;
  if coalesce(v_n,0) >= 5 then return jsonb_build_object('error','terkunci'); end if;
  if length(v_nik) = 16 then
    select data into d from docs where coll = 'keluarga' and id = v_kk;
    if d is not null and coalesce(d->>'aktif','true') <> 'false' then
      ok := regexp_replace(coalesce(d->>'nikKepala',''),'\D','','g') = v_nik
         or exists (select 1 from jsonb_array_elements(coalesce(d->'anggota','[]'::jsonb)) a
                    where regexp_replace(coalesce(a->>'nik',''),'\D','','g') = v_nik and coalesce(a->>'status','Aktif') = 'Aktif');
    end if;
  elsif length(v_nik) = 0 and length(v_kk) = 16 then
    -- satu isian: cocokkan sebagai No. KK, atau sebagai NIK kepala / anggota aktif
    select data into d from docs where coll = 'keluarga' and id = v_kk and coalesce(data->>'aktif','true') <> 'false';
    if d is not null then ok := true;
    else
      for r in select data from docs where coll = 'keluarga' and coalesce(data->>'aktif','true') <> 'false' loop
        if regexp_replace(coalesce(r.data->>'kk',''),'\D','','g') = v_kk
           or regexp_replace(coalesce(r.data->>'nikKepala',''),'\D','','g') = v_kk
           or exists (select 1 from jsonb_array_elements(coalesce(r.data->'anggota','[]'::jsonb)) a
                      where coalesce(a->>'status','Aktif') = 'Aktif' and length(regexp_replace(coalesce(a->>'nik',''),'\D','','g')) >= 10
                        and right(v_kk, length(regexp_replace(a->>'nik','\D','','g'))) = regexp_replace(a->>'nik','\D','','g')) then
          d := r.data; ok := true; exit;
        end if;
      end loop;
    end if;
    if ok then v_kk := regexp_replace(coalesce(d->>'kk', ''),'\D','','g'); end if;
  end if;
  if not ok then
    insert into warga_gagal(kk,n,sejak) values (regexp_replace(coalesce(p_kk,''),'\D','','g'),1,now()) on conflict (kk) do update set n = warga_gagal.n + 1;
    return jsonb_build_object('error','tidak_cocok');
  end if;
  delete from warga_gagal where kk = regexp_replace(coalesce(p_kk,''),'\D','','g');
  return d || jsonb_build_object('id', coalesce((select id from docs where coll='keluarga' and data = d limit 1), v_kk));
end $$;
revoke all on function public._warga_cek(text,text) from public, anon, authenticated;
