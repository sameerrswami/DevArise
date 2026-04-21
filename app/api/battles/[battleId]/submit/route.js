/**
 * SUBMIT CODE API ENDPOINT
 * 
 * POST: Submit code solution during a battle
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BattleOrchestrator } from "@/lib/battle-orchestrator";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const orchestrator = new BattleOrchestrator();

/**
 * POST /api/battles/[battleId]/submit
 * Submit code solution
 */
export async function POST(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const battleId = params.battleId;
    const body = await request.json();
    const { code, language } = body;

    // Validation
    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: code, language" },
        { status: 400 }
      );
    }

    if (!["javascript", "python", "java", "cpp"].includes(language)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported language. Supported: javascript, python, java, cpp",
        },
        { status: 400 }
      );
    }

    // Get battle
    const battle = await prisma.codingBattle.findUnique({
      where: { id: battleId },
      include: {
        battleParticipants: {
          where: { userId: user.id },
        },
        problem: {
          select: { id: true, title: true },
        },
      },
    });

    if (!battle) {
      return NextResponse.json(
        { success: false, error: "Battle not found" },
        { status: 404 }
      );
    }

    // Check battle status
    if (battle.status !== "in-progress") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot submit code to battle with status: ${battle.status}`,
        },
        { status: 400 }
      );
    }

    // Check if user is participant
    if (!battle.battleParticipants.length) {
      return NextResponse.json(
        { success: false, error: "You are not a participant in this battle" },
        { status: 403 }
      );
    }

    // Calculate time since start
    const timeSinceStart = Math.round(
      (new Date() - battle.startedAt) / 1000
    );

    // Check if time limit exceeded
    if (timeSinceStart > battle.timeLimit) {
      return NextResponse.json(
        {
          success: false,
          error: "Time limit for this battle has exceeded",
        },
        { status: 400 }
      );
    }

    // Submit code
    const submission = await orchestrator.submitCode(battleId, user.id, {
      code,
      language,
      timeSinceStart,
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: "Failed to submit code" },
        { status: 500 }
      );
    }

    // Get updated leaderboard
    const leaderboard = await orchestrator.getLiveLeaderboard(battleId);

    return NextResponse.json(
      {
        success: true,
        data: {
          submissionId: submission.id,
          battleId,
          status: submission.status,
          score: submission.score,
          passedTestCases: submission.passedTestCases,
          totalTestCases: submission.totalTestCases,
          accuracy: submission.accuracy,
          isPlagiarism: submission.flaggedAsPlague,
          plagiarismScore: submission.plagiarismScore,
          timeSinceStart,
          leaderboard: leaderboard.slice(0, 5), // Top 5
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/battles/[battleId]/submit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit code",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/battles/[battleId]/submit
 * Get submission history for current user
 */
export async function GET(request, { params }) {
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

    const battleId = params.battleId;

    // Get submissions
    const submissions = await prisma.battleSubmission.findMany({
      where: {
        battleId,
        userId: user.id,
      },
      select: {
        id: true,
        status: true,
        score: true,
        passedTestCases: true,
        totalTestCases: true,
        accuracy: true,
        language: true,
        flaggedAsPlague: true,
        plagiarismScore: true,
        timeSinceStart: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          battleId,
          submissions: submissions.map((s) => ({
            id: s.id,
            status: s.status,
            score: s.score,
            passedTestCases: s.passedTestCases,
            totalTestCases: s.totalTestCases,
            accuracy: s.accuracy,
            language: s.language,
            isPlagiarism: s.flaggedAsPlague,
            plagiarismScore: s.plagiarismScore,
            timeSinceStart: s.timeSinceStart,
            submittedAt: s.submittedAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/battles/[battleId]/submit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get submissions",
      },
      { status: 500 }
    );
  }
}
