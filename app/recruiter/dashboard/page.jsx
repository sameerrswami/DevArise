"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Filter, 
  Star, 
  Bookmark, 
  Briefcase, 
  ChevronRight, 
  Trophy, 
  Zap, 
  Target,
  ExternalLink,
  MessageSquare,
  LayoutGrid,
  List,
  ArrowUpDown,
  CheckCircle2,
  X,
  FileText,
  BarChart4,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function RecruiterDashboard() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [activeTab, setActiveTab] = useState("all"); // all or shortlisted
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [comparisonList, setComparisonList] = useState([]);

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/recruiter/candidates");
      const data = await res.json();
      setCandidates(data.candidates || []);
      setFilteredCandidates(data.candidates || []);
    } catch (err) {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    let result = candidates;
    if (activeTab === "shortlisted") {
      result = result.filter(c => c.isShortlisted);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name?.toLowerCase().includes(q) || 
        c.targetRole?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    setFilteredCandidates(result);
  }, [searchQuery, activeTab, candidates]);

  const toggleShortlist = async (candidate) => {
    try {
      if (candidate.isShortlisted) {
        await fetch("/api/recruiter/shortlist", {
          method: "DELETE",
          body: JSON.stringify({ shortlistId: candidate.shortlistId }),
          headers: { "Content-Type": "application/json" }
        });
        toast.success("Removed from shortlist");
      } else {
        await fetch("/api/recruiter/shortlist", {
          method: "POST",
          body: JSON.stringify({ candidateId: candidate.id }),
          headers: { "Content-Type": "application/json" }
        });
        toast.success("Added to shortlist");
      }
      fetchCandidates();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const addToComparison = (candidate) => {
    if (comparisonList.length >= 3) {
      toast.warning("You can compare up to 3 candidates");
      return;
    }
    if (comparisonList.find(c => c.id === candidate.id)) return;
    setComparisonList([...comparisonList, candidate]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
         <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
         <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Scanning Talent Pool...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar / Sidebar Navigation can be here, but let's do a top-header layout */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-12 space-y-4">
           <div className="flex justify-between items-end">
              <div>
                 <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-widest mb-2">
                    <Users className="h-4 w-4" /> Company Portal
                 </div>
                 <h1 className="text-4xl font-bold tracking-tight">Talent <span className="text-violet-500">Discovery</span></h1>
                 <p className="text-slate-500 text-sm mt-1">Discover, evaluate, and hire top-tier developers.</p>
              </div>
              <div className="flex gap-4">
                 <Button variant="outline" className="rounded-2xl border-slate-800 bg-slate-900/50 hover:bg-slate-800">
                    <FileText className="h-4 w-4 mr-2" /> Recent Hires
                 </Button>
                 <Button className="bg-violet-600 hover:bg-violet-500 rounded-2xl px-6">
                    Post a New Job
                 </Button>
              </div>
           </div>

           {/* Toolbar */}
           <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-900">
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                 <Input 
                   placeholder="Search candidates by name, role, or skill..." 
                   className="pl-12 bg-slate-900/50 border-slate-800 rounded-2xl h-12 focus:ring-violet-500/20"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-2xl">
                 <button 
                  onClick={() => setActiveTab("all")}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   All Talents
                 </button>
                 <button 
                  onClick={() => setActiveTab("shortlisted")}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'shortlisted' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Shortlisted ({candidates.filter(c => c.isShortlisted).length})
                 </button>
              </div>
              <div className="flex items-center gap-2 px-2 bg-slate-900/50 border border-slate-800 rounded-2xl">
                 <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={viewMode === 'grid' ? 'text-violet-400' : 'text-slate-500'}>
                    <LayoutGrid className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={viewMode === 'list' ? 'text-violet-400' : 'text-slate-500'}>
                    <List className="h-4 w-4" />
                 </Button>
              </div>
           </div>
        </header>

        {/* Comparison Bar */}
        <AnimatePresence>
          {comparisonList.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-2xl border border-violet-500/30 rounded-3xl p-4 shadow-2xl z-50 flex items-center gap-6 min-w-[500px]"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4 border-r border-slate-800">Compare Candidates</div>
              <div className="flex gap-4 flex-1">
                 {comparisonList.map(c => (
                   <div key={c.id} className="group relative">
                      <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 p-0.5 overflow-hidden">
                         <img src={c.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`} className="h-full w-full object-cover rounded-lg" />
                      </div>
                      <button 
                        onClick={() => setComparisonList(comparisonList.filter(item => item.id !== c.id))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                      >
                         <X className="h-3 w-3" />
                      </button>
                   </div>
                 ))}
                 {comparisonList.length < 3 && (
                   <div className="h-12 w-12 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-700">
                      <Users className="h-5 w-5" />
                   </div>
                 )}
              </div>
              <Button disabled={comparisonList.length < 2} className="bg-violet-600 hover:bg-violet-500 rounded-xl px-6">
                 Run Comparison
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
           {filteredCandidates.map((candidate) => (
             <CandidateCard 
                key={candidate.id} 
                candidate={candidate} 
                viewMode={viewMode}
                onShortlist={() => toggleShortlist(candidate)}
                onCompare={() => addToComparison(candidate)}
                onView={() => setSelectedCandidate(candidate)}
             />
           ))}
        </div>

        {filteredCandidates.length === 0 && (
           <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px]">
              <Users className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-500">No candidates found matching your criteria</h3>
           </div>
        )}
      </div>

      {/* Detail Modal Placeholder */}
      <AnimatePresence>
        {selectedCandidate && (
          <CandidateDetailModal 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CandidateCard({ candidate, viewMode, onShortlist, onCompare, onView }) {
  const isList = viewMode === "list";
  
  return (
    <motion.div
      layout
      className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-violet-500/30 transition-all group relative overflow-hidden ${isList ? 'flex items-center gap-8' : ''}`}
    >
       <div className={`flex items-start justify-between ${isList ? 'w-auto' : 'mb-6'}`}>
          <div className="flex items-center gap-4">
             <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-violet-500/20 p-1 overflow-hidden">
                <img src={candidate.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} className="h-full w-full object-cover rounded-xl" />
             </div>
             <div>
                <h3 className="font-bold text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight">{candidate.name || 'Anonymous User'}</h3>
                <p className="text-slate-500 text-xs font-bold tracking-widest">{candidate.targetRole || 'Developing Professional'}</p>
             </div>
          </div>
          <div className="flex flex-col gap-2">
             <button 
              onClick={(e) => { e.stopPropagation(); onShortlist(); }}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${candidate.isShortlisted ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
             >
                <Bookmark className={`h-4 w-4 ${candidate.isShortlisted ? 'fill-current' : ''}`} />
             </button>
             <button 
              onClick={(e) => { e.stopPropagation(); onCompare(); }}
              className="h-10 w-10 rounded-xl bg-slate-800 text-slate-500 hover:bg-violet-600/20 hover:text-violet-400 border border-transparent hover:border-violet-500/20 flex items-center justify-center transition-all"
             >
                <ArrowUpDown className="h-4 w-4" />
             </button>
          </div>
       </div>

       <div className={`grid grid-cols-2 gap-4 ${isList ? 'flex-1 border-x border-slate-800 px-8 mx-8' : 'mb-8'}`}>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/30">
             <div className="flex justify-between items-center mb-1">
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Coding</span>
             </div>
             <p className="text-lg font-black text-white">{candidate.totalProblemsSolved || 0}</p>
             <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Solved Problems</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/30">
             <div className="flex justify-between items-center mb-1">
                <Trophy className="h-3 w-3 text-violet-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Points</span>
             </div>
             <p className="text-lg font-black text-white">{candidate.points || 0}</p>
             <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Platform Points</p>
          </div>
       </div>

       <div className={`${isList ? 'w-64' : 'space-y-4'}`}>
          <div className="flex flex-wrap gap-2">
             {(candidate.skills?.slice(0, 3) || []).map(skill => (
               <Badge key={skill} variant="secondary" className="bg-slate-900 border-slate-800 text-[9px] uppercase font-black">{skill}</Badge>
             ))}
             {(candidate.skills?.length > 3) && <span className="text-[10px] text-slate-600 font-bold">+{candidate.skills.length - 3}</span>}
          </div>
          <Button onClick={onView} className="w-full h-12 bg-slate-800 hover:bg-violet-600 hover:text-white text-slate-400 font-black rounded-2xl transition group/btn">
             View Candidate <ExternalLink className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
          </Button>
       </div>
    </motion.div>
  );
}

function CandidateDetailModal({ candidate, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col"
      >
         <button onClick={onClose} className="absolute top-8 right-8 h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <X className="h-5 w-5" />
         </button>
         
         <div className="p-10 pb-0 flex gap-10 items-end">
            <div className="h-32 w-32 rounded-[32px] bg-violet-600/20 border border-violet-500/20 p-2">
               <img src={candidate.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} className="h-full w-full object-cover rounded-2xl" />
            </div>
            <div className="flex-1 pb-2">
               <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl font-black">{candidate.name}</h2>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4">Top 5%</Badge>
               </div>
               <div className="flex items-center gap-6 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  <span className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> {candidate.targetRole}</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> {candidate.academicStatus}</span>
                  <span className="flex items-center gap-1.5"><Target className="h-3 w-3" /> Placement Readiness: 88%</span>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
               <div>
                  <h4 className="text-xs font-black tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
                    <BarChart4 className="h-4 w-4 text-violet-500" /> Performance Breakdown
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                     <DetailStat label="Logic Score" value="92/100" />
                     <DetailStat label="Comm. Rating" value="4.8/5" />
                     <DetailStat label="Solve Speed" value="Fast" />
                  </div>
               </div>

               <div>
                  <h4 className="text-xs font-black tracking-widest uppercase text-slate-500 mb-4">Technical Stack</h4>
                  <div className="flex flex-wrap gap-2">
                     {(candidate.skills || ['React', 'Node.js', 'Typescript', 'Python', 'System Design']).map(skill => (
                        <Badge key={skill} className="px-6 py-3 bg-slate-800 text-slate-200 border-slate-700 rounded-2xl font-bold uppercase text-[10px]">{skill}</Badge>
                     ))}
                  </div>
               </div>

               <div>
                  <h4 className="text-xs font-black tracking-widest uppercase text-slate-500 mb-4">Verified Projects</h4>
                  <div className="space-y-4">
                     {[1, 2].map(p => (
                       <div key={p} className="p-6 rounded-[2rem] bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all cursor-pointer">
                          <h5 className="font-bold mb-1">Decentralized AI Marketplace</h5>
                          <p className="text-xs text-slate-500 leading-relaxed italic mb-4 line-clamp-2">"A peer-to-peer network allowing users to rent out unused GPU power for AI training tasks, built on Ethereum..."</p>
                          <div className="flex gap-2">
                             <Badge variant="secondary" className="bg-slate-900 text-[9px]">Solidity</Badge>
                             <Badge variant="secondary" className="bg-slate-900 text-[9px]">Next.js</Badge>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <Card className="bg-violet-600 text-white rounded-[2rem] border-none p-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-6">Recruiter Actions</h4>
                  <div className="space-y-3">
                     <Button className="w-full h-14 bg-white text-violet-600 hover:bg-slate-100 font-extrabold rounded-2xl transition">
                        Request Interview
                     </Button>
                     <Button variant="outline" className="w-full h-14 bg-white/10 hover:bg-white/20 text-white border-white/20 font-extrabold rounded-2xl transition">
                        View Resume PDF
                     </Button>
                  </div>
               </Card>

               <div className="p-8 rounded-[2rem] bg-slate-800/50 border border-slate-700/50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Internal Notes</h4>
                  <textarea 
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:ring-violet-500/20 outline-none h-40 resize-none"
                    placeholder="Candidate shows strong analytical skills in Mock Interview #3..."
                  />
                  <Button className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-10 font-bold text-xs uppercase transition">Save Note</Button>
               </div>
            </div>
         </div>
      </motion.div>
    </div>
  );
}

function DetailStat({ label, value }) {
  return (
    <div className="p-6 rounded-3xl bg-slate-800/50 border border-slate-700/50 text-center">
       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
       <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}
