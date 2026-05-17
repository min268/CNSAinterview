"use client"

import { useState } from "react"
import UploadSection from "../components/UploadSection"
import InterviewPanel from "../components/InterviewPanel"
import RecordSidebar from "../components/RecordSidebar"
import "./interview.css"

export interface InterviewerState {
  name: string;
  role: string;
  avatarColor: string;
  currentQuestion: string;
  chatHistory: any[];
}

export interface RecordItem {
  interviewerName: string;
  question: string;
  answer: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pdfBase64, setPdfBase64] = useState("")
  
  const [interviewers, setInterviewers] = useState<InterviewerState[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [interviewLog, setInterviewLog] = useState<RecordItem[]>([])

  // 🏠 [신규 기능] 초기화 함수 (로고 클릭 시 처음 페이지로)
  function handleReset() {
    if (interviewers.length > 0) {
      if (!confirm("진행 중인 면접을 종료하고 처음 화면으로 돌아가시겠습니까?")) return
    }
    setInterviewers([])
    setInterviewLog([])
    setFileName("")
    setSelectedFile(null)
    setPdfBase64("")
  }

async function GenerateQuestions() {
    if (!selectedFile) return
    setLoading(true)

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const response = await fetch("/api/generate", { method: "POST", body: formData })
      const data = await response.json()

      setPdfBase64(data.pdfBase64)

      const profiles = [
        { name: "면접관 1", role: "전공 역량 평가관", avatarColor: "bg-blue-500 text-white" },
        { name: "면접관 2", role: "인성 및 태도 평가관", avatarColor: "bg-sky-400 text-white" },
        { name: "면접관 3", role: "서류 진위 검증관", avatarColor: "bg-indigo-400 text-white" },
        { name: "면접관 4", role: "발전 가능성 평가관", avatarColor: "bg-cyan-500 text-white" },
      ]

      const initialInterviewers = profiles.map((prof, idx) => {
        const q = data.questions[idx] || "본인의 진로 역량에 대해 설명해 주세요."
        
        // ⭕ [핵심 수정] Gemini 규격에 100% 일치하도록 role과 parts 구조 정렬
        return {
          ...prof,
          currentQuestion: q,
          chatHistory: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType: "application/pdf", data: data.pdfBase64 } },
                { text: "제 생활기록부입니다. 확인 후 면접관으로서 질문해 주세요." }
              ]
            },
            {
              role: "model",
              parts: [{ text: q }]
            }
          ]
        }
      })

      setInterviewers(initialInterviewers)
    } catch (error) {
      console.error("질문 생성 중 오류 발생:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#3c3c3c] flex flex-col items-center justify-start p-6 font-sans relative overflow-x-hidden">
      
      {/* 상단 타이틀 바 */}
      <header className="w-full max-w-3xl flex justify-between items-center mb-8 border-b-2 border-[#e5e5e5] pb-4">
        
        {/* 🎯 [변경] 호버 애니메이션이 적용된 리셋 연동 로고 */}
        <div onClick={handleReset} className="logo-container" title="처음 페이지로 이동">
          <span className="logo-blue">CN</span>
          <span className="logo-interview">interview</span>
          <span className="logo-blue">SA</span>
        </div>

        {/* 📜 [변경] 심플한 문서 아이콘 형태의 기록창 기호 버튼 */}
        {interviewers.length > 0 && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="duo-btn p-3 bg-white border-[#1cb0f6] border-b-4 hover:bg-[#f1f9ff] flex items-center justify-center relative"
            title="면접 기록장 보기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#1cb0f6" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125v1.125c0 .621-.504 1.125-1.125 1.125H5.625a1.125 1.125 0 0 1-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125Z" />
            </svg>
            {interviewLog.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {interviewLog.length}
              </span>
            )}
          </button>
        )}
      </header>

      {/* 1단계: 업로드 세션 */}
      {interviewers.length === 0 ? (
        <UploadSection 
          fileName={fileName}
          setFileName={setFileName}
          setSelectedFile={setSelectedFile}
          selectedFile={selectedFile}
          loading={loading}
          onGenerate={GenerateQuestions}
        />
      ) : (
        /* 2단계: 면접 시뮬레이터 판넬 */
        <InterviewPanel 
          interviewers={interviewers}
          setInterviewers={setInterviewers}
          interviewLog={interviewLog}
          setInterviewLog={setInterviewLog}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {/* 3단계: 우측 서랍형 기록창 */}
      <RecordSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        log={interviewLog}
      />
    </div>
  )
}