import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

// POST /api/personalization/activity - Track user activity
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activityType, activityId, metadata, score, timeSpent, difficulty, category, sessionId, source } = body;

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

    const activity = await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType,
        activityId,
        metadata: metadata || {},
        score,
        timeSpent,
        difficulty,
        category,
        sessionId,
        source,
      },
    });

    updateProfileAnalytics(user.id).catch(console.error);

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error('Error tracking activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/personalization/activity - Get user's recent activities
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const activities = await prisma.userActivity.findMany({
      where: { userId: user.id, ...(type && { activityType: type }) },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateProfileAnalytics(userId) {
  try {
    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const analytics = calculateAnalytics(activities, submissions);

    await prisma.userProfile.update({
      where: { userId },
      data: {
        strengths: analytics.strengths,
        weaknesses: analytics.weaknesses,
        averageAccuracy: analytics.averageAccuracy,
        averageSolveTime: analytics.averageSolveTime,
        problemCategories: analytics.problemCategories,
        engagementScore: analytics.engagementScore,
        consistencyScore: analytics.consistencyScore,
        improvementRate: analytics.improvementRate,
      },
    });
  } catch (error) {
    console.error('Error updating profile analytics:', error);
  }
}

function calculateAnalytics(activities, submissions) {
  const categoryStats = {};

  for (const submission of submissions) {
    const category = submission.problem.category;
    if (!categoryStats[category]) {
      categoryStats[category] = { solved: 0, total: 0, accuracy: 0, avgTime: 0 };
    }
    categoryStats[category].total++;
    if (submission.status === 'accepted') categoryStats[category].solved++;
  }

  const strengths = [];
  const weaknesses = [];
  let totalAccuracy = 0;
  let validSubmissions = 0;

  for (const [category, stats] of Object.entries(categoryStats)) {
    stats.accuracy = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
    if (stats.accuracy >= 80 && stats.total >= 5) strengths.push(category);
    else if (stats.accuracy < 50 && stats.total >= 3) weaknesses.push(category);
    totalAccuracy += stats.accuracy;
    validSubmissions++;
  }

  const averageAccuracy = validSubmissions > 0 ? totalAccuracy / validSubmissions : 0;

  const recentActivities = activities.filter(
    (a) => new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const engagementScore = Math.min(recentActivities.length / 50, 1);

  const dailyActivity = new Map();
  activities.forEach((activity) => {
    const date = new Date(activity.timestamp).toDateString();
    dailyActivity.set(date, (dailyActivity.get(date) || 0) + 1);
  });
  const consistencyScore = Math.min(dailyActivity.size / 7, 1);

  const recentSubs = submissions.slice(0, 50);
  const olderSubs = submissions.slice(50, 100);
  let improvementRate = 0;
  if (recentSubs.length > 0 && olderSubs.length > 0) {
    const recentAcc = recentSubs.filter((s) => s.status === 'accepted').length / recentSubs.length;
    const olderAcc = olderSubs.filter((s) => s.status === 'accepted').length / olderSubs.length;
    improvementRate = Math.max(0, Math.min((recentAcc - olderAcc) * 2, 1));
  }

  return {
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    averageAccuracy,
    averageSolveTime: 0,
    problemCategories: categoryStats,
    engagementScore,
    consistencyScore,
    improvementRate,
  };
}
