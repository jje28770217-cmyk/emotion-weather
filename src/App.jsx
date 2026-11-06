import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WeatherBackground from './components/WeatherBackground'
import AuthModal from './components/AuthModal'
import MusicPlayer from './components/MusicPlayer'
import { DemoBanner, Header, MobileNav, TABS, Toast } from './components/Layout'
import Home from './pages/Home'
import CalendarPage from './pages/CalendarPage'
import StatsPage from './pages/StatsPage'
import Guestbook from './pages/Guestbook'
import { useAuth } from './lib/useAuth'
import * as api from './lib/api'

const tabFromHash = () => {
  const key = window.location.hash.replace('#', '')
  return TABS.some((t) => t.key === key) ? key : 'home'
}

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  const [tab, setTab] = useState(tabFromHash)
  const [mood, setMood] = useState(null) // 현재 배경에 반영되는 감정(없으면 기본 하늘)
  const [entries, setEntries] = useState([])
  const [authOpen, setAuthOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [resetCount, setResetCount] = useState(0)
  const toastTimer = useRef()

  // 주소창 #hash 로 탭을 유지 → 새로고침/뒤로가기에도 같은 화면
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goto = useCallback((key) => {
    window.location.hash = key
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const notify = useCallback((message, type = 'info') => {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message, type })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  // 로그인 사용자(또는 데모)의 감정 기록 불러오기
  const userId = user?.id
  useEffect(() => {
    if (!userId) {
      setEntries([])
      return undefined
    }
    let cancelled = false
    api
      .listEntries()
      .then((data) => !cancelled && setEntries(data))
      .catch((err) => !cancelled && notify(`기록을 불러오지 못했어요: ${err.message}`, 'error'))
    return () => {
      cancelled = true
    }
  }, [userId, resetCount, notify])

  // 로그아웃하면 배경도 기본 하늘로 되돌립니다
  useEffect(() => {
    if (!user) setMood(null)
  }, [user])

  const entriesByDate = useMemo(() => Object.fromEntries(entries.map((e) => [e.entry_date, e])), [entries])

  const saveEntry = useCallback(
    async (payload) => {
      const saved = await api.saveEntry(user, payload)
      setEntries((prev) => [...prev.filter((e) => e.entry_date !== saved.entry_date), saved])
      return saved
    },
    [user],
  )

  const deleteEntry = useCallback(
    async (date) => {
      await api.deleteEntry(user, date)
      setEntries((prev) => prev.filter((e) => e.entry_date !== date))
    },
    [user],
  )

  const requireLogin = useCallback(() => setAuthOpen(true), [])

  const common = { user, entries, entriesByDate, setMood, notify, requireLogin }

  return (
    <div className="min-h-screen">
      <WeatherBackground weather={mood} />
      <Header tab={tab} onTab={goto} user={user} onLogin={requireLogin} onLogout={signOut} />
      <DemoBanner onReset={() => setResetCount((c) => c + 1)} />

      <main key={tab} className="animate-fade-in max-md:pb-14">
        {loading ? (
          <p className="pt-32 text-center text-ink-soft">불러오는 중…</p>
        ) : (
          <>
            {tab === 'home' && <Home {...common} onSave={saveEntry} goto={goto} />}
            {tab === 'calendar' && <CalendarPage {...common} onSave={saveEntry} onDelete={deleteEntry} />}
            {tab === 'stats' && <StatsPage {...common} />}
            {tab === 'guestbook' && <Guestbook notify={notify} refreshKey={resetCount} />}
          </>
        )}
      </main>

      <MobileNav tab={tab} onTab={goto} />
      <MusicPlayer weather={mood} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSignIn={signIn} onSignUp={signUp} />
      <Toast toast={toast} />
    </div>
  )
}
