import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/experiences
 * Fetch interview experiences with filtering, sorting, and pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const company = searchParams.get("company");
    const role = searchParams.get("role");
    const difficulty = searchParams.get("difficulty");
    const offerReceived = searchParams.get("offerReceived");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const skip = (page - 1) * limit;
    const where = {};

    if (company) {
      where.companyName = company;
    }

    if (role) {
      where.role = role;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (offerReceived !== null && offerReceived !== undefined) {
      where.offerReceived = offerReceived === "true";
    }

    if (searchParams.get("search")) {
      where.OR = [
        { companyName: { contains: searchParams.get("search"), mode: "insensitive" } },
        { role: { contains: searchParams.get("search"), mode: "insensitive" } },
        { content: { contains: searchParams.get("search"), mode: "insensitive" } }
      ];
    }

    const [experiences, total] = await Promise.all([
      prisma.interviewExperience.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true
            }
          },
          rounds: {
            orderBy: { roundNumber: "asc" }
          },
          _count: {
            select: { comments: true }
          }
        }
      }),
      prisma.interviewExperience.count({ where })
    ]);

    return NextResponse.json({
      experiences,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiences" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/experiences
 * Create a new interview experience
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      role,
      location,
      interviewType,
      yearsOfExperience,
      overallRating,
      difficulty,
      offerReceived,
      salary,
      content,
      tips,
      isAnonymous,
      rounds
    } = body;

    // Validation
    if (!companyName || !role || !content) {
      return NextResponse.json(
        { error: "Company name, role, and content are required" },
        { status: 400 }
      );
    }

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { error: "Overall rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Create experience with rounds
    const newExperience = await prisma.interviewExperience.create({
      data: {
        companyName,
        role,
        location,
        interviewType,
        experience: yearsOfExperience,
        overallRating,
        difficulty: difficulty || "Medium",
        offerReceived: offerReceived || false,
        salary,
        content,
        tips,
        isAnonymous: isAnonymous || false,
        userId: user.id,
        rounds: rounds && rounds.length > 0 ? {
          create: rounds.map((round, index) => ({
            roundType: round.type,
            roundNumber: index + 1,
            duration: round.duration,
            difficulty: round.difficulty,
            questions: JSON.stringify(round.questions || []),
            feedback: round.feedback,
            rating: round.rating
          }))
        } : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        rounds: true
      }
    });

    // Award reputation points for sharing experience
    const basePoints = 25;
    await prisma.reputation.upsert({
      where: { userId: user.id },
      update: { totalPoints: { increment: basePoints }, experiencePoints: { increment: basePoints } },
      create: { userId: user.id, totalPoints: basePoints, experiencePoints: basePoints }
    });

    await prisma.reputationHistory.create({
      data: {
        userId: user.id,
        points: basePoints,
        reason: "Interview experience shared",
        sourceType: "experience",
        sourceId: newExperience.id
      }
    });

    return NextResponse.json(newExperience, { status: 201 });
  } catch (error) {
    console.error("Error creating experience:", error);
    return NextResponse.json(
      { error: "Failed to create experience" },
      { status: 500 }
    );
  }
}
