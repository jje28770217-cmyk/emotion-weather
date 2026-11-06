import Icon from './Icon'
import { isLive } from '../lib/supabase'
import { resetDemo } from '../lib/api'

export const TABS = [
  { key: 'home', label: '오늘 기록', icon: 'home' },
  { key: 'calendar', label: '감정 달력', icon: 'calendar' },
  { key: 'stats', label: '감정 통계', icon: 'chart' },
  { key: 'guestbook', label: '응원 방명록', icon: 'chat' },
]

function Logo({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30">
      <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-xl shadow-soft" />
      <span className="font-display text-lg text-ink sm:text-xl">오늘의 감정 날씨</span>
    </button>
  )
}

export function Header({ tab, onTab, user, onLogin, onLogout }) {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="card mx-auto flex max-w-5xl items-center justify-between gap-3 !rounded-full px-4 py-2.5 sm:px-5">
        <Logo onClick={() => onTab('home')} />

        <nav className="hidden items-center gap-1 md:flex" aria-label="주 메뉴">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              aria-current={tab === t.key ? 'page' : undefined}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 ${
                tab === t.key ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:bg-white/60'
              }`}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLive ? (
            user ? (
              <>
                <span className="hidden max-w-[140px] truncate text-xs font-medium text-ink-soft lg:block">{user.email}</span>
                <button onClick={onLogout} className="btn-ghost btn-sm !px-3" title="로그아웃" aria-label="로그아웃">
                  <Icon name="logout" size={16} />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              </>
            ) : (
              <button onClick={onLogin} className="btn-primary btn-sm">
                로그인
              </button>
            )
          ) : (
            <span className="chip !bg-[#fff3c9] !text-[#8a6a14]" title="Supabase 연결 전 미리보기 모드입니다">
              데모 모드
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

export function MobileNav({ tab, onTab }) {
  return (
    <nav
      className="card fixed inset-x-3 bottom-3 z-30 flex items-center justify-around !rounded-full px-2 py-1.5 md:hidden"
      aria-label="하단 메뉴"
    >
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onTab(t.key)}
          aria-current={tab === t.key ? 'page' : undefined}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold transition ${
            tab === t.key ? 'bg-white text-brand shadow-sm' : 'text-ink-soft'
          }`}
        >
          <Icon name={t.icon} size={20} />
          {t.label.replace('오늘 ', '').replace('감정 ', '').replace('응원 ', '')}
        </button>
      ))}
    </nav>
  )
}

// 데모 모드일 때 화면 상단에 항상 표시되는 안내 (샘플 데이터임을 명확히)
export function DemoBanner({ onReset }) {
  if (isLive) return null
  return (
    <div className="mx-auto mt-3 max-w-5xl px-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f3dd9a] bg-[#fff8dc]/90 px-4 py-2.5 text-xs text-[#7d6212] sm:text-sm">
        <span>
          <b>데모 모드</b> · Supabase 연결 전이라 이 브라우저에만 저장돼요. <b>‘샘플’ 표시</b>는 미리보기용 가짜 데이터입니다.
        </span>
        <button
          onClick={() => {
            if (window.confirm('데모 데이터를 처음 상태(샘플)로 되돌릴까요?\n직접 쓴 데모 기록은 사라져요.')) {
              resetDemo()
              onReset()
            }
          }}
          className="rounded-full bg-white/80 px-3 py-1 font-semibold hover:bg-white"
        >
          데모 초기화
        </button>
      </div>
    </div>
  )
}

export function Toast({ toast }) {
  if (!toast) return null
  const tone = toast.type === 'error' ? 'bg-[#fde8ea] text-[#a8404f]' : 'bg-white text-ink'
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-44 z-50 flex justify-center px-4 md:bottom-8">
      <div
        role="status"
        key={toast.id}
        className={`animate-fade-up rounded-full px-5 py-3 text-sm font-semibold shadow-lift ${tone}`}
      >
        {toast.message}
      </div>
    </div>
  )
}
