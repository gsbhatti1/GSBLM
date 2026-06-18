-- LM-21: LifeMode schema. Committed to repo (never live-only).
-- Privacy: events table stores NO page content or PII — only which template/step.

create extension if not exists "pgcrypto";

-- Curated task templates served to the extension (LM-24).
create table if not exists templates (
  id            text primary key,
  version       text not null,
  display_name  text not null,
  jurisdiction  text,
  match_hints   jsonb not null default '[]',
  steps         jsonb not null default '[]',
  updated_at    timestamptz not null default now()
);

-- Anonymous completion analytics (LM-22). No content, no PII.
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  anon_user_hash text not null,
  template_id   text not null,
  template_version text not null,
  step_id       text not null,
  status        text not null check (status in ('started','completed','abandoned','human_help_requested')),
  jurisdiction  text,
  ts            timestamptz not null default now()
);
create index if not exists events_template_idx on events (template_id, step_id, status);

-- Human-help directory (LM-18).
create table if not exists help_directory (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          text not null check (kind in ('local','veteran','crisis')),
  description    text not null,
  phone         text,
  url           text,
  jurisdiction  text not null default 'US'
);

-- Consent audit (LM-23): records that AI/analytics consent was given.
create table if not exists consent_log (
  id            uuid primary key default gen_random_uuid(),
  anon_user_hash text not null,
  scope         text not null check (scope in ('analytics','cloud_ai')),
  granted       boolean not null,
  ts            timestamptz not null default now()
);

-- RLS on everything.
alter table templates       enable row level security;
alter table events          enable row level security;
alter table help_directory  enable row level security;
alter table consent_log     enable row level security;

-- Public read for templates + help directory (anon key).
create policy templates_read on templates for select using (true);
create policy help_read on help_directory for select using (true);

-- Inserts go through the service role only (the API), so no anon write policies.
-- (Absence of a permissive policy = denied for anon, which is what we want.)
