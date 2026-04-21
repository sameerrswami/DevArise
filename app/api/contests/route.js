import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/contests — list all contests
export async function GET(req) {
  try {
    // Auto-update statuses based on time
    const now = new Date();
    await prisma.contest.updateMany({
      where: { status: "upcoming", startsAt: { lte: now } },
      data: { status: "active" }
    });
    await prisma.contest.updateMany({
      where: { status: "active", endsAt: { lte: now } },
      data: { status: "ended" }
    });

    const contests = await prisma.contest.findMany({
      orderBy: { startsAt: "desc" },
      include: {
        problems: { include: { problem: { select: { title: true, difficulty: true } } } },
        _count: { select: { entries: true } }
      }
    });

    return NextResponse.json({ success: true, contests });
  } catch (error) {
    console.error("Contests GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
  }
}

// POST /api/contests — create a new contest (admin)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, startsAt, duration, problemIds } = await req.json();
    const endsAt = new Date(new Date(startsAt).getTime() + duration * 60000);

    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startsAt: new Date(startsAt),
        endsAt,
        duration,
        status: new Date(startsAt) > new Date() ? "upcoming" : "active",
        problems: {
          create: problemIds.map((pid, i) => ({
            problemId: pid,
            points: i === 0 ? 100 : i === 1 ? 200 : 300,
            order: i,
          }))
        }
      },
      include: { problems: true }
    });

    return NextResponse.json({ success: true, contest });
  } catch (error) {
    console.error("Contest CREATE Error:", error);
    return NextResponse.json({ error: "Failed to create contest" }, { status: 500 });
  }
}
