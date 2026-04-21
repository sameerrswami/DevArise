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

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    await prisma.problem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Problems DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const body = await req.json();
    const problem = await prisma.problem.update({
      where: { id: params.id },
      data: {
        ...(body.title       && { title:       body.title       }),
        ...(body.description && { description: body.description }),
        ...(body.difficulty  && { difficulty:  body.difficulty  }),
        ...(body.category    && { category:    body.category    }),
      },
    });
    return NextResponse.json({ problem });
  } catch (err) {
    console.error("[Admin Problems PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
