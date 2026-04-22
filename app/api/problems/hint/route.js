import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GeminiService } from "@/lib/services/gemini";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { problemId, code, level } = await req.json();
    
    const problem = await prisma.problem.findUnique({
      where: { id: problemId }
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const gemini = new GeminiService();
    const hint = await gemini.codingHint(problem, code, level);

    return NextResponse.json({ hint });

  } catch (error) {
    console.error("Hint API Error:", error);
    return NextResponse.json({ error: "Failed to generate hint" }, { status: 500 });
  }
}
