import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/community/questions/[questionId]
 * Fetch a single question with full details
 */
export async function GET(request, { params }) {
  try {
    const { questionId } = params;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            _count: {
              select: { comments: true }
            }
          },
          orderBy: [
            { isAccepted: "desc" },
            { upvotes: "desc" },
            { createdAt: "desc" }
          ]
        },
        questionComments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: { answers: true }
        }
      }
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.question.update({
      where: { id: questionId },
      data: { views: { increment: 1 } }
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/community/questions/[questionId]
 * Update a question
 */
export async function PUT(request, { params }) {
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

    const { questionId } = params;
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner or admin
    if (question.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category, tags, isResolved, bestAnswerId } = body;

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(tags !== undefined && { tags }),
        ...(isResolved !== undefined && { isResolved }),
        ...(bestAnswerId !== undefined && { bestAnswerId })
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

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/questions/[questionId]
 * Delete a question
 */
export async function DELETE(request, { params }) {
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

    const { questionId } = params;
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner or admin
    if (question.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.question.delete({
      where: { id: questionId }
    });

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}