import { RewardsService } from "./rewards";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const SystemEvents = {
  PROBLEM_SOLVED: 'PROBLEM_SOLVED',
  INTERVIEW_COMPLETED: 'INTERVIEW_COMPLETED',
  COURSE_TOPIC_COMPLETED: 'COURSE_TOPIC_COMPLETED',
  RESUME_ANALYZED: 'RESUME_ANALYZED'
};

/**
 * Unified System Alignment Layer
 * Ensures seamless interconnection between isolated features.
 */
export class SystemOrchestrator {
  
  static async dispatch(eventType, userId, payload = {}) {
    logger.info(`Orchestrator dispatching event: ${eventType}`, { userId });
    
    try {
      switch (eventType) {
        case SystemEvents.PROBLEM_SOLVED:
          await this.handleProblemSolved(userId, payload);
          break;
        case SystemEvents.INTERVIEW_COMPLETED:
          await this.handleInterviewCompleted(userId, payload);
          break;
        case SystemEvents.COURSE_TOPIC_COMPLETED:
          await this.handleCourseTopicCompleted(userId, payload);
          break;
        case SystemEvents.RESUME_ANALYZED:
          await this.handleResumeAnalyzed(userId, payload);
          break;
        default:
          logger.warn(`Unknown event type dispatched: ${eventType}`);
      }
    } catch (error) {
      logger.error(`Orchestrator failed handling event: ${eventType}`, error, { userId });
    }
  }

  // --- Event Handlers ---

  static async handleProblemSolved(userId, { isAccepted, difficulty, category }) {
    if (!isAccepted) return;

    // 1. Award Points
    await RewardsService.awardPoints(userId, 'SOLVE_PROBLEM');

    // 2. Update Global Analytics Counters
    await prisma.user.update({
      where: { id: userId },
      data: { totalProblemsSolved: { increment: 1 } }
    });

    // 3. (Future) Update dynamic skill graph based on problem category
  }

  static async handleInterviewCompleted(userId, { mockId, overallScore, metrics }) {
    // 1. Award Points
    await RewardsService.awardPoints(userId, 'INTERVIEW_COMPLETE');

    // 2. Synchronize skills - update user's underlying "prep level" heuristic if score is high
    if (overallScore > 80) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.preparationLevel === "Beginner") {
        await prisma.user.update({
          where: { id: userId },
          data: { preparationLevel: "Intermediate" }
        });
      }
    }
  }

  static async handleCourseTopicCompleted(userId, { topicId }) {
    // Award points
    await RewardsService.awardPoints(userId, 'COURSE_TOPIC_COMPLETE');
  }

  static async handleResumeAnalyzed(userId, { parsedSkills }) {
    // 1. Save extracted skills to central profile to influence Job Matches later
    await prisma.user.update({
      where: { id: userId },
      data: { resumeData: parsedSkills }
    });
    
    // Resume processing grants points too potentially
    await RewardsService.awardPoints(userId, 'DAILY_STREAK'); // Equivalent fallback
  }
}
