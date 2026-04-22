import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/contests/[contestId] — full contest details + user entry
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const contest = await prisma.contest.findUnique({
      where: { id: params.contestId },
      include: {
        problems: {
          orderBy: { order: "asc" },
          include: {
            problem: true
          }
        },
        entries: {
          orderBy: { score: "desc" },
          include: {
            submissions: { orderBy: { createdAt: "asc" } }
          }
        }
      }
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    // Build ranked leaderboard with user data
    const userIds = contest.entries.map(e => e.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, contestRating: true }
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const leaderboard = contest.entries.map((entry, i) => ({
      ...entry,
      rank: i + 1,
      user: userMap[entry.userId] || { name: "Unknown" }
    }));

    // My entry
    let myEntry = null;
    if (session?.user?.email) {
      const me = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (me) {
        myEntry = contest.entries.find(e => e.userId === me.id) || null;
      }
    }

    return NextResponse.json({ success: true, contest: { ...contest, leaderboard }, myEntry });
  } catch (error) {
    console.error("Contest GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch contest" }, { status: 500 });
  }
}
