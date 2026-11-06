import { useId } from 'react'

const CLOUD = 'M18 46a9 9 0 0 1-1-18 13 13 0 0 1 25-3 10 10 0 0 1 4 21z'

// 다섯 가지 날씨를 그리는 SVG 아이콘 (이미지 파일 없이 코드로 그립니다)
export default function WeatherIcon({ type, size = 48, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const sun = `sun${uid}`
  const cloud = `cl${uid}`
  const dark = `dk${uid}`
  const bolt = `bt${uid}`

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-hidden="true">
      <defs>
        <radialGradient id={sun} cx="35%" cy="35%" r="80%">
          <stop offset="0" stopColor="#FFF6C2" />
          <stop offset="0.55" stopColor="#FFD86B" />
          <stop offset="1" stopColor="#FFB45E" />
        </radialGradient>
        <linearGradient id={cloud} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCE7F7" />
        </linearGradient>
        <linearGradient id={dark} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7BFD6" />
          <stop offset="1" stopColor="#8F99B8" />
        </linearGradient>
        <linearGradient id={bolt} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE98A" />
          <stop offset="1" stopColor="#FFB84D" />
        </linearGradient>
      </defs>

      {type === 'sunny' && (
        <g>
          <g stroke="#FFC56B" strokeWidth="3.4" strokeLinecap="round">
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4
              return (
                <line
                  key={i}
                  x1={32 + Math.cos(a) * 21}
                  y1={32 + Math.sin(a) * 21}
                  x2={32 + Math.cos(a) * 27}
                  y2={32 + Math.sin(a) * 27}
                />
              )
            })}
          </g>
          <circle cx="32" cy="32" r="15" fill={`url(#${sun})`} />
        </g>
      )}

      {type === 'partly' && (
        <g>
          <circle cx="40" cy="22" r="12" fill={`url(#${sun})`} />
          <path d={CLOUD} transform="translate(-2 4)" fill={`url(#${cloud})`} stroke="#C9D8EE" strokeWidth="1" />
        </g>
      )}

      {type === 'cloudy' && (
        <g>
          <path d={CLOUD} transform="translate(8 -4) scale(.78)" fill={`url(#${dark})`} opacity=".7" />
          <path d={CLOUD} transform="translate(-3 5)" fill={`url(#${dark})`} />
        </g>
      )}

      {type === 'rain' && (
        <g>
          <path d={CLOUD} transform="translate(-1 -5)" fill={`url(#${dark})`} />
          <g stroke="#6FA6E8" strokeWidth="3.4" strokeLinecap="round">
            <line x1="22" y1="46" x2="19" y2="54" />
            <line x1="32" y1="46" x2="29" y2="56" />
            <line x1="42" y1="46" x2="39" y2="54" />
          </g>
        </g>
      )}

      {type === 'thunder' && (
        <g>
          <path d={CLOUD} transform="translate(-1 -6)" fill="#8A8FB5" />
          <path d="M34 36 25 50h7l-3 11 11-16h-7z" fill={`url(#${bolt})`} stroke="#F2A640" strokeWidth="1" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  )
}
