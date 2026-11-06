import { useCallback, useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { PageTitle, SampleBadge } from '../components/LoginGate'
import { MSG_MAX, NICK_MAX, addMessage, listMessages, validateGuestbook } from '../lib/api'
import { timeAgo } from '../lib/date'

const AVATARS = ['#ffd9a8', '#cfe6ff', '#e3d9ff', '#ffd3dc', '#d5f0e1', '#fff0b3']
const avatarColor = (name) => AVATARS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length]

const THROTTLE_KEY = 'ew-gb-last'
const THROTTLE_MS = 20000 // 도배 방지: 20초에 한 번

export default function Guestbook({ notify, refreshKey }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setMessages(await listMessages())
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const submit = async (e) => {
    e.preventDefault()
    const invalid = validateGuestbook({ nickname, message })
    if (invalid) return setError(invalid)

    let last = 0
    try {
      last = Number(localStorage.getItem(THROTTLE_KEY)) || 0
    } catch {
      /* 무시 */
    }
    const wait = THROTTLE_MS - (Date.now() - last)
    if (wait > 0) return setError(`${Math.ceil(wait / 1000)}초 후에 다시 남길 수 있어요.`)

    setSending(true)
    setError('')
    try {
      const saved = await addMessage({ nickname, message })
      setMessages((prev) => [saved, ...prev])
      setMessage('')
      try {
        localStorage.setItem(THROTTLE_KEY, String(Date.now()))
      } catch {
        /* 무시 */
      }
      notify('응원 메시지를 남겼어요 💌')
    } catch (err) {
      setError(`등록하지 못했어요: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-8 sm:px-6 md:pb-20">
      <PageTitle title="응원 방명록" sub="서로에게 따뜻한 한마디를 남겨 주세요. 누구나 볼 수 있어요." />

      <div className="grid items-start gap-5 md:grid-cols-[340px_1fr]">
        <form onSubmit={submit} className="card p-5 sm:p-6 md:sticky md:top-24">
          <h2 className="font-display text-xl">응원 남기기</h2>
          <label className="mt-4 block">
            <span className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
              닉네임
              <span className="font-medium text-ink-faint">
                {nickname.length} / {NICK_MAX}
              </span>
            </span>
            <input className="input" maxLength={NICK_MAX} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="예) 구름빵" />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
              응원 메시지
              <span className="font-medium text-ink-faint">
                {message.length} / {MSG_MAX}
              </span>
            </span>
            <textarea
              className="input min-h-[120px] resize-none leading-relaxed"
              maxLength={MSG_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="오늘도 수고했어요, 당신의 하루를 응원해요."
            />
          </label>
          {error && <p className="mt-3 rounded-xl bg-[#fde8ea] px-3 py-2 text-sm text-[#a8404f]">{error}</p>}
          <button type="submit" disabled={sending} className="btn-primary mt-4 w-full">
            <Icon name="send" size={16} />
            {sending ? '보내는 중…' : '응원 보내기'}
          </button>
        </form>

        <section aria-live="polite">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-ink-soft">{loading ? '불러오는 중…' : `응원 ${messages.length}개`}</p>
            <button onClick={load} className="chip hover:!bg-white" aria-label="새로고침">
              <Icon name="refresh" size={13} /> 새로고침
            </button>
          </div>

          {loadError ? (
            <div className="card p-8 text-center text-sm text-ink-soft">
              방명록을 불러오지 못했어요.
              <br />
              <span className="text-xs text-ink-faint">{loadError}</span>
            </div>
          ) : loading && messages.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card h-24 animate-pulse" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="card p-10 text-center text-ink-soft">아직 응원이 없어요. 첫 번째 응원을 남겨 주세요!</div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m.id} className="card animate-fade-up p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg"
                      style={{ background: avatarColor(m.nickname) }}
                    >
                      {[...m.nickname][0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-bold">
                        {m.nickname}
                        {m.sample && <SampleBadge />}
                      </p>
                      <p className="text-xs text-ink-faint">{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
