// app/api/evaluation/patterns/route.js
// Get performance patterns

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved') === 'true';

    const patterns = await prisma.performancePattern.findMany({
      where: {
        userId: session.user.id,
        isResolved: resolved,
      },
      orderBy: { frequency: 'desc' },
      select: {
        id: true,
        patternType: true,
        category: true,
        severity: true,
        frequency: true,
        description: true,
        commonMistakes: true,
        averageScoreImpact: true,
        suggestedFix: true,
        resourceLinks: true,
        recommendedProblems: true,
        isResolved: true,
        lastOccurredAt: true,
        resolvedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      patterns,
      total: patterns.length,
      unresolvedCount: await prisma.performancePattern.count({
        where: { userId: session.user.id, isResolved: false },
      }),
    });
  } catch (error) {
    console.error('Pattern retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve patterns' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { patternId, action } = await request.json();

    if (action === 'resolve') {
      const pattern = await prisma.performancePattern.update({
        where: { id: patternId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });

      return NextResponse.json({ pattern, resolved: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Pattern update error:', error);
    return NextResponse.json(
      { error: 'Failed to update pattern' },
      { status: 500 }
    );
  }
}

// ---

// Helper function to get personalized recommendations
async function getRecommendations(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const priority = searchParams.get('priority'); // 'high', 'all'

    let whereClause = {
      userId: session.user.id,
      dismissed: false,
    };

    if (priority === 'high') {
      whereClause.priority = { gte: 4 };
    }

    const recommendations = await prisma.recommendationInsight.findMany({
      where: whereClause,
      orderBy: [{ priority: 'desc' }, { suggestedAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        reason: true,
        contentType: true,
        contentId: true,
        contentTitle: true,
        contentDifficulty: true,
        estimatedTime: true,
        expectedBenefit: true,
        expectedScoreIncrease: true,
        basedOnWeakness: true,
        basedOnPattern: true,
        suggestedAt: true,
        actedUpon: true,
        dismissed: true,
      },
    });

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
    });
  } catch (error) {
    console.error('Recommendations retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve recommendations' },
      { status: 500 }
    );
  }
}

export async function PATCH_RECOMMENDATIONS(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { recommendationId, action } = await request.json();

    if (action === 'dismiss') {
      await prisma.recommendationInsight.update({
        where: { id: recommendationId },
        data: { dismissed: true },
      });
      return NextResponse.json({ dismissed: true });
    } else if (action === 'acted') {
      await prisma.recommendationInsight.update({
        where: { id: recommendationId },
        data: { actedUpon: true, actionTakenAt: new Date() },
      });
      return NextResponse.json({ actedUpon: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Recommendation update error:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}
