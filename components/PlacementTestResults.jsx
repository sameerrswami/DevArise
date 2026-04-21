// Placement Test Results
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function PlacementTestResults({ attemptId, testId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `/api/placement-tests/${testId}/results?attemptId=${attemptId}`
        );
        const data = await response.json();
        if (data.success) {
          setResults(data.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId, testId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load results</p>
        </CardContent>
      </Card>
    );
  }

  const { finalResult, roundResults, analysis } = results;

  return (
    <div className="space-y-6">
      {/* Overall Result */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            {finalResult.isPassed ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-600" />
                <span className="text-green-600">Test Passed!</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-8 w-8 text-red-600" />
                <span className="text-red-600">Test Failed</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Score</p>
              <p className="text-3xl font-bold">
                {finalResult.score}/{finalResult.maxScore}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Percentage</p>
              <p className="text-3xl font-bold">{finalResult.percentage}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <Badge variant={finalResult.isPassed ? "default" : "destructive"}>
                {finalResult.isPassed ? "PASSED" : "FAILED"}
              </Badge>
            </div>
          </div>
          <Progress value={finalResult.percentage} />
        </CardContent>
      </Card>

      {/* Round Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Round-wise Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {roundResults.map((round, idx) => (
            <div key={idx} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold capitalize">
                  {round.roundType} Round
                </h3>
                <Badge variant={round.status === "passed" ? "default" : "destructive"}>
                  {round.percentage}%
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Correct: {round.breakdown.correct} | Wrong:{" "}
                {round.breakdown.wrong} | Skipped: {round.breakdown.skipped}
              </div>
              <Progress value={round.percentage} className="mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Strengths</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {Object.entries(analysis.topicStrengths || {}).map(
                  ([topic, score]) => (
                    <li key={topic}>
                      {topic}: {Math.round(score)}%
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Areas to Improve</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {Object.entries(analysis.topicWeaknesses || {}).map(
                  ([topic, data]) => (
                    <li key={topic}>
                      {topic}
                      {data.accuracy && `: ${Math.round(data.accuracy)}%`}
                    </li>
                  )
                )}
              </ul>
            </div>

            {analysis.recommendations && (
              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {analysis.recommendations.practice_suggestions?.map(
                    (rec, idx) => <li key={idx}>{rec}</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
