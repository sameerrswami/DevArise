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
    const roadmap = await gemini.generateRoadmap(topic);

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error("Roadmap API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
