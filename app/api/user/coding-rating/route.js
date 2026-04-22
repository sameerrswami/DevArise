/**
 * USER CODING RATING API ENDPOINT
 * 
 * GET: Get user's coding rating profile
 * PUT: Update rating preferences
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { RatingCalculator } from "@/lib/rating-calculator";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ratingCalculator = new RatingCalculator();

/**
 * GET /api/user/coding-rating
 * Get user's complete rating profile
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, image: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get or initialize rating
    let userRating = await prisma.userCodingRating.findUnique({
      where: { userId: user.id },
    });

    if (!userRating) {
      userRating = await ratingCalculator.initializeRating(user.id, user.name);
    }

    // Get recent battles
    const recentBattles = await prisma.battleResult.findMany({
      where: {
        participant: {
          userId: user.id,
        },
      },
      select: {
        id: true,
        rank: true,
        score: true,
        ratingBefore: true,
        ratingAfter: true,
        ratingChange: true,
        createdAt: true,
        battle: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            problem: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get global leaderboard rank
    const userPosition = await prisma.userCodingRating.count({
      where: {
        rating: {
          gt: userRating.rating,
        },
      },
    });

    const globalRank = userPosition + 1;

    // Get tier leaderboard rank
    const tier = ratingCalculator.getTier(userRating.rating);
    const tierPosition = await prisma.userCodingRating.count({
      where: {
        rating: {
          gte: ratingCalculator.RATING_TIERS[tier].min,
          lt: ratingCalculator.RATING_TIERS[tier].max,
          gt: userRating.rating,
        },
      },
    });
    const tierRank = tierPosition + 1;

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: user.id,
          userName: user.name,
          userImage: user.image,
          rating: {
            current: userRating.rating,
            change: userRating.ratingChange,
            best: userRating.bestRating,
            tier: ratingCalculator.getTier(userRating.rating),
            level: ratingCalculator.getOverallLevel(userRating.rating),
          },
          statistics: {
            battlesParticipated: userRating.battlesParticipated,
            battlesWon: userRating.battlesWon,
            battlesDraw: userRating.battlesDraw,
            battlesLost: userRating.battlesLost,
            winRate:
              userRating.battlesParticipated > 0
                ? Math.round(
                  (userRating.battlesWon / userRating.battlesParticipated) * 100
                )
                : 0,
            currentWinStreak: userRating.currentWinStreak,
            longestWinStreak: userRating.longestWinStreak,
            totalPointsEarned: userRating.totalPointsEarned,
          },
          skillLevels: {
            easy: userRating.easyRating,
            medium: userRating.mediumRating,
            hard: userRating.hardRating,
          },
          leaderboardRank: {
            global: globalRank,
            tier: tierRank,
            totalPlayers: await prisma.userCodingRating.count(),
          },
          activity: {
            firstBattleAt: userRating.firstBattleAt,
            lastBattleAt: userRating.lastBattleAt,
          },
          recentBattles: recentBattles.map((battle) => ({
            battleId: battle.battle?.id,
            rank: battle.rank,
            score: battle.score,
            ratingBefore: battle.ratingBefore,
            ratingAfter: battle.ratingAfter,
            ratingChange: battle.ratingChange,
            problemTitle: battle.battle?.problem?.title,
            difficulty: battle.battle?.difficulty,
            completedAt: battle.createdAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/user/coding-rating error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get rating profile",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/coding-rating
 * Update user rating preferences (not rating itself, only settings)
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { displayRating = true, notifyRatingChange = true } = body;

    // Note: In this implementation, we're not storing preferences.
    // This endpoint is a placeholder for future preference updates.
    // Currently just validates and returns success.

    if (typeof displayRating !== "boolean" || typeof notifyRatingChange !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid preference values",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Rating preferences updated",
          preferences: {
            displayRating,
            notifyRatingChange,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/user/coding-rating error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update rating preferences",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/coding-rating/leaderboard
 * Get global leaderboard
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { limit = 100, tier = null, offset = 0 } = body;

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { success: false, error: "Limit must be between 1 and 1000" },
        { status: 400 }
      );
    }

    const leaderboard = await ratingCalculator.getLeaderboard(limit, tier);

    return NextResponse.json(
      {
        success: true,
        data: {
          leaderboard,
          total: leaderboard.length,
          limit,
          tier: tier || "all",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/user/coding-rating/leaderboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get leaderboard",
      },
      { status: 500 }
    );
  }
}
