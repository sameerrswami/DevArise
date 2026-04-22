import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

// GET /api/personalization/goals - Get user's goals
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: {
          include: {
            goals: { orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] },
          },
        },
      },
    });

    if (!user?.profile) return NextResponse.json({ goals: [] });

    return NextResponse.json({ goals: user.profile.goals });
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/personalization/goals - Create a new goal
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, type, targetDate, targetMetrics, priority = 1 } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          problemCategories: {},
          strengths: [],
          weaknesses: [],
          preferredLanguages: ['javascript'],
          targetRoles: [],
        },
      });
    }

    const goal = await prisma.userGoal.create({
      data: {
        userId: user.id,
        title,
        description,
        type,
        targetDate: targetDate ? new Date(targetDate) : null,
        targetMetrics: targetMetrics || {},
        currentProgress: {},
        priority,
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
