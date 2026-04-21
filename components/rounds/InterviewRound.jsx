// Interview Round
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InterviewRound({
  title,
  setupData,
  onSubmit,
  isLastRound,
}) {
  const handleStartInterview = async () => {
    // This would integrate with the existing MockInterview system
    // For now, submit empty responses to progress to completion
    await onSubmit([
      {
        type: "interview",
        mockId: "pending",
        timeTaken: 0,
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            This is an AI-powered interview round. You'll be interviewed for the
            position mentioned below. Make sure you have a microphone and
            sufficient lighting.
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3">Position Details</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Position:</strong> {setupData?.jobPosition}
            </p>
            <p>
              <strong>Experience:</strong> {setupData?.experience}
            </p>
            <p className="mt-3">
              <strong>Topics to prepare:</strong>
            </p>
            <ul className="list-disc pl-5 mt-1">
              {setupData?.interviewTopics?.map((topic, idx) => (
                <li key={idx}>{topic}</li>
              ))}
            </ul>
          </div>
        </div>

        <Button onClick={handleStartInterview} size="lg" className="w-full">
          Start Interview
        </Button>
      </CardContent>
    </Card>
  );
}
