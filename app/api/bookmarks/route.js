import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BookmarkService, ActivityTrackingService } from '@/lib/services/revision';

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
        const contentType = searchParams.get('contentType');
        const collectionId = searchParams.get('collectionId');
        const priority = searchParams.get('priority');
        const bookmarks = await BookmarkService.getBookmarks(userId, {
          contentType,
          collectionId,
          priority
        });
        return NextResponse.json({ success: true, bookmarks });

      case 'collections':
        const collections = await BookmarkService.getCollections(userId);
        return NextResponse.json({ success: true, collections });

      case 'notes':
        const noteType = searchParams.get('noteType');
        const isQuickRevision = searchParams.get('isQuickRevision');
        const notes = await BookmarkService.getNotes(userId, {
          noteType,
          isQuickRevision: isQuickRevision === 'true' ? true : isQuickRevision === 'false' ? false : undefined
        });
        return NextResponse.json({ success: true, notes });

      case 'quick-revision':
        const quickNotes = await BookmarkService.getQuickRevisionNotes(userId);
        return NextResponse.json({ success: true, notes: quickNotes });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in bookmarks API:', error);
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
      case 'add':
        const bookmark = await BookmarkService.addBookmark(userId, data);
        
        await ActivityTrackingService.logActivity(userId, {
          activityType: ActivityTrackingService.ACTIVITY_TYPES.BOOKMARK,
          category: 'bookmark',
          description: `Bookmarked: ${data.contentTitle}`,
          contentType: data.contentType,
          contentId: data.contentId
        });
        
        return NextResponse.json({ success: true, bookmark });

      case 'remove':
        const { contentType, contentId } = data;
        await BookmarkService.removeBookmark(userId, contentType, contentId);
        return NextResponse.json({ success: true });

      case 'create-collection':
        const collection = await BookmarkService.createCollection(userId, data);
        return NextResponse.json({ success: true, collection });

      case 'create-note':
        const note = await BookmarkService.createNote(userId, data);
        
        await ActivityTrackingService.logActivity(userId, {
          activityType: ActivityTrackingService.ACTIVITY_TYPES.CREATE_NOTE,
          category: 'notes',
          description: `Created note: ${data.title}`,
          contentType: data.contentType,
          contentId: data.contentId
        });
        
        return NextResponse.json({ success: true, note });

      case 'update-note':
        const { noteId, noteData } = data;
        const updatedNote = await BookmarkService.updateNote(noteId, userId, noteData);
        return NextResponse.json({ success: true, note: updatedNote });

      case 'delete-note':
        const { noteId: deleteNoteId } = data;
        await BookmarkService.deleteNote(deleteNoteId, userId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in bookmarks API POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
