import prisma from "./prisma";
import { CodeExecutor } from "./code-executor";
import { RatingCalculator } from "./rating-calculator";

// Stub for PlagiarismDetector since the module doesn't exist
class PlagiarismDetector {
  async checkSubmission(submission) {
    return { isPlagiarism: false, score: 0 };
  }
}

export class BattleOrchestrator {
  constructor() {
    this.codeExecutor = new CodeExecutor();
    this.plagiarismDetector = new PlagiarismDetector();
    this.ratingCalculator = new RatingCalculator();
    this.activeBattles = new Map();
  }

  async createBattle(creatorId, battleConfig) {
    try {
      const {
        problemId,
        title,
        description,
        difficulty,
        timeLimit = 900,
        maxParticipants = 2,
        isRanked = false,
        isPublic = true,
      } = battleConfig;

      const problem = await prisma.problem.findUnique({ where: { id: problemId } });
      if (!problem) throw new Error("Problem not found");

      const battle = await prisma.codingBattle.create({
        data: {
          problemId,
          title: title || problem.title,
          description: description || problem.description,
          difficulty: difficulty || problem.difficulty,
          timeLimit,
          maxParticipants,
          isRanked,
          isPublic,
          createdBy: creatorId,
          status: "waiting",
        },
      });

      await prisma.battleParticipant.create({
        data: {
          battleId: battle.id,
          userId: creatorId,
          ratingBefore: await this.getUserRating(creatorId),
        },
      });

      this.activeBattles.set(battle.id, {
        battleId: battle.id,
        status: "waiting",
        participants: [creatorId],
        startTime: null,
        submissions: [],
      });

      return battle;
    } catch (error) {
      console.error("Error creating battle:", error);
      throw error;
    }
  }

  async joinBattle(battleId, userId) {
    try {
      const battle = await prisma.codingBattle.findUnique({
        where: { id: battleId },
        include: { participants: true },
      });

      if (!battle) throw new Error("Battle not found");
      if (battle.status !== "waiting" && battle.status !== "in-progress") {
        throw new Error("Battle is not accepting participants");
      }
      if (battle.participants.length >= battle.maxParticipants) {
        throw new Error("Battle is full");
      }

      const existing = battle.participants.find((p) => p.userId === userId);
      if (existing) throw new Error("User already in this battle");

      const participant = await prisma.battleParticipant.create({
        data: {
          battleId,
          userId,
          ratingBefore: await this.getUserRating(userId),
        },
      });

      await prisma.codingBattle.update({
        where: { id: battleId },
        data: { participantCount: { increment: 1 } },
      });

      if (battle.participantCount + 1 >= battle.minParticipants) {
        await this.startBattle(battleId);
      }

      return participant;
    } catch (error) {
      console.error("Error joining battle:", error);
      throw error;
    }
  }

  async startBattle(battleId) {
    try {
      const battle = await prisma.codingBattle.findUnique({ where: { id: battleId } });
      if (!battle) throw new Error("Battle not found");
      if (battle.status !== "waiting") throw new Error("Battle already started or completed");

      const now = new Date();
      await prisma.codingBattle.update({
        where: { id: battleId },
        data: { status: "in-progress", startedAt: now },
      });

      const inMemory = this.activeBattles.get(battleId);
      if (inMemory) {
        inMemory.status = "in-progress";
        inMemory.startTime = now.getTime();
      }

      this.scheduleAutoEnd(battleId, battle.timeLimit);

      return { success: true, startedAt: now };
    } catch (error) {
      console.error("Error starting battle:", error);
      throw error;
    }
  }

  async submitCode(battleId, userId, codeData) {
    try {
      const { code, language, problemId } = codeData;

      const participant = await prisma.battleParticipant.findUnique({
        where: { battleId_userId: { battleId, userId } },
        include: { battle: true },
      });

      if (!participant) throw new Error("User not in this battle");

      const battle = participant.battle;
      if (battle.status !== "in-progress") throw new Error("Battle is not in progress");

      const timeSinceStart = Math.floor((new Date() - battle.startedAt) / 1000);
      if (timeSinceStart > battle.timeLimit) throw new Error("Battle time limit exceeded");

      const executionResult = await this.codeExecutor.executeCode(code, language, problemId);

      const submission = await prisma.battleSubmission.create({
        data: {
          battleId,
          participantId: participant.id,
          code,
          language,
          status: executionResult.status,
          score: executionResult.score,
          passedTestCases: executionResult.passedTestCases,
          totalTestCases: executionResult.totalTestCases,
          accuracy: (executionResult.passedTestCases / executionResult.totalTestCases) * 100,
          executionTime: executionResult.executionTime,
          executionMemory: executionResult.executionMemory,
          errorMessage: executionResult.errorMessage,
          timeSinceStart,
        },
      });

      const plagiarismCheck = await this.plagiarismDetector.checkSubmission(submission);
      if (plagiarismCheck.isPlagiarism) {
        await prisma.battleSubmission.update({
          where: { id: submission.id },
          data: { plagiarismScore: plagiarismCheck.score, flaggedAsPlague: true },
        });
      }

      if (executionResult.status === "accepted") {
        const isFirst = participant.problemsSolved === 0;
        await prisma.battleParticipant.update({
          where: { id: participant.id },
          data: {
            problemsSolved: { increment: 1 },
            totalSubmissions: { increment: 1 },
            currentScore: { increment: executionResult.score },
            fastestSubmission:
              isFirst || timeSinceStart < (participant.fastestSubmission || timeSinceStart)
                ? timeSinceStart
                : participant.fastestSubmission,
          },
        });
      } else {
        await prisma.battleParticipant.update({
          where: { id: participant.id },
          data: { totalSubmissions: { increment: 1 } },
        });
      }

      return {
        submissionId: submission.id,
        status: executionResult.status,
        score: executionResult.score,
        accuracy: submission.accuracy,
        isPlagiarism: plagiarismCheck.isPlagiarism,
        timeSinceStart,
      };
    } catch (error) {
      console.error("Error submitting code:", error);
      throw error;
    }
  }

  async getLiveLeaderboard(battleId) {
    try {
      const battle = await prisma.codingBattle.findUnique({ where: { id: battleId } });
      if (!battle) throw new Error("Battle not found");

      const participants = await prisma.battleParticipant.findMany({
        where: { battleId },
        include: { user: { select: { name: true, image: true, email: true } } },
        orderBy: [{ currentScore: "desc" }, { fastestSubmission: "asc" }, { joinedAt: "asc" }],
      });

      const timeSinceStart =
        battle.status === "in-progress" ? Math.floor((new Date() - battle.startedAt) / 1000) : null;

      const leaderboard = participants.map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        name: p.user.name,
        image: p.user.image,
        score: p.currentScore,
        problemsSolved: p.problemsSolved,
        totalSubmissions: p.totalSubmissions,
        accuracy: p.totalSubmissions > 0 ? ((p.problemsSolved / p.totalSubmissions) * 100).toFixed(1) : 0,
        fastestSolve: p.fastestSubmission,
        isAFK: p.isAFK,
        joinedAt: p.joinedAt,
      }));

      return {
        battleId,
        status: battle.status,
        timeSinceStart,
        totalTimeLimit: battle.timeLimit,
        timeRemaining: timeSinceStart ? Math.max(0, battle.timeLimit - timeSinceStart) : battle.timeLimit,
        leaderboard,
      };
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }

  async endBattle(battleId, reason = "battle_completed") {
    try {
      const battle = await prisma.codingBattle.findUnique({
        where: { id: battleId },
        include: { participants: true, problem: true },
      });

      if (!battle) throw new Error("Battle not found");

      const now = new Date();
      await prisma.codingBattle.update({
        where: { id: battleId },
        data: { status: "completed", endedAt: now },
      });

      const standings = await this.calculateStandings(battleId);

      for (const standing of standings) {
        await prisma.battleResult.create({
          data: {
            battleId,
            participantId: standing.participantId,
            rank: standing.rank,
            score: standing.score,
            problemsSolved: standing.problemsSolved,
            totalSubmissions: standing.totalSubmissions,
            accuracy: standing.accuracy,
            fastestSolveTime: standing.fastestSolveTime,
            totalTimeSpent: standing.totalTimeSpent,
            ratingBefore: standing.ratingBefore,
            ratingAfter: standing.ratingAfter,
            ratingChange: standing.ratingChange,
            winnerBonus: standing.rank === 1 && battle.isRanked,
            pointsEarned: standing.pointsEarned,
            keyStrengths: standing.strengths,
            areasForImprovement: standing.weaknesses,
          },
        });

        await this.updateUserRating(standing.userId, standing.ratingBefore, standing.ratingAfter, battle.isRanked);

        const otherParticipants = battle.participants.filter((p) => p.userId !== standing.userId);

        await prisma.battleHistory.create({
          data: {
            userId: standing.userId,
            battleId,
            opponents: otherParticipants.map((p) => p.userId),
            opponentNames: otherParticipants.map((p) => p.id),
            rank: standing.rank,
            score: standing.score,
            ratingBefore: standing.ratingBefore,
            ratingAfter: standing.ratingAfter,
            resultStatus: standing.rank === 1 ? "win" : standing.rank === standings.length ? "loss" : "draw",
            problemsSolved: standing.problemsSolved,
            totalSubmissions: standing.totalSubmissions,
            accuracy: standing.accuracy,
            timeSpent: standing.totalTimeSpent,
          },
        });
      }

      this.activeBattles.delete(battleId);

      return { battleId, endedAt: now, reason, standings };
    } catch (error) {
      console.error("Error ending battle:", error);
      throw error;
    }
  }

  async calculateStandings(battleId) {
    const participants = await prisma.battleParticipant.findMany({
      where: { battleId },
      include: { submissions: true, user: true },
    });

    const standings = participants
      .map((p) => {
        const totalTime = p.submissions.length > 0 ? p.submissions[p.submissions.length - 1].timeSinceStart : 0;

        return {
          participantId: p.id,
          userId: p.userId,
          userName: p.user.name,
          score: p.currentScore,
          problemsSolved: p.problemsSolved,
          totalSubmissions: p.totalSubmissions,
          accuracy: p.totalSubmissions > 0 ? (p.problemsSolved / p.totalSubmissions) * 100 : 0,
          fastestSolveTime: p.fastestSubmission,
          totalTimeSpent: totalTime,
          ratingBefore: p.ratingBefore,
          ratingAfter: 0,
          ratingChange: 0,
          pointsEarned: p.problemsSolved * 10,
          strengths: [
            p.problemsSolved > 0 ? `Solved ${p.problemsSolved} problems` : "Participated in battle",
            `${p.totalSubmissions} total submissions`,
          ],
          weaknesses:
            p.problemsSolved === 0
              ? ["No problems solved - review approach", "Consider different strategies"]
              : [],
        };
      })
      .sort((a, b) => {
        if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
        if (b.score !== a.score) return b.score - a.score;
        return a.fastestSolveTime - b.fastestSolveTime;
      });

    for (let i = 0; i < standings.length; i++) {
      standings[i].rank = i + 1;
      const ratingChange = this.ratingCalculator.calculateRatingChange(
        standings[i].ratingBefore,
        i + 1,
        standings.length
      );
      standings[i].ratingAfter = standings[i].ratingBefore + ratingChange;
      standings[i].ratingChange = ratingChange;
    }

    return standings;
  }

  async updateUserRating(userId, ratingBefore, ratingAfter, isRanked) {
    try {
      if (!isRanked) return;

      const ratingChange = ratingAfter - ratingBefore;
      const userRating = await prisma.userCodingRating.findUnique({ where: { userId } });

      if (userRating) {
        await prisma.userCodingRating.update({
          where: { userId },
          data: {
            rating: ratingAfter,
            ratingChange,
            lastBattleAt: new Date(),
            bestRating: Math.max(userRating.bestRating, ratingAfter),
          },
        });
      }
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  }

  async getUserRating(userId) {
    try {
      const userRating = await prisma.userCodingRating.findUnique({ where: { userId } });
      return userRating?.rating || 1200;
    } catch {
      return 1200;
    }
  }

  scheduleAutoEnd(battleId, timeLimit) {
    setTimeout(async () => {
      try {
        const battle = await prisma.codingBattle.findUnique({ where: { id: battleId } });
        if (battle && battle.status === "in-progress") {
          await this.endBattle(battleId, "time_limit_exceeded");
        }
      } catch (error) {
        console.error("Error auto-ending battle:", error);
      }
    }, timeLimit * 1000);
  }

  async getBattleDetails(battleId) {
    try {
      const battle = await prisma.codingBattle.findUnique({
        where: { id: battleId },
        include: {
          problem: true,
          participants: { include: { user: { select: { name: true, image: true } } } },
        },
      });

      if (!battle) throw new Error("Battle not found");

      return {
        battleId: battle.id,
        title: battle.title,
        description: battle.description,
        problem: {
          id: battle.problem.id,
          title: battle.problem.title,
          description: battle.problem.description,
          difficulty: battle.problem.difficulty,
          constraints: battle.problem.constraints,
        },
        timeLimit: battle.timeLimit,
        maxParticipants: battle.maxParticipants,
        participantCount: battle.participantCount,
        status: battle.status,
        isRanked: battle.isRanked,
        createdAt: battle.createdAt,
        startedAt: battle.startedAt,
        endedAt: battle.endedAt,
        participants: battle.participants.map((p) => ({
          userId: p.userId,
          name: p.user.name,
          image: p.user.image,
          joinedAt: p.joinedAt,
        })),
      };
    } catch (error) {
      console.error("Error getting battle details:", error);
      throw error;
    }
  }
}

export default BattleOrchestrator;
