import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GeminiService } from "@/lib/services/gemini";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        submissions: {
          select: { problem: { select: { category: true } }, status: true }
        }
      }
    });

    const job = await prisma.jobPost.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const userProfile = {
      resumeData: user.resumeData,
      preparationLevel: user.preparationLevel,
      completedTopics: [...new Set(user.submissions.filter(s => s.status === "Accepted").map(s => s.problem.category))]
    };

    const gemini = new GeminiService();
    const analysis = await gemini.analyzeJobGap(userProfile, job);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Job Gap API Error:", error);
    return NextResponse.json({ error: "Failed to analyze gap" }, { status: 500 });
  }
}
