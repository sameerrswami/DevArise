/**
 * PLACEMENT TEST EVALUATORS
 * 
 * Handles round-specific evaluation and scoring:
 * 1. Aptitude Test Evaluator
 * 2. Technical MCQ Evaluator
 * 3. Coding Round Evaluator
 * 4. AI Interview Evaluator
 * 
 * Provides detailed scoring, feedback generation, and error analysis
 */

import { prisma } from "./prisma";

export class PlacementEvaluators {
  /**
   * Score Aptitude Round
   * Evaluates logical reasoning, quantitative, and verbal ability questions
   */
  async scoreAptitudeRound(attemptId, round, responses) {
    try {
      let totalScore = 0;
      let maxScore = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      const topicScores = {};
      const topicErrors = {};

      // Process each response
      for (const response of responses) {
        const { questionId, selectedAnswer, timeTaken } = response;

        // Fetch question
        const question = await prisma.aptitudeQuestion.findUnique({
          where: { id: questionId },
        });

        if (!question) {
          continue;
        }

        maxScore += question.marks;

        // Create answer record
        const isCorrect = selectedAnswer === question.correctAnswer;
        const answer = await prisma.aptitudeAnswer.create({
          data: {
            questionId,
            attemptId,
            selectedAnswer,
            isCorrect,
            timeTaken,
          },
        });

        // Update statistics
        if (selectedAnswer === -1 || selectedAnswer === null) {
          skippedCount++;
        } else if (isCorrect) {
          correctCount++;
          totalScore += question.marks;
        } else {
          wrongCount++;
        }

        // Track by category
        if (!topicScores[question.category]) {
          topicScores[question.category] = { correct: 0, total: 0 };
          topicErrors[question.category] = [];
        }
        topicScores[question.category].total++;
        if (isCorrect) {
          topicScores[question.category].correct++;
        } else if (selectedAnswer !== -1 && selectedAnswer !== null) {
          topicErrors[question.category].push({
            question: question.question,
            selectedAnswer: question.options[selectedAnswer],
            correctAnswer: question.options[question.correctAnswer],
          });
        }

        // Update question analytics
        if (isCorrect) {
          await prisma.aptitudeQuestion.update({
            where: { id: questionId },
            data: { correctAttempts: { increment: 1 } },
          });
        } else if (selectedAnswer !== -1 && selectedAnswer !== null) {
          await prisma.aptitudeQuestion.update({
            where: { id: questionId },
            data: { wrongAttempts: { increment: 1 } },
          });
        } else {
          await prisma.aptitudeQuestion.update({
            where: { id: questionId },
            data: { skippedAttempts: { increment: 1 } },
          });
        }
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      // Generate feedback
      const strengths = [];
      const weaknesses = [];
      const recommendations = [];

      for (const [category, scores] of Object.entries(topicScores)) {
        const acc = (scores.correct / scores.total) * 100;
        if (acc >= 75) {
          strengths.push(
            `Good understanding of ${category} (${scores.correct}/${scores.total})`
          );
        } else if (acc < 50) {
          weaknesses.push(
            `Struggling with ${category} (${scores.correct}/${scores.total})`
          );
          recommendations.push(`Practice more ${category} questions`);
        }
      }

      // Check time management issues
      const avgTime = responses.reduce((sum, r) => sum + r.timeTaken, 0) /
        responses.length || 0;
      const roundDuration = round.duration / responses.length || 0;
      if (avgTime > roundDuration * 1.2) {
        recommendations.push(
          "Work on improving speed - manage time better during exam"
        );
      }

      return {
        score: totalScore,
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        skippedAnswers: skippedCount,
        totalQuestions: responses.length,
        timeTaken: responses.reduce((sum, r) => sum + r.timeTaken, 0),
        timeRemaining: Math.max(0, round.duration -
          (responses.reduce((sum, r) => sum + r.timeTaken, 0))),
        strengths,
        weaknesses,
        recommendations,
      };
    } catch (error) {
      console.error("Error scoring aptitude round:", error);
      throw error;
    }
  }

  /**
   * Score Technical MCQ Round
   * Evaluates multiple choice questions on DBMS, OS, Networks, Algorithms, OOPS
   */
  async scoreMCQRound(attemptId, round, responses) {
    try {
      let totalScore = 0;
      let maxScore = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      const subjectScores = {};
      const subjectErrors = {};

      for (const response of responses) {
        const { questionId, selectedAnswer, timeTaken } = response;

        const question = await prisma.technicalMCQQuestion.findUnique({
          where: { id: questionId },
        });

        if (!question) {
          continue;
        }

        maxScore += question.marks;

        const isCorrect = selectedAnswer === question.correctAnswer;

        // Create answer record
        await prisma.technicalMCQAnswer.create({
          data: {
            questionId,
            attemptId,
            selectedAnswer,
            isCorrect,
            timeTaken,
          },
        });

        // Calculate negativeMarking if applicable
        let scoreAdjustment = 0;
        if (!isCorrect && selectedAnswer !== -1 && selectedAnswer !== null) {
          if (round.allowNegativeMarking) {
            scoreAdjustment = -question.marks * round.negativeMarks;
          }
          wrongCount++;
        } else if (selectedAnswer === -1 || selectedAnswer === null) {
          skippedCount++;
        } else {
          correctCount++;
          scoreAdjustment = question.marks;
        }

        totalScore += scoreAdjustment;

        // Track by subject
        if (!subjectScores[question.subject]) {
          subjectScores[question.subject] = { correct: 0, total: 0, score: 0 };
          subjectErrors[question.subject] = [];
        }
        subjectScores[question.subject].total++;
        subjectScores[question.subject].score += scoreAdjustment;
        if (isCorrect) {
          subjectScores[question.subject].correct++;
        } else if (selectedAnswer !== -1 && selectedAnswer !== null) {
          subjectErrors[question.subject].push({
            topic: question.subject,
            question: question.question.substring(0, 100),
            selectedAnswer: question.options[selectedAnswer],
            correctAnswer: question.options[question.correctAnswer],
          });
        }

        // Update question analytics
        if (isCorrect) {
          await prisma.technicalMCQQuestion.update({
            where: { id: questionId },
            data: { correctAttempts: { increment: 1 } },
          });
        } else if (selectedAnswer !== -1 && selectedAnswer !== null) {
          await prisma.technicalMCQQuestion.update({
            where: { id: questionId },
            data: { wrongAttempts: { increment: 1 } },
          });
        } else {
          await prisma.technicalMCQQuestion.update({
            where: { id: questionId },
            data: { skippedAttempts: { increment: 1 } },
          });
        }
      }

      totalScore = Math.max(0, totalScore);
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      // Generate feedback
      const strengths = [];
      const weaknesses = [];
      const recommendations = [];

      for (const [subject, scores] of Object.entries(subjectScores)) {
        const acc = (scores.correct / scores.total) * 100;
        if (acc >= 75) {
          strengths.push(
            `Strong in ${subject.toUpperCase()} (${scores.correct}/${scores.total} correct)`
          );
        } else if (acc < 50) {
          weaknesses.push(
            `Weak in ${subject.toUpperCase()} (${scores.correct}/${scores.total} correct)`
          );
          recommendations.push(`Review ${subject.toUpperCase()} concepts and practice similar problems`);
        }
      }

      if (skippedCount > responses.length * 0.1) {
        recommendations.push(
          "Avoid skipping too many questions - attempt all even if unsure"
        );
      }

      return {
        score: Math.floor(totalScore),
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        skippedAnswers: skippedCount,
        totalQuestions: responses.length,
        timeTaken: responses.reduce((sum, r) => sum + r.timeTaken, 0),
        strengths,
        weaknesses,
        recommendations,
        subjectWiseAnalysis: subjectScores,
      };
    } catch (error) {
      console.error("Error scoring MCQ round:", error);
      throw error;
    }
  }

  /**
   * Score Coding Round
   * Evaluates code submissions against test cases
   */
  async scoreCodingRound(attemptId, round, responses) {
    try {
      let totalScore = 0;
      let maxScore = 0;
      let partialScore = 0;
      let perfectSolutions = 0;
      const problemScores = [];
      const commonIssues = [];

      for (const response of responses) {
        const { codingProblemId, code, language } = response;

        const coding = await prisma.placementTestCodingProblem.findUnique({
          where: { id: codingProblemId },
          include: { problem: true },
        });

        if (!coding) {
          continue;
        }

        maxScore += coding.marks;

        // Execute code and get results
        const executionResult = await this.executeCodingSubmission(
          code,
          language,
          coding.problem
        );

        // Create submission record
        const submission = await prisma.placementCodingSubmission.create({
          data: {
            codingProblemId,
            attemptId,
            code,
            language,
            status: executionResult.status,
            score: executionResult.score,
            passedTestCases: executionResult.passedTestCases,
            totalTestCases: executionResult.totalTestCases,
            accuracy: (executionResult.passedTestCases /
              executionResult.totalTestCases) *
              100,
            errorMessage: executionResult.errorMessage,
            executionTime: executionResult.executionTime,
            executionMemory: executionResult.executionMemory,
            submittedAt: new Date(),
            timeTaken: response.timeTaken || 0,
          },
        });

        totalScore += executionResult.score;
        if (executionResult.status === "accepted") {
          perfectSolutions++;
        } else if (executionResult.passedTestCases > 0) {
          partialScore++;
        }

        // Track issues
        if (executionResult.status === "runtime_error") {
          commonIssues.push("Runtime errors - Check input constraints");
        } else if (executionResult.status === "time_limit_exceeded") {
          commonIssues.push(
            "Time limit exceeded - Optimize algorithm complexity"
          );
        } else if (executionResult.status === "wrong_answer") {
          commonIssues.push("Wrong answer - Verify logic with sample inputs");
        }

        // Update problem analytics
        await prisma.placementTestCodingProblem.update({
          where: { id: codingProblemId },
          data: {
            correctSubmissions:
              executionResult.status === "accepted" ?
              { increment: 1 } :
              undefined,
            wrongSubmissions:
              executionResult.status !== "accepted" ?
              { increment: 1 } :
              undefined,
          },
        });

        problemScores.push({
          problem: coding.problem.title,
          difficulty: coding.problem.difficulty,
          status: executionResult.status,
          score: executionResult.score,
          maxScore: coding.marks,
          passedTestCases: executionResult.passedTestCases,
          totalTestCases: executionResult.totalTestCases,
        });
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      return {
        score: totalScore,
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        perfectSolutions,
        partialSolutions: partialScore,
        totalProblems: responses.length,
        strengths: [
          perfectSolutions > 0 ?
          `Solved ${perfectSolutions} out of ${responses.length} problems` :
          "No perfect solutions yet - Keep practicing",
        ],
        weaknesses: commonIssues.length > 0 ?
          commonIssues :
          ["Overall performance needs improvement"],
        recommendations: [
          "Review algorithmic approaches for failed problems",
          "Practice similar difficulty problems on platforms like LeetCode",
          "Focus on edge cases and input constraints",
        ],
        problemWiseAnalysis: problemScores,
      };
    } catch (error) {
      console.error("Error scoring coding round:", error);
      throw error;
    }
  }

  /**
   * Execute a coding submission
   * Simulates code execution against test cases
   */
  async executeCodingSubmission(code, language, problem) {
    try {
      // This is a placeholder - real implementation would use:
      // - Docker containers for sandboxed execution
      // - Judge0 API or similar service
      // - Custom code runner

      // For now, return mock result
      const testCases = JSON.parse(problem.examples || "[]");
      const passedTestCases = Math.floor(testCases.length * 0.7);

      return {
        status: passedTestCases === testCases.length ? "accepted" : "wrong_answer",
        score: passedTestCases > 0 ? 5 : 0,
        passedTestCases,
        totalTestCases: testCases.length || 1,
        errorMessage: null,
        executionTime: Math.random() * 500,
        executionMemory: Math.random() * 50,
      };
    } catch (error) {
      return {
        status: "runtime_error",
        score: 0,
        passedTestCases: 0,
        totalTestCases: 1,
        errorMessage: error.message,
        executionTime: null,
        executionMemory: null,
      };
    }
  }

  /**
   * Score Interview Round
   * Integrates with existing MockInterview system
   */
  async scoreInterviewRound(attemptId, round, responses) {
    try {
      // This integrates with the existing MockInterview system
      // The interview responses contain mockId references

      const strengths = [];
      const weaknesses = [];
      const recommendations = [];
      let totalScore = 0;
      let maxScore = 0;

      for (const response of responses) {
        const { mockId } = response;

        // Fetch mock interview results
        const mockInterview = await prisma.mockInterview.findUnique({
          where: { mockId },
          include: { userAnswers: true },
        });

        if (!mockInterview) {
          continue;
        }

        maxScore += 100;

        // Parse feedback if available
        const feedback = JSON.parse(mockInterview.summaryFeedback || "{}");
        const score = feedback.overallScore || 0;
        totalScore += score;

        // Extract insights
        if (feedback.strengths) {
          strengths.push(...feedback.strengths.slice(0, 2));
        }
        if (feedback.improvements) {
          weaknesses.push(...feedback.improvements.slice(0, 2));
        }
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      // Add generic recommendations
      recommendations.push(
        "Practice answering behavioral questions with STAR method"
      );
      recommendations.push(
        "Improve communication skills - Explain your thoughts clearly"
      );
      recommendations.push("Mock more interviews to build confidence");

      return {
        score: Math.floor(totalScore),
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        strengths: strengths.length > 0 ?
          strengths :
          ["Good communication"],
        weaknesses: weaknesses.length > 0 ?
          weaknesses :
          ["Needs improvement in technical explanation"],
        recommendations,
      };
    } catch (error) {
      console.error("Error scoring interview round:", error);
      throw error;
    }
  }
}

export default PlacementEvaluators;
