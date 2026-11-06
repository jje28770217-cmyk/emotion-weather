-- ============================================================
-- 오늘의 감정 날씨 · Supabase 초기 설정 SQL
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run
-- (여러 번 실행해도 안전하도록 작성되어 있습니다)
-- ============================================================

-- ───────────── 1) 감정 기록 (본인만 접근) ─────────────
create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  weather    text not null check (weather in ('sunny', 'partly', 'cloudy', 'rain', 'thunder')),
  diary      text not null default '' check (char_length(diary) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)            -- 하루에 하나의 기록
);

alter table public.entries enable row level security;

-- 로그인한 사용자는 "자기 행"만 조회/추가/수정/삭제 가능
drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own" on public.entries
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own" on public.entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own" on public.entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own" on public.entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 비로그인(anon)은 감정 기록 테이블에 아무 권한이 없습니다.
revoke all on public.entries from anon;
grant select, insert, update, delete on public.entries to authenticated;

create index if not exists entries_user_date_idx on public.entries (user_id, entry_date desc);

-- ───────────── 2) 응원 방명록 (누구나 읽기·쓰기, 수정/삭제 불가) ─────────────
create table if not exists public.guestbook (
  id         uuid primary key default gen_random_uuid(),
  nickname   text not null check (char_length(btrim(nickname)) between 1 and 12),
  message    text not null check (char_length(btrim(message)) between 1 and 200),
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;

drop policy if exists "guestbook_select_all" on public.guestbook;
create policy "guestbook_select_all" on public.guestbook
  for select to anon, authenticated using (true);

-- 글자 수 검증은 위 check 제약조건이 DB 레벨에서 강제합니다.
drop policy if exists "guestbook_insert_all" on public.guestbook;
create policy "guestbook_insert_all" on public.guestbook
  for insert to anon, authenticated with check (true);

-- update / delete 정책을 만들지 않았으므로 브라우저에서는 수정·삭제가 불가능합니다.
revoke all on public.guestbook from anon, authenticated;
grant select, insert on public.guestbook to anon, authenticated;

create index if not exists guestbook_created_idx on public.guestbook (created_at desc);
