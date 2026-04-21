import prisma from "@/lib/prisma";

/**
 * Gamification service for managing badges, achievements, and streaks
 */
export class GamificationService {
  // Badge definitions
  static BADGE_DEFINITIONS = {
    // Contest achievements
    FIRST_CONTEST: {
      name: "First Steps",
      description: "Participated in your first contest",
      type: "contest",
      category: "milestone",
      icon: "🎯",
      color: "#3B82F6",
      pointsValue: 50,
      requirements: { contestsParticipated: 1 }
    },
    CONTEST_VETERAN: {
      name: "Contest Veteran",
      description: "Participated in 10 contests",
      type: "contest",
      category: "milestone",
      icon: "🏅",
      color: "#8B5CF6",
      pointsValue: 200,
      requirements: { contestsParticipated: 10 }
    },
    CONTEST_MASTER: {
      name: "Contest Master",
      description: "Participated in 50 contests",
      type: "contest",
      category: "milestone",
      icon: "👑",
      color: "#F59E0B",
      pointsValue: 500,
      requirements: { contestsParticipated: 50 }
    },
    FIRST_WIN: {
      name: "Champion",
      description: "Won your first contest",
      type: "contest",
      category: "performance",
      icon: "🏆",
      color: "#FBBF24",
      pointsValue: 300,
      requirements: { contestsWon: 1 }
    },
    TOP_10: {
      name: "Top 10 Finisher",
      description: "Finished in top 10 of a contest",
      type: "contest",
      category: "performance",
      icon: "⭐",
      color: "#EC4899",
      pointsValue: 150,
      requirements: { bestRank: 10 }
    },
    
    // Speed achievements
    SPEED_DEMON: {
      name: "Speed Demon",
      description: "Solved a problem in under 5 minutes",
      type: "performance",
      category: "speed",
      icon: "⚡",
      color: "#EF4444",
      pointsValue: 100,
      requirements: { fastestSolveTime: 300000 } // 5 minutes in ms
    },
    LIGHTNING_FAST: {
      name: "Lightning Fast",
      description: "Solved a problem in under 2 minutes",
      type: "performance",
      category: "speed",
      icon: "🌩️",
      color: "#F59E0B",
      pointsValue: 250,
      requirements: { fastestSolveTime: 120000 } // 2 minutes in ms
    },
    
    // Accuracy achievements
    PERFECT_ACCURACY: {
      name: "Perfect Accuracy",
      description: "Achieved 100% accuracy in a contest (min 3 problems)",
      type: "performance",
      category: "accuracy",
      icon: "🎯",
      color: "#10B981",
      pointsValue: 200,
      requirements: { accuracy: 1.0, minProblems: 3 }
    },
    SHARPSHOOTER: {
      name: "Sharpshooter",
      description: "Maintained 90%+ accuracy across 5 contests",
      type: "performance",
      category: "accuracy",
      icon: "🏹",
      color: "#3B82F6",
      pointsValue: 300,
      requirements: { averageAccuracy: 0.9, minContests: 5 }
    },
    
    // Streak achievements
    WEEK_WARRIOR: {
      name: "Week Warrior",
      description: "Maintained a 7-day streak",
      type: "streak",
      category: "consistency",
      icon: "🔥",
      color: "#EF4444",
      pointsValue: 100,
      requirements: { streak: 7 }
    },
    MONTH_MASTER: {
      name: "Month Master",
      description: "Maintained a 30-day streak",
      type: "streak",
      category: "consistency",
      icon: "💎",
      color: "#8B5CF6",
      pointsValue: 500,
      requirements: { streak: 30 }
    },
    UNSTOPPABLE: {
      name: "Unstoppable",
      description: "Maintained a 100-day streak",
      type: "streak",
      category: "consistency",
      icon: "🌟",
      color: "#FBBF24",
      pointsValue: 1000,
      requirements: { streak: 100 }
    },
    
    // Rating achievements
    RISING_STAR: {
      name: "Rising Star",
      description: "Reached 1400+ rating",
      type: "performance",
      category: "milestone",
      icon: "🌟",
      color: "#3B82F6",
      pointsValue: 200,
      requirements: { rating: 1400 }
    },
    EXPERT_CODER: {
      name: "Expert Coder",
      description: "Reached 1600+ rating",
      type: "performance",
      category: "milestone",
      icon: "💪",
      color: "#8B5CF6",
      pointsValue: 300,
      requirements: { rating: 1600 }
    },
    MASTER_CODER: {
      name: "Master Coder",
      description: "Reached 2100+ rating",
      type: "performance",
      category: "milestone",
      icon: "🎖️",
      color: "#F59E0B",
      pointsValue: 500,
      requirements: { rating: 2100 }
    },
    GRANDMASTER: {
      name: "Grandmaster",
      description: "Reached 2400+ rating",
      type: "performance",
      category: "milestone",
      icon: "👑",
      color: "#FBBF24",
      pointsValue: 1000,
      requirements: { rating: 2400 }
    },
    
    // Problem solving achievements
    PROBLEM_SOLVER_10: {
      name: "Problem Solver",
      description: "Solved 10 problems in contests",
      type: "performance",
      category: "problemSolving",
      icon: "🧩",
      color: "#3B82F6",
      pointsValue: 100,
      requirements: { totalProblemsSolved: 10 }
    },
    PROBLEM_SOLVER_100: {
      name: "Dedicated Solver",
      description: "Solved 100 problems in contests",
      type: "performance",
      category: "problemSolving",
      icon: "🧠",
      color: "#8B5CF6",
      pointsValue: 300,
      requirements: { totalProblemsSolved: 100 }
    },
    PROBLEM_SOLVER_500: {
      name: "Problem Master",
      description: "Solved 500 problems in contests",
      type: "performance",
      category: "problemSolving",
      icon: "🏅",
      color: "#F59E0B",
      pointsValue: 500,
      requirements: { totalProblemsSolved: 500 }
    },
    HARD_PROBLEM_SOLVER: {
      name: "Hard Problem Solver",
      description: "Solved a hard difficulty problem",
      type: "performance",
      category: "problemSolving",
      icon: "💀",
      color: "#EF4444",
      pointsValue: 200,
      requirements: { hardProblemsSolved: 1 }
    }
  };

  /**
   * Initialize achievement definitions in database
   */
  static async initializeAchievements() {
    try {
      for (const [key, definition] of Object.entries(this.BADGE_DEFINITIONS)) {
        await prisma.achievement.upsert({
          where: { id: key },
          update: definition,
          create: {
            id: key,
            ...definition
          }
        });
      }
      console.log("Achievements initialized successfully");
    } catch (error) {
      console.error("Error initializing achievements:", error);
    }
  }

  /**
   * Check and award badges for a user after contest completion
   */
  static async checkAndAwardBadges(userId, contestData) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          achievements: true
        }
      });

      if (!user) return [];

      const awardedBadges = [];
      const earnedAchievementIds = user.achievements.map(a => a.achievementId);

      // Check each achievement
      for (const [achievementId, definition] of Object.entries(this.BADGE_DEFINITIONS)) {
        if (earnedAchievementIds.includes(achievementId)) continue;

        let shouldAward = false;
        const requirements = definition.requirements;

        // Contest participation achievements
        if (requirements.contestsParticipated && user.contestsParticipated >= requirements.contestsParticipated) {
          shouldAward = true;
        }

        // Contest wins
        if (requirements.contestsWon && user.contestsWon >= requirements.contestsWon) {
          shouldAward = true;
        }

        // Rating achievements
        if (requirements.rating && user.contestRating >= requirements.rating) {
          shouldAward = true;
        }

        // Total problems solved
        if (requirements.totalProblemsSolved && user.totalProblemsSolved >= requirements.totalProblemsSolved) {
          shouldAward = true;
        }

        // Streak achievements
        if (requirements.streak && user.longestStreak >= requirements.streak) {
          shouldAward = true;
        }

        // Contest-specific achievements
        if (contestData) {
          // First win
          if (requirements.bestRank && contestData.rank <= requirements.bestRank) {
            shouldAward = true;
          }

          // Perfect accuracy
          if (requirements.accuracy && contestData.accuracy >= requirements.accuracy) {
            if (!requirements.minProblems || contestData.problemsSolved >= requirements.minProblems) {
              shouldAward = true;
            }
          }

          // Speed achievements
          if (requirements.fastestSolveTime && contestData.fastestSolveTime) {
            if (contestData.fastestSolveTime <= requirements.fastestSolveTime) {
              shouldAward = true;
            }
          }
        }

        if (shouldAward) {
          // Award the badge
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId,
              context: {
                awardedAt: new Date().toISOString(),
                reason: definition.description
              }
            }
          });

          // Update user points
          await prisma.user.update({
            where: { id: userId },
            data: {
              points: { increment: definition.pointsValue }
            }
          });

          awardedBadges.push({
            id: achievementId,
            ...definition,
            pointsEarned: definition.pointsValue
          });
        }
      }

      return awardedBadges;
    } catch (error) {
      console.error("Error checking and awarding badges:", error);
      return [];
    }
  }

  /**
   * Update user streak
   */
  static async updateStreak(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let streak = await prisma.userDailyStreak.findUnique({
        where: { userId }
      });

      if (!streak) {
        // Create new streak
        streak = await prisma.userDailyStreak.create({
          data: {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastCompletedDate: today,
            totalCompleted: 1
          }
        });
      } else {
        const lastDate = new Date(streak.lastCompletedDate);
        lastDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Already completed today
          return streak;
        } else if (daysDiff === 1) {
          // Continue streak
          streak = await prisma.userDailyStreak.update({
            where: { userId },
            data: {
              currentStreak: { increment: 1 },
              longestStreak: { increment: 1 },
              lastCompletedDate: today,
              totalCompleted: { increment: 1 }
            }
          });
        } else {
          // Streak broken
          streak = await prisma.userDailyStreak.update({
            where: { userId },
            data: {
              currentStreak: 1,
              lastCompletedDate: today,
              totalCompleted: { increment: 1 }
            }
          });
        }
      }

      // Update user streak
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak
        }
      });

      return streak;
    } catch (error) {
      console.error("Error updating streak:", error);
      return null;
    }
  }

  /**
   * Get user's achievements
   */
  static async getUserAchievements(userId) {
    try {
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true
        },
        orderBy: {
          earnedAt: 'desc'
        }
      });

      return userAchievements.map(ua => ({
        ...ua.achievement,
        earnedAt: ua.earnedAt,
        context: ua.context
      }));
    } catch (error) {
      console.error("Error getting user achievements:", error);
      return [];
    }
  }

  /**
   * Get available achievements (not yet earned)
   */
  static async getAvailableAchievements(userId) {
    try {
      const earnedIds = await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true }
      });

      const earnedIdSet = new Set(earnedIds.map(e => e.achievementId));

      return Object.entries(this.BADGE_DEFINITIONS)
        .filter(([id]) => !earnedIdSet.has(id))
        .map(([id, definition]) => ({
          id,
          ...definition
        }));
    } catch (error) {
      console.error("Error getting available achievements:", error);
      return [];
    }
  }

  /**
   * Get user's progress towards achievements
   */
  static async getAchievementProgress(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return [];

      const earnedIds = await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true }
      });

      const earnedIdSet = new Set(earnedIds.map(e => e.achievementId));

      const progress = [];

      for (const [id, definition] of Object.entries(this.BADGE_DEFINITIONS)) {
        const earned = earnedIdSet.has(id);
        let current = 0;
        let required = 0;

        const requirements = definition.requirements;

        if (requirements.contestsParticipated) {
          current = user.contestsParticipated;
          required = requirements.contestsParticipated;
        } else if (requirements.contestsWon) {
          current = user.contestsWon;
          required = requirements.contestsWon;
        } else if (requirements.rating) {
          current = user.contestRating;
          required = requirements.rating;
        } else if (requirements.totalProblemsSolved) {
          current = user.totalProblemsSolved;
          required = requirements.totalProblemsSolved;
        } else if (requirements.streak) {
          current = user.longestStreak;
          required = requirements.streak;
        }

        progress.push({
          id,
          ...definition,
          earned,
          current,
          required,
          percentage: required > 0 ? Math.min(100, (current / required) * 100) : 0
        });
      }

      return progress;
    } catch (error) {
      console.error("Error getting achievement progress:", error);
      return [];
    }
  }
}
