/**
 * APTITUDE ROUND COMPONENT
 * 
 * Displays aptitude test questions
 * - Logical Reasoning
 * - Quantitative Ability
 * - Verbal Ability
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, SkipForward } from "lucide-react";

export default function AptitudeRound({
  title,
  instructions,
  duration,
  roundNumber,
  questions = [],
  onSubmit,
  isLastRound,
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState({});

  useEffect(() => {
    // Track time spent on each question
    const timer = setInterval(() => {
      setTimeSpent((prev) => ({
        ...prev,
        [currentQuestion]: (prev[currentQuestion] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion]);

  const question = questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];

  const handleAnswer = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: optionIndex,
    }));
  };

  const handleSkip = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: -1, // -1 indicates skipped
    }));
    handleNext();
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const responses = questions.map((q, idx) => ({
        questionId: q.id,
        selectedAnswer: answers[idx] ?? -1,
        timeTaken: timeSpent[idx] || 0,
      }));

      await onSubmit(responses);
    } catch (error) {
      console.error("Error submitting aptitude round:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.values(answers).filter((a) => a !== -1).length;
  const skippedCount = Object.values(answers).filter((a) => a === -1).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {instructions && (
          <div className="text-sm text-gray-600 mt-2">
            <p className="font-semibold mb-2">Instructions:</p>
            <p>{instructions}</p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Display */}
        {question && (
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">
                    Question {currentQuestion + 1} of {questions.length}
                  </Badge>
                  <Badge variant="secondary">{question.category}</Badge>
                  <Badge variant="secondary">{question.difficulty}</Badge>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-lg font-medium text-gray-800">
                    {question.question}
                  </p>
                </div>

                {/* Options */}
                <RadioGroup
                  value={selectedAnswer?.toString() ?? ""}
                  onValueChange={(value) => handleAnswer(parseInt(value))}
                >
                  <div className="space-y-3">
                    {question.options.map((option, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                        <Label
                          htmlFor={`option-${idx}`}
                          className="text-base cursor-pointer flex-1"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Right Sidebar */}
              <div className="w-40 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-2">Progress</p>
                    <p className="text-xs text-blue-700">
                      Answered: {answeredCount}
                    </p>
                    <p className="text-xs text-blue-700">
                      Skipped: {skippedCount}
                    </p>
                    <p className="text-xs text-blue-700">
                      Remaining: {questions.length - answeredCount - skippedCount}
                    </p>
                  </div>
                </div>

                {/* Question Navigator */}
                <div className="grid grid-cols-4 gap-1">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`aspect-square rounded text-xs font-semibold transition-colors ${
                        idx === currentQuestion
                          ? "bg-blue-600 text-white"
                          : answers[idx] !== undefined
                          ? answers[idx] === -1
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-green-200 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {currentQuestion < questions.length - 1 ? (
              <Button
                variant="outline"
                onClick={handleNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
            >
              {isLastRound ? "Finish Test" : "Submit Round"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
