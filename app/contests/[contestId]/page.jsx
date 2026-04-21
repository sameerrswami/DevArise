"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Clock, 
  Users, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Play,
  Code,
  Timer,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Flame,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myEntry, setMyEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [contestStarted, setContestStarted] = useState(false);
  const [contestEnded, setContestEnded] = useState(false);

  // Fetch contest details
  const fetchContestDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${params.contestId}`);
      const data = await res.json();
      if (data.success) {
        setContest(data.contest);
        setMyEntry(data.myEntry);
        
        // Check contest status
        const now = new Date();
        const startsAt = new Date(data.contest.startsAt);
        const endsAt = new Date(data.contest.endsAt);
        
        if (now >= startsAt) {
          setContestStarted(true);
        }
        if (now >= endsAt) {
          setContestEnded(true);
        }
        
        // Calculate time remaining
        if (now < endsAt && now >= startsAt) {
          setTimeRemaining(endsAt - now);
        }
      }
    } catch (error) {
      console.error("Failed to fetch contest:", error);
    } finally {
      setLoading(false);
    }
  }, [params.contestId]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/leaderboard?contestId=${params.contestId}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  }, [params.contestId]);

  useEffect(() => {
    fetchContestDetails();
    fetchLeaderboard();
  }, [fetchContestDetails, fetchLeaderboard]);

  // Timer countdown
  useEffect(() => {
    if (!timeRemaining || contestEnded) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          setContestEnded(true);
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, contestEnded]);

  // Join contest
  const handleJoinContest = async () => {
    try {
      const res = await fetch("/api/contests/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId: params.contestId })
      });
      const data = await res.json();
      if (data.success) {
        fetchContestDetails();
        fetchLeaderboard();
      }
    } catch (error) {
      console.error("Failed to join contest:", error);
    }
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contest details...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Contest Not Found</h2>
          <Link href="/contests">
            <Button>Back to Contests</Button>
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
          <Link href="/contests" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Contests
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {contestStarted && !contestEnded && (
                  <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">LIVE</Badge>
                )}
                {contestEnded && (
                  <Badge variant="secondary">Ended</Badge>
                )}
                {!contestStarted && (
                  <Badge variant="outline">Upcoming</Badge>
                )}
                <span className="text-sm text-muted-foreground">{contest.type}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{contest.title}</h1>
              <p className="text-muted-foreground mt-2">{contest.description}</p>
            </div>
            
            {!contestEnded && !myEntry && contestStarted && (
              <Button size="lg" onClick={handleJoinContest} className="shrink-0">
                <Play className="h-4 w-4 mr-2" />
                Join Contest
              </Button>
            )}
          </div>
        </div>

        {/* Timer Banner */}
        {contestStarted && !contestEnded && timeRemaining && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Timer className="h-6 w-6 animate-pulse" />
              <div>
                <p className="text-sm font-bold opacity-90">Time Remaining</p>
                <p className="text-2xl font-black">{formatTime(timeRemaining)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold opacity-90">Participants</p>
                <p className="text-xl font-black">{leaderboard.length}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Problems & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problems */}
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Contest Problems
                </CardTitle>
                <CardDescription>
                  Solve these problems to earn points. Higher difficulty = more points.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contest.problems?.map((cp, index) => (
                    <Link 
                      key={cp.id}
                      href={contestStarted && !contestEnded ? `/contests/${params.contestId}/problems/${cp.problemId}` : `/problems/${cp.problem.slug}`}
                    >
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${
                              cp.problem.difficulty === 'Easy' ? 'bg-green-100 text-green-600' : 
                              cp.problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold group-hover:text-primary transition-colors">
                                {cp.problem.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] uppercase font-black tracking-widest px-2 py-0 ${
                                    cp.problem.difficulty === 'Easy' ? 'text-green-500 border-green-500/20' : 
                                    cp.problem.difficulty === 'Medium' ? 'text-yellow-500 border-yellow-500/20' : 'text-red-500 border-red-500/20'
                                  }`}
                                >
                                  {cp.problem.difficulty}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {cp.points} points
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {myEntry?.submissions?.some(s => s.problemId === cp.problemId && s.accepted) && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            <span className="text-muted-foreground group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contest Info */}
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle>Contest Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Duration</p>
                    <p className="text-xl font-black mt-1">{contest.duration} mins</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Start Time</p>
                    <p className="text-sm font-bold mt-1">
                      {new Date(contest.startsAt).toLocaleDateString([], { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Problems</p>
                    <p className="text-xl font-black mt-1">{contest.problems?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Participants</p>
                    <p className="text-xl font-black mt-1">{leaderboard.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Leaderboard & Stats */}
          <div className="space-y-6">
            {/* My Stats */}
            {myEntry && (
              <Card className="border-none shadow-lg rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle>Your Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm opacity-80">Current Rank</p>
                      <p className="text-4xl font-black">
                        {leaderboard.findIndex(l => l.userId === myEntry.userId) + 1}
                        <span className="text-lg opacity-60">/{leaderboard.length}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm opacity-80">Score</p>
                        <p className="text-2xl font-black">{myEntry.score}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-80">Solved</p>
                        <p className="text-2xl font-black">
                          {myEntry.problemsSolved}/{contest.problems?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Accuracy</p>
                      <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all"
                          style={{ width: `${(myEntry.accuracy || 0) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm mt-1">{Math.round((myEntry.accuracy || 0) * 100)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <div 
                      key={entry.userId}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        entry.userId === myEntry?.userId 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      <span className="text-lg font-black w-8 text-center">
                        {getRankIcon(index + 1)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{entry.user.name || `User_${entry.userId.slice(0, 6)}`}</p>
                        <p className={`text-xs ${getRatingColor(entry.rating)}`}>
                          {entry.rating} rating
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black">{entry.score}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.problemsSolved} solved
                        </p>
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No participants yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contest Ended - Show Analysis */}
        {contestEnded && myEntry && (
          <div className="mt-8">
            <Card className="border-none shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Contest Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/contests/${params.contestId}/analysis`}>
                  <Button variant="outline" className="w-full">
                    View Detailed Analysis
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}