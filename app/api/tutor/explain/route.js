import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const gemini = new GeminiService();
    const explanation = await gemini.tutorExplain(topic);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Tutor Explain API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
