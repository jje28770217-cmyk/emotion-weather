import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import Icon from '../components/Icon'
import WeatherIcon from '../components/WeatherIcon'
import LoginGate, { PageTitle } from '../components/LoginGate'
import { WEATHERS, WEATHER_MAP } from '../lib/weather'
import { DOW_LABELS, parseDate, periodInfo, todayStr } from '../lib/date'

export default function StatsPage({ user, entriesByDate, requireLogin }) {
  const [kind, setKind] = useState('week')
  const [offset, setOffset] = useState(0)

  const data = useMemo(() => {
    const { dates, label } = periodInfo(kind, offset)
    const recorded = dates.filter((d) => entriesByDate[d])
    const counts = Object.fromEntries(WEATHERS.map((w) => [w.key, 0]))
    recorded.forEach((d) => (counts[entriesByDate[d].weather] += 1))
    const rows = WEATHERS.map((w) => ({
      ...w,
      count: counts[w.key],
      percent: recorded.length ? Math.round((counts[w.key] / recorded.length) * 100) : 0,
    }))
    const top = [...rows].sort((a, b) => b.count - a.count)[0]
    const passed = dates.filter((d) => d <= todayStr()).length
    return { dates, label, recorded: recorded.length, rows, top: top.count ? top : null, passed }
  }, [kind, offset, entriesByDate])

  if (!user) return <LoginGate onLogin={requireLogin} title="나의 감정 통계" />

  const switchKind = (k) => {
    setKind(k)
    setOffset(0)
  }
  const pieData = data.rows.filter((r) => r.count > 0)

  return (
    <div className="mx-auto max-w-4xl px-4 pb-32 pt-8 sm:px-6 md:pb-20">
      <PageTitle title="감정 통계" sub="내 마음 날씨가 어떻게 흘러왔는지 살펴봐요." />

      <div className="mb-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="card flex gap-1 !rounded-full p-1.5">
          {[
            ['week', '주간'],
            ['month', '월간'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => switchKind(k)}
              aria-pressed={kind === k}
              className={`rounded-full px-6 py-2 text-sm font-bold transition ${kind === k ? 'bg-brand text-white shadow-md' : 'text-ink-soft hover:bg-white/70'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset(offset - 1)} className="btn-ghost btn-sm !px-3" aria-label="이전 기간">
            <Icon name="left" size={16} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-bold">{data.label}</span>
          <button onClick={() => setOffset(offset + 1)} disabled={offset >= 0} className="btn-ghost btn-sm !px-3" aria-label="다음 기간">
            <Icon name="right" size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="card p-5 text-center sm:p-6">
          <p className="text-xs font-bold text-ink-faint">기록한 날</p>
          <p className="mt-2 font-display text-4xl">
            {data.recorded}
            <span className="text-lg text-ink-soft"> / {data.passed}일</span>
          </p>
        </div>
        <div className="card p-5 text-center sm:p-6">
          <p className="text-xs font-bold text-ink-faint">가장 자주 기록한 감정</p>
          {data.top ? (
            <div className="mt-1 flex items-center justify-center gap-2">
              <WeatherIcon type={data.top.key} size={44} />
              <p className="font-display text-2xl sm:text-3xl">{data.top.label}</p>
            </div>
          ) : (
            <p className="mt-3 text-ink-faint">-</p>
          )}
        </div>
      </div>

      {data.recorded === 0 ? (
        <div className="card mt-4 p-10 text-center text-ink-soft">
          <WeatherIcon type="cloudy" size={64} className="mx-auto" />
          <p className="mt-3 font-display text-xl text-ink">이 기간에는 기록이 없어요</p>
          <p className="mt-1 text-sm">오늘의 감정을 기록하면 통계가 채워져요.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="card p-5 sm:p-6">
              <h2 className="font-display text-xl">감정 분포</h2>
              <div key={`${kind}-${offset}`} className="relative mt-2 h-[240px] animate-fade-up">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={68}
                      outerRadius={100}
                      paddingAngle={3}
                      cornerRadius={8}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {pieData.map((r) => (
                        <Cell key={r.key} fill={r.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${v}일`, name]} contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 24px rgba(60,70,120,.2)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl">{data.recorded}</span>
                  <span className="text-xs text-ink-soft">일 기록</span>
                </div>
              </div>
            </section>

            <section className="card p-5 sm:p-6">
              <h2 className="font-display text-xl">감정별 비율</h2>
              <ul className="mt-4 space-y-3">
                {data.rows.map((r) => (
                  <li key={r.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-semibold">
                        <WeatherIcon type={r.key} size={24} /> {r.label}
                      </span>
                      <span className="text-ink-soft">
                        {r.count}일 · {r.percent}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${r.percent}%`, background: r.color }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {kind === 'week' && (
            <section className="card mt-4 p-5 sm:p-6">
              <h2 className="font-display text-xl">이번 주 마음 날씨</h2>
              <div className="mt-4 grid grid-cols-7 gap-1.5 text-center sm:gap-3">
                {data.dates.map((d) => {
                  const e = entriesByDate[d]
                  return (
                    <div key={d} className="rounded-2xl bg-white/50 py-3">
                      <p className="text-xs font-bold text-ink-faint">{DOW_LABELS[parseDate(d).getDay()]}</p>
                      <div className="mt-2 flex h-9 items-center justify-center">
                        {e ? (
                          <WeatherIcon type={e.weather} size={34} />
                        ) : (
                          <span className="text-ink-faint">·</span>
                        )}
                      </div>
                      <p className="mt-1 hidden text-[11px] text-ink-soft sm:block">{e ? WEATHER_MAP[e.weather].label : ''}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
