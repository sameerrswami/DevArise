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

    const userData = await req.json();

    if (!userData.year || !userData.targetRole) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const gemini = new GeminiService();
    const roadmapData = await gemini.generateDetailedPlacementRoadmap(userData);

    // Save roadmap to database
    // We transactionally create everything
    const savedRoadmap = await prisma.placementRoadmap.create({
      data: {
        userId: session.user.id,
        summary: roadmapData.summary,
        targetRole: userData.targetRole,
        targetCompany: userData.targetCompanyType,
        year: userData.year,
        skillLevel: userData.skillLevel,
        durationWeeks: roadmapData.totalDurationWeeks,
        phases: {
          create: roadmapData.phases.map((phase, pIdx) => ({
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
      },
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

    return NextResponse.json(savedRoadmap);
  } catch (error) {
    console.error("Roadmap API Error:", error);
    return NextResponse.json({ error: "Failed to generate and save roadmap" }, { status: 500 });
  }
}

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const roadmap = await prisma.placementRoadmap.findFirst({
            where: { 
                userId: session.user.id,
                status: "active"
            },
            include: {
                phases: {
                  orderBy: { order: 'asc' },
                  include: {
                    weeks: {
                      orderBy: { weekNumber: 'asc' },
                      include: {
                        tasks: true
                      }
                    }
                  }
                }
            }
        });

        return NextResponse.json(roadmap);
    } catch (error) {
        console.error("Fetch Roadmap Error:", error);
        return NextResponse.json({ error: "Failed to fetch roadmap" }, { status: 500 });
    }
}
