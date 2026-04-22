import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { modules: true }
        },
        userProgress: session ? {
          where: { userId: session.user.id }
        } : false
      },
      orderBy: { createdAt: "asc" }
    });

    const formatted = courses.map(c => ({
      ...c,
      moduleCount: c._count.modules,
      progress: c.userProgress?.[0]?.progress || 0
    }));

    return NextResponse.json({ courses: formatted });
  } catch (error) {
    console.error("[Courses API Error]:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
