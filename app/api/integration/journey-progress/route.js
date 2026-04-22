// app/api/integration/journey-progress/route.js
// Track and display journey progress

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

    const [journey, metrics, workflow, roadmap] = await Promise.all([
      prisma.userJourney.findUnique({
        where: { userId: user.id },
      }),
      prisma.journeyMetrics.findUnique({
        where: { userId: user.id },
      }),
      prisma.userWorkflow.findUnique({
        where: { userId: user.id },
      }),
      prisma.roadmap.findFirst({
        where: { userId: user.id, isActive: true },
        include: { phases: { include: { milestones: true } } },
      }),
    ]);

    // Calculate stage progress
    const stageProgressMap = {
      'onboarding': Math.min(30, metrics?.totalProblemsSolved || 0),
      'learning': Math.min(70, (metrics?.totalProblemsSolved || 0) * 0.5),
      'practice': Math.min(85, 50 + (metrics?.interviewsAttempted || 0) * 5),
      'interview_prep': Math.min(95, 60 + (metrics?.interviewSuccessRate || 0) * 35),
      'job_search': 100,
    };

    const currentStageProgress = stageProgressMap[journey?.currentStage] || 0;

    // Calculate overall progress
    const overallProgress = (
      journey?.stageProgress * 0.2 +
      ((metrics?.placementReadiness || 0) / 100) * 0.8
    );

    return NextResponse.json({
      journey: {
        id: journey?.id,
        currentStage: journey?.currentStage,
        stageProgress: currentStageProgress,
        overallProgress,
        primaryGoal: journey?.primaryGoal,
        placementReadiness: journey?.placementReadiness || 0,
        estimatedWeeksLeft: journey?.estimatedWeeksLeft,
      },
      metrics: {
        totalProblemsSolved: metrics?.totalProblemsSolved || 0,
        problemAccuracy: (metrics?.problemAccuracy || 0).toFixed(2),
        interviewsAttempted: metrics?.interviewsAttempted || 0,
        interviewSuccessRate: (metrics?.interviewSuccessRate || 0).toFixed(2),
        modulesCompleted: metrics?.modulesCompleted || 0,
        totalHoursSpent: (metrics?.totalHoursSpent || 0).toFixed(1),
        currentStreak: metrics?.currentStreak || 0,
      },
      readiness: {
        technical: metrics?.technicalReadiness || 0,
        interview: metrics?.interviewReadiness || 0,
        resume: metrics?.resumeReadiness || 0,
        jobSearch: metrics?.jobSearchReadiness || 0,
        overall: journey?.placementReadiness || 0,
      },
      workflow: {
        currentWorkflow: workflow?.currentWorkflow,
        suggestedNextAction: workflow?.suggestedNextAction,
        estimatedTimeRemaining: workflow?.estimatedTimeRemaining,
      },
      roadmapPhases: roadmap?.phases?.map(phase => ({
        id: phase.id,
        phaseNumber: phase.phaseNumber,
        title: phase.title,
        progress: phase.progress || 0,
        targetProblems: phase.targetProblemsSolved,
        targetAccuracy: phase.targetAccuracy,
        completedAt: phase.completedAt,
        milestones: phase.milestones?.map(m => ({
          title: m.title,
          targetValue: m.targetValue,
          currentValue: m.currentValue,
          isCompleted: m.isCompleted,
        })),
      })) || [],
    });
  } catch (error) {
    console.error('Journey progress error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const { stageProgress, overallProgress } = await request.json();

    const updated = await prisma.userJourney.update({
      where: { userId: user.id },
      data: {
        stageProgress: stageProgress || undefined,
        overallProgress: overallProgress || undefined,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, journey: updated });
  } catch (error) {
    console.error('Journey update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
