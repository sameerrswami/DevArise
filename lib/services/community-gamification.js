import prisma from "@/lib/prisma";

/**
 * Community Gamification Service
 * Manages reputation, badges, levels, and expertise tracking for the community system
 */
export class CommunityGamificationService {
  // Reputation levels configuration
  static LEVELS = {
    Beginner: { minPoints: 0, maxPoints: 99, color: "#6B7280" },
    Contributor: { minPoints: 100, maxPoints: 499, color: "#3B82F6" },
    Expert: { minPoints: 500, maxPoints: 1499, color: "#8B5CF6" },
    Mentor: { minPoints: 1500, maxPoints: 4999, color: "#F59E0B" },
    Legend: { minPoints: 5000, maxPoints: Infinity, color: "#FBBF24" }
  };

  // Badge definitions for community contributions
  static COMMUNITY_BADGES = {
    FIRST_QUESTION: {
      name: "First Question",
      description: "Asked your first question",
      icon: "❓",
      color: "#3B82F6",
      pointsRequired: 0,
      category: "milestone"
    },
    FIRST_ANSWER: {
      name: "First Answer",
      description: "Provided your first answer",
      icon: "✍️",
      color: "#3B82F6",
      pointsRequired: 0,
      category: "milestone"
    },
    FIRST_EXPERIENCE: {
      name: "Experience Sharer",
      description: "Shared your first interview experience",
      icon: "📝",
      color: "#3B82F6",
      pointsRequired: 0,
      category: "milestone"
    },
    HELPFUL_5: {
      name: "Helpful Hand",
      description: "Received 5 upvotes on your answers",
      icon: "🤝",
      color: "#10B981",
      pointsRequired: 0,
      category: "helper"
    },
    HELPFUL_25: {
      name: "Community Helper",
      description: "Received 25 upvotes on your answers",
      icon: "🌟",
      color: "#10B981",
      pointsRequired: 0,
      category: "helper"
    },
    HELPFUL_100: {
      name: "Helpful Hero",
      description: "Received 100 upvotes on your answers",
      icon: "🦸",
      color: "#10B981",
      pointsRequired: 0,
      category: "helper"
    },
    MENTOR: {
      name: "Community Mentor",
      description: "Reached Mentor level in the community",
      icon: "🎓",
      color: "#F59E0B",
      pointsRequired: 1500,
      category: "milestone"
    },
    LEGEND: {
      name: "Community Legend",
      description: "Reached Legend level in the community",
      icon: "👑",
      color: "#FBBF24",
      pointsRequired: 5000,
      category: "milestone"
    },
    MOCK_INTERVIEWER: {
      name: "Mock Mentor",
      description: "Conducted 5 mock interviews",
      icon: "🎭",
      color: "#EC4899",
      pointsRequired: 0,
      category: "helper"
    },
    EXPERIENCE_VETERAN: {
      name: "Experience Veteran",
      description: "Shared 5 interview experiences",
      icon: "📚",
      color: "#EC4899",
      pointsRequired: 0,
      category: "contribution"
    }
  };

  /**
   * Initialize community badge definitions in database
   */
  static async initializeBadges() {
    try {
      for (const [key, definition] of Object.entries(this.COMMUNITY_BADGES)) {
        await prisma.communityBadge.upsert({
          where: { name: definition.name },
          update: definition,
          create: {
            id: key,
            ...definition
          }
        });
      }
      console.log("Community badges initialized successfully");
    } catch (error) {
      console.error("Error initializing community badges:", error);
    }
  }

  /**
   * Get or create user reputation
   */
  static async getOrCreateReputation(userId) {
    try {
      let reputation = await prisma.reputation.findUnique({
        where: { userId }
      });

      if (!reputation) {
        reputation = await prisma.reputation.create({
          data: {
            userId,
            totalPoints: 0,
            level: "Beginner",
            rank: 0
          }
        });
      }

      return reputation;
    } catch (error) {
      console.error("Error getting/creating reputation:", error);
      return null;
    }
  }

  /**
   * Update user reputation and level
   */
  static async updateReputation(userId, points, reason, sourceType, sourceId) {
    try {
      const reputation = await this.getOrCreateReputation(userId);
      if (!reputation) return null;

      // Update total points
      const updatedReputation = await prisma.reputation.update({
        where: { userId },
        data: {
          totalPoints: { increment: points }
        }
      });

      // Record history
      await prisma.reputationHistory.create({
        data: {
          userId,
          points,
          reason,
          sourceType,
          sourceId
        }
      });

      // Update level based on new total points
      const newLevel = this.getLevelForPoints(updatedReputation.totalPoints);
      if (newLevel !== updatedReputation.level) {
        await prisma.reputation.update({
          where: { userId },
          data: { level: newLevel }
        });

        // Award level-up badge
        await this.awardLevelBadge(userId, newLevel);
      }

      // Check for badge achievements
      await this.checkAndAwardBadges(userId, updatedReputation.totalPoints);

      return await this.getOrCreateReputation(userId);
    } catch (error) {
      console.error("Error updating reputation:", error);
      return null;
    }
  }

  /**
   * Get level for given points
   */
  static getLevelForPoints(points) {
    for (const [level, config] of Object.entries(this.LEVELS)) {
      if (points >= config.minPoints && points <= config.maxPoints) {
        return level;
      }
    }
    return "Beginner";
  }

  /**
   * Award badge for reaching a level
   */
  static async awardLevelBadge(userId, level) {
    try {
      if (level === "Mentor") {
        await this.awardBadge(userId, "MENTOR");
      } else if (level === "Legend") {
        await this.awardBadge(userId, "LEGEND");
      }
    } catch (error) {
      console.error("Error awarding level badge:", error);
    }
  }

  /**
   * Award a specific badge to a user
   */
  static async awardBadge(userId, badgeKey) {
    try {
      const badge = this.COMMUNITY_BADGES[badgeKey];
      if (!badge) return false;

      // Check if user already has this badge
      const existing = await prisma.userCommunityBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badgeKey
          }
        }
      });

      if (existing) return false;

      // Award the badge
      await prisma.userCommunityBadge.create({
        data: {
          userId,
          badgeId: badgeKey,
          context: `Earned ${badge.name} badge`
        }
      });

      // Also add to the main Badge system for display
      await prisma.badge.create({
        data: {
          userId,
          title: badge.name,
          description: badge.description,
          imageUrl: null,
          type: "achievement",
          rarity: "common",
          pointsValue: badge.pointsRequired || 10,
          icon: badge.icon
        }
      });

      return true;
    } catch (error) {
      console.error("Error awarding badge:", error);
      return false;
    }
  }

  /**
   * Check and award badges based on user activity
   */
  static async checkAndAwardBadges(userId, totalPoints) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          communityBadges: true,
          answers: { where: { isAccepted: true } },
          interviewExperiences: true,
          conductedMockInterviews: { where: { status: "completed" } }
        }
      });

      if (!user) return;

      const earnedBadgeIds = user.communityBadges.map(b => b.badgeId);
      const newBadges = [];

      // Check for first question badge
      const questionCount = await prisma.question.count({
        where: { userId }
      });
      if (questionCount >= 1 && !earnedBadgeIds.includes("FIRST_QUESTION")) {
        if (await this.awardBadge(userId, "FIRST_QUESTION")) {
          newBadges.push("FIRST_QUESTION");
        }
      }

      // Check for first answer badge
      if (user.answers.length >= 1 && !earnedBadgeIds.includes("FIRST_ANSWER")) {
        if (await this.awardBadge(userId, "FIRST_ANSWER")) {
          newBadges.push("FIRST_ANSWER");
        }
      }

      // Check for first experience badge
      if (user.interviewExperiences.length >= 1 && !earnedBadgeIds.includes("FIRST_EXPERIENCE")) {
        if (await this.awardBadge(userId, "FIRST_EXPERIENCE")) {
          newBadges.push("FIRST_EXPERIENCE");
        }
      }

      // Check for helpful badges based on accepted answers
      const acceptedAnswers = user.answers.length;
      if (acceptedAnswers >= 5 && !earnedBadgeIds.includes("HELPFUL_5")) {
        if (await this.awardBadge(userId, "HELPFUL_5")) {
          newBadges.push("HELPFUL_5");
        }
      }
      if (acceptedAnswers >= 25 && !earnedBadgeIds.includes("HELPFUL_25")) {
        if (await this.awardBadge(userId, "HELPFUL_25")) {
          newBadges.push("HELPFUL_25");
        }
      }
      if (acceptedAnswers >= 100 && !earnedBadgeIds.includes("HELPFUL_100")) {
        if (await this.awardBadge(userId, "HELPFUL_100")) {
          newBadges.push("HELPFUL_100");
        }
      }

      // Check for mock interviewer badge
      if (user.conductedMockInterviews.length >= 5 && !earnedBadgeIds.includes("MOCK_INTERVIEWER")) {
        if (await this.awardBadge(userId, "MOCK_INTERVIEWER")) {
          newBadges.push("MOCK_INTERVIEWER");
        }
      }

      // Check for experience veteran badge
      if (user.interviewExperiences.length >= 5 && !earnedBadgeIds.includes("EXPERIENCE_VETERAN")) {
        if (await this.awardBadge(userId, "EXPERIENCE_VETERAN")) {
          newBadges.push("EXPERIENCE_VETERAN");
        }
      }

      return newBadges;
    } catch (error) {
      console.error("Error checking and awarding badges:", error);
    }
  }

  /**
   * Get user's community profile with stats
   */
  static async getUserCommunityProfile(userId) {
    try {
      const [reputation, badges, questions, answers, experiences, mockInterviews] = await Promise.all([
        this.getOrCreateReputation(userId),
        prisma.userCommunityBadge.findMany({
          where: { userId },
          include: { badge: true }
        }),
        prisma.question.count({ where: { userId } }),
        prisma.answer.count({ where: { userId } }),
        prisma.interviewExperience.count({ where: { userId } }),
        prisma.peerMockInterview.count({
          where: {
            OR: [{ interviewerId: userId }, { intervieweeId: userId }],
            status: "completed"
          }
        })
      ]);

      return {
        reputation,
        badges: badges.map(b => b.badge),
        stats: {
          questions,
          answers,
          experiences,
          mockInterviews
        }
      };
    } catch (error) {
      console.error("Error getting user community profile:", error);
      return null;
    }
  }

  /**
   * Get community leaderboard
   */
  static async getLeaderboard(limit = 50) {
    try {
      const leaders = await prisma.reputation.findMany({
        take: limit,
        orderBy: { totalPoints: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              preparationLevel: true
            }
          }
        }
      });

      return leaders.map((leader, index) => ({
        rank: index + 1,
        user: leader.user,
        points: leader.totalPoints,
        level: leader.level
      }));
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }
}