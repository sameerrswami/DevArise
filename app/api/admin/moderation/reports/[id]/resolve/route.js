import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin(session) {
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin" && user?.role !== "ADMIN") return { error: "Forbidden", status: 403 };
  return null;
}

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });
    const { id } = params;
    const updated = await prisma.report.update({ where: { id }, data: { status: "resolved" } });
    return NextResponse.json({ success: true, report: updated });
  } catch (err) {
    console.error("[Admin Moderation Resolve POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
