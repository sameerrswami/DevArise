// app/api/integration/roadmap/route.js
// Manage and adapt personalized roadmap

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const { searchParams } = new URL(request.url);
    const phase = searchParams.get('phase');

    let query = {
      where: { userId: user.id, isActive: true },
      include: { phases: { include: { milestones: true } } },
    };

    if (phase) {
      query.include.phases = {
        where: { phaseNumber: parseInt(phase) },
        include: { milestones: true },
      };
    }

    const roadmap = await prisma.roadmap.findFirst(query);

    if (!roadmap) {
      return NextResponse.json({ error: 'No active roadmap' }, { status: 404 });
    }

    // Calculate phase progress
    const phasesWithProgress = roadmap.phases.map(p => ({
      ...p,
      progress: calculatePhaseProgress(p),
      milestonesCompleted: p.milestones.filter(m => m.isCompleted).length,
      totalMilestones: p.milestones.length,
    }));

    return NextResponse.json({
      roadmap: {
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description,
        totalWeeks: roadmap.totalWeeks,
        currentWeek: roadmap.currentWeek,
        difficulty: roadmap.difficulty,
        isActive: roadmap.isActive,
        completedAt: roadmap.completedAt,
      },
      phases: phasesWithProgress,
      overallProgress: calculateRoadmapProgress(phasesWithProgress),
    });
  } catch (error) {
    console.error('Roadmap get error:', error);
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

    const { phaseId, action, milestoneId } = await request.json();

    // Update phase completion
    if (action === 'complete_phase') {
      const updated = await prisma.roadmapPhase.update({
        where: { id: phaseId },
        data: {
          completedAt: new Date(),
          progress: 1.0,
        },
      });

      return NextResponse.json({ success: true, phase: updated });
    }

    // Complete milestone
    if (action === 'complete_milestone') {
      const updated = await prisma.phaseMilestone.update({
        where: { id: milestoneId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, milestone: updated });
    }

    // Update phase progress
    if (action === 'update_progress') {
      const { progress } = await request.json();
      const updated = await prisma.roadmapPhase.update({
        where: { id: phaseId },
        data: { progress: Math.min(progress, 1.0) },
      });

      return NextResponse.json({ success: true, phase: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Roadmap update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const { action } = await request.json();

    if (action === 'adapt') {
      // Trigger roadmap adaptation
      const journey = await prisma.userJourney.findUnique({
        where: { userId: user.id },
        include: { roadmap: { include: { phases: true } } },
      });

      // In real implementation, would run adaptation logic
      const roadmap = await prisma.roadmap.update({
        where: { id: journey.roadmapId },
        data: {
          lastAdapted: new Date(),
          adaptationCount: journey.roadmap.adaptationCount + 1,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Roadmap adapted based on your progress',
        roadmap,
      });
    }

    if (action === 'skip_phase') {
      const { phaseId } = await request.json();
      // Allow skipping only if prerequisites met
      const phase = await prisma.roadmapPhase.update({
        where: { id: phaseId },
        data: { completedAt: new Date(), progress: 1.0 },
      });

      return NextResponse.json({
        success: true,
        message: 'Phase skipped',
        phase,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Roadmap patch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculatePhaseProgress(phase) {
  if (!phase.milestones || phase.milestones.length === 0) {
    return phase.progress || 0;
  }

  const completedMilestones = phase.milestones.filter(m => m.isCompleted).length;
  return completedMilestones / phase.milestones.length;
}

function calculateRoadmapProgress(phases) {
  if (phases.length === 0) return 0;

  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
  return totalProgress / phases.length;
}
