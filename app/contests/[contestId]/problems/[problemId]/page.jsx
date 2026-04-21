"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Code, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Trophy,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function ContestProblemPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [problem, setProblem] = useState(null);
  const [contest, setContest] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [contestActive, setContestActive] = useState(false);

  // Fetch problem and contest details
  const fetchDetails = useCallback(async () => {
    try {
      // Fetch contest details
      const contestRes = await fetch(`/api/contests/${params.contestId}`);
      const contestData = await contestRes.json();
      if (contestData.success) {
        setContest(contestData.contest);
        
        // Check if contest is active
        const now = new Date();
        const startsAt = new Date(contestData.contest.startsAt);
        const endsAt = new Date(contestData.contest.endsAt);
        
        if (now >= startsAt && now < endsAt) {
          setContestActive(true);
          setTimeRemaining(endsAt - now);
        }
        
        // Find the problem in contest problems
        const contestProblem = contestData.contest.problems?.find(
          cp => cp.problemId === params.problemId
        );
        
        if (contestProblem) {
          setProblem({
            ...contestProblem.problem,
            points: contestProblem.points,
            editorial: contestProblem.editorial
          });
          
          // Set default code template
          setCode(getDefaultCode(language, contestProblem.problem));
        }
      }
    } catch (error) {
      console.error("Failed to fetch details:", error);
    } finally {
      setLoading(false);
    }
  }, [params.contestId, params.problemId, language]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Timer countdown
  useEffect(() => {
    if (!timeRemaining || !contestActive) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          setContestActive(false);
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, contestActive]);

  // Format time
  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get default code template
  const getDefaultCode = (lang, prob) => {
    const templates = {
      javascript: `// ${prob?.title || 'Problem'}
function solve(input) {
  // Write your solution here
  return result;
}

// Test your solution
// const result = solve(testInput);`,
      python: `# ${prob?.title || 'Problem'}
def solve(input):
    # Write your solution here
    return result

# Test your solution
# result = solve(test_input)`,
      java: `// ${prob?.title || 'Problem'}
public class Solution {
    public static Object solve(Object input) {
        // Write your solution here
        return result;
    }
    
    public static void main(String[] args) {
        // Test your solution
        // Object result = solve(testInput);
    }
}`,
      cpp: `// ${prob?.title || 'Problem'}
#include <iostream>
using namespace std;

class Solution {
public:
    Object solve(Object input) {
        // Write your solution here
        return result;
    }
};`
    };
    return templates[lang] || templates.javascript;
  };

  // Submit solution
  const handleSubmit = async () => {
    if (!contestActive) {
      alert("Contest has ended. You can no longer submit solutions.");
      return;
    }

    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await fetch("/api/contests/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId: params.contestId,
          problemId: params.problemId,
          code,
          language
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setSubmissionResult({
          success: true,
          status: data.submission.status,
          pointsEarned: data.submission.pointsEarned,
          penalty: data.submission.penalty,
          flaggedForPlagiarism: data.submission.flaggedForPlagiarism,
          message: data.message
        });
      } else {
        setSubmissionResult({
          success: false,
          error: data.error || "Submission failed"
        });
      }
    } catch (error) {
      setSubmissionResult({
        success: false,
        error: "Failed to submit solution"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!problem || !contest) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Problem Not Found</h2>
          <Link href={`/contests/${params.contestId}`}>
            <Button>Back to Contest</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href={`/contests/${params.contestId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contest
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline"
                  className={`${
                    problem.difficulty === 'Easy' ? 'text-green-500 border-green-500/20' : 
                    problem.difficulty === 'Medium' ? 'text-yellow-500 border-yellow-500/20' : 'text-red-500 border-red-500/20'
                  }`}
                >
                  {problem.difficulty}
                </Badge>
                <span className="text-sm text-muted-foreground">{problem.points} points</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">{problem.title}</h1>
            </div>
            
            {contestActive && timeRemaining && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl">
                <Clock className="h-4 w-4 animate-pulse" />
                <span className="font-black">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem Description */}
          <Card className="border-none shadow-lg rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Problem Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: problem.description }} />
              </div>
              
              {problem.constraints && (
                <div>
                  <h3 className="font-bold text-lg mb-2">Constraints</h3>
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl overflow-x-auto text-sm">
                    {problem.constraints}
                  </pre>
                </div>
              )}
              
              {problem.testCases && (
                <div>
                  <h3 className="font-bold text-lg mb-2">Example Test Cases</h3>
                  <div className="space-y-3">
                    {problem.testCases.map((tc, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                        <p className="text-sm font-bold text-muted-foreground mb-1">Example {index + 1}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Input:</p>
                            <code className="text-sm">{tc.input}</code>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Output:</p>
                            <code className="text-sm">{tc.output}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Editor & Submission */}
          <div className="space-y-6">
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Solution
                </CardTitle>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setCode(getDefaultCode(e.target.value, problem));
                  }}
                  className="px-3 py-1 border rounded-lg text-sm bg-transparent"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="min-h-[400px] font-mono text-sm bg-slate-900 text-green-400 rounded-xl p-4"
                  placeholder="Write your solution here..."
                  disabled={!contestActive}
                />
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Time limit: 2 seconds</span>
                  </div>
                  
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitting || !contestActive}
                    size="lg"
                    className="font-bold"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Solution
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Submission Result */}
            {submissionResult && (
              <Card className={`border-none shadow-lg rounded-3xl ${
                submissionResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {submissionResult.success ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">
                        {submissionResult.success ? "Solution Accepted!" : "Submission Failed"}
                      </h3>
                      <p className="text-muted-foreground mt-1">{submissionResult.message}</p>
                      
                      {submissionResult.success && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                            <p className="text-xs text-muted-foreground">Points Earned</p>
                            <p className="text-xl font-black text-green-500">+{submissionResult.pointsEarned}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                            <p className="text-xs text-muted-foreground">Penalty</p>
                            <p className="text-xl font-black">{submissionResult.penalty} mins</p>
                          </div>
                        </div>
                      )}
                      
                      {submissionResult.flaggedForPlagiarism && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-500 rounded-xl flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Your submission has been flagged for plagiarism review. Similar code was detected.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contest Status Messages */}
            {!contestActive && (
              <Card className="border-none shadow-lg rounded-3xl bg-slate-100 dark:bg-slate-800">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-bold">Contest has ended</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    You can no longer submit solutions for this problem.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}