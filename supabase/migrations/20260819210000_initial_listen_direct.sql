create extension if not exists pgcrypto;

create type public.app_role as enum ('demo', 'user', 'admin');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  display_name text not null check (char_length(display_name) between 2 and 120),
  default_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'failed')),
  route_mode text not null default 'adaptive' check (route_mode in ('adaptive', 'direct', 'standard')),
  primary_model text not null default 'Inkling Audio',
  consent_version text not null default '1.0',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table public.voice_turns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid references public.voice_sessions(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  duration_ms integer not null check (duration_ms between 0 and 3600000),
  route text not null check (route in ('direct', 'fallback')),
  model text not null check (char_length(model) between 1 and 120),
  latency_ms integer not null check (latency_ms between 0 and 600000),
  signal text not null default 'Unknown' check (char_length(signal) between 1 and 120),
  status text not null default 'complete' check (status in ('complete', 'flagged', 'failed')),
  transcript text,
  acoustic_signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.data_policies (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  shadow_transcripts boolean not null default true,
  consent_logging boolean not null default true,
  acoustic_signals boolean not null default true,
  raw_audio_retention_hours integer not null default 24 check (raw_audio_retention_hours between 0 and 8760),
  version integer not null default 1 check (version > 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 2 and 160),
  resource_type text not null check (char_length(resource_type) between 2 and 80),
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index organization_members_user_idx on public.organization_members(user_id);
create index voice_sessions_org_started_idx on public.voice_sessions(organization_id, started_at desc);
create index voice_turns_org_started_idx on public.voice_turns(organization_id, started_at desc);
create index voice_turns_session_idx on public.voice_turns(session_id);
create index audit_events_org_created_idx on public.audit_events(organization_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute procedure public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger data_policies_set_updated_at
before update on public.data_policies
for each row execute procedure public.set_updated_at();

create function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
  );
$$;

create function public.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

create function public.can_manage_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and role in ('user', 'admin')
  );
$$;

create function public.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = (select auth.uid()) or exists (
    select 1
    from public.organization_members viewer
    join public.organization_members target
      on target.organization_id = viewer.organization_id
    where viewer.user_id = (select auth.uid())
      and viewer.role = 'admin'
      and target.user_id = target_user_id
  );
$$;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_admin(uuid) from public;
revoke all on function public.can_manage_organization(uuid) from public;
revoke all on function public.can_view_profile(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;
grant execute on function public.can_manage_organization(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_id uuid := gen_random_uuid();
  requested_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  requested_organization text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), requested_name || ' Workspace');
  generated_slug text := left(regexp_replace(lower(requested_organization), '[^a-z0-9]+', '-', 'g'), 48)
    || '-' || substring(replace(organization_id::text, '-', '') from 1 for 8);
begin
  insert into public.organizations (id, name, slug, created_by)
  values (organization_id, requested_organization, trim(both '-' from generated_slug), new.id);

  insert into public.profiles (id, email, display_name, default_organization_id)
  values (new.id, new.email, requested_name, organization_id);

  insert into public.organization_members (organization_id, user_id, role)
  values (organization_id, new.id, 'admin');

  insert into public.data_policies (organization_id, updated_by)
  values (organization_id, new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute procedure public.handle_user_email_update();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.voice_sessions enable row level security;
alter table public.voice_turns enable row level security;
alter table public.data_policies enable row level security;
alter table public.audit_events enable row level security;

create policy "Members can view organizations"
on public.organizations for select to authenticated
using ((select public.is_organization_member(id)));

create policy "Admins can update organizations"
on public.organizations for update to authenticated
using ((select public.is_organization_admin(id)))
with check ((select public.is_organization_admin(id)));

create policy "Authorized users can view profiles"
on public.profiles for select to authenticated
using ((select public.can_view_profile(id)));

create policy "Users can update their profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and (
    default_organization_id is null
    or (select public.is_organization_member(default_organization_id))
  )
);

create policy "Members can view their membership"
on public.organization_members for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_organization_admin(organization_id)));

create policy "Admins can add organization members"
on public.organization_members for insert to authenticated
with check ((select public.is_organization_admin(organization_id)));

create policy "Admins can update organization members"
on public.organization_members for update to authenticated
using ((select public.is_organization_admin(organization_id)))
with check ((select public.is_organization_admin(organization_id)));

create policy "Admins can remove organization members"
on public.organization_members for delete to authenticated
using ((select public.is_organization_admin(organization_id)) and user_id <> (select auth.uid()));

create policy "Members can view voice sessions"
on public.voice_sessions for select to authenticated
using ((select public.is_organization_member(organization_id)));

create policy "Operators can create voice sessions"
on public.voice_sessions for insert to authenticated
with check (created_by = (select auth.uid()) and (select public.can_manage_organization(organization_id)));

create policy "Owners and admins can update voice sessions"
on public.voice_sessions for update to authenticated
using (created_by = (select auth.uid()) or (select public.is_organization_admin(organization_id)))
with check (
  (select public.is_organization_member(organization_id))
  and (created_by = (select auth.uid()) or (select public.is_organization_admin(organization_id)))
);

create policy "Members can view voice turns"
on public.voice_turns for select to authenticated
using ((select public.is_organization_member(organization_id)));

create policy "Operators can create voice turns"
on public.voice_turns for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.can_manage_organization(organization_id)));

create policy "Owners and admins can update voice turns"
on public.voice_turns for update to authenticated
using (user_id = (select auth.uid()) or (select public.is_organization_admin(organization_id)))
with check (
  (select public.is_organization_member(organization_id))
  and (user_id = (select auth.uid()) or (select public.is_organization_admin(organization_id)))
);

create policy "Members can view data policies"
on public.data_policies for select to authenticated
using ((select public.is_organization_member(organization_id)));

create policy "Operators can update data policies"
on public.data_policies for update to authenticated
using ((select public.can_manage_organization(organization_id)))
with check ((select public.can_manage_organization(organization_id)));

create policy "Admins can view audit events"
on public.audit_events for select to authenticated
using ((select public.is_organization_admin(organization_id)));

grant usage on schema public to authenticated;
grant select, update on public.organizations to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, default_organization_id) on public.profiles to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update on public.voice_sessions to authenticated;
grant select, insert, update on public.voice_turns to authenticated;
grant select, update on public.data_policies to authenticated;
grant select on public.audit_events to authenticated;
