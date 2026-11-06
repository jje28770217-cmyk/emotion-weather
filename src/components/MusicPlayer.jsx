import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Icon from './Icon'
import { SCENES, bgm } from '../lib/music'

// 음파(이퀄라이저) 애니메이션: 재생 중일 때만 움직입니다
function Wave({ active }) {
  const bars = [
    { d: 0.9, delay: 0 },
    { d: 0.65, delay: 0.15 },
    { d: 1.1, delay: 0.3 },
    { d: 0.75, delay: 0.1 },
  ]
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
      {bars.map((b, i) => (
        <span
          key={i}
          className="eq-bar h-full w-[3px] rounded-full bg-brand/70"
          style={{
            animationDuration: `${b.d}s`,
            animationDelay: `${b.delay}s`,
            animationPlayState: active ? 'running' : 'paused',
            transform: active ? undefined : 'scaleY(0.25)',
          }}
        />
      ))}
    </span>
  )
}

// 오른쪽 아래 떠 있는 반투명 유리 음악 플레이어
export default function MusicPlayer({ weather }) {
  const snap = useSyncExternalStore(bgm.subscribe, bgm.getSnapshot)
  const sceneKey = weather ?? 'partly' // 아직 감정을 고르지 않았다면 잔잔한 로파이
  const scene = SCENES[snap.scene]
  const [open, setOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 640))
  const weatherRef = useRef(sceneKey)

  // 날씨가 바뀌면 음악도 (재생 중이라면) 부드럽게 전환
  useEffect(() => {
    weatherRef.current = sceneKey
    bgm.setWeather(sceneKey)
  }, [sceneKey])

  // 지난번에 음악을 켜 두었다면, 브라우저 자동재생 제한 때문에
  // 화면을 처음 누르거나 키를 누를 때 이어서 재생합니다.
  useEffect(() => {
    if (!bgm.getSnapshot().resumeWanted) return undefined
    const resume = (e) => {
      if (e.target?.closest?.('[data-bgm-player]')) return // 플레이어 조작은 직접 처리
      cleanup()
      bgm.play(weatherRef.current)
    }
    const cleanup = () => {
      window.removeEventListener('pointerup', resume, true)
      window.removeEventListener('keydown', resume, true)
    }
    window.addEventListener('pointerup', resume, true)
    window.addEventListener('keydown', resume, true)
    return cleanup
  }, [])

  const toggle = () => (snap.playing ? bgm.pause() : bgm.play(sceneKey))
  const silent = snap.muted || snap.volume === 0
  const subtitle = snap.error
    ? snap.error
    : snap.resumeWanted
      ? '화면을 누르면 이어서 재생돼요'
      : scene.sub

  return (
    <section
      data-bgm-player
      aria-label="배경음악 플레이어"
      className="card fixed bottom-[88px] right-3 z-40 w-[min(272px,calc(100vw-1.5rem))] !rounded-[26px] p-2.5 md:bottom-6 md:right-6"
    >
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggle}
          aria-label={snap.playing ? '음악 일시정지' : '음악 재생'}
          aria-pressed={snap.playing}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_18px_-8px_rgba(86,99,199,0.9)] transition hover:scale-105 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 active:scale-95"
        >
          <Icon name={snap.playing ? 'pause' : 'play'} size={18} className={snap.playing ? '' : 'translate-x-[1px]'} />
        </button>

        <div className="min-w-0 flex-1 leading-tight" aria-live="polite">
          <p className="flex items-center gap-2 text-[13px] font-bold text-ink">
            <Wave active={snap.playing && !silent} />
            <span className="truncate" data-testid="bgm-title">
              {scene.title}
            </span>
          </p>
          <p className="mt-0.5 truncate text-[11px] text-ink-faint">{subtitle}</p>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? '볼륨 조절 접기' : '볼륨 조절 펼치기'}
          aria-expanded={open}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
        >
          <Icon name={open ? 'chevDown' : 'chevUp'} size={16} />
        </button>
      </div>

      {open && (
        <div className="mt-2 flex items-center gap-2 rounded-full bg-white/60 px-2 py-1.5 animate-fade-in">
          <button
            onClick={() => bgm.setMuted(!snap.muted)}
            aria-label={snap.muted ? '음소거 해제' : '음소거'}
            aria-pressed={snap.muted}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
          >
            <Icon name={silent ? 'mute' : 'volume'} size={16} />
          </button>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round((snap.muted ? 0 : snap.volume) * 100)}
            onChange={(e) => bgm.setVolume(Number(e.target.value) / 100)}
            aria-label="볼륨"
            className="bgm-range"
            style={{ '--fill': `${Math.round((snap.muted ? 0 : snap.volume) * 100)}%` }}
          />
          <span className="w-8 shrink-0 text-right text-[11px] font-semibold tabular-nums text-ink-soft">
            {Math.round((snap.muted ? 0 : snap.volume) * 100)}
          </span>
        </div>
      )}
    </section>
  )
}
