import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import WeatherIcon from '../components/WeatherIcon'
import WeatherPicker from '../components/WeatherPicker'
import LoginGate, { PageTitle, SampleBadge } from '../components/LoginGate'
import { WEATHER_MAP, pickMessage } from '../lib/weather'
import { DIARY_MAX } from '../lib/api'
import { DOW_LABELS, formatLong, monthGrid, todayStr } from '../lib/date'

// 선택한 날짜의 기록 보기 / 작성 / 수정 / 삭제 패널
function DayPanel({ date, entry, onSave, onDelete, notify, setMood }) {
  const [editing, setEditing] = useState(!entry)
  const [weather, setWeather] = useState(entry?.weather ?? null)
  const [diary, setDiary] = useState(entry?.diary ?? '')
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)

  const run = async (fn, okMsg) => {
    setBusy(true)
    try {
      await fn()
      notify(okMsg)
      return true
    } catch (err) {
      notify(`처리하지 못했어요: ${err.message}`, 'error')
      return false
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    if (!weather) return notify('날씨를 골라 주세요.', 'error')
    const ok = await run(() => onSave({ entry_date: date, weather, diary }), '기록을 저장했어요.')
    if (ok) setEditing(false)
  }

  const remove = async () => {
    const ok = await run(() => onDelete(date), '기록을 삭제했어요.')
    if (ok) {
      setConfirmDel(false)
      setWeather(null)
      setDiary('')
      setEditing(true)
    }
  }

  const info = entry ? WEATHER_MAP[entry.weather] : null

  return (
    <div className="animate-fade-up">
      <p className="text-xs font-bold tracking-wide text-ink-faint">{formatLong(date)}</p>

      {!editing && entry ? (
        <>
          <div className="mt-3 flex items-center gap-4">
            <WeatherIcon type={entry.weather} size={64} className="animate-float" />
            <div>
              <p className="flex items-center gap-2 font-display text-2xl">
                {info.label}
                {entry.sample && <SampleBadge />}
              </p>
              <p className="text-sm text-ink-soft">{info.desc}</p>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-white/70 p-4 text-[15px] leading-relaxed">
            {entry.diary || <span className="text-ink-faint">작성한 일기가 없어요.</span>}
          </p>
          <p className="mt-3 text-sm italic text-ink-soft">“{pickMessage(entry.weather)}”</p>

          {confirmDel ? (
            <div className="mt-5 rounded-2xl bg-[#fde8ea]/80 p-4">
              <p className="text-sm font-semibold text-[#a8404f]">이 기록을 삭제할까요? 되돌릴 수 없어요.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={remove} disabled={busy} className="btn-danger btn-sm">
                  삭제
                </button>
                <button onClick={() => setConfirmDel(false)} className="btn-ghost btn-sm">
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(true)} className="btn-primary btn-sm">
                <Icon name="edit" size={15} /> 수정
              </button>
              <button onClick={() => setConfirmDel(true)} className="btn-ghost btn-sm">
                <Icon name="trash" size={15} /> 삭제
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-3">
          <p className="mb-3 font-display text-xl">{entry ? '기록 수정하기' : '이 날의 감정 기록하기'}</p>
          <WeatherPicker
            compact
            value={weather}
            onChange={(k) => {
              setWeather(k)
              setMood(k)
            }}
          />
          <textarea
            className="input mt-3 min-h-[110px] resize-none leading-relaxed"
            maxLength={DIARY_MAX}
            value={diary}
            onChange={(e) => setDiary(e.target.value)}
            placeholder="그날은 어떤 하루였나요?"
            aria-label="일기"
          />
          <div className="mt-1 text-right text-xs text-ink-faint">
            {diary.length} / {DIARY_MAX}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={save} disabled={busy} className="btn-primary btn-sm">
              {busy ? '저장 중…' : '저장'}
            </button>
            {entry && (
              <button
                onClick={() => {
                  setEditing(false)
                  setWeather(entry.weather)
                  setDiary(entry.diary)
                }}
                className="btn-ghost btn-sm"
              >
                취소
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CalendarPage({ user, entriesByDate, onSave, onDelete, setMood, notify, requireLogin }) {
  const today = useMemo(() => todayStr(), [])
  const now = new Date()
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selected, setSelected] = useState(null)

  if (!user) return <LoginGate onLogin={requireLogin} title="나의 감정 달력" />

  const cells = monthGrid(cursor.y, cursor.m)
  const prefix = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`
  const monthCount = Object.keys(entriesByDate).filter((d) => d.startsWith(prefix)).length
  const isCurrentMonth = cursor.y === now.getFullYear() && cursor.m === now.getMonth()

  const move = (delta) => {
    const d = new Date(cursor.y, cursor.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
    setSelected(null)
  }

  const pick = (date) => {
    setSelected(date)
    const e = entriesByDate[date]
    if (e) setMood(e.weather)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-8 sm:px-6 md:pb-20">
      <PageTitle title="감정 달력" sub="날짜를 눌러 그날의 날씨와 일기를 확인하세요." />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => move(-1)} className="btn-ghost btn-sm !px-3" aria-label="이전 달">
              <Icon name="left" size={16} />
            </button>
            <div className="text-center">
              <p className="font-display text-2xl">
                {cursor.y}년 {cursor.m + 1}월
              </p>
              <p className="text-xs text-ink-soft">{monthCount}일 기록함</p>
            </div>
            <button onClick={() => move(1)} disabled={isCurrentMonth} className="btn-ghost btn-sm !px-3" aria-label="다음 달">
              <Icon name="right" size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {DOW_LABELS.map((d, i) => (
              <div key={d} className={`pb-1 text-center text-xs font-bold ${i === 0 ? 'text-[#d98a96]' : 'text-ink-faint'}`}>
                {d}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`b${i}`} />
              const entry = entriesByDate[date]
              const future = date > today
              const isToday = date === today
              const isSel = date === selected
              return (
                <button
                  key={date}
                  disabled={future}
                  onClick={() => pick(date)}
                  aria-label={`${formatLong(date)}${entry ? ` ${WEATHER_MAP[entry.weather].label}` : ''}`}
                  aria-pressed={isSel}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 sm:rounded-3xl ${
                    isSel
                      ? 'border-brand bg-white shadow-lift'
                      : entry
                        ? 'border-white/70 bg-white/70 hover:bg-white'
                        : 'border-transparent bg-white/25 hover:bg-white/60'
                  } ${future ? 'cursor-default opacity-35 hover:!bg-white/25' : ''}`}
                >
                  <span className={`absolute left-1.5 top-1 text-[10px] sm:left-2 sm:top-1.5 sm:text-xs ${isToday ? 'rounded-full bg-brand px-1.5 text-white' : 'text-ink-soft'}`}>
                    {Number(date.slice(8))}
                  </span>
                  {entry && <WeatherIcon type={entry.weather} size={30} className="mt-2 h-[26px] w-[26px] sm:h-[34px] sm:w-[34px]" />}
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-ink-soft">
            {Object.values(WEATHER_MAP).map((w) => (
              <span key={w.key} className="flex items-center gap-1">
                <WeatherIcon type={w.key} size={18} /> {w.label}
              </span>
            ))}
          </div>
        </section>

        <aside className="card h-fit p-5 sm:p-6 lg:sticky lg:top-24">
          {selected ? (
            <DayPanel
              key={`${selected}-${entriesByDate[selected]?.id ?? 'none'}`}
              date={selected}
              entry={entriesByDate[selected]}
              onSave={onSave}
              onDelete={onDelete}
              notify={notify}
              setMood={setMood}
            />
          ) : (
            <div className="py-10 text-center">
              <WeatherIcon type="partly" size={64} className="mx-auto animate-float" />
              <p className="mt-3 font-display text-xl">날짜를 선택해 보세요</p>
              <p className="mt-1 text-sm text-ink-soft">기록이 없는 날에는 새로 남길 수도 있어요.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
