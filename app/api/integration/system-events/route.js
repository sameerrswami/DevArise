// app/api/integration/system-events/route.js
// Process cross-feature system events

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

    const { eventType, eventData } = await request.json();

    // Validate event type
    const validEvents = [
      'problem_completed',
      'interview_completed',
      'module_completed',
      'video_watched',
      'quiz_passed',
      'resume_updated',
      'bookmark_added',
      'code_submitted',
      'milestone_achieved',
    ];

    if (!validEvents.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type: ${eventType}` },
        { status: 400 }
      );
    }

    // Process event through orchestrator
    const processedEvent = await IntegrationOrchestrator.processSystemEvent(
      user.id,
      eventType,
      {
        sourceFeature: eventData.sourceFeature,
        ...eventData,
      }
    );

    // Get updated journey state
    const updatedJourney = await prisma.userJourney.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      eventId: processedEvent.id,
      processed: processedEvent.processed,
      propagatedTo: processedEvent.propagatedTo,
      updatedJourney: {
        currentStage: updatedJourney.currentStage,
        placementReadiness: updatedJourney.placementReadiness,
        stageProgress: updatedJourney.stageProgress,
      },
    });
  } catch (error) {
    console.error('System event processing error:', error);
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const processed = searchParams.get('processed') === 'true';

    const events = await prisma.systemEvent.findMany({
      where: {
        userId: user.id,
        processed: processed ? true : undefined,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        sourceFeature: true,
        targetFeatures: true,
        eventData: true,
        processed: true,
        propagatedTo: true,
        timestamp: true,
      },
    });

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
