import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[API][history] No session found. Session:", session);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API][history] Session found for user:", session.user.id);

    const history = await prisma.history.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        video: true,
      },
      orderBy: {
        viewedAt: "desc",
      },
      take: 10,
    });

    // Get total count of all videos the user has viewed
    const totalVideoCount = await prisma.history.count({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ history, totalVideoCount });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[API][history-post] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API][history-post] Session found for user:", session.user.id);

    const {
      videoId,
      watchTime,
      completed,
      notes,
      title,
      description,
      thumbnailUrl,
      duration,
    } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 },
      );
    }

    // --- Streak Logic ---
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { streak: true, lastActive: true },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActiveDate = user.lastActive
      ? new Date(
          user.lastActive.getFullYear(),
          user.lastActive.getMonth(),
          user.lastActive.getDate(),
        )
      : null;

    let newStreak = user.streak || 0;
    let awardStreakBonus = false;

    if (!lastActiveDate) {
      newStreak = 1;
      awardStreakBonus = true;
    } else {
      const diffTime = today.getTime() - lastActiveDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
        awardStreakBonus = true;
      } else if (diffDays > 1) {
        newStreak = 1;
        awardStreakBonus = true;
      }
      // If diffDays === 0 (same day), keep current streak
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        streak: newStreak,
        lastActive: now,
        ...(awardStreakBonus && { points: { increment: 50 } }), // 50 bonus points for daily activity
      },
    });
    // --- End Streak Logic ---

    // Check current history count
    const historyCount = await prisma.history.count({
      where: { userId: session.user.id },
    });

    // If user has 10 or more history entries, delete the oldest one
    if (historyCount >= 10) {
      const oldestHistory = await prisma.history.findFirst({
        where: { userId: session.user.id },
        orderBy: { viewedAt: "asc" },
        select: { id: true },
      });

      if (oldestHistory) {
        await prisma.history.delete({
          where: { id: oldestHistory.id },
        });
      }
    }

    // Ensure video exists
    let video = await prisma.video.findUnique({
      where: { youtubeId: videoId },
    });

    if (!video) {
      video = await prisma.video.create({
        data: {
          youtubeId: videoId,
          title: title || "",
          description: description || "",
          thumbnail: thumbnailUrl || "",
          duration: duration || "",
          userId: session.user.id,
        },
      });
    }

    // Check if history entry already exists
    const existingHistory = await prisma.history.findFirst({
      where: {
        userId: session.user.id,
        videoId: video.id, // Use the database video ID, not YouTube ID
      },
    });

    let history;
    if (existingHistory) {
      // Check if it's being marked as completed for the first time
      const willBeCompleted = completed === true && !existingHistory.completed;

      // Update existing history
      history = await prisma.history.update({
        where: {
          id: existingHistory.id,
        },
        data: {
          watchTime: watchTime || existingHistory.watchTime,
          completed:
            completed !== undefined ? completed : existingHistory.completed,
          notes: notes !== undefined ? notes : existingHistory.notes,
          viewedAt: new Date(),
        },
        include: {
          video: true,
        },
      });

      // Award points if completed for the first time
      if (willBeCompleted) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { points: { increment: 100 } }, // 100 points per video completion
        });
      }
    } else {
      // Create new history entry
      history = await prisma.history.create({
        data: {
          userId: session.user.id,
          videoId: video.id, // Use the database video ID, not YouTube ID
          watchTime: watchTime || 0,
          completed: completed || false,
          notes: notes || "",
        },
        include: {
          video: true,
        },
      });

      // If created as completed, award points
      if (completed) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { points: { increment: 100 } },
        });
      }
    }

    return NextResponse.json({ history }, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
