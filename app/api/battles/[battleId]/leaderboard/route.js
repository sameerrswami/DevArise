/**
 * LEADERBOARD API ENDPOINT
 * 
 * GET: Get live leaderboard for a battle
 */

import { prisma } from "@/lib/prisma";
import { BattleOrchestrator } from "@/lib/battle-orchestrator";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const orchestrator = new BattleOrchestrator();

/**
 * GET /api/battles/[battleId]/leaderboard
 * Get live leaderboard with real-time rankings
 */
export async function GET(request, { params }) {
  try {
    const battleId = params.battleId;

    // Get battle
    const battle = await prisma.codingBattle.findUnique({
      where: { id: battleId },
      include: {
        problem: {
          select: { title: true, difficulty: true },
        },
      },
    });

    if (!battle) {
      return NextResponse.json(
        { success: false, error: "Battle not found" },
        { status: 404 }
      );
    }

    // Get live leaderboard from orchestrator
    const leaderboard = await orchestrator.getLiveLeaderboard(battleId);

    // Calculate time remaining
    const now = new Date();
    let timeRemaining = null;

    if (battle.status === "in-progress" && battle.startedAt) {
      const elapsedMs = now - battle.startedAt;
      const remainingMs = battle.timeLimit * 1000 - elapsedMs;
      timeRemaining = Math.max(0, Math.round(remainingMs / 1000));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          battleId,
          problemTitle: battle.problem?.title,
          difficulty: battle.problem?.difficulty,
          status: battle.status,
          timeLimit: battle.timeLimit,
          timeRemaining,
          startedAt: battle.startedAt,
          endedAt: battle.endedAt,
          leaderboard: leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId,
            userName: entry.user?.name || "Anonymous",
            userImage: entry.user?.image,
            currentScore: entry.currentScore,
            problemsSolved: entry.problemsSolved,
            totalSubmissions: entry.totalSubmissions,
            fastestSubmission: entry.fastestSubmission,
            accuracy: entry.problemsSolved > 0
              ? Math.round((entry.problemsSolved / entry.totalSubmissions) * 100)
              : 0,
            isAFK: entry.isAFK,
            lastActivityAt: entry.lastActivityAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/battles/[battleId]/leaderboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get leaderboard",
      },
      { status: 500 }
    );
  }
}
