import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [usersCount, jobsCount, playlistsCount, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.jobPost.count(),
      prisma.playlist.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, points: true, createdAt: true }
      })
    ]);

    return NextResponse.json({
      stats: {
        usersCount,
        jobsCount,
        playlistsCount
      },
      recentUsers
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

