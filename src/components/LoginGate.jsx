import WeatherIcon from './WeatherIcon'

// 로그인이 필요한 화면(달력/통계)에서, 로그인 전에 보여주는 안내 카드
export default function LoginGate({ onLogin, title }) {
  return (
    <div className="card mx-auto mt-6 max-w-md p-10 text-center animate-fade-up">
      <WeatherIcon type="partly" size={72} className="mx-auto animate-float" />
      <h2 className="mt-4 font-display text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        감정 기록은 나만 볼 수 있도록 계정별로 안전하게 저장돼요.
        <br />
        로그인하면 기록을 확인할 수 있어요.
      </p>
      <button onClick={onLogin} className="btn-primary mt-6">
        로그인 / 회원가입
      </button>
    </div>
  )
}

export function PageTitle({ title, sub }) {
  return (
    <div className="mb-6 animate-fade-up text-center">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
      {sub && <p className="mt-2 text-sm text-ink-soft sm:text-base">{sub}</p>}
    </div>
  )
}

export function SampleBadge() {
  return <span className="rounded-full bg-[#fff3c9] px-2 py-0.5 text-[10px] font-bold text-[#8a6a14]">샘플</span>
}
