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

/* ─── GET /api/admin/jobs ─── */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit  = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("q") || "";
    const skip   = (page - 1) * limit;

    const where = search ? {
      OR: [
        { title:   { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ],
    } : {};

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, company: true, location: true,
          type: true, category: true, salary: true, createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.jobPost.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[Admin Jobs GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── POST /api/admin/jobs ─── */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const deny = await requireAdmin(session);
    if (deny) return NextResponse.json({ error: deny.error }, { status: deny.status });

    const body = await req.json();
    const { title, company, location, description, type, category, salary } = body;

    if (!title || !company || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = await prisma.jobPost.create({
      data: {
        title, company, location, description, type, category, salary,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("[Admin Jobs POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

