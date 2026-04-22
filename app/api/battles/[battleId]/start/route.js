/**
 * START BATTLE API ENDPOINT
 * 
 * POST: Start a battle (transition from waiting to in-progress)
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BattleOrchestrator } from "@/lib/battle-orchestrator";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const orchestrator = new BattleOrchestrator();

/**
 * POST /api/battles/[battleId]/start
 * Start a battle
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

    // Verify user is battle creator or admin
    if (battle.creatorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Only battle creator can start the battle" },
        { status: 403 }
      );
    }

    // Check battle status
    if (battle.status !== "waiting") {
      return NextResponse.json(
        {
          success: false,
          error: `Battle cannot be started from status: ${battle.status}`,
        },
        { status: 400 }
      );
    }

    // Check minimum participants
    if (battle._count.battleParticipants < battle.minParticipants) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum ${battle.minParticipants} participants required (current: ${battle._count.battleParticipants})`,
        },
        { status: 400 }
      );
    }

    // Start battle
    const startedBattle = await orchestrator.startBattle(battleId);

    if (!startedBattle) {
      return NextResponse.json(
        { success: false, error: "Failed to start battle" },
        { status: 500 }
      );
    }

    // Get updated participants
    const participants = await prisma.battleParticipant.findMany({
      where: { battleId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          battleId,
          status: startedBattle.status,
          startedAt: startedBattle.startedAt,
          timeLimit: startedBattle.timeLimit,
          participants: participants.map((p) => ({
            userId: p.userId,
            userName: p.user.name,
            userImage: p.user.image,
          })),
          message: "Battle started successfully",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/battles/[battleId]/start error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to start battle",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/battles/[battleId]/start
 * Get battle start status
 */
export async function GET(request, { params }) {
  try {
    const battleId = params.battleId;

    // Get battle
    const battle = await prisma.codingBattle.findUnique({
      where: { id: battleId },
      include: {
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

    const now = new Date();
    let timeRemaining = null;

    if (battle.status === "in-progress" && battle.startedAt) {
      const elapsedMs = now - battle.startedAt;
      const remainingMs = battle.timeLimit * 1000 - elapsedMs;
      timeRemaining = Math.max(0, Math.round(remainingMs / 1000));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          battleId,
          status: battle.status,
          startedAt: battle.startedAt,
          endedAt: battle.endedAt,
          timeLimit: battle.timeLimit,
          timeRemaining,
          participantCount: battle._count.battleParticipants,
          canStart: battle.status === "waiting" && battle._count.battleParticipants >= battle.minParticipants,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/battles/[battleId]/start error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get battle status",
      },
      { status: 500 }
    );
  }
}
