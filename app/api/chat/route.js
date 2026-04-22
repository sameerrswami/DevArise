import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GeminiService } from "@/lib/services/gemini";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const gemini = new GeminiService();
    
    const reply = await gemini.buddyChat(message, history);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
