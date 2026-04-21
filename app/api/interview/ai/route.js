import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";
import { logger } from "@/lib/logger";

export async function POST(req) {
  try {
    const body = await req.json();
    const geminiService = new GeminiService();

    if (body.action === "generate-questions") {
      const {
        jobPosition,
        jobDesc,
        jobExperience,
        questionCount = 10,
      } = body;

      if (!jobPosition || !jobDesc || !jobExperience) {
        return NextResponse.json(
          { error: "jobPosition, jobDesc, and jobExperience are required" },
          { status: 400 }
        );
      }

      const questions = await geminiService.generateInterviewQuestions(
        jobPosition,
        jobDesc,
        jobExperience,
        Number(questionCount) || 10
      );

      return NextResponse.json({ success: true, questions });
    }

    // ✅ FIXED: Added missing condition and destructuring
    if (body.action === "evaluate-answer") {
      const { question, correctAnswer, userAnswer } = body;

      if (!question || !correctAnswer || !userAnswer) {
        return NextResponse.json(
          { error: "question, correctAnswer, and userAnswer are required" },
          { status: 400 }
        );
      }

      const evaluation = await geminiService.evaluateInterviewAnswer(
        question,
        correctAnswer,
        userAnswer
      );

      return NextResponse.json({ success: true, evaluation });
    }

    if (body.action === "generate-dynamic-question") {
      const { jobPosition, jobExperience, history = [] } = body;

      const question = await geminiService.generateDynamicInterviewQuestion(
        jobPosition,
        jobExperience,
        history
      );

      return NextResponse.json({ success: true, question });
    }

    if (body.action === "evaluate-session") {
      const { history = [] } = body;

      const evaluation = await geminiService.evaluateInterviewSession(history);

      return NextResponse.json({ success: true, evaluation });
    }

    return NextResponse.json(
      { error: "Invalid action supplied" },
      { status: 400 }
    );
  } catch (error) {
    logger.error("POST /api/interview/ai API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
