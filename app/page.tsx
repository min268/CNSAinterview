"use client"

import { useState } from "react"

export default function Home() {
  const [questions, setQuestions] = useState("")
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")

  async function FileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
  }

  async function Generate() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = fileInput.files?.[0]
    if (!file) return

    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    setQuestions(data.questions)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        생기부 면접 질문 생성기
      </h1>
      <p className="text-gray-500 mb-8">
        생기부 PDF를 업로드하면 면접 질문을 뽑아드려요
      </p>

      <input
        type="file"
        accept=".pdf"
        onChange={FileUpload}
        className="mb-4"
      />

      {fileName && (
        <p className="text-gray-500 text-sm mb-4">{fileName} 선택됨</p>
      )}

      <button
        onClick={Generate}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "질문 생성 중..." : "면접 질문 생성하기"}
      </button>

      {questions && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow max-w-2xl w-full">
          <h2 className="text-xl font-bold mb-4">면접 질문</h2>
          <pre className="whitespace-pre-wrap text-gray-700">{questions}</pre>
        </div>
      )}
    </div>
  )
}