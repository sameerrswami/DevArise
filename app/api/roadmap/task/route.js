import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, isCompleted } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const updatedTask = await prisma.roadmapTask.update({
      where: { id: taskId },
      data: { 
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Update Task Error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
