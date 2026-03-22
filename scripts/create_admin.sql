Role-based Access Control

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- superadmin, manager, support
  description text null,
  created_at timestamptz default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- superadmin, manager, support
  description text null,
  created_at timestamptz default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g. create_product, delete_user
  description text null,
  created_at timestamptz default now()
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  constraint unique_role_permission unique (role_id, permission_id)
);

create table public.admins (
  id uuid not null default gen_random_uuid (),
  email text not null,
  password_hash text not null,
  name text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_verified boolean null default false,
  role_id uuid null,
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email),
  constraint admins_role_id_fkey foreign KEY (role_id) references roles (id)
) TABLESPACE pg_default;

create table public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  constraint unique_admin_permission unique (admin_id, permission_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admins(id),
  action text not null, -- e.g. CREATE_PRODUCT
  entity text not null, -- e.g. products, users
  entity_id uuid null,
  old_data jsonb null,
  new_data jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz default now()
);
