import { useEffect, useState } from 'react'
import Icon from './Icon'

export default function AuthModal({ open, onClose, onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setInfo('')
    }
  }, [open, mode])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      if (mode === 'signin') {
        await onSignIn(email.trim(), password)
        onClose()
      } else {
        const { needsConfirm } = await onSignUp(email.trim(), password)
        if (needsConfirm) {
          setInfo('가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.')
          setMode('signin')
        } else {
          onClose()
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f3856]/30 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="card w-full max-w-sm !bg-white/90 p-7 animate-fade-up">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="auth-title" className="font-display text-2xl">
              {mode === 'signin' ? '다시 만나서 반가워요' : '감정 날씨 시작하기'}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">내 기록은 나만 볼 수 있어요.</p>
          </div>
          <button onClick={onClose} aria-label="닫기" className="rounded-full p-1.5 text-ink-soft hover:bg-black/5">
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">이메일</span>
            <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">비밀번호 (6자 이상)</span>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="rounded-xl bg-[#fde8ea] px-3 py-2 text-sm text-[#a8404f]">{error}</p>}
          {info && <p className="rounded-xl bg-[#e6f4ea] px-3 py-2 text-sm text-[#2f7a4a]">{info}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? '잠시만요…' : mode === 'signin' ? '로그인' : '회원가입'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-4 w-full text-center text-sm font-medium text-ink-soft hover:text-brand"
        >
          {mode === 'signin' ? '처음이신가요? 회원가입' : '이미 계정이 있나요? 로그인'}
        </button>
      </div>
    </div>
  )
}
