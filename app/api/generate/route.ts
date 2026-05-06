import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function generate(model: any, prompt: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (e: any) {
      if (e.status === 503 && i < retries - 1) {
        console.log(`503 오류 발생, ${i + 1}번째 재시도 중...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      throw e
    }
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "파일이 없어요" }, { status: 400 })
  }

  // PDF를 base64로 변환
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  console.log("파일 이름:", file.name)
  console.log("파일 크기:", file.size)
  console.log("base64 길이:", base64.length)

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const prompt = [
    {
      inlineData: {
        mimeType: "application/pdf",
        data: base64
      }
    },
    {
      text: `
        너는 대학 입시 면접관이야.
        위 생활기록부 PDF를 읽고 면접 질문 5개를 만들어줘.

        질문은 아래 형식으로 만들어줘:
        1. 질문
        2. 질문
        3. 질문
        4. 질문
        5. 질문
      `
    }
  ]

  const response = await generate(model, prompt)

  return NextResponse.json({ questions: response })
}