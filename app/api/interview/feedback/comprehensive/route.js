import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { mockIdRef, evaluation, fullHistory } = await req.json();

    if (!mockIdRef || !evaluation) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Update Mock Interview Summary
    await prisma.mockInterview.update({
      where: { mockId: mockIdRef },
      data: {
        summaryFeedback: JSON.stringify(evaluation)
      }
    });

    // 2. Clear old answers and Save full history as UserAnswer records
    // This allows the standard feedback page to still work
    await prisma.userAnswer.deleteMany({
      where: { mockIdRef: mockIdRef }
    });

    for (const item of fullHistory) {
      await prisma.userAnswer.create({
        data: {
          mockIdRef: mockIdRef,
          question: item.question,
          userAns: item.answer,
          feedback: "Dynamic Session Recorded",
          rating: "Recorded"
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Comprehensive Feedback API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
