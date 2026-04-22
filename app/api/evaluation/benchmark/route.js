// app/api/evaluation/benchmark/route.js
// Get benchmarking and competitive positioning data

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import performanceReporter from '@/lib/performance-reporter';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const benchmark = await prisma.benchmarkComparison.findUnique({
      where: { userId: session.user.id },
      select: {
        userScore: true,
        groupMedianScore: true,
        groupAvgScore: true,
        percentileRank: true,
        percentileLabel: true,
        codingScoreVsGroup: true,
        interviewScoreVsGroup: true,
        improvementRateVsGroup: true,
        strengths: true,
        weaknesses: true,
        opportunities: true,
        groupSize: true,
        levelGroup: true,
        lastUpdated: true,
      },
    });

    if (!benchmark) {
      // Calculate if not exists
      const newBenchmark = await performanceReporter.calculateBenchmark(session.user.id);
      return NextResponse.json({
        benchmark: newBenchmark,
        newCalculated: true,
      });
    }

    return NextResponse.json({
      benchmark,
      newCalculated: false,
    });
  } catch (error) {
    console.error('Benchmark retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve benchmark' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Recalculate benchmark
    const benchmark = await performanceReporter.calculateBenchmark(session.user.id);

    return NextResponse.json({
      benchmark,
      recalculated: true,
    });
  } catch (error) {
    console.error('Benchmark calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate benchmark' },
      { status: 500 }
    );
  }
}

// ---

// app/api/evaluation/patterns/route.js
// Get detected performance patterns

export async function GET_PATTERNS(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const patterns = await prisma.performancePattern.findMany({
      where: { userId: session.user.id },
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
      },
    });

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('Pattern retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve patterns' },
      { status: 500 }
    );
  }
}
