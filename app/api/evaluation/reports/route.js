// app/api/evaluation/reports/route.js
// Generate and retrieve performance reports

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import performanceReporter from '@/lib/performance-reporter';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'weekly'; // weekly, monthly
    const limit = parseInt(searchParams.get('limit')) || 5;

    const reports = await prisma.performanceReport.findMany({
      where: {
        userId: session.user.id,
        reportType,
      },
      orderBy: { reportPeriodEnd: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        topMetrics: true,
        scoringBreakdown: true,
        keyInsights: true,
        achievements: true,
        priorityActions: true,
        reportPeriodStart: true,
        reportPeriodEnd: true,
        createdAt: true,
        readBy: true,
        readAt: true,
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Report retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve reports' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reportType = 'weekly' } = await request.json();

    if (!['weekly', 'monthly', 'milestone'].includes(reportType)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
    }

    let report;
    if (reportType === 'weekly') {
      report = await performanceReporter.generateWeeklyReport(session.user.id);
    } else if (reportType === 'monthly') {
      report = await performanceReporter.generateMonthlyReport(session.user.id);
    }

    // Mark as read
    await prisma.performanceReport.update({
      where: { id: report.id },
      data: { readBy: true, readAt: new Date() },
    });

    return NextResponse.json({
      reportId: report.id,
      title: report.title,
      summary: report.summary,
      sections: report.sections,
      format: report.format,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
