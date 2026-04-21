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

/* ─── PATCH /api/admin/users/[id] ─── */
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const body = await req.json();
    const { id } = params;

    const updateData = {};

    // Toggle suspension via role field
    if (typeof body.status === "string") {
      updateData.role = body.status === "suspended" ? "suspended" : "user";
    }

    // Toggle email verified
    if (typeof body.emailVerified !== "undefined") {
      updateData.emailVerified = body.emailVerified ? new Date() : null;
    }

    // Promote/demote admin
    if (typeof body.role === "string" && ["user", "admin"].includes(body.role)) {
      updateData.role = body.role;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, emailVerified: true },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("[Admin Users PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── DELETE /api/admin/users/[id] ─── */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const { id } = params;
    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Users DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── GET /api/admin/users/[id] ─── */
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const { id } = params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        points: true, streak: true, createdAt: true,
        emailVerified: true, lastActive: true, contestRating: true,
        totalProblemsSolved: true, contestsParticipated: true, contestsWon: true,
        preparationLevel: true, currentStreak: true, longestStreak: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: { ...user, status: user.role === "suspended" ? "suspended" : "active" } });
  } catch (err) {
    console.error("[Admin Users GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
