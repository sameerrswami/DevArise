// app/api/integration/readiness-score/route.js
// Calculate and retrieve placement readiness score

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const [journey, metrics] = await Promise.all([
      prisma.userJourney.findUnique({
        where: { userId: user.id },
      }),
      prisma.journeyMetrics.findUnique({
        where: { userId: user.id },
      }),
    ]);

    const readinessBreakdown = {
      technical: calculateTechnicalReadiness(metrics),
      interview: calculateInterviewReadiness(metrics),
      resume: metrics?.resumeReadiness || 0,
      jobSearch: calculateJobSearchReadiness(metrics),
      overall: journey?.placementReadiness || 0,
    };

    // Calculate breakdown by area
    const areaScores = {
      dataStructures: calculateAreaScore(metrics, 'data-structures'),
      algorithms: calculateAreaScore(metrics, 'algorithms'),
      systemDesign: calculateAreaScore(metrics, 'system-design'),
      behavioralSkills: calculateAreaScore(metrics, 'behavioral'),
      communicationSkills: calculateAreaScore(metrics, 'communication'),
    };

    // Identify strengths and weaknesses
    const weakAreas = Object.entries(areaScores)
      .filter(([_, score]) => score < 50)
      .map(([area, score]) => ({ area, score }))
      .sort((a, b) => a.score - b.score);

    const strongAreas = Object.entries(areaScores)
      .filter(([_, score]) => score >= 70)
      .map(([area, score]) => ({ area, score }))
      .sort((a, b) => b.score - a.score);

    // Calculate readiness trajectory
    const trajectory = calculateReadinessTrajectory(metrics);

    // Calculate days/weeks until ready
    const readinessTimeline = calculateReadinessTimeline(
      readinessBreakdown.overall,
      trajectory
    );

    return NextResponse.json({
      readiness: readinessBreakdown,
      areaScores,
      strengths: strongAreas,
      weaknesses: weakAreas,
      trajectory,
      estimatedReadiness: readinessTimeline,
      recommendations: generateReadinessRecommendations({
        readiness: readinessBreakdown,
        weaknesses: weakAreas,
        metrics,
      }),
    });
  } catch (error) {
    console.error('Readiness score error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Recalculate readiness scores
    const metrics = await prisma.journeyMetrics.findUnique({
      where: { userId: user.id },
    });

    const technicalScore = calculateTechnicalReadiness(metrics);
    const interviewScore = calculateInterviewReadiness(metrics);
    const resumeScore = metrics?.resumeReadiness || 0;
    const jobSearchScore = calculateJobSearchReadiness(metrics);

    const placementReadiness = Math.round(
      (technicalScore + interviewScore + resumeScore + jobSearchScore) / 4
    );

    const updated = await prisma.userJourney.update({
      where: { userId: user.id },
      data: {
        placementReadiness,
        technicalScore,
        interviewScore,
      },
    });

    return NextResponse.json({
      success: true,
      placementReadiness,
      scores: {
        technical: technicalScore,
        interview: interviewScore,
        resume: resumeScore,
        jobSearch: jobSearchScore,
      },
    });
  } catch (error) {
    console.error('Readiness recalc error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateTechnicalReadiness(metrics) {
  if (!metrics) return 0;

  const problemScore = Math.min(100, (metrics.totalProblemsSolved || 0) / 1.5);
  const accuracyScore = (metrics.problemAccuracy || 0) * 100;
  const avgScore = (problemScore + accuracyScore) / 2;

  // Weight formula: 50% problems solved, 50% accuracy
  return Math.round(avgScore);
}

function calculateInterviewReadiness(metrics) {
  if (!metrics) return 0;

  const interviewScore = Math.min(100, ((metrics.interviewsAttempted || 0) / 30) * 50);
  const successScore = (metrics.interviewSuccessRate || 0) * 50;
  const totalScore = interviewScore + successScore;

  return Math.round(totalScore);
}

function calculateJobSearchReadiness(metrics) {
  if (!metrics) return 0;

  // Based on time investment and consistency
  const timeScore = Math.min(100, ((metrics.totalHoursSpent || 0) / 120) * 50);
  const streakScore = Math.min(50, ((metrics.currentStreak || 0) / 30) * 50);
  const totalScore = timeScore + streakScore;

  return Math.round(totalScore);
}

function calculateAreaScore(metrics, area) {
  // This would come from detailed topic analysis
  // Placeholder: return based on overall accuracy
  const baseAccuracy = (metrics?.problemAccuracy || 0) * 100;

  const areaMultipliers = {
    'data-structures': 0.8,
    'algorithms': 0.85,
    'system-design': 0.7,
    'behavioral': 0.75,
    'communication': 0.8,
  };

  return Math.round(baseAccuracy * (areaMultipliers[area] || 1));
}

function calculateReadinessTrajectory(metrics) {
  // Week-over-week progress
  // In real implementation, would track historical data points
  const recentGrowth = (metrics?.problemAccuracy || 0) > 0.7 ? 'improving' : 'needs-work';
  const pace = (metrics?.totalHoursSpent || 0) > 10 ? 'good' : 'increase-needed';

  return {
    trend: recentGrowth,
    pace,
    consistency: (metrics?.currentStreak || 0) > 3 ? 'consistent' : 'irregular',
  };
}

function calculateReadinessTimeline(currentScore, trajectory) {
  if (currentScore >= 70) {
    return {
      status: 'ready',
      estimatedDays: 0,
      message: 'Ready for placements!',
    };
  }

  const scoreGap = 70 - currentScore;
  let daysNeeded = scoreGap * 2; // Rough estimate: 2 days per point

  if (trajectory.pace === 'increase-needed') {
    daysNeeded *= 1.5;
  }

  return {
    status: currentScore >= 50 ? 'nearly-ready' : 'building',
    estimatedDays: Math.ceil(daysNeeded),
    estimatedWeeks: Math.ceil(daysNeeded / 7),
    message: `On track to be ready in ${Math.ceil(daysNeeded / 7)} weeks`,
  };
}

function generateReadinessRecommendations({ readiness, weaknesses, metrics }) {
  const recommendations = [];

  if (readiness.technical < 50) {
    recommendations.push({
      priority: 'high',
      area: 'technical',
      action: 'Increase problem-solving practice',
      target: `Solve 50+ problems (currently: ${metrics?.totalProblemsSolved})`,
    });
  }

  if (readiness.interview < 50) {
    recommendations.push({
      priority: 'high',
      area: 'interview',
      action: 'Start mock interview practice',
      target: 'Complete at least 10 mock interviews',
    });
  }

  if (weaknesses.length > 0) {
    const topWeakness = weaknesses[0];
    recommendations.push({
      priority: 'medium',
      area: topWeakness.area,
      action: `Master ${topWeakness.area}`,
      target: `Improve from ${Math.round(topWeakness.score)}% to 70%`,
    });
  }

  if (readiness.resume < 60) {
    recommendations.push({
      priority: 'medium',
      area: 'resume',
      action: 'Update and optimize resume',
      target: 'Get resume reviewed by mentor',
    });
  }

  return recommendations;
}
