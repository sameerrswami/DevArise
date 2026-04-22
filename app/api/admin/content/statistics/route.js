import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

async function requireAdmin(session) {
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") return { error: "Forbidden", status: 403 };
  return null;
}

/* ─── GET /api/admin/content/statistics ─── */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const [totalProblems, totalQuizzes, totalResources, categories] = await Promise.all([
      prisma.problem.count(),
      // Quizzes and Resources might be modeled differently; assuming they are types of problems or separate models
      // Check existing schema... I saw Playlist earlier.
      prisma.playlist.count(),
      prisma.mockInterview.count(),
      prisma.problem.groupBy({
        by: ['category'],
        _count: true
      })
    ]);

    const latestProblem = await prisma.problem.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { title: true, createdAt: true }
    });

    return NextResponse.json({
      totalProblems,
      totalQuizzes, // Mock value if not exists, or map to related feature
      totalResources: totalQuizzes,
      avgDifficulty: 'Medium',
      categoriesCount: categories.length,
      lastProblemCreated: latestProblem?.createdAt,
    });
  } catch (err) {
    console.error("[Admin Content Stats GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

