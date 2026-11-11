-- Jalankan di Supabase > SQL Editor.
create table if not exists public.docs (
  coll text not null, id text not null, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), primary key (coll, id)
);
alter table public.docs enable row level security;
do $$ begin alter publication supabase_realtime add table public.docs; exception when duplicate_object then null; end $$;

-- Peran disimpan di app_metadata pengguna: rt_role = 'admin' (pengurus) atau 'owner' (Ketua RT).
-- Atur lewat Authentication > Users > Edit user > app_metadata: {"rt_role":"owner"}
create or replace function public.rt_role() returns text language sql stable as
$$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'rt_role', 'none') $$;

-- Publik (tanpa login): hanya informasi umum.
drop policy if exists "baca publik" on public.docs;
create policy "baca publik" on public.docs for select
  using (coll in ('pengaturan','kegiatan','pertemuan'));
-- Pengurus: baca semua (KK, kas, piutang, surat, sosial, dst).
drop policy if exists "baca pengurus" on public.docs;
create policy "baca pengurus" on public.docs for select
  using (public.rt_role() in ('admin','owner'));
drop policy if exists "tulis pengurus" on public.docs;
create policy "tulis pengurus" on public.docs for insert with check (public.rt_role() in ('admin','owner'));
drop policy if exists "ubah pengurus" on public.docs;
create policy "ubah pengurus" on public.docs for update using (public.rt_role() in ('admin','owner'));
drop policy if exists "hapus pengurus" on public.docs;
create policy "hapus pengurus" on public.docs for delete using (public.rt_role() in ('admin','owner'));
-- TAHAP 6 (login warga dengan KK): jangan buka tabel ke publik. Buat fungsi RPC "security definer"
-- yang menerima KK lalu mengembalikan hanya data keluarga itu, dengan pembatasan percobaan.
