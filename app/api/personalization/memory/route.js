import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/personalization/memory - Store conversation memory
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      aiFeature,
      conversationType,
      userMessage,
      aiResponse,
      context,
      importance = 1,
      topics = [],
      emotions = [],
      keyInsights = []
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const memory = await prisma.conversationMemory.create({
      data: {
        userId: user.id,
        sessionId,
        aiFeature,
        conversationType,
        userMessage,
        aiResponse,
        context: context || {},
        importance,
        topics,
        emotions,
        keyInsights
      }
    });

    return NextResponse.json({ memory }, { status: 201 });

  } catch (error) {
    console.error('Error storing conversation memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/personalization/memory - Retrieve conversation memory
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const aiFeature = searchParams.get('aiFeature');
    const conversationType = searchParams.get('conversationType');
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const topics = searchParams.get('topics')?.split(',') || [];

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query
    const where: any = { userId: user.id };
    if (aiFeature) where.aiFeature = aiFeature;
    if (conversationType) where.conversationType = conversationType;
    if (sessionId) where.sessionId = sessionId;
    if (topics.length > 0) {
      where.topics = { hasSome: topics };
    }

    const memories = await prisma.conversationMemory.findMany({
      where,
      orderBy: [
        { importance: 'desc' },
        { lastAccessed: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Update last accessed time
    if (memories.length > 0) {
      await prisma.conversationMemory.updateMany({
        where: {
          id: { in: memories.map(m => m.id) }
        },
        data: { lastAccessed: new Date() }
      });
    }

    return NextResponse.json({ memories });

  } catch (error) {
    console.error('Error retrieving conversation memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/personalization/memory/context - Get contextual memory for AI responses
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { aiFeature, conversationType, currentTopics = [], limit = 10 } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get relevant memories based on recency, importance, and topic relevance
    const memories = await prisma.conversationMemory.findMany({
      where: {
        userId: user.id,
        aiFeature,
        conversationType,
        OR: [
          { topics: { hasSome: currentTopics } },
          { importance: { gte: 3 } }
        ]
      },
      orderBy: [
        { importance: 'desc' },
        { lastAccessed: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Format memories for AI context
    const contextMemories = memories.map(memory => ({
      sessionId: memory.sessionId,
      userMessage: memory.userMessage,
      aiResponse: memory.aiResponse,
      topics: memory.topics,
      keyInsights: memory.keyInsights,
      timestamp: memory.createdAt
    }));

    return NextResponse.json({ contextMemories });

  } catch (error) {
    console.error('Error retrieving contextual memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
