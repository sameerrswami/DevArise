// app/api/integration/onboarding/route.js
// User journey onboarding and initial setup

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import IntegrationOrchestrator from '@/lib/integration-orchestrator';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const onboardingData = await request.json();

    // Create user journey with personalized roadmap
    const { journey, roadmap } = await IntegrationOrchestrator.initializeUserJourney(
      user.id,
      onboardingData
    );

    return NextResponse.json({
      success: true,
      journey: {
        id: journey.id,
        currentStage: journey.currentStage,
        primaryGoal: journey.primaryGoal,
        targetRoles: journey.targetRoles,
        placementDeadline: journey.placementDeadline,
        currentLevel: journey.currentLevel,
      },
      roadmap: {
        id: roadmap.id,
        title: roadmap.title,
        totalWeeks: roadmap.totalWeeks,
        phases: roadmap.phases.map(phase => ({
          id: phase.id,
          phaseNumber: phase.phaseNumber,
          title: phase.title,
          duration: phase.duration,
          targetProblems: phase.targetProblemsSolved,
          targetAccuracy: phase.targetAccuracy,
          milestones: phase.milestones,
        })),
      },
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const journey = await prisma.userJourney.findUnique({
      where: { userId: user.id },
      include: {
        roadmap: {
          include: {
            phases: { include: { milestones: true } },
          },
        },
      },
    });

    if (!journey) {
      return NextResponse.json({ isOnboarded: false });
    }

    return NextResponse.json({
      isOnboarded: true,
      journey: {
        id: journey.id,
        currentStage: journey.currentStage,
        stageProgress: journey.stageProgress,
        overallProgress: journey.overallProgress,
        primaryGoal: journey.primaryGoal,
        targetRoles: journey.targetRoles,
        targetCompanies: journey.targetCompanies,
        placementDeadline: journey.placementDeadline,
        currentLevel: journey.currentLevel,
        placementReadiness: journey.placementReadiness,
      },
      roadmap: journey.roadmap,
    });
  } catch (error) {
    console.error('Get onboarding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
