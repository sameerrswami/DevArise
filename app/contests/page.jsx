"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Users, 
  ChevronRight, 
  Target, 
  Flame, 
  Star,
  Swords,
  Timer,
  Award,
  TrendingUp,
  Zap,
  History,
  Medal,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ContestsDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [contests, setContests] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContests = useCallback(async () => {
    try {
      const res = await fetch("/api/contests");
      const data = await res.json();
      if (data.success) {
        setContests(data.contests);
      }
    } catch (error) {
      console.error("Failed to fetch contests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserStats = useCallback(async () => {
    try {
      const res = await fetch("/api/contests/history");
      const data = await res.json();
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchContests();
    fetchUserStats();
  }, [fetchContests, fetchUserStats]);

  const activeContests = contests.filter(c => c.status === "active");
  const upcomingContests = contests.filter(c => c.status === "upcoming");
  const pastContests = contests.filter(c => c.status === "ended").slice(0, 5);

  const getRatingTitle = (rating) => {
    if (rating < 1200) return 'Pupil';
    if (rating < 1400) return 'Specialist';
    if (rating < 1600) return 'Expert';
    if (rating < 1900) return 'Candidate Master';
    if (rating < 2100) return 'Master';
    if (rating < 2400) return 'International Master';
    return 'Grandmaster';
  };

  const getRatingColor = (rating) => {
    if (rating < 1200) return 'text-gray-500';
    if (rating < 1400) return 'text-green-500';
    if (rating < 1600) return 'text-blue-500';
    if (rating < 1900) return 'text-purple-500';
    if (rating < 2100) return 'text-orange-500';
    if (rating < 2400) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getRatingBadgeColor = (rating) => {
    if (rating < 1200) return 'bg-gray-500/20 text-gray-500';
    if (rating < 1400) return 'bg-green-500/20 text-green-500';
    if (rating < 1600) return 'bg-blue-500/20 text-blue-500';
    if (rating < 1900) return 'bg-purple-500/20 text-purple-500';
    if (rating < 2100) return 'bg-orange-500/20 text-orange-500';
    if (rating < 2400) return 'bg-red-500/20 text-red-500';
    return 'bg-yellow-500/20 text-yellow-500';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold uppercase tracking-widest mb-4">
                <Swords className="h-3 w-3" />
                Competitive Arena
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Arena <span className="gradient-text">Contests</span></h1>
              <p className="text-muted-foreground mt-4 text-xl max-w-2xl">
                Simulate real placement assessments. Compete globally, climb the leaderboard, and skyrocket your rating.
              </p>
           </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Sidebar: User Profile & Rating */}
           <div className="lg:col-span-1 space-y-6">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative group">
                 <div className="absolute right-0 top-0 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-all duration-700">
                    <Trophy className="h-48 w-48" />
                 </div>
                 <CardContent className="p-8 relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-black text-2xl">
                          {session?.user?.name?.charAt(0) || "U"}
                       </div>
                       <div>
                          <h3 className="font-bold text-lg">{session?.user?.name || "Participant"}</h3>
                          <Badge className={`${getRatingBadgeColor(userStats?.currentRating || 1200)} hover:bg-white/20 border-none mt-1`}>
                            {getRatingTitle(userStats?.currentRating || 1200)}
                          </Badge>
                       </div>
                    </div>

                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Global Rating</span>
                       <div className={`text-5xl font-black mt-1 flex items-baseline gap-2 ${getRatingColor(userStats?.currentRating || 1200)}`}>
                          {userStats?.currentRating || 1200} 
                          <span className="text-sm opacity-70 font-medium tracking-normal">
                            {userStats && userStats.currentRating > 1200 ? `+${userStats.currentRating - 1200}` : ''}
                          </span>
                       </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
                       <div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Contests</span>
                          <p className="text-xl font-bold">{userStats?.totalContests || 0}</p>
                       </div>
                       <div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Best Rating</span>
                          <p className="text-xl font-bold">{userStats?.bestRating || 1200}</p>
                       </div>
                       <div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Wins</span>
                          <p className="text-xl font-bold">{userStats?.totalWins || 0}</p>
                       </div>
                       <div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Streak</span>
                          <p className="text-xl font-bold flex items-center gap-1">
                            <Flame className="h-4 w-4" />
                            {userStats?.currentStreak || 0}
                          </p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/contests/history">
                    <Button variant="outline" className="w-full justify-start">
                      <History className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                  </Link>
                  <Link href="/problems">
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Practice Problems
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="outline" className="w-full justify-start">
                      <Medal className="h-4 w-4 mr-2" />
                      Global Leaderboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
           </div>

           {/* Main Feed: Contests */}
           <div className="lg:col-span-2 space-y-8">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-none shadow-md rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <Flame className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase">Live Contests</p>
                      <p className="text-xl font-black">{activeContests.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-md rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Timer className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase">Upcoming</p>
                      <p className="text-xl font-black">{upcomingContests.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-md rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase">Solved</p>
                      <p className="text-xl font-black">{userStats?.totalProblemsSolved || 0}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {activeContests.length > 0 && (
                <div>
                   <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                     <Flame className="h-5 w-5 text-red-500" /> Live Now
                   </h2>
                   <div className="space-y-4">
                     {activeContests.map(c => (
                       <ContestCard key={c.id} contest={c} active />
                     ))}
                   </div>
                </div>
              )}

              {upcomingContests.length > 0 && (
                <div>
                   <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                     <Timer className="h-5 w-5 text-primary" /> Upcoming Assessments
                   </h2>
                   <div className="space-y-4">
                     {upcomingContests.map(c => (
                       <ContestCard key={c.id} contest={c} />
                     ))}
                   </div>
                </div>
              )}

              {pastContests.length > 0 && (
                <div>
                   <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-black opacity-50">Past Contests</h2>
                     <Link href="/contests/history" className="text-sm text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all">
                       View All <ArrowRight className="h-4 w-4" />
                     </Link>
                   </div>
                   <div className="space-y-4 opacity-75 grayscale hover:grayscale-0 transition-all">
                     {pastContests.map(c => (
                       <ContestCard key={c.id} contest={c} past />
                     ))}
                   </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted-foreground">Loading contests...</p>
                </div>
              )}

              {!loading && activeContests.length === 0 && upcomingContests.length === 0 && pastContests.length === 0 && (
                <div className="text-center py-20">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No Contests Yet</h3>
                  <p className="text-muted-foreground">Contests will be announced soon. Stay tuned!</p>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}

function ContestCard({ contest, active = false, past = false }) {
  return (
    <div className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border shadow-sm hover:shadow-lg transition-all ${active ? 'border-primary shadow-primary/10 scale-[1.01]' : 'border-border'}`}>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <div className="flex items-center gap-2 mb-2">
                {active && <Badge className="bg-red-500 hover:bg-red-600 border-none animate-pulse">LIVE</Badge>}
                {!active && !past && <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Upcoming</Badge>}
                {past && <Badge variant="secondary">Ended</Badge>}
                <span className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                   <Clock className="h-3 w-3" /> {contest.duration} mins
                </span>
             </div>
             <h3 className="text-2xl font-black tracking-tight">{contest.title}</h3>
             <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{contest.description}</p>
          </div>

          <div className="flex flex-col items-end shrink-0 w-full md:w-auto mt-4 md:mt-0">
             <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full mb-3 md:mb-2">
                <span className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                   <Calendar className="h-3 w-3" /> 
                   {new Date(contest.startsAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-1 flex items-center gap-1">
                   <Users className="h-3 w-3" /> {contest._count.entries} Registered
                </span>
             </div>
             <Link href={`/contests/${contest.id}`} className="w-full md:w-auto">
                <Button className={`w-full font-bold ${active ? 'bg-primary text-primary-foreground' : past ? 'bg-secondary text-secondary-foreground' : ''}`}>
                   {active ? 'Enter Arena' : past ? 'View Leaderboard' : 'Register Now'} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
             </Link>
          </div>
       </div>
    </div>
  );
}
