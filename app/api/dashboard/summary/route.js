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
        submissions: { include: { problem: true } },
        histories: { include: { video: true } },
        roadmaps: {
          where: { status: "active" },
          include: {
            phases: {
              include: {
                weeks: {
                  include: {
                    tasks: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const interviews = await prisma.mockInterview.findMany({
       where: { createdBy: session.user.id }, // Assuming createdBy is userId
       include: { userAnswers: true }
    });

    const userData = {
      submissions: user.submissions.map(s => ({
        topic: s.problem.category,
        status: s.status,
        date: s.createdAt
      })),
      interviews: interviews.map(i => ({
        role: i.jobPosition,
        summary: i.summaryFeedback,
        date: i.createdAt
      })),
      resumeData: user.resumeData,
      preparationLevel: user.preparationLevel
    };

    const gemini = new GeminiService();
    
    // Performance metrics and readiness score
    const [readiness, insights] = await Promise.all([
      gemini.calculatePlacementReadiness(userData),
      gemini.generateDashboardInsights(userData)
    ]);

    // Aggregate statistics
    const stats = {
      points: user.points,
      streak: user.streak,
      solvedCount: user.submissions.filter(s => s.status === "Accepted").length,
      interviewCount: interviews.length,
      watchCount: user.histories.length
    };

    // Calculate Roadmap Progress
    const activeRoadmap = user.roadmaps[0] || null;
    let roadmapProgress = 0;
    if (activeRoadmap) {
        const totalTasks = activeRoadmap.phases.reduce((acc, phase) => 
            acc + phase.weeks.reduce((wAcc, week) => wAcc + week.tasks.length, 0), 0);
        const completedTasks = activeRoadmap.phases.reduce((acc, phase) => 
            acc + phase.weeks.reduce((wAcc, week) => wAcc + week.tasks.filter(t => t.isCompleted).length, 0), 0);
        roadmapProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }

    return NextResponse.json({ 
      success: true, 
      stats,
      readiness, 
      insights,
      activeRoadmap: activeRoadmap ? {
          id: activeRoadmap.id,
          targetRole: activeRoadmap.targetRole,
          progress: roadmapProgress,
          summary: activeRoadmap.summary
      } : null,
      recentSubmissions: user.submissions.slice(0, 5),
      recentInterviews: interviews.slice(0, 5)
    });

  } catch (error) {
    console.error("Dashboard Summary API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard summary" }, { status: 500 });
  }
}
