# 오늘의 감정 날씨 ☁️

하루의 감정을 다섯 가지 날씨로 기록하는 감성 일기 웹사이트.
React + Tailwind CSS + Supabase, Vercel 배포.

## 폴더 구조 (단순하게!)

```
src/
├─ App.jsx              화면 전체 조립 (탭 이동, 로그인, 데이터 불러오기)
├─ lib/
│  ├─ supabase.js       Supabase 연결 (.env 가 없으면 데모 모드)
│  ├─ api.js            ★ 데이터 읽기/쓰기는 전부 여기 (DB 관련 수정은 이 파일만)
│  ├─ useAuth.js        로그인 / 회원가입 / 로그아웃
│  ├─ weather.js        날씨 5종 이름·색·위로 메시지·배경 색
│  └─ date.js           날짜 계산 도우미
├─ components/          공통 UI (배경 애니메이션, 아이콘, 헤더, 로그인 창 …)
└─ pages/               Home(기록) · CalendarPage · StatsPage · Guestbook
supabase/schema.sql     DB 테이블 + 보안(RLS) 설정 SQL
```

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 배포용 빌드 확인
```

`.env` 가 없으면 **데모 모드**로 실행됩니다. (브라우저에만 저장, '샘플' 표시가 붙은 가짜 데이터 포함)

## Supabase 연결 (실제 저장)

1. https://supabase.com 에서 New project 생성
2. 왼쪽 **SQL Editor → New query** → `supabase/schema.sql` 전체 붙여넣기 → **Run**
3. **Authentication → Providers → Email** : 발표/과제용이라면 *Confirm email* 을 끄면 가입 즉시 로그인됩니다. (켜두면 인증 메일 클릭 필요)
4. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키 복사
5. `.env.example` 을 복사해 `.env` 로 만들고 두 값 입력 → 개발 서버 재시작

### 보안 구조

| 대상 | 규칙 |
| --- | --- |
| 감정 기록 `entries` | RLS: 로그인한 본인 행만 조회·수정·삭제. 비로그인은 접근 불가 |
| 방명록 `guestbook` | 누구나 읽기·쓰기, 수정/삭제 불가. 닉네임 12자·메시지 200자를 DB 제약조건으로 강제 |
| API 키 | 브라우저에는 공개용 `anon` 키만 사용. `service_role` 키는 절대 사용·저장하지 않음 |

## 배경음악 (BGM)

오른쪽 아래 플레이어에서 재생/일시정지, 볼륨, 음소거를 조절합니다. 고른 날씨에 따라 곡이 바뀌고(페이드 전환), 볼륨·음소거·재생 여부는 브라우저에 저장됩니다.

- **음원 파일이 없습니다.** 피아노·로파이 비트·빗소리·천둥을 브라우저(Web Audio)가 직접 합성해 연주하는 "자체 생성 음악"이라 저작권 문제가 없고, 배포할 때 따로 올릴 파일도 없습니다.
- 코드는 `src/lib/music.js`(엔진) 하나, 화면은 `src/components/MusicPlayer.jsx` 입니다.
- 곡 분위기(템포·코드·음계)는 `music.js` 의 `SCENES` 에서 수정할 수 있습니다.
- 브라우저 정책상 접속하자마자 자동 재생은 불가능합니다. 처음에는 재생 버튼을 눌러야 하고, 지난번에 켜 두었다면 화면을 한 번 누를 때 이어서 재생됩니다.

## GitHub + Vercel 배포

1. GitHub에서 새 저장소 생성 후, 이 `emotion-weather` 폴더를 올리기
2. https://vercel.com → **Add New → Project** → 저장소 선택 (Framework: Vite 자동 인식)
3. **Environment Variables** 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 입력 후 Deploy
4. (이메일 인증을 켰다면) Supabase **Authentication → URL Configuration → Site URL** 에 Vercel 주소 입력
