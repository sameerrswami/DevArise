/**
 * BATTLE WEBSOCKET HANDLER
 * 
 * Real-time bidirectional communication for:
 * - Live leaderboard updates
 * - Participant join/leave notifications
 * - Submission notifications
 * - Battle status changes
 * - Countdown timer synchronization
 */

import { Server } from "socket.io";
import { prisma } from "./prisma";
import { BattleOrchestrator } from "./battle-orchestrator";

const orchestrator = new BattleOrchestrator();

// Store active battle rooms
const activeBattles = new Map();

/**
 * Initialize WebSocket server
 */
export function initializeBattleWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  /**
   * Connection handler
   */
  io.on("connection", (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);

    /**
     * Join battle room
     */
    socket.on("joinBattle", async (data) => {
      try {
        const { battleId, userId, userName } = data;

        if (!battleId || !userId) {
          socket.emit("error", { message: "Missing battleId or userId" });
          return;
        }

        // Join socket.io room
        socket.join(`battle:${battleId}`);

        // Store participant info
        if (!activeBattles.has(battleId)) {
          activeBattles.set(battleId, new Set());
        }
        activeBattles.get(battleId).add(userId);

        // Get current leaderboard
        const leaderboard = await orchestrator.getLiveLeaderboard(battleId);

        // Notify all participants in battle
        io.to(`battle:${battleId}`).emit("participantJoined", {
          userId,
          userName,
          timestamp: new Date(),
          totalParticipants: activeBattles.get(battleId).size,
        });

        // Send current leaderboard to newly joined participant
        socket.emit("leaderboardUpdate", {
          battleId,
          leaderboard: leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId,
            userName: entry.user?.name,
            score: entry.currentScore,
            problemsSolved: entry.problemsSolved,
            submissionCount: entry.totalSubmissions,
          })),
          timestamp: new Date(),
        });

        console.log(
          `User ${userId} joined battle ${battleId}. Active: ${activeBattles.get(battleId).size}`
        );
      } catch (error) {
        console.error("joinBattle error:", error);
        socket.emit("error", { message: "Failed to join battle" });
      }
    });

    /**
     * Submit code (notify others)
     */
    socket.on("codeSubmitted", async (data) => {
      try {
        const { battleId, userId, userName, status, score, problems } = data;

        if (!battleId || !userId) {
          socket.emit("error", { message: "Missing battleId or userId" });
          return;
        }

        // Get updated leaderboard
        const leaderboard = await orchestrator.getLiveLeaderboard(battleId);

        // Broadcast to all participants in battle
        io.to(`battle:${battleId}`).emit("submissionReceived", {
          battleId,
          userId,
          userName,
          status,
          score,
          problemsSolved: problems,
          timestamp: new Date(),
        });

        // Send updated leaderboard to all
        io.to(`battle:${battleId}`).emit("leaderboardUpdate", {
          battleId,
          leaderboard: leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId,
            userName: entry.user?.name,
            score: entry.currentScore,
            problemsSolved: entry.problemsSolved,
            submissionCount: entry.totalSubmissions,
            isAFK: entry.isAFK,
          })),
          timestamp: new Date(),
        });

        console.log(`Submission from ${userName} in battle ${battleId}`);
      } catch (error) {
        console.error("codeSubmitted error:", error);
        socket.emit("error", { message: "Failed to process submission" });
      }
    });

    /**
     * Battle start notification
     */
    socket.on("battleStarted", (data) => {
      try {
        const { battleId, startTime, timeLimit } = data;

        if (!battleId) {
          socket.emit("error", { message: "Missing battleId" });
          return;
        }

        // Broadcast battle start to all participants
        io.to(`battle:${battleId}`).emit("battleStarted", {
          battleId,
          startTime: new Date(startTime),
          timeLimit,
          message: "Battle has started!",
        });

        console.log(`Battle ${battleId} started`);
      } catch (error) {
        console.error("battleStarted error:", error);
        socket.emit("error", { message: "Failed to start battle" });
      }
    });

    /**
     * Time warning (30s, 10s, 5s remaining)
     */
    socket.on("timeWarning", (data) => {
      try {
        const { battleId, totalTimeRemaining } = data;

        if (!battleId) {
          socket.emit("error", { message: "Missing battleId" });
          return;
        }

        // Broadcast time warning
        io.to(`battle:${battleId}`).emit("timeWarning", {
          battleId,
          secondsRemaining: totalTimeRemaining,
          message:
            totalTimeRemaining === 30
              ? "30 seconds remaining!"
              : totalTimeRemaining === 10
              ? "10 seconds remaining!"
              : "5 seconds remaining!",
        });

        console.log(
          `Time warning for battle ${battleId}: ${totalTimeRemaining}s`
        );
      } catch (error) {
        console.error("timeWarning error:", error);
      }
    });

    /**
     * Battle end notification
     */
    socket.on("battleEnded", async (data) => {
      try {
        const { battleId, reason } = data;

        if (!battleId) {
          socket.emit("error", { message: "Missing battleId" });
          return;
        }

        // Get final results
        const results = await prisma.battleResult.findMany({
          where: { battleId },
          orderBy: { rank: "asc" },
          include: {
            participant: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        });

        // Broadcast battle end with results
        io.to(`battle:${battleId}`).emit("battleEnded", {
          battleId,
          reason: reason || "Time limit reached",
          results: results.map((r) => ({
            rank: r.rank,
            userName: r.participant?.user?.name,
            score: r.score,
            ratingChange: r.ratingChange,
          })),
          timestamp: new Date(),
        });

        // Clean up battle from active list
        activeBattles.delete(battleId);

        console.log(`Battle ${battleId} ended - ${reason}`);
      } catch (error) {
        console.error("battleEnded error:", error);
        socket.emit("error", { message: "Failed to end battle" });
      }
    });

    /**
     * User marked as AFK
     */
    socket.on("userAFK", (data) => {
      try {
        const { battleId, userId, userName } = data;

        if (!battleId || !userId) {
          socket.emit("error", { message: "Missing battleId or userId" });
          return;
        }

        // Broadcast AFK status
        io.to(`battle:${battleId}`).emit("userAFKStatus", {
          battleId,
          userId,
          userName,
          isAFK: true,
          timestamp: new Date(),
        });

        console.log(`User ${userName} marked AFK in battle ${battleId}`);
      } catch (error) {
        console.error("userAFK error:", error);
      }
    });

    /**
     * User returned from AFK
     */
    socket.on("userActive", (data) => {
      try {
        const { battleId, userId, userName } = data;

        if (!battleId || !userId) {
          socket.emit("error", { message: "Missing battleId or userId" });
          return;
        }

        // Broadcast active status
        io.to(`battle:${battleId}`).emit("userAFKStatus", {
          battleId,
          userId,
          userName,
          isAFK: false,
          timestamp: new Date(),
        });

        console.log(`User ${userName} returned in battle ${battleId}`);
      } catch (error) {
        console.error("userActive error:", error);
      }
    });

    /**
     * Manual leaderboard refresh request
     */
    socket.on("requestLeaderboardUpdate", async (data) => {
      try {
        const { battleId } = data;

        if (!battleId) {
          socket.emit("error", { message: "Missing battleId" });
          return;
        }

        // Get fresh leaderboard
        const leaderboard = await orchestrator.getLiveLeaderboard(battleId);

        // Send to requesting socket only
        socket.emit("leaderboardUpdate", {
          battleId,
          leaderboard: leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId,
            userName: entry.user?.name,
            score: entry.currentScore,
            problemsSolved: entry.problemsSolved,
            submissionCount: entry.totalSubmissions,
            isAFK: entry.isAFK,
          })),
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("requestLeaderboardUpdate error:", error);
        socket.emit("error", { message: "Failed to get leaderboard" });
      }
    });

    /**
     * Disconnect handler
     */
    socket.on("disconnect", () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);

      // Clean up active battles
      for (const [battleId, users] of activeBattles.entries()) {
        if (users.size === 0) {
          activeBattles.delete(battleId);
        }
      }
    });

    /**
     * Error handler
     */
    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      socket.emit("error", { message: "WebSocket error occurred" });
    });
  });

  return io;
}

/**
 * Broadcast leaderboard update to all participants
 */
export async function broadcastLeaderboardUpdate(io, battleId) {
  try {
    const leaderboard = await orchestrator.getLiveLeaderboard(battleId);

    io.to(`battle:${battleId}`).emit("leaderboardUpdate", {
      battleId,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        userName: entry.user?.name,
        score: entry.currentScore,
        problemsSolved: entry.problemsSolved,
        submissionCount: entry.totalSubmissions,
      })),
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error broadcasting leaderboard update:", error);
  }
}

/**
 * Broadcast battle event to all participants
 */
export function broadcastBattleEvent(io, battleId, eventType, data) {
  try {
    io.to(`battle:${battleId}`).emit(eventType, {
      battleId,
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error broadcasting battle event:", error);
  }
}

export default { initializeBattleWebSocket, broadcastLeaderboardUpdate, broadcastBattleEvent };
