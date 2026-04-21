import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/contests/join - Join a contest
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contestId } = await req.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get contest
    const contest = await prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    // Check if contest is accepting registrations
    if (!contest.registrationOpen) {
      return NextResponse.json({ error: "Registration is closed for this contest" }, { status: 400 });
    }

    // Check if already joined
    const existingEntry = await prisma.contestEntry.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId: user.id
        }
      }
    });

    if (existingEntry) {
      return NextResponse.json({ 
        success: true, 
        message: "Already registered for this contest",
        entry: existingEntry 
      });
    }

    // Check max participants
    if (contest.maxParticipants) {
      const currentCount = await prisma.contestEntry.count({
        where: { contestId }
      });
      if (currentCount >= contest.maxParticipants) {
        return NextResponse.json({ error: "Contest is full" }, { status: 400 });
      }
    }

    // Create contest entry
    const entry = await prisma.contestEntry.create({
      data: {
        contestId,
        userId: user.id
      },
      include: {
        contest: {
          include: {
            problems: {
              include: {
                problem: true
              }
            }
          }
        }
      }
    });

    // Update contest registration count
    await prisma.contest.update({
      where: { id: contestId },
      data: {
        totalRegistrations: { increment: 1 }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully registered for contest",
      entry 
    });
  } catch (error) {
    console.error("Contest Join Error:", error);
    return NextResponse.json({ error: "Failed to join contest" }, { status: 500 });
  }
}