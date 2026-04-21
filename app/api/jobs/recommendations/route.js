import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GeminiService } from "@/lib/services/gemini";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        submissions: {
          select: { problem: { select: { category: true } }, status: true }
        }
      }
    });

    const jobs = await prisma.jobPost.findMany();

    const userProfile = {
      resumeData: user.resumeData,
      preparationLevel: user.preparationLevel,
      completedTopics: [...new Set(user.submissions.filter(s => s.status === "Accepted").map(s => s.problem.category))]
    };

    const gemini = new GeminiService();
    // Only pass necessary job info to Gemini to save tokens/speed
    const jobSummaries = jobs.map(j => ({ id: j.id, title: j.title, category: j.category, description: j.description.substring(0, 300) }));
    
    const recommendations = await gemini.recommendJobs(userProfile, jobSummaries);

    return NextResponse.json({ success: true, recommendations });
  } catch (error) {
    console.error("Recommendations API Error:", error);
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
