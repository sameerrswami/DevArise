/**
 * PLACEMENT TEST ORCHESTRATOR
 * 
 * Handles the complete test progression through all rounds:
 * 1. Test initialization
 * 2. Round setup and content loading
 * 3. Round transitions with pass/fail gates
 * 4. Time management and timeouts
 * 5. Final score calculation
 * 
 * Features:
 * - Multi-round progression with intermediate gating
 * - Pause/Resume functionality
 * - Real-time progress tracking
 * - Automatic timeout handling
 * - Score validation and result compilation
 */

import {
  prisma,
} from "./prisma";
import { PlacementEvaluators } from "./placement-evaluators";
import { PlacementAnalyzer } from "./placement-analysis";

export class PlacementTestOrchestrator {
  constructor(userId, testId) {
    this.userId = userId;
    this.testId = testId;
    this.evaluators = new PlacementEvaluators();
    this.analyzer = new PlacementAnalyzer();
  }

  /**
   * Initialize a test attempt
   * Creates a new attempt record and loads first round
   */
  async initializeTestAttempt() {
    try {
      // Fetch test details
      const test = await prisma.placementTest.findUnique({
        where: { id: this.testId },
        include: {
          rounds: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!test) {
        throw new Error("Test not found");
      }

      // Check if user already has a non-completed attempt
      const existingAttempt = await prisma.placementTestAttempt.findUnique({
        where: {
          userId_testId: { userId: this.userId, testId: this.testId },
        },
      });

      if (existingAttempt && existingAttempt.status !== "completed") {
        // Return existing paused attempt
        return this.loadAttemptState(existingAttempt.id);
      }

      // Create new attempt
      const attempt = await prisma.placementTestAttempt.create({
        data: {
          userId: this.userId,
          testId: this.testId,
          status: "in-progress",
          currentRound: 1,
          startedAt: new Date(),
        },
      });

      // Load first round questions
      const firstRound = test.rounds[0];
      const roundQuestions = await this.loadRoundContent(
        firstRound.id,
        firstRound.type
      );

      return {
        attemptId: attempt.id,
        test: {
          id: test.id,
          title: test.title,
          totalDuration: test.totalDuration,
          roundCount: test.rounds.length,
        },
        currentRound: {
          roundNumber: 1,
          type: firstRound.type,
          title: firstRound.title,
          duration: firstRound.duration,
          instructions: firstRound.instructions,
          content: roundQuestions,
        },
        startedAt: attempt.startedAt,
      };
    } catch (error) {
      console.error("Error initializing test attempt:", error);
      throw error;
    }
  }

  /**
   * Load content for a specific round based on type
   */
  async loadRoundContent(roundId, roundType) {
    try {
      const round = await prisma.placementTestRound.findUnique({
        where: { id: roundId },
      });

      let content = [];

      switch (roundType.toLowerCase()) {
        case "aptitude":
          content = await prisma.aptitudeQuestion.findMany({
            where: { roundId },
            orderBy: round.randomize ? { id: "asc" } : { order: "asc" },
            select: {
              id: true,
              category: true,
              difficulty: true,
              question: true,
              options: true,
              marks: true,
            },
          });
          break;

        case "mcq":
          content = await prisma.technicalMCQQuestion.findMany({
            where: { roundId },
            orderBy: round.randomize ? { id: "asc" } : { order: "asc" },
            select: {
              id: true,
              subject: true,
              difficulty: true,
              question: true,
              codeSnippet: true,
              options: true,
              marks: true,
            },
          });
          break;

        case "coding":
          content = await prisma.placementTestCodingProblem.findMany({
            where: { roundId },
            orderBy: { order: "asc" },
            include: {
              problem: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  difficulty: true,
                  sampleInput: true,
                  sampleOutput: true,
                  constraints: true,
                  examples: true,
                },
              },
            },
          });
          break;

        case "interview":
          // Interview round loads differently - returns setup, not questions
          content = await prisma.interviewRoundSetup.findUnique({
            where: { roundId },
          });
          break;

        default:
          throw new Error(`Unknown round type: ${roundType}`);
      }

      return content;
    } catch (error) {
      console.error("Error loading round content:", error);
      throw error;
    }
  }

  /**
   * Submit round answers/responses
   * Validates, scores, and determines if user can proceed to next round
   */
  async submitRoundAnswers(attemptId, roundNumber, responses) {
    try {
      const attempt = await prisma.placementTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          test: {
            include: {
              rounds: { orderBy: { order: "asc" } },
            },
          },
        },
      });

      if (!attempt) {
        throw new Error("Attempt not found");
      }

      const currentRound = attempt.test.rounds[roundNumber - 1];
      if (!currentRound) {
        throw new Error("Invalid round number");
      }

      // Score the round based on type
      let roundResultData = await this.scoreRound(
        attemptId,
        currentRound,
        responses,
        roundNumber
      );

      // Create round result
      const roundResult = await prisma.roundResult.create({
        data: {
          attemptId,
          roundId: currentRound.id,
          roundNumber,
          roundType: currentRound.type,
          ...roundResultData,
        },
      });

      // Check if user passed this round
      const isPassed = roundResult.percentage >= currentRound.passingPercentage;

      if (!isPassed && roundNumber < attempt.test.rounds.length) {
        // User failed a mandatory round - test ends
        await prisma.placementTestAttempt.update({
          where: { id: attemptId },
          data: {
            status: "completed",
            completedAt: new Date(),
            isPassed: false,
            currentRound: roundNumber,
          },
        });

        return {
          status: "failed",
          roundNumber,
          score: roundResult.score,
          maxScore: roundResult.maxScore,
          percentage: roundResult.percentage,
          message: `Failed round ${roundNumber}. Test terminated.`,
          failedAt: roundNumber,
        };
      }

      // Prepare next round or complete test
      if (roundNumber >= attempt.test.rounds.length) {
        // All rounds completed - finalize test
        return await this.finalizeTestAttempt(attemptId);
      }

      // Update attempt and load next round
      const nextRound = attempt.test.rounds[roundNumber];
      await prisma.placementTestAttempt.update({
        where: { id: attemptId },
        data: { currentRound: roundNumber + 1 },
      });

      const nextRoundContent = await this.loadRoundContent(
        nextRound.id,
        nextRound.type
      );

      return {
        status: "proceed",
        currentRoundResult: {
          roundNumber,
          score: roundResult.score,
          maxScore: roundResult.maxScore,
          percentage: roundResult.percentage,
          isPassed: true,
          feedback: roundResult.recommendations,
        },
        nextRound: {
          roundNumber: roundNumber + 1,
          type: nextRound.type,
          title: nextRound.title,
          duration: nextRound.duration,
          instructions: nextRound.instructions,
          content: nextRoundContent,
        },
      };
    } catch (error) {
      console.error("Error submitting round answers:", error);
      throw error;
    }
  }

  /**
   * Score a round based on round type
   */
  async scoreRound(attemptId, round, responses, roundNumber) {
    switch (round.type.toLowerCase()) {
      case "aptitude":
        return await this.evaluators.scoreAptitudeRound(
          attemptId,
          round,
          responses
        );

      case "mcq":
        return await this.evaluators.scoreMCQRound(
          attemptId,
          round,
          responses
        );

      case "coding":
        return await this.evaluators.scoreCodingRound(
          attemptId,
          round,
          responses
        );

      case "interview":
        // Interview round scoring happens asynchronously
        return await this.evaluators.scoreInterviewRound(
          attemptId,
          round,
          responses
        );

      default:
        throw new Error(`Cannot score round type: ${round.type}`);
    }
  }

  /**
   * Finalize test attempt
   * Calculate final scores, determine pass/fail, trigger analysis
   */
  async finalizeTestAttempt(attemptId) {
    try {
      const attempt = await prisma.placementTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          test: true,
          roundResults: true,
        },
      });

      // Calculate overall scores
      const totalScore = attempt.roundResults.reduce(
        (sum, r) => sum + r.score,
        0
      );
      const totalMarks = attempt.roundResults.reduce(
        (sum, r) => sum + r.maxScore,
        0
      );
      const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

      // Check if passed overall
      const isPassed = percentage >= attempt.test.passingPercentage;

      // Update attempt with final results
      const updatedAttempt = await prisma.placementTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: "completed",
          completedAt: new Date(),
          totalScore,
          totalMarks,
          percentage,
          isPassed,
        },
      });

      // Trigger analysis
      const analysis = await this.analyzer.analyzeAttempt(attemptId);

      // Create or update weak area tracking
      await this.analyzer.updateWeakAreaTracking(
        attempt.userId,
        analysis,
        attempt.test.id
      );

      return {
        status: "completed",
        finalResult: {
          totalScore,
          totalMarks,
          percentage: Math.round(percentage * 100) / 100,
          isPassed,
          completedAt: updatedAttempt.completedAt,
        },
        analysis,
      };
    } catch (error) {
      console.error("Error finalizing test attempt:", error);
      throw error;
    }
  }

  /**
   * Get current attempt state
   */
  async getAttemptState(attemptId) {
    try {
      const attempt = await prisma.placementTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          test: {
            include: {
              rounds: { orderBy: { order: "asc" } },
            },
          },
          roundResults: true,
        },
      });

      if (!attempt) {
        throw new Error("Attempt not found");
      }

      // Calculate elapsed time
      const elapsedSeconds = Math.floor(
        (new Date() - attempt.startedAt) / 1000
      );

      // Calculate time remaining
      const totalSeconds = attempt.test.totalDuration;
      const timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);

      // Get next round if test is ongoing
      let nextRoundInfo = null;
      if (
        attempt.status === "in-progress" &&
        attempt.currentRound <= attempt.test.rounds.length
      ) {
        const nextRound = attempt.test.rounds[attempt.currentRound - 1];
        if (nextRound) {
          nextRoundInfo = {
            roundNumber: attempt.currentRound,
            type: nextRound.type,
            title: nextRound.title,
          };
        }
      }

      return {
        attemptId: attempt.id,
        status: attempt.status,
        currentRound: attempt.currentRound,
        totalRounds: attempt.test.rounds.length,
        elapsedSeconds,
        timeRemaining,
        totalDuration: totalSeconds,
        nextRound: nextRoundInfo,
        roundResults: attempt.roundResults.map((r) => ({
          roundNumber: r.roundNumber,
          type: r.roundType,
          score: r.score,
          maxScore: r.maxScore,
          percentage: r.percentage,
          isPassed: r.isPassed,
        })),
        currentProgress: {
          score: attempt.totalScore,
          maxScore: attempt.totalMarks,
          percentage: attempt.percentage,
        },
      };
    } catch (error) {
      console.error("Error getting attempt state:", error);
      throw error;
    }
  }

  /**
   * Load a paused attempt
   */
  async loadAttemptState(attemptId) {
    try {
      const attempt = await prisma.placementTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          test: {
            include: {
              rounds: { orderBy: { order: "asc" } },
            },
          },
          roundResults: true,
        },
      });

      if (!attempt) {
        throw new Error("Attempt not found");
      }

      // Check for timeout
      const elapsedSeconds = Math.floor(
        (new Date() - attempt.startedAt) / 1000
      );
      const isTimedOut = elapsedSeconds > attempt.test.totalDuration;

      if (isTimedOut && attempt.status === "in-progress") {
        // Finalize the attempt due to timeout
        return await this.finalizeTestAttempt(attemptId);
      }

      // Load current/next round content
      const currentRound = attempt.test.rounds[attempt.currentRound - 1];
      let roundContent = null;

      if (currentRound && attempt.status === "in-progress") {
        roundContent = await this.loadRoundContent(
          currentRound.id,
          currentRound.type
        );
      }

      return {
        attemptId,
        resumed: true,
        currentRound: {
          roundNumber: attempt.currentRound,
          type: currentRound?.type,
          title: currentRound?.title,
          duration: currentRound?.duration,
          instructions: currentRound?.instructions,
          content: roundContent,
        },
        status: attempt.status,
        progress: await this.getAttemptState(attemptId),
      };
    } catch (error) {
      console.error("Error loading attempt state:", error);
      throw error;
    }
  }

  /**
   * Pause an ongoing attempt
   */
  async pauseAttempt(attemptId) {
    try {
      await prisma.placementTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: "paused",
          pausedAt: new Date(),
        },
      });

      return { status: "paused", attemptId };
    } catch (error) {
      console.error("Error pausing attempt:", error);
      throw error;
    }
  }

  /**
   * Resume a paused attempt
   */
  async resumeAttempt(attemptId) {
    try {
      const updatedAttempt = await prisma.placementTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: "in-progress",
          pausedAt: null,
        },
      });

      return {
        status: "resumed",
        attemptId,
        state: await this.getAttemptState(attemptId),
      };
    } catch (error) {
      console.error("Error resuming attempt:", error);
      throw error;
    }
  }

  /**
   * Abandon an attempt mid-test
   */
  async abandonAttempt(attemptId, reason = "user_abandoned") {
    try {
      await prisma.placementTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: "abandoned",
          completedAt: new Date(),
        },
      });

      return { status: "abandoned", attemptId };
    } catch (error) {
      console.error("Error abandoning attempt:", error);
      throw error;
    }
  }

  /**
   * Get test details for student
   */
  async getTestDetails(testId) {
    try {
      const test = await prisma.placementTest.findUnique({
        where: { id: testId },
        include: {
          rounds: {
            orderBy: { order: "asc" },
            select: {
              order: true,
              type: true,
              title: true,
              duration: true,
              questionsCount: true,
              description: true,
            },
          },
        },
      });

      if (!test) {
        throw new Error("Test not found");
      }

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        difficulty: test.difficulty,
        totalDuration: test.totalDuration,
        company: test.company,
        isActive: test.isActive,
        passingPercentage: test.passingPercentage,
        rounds: test.rounds.map((r) => ({
          order: r.order,
          type: r.type,
          title: r.title,
          duration: r.duration,
          questionsCount: r.questionsCount,
          description: r.description,
        })),
      };
    } catch (error) {
      console.error("Error getting test details:", error);
      throw error;
    }
  }
}

export default PlacementTestOrchestrator;
