-- รันใน Supabase > SQL Editor (หลังจากรัน supabase-setup.sql แล้ว)

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'staff' check (role in ('owner','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_owner() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles
    where user_id = auth.uid() and role = 'owner' and active)
$$;

create or replace function public.is_active_user() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles
    where user_id = auth.uid() and active)
$$;

-- ผู้ใช้ที่มีอยู่แล้วตอนนี้ (บัญชีที่คุณสร้างไว้) จะเป็น "เจ้าของ" อัตโนมัติ
insert into public.profiles (user_id, email, name, role)
select id, email, split_part(email, '@', 1), 'owner' from auth.users
on conflict (user_id) do nothing;

-- profiles: อ่านของตัวเอง หรือเจ้าของอ่านได้ทั้งหมด (เพิ่ม/แก้ไขทำผ่าน Edge Function เท่านั้น)
drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_owner());

-- shop_data: เฉพาะผู้ใช้ที่ยังเปิดใช้งานอยู่เท่านั้น
drop policy if exists "staff full access" on public.shop_data;
drop policy if exists "active users access" on public.shop_data;
create policy "active users access" on public.shop_data
  for all to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());
