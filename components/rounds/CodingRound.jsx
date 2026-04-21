// Coding Round
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function CodingRound({
  title,
  problems = [],
  onSubmit,
  isLastRound,
}) {
  const [current, setCurrent] = useState(0);
  const [codes, setCodes] = useState({});
  const [language, setLanguage] = useState("javascript");
  const [submitting, setSubmitting] = useState(false);

  const problem = problems[current]?.problem;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const responses = problems.map((p, idx) => ({
        codingProblemId: problems[idx].id,
        code: codes[idx] || "",
        language,
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
        {problem && (
          <>
            <div className="flex gap-2">
              <Badge>{problem.difficulty}</Badge>
              <span className="ml-auto text-sm">
                P{current + 1}/{problems.length}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold">{problem.title}</h3>
                <p className="text-gray-700 mt-2">{problem.description}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Language:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <Textarea
                placeholder="Write your code here..."
                value={codes[current] || ""}
                onChange={(e) =>
                  setCodes({ ...codes, [current]: e.target.value })
                }
                className="font-mono h-64"
              />
            </div>
          </>
        )}

        <div className="flex justify-between gap-2">
          <Button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            variant="outline"
          >
            Previous
          </Button>
          {current < problems.length - 1 && (
            <Button
              onClick={() => setCurrent(current + 1)}
              variant="outline"
            >
              Next
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={submitting}>
            {isLastRound ? "Finish" : "Submit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
