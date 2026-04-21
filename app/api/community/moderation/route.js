import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/community/moderation/reports
 * Get all reports (admin only)
 */
export async function GET(request) {
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

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const contentType = searchParams.get("contentType");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const skip = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (contentType) {
      where.contentType = contentType;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          reportedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/moderation/report
 * Submit a new report
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

    const reporter = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!reporter) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { contentType, contentId, reportedUserId, reason, description } = body;

    // Validation
    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: "Content type, content ID, and reason are required" },
        { status: 400 }
      );
    }

    const validContentTypes = ["question", "answer", "experience", "comment", "user"];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: reporter.id,
        contentType,
        contentId,
        reportedUserId,
        reason,
        description,
        status: "pending"
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}