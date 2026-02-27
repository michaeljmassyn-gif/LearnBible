-- ============================================================
-- LearnBible Schema v2
-- Run this ENTIRE file in Supabase SQL Editor to migrate.
-- This replaces the v1 schema completely.
-- ============================================================

-- ── Drop old v1 tables ─────────────────────────────────────
drop table if exists user_progress cascade;
drop table if exists verse_blanks cascade;
drop table if exists verses cascade;

-- ── Drop old triggers/functions ────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- ============================================================
-- PROFILES (unchanged from v1 — keep existing user data)
-- ============================================================
create table if not exists profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  username   text unique not null,
  first_name text not null,
  last_name  text not null,
  grade      text not null,
  level      integer not null default 1,
  xp         integer not null default 0,
  created_at timestamptz default now()
);

-- Re-create the auto-profile trigger
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, first_name, last_name, grade)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'grade'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- BIBLE STRUCTURE
-- ============================================================

-- ── Books (canonical 66 books) ──────────────────────────────
create table if not exists book (
  id          smallint primary key,          -- 1..66
  name        text not null,                 -- "Genesis"
  abbr        text not null,                 -- "Gen"
  api_bible_id text not null,               -- OSIS id used by api.bible e.g. "GEN"
  testament   text not null check (testament in ('OT','NT')),
  sort_order  smallint not null
);

-- ── Verse References (translation-independent) ──────────────
create table if not exists verse_ref (
  id       uuid primary key default gen_random_uuid(),
  book_id  smallint references book(id) not null,
  chapter  int not null,
  verse    int not null,
  unique (book_id, chapter, verse)
);

-- ── Translations ────────────────────────────────────────────
create table if not exists translation (
  id            text primary key,   -- 'KJV', 'ESV', etc.
  name          text not null,      -- 'King James Version'
  language_code text not null default 'en',
  provider      text not null,      -- 'api_bible' | 'local'
  provider_id   text,               -- api.bible bibleId
  license_type  text not null default 'unknown',
  allow_cache   boolean not null default true,
  active        boolean not null default true
);

-- ── Verse Text (cached per translation) ─────────────────────
create table if not exists verse_text (
  id             uuid primary key default gen_random_uuid(),
  verse_ref_id   uuid references verse_ref(id) on delete cascade not null,
  translation_id text references translation(id) not null,
  text           text not null,
  fetched_at     timestamptz default now(),
  unique (verse_ref_id, translation_id)
);

-- ── Tags (themes, packs, flags) ─────────────────────────────
create table if not exists tag (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  tag_type    text not null,   -- 'theme' | 'flag' | 'pack' | 'speaker'
  description text,
  unique (name, tag_type)
);

-- ── Verse Tags (many-to-many) ────────────────────────────────
create table if not exists verse_tag (
  verse_ref_id uuid references verse_ref(id) on delete cascade not null,
  tag_id       uuid references tag(id) on delete cascade not null,
  source       text not null default 'manual',  -- 'manual' | 'dataset' | 'ai_suggested'
  confidence   numeric not null default 1.0,
  primary key (verse_ref_id, tag_id)
);

-- ── Global Syllabus / Drip Rollout ───────────────────────────
create table if not exists verse_release (
  verse_ref_id      uuid references verse_ref(id) on delete cascade primary key,
  global_rank       int not null,       -- lower = introduced earlier
  global_difficulty numeric not null default 500,  -- 0..1000
  released          boolean not null default true
);

-- ── Questions (generic game engine) ─────────────────────────
create table if not exists question (
  id             uuid primary key default gen_random_uuid(),
  type           text not null,  -- 'BLANKS' | 'MATCH_REF' | 'WHO' | 'WHERE' | 'TIMELINE' | 'MCQ'
  verse_ref_id   uuid references verse_ref(id),
  translation_id text references translation(id),
  prompt         text,           -- override if needed; defaults to verse text
  answer_json    jsonb not null, -- type-specific answer config
  difficulty     numeric not null default 500,
  active         boolean not null default true,
  created_at     timestamptz default now(),
  unique (type, verse_ref_id, translation_id)
);

-- ============================================================
-- LEARNING STATE (SRS)
-- ============================================================

-- ── Per-user per-verse mastery state ────────────────────────
create table if not exists user_verse_state (
  user_id        uuid references profiles(id) on delete cascade not null,
  verse_ref_id   uuid references verse_ref(id) on delete cascade not null,
  introduced_at  timestamptz default now(),
  mastery        numeric not null default 0 check (mastery >= 0 and mastery <= 1),
  correct_streak int not null default 0,
  lapse_count    int not null default 0,
  last_seen_at   timestamptz,
  next_due_at    timestamptz default now(),
  primary key (user_id, verse_ref_id)
);

-- ── Attempt log (every question attempt) ─────────────────────
create table if not exists attempt (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade not null,
  question_id      uuid references question(id) not null,
  verse_ref_id     uuid references verse_ref(id),
  is_correct       boolean not null,
  response_time_ms int,
  created_at       timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_verse_ref_book    on verse_ref (book_id, chapter, verse);
create index if not exists idx_verse_text_ref    on verse_text (verse_ref_id, translation_id);
create index if not exists idx_uvs_user_due      on user_verse_state (user_id, next_due_at);
create index if not exists idx_verse_release_rank on verse_release (global_rank);
create index if not exists idx_question_type     on question (type, active);
create index if not exists idx_attempt_user      on attempt (user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles        enable row level security;
alter table book            enable row level security;
alter table verse_ref       enable row level security;
alter table translation     enable row level security;
alter table verse_text      enable row level security;
alter table tag             enable row level security;
alter table verse_tag       enable row level security;
alter table verse_release   enable row level security;
alter table question        enable row level security;
alter table user_verse_state enable row level security;
alter table attempt         enable row level security;

-- Public readable (game data)
create policy "profiles_public_read"   on profiles        for select using (true);
create policy "books_public_read"      on book            for select using (true);
create policy "verse_ref_public_read"  on verse_ref       for select using (true);
create policy "translation_public_read" on translation    for select using (true);
create policy "verse_text_public_read" on verse_text      for select using (true);
create policy "tag_public_read"        on tag             for select using (true);
create policy "verse_tag_public_read"  on verse_tag       for select using (true);
create policy "verse_release_public_read" on verse_release for select using (true);
create policy "question_public_read"   on question        for select using (active = true);

-- Profile: owner can update
create policy "profiles_owner_update"  on profiles        for update using (auth.uid() = id);

-- User verse state: owner only
create policy "uvs_owner_select" on user_verse_state for select using (auth.uid() = user_id);
create policy "uvs_owner_insert" on user_verse_state for insert with check (auth.uid() = user_id);
create policy "uvs_owner_update" on user_verse_state for update using (auth.uid() = user_id);

-- Attempt: owner only
create policy "attempt_owner_select" on attempt for select using (auth.uid() = user_id);
create policy "attempt_owner_insert" on attempt for insert with check (auth.uid() = user_id);

-- ============================================================
-- DAILY DIFFICULTY RECALCULATION (pg_cron)
-- ============================================================
-- Run once manually in Supabase SQL Editor to set up.
-- Requires pg_cron enabled: Dashboard → Database → Extensions → pg_cron
--
-- Uses Bayesian smoothing: new verses (0 attempts) stay at 500 until
-- real data accumulates. α=5 correct prior, β=3 wrong prior → ~60% assumed.
-- ============================================================

create or replace function update_question_difficulty()
returns void language sql security definer as $$
  update question q
  set difficulty = round((
    1.0 - (
      (coalesce(s.correct_count, 0) + 5.0) /
      (coalesce(s.total_count,   0) + 8.0)
    )
  ) * 1000)
  from (
    -- Rules:
    -- 1. Only each user's first 3 attempts per question.
    --    Measures inherent difficulty, not post-mastery performance.
    --    A power user who drills 100 times still contributes max 3 data points.
    -- 2. Exclude responses < 1500ms — physically impossible to read + fill
    --    both blanks that fast, almost certainly cheating.
    -- 3. Bayesian prior α=5, β=3 (~60% assumed correct).
    --    New verses with 0 valid attempts stay at seed default (500) — cold start safe.
    select
      question_id,
      count(*)                           as total_count,
      count(*) filter (where is_correct) as correct_count
    from (
      select
        user_id,
        question_id,
        is_correct,
        row_number() over (
          partition by user_id, question_id
          order by created_at asc
        ) as attempt_num
      from attempt
      where response_time_ms is null or response_time_ms >= 1500
    ) ranked
    where attempt_num <= 3
    group by question_id
  ) s
  where q.id = s.question_id
    and s.total_count > 0;

  -- Also sync verse_release.global_difficulty from active question difficulty.
  -- This is what the pool ordering (global_difficulty ASC) reads from.
  update verse_release vr
  set global_difficulty = (
    select round(avg(q.difficulty))
    from question q
    where q.verse_ref_id = vr.verse_ref_id
      and q.active = true
  )
  where exists (
    select 1 from question q
    where q.verse_ref_id = vr.verse_ref_id and q.active = true
  );
$$;

-- ── Activate cron (run once in Supabase SQL Editor) ──────────
-- Step 1: Dashboard → Database → Extensions → enable pg_cron
-- Step 2: Run this block:
--
--   select cron.schedule(
--     'update-question-difficulty',
--     '0 3 * * *',
--     'select update_question_difficulty()'
--   );
--
-- Step 3: Confirm with: select * from cron.job;
