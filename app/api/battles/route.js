/**
 * BATTLES API ENDPOINT
 * 
 * GET: List all public battles with filters and pagination
 * POST: Create a new battle
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BattleOrchestrator } from "@/lib/battle-orchestrator";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const orchestrator = new BattleOrchestrator();

/**
 * GET /api/battles
 * List public battles with pagination and filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const status = searchParams.get("status"); // waiting, in-progress, completed
    const difficulty = searchParams.get("difficulty"); // easy, medium, hard
    const sortBy = searchParams.get("sortBy") || "createdAt"; // createdAt, participants, timeLimit

    const skip = (page - 1) * limit;

    // Build filter
    const where = {
      isPublic: true,
    };

    if (status && ["waiting", "in-progress", "completed"].includes(status)) {
      where.status = status;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Build sort
    let orderBy = { createdAt: "desc" };
    if (sortBy === "participants") {
      orderBy = { _count: { battleParticipants: "desc" } };
    } else if (sortBy === "timeLimit") {
      orderBy = { timeLimit: "desc" };
    }

    // Get battles with details
    const battles = await prisma.codingBattle.findMany({
      where,
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            category: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            battleParticipants: true,
            battleSubmissions: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Get total count
    const total = await prisma.codingBattle.count({ where });

    // Transform response
    const response = battles.map((battle) => ({
      id: battle.id,
      title: battle.title,
      difficulty: battle.difficulty,
      problemId: battle.problemId,
      problemTitle: battle.problem?.title,
      category: battle.problem?.category,
      creator: battle.creator,
      status: battle.status,
      isPublic: battle.isPublic,
      isRanked: battle.isRanked,
      timeLimit: battle.timeLimit,
      maxParticipants: battle.maxParticipants,
      participantCount: battle._count.battleParticipants,
      submissionCount: battle._count.battleSubmissions,
      startedAt: battle.startedAt,
      endedAt: battle.endedAt,
      createdAt: battle.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: response,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/battles error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch battles",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/battles
 * Create a new battle (requires authentication)
 */
export async function POST(request) {
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

    // Parse request body
    const body = await request.json();
    const {
      problemId,
      title,
      difficulty,
      timeLimit = 900, // 15 minutes default
      maxParticipants = 4,
      isPublic = true,
      isRanked = false,
      minParticipants = 2,
    } = body;

    // Validation
    if (!problemId || !title) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: problemId, title",
        },
        { status: 400 }
      );
    }

    if (timeLimit < 60 || timeLimit > 3600) {
      return NextResponse.json(
        {
          success: false,
          error: "Time limit must be between 60 and 3600 seconds",
        },
        { status: 400 }
      );
    }

    if (maxParticipants < 2 || maxParticipants > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Max participants must be between 2 and 50",
        },
        { status: 400 }
      );
    }

    if (minParticipants < 2 || minParticipants > maxParticipants) {
      return NextResponse.json(
        {
          success: false,
          error: "Min participants must be between 2 and maxParticipants",
        },
        { status: 400 }
      );
    }

    // Verify problem exists
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Problem not found" },
        { status: 404 }
      );
    }

    // Create battle
    const battleConfig = {
      problemId,
      title,
      difficulty: difficulty || problem.difficulty,
      timeLimit,
      maxParticipants,
      isPublic,
      isRanked,
      minParticipants,
    };

    const battle = await orchestrator.createBattle(user.id, battleConfig);

    if (!battle) {
      return NextResponse.json(
        { success: false, error: "Failed to create battle" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: battle.id,
          title: battle.title,
          difficulty: battle.difficulty,
          status: battle.status,
          timeLimit: battle.timeLimit,
          participants: 1,
          createdAt: battle.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/battles error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create battle",
      },
      { status: 500 }
    );
  }
}
