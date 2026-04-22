import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: "Missing resume text or job description" }, { status: 400 });
    }

    const gemini = new GeminiService();
    const matchResults = await gemini.matchResumeWithJD(resumeText, jobDescription);

    return NextResponse.json({ success: true, matchResults });
  } catch (error) {
    console.error("JD Match API Error:", error);
    return NextResponse.json({ error: "Failed to match JD" }, { status: 500 });
  }
}
