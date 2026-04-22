import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  const { slug } = params;
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug }
    });
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }
    return NextResponse.json(problem);
  } catch (error) {
    console.error("API Problem Detail Error:", error);
    return NextResponse.json({ error: "Failed to fetch problem" }, { status: 500 });
  }
}
