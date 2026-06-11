import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genimi = new GoogleGenerativeAI(process.env.GEMINIKEY!)

async function generateWithRetry(model: any, prompt: any, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (event: any) {
      if ((event.status === 503 || event.message?.includes("503")) && i < retries - 1) {
        console.log(`${i + 1}번째 재시도 중...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      throw event
    }
  }
}

export async function POST(request:NextRequest) {
  try {const formData = await request.formData()
  const file = formData.get("file") as File
  const mode = formData.get("mode") as string
  const model = genimi.getGenerativeModel({model : "gemini-3.5-flash"})

  if (mode === "tailquestion")
  {
    const audio = formData.get("audio") as string
    const question = formData.get("question") as string
    const mimeType = formData.get("mimeType") as string || "audio/webm"

    const prompt = 
    [
      {
        inlineData :
        {
           mimeType: mimeType,
          data : audio
        }
       
      },
       {
          text : `
          면접 질문 : "${question}"
          # 역할
          당신은 대학 입시 전문 면접관입니다.
          현재 주어진 음성 답변과 전에 있던 면접 질문을 이용해
          원래 면접 질문과 면접자의 음성 답변을 비교 분석하여
          답변의 취약점과 확장 가능성을 정확히 짚는 꼬리 질문을 생성합니다.


          # 처리 순서 (내부 분석 — 출력하지 않음)

          [1단계: 음성 전사 및 신호 포착]

          답변을 전사하면서 아래 3가지 신호를 함께 표시합니다.

            불확실 신호
            "아마도", "잘 모르겠지만", "~인 것 같아요", 말 더듬기, 머뭇거림은
             해당 개념을 실제로 이해했는지 검증 필요

            회피 신호
            "아니, 그러니까...", 갑작스러운 화제 전환, 특정 부분에서 지나치게 짧은 답변은
            개념이 정리되지 않았거나 모르는 부분을 숨기고 있을 가능성있으니 검증 필요

            암기 신호
            근거 없이 확신에 찬 주장, 외운 것처럼 유창하지만 설명이 없는 부분은
            진짜 이해인지 단순 암기인지 검증 필요

          [2단계: 질문-답변의 갭 분석]

          원래 질문이 요구한 것과 실제 답변을 아래 5개 기준으로 비교합니다.

            1. 응답 완결성 : 질문의 핵심에 직접 답했는가?
            2. 근거 및 원리 : 주장은 했지만 이유나 원리 설명이 빠진 부분이 있는가?
            3. 명확성 : 모호하거나 두루뭉술하게 넘어간 표현이 있는가?
            4. 1단계 신호 : 불확실·회피·암기 신호가 포착된 지점이 있는가?
            5. 새 실마리 : 답변에서 새롭게 등장한 탐구 가능한 키워드가 있는가?

          [3단계: 꼬리 질문 우선순위 결정]

          아래 순서로 가장 가치 있는 항목 3개를 선택합니다.

            순위 1 — 응답 완결성 문제 (질문의 핵심을 빗나간 경우)
            순위 2 — 불확실, 회피, 암기 신호 포착 지점
            순위 3 — 근거, 원리 누락 (주장만 하고 설명 없는 경우)
            순위 4 — 명확성 부족 (모호한 표현 사용)
            순위 5 — 새 실마리 확장 (위 항목이 없을 때만 사용)

          ---

          # 꼬리 질문 유형 및 형태

            명확화 : "~라고 하셨는데, 정확히 어떤 의미인가요?"
            근거 요청 : "왜 그렇게 생각하시나요?"
            원리 심화 : "그 현상이 일어나는 원리를 설명해주세요."
            검증 : "방금 말씀하신 ~, 조금 더 풀어서 설명해주시겠어요?"
            확장 : "말씀하신 ~를 실제 상황에 적용한다면 어떻게 될까요?"
            추궁 : "~에 대해서는 어떻게 생각하시나요?"

            밑에 있는 질문들은 실제 면접 질문들이야. 이런 식으로 반드시 답변해줘
            1. 자기소개와 지원동기 말씀해주세요.
     
            2. 융합수학대전에 참여했네요, 그 행사에서 학생은 무엇을 했나요?
                
            3. RC회로의 동작 매커니즘을 설명해주세요.
                
            4. 전자공학에 미분 방정식이 활용된다고 나와있는데 구체적으로 설명해줄 수 있나요? 
                
            5. 와트의 값을 변화시킬 때 충전기의 충전속도는 어떻게 변화할까?'라는 탐구 질문을 설정해 봄. 추가 조사로 충전기의 작동원리를 조사하여 보고서를 작성함. -> 이 부분에 대해 자세히 설명해주세요.
                
            6. 선형대수학 시간에는 무엇을 배웠나요? 
                
            7. 미분과 적분에 대해 간단하게 설명해주세요. 

            8. 학교생활에서 창의력을 발휘한 사례가 있으면 소개해주세요. 
                
            9. 아직 소개하지 못한 의미있는 활동이 있으면 말해주세요.
                
            10. 입학 후 학업계획을 말씀해주세요. 
                
            11. 마지막으로 하고 싶은 말 해주세요.

           
          ---

          # 질문 원칙

          DO
          답변에서 실제로 나온 단어, 표현을 질문에 직접 인용
          우선순위가 높은 취약점부터 공략
          질문 하나에 핵심 하나만
          

          DON'T
          답변에 없는 내용을 지어내서 질문 
          이미 명확하게 설명된 내용을 다시 묻기 
          "잘 하셨는데요" 등 평가 발언 포함 
          Yes/No로 끝나는 닫힌 질문
          두 가지 이상을 한 질문에 섞기

          ---

          # 출력 형식

          아래 형식으로만 출력합니다.
          꼬리질문: (꼬리질문 내용)
          피드백: (답변에서 부족했던 점 한 줄)
          음성이 없으면 "답변이 없습니다."라고 답변합니다.
          음성 파일이 없다면 "음성 파일이 도착하지 않았습니다."라고 답변합니다.
          음성 파일의 음성이 작다면 "소리가 작습니다."라고 답변합니다.
          `
        }
    ]
    const response = await generateWithRetry(model, prompt)
  return NextResponse.json({tail : response})
  }

  if (!file ) {
    return NextResponse.json({error :"파일이 없어요"}, {status : 400})
  }

  const changeBinary = await file.arrayBuffer()
  const base64 = Buffer.from(changeBinary).toString("base64")



  const promptText = mode == "interview" ? 
    `# 역할 및 평가 목표
    당신은 대학 입시 전문 면접관입니다.
    파일로 주어진 학생의 생기부를 분석하여 아래 세 가지를 평가하는 모의 면접을 진행합니다.
    탐구 역량 : 스스로 문제를 설정하고 깊이 파고든 경험
    전공 적합성 : 지원 전공과 활동의 연결성
    사고의 깊이 : 개념 이해 수준과 응용 능력

    ---

    # 처리 순서

    생기부를 받으면 출력 전, 다음 내부 분석을 먼저 수행합니다.
    (이 분석 내용은 절대 출력하지 않습니다.)

    [내부 분석]
    1 지원 전공 및 진로 방향 확인
    2 핵심 탐구 활동 TOP 3 선정
      - 학생이 직접 탐구 주제를 설정한 것 우선
      - 단순 참여보다 보고서,실험,결론이 있는 것 우선
    3 전공 관련 핵심 키워드 추출 (과목명, 이론, 실험 등)

    ---


    # 질문 원칙

    DO
    생기부에 실제로 기재된 활동명, 탐구 주제, 과목명을 직접 언급
    학생이 직접 설정한 탐구 질문이나 결론을 기반으로 후속 질문
    하나의 질문에 하나의 핵심만 담기
    이미 사용한 질문 목록 (절대 중복 금지): ${formData.get("usedQuestions") || "없음"}

    DON'T
    생기부에 없는 내용을 지어내거나 유추해서 질문
    "~가 중요하다고 생각하나요?" 같은 의견 묻기
    Yes/No로 끝나는 닫힌 질문
    두 가지 이상을 한 문장에 섞은 복합 질문

    ---

    # 출력 형식

    오직 아래 형식만 출력합니다.
    설명, 단계 표시, 분석 내용, 부연 설명 일절 포함하지 않습니다.

    질문
    질문
    질문
    질문
    질문

    ---

    생기부 PDF를 분석하고 시작하세요.` : 
    `너는 대학 교수야. 
    위 탐구보고서를 읽고 부족한 점과 보완할 질문 5개를 만들어줘.
    이미 사용한 질문 목록 (절대 중복 금지): ${formData.get("usedQuestions") || "없음"}
    반드시 아래 형식으로만 답해줘:
    1. 질문
    2. 질문
    3. 질문
    4. 질문
    5. 질문`
  const prompt = 
  [
    {
      inlineData : 
      {
       mimeType: "application/pdf",
        data : base64
      }
    },
    {
        text : promptText
    }
  ]
  const response = await generateWithRetry(model, prompt)
  return NextResponse.json({question : response})}
  catch (error : any)
  {
    console.error("오류:", error.message)
    return NextResponse.json(
      { error : error.message},
      {status : error.status || 500}
    )
  }  
}
  

  
