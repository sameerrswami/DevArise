// lib/performance-reporter.js
// Service for generating comprehensive performance reports and benchmarking

import prisma from './prisma';

class PerformanceReporter {
  /**
   * Generate weekly performance report
   */
  async generateWeeklyReport(userId) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // Fetch metrics for the week
    const evaluations = await prisma.userEvaluation.findMany({
      where: {
        userId,
        createdAt: { gte: weekStart },
      },
    });

    const metrics = await this.aggregateMetrics(userId, weekStart, new Date());

    // Generate report sections
    const achievements = await this.generateAchievements(userId, evaluations, metrics);
    const areasOfConcern = this.generateAreasOfConcern(metrics, evaluations);
    const improvements = this.generateImprovements(evaluations, metrics);
    const keyInsights = this.extractKeyInsights(metrics, evaluations);
    const recommendations = await this.generateWeeklyRecommendations(userId, metrics);

    // Create report
    const report = await prisma.performanceReport.create({
      data: {
        userId,
        reportType: 'weekly',
        reportPeriodStart: weekStart,
        reportPeriodEnd: new Date(),
        title: `Your Week in Review - ${this.getWeeklyTitle(metrics)}`,
        summary: this.generateWeeklySummary(metrics, achievements),
        achievements,
        areasOfConcern,
        improvements,
        keyInsights,
        recommendedActions: recommendations.actions,
        priorityActions: recommendations.priority,
        suggestedContent: recommendations.content,
        topMetrics: {
          problemsSolved: metrics.problemsSolved,
          averageAccuracy: metrics.averageAccuracy,
          interviewsAttempted: metrics.interviewsAttempted,
          hoursSpent: metrics.hoursSpent,
          improvement: metrics.weeklyImprovement,
        },
        scoringBreakdown: {
          coding: metrics.codingScore,
          interview: metrics.interviewScore,
          learning: metrics.learningScore,
          overall: metrics.overallScore,
        },
        motivationalMessage: this.generateMotivationalMessage(metrics),
        nextMilestones: this.defineNextMilestones(metrics),
        format: 'standard',
        sections: ['achievements', 'concerns', 'improvements', 'recommendations'],
      },
    });

    return report;
  }

  /**
   * Generate monthly performance report (comprehensive)
   */
  async generateMonthlyReport(userId) {
    const monthStart = new Date();
    monthStart.setDate(1);

    const evaluations = await prisma.userEvaluation.findMany({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
      include: {
        feedback: true,
      },
    });

    const metrics = await this.aggregateMetrics(userId, monthStart, new Date());
    const benchmarking = await this.getBenchmarkData(userId, metrics);

    // Generate comprehensive sections
    const achievements = await this.generateAchievements(userId, evaluations, metrics);
    const areasOfConcern = this.generateAreasOfConcern(metrics, evaluations);
    const improvements = this.generateImprovements(evaluations, metrics);
    const keyInsights = this.extractKeyInsights(metrics, evaluations);
    const recommendations = await this.generateComprehensiveRecommendations(userId, metrics);
    const benchmarkInsights = this.generateBenchmarkInsights(benchmarking, metrics);

    const report = await prisma.performanceReport.create({
      data: {
        userId,
        reportType: 'monthly',
        reportPeriodStart: monthStart,
        reportPeriodEnd: new Date(),
        title: `Your Month in Review - Comprehensive Analysis`,
        summary: this.generateMonthlySummary(metrics, achievements, benchmarking),
        achievements,
        areasOfConcern,
        improvements,
        keyInsights,
        benchmarkComparison: benchmarkInsights,
        recommendedActions: recommendations.actions,
        priorityActions: recommendations.priority,
        suggestedContent: recommendations.content,
        topMetrics: {
          totalProblems: metrics.problemsSolved,
          accuracyTrend: metrics.accuracyTrend,
          interviewProgress: metrics.interviewScore,
          learningProgress: metrics.learningScore,
          monthlyImprovement: metrics.monthlyImprovement,
          percentileRanking: benchmarking.percentile,
        },
        scoringBreakdown: {
          technical: metrics.codingScore,
          interview: metrics.interviewScore,
          learning: metrics.learningScore,
          overall: metrics.overallScore,
          trend: metrics.trend,
        },
        motivationalMessage: this.generateMotivationalMessage(metrics),
        nextMilestones: this.defineNextMilestones(metrics),
        competitivePosition: benchmarking.position,
        format: 'comprehensive',
        sections: [
          'achievements',
          'concerns',
          'improvements',
          'benchmarking',
          'recommendations',
          'milestones',
        ],
      },
    });

    return report;
  }

  /**
   * Calculate benchmark comparison
   */
  async calculateBenchmark(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Get recent evaluations for user
    const userEvaluations = await prisma.userEvaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (userEvaluations.length === 0) {
      return null;
    }

    const userScore = userEvaluations.reduce((sum, e) => sum + (e.overallScore || 0), 0) / userEvaluations.length;
    const userPerformanceLevel = this.determineLevel(userScore);

    // Get data from users at similar level
    const similarLevelUsers = await prisma.userEvaluation.findMany({
      where: {
        performanceLevel: userPerformanceLevel,
        id: { not: userEvaluations.map(e => e.id).join('|') },
      },
      take: 100,
      select: { overallScore: true, createdAt: true },
    });

    const groupScores = similarLevelUsers.map(e => e.overallScore || 0);
    const groupMedian = this.calculateMedian(groupScores);
    const groupAvg = groupScores.reduce((a, b) => a + b, 0) / groupScores.length;
    const groupMax = Math.max(...groupScores);
    const groupMin = Math.min(...groupScores);

    // Calculate percentile
    const betterScores = groupScores.filter(s => s <= userScore).length;
    const percentile = (betterScores / groupScores.length) * 100;

    // Category-specific comparisons
    const codingEvals = userEvaluations.filter(e => e.evaluationType === 'coding');
    const interviewEvals = userEvaluations.filter(e => e.evaluationType === 'interview');

    const userCodingScore = codingEvals.length > 0
      ? codingEvals.reduce((sum, e) => sum + (e.overallScore || 0), 0) / codingEvals.length
      : 0;

    const userInterviewScore = interviewEvals.length > 0
      ? interviewEvals.reduce((sum, e) => sum + (e.overallScore || 0), 0) / interviewEvals.length
      : 0;

    // Group averages for categories
    const groupCodingEvals = similarLevelUsers
      .filter(u => u.evaluationType === 'coding')
      .map(e => e.overallScore);
    const groupCodingAvg = groupCodingEvals.length > 0
      ? groupCodingEvals.reduce((a, b) => a + b, 0) / groupCodingEvals.length
      : 0;

    const groupInterviewEvals = similarLevelUsers
      .filter(u => u.evaluationType === 'interview')
      .map(e => e.overallScore);
    const groupInterviewAvg = groupInterviewEvals.length > 0
      ? groupInterviewEvals.reduce((a, b) => a + b, 0) / groupInterviewEvals.length
      : 0;

    // Improvement rate
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oldEvals = userEvaluations.filter(e => e.createdAt < twoWeeksAgo);
    const oldScore = oldEvals.length > 0
      ? oldEvals.reduce((sum, e) => sum + (e.overallScore || 0), 0) / oldEvals.length
      : userScore;

    const improvementRate = ((userScore - oldScore) / oldScore) * 100;
    const groupImprovementSample = [];
    for (const user of similarLevelUsers.slice(0, 20)) {
      const trend = await this.calculateUserTrend(user.userId);
      groupImprovementSample.push(trend);
    }
    const groupImprovementRate = groupImprovementSample.length > 0
      ? groupImprovementSample.reduce((a, b) => a + b, 0) / groupImprovementSample.length
      : 0;

    // Determine strengths and weaknesses
    const strengths = [];
    const weaknesses = [];

    if (userCodingScore > groupCodingAvg) strengths.push('Coding');
    else weaknesses.push('Coding');

    if (userInterviewScore > groupInterviewAvg) strengths.push('Interviews');
    else weaknesses.push('Interviews');

    // Opportunities
    const opportunities = [];
    if (userCodingScore < 70) opportunities.push('Improve coding efficiency');
    if (userInterviewScore < 70) opportunities.push('Practice interview communication');
    if (improvementRate < 5) opportunities.push('Accelerate learning pace');

    const comparison = await prisma.benchmarkComparison.upsert({
      where: { userId },
      create: {
        userId,
        levelGroup: userPerformanceLevel,
        experienceGroup: 'intermediate', // Can be enhanced
        userScore,
        groupMedianScore: groupMedian,
        groupAvgScore: groupAvg,
        groupMaxScore: groupMax,
        groupMinScore: groupMin,
        percentileRank: percentile,
        percentileLabel: this.getPercentileLabel(percentile),
        codingScoreVsGroup: userCodingScore - groupCodingAvg,
        interviewScoreVsGroup: userInterviewScore - groupInterviewAvg,
        learningScoreVsGroup: 0,
        problemSolvingSpeedVsGroup: 0,
        improvementRateVsGroup: improvementRate - groupImprovementRate,
        strengths,
        weaknesses,
        opportunities,
        groupSize: groupScores.length,
        dataPoints: userEvaluations.length,
        lastUpdated: new Date(),
      },
      update: {
        userScore,
        groupMedianScore: groupMedian,
        groupAvgScore: groupAvg,
        percentileRank: percentile,
        codingScoreVsGroup: userCodingScore - groupCodingAvg,
        interviewScoreVsGroup: userInterviewScore - groupInterviewAvg,
        improvementRateVsGroup: improvementRate - groupImprovementRate,
        strengths,
        weaknesses,
        opportunities,
        lastUpdated: new Date(),
      },
    });

    return comparison;
  }

  /**
   * Get comprehensive benchmark data for reporting
   */
  async getBenchmarkData(userId, metrics) {
    const comparison = await prisma.benchmarkComparison.findUnique({
      where: { userId },
    });

    if (!comparison) {
      return await this.calculateBenchmark(userId);
    }

    return comparison;
  }

  // ============ HELPER METHODS ============

  async aggregateMetrics(userId, startDate, endDate) {
    const evaluations = await prisma.userEvaluation.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const codingEvals = evaluations.filter(e => e.evaluationType === 'coding');
    const interviewEvals = evaluations.filter(e => e.evaluationType === 'interview');
    const learningEvals = evaluations.filter(e => e.evaluationType === 'quiz');

    const codingScore = codingEvals.length > 0
      ? codingEvals.reduce((sum, e) => sum + (e.overallScore || 0), 0) / codingEvals.length
      : 0;

    const interviewScore = interviewEvals.length > 0
      ? interviewEvals.reduce((sum, e) => sum + (e.overallScore || 0), 0) / interviewEvals.length
      : 0;

    const learningScore = learningEvals.length > 0
      ? learningEvals.reduce((sum, e) => sum + (e.overallScore || 0), 0) / learningEvals.length
      : 0;

    const overallScore = (codingScore + interviewScore + learningScore) / 3;

    // Count activities
    const problemsSolved = evaluations.filter(
      e => e.evaluationType === 'coding' && (e.scoreBreakdown?.correctness || 0) >= 80
    ).length;

    const averageAccuracy = codingEvals.length > 0
      ? codingEvals.reduce((sum, e) => sum + (e.scoreBreakdown?.correctness || 0), 0) / codingEvals.length
      : 0;

    const interviewsAttempted = interviewEvals.length;

    // Trend
    const oldMetrics = await this.aggregateMetrics(userId, new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), startDate);
    const trend = overallScore > oldMetrics.overallScore ? 'improving' : 'stable';

    return {
      codingScore: Math.round(codingScore),
      interviewScore: Math.round(interviewScore),
      learningScore: Math.round(learningScore),
      overallScore: Math.round(overallScore),
      problemsSolved,
      averageAccuracy: Math.round(averageAccuracy),
      interviewsAttempted,
      hoursSpent: 0, // Should be calculated from session data
      weeklyImprovement: ((overallScore - oldMetrics.overallScore) / oldMetrics.overallScore * 100) || 0,
      monthlyImprovement: 0, // Can be enhanced
      trend,
      accuracyTrend: averageAccuracy,
    };
  }

  async generateAchievements(userId, evaluations, metrics) {
    const achievements = [];

    if (metrics.problemsSolved > 0) {
      achievements.push(`🎯 Solved ${metrics.problemsSolved} coding problems with high accuracy`);
    }

    if (metrics.interviewsAttempted > 0) {
      achievements.push(`🎤 Completed ${metrics.interviewsAttempted} mock interviews`);
    }

    if (metrics.trend === 'improving') {
      achievements.push(`📈 Your overall score is improving week over week`);
    }

    // Streak achievement
    const recentConsecutiveDays = await this.calculateStreak(userId);
    if (recentConsecutiveDays > 7) {
      achievements.push(`🔥 ${recentConsecutiveDays}-day learning streak!`);
    }

    return achievements;
  }

  generateAreasOfConcern(metrics, evaluations) {
    const concerns = [];

    if (metrics.codingScore < 60) {
      concerns.push('Coding accuracy is below expectations - focus on problem-solving fundamentals');
    }

    if (metrics.interviewScore < 60) {
      concerns.push('Interview performance needs attention - practice communication and confidence');
    }

    const failedEvaluations = evaluations.filter(e => (e.overallScore || 0) < 50);
    if (failedEvaluations.length > 0) {
      concerns.push(`${failedEvaluations.length} evaluations below passing threshold - review fundamentals`);
    }

    return concerns;
  }

  generateImprovements(evaluations, metrics) {
    const improvements = [];

    const recent = evaluations.slice(0, 5);
    const older = evaluations.slice(5, 10);

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, e) => sum + (e.overallScore || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, e) => sum + (e.overallScore || 0), 0) / older.length;

      if (recentAvg > olderAvg) {
        improvements.push(`Your recent scores average ${Math.round(recentAvg)}% vs ${Math.round(olderAvg)}% before`);
      }
    }

    if (metrics.trend === 'improving') {
      improvements.push('You\'re on an upward trajectory - keep the momentum going!');
    }

    return improvements;
  }

  extractKeyInsights(metrics, evaluations) {
    const insights = [];

    insights.push(`Average overall score: ${metrics.overallScore}%`);
    insights.push(`Strongest area: ${this.getStrongestArea(metrics)}`);
    insights.push(`Focus area: ${this.getFocusArea(metrics)}`);

    const patterns = evaluations.filter(e => e.patternAnalysis && Object.keys(e.patternAnalysis).length > 0);
    if (patterns.length > 0) {
      insights.push(`${patterns.length} recurring patterns detected - address them for faster improvement`);
    }

    return insights;
  }

  generateWeeklySummary(metrics, achievements) {
    return `
Your weekly performance shows an overall score of ${metrics.overallScore}% across all evaluations.
You demonstrated ${achievements.length} key achievements this week.
Keep focusing on consistent practice to maintain your progress!
    `.trim();
  }

  generateMonthlySummary(metrics, achievements, benchmarking) {
    return `
This month, you achieved an average score of ${metrics.overallScore}%, 
placing you at the ${benchmarking?.percentileLabel || 'competitive'} level among peers.
With ${achievements.length} major achievements and notable progress in problem-solving,
you're on track for strong interview preparation. Focus on the weak areas for maximum improvement.
    `.trim();
  }

  async generateWeeklyRecommendations(userId, metrics) {
    const recommendations = await prisma.recommendationInsight.findMany({
      where: { userId, dismissed: false },
      orderBy: { priority: 'desc' },
      take: 10,
    });

    const actions = recommendations.slice(0, 5).map(r => r.title);
    const priority = recommendations.slice(0, 3).map(r => r.title);
    const content = recommendations.slice(0, 5).map(r => r.contentId);

    return { actions, priority, content };
  }

  async generateComprehensiveRecommendations(userId, metrics) {
    // Similar to weekly but more detailed
    return await this.generateWeeklyRecommendations(userId, metrics);
  }

  generateBenchmarkInsights(benchmarking, metrics) {
    return `
You're performing at the ${benchmarking?.percentileLabel || 'average'} level.
Your coding skills (${metrics.codingScore}%) are ${benchmarking?.codingScoreVsGroup > 0 ? 'above' : 'below'} peer average.
Your interview performance (${metrics.interviewScore}%) is ${benchmarking?.interviewScoreVsGroup > 0 ? 'competitive' : 'needs work'}.
    `.trim();
  }

  generateMotivationalMessage(metrics) {
    if (metrics.trend === 'improving' && metrics.overallScore >= 75) {
      return '🚀 You\'re crushing it! Keep up this amazing momentum - you\'re on track for placement success!';
    }
    if (metrics.overallScore >= 80) {
      return '⭐ Excellent performance this period! You\'re at an advanced level - focus on edge cases and polish.';
    }
    if (metrics.trend === 'improving') {
      return '📈 Great progress! Your consistent improvement shows your hard work is paying off. Keep going!';
    }
    return '💪 Every practice session makes you stronger. Focus on weak areas and you\'ll see dramatic improvement.';
  }

  defineNextMilestones(metrics) {
    const milestones = [];

    if (metrics.overallScore < 70) {
      milestones.push('Reach 70% overall score - approaching competency level');
    }
    if (metrics.problemsSolved < 50) {
      milestones.push('Solve 50 coding problems with 80%+ accuracy');
    }
    if (metrics.interviewsAttempted < 10) {
      milestones.push('Complete 10 mock interviews');
    }
    if (metrics.overallScore >= 70 && metrics.overallScore < 85) {
      milestones.push('Achieve 85% overall score - advanced level');
    }

    return milestones;
  }

  getWeeklyTitle(metrics) {
    if (metrics.trend === 'improving') return '📈 Great Progress Week!';
    if (metrics.overallScore >= 80) return '⭐ Strong Performance Week';
    if (metrics.overallScore >= 60) return '✅ Solid Progress Week';
    return '💡 Learning Week';
  }

  getStrongestArea(metrics) {
    if (metrics.codingScore >= metrics.interviewScore && metrics.codingScore >= metrics.learningScore) {
      return 'Coding Problem Solving';
    }
    if (metrics.interviewScore >= metrics.learningScore) return 'Interview Skills';
    return 'Learning Foundation';
  }

  getFocusArea(metrics) {
    if (metrics.codingScore <= Math.min(metrics.interviewScore, metrics.learningScore)) {
      return 'Coding Problem Solving';
    }
    if (metrics.interviewScore <= metrics.learningScore) return 'Interview Skills';
    return 'Learning Fundamentals';
  }

  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  determineLevel(score) {
    if (score >= 80) return 'advanced';
    if (score >= 60) return 'intermediate';
    return 'beginner';
  }

  getPercentileLabel(percentile) {
    if (percentile >= 90) return 'top 10%';
    if (percentile >= 75) return 'top 25%';
    if (percentile >= 50) return 'top 50%';
    return 'bottom 50%';
  }

  async calculateStreak(userId) {
    // Calculate consecutive days with evaluations
    const evaluations = await prisma.userEvaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 365,
      select: { createdAt: true },
    });

    if (evaluations.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < evaluations.length; i++) {
      const current = new Date(evaluations[i].createdAt);
      const previous = new Date(evaluations[i - 1].createdAt);
      const diffDays = Math.floor((previous - current) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) streak++;
      else break;
    }

    return streak;
  }

  async calculateUserTrend(userId) {
    const evaluations = await prisma.userEvaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (evaluations.length < 2) return 0;

    const recent = evaluations.slice(0, 5);
    const older = evaluations.slice(5, 10);

    const recentAvg = recent.reduce((sum, e) => sum + (e.overallScore || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + (e.overallScore || 0), 0) / older.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }
}

export default new PerformanceReporter();
