// app/api/evaluation/submit/route.js
// Submit evaluation data and trigger analysis

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import evaluationAnalyzer from '@/lib/evaluation-analyzer';
import performanceReporter from '@/lib/performance-reporter';

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      evaluationType, // 'coding', 'interview', 'quiz'
      sourceId,
      sourceType,
      // ... evaluation specific data
    } = data;

    // Validate input
    if (!evaluationType || !['coding', 'interview', 'quiz', 'resume'].includes(evaluationType)) {
      return NextResponse.json(
        { error: 'Invalid evaluation type' },
        { status: 400 }
      );
    }

    // Run analysis
    const result = await evaluationAnalyzer.analyzeUserPerformance(session.user.id, data);

    // Trigger report generation if it's a significant evaluation
    if (data.evaluationType === 'interview' || (data.evaluationType === 'coding' && result.evaluation.overallScore > 80)) {
      // Schedule report generation (can be async)
      performanceReporter.generateWeeklyReport(session.user.id).catch(e => console.error(e));
    }

    return NextResponse.json({
      success: true,
      evaluationId: result.evaluation.id,
      score: result.evaluation.overallScore,
      feedback: result.feedback,
      recommendations: result.recommendations.map(r => ({
        id: r.id,
        title: r.title,
        priority: r.priority,
      })),
      comparison: result.comparison,
    });
  } catch (error) {
    console.error('Evaluation submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process evaluation' },
      { status: 500 }
    );
  }
}
