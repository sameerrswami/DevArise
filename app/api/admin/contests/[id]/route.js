import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin(session) {
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") return { error: "Forbidden", status: 403 };
  return null;
}

/* ─── DELETE /api/admin/contests/[id] ─── */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    await prisma.contest.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Contests DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── PATCH /api/admin/contests/[id] ─── */
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const body = await req.json();
    const updated = await prisma.contest.update({
      where: { id: params.id },
      data: {
        ...(body.title  && { title:  body.title  }),
        ...(body.status && { status: body.status }),
      },
    });
    return NextResponse.json({ contest: updated });
  } catch (err) {
    console.error("[Admin Contests PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── GET /api/admin/contests/[id] — live analytics ─── */
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const contest = await prisma.contest.findUnique({
      where: { id: params.id },
      include: {
        problems: { include: { problem: { select: { id: true, title: true, difficulty: true } } } },
        entries:  { select: { id: true, userId: true, score: true, rank: true, problemsSolved: true, createdAt: true } },
      },
    });

    if (!contest) return NextResponse.json({ error: "Contest not found" }, { status: 404 });

    return NextResponse.json({ contest });
  } catch (err) {
    console.error("[Admin Contests GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
