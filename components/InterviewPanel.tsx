"use client"

import { useState, useRef, useEffect } from "react"
import { InterviewerState, RecordItem } from "../app/page"

interface PanelProps {
  interviewers: InterviewerState[];
  setInterviewers: React.Dispatch<React.SetStateAction<InterviewerState[]>>;
  interviewLog: RecordItem[];
  setInterviewLog: React.Dispatch<React.SetStateAction<RecordItem[]>>;
  loading: boolean;
  setLoading: (l: boolean) => void;
}

export default function InterviewPanel({ interviewers, setInterviewers, interviewLog, setInterviewLog, loading, setLoading }: PanelProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [answer, setAnswer] = useState("")
  
  // 📐 [핵심] 4명 중 가장 큰 말풍선 높이를 저장할 상태
  const [maxBubbleHeight, setMaxBubbleHeight] = useState(150)

  // 각 질문의 높이를 측정하기 위한 가상 돔(DOM) 참조 그룹
  const hiddenElementsRef = useRef<(HTMLDivElement | null)[]>([])

  const isIntroPhase = 
    interviewers[0]?.currentQuestion === "자기소개와 지원동기 말씀해주세요." && 
    interviewLog.length === 0;

  const displayIndex = hoveredIndex !== null ? hoveredIndex : activeIndex
  const currentInterviewer = interviewers[displayIndex]

  const beforePositions = ["before:left-[12.5%]", "before:left-[37.5%]", "before:left-[62.5%]", "before:left-[87.5%]"]
  const afterPositions = ["after:left-[12.5%]", "after:left-[37.5%]", "after:left-[62.5%]", "after:left-[87.5%]"]
  const currentBeforeLeft = beforePositions[displayIndex]
  const currentAfterLeft = afterPositions[displayIndex]

  const shouldInterviewerBeSilent = isIntroPhase && displayIndex !== 0;

  // 📐 [실시간 계산] 면접관들의 질문 텍스트가 바뀔 때마다 가장 큰 높이를 계산하여 동기화
  useEffect(() => {
    if (interviewers.length === 0) return

    // 약간의 렌더링 타이밍 확보를 위해 requestAnimationFrame 활용
    requestAnimationFrame(() => {
      const heights = hiddenElementsRef.current.map((el, idx) => {
        if (!el) return 0
        
        // 만약 자기소개 단계이고 1번이 아니라면 '경청 멘트'의 높이를 측정해야 함
        if (isIntroPhase && idx !== 0) {
          const silentEl = el.parentElement?.querySelector(`.hidden-silent-measure-${idx}`) as HTMLDivElement
          return silentEl ? silentEl.offsetHeight : el.offsetHeight
        }
        
        return el.offsetHeight
      })

      const maxCalculated = Math.max(...heights, 150) // 최소 높이 기본 가이드라인 150px 설정
      setMaxBubbleHeight(maxCalculated)
    })
  }, [interviewers, isIntroPhase])

  async function handleSendAnswer() {
    if (!answer.trim() || loading || (isIntroPhase && activeIndex !== 0)) return
    setLoading(true)

    const targetInterviewer = interviewers[activeIndex]
    const updatedHistory = [
      ...targetInterviewer.chatHistory,
      { role: "user", parts: [{ text: answer }] }
    ]

    setInterviewLog([
      ...interviewLog,
      {
        interviewerName: targetInterviewer.name,
        question: targetInterviewer.currentQuestion,
        answer: answer
      }
    ])

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: updatedHistory }),
      })
      const data = await response.json()

      const nextInterviewers = interviewers.map((inv, idx) => {
        const nextNewQuestion = data.followUpQuestions[idx] || inv.currentQuestion;

        if (idx === activeIndex) {
          return {
            ...inv,
            currentQuestion: nextNewQuestion,
            chatHistory: [
              ...updatedHistory,
              { role: "model", parts: [{ text: nextNewQuestion }] }
            ]
          }
        } else {
          return { ...inv, currentQuestion: nextNewQuestion }
        }
      })

      setInterviewers(nextInterviewers)
      setAnswer("")
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-3xl flex flex-col items-center">
      
      {/* 4명 중 최댓값으로 실시간 고정된 동적 인라인 Style 높이 주입 */}
      <div 
        className={`w-full duo-bubble-dynamic mb-12 ${currentBeforeLeft} ${currentAfterLeft}`}
        style={{ height: `${maxBubbleHeight}px` }} 
      >
        <div className="duo-bubble-container">
          <span className="text-[10px] font-black text-[#b0b0b0] uppercase tracking-wider mb-1 block">
            {shouldInterviewerBeSilent ? "지켜보는 중" : `${currentInterviewer?.name}의 질문`}
          </span>
          <div className="duo-bubble-text">
            {shouldInterviewerBeSilent 
              ? `(지원자의 자기소개와 지원동기를 진중하게 경청하고 있습니다.)`
              : `"${currentInterviewer?.currentQuestion}"`
            }
          </div>
        </div>
      </div>

      {/* 👥 면접관 라인업 */}
      <div 
        className="grid grid-cols-4 w-full mb-8 -mx-2"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {interviewers.map((inv, idx) => {
          const isActive = idx === activeIndex
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onClick={() => !loading && setActiveIndex(idx)}
              className={`px-2 py-1 transition-all duration-150 ${
                loading ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div
                className={`duo-card p-4 flex flex-col items-center justify-center text-center transform transition-all duration-150 active:scale-95 h-full ${
                  isActive ? "duo-interviewer-active" : "hover:bg-[#fafafa]"
                }`}
              >
                <div className={`w-12 h-12 rounded-full ${inv.avatarColor} border border-[#3c3c3c]/10 flex items-center justify-center text-sm font-black mb-2 shadow-sm`}>
                  {idx + 1}
                </div>
                <span className="font-black text-xs md:text-sm text-[#4b4b4b] block w-full">{inv.name}</span>
                <span className="text-[10px] text-[#afafaf] font-bold block truncate w-full">{inv.role}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 하단 입력 폼 레이아웃 */}
      <div className="duo-card w-full p-4 bg-white flex flex-col md:flex-row gap-3 items-end">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={
            loading 
              ? "면접관이 답변을 기록하는 중입니다..." 
              : (isIntroPhase && activeIndex !== 0
                  ? `1번 면접관의 공통 질문에 먼저 응답해야 면접이 정상 진행됩니다.`
                  : `"${interviewers[activeIndex]?.name}"에게 전달할 답변을 입력하세요.`
                )
          }
          disabled={loading || (isIntroPhase && activeIndex !== 0)}
          rows={3}
          className="flex-1 w-full p-3 bg-[#f7f7f7] rounded-xl font-bold text-sm text-[#4b4b4b] focus:outline-none focus:ring-2 focus:ring-[#1cb0f6] border-2 border-transparent resize-none disabled:opacity-40"
        />
        <button
          onClick={handleSendAnswer}
          disabled={loading || !answer.trim() || (isIntroPhase && activeIndex !== 0)}
          className="duo-btn duo-btn-primary px-6 py-4 text-sm whitespace-nowrap w-full md:w-auto"
        >
          {loading ? "분석 중..." : "답변 전송"}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 👁️ [화면 비표시 레이어] 눈에 보이지 않게 4개 질문의 높이를 사전 연산하는 정밀 박스 */}
      {/* ========================================================================= */}
      <div className="absolute top-0 left-0 invisible pointer-events-none w-full max-w-3xl px-6 opacity-0 select-none z-[-999]">
        {interviewers.map((inv, idx) => (
          <div key={idx} className="duo-bubble-dynamic mb-2">
            <div 
              ref={(el) => { hiddenElementsRef.current[idx] = el; }}
              className="duo-bubble-container"
            >
              <span className="text-[10px] mb-1 block">들러리</span>
              <div className="duo-bubble-text">"{inv.currentQuestion}"</div>
            </div>
            {/* 자기소개 페이즈용 경청 멘트 높이 백업용 측정기 */}
            <div className={`duo-bubble-container hidden-silent-measure-${idx}`}>
              <span className="text-[10px] mb-1 block">들러리</span>
              <div className="duo-bubble-text">(지원자의 자기소개와 지원동기를 진중하게 경청하고 있습니다.)</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}