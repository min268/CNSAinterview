  "use client"
  import {useState, useRef, Suspense} from "react"
  import { useSearchParams, useRouter } from "next/navigation"
  
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>
  </svg>
)
const PdfIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
)
const SparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>
  </svg>
)
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 18l-6-6 6-6"/>
  </svg>
)
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>
  </svg>
)

  export function Interview()
  {
    const searchparams = useSearchParams()
    const router = useRouter()
    const mode = searchparams.get("mode") //모드
    const [isfile, setFile] = useState<File | null>(null) //파일 있나? 없나?
    const [question, setQuestion] = useState<{text : string, tail : string | null, id : string}[]>([]) //질문
    const [screen, setScreen] = useState("upload") //화면 상태
    const [recordingIndex, setRecordingIndex] = useState<number | null>(null) //녹음 중이냐? 아니냐?
    const recorderRef = useRef<MediaRecorder | null>(null)
    const chunkRef = useRef<Blob[]>([]) //녹음 부분부분
    const [loading, setLoading] = useState(false) //로딩
    const fileinput = useRef<HTMLInputElement | null>(null)
    const [error, setError] = useState<string | null>(null)
    const mimeTypeRef = useRef<string>("audio/webm")
    const [tailError, setTailError] = useState<string | null>(null)

    const modeLabel = mode === "interview" ? "생기부 면접" : "탐구보고서 검토"
    const modeBadge = mode === "interview" ? "학생부 기반" : "보고서 기반"
    const uploadLabel = mode === "interview" ? "생활기록부 PDF를 업로드하세요" : "탐구보고서 PDF를 업로드하세요"



    function handleFileUpload(event : React.ChangeEvent<HTMLInputElement>) //파일 업로드
    {
        const file = event.target.files?.[0]
        if (!file) return
        setFile(file)
    }

    async function handleGenerate()  //질문 만들기
    {
        if (!isfile) return
        setLoading(true)
        setError(null)
        const formData = new FormData()
        formData.append("mode", mode!)
        formData.append("file", isfile)
        try 
        {
            const response = await fetch("/api/generate", {method:"POST", body:formData})
            if (!response.ok) 
            {
              const errorData = await response.json()
              throw new Error(errorData.error || `서버 오류: ${response.status}`)
            }
            const data = await response.json()
            const separate = data.question.split("\n").filter((line:string) => line.trim() != "").map((text : string, id : number) => ({text, tail : null, id:`${id+1}`}))
            setQuestion(separate)
            setScreen("question")
        } 
        
        catch (e : any) 
        {
          const is503 = e.message?.includes("503") || e.message?.includes("high demand")
          setError(is503 ? "AI 서버가 잠시 혼잡해요. 잠깐 후 다시 시도해 주세요." : "질문 생성에 실패했어요. 다시 시도해 주세요.")
        }
        finally 
        {
            setLoading(false)
        }
        
      
       
    }

    async function startRecording() //녹음 시작 함수
    {
      setTailError(null)
        const stream = await navigator.mediaDevices.getUserMedia({audio:true})
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus": "audio/mp4"
        mimeTypeRef.current = mimeType
        const recorder = new MediaRecorder(stream, { mimeType })
        chunkRef.current = []
        recorder.ondataavailable = (ev) => {
            chunkRef.current.push(ev.data)
        }
        recorder.start(100)
        recorderRef.current = recorder
    }

    async function stopRecording(q : string, index : number) //녹음 끝 함수
    {
        if (!recorderRef.current) return 
        
        recorderRef.current!.onstop = async () => {
            const blob = new Blob(chunkRef.current, {type : mimeTypeRef.current}) //합치기
            const reader = new FileReader()
            reader.readAsDataURL(blob)
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(",")[1]
                const formData = new FormData()
                formData.append("mode", "tailquestion")
                formData.append("audio", base64)
                formData.append("question",q)
                formData.append("mimeType", mimeTypeRef.current)
                
                const response = await fetch("/api/generate", {method : "POST", body : formData}) 
                const data = await response.json()
                const errormessage = ["답변이 없습니다.", "음성 파일이 도착하지 않았습니다.", "소리가 작습니다."]
                const isError = errormessage.some(msg => data.tail?.includes(msg))
                if (isError)
                {
                  setTailError(data.tail)
                  return
                }

                setQuestion(prev => prev.map((q, i) => i === index ? {...q, text:data.tail, tail : null}:q))
            }
        }
        recorderRef.current!.stop()
    }

    if (screen === "upload") {
    return (
      <div className="shell">
       

        <main className="main fade-in">
          <div className="backrow">
            <button className="btn btn-ghost" onClick={() => router.push("/")}>
              <BackIcon /> 모드 선택
            </button>
          </div>
          <div className="eyebrow">{modeBadge}</div>
          <h1 className="h1">{modeLabel}</h1>
          <p className="lede">{uploadLabel}. 업로드한 PDF를 분석해 5개의 예상 질문을 생성합니다.</p>

          <div className="upload-wrap">
            {!isfile ? (
              <div className="dropzone" onClick={() => fileinput.current?.click()}>
                <div className="dz-icon"><UploadIcon /></div>
                <div>
                  <div className="dz-title">PDF 파일을 끌어다 놓거나 클릭해서 선택</div>
                  <div className="dz-hint">최대 20MB · PDF 형식만 지원</div>
                </div>
                <div className="dz-pick">파일 선택하기</div>
                <input ref={fileinput} type="file" accept=".pdf" hidden onChange={handleFileUpload} />
              </div>
            ) : (
              <div className="file-chip">
                <div className="file-ic"><PdfIcon /></div>
                <div className="file-meta">
                  <div className="file-name">{isfile.name}</div>
                  <div className="file-size">{(isfile.size / 1024 / 1024).toFixed(1)} MB · 업로드 완료</div>
                </div>
                <button className="file-x" onClick={() => setFile(null)}><XIcon /></button>
              </div>
            )}

            <div className="gen-row">
              <button className="btn btn-primary" disabled={!isfile || loading} onClick={handleGenerate}>
                {loading ? <><span className="spinner" /> 질문 생성 중…</> : <><SparkIcon /> 질문 생성하기</>}
              </button>
              {!isfile && <span className="gen-note">먼저 PDF를 업로드해 주세요</span>}
            </div>
            {error && (<p style={{color:"red", marginTop: "12px"}}>{error}</p>)}
          </div>
        </main>
      </div>
    )
  }

  // 질문 화면
  return (
    <div className="shell">
     
      <main className="main fade-in">
        <div className="backrow">
          <button className="btn btn-ghost" onClick={() => setScreen("upload")}>
            <BackIcon /> 다시 업로드
          </button>
        </div>

        <div className="q-head">
          <div>
            <div className="eyebrow">{modeBadge}</div>
            <h1 className="h1">예상 질문 {question.length}개</h1>
            <p className="lede">질문을 읽고 녹음 버튼을 눌러 답해 보세요.</p>
          </div>
          <span className="progress-pill">
            {question.filter(q => q.id.includes("-")).length} / {question.length} 답변
          </span>
        </div>

        <div className="q-list">
          {question.map((q, index) => (
            <div key={index} className={`q-card ${recordingIndex === index ? "is-recording" : ""}`}>
              <div className="q-num">{q.id}</div>
              <div className="q-body">
                {q.id.includes("-") && (
                  <span className="q-tag follow">꼬리 질문</span>
                )}
                <div className="q-text">{q.text}</div>
              </div>
              <div className="q-actions">
                <button
                  className={`rec-btn ${recordingIndex === index ? "recording" : ""}`}
                  onClick={() => {
                    if (recordingIndex === index) {
                      stopRecording(q.text, index)
                      setRecordingIndex(null)
                    } else {
                      startRecording()
                      setRecordingIndex(index)
                    }
                  }}
                >
                  {recordingIndex === index
                    ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
                  }
                </button>
                <span className="rec-label">
                  {recordingIndex === index ? "녹음 중…" : "녹음"}
                </span>
              </div>
            </div>
          ))}
        </div>
          {tailError && (
           <p style={{color: "red", marginTop: "12px"}}>{tailError}</p>
           )}
          <div style={{marginTop: "24px", display: "flex", justifyContent: "center"}}>
          <button className="btn btn-primary" onClick={() => router.push("/")}>
           처음으로
          </button>
        </div>
      </main>
    </div>
  )
}
export default function Page() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <Interview />
    </Suspense>
  )
}