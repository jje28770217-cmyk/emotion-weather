// ─────────────────────────────────────────────────────────────
// 배경음악 엔진 (Web Audio API)
//
// 음원 파일을 쓰지 않고, 브라우저가 피아노·로파이 비트·빗소리·천둥을
// 직접 합성해서 연주합니다. 전부 이 코드가 만든 "자체 생성 음악"이라
// 저작권 문제가 없고, 별도 파일/주소가 필요 없습니다.
//
//  - 날씨(sunny/partly/cloudy/rain/thunder)마다 다른 "장면(scene)"을 연주
//  - 날씨가 바뀌면 이전 장면은 페이드아웃, 새 장면은 페이드인(크로스페이드)
//  - 볼륨·음소거·재생 여부는 localStorage 에 저장
//  - 브라우저 자동재생 제한 때문에 반드시 사용자의 클릭/터치 후에 시작
// ─────────────────────────────────────────────────────────────

const STORE_KEY = 'ew-bgm-v1'
const LOOKAHEAD = 1.6 // 초 단위로 미리 예약해 두는 길이
const TICK_MS = 250
const FADE_IN = 2.4
const FADE_OUT = 2.4
const DEFAULT_SCENE = 'partly'

const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const mtof = (m) => 440 * 2 ** ((m - 69) / 12)
const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0))

// 음계 위를 걸어 다니는 간단한 멜로디 생성기
function walk(st, scale, start) {
  if (st.mi === undefined) st.mi = start
  st.mi = Math.max(0, Math.min(scale.length - 1, st.mi + pick([-2, -1, -1, 0, 1, 1, 2])))
  return scale[st.mi]
}

// ───────────── 오디오 그래프 ─────────────
let ctx = null
let master = null
let analyser = null
let impulse = null
let whiteBuf = null
let brownBuf = null
let crackleBuf = null
let current = null // 지금 재생 중인 장면

function ensureContext() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) throw new Error('이 브라우저는 음악 재생을 지원하지 않아요.')
  ctx = new AC()

  master = ctx.createGain()
  master.gain.value = 0
  const limiter = ctx.createDynamicsCompressor() // 소리가 겹쳐도 깨지지 않게
  limiter.threshold.value = -14
  limiter.ratio.value = 6
  analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  master.connect(limiter)
  limiter.connect(analyser)
  analyser.connect(ctx.destination)

  const sr = ctx.sampleRate
  // 리버브용 임펄스(잔향) — 감쇠하는 노이즈
  impulse = ctx.createBuffer(2, Math.floor(sr * 2.8), sr)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2.4
  }
  // 흰 잡음 / 갈색 잡음(낮은 웅웅거림) / 바이닐 지직 소리
  whiteBuf = ctx.createBuffer(1, sr * 4, sr)
  brownBuf = ctx.createBuffer(1, sr * 4, sr)
  crackleBuf = ctx.createBuffer(1, sr * 4, sr)
  const w = whiteBuf.getChannelData(0)
  const b = brownBuf.getChannelData(0)
  const k = crackleBuf.getChannelData(0)
  let last = 0
  for (let i = 0; i < w.length; i++) {
    w[i] = Math.random() * 2 - 1
    last = (last + 0.02 * w[i]) / 1.02
    b[i] = last * 3.5
    k[i] = Math.random() < 0.0007 ? (Math.random() * 2 - 1) * rnd(0.3, 1) : 0
  }
  return ctx
}

function noiseSource(buf) {
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

// 장면 하나가 가지는 믹서: fade(전체 페이드) ← music(악기+리버브) / 앰비언스 직결
function createBus(reverbLevel) {
  const fade = ctx.createGain()
  fade.gain.value = 0.0001
  fade.connect(master)
  const music = ctx.createGain()
  music.gain.value = 0.9
  music.connect(fade)
  const conv = ctx.createConvolver()
  conv.buffer = impulse
  const send = ctx.createGain()
  send.gain.value = reverbLevel
  music.connect(send)
  send.connect(conv)
  conv.connect(fade)
  return { fade, music, stoppables: [], nodes: [fade, music, conv, send] }
}

// ───────────── 악기 ─────────────
// 부드러운 피아노(삼각파 + 배음 + 필터 엔벨로프)
function piano(bus, midi, t, dur, vel, bright) {
  const f = mtof(midi)
  const out = ctx.createGain()
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  const cut = Math.min(9000, f * (2 + bright * 8) + 400)
  lp.frequency.setValueAtTime(cut, t)
  lp.frequency.setTargetAtTime(Math.max(500, cut * 0.3), t + 0.02, 0.5)
  out.gain.setValueAtTime(0.0001, t)
  out.gain.linearRampToValueAtTime(vel * 0.32, t + 0.012)
  out.gain.setTargetAtTime(0.0001, t + 0.02, dur / 4.5)
  for (const [type, fr, g] of [
    ['triangle', f, 1],
    ['sine', f * 2, 0.28],
    ['sine', f * 3.01, 0.07],
  ]) {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = fr
    o.detune.value = rnd(-5, 5)
    const og = ctx.createGain()
    og.gain.value = g
    o.connect(og)
    og.connect(lp)
    o.start(t)
    o.stop(t + dur + 0.3)
  }
  lp.connect(out)
  out.connect(bus.music)
}

// 천천히 차오르는 패드(안정감 있는 지속음)
function pad(bus, midi, t, dur, vel) {
  const f = mtof(midi)
  const out = ctx.createGain()
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1100
  out.gain.setValueAtTime(0.0001, t)
  out.gain.linearRampToValueAtTime(vel, t + dur * 0.4)
  out.gain.linearRampToValueAtTime(0.0001, t + dur)
  for (const [type, d] of [
    ['triangle', -7],
    ['triangle', 6],
    ['sine', 0],
  ]) {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = f
    o.detune.value = d
    o.connect(lp)
    o.start(t)
    o.stop(t + dur + 0.1)
  }
  lp.connect(out)
  out.connect(bus.music)
}

function kick(bus, t, vel) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.frequency.setValueAtTime(130, t)
  o.frequency.exponentialRampToValueAtTime(42, t + 0.16)
  g.gain.setValueAtTime(vel * 0.5, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
  o.connect(g)
  g.connect(bus.music)
  o.start(t)
  o.stop(t + 0.32)
}

function noiseBurst(bus, t, { type, freq, vel, len, q = 0.7 }) {
  const src = ctx.createBufferSource()
  src.buffer = whiteBuf
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(vel, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  src.connect(f)
  f.connect(g)
  g.connect(bus.music)
  src.start(t, Math.random() * 3)
  src.stop(t + len + 0.02)
}
const hat = (bus, t, vel) => noiseBurst(bus, t, { type: 'highpass', freq: 7500, vel, len: 0.05 })
const clap = (bus, t) => noiseBurst(bus, t, { type: 'bandpass', freq: 1900, vel: 0.1, len: 0.14, q: 0.9 })

// 빗방울 "톡"
function plink(bus, t) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.value = rnd(1800, 3800)
  g.gain.setValueAtTime(rnd(0.01, 0.03), t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  o.connect(g)
  g.connect(bus.music)
  o.start(t)
  o.stop(t + 0.1)
}

// 멀리서 울리는 낮은 천둥(아주 부드럽게)
function rumble(bus, t) {
  const src = noiseSource(brownBuf)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(220, t)
  lp.frequency.exponentialRampToValueAtTime(70, t + 5)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.22, t + 1.4)
  g.gain.setTargetAtTime(0.0001, t + 1.6, 1.5)
  src.connect(lp)
  lp.connect(g)
  g.connect(bus.fade)
  src.start(t, Math.random() * 3)
  src.stop(t + 9)
}

// ───────────── 앰비언스 (연주와 별개로 계속 깔리는 소리) ─────────────
function rainLayer(bus, { level, lp }) {
  const make = (buf, build, gain) => {
    const src = noiseSource(buf)
    const g = ctx.createGain()
    g.gain.value = gain
    build(src, g)
    src.start(0, Math.random() * 3)
    bus.stoppables.push(src)
    return g
  }
  // 샤아— 하는 빗소리
  const hiss = make(
    whiteBuf,
    (src, g) => {
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 1200
      const l = ctx.createBiquadFilter()
      l.type = 'lowpass'
      l.frequency.value = lp
      src.connect(hp)
      hp.connect(l)
      l.connect(g)
      g.connect(bus.fade)
    },
    level * 0.7,
  )
  // 지붕에 떨어지는 낮은 울림
  make(
    brownBuf,
    (src, g) => {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 500
      bp.Q.value = 0.5
      src.connect(bp)
      bp.connect(g)
      g.connect(bus.fade)
    },
    level * 0.8,
  )
  // 빗줄기가 약해졌다 세졌다 하는 느린 변화
  const lfo = ctx.createOscillator()
  const lg = ctx.createGain()
  lfo.frequency.value = 0.11
  lg.gain.value = level * 0.2
  lfo.connect(lg)
  lg.connect(hiss.gain)
  lfo.start()
  bus.stoppables.push(lfo)
}

function crackleLayer(bus, level) {
  const src = noiseSource(crackleBuf)
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1500
  const g = ctx.createGain()
  g.gain.value = level
  src.connect(hp)
  hp.connect(g)
  g.connect(bus.fade)
  src.start(0, Math.random() * 3)
  bus.stoppables.push(src)
}

// ───────────── 날씨별 장면(음악) 정의 ─────────────
// chords: 한 마디(8분음표 8개)마다 하나. bass=저음, notes=위쪽 화음(MIDI 번호)
const SUNNY_SCALE = [72, 74, 76, 79, 81, 84, 86, 88]
const LOFI_SCALE = [67, 69, 72, 74, 76, 79]
const CLOUDY_SCALE = [69, 72, 74, 76, 79, 81]
const RAIN_SCALE = [74, 77, 79, 81, 84, 86]
const THUNDER_SCALE = [72, 74, 77, 79, 81, 84]

export const SCENES = {
  sunny: {
    title: '햇살 한 스푼',
    sub: '밝고 따뜻한 피아노',
    bpm: 96,
    reverb: 0.35,
    chords: [
      { bass: 48, notes: [60, 64, 67, 72] }, // C
      { bass: 43, notes: [59, 62, 67, 71] }, // G
      { bass: 45, notes: [60, 64, 69, 72] }, // Am
      { bass: 41, notes: [60, 65, 69, 72] }, // F
    ],
    play({ bus, t, s, chord, st }) {
      const pat = [0, 1, 2, 3, 2, 1, 2, 1]
      piano(bus, chord.notes[pat[s]], t, 1.6, s % 4 === 0 ? 0.55 : 0.4, 0.8)
      if (s === 0) piano(bus, chord.bass, t, 3, 0.55, 0.3)
      if (s === 4) piano(bus, chord.bass + 7, t, 2, 0.35, 0.3)
      if (s % 2 === 0 && s !== 0 && Math.random() < 0.38) piano(bus, walk(st, SUNNY_SCALE, 3), t, 1.4, 0.5, 0.9)
    },
  },

  partly: {
    title: '느린 오후의 로파이',
    sub: '편안하고 잔잔한 로파이',
    bpm: 72,
    reverb: 0.3,
    chords: [
      { bass: 38, notes: [53, 57, 60, 64] }, // Dm9
      { bass: 43, notes: [53, 59, 62, 64] }, // G13
      { bass: 36, notes: [55, 59, 62, 64] }, // Cmaj9
      { bass: 45, notes: [55, 60, 64, 71] }, // Am9
    ],
    ambience: (bus) => crackleLayer(bus, 0.05),
    play({ bus, t, s, chord, st, stepDur }) {
      const tt = t + (s % 2 ? stepDur * 0.28 : 0) // 살짝 흔들리는 스윙
      if (s === 0 || s === 5) chord.notes.forEach((n, i) => piano(bus, n, tt + i * 0.014, 2.2, 0.32, 0.22))
      if (s === 0) piano(bus, chord.bass, tt, 1.8, 0.6, 0.15)
      if (s === 0 || s === 5) kick(bus, tt, 0.7)
      if (s === 4) clap(bus, tt)
      hat(bus, tt, s % 2 ? 0.05 : 0.03)
      if ([2, 3, 6, 7].includes(s) && Math.random() < 0.4) piano(bus, walk(st, LOFI_SCALE, 2), tt, 1.3, 0.42, 0.3)
    },
  },

  cloudy: {
    title: '고요한 회색 하늘',
    sub: '차분하고 조용한 피아노',
    bpm: 60,
    reverb: 0.5,
    chords: [
      { bass: 45, notes: [57, 60, 64, 67] }, // Am9
      { bass: 41, notes: [57, 60, 64, 65] }, // Fmaj7
      { bass: 48, notes: [55, 59, 64, 67] }, // Cmaj7
      { bass: 40, notes: [55, 59, 62, 64] }, // Em7
    ],
    play({ bus, t, s, chord, st, stepDur }) {
      if (s % 2 === 0) piano(bus, chord.notes[s / 2], t, 3.2, 0.4, 0.15)
      if (s === 0) piano(bus, chord.bass, t, 5, 0.5, 0.1)
      if ((s === 0 || s === 4) && Math.random() < 0.45) piano(bus, walk(st, CLOUDY_SCALE, 2), t + stepDur, 3.5, 0.38, 0.2)
    },
  },

  rain: {
    title: '창가에 내리는 비',
    sub: '빗소리와 감성 피아노',
    bpm: 66,
    reverb: 0.45,
    chords: [
      { bass: 38, notes: [57, 62, 65, 69] }, // Dm
      { bass: 46, notes: [58, 62, 65, 70] }, // Bb
      { bass: 41, notes: [57, 60, 65, 69] }, // F
      { bass: 48, notes: [55, 60, 64, 67] }, // C
    ],
    ambience: (bus) => rainLayer(bus, { level: 0.11, lp: 5200 }),
    play({ bus, t, s, chord, st, stepDur }) {
      const pat = [0, 2, 1, 3, 2, 1, 3, 2]
      piano(bus, chord.notes[pat[s]], t, 2.2, s === 0 ? 0.45 : 0.34, 0.25)
      if (s === 0) piano(bus, chord.bass, t, 3.5, 0.5, 0.1)
      if ([0, 3, 4, 7].includes(s) && Math.random() < 0.35) piano(bus, walk(st, RAIN_SCALE, 2), t, 2.4, 0.4, 0.3)
      if (Math.random() < 0.3) plink(bus, t + rnd(0, stepDur))
    },
  },

  thunder: {
    title: '먼 곳의 천둥, 안은 따뜻해',
    sub: '잔잔한 빗소리와 안정감',
    bpm: 54,
    reverb: 0.55,
    chords: [
      { bass: 41, notes: [53, 57, 60, 64] }, // Fmaj7
      { bass: 38, notes: [50, 57, 60, 65] }, // Dm7
      { bass: 46, notes: [58, 62, 65, 69] }, // Bbmaj7
      { bass: 36, notes: [55, 60, 62, 67] }, // C6
    ],
    ambience: (bus) => rainLayer(bus, { level: 0.07, lp: 3200 }),
    play({ bus, t, s, chord, st, stepDur }) {
      if (s === 0) {
        chord.notes.forEach((n) => pad(bus, n, t, stepDur * 8 + 1.5, 0.11))
        pad(bus, chord.bass, t, stepDur * 8 + 1.5, 0.16)
      }
      if ((s === 2 || s === 5) && Math.random() < 0.3) piano(bus, walk(st, THUNDER_SCALE, 2), t, 3.5, 0.3, 0.35)
      if (Math.random() < 0.12) plink(bus, t + rnd(0, stepDur))
      if (t > st.rumbleAt) {
        rumble(bus, t)
        st.rumbleAt = t + rnd(16, 30)
      }
    },
  },
}

// 장면 시작: 믹서를 만들고, 스케줄러를 돌리며 음악을 미리 예약
function runScene(key) {
  const def = SCENES[key]
  const bus = createBus(def.reverb)
  const stepDur = 60 / def.bpm / 2
  const st = { rumbleAt: ctx.currentTime + 7 }
  let step = 0
  let next = ctx.currentTime + 0.2
  let timer = null

  def.ambience?.(bus)

  const tick = () => {
    while (next < ctx.currentTime + LOOKAHEAD) {
      const bar = Math.floor(step / 8)
      def.play({ bus, t: next, stepDur, s: step % 8, bar, chord: def.chords[bar % def.chords.length], st })
      next += stepDur
      step += 1
    }
  }
  tick()
  timer = setInterval(tick, TICK_MS)

  const now = ctx.currentTime
  bus.fade.gain.setValueAtTime(0.0001, now)
  bus.fade.gain.linearRampToValueAtTime(1, now + FADE_IN)

  return {
    key,
    // 서서히 줄이고(페이드아웃), 끝나면 소리 재료를 모두 정리
    fadeOut() {
      clearInterval(timer)
      const t0 = ctx.currentTime
      bus.fade.gain.cancelScheduledValues(t0)
      bus.fade.gain.setValueAtTime(Math.max(bus.fade.gain.value, 0.0001), t0)
      bus.fade.gain.linearRampToValueAtTime(0.0001, t0 + FADE_OUT)
      setTimeout(() => {
        bus.stoppables.forEach((n) => {
          try {
            n.stop()
          } catch {
            /* 이미 멈춤 */
          }
        })
        bus.nodes.forEach((n) => n.disconnect())
      }, (FADE_OUT + 3) * 1000)
    },
  }
}

// ───────────── 상태 / 공개 API ─────────────
const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {}
  } catch {
    return {}
  }
}
const stored = readStore()

let wanted = Boolean(stored.enabled) // 사용자가 "켜 둔" 상태 (저장됨)
let volume = clamp01(stored.volume ?? 0.5)
let muted = Boolean(stored.muted)
let desired = DEFAULT_SCENE
let suspendTimer = null
const listeners = new Set()

let snapshot = {
  playing: false,
  volume,
  muted,
  scene: desired,
  resumeWanted: wanted, // 저장된 "켜짐" 상태 → 첫 터치 때 이어서 재생
  error: '',
}

const persist = () => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ enabled: wanted, volume, muted }))
  } catch {
    /* 저장 불가 환경 */
  }
}

const setState = (patch) => {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach((fn) => fn())
}

const applyMaster = (time = 0.06) => {
  if (!ctx) return
  const target = snapshot.playing && !muted ? volume ** 1.6 * 0.9 : 0
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(target, ctx.currentTime, time)
}

function switchScene(key) {
  if (current?.key === key) return
  current?.fadeOut() // 이전 장면은 서서히 사라지고
  current = runScene(key) // 새 장면은 서서히 나타남 (크로스페이드)
}

export const bgm = {
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  getSnapshot: () => snapshot,

  // ※ 반드시 사용자의 클릭/터치 이벤트 안에서 호출해야 합니다.
  async play(sceneKey = desired) {
    try {
      ensureContext()
      desired = SCENES[sceneKey] ? sceneKey : DEFAULT_SCENE
      clearTimeout(suspendTimer)
      await ctx.resume()
      wanted = true
      persist()
      setState({ playing: true, scene: desired, resumeWanted: false, error: '' })
      switchScene(desired)
      applyMaster(0.35) // 마스터 볼륨도 부드럽게 올림
    } catch (err) {
      setState({ playing: false, error: err.message || '음악을 재생하지 못했어요.' })
    }
  },

  pause() {
    wanted = false
    persist()
    setState({ playing: false, resumeWanted: false })
    applyMaster(0.2)
    clearTimeout(suspendTimer)
    suspendTimer = setTimeout(() => {
      if (!snapshot.playing && ctx) ctx.suspend() // 일시정지 동안 CPU 사용 없음
    }, 1200)
  },

  // 날씨가 바뀌면 호출: 재생 중이면 부드럽게 다른 음악으로 전환
  setWeather(key) {
    const next = SCENES[key] ? key : DEFAULT_SCENE
    if (next === desired && current?.key === next) return
    desired = next
    setState({ scene: next })
    if (snapshot.playing && ctx) switchScene(next)
  },

  setVolume(v) {
    volume = clamp01(v)
    if (volume > 0 && muted) muted = false
    persist()
    setState({ volume, muted })
    applyMaster()
  },

  setMuted(m) {
    muted = Boolean(m)
    persist()
    setState({ muted })
    applyMaster()
  },

  // 테스트/디버그용: 지금 실제로 출력되는 소리의 크기(RMS)
  level() {
    if (!analyser) return 0
    const buf = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buf)
    return Math.sqrt(buf.reduce((a, b) => a + b * b, 0) / buf.length)
  },
  contextState: () => ctx?.state ?? 'none',
}
