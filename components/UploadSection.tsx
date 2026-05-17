"use client"

interface UploadProps {
  fileName: string;
  setFileName: (name: string) => void;
  setSelectedFile: (file: File | null) => void;
  selectedFile: File | null;
  loading: boolean;
  onGenerate: () => void;
}

export default function UploadSection({ fileName, setFileName, setSelectedFile, selectedFile, loading, onGenerate }: UploadProps) {
  
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSelectedFile(file)
  }

  return (
    <div className="duo-card w-full max-w-xl p-8 flex flex-col items-center bg-white text-center">
      <div className="w-20 h-20 bg-[#e1f5fe] text-[#1cb0f6] rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">📂</div>
      <h2 className="text-xl font-black mb-2 text-[#4b4b4b]">생활기록부 장착하기</h2>
      <p className="text-sm text-[#777777] font-bold mb-6">4인의 전문 면접관이 서류 기반 맞춤 문항을 준비합니다.</p>

      <label className="duo-btn px-6 py-3 bg-[#fff] text-[#afafaf] border-dashed border-4 border-[#e5e5e5] hover:bg-[#fafafa] mb-6 w-full cursor-pointer block">
        <span className="font-bold text-sm">{fileName ? `✓ ${fileName}` : "파일 선택하기 (.pdf)"}</span>
        <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
      </label>

      <button
        onClick={onGenerate}
        disabled={loading || !selectedFile}
        className="duo-btn duo-btn-primary w-full py-4 text-lg tracking-wider disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "면접 세트 빌드 중..." : "면접 시작하기"}
      </button>
    </div>
  )
}