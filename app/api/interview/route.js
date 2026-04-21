import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { enforceLimits } from "@/lib/gating";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const mockId = searchParams.get("mockId");
    if (!mockId) {
      logger.warn("GET /api/interview - Missing mockId parameter", { user: session.user.email });
      return NextResponse.json({ success: false, error: "mockId is required" }, { status: 400 });
    }

    const result = await prisma.mockInterview.findUnique({
      where: { mockId },
    });

    if (!result || result.createdBy !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error("GET /api/interview - Fetch failed", error);
    return NextResponse.json({
      success: false,
      error: "Internal Server Error"
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();

    if (body.mockId && body.jsonMockResp) {
      // PREMIUM GATING VERIFICATION
      const { allowed, message: gatingMessage } = await enforceLimits(session.user.email, 'INTERVIEWS');
      if (!allowed) {
        logger.warn(`POST /api/interview - Rate limit exceeded`, { user: session.user.email });
        return NextResponse.json({ success: false, error: gatingMessage || "Limit reached", isLimitError: true }, { status: 403 });
      }

      const resp = await prisma.mockInterview.create({

        data: {
          mockId: body.mockId,
          jsonMockResp: body.jsonMockResp,
          jobPosition: body.jobPosition,
          jobDesc: body.jobDesc,
          jobExperience: body.jobExperience,
          createdBy: session.user.email,
        },
      });

      return NextResponse.json({ success: true, data: resp });
    }

    const { 
      mockIdRef, question, correctAns, userAns, feedback, rating,
      hesitationDetected, emotionDetected, paceMinutes 
    } = body;

    const interview = await prisma.mockInterview.findUnique({
      where: { mockId: mockIdRef },
    });

    if (!interview || interview.createdBy !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 },
      );
    }

    const resp = await prisma.userAnswer.create({
      data: {
        mockIdRef,
        question,
        correctAns,
        userAns,
        feedback,
        rating,
        userEmail: session.user.email,
        hesitationDetected: hesitationDetected || false,
        emotionDetected: emotionDetected || "neutral",
        paceMinutes: paceMinutes || 0
      },
    });

    return NextResponse.json({ success: true, data: resp });
  } catch (error) {
    logger.error("POST /api/interview - Submission failed", error);
    return NextResponse.json({
      success: false,
      error: "Internal Server Error"
    }, { status: 500 });
  }
}
