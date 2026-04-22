import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/contests/leaderboard - Get real-time leaderboard for a contest
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get("contestId");

    if (!contestId) {
      return NextResponse.json({ error: "Contest ID required" }, { status: 400 });
    }

    // Get contest
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        entries: {
          orderBy: [
            { score: 'desc' },
            { totalPenalty: 'asc' },
            { createdAt: 'asc' }
          ],
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                contestRating: true
              }
            },
            submissions: {
              include: {
                submission: {
                  select: {
                    problem: {
                      select: {
                        id: true,
                        title: true,
                        difficulty: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    // Build leaderboard with detailed stats
    const leaderboard = contest.entries.map((entry, index) => {
      const solvedProblems = entry.submissions.filter(s => s.accepted);
      const totalAttempts = entry.submissions.length;
      const accuracy = totalAttempts > 0 ? (solvedProblems.length / totalAttempts * 100) : 0;

      return {
        rank: index + 1,
        userId: entry.userId,
        user: entry.user,
        score: entry.score,
        problemsSolved: entry.problemsSolved,
        totalPenalty: entry.totalPenalty,
        accuracy: Math.round(accuracy * 100) / 100,
        timeTaken: entry.timeTaken,
        rating: entry.user.contestRating,
        submissions: entry.submissions.map(s => ({
          problemId: s.problemId,
          problemTitle: s.submission?.problem?.title,
          difficulty: s.submission?.problem?.difficulty,
          accepted: s.accepted,
          attempts: s.attempts,
          solvedAt: s.solvedAt
        }))
      };
    });

    // Get contest stats
    const totalParticipants = contest.entries.length;
    const totalSubmissions = contest.entries.reduce((sum, e) => sum + e.submissions.length, 0);
    const totalSolved = contest.entries.reduce((sum, e) => sum + e.problemsSolved, 0);

    return NextResponse.json({
      success: true,
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status,
        duration: contest.duration,
        startsAt: contest.startsAt,
        endsAt: contest.endsAt
      },
      stats: {
        totalParticipants,
        totalSubmissions,
        totalSolved,
        averageScore: contest.averageScore
      },
      leaderboard,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

// Helper function to get user's current rank
async function getRank(req) {
  try {
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get("contestId");
    const userId = searchParams.get("userId");

    if (!contestId || !userId) {
      return NextResponse.json({ error: "Contest ID and User ID required" }, { status: 400 });
    }

    // Get user's entry
    const entry = await prisma.contestEntry.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId
        }
      }
    });

    if (!entry) {
      return NextResponse.json({ error: "User not in this contest" }, { status: 404 });
    }

    // Count how many users have higher score
    const higherScoreCount = await prisma.contestEntry.count({
      where: {
        contestId,
        OR: [
          { score: { gt: entry.score } },
          { 
            AND: [
              { score: { equals: entry.score } },
              { totalPenalty: { lt: entry.totalPenalty } }
            ]
          }
        ]
      }
    });

    const rank = higherScoreCount + 1;

    // Get total participants
    const totalParticipants = await prisma.contestEntry.count({
      where: { contestId }
    });

    return NextResponse.json({
      success: true,
      rank,
      totalParticipants,
      score: entry.score,
      problemsSolved: entry.problemsSolved,
      totalPenalty: entry.totalPenalty
    });

  } catch (error) {
    console.error("Get Rank Error:", error);
    return NextResponse.json({ error: "Failed to get rank" }, { status: 500 });
  }
}
