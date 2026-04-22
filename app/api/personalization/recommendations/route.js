import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

// GET /api/personalization/recommendations - Get user's recommendations
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '20');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: {
          include: {
            recommendations: {
              where: { ...(type && { type }), status },
              orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
              take: limit,
            },
          },
        },
      },
    });

    if (!user?.profile) return NextResponse.json({ recommendations: [] });

    return NextResponse.json({ recommendations: user.profile.recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/personalization/recommendations - Generate new recommendations
export async function POST(request) {
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
            activities: { orderBy: { timestamp: 'desc' }, take: 100 },
            goals: true,
          },
        },
        submissions: {
          include: { problem: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const recommendations = generateRecommendations(user);

    // Expire old pending recommendations
    await prisma.recommendation.updateMany({
      where: {
        userId: user.id,
        status: 'pending',
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      data: { status: 'expired' },
    });

    const createdRecommendations = [];
    for (const rec of recommendations) {
      const recommendation = await prisma.recommendation.create({
        data: { userId: user.id, ...rec },
      });
      createdRecommendations.push(recommendation);
    }

    return NextResponse.json({ recommendations: createdRecommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/personalization/recommendations - Update recommendation status (pass id in body)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, completedAt } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const recommendation = await prisma.recommendation.findFirst({
      where: { id, userId: user.id },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const updateData = { status };
    if (status === 'viewed' && !recommendation.viewedAt) {
      updateData.viewedAt = new Date();
    }
    if (status === 'completed' && !recommendation.completedAt) {
      updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
    }

    const updated = await prisma.recommendation.update({ where: { id }, data: updateData });

    return NextResponse.json({ recommendation: updated });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateRecommendations(user) {
  const recommendations = [];
  const activities = user.profile?.activities || [];
  const submissions = user.submissions || [];
  const goals = user.profile?.goals || [];

  const problemStats = analyzeProblemPerformance(submissions);

  for (const category of problemStats.weakCategories.slice(0, 3)) {
    recommendations.push({
      type: 'problem',
      title: `Practice ${category} problems`,
      description: `Based on your recent performance, you need more practice in ${category} problems.`,
      priority: 4,
      reason: `Your accuracy in ${category} is ${problemStats.categoryStats[category]?.accuracy?.toFixed(1) || 0}%.`,
      expectedBenefit: `Improve ${category} problem-solving skills`,
      confidence: 0.8,
    });
  }

  const interviewCount = activities.filter((a) => a.activityType === 'interview_completed').length;
  if (interviewCount < 5) {
    recommendations.push({
      type: 'interview',
      title: 'Complete mock interviews',
      description: 'Regular mock interviews are crucial for placement preparation.',
      priority: 5,
      reason: 'You have completed fewer than 5 interviews.',
      expectedBenefit: 'Improve interview performance and communication skills',
      confidence: 0.9,
    });
  }

  for (const goal of goals.filter((g) => g.status === 'active')) {
    if (goal.type === 'placement') {
      recommendations.push({
        type: 'contest',
        title: 'Participate in rated contests',
        description: 'Regular contest participation improves problem-solving speed.',
        priority: 4,
        reason: 'Placement goals require strong competitive programming skills.',
        expectedBenefit: 'Build contest experience and rating',
        confidence: 0.85,
      });
      break;
    }
  }

  const hasRecentRevision = activities.slice(0, 10).some((a) => a.activityType === 'revision_completed');
  if (!hasRecentRevision) {
    recommendations.push({
      type: 'revision',
      title: 'Review weak topics',
      description: 'Spend time revising topics you struggle with.',
      priority: 3,
      reason: 'Regular revision improves long-term retention.',
      expectedBenefit: 'Strengthen understanding of weak areas',
      confidence: 0.7,
    });
  }

  return recommendations.slice(0, 10);
}

function analyzeProblemPerformance(submissions) {
  const categoryStats = {};
  const weakCategories = [];

  for (const submission of submissions) {
    const category = submission.problem?.category;
    if (!category) continue;
    if (!categoryStats[category]) categoryStats[category] = { solved: 0, total: 0, accuracy: 0 };
    categoryStats[category].total++;
    if (submission.status === 'accepted') categoryStats[category].solved++;
  }

  for (const [category, stats] of Object.entries(categoryStats)) {
    stats.accuracy = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
    if (stats.accuracy < 60 && stats.total >= 3) weakCategories.push(category);
  }

  weakCategories.sort((a, b) => categoryStats[a].accuracy - categoryStats[b].accuracy);

  return { categoryStats, weakCategories };
}
