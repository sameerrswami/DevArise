import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: {
        points: "desc",
      },
      take: 10,
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
      },
    });

    return NextResponse.json({ leaderboard: topUsers });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
