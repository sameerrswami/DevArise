/**
 * BATTLE RESULTS API ENDPOINT
 * 
 * GET: Get final results after battle completion
 */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/battles/[battleId]/results
 * Get final results with detailed analysis
 */
export async function GET(request, { params }) {
  try {
    const battleId = params.battleId;

    // Get battle
    const battle = await prisma.codingBattle.findUnique({
      where: { id: battleId },
      include: {
        problem: {
          select: { id: true, title: true, difficulty: true },
        },
        battleResults: {
          orderBy: { rank: "asc" },
          include: {
            participant: {
              include: {
                user: {
                  select: { id: true, name: true, image: true, email: true },
                },
              },
            },
          },
        },
        battleParticipants: {
          include: {
            user: {
              select: { id: true, name: true },
            },
            battleSubmissions: {
              select: {
                status: true,
                score: true,
                submittedAt: true,
              },
            },
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

    // Check if battle is completed
    if (battle.status !== "completed") {
      return NextResponse.json(
        {
          success: false,
          error: `Battle results not available. Status: ${battle.status}`,
        },
        { status: 400 }
      );
    }

    // Transform results
    const results = battle.battleResults.map((result) => ({
      rank: result.rank,
      userId: result.participant?.userId,
      userName: result.participant?.user?.name,
      userImage: result.participant?.user?.image,
      score: result.score,
      accuracy: result.accuracy,
      pointsEarned: result.pointsEarned,
      ratingBefore: result.ratingBefore,
      ratingAfter: result.ratingAfter,
      ratingChange: result.ratingChange,
      winnerBonus: result.winnerBonus,
      performanceSummary: result.performanceSummary,
      keyStrengths: result.keyStrengths || [],
      areasForImprovement: result.areasForImprovement || [],
      totalTimeSpent: result.totalTimeSpent,
      fastestSolveTime: result.fastestSolveTime,
    }));

    // Get plagiarism reports if any
    const plagiarismReports = await prisma.codeSimilarityReport.findMany({
      where: {
        battleId,
      },
      include: {
        submission1: {
          select: {
            userId: true,
            participant: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
        submission2: {
          select: {
            userId: true,
            participant: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const flaggedSubmissions = plagiarismReports
      .filter((r) => r.isPlagiarism)
      .map((r) => ({
        submissionId1: r.submission1?.id,
        submissionId2: r.submission2?.id,
        user1: r.submission1?.participant?.user?.name,
        user2: r.submission2?.participant?.user?.name,
        similarityScore: r.similarityScore,
        severity: r.severity,
        actionTaken: r.actionTaken,
      }));

    // Calculate statistics
    const totalSubmissions = battle.battleParticipants.reduce(
      (sum, p) => sum + p.battleSubmissions.length,
      0
    );

    const avgScore =
      results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          battleId,
          problemTitle: battle.problem?.title,
          difficulty: battle.problem?.difficulty,
          status: battle.status,
          startedAt: battle.startedAt,
          endedAt: battle.endedAt,
          duration: battle.endedAt && battle.startedAt
            ? Math.round((battle.endedAt - battle.startedAt) / 1000)
            : null,
          totalParticipants: battle.battleParticipants.length,
          totalSubmissions,
          averageScore: avgScore,
          results,
          plagiarismReport: {
            totalReports: plagiarismReports.length,
            flaggedSubmissions,
            hasSevereViolations: flaggedSubmissions.some(
              (s) => s.severity === "severe"
            ),
          },
          isRanked: battle.isRanked,
          message: "Battle completed - final results available",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/battles/[battleId]/results error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get battle results",
      },
      { status: 500 }
    );
  }
}
