/**
 * POST /api/placement-tests/[testId]/submit-round
 * 
 * Submit answers for current round
 * Scores the round and determines progression
 */

import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { PlacementTestOrchestrator } from "@/lib/placement-test-orchestrator";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { testId } = params;
    const body = await request.json();

    const { attemptId, roundNumber, responses } = body;

    if (!attemptId || !roundNumber || !responses || responses.length === 0) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify attempt belongs to user
    const attempt = await prisma.placementTestAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== user.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (attempt.status !== "in-progress") {
      return Response.json(
        { success: false, error: "Attempt is not in progress" },
        { status: 400 }
      );
    }

    // Submit round answers
    const orchestrator = new PlacementTestOrchestrator(user.id, testId);
    const result = await orchestrator.submitRoundAnswers(
      attemptId,
      roundNumber,
      responses
    );

    return Response.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting round answers:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/placement-tests/[testId]/submit-round
 * 
 * Get current round details (for resume/recovery)
 */

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get("attemptId");

    if (!attemptId) {
      return Response.json(
        { success: false, error: "Missing attemptId" },
        { status: 400 }
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

    // Get attempt progress
    const attempt = await prisma.placementTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            rounds: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== user.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orchestrator = new PlacementTestOrchestrator(user.id, attempt.testId);
    const progress = await orchestrator.getAttemptState(attemptId);

    return Response.json(
      { success: true, data: progress },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting round details:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
