"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Code, 
  Database, 
  Globe, 
  Server, 
  Shield, 
  Cpu, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Lock,
  Sparkles,
  Zap,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const TRACKS = [
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    description: "The foundation of technical interviews and efficient problem-solving.",
    icon: <Cpu className="h-6 w-6 text-blue-500" />,
    modules: [
      { id: "m1", title: "Fundamental Data Structures", topics: ["Arrays", "Linked Lists", "Stacks", "Queues"], difficulty: "Beginner" },
      { id: "m2", title: "Searching & Sorting", topics: ["QuickSort", "MergeSort", "Binary Search"], difficulty: "Intermediate" },
      { id: "m3", title: "Non-Linear Structures", topics: ["Trees", "Heaps", "Hash Tables"], difficulty: "Intermediate" },
      { id: "m4", title: "Advanced Algorithms", topics: ["Dynamic Programming", "Graphs", "Greedy Algorithms"], difficulty: "Advanced" },
    ]
  },
  {
    id: "webdev",
    title: "Full-Stack Web Development",
    description: "Build industrial-grade web applications from scratch.",
    icon: <Globe className="h-6 w-6 text-emerald-500" />,
    modules: [
      { id: "w1", title: "Frontend Foundations", topics: ["React.js", "Tailwind CSS", "Hooks"], difficulty: "Beginner" },
      { id: "w2", title: "Backend Systems", topics: ["Node.js", "Express.js", "RESTful APIs"], difficulty: "Intermediate" },
      { id: "w3", title: "Database Architecture", topics: ["PostgreSQL", "MongoDB", "Prisma ORM"], difficulty: "Intermediate" },
      { id: "w4", title: "Deployment & Scale", topics: ["Docker", "AWS", "CI/CD"], difficulty: "Advanced" },
    ]
  },
  {
    id: "corecs",
    title: "Core Computer Science",
    description: "Operating Systems, DBMS, and Networks - essential for top-tier roles.",
    icon: <Database className="h-6 w-6 text-purple-500" />,
    modules: [
      { id: "c1", title: "Operating Systems", topics: ["Process Mgmt", "Memory Mgmt", "Deadlocks"], difficulty: "Intermediate" },
      { id: "c2", title: "DBMS Mastery", topics: ["SQL Queries", "Normalization", "Indexing"], difficulty: "Intermediate" },
      { id: "c3", title: "Computer Networks", topics: ["TCP/IP", "WebSockets", "HTTP/S"], difficulty: "Intermediate" },
    ]
  }
];

export default function StructuredLearn() {
  const router = useRouter();
  const [selectedTrack, setSelectedTrack] = useState(TRACKS[0]);

  const startModule = (module) => {
    // Curate and redirect
    const searchTerm = `${selectedTrack.title} ${module.title} ${module.topics.join(' ')}`;
    router.push(`/?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                <Target className="h-3 w-3" />
                Guided Mastery
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Learning <span className="gradient-text">Tracks</span></h1>
              <p className="text-muted-foreground mt-4 text-xl max-w-2xl">
                Structured paths designed by industry experts to turn you from a beginner into a placement-ready engineer.
              </p>
           </motion.div>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
           {/* Sidebar: Track Toggles */}
           <div className="w-full lg:w-80 space-y-4">
              {TRACKS.map(track => (
                <div 
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  className={`p-6 rounded-3xl cursor-pointer transition-all border-2 ${selectedTrack.id === track.id ? 'bg-white dark:bg-slate-900 border-primary shadow-xl scale-105' : 'bg-transparent border-transparent grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-slate-200'}`}
                >
                   <div className="flex items-center gap-4">
                      {track.icon}
                      <div>
                         <h3 className="font-bold text-sm tracking-tight">{track.title}</h3>
                         <p className="text-[10px] uppercase font-black tracking-widest opacity-50">{track.modules.length} Modules</p>
                      </div>
                   </div>
                </div>
              ))}

              <Card className="mt-8 border-none bg-primary text-primary-foreground rounded-3xl overflow-hidden shadow-2xl">
                 <CardContent className="p-8">
                    <Zap className="h-10 w-10 mb-4 opacity-50" />
                    <h4 className="text-xl font-black mb-2 leading-tight">Fast-Track Your Success</h4>
                    <p className="text-xs opacity-80 leading-relaxed mb-6">Complete 2 modules this week to unlock the **Advanced Assessment** badge.</p>
                    <Button variant="secondary" className="w-full rounded-xl font-bold">View Rewards</Button>
                 </CardContent>
              </Card>
           </div>

           {/* Main Path View */}
           <div className="flex-1 space-y-8">
              <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                       <h2 className="text-3xl font-black mb-2">{selectedTrack.title}</h2>
                       <p className="text-muted-foreground">{selectedTrack.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-xs font-black uppercase text-primary mb-1">Track Progress</span>
                       <div className="flex items-center gap-3">
                          <Progress value={25} className="w-32 h-2" />
                          <span className="text-sm font-bold">25%</span>
                       </div>
                    </div>
                 </div>

                 <div className="relative space-y-12">
                    <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-gradient-to-b from-primary to-slate-200 dark:to-slate-800 rounded-full" />
                    
                    {selectedTrack.modules.map((mod, i) => (
                       <div key={mod.id} className="flex gap-8 group">
                          <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white dark:border-slate-950 shadow-lg ${i === 0 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                             {i === 0 ? <Play className="h-6 w-6 fill-current" /> : <Lock className="h-5 w-5" />}
                          </div>
                          
                          <div className="flex-1 space-y-4 pb-4">
                             <div className="flex justify-between items-start">
                                <div>
                                   <Badge variant="outline" className="text-[10px] mb-2">{mod.difficulty}</Badge>
                                   <h4 className={`text-xl font-bold ${i === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{mod.title}</h4>
                                </div>
                                {i === 0 && (
                                   <Button className="rounded-xl font-bold gap-2" onClick={() => startModule(mod)}>
                                      Start Exploring
                                      <ChevronRight className="h-4 w-4" />
                                   </Button>
                                )}
                             </div>
                             
                             <div className="flex flex-wrap gap-2">
                                {mod.topics.map((t, ti) => (
                                   <span key={ti} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${i === 0 ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-transparent border-slate-100 text-slate-300'}`}>
                                      {t}
                                   </span>
                                ))}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
