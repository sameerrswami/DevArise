import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// Normalize code for plagiarism detection (remove comments, whitespace, etc.)
function normalizeCode(code) {
  return code
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/#.*$/gm, '') // Remove Python comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1') // Remove spaces around operators
    .trim()
    .toLowerCase();
}

// Generate hash for code
function generateCodeHash(code) {
  const normalized = normalizeCode(code);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// POST /api/contests/submission - Submit solution for a contest problem
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contestId, problemId, code, language } = await req.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify contest exists and is active
    const contest = await prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (contest.status !== "active") {
      return NextResponse.json({ error: "Contest is not active" }, { status: 400 });
    }

    // Check if contest has ended
    const now = new Date();
    if (now > contest.endsAt) {
      return NextResponse.json({ error: "Contest has ended" }, { status: 400 });
    }

    // Get contest entry
    let entry = await prisma.contestEntry.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId: user.id
        }
      }
    });

    if (!entry) {
      return NextResponse.json({ error: "You are not registered for this contest" }, { status: 403 });
    }

    // Verify problem is part of the contest
    const contestProblem = await prisma.contestProblem.findFirst({
      where: {
        contestId,
        problemId
      },
      include: {
        problem: true
      }
    });

    if (!contestProblem) {
      return NextResponse.json({ error: "Problem not found in this contest" }, { status: 404 });
    }

    // Generate code hash for plagiarism detection
    const codeHash = generateCodeHash(code);

    // Check for plagiarism - compare with other submissions in this contest
    const similarSubmissions = await prisma.codeSubmission.findMany({
      where: {
        problemId,
        contestId,
        codeHash: codeHash
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    let flaggedForPlagiarism = false;
    let similarityScore = 0;
    let similarTo = null;

    if (similarSubmissions.length > 0) {
      // Exact code match found - flag for plagiarism
      flaggedForPlagiarism = true;
      similarityScore = 1.0;
      similarTo = similarSubmissions[0].id;
    }

    // Create main submission
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        problemId,
        code,
        language,
        status: "pending"
      }
    });

    // Store code for plagiarism detection
    const codeSubmission = await prisma.codeSubmission.create({
      data: {
        userId: user.id,
        problemId,
        contestId,
        code,
        language,
        codeHash,
        flaggedForReview: flaggedForPlagiarism,
        similarityScore,
        similarTo
      }
    });

    // Count previous attempts for this problem in this contest
    const previousAttempts = await prisma.contestSubmission.count({
      where: {
        entryId: entry.id,
        problemId
      }
    });

    // Create contest submission record
    const contestSubmission = await prisma.contestSubmission.create({
      data: {
        entryId: entry.id,
        submissionId: submission.id,
        problemId,
        accepted: false,
        penalty: previousAttempts,
        attempts: previousAttempts + 1
      },
      include: {
        entry: true
      }
    });

    // Simulate code evaluation (in production, this would call a judge system)
    // For now, we'll mark it as accepted for demo purposes
    const isAccepted = true; // This would be determined by running test cases
    
    if (isAccepted) {
      // Update contest submission
      await prisma.contestSubmission.update({
        where: { id: contestSubmission.id },
        data: {
          accepted: true,
          solvedAt: new Date(),
          timeTaken: Date.now() - new Date(contestSubmission.createdAt).getTime()
        }
      });

      // Update submission status
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "accepted"
        }
      });

      // Update entry score
      const timeBonus = Math.max(0, 300 - Math.floor((Date.now() - new Date(contest.startsAt).getTime()) / 60000));
      const pointsEarned = contestProblem.points + timeBonus;
      
      await prisma.contestEntry.update({
        where: { id: entry.id },
        data: {
          score: { increment: pointsEarned },
          problemsSolved: { increment: 1 },
          totalPenalty: { increment: previousAttempts }
        }
      });

      // Update user stats
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalProblemsSolved: { increment: 1 },
          points: { increment: pointsEarned }
        }
      });
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: contestSubmission.id,
        status: isAccepted ? "accepted" : "pending",
        pointsEarned: isAccepted ? contestProblem.points : 0,
        penalty: previousAttempts,
        flaggedForPlagiarism
      },
      message: isAccepted ? "Solution accepted!" : "Solution submitted for evaluation"
    });
  } catch (error) {
    console.error("Contest Submission Error:", error);
    return NextResponse.json({ error: "Failed to submit solution" }, { status: 500 });
  }
}

// GET /api/contests/submission - Get submission status
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("id");

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID required" }, { status: 400 });
    }

    const submission = await prisma.contestSubmission.findUnique({
      where: { id: submissionId },
      include: {
        submission: true,
        entry: {
          include: {
            contest: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        status: submission.accepted ? "accepted" : "pending",
        accepted: submission.accepted,
        penalty: submission.penalty,
        attempts: submission.attempts,
        solvedAt: submission.solvedAt,
        flaggedForPlagiarism: submission.flaggedForPlagiarism
      }
    });
  } catch (error) {
    console.error("Get Submission Error:", error);
    return NextResponse.json({ error: "Failed to get submission" }, { status: 500 });
  }
}
