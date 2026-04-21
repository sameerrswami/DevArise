/**
 * PLACEMENT TEST INTERFACE COMPONENT
 * 
 * Main container for placement test experience
 * Manages test state, round navigation, timer, and progress
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Clock, ChevronRight } from "lucide-react";
import AptitudeRound from "./rounds/AptitudeRound";
import TechnicalMCQRound from "./rounds/TechnicalMCQRound";
import CodingRound from "./rounds/CodingRound";
import InterviewRound from "./rounds/InterviewRound";
import PlacementTestResults from "./PlacementTestResults";
import { usePlacementTest } from "@/hooks/usePlacementTest";

export default function PlacementTestInterface({ testId }) {
  const {
    attempt,
    test,
    loading,
    error,
    startTest,
    submitRound,
    pauseTest,
    resumeTest,
    abandonTest,
  } = usePlacementTest(testId);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Initialize test on mount
  useEffect(() => {
    if (!attempt && !loading) {
      startTest();
    }
  }, [attempt, loading, startTest]);

  // Timer effect
  useEffect(() => {
    if (!attempt || attempt.status !== "in-progress") {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) {
          return attempt.test?.totalDuration;
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt]);

  // Handle timeout
  useEffect(() => {
    if (timeRemaining === 0 && attempt?.status === "in-progress") {
      handleTimeOut();
    }
  }, [timeRemaining, attempt]);

  const handleTimeOut = async () => {
    await submitRound({
      roundNumber: attempt.currentRound,
      responses: [],
      isTimeout: true,
    });
  };

  const handleRoundSubmit = async (responses) => {
    try {
      await submitRound({
        roundNumber: attempt.currentRound,
        responses,
      });
    } catch (err) {
      console.error("Error submitting round:", err);
    }
  };

  const handlePauseTest = async () => {
    await pauseTest();
    setShowConfirmDialog(false);
  };

  const handleAbandonTest = async () => {
    if (
      window.confirm(
        "Are you sure you want to abandon this test? Your progress will not be saved."
      )
    ) {
      await abandonTest();
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "00:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Test completed
  if (attempt?.status === "completed") {
    return <PlacementTestResults attemptId={attempt.id} testId={testId} />;
  }

  // Test not started
  if (!attempt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Start Placement Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              You are about to start a multi-round placement test. This test
              includes aptitude, technical questions, coding challenges, and an
              AI interview round.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Test Details</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Total Duration: {test?.totalDuration / 60} minutes</li>
                <li>• Total Rounds: {test?.roundCount || 4}</li>
                <li>• Passing Percentage: {test?.passingPercentage || 70}%</li>
              </ul>
            </div>
            <Button
              onClick={startTest}
              size="lg"
              className="w-full"
              disabled={loading}
            >
              Start Test
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Test in progress
  return (
    <div className="space-y-4">
      {/* Test Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{test?.title || "Placement Test"}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                <span
                  className={
                    timeRemaining < 300
                      ? "text-red-600"
                      : "text-gray-700"
                  }
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseTest}
              >
                Pause
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleAbandonTest}
              >
                Abandon
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Round {attempt.currentRound} of {test?.roundCount || 4}
              </span>
              <span>
                {attempt.totalScore || 0}/{attempt.totalMarks || 0} points
              </span>
            </div>
            <Progress
              value={
                ((attempt.currentRound - 1) / (test?.roundCount || 4)) * 100
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Round Component */}
      <div>
        {attempt.currentRound <= test?.roundCount && (
          <RoundRenderer
            round={attempt.currentRound}
            currentRound={attempt.currentRound}
            roundData={attempt.nextRound}
            onSubmit={handleRoundSubmit}
            isLastRound={attempt.currentRound === test?.roundCount}
          />
        )}
      </div>

      {/* Time warning */}
      {timeRemaining < 300 && timeRemaining > 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Time is running out! {formatTime(timeRemaining)} remaining.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Round Renderer - Selects appropriate component based on round type
 */

function RoundRenderer({ round, currentRound, roundData, onSubmit, isLastRound }) {
  if (!roundData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-600">Loading round...</p>
        </CardContent>
      </Card>
    );
  }

  const { type, title, instructions, content, duration } = roundData;

  const baseProps = {
    title,
    instructions,
    duration,
    roundNumber: currentRound,
    onSubmit,
    isLastRound,
  };

  switch (type.toLowerCase()) {
    case "aptitude":
      return <AptitudeRound {...baseProps} questions={content} />;

    case "mcq":
      return <TechnicalMCQRound {...baseProps} questions={content} />;

    case "coding":
      return <CodingRound {...baseProps} problems={content} />;

    case "interview":
      return <InterviewRound {...baseProps} setupData={content} />;

    default:
      return (
        <Alert variant="destructive">
          <AlertDescription>Unknown round type: {type}</AlertDescription>
        </Alert>
      );
  }
}
