import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/personalization/recommendations - Get user's recommendations
export async function GET(request: NextRequest) {
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
              where: {
                ...(type && { type }),
                status
              },
              orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
              ],
              take: limit
            }
          }
        }
      }
    });

    if (!user?.profile) {
      return NextResponse.json({ recommendations: [] });
    }

    return NextResponse.json({ recommendations: user.profile.recommendations });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/personalization/recommendations/generate - Generate new recommendations
export async function POST(request: NextRequest) {
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
            activities: {
              orderBy: { timestamp: 'desc' },
              take: 100
            },
            goals: true
          }
        },
        submissions: {
          include: { problem: true },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate recommendations based on user data
    const recommendations = await generateRecommendations(user);

    // Clear old pending recommendations
    await prisma.recommendation.updateMany({
      where: {
        userId: user.id,
        status: 'pending',
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Older than 7 days
        }
      },
      data: { status: 'expired' }
    });

    // Insert new recommendations
    const createdRecommendations = [];
    for (const rec of recommendations) {
      const recommendation = await prisma.recommendation.create({
        data: {
          userId: user.id,
          ...rec
        }
      });
      createdRecommendations.push(recommendation);
    }

    return NextResponse.json({ recommendations: createdRecommendations });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/personalization/recommendations/[id] - Update recommendation status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, completedAt } = body;

    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        userId: (await prisma.user.findUnique({ where: { email: session.user.email } }))!.id
      }
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const updateData: any = { status };
    if (status === 'viewed' && !recommendation.viewedAt) {
      updateData.viewedAt = new Date();
    }
    if (status === 'completed' && !recommendation.completedAt) {
      updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
    }

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ recommendation: updatedRecommendation });

  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Recommendation generation logic
async function generateRecommendations(user: any) {
  const recommendations = [];
  const profile = user.profile;
  const activities = profile?.activities || [];
  const submissions = user.submissions || [];
  const goals = profile?.goals || [];

  // Analyze problem-solving performance
  const problemStats = analyzeProblemPerformance(submissions);

  // Generate problem recommendations
  if (problemStats.weakCategories.length > 0) {
    for (const category of problemStats.weakCategories.slice(0, 3)) {
      recommendations.push({
        type: 'problem',
        title: `Practice ${category} problems`,
        description: `Based on your recent performance, you need more practice in ${category} problems. Focus on medium to hard difficulty.`,
        priority: 4,
        reason: `Your accuracy in ${category} is ${problemStats.categoryStats[category]?.accuracy || 0}%. More practice will help improve.`,
        expectedBenefit: `Improve ${category} problem-solving skills`,
        confidence: 0.8
      });
    }
  }

  // Generate interview recommendations
  const interviewCount = activities.filter((a: any) => a.activityType === 'interview_completed').length;
  if (interviewCount < 5) {
    recommendations.push({
      type: 'interview',
      title: 'Complete mock interviews',
      description: 'Regular mock interviews are crucial for placement preparation. Schedule 2-3 interviews per week.',
      priority: 5,
      reason: 'You have completed fewer than 5 interviews. More practice will build confidence.',
      expectedBenefit: 'Improve interview performance and communication skills',
      confidence: 0.9
    });
  }

  // Generate goal-based recommendations
  for (const goal of goals.filter((g: any) => g.status === 'active')) {
    if (goal.type === 'placement') {
      recommendations.push({
        type: 'contest',
        title: 'Participate in rated contests',
        description: 'Regular contest participation improves problem-solving speed and competitive programming skills.',
        priority: 4,
        reason: 'Placement goals require strong competitive programming skills.',
        expectedBenefit: 'Build contest experience and rating',
        confidence: 0.85
      });
    }
  }

  // Generate revision recommendations
  const recentActivity = activities.slice(0, 10);
  const hasRecentRevision = recentActivity.some((a: any) => a.activityType === 'revision_completed');
  if (!hasRecentRevision) {
    recommendations.push({
      type: 'revision',
      title: 'Review weak topics',
      description: 'Spend time revising topics you struggle with to reinforce learning.',
      priority: 3,
      reason: 'Regular revision improves long-term retention.',
      expectedBenefit: 'Strengthen understanding of weak areas',
      confidence: 0.7
    });
  }

  return recommendations.slice(0, 10); // Limit to 10 recommendations
}

function analyzeProblemPerformance(submissions: any[]) {
  const categoryStats: { [key: string]: { solved: number, total: number, accuracy: number } } = {};
  const weakCategories: string[] = [];

  for (const submission of submissions) {
    const category = submission.problem.category;
    if (!categoryStats[category]) {
      categoryStats[category] = { solved: 0, total: 0, accuracy: 0 };
    }

    categoryStats[category].total++;
    if (submission.status === 'accepted') {
      categoryStats[category].solved++;
    }
  }

  // Calculate accuracy and identify weak categories
  for (const [category, stats] of Object.entries(categoryStats)) {
    stats.accuracy = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
    if (stats.accuracy < 60 && stats.total >= 3) {
      weakCategories.push(category);
    }
  }

  // Sort weak categories by accuracy (worst first)
  weakCategories.sort((a, b) => categoryStats[a].accuracy - categoryStats[b].accuracy);

  return { categoryStats, weakCategories };
}
