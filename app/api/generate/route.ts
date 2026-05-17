// app/api/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // =========================================================================
    // 🎙️ [분기 1] 답변 제출 시 작동: 4명의 면접관 질문을 동시에 '모두' 갱신
    // =========================================================================
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const chatHistory = body.history || [];

      // 대화 배열을 안전하게 텍스트 스트링으로 가공하여 전달 구조 최적화
      const formattedHistory = chatHistory.map((turn: any) => {
        const speaker = turn.role === "user" ? "지원자" : "면접관";
        const text = turn.parts?.[0]?.text || "";
        return `[${speaker}]: ${text}`;
      }).join("\n");

      const followUpPrompt = `
        아래는 현재까지 지원자와 면접관이 주고받은 면접 질문과 답변 기록입니다:
        ${formattedHistory}

        위 대화 흐름과 지원자의 마지막 답변을 종합적으로 판단하여, 다음 차례에 '4명의 면접관 전체'가 각각 이어서 던질 새로운 질문을 1개씩 총 4개 생성하세요.
        지원자의 답변 내용에서 모순점을 찾거나 더 깊은 설명을 요구하는 송곳 질문이어야 합니다.

        [각 면접관별 역할 분담 가이드라인]
        - 1번 면접관 (기본 역량): 지원자의 답변 태도, 가치관, 혹은 인성적 측면을 깊게 파고드는 심화 질문
        - 2번 면접관 (서류 진위): 방금 한 답변과 생기부 속 구체적 활동(대회, 탐구 등)의 연계성을 검증하는 질문
        - 3번 면접관 (전공 심층): 답변에 등장한 기술, 수학·과학공학적 개념 및 상세 메커니즘을 이론적으로 압박하는 질문
        - 4번 면접관 (발전 가능성): 이만큼 논의된 역량을 바탕으로 대학 입학 후 어떻게 연구하거나 발전시킬지 계획을 묻는 질문

        ⚠️ 주의사항: 다른 부연설명 없이 오직 ['질문1', '질문2', '질문3', '질문4'] 형태의 순수한 JSON 배열(원소 4개)로만 출력하세요.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: followUpPrompt }]
      });

      const textOutput = response.text || "[]";
      const jsonStart = textOutput.indexOf("[");
      const jsonEnd = textOutput.lastIndexOf("]") + 1;
      let followUpQuestions: string[] = [];

      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          followUpQuestions = JSON.parse(textOutput.substring(jsonStart, jsonEnd));
        } catch (e) {
          console.error("꼬리질문 4인 배열 파싱 실패");
        }
      }

      // 방어 코드: 파싱 에러 시 기본 유도 질문 작동
      if (followUpQuestions.length < 4) {
        followUpQuestions = [
          "방금 하신 말씀 중에서 본인의 가치관이 가장 잘 드러난 경험은 무엇인가요?",
          "그 활동을 수행할 때 발생한 예기치 못한 변수는 어떻게 통제하셨습니까?",
          "답변하신 메커니즘을 실제 산업이나 실무에 적용할 때 한계점은 무엇이라고 보십니까?",
          "그러한 경험이 대학 입학 후 전공 학업을 완수하는 데 어떤 밑거름이 될지 서술해주세요."
        ];
      }

      return NextResponse.json({ followUpQuestions });
    }

    // =========================================================================
    // 📂 [분기 2] 초기 세팅: 첫 생기부 PDF 업로드 시 질문 빌드
    // =========================================================================
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "파일이 누락되었습니다." }, { status: 400 });

      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      const isFixedIntro = Math.random() < 0.7; 

      const promptText = `
        당신은 대학 수시모집 학생부종합전형의 베테랑 압박 면접관입니다. 
        제출된 학교생활기록부를 날카롭게 정독하고, 지원자의 학업 역량, 전공 적합성, 서류의 진위 여부를 송곳처럼 검증할 수 있는 심층 문항을 생성하세요.

        [질문 생성 가이드라인]:
        1. 단순 일화성 질문이 아닌, 세특에 기재된 학술적 활동의 인과관계를 파악하세요. (예: 특정 탐구 대전이나 행사에서 학생이 담당한 구체적 역할과 행동)
        2. 전공 핵심 이론 및 매커니즘을 끄집어내어 개념적 이해도를 유도하세요. (예: 전자공학의 RC회로 동작 원리, 미분방정식이나 선형대수학 개념의 공학적 실무 활용성 검증)
        3. 보고서나 탐구 과제에 등장하는 변인 통제 및 추가 조사 과정을 파고드세요. (예: '와트의 변화에 따른 충전 속도 제어'와 같은 세부 서술의 인과관계 확인)
        4. 학업 계획이나 미처 서류에 드러나지 않은 창의적 문제 해결 사례, 최종 포부를 물어보세요.

        [출력 규격]:
        다른 미사여구 없이 오직 ${isFixedIntro ? "['질문2', '질문3', '질문4'] 형태의 원소 3개" : "['질문1', '질문2', '질문3', '질문4'] 형태의 원소 4개"}의 순수한 JSON 배열로만 출력하세요.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { inlineData: { mimeType: "application/pdf", data: base64Data } },
          { text: promptText }
        ],
      });

      const textOutput = response.text || "[]";
      const jsonStart = textOutput.indexOf("[");
      const jsonEnd = textOutput.lastIndexOf("]") + 1;
      let parsedQuestions: string[] = [];

      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          parsedQuestions = JSON.parse(textOutput.substring(jsonStart, jsonEnd));
        } catch (e) {
          console.error("초기 JSON 파싱 실패");
        }
      }

      let finalQuestions: string[] = [];
      if (isFixedIntro) {
        finalQuestions = [
          "자기소개와 지원동기 말씀해주세요.",
          parsedQuestions[0] || "학교생활기록부에 기재된 융합 탐구 활동에서 본인이 주도적으로 수행한 역할에 대해 상세히 설명해주세요.",
          parsedQuestions[1] || "교과 세특에 기재된 주요 공학적 개념과 수학적 모델링의 구체적인 매커니즘을 설명해주세요.",
          parsedQuestions[2] || "입학 후 전공 역량을 발전시키기 위한 구체적인 학업 계획과 미래 포부를 말씀해주세요."
        ];
      } else {
        finalQuestions = parsedQuestions.length >= 4 ? parsedQuestions.slice(0, 4) : [
          "우리 학과에 지원하게 된 결정적인 계기와 고교 시절의 노력을 연계하여 말씀해 주세요.",
          "활동 보고서 중 기재된 실험의 변인 통제 과정과 작동 원리에 대해 구체적으로 서술해 주세요.",
          "수학 및 과학 교과에서 배운 개념이 본인이 희망하는 공학 분야에 어떻게 접목되는지 사례를 들어 설명해 주세요.",
          "마지막으로 학교생활 중 창의성을 발휘해 문제를 해결했던 경험이나 본인만의 강점을 소개해 주세요."
        ];
      }

      return NextResponse.json({
        questions: finalQuestions.slice(0, 4),
        pdfBase64: base64Data,
      });
    }

    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "서버 내부 오류" }, { status: 500 });
  }
}