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
  email public.citext not null,
  password_hash text not null,
  name text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_verified boolean null default false,
  role_id uuid null,
  email_verification_token text null,
  email_verification_expires timestamp with time zone null,
  reset_password_token text null,
  reset_password_expires timestamp with time zone null,
  last_login_at timestamp with time zone null,
  failed_login_attempts integer null default 0,
  is_locked boolean null default false,
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email),
  constraint admins_role_id_fkey foreign KEY (role_id) references roles (id)
) TABLESPACE pg_default;

create table public.admin_sessions (
  id uuid not null default gen_random_uuid (),
  admin_id uuid not null,
  session_token text not null,
  user_agent text null,
  ip_address text null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  constraint admin_sessions_pkey primary key (id),
  constraint admin_sessions_session_token_key unique (session_token),
  constraint admin_sessions_admin_id_fkey foreign KEY (admin_id) references admins (id) on delete CASCADE
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

-- Enable Row Level Security on admin tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role_id ON admins(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_admin_id ON admin_permissions(admin_id);

-- Function to cleanup expired admin sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update admin's last login timestamp
CREATE OR REPLACE FUNCTION update_admin_last_login(p_admin_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE admins 
  SET last_login_at = NOW(), 
      failed_login_attempts = 0 
  WHERE id = p_admin_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment failed login attempts and lock account if needed
CREATE OR REPLACE FUNCTION increment_failed_login(p_admin_id uuid, p_max_attempts integer DEFAULT 5)
RETURNS boolean AS $$
DECLARE
  v_attempts integer;
BEGIN
  UPDATE admins 
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE id = p_admin_id
  RETURNING failed_login_attempts INTO v_attempts;
  
  IF v_attempts >= p_max_attempts THEN
    UPDATE admins SET is_locked = true WHERE id = p_admin_id;
    RETURN true; -- Account is now locked
  END IF;
  
  RETURN false; -- Account not locked
END;
$$ LANGUAGE plpgsql;
