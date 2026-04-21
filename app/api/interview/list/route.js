import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await prisma.mockInterview.findMany({
      where: {
        createdBy: session.user.email,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new NextResponse(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : error,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
