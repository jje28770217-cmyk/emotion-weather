import { useCallback, useEffect, useState } from 'react'
import { supabase, isLive } from './supabase'

const DEMO_USER = { id: 'demo', email: 'demo@local', demo: true }

const friendlyError = (error) => {
  const msg = error?.message ?? ''
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.'
  if (msg.includes('already registered')) return '이미 가입된 이메일이에요. 로그인해 주세요.'
  if (msg.includes('at least 6')) return '비밀번호는 6자 이상이어야 해요.'
  if (msg.includes('Email not confirmed')) return '이메일 인증이 필요해요. 메일함을 확인해 주세요.'
  if (msg.includes('valid email') || msg.includes('invalid format')) return '올바른 이메일 주소를 입력해 주세요.'
  if (msg.includes('rate limit')) return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
  return `문제가 발생했어요: ${msg}`
}

// 데모 모드에서는 로그인 없이 가상 사용자로 동작하고,
// 실서비스 모드에서는 Supabase 이메일 로그인을 사용합니다.
export function useAuth() {
  const [user, setUser] = useState(isLive ? null : DEMO_USER)
  const [loading, setLoading] = useState(isLive)

  useEffect(() => {
    if (!isLive) return undefined
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(friendlyError(error))
  }, [])

  // 이메일 인증이 켜져 있으면 세션이 바로 생기지 않으므로 needsConfirm 을 돌려줍니다.
  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(friendlyError(error))
    return { needsConfirm: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    if (isLive) await supabase.auth.signOut()
  }, [])

  return { user, loading, signIn, signUp, signOut }
}
