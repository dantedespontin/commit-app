-- Commit: initial schema.
-- Athletes swipe on college programs, verified coaches swipe on athletes for their program,
-- and a mutual yes creates a match with a chat. Writes to swipes, matches and messages go
-- through the functions at the bottom so the recruiting and safety rules are always applied.

create extension if not exists pgcrypto;

create type public.user_role as enum ('athlete', 'coach', 'parent');
create type public.sport as enum ('tennis', 'soccer');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null,
  full_name text not null check (char_length(full_name) between 2 and 80),
  birth_date date,
  country text check (char_length(country) <= 60),
  -- Athlete plans: Starter €19.99, Pro €29.99, Elite €39.99 a month. Coaches and parents are free.
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'elite')),
  created_at timestamptz not null default now()
);

create table public.athletes (
  user_id uuid primary key references public.profiles on delete cascade,
  sport public.sport not null,
  grad_year int not null check (grad_year between 2024 and 2040),
  playing_position text check (char_length(playing_position) <= 40),
  utr numeric(4, 2) check (utr between 1 and 16.5),
  gpa numeric(3, 2) check (gpa between 0 and 5),
  height_cm int check (height_cm between 120 and 230),
  bio text check (char_length(bio) <= 500),
  video_url text check (video_url ~ '^https://'),
  -- Athletes under 18 stay hidden from coaches until a parent links their account.
  parent_id uuid references public.profiles on delete set null,
  parent_invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  parent_approved boolean not null default false
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  division text not null check (division in ('NCAA D1', 'NCAA D2', 'NCAA D3', 'NAIA', 'NJCAA')),
  conference text,
  state text not null,
  sport public.sport not null,
  about text check (char_length(about) <= 300),
  scholarship text,
  min_gpa numeric(3, 2),
  min_utr numeric(4, 2),
  -- Yearly tuition, housing and fees in USD, and the most athletic aid the program usually gives.
  cost_of_attendance int check (cost_of_attendance > 0),
  max_athletic_pct int not null default 100 check (max_athletic_pct between 0 and 100),
  -- Tennis facility photo, or a campus photo when there is none.
  photo_url text check (photo_url ~ '^https://'),
  -- Coaches who sign up with a confirmed address on this domain are verified automatically.
  email_domain text not null,
  created_at timestamptz not null default now(),
  unique (school_name, sport)
);

create table public.coaches (
  user_id uuid primary key references public.profiles on delete cascade,
  program_id uuid not null references public.programs on delete cascade,
  title text check (char_length(title) <= 60),
  verified boolean not null default false
);

-- When coaches may start messaging, by division and sport: unlock on
-- (grad_year - years_before_grad)-unlock_month-unlock_day. No row means no restriction.
-- These values must be confirmed by a compliance lawyer before launch.
create table public.contact_rules (
  division text not null,
  sport public.sport not null,
  years_before_grad int not null,
  unlock_month int not null check (unlock_month between 1 and 12),
  unlock_day int not null check (unlock_day between 1 and 31),
  primary key (division, sport)
);

insert into public.contact_rules (division, sport, years_before_grad, unlock_month, unlock_day) values
  ('NCAA D1', 'tennis', 2, 6, 15),
  ('NCAA D1', 'soccer', 2, 6, 15),
  ('NCAA D2', 'tennis', 2, 6, 15),
  ('NCAA D2', 'soccer', 2, 6, 15);

create table public.swipes (
  swiper_id uuid not null references public.profiles on delete cascade,
  athlete_id uuid not null references public.athletes on delete cascade,
  program_id uuid not null references public.programs on delete cascade,
  direction text not null check (direction in ('athlete_to_program', 'program_to_athlete')),
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (athlete_id, program_id, direction)
);
create index swipes_swiper_day on public.swipes (swiper_id, created_at);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes on delete cascade,
  program_id uuid not null references public.programs on delete cascade,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (athlete_id, program_id)
);

create table public.messages (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_match_time on public.messages (match_id, created_at);

create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  match_id uuid references public.matches on delete set null,
  reason text not null check (char_length(reason) between 3 and 1000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.age_on(birth date, d date default current_date)
returns int language sql immutable as $$
  select extract(year from age(d, birth))::int
$$;

-- Rough yearly cost to an athlete after aid, in USD, as a low-high range.
-- Tennis: athletic aid grows with how far the athlete's UTR is above the program's minimum
-- (25% at the minimum, +25% per full UTR point, up to the program's cap). Soccer has no
-- comparable rating, so the range runs from full athletic aid to none.
-- Academic merit aid: 20% off the rest for GPA 3.8+, 10% for 3.5+ (not at junior colleges).
-- This is an estimate to help athletes compare schools, not an offer.
create function public.estimate_cost(p_program uuid, p_athlete uuid)
returns table (cost_low int, cost_high int) language sql stable security definer set search_path = public as $$
  with x as (
    select pr.cost_of_attendance as coa, pr.max_athletic_pct as cap, pr.division, pr.sport, pr.min_utr, a.utr, a.gpa
      from programs pr, athletes a
     where pr.id = p_program and a.user_id = p_athlete and pr.cost_of_attendance is not null
  ), aid as (
    select coa, division,
           case
             when sport = 'tennis' and utr is not null and utr >= coalesce(min_utr, 0)
               then least(cap, 25 + 25 * floor(utr - coalesce(min_utr, utr))::int)
             when sport = 'tennis' then 0
             else cap
           end as best_pct,
           case
             when sport = 'tennis' and utr is not null and utr >= coalesce(min_utr, 0)
               then greatest(0, least(cap, 25 + 25 * floor(utr - coalesce(min_utr, utr))::int) - 25)
             else 0
           end as worst_pct,
           case when division = 'NJCAA' then 0 when gpa >= 3.8 then 20 when gpa >= 3.5 then 10 else 0 end as merit_pct
      from x
  )
  select (round(coa * (100 - best_pct) / 100.0 * (100 - merit_pct) / 100.0 / 500) * 500)::int,
         (round(coa * (100 - worst_pct) / 100.0 * (100 - merit_pct) / 100.0 / 500) * 500)::int
    from aid
$$;

-- An athlete is visible and can chat once they are 18 or a parent has linked their account.
create function public.athlete_is_active(p_athlete uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select a.parent_approved or public.age_on(p.birth_date) >= 18
       from athletes a join profiles p on p.id = a.user_id
      where a.user_id = p_athlete),
    false)
$$;

create function public.my_program()
returns uuid language sql stable security definer set search_path = public as $$
  select program_id from coaches where user_id = auth.uid() and verified
$$;

create function public.contact_unlock_date(p_athlete uuid, p_program uuid)
returns date language sql stable security definer set search_path = public as $$
  select make_date(a.grad_year - r.years_before_grad, r.unlock_month, r.unlock_day)
    from athletes a
    join programs pr on pr.id = p_program
    join contact_rules r on r.division = pr.division and r.sport = pr.sport
   where a.user_id = p_athlete
$$;

create function public.can_read_match(p_match uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches m
      join athletes a on a.user_id = m.athlete_id
     where m.id = p_match
       and (m.athlete_id = auth.uid()
            or m.program_id = public.my_program()
            or (a.parent_id = auth.uid() and a.parent_approved))
  )
$$;

-- ---------------------------------------------------------------------------
-- Row level security. Reads are scoped to the user; most writes go through functions.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.programs enable row level security;
alter table public.coaches enable row level security;
alter table public.contact_rules enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "update own profile" on public.profiles for update using (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, country) on public.profiles to authenticated;

create policy "read own or child athlete" on public.athletes for select
  using (user_id = auth.uid() or parent_id = auth.uid());
create policy "update own athlete" on public.athletes for update using (user_id = auth.uid());
revoke update on public.athletes from authenticated, anon;
grant update (playing_position, utr, gpa, height_cm, bio, video_url) on public.athletes to authenticated;

create policy "programs are public" on public.programs for select to authenticated using (true);
create policy "contact rules are public" on public.contact_rules for select to authenticated using (true);
create policy "read own coach row" on public.coaches for select using (user_id = auth.uid());

create policy "read matches I am part of" on public.matches for select using (public.can_read_match(id));
create policy "read messages in my matches" on public.messages for select using (public.can_read_match(match_id));
create policy "file reports" on public.reports for insert with check (reporter_id = auth.uid());

-- Chat updates arrive live in the app.
alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

create function public.complete_onboarding(
  p_role public.user_role,
  p_full_name text,
  p_birth_date date,
  p_country text,
  p_athlete jsonb default null,
  p_coach jsonb default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed boolean;
  v_domain text;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  if exists (select 1 from profiles where id = v_uid) then raise exception 'already_onboarded'; end if;

  if p_role = 'athlete' then
    if p_birth_date is null or public.age_on(p_birth_date) < 13 then
      raise exception 'too_young' using hint = 'Athletes must be at least 13.';
    end if;
  end if;

  insert into profiles (id, role, full_name, birth_date, country)
  values (v_uid, p_role, p_full_name, p_birth_date, p_country);

  if p_role = 'athlete' then
    insert into athletes (user_id, sport, grad_year, playing_position, utr, gpa, height_cm, bio, video_url, parent_approved)
    values (
      v_uid,
      (p_athlete->>'sport')::public.sport,
      (p_athlete->>'grad_year')::int,
      nullif(p_athlete->>'playing_position', ''),
      nullif(p_athlete->>'utr', '')::numeric,
      nullif(p_athlete->>'gpa', '')::numeric,
      nullif(p_athlete->>'height_cm', '')::int,
      nullif(p_athlete->>'bio', ''),
      nullif(p_athlete->>'video_url', ''),
      false
    );
  elsif p_role = 'coach' then
    select email, email_confirmed_at is not null into v_email, v_confirmed from auth.users where id = v_uid;
    select email_domain into v_domain from programs where id = (p_coach->>'program_id')::uuid;
    if v_domain is null then raise exception 'unknown_program'; end if;
    insert into coaches (user_id, program_id, title, verified)
    values (
      v_uid,
      (p_coach->>'program_id')::uuid,
      nullif(p_coach->>'title', ''),
      v_confirmed and lower(v_email) like '%@' || lower(v_domain)
    );
  end if;
end $$;

-- Programs for the signed-in athlete to swipe on. liked_you is only revealed on Pro and Elite.
create function public.get_program_deck(p_limit int default 20)
returns table (
  id uuid, school_name text, division text, conference text, state text, sport public.sport,
  about text, scholarship text, min_gpa numeric, min_utr numeric, photo_url text,
  cost_of_attendance int, cost_low int, cost_high int, liked_you boolean
) language sql stable security definer set search_path = public as $$
  select pr.id, pr.school_name, pr.division, pr.conference, pr.state, pr.sport, pr.about, pr.scholarship,
         pr.min_gpa, pr.min_utr, pr.photo_url, pr.cost_of_attendance, est.cost_low, est.cost_high,
         case when me.plan <> 'starter' then exists (
           select 1 from swipes s where s.athlete_id = a.user_id and s.program_id = pr.id
              and s.direction = 'program_to_athlete' and s.liked)
         end
    from athletes a
    join profiles me on me.id = a.user_id
    join programs pr on pr.sport = a.sport
    left join lateral public.estimate_cost(pr.id, a.user_id) est on true
   where a.user_id = auth.uid()
     and not exists (select 1 from swipes s where s.athlete_id = a.user_id and s.program_id = pr.id
                       and s.direction = 'athlete_to_program')
   order by pr.created_at
   limit p_limit
$$;

-- Athletes for a verified coach's program to swipe on.
create function public.get_athlete_deck(p_limit int default 20)
returns table (
  user_id uuid, full_name text, age int, country text, sport public.sport, grad_year int,
  playing_position text, utr numeric, gpa numeric, height_cm int, bio text, video_url text,
  contact_unlocks_on date
) language sql stable security definer set search_path = public as $$
  select a.user_id, p.full_name, public.age_on(p.birth_date), p.country, a.sport, a.grad_year,
         a.playing_position, a.utr, a.gpa, a.height_cm, a.bio, a.video_url,
         public.contact_unlock_date(a.user_id, pr.id)
    from programs pr
    join athletes a on a.sport = pr.sport
    join profiles p on p.id = a.user_id
   where pr.id = public.my_program()
     and public.athlete_is_active(a.user_id)
     and not exists (select 1 from swipes s where s.athlete_id = a.user_id and s.program_id = pr.id
                       and s.direction = 'program_to_athlete')
   order by a.grad_year, p.created_at
   limit p_limit
$$;

-- Record a swipe. Returns the match id when both sides have said yes.
create function public.swipe(p_target uuid, p_liked boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_plan text;
  v_athlete uuid;
  v_program uuid;
  v_dir text;
  v_other text;
  v_match uuid;
begin
  select role, plan into v_role, v_plan from profiles where id = v_uid;

  if v_role = 'athlete' then
    if not public.athlete_is_active(v_uid) then raise exception 'parent_approval_required'; end if;
    if v_plan = 'starter' and (select count(*) from swipes where swiper_id = v_uid
                              and created_at >= date_trunc('day', now())) >= 15 then
      raise exception 'daily_limit';
    end if;
    v_athlete := v_uid; v_program := p_target;
    v_dir := 'athlete_to_program'; v_other := 'program_to_athlete';
  elsif v_role = 'coach' then
    v_program := public.my_program();
    if v_program is null then raise exception 'coach_not_verified'; end if;
    if not public.athlete_is_active(p_target) then raise exception 'athlete_not_available'; end if;
    v_athlete := p_target;
    v_dir := 'program_to_athlete'; v_other := 'athlete_to_program';
  else
    raise exception 'not_allowed';
  end if;

  insert into swipes (swiper_id, athlete_id, program_id, direction, liked)
  values (v_uid, v_athlete, v_program, v_dir, p_liked)
  on conflict (athlete_id, program_id, direction)
  do update set liked = excluded.liked, swiper_id = excluded.swiper_id;

  if p_liked and exists (select 1 from swipes where athlete_id = v_athlete and program_id = v_program
                           and direction = v_other and liked) then
    insert into matches (athlete_id, program_id) values (v_athlete, v_program)
    on conflict (athlete_id, program_id) do nothing;
    select id into v_match from matches where athlete_id = v_athlete and program_id = v_program;
  end if;
  return v_match;
end $$;

-- Everything the Matches tab needs, for athletes, coaches and parents.
create function public.my_matches()
returns table (
  match_id uuid, created_at timestamptz, athlete_name text, school_name text, division text,
  sport public.sport, last_message text, last_at timestamptz, can_send boolean, contact_unlocks_on date
) language sql stable security definer set search_path = public as $$
  select m.id, m.created_at, p.full_name, pr.school_name, pr.division, pr.sport,
         lm.body, lm.created_at,
         case
           when m.closed_at is not null then false
           when m.athlete_id = auth.uid() then public.athlete_is_active(m.athlete_id)
           when m.program_id = public.my_program() then
             coalesce(public.contact_unlock_date(m.athlete_id, m.program_id) <= current_date, true)
           else false
         end,
         public.contact_unlock_date(m.athlete_id, m.program_id)
    from matches m
    join profiles p on p.id = m.athlete_id
    join programs pr on pr.id = m.program_id
    left join lateral (
      select body, created_at from messages where match_id = m.id order by created_at desc limit 1
    ) lm on true
   where public.can_read_match(m.id)
   order by coalesce(lm.created_at, m.created_at) desc
$$;

create function public.send_message(p_match uuid, p_body text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  m matches;
  v_id bigint;
  v_unlock date;
begin
  select * into m from matches where id = p_match;
  if m.id is null or m.closed_at is not null then raise exception 'match_closed'; end if;

  if m.athlete_id = auth.uid() then
    if not public.athlete_is_active(m.athlete_id) then raise exception 'parent_approval_required'; end if;
  elsif m.program_id = public.my_program() then
    v_unlock := public.contact_unlock_date(m.athlete_id, m.program_id);
    if v_unlock is not null and v_unlock > current_date then
      raise exception 'contact_locked' using hint = 'Coaches can message this athlete from ' || v_unlock;
    end if;
  else
    raise exception 'not_allowed';
  end if;

  insert into messages (match_id, sender_id, body) values (p_match, auth.uid(), trim(p_body))
  returning id into v_id;
  return v_id;
end $$;

-- Either side can close a match; the chat stays readable but nobody can send.
create function public.close_match(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update matches set closed_at = now()
   where id = p_match and (athlete_id = auth.uid() or program_id = public.my_program()
     or exists (select 1 from athletes a where a.user_id = matches.athlete_id and a.parent_id = auth.uid()));
end $$;

-- A parent links to their child with the code shown in the child's profile.
create function public.link_child(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_child uuid;
begin
  if (select role from profiles where id = auth.uid()) <> 'parent' then raise exception 'not_a_parent'; end if;
  update athletes set parent_id = auth.uid(), parent_approved = true
   where parent_invite_code = upper(trim(p_code)) and parent_id is null
  returning user_id into v_child;
  if v_child is null then raise exception 'invalid_code'; end if;
  return (select full_name from profiles where id = v_child);
end $$;

revoke execute on all functions in schema public from anon;
