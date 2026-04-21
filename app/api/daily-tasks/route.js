import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DailyPracticeService, ActivityTrackingService } from '@/lib/services/revision';

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
      case 'today':
        const todayTasks = await DailyPracticeService.getTodayTasks(userId);
        return NextResponse.json({ success: true, tasks: todayTasks });

      case 'stats':
        const days = parseInt(searchParams.get('days') || '30');
        const stats = await DailyPracticeService.getDailyTaskStats(userId, days);
        return NextResponse.json({ success: true, stats });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in daily tasks API:', error);
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
      case 'complete':
        const { taskId, completionData } = data;
        const completedTask = await DailyPracticeService.completeDailyTask(userId, taskId, completionData);
        
        // Log activity
        await ActivityTrackingService.logActivity(userId, {
          activityType: ActivityTrackingService.ACTIVITY_TYPES.COMPLETE_TASK,
          category: 'daily',
          description: `Completed daily task: ${taskId}`,
          contentType: 'dailyTask',
          contentId: taskId
        });
        
        return NextResponse.json({ success: true, task: completedTask });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in daily tasks API POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}