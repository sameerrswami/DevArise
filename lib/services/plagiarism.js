import prisma from "@/lib/prisma";
import crypto from "crypto";

/**
 * Plagiarism detection service
 */
export class PlagiarismDetector {
  static SIMILARITY_THRESHOLD = 0.8; // 80% similarity threshold
  static EXACT_MATCH_THRESHOLD = 1.0; // 100% exact match

  /**
   * Normalize code for comparison
   */
  static normalizeCode(code) {
    return code
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/#.*$/gm, '') // Remove Python comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1') // Remove spaces around operators
      .trim()
      .toLowerCase();
  }

  /**
   * Generate hash for code
   */
  static generateCodeHash(code) {
    const normalized = this.normalizeCode(code);
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Calculate similarity between two code submissions
   */
  static calculateSimilarity(code1, code2) {
    const normalized1 = this.normalizeCode(code1);
    const normalized2 = this.normalizeCode(code2);

    // Simple character-based similarity
    const maxLength = Math.max(normalized1.length, normalized2.length);
    if (maxLength === 0) return 1.0;

    let matches = 0;
    const minLength = Math.min(normalized1.length, normalized2.length);

    for (let i = 0; i < minLength; i++) {
      if (normalized1[i] === normalized2[i]) {
        matches++;
      }
    }

    return matches / maxLength;
  }

  /**
   * Check for plagiarism in a submission
   */
  static async checkPlagiarism(submissionId) {
    try {
      const submission = await prisma.codeSubmission.findUnique({
        where: { id: submissionId },
        include: {
          user: true,
          problem: true,
          contest: true
        }
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      // Get all other submissions for this problem in the same contest
      const otherSubmissions = await prisma.codeSubmission.findMany({
        where: {
          problemId: submission.problemId,
          contestId: submission.contestId,
          id: { not: submission.id }
        },
        include: {
          user: true
        }
      });

      const results = [];
      let maxSimilarity = 0;
      let mostSimilarSubmission = null;

      for (const other of otherSubmissions) {
        const similarity = this.calculateSimilarity(submission.code, other.code);
        
        results.push({
          submissionId: other.id,
          userId: other.userId,
          username: other.user.name,
          similarity,
          flagged: similarity >= this.SIMILARITY_THRESHOLD
        });

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          mostSimilarSubmission = other;
        }
      }

      // Update submission with plagiarism results
      await prisma.codeSubmission.update({
        where: { id: submission.id },
        data: {
          similarityScore: maxSimilarity,
          similarTo: mostSimilarSubmission?.id || null,
          flaggedForReview: maxSimilarity >= this.SIMILARITY_THRESHOLD
        }
      });

      // If exact match found, flag both submissions
      if (maxSimilarity >= this.EXACT_MATCH_THRESHOLD && mostSimilarSubmission) {
        await prisma.codeSubmission.update({
          where: { id: mostSimilarSubmission.id },
          data: {
            similarityScore: maxSimilarity,
            similarTo: submission.id,
            flaggedForReview: true
          }
        });
      }

      return {
        submissionId: submission.id,
        problemId: submission.problemId,
        contestId: submission.contestId,
        maxSimilarity,
        flagged: maxSimilarity >= this.SIMILARITY_THRESHOLD,
        mostSimilarSubmission: mostSimilarSubmission ? {
          id: mostSimilarSubmission.id,
          userId: mostSimilarSubmission.userId,
          username: mostSimilarSubmission.user.name
        } : null,
        allResults: results
      };

    } catch (error) {
      console.error('Plagiarism check error:', error);
      throw error;
    }
  }

  /**
   * Get plagiarism report for a contest
   */
  static async getContestPlagiarismReport(contestId) {
    try {
      const submissions = await prisma.codeSubmission.findMany({
        where: { contestId },
        include: {
          user: true,
          problem: true
        },
        orderBy: { similarityScore: 'desc' }
      });

      const flaggedSubmissions = submissions.filter(s => s.flaggedForReview);
      const exactMatches = submissions.filter(s => s.similarityScore >= this.EXACT_MATCH_THRESHOLD);

      // Group by user
      const userReports = new Map();
      for (const submission of flaggedSubmissions) {
        if (!userReports.has(submission.userId)) {
          userReports.set(submission.userId, {
            userId: submission.userId,
            username: submission.user.name,
            flaggedCount: 0,
            exactMatchCount: 0,
            maxSimilarity: 0,
            problems: []
          });
        }

        const report = userReports.get(submission.userId);
        report.flaggedCount++;
        if (submission.similarityScore >= this.EXACT_MATCH_THRESHOLD) {
          report.exactMatchCount++;
        }
        report.maxSimilarity = Math.max(report.maxSimilarity, submission.similarityScore);
        report.problems.push({
          problemId: submission.problemId,
          problemTitle: submission.problem.title,
          similarity: submission.similarityScore,
          flagged: submission.flaggedForReview
        });
      }

      return {
        contestId,
        totalSubmissions: submissions.length,
        flaggedSubmissions: flaggedSubmissions.length,
        exactMatches: exactMatches.length,
        uniqueUsers: new Set(submissions.map(s => s.userId)).size,
        userReports: Array.from(userReports.values()).sort((a, b) => b.maxSimilarity - a.maxSimilarity)
      };

    } catch (error) {
      console.error('Contest plagiarism report error:', error);
      throw error;
    }
  }

  /**
   * Review and resolve plagiarism case
   */
  static async reviewPlagiarismCase(submissionId, action, notes) {
    try {
      const submission = await prisma.codeSubmission.findUnique({
        where: { id: submissionId },
        include: {
          user: true,
          problem: true,
          contest: true
        }
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      // Update submission status
      await prisma.codeSubmission.update({
        where: { id: submissionId },
        data: {
          flaggedForReview: false,
          // Add review notes if needed
        }
      });

      // If action is to penalize, update contest submission
      if (action === 'PENALIZE') {
        const contestSubmission = await prisma.contestSubmission.findFirst({
          where: {
            submissionId: submission.submissionId
          }
        });

        if (contestSubmission) {
          // Mark as disqualified
          await prisma.contestSubmission.update({
            where: { id: contestSubmission.id },
            data: {
              accepted: false,
              // Add disqualification reason
            }
          });

          // Update contest entry score
          await prisma.contestEntry.update({
            where: { id: contestSubmission.entryId },
            data: {
              score: { decrement: 100 }, // Penalty points
              problemsSolved: { decrement: 1 }
            }
          });
        }
      }

      return {
        success: true,
        submissionId,
        action,
        notes,
        reviewedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Plagiarism review error:', error);
      throw error;
    }
  }

  /**
   * Batch check plagiarism for all submissions in a contest
   */
  static async batchCheckContestPlagiarism(contestId) {
    try {
      const submissions = await prisma.codeSubmission.findMany({
        where: { contestId },
        orderBy: { createdAt: 'asc' }
      });

      const results = [];
      for (const submission of submissions) {
        try {
          const result = await this.checkPlagiarism(submission.id);
          results.push(result);
        } catch (error) {
          console.error(`Error checking submission ${submission.id}:`, error);
          results.push({
            submissionId: submission.id,
            error: error.message
          });
        }
      }

      return {
        contestId,
        totalChecked: results.length,
        flaggedCount: results.filter(r => r.flagged).length,
        results
      };

    } catch (error) {
      console.error('Batch plagiarism check error:', error);
      throw error;
    }
  }
}