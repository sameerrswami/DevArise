import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const mockIdRef = searchParams.get("mockIdRef");
    if (!mockIdRef) {
      return NextResponse.json({
        success: false,
        error: "mockIdRef is required",
      });
    }

    const result = await prisma.userAnswer.findMany({
      where: {
        mockIdRef,
        mockInterview: {
          createdBy: session.user.email,
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : error,
    });
  }
}
