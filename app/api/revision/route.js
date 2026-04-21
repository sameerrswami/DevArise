import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SpacedRepetitionService } from '@/lib/services/revision';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = session.user.id;

    switch (action) {
      case 'due-items':
        const limit = parseInt(searchParams.get('limit') || '20');
        const topic = searchParams.get('topic');
        const status = searchParams.get('status');
        
        const dueItems = await SpacedRepetitionService.getDueItems(userId, {
          limit,
          topic,
          status: status ? status.split(',') : undefined
        });
        
        return NextResponse.json({ success: true, items: dueItems });

      case 'stats':
        const stats = await SpacedRepetitionService.getRevisionStats(userId);
        return NextResponse.json({ success: true, stats });

      case 'weak-topics':
        const weakLimit = parseInt(searchParams.get('limit') || '10');
        const weakTopics = await SpacedRepetitionService.getWeakTopics(userId, weakLimit);
        return NextResponse.json({ success: true, weakTopics });

      case 'progress':
        const days = parseInt(searchParams.get('days') || '30');
        const progress = await SpacedRepetitionService.getLearningProgress(userId, days);
        return NextResponse.json({ success: true, progress });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in revision API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;
    const userId = session.user.id;

    switch (action) {
      case 'upsert-item':
        const item = await SpacedRepetitionService.upsertRevisionItem(userId, data);
        return NextResponse.json({ success: true, item });

      case 'record-review':
        const { revisionItemId, reviewData } = data;
        const result = await SpacedRepetitionService.recordReview(userId, revisionItemId, reviewData);
        return NextResponse.json({ success: true, result });

      case 'create-session':
        const sessionResult = await SpacedRepetitionService.createRevisionSession(userId, data);
        return NextResponse.json({ success: true, session: sessionResult.session });

      case 'complete-session':
        const { sessionId } = data;
        const completedSession = await SpacedRepetitionService.completeRevisionSession(sessionId, userId);
        return NextResponse.json({ success: true, session: completedSession });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in revision API POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}