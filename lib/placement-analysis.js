/**
 * PLACEMENT TEST ANALYSIS ENGINE
 * 
 * Comprehensive analysis of test performance:
 * 1. Performance metrics calculation
 * 2. Weak area detection and tracking
 * 3. Strength identification
 * 4. Personalized recommendations
 * 5. ML-based severity classification
 * 
 * Identifies patterns, root causes, and improvement opportunities
 */

import { prisma } from "./prisma";

export class PlacementAnalyzer {
  /**
   * Analyze a completed test attempt
   * Generates comprehensive performance insights
   */
  async analyzeAttempt(attemptId) {
    try {
      const attempt = await prisma.placementTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          test: true,
          roundResults: true,
        },
      });

      if (!attempt) {
        throw new Error("Attempt not found");
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(attempt);

      // Identify weak areas
      const weakAreas = await this.identifyWeakAreas(attemptId, attempt);

      // Identify strengths
      const strengths = await this.identifyStrengths(attemptId, attempt);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        weakAreas,
        strengths,
        metrics
      );

      // Determine failure reason if failed
      let failureReason = null;
      if (!attempt.isPassed) {
        failureReason = this.determineFailureReason(attempt.roundResults);
      }

      // Create analysis record
      const analysis = await prisma.placementTestAnalysis.create({
        data: {
          attemptId,
          overallScore: attempt.totalScore,
          overallPercentage: attempt.percentage,
          finalResult: attempt.isPassed ? "cleared" : "failed",
          failureReason,
          failureRounds: attempt.roundResults
            .filter((r) => !r.isPassed)
            .map((r) => r.roundType),
          roundAnalysis: this.formatRoundAnalysis(attempt.roundResults),
          topicStrengths: strengths.topicStrengths,
          topicWeaknesses: weakAreas.topicWeaknesses,
          commonMistakes: weakAreas.commonMistakes,
          recommendations: recommendations,
          accuracy: metrics.accuracy,
          speed: metrics.speed,
          consistency: metrics.consistency,
          timeManagementIssues: metrics.timeManagementIssues,
        },
      });

      return {
        analysisId: analysis.id,
        overallPerformance: {
          score: attempt.totalScore,
          maxScore: attempt.totalMarks,
          percentage: Math.round(attempt.percentage * 100) / 100,
          isPassed: attempt.isPassed,
        },
        metrics,
        weakAreas: weakAreas.areas,
        strengths: strengths.areas,
        recommendations,
        failureAnalysis: {
          reason: failureReason,
          failedRounds: attempt.roundResults
            .filter((r) => !r.isPassed)
            .map((r) => r.roundType),
        },
      };
    } catch (error) {
      console.error("Error analyzing attempt:", error);
      throw error;
    }
  }

  /**
   * Calculate performance metrics
   */
  calculateMetrics(attempt) {
    // Accuracy: percentage of correct answers
    let totalQuestions = 0;
    let correctAnswers = 0;

    attempt.roundResults.forEach((r) => {
      totalQuestions += r.totalQuestions;
      correctAnswers += r.correctAnswers;
    });

    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Speed: questions per minute
    const totalTimeSeconds = attempt.roundResults.reduce(
      (sum, r) => sum + (r.timeTaken || 0),
      0
    );
    const totalTimeMinutes = Math.max(totalTimeSeconds / 60, 1);
    const speed = totalQuestions / totalTimeMinutes;

    // Consistency: variance of accuracy across rounds
    const roundPercentages = attempt.roundResults.map((r) => r.percentage);
    const avgPercentage = roundPercentages.reduce((a, b) => a + b, 0) /
      roundPercentages.length || 0;
    const variance = roundPercentages.reduce(
      (sum, p) => sum + Math.pow(p - avgPercentage, 2),
      0
    ) / roundPercentages.length;
    const consistency = Math.max(0, 1 - Math.sqrt(variance) / 100);

    // Time management issues
    const timeManagementIssues = [];
    attempt.roundResults.forEach((r) => {
      if (r.timeRemaining < r.timeTaken * 0.2) {
        timeManagementIssues.push({
          round: r.roundType,
          message: `Time management issue in ${r.roundType} round`,
        });
      }
    });

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      speed: Math.round(speed * 100) / 100,
      consistency: Math.round(consistency * 10000) / 100,
      timeManagementIssues,
    };
  }

  /**
   * Identify weak areas from test performance
   */
  async identifyWeakAreas(attemptId, attempt) {
    try {
      const areas = [];
      const topicWeaknesses = {};
      const commonMistakes = [];

      // Analyze each round
      for (const roundResult of attempt.roundResults) {
        if (roundResult.roundType === "aptitude") {
          const aptitudeAnswers = await prisma.aptitudeAnswer.findMany({
            where: { attemptId },
            include: { question: true },
          });

          // Group by category and analyze
          const categoryAnalysis = this.analyzeAnswersByCategory(
            aptitudeAnswers
          );

          for (const [category, { accuracy, errors }] of Object.entries(
            categoryAnalysis
          )) {
            if (accuracy < 60) {
              areas.push({
                category: "aptitude",
                topic: category,
                severity: accuracy < 30 ? "critical" : "high",
                accuracy,
                errorCount: errors.length,
                commonErrors: errors.slice(0, 3),
              });
              topicWeaknesses[category] = {
                accuracy,
                recommendation: `Review ${category} concepts`,
              };
              commonMistakes.push(
                ...errors
                  .slice(0, 2)
                  .map(
                    (e) =>
                      `Incorrect answer for "${e.question.substring(0, 50)}..."`
                  )
              );
            }
          }
        } else if (roundResult.roundType === "mcq") {
          const mcqAnswers = await prisma.technicalMCQAnswer.findMany({
            where: { attemptId },
            include: { question: true },
          });

          const subjectAnalysis = this.analyzeAnswersBySubject(mcqAnswers);

          for (const [subject, { accuracy, errors }] of Object.entries(
            subjectAnalysis
          )) {
            if (accuracy < 60) {
              areas.push({
                category: "technical_mcq",
                topic: subject,
                subTopic: subject,
                severity: accuracy < 30 ? "critical" : "high",
                accuracy,
                errorCount: errors.length,
              });
              topicWeaknesses[subject.toUpperCase()] = {
                accuracy,
                recommendation: `Strengthen ${subject} concepts`,
              };
            }
          }
        } else if (roundResult.roundType === "coding") {
          const submissions = await prisma.placementCodingSubmission.findMany(
            {
              where: { attemptId },
              include: { codingProblem: { include: { problem: true } } },
            }
          );

          for (const submission of submissions) {
            if (submission.status !== "accepted") {
              const severity = submission.status === "runtime_error" ||
                submission.status === "time_limit_exceeded" ?
                "high" :
                "medium";

              areas.push({
                category: "coding",
                topic: submission.codingProblem.problem.title,
                severity,
                accuracy: (submission.passedTestCases /
                  submission.totalTestCases) *
                  100,
                issue: submission.status,
                suggestion: this.getSuggestionForIssue(submission.status),
              });

              topicWeaknesses[submission.codingProblem.problem.title] = {
                accuracy: (submission.passedTestCases /
                  submission.totalTestCases) *
                  100,
                issue: submission.status,
              };
            }
          }
        }
      }

      return {
        areas,
        topicWeaknesses,
        commonMistakes: [...new Set(commonMistakes)],
      };
    } catch (error) {
      console.error("Error identifying weak areas:", error);
      return {
        areas: [],
        topicWeaknesses: {},
        commonMistakes: [],
      };
    }
  }

  /**
   * Identify strengths from test performance
   */
  async identifyStrengths(attemptId, attempt) {
    try {
      const areas = [];
      const topicStrengths = {};

      // Analyze each round for strengths
      for (const roundResult of attempt.roundResults) {
        if (roundResult.roundType === "aptitude") {
          const aptitudeAnswers = await prisma.aptitudeAnswer.findMany({
            where: { attemptId },
            include: { question: true },
          });

          const categoryAnalysis = this.analyzeAnswersByCategory(
            aptitudeAnswers
          );

          for (const [category, { accuracy }] of Object.entries(
            categoryAnalysis
          )) {
            if (accuracy >= 75) {
              areas.push({
                category: "aptitude",
                topic: category,
                proficiency: accuracy >= 90 ? "expert" : "advanced",
                accuracy,
              });
              topicStrengths[category] = accuracy;
            }
          }
        } else if (roundResult.roundType === "mcq") {
          const mcqAnswers = await prisma.technicalMCQAnswer.findMany({
            where: { attemptId },
            include: { question: true },
          });

          const subjectAnalysis = this.analyzeAnswersBySubject(mcqAnswers);

          for (const [subject, { accuracy }] of Object.entries(
            subjectAnalysis
          )) {
            if (accuracy >= 75) {
              areas.push({
                category: "technical_mcq",
                topic: subject,
                proficiency: accuracy >= 90 ? "expert" : "advanced",
                accuracy,
              });
              topicStrengths[subject.toUpperCase()] = accuracy;
            }
          }
        } else if (roundResult.roundType === "coding") {
          const submissions = await prisma.placementCodingSubmission.findMany(
            {
              where: { attemptId },
              include: { codingProblem: { include: { problem: true } } },
            }
          );

          for (const submission of submissions) {
            if (submission.status === "accepted") {
              areas.push({
                category: "coding",
                topic: submission.codingProblem.problem.title,
                proficiency: "advanced",
                accuracy: 100,
              });
              topicStrengths[submission.codingProblem.problem.title] = 100;
            }
          }
        }
      }

      return {
        areas,
        topicStrengths,
      };
    } catch (error) {
      console.error("Error identifying strengths:", error);
      return {
        areas: [],
        topicStrengths: {},
      };
    }
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(weakAreas, strengths, metrics) {
    const recommendations = {
      focus_areas: [],
      practice_suggestions: [],
      estimated_improvement: 0,
    };

    // Add focus areas based on weak areas
    weakAreas.areas.slice(0, 3).forEach((area) => {
      recommendations.focus_areas.push({
        area: `${area.category}_${area.topic}`,
        severity: area.severity,
        currentAccuracy: area.accuracy,
        targetAccuracy: 75,
        estimatedHours: this.estimateHours(area.accuracy),
      });
    });

    // Add practice suggestions
    if (metrics.accuracy < 70) {
      recommendations.practice_suggestions.push(
        "Solve 5-10 similar problems daily for focused learning"
      );
    }

    if (metrics.speed < 2) {
      recommendations.practice_suggestions.push(
        "Work on problem-solving speed - aim for 2+ problems per minute"
      );
    }

    if (metrics.consistency < 50) {
      recommendations.practice_suggestions.push(
        "Inconsistent performance - take more mock tests to stabilize"
      );
    }

    // Estimate improvement potential
    const improvementPotential = (100 - metrics.accuracy) * 0.6;
    recommendations.estimated_improvement = Math.round(improvementPotential);

    return recommendations;
  }

  /**
   * Estimate hours needed to master a weak area
   */
  estimateHours(currentAccuracy) {
    if (currentAccuracy >= 75) return 0;
    if (currentAccuracy >= 50) return 5;
    if (currentAccuracy >= 25) return 10;
    return 15;
  }

  /**
   * Determine primary failure reason
   */
  determineFailureReason(roundResults) {
    const failedRounds = roundResults.filter((r) => !r.isPassed);

    if (failedRounds.length === 0) {
      return null;
    }

    const failedRound = failedRounds[0];

    if (failedRound.percentage < 30) {
      return "Very low accuracy - Fundamental concepts need strengthening";
    }

    if (failedRound.correctAnswers === 0) {
      return "No correct answers - Preparation is insufficient";
    }

    if (failedRound.skippedAnswers > failedRound.totalQuestions * 0.3) {
      return "Too many skipped questions - Attempt all questions";
    }

    return `Failed in ${failedRound.roundType} round with ${failedRound.percentage}% accuracy`;
  }

  /**
   * Format round analysis
   */
  formatRoundAnalysis(roundResults) {
    const analysis = {};

    roundResults.forEach((r) => {
      analysis[r.roundType] = {
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        status: r.isPassed ? "passed" : "failed",
        correctAnswers: r.correctAnswers,
        wrongAnswers: r.wrongAnswers,
        accuracy: ((r.correctAnswers / r.totalQuestions) * 100) || 0,
        strengths: r.strengths,
        weaknesses: r.weaknesses,
      };
    });

    return analysis;
  }

  /**
   * Analyze answers by category for aptitude
   */
  analyzeAnswersByCategory(answers) {
    const categoryAnalysis = {};

    answers.forEach((answer) => {
      const category = answer.question.category;

      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          correct: 0,
          total: 0,
          errors: [],
          accuracy: 0,
        };
      }

      categoryAnalysis[category].total++;

      if (answer.isCorrect) {
        categoryAnalysis[category].correct++;
      } else {
        categoryAnalysis[category].errors.push(answer.question);
      }
    });

    // Calculate accuracy
    for (const analysis of Object.values(categoryAnalysis)) {
      analysis.accuracy = (analysis.correct / analysis.total) * 100;
    }

    return categoryAnalysis;
  }

  /**
   * Analyze answers by subject for MCQ
   */
  analyzeAnswersBySubject(answers) {
    const subjectAnalysis = {};

    answers.forEach((answer) => {
      const subject = answer.question.subject;

      if (!subjectAnalysis[subject]) {
        subjectAnalysis[subject] = {
          correct: 0,
          total: 0,
          errors: [],
          accuracy: 0,
        };
      }

      subjectAnalysis[subject].total++;

      if (answer.isCorrect) {
        subjectAnalysis[subject].correct++;
      } else {
        subjectAnalysis[subject].errors.push(answer.question);
      }
    });

    // Calculate accuracy
    for (const analysis of Object.values(subjectAnalysis)) {
      analysis.accuracy = (analysis.correct / analysis.total) * 100;
    }

    return subjectAnalysis;
  }

  /**
   * Get suggestion for coding issue
   */
  getSuggestionForIssue(status) {
    const suggestions = {
      "runtime_error":
        "Fix runtime errors - Check for null values and boundary conditions",
      "time_limit_exceeded":
        "Optimize algorithm - Current solution is too slow",
      "wrong_answer":
        "Logic error - Trace through sample inputs and edge cases",
      "compilation_error": "Syntax error - Check code syntax and imports",
    };

    return suggestions[status] || "Review and practice more on this problem";
  }

  /**
   * Update weak area tracking for user
   * Identifies or updates weak areas across tests
   */
  async updateWeakAreaTracking(userId, analysis, testId) {
    try {
      const weakAreas = analysis.weakAreas.areas || [];

      for (const area of weakAreas) {
        const key = {
          userId,
          category: area.category,
          topic: area.topic,
          subTopic: area.subTopic || null,
        };

        // Check if weak area already exists
        const existing = await prisma.userWeakArea.findUnique({
          where: {
            userId_category_topic_subTopic: {
              userId,
              category: area.category,
              topic: area.topic,
              subTopic: area.subTopic || null,
            },
          },
        });

        if (existing) {
          // Update existing weak area
          await prisma.userWeakArea.update({
            where: {
              userId_category_topic_subTopic: {
                userId,
                category: area.category,
                topic: area.topic,
                subTopic: area.subTopic || null,
              },
            },
            data: {
              severity: area.severity,
              accuracy: area.accuracy || existing.accuracy,
              incorrectCount: { increment: area.errorCount || 0 },
              lastOccurrence: new Date(),
            },
          });
        } else {
          // Create new weak area
          await prisma.userWeakArea.create({
            data: {
              userId,
              category: area.category,
              topic: area.topic,
              subTopic: area.subTopic || null,
              severity: area.severity || "medium",
              confidence: 0.8,
              incorrectCount: area.errorCount || 1,
              accuracy: area.accuracy || 0,
              suggestedTopics: [area.topic],
              estimatedTimeToMastery: this.estimateHours(area.accuracy || 0),
            },
          });
        }
      }

      // Update strengths
      const strengthAreas = analysis.strengths.areas || [];

      for (const area of strengthAreas) {
        const existing = await prisma.userStrengthArea.findUnique({
          where: {
            userId_category_topic: {
              userId,
              category: area.category,
              topic: area.topic,
            },
          },
        });

        if (existing) {
          await prisma.userStrengthArea.update({
            where: {
              userId_category_topic: {
                userId,
                category: area.category,
                topic: area.topic,
              },
            },
            data: {
              correctCount: { increment: 1 },
              lastPractice: new Date(),
            },
          });
        } else {
          await prisma.userStrengthArea.create({
            data: {
              userId,
              category: area.category,
              topic: area.topic,
              proficiency: area.proficiency || "intermediate",
              accuracy: area.accuracy || 75,
              correctCount: 1,
              firstMastered: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.error("Error updating weak area tracking:", error);
    }
  }
}

export default PlacementAnalyzer;
