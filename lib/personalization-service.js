// Personalization Service
// This service handles all personalization logic, recommendations, and adaptive features

class PersonalizationService {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  // Track user activity
  async trackActivity(userId, activityData) {
    const {
      activityType,
      activityId,
      metadata = {},
      score,
      timeSpent,
      difficulty,
      category,
      sessionId,
      source = 'platform'
    } = activityData;

    // Ensure user has a profile
    await this.ensureUserProfile(userId);

    // Create activity record
    const activity = await this.prisma.userActivity.create({
      data: {
        userId,
        activityType,
        activityId,
        metadata,
        score,
        timeSpent,
        difficulty,
        category,
        sessionId,
        source
      }
    });

    // Update profile analytics
    await this.updateProfileAnalytics(userId);

    return activity;
  }

  // Generate personalized recommendations
  async generateRecommendations(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            activities: { orderBy: { timestamp: 'desc' }, take: 100 },
            goals: true
          }
        },
        submissions: {
          include: { problem: true },
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!user?.profile) return [];

    const recommendations = [];
    const { activities, goals } = user.profile;
    const submissions = user.submissions;

    // Analyze performance
    const performance = this.analyzePerformance(submissions);

    // Problem recommendations
    if (performance.weakCategories.length > 0) {
      performance.weakCategories.slice(0, 3).forEach(category => {
        recommendations.push({
          type: 'problem',
          title: `Practice ${category} problems`,
          description: `Focus on ${category} problems to improve your weak areas.`,
          priority: 4,
          reason: `Low accuracy in ${category} category`,
          expectedBenefit: 'Improve problem-solving skills',
          confidence: 0.8
        });
      });
    }

    // Interview recommendations
    const interviewCount = activities.filter(a => a.activityType === 'interview_completed').length;
    if (interviewCount < 5) {
      recommendations.push({
        type: 'interview',
        title: 'Complete mock interviews',
        description: 'Practice mock interviews to build confidence.',
        priority: 5,
        reason: 'Limited interview experience',
        expectedBenefit: 'Improve interview performance',
        confidence: 0.9
      });
    }

    // Goal-based recommendations
    goals.filter(g => g.status === 'active').forEach(goal => {
      if (goal.type === 'placement') {
        recommendations.push({
          type: 'contest',
          title: 'Participate in contests',
          description: 'Regular contest participation improves competitive skills.',
          priority: 4,
          reason: 'Placement preparation requires contest experience',
          expectedBenefit: 'Build competitive programming skills',
          confidence: 0.85
        });
      }
    });

    return recommendations.slice(0, 10);
  }

  // Get next best action for user
  async getNextBestAction(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            recommendations: { where: { status: 'pending' }, orderBy: { priority: 'desc' } },
            goals: { where: { status: 'active' } }
          }
        }
      }
    });

    if (!user?.profile) return null;

    const { recommendations, goals } = user.profile;

    // Return highest priority pending recommendation
    if (recommendations.length > 0) {
      return {
        type: 'recommendation',
        action: recommendations[0]
      };
    }

    // Check goals and suggest actions
    if (goals.length > 0) {
      const goal = goals[0];
      return {
        type: 'goal_progress',
        action: {
          title: `Work towards ${goal.title}`,
          description: goal.description,
          type: goal.type
        }
      };
    }

    // Default fallback
    return {
      type: 'general',
      action: {
        title: 'Solve a coding problem',
        description: 'Keep practicing to maintain your skills',
        type: 'practice'
      }
    };
  }

  // Store conversation memory
  async storeConversationMemory(userId, memoryData) {
    const {
      sessionId,
      aiFeature,
      conversationType,
      userMessage,
      aiResponse,
      context = {},
      importance = 1,
      topics = [],
      emotions = [],
      keyInsights = []
    } = memoryData;

    return await this.prisma.conversationMemory.create({
      data: {
        userId,
        sessionId,
        aiFeature,
        conversationType,
        userMessage,
        aiResponse,
        context,
        importance,
        topics,
        emotions,
        keyInsights
      }
    });
  }

  // Retrieve relevant conversation context
  async getConversationContext(userId, aiFeature, conversationType, currentTopics = []) {
    const memories = await this.prisma.conversationMemory.findMany({
      where: {
        userId,
        aiFeature,
        conversationType,
        OR: [
          { topics: { hasSome: currentTopics } },
          { importance: { gte: 3 } }
        ]
      },
      orderBy: [
        { importance: 'desc' },
        { lastAccessed: 'desc' }
      ],
      take: 10
    });

    // Update access time
    if (memories.length > 0) {
      await this.prisma.conversationMemory.updateMany({
        where: { id: { in: memories.map(m => m.id) } },
        data: { lastAccessed: new Date() }
      });
    }

    return memories.map(memory => ({
      sessionId: memory.sessionId,
      userMessage: memory.userMessage,
      aiResponse: memory.aiResponse,
      topics: memory.topics,
      keyInsights: memory.keyInsights,
      timestamp: memory.createdAt
    }));
  }

  // Update user profile analytics
  async updateProfileAnalytics(userId) {
    const activities = await this.prisma.userActivity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 1000
    });

    const submissions = await this.prisma.submission.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    const analytics = this.calculateAnalytics(activities, submissions);

    await this.prisma.userProfile.update({
      where: { userId },
      data: analytics
    });
  }

  // Ensure user has a profile
  async ensureUserProfile(userId) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!existing) {
      await this.prisma.userProfile.create({
        data: {
          userId,
          problemCategories: {},
          strengths: [],
          weaknesses: [],
          preferredLanguages: ['javascript'],
          targetRoles: []
        }
      });
    }
  }

  // Analyze performance from submissions
  analyzePerformance(submissions) {
    const categoryStats = {};
    const weakCategories = [];

    submissions.forEach(submission => {
      const category = submission.problem.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { solved: 0, total: 0 };
      }

      categoryStats[category].total++;
      if (submission.status === 'accepted') {
        categoryStats[category].solved++;
      }
    });

    // Calculate accuracy and identify weak areas
    Object.entries(categoryStats).forEach(([category, stats]) => {
      stats.accuracy = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
      if (stats.accuracy < 60 && stats.total >= 3) {
        weakCategories.push(category);
      }
    });

    weakCategories.sort((a, b) => categoryStats[a].accuracy - categoryStats[b].accuracy);

    return { categoryStats, weakCategories };
  }

  // Calculate comprehensive analytics
  calculateAnalytics(activities, submissions) {
    const performance = this.analyzePerformance(submissions);

    // Calculate engagement (recent activity)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivities = activities.filter(a => new Date(a.timestamp) > weekAgo);
    const engagementScore = Math.min(recentActivities.length / 50, 1);

    // Calculate consistency (daily activity)
    const dailyActivity = new Map();
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      dailyActivity.set(date, (dailyActivity.get(date) || 0) + 1);
    });
    const consistencyScore = Math.min(dailyActivity.size / 7, 1);

    return {
      strengths: Object.entries(performance.categoryStats)
        .filter(([, stats]) => stats.accuracy >= 80 && stats.total >= 5)
        .map(([category]) => category)
        .slice(0, 5),
      weaknesses: performance.weakCategories.slice(0, 5),
      averageAccuracy: Object.values(performance.categoryStats)
        .reduce((sum, stats) => sum + stats.accuracy, 0) / Math.max(Object.keys(performance.categoryStats).length, 1),
      problemCategories: performance.categoryStats,
      engagementScore,
      consistencyScore,
      improvementRate: 0 // Would need historical data to calculate
    };
  }
}

export default PersonalizationService;
