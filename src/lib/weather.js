// 다섯 가지 감정 날씨 정의 (이름·설명·색·위로 메시지)
export const WEATHERS = [
  {
    key: 'sunny',
    label: '맑음',
    desc: '행복하고 기분 좋은 하루',
    color: '#F7C65B',
    messages: [
      '오늘의 햇살이 당신의 마음에도 오래 머물렀으면 좋겠어요.',
      '기분 좋은 하루네요! 이 순간을 마음껏 즐겨요.',
      '웃고 있는 당신 덕분에 세상이 조금 더 환해졌어요.',
    ],
  },
  {
    key: 'partly',
    label: '구름 조금',
    desc: '평온하고 무난한 하루',
    color: '#8FC4F2',
    messages: [
      '무난한 하루도 충분히 소중한 하루예요.',
      '잔잔한 날들이 쌓여 단단한 마음이 만들어져요.',
      '평온한 오늘, 잠깐 숨을 고르며 쉬어가요.',
    ],
  },
  {
    key: 'cloudy',
    label: '흐림',
    desc: '우울하거나 지친 하루',
    color: '#A9B4CC',
    messages: [
      '지친 마음엔 쉬어가는 시간이 필요해요. 오늘도 충분히 잘했어요.',
      '구름 뒤에서도 해는 늘 그 자리에 있어요.',
      '아무것도 안 해도 괜찮은 날이 있어요. 스스로를 토닥여 주세요.',
    ],
  },
  {
    key: 'rain',
    label: '비',
    desc: '슬프거나 속상한 하루',
    color: '#6FA0D8',
    messages: [
      '비가 내리는 날도 언젠가는 맑아질 거예요.',
      '마음껏 울어도 괜찮아요. 비가 그친 뒤엔 하늘이 더 맑아지니까요.',
      '속상했던 마음, 여기에 털어놓고 가요.',
    ],
  },
  {
    key: 'thunder',
    label: '천둥',
    desc: '화나거나 스트레스받는 하루',
    color: '#9B8BD0',
    messages: [
      '화가 날 땐 깊게 들이쉬고, 천천히 내쉬어 보세요.',
      '천둥도 결국엔 지나가요. 오늘의 폭풍도 곧 잦아들 거예요.',
      '그만큼 마음이 힘들었다는 뜻이에요. 잠시 멈추고 쉬어가요.',
    ],
  },
]

export const WEATHER_MAP = Object.fromEntries(WEATHERS.map((w) => [w.key, w]))

export const pickMessage = (key) => {
  const list = WEATHER_MAP[key]?.messages ?? []
  return list[Math.floor(Math.random() * list.length)] ?? ''
}

// 배경 그라데이션 (파스텔) — neutral 은 아직 감정을 고르지 않았을 때
export const GRADIENTS = {
  neutral: 'linear-gradient(165deg, #cfe6ff 0%, #e6e4ff 48%, #ffe6ee 100%)',
  sunny: 'linear-gradient(165deg, #fff0b3 0%, #ffd9a8 50%, #ffc4cc 100%)',
  partly: 'linear-gradient(165deg, #bfdfff 0%, #d9ecff 52%, #fff1de 100%)',
  cloudy: 'linear-gradient(165deg, #c4cddd 0%, #d6dce8 52%, #e9ecf3 100%)',
  rain: 'linear-gradient(165deg, #9fbddf 0%, #b7cde6 52%, #d3e1f1 100%)',
  thunder: 'linear-gradient(165deg, #a9a2d0 0%, #bfb3dc 52%, #dccfea 100%)',
}
