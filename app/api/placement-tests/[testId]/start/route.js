/**
 * POST /api/placement-tests/[testId]/start
 * 
 * Initialize a placement test attempt
 * Creates a new PlacementTestAttempt and loads first round
 */

import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { PlacementTestOrchestrator } from "@/lib/placement-test-orchestrator";

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

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify test exists
    const test = await prisma.placementTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return Response.json(
        { success: false, error: "Test not found" },
        { status: 404 }
      );
    }

    if (!test.isActive || !test.isPublished) {
      return Response.json(
        { success: false, error: "Test is not available" },
        { status: 400 }
      );
    }

    // Initialize test attempt
    const orchestrator = new PlacementTestOrchestrator(user.id, testId);
    const result = await orchestrator.initializeTestAttempt();

    // Update test metrics
    await prisma.placementTest.update({
      where: { id: testId },
      data: { totalAttempts: { increment: 1 } },
    });

    return Response.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting placement test:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/placement-tests/[testId]/start
 * 
 * Resume or check existing attempt status
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check for existing attempt
    const existingAttempt = await prisma.placementTestAttempt.findUnique({
      where: {
        userId_testId: { userId: user.id, testId },
      },
    });

    if (!existingAttempt) {
      return Response.json(
        { success: false, error: "No existing attempt found" },
        { status: 404 }
      );
    }

    // Load attempt state
    const orchestrator = new PlacementTestOrchestrator(user.id, testId);
    const result = await orchestrator.loadAttemptState(existingAttempt.id);

    return Response.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resuming placement test:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
