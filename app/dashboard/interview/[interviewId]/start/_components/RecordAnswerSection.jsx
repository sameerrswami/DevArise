"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { evaluateInterviewAnswer } from "@/utils/GeminiAIModal.js";
import { BehavioralAIService } from "@/lib/services/behavioral-ai";

function RecordAnswerSection({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const {
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    results?.forEach((result) => {
      setUserAnswer((prevAns) => prevAns + " " + result.transcript);
    });
  }, [results]);

  useEffect(() => {
    setUserAnswer("");
    setAnswerSubmitted(false);
    setResults([]);
  }, [activeQuestionIndex, setResults]);

  const StartStopRecording = async () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      setUserAnswer("");
      setAnswerSubmitted(false);
      startSpeechToText();
    }
  };

  const handleSubmitAnswer = async () => {
    if (userAnswer.trim().length < 10) {
      toast("Please provide a longer answer (at least 10 characters)");
      return;
    }
    await UpdateUserAnswer();
  };

  const UpdateUserAnswer = async () => {
    setLoading(true);
    try {
      // 1. Technical Evaluation (Gemini)
      const feedback = await evaluateInterviewAnswer({
        question: mockInterviewQuestion[activeQuestionIndex]?.question,
        correctAnswer: mockInterviewQuestion[activeQuestionIndex]?.answer,
        userAnswer,
      });

      // 2. Behavioral Evaluation
      const speechAnalysis = BehavioralAIService.analyzeSpeech(userAnswer);
      
      // Mocked visual signals for demonstration
      // In production, these values would come from real-time MediaPipe/FaceAPI analysis
      const visualSignals = {
        eyeContact: 0.85 + (Math.random() * 0.1),
        posture: 'Upright',
        movement: 'Neutral'
      };

      const resp = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mockIdRef: interviewData?.mockId,
          question: mockInterviewQuestion[activeQuestionIndex]?.question,
          correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
          userAns: userAnswer,
          feedback: feedback?.feedback,
          rating: feedback?.rating,
          // Behavioral Data
          hesitationDetected: speechAnalysis.hesitationDetected,
          emotionDetected: speechAnalysis.fillerCount > 4 ? "nervous" : "confident",
          paceMinutes: speechAnalysis.pace
        }),
      });

      const data = await resp.json();
      if (data.success) {
        toast.success("Answer & Behavioral Analysis recorded");
        setUserAnswer("");
        setResults([]);
        setAnswerSubmitted(true);
      } else {
        throw new Error(data.error || "Failed to record answer");
      }
    } catch (error) {
      console.error("Error updating user answer:", error);
      toast.error("Error analyzing answer. Please try again.");
    } finally {
      setResults([]);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-col px-2 sm:px-0">
      <div className="flex flex-col mt-10 sm:mt-20 justify-center items-center bg-black rounded-lg p-3 sm:p-5 w-full max-w-[500px]">
        <Image
          src={"/webcam.png"}
          width={150}
          height={150}
          alt="webcam img"
          className="absolute w-[120px] h-[120px] sm:w-[200px] sm:h-[200px]"
        />

        <Webcam
          mirrored={true}
          className="w-full max-w-[500px]"
          style={{
            height: "auto",
            aspectRatio: "1/1",
            zIndex: 10,
          }}
        />
      </div>

      {userAnswer && (
        <div className="p-3 sm:p-4 my-4 border rounded-lg bg-gray-50 dark:bg-gray-900 w-full max-w-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
            Your Answer:
          </h3>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            {userAnswer.trim()}
          </p>
        </div>
      )}

      {answerSubmitted && (
        <div className="p-3 my-2 border rounded-lg bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 w-full max-w-md text-center">
          Answer submitted for this question
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 my-6 sm:my-10 w-full sm:w-auto px-2 sm:px-0">
        <Button
          disabled={loading}
          variant="outline"
          onClick={StartStopRecording}
          className="w-full sm:w-auto"
        >
          {isRecording ? (
            <span className="text-red-600 animate-pulse flex gap-2 items-center">
              <StopCircle />
              Stop Recording
            </span>
          ) : (
            <span className="text-primary flex gap-2 items-center">
              <Mic />
              Record Answer
            </span>
          )}
        </Button>

        {userAnswer.trim().length > 0 && !isRecording && (
          <Button
            disabled={loading || answerSubmitted}
            onClick={handleSubmitAnswer}
            className="w-full sm:w-auto min-w-[150px] font-bold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </span>
            ) : "Submit Answer"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default RecordAnswerSection;
