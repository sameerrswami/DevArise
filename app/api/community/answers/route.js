import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/community/answers
 * Create a new answer
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
    const { questionId, content } = body;

    // Validation
    if (!questionId || !content) {
      return NextResponse.json(
        { error: "Question ID and content are required" },
        { status: 400 }
      );
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        questionId,
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

    // Award reputation points for answering
    await prisma.reputation.upsert({
      where: { userId: user.id },
      update: { totalPoints: { increment: 10 }, answerPoints: { increment: 10 } },
      create: { userId: user.id, totalPoints: 10, answerPoints: 10 }
    });

    await prisma.reputationHistory.create({
      data: {
        userId: user.id,
        points: 10,
        reason: "Answer posted",
        sourceType: "answer",
        sourceId: answer.id
      }
    });

    // Create notification for question author
    if (question.userId !== user.id) {
      await prisma.communityNotification.create({
        data: {
          userId: question.userId,
          type: "answer",
          title: "New answer to your question",
          message: `${user.name} answered your question: "${question.title}"`,
          link: `/community/questions/${question.slug || question.id}`,
          metadata: {
            questionId: question.id,
            answerId: answer.id,
            authorId: user.id
          }
        }
      });
    }

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error("Error creating answer:", error);
    return NextResponse.json(
      { error: "Failed to create answer" },
      { status: 500 }
    );
  }
}
