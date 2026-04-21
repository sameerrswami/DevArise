import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";

export async function POST(req) {
  try {
    const { topic, message, history } = await req.json();

    if (!message || !topic) {
      return NextResponse.json({ error: "Message and Topic are required" }, { status: 400 });
    }

    const gemini = new GeminiService();
    // history usually contains the initial explanation as the first assistant message
    const response = await gemini.tutorChat(topic, message, history || []);

    return NextResponse.json({ reply: response });
  } catch (error) {
    console.error("Tutor Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
