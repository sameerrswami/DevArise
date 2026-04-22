"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie
} from "recharts";
import { 
  TrendingUp, 
  Trophy, 
  Target, 
  Zap, 
  Flame, 
  CheckCircle2, 
  Brain, 
  ArrowRight, 
  MessageSquare,
  BookOpen,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  Map,
  Rocket,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function IntelligentDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (session) {
      fetchDashboardSummary();
    }
  }, [session]);

  const fetchDashboardSummary = async () => {
    try {
      setError(false);
      const res = await fetch("/api/dashboard/summary");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.message || "Failed to load dashboard");
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
      setError(true);
      toast.error("Cloud synchronization issues detected. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
        <Navbar isAuthenticated={true} />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-12 w-96 font-black" />
              <Skeleton className="h-6 w-128" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-40 rounded-2xl" />
              <Skeleton className="h-12 w-40 rounded-2xl" />
            </div>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Skeleton className="lg:col-span-2 h-64 rounded-[2.5rem]" />
            <Skeleton className="h-64 rounded-[2.5rem]" />
          </div>
          <Skeleton className="h-48 rounded-[2.5rem] mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-80 rounded-[2.5rem]" />
            <Skeleton className="lg:col-span-2 h-80 rounded-[2.5rem]" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
           <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sync Interrupted</h2>
        <p className="text-slate-400 max-w-sm mb-8">We encountered a problem while synchronizing your preparation data. This might be due to a temporary network blip.</p>
        <Button onClick={fetchDashboardSummary} className="bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl px-10 h-14">
          Retry Synchronization
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { readiness, insights, stats } = data;

  // Edge case: New user onboarding guidance
  const isNewUser = !data.activeRoadmap && readiness.overallScore < 5;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                 <Zap className="h-3 w-3" />
                 Global Intelligence
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Placement <span className="gradient-text">Studio</span></h1>
              <p className="text-muted-foreground mt-2 text-xl max-w-xl">
                 Unified view of your preparation journey, from coding logic to interview readiness.
              </p>
           </motion.div>
           
           <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-2xl border border-orange-500/20 font-black">
                 <Flame className="h-5 w-5 fill-current" />
                 {stats.streak} DAY STREAK
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-2xl border border-amber-500/20 font-black">
                 <Trophy className="h-5 w-5" />
                 {stats.points} PTS
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
           {/* Readiness Hero Card */}
           <Card className="lg:col-span-2 border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem] relative group">
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-all duration-700">
                 <Target className="h-64 w-64" />
              </div>
              <CardContent className="p-10 relative z-10 flex flex-col md:flex-row gap-12 items-center">
                 <div className="flex-shrink-0 relative">
                    <svg className="h-48 w-48">
                      <circle cx="96" cy="96" r="80" className="stroke-slate-100 dark:stroke-slate-800 fill-none stroke-[12]" />
                      <motion.circle 
                        cx="96" cy="96" r="80" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="12" 
                        strokeLinecap="round"
                        style={{ pathLength: readiness.overallScore / 100 }}
                        className="text-primary transition-all duration-1000"
                        transform="rotate(-90 96 96)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-5xl font-black">{readiness.overallScore}%</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ready</span>
                    </div>
                 </div>

                 <div className="flex-1 space-y-6">
                    <div>
                       <h2 className="text-3xl font-black mb-1">Placement Readiness</h2>
                       <p className="text-primary font-bold flex items-center gap-2">
                          <Brain className="h-4 w-4" /> {readiness.readinessLevel}
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <MetricProgress label="Coding Logic" value={readiness.breakdown.coding} color="bg-blue-500" />
                       <MetricProgress label="Interview" value={readiness.breakdown.interview} color="bg-purple-500" />
                       <MetricProgress label="Communications" value={readiness.breakdown.communication} color="bg-emerald-500" />
                       <MetricProgress label="Profile Depth" value={readiness.breakdown.profile} color="bg-amber-500" />
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* AI Recommendations */}
           <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 pb-0">
               <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                 <Sparkles className="h-4 w-4 text-primary" />
                 AI Growth Insights
               </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-4">
                {insights.map((ins, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.1 }}
                    className="p-4 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-all"
                  >
                     <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${ins.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                           {ins.type}
                        </span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                     </div>
                     <h4 className="font-bold text-sm mb-1">{ins.title}</h4>
                     <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-2">"{ins.description}"</p>
                  </motion.div>
                ))}
             </CardContent>
           </Card>
        </div>

        {isNewUser ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <EmptyState 
                    icon={Rocket}
                    title="Launch Your Career Journey"
                    description="It looks like you're new here! Let's start by generating your first AI-powered placement roadmap to identify your skill gaps."
                    action="Create My Roadmap"
                    href="/roadmap"
                    className="py-20"
                />
            </motion.div>
        ) : data.activeRoadmap && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
             className="mb-12"
           >
              <Card className="border-none shadow-xl bg-gradient-to-r from-primary to-indigo-600 text-white rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative">
                 <div className="absolute right-0 top-0 opacity-10 -mr-20 -mt-20">
                    <Map className="h-96 w-96" />
                 </div>
                 <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                           <RefreshCw className="h-3 w-3" /> In Progress
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black">{data.activeRoadmap.targetRole}</h3>
                        <p className="text-white/80 max-w-xl font-medium leading-relaxed italic">
                           "{data.activeRoadmap.summary}"
                        </p>
                        <Button variant="secondary" className="rounded-xl h-12 px-8 font-extrabold group" asChild>
                           <Link href="/roadmap">
                              Continue Roadmap <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                           </Link>
                        </Button>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="relative h-40 w-40 flex items-center justify-center">
                           <div className="absolute inset-0 rounded-full border-8 border-white/20" />
                           <motion.div 
                             initial={{ rotate: 0 }} animate={{ rotate: 360 }}
                             style={{ pathLength: data.activeRoadmap.progress / 100 }}
                             className="absolute inset-0 rounded-full border-8 border-t-white"
                           />
                           <span className="text-4xl font-black">{data.activeRoadmap.progress}%</span>
                        </div>
                        <span className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Journey Progress</span>
                    </div>
                 </div>
              </Card>
           </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Performance Radar */}
           <Card className="lg:col-span-1 border-none shadow-lg rounded-[2.5rem] p-6 bg-white dark:bg-slate-900">
              <CardTitle className="text-sm font-black uppercase tracking-widest mb-6">Topic Mastery</CardTitle>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={readiness.topicPerformance}>
                       <PolarGrid stroke="#e2e8f0" />
                       <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fontWeight: 700 }} />
                       <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                       <Radar
                         name="User"
                         dataKey="score"
                         stroke="#8b5cf6"
                         fill="#8b5cf6"
                         fillOpacity={0.5}
                       />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           {/* Stats Breakdown */}
           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-900 p-8">
                 <CardTitle className="text-sm font-black uppercase tracking-widest mb-6 flex items-center justify-between">
                    <span>Recent Submissions</span>
                    <Link href="/problems" className="text-xs text-primary hover:underline font-bold">View Hub</Link>
                 </CardTitle>
                 <div className="space-y-4">
                    {data.recentSubmissions && data.recentSubmissions.length > 0 ? (
                      data.recentSubmissions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                           <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${s.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                 <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-sm">{s.problem.title}</span>
                           </div>
                           <Badge variant="outline" className="text-[10px]">{s.problem.category}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center flex flex-col items-center">
                        <BookOpen className="h-8 w-8 text-slate-700/50 mb-2" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase">No Missions Completed</p>
                      </div>
                    )}
                 </div>
              </Card>

              <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-600 text-white p-8">
                 <CardTitle className="text-sm font-black uppercase tracking-widest mb-6 no-underline">Quick Actions</CardTitle>
                 <div className="grid grid-cols-2 gap-4">
                    <ActionButton icon={<Monitor />} label="Interview" href="/interviewer" />
                    <ActionButton icon={<Rocket />} label="Projects" href="/projects" />
                    <ActionButton icon={<User />} label="Resume" href="/resume" />
                    <ActionButton icon={<Map />} label="Roadmap" href="/roadmap" />
                 </div>
              </Card>
           </div>
        </div>

      </main>
    </div>
  );
}

function MetricProgress({ label, value, color }) {
  return (
    <div className="space-y-1">
       <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
          <span>{label}</span>
          <span className="text-foreground">{value}%</span>
       </div>
       <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.5 }}
            className={`h-full ${color}`} 
          />
       </div>
    </div>
  );
}

function ActionButton({ icon, label, href }) {
   return (
     <Link href={href}>
        <div className="p-4 bg-white/10 rounded-2xl border border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-all text-center">
           {icon}
           <span className="text-xs font-bold">{label}</span>
        </div>
     </Link>
   );
}

import { Monitor, User } from "lucide-react";
