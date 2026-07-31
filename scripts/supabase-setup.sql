-- Run once in the Supabase SQL editor.
create table if not exists public.portfolio_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_state enable row level security;

-- The Node backend uses the service-role key and bypasses RLS. Never expose that
-- key in VITE_* variables or client-side code.
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

-- Enforce portfolio invariants at the persistence boundary as well as in the API.
create or replace function public.validate_portfolio_state()
returns trigger
language plpgsql
as $$
declare
  featured_count integer;
  project_count integer;
  unique_project_count integer;
begin
  if new.id <> 'main' then
    return new;
  end if;

  if jsonb_typeof(coalesce(new.data->'projects', '[]'::jsonb)) <> 'array' then
    raise exception 'projects must be an array';
  end if;

  select count(*), count(distinct project->>'id'), count(*) filter (where coalesce((project->>'featured')::boolean, false))
  into project_count, unique_project_count, featured_count
  from jsonb_array_elements(coalesce(new.data->'projects', '[]'::jsonb)) project;

  if project_count <> unique_project_count then
    raise exception 'project ids must be unique';
  end if;
  if featured_count > 3 then
    raise exception 'only 3 projects can be featured';
  end if;
  if jsonb_typeof(coalesce(new.data#>'{achievements,recognitions}', '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(new.data#>'{achievements,certificates}', '[]'::jsonb)) <> 'array' then
    raise exception 'achievement recognitions and certificates must be arrays';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portfolio_state_validate on public.portfolio_state;
create trigger portfolio_state_validate
before insert or update on public.portfolio_state
for each row execute function public.validate_portfolio_state();

-- Durable, atomic rate limits for serverless deployments.
create table if not exists public.portfolio_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_rate_limits enable row level security;

create or replace function public.consume_portfolio_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.portfolio_rate_limits%rowtype;
  now_value timestamptz := now();
begin
  if length(p_key) < 8 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate-limit parameters';
  end if;

  insert into public.portfolio_rate_limits as limits (rate_key, window_started_at, request_count, updated_at)
  values (p_key, now_value, 1, now_value)
  on conflict (rate_key) do update set
    window_started_at = case
      when limits.window_started_at <= now_value - make_interval(secs => p_window_seconds) then now_value
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= now_value - make_interval(secs => p_window_seconds) then 1
      else limits.request_count + 1
    end,
    updated_at = now_value
  returning * into current_row;

  return query select
    current_row.request_count <= p_limit,
    greatest(0, p_limit - current_row.request_count),
    current_row.window_started_at + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_portfolio_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_portfolio_rate_limit(text, integer, integer) to service_role;
revoke all on table public.portfolio_rate_limits from public, anon, authenticated;
