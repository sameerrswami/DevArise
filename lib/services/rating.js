import prisma from "@/lib/prisma";

/**
 * Calculate Elo rating change for contest participants
 * Based on the TrueSkill algorithm adapted for competitive programming
 */
export class RatingCalculator {
  static K_FACTOR = 32; // Maximum rating change per contest
  static BASE_RATING = 1200;
  static MIN_RATING = 1000;
  static MAX_RATING = 3000;

  /**
   * Calculate expected score for a player against opponents
   * @param {number} playerRating - Player's current rating
   * @param {number[]} opponentRatings - Array of opponent ratings
   * @returns {number} Expected score (0 to 1)
   */
  static calculateExpectedScore(playerRating, opponentRatings) {
    let totalExpected = 0;
    
    for (const opponentRating of opponentRatings) {
      const ratingDiff = opponentRating - playerRating;
      const expected = 1 / (1 + Math.pow(10, ratingDiff / 400));
      totalExpected += expected;
    }
    
    return totalExpected / opponentRatings.length;
  }

  /**
   * Calculate performance rating based on contest results
   * @param {number} rank - Player's rank (1-based)
   * @param {number} totalParticipants - Total number of participants
   * @param {number} averageRating - Average rating of all participants
   * @returns {number} Performance rating
   */
  static calculatePerformanceRating(rank, totalParticipants, averageRating) {
    // Win rate = (totalParticipants - rank + 1) / totalParticipants
    const winRate = (totalParticipants - rank + 1) / totalParticipants;
    
    // Performance rating formula
    // If winRate = 1.0, performance = very high
    // If winRate = 0.5, performance = averageRating
    // If winRate = 0.0, performance = very low
    
    if (winRate === 1.0) {
      return averageRating + 400; // Perfect performance
    } else if (winRate === 0.0) {
      return averageRating - 400; // Zero performance
    }
    
    // Standard Elo performance calculation
    const performance = averageRating + 400 * Math.log10(1 / winRate - 1);
    return Math.max(this.MIN_RATING, Math.min(this.MAX_RATING, performance));
  }

  /**
   * Calculate rating change for a contest
   * @param {Object} params - Calculation parameters
   * @param {number} params.oldRating - Player's rating before contest
   * @param {number} params.rank - Player's rank (1-based)
   * @param {number} params.totalParticipants - Total participants
   * @param {number} params.averageRating - Average rating of participants
   * @param {number} params.problemsSolved - Number of problems solved
   * @param {number} params.totalProblems - Total problems in contest
   * @param {number} params.timeTaken - Time taken in milliseconds
   * @param {number} params.maxTime - Maximum contest time in milliseconds
   * @returns {Object} Rating calculation result
   */
  static calculateRatingChange({
    oldRating,
    rank,
    totalParticipants,
    averageRating,
    problemsSolved,
    totalProblems,
    timeTaken,
    maxTime
  }) {
    // Calculate expected score
    const expectedScore = this.calculateExpectedScore(oldRating, [averageRating]);
    
    // Calculate actual score (normalized rank)
    const actualScore = (totalParticipants - rank + 1) / totalParticipants;
    
    // Base rating change
    let ratingChange = this.K_FACTOR * (actualScore - expectedScore);
    
    // Performance bonus/penalty based on problems solved
    const problemSolvingFactor = problemsSolved / totalProblems;
    const performanceBonus = (problemSolvingFactor - 0.5) * 20; // +/- 20 points
    
    // Time bonus (faster solvers get bonus)
    const timeBonus = maxTime > 0 ? (1 - timeTaken / maxTime) * 10 : 0;
    
    // Apply bonuses
    ratingChange += performanceBonus + timeBonus;
    
    // Adjust K-factor based on rating (lower K for higher ratings)
    const adjustedK = Math.max(16, this.K_FACTOR * (1 - (oldRating - this.BASE_RATING) / 1000));
    ratingChange = ratingChange * (adjustedK / this.K_FACTOR);
    
    // Calculate new rating
    let newRating = oldRating + ratingChange;
    newRating = Math.max(this.MIN_RATING, Math.min(this.MAX_RATING, newRating));
    
    // Calculate performance rating
    const performanceRating = this.calculatePerformanceRating(rank, totalParticipants, averageRating);
    
    return {
      oldRating,
      newRating,
      ratingChange: Math.round(newRating - oldRating),
      expectedScore: Math.round(expectedScore * 100) / 100,
      actualScore: Math.round(actualScore * 100) / 100,
      performanceRating: Math.round(performanceRating),
      performanceBonus: Math.round(performanceBonus),
      timeBonus: Math.round(timeBonus)
    };
  }

  /**
   * Process contest rating updates
   * @param {string} contestId - Contest ID
   */
  static async processContestRatings(contestId) {
    try {
      // Get contest and participants
      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        include: {
          entries: {
            include: {
              user: true
            },
            orderBy: {
              score: 'desc'
            }
          }
        }
      });

      if (!contest || contest.status !== 'ended') {
        throw new Error('Contest not found or not ended');
      }

      const participants = contest.entries;
      const totalParticipants = participants.length;

      if (totalParticipants === 0) {
        return { success: true, message: 'No participants to update ratings for' };
      }

      // Calculate average rating
      const totalRating = participants.reduce((sum, entry) => sum + (entry.user.contestRating || this.BASE_RATING), 0);
      const averageRating = totalRating / totalParticipants;

      // Process each participant
      const updates = [];
      
      for (let i = 0; i < participants.length; i++) {
        const entry = participants[i];
        const rank = i + 1;
        const oldRating = entry.user.contestRating || this.BASE_RATING;

        // Calculate problems solved breakdown
        const submissions = await prisma.contestSubmission.findMany({
          where: {
            entryId: entry.id,
            accepted: true
          }
        });

        const problemsSolved = submissions.length;
        const totalProblems = contest.problems.length;

        // Calculate time taken (time of last accepted submission)
        const lastAccepted = submissions.length > 0 
          ? Math.max(...submissions.map(s => s.solvedAt?.getTime() || 0))
          : 0;
        const timeTaken = lastAccepted - contest.startsAt.getTime();

        // Calculate rating change
        const ratingResult = this.calculateRatingChange({
          oldRating,
          rank,
          totalParticipants,
          averageRating,
          problemsSolved,
          totalProblems,
          timeTaken: Math.max(0, timeTaken),
          maxTime: contest.duration * 60000
        });

        // Update user rating
        await prisma.user.update({
          where: { id: entry.userId },
          data: {
            contestRating: ratingResult.newRating,
            bestRating: {
              increment: Math.max(0, ratingResult.newRating - (entry.user.bestRating || this.BASE_RATING))
            },
            worstRating: {
              decrement: Math.max(0, (entry.user.worstRating || this.BASE_RATING) - ratingResult.newRating)
            },
            contestsParticipated: { increment: 1 },
            contestsWon: {
              increment: rank === 1 ? 1 : 0
            },
            lastContestDate: new Date()
          }
        });

        // Update contest entry
        await prisma.contestEntry.update({
          where: { id: entry.id },
          data: {
            rank,
            ratingChange: ratingResult.ratingChange,
            problemsSolved,
            accuracy: problemsSolved / totalProblems,
            timeTaken
          }
        });

        // Create rating history
        await prisma.ratingHistory.create({
          data: {
            userId: entry.userId,
            contestId,
            ratingBefore: oldRating,
            ratingAfter: ratingResult.newRating,
            ratingChange: ratingResult.ratingChange,
            newRating: ratingResult.newRating,
            rank,
            totalParticipants,
            performanceScore: ratingResult.performanceRating
          }
        });

        // Create contest history
        await prisma.contestHistory.create({
          data: {
            userId: entry.userId,
            contestId,
            rank,
            score: entry.score,
            problemsSolved,
            totalProblems,
            accuracy: problemsSolved / totalProblems,
            timeTaken,
            ratingBefore: oldRating,
            ratingAfter: ratingResult.newRating,
            ratingChange: ratingResult.ratingChange,
            startedAt: contest.startsAt,
            submittedAt: new Date(),
            easySolved: submissions.filter(s => s.problem.difficulty === 'Easy').length,
            mediumSolved: submissions.filter(s => s.problem.difficulty === 'Medium').length,
            hardSolved: submissions.filter(s => s.problem.difficulty === 'Hard').length,
            easyTotal: contest.problems.filter(p => p.problem.difficulty === 'Easy').length,
            mediumTotal: contest.problems.filter(p => p.problem.difficulty === 'Medium').length,
            hardTotal: contest.problems.filter(p => p.problem.difficulty === 'Hard').length
          }
        });

        updates.push({
          userId: entry.userId,
          username: entry.user.name,
          oldRating,
          newRating: ratingResult.newRating,
          ratingChange: ratingResult.ratingChange,
          rank
        });
      }

      // Update contest average score
      const totalScore = participants.reduce((sum, entry) => sum + entry.score, 0);
      await prisma.contest.update({
        where: { id: contestId },
        data: {
          averageScore: totalScore / totalParticipants
        }
      });

      return {
        success: true,
        message: `Updated ratings for ${totalParticipants} participants`,
        updates
      };

    } catch (error) {
      console.error('Rating calculation error:', error);
      throw error;
    }
  }
}

/**
 * Get rating color based on rating value
 */
export function getRatingColor(rating) {
  if (rating < 1200) return '#808080'; // Gray
  if (rating < 1400) return '#008000'; // Green
  if (rating < 1600) return '#0000FF'; // Blue
  if (rating < 1900) return '#800080'; // Purple
  if (rating < 2100) return '#FF8C00'; // Orange
  if (rating < 2400) return '#FF0000'; // Red
  return '#FFD700'; // Gold
}

/**
 * Get rating title based on rating value
 */
export function getRatingTitle(rating) {
  if (rating < 1200) return 'Pupil';
  if (rating < 1400) return 'Specialist';
  if (rating < 1600) return 'Expert';
  if (rating < 1900) return 'Candidate Master';
  if (rating < 2100) return 'Master';
  if (rating < 2400) return 'International Master';
  return 'Grandmaster';
}