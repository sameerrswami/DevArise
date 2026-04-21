"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Github, 
  Search, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  Target, 
  ExternalLink,
  Zap,
  ChevronRight,
  Fingerprint,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function ResumeOptimizer() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [resumeText, setResumeText] = useState("");
  
  // GitHub state
  const [githubUser, setGithubUser] = useState("");
  const [githubResults, setGithubResults] = useState(null);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  // JD matching state
  const [jobDescription, setJobDescription] = useState("");
  const [matchResults, setMatchResults] = useState(null);
  const [isMatching, setIsMatching] = useState(false);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    setIsAnalyzing(true);
    setResults(null);
    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.analysis);
        setResumeText(data.resumeText);
        toast.success("Resume analyzed successfully!");
      }
    } catch (error) {
      toast.error("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeGithub = async () => {
    if (!githubUser) return;
    setIsGithubLoading(true);
    try {
      const res = await fetch("/api/github/analyze", {
        method: "POST",
        body: JSON.stringify({ username: githubUser }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setGithubResults(data.analysis);
      }
    } catch (error) {
      toast.error("GitHub analysis failed.");
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handleJDMatch = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Upload a resume first, and provide a job description.");
      return;
    }
    setIsMatching(true);
    try {
      const res = await fetch("/api/resume/match", {
        method: "POST",
        body: JSON.stringify({ resumeText, jobDescription }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setMatchResults(data.matchResults);
      }
    } catch (error) {
      toast.error("Matching failed.");
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                <Zap className="h-3 w-3" />
                AI Profile Optimization
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Level Up Your <span className="gradient-text">Profile</span></h1>
              <p className="text-muted-foreground mt-4 text-xl max-w-2xl">
                Get precision-level data on your resume, projects, and GitHub presence to dominate campus placements.
              </p>
           </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Sidebar: Controls */}
           <div className="space-y-6">
              <Card className="border-none shadow-xl overflow-hidden">
                 <CardHeader className="bg-primary text-primary-foreground">
                    <CardTitle className="flex items-center gap-2">
                       <Upload className="h-5 w-5" />
                       Resume Upload
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer relative">
                       <input 
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer" 
                         onChange={handleFileUpload}
                         accept=".pdf"
                       />
                       <FileText className="h-10 w-10 mx-auto text-slate-400 mb-4" />
                       <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                         {file ? file.name : "Drop your PDF here or click to browse"}
                       </p>
                       <p className="text-[10px] text-muted-foreground mt-2 uppercase font-black uppercase tracking-widest">Supports PDF (ATS Optimized)</p>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-none shadow-xl">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                       <Github className="h-5 w-5" />
                       GitHub Audit
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    <div className="flex gap-2">
                       <Input 
                         placeholder="GitHub Username" 
                         className="rounded-xl border-slate-200"
                         value={githubUser}
                         onChange={(e) => setGithubUser(e.target.value)}
                       />
                       <Button size="icon" className="rounded-xl shrink-0" onClick={analyzeGithub} disabled={isGithubLoading}>
                          {isGithubLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                       </Button>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-indigo-600 text-white overflow-hidden">
                <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Job Matcher
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                   <Textarea 
                     placeholder="Paste the Job Description (JD) here to check your alignment score..." 
                     className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[150px] rounded-xl mb-4"
                     value={jobDescription}
                     onChange={(e) => setJobDescription(e.target.value)}
                   />
                   <Button variant="secondary" className="w-full font-bold rounded-xl" onClick={handleJDMatch} disabled={isMatching}>
                      {isMatching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Analyze Match %"}
                   </Button>
                </CardContent>
              </Card>
           </div>

           {/* Main Content: Results */}
           <div className="lg:col-span-2 space-y-8">
              {isAnalyzing && (
                <Card className="border-none shadow-xl p-20 text-center animate-pulse">
                   <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin mb-4" />
                   <h2 className="text-2xl font-black">AI Recruiter is thinking...</h2>
                   <p className="text-muted-foreground mt-2">Checking keywords, formatting, and project impact.</p>
                </Card>
              )}

              {results && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                   {/* Main Score & Metrics */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="md:col-span-1 p-8 text-center border-none shadow-xl bg-primary text-primary-foreground rounded-3xl">
                         <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-70">Overall ATS Score</h3>
                         <div className="text-6xl font-black mb-4">{results.score}</div>
                         <p className="text-sm font-bold opacity-80">Ranked higher than 85% of applicants.</p>
                      </Card>
                      
                      <div className="md:col-span-2 grid grid-cols-2 gap-4">
                         {Object.entries(results.details).map(([key, val]) => (
                            <Card key={key} className="p-4 border-none shadow-md bg-white dark:bg-slate-900 flex flex-col justify-between">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{key}</h4>
                               <p className="text-xs text-muted-foreground line-clamp-3 italic">"{val}"</p>
                            </Card>
                         ))}
                      </div>
                   </div>

                   {/* Action Items */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Card className="border-none shadow-lg">
                         <CardHeader className="bg-emerald-500/5 text-emerald-600 border-b border-emerald-500/10">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                               <CheckCircle2 className="h-4 w-4" />
                               Parsed Core Skills
                            </CardTitle>
                         </CardHeader>
                         <CardContent className="p-6 flex flex-wrap gap-2">
                            {results.parsedInfo.skills.map(s => (
                              <div key={s} className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">{s}</div>
                            ))}
                         </CardContent>
                      </Card>

                      <Card className="border-none shadow-lg">
                        <CardHeader className="bg-amber-500/5 text-amber-600 border-b border-amber-500/10">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                               <AlertCircle className="h-4 w-4" />
                               Critical Action Items
                            </CardTitle>
                         </CardHeader>
                         <CardContent className="p-6 space-y-3">
                            {results.suggestions.actionItems.map((item, i) => (
                              <div key={i} className="flex gap-3 text-sm italic py-2 border-b border-slate-50 last:border-0">
                                 <ChevronRight className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                 <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item}</p>
                              </div>
                            ))}
                         </CardContent>
                      </Card>
                   </div>
                </motion.div>
              )}

              {githubResults && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                   <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
                      <div className="p-8 pb-0">
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                               <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                                  <Github className="h-10 w-10 text-white" />
                               </div>
                               <div>
                                  <h3 className="text-2xl font-black">GitHub Audit</h3>
                                  <p className="text-slate-400 text-sm">Professional Technical Presence Analysis</p>
                               </div>
                            </div>
                            <div className="text-center">
                               <div className="text-4xl font-black text-primary">{githubResults.score}</div>
                               <p className="text-[10px] uppercase font-black opacity-50">Presence Score</p>
                            </div>
                         </div>
                      </div>

                      <CardContent className="p-8 pt-4 space-y-8">
                         <div className="p-6 bg-white/5 rounded-2xl border border-white/10 italic text-slate-300">
                           "{githubResults.feedback}"
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                               <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Profile Strengths
                               </h4>
                               <div className="space-y-2">
                                  {githubResults.strengths.map(s => (
                                     <div key={s} className="flex items-center gap-2 text-sm opacity-80">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        {s}
                                     </div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                                  <Fingerprint className="h-4 w-4" />
                                  Project Roadmap
                               </h4>
                               <div className="space-y-2">
                                  {githubResults.recommendedProjects.map(p => (
                                     <div key={p} className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs italic text-indigo-300">
                                        {p}
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                </motion.div>
              )}

              {matchResults && (
                <div className="p-10 bg-gradient-to-br from-indigo-600 via-violet-700 to-primary rounded-3xl text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Target className="h-64 w-64 -mr-20 -mt-20" />
                   </div>
                   <div className="relative z-10 text-center mb-10">
                      <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Role Alignment Score</h3>
                      <div className="text-8xl font-black tracking-tighter">{matchResults.matchPercentage}</div>
                      <p className="mt-4 text-white/80 max-w-lg mx-auto italic">"{matchResults.alignmentFeedback}"</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                      <Card className="bg-white/10 border-white/20 shadow-none backdrop-blur-md">
                         <CardHeader>
                            <CardTitle className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                               <Users className="h-4 w-4" />
                               Missing Skills
                            </CardTitle>
                         </CardHeader>
                         <CardContent className="flex flex-wrap gap-2">
                            {matchResults.missingSkills.map(s => (
                              <div key={s} className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white shadow-md border border-white/20">{s}</div>
                            ))}
                         </CardContent>
                      </Card>
                      
                      <Card className="bg-white/10 border-white/20 shadow-none backdrop-blur-md">
                         <CardHeader>
                            <CardTitle className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                               <Fingerprint className="h-4 w-4" />
                               Recommended Tweaks
                            </CardTitle>
                         </CardHeader>
                         <CardContent className="p-4 pt-0">
                            <p className="text-xs italic leading-relaxed text-white/80">{matchResults.resumeTweaks}</p>
                         </CardContent>
                      </Card>
                   </div>
                </div>
              )}

              {!results && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center px-10">
                   <FileText className="h-20 w-20 text-slate-200 mb-6" />
                   <h2 className="text-2xl font-black text-slate-400">Your Journey Starts with a Resume</h2>
                   <p className="text-muted-foreground mt-2 max-w-sm">
                     Upload your technical resume to start the AI analysis and see your global ranking.
                   </p>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}
