// app/api/evaluation/feedback/[evaluationId]/route.js
// Get detailed feedback for an evaluation

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const evaluation = await prisma.userEvaluation.findUnique({
      where: { id: params.evaluationId },
      include: {
        feedback: {
          select: {
            id: true,
            summary: true,
            detailedFeedback: true,
            keyFindings: true,
            topImprovementAreas: true,
            specificLessons: true,
            immediateActions: true,
            longTermActions: true,
            dimensionalFeedback: true,
            idealApproach: true,
            compareToIdeal: true,
            tone: true,
            motivationalInsight: true,
          },
        },
        recommendations: {
          select: {
            id: true,
            title: true,
            description: true,
            reason: true,
            category: true,
            priority: true,
            contentId: true,
            contentTitle: true,
            expectedBenefit: true,
            expectedScoreIncrease: true,
            estimatedTime: true,
          },
        },
      },
    });

    if (!evaluation || evaluation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      evaluation: {
        id: evaluation.id,
        type: evaluation.evaluationType,
        score: evaluation.overallScore,
        scoreBreakdown: evaluation.scoreBreakdown,
        performanceLevel: evaluation.performanceLevel,
        percentile: evaluation.percentile,
        trend: evaluation.improvementTrend,
        comparedToPrevious: evaluation.comparedToPrevious,
        createdAt: evaluation.createdAt,
      },
      feedback: evaluation.feedback,
      recommendations: evaluation.recommendations,
    });
  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}
