import { createClient } from '@supabase/supabase-js'

// .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 있으면 "실서비스 모드",
// 없으면 "데모 모드"(브라우저 localStorage + 샘플 데이터)로 동작합니다.
// anon 키는 공개되어도 안전한 키이며, 실제 보호는 DB의 RLS 정책이 담당합니다.
// ⚠ service_role 키는 절대 이 프로젝트(.env 포함)에 넣지 마세요.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isLive = Boolean(url && anonKey)
export const supabase = isLive ? createClient(url, anonKey) : null
