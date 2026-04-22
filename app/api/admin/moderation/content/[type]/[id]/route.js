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

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });
    const { type, id } = params;
    switch (type.toLowerCase()) {
      case "question":
        await prisma.question.delete({ where: { id } });
        break;
      case "answer":
        await prisma.answer.delete({ where: { id } });
        break;
      case "experience":
        await prisma.interviewExperience.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }
    await prisma.report.updateMany({ where: { contentId: id }, data: { status: "resolved" } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Content Delete DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
