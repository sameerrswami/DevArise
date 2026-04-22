/**
 * BATTLE DETAILS API ENDPOINT
 * 
 * GET: Get complete battle details
 */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/battles/[battleId]
 * Get comprehensive battle details
 */
export async function GET(request, { params }) {
  try {
    const battleId = params.battleId;

    // Get battle with all details
    const battle = await prisma.codingBattle.findUnique({
      where: { id: battleId },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            category: true,
            constraints: true,
            examples: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        battleParticipants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            battleParticipants: true,
            battleSubmissions: true,
            battleResults: true,
          },
        },
      },
    });

    if (!battle) {
      return NextResponse.json(
        { success: false, error: "Battle not found" },
        { status: 404 }
      );
    }

    // Calculate time remaining
    const now = new Date();
    let timeRemaining = null;

    if (battle.status === "in-progress" && battle.startedAt) {
      const elapsedMs = now - battle.startedAt;
      const remainingMs = battle.timeLimit * 1000 - elapsedMs;
      timeRemaining = Math.max(0, Math.round(remainingMs / 1000));
    }

    // Check if any participant is AFK
    const afkParticipants = battle.battleParticipants.filter(
      (p) => p.isAFK
    ).length;

    // Get active submissions count
    const activeSubmissions = await prisma.battleSubmission.count({
      where: {
        battleId,
        status: { in: ["accepted", "wrong_answer", "compilation_error"] },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: battle.id,
          title: battle.title,
          description: `${battle.maxParticipants}-player competitive coding battle`,
          status: battle.status,
          difficulty: battle.difficulty,
          isPublic: battle.isPublic,
          isRanked: battle.isRanked,
          timeLimit: battle.timeLimit,
          minParticipants: battle.minParticipants,
          maxParticipants: battle.maxParticipants,
          createdAt: battle.createdAt,
          startedAt: battle.startedAt,
          endedAt: battle.endedAt,
          timeRemaining,
          creator: battle.creator,
          problem: {
            id: battle.problem?.id,
            title: battle.problem?.title,
            description: battle.problem?.description,
            difficulty: battle.problem?.difficulty,
            category: battle.problem?.category,
            constraints: battle.problem?.constraints,
            examples: battle.problem?.examples
              ? JSON.parse(battle.problem.examples)
              : [],
          },
          participants: battle.battleParticipants.map((p) => ({
            userId: p.userId,
            userName: p.user.name,
            userImage: p.user.image,
            currentScore: p.currentScore,
            problemsSolved: p.problemsSolved,
            totalSubmissions: p.totalSubmissions,
            fastestSubmission: p.fastestSubmission,
            isAFK: p.isAFK,
            joinedAt: p.createdAt,
            lastActivityAt: p.lastActivityAt,
          })),
          statistics: {
            participantCount: battle._count.battleParticipants,
            totalSubmissions: battle._count.battleSubmissions,
            activeSubmissions,
            afkParticipants,
            resultsComplete: battle._count.battleResults > 0,
          },
          canJoin:
            battle.status === "waiting" &&
            battle._count.battleParticipants < battle.maxParticipants,
          canStart:
            battle.status === "waiting" &&
            battle._count.battleParticipants >= battle.minParticipants,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/battles/[battleId] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get battle details",
      },
      { status: 500 }
    );
  }
}
