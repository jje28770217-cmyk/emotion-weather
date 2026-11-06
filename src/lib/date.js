// 날짜 유틸 — 모든 날짜는 'YYYY-MM-DD' 문자열(사용자 로컬 기준)로 다룹니다.
const pad = (n) => String(n).padStart(2, '0')
const DOW = ['일', '월', '화', '수', '목', '금', '토']
export const DOW_LABELS = DOW

export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = () => toDateStr(new Date())

export const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (s, n) => {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

export const formatLong = (s) => {
  const d = parseDate(s)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`
}

export const formatShort = (s) => {
  const d = parseDate(s)
  return `${d.getMonth() + 1}.${d.getDate()}`
}

// 달력용 셀 배열 (앞쪽 빈칸은 null). month 는 0~11
export const monthGrid = (year, month) => {
  const lead = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push(toDateStr(new Date(year, month, d)))
  while (cells.length % 7) cells.push(null)
  return cells
}

// 통계 기간: kind 'week' | 'month', offset 0=이번, -1=지난
export const periodInfo = (kind, offset) => {
  const now = new Date()
  if (kind === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + offset * 7)
    const dates = Array.from({ length: 7 }, (_, i) =>
      toDateStr(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)),
    )
    return { dates, label: `${formatShort(dates[0])} ~ ${formatShort(dates[6])}` }
  }
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
  const dates = Array.from({ length: days }, (_, i) =>
    toDateStr(new Date(base.getFullYear(), base.getMonth(), i + 1)),
  )
  return { dates, label: `${base.getFullYear()}년 ${base.getMonth() + 1}월` }
}

// 오늘(또는 어제)부터 이어지는 연속 기록 일수
export const calcStreak = (dateSet) => {
  let cursor = todayStr()
  if (!dateSet.has(cursor)) cursor = addDays(cursor, -1)
  let streak = 0
  while (dateSet.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`
  const d = new Date(iso)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
