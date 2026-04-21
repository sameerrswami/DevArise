import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const gemini = new GeminiService();
    const response = await gemini.chat(message, history || []);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
