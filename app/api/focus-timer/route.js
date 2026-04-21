import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { FocusTimerService, ActivityTrackingService } from '@/lib/services/revision';

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
      case 'stats':
        const days = parseInt(searchParams.get('days') || '30');
        const stats = await FocusTimerService.getFocusStats(userId, days);
        return NextResponse.json({ success: true, stats });

      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '10');
        const sessions = await FocusTimerService.getRecentSessions(userId, limit);
        return NextResponse.json({ success: true, sessions });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in focus timer API:', error);
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
      case 'start':
        const sessionData = await FocusTimerService.startFocusSession(userId, data);
        
        await ActivityTrackingService.logActivity(userId, {
          activityType: ActivityTrackingService.ACTIVITY_TYPES.START_SESSION,
          category: 'focus',
          description: `Started ${data.sessionType || 'pomodoro'} session`,
          duration: data.plannedDuration * 60 * 1000 // Convert minutes to ms
        });
        
        return NextResponse.json({ success: true, session: sessionData });

      case 'complete':
        const { sessionId, completionData } = data;
        const completedSession = await FocusTimerService.completeFocusSession(sessionId, userId, completionData);
        return NextResponse.json({ success: true, session: completedSession });

      case 'interrupt':
        const { sessionId: interruptSessionId, reason } = data;
        const interruptedSession = await FocusTimerService.interruptFocusSession(interruptSessionId, userId, reason);
        return NextResponse.json({ success: true, session: interruptedSession });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in focus timer API POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}