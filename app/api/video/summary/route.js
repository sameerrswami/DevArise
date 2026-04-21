import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { title, description } = await request.json();

    if (!title || !description) {
      return new Response(JSON.stringify({ error: "Title and description are required" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const geminiService = new GeminiService();

    // Generate AI summary
    const summary = await geminiService.generateVideoSummary(
      title,
      description,
    );
    // Generate quiz questions
    const quiz = await geminiService.generateQuiz(title, description);

    return new Response(JSON.stringify({
      summary,
      quiz,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Summary generation error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate summary and quiz" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
