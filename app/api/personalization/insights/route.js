import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

// GET /api/personalization/insights - Get user's insights
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isReadParam = searchParams.get('isRead');
    const isRead = isReadParam === 'true' ? true : isReadParam === 'false' ? false : undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: {
          include: {
            insights: {
              where: { ...(type && { type }), ...(isRead !== undefined && { isRead }) },
              orderBy: { createdAt: 'desc' },
              take: limit,
            },
          },
        },
      },
    });

    if (!user?.profile) return NextResponse.json({ insights: [] });

    return NextResponse.json({ insights: user.profile.insights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/personalization/insights - Generate insights
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'weekly_summary' } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: {
          include: {
            activities: { orderBy: { timestamp: 'desc' }, take: 1000 },
            goals: true,
          },
        },
        submissions: {
          include: { problem: true },
          orderBy: { createdAt: 'desc' },
          take: 500,
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const insights = await generateInsights(user, type);

    const createdInsights = [];
    for (const insight of insights) {
      const created = await prisma.insight.create({ data: { userId: user.id, ...insight } });
      createdInsights.push(created);
    }

    return NextResponse.json({ insights: createdInsights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/personalization/insights - Mark insight as read (pass id in body)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const insight = await prisma.insight.findFirst({ where: { id, userId: user.id } });
    if (!insight) return NextResponse.json({ error: 'Insight not found' }, { status: 404 });

    const updated = await prisma.insight.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ insight: updated });
  } catch (error) {
    console.error('Error marking insight as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateInsights(user, type) {
  const insights = [];
  const activities = user.profile?.activities || [];
  const submissions = user.submissions || [];
  const goals = user.profile?.goals || [];

  if (type === 'weekly_summary') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklySubmissions = submissions.filter((s) => new Date(s.createdAt) > weekAgo);
    const weeklyActivities = activities.filter((a) => new Date(a.timestamp) > weekAgo);

    const problemsSolved = weeklySubmissions.filter((s) => s.status === 'accepted').length;
    const totalSubmissions = weeklySubmissions.length;
    const accuracy = totalSubmissions > 0 ? (problemsSolved / totalSubmissions) * 100 : 0;
    const interviewsCompleted = weeklyActivities.filter((a) => a.activityType === 'interview_completed').length;
    const videosWatched = weeklyActivities.filter((a) => a.activityType === 'video_watched').length;

    let content = `This week you solved ${problemsSolved} problems with ${accuracy.toFixed(1)}% accuracy. `;
    content += `You completed ${interviewsCompleted} mock interviews and watched ${videosWatched} videos. `;
    if (accuracy > 80) content += 'Great job maintaining high accuracy!';
    else if (accuracy < 50) content += 'Consider reviewing concepts before attempting problems.';

    const activeGoals = goals.filter((g) => g.status === 'active');
    if (activeGoals.length > 0) content += ` You're working towards ${activeGoals.length} active goal(s).`;

    insights.push({
      type: 'weekly_summary',
      title: 'Weekly Progress Summary',
      content,
      metrics: { problemsSolved, accuracy, interviewsCompleted, videosWatched },
      trends: {},
      recommendations: ['Continue practicing regularly', 'Focus on weak topic areas', 'Schedule more mock interviews'],
      periodStart: weekAgo,
      periodEnd: new Date(),
    });
  }

  if (type === 'improvement_analysis') {
    const recentSubs = submissions.slice(0, 100);
    const olderSubs = submissions.slice(100, 200);

    if (recentSubs.length > 0 && olderSubs.length > 0) {
      const recentAcc = recentSubs.filter((s) => s.status === 'accepted').length / recentSubs.length;
      const olderAcc = olderSubs.filter((s) => s.status === 'accepted').length / olderSubs.length;
      const improvement = olderAcc > 0 ? ((recentAcc - olderAcc) / olderAcc) * 100 : 0;

      let content = `Your problem-solving accuracy has `;
      if (improvement > 10) content += `improved by ${improvement.toFixed(1)}%. Keep it up!`;
      else if (improvement < -10) content += `decreased by ${Math.abs(improvement).toFixed(1)}%. Review fundamentals.`;
      else content += `remained stable. Try harder problems to improve.`;

      insights.push({
        type: 'improvement_analysis',
        title: 'Performance Improvement Analysis',
        content,
        metrics: { recentAccuracy: recentAcc * 100, olderAccuracy: olderAcc * 100, improvement },
        trends: { accuracyTrend: improvement > 0 ? 'improving' : improvement < 0 ? 'declining' : 'stable' },
        recommendations: [
          improvement > 0 ? 'Maintain current study habits' : 'Review weak topics',
          'Practice more difficult problems',
          'Analyze mistakes in failed submissions',
        ],
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
      });
    }
  }

  return insights;
}
