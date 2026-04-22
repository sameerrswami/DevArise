/**
 * GET /api/placement-tests/[testId]/results
 * 
 * Fetch detailed test results and analysis
 */

import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { testId } = params;
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get("attemptId");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch attempt with complete details
    const attempt = await prisma.placementTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: true,
        roundResults: {
          orderBy: { roundNumber: "asc" },
        },
        analysis: true,
      },
    });

    if (!attempt || attempt.userId !== user.id || attempt.testId !== testId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (attempt.status !== "completed") {
      return Response.json(
        { success: false, error: "Test is not completed" },
        { status: 400 }
      );
    }

    // Format response
    const results = {
      attemptId: attempt.id,
      testId: attempt.testId,
      testTitle: attempt.test.title,
      completedAt: attempt.completedAt,
      finalResult: {
        score: attempt.totalScore,
        maxScore: attempt.totalMarks,
        percentage: Math.round(attempt.percentage * 100) / 100,
        isPassed: attempt.isPassed,
        status: attempt.isPassed ? "passed" : "failed",
      },
      roundResults: attempt.roundResults.map((r) => ({
        roundNumber: r.roundNumber,
        roundType: r.roundType,
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        status: r.isPassed ? "passed" : "failed",
        breakdown: {
          correct: r.correctAnswers,
          wrong: r.wrongAnswers,
          skipped: r.skippedAnswers,
          total: r.totalQuestions,
        },
        strengths: r.strengths,
        weaknesses: r.weaknesses,
        recommendations: r.recommendations,
      })),
      analysis: attempt.analysis ? {
        overallPercentage: attempt.analysis.overallPercentage,
        failureReason: attempt.analysis.failureReason,
        topicStrengths: attempt.analysis.topicStrengths,
        topicWeaknesses: attempt.analysis.topicWeaknesses,
        commonMistakes: attempt.analysis.commonMistakes,
        recommendations: attempt.analysis.recommendations,
        metrics: {
          accuracy: attempt.analysis.accuracy,
          speed: attempt.analysis.speed,
          consistency: attempt.analysis.consistency,
        },
      } : null,
    };

    return Response.json(
      { success: true, data: results },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching results:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fetch user's test history and weak areas
 */

export async function POST(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { testId } = params;

    // Get all attempts for this test
    const attempts = await prisma.placementTestAttempt.findMany({
      where: {
        userId: user.id,
        testId,
        status: "completed",
      },
      include: {
        analysis: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Get weak areas for this user
    const weakAreas = await prisma.userWeakArea.findMany({
      where: { userId: user.id },
      orderBy: {
        severity: "desc",
      },
    });

    // Get strength areas
    const strengthAreas = await prisma.userStrengthArea.findMany({
      where: { userId: user.id },
      orderBy: {
        proficiency: "desc",
      },
    });

    // Calculate stats
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a) => a.isPassed).length;
    const averageScore = attempts.length > 0 ?
      attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length :
      0;
    const bestScore = attempts.length > 0 ?
      Math.max(...attempts.map((a) => a.percentage)) :
      0;

    return Response.json(
      {
        success: true,
        data: {
          attempts: totalAttempts,
          passed: passedAttempts,
          passRate:
            totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
          averageScore: Math.round(averageScore * 100) / 100,
          bestScore: Math.round(bestScore * 100) / 100,
          weakAreas: weakAreas.slice(0, 5),
          strengthAreas: strengthAreas.slice(0, 5),
          recentAttempts: attempts.slice(0, 5).map((a) => ({
            attemptId: a.id,
            completedAt: a.completedAt,
            score: a.totalScore,
            maxScore: a.totalMarks,
            percentage: a.percentage,
            isPassed: a.isPassed,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user analysis:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
