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

/* ─── GET /api/admin/moderation/reports ─── */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { name: true, email: true } },
        reportedUser: { select: { name: true, email: true } },
      },
    });

    // Map to a cleaner format for the dashboard
    const mappedReports = reports.map(r => ({
      id: r.id,
      reporter: r.reporter?.name || r.reporter?.email || "Anonymous",
      contentType: r.contentType,
      contentId: r.contentId,
      reason: r.reason,
      summary: r.reason || "No reason provided",
      content: r.description || "No description provided",
      createdAt: r.createdAt.toLocaleDateString(),
      status: r.status,
    }));

    return NextResponse.json({ reports: mappedReports });
  } catch (err) {
    console.error("[Admin Moderation GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
