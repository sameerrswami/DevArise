import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * POST /api/community/vote
 * Vote on a question or answer
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
    const { targetType, targetId, type } = body; // targetType: 'question' | 'answer', type: 1 (upvote) | -1 (downvote)

    // Validation
    if (!targetType || !targetId || !type) {
      return NextResponse.json(
        { error: "Target type, target ID, and vote type are required" },
        { status: 400 }
      );
    }

    if (!["question", "answer"].includes(targetType)) {
      return NextResponse.json(
        { error: "Invalid target type" },
        { status: 400 }
      );
    }

    if (![1, -1].includes(type)) {
      return NextResponse.json(
        { error: "Vote type must be 1 (upvote) or -1 (downvote)" },
        { status: 400 }
      );
    }

    // Check if target exists and get owner
    let target;
    if (targetType === "question") {
      target = await prisma.question.findUnique({
        where: { id: targetId },
        select: { userId: true }
      });
    } else {
      target = await prisma.answer.findUnique({
        where: { id: targetId },
        select: { userId: true, questionId: true }
      });
    }

    if (!target) {
      return NextResponse.json(
        { error: "Target not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to vote on their own content
    if (target.userId === user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own content" },
        { status: 400 }
      );
    }

    // Handle vote (create, update, or delete)
    const voteModel = targetType === "question" ? prisma.questionVote : prisma.answerVote;
    const targetModel = targetType === "question" ? prisma.question : prisma.answer;
    const updateField = targetType === "question" ? "upvotes" : "upvotes";
    const downvoteField = targetType === "question" ? "downvotes" : "downvotes";

    // Check existing vote
    const existingVote = await voteModel.findUnique({
      where: {
        [targetType === "question" ? "questionId_userId" : "answerId_userId"]: {
          [targetType === "question" ? "questionId" : "answerId"]: targetId,
          userId: user.id
        }
      }
    });

    let voteChange = 0;
    let reputationChange = 0;

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote (toggle off)
        await voteModel.delete({
          where: { id: existingVote.id }
        });
        
        if (type === 1) {
          voteChange = -1;
          reputationChange = -5; // Lose reputation for removed upvote
        } else {
          voteChange = 0; // downvote count decreases
          reputationChange = 2; // Gain back reputation from removed downvote
        }
      } else {
        // Change vote
        await voteModel.update({
          where: { id: existingVote.id },
          data: { type }
        });

        if (existingVote.type === 1 && type === -1) {
          voteChange = -2; // Remove upvote, add downvote
          reputationChange = -7; // Lose upvote reputation + downvote penalty
        } else if (existingVote.type === -1 && type === 1) {
          voteChange = 2; // Remove downvote, add upvote
          reputationChange = 7; // Gain upvote reputation + remove downvote penalty
        }
      }
    } else {
      // Create new vote
      await voteModel.create({
        data: {
          [targetType === "question" ? "questionId" : "answerId"]: targetId,
          userId: user.id,
          type
        }
      });

      if (type === 1) {
        voteChange = 1;
        reputationChange = 5;
      } else {
        voteChange = 0; // downvote count increases
        reputationChange = -2;
      }
    }

    // Update vote counts on target
    const updateData = {};
    if (type === 1) {
      updateData.upvotes = { increment: voteChange > 0 ? 1 : voteChange };
    } else {
      updateData.downvotes = { increment: voteChange < 0 ? -1 : 1 };
    }

    await targetModel.update({
      where: { id: targetId },
      data: updateData
    });

    // Update reputation for content owner
    if (reputationChange !== 0) {
      const repField = targetType === "question" ? "questionPoints" : "answerPoints";
      
      await prisma.reputation.upsert({
        where: { userId: target.userId },
        update: {
          totalPoints: { increment: reputationChange },
          [repField]: { increment: reputationChange }
        },
        create: {
          userId: target.userId,
          totalPoints: reputationChange,
          [repField]: reputationChange
        }
      });

      await prisma.reputationHistory.create({
        data: {
          userId: target.userId,
          points: reputationChange,
          reason: type === 1 ? "Content upvoted" : "Content downvoted",
          sourceType: targetType,
          sourceId: targetId
        }
      });

      // Create notification for upvote (not for downvote to avoid negativity)
      if (type === 1 && reputationChange > 0) {
        await prisma.communityNotification.create({
          data: {
            userId: target.userId,
            type: "upvote",
            title: targetType === "question" ? "Question upvoted" : "Answer upvoted",
            message: `Someone upvoted your ${targetType}`,
            link: `/community/${targetType === "question" ? `questions/${targetId}` : ""}`,
            metadata: {
              [targetType === "question" ? "questionId" : "answerId"]: targetId,
              voterId: user.id
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      voteChange,
      reputationChange
    });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/community/vote
 * Get user's vote status for a target
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { vote: null },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { vote: null },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "Target type and target ID are required" },
        { status: 400 }
      );
    }

    const voteModel = targetType === "question" ? prisma.questionVote : prisma.answerVote;
    const vote = await voteModel.findFirst({
      where: {
        [targetType === "question" ? "questionId" : "answerId"]: targetId,
        userId: user.id
      },
      select: { type: true }
    });

    return NextResponse.json({
      vote: vote ? vote.type : null
    });
  } catch (error) {
    console.error("Error fetching vote:", error);
    return NextResponse.json(
      { error: "Failed to fetch vote" },
      { status: 500 }
    );
  }
}