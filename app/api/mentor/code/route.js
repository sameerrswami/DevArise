import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { code, language, context } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const gemini = new GeminiService();
    const explanation = await gemini.explainCode(code, language || "javascript", context);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Code Mentor API Error:", error);
    return NextResponse.json({ error: "Failed to analyze code" }, { status: 500 });
  }
}
