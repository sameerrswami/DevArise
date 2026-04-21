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

    // Get current active roadmap
    const activeRoadmap = await prisma.placementRoadmap.findFirst({
        where: { userId: session.user.id, status: "active" },
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
    });

    if (!activeRoadmap) {
        return NextResponse.json({ error: "No active roadmap found" }, { status: 404 });
    }

    // Get user performance data (e.g., last 5 submissions, contests)
    const recentSubmissions = await prisma.submission.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { problem: true }
    });

    const gemini = new GeminiService();
    const adjustedRoadmapData = await gemini.adjustRoadmap(
        activeRoadmap,
        activeRoadmap.phases, // Current progress is within the tasks
        { submissions: recentSubmissions }
    );

    // Update the roadmap in a transaction
    // To keep it simple, we could either update or replace. Replacing is safer for structural changes.
    await prisma.$transaction([
        prisma.roadmapTask.deleteMany({
            where: { week: { phase: { roadmapId: activeRoadmap.id } } }
        }),
        prisma.roadmapWeek.deleteMany({
            where: { phase: { roadmapId: activeRoadmap.id } }
        }),
        prisma.roadmapPhase.deleteMany({
            where: { roadmapId: activeRoadmap.id }
        }),
        prisma.placementRoadmap.update({
            where: { id: activeRoadmap.id },
            data: {
                summary: adjustedRoadmapData.summary,
                durationWeeks: adjustedRoadmapData.totalDurationWeeks,
                phases: {
                    create: adjustedRoadmapData.phases.map((phase, pIdx) => ({
                        name: phase.name,
                        duration: phase.duration,
                        objective: phase.objective,
                        order: pIdx,
                        weeks: {
                            create: phase.weeks.map((week) => ({
                                weekNumber: week.weekNumber,
                                focus: week.focus,
                                practiceGoals: week.practiceGoals,
                                tasks: {
                                    create: Object.entries(week.dailyTasks).map(([day, description]) => ({
                                        day,
                                        description
                                    }))
                                }
                            }))
                        }
                    }))
                }
            }
        })
    ]);

    const finalRoadmap = await prisma.placementRoadmap.findUnique({
        where: { id: activeRoadmap.id },
        include: {
            phases: {
                orderBy: { order: 'asc' },
                include: {
                    weeks: {
                        orderBy: { weekNumber: 'asc' },
                        include: { tasks: true }
                    }
                }
            }
        }
    });

    return NextResponse.json(finalRoadmap);
  } catch (error) {
    console.error("Roadmap Adjustment API Error:", error);
    return NextResponse.json({ error: "Failed to adjust roadmap" }, { status: 500 });
  }
}
