-- ============================================
-- Fix: RLS infinite recursion
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop old policies
drop policy if exists "admin_full_access" on public.profiles;
drop policy if exists "user_read_own" on public.profiles;
drop policy if exists "user_update_own" on public.profiles;

-- Use a security definer function to check admin role (bypasses RLS)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Admin can do everything
create policy "admin_full_access" on public.profiles
  for all using (public.is_admin());

-- Users can read own profile
create policy "user_read_own" on public.profiles
  for select using (id = auth.uid());

-- Users can update own profile
create policy "user_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());
