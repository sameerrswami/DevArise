import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { academicStatus, targetRole, skillLevel } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        academicStatus,
        targetRole,
        preparationLevel: skillLevel,
      },
    });

    return NextResponse.json({
      message: "Onboarding completed",
      user: updatedUser
    });
  } catch (error) {
    console.error("[Onboarding API Error]:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
