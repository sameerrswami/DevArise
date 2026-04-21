// Technical MCQ Round
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function TechnicalMCQRound({
  title,
  instructions,
  questions = [],
  onSubmit,
  isLastRound,
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const question = questions[current];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const responses = questions.map((q, idx) => ({
        questionId: q.id,
        selectedAnswer: answers[idx] ?? -1,
        timeTaken: 0,
      }));
      await onSubmit(responses);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {question && (
          <>
            <div className="flex gap-2 mb-4">
              <Badge>{question.subject.toUpperCase()}</Badge>
              <Badge variant="secondary">{question.difficulty}</Badge>
              <span className="text-sm text-gray-600 ml-auto">
                Q{current + 1}/{questions.length}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="font-medium">{question.question}</p>
              {question.codeSnippet && (
                <pre className="bg-gray-800 text-white p-2 rounded mt-3 text-xs overflow-x-auto">
                  {question.codeSnippet}
                </pre>
              )}
            </div>

            <RadioGroup
              value={answers[current]?.toString() ?? ""}
              onValueChange={(v) =>
                setAnswers({ ...answers, [current]: parseInt(v) })
              }
            >
              {question.options.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={idx.toString()} id={`mcq-${idx}`} />
                  <Label htmlFor={`mcq-${idx}`} className="cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </>
        )}

        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              variant="outline"
            >
              Previous
            </Button>
            {current < questions.length - 1 && (
              <Button
                onClick={() => setCurrent(current + 1)}
                variant="outline"
              >
                Next
              </Button>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            {isLastRound ? "Finish" : "Submit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
