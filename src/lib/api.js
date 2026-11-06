import { supabase, isLive } from './supabase'
import { addDays, todayStr } from './date'

// ─────────────────────────────────────────────
// 데이터 접근 계층: 화면은 이 파일의 함수만 호출합니다.
//  - 실서비스 모드(isLive): Supabase DB (RLS 로 사용자별 보호)
//  - 데모 모드: localStorage ("샘플" 표시가 붙은 데이터 포함)
// ─────────────────────────────────────────────

export const DIARY_MAX = 500
export const NICK_MAX = 12
export const MSG_MAX = 200

export const validateGuestbook = ({ nickname, message }) => {
  const n = nickname.trim()
  const m = message.trim()
  if (!n) return '닉네임을 입력해 주세요.'
  if (n.length > NICK_MAX) return `닉네임은 ${NICK_MAX}자 이내로 입력해 주세요.`
  if (!m) return '응원 메시지를 입력해 주세요.'
  if (m.length > MSG_MAX) return `메시지는 ${MSG_MAX}자 이내로 입력해 주세요.`
  return null
}

// ───── 데모 모드 저장소 ─────
const KEY_ENTRIES = 'ew-demo-entries-v1'
const KEY_MESSAGES = 'ew-demo-messages-v1'
const memory = {}

const readJSON = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return memory[key] ?? null
  }
}
const writeJSON = (key, value) => {
  memory[key] = value
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 저장소 사용 불가 시 메모리에만 유지 */
  }
}

// 항상 같은 결과가 나오는 간단한 의사 난수
const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

const SAMPLE_DIARY = {
  sunny: ['친구들이랑 웃느라 시간 가는 줄 몰랐어요.', '오랜만에 햇살 맞으며 산책했다!', '좋은 소식을 들은 날. 기분이 하늘 같아요.'],
  partly: ['특별한 일은 없었지만 평화로웠다.', '카페에서 책 읽으며 보낸 조용한 하루.', '그냥 무난하게 흘러간 하루.'],
  cloudy: ['이유 없이 기운이 없었다. 일찍 자야지.', '해야 할 일이 많아 조금 지친 하루.', '마음이 살짝 가라앉는 날.'],
  rain: ['생각처럼 되지 않아 속상했다.', '괜히 서운한 마음이 오래 갔다.', '비 오는 창밖을 한참 바라봤어요.'],
  thunder: ['시험 준비 때문에 스트레스가 폭발 직전.', '발표 때문에 너무 긴장되고 예민했다.', '계속 꼬이는 하루라 화가 났다.'],
}
const WEIGHTS = [
  ['sunny', 0.22],
  ['partly', 0.28],
  ['cloudy', 0.2],
  ['rain', 0.17],
  ['thunder', 0.13],
]

const makeSampleEntries = () => {
  const rand = seeded(20260)
  const today = todayStr()
  const list = []
  for (let i = 1; i <= 50; i++) {
    if (rand() < 0.3) continue
    const r = rand()
    let acc = 0
    let weather = 'partly'
    for (const [key, w] of WEIGHTS) {
      acc += w
      if (r <= acc) {
        weather = key
        break
      }
    }
    const diaries = SAMPLE_DIARY[weather]
    const date = addDays(today, -i)
    list.push({
      id: `sample-${date}`,
      entry_date: date,
      weather,
      diary: diaries[Math.floor(rand() * diaries.length)],
      sample: true,
    })
  }
  return list
}

const SAMPLE_MESSAGES = [
  { nickname: '구름빵', message: '오늘도 고생 많았어요. 맑은 내일이 올 거예요!', ago: 2 },
  { nickname: '새벽감성', message: '감정을 날씨로 기록한다는 아이디어가 정말 따뜻해요 ☁️', ago: 26 },
  { nickname: '여름이', message: '비 오는 날 기록도 소중하다고 말해주는 것 같아서 좋아요.', ago: 70 },
]

const makeSampleMessages = () =>
  SAMPLE_MESSAGES.map((m, i) => ({
    id: `sample-msg-${i}`,
    nickname: m.nickname,
    message: m.message,
    created_at: new Date(Date.now() - m.ago * 3600 * 1000).toISOString(),
    sample: true,
  }))

const demoEntries = () => {
  let data = readJSON(KEY_ENTRIES)
  if (!data) {
    data = makeSampleEntries()
    writeJSON(KEY_ENTRIES, data)
  }
  return data
}
const demoMessages = () => {
  let data = readJSON(KEY_MESSAGES)
  if (!data) {
    data = makeSampleMessages()
    writeJSON(KEY_MESSAGES, data)
  }
  return data
}

export const resetDemo = () => {
  writeJSON(KEY_ENTRIES, makeSampleEntries())
  writeJSON(KEY_MESSAGES, makeSampleMessages())
}

// ───── 감정 기록 ─────
export async function listEntries() {
  if (!isLive) return demoEntries()
  const { data, error } = await supabase
    .from('entries')
    .select('id, entry_date, weather, diary')
    .order('entry_date', { ascending: false })
  if (error) throw error
  return data
}

export async function saveEntry(user, { entry_date, weather, diary }) {
  const clean = diary.trim().slice(0, DIARY_MAX)
  if (!isLive) {
    const list = demoEntries().filter((e) => e.entry_date !== entry_date)
    const saved = { id: `demo-${entry_date}`, entry_date, weather, diary: clean }
    writeJSON(KEY_ENTRIES, [...list, saved])
    return saved
  }
  const { data, error } = await supabase
    .from('entries')
    .upsert(
      { user_id: user.id, entry_date, weather, diary: clean, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,entry_date' },
    )
    .select('id, entry_date, weather, diary')
    .single()
  if (error) throw error
  return data
}

export async function deleteEntry(user, entry_date) {
  if (!isLive) {
    writeJSON(
      KEY_ENTRIES,
      demoEntries().filter((e) => e.entry_date !== entry_date),
    )
    return
  }
  const { error } = await supabase.from('entries').delete().eq('user_id', user.id).eq('entry_date', entry_date)
  if (error) throw error
}

// ───── 응원 방명록 ─────
export async function listMessages() {
  if (!isLive) {
    return [...demoMessages()].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const { data, error } = await supabase
    .from('guestbook')
    .select('id, nickname, message, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function addMessage({ nickname, message }) {
  const invalid = validateGuestbook({ nickname, message })
  if (invalid) throw new Error(invalid)
  const row = { nickname: nickname.trim(), message: message.trim() }
  if (!isLive) {
    const saved = { id: `demo-msg-${Date.now()}`, ...row, created_at: new Date().toISOString() }
    writeJSON(KEY_MESSAGES, [saved, ...demoMessages()])
    return saved
  }
  const { data, error } = await supabase
    .from('guestbook')
    .insert(row)
    .select('id, nickname, message, created_at')
    .single()
  if (error) throw error
  return data
}
