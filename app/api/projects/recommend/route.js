import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GeminiService } from "@/lib/services/gemini";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interests } = await req.json();

    // Fetch user profile and roadmap data for context
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            skillLevel: true, // Should match what we have in roadmap
            resumeData: true,
            preparationLevel: true
        }
    });

    const activeRoadmap = await prisma.placementRoadmap.findFirst({
        where: { userId: session.user.id, status: "active" },
        select: {
            targetRole: true,
            skillLevel: true
        }
    });

    const gemini = new GeminiService();
    const recommendations = await gemini.recommendProjects({
        skillLevel: activeRoadmap?.skillLevel || user?.preparationLevel || "Beginner",
        interests: interests || ["Full Stack Development"],
        targetRole: activeRoadmap?.targetRole || "Software Developer",
        resumeData: user?.resumeData || {}
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Project Recommendation API Error:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
