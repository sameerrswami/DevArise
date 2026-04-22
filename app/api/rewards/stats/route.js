import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        pointTransactions: {
          orderBy: { createdAt: "desc" },
          take: 10
        },
        badges: true
      }
    });

    const storeItems = await prisma.rewardItem.findMany({
      where: { isEnabled: true }
    });

    return NextResponse.json({
        points: user.points,
        level: user.level,
        exp: user.exp,
        nextLevelExp: user.level * 1000,
        transactions: user.pointTransactions,
        badges: user.badges,
        store: storeItems
    });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
