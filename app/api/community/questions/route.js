import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/questions
 * Fetch questions with filtering, sorting, and pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const category = searchParams.get("category");
    const tags = searchParams.get("tags")?.split(",");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const resolved = searchParams.get("resolved");

    const skip = (page - 1) * limit;

    const where = {};

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (resolved !== null) {
      where.isResolved = resolved === "true";
    }

    if (searchParams.get("search")) {
      where.OR = [
        { title: { contains: searchParams.get("search"), mode: "insensitive" } },
        { content: { contains: searchParams.get("search"), mode: "insensitive" } }
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
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
          answers: {
            select: {
              id: true,
              isAccepted: true,
              upvotes: true,
              createdAt: true
            },
            orderBy: { upvotes: "desc" },
            take: 1
          },
          _count: {
            select: { answers: true }
          }
        }
      }),
      prisma.question.count({ where })
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/questions
 * Create a new question
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
    const { title, content, category, tags } = body;

    // Validation
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { error: "Title must be less than 500 characters" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    const question = await prisma.question.create({
      data: {
        title,
        content,
        category,
        tags: tags || [],
        slug,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Award reputation points for asking a question
    await prisma.reputation.upsert({
      where: { userId: user.id },
      update: { totalPoints: { increment: 5 }, questionPoints: { increment: 5 } },
      create: { userId: user.id, totalPoints: 5, questionPoints: 5 }
    });

    await prisma.reputationHistory.create({
      data: {
        userId: user.id,
        points: 5,
        reason: "Question posted",
        sourceType: "question",
        sourceId: question.id
      }
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
