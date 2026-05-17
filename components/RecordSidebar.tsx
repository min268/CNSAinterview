"use client"

import { RecordItem } from "../app/page"

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  log: RecordItem[];
}

export default function RecordSidebar({ isOpen, onClose, log }: SidebarProps) {
  return (
    <>
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#f7f7f7] border-l-4 border-[#e5e5e5] shadow-2xl z-50 transform transition-transform duration-300 ease-out p-6 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#e5e5e5] pb-3">
          <h3 className="text-lg font-black text-[#4b4b4b]">📜 실시간 면접 기록장</h3>
          <button onClick={onClose} className="duo-btn px-3 py-1 bg-white text-gray-500 hover:bg-gray-100 text-xs">닫기</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {log.length === 0 ? (
            <div className="text-center py-20 text-[#afafaf] font-bold text-sm">
              아직 오간 문답 기록이 없습니다.<br/>답변을 전송해 보세요!
            </div>
          ) : (
            log.map((item, index) => (
              <div key={index} className="duo-card p-4 bg-white space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-[#cdf1ff] text-[#1899d6] font-black px-2 py-0.5 rounded-full uppercase">
                    {item.interviewerName}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">Turn {index + 1}</span>
                </div>
                <div>
                  <p className="text-xs text-red-500 font-black">Q. 질문</p>
                  <p className="text-xs md:text-sm text-[#4b4b4b] font-extrabold">{item.question}</p>
                </div>
                <div className="pt-2 border-t border-dashed border-gray-200">
                  <p className="text-xs text-green-600 font-black">A. 나의 답변</p>
                  <p className="text-xs md:text-sm text-gray-600 font-medium whitespace-pre-wrap">{item.answer}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}