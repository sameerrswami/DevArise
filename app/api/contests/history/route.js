import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/contests/history - Get user's contest history and performance trends
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get contest history
    const contestHistory = await prisma.contestHistory.findMany({
      where: { userId: user.id },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            duration: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get rating history
    const ratingHistory = await prisma.ratingHistory.findMany({
      where: { userId: user.id },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
            startsAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Calculate performance trends
    const trends = calculateTrends(contestHistory);

    // Get recent achievements
    const recentAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: true
      },
      orderBy: {
        earnedAt: 'desc'
      },
      take: 5
    });

    return NextResponse.json({
      success: true,
      history: contestHistory.map(h => ({
        contestId: h.contestId,
        contestTitle: h.contest.title,
        date: h.startedAt,
        duration: h.contest.duration,
        rank: h.rank,
        totalParticipants: h.totalProblems, // This should be from a separate field
        score: h.score,
        problemsSolved: h.problemsSolved,
        totalProblems: h.totalProblems,
        accuracy: h.accuracy,
        ratingBefore: h.ratingBefore,
        ratingAfter: h.ratingAfter,
        ratingChange: h.ratingChange,
        breakdown: {
          easy: { solved: h.easySolved, total: h.easyTotal },
          medium: { solved: h.mediumSolved, total: h.mediumTotal },
          hard: { solved: h.hardSolved, total: h.hardTotal }
        }
      })),
      ratingHistory: ratingHistory.map(r => ({
        contestId: r.contestId,
        contestTitle: r.contest?.title || 'Practice',
        date: r.createdAt,
        ratingBefore: r.ratingBefore,
        ratingAfter: r.ratingAfter,
        ratingChange: r.ratingChange,
        newRating: r.newRating,
        rank: r.rank,
        totalParticipants: r.totalParticipants
      })),
      trends,
      recentAchievements: recentAchievements.map(a => ({
        id: a.achievementId,
        name: a.achievement.name,
        description: a.achievement.description,
        icon: a.achievement.icon,
        color: a.achievement.color,
        earnedAt: a.earnedAt
      })),
      stats: {
        totalContests: user.contestsParticipated,
        totalWins: user.contestsWon,
        currentRating: user.contestRating,
        bestRating: user.bestRating,
        worstRating: user.worstRating,
        totalProblemsSolved: user.totalProblemsSolved,
        averageAccuracy: user.averageAccuracy,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
      }
    });

  } catch (error) {
    console.error("Contest History Error:", error);
    return NextResponse.json({ error: "Failed to fetch contest history" }, { status: 500 });
  }
}

// Helper function to calculate performance trends
function calculateTrends(contestHistory) {
  if (contestHistory.length < 2) {
    return {
      ratingTrend: 'stable',
      ratingChangeRate: 0,
      accuracyTrend: 'stable',
      accuracyChangeRate: 0,
      speedTrend: 'stable',
      speedChangeRate: 0,
      performanceScore: 0
    };
  }

  // Sort by date
  const sorted = [...contestHistory].sort((a, b) => 
    new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  // Calculate rating trend (last 5 contests vs previous 5)
  const recent5 = sorted.slice(-5);
  const previous5 = sorted.slice(-10, -5);
  
  const recentAvgRatingChange = recent5.reduce((sum, h) => sum + h.ratingChange, 0) / recent5.length;
  const previousAvgRatingChange = previous5.length > 0 
    ? previous5.reduce((sum, h) => sum + h.ratingChange, 0) / previous5.length 
    : 0;

  const ratingTrend = recentAvgRatingChange > previousAvgRatingChange ? 'improving' : 
                      recentAvgRatingChange < previousAvgRatingChange ? 'declining' : 'stable';

  // Calculate accuracy trend
  const recentAccuracy = recent5.reduce((sum, h) => sum + h.accuracy, 0) / recent5.length;
  const previousAccuracy = previous5.length > 0 
    ? previous5.reduce((sum, h) => sum + h.accuracy, 0) / previous5.length 
    : 0;

  const accuracyTrend = recentAccuracy > previousAccuracy + 0.05 ? 'improving' : 
                        recentAccuracy < previousAccuracy - 0.05 ? 'declining' : 'stable';

  // Calculate speed trend (time taken)
  const recentSpeed = recent5.reduce((sum, h) => sum + (h.timeTaken || 0), 0) / recent5.length;
  const previousSpeed = previous5.length > 0 
    ? previous5.reduce((sum, h) => sum + (h.timeTaken || 0), 0) / previous5.length 
    : 0;

  const speedTrend = recentSpeed < previousSpeed * 0.9 ? 'improving' : 
                     recentSpeed > previousSpeed * 1.1 ? 'declining' : 'stable';

  // Calculate overall performance score (0-100)
  const lastContest = sorted[sorted.length - 1];
  const performanceScore = Math.min(100, Math.max(0,
    (lastContest.accuracy * 40) + // 40% weight on accuracy
    (Math.min(1, lastContest.problemsSolved / lastContest.totalProblems) * 30) + // 30% on problems solved
    (Math.min(1, 1 - (lastContest.rank - 1) / Math.max(1, lastContest.totalProblems)) * 30) // 30% on ranking
  ));

  return {
    ratingTrend,
    ratingChangeRate: Math.round((recentAvgRatingChange - previousAvgRatingChange) * 100) / 100,
    accuracyTrend,
    accuracyChangeRate: Math.round((recentAccuracy - previousAccuracy) * 100) / 100,
    speedTrend,
    speedChangeRate: Math.round(((previousSpeed - recentSpeed) / Math.max(1, previousSpeed)) * 100),
    performanceScore: Math.round(performanceScore)
  };
}

// Helper function to get detailed statistics
async function getStats(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get detailed contest history for statistics
    const contestHistory = await prisma.contestHistory.findMany({
      where: { userId: user.id },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            duration: true
          }
        }
      }
    });

    // Calculate statistics by difficulty
    const difficultyStats = {
      easy: { solved: 0, attempted: 0, accuracy: 0 },
      medium: { solved: 0, attempted: 0, accuracy: 0 },
      hard: { solved: 0, attempted: 0, accuracy: 0 }
    };

    for (const history of contestHistory) {
      difficultyStats.easy.solved += history.easySolved;
      difficultyStats.easy.attempted += history.easyTotal;
      difficultyStats.medium.solved += history.mediumSolved;
      difficultyStats.medium.attempted += history.mediumTotal;
      difficultyStats.hard.solved += history.hardSolved;
      difficultyStats.hard.attempted += history.hardTotal;
    }

    // Calculate accuracy for each difficulty
    for (const [diff, stats] of Object.entries(difficultyStats)) {
      stats.accuracy = stats.attempted > 0 
        ? Math.round((stats.solved / stats.attempted) * 100) 
        : 0;
    }

    // Calculate best and worst performances
    const sortedByRank = [...contestHistory].sort((a, b) => a.rank - b.rank);
    const sortedByRating = [...contestHistory].sort((a, b) => b.ratingChange - a.ratingChange);

    const bestPerformance = sortedByRank.length > 0 ? {
      contestTitle: sortedByRank[0].contest.title,
      date: sortedByRank[0].startedAt,
      rank: sortedByRank[0].rank,
      score: sortedByRank[0].score,
      ratingChange: sortedByRank[0].ratingChange
    } : null;

    const bestRatingGain = sortedByRating.length > 0 ? {
      contestTitle: sortedByRating[0].contest.title,
      date: sortedByRating[0].startedAt,
      ratingChange: sortedByRating[0].ratingChange,
      newRating: sortedByRating[0].ratingAfter
    } : null;

    // Calculate average stats
    const avgAccuracy = contestHistory.length > 0
      ? Math.round((contestHistory.reduce((sum, h) => sum + h.accuracy, 0) / contestHistory.length) * 100)
      : 0;

    const avgRank = contestHistory.length > 0
      ? Math.round(contestHistory.reduce((sum, h) => sum + h.rank, 0) / contestHistory.length)
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalContests: contestHistory.length,
        averageAccuracy: avgAccuracy,
        averageRank: avgRank,
        difficultyStats,
        bestPerformance,
        bestRatingGain,
        ratingProgression: contestHistory
          .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
          .map(h => ({
            date: h.startedAt,
            rating: h.ratingAfter,
            contestTitle: h.contest.title
          }))
      }
    });

  } catch (error) {
    console.error("Contest Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch contest stats" }, { status: 500 });
  }
}
