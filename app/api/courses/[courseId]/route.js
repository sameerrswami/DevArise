import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId } = params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" },
              include: {
                progress: session ? {
                  where: { userId: session.user.id }
                } : false
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[Course Detail API Error]:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
