"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  BarChart3,
  Users,
  Star,
  Flame,
  Zap
} from "lucide-react";
import Link from "next/link";

export default function ContestAnalysisPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/analysis?contestId=${params.contestId}`);
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Failed to fetch analysis:", error);
    } finally {
      setLoading(false);
    }
  }, [params.contestId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getRatingColor = (rating) => {
    if (rating < 1200) return "text-gray-500";
    if (rating < 1400) return "text-green-500";
    if (rating < 1600) return "text-blue-500";
    if (rating < 1900) return "text-purple-500";
    if (rating < 2100) return "text-orange-500";
    if (rating < 2400) return "text-red-500";
    return "text-yellow-500";
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'Easy') return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400';
    if (difficulty === 'Medium') return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400';
    return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Analysis Not Available</h2>
          <p className="text-muted-foreground mb-4">You may not have participated in this contest.</p>
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
        <div className="mb-8">
          <Link 
            href={`/contests/${params.contestId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contest
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Contest Analysis</h1>
              <p className="text-muted-foreground">{analysis.contest.title}</p>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-lg rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Rank</p>
                  <p className="text-4xl font-black mt-1">
                    #{analysis.performance.rank}
                    <span className="text-lg text-muted-foreground">/{analysis.performance.totalParticipants}</span>
                  </p>
                </div>
                <Trophy className="h-10 w-10 text-yellow-500" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Top {Math.round(100 - analysis.performance.percentile)}% of participants
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Score</p>
                  <p className="text-4xl font-black mt-1">{analysis.performance.score}</p>
                </div>
                <Target className="h-10 w-10 text-primary" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Average: {analysis.performance.averageScore}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Problems Solved</p>
                  <p className="text-4xl font-black mt-1">
                    {analysis.performance.problemsSolved}
                    <span className="text-lg text-muted-foreground">/{analysis.performance.totalProblems}</span>
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Accuracy: {analysis.performance.accuracy * 100}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Rating Change</p>
                  <div className="flex items-center gap-2 mt-1">
                    {analysis.rating.direction === 'gain' ? (
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    ) : analysis.rating.direction === 'loss' ? (
                      <TrendingDown className="h-6 w-6 text-red-500" />
                    ) : (
                      <Minus className="h-6 w-6 text-gray-500" />
                    )}
                    <p className={`text-3xl font-black ${
                      analysis.rating.direction === 'gain' ? 'text-green-500' : 
                      analysis.rating.direction === 'loss' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {analysis.rating.change > 0 ? '+' : ''}{analysis.rating.change}
                    </p>
                  </div>
                </div>
                <BarChart3 className="h-10 w-10 text-purple-500" />
              </div>
              <div className="mt-4">
                <p className={`text-sm ${getRatingColor(analysis.rating.after)}`}>
                  New Rating: {analysis.rating.after}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problem Breakdown */}
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle>Problem-wise Performance</CardTitle>
                <CardDescription>
                  Detailed breakdown of each problem in the contest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.problemAnalysis.map((problem, index) => (
                    <div 
                      key={problem.problemId}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-lg flex items-center justify-center font-bold bg-primary/10 text-primary">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-bold">{problem.title}</h4>
                            <Badge className={`mt-1 ${getDifficultyColor(problem.difficulty)}`}>
                              {problem.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          {problem.solved ? (
                            <div className="flex items-center gap-2 text-green-500">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-bold">+{problem.points}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-500">
                              <XCircle className="h-5 w-5" />
                              <span className="font-bold">Not Solved</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Attempts</p>
                          <p className="font-bold">{problem.attempts}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Time Taken</p>
                          <p className="font-bold">
                            {problem.timeTaken 
                              ? `${Math.floor(problem.timeTaken / 60000)}m ${Math.floor((problem.timeTaken % 60000) / 1000)}s`
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className={`font-bold ${problem.solved ? 'text-green-500' : 'text-red-500'}`}>
                            {problem.solved ? 'Accepted' : 'Failed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Personalized feedback based on your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.insights.map((insight, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-2xl flex items-start gap-3 ${
                        insight.type === 'positive' 
                          ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' 
                          : 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      {insight.type === 'positive' ? (
                        <Star className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-bold">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Difficulty Breakdown */}
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle>Difficulty Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Easy', ...analysis.breakdown.easy },
                    { name: 'Medium', ...analysis.breakdown.medium },
                    { name: 'Hard', ...analysis.breakdown.hard }
                  ].map((diff) => (
                    <div key={diff.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">{diff.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {diff.solved}/{diff.total}
                        </span>
                      </div>
                      <Progress 
                        value={(diff.solved / Math.max(1, diff.total)) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Analysis */}
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-sm text-muted-foreground">Total Time</p>
                  <p className="text-2xl font-black">
                    {analysis.timeAnalysis.totalContestTime
                      ? `${Math.floor(analysis.timeAnalysis.totalContestTime / 60000)}m ${Math.floor((analysis.timeAnalysis.totalContestTime % 60000) / 1000)}s`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-sm text-muted-foreground">Avg per Problem</p>
                  <p className="text-2xl font-black">
                    {analysis.timeAnalysis.averageTimePerProblem
                      ? `${Math.floor(analysis.timeAnalysis.averageTimePerProblem / 60000)}m ${Math.floor((analysis.timeAnalysis.averageTimePerProblem % 60000) / 1000)}s`
                      : 'N/A'
                    }
                  </p>
                </div>
                {analysis.timeAnalysis.fastestSolve && analysis.timeAnalysis.fastestSolve !== Infinity && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-sm text-muted-foreground">Fastest Solve</p>
                    <p className="text-2xl font-black text-green-500">
                      {Math.floor(analysis.timeAnalysis.fastestSolve / 60000)}m {Math.floor((analysis.timeAnalysis.fastestSolve % 60000) / 1000)}s
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Score */}
            <Card className="border-none shadow-lg rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle>Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-black mb-2">
                    {analysis.insights.length > 0 ? Math.round(
                      (analysis.performance.accuracy * 40) +
                      (Math.min(1, analysis.performance.problemsSolved / analysis.performance.totalProblems) * 30) +
                      (Math.min(1, 1 - (analysis.performance.rank - 1) / Math.max(1, analysis.performance.totalParticipants)) * 30)
                    ) : 0}
                  </div>
                  <p className="opacity-80">out of 100</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}