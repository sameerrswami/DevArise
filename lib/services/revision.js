import prisma from "@/lib/prisma";

/**
 * Spaced Repetition Service implementing SM-2 Algorithm
 * Based on the SuperMemo-2 algorithm for optimal review scheduling
 */
export class SpacedRepetitionService {
  // SM-2 Algorithm Constants
  static EASINESS_FACTOR_START = 2.5;
  static MIN_EASINESS_FACTOR = 1.3;
  static INITIAL_INTERVALS = [1, 6]; // Days after first two repetitions
  
  // Rating scale (1-5)
  static RATINGS = {
    COMPLETE_BLACKOUT: 1, // Couldn't recall at all
    INCORRECT: 2,         // Incorrect response
    HARD: 3,              // Correct but required significant effort
    EASY: 4,              // Correct with some effort
    PERFECT: 5            // Perfect recall, instant response
  };

  // Status definitions
  static STATUS = {
    NEW: 'new',
    LEARNING: 'learning',
    REVIEWING: 'reviewing',
    MASTERED: 'mastered',
    DORMANT: 'dormant'
  };

  /**
   * Calculate next interval using SM-2 algorithm
   * @param {number} easeFactor - Current easiness factor
   * @param {number} repetitions - Number of successful repetitions
   * @param {number} rating - User's self-rating (1-5)
   * @returns {object} Updated ease factor and interval
   */
  static calculateNextInterval(easeFactor, repetitions, rating) {
    // Update easiness factor using SM-2 formula
    // EF' = EF + 0.1 - (5 - r) * (0.08 + (5 - r) * 0.02)
    const newEaseFactor = Math.max(
      this.MIN_EASINESS_FACTOR,
      easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)
    );

    let newInterval;
    
    if (rating < 3) {
      // If rating is poor, reset to learning phase
      newInterval = 1; // Review tomorrow
    } else {
      // Calculate interval based on repetitions
      if (repetitions === 0) {
        newInterval = 1; // First successful repetition: 1 day
      } else if (repetitions === 1) {
        newInterval = 6; // Second successful repetition: 6 days
      } else {
        // Subsequent repetitions: multiply by ease factor
        newInterval = Math.round(this.INITIAL_INTERVALS[1] * Math.pow(newEaseFactor, repetitions - 1));
      }
    }

    return {
      easeFactor: Math.round(newEaseFactor * 100) / 100,
      interval: newInterval,
      repetitions: rating >= 3 ? repetitions + 1 : 0
    };
  }

  /**
   * Calculate priority score for revision items
   * Higher score = more urgent to review
   */
  static calculatePriority(revisionItem) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextReview = new Date(revisionItem.nextReviewDate);
    nextReview.setHours(0, 0, 0, 0);
    
    const daysOverdue = Math.floor((today - nextReview) / (1000 * 60 * 60 * 24));
    const daysUntilDue = -daysOverdue;
    
    // Base priority from overdue status
    let priority = 0;
    
    if (daysOverdue > 0) {
      // Overdue items get high priority
      priority += daysOverdue * 10;
    } else if (daysUntilDue === 0) {
      // Due today
      priority += 50;
    } else if (daysUntilDue <= 3) {
      // Due in next 3 days
      priority += 30 - daysUntilDue * 5;
    }
    
    // Adjust by difficulty
    priority += revisionItem.difficultyLevel * 20;
    
    // Adjust by success rate (lower success rate = higher priority)
    if (revisionItem.totalAttempts > 0) {
      const failureRate = 1 - revisionItem.successRate;
      priority += failureRate * 15;
    }
    
    // Status bonus
    if (revisionItem.status === this.STATUS.LEARNING) {
      priority += 25;
    }
    
    // Bookmark bonus
    if (revisionItem.isBookmarked) {
      priority += 10;
    }
    
    return Math.round(priority * 100) / 100;
  }

  /**
   * Create or update a revision item
   */
  static async upsertRevisionItem(userId, data) {
    try {
      const { contentType, contentId, contentTitle, topic, subtopic, tags, metadata } = data;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existing = await prisma.revisionItem.findUnique({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType,
            contentId
          }
        }
      });
      
      if (existing) {
        // Update existing item
        return await prisma.revisionItem.update({
          where: { id: existing.id },
          data: {
            contentTitle,
            topic,
            subtopic,
            tags,
            contentMetadata: metadata,
            updatedAt: new Date()
          }
        });
      }
      
      // Create new item
      return await prisma.revisionItem.create({
        data: {
          userId,
          contentType,
          contentId,
          contentTitle,
          topic,
          subtopic,
          tags: tags || [],
          contentMetadata: metadata,
          nextReviewDate: today, // Available for review immediately
          firstLearnedDate: today,
          status: this.STATUS.NEW
        }
      });
    } catch (error) {
      console.error('Error upserting revision item:', error);
      throw error;
    }
  }

  /**
   * Record a review and update spaced repetition schedule
   */
  static async recordReview(userId, revisionItemId, reviewData) {
    try {
      const { rating, timeTaken, confidenceLevel, notes, sessionId } = reviewData;
      
      // Get current revision item
      const revisionItem = await prisma.revisionItem.findUnique({
        where: { id: revisionItemId },
        include: { user: true }
      });
      
      if (!revisionItem || revisionItem.userId !== userId) {
        throw new Error('Revision item not found');
      }
      
      // Calculate new interval
      const { easeFactor: newEaseFactor, interval: newInterval, repetitions: newRepetitions } = 
        this.calculateNextInterval(
          revisionItem.easeFactor,
          revisionItem.repetitions,
          rating
        );
      
      // Calculate next review date
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
      nextReviewDate.setHours(0, 0, 0, 0);
      
      // Update success rate
      const newTotalAttempts = revisionItem.totalAttempts + 1;
      const newCorrectAttempts = revisionItem.correctAttempts + (rating >= 3 ? 1 : 0);
      const newSuccessRate = newCorrectAttempts / newTotalAttempts;
      
      // Determine new status
      let newStatus = revisionItem.status;
      if (rating < 3) {
        newStatus = this.STATUS.LEARNING;
      } else if (newRepetitions >= 5 && newSuccessRate >= 0.9) {
        newStatus = this.STATUS.MASTERED;
      } else if (newRepetitions >= 2) {
        newStatus = this.STATUS.REVIEWING;
      } else {
        newStatus = this.STATUS.LEARNING;
      }
      
      // Update difficulty based on recent performance
      const recentRatings = [rating]; // Could be expanded to track more history
      const avgRating = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
      const newDifficulty = Math.max(0, Math.min(1, 1 - (avgRating - 1) / 4));
      
      // Create review log
      const reviewLog = await prisma.reviewLog.create({
        data: {
          revisionItemId,
          sessionId,
          rating,
          timeTaken,
          wasCorrect: rating >= 3,
          confidenceLevel,
          notes,
          easeFactorBefore: revisionItem.easeFactor,
          easeFactorAfter: newEaseFactor,
          intervalBefore: revisionItem.interval,
          intervalAfter: newInterval
        }
      });
      
      // Update revision item
      const updatedItem = await prisma.revisionItem.update({
        where: { id: revisionItemId },
        data: {
          easeFactor: newEaseFactor,
          interval: newInterval,
          repetitions: newRepetitions,
          nextReviewDate,
          lastReviewDate: new Date(),
          difficultyLevel: newDifficulty,
          successRate: newSuccessRate,
          totalAttempts: newTotalAttempts,
          correctAttempts: newCorrectAttempts,
          status: newStatus
        }
      });
      
      // Recalculate priority
      const priority = this.calculatePriority(updatedItem);
      await prisma.revisionItem.update({
        where: { id: revisionItemId },
        data: { priority }
      });
      
      return {
        revisionItem: updatedItem,
        reviewLog,
        nextReviewDate,
        interval: newInterval
      };
    } catch (error) {
      console.error('Error recording review:', error);
      throw error;
    }
  }

  /**
   * Get items due for review
   */
  static async getDueItems(userId, options = {}) {
    try {
      const { limit = 20, topic, status, includeOverdue = true } = options;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const where = {
        userId,
        isArchived: false,
        nextReviewDate: { lte: today }
      };
      
      if (topic) {
        where.topic = topic;
      }
      
      if (status && status.length > 0) {
        where.status = { in: status };
      }
      
      const items = await prisma.revisionItem.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { nextReviewDate: 'asc' }
        ],
        take: limit,
        include: {
          reviewLogs: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      
      return items;
    } catch (error) {
      console.error('Error getting due items:', error);
      return [];
    }
  }

  /**
   * Get revision statistics for a user
   */
  static async getRevisionStats(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all revision items
      const items = await prisma.revisionItem.findMany({
        where: { userId, isArchived: false }
      });
      
      // Calculate statistics
      const stats = {
        totalItems: items.length,
        byStatus: {},
        byTopic: {},
        dueToday: 0,
        overdue: 0,
        dueThisWeek: 0,
        mastered: 0,
        averageEaseFactor: 0,
        averageSuccessRate: 0,
        recentActivity: []
      };
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      items.forEach(item => {
        // Status counts
        stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
        
        // Topic counts
        if (item.topic) {
          stats.byTopic[item.topic] = (stats.byTopic[item.topic] || 0) + 1;
        }
        
        // Due date analysis
        const nextReview = new Date(item.nextReviewDate);
        nextReview.setHours(0, 0, 0, 0);
        
        if (nextReview < today) {
          stats.overdue++;
          stats.dueToday++;
        } else if (nextReview.getTime() === today.getTime()) {
          stats.dueToday++;
        } else if (nextReview <= nextWeek) {
          stats.dueThisWeek++;
        }
        
        // Mastered count
        if (item.status === this.STATUS.MASTERED) {
          stats.mastered++;
        }
        
        // Averages
        stats.averageEaseFactor += item.easeFactor;
        stats.averageSuccessRate += item.successRate;
      });
      
      if (items.length > 0) {
        stats.averageEaseFactor = Math.round(stats.averageEaseFactor / items.length * 100) / 100;
        stats.averageSuccessRate = Math.round(stats.averageSuccessRate / items.length * 100) / 100;
      }
      
      // Get recent activity (last 7 days)
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentReviews = await prisma.reviewLog.findMany({
        where: {
          revisionItem: { userId },
          createdAt: { gte: weekAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      
      // Group by date for heatmap
      const activityByDate = {};
      recentReviews.forEach(review => {
        const dateStr = review.createdAt.toISOString().split('T')[0];
        activityByDate[dateStr] = (activityByDate[dateStr] || 0) + 1;
      });
      
      stats.recentActivity = activityByDate;
      
      return stats;
    } catch (error) {
      console.error('Error getting revision stats:', error);
      return null;
    }
  }

  /**
   * Get weak topics for a user
   */
  static async getWeakTopics(userId, limit = 10) {
    try {
      const topics = await prisma.revisionItem.groupBy({
        by: ['topic'],
        where: {
          userId,
          isArchived: false,
          status: { not: this.STATUS.MASTERED }
        },
        _avg: {
          successRate: true,
          difficultyLevel: true
        },
        _count: true
      });
      
      // Sort by weakness (low success rate, high difficulty)
      const weakTopics = topics
        .map(t => ({
          topic: t.topic,
          itemCount: t._count,
          avgSuccessRate: t._avg.successRate || 0,
          avgDifficulty: t._avg.difficultyLevel || 0.5,
          weaknessScore: (1 - (t._avg.successRate || 0)) * 0.6 + (t._avg.difficultyLevel || 0.5) * 0.4
        }))
        .sort((a, b) => b.weaknessScore - a.weaknessScore)
        .slice(0, limit);
      
      return weakTopics;
    } catch (error) {
      console.error('Error getting weak topics:', error);
      return [];
    }
  }

  /**
   * Create a revision session
   */
  static async createRevisionSession(userId, sessionData) {
    try {
      const { sessionType, title, description, itemIds, plannedDuration } = sessionData;
      
      const session = await prisma.revisionSession.create({
        data: {
          userId,
          sessionType,
          title,
          description,
          plannedDuration,
          itemsPlanned: itemIds.length
        }
      });
      
      // Add items to session
      const sessionItems = await Promise.all(
        itemIds.map((itemId, index) => 
          prisma.revisionSessionItem.create({
            data: {
              sessionId: session.id,
              revisionItemId: itemId,
              order: index
            }
          })
        )
      );
      
      return { session, sessionItems };
    } catch (error) {
      console.error('Error creating revision session:', error);
      throw error;
    }
  }

  /**
   * Complete a revision session
   */
  static async completeRevisionSession(sessionId, userId) {
    try {
      const session = await prisma.revisionSession.findUnique({
        where: { id: sessionId },
        include: {
          sessionItems: {
            include: { revisionItem: true }
          }
        }
      });
      
      if (!session || session.userId !== userId) {
        throw new Error('Session not found');
      }
      
      const completedItems = session.sessionItems.filter(item => item.wasCompleted);
      const correctItems = completedItems.filter(item => item.wasCorrect);
      
      const totalTimeTaken = completedItems.reduce((sum, item) => sum + (item.timeTaken || 0), 0);
      const avgConfidence = completedItems.length > 0 
        ? completedItems.reduce((sum, item) => sum + (item.confidenceLevel || 0), 0) / completedItems.length 
        : 0;
      
      // Update session
      const updatedSession = await prisma.revisionSession.update({
        where: { id: sessionId },
        data: {
          actualDuration: totalTimeTaken,
          itemsCompleted: completedItems.length,
          itemsCorrect: correctItems.length,
          accuracy: completedItems.length > 0 ? correctItems.length / completedItems.length : 0,
          averageTimeTaken: completedItems.length > 0 ? Math.round(totalTimeTaken / completedItems.length) : null,
          averageConfidence: Math.round(avgConfidence * 100) / 100,
          completedAt: new Date()
        }
      });
      
      return updatedSession;
    } catch (error) {
      console.error('Error completing revision session:', error);
      throw error;
    }
  }

  /**
   * Get revision sessions for a user
   */
  static async getRevisionSessions(userId, options = {}) {
    try {
      const { limit = 20, sessionType, startDate, endDate } = options;
      
      const where = { userId };
      
      if (sessionType) {
        where.sessionType = sessionType;
      }
      
      if (startDate || endDate) {
        where.startedAt = {};
        if (startDate) where.startedAt.gte = new Date(startDate);
        if (endDate) where.startedAt.lte = new Date(endDate);
      }
      
      return await prisma.revisionSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        include: {
          sessionItems: {
            include: {
              revisionItem: {
                select: {
                  id: true,
                  contentTitle: true,
                  contentType: true,
                  topic: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting revision sessions:', error);
      return [];
    }
  }

  /**
   * Archive a revision item
   */
  static async archiveRevisionItem(userId, revisionItemId) {
    try {
      return await prisma.revisionItem.updateMany({
        where: {
          id: revisionItemId,
          userId
        },
        data: {
          isArchived: true
        }
      });
    } catch (error) {
      console.error('Error archiving revision item:', error);
      throw error;
    }
  }

  /**
   * Reset a revision item (for relearning)
   */
  static async resetRevisionItem(userId, revisionItemId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return await prisma.revisionItem.update({
        where: { 
          id: revisionItemId,
          userId
        },
        data: {
          easeFactor: this.EASINESS_FACTOR_START,
          interval: 0,
          repetitions: 0,
          nextReviewDate: today,
          lastReviewDate: null,
          successRate: 0,
          totalAttempts: 0,
          correctAttempts: 0,
          status: this.STATUS.NEW,
          priority: 0
        }
      });
    } catch (error) {
      console.error('Error resetting revision item:', error);
      throw error;
    }
  }

  /**
   * Get revision item by content
   */
  static async getRevisionItemByContent(userId, contentType, contentId) {
    try {
      return await prisma.revisionItem.findUnique({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType,
            contentId
          }
        },
        include: {
          reviewLogs: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } catch (error) {
      console.error('Error getting revision item by content:', error);
      return null;
    }
  }

  /**
   * Get learning progress over time
   */
  static async getLearningProgress(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      // Get daily review counts
      const reviews = await prisma.reviewLog.findMany({
        where: {
          revisionItem: { userId },
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Group by date
      const dailyStats = {};
      reviews.forEach(review => {
        const dateStr = review.createdAt.toISOString().split('T')[0];
        if (!dailyStats[dateStr]) {
          dailyStats[dateStr] = {
            date: dateStr,
            totalReviews: 0,
            correctReviews: 0,
            averageRating: 0,
            averageConfidence: 0
          };
        }
        
        const stat = dailyStats[dateStr];
        stat.totalReviews++;
        if (review.wasCorrect) stat.correctReviews++;
        
        // Running average for rating
        stat.averageRating = ((stat.averageRating * (stat.totalReviews - 1)) + review.rating) / stat.totalReviews;
        if (review.confidenceLevel) {
          stat.averageConfidence = ((stat.averageConfidence * (stat.totalReviews - 1)) + review.confidenceLevel) / stat.totalReviews;
        }
      });
      
      return Object.values(dailyStats);
    } catch (error) {
      console.error('Error getting learning progress:', error);
      return [];
    }
  }
}

/**
 * Daily Practice Service for managing daily tasks
 */
export class DailyPracticeService {
  static TASK_TYPES = {
    CODING: 'coding',
    MCQ: 'mcq',
    INTERVIEW: 'interview'
  };

  /**
   * Generate daily tasks for a user
   */
  static async generateDailyTasks(userId, date = new Date()) {
    try {
      date.setHours(0, 0, 0, 0);
      
      // Get user preferences
      const preferences = await prisma.userPreference.findUnique({
        where: { userId }
      });
      
      const codingCount = preferences?.dailyCodingProblems || 1;
      const mcqCount = preferences?.dailyMCQs || 5;
      const interviewCount = preferences?.dailyInterviewQuestions || 1;
      
      // Check if tasks already exist for today
      const existingTasks = await prisma.dailyTask.findMany({
        where: { date }
      });
      
      if (existingTasks.length > 0) {
        return existingTasks;
      }
      
      // Generate tasks (in a real implementation, these would come from a question bank)
      const tasks = [];
      
      // Add coding tasks
      for (let i = 0; i < codingCount; i++) {
        tasks.push({
          date,
          taskType: this.TASK_TYPES.CODING,
          title: `Daily Coding Challenge #${i + 1}`,
          difficulty: preferences?.preferredDifficulty || 'medium',
          pointsValue: 20
        });
      }
      
      // Add MCQ tasks
      for (let i = 0; i < mcqCount; i++) {
        tasks.push({
          date,
          taskType: this.TASK_TYPES.MCQ,
          title: `Core Subject MCQ #${i + 1}`,
          difficulty: preferences?.preferredDifficulty || 'medium',
          pointsValue: 5
        });
      }
      
      // Add interview tasks
      for (let i = 0; i < interviewCount; i++) {
        tasks.push({
          date,
          taskType: this.TASK_TYPES.INTERVIEW,
          title: `Interview Question #${i + 1}`,
          difficulty: preferences?.preferredDifficulty || 'medium',
          pointsValue: 15
        });
      }
      
      // Create all tasks
      const createdTasks = await Promise.all(
        tasks.map(task => prisma.dailyTask.create({ data: task }))
      );
      
      return createdTasks;
    } catch (error) {
      console.error('Error generating daily tasks:', error);
      return [];
    }
  }

  /**
   * Get today's tasks for a user
   */
  static async getTodayTasks(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Generate tasks if they don't exist
      await this.generateDailyTasks(userId, today);
      
      // Get tasks with user progress
      const tasks = await prisma.dailyTask.findMany({
        where: { date: today },
        include: {
          userTasks: {
            where: { userId }
          }
        },
        orderBy: { taskType: 'asc' }
      });
      
      return tasks.map(task => ({
        ...task,
        userTask: task.userTasks[0] || null,
        isCompleted: task.userTasks[0]?.status === 'completed'
      }));
    } catch (error) {
      console.error('Error getting today tasks:', error);
      return [];
    }
  }

  /**
   * Complete a daily task
   */
  static async completeDailyTask(userId, taskId, completionData = {}) {
    try {
      const { wasCorrect, accuracy, timeTaken, selfRating, notes } = completionData;
      
      // Get the daily task
      const dailyTask = await prisma.dailyTask.findUnique({
        where: { id: taskId }
      });
      
      if (!dailyTask) {
        throw new Error('Daily task not found');
      }
      
      // Upsert user daily task
      const userTask = await prisma.userDailyTask.upsert({
        where: {
          userId_dailyTaskId: {
            userId,
            dailyTaskId: taskId
          }
        },
        update: {
          status: 'completed',
          completedAt: new Date(),
          timeTaken,
          wasCorrect,
          accuracy,
          selfRating,
          notes,
          pointsEarned: wasCorrect ? dailyTask.pointsValue : Math.floor(dailyTask.pointsValue / 2)
        },
        create: {
          userId,
          dailyTaskId: taskId,
          status: 'completed',
          completedAt: new Date(),
          timeTaken,
          wasCorrect,
          accuracy,
          selfRating,
          notes,
          pointsEarned: wasCorrect ? dailyTask.pointsValue : Math.floor(dailyTask.pointsValue / 2)
        }
      });
      
      // Update user points
      await prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: userTask.pointsEarned },
          dailyChallengeCompleted: true
        }
      });
      
      // Update streak
      const gamificationService = (await import('./gamification')).GamificationService;
      await gamificationService.updateStreak(userId);
      
      return userTask;
    } catch (error) {
      console.error('Error completing daily task:', error);
      throw error;
    }
  }

  /**
   * Get daily task statistics
   */
  static async getDailyTaskStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      const userTasks = await prisma.userDailyTask.findMany({
        where: {
          userId,
          completedAt: { gte: startDate }
        },
        include: {
          dailyTask: true
        }
      });
      
      const stats = {
        totalCompleted: userTasks.length,
        byType: {},
        byDifficulty: {},
        averageAccuracy: 0,
        totalPoints: 0,
        completionRate: 0
      };
      
      // Get total tasks available
      const totalTasks = await prisma.dailyTask.count({
        where: {
          date: { gte: startDate }
        }
      });
      
      userTasks.forEach(ut => {
        // By type
        stats.byType[ut.dailyTask.taskType] = (stats.byType[ut.dailyTask.taskType] || 0) + 1;
        
        // By difficulty
        stats.byDifficulty[ut.dailyTask.difficulty] = (stats.byDifficulty[ut.dailyTask.difficulty] || 0) + 1;
        
        // Average accuracy
        if (ut.accuracy !== null && ut.accuracy !== undefined) {
          stats.averageAccuracy += ut.accuracy;
        }
        
        // Total points
        stats.totalPoints += ut.pointsEarned;
      });
      
      if (userTasks.length > 0) {
        stats.averageAccuracy = Math.round(stats.averageAccuracy / userTasks.length * 100) / 100;
      }
      
      if (totalTasks > 0) {
        stats.completionRate = Math.round(userTasks.length / totalTasks * 100) / 100;
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting daily task stats:', error);
      return null;
    }
  }
}

/**
 * Focus Timer Service for Pomodoro tracking
 */
export class FocusTimerService {
  static SESSION_TYPES = {
    POMODORO: 'pomodoro',
    SHORT_BREAK: 'short_break',
    LONG_BREAK: 'long_break',
    CUSTOM: 'custom'
  };

  static STATUS = {
    PLANNED: 'planned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    INTERRUPTED: 'interrupted'
  };

  /**
   * Start a focus session
   */
  static async startFocusSession(userId, sessionData) {
    try {
      const { sessionType, plannedDuration, taskDescription, relatedTopic } = sessionData;
      
      return await prisma.focusSession.create({
        data: {
          userId,
          sessionType: sessionType || this.SESSION_TYPES.POMODORO,
          plannedDuration: plannedDuration || 25,
          taskDescription,
          relatedTopic,
          status: this.STATUS.IN_PROGRESS,
          startedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error starting focus session:', error);
      throw error;
    }
  }

  /**
   * Complete a focus session
   */
  static async completeFocusSession(sessionId, userId, completionData = {}) {
    try {
      const { focusLevel, interruptions, distractionNotes } = completionData;
      
      const session = await prisma.focusSession.findUnique({
        where: { id: sessionId }
      });
      
      if (!session || session.userId !== userId) {
        throw new Error('Session not found');
      }
      
      const completedAt = new Date();
      const actualDuration = Math.round((completedAt - new Date(session.startedAt)) / (1000 * 60)); // in minutes
      
      return await prisma.focusSession.update({
        where: { id: sessionId },
        data: {
          status: this.STATUS.COMPLETED,
          actualDuration,
          completedAt,
          focusLevel,
          interruptions: interruptions || 0,
          distractionNotes
        }
      });
    } catch (error) {
      console.error('Error completing focus session:', error);
      throw error;
    }
  }

  /**
   * Interrupt a focus session
   */
  static async interruptFocusSession(sessionId, userId, reason) {
    try {
      return await prisma.focusSession.update({
        where: { 
          id: sessionId,
          userId
        },
        data: {
          status: this.STATUS.INTERRUPTED,
          completedAt: new Date(),
          distractionNotes: reason
        }
      });
    } catch (error) {
      console.error('Error interrupting focus session:', error);
      throw error;
    }
  }

  /**
   * Get focus session statistics
   */
  static async getFocusStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      const sessions = await prisma.focusSession.findMany({
        where: {
          userId,
          startedAt: { gte: startDate },
          status: this.STATUS.COMPLETED
        }
      });
      
      const stats = {
        totalSessions: sessions.length,
        totalFocusMinutes: 0,
        averageFocusMinutes: 0,
        averageFocusLevel: 0,
        totalInterruptions: 0,
        byType: {},
        dailyAverage: 0
      };
      
      sessions.forEach(session => {
        stats.totalFocusMinutes += session.actualDuration || 0;
        stats.totalInterruptions += session.interruptions || 0;
        
        if (session.focusLevel) {
          stats.averageFocusLevel += session.focusLevel;
        }
        
        stats.byType[session.sessionType] = (stats.byType[session.sessionType] || 0) + 1;
      });
      
      if (sessions.length > 0) {
        stats.averageFocusMinutes = Math.round(stats.totalFocusMinutes / sessions.length);
        stats.averageFocusLevel = Math.round(stats.averageFocusLevel / sessions.length * 100) / 100;
        stats.dailyAverage = Math.round(stats.totalFocusMinutes / days);
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting focus stats:', error);
      return null;
    }
  }

  /**
   * Get recent focus sessions
   */
  static async getRecentSessions(userId, limit = 10) {
    try {
      return await prisma.focusSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }
}

/**
 * Bookmark & Notes Service
 */
export class BookmarkService {
  /**
   * Add a bookmark
   */
  static async addBookmark(userId, bookmarkData) {
    try {
      const { contentType, contentId, contentTitle, contentMetadata, tags, notes, priority, collectionId } = bookmarkData;
      
      return await prisma.bookmark.upsert({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType,
            contentId
          }
        },
        update: {
          contentTitle,
          contentMetadata,
          tags,
          notes,
          priority,
          collectionId,
          updatedAt: new Date()
        },
        create: {
          userId,
          contentType,
          contentId,
          contentTitle,
          contentMetadata,
          tags: tags || [],
          notes,
          priority: priority || 'normal',
          collectionId
        }
      });
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  /**
   * Remove a bookmark
   */
  static async removeBookmark(userId, contentType, contentId) {
    try {
      return await prisma.bookmark.deleteMany({
        where: {
          userId,
          contentType,
          contentId
        }
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  /**
   * Get user bookmarks
   */
  static async getBookmarks(userId, options = {}) {
    try {
      const { contentType, collectionId, priority, limit = 50 } = options;
      
      const where = { userId };
      
      if (contentType) where.contentType = contentType;
      if (collectionId) where.collectionId = collectionId;
      if (priority) where.priority = priority;
      
      return await prisma.bookmark.findMany({
        where,
        include: {
          collection: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  /**
   * Create a bookmark collection
   */
  static async createCollection(userId, collectionData) {
    try {
      const { name, description, color, icon } = collectionData;
      
      return await prisma.bookmarkCollection.create({
        data: {
          userId,
          name,
          description,
          color: color || '#3B82F6',
          icon
        }
      });
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Get user collections
   */
  static async getCollections(userId) {
    try {
      return await prisma.bookmarkCollection.findMany({
        where: { userId },
        include: {
          _count: {
            select: { bookmarks: true }
          }
        },
        orderBy: { order: 'asc' }
      });
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  /**
   * Create a note
   */
  static async createNote(userId, noteData) {
    try {
      const { title, content, contentType, contentId, contentTitle, tags, noteType, isTemplate, isQuickRevision } = noteData;
      
      return await prisma.userNote.create({
        data: {
          userId,
          title,
          content,
          contentType,
          contentId,
          contentTitle,
          tags: tags || [],
          noteType: noteType || 'general',
          isTemplate: isTemplate || false,
          isQuickRevision: isQuickRevision || false
        }
      });
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Update a note
   */
  static async updateNote(noteId, userId, noteData) {
    try {
      return await prisma.userNote.update({
        where: { 
          id: noteId,
          userId
        },
        data: {
          ...noteData,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  /**
   * Get user notes
   */
  static async getNotes(userId, options = {}) {
    try {
      const { noteType, isQuickRevision, isTemplate, contentType, contentId, limit = 50 } = options;
      
      const where = { userId };
      
      if (noteType) where.noteType = noteType;
      if (isQuickRevision !== undefined) where.isQuickRevision = isQuickRevision;
      if (isTemplate !== undefined) where.isTemplate = isTemplate;
      if (contentType && contentId) {
        where.contentType = contentType;
        where.contentId = contentId;
      }
      
      return await prisma.userNote.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId, userId) {
    try {
      return await prisma.userNote.delete({
        where: {
          id: noteId,
          userId
        }
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Get quick revision notes
   */
  static async getQuickRevisionNotes(userId) {
    try {
      return await this.getNotes(userId, { isQuickRevision: true, limit: 100 });
    } catch (error) {
      console.error('Error getting quick revision notes:', error);
      return [];
    }
  }
}

/**
 * Activity Tracking Service
 */
export class ActivityTrackingService {
  static ACTIVITY_TYPES = {
    LOGIN: 'login',
    STUDY: 'study',
    COMPLETE_TASK: 'complete_task',
    START_SESSION: 'start_session',
    VIEW_CONTENT: 'view_content',
    COMPLETE_REVISION: 'complete_revision',
    BOOKMARK: 'bookmark',
    CREATE_NOTE: 'create_note'
  };

  /**
   * Log an activity
   */
  static async logActivity(userId, activityData) {
    try {
      const { activityType, category, description, contentType, contentId, contentTitle, metadata, duration } = activityData;
      
      return await prisma.activityLog.create({
        data: {
          userId,
          activityType,
          category,
          description,
          contentType,
          contentId,
          contentTitle,
          metadata,
          duration
        }
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Get activity history
   */
  static async getActivityHistory(userId, options = {}) {
    try {
      const { activityType, category, startDate, endDate, limit = 50 } = options;
      
      const where = { userId };
      
      if (activityType) where.activityType = activityType;
      if (category) where.category = category;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      
      return await prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting activity history:', error);
      return [];
    }
  }

  /**
   * Get activity heatmap data
   */
  static async getHeatmapData(userId, year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const activities = await prisma.activityLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          category: true
        }
      });
      
      // Group by date
      const heatmapData = {};
      activities.forEach(activity => {
        const dateStr = activity.createdAt.toISOString().split('T')[0];
        if (!heatmapData[dateStr]) {
          heatmapData[dateStr] = {
            date: dateStr,
            count: 0,
            categories: {}
          };
        }
        heatmapData[dateStr].count++;
        heatmapData[dateStr].categories[activity.category] = (heatmapData[dateStr].categories[activity.category] || 0) + 1;
      });
      
      return {
        year,
        month,
        days: Object.values(heatmapData),
        totalActivities: activities.length
      };
    } catch (error) {
      console.error('Error getting heatmap data:', error);
      return null;
    }
  }

  /**
   * Get weekly activity summary
   */
  static async getWeeklySummary(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const activities = await prisma.activityLog.findMany({
        where: {
          userId,
          createdAt: { gte: weekAgo }
        }
      });
      
      const summary = {
        totalActivities: activities.length,
        byCategory: {},
        byDay: {},
        mostActiveDay: null,
        mostActiveCategory: null,
        streakDays: 0
      };
      
      // Count by category and day
      activities.forEach(activity => {
        summary.byCategory[activity.category] = (summary.byCategory[activity.category] || 0) + 1;
        
        const dayStr = activity.createdAt.toISOString().split('T')[0];
        summary.byDay[dayStr] = (summary.byDay[dayStr] || 0) + 1;
      });
      
      // Find most active day
      let maxDayCount = 0;
      Object.entries(summary.byDay).forEach(([day, count]) => {
        if (count > maxDayCount) {
          maxDayCount = count;
          summary.mostActiveDay = day;
        }
      });
      
      // Find most active category
      let maxCategoryCount = 0;
      Object.entries(summary.byCategory).forEach(([category, count]) => {
        if (count > maxCategoryCount) {
          maxCategoryCount = count;
          summary.mostActiveCategory = category;
        }
      });
      
      // Calculate streak days (days with at least one activity)
      summary.streakDays = Object.keys(summary.byDay).length;
      
      return summary;
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      return null;
    }
  }
}

/**
 * Notification Service
 */
export class NotificationService {
  static NOTIFICATION_TYPES = {
    REVISION_DUE: 'revision_due',
    DAILY_TASK: 'daily_task',
    STREAK_WARNING: 'streak_warning',
    ACHIEVEMENT: 'achievement',
    REMINDER: 'reminder',
    SESSION_COMPLETE: 'session_complete'
  };

  /**
   * Create a notification
   */
  static async createNotification(userId, notificationData) {
    try {
      const { type, title, message, actionUrl, metadata } = notificationData;
      
      return await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          actionUrl,
          metadata
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      return await prisma.notification.update({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    try {
      return await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  static async getNotifications(userId, options = {}) {
    try {
      const { type, isRead, limit = 20 } = options;
      
      const where = { userId };
      
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead;
      
      return await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Dismiss a notification
   */
  static async dismissNotification(notificationId, userId) {
    try {
      return await prisma.notification.update({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isDismissed: true
        }
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      throw error;
    }
  }

  /**
   * Send revision due notifications
   */
  static async sendRevisionDueNotifications() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find users with due items
      const usersWithDueItems = await prisma.revisionItem.groupBy({
        by: ['userId'],
        where: {
          nextReviewDate: { lte: today },
          isArchived: false
        }
      });
      
      // Create notifications for each user
      for (const { userId } of usersWithDueItems) {
        const dueCount = await prisma.revisionItem.count({
          where: {
            userId,
            nextReviewDate: { lte: today },
            isArchived: false
          }
        });
        
        if (dueCount > 0) {
          await this.createNotification(userId, {
            type: this.NOTIFICATION_TYPES.REVISION_DUE,
            title: `${dueCount} Items Due for Revision`,
            message: `You have ${dueCount} item${dueCount > 1 ? 's' : ''} waiting for revision today. Keep your streak going!`,
            actionUrl: '/revision'
          });
        }
      }
    } catch (error) {
      console.error('Error sending revision due notifications:', error);
    }
  }

  /**
   * Send streak warning notifications
   */
  static async sendStreakWarnings() {
    try {
      // Find users with active streaks who haven't completed today
      const streaks = await prisma.userDailyStreak.findMany({
        where: {
          currentStreak: { gte: 3 }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              lastActive: true
            }
          }
        }
      });
      
      for (const streak of streaks) {
        const lastActive = streak.user.lastActive;
        if (!lastActive) continue;
        
        const hoursSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60);
        
        // If user hasn't been active for 20+ hours, send warning
        if (hoursSinceActive >= 20) {
          await this.createNotification(streak.userId, {
            type: this.NOTIFICATION_TYPES.STREAK_WARNING,
            title: `🔥 ${streak.currentStreak} Day Streak at Risk!`,
            message: `Don't let your ${streak.currentStreak}-day streak end! Complete a task today to keep it going.`,
            actionUrl: '/dashboard'
          });
        }
      }
    } catch (error) {
      console.error('Error sending streak warnings:', error);
    }
  }
}

/**
 * User Preference Service
 */
export class UserPreferenceService {
  /**
   * Get or create user preferences
   */
  static async getPreferences(userId) {
    try {
      let preferences = await prisma.userPreference.findUnique({
        where: { userId }
      });
      
      if (!preferences) {
        preferences = await prisma.userPreference.create({
          data: { userId }
        });
      }
      
      return preferences;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId, preferencesData) {
    try {
      return await prisma.userPreference.upsert({
        where: { userId },
        update: preferencesData,
        create: { userId, ...preferencesData }
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }
}
