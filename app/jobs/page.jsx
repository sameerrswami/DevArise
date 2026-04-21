"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Search, 
  Plus,
  Loader2,
  Building2,
  Filter,
  Target,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function IntelligentJobBoard() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [isGapLoading, setIsGapLoading] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    fetchJobs();
    if (session) {
      fetchRecommendations();
      fetchUserData();
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch("/api/jobs/recommendations");
      const data = await res.json();
      if (data.success) {
        const recMap = {};
        data.recommendations.forEach(r => {
          recMap[r.jobId] = r;
        });
        setRecommendations(recMap);
      }
    } catch (error) {
      console.error("Recommendations Error:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user/profile"); // I'll assume this exists or I'll create it
      const data = await res.json();
      if (data.bookmarks) {
        setBookmarks(data.bookmarks);
      }
    } catch (error) {}
  };

  const analyzeGap = async (job) => {
    setSelectedJob(job);
    setGapAnalysis(null);
    setIsGapLoading(true);
    try {
      const res = await fetch("/api/jobs/gap", {
        method: "POST",
        body: JSON.stringify({ jobId: job.id }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setGapAnalysis(data.analysis);
    } catch (error) {
      toast.error("Failed to analyze skill gap.");
    } finally {
      setIsGapLoading(false);
    }
  };

  const toggleBookmark = async (jobId) => {
    const isBookmarked = bookmarks.includes(jobId);
    const newBookmarks = isBookmarked ? bookmarks.filter(id => id !== jobId) : [...bookmarks, jobId];
    setBookmarks(newBookmarks);
    
    try {
      await fetch("/api/user/bookmarks", {
        method: "POST",
        body: JSON.stringify({ bookmarks: newBookmarks }),
        headers: { "Content-Type": "application/json" }
      });
      toast.success(isBookmarked ? "Bookmark removed" : "Job bookmarked!");
    } catch (error) {
       toast.error("Failed to update bookmark.");
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    const scoreA = recommendations[a.id]?.score || 0;
    const scoreB = recommendations[b.id]?.score || 0;
    return scoreB - scoreA;
  });

  const filteredJobs = sortedJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                 <Sparkles className="h-3 w-3" />
                 AI-Powered Curation
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight tracking-tight">Smart <span className="gradient-text">Job Board</span></h1>
              <p className="text-muted-foreground mt-2 text-xl max-w-xl">
                 Bridging the gap between preparation and employment with intelligent role matching.
              </p>
           </motion.div>
           
           <div className="flex gap-4">
              <Button variant="outline" className="rounded-xl h-12 gap-2 border-slate-200">
                <Bookmark className="h-4 w-4" />
                My Bookmarks ({bookmarks.length})
              </Button>
           </div>
        </header>

        <Card className="mb-12 border-none bg-white dark:bg-slate-900 shadow-xl overflow-hidden rounded-3xl">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search software roles, companies, or tech stacks..." 
                className="pl-12 h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-lg focus-visible:ring-primary shadow-inner"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-14 px-8 rounded-2xl font-bold gap-2">
              <Filter className="h-5 w-5" />
              Analyze Best Fits
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
             <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
             <p className="text-muted-foreground font-medium animate-pulse">Running AI candidate-matching algorithms...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <AnimatePresence>
              {filteredJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  rec={recommendations[job.id]} 
                  onView={() => analyzeGap(job)}
                  onBookmark={() => toggleBookmark(job.id)}
                  isBookmarked={bookmarks.includes(job.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
           <DialogContent className="max-w-3xl border-none shadow-2xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
              {selectedJob && (
                <div>
                   <div className="bg-primary text-primary-foreground p-8">
                      <div className="flex justify-between items-start">
                         <div>
                            <Badge className="bg-white/20 text-white mb-2">{selectedJob.category}</Badge>
                            <h2 className="text-3xl font-black">{selectedJob.title}</h2>
                            <p className="opacity-80 flex items-center gap-2 mt-1">
                               <Building2 className="h-4 w-4" /> {selectedJob.company} • {selectedJob.location}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs uppercase font-black opacity-60">Compatibility</p>
                            <p className="text-4xl font-black">{recommendations[selectedJob.id]?.score || "??"}%</p>
                         </div>
                      </div>
                   </div>
                   
                   <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                      <section>
                         <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Job Description</h3>
                         <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-slate-200 pl-4">
                            {selectedJob.description}
                         </p>
                      </section>

                      <section>
                         <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                               <Sparkles className="h-4 w-4" /> AI Match Analysis
                            </h3>
                            {isGapLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                         </div>

                         {gapAnalysis ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card className="border-none shadow-md bg-emerald-500/5">
                                 <CardHeader className="pb-2">
                                    <h4 className="text-xs font-black uppercase text-emerald-600 flex items-center gap-2">
                                       <CheckCircle2 className="h-3 w-3" /> Strengths
                                    </h4>
                                 </CardHeader>
                                 <CardContent className="space-y-2">
                                    <p className="text-sm">You have high overlap with the core stack.</p>
                                 </CardContent>
                              </Card>

                              <Card className="border-none shadow-md bg-amber-500/5">
                                 <CardHeader className="pb-2">
                                    <h4 className="text-xs font-black uppercase text-amber-600 flex items-center gap-2">
                                       <AlertCircle className="h-3 w-3" /> Skill Gaps
                                    </h4>
                                 </CardHeader>
                                 <CardContent className="space-y-2">
                                    {gapAnalysis.missingSkills.map(s => (
                                      <Badge key={s} variant="outline" className="mr-1 border-amber-500/30 text-amber-600 bg-white">{s}</Badge>
                                    ))}
                                 </CardContent>
                              </Card>

                              <Card className="md:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 border border-slate-100">
                                 <CardHeader className="pb-2">
                                    <h4 className="text-xs font-black uppercase text-primary flex items-center gap-2">
                                       <TrendingUp className="h-3 w-3" /> Recommended Learning Path
                                    </h4>
                                 </CardHeader>
                                 <CardContent className="space-y-4">
                                    {gapAnalysis.learningPath.map((item, i) => (
                                      <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                                         <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                            {i + 1}
                                         </div>
                                         <div>
                                            <p className="font-bold text-sm mb-1">Master {item.skill}</p>
                                            <p className="text-xs text-muted-foreground">{item.suggestion}</p>
                                         </div>
                                      </div>
                                    ))}
                                 </CardContent>
                              </Card>
                           </div>
                         ) : (
                           <div className="py-12 text-center text-slate-400">
                              {isGapLoading ? "Comparing your profile with role requirements..." : "Click analyze to see your eligibility."}
                           </div>
                         )}
                      </section>
                   </div>

                   <CardFooter className="p-8 border-t flex justify-between bg-white dark:bg-slate-900">
                      <Button variant="ghost" onClick={() => setSelectedJob(null)}>Close</Button>
                      <Button className="rounded-xl px-10 font-bold h-12 shadow-xl hover:shadow-primary/30 transition-all">Submit Application</Button>
                   </CardFooter>
                </div>
              )}
           </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function JobCard({ job, rec, onView, onBookmark, isBookmarked }) {
  const score = rec?.score || 0;
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="group hover:shadow-2xl transition-all duration-300 border-none bg-white dark:bg-slate-900 overflow-hidden rounded-3xl group">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Score Side */}
            <div className={`md:w-32 flex flex-col justify-center items-center p-6 border-b md:border-b-0 md:border-r ${score >= 80 ? 'bg-primary text-primary-foreground' : score >= 50 ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
               <span className="text-[10px] font-black uppercase tracking-tighter opacity-80 mb-1">Match Score</span>
               <span className="text-3xl font-black">{score}%</span>
               {score > 0 && <TrendingUp className="h-4 w-4 mt-2 opacity-50" />}
            </div>

            <div className="flex-1 p-8">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                       <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 border-none text-[10px] uppercase font-black">{job.type}</Badge>
                       <span className="text-xs text-muted-foreground flex items-center gap-1">
                         <Calendar className="h-3 w-3" /> {new Date(job.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                    <h3 className="text-2xl font-black group-hover:text-primary transition-colors cursor-pointer" onClick={onView}>
                      {job.title}
                    </h3>
                    <p className="text-slate-500 font-bold flex items-center gap-2">
                       <Building2 className="h-4 w-4" /> {job.company}
                    </p>
                 </div>
                 <Button variant="ghost" size="icon" className={`rounded-xl ${isBookmarked ? 'bg-primary/20 text-primary' : ''}`} onClick={onBookmark}>
                    <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                 </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm mt-6 text-slate-500">
                 <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {job.location}
                 </span>
                 <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" /> {job.salary || "Competitive"}
                 </span>
                 {rec?.reason && (
                   <span className="flex items-center gap-2 text-primary font-bold bg-primary/5 px-2 py-0.5 rounded text-xs italic">
                     <Target className="h-3 w-3" /> {rec.reason}
                   </span>
                 )}
              </div>
            </div>

            <div className="md:w-56 p-8 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l bg-slate-50/50 dark:bg-slate-800/20">
               <Button className="w-full rounded-xl font-bold gap-2" onClick={onView}>
                  View Match
                  <ChevronRight className="h-4 w-4" />
               </Button>
               <Button variant="outline" className="w-full rounded-xl text-xs border-slate-200">Quick Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
