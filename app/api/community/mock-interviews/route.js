import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/community/mock-interviews
 * Fetch peer mock interviews (available sessions, user's sessions, etc.)
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "available"; // available, my-sessions, all
    const status = searchParams.get("status");
    const roundType = searchParams.get("roundType");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const skip = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (roundType) {
      where.roundType = roundType;
    }

    if (type === "my-sessions" && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (user) {
        where.OR = [
          { interviewerId: user.id },
          { intervieweeId: user.id }
        ];
      }
    }

    if (type === "available") {
      where.status = "scheduled";
      // Only show future sessions
      where.scheduledAt = { gte: new Date() };
    }

    const [interviews, total] = await Promise.all([
      prisma.peerMockInterview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: "asc" },
        include: {
          interviewer: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              preparationLevel: true
            }
          },
          interviewee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              preparationLevel: true
            }
          }
        }
      }),
      prisma.peerMockInterview.count({ where })
    ]);

    return NextResponse.json({
      interviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching mock interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch mock interviews" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/mock-interviews
 * Schedule a new peer mock interview
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

    const interviewer = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!interviewer) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      intervieweeEmail,
      jobPosition,
      jobDescription,
      yearsOfExperience,
      roundType,
      scheduledAt,
      duration,
      meetingLink
    } = body;

    // Validation
    if (!intervieweeEmail || !jobPosition || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: "Interviewee email, job position, scheduled time, and duration are required" },
        { status: 400 }
      );
    }

    // Find interviewee
    const interviewee = await prisma.user.findUnique({
      where: { email: intervieweeEmail }
    });

    if (!interviewee) {
      return NextResponse.json(
        { error: "Interviewee not found" },
        { status: 404 }
      );
    }

    if (interviewee.id === interviewer.id) {
      return NextResponse.json(
        { error: "Cannot schedule mock interview with yourself" },
        { status: 400 }
      );
    }

    // Check if scheduled time is in the future
    if (new Date(scheduledAt) <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    const interview = await prisma.peerMockInterview.create({
      data: {
        interviewerId: interviewer.id,
        intervieweeId: interviewee.id,
        jobPosition,
        jobDescription,
        experience: yearsOfExperience,
        roundType: roundType || "Mixed",
        scheduledAt: new Date(scheduledAt),
        duration,
        meetingLink,
        status: "scheduled"
      },
      include: {
        interviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        interviewee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Create notification for interviewee
    await prisma.communityNotification.create({
      data: {
        userId: interviewee.id,
        type: "mockInterview",
        title: "Mock Interview Scheduled",
        message: `${interviewer.name} has scheduled a mock interview for ${jobPosition}`,
        link: `/community/mock-interviews/${interview.id}`,
        metadata: {
          interviewId: interview.id,
          interviewerId: interviewer.id,
          jobPosition,
          scheduledAt: scheduledAt
        }
      }
    });

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error("Error scheduling mock interview:", error);
    return NextResponse.json(
      { error: "Failed to schedule mock interview" },
      { status: 500 }
    );
  }
}