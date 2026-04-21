/**
 * GET /api/placement-tests
 * 
 * Fetch list of available placement tests
 * Supports filtering and pagination
 */

import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const isActive = searchParams.get("isActive") !== "false";
    const difficulty = searchParams.get("difficulty"); // easy, medium, hard

    const skip = (page - 1) * limit;

    const where = {
      isActive,
      isPublished: true,
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Fetch tests
    const tests = await prisma.placementTest.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        company: true,
        difficulty: true,
        totalDuration: true,
        passingPercentage: true,
        totalAttempts: true,
        totalCleared: true,
        averageScore: true,
        _count: {
          select: {
            rounds: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total count
    const total = await prisma.placementTest.count({ where });

    return Response.json(
      {
        success: true,
        data: tests,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching placement tests:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/placement-tests
 * 
 * Create a new placement test (Admin only)
 */

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== "admin") {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      company,
      difficulty,
      totalDuration,
      passingPercentage,
      roundPassThresholds,
    } = body;

    if (!title || !totalDuration) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const test = await prisma.placementTest.create({
      data: {
        title,
        description,
        company,
        difficulty: difficulty || "medium",
        totalDuration,
        passingPercentage: passingPercentage || 70,
        roundPassThresholds: roundPassThresholds || {},
        isActive: true,
        isPublished: false,
      },
    });

    return Response.json(
      { success: true, data: test },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating placement test:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
