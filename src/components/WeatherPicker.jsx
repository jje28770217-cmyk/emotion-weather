import { WEATHERS } from '../lib/weather'
import WeatherIcon from './WeatherIcon'

// 다섯 가지 날씨 중 하나를 고르는 버튼 묶음. compact 는 달력 패널용 작은 크기.
export default function WeatherPicker({ value, onChange, compact = false }) {
  return (
    <div role="radiogroup" aria-label="오늘의 감정 날씨" className="grid grid-cols-5 gap-2 sm:gap-3">
      {WEATHERS.map((w, i) => {
        const active = value === w.key
        return (
          <button
            key={w.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(w.key)}
            title={`${w.label} · ${w.desc}`}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`group animate-fade-up flex flex-col items-center rounded-3xl border text-center transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 ${
              compact ? 'gap-1 px-1 py-2' : 'gap-1.5 px-1 py-3 sm:gap-2 sm:px-2 sm:py-5'
            } ${
              active
                ? '-translate-y-1 border-white bg-white shadow-lift'
                : 'border-white/60 bg-white/45 hover:-translate-y-0.5 hover:bg-white/80'
            }`}
          >
            <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
              <WeatherIcon type={w.key} size={compact ? 34 : 52} className="max-sm:h-10 max-sm:w-10" />
            </span>
            <span className={`font-bold ${compact ? 'text-[11px]' : 'text-[12px] sm:text-sm'} ${active ? 'text-ink' : 'text-ink-soft'}`}>
              {w.label}
            </span>
            {!compact && <span className="hidden px-1 text-[11px] leading-tight text-ink-faint sm:block">{w.desc}</span>}
          </button>
        )
      })}
    </div>
  )
}
