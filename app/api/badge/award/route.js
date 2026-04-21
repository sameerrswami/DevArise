import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const badges = await prisma.badge.findMany({
      where: { userId: session.user.id },
      orderBy: { awardedAt: "desc" },
    });

    return NextResponse.json({ badges });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId, title, description, imageUrl } = await req.json();
    if (!title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingBadge = await prisma.badge.findFirst({
      where: {
        userId: session.user.id,
        ...(moduleId ? { moduleId } : { title }),
      },
    });

    if (existingBadge) {
      return NextResponse.json({ success: true, badge: existingBadge });
    }

    const badge = await prisma.badge.create({
      data: {
        userId: session.user.id,
        moduleId,
        title,
        description,
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, badge });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
