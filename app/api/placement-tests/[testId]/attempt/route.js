/**
 * PATCH /api/placement-tests/[testId]/attempt
 * 
 * Manage attempt status (pause, resume, abandon)
 */

import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { PlacementTestOrchestrator } from "@/lib/placement-test-orchestrator";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
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

    const { attemptId, action } = body;

    if (!attemptId || !action) {
      return Response.json(
        { success: false, error: "Missing required fields" },
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

    const attempt = await prisma.placementTestAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== user.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orchestrator = new PlacementTestOrchestrator(user.id, testId);

    let result;

    switch (action.toLowerCase()) {
      case "pause":
        result = await orchestrator.pauseAttempt(attemptId);
        break;

      case "resume":
        result = await orchestrator.resumeAttempt(attemptId);
        break;

      case "abandon":
        result = await orchestrator.abandonAttempt(attemptId);
        break;

      default:
        return Response.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    return Response.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error managing attempt:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/placement-tests/[testId]/attempt
 * 
 * Get current attempt status
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

    const { testId } = params;
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

    const attempt = await prisma.placementTestAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== user.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orchestrator = new PlacementTestOrchestrator(user.id, testId);
    const state = await orchestrator.getAttemptState(attemptId);

    return Response.json(
      { success: true, data: state },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting attempt status:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
