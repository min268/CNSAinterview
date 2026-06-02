"use client"
import { useRouter } from "next/navigation"

// 아이콘
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>
  </svg>
)
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>
  </svg>
)

export default function Home() {
  const router = useRouter()

  const modes = [
    {
      key: "interview",
      icon: <UserIcon />,
      extra: "학생부 기반",
      title: "생기부 면접",
      desc: "학교생활기록부를 업로드하면 활동·진로·인성 영역의 예상 질문을 만들어 줍니다."
    },
    {
      key: "report",
      icon: <DocIcon />,
      extra: "보고서 기반",
      title: "탐구보고서 검토",
      desc: "제출한 탐구·연구 보고서를 분석해 논리와 깊이를 검증하는 심층 질문을 생성합니다."
    }
  ]

  return (
    <div className="shell">
      {/* 상단 바 */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">
              <ChatIcon />
            </div>
            <div>
              <div className="brand-name">면접 도우미</div>
              <div className="brand-sub">AI 면접 질문 생성기</div>
            </div>
          </div>
          <div className="steps">
            <div className="step active">
              <div className="step-dot">1</div>
              <div className="step-label">모드 선택</div>
            </div>
            <div className="step-bar" />
            <div className="step">
              <div className="step-dot">2</div>
              <div className="step-label">자료 업로드</div>
            </div>
            <div className="step-bar" />
            <div className="step">
              <div className="step-dot">3</div>
              <div className="step-label">면접 진행</div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="main fade-in">
        <div className="eyebrow">START</div>
        <h1 className="h1">어떤 면접을 준비할까요?</h1>

        <div className="mode-grid">
          {modes.map((m) => (
            <button key={m.key} className="mode-card" onClick={() => router.push(`/interview?mode=${m.key}`)}>
              <div className="mode-icon">{m.icon}</div>
              <span className="mode-badge">{m.extra}</span>
              <div>
                <div className="mode-title">{m.title}</div>
                <p className="mode-desc">{m.desc}</p>
              </div>
              <div className="mode-go">시작하기 <ArrowIcon /></div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}