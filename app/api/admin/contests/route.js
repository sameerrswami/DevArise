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

/* ─── GET /api/admin/contests ─── */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip  = (page - 1) * limit;

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, status: true, startsAt: true, endsAt: true,
          duration: true, type: true, totalRegistrations: true,
          _count: { select: { entries: true } },
        },
      }),
      prisma.contest.count(),
    ]);

    const mapped = contests.map((c) => ({
      ...c,
      startTime: c.startsAt,
      durationMinutes: c.duration,
      participants: c._count.entries,
    }));

    return NextResponse.json({
      contests: mapped,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[Admin Contests GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── POST /api/admin/contests ─── */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const body = await req.json();
    const { title, description = "", startTime, durationMinutes, problems = [] } = body;

    if (!title || !startTime || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const startsAt = new Date(startTime);
    const endsAt   = new Date(startsAt.getTime() + durationMinutes * 60000);

    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startsAt,
        endsAt,
        duration: Number(durationMinutes),
        status: "upcoming",
        ...(problems.length > 0 && {
          problems: {
            create: problems.map((problemId, i) => ({
              problemId,
              points: 100,
              order: i,
            })),
          },
        }),
      },
    });

    return NextResponse.json({ contest }, { status: 201 });
  } catch (err) {
    console.error("[Admin Contests POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

