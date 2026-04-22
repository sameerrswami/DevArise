import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/* ─── helper: verify admin ─── */
async function requireAdmin(session) {
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") return { error: "Forbidden", status: 403 };
  return null;
}

/* ─── GET  /api/admin/users  ─── */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit  = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const skip   = (page - 1) * limit;

    const where = {
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(status === "suspended" ? { role: "suspended" } : {}),
      ...(status === "verified"  ? { emailVerified: { not: null } } : {}),
    };

    const [users, total, totalUsers, activeUsers, verifiedUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true,
          points: true, streak: true, createdAt: true,
          emailVerified: true, lastActive: true, contestRating: true,
          totalProblemsSolved: true, contestsParticipated: true,
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count(),
      prisma.user.count({ where: { lastActive: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
    ]);

    const mappedUsers = users.map((u) => ({
      ...u,
      status: u.role === "suspended" ? "suspended" : "active",
    }));

    return NextResponse.json({
      users: mappedUsers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers: totalUsers - activeUsers,
        verifiedUsers,
      },
    });
  } catch (err) {
    console.error("[Admin Users GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

