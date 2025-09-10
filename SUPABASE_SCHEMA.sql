-- Supabase schema (see README for details)
-- (abbreviated here; full in previous message if you need all comments)
create table if not exists public.projects (
  id text primary key, title text not null, tag text, blurb text, href text, cover_url text,
  status text check (status in ('draft','published','coming')) default 'draft',
  sort int default 100, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.project_pages (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null,
  subtitle text, hero_url text, body_html text, status text check (status in ('draft','published')) default 'draft',
  published_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.emm_articles (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null,
  subtitle text, hero_url text, body_html text, status text check (status in ('draft','published')) default 'draft',
  published_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.bio_pages (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text, hero_url text,
  body_html text, status text check (status in ('draft','published')) default 'draft',
  published_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.msb_pages (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text, hero_url text,
  body_html text, status text check (status in ('draft','published')) default 'draft',
  published_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(), email text not null, source text, created_at timestamptz default now()
);
create table if not exists public.emm_contribs (
  id uuid primary key default gen_random_uuid(), article_slug text, name text not null, email text not null, type text, message text not null, created_at timestamptz default now()
);
alter table public.projects enable row level security;
alter table public.project_pages enable row level security;
alter table public.emm_articles enable row level security;
alter table public.bio_pages enable row level security;
alter table public.msb_pages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.emm_contribs enable row level security;
create policy "read published projects" on public.projects for select using ( status in ('published','coming') );
create policy "read published project pages" on public.project_pages for select using ( status = 'published' );
create policy "read published articles" on public.emm_articles for select using ( status = 'published' );
create policy "read published bio" on public.bio_pages for select using ( status = 'published' );
create policy "read published msb" on public.msb_pages for select using ( status = 'published' );
create policy "subscribe anyone" on public.subscriptions for insert with check ( true );
create policy "contribute anyone" on public.emm_contribs for insert with check ( true );
create policy "editor writes projects" on public.projects for all using ( auth.email() = 'you@example.com' ) with check ( auth.email() = 'you@example.com' );
create policy "editor writes project pages" on public.project_pages for all using ( auth.email() = 'you@example.com' ) with check ( auth.email() = 'you@example.com' );
create policy "editor writes articles" on public.emm_articles for all using ( auth.email() = 'you@example.com' ) with check ( auth.email() = 'you@example.com' );
create policy "editor writes bio" on public.bio_pages for all using ( auth.email() = 'you@example.com' ) with check ( auth.email() = 'you@example.com' );
create policy "editor writes msb" on public.msb_pages for all using ( auth.email() = 'you@example.com' ) with check ( auth.email() = 'you@example.com' );
create or replace function public.set_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects for each row execute procedure public.set_updated_at();
drop trigger if exists trg_project_pages_updated on public.project_pages;
create trigger trg_project_pages_updated before update on public.project_pages for each row execute procedure public.set_updated_at();
drop trigger if exists trg_emm_articles_updated on public.emm_articles;
create trigger trg_emm_articles_updated before update on public.emm_articles for each row execute procedure public.set_updated_at();
drop trigger if exists trg_bio_pages_updated on public.bio_pages;
create trigger trg_bio_pages_updated before update on public.bio_pages for each row execute procedure public.set_updated_at();
drop trigger if exists trg_msb_pages_updated on public.msb_pages;
create trigger trg_msb_pages_updated before update on public.msb_pages for each row execute procedure public.set_updated_at();
