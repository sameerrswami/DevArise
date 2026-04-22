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

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("q") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const category = searchParams.get("category") || "";
    const skip = (page - 1) * limit;

    const where = {
      ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { category: { contains: search, mode: "insensitive" } }] } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(category ? { category } : {}),
    };

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        select: { id: true, title: true, difficulty: true, category: true, slug: true, createdAt: true, _count: { select: { submissions: true } } },
      }),
      prisma.problem.count({ where }),
    ]);

    return NextResponse.json({
      problems: problems.map((p) => ({ ...p, submissions: p._count.submissions })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[Admin Problems GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const body = await req.json();
    const { title, description, difficulty, category } = body;

    if (!title || !description || !difficulty || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") + "-" + Date.now();

    const problem = await prisma.problem.create({
      data: { title, description, difficulty, category, slug, testCases: [] },
    });

    return NextResponse.json({ problem }, { status: 201 });
  } catch (err) {
    console.error("[Admin Problems POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
