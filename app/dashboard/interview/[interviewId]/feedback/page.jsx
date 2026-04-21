"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  MessageSquare, 
  Trophy, 
  Target, 
  TrendingUp, 
  AlertCircle,
  Lightbulb,
  Mic2,
  Brain,
  ChevronDown,
  Eye, 
  UserSquare2, 
  Timer, 
  Frown, 
  Smile, 
  AlertTriangle,
  Video,
  PlayCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function EnhancedFeedback({ params }) {
  const { interviewId } = params;
  const router = useRouter();
  const [qnas, setQnas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, [interviewId]);

  const fetchFeedback = async () => {
    try {
      const qnaResp = await fetch(`/api/interview/feedback?mockIdRef=${interviewId}`);
      const qnaData = await qnaResp.json();
      if (qnaData.success) {
        setQnas(qnaData.result);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAggregates = (questions) => {
    if (!questions || !questions.length) return null;
    const totalPace = questions.reduce((acc, q) => acc + (q.paceMinutes || 0), 0);
    const totalHesitations = questions.reduce((acc, q) => acc + (q.hesitationDetected ? 1 : 0), 0);
    const emotionMap = questions.reduce((acc, q) => {
        const e = q.emotionDetected || 'neutral';
        acc[e] = (acc[e] || 0) + 1;
        return acc;
    }, {});
    
    const dominantEmotion = Object.keys(emotionMap).reduce((a, b) => (emotionMap[a] || 0) > (emotionMap[b] || 0) ? a : b, 'neutral');
    
    return {
        avgPace: Math.round(totalPace / questions.length),
        hesitationCount: totalHesitations,
        dominantEmotion
    };
  };

  const aggregates = calculateAggregates(qnas);

  if (isLoading) {
    return (
        <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
            <div className="h-12 w-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generating Behavioral Report...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
             <Badge className="mb-4 bg-violet-500/10 text-violet-500 border-violet-500/20 px-6 py-2 rounded-xl font-bold uppercase tracking-tighter">AI Behavior Coaching Active</Badge>
             <h1 className="text-4xl md:text-6xl font-black tracking-tight">Technical & <span className="text-violet-600">Behavioral</span> Analysis</h1>
             <p className="text-muted-foreground mt-2 text-lg">Beyond correctness: Evaluating your confidence, posture, and speech clarity.</p>
          </motion.div>
        </header>

        {/* Scoring Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <ScoreCard title="Confidence Level" score={aggregates?.dominantEmotion === 'confident' ? 88 : 72} outOf={100} icon={<UserSquare2 className="text-emerald-500" />} />
           <ScoreCard title="Eye Contact" score={85} outOf={100} icon={<Eye className="text-blue-500" />} />
           <ScoreCard title="Avg Pace (WPM)" score={aggregates?.avgPace || 0} icon={<Timer className="text-amber-500" />} />
           <ScoreCard title="Hesitations" score={aggregates?.hesitationCount || 0} icon={<Frown className="text-red-500" />} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div>
               <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                 <Video className="h-6 w-6 text-violet-500" /> Session Timeline
               </h3>
               <div className="space-y-4">
                  {qnas.map((q, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white dark:bg-slate-900 border-l-4 border-l-violet-500 overflow-hidden">
                       <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                             <h4 className="font-bold flex-1 pr-10 text-sm md:text-lg">{q.question}</h4>
                             <div className="flex gap-2">
                                {q.hesitationDetected && <Badge className="bg-red-500/10 text-red-500 border-red-500/10">Hesitation</Badge>}
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/10 uppercase text-[10px]">{q.emotionDetected || 'Neutral'}</Badge>
                             </div>
                          </div>
                          
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
                             <p className="text-xs md:text-sm text-slate-500 italic">" {q.userAns} "</p>
                          </div>

                          <div className="flex items-center justify-between">
                             <div className="flex gap-6">
                                <div className="text-center">
                                   <p className="text-[10px] font-black text-slate-400 uppercase">Tech Rating</p>
                                   <p className="font-black text-violet-500">{q.rating}/10</p>
                                </div>
                                <div className="text-center">
                                   <p className="text-[10px] font-black text-slate-400 uppercase">WPM</p>
                                   <p className="font-black text-blue-500">{q.paceMinutes}</p>
                                </div>
                             </div>
                             <Button variant="outline" size="sm" className="rounded-xl font-bold bg-slate-900 border-slate-800 hover:bg-slate-800 text-[10px] py-1 px-3">
                                <PlayCircle className="h-3 w-3 mr-2" /> REPLAY CLIP
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>

            <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
               <CardHeader className="bg-violet-600 p-8">
                  <CardTitle className="text-sm font-black tracking-widest uppercase flex items-center gap-2 text-white">
                    <Lightbulb className="h-4 w-4" /> Coach's Soft-Skill Tips
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-10 space-y-8">
                  <TipItem 
                    icon={<Eye className="text-blue-400" />} 
                    title="Work on Eye Contact" 
                    desc="You tended to look away during the complex technical questions. Maintaining gaze builds trust with the interviewer." 
                  />
                  <TipItem 
                    icon={<Frown className="text-amber-400" />} 
                    title="Filler Word Correction" 
                    desc={`We detected ${aggregates?.hesitationCount} moments of hesitation. Try replacing 'um' with a brief silence to sound more authoritative.`} 
                  />
                  <TipItem 
                    icon={<TrendingUp className="text-emerald-400" />} 
                    title="Speech Pace Optimization" 
                    desc={`Your pace was ${aggregates?.avgPace} WPM—nearly perfect. Keep this rhythm to stay understandable.`} 
                  />
               </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden">
                <div className="p-8 bg-indigo-600 text-white">
                   <h4 className="text-[10px] font-black tracking-widest uppercase mb-4 opacity-70">Overall Sentiment</h4>
                   <div className="flex items-center gap-4">
                      {aggregates?.dominantEmotion === 'confident' ? <Smile className="h-10 w-10 text-white fill-white/20" /> : <AlertTriangle className="h-10 w-10 text-white" />}
                      <div>
                         <p className="text-2xl font-black uppercase text-white">{aggregates?.dominantEmotion || 'Neutral'}</p>
                         <p className="text-[10px] opacity-80 uppercase font-black">Primary Emotional Signal</p>
                      </div>
                   </div>
                </div>
                <CardContent className="p-8">
                   <p className="text-sm text-slate-500 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-2">
                      "While your technical logic is sound, your delivery shows moments of nervousness when discussing architectural trade-offs."
                   </p>
                </CardContent>
             </Card>
             
             <Button size="lg" className="w-full h-20 rounded-[2.5rem] bg-violet-600 hover:bg-violet-500 shadow-xl shadow-violet-900/10 font-black text-xl" onClick={() => router.push("/dashboard")}>
                Return to Studio
             </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScoreCard({ title, score, outOf, icon }) {
  return (
    <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 rounded-3xl">
      <CardContent className="p-6 text-center">
         <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-4 flex items-center justify-center">
           {icon}
         </div>
         <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest">{title}</p>
         <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black">{score}</span>
            {outOf && <span className="text-sm font-bold text-muted-foreground">/{outOf}</span>}
         </div>
      </CardContent>
    </Card>
  );
}

function TipItem({ icon, title, desc }) {
   return (
      <div className="flex gap-6">
         <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
           {icon}
         </div>
         <div>
            <h5 className="font-black text-lg mb-1">{title}</h5>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">{desc}</p>
         </div>
      </div>
   )
}
