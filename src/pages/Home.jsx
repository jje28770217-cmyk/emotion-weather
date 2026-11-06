import { useEffect, useMemo, useRef, useState } from 'react'
import WeatherPicker from '../components/WeatherPicker'
import WeatherIcon from '../components/WeatherIcon'
import { WEATHER_MAP, pickMessage } from '../lib/weather'
import { DIARY_MAX } from '../lib/api'
import { calcStreak, formatLong, todayStr } from '../lib/date'
import { isLive } from '../lib/supabase'

export default function Home({ user, entries, entriesByDate, setMood, onSave, notify, requireLogin, goto }) {
  const today = useMemo(() => todayStr(), [])
  const todayEntry = entriesByDate[today]

  const [weather, setWeather] = useState(null)
  const [diary, setDiary] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const touched = useRef(false)

  // 오늘 이미 기록이 있으면 불러와서 보여줍니다 (사용자가 직접 바꾸기 전까지만)
  useEffect(() => {
    if (touched.current || !todayEntry) return
    setWeather(todayEntry.weather)
    setDiary(todayEntry.diary)
    setMessage(pickMessage(todayEntry.weather))
    setMood(todayEntry.weather)
  }, [todayEntry, setMood])

  const choose = (key) => {
    touched.current = true
    setWeather(key)
    setMood(key) // 배경이 이 감정에 맞게 부드럽게 바뀝니다
    setMessage(pickMessage(key))
  }

  const stats = useMemo(() => {
    const set = new Set(entries.map((e) => e.entry_date))
    const month = today.slice(0, 7)
    return {
      total: entries.length,
      month: entries.filter((e) => e.entry_date.startsWith(month)).length,
      streak: calcStreak(set),
    }
  }, [entries, today])

  const save = async (e) => {
    e.preventDefault()
    if (!weather) return notify('먼저 오늘의 날씨를 골라 주세요.', 'error')
    if (!user) return requireLogin()
    setSaving(true)
    try {
      await onSave({ entry_date: today, weather, diary })
      touched.current = false
      notify('오늘의 감정을 기록했어요 ☁️')
    } catch (err) {
      notify(`저장하지 못했어요: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const info = weather ? WEATHER_MAP[weather] : null

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-10 sm:px-6 sm:pt-16 md:pb-20">
      <section className="text-center">
        <span className="chip animate-fade-up !bg-white/75">{formatLong(today)}</span>
        <h1 className="mt-5 animate-fade-up font-display text-[2.6rem] leading-[1.2] text-ink [animation-delay:80ms] sm:text-6xl">
          오늘 당신의 마음은
          <br />
          어떤 <span className="bg-gradient-to-r from-[#f2a65a] via-[#e58aa8] to-[#7c8be0] bg-clip-text text-transparent">날씨</span>인가요?
        </h1>
        <p className="mx-auto mt-5 max-w-md animate-fade-up text-[15px] leading-relaxed text-ink-soft [animation-delay:160ms] sm:text-base">
          하루의 감정을 날씨로 고르고, 짧은 일기를 남겨 보세요.
          <br className="hidden sm:block" /> 쌓인 날씨가 당신의 마음 기후도를 그려 줄 거예요.
        </p>
      </section>

      <section className="mt-10 sm:mt-12">
        <WeatherPicker value={weather} onChange={choose} />
      </section>

      {info && (
        <section key={weather} className="mt-8 animate-fade-up">
          <div className="card flex items-center gap-4 p-5 sm:gap-5 sm:p-6">
            <WeatherIcon type={weather} size={64} className="shrink-0 animate-float" />
            <div>
              <p className="text-xs font-bold tracking-wide text-ink-faint">
                {info.label} · {info.desc}
              </p>
              <p className="mt-1 font-display text-xl leading-snug text-ink sm:text-2xl">“{message}”</p>
            </div>
          </div>

          <form onSubmit={save} className="card mt-4 p-5 sm:p-6">
            <label htmlFor="diary" className="mb-2 flex items-center justify-between text-sm font-bold">
              <span>오늘의 한 줄 일기</span>
              <span className="text-xs font-medium text-ink-faint">
                {diary.length} / {DIARY_MAX}
              </span>
            </label>
            <textarea
              id="diary"
              className="input min-h-[130px] resize-none leading-relaxed"
              maxLength={DIARY_MAX}
              value={diary}
              onChange={(e) => {
                touched.current = true
                setDiary(e.target.value)
              }}
              placeholder="오늘은 어떤 하루였나요? 짧아도 괜찮아요."
            />
            <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-faint">
                {isLive && !user ? '저장하려면 로그인이 필요해요.' : todayEntry ? '오늘 이미 기록했어요. 저장하면 수정돼요.' : '하루에 하나의 날씨를 기록할 수 있어요.'}
              </p>
              <button type="submit" disabled={saving} className="btn-primary sm:min-w-[180px]">
                {saving ? '저장 중…' : todayEntry ? '기록 수정하기' : '오늘의 기록 저장'}
              </button>
            </div>
          </form>
        </section>
      )}

      {stats.total > 0 && (
        <section className="mt-8 flex flex-wrap items-center justify-center gap-2 animate-fade-in">
          <span className="chip !bg-white/80">이번 달 {stats.month}일 기록</span>
          <span className="chip !bg-white/80">연속 {stats.streak}일째</span>
          <button onClick={() => goto('calendar')} className="chip !bg-white/80 hover:!bg-white">
            달력에서 보기 →
          </button>
        </section>
      )}
    </div>
  )
}
