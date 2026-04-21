import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NotificationService } from '@/lib/services/revision';

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
      case 'list':
        const type = searchParams.get('type');
        const isRead = searchParams.get('isRead');
        const notifications = await NotificationService.getNotifications(userId, {
          type,
          isRead: isRead !== null ? isRead === 'true' : undefined
        });
        return NextResponse.json({ success: true, notifications });

      case 'unread-count':
        const count = await NotificationService.getUnreadCount(userId);
        return NextResponse.json({ success: true, count });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in notifications API:', error);
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
      case 'mark-read':
        const { notificationId } = data;
        const notification = await NotificationService.markAsRead(notificationId, userId);
        return NextResponse.json({ success: true, notification });

      case 'mark-all-read':
        await NotificationService.markAllAsRead(userId);
        return NextResponse.json({ success: true });

      case 'dismiss':
        const { notificationId: dismissId } = data;
        await NotificationService.dismissNotification(dismissId, userId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in notifications API POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}