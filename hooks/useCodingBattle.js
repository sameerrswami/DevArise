/**
 * USE CODING BATTLE HOOK
 * 
 * Custom React hook for managing coding battle state and interactions
 * Handles:
 * - Battle lifecycle management
 * - WebSocket communication
 * - Submission tracking
 * - Leaderboard updates
 * - Rate limiting
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

export function useCodingBattle(battleId, userId) {
  // State
  const [battle, setBattle] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(null);

  // References
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const submissionCooldownRef = useRef(0);

  /**
   * Connect to WebSocket
   */
  useEffect(() => {
    if (!battleId || !userId) return;

    const socket = io(
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }
    );

    socket.on('connect', () => {
      console.log('Connected to battle WebSocket');
      setIsConnected(true);

      // Join battle room
      socket.emit('joinBattle', {
        battleId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from battle WebSocket');
      setIsConnected(false);
    });

    socket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data.leaderboard || []);
    });

    socket.on('submissionReceived', (data) => {
      setSubmissions((prev) => [data, ...prev.slice(0, 19)]);
    });

    socket.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [battleId, userId]);

  /**
   * Timer for counting down
   */
  const startTimer = useCallback((startTime, duration) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const updateTime = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(timerRef.current);
      }
    };

    updateTime();
    timerRef.current = setInterval(updateTime, 1000);
  }, []);

  /**
   * Submit code
   */
  const submitCode = useCallback(
    async (code, language) => {
      // Rate limiting
      const now = Date.now();
      if (now - submissionCooldownRef.current < 1000) {
        setError('Please wait before submitting again');
        return false;
      }
      submissionCooldownRef.current = now;

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/battles/${battleId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error);
          return false;
        }

        setLastSubmissionTime(new Date());

        // Emit to WebSocket
        socketRef.current?.emit('codeSubmitted', {
          battleId,
          userId,
          status: data.data.status,
          score: data.data.score,
          problemsSolved: data.data.passedTestCases,
        });

        return true;
      } catch (err) {
        console.error('Submit code error:', err);
        setError('Failed to submit code');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [battleId, userId]
  );

  /**
   * Get current rank
   */
  const getCurrentRank = useCallback(() => {
    const userEntry = leaderboard.find((e) => e.userId === userId);
    return userEntry?.rank || null;
  }, [leaderboard, userId]);

  /**
   * Get current score
   */
  const getCurrentScore = useCallback(() => {
    const userEntry = leaderboard.find((e) => e.userId === userId);
    return userEntry?.score || 0;
  }, [leaderboard, userId]);

  /**
   * Request leaderboard update
   */
  const refreshLeaderboard = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('requestLeaderboardUpdate', { battleId });
    }
  }, [battleId, isConnected]);

  /**
   * Mark user as AFK
   */
  const markAFK = useCallback(
    (isAFK = true) => {
      if (socketRef.current && isConnected) {
        if (isAFK) {
          socketRef.current.emit('userAFK', { battleId, userId });
        } else {
          socketRef.current.emit('userActive', { battleId, userId });
        }
      }
    },
    [battleId, userId, isConnected]
  );

  /**
   * Get submission history
   */
  const getSubmissionHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/battles/${battleId}/submit`);
      const data = await response.json();

      if (data.success) {
        return data.data.submissions;
      }
      return [];
    } catch (err) {
      console.error('Get submissions error:', err);
      return [];
    }
  }, [battleId]);

  return {
    // State
    battle,
    setBattle,
    leaderboard,
    submissions,
    isConnected,
    error,
    setError,
    timeRemaining,
    isSubmitting,
    lastSubmissionTime,

    // Methods
    submitCode,
    startTimer,
    getCurrentRank,
    getCurrentScore,
    refreshLeaderboard,
    markAFK,
    getSubmissionHistory,
  };
}

export default useCodingBattle;
