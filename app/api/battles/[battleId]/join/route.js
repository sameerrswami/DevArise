/**
 * JOIN BATTLE API ENDPOINT
 * 
 * POST: Add current user to a battle
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BattleOrchestrator } from "@/lib/battle-orchestrator";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const orchestrator = new BattleOrchestrator();

/**
 * POST /api/battles/[battleId]/join
 * Join an existing battle
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

    // Get battle
    const battle = await prisma.codingBattle.findUnique({
      where: { id: battleId },
      include: {
        battleParticipants: true,
        _count: {
          select: { battleParticipants: true },
        },
      },
    });

    if (!battle) {
      return NextResponse.json(
        { success: false, error: "Battle not found" },
        { status: 404 }
      );
    }

    // Validation
    if (battle.status !== "waiting") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot join battle with status: ${battle.status}`,
        },
        { status: 400 }
      );
    }

    // Check if already in battle
    const existingParticipant = battle.battleParticipants.find(
      (p) => p.userId === user.id
    );

    if (existingParticipant) {
      return NextResponse.json(
        { success: false, error: "You are already in this battle" },
        { status: 400 }
      );
    }

    // Check capacity
    if (battle._count.battleParticipants >= battle.maxParticipants) {
      return NextResponse.json(
        { success: false, error: "Battle is full" },
        { status: 400 }
      );
    }

    // Join battle
    const updatedBattle = await orchestrator.joinBattle(battleId, user.id);

    if (!updatedBattle) {
      return NextResponse.json(
        { success: false, error: "Failed to join battle" },
        { status: 500 }
      );
    }

    // Get updated participant count
    const participantCount = await prisma.battleParticipant.count({
      where: { battleId },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          battleId,
          userId: user.id,
          status: updatedBattle.status,
          participantCount,
          message:
            updatedBattle.status === "in-progress"
              ? "Battle started - you have joined!"
              : "Successfully joined battle",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/battles/[battleId]/join error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to join battle",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/battles/[battleId]/join
 * Get battle join status
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

    // Check if user is in battle
    const participant = await prisma.battleParticipant.findUnique({
      where: {
        battleId_userId: {
          battleId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          battleId,
          isParticipant: !!participant,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/battles/[battleId]/join error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check join status",
      },
      { status: 500 }
    );
  }
}
