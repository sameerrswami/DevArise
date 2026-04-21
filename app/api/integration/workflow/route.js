// app/api/integration/workflow/route.js
// Manage user workflow state and suggestions

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

    const workflow = await prisma.userWorkflow.findUnique({
      where: { userId: user.id },
    });

    if (!workflow) {
      // Create default workflow if doesn't exist
      const newWorkflow = await prisma.userWorkflow.create({
        data: { userId: user.id },
      });
      return NextResponse.json({ workflow: newWorkflow });
    }

    // Calculate session duration
    let sessionDuration = workflow.sessionDuration;
    if (workflow.sessionStartTime) {
      sessionDuration = Math.round(
        (new Date() - workflow.sessionStartTime) / 60000
      );
    }

    return NextResponse.json({
      workflow: {
        id: workflow.id,
        currentWorkflow: workflow.currentWorkflow,
        currentTask: workflow.currentTask,
        sessionId: workflow.sessionId,
        sessionDuration,
        estimatedTimeRemaining: workflow.estimatedTimeRemaining,
        suggestedNextAction: workflow.suggestedNextAction,
        suggestedContent: workflow.suggestedContent,
        estimatedValue: workflow.estimatedValue,
        contextData: workflow.contextData,
        lastInteractionAt: workflow.lastInteractionAt,
      },
    });
  } catch (error) {
    console.error('Workflow get error:', error);
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

    const {
      currentWorkflow,
      currentTask,
      sessionStartTime,
      contextData,
      estimatedTimeRemaining,
    } = await request.json();

    const updates = {
      lastInteractionAt: new Date(),
    };

    if (currentWorkflow) updates.currentWorkflow = currentWorkflow;
    if (currentTask) updates.currentTask = currentTask;
    if (sessionStartTime) updates.sessionStartTime = new Date(sessionStartTime);
    if (contextData) updates.contextData = contextData;
    if (estimatedTimeRemaining) updates.estimatedTimeRemaining = estimatedTimeRemaining;

    const updated = await prisma.userWorkflow.update({
      where: { userId: user.id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      workflow: updated,
    });
  } catch (error) {
    console.error('Workflow update error:', error);
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

    if (action === 'start_session') {
      const updated = await prisma.userWorkflow.update({
        where: { userId: user.id },
        data: {
          sessionId: `session_${Date.now()}`,
          sessionStartTime: new Date(),
          sessionDuration: 0,
        },
      });
      return NextResponse.json({ success: true, workflow: updated });
    }

    if (action === 'end_session') {
      const workflow = await prisma.userWorkflow.findUnique({
        where: { userId: user.id },
      });

      let totalDuration = workflow.sessionDuration || 0;
      if (workflow.sessionStartTime) {
        totalDuration = Math.round(
          (new Date() - workflow.sessionStartTime) / 60000
        );
      }

      const updated = await prisma.userWorkflow.update({
        where: { userId: user.id },
        data: {
          sessionId: null,
          sessionStartTime: null,
          sessionDuration: totalDuration,
          currentTask: null,
        },
      });
      return NextResponse.json({ success: true, workflow: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Workflow patch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
