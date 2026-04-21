import prisma from "@/lib/prisma";

export const POINTS_CONFIG = {
  SOLVE_PROBLEM: { points: 50, exp: 100, reason: "Problem Solved" },
  DAILY_STREAK: { points: 20, exp: 50, reason: "Daily Consistency" },
  INTERVIEW_COMPLETE: { points: 150, exp: 300, reason: "Mock Interview Completed" },
  CONTEST_PARTICIPATION: { points: 100, exp: 200, reason: "Contest Participation" },
  COURSE_TOPIC_COMPLETE: { points: 30, exp: 60, reason: "Course Knowledge Mastered" },
  COMMUNITY_ANSWER: { points: 25, exp: 50, reason: "Community Contribution" }
};

export class RewardsService {
  static async awardPoints(userId, actionKey) {
    const config = POINTS_CONFIG[actionKey];
    if (!config) return null;

    try {
      // 1. Update User Points and EXP
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return null;

      const newExp = user.exp + config.exp;
      const newLevel = Math.floor(newExp / 1000) + 1; // Simplistic level logic: 1000 exp per level

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: config.points },
          exp: newExp,
          level: newLevel > user.level ? newLevel : user.level
        }
      });

      // 2. Log Transaction
      await prisma.pointTransaction.create({
        data: {
          userId,
          amount: config.points,
          type: "REWARD",
          reason: config.reason
        }
      });

      return {
        pointsEarned: config.points,
        expEarned: config.exp,
        hasLeveledUp: newLevel > user.level,
        currentLevel: updatedUser.level
      };
    } catch (error) {
      console.error("[RewardsService Error]:", error);
      throw error;
    }
  }

  static async redeemReward(userId, rewardItemId) {
    try {
      const reward = await prisma.rewardItem.findUnique({ where: { id: rewardItemId } });
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!reward || !user || user.points < reward.cost) {
        return { success: false, message: "Insufficient points or invalid reward" };
      }

      // 1. Deduct points
      await prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: reward.cost } }
      });

      // 2. Log Transaction
      await prisma.pointTransaction.create({
        data: {
          userId,
          amount: -reward.cost,
          type: "REDEMPTION",
          reason: `Redeemed: ${reward.title}`
        }
      });

      return { success: true, reward };
    } catch (error) {
      console.error("[RewardsService Redemption Error]:", error);
      throw error;
    }
  }
}
