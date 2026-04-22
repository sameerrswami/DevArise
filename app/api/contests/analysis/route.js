import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/contests/analysis - Get detailed performance analysis for a contest
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get("contestId");

    if (!contestId) {
      return NextResponse.json({ error: "Contest ID required" }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get contest history
    const contestHistory = await prisma.contestHistory.findUnique({
      where: {
        userId_contestId: {
          userId: user.id,
          contestId
        }
      },
      include: {
        contest: {
          include: {
            problems: {
              include: {
                problem: true
              }
            }
          }
        }
      }
    });

    if (!contestHistory) {
      return NextResponse.json({ error: "No contest history found" }, { status: 404 });
    }

    // Get user's submissions for this contest
    const entry = await prisma.contestEntry.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId: user.id
        }
      },
      include: {
        submissions: {
          include: {
            submission: true
          }
        }
      }
    });

    // Get leaderboard data for comparison
    const allEntries = await prisma.contestEntry.findMany({
      where: { contestId },
      orderBy: { score: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            contestRating: true
          }
        }
      }
    });

    const userRank = allEntries.findIndex(e => e.userId === user.id) + 1;
    const totalParticipants = allEntries.length;

    // Calculate percentile
    const percentile = ((totalParticipants - userRank + 1) / totalParticipants) * 100;

    // Problem-wise analysis
    const problemAnalysis = contestHistory.contest.problems.map(cp => {
      const userSubmissions = entry.submissions.filter(s => s.problemId === cp.problemId);
      const accepted = userSubmissions.some(s => s.accepted);
      const attempts = userSubmissions.length;
      const solvedAt = accepted ? userSubmissions.find(s => s.accepted)?.solvedAt : null;

      // Calculate time taken for this problem
      let timeTaken = null;
      if (solvedAt) {
        timeTaken = solvedAt.getTime() - contestHistory.startedAt.getTime();
      }

      return {
        problemId: cp.problemId,
        title: cp.problem.title,
        difficulty: cp.problem.difficulty,
        points: cp.points,
        solved: accepted,
        attempts,
        timeTaken,
        solvedAt,
        editorial: cp.editorial
      };
    });

    // Time analysis
    const timeAnalysis = {
      totalContestTime: contestHistory.timeTaken || null,
      averageTimePerProblem: contestHistory.problemsSolved > 0 
        ? contestHistory.timeTaken / contestHistory.problemsSolved 
        : null,
      fastestSolve: Math.min(...problemAnalysis.filter(p => p.solved).map(p => p.timeTaken || Infinity)),
      slowestSolve: Math.max(...problemAnalysis.filter(p => p.solved).map(p => p.timeTaken || 0))
    };

    // Comparison with other participants
    const averageScore = allEntries.reduce((sum, e) => sum + e.score, 0) / totalParticipants;
    const topScore = allEntries[0]?.score || 0;
    const scoreDifference = contestHistory.score - averageScore;

    // Rating change analysis
    const ratingChange = contestHistory.ratingChange;
    const ratingDirection = ratingChange > 0 ? 'gain' : ratingChange < 0 ? 'loss' : 'neutral';

    // Performance insights
    const insights = [];
    
    if (contestHistory.accuracy >= 0.8) {
      insights.push({
        type: 'positive',
        title: 'Excellent Accuracy',
        description: `You maintained ${Math.round(contestHistory.accuracy * 100)}% accuracy, which is outstanding!`
      });
    }

    if (contestHistory.easySolved === contestHistory.easyTotal) {
      insights.push({
        type: 'positive',
        title: 'Perfect Easy Problems',
        description: 'You solved all easy problems correctly!'
      });
    }

    if (contestHistory.hardSolved > 0) {
      insights.push({
        type: 'positive',
        title: 'Hard Problem Solver',
        description: `You solved ${contestHistory.hardSolved} hard problem(s)!`
      });
    }

    if (timeAnalysis.averageTimePerProblem && timeAnalysis.averageTimePerProblem > 30 * 60000) {
      insights.push({
        type: 'improvement',
        title: 'Speed Improvement Needed',
        description: 'Try to reduce your average time per problem to improve your ranking.'
      });
    }

    if (entry.submissions.length > contestHistory.problemsSolved * 2) {
      insights.push({
        type: 'improvement',
        title: 'Reduce Wrong Attempts',
        description: 'You had many wrong submissions. Focus on accuracy over speed.'
      });
    }

    if (percentile >= 90) {
      insights.push({
        type: 'positive',
        title: 'Top Performer',
        description: `You're in the top ${Math.round(100 - percentile)}% of participants!`
      });
    }

    return NextResponse.json({
      success: true,
      analysis: {
        contest: {
          id: contestHistory.contestId,
          title: contestHistory.contest.title,
          date: contestHistory.startedAt,
          duration: contestHistory.contest.duration
        },
        performance: {
          rank: userRank,
          totalParticipants,
          percentile: Math.round(percentile * 100) / 100,
          score: contestHistory.score,
          averageScore: Math.round(averageScore * 100) / 100,
          topScore,
          scoreDifference: Math.round(scoreDifference * 100) / 100,
          problemsSolved: contestHistory.problemsSolved,
          totalProblems: contestHistory.totalProblems,
          accuracy: Math.round(contestHistory.accuracy * 100) / 100
        },
        rating: {
          before: contestHistory.ratingBefore,
          after: contestHistory.ratingAfter,
          change: ratingChange,
          direction: ratingDirection
        },
        breakdown: {
          easy: {
            solved: contestHistory.easySolved,
            total: contestHistory.easyTotal
          },
          medium: {
            solved: contestHistory.mediumSolved,
            total: contestHistory.mediumTotal
          },
          hard: {
            solved: contestHistory.hardSolved,
            total: contestHistory.hardTotal
          }
        },
        timeAnalysis,
        problemAnalysis,
        insights
      }
    });

  } catch (error) {
    console.error("Contest Analysis Error:", error);
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
  }
}

// GET /api/contests/editorial - Get editorial for a specific problem in a contest
export async function GET_EDITORIAL(req) {
  try {
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get("contestId");
    const problemId = searchParams.get("problemId");

    if (!contestId || !problemId) {
      return NextResponse.json({ error: "Contest ID and Problem ID required" }, { status: 400 });
    }

    // Get editorial from contest problem
    const contestProblem = await prisma.contestProblem.findFirst({
      where: {
        contestId,
        problemId
      },
      include: {
        problem: true
      }
    });

    if (!contestProblem) {
      return NextResponse.json({ error: "Problem not found in contest" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      editorial: {
        problemId: contestProblem.problemId,
        title: contestProblem.problem.title,
        difficulty: contestProblem.problem.difficulty,
        content: contestProblem.editorial,
        points: contestProblem.points
      }
    });

  } catch (error) {
    console.error("Get Editorial Error:", error);
    return NextResponse.json({ error: "Failed to fetch editorial" }, { status: 500 });
  }
}
