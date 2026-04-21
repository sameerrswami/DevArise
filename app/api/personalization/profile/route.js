import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/personalization/profile - Get user's personalization profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: {
          include: {
            goals: true,
            recommendations: {
              where: { status: 'pending' },
              orderBy: { priority: 'desc' },
              take: 10
            },
            insights: {
              where: { isRead: false },
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no profile exists, create a default one
    if (!user.profile) {
      const defaultProfile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          problemCategories: {},
          strengths: [],
          weaknesses: [],
          preferredLanguages: ['javascript'],
          targetRoles: []
        },
        include: {
          goals: true,
          recommendations: true,
          insights: true
        }
      });

      return NextResponse.json({
        profile: defaultProfile,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          preparationLevel: user.preparationLevel,
          contestRating: user.contestRating
        }
      });
    }

    return NextResponse.json({
      profile: user.profile,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preparationLevel: user.preparationLevel,
        contestRating: user.contestRating
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/personalization/profile - Update user's personalization profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      learningStyle,
      preferredDifficulty,
      preferredLanguages,
      targetRoles,
      sessionDuration,
      learningPace
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        learningStyle,
        preferredDifficulty,
        preferredLanguages,
        targetRoles,
        sessionDuration,
        learningPace
      },
      create: {
        userId: user.id,
        learningStyle,
        preferredDifficulty,
        preferredLanguages: preferredLanguages || ['javascript'],
        targetRoles: targetRoles || [],
        sessionDuration,
        learningPace,
        problemCategories: {}
      }
    });

    return NextResponse.json({ profile: updatedProfile });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
