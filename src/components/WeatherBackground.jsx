import { useMemo } from 'react'
import { GRADIENTS } from '../lib/weather'

// 구름 6개 설정 (위치·크기·속도). 날씨에 따라 보이는 개수와 색감이 달라집니다.
const CLOUDS = [
  { top: '9%', w: 260, dur: 70, delay: -12, op: 0.9 },
  { top: '24%', w: 190, dur: 95, delay: -60, op: 0.75 },
  { top: '42%', w: 320, dur: 110, delay: -30, op: 0.7 },
  { top: '60%', w: 220, dur: 85, delay: -5, op: 0.65 },
  { top: '15%', w: 150, dur: 120, delay: -90, op: 0.6 },
  { top: '75%', w: 280, dur: 100, delay: -45, op: 0.55 },
]
const CLOUD_COUNT = { neutral: 3, sunny: 2, partly: 4, cloudy: 6, rain: 6, thunder: 6 }
const CLOUD_FILTER = {
  neutral: 'none',
  sunny: 'none',
  partly: 'none',
  cloudy: 'brightness(0.93) saturate(0.7)',
  rain: 'brightness(0.84) saturate(0.8)',
  thunder: 'brightness(0.74) saturate(0.9) hue-rotate(10deg)',
}

const DROP_TOTAL = 70

export default function WeatherBackground({ weather }) {
  const w = weather ?? 'neutral'
  const sunVisible = w === 'neutral' || w === 'sunny' || w === 'partly'
  const raining = w === 'rain' || w === 'thunder'
  const dropLimit = w === 'thunder' ? DROP_TOTAL : 42

  // 빗방울 위치는 한 번만 무작위로 정해 둡니다.
  const drops = useMemo(
    () =>
      Array.from({ length: DROP_TOTAL }, (_, i) => ({
        left: `${(i * 137.5) % 112 - 6}%`,
        height: 14 + ((i * 7) % 16),
        dur: 0.75 + ((i * 13) % 50) / 100,
        delay: -((i * 29) % 100) / 50,
        op: 0.35 + ((i * 11) % 40) / 100,
      })),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {Object.entries(GRADIENTS).map(([key, bg]) => (
        <div
          key={key}
          className="absolute inset-0"
          style={{ background: bg, opacity: key === w ? 1 : 0, transition: 'opacity 1600ms ease' }}
        />
      ))}

      {/* 해 */}
      <div
        className="absolute -right-10 -top-10 h-[300px] w-[300px] sm:right-[6%] sm:top-[4%] sm:h-[380px] sm:w-[380px]"
        style={{
          opacity: sunVisible ? (w === 'partly' ? 0.75 : 1) : 0,
          transition: 'opacity 1600ms ease',
        }}
      >
        <div className="sun-rays absolute inset-0 rounded-full" />
        <div className="sun-core absolute left-1/2 top-1/2 h-[110px] w-[110px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[130px] sm:w-[130px]" />
      </div>

      {/* 구름 */}
      <div style={{ filter: CLOUD_FILTER[w], transition: 'filter 1600ms ease' }}>
        {CLOUDS.map((c, i) => (
          <div
            key={i}
            className="cloud-drift"
            style={{
              top: c.top,
              width: c.w,
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
              opacity: i < CLOUD_COUNT[w] ? c.op : 0,
              transition: 'opacity 1600ms ease',
            }}
          >
            <svg viewBox="0 -10 200 92" className="w-full drop-shadow-[0_8px_16px_rgba(120,140,190,0.25)]">
              <g fill="#fff">
                <ellipse cx="100" cy="55" rx="90" ry="22" />
                <circle cx="58" cy="42" r="28" />
                <circle cx="102" cy="30" r="34" />
                <circle cx="146" cy="43" r="26" />
              </g>
            </svg>
          </div>
        ))}
      </div>

      {/* 비 */}
      <div style={{ opacity: raining ? 1 : 0, transition: 'opacity 1600ms ease' }}>
        {drops.slice(0, dropLimit).map((d, i) => (
          <span
            key={i}
            className="rain-drop"
            style={{
              left: d.left,
              height: d.height,
              opacity: d.op,
              animationDuration: `${d.dur}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </div>

      {/* 번개 (약하게, 7초에 한 번) */}
      <div
        className="absolute inset-0"
        style={{ opacity: w === 'thunder' ? 1 : 0, transition: 'opacity 1000ms ease' }}
      >
        <div className="lightning-flash absolute inset-0" />
      </div>
    </div>
  )
}
