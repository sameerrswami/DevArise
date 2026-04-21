/**
 * usePlacementTest HOOK
 * 
 * Custom hook to manage placement test state and API interactions
 */

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

export function usePlacementTest(testId) {
  const { data: session } = useSession();

  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startTest = useCallback(async () => {
    if (!session) {
      setError("Please sign in to start the test");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/placement-tests/${testId}/start`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Failed to start test");
      }

      const data = await response.json();

      if (data.success) {
        setAttempt(data.data.attemptId);
        setTest(data.data.test);
        // Initialize attempt data
        setAttempt({
          id: data.data.attemptId,
          test: data.data.test,
          currentRound: 1,
          totalScore: 0,
          totalMarks: 0,
          status: "in-progress",
          nextRound: data.data.currentRound,
        });
      } else {
        setError(data.error || "Failed to start test");
      }
    } catch (err) {
      console.error("Error starting test:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [session, testId]);

  const submitRound = useCallback(
    async (roundData) => {
      if (!attempt) {
        setError("No active attempt");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/placement-tests/${testId}/submit-round`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attemptId: attempt.id,
              roundNumber: roundData.roundNumber,
              responses: roundData.responses,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to submit round");
        }

        const data = await response.json();

        if (data.success) {
          const result = data.data;

          if (result.status === "completed") {
            // Test completed
            setAttempt((prev) => ({
              ...prev,
              status: "completed",
            }));
          } else if (result.status === "proceed") {
            // Move to next round
            setAttempt((prev) => ({
              ...prev,
              currentRound: prev.currentRound + 1,
              totalScore: result.currentRoundResult.score,
              totalMarks: result.currentRoundResult.maxScore,
              nextRound: result.nextRound,
            }));
          } else if (result.status === "failed") {
            // Test failed at this round
            setAttempt((prev) => ({
              ...prev,
              status: "completed",
            }));
          }
        } else {
          setError(data.error || "Failed to submit round");
        }
      } catch (err) {
        console.error("Error submitting round:", err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [testId, attempt]
  );

  const pauseTest = useCallback(async () => {
    if (!attempt) return;

    try {
      const response = await fetch(
        `/api/placement-tests/${testId}/attempt?attemptId=${attempt.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pause" }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setAttempt((prev) => ({
          ...prev,
          status: "paused",
        }));
      }
    } catch (err) {
      console.error("Error pausing test:", err);
      setError(err.message || "Failed to pause test");
    }
  }, [testId, attempt]);

  const resumeTest = useCallback(async () => {
    if (!attempt) return;

    try {
      const response = await fetch(
        `/api/placement-tests/${testId}/attempt?attemptId=${attempt.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume" }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setAttempt((prev) => ({
          ...prev,
          status: "in-progress",
        }));
      }
    } catch (err) {
      console.error("Error resuming test:", err);
      setError(err.message || "Failed to resume test");
    }
  }, [testId, attempt]);

  const abandonTest = useCallback(async () => {
    if (!attempt) return;

    try {
      const response = await fetch(
        `/api/placement-tests/${testId}/attempt?attemptId=${attempt.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "abandon" }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setAttempt((prev) => ({
          ...prev,
          status: "abandoned",
        }));
      }
    } catch (err) {
      console.error("Error abandoning test:", err);
      setError(err.message || "Failed to abandon test");
    }
  }, [testId, attempt]);

  return {
    attempt,
    test,
    loading,
    error,
    startTest,
    submitRound,
    pauseTest,
    resumeTest,
    abandonTest,
  };
}
