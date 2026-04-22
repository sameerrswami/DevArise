import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    // Security: Only Recruiters and Admins can browse candidates
    if (!session || !["RECRUITER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const skill = searchParams.get("skill");
    const status = searchParams.get("status");

    // Build filter
    const where = {
      role: "STUDENT",
      isProfilePublic: true,
    };

    if (role) where.targetRole = { contains: role, mode: "insensitive" };
    if (status) where.academicStatus = status;
    
    // Skill filtering from JSON resumeData or a dedicated field
    // For simplicity, we'll check targetRole and preparationLevel first
    
    const candidates = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        academicStatus: true,
        targetRole: true,
        preparationLevel: true,
        points: true,
        streak: true,
        totalProblemsSolved: true,
        contestsWon: true,
        lastActive: true,
        resumeData: true,
        shortlistedBy: {
            where: { recruiterId: session.user.id }
        }
      },
      orderBy: { points: "desc" }
    });

    // Transform for UI
    const formatted = candidates.map(c => ({
      ...c,
      isShortlisted: c.shortlistedBy.length > 0,
      shortlistId: c.shortlistedBy[0]?.id || null,
      skills: c.resumeData?.skills || [] // Helper extraction
    }));

    return NextResponse.json({ candidates: formatted });
  } catch (error) {
    console.error("[Recruiter API Error]:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
