/**
 * ELO RATING CALCULATOR
 * 
 * Implements Elo rating system for peer-to-peer coding battles:
 * 1. Calculates rating change based on performance
 * 2. Handles multiplayer ratings
 * 3. Adjusts for tier and skill level
 * 4. Prevents rating inflation/deflation
 */

import prisma from "./prisma";

export class RatingCalculator {
  // Elo constants
  BASE_K_FACTOR = 32; // Rating change multiplier
  MAX_K_FACTOR = 48; // For lower-rated players
  MIN_K_FACTOR = 16; // For higher-rated players
  RATING_TIERS = {
    bronze: { min: 0, max: 1400, kModifier: 1.2 },
    silver: { min: 1400, max: 1700, kModifier: 1.0 },
    gold: { min: 1700, max: 2000, kModifier: 0.9 },
    platinum: { min: 2000, max: 2400, kModifier: 0.8 },
    diamond: { min: 2400, max: Infinity, kModifier: 0.7 },
  };

  /**
   * Calculate rating change for a participant
   */
  calculateRatingChange(
    ratingBefore,
    rank,
    totalParticipants,
    performanceScore = 0
  ) {
    try {
      // Calculate expected performance
      const expectedPerformance = this.calculateExpectedPerformance(
        rank,
        totalParticipants
      );

      // Calculate actual performance
      const actualPerformance = this.calculateActualPerformance(
        rank,
        totalParticipants,
        performanceScore
      );

      // Get K-factor based on rating
      const kFactor = this.getKFactor(ratingBefore);

      // Calculate rating change
      const ratingChange = Math.round(
        kFactor * (actualPerformance - expectedPerformance)
      );

      // Apply bounds to prevent extreme changes
      const boundedChange = Math.max(-100, Math.min(100, ratingChange));

      return boundedChange;
    } catch (error) {
      console.error("Error calculating rating change:", error);
      return 0;
    }
  }

  /**
   * Calculate expected performance (0-1)
   * Lower rank (1st place) = better performance expected
   */
  calculateExpectedPerformance(rank, totalParticipants) {
    // Linear scaling: rank 1 = 1.0, last rank = 0.0
    return 1 - (rank - 1) / Math.max(1, totalParticipants - 1);
  }

  /**
   * Calculate actual performance (0-1)
   * Considers rank and time taken
   */
  calculateActualPerformance(rank, totalParticipants, performanceScore = 0) {
    // Base performance on rank
    const rankPerformance = 1 - (rank - 1) / Math.max(1, totalParticipants - 1);

    // Add bonus for exceptional performance (very high score)
    const scoreBonus = Math.min(0.2, performanceScore / 100);

    // Cap at 1.0
    return Math.min(1, rankPerformance + scoreBonus * 0.1);
  }

  /**
   * Get K-factor based on rating
   * Higher K-factor for lower-rated players (easier to climb)
   * Lower K-factor for higher-rated players (harder changes)
   */
  getKFactor(rating) {
    if (rating < 1400) {
      return this.MAX_K_FACTOR; // 48
    } else if (rating < 1700) {
      return this.BASE_K_FACTOR; // 32
    } else if (rating < 2000) {
      return Math.round(this.BASE_K_FACTOR * 0.9); // 28
    } else if (rating < 2400) {
      return Math.round(this.BASE_K_FACTOR * 0.75); // 24
    } else {
      return this.MIN_K_FACTOR; // 16
    }
  }

  /**
   * Calculate tier based on rating
   */
  getTier(rating) {
    if (rating < 1400) return "bronze";
    if (rating < 1700) return "silver";
    if (rating < 2000) return "gold";
    if (rating < 2400) return "platinum";
    return "diamond";
  }

  /**
   * Calculate level within tier
   */
  getLevelInTier(rating) {
    const tier = this.getTier(rating);
    const tierInfo = this.RATING_TIERS[tier];
    const rangeSize = tierInfo.max - tierInfo.min;
    const offset = rating - tierInfo.min;
    const level = Math.floor((offset / rangeSize) * 5) + 1; // 1-5 levels per tier
    return Math.min(5, Math.max(1, level));
  }

  /**
   * Calculate overall level (1-50)
   */
  getOverallLevel(rating) {
    const baseLevels = {
      bronze: 0,
      silver: 5,
      gold: 10,
      platinum: 15,
      diamond: 20,
    };

    const tier = this.getTier(rating);
    const baseLevel = baseLevels[tier];
    const levelInTier = this.getLevelInTier(rating);

    return baseLevel + levelInTier;
  }

  /**
   * Predict new rating after battle
   */
  predictRating(
    currentRating,
    rank,
    totalParticipants,
    performanceScore = 0
  ) {
    const ratingChange = this.calculateRatingChange(
      currentRating,
      rank,
      totalParticipants,
      performanceScore
    );

    const newRating = currentRating + ratingChange;

    return {
      currentRating,
      ratingChange,
      newRating,
      newTier: this.getTier(newRating),
      newLevel: this.getOverallLevel(newRating),
    };
  }

  /**
   * Calculate win probability based on rating difference
   * Used for difficulty matching
   */
  calculateWinProbability(rating1, rating2) {
    const ratingDiff = rating2 - rating1;
    const probability = 1 / (1 + Math.pow(10, ratingDiff / 400));
    return Math.round(probability * 100); // Return as percentage
  }

  /**
   * Get rating information for user
   */
  async getUserRatingInfo(userId) {
    try {
      const userRating = await prisma.userCodingRating.findUnique({
        where: { userId },
      });

      if (!userRating) {
        return {
          userId,
          rating: 1200,
          tier: "bronze",
          level: 1,
          battlesParticipated: 0,
          winRate: 0,
          winStreak: 0,
        };
      }

      const winRate =
        userRating.battlesParticipated > 0
          ? (userRating.battlesWon / userRating.battlesParticipated) * 100
          : 0;

      return {
        userId,
        rating: userRating.rating,
        ratingChange: userRating.ratingChange,
        tier: this.getTier(userRating.rating),
        level: this.getOverallLevel(userRating.rating),
        battlesParticipated: userRating.battlesParticipated,
        battlesWon: userRating.battlesWon,
        battlesDraw: userRating.battlesDraw,
        battlesLost: userRating.battlesLost,
        winRate: Math.round(winRate * 100) / 100,
        winStreak: userRating.currentWinStreak,
        longestWinStreak: userRating.longestWinStreak,
        bestRating: userRating.bestRating,
        totalPointsEarned: userRating.totalPointsEarned,
      };
    } catch (error) {
      console.error("Error getting rating info:", error);
      return null;
    }
  }

  /**
   * Create or initialize rating for new user
   */
  async initializeRating(userId, userName = "Player") {
    try {
      const existing = await prisma.userCodingRating.findUnique({
        where: { userId },
      });

      if (existing) {
        return existing;
      }

      const userRating = await prisma.userCodingRating.create({
        data: {
          userId,
          rating: 1200,
          tier: "bronze",
          level: 1,
          easyRating: 1200,
          mediumRating: 1200,
          hardRating: 1200,
        },
      });

      return userRating;
    } catch (error) {
      console.error("Error initializing rating:", error);
      return null;
    }
  }

  /**
   * Decay rating if user is inactive (optional)
   */
  async decayRatingIfInactive(userId, daysSinceLastBattle = 30) {
    try {
      const userRating = await prisma.userCodingRating.findUnique({
        where: { userId },
      });

      if (!userRating || !userRating.lastBattleAt) {
        return null;
      }

      const daysPassed = Math.floor(
        (new Date() - userRating.lastBattleAt) / (1000 * 60 * 60 * 24)
      );

      if (daysPassed >= daysSinceLastBattle) {
        // Decay rating by 2% per month of inactivity
        const monthsInactive = Math.floor(daysPassed / 30);
        const decayPercent = 0.02 * monthsInactive;
        const decayAmount = Math.floor(userRating.rating * decayPercent);

        const newRating = Math.max(1000, userRating.rating - decayAmount);

        await prisma.userCodingRating.update({
          where: { userId },
          data: {
            rating: newRating,
            tier: this.getTier(newRating),
          },
        });

        return newRating;
      }

      return userRating.rating;
    } catch (error) {
      console.error("Error decaying rating:", error);
      return null;
    }
  }

  /**
   * Get leaderboard rankings
   */
  async getLeaderboard(limit = 100, tier = null) {
    try {
      const where = tier
        ? {
          rating: {
            gte: this.RATING_TIERS[tier].min,
            lt: this.RATING_TIERS[tier].max,
          },
        }
        : {};

      const leaderboard = await prisma.userCodingRating.findMany({
        where,
        include: {
          user: {
            select: { name: true, image: true, email: true },
          },
        },
        orderBy: { rating: "desc" },
        take: limit,
      });

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        userName: entry.user.name,
        userImage: entry.user.image,
        rating: entry.rating,
        tier: this.getTier(entry.rating),
        level: this.getOverallLevel(entry.rating),
        battlesWon: entry.battlesWon,
        battlesParticipated: entry.battlesParticipated,
        winRate:
          entry.battlesParticipated > 0
            ? (entry.battlesWon / entry.battlesParticipated) * 100
            : 0,
      }));
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }

  /**
   * Match opponents with similar ratings for fair competition
   */
  async findMatchedOpponents(userId, maxRatingDiff = 200) {
    try {
      const userRating = await prisma.userCodingRating.findUnique({
        where: { userId },
      });

      if (!userRating) {
        return [];
      }

      const opponents = await prisma.userCodingRating.findMany({
        where: {
          userId: { not: userId },
          rating: {
            gte: Math.max(1000, userRating.rating - maxRatingDiff),
            lte: userRating.rating + maxRatingDiff,
          },
        },
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: {
          rating: "desc",
        },
        take: 10,
      });

      return opponents;
    } catch (error) {
      console.error("Error finding matched opponents:", error);
      return [];
    }
  }
}

export default RatingCalculator;
