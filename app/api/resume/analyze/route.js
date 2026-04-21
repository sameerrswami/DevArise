import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/services/gemini";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import pdf from "pdf-parse";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const resumeText = data.text;

    const gemini = new GeminiService();
    const analysis = await gemini.analyzeResume(resumeText);

    // Save to User Profile if authenticated
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          resumeData: analysis
        }
      });
    }

    return NextResponse.json({ success: true, analysis, resumeText });
  } catch (error) {
    console.error("Resume Analysis API Error:", error);
    return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
  }
}
