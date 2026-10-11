-- One private request/schedule row per authenticated customer.
-- Run this migration manually in the Supabase SQL editor.
create table if not exists public.tiffin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  selected_dates date[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tiffin_requests_one_per_user unique (user_id)
);

create index if not exists tiffin_requests_status_updated_idx
  on public.tiffin_requests (status, updated_at desc);

alter table public.tiffin_requests enable row level security;

drop policy if exists "Customers can view their tiffin request" on public.tiffin_requests;
create policy "Customers can view their tiffin request"
  on public.tiffin_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Authenticated customers can view approved tiffin dates" on public.tiffin_requests;
create policy "Authenticated customers can view approved tiffin dates"
  on public.tiffin_requests for select
  using (auth.uid() is not null and status = 'approved');

drop policy if exists "Customers can create their tiffin request" on public.tiffin_requests;
create policy "Customers can create their tiffin request"
  on public.tiffin_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Customers can update their tiffin dates" on public.tiffin_requests;
create policy "Customers can update their tiffin dates"
  on public.tiffin_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.prevent_customer_tiffin_status_change()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and new.status <> old.status then
    raise exception 'Customers cannot change tiffin request status';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_customer_tiffin_status_change on public.tiffin_requests;
create trigger prevent_customer_tiffin_status_change
  before update on public.tiffin_requests
  for each row execute function public.prevent_customer_tiffin_status_change();

create or replace function public.set_tiffin_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tiffin_requests_updated_at on public.tiffin_requests;
create trigger set_tiffin_requests_updated_at
  before update on public.tiffin_requests
  for each row execute function public.set_tiffin_requests_updated_at();