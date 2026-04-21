"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Sparkles, 
  Code2, 
  Layers, 
  Timer, 
  Target, 
  ArrowRight, 
  Loader2,
  Terminal,
  Cpu,
  Database,
  Globe,
  Rocket,
  Plus,
  X,
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectHub() {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setHasStarted(true);
    try {
      const res = await fetch("/api/projects/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests })
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch project recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient dark:bg-slate-950 transition-colors duration-500">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="space-y-12">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 max-w-2xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                        <Rocket className="h-3 w-3" />
                        Portfolio Architect
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                        Build Projects that <br /><span className="gradient-text">Get You Hired</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium">
                        Our AI analyzes your resume gaps and career goals to suggest the perfect projects to complete your professional profile.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full md:w-80 space-y-4"
                >
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Target className="h-3 w-3" /> Your Tech Interests
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="e.g. AI, Crypto, SaaS"
                                className="flex-1 bg-background border rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 ring-primary outline-none"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                            />
                            <Button size="icon" className="rounded-xl" onClick={handleAddInterest}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                            {interests.map(i => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                >
                                    <Badge variant="secondary" className="pl-3 pr-1 py-1 rounded-full gap-1 border-primary/20 bg-primary/5 text-primary">
                                        {i}
                                        <button onClick={() => handleRemoveInterest(i)} className="hover:bg-primary/10 rounded-full p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <Button 
                        className="w-full rounded-2xl h-14 font-black shadow-xl shadow-primary/20 group"
                        onClick={fetchRecommendations}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />}
                        Generate Recommendations
                    </Button>
                </motion.div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {!hasStarted ? (
                    <motion.div 
                        key="empty"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12"
                    >
                        {[
                            { title: "Bridge the Gaps", desc: "We identify missing technologies in your resume and suggest projects that use them.", icon: <Layers className="h-8 w-8" /> },
                            { title: "Scale with Intent", desc: "From simple CRUD to complex System Design, grow through levels naturally.", icon: <Cpu className="h-8 w-8" /> },
                            { title: "Career Focused", desc: "Build projects that specific companies you target actually value.", icon: <Briefcase className="h-8 w-8" /> }
                        ].map((item, idx) => (
                            <Card key={idx} className="glass-card border-none p-8 space-y-6 rounded-[2.5rem] bg-card/40">
                                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-black">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    {item.desc}
                                </p>
                            </Card>
                        ))}
                    </motion.div>
                ) : isLoading ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32 space-y-8"
                    >
                        <div className="relative h-32 w-32">
                           <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-[2.5rem] border-4 border-primary/10 border-t-primary"
                           />
                           <div className="absolute inset-0 flex items-center justify-center">
                                <Terminal className="h-12 w-12 text-primary animate-pulse" />
                           </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-3xl font-black mb-2">Analyzing Portfolio Gaps</h3>
                            <p className="text-muted-foreground font-medium">Scanning your skills and architecting high-impact projects...</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4 py-6 border-b">
                            <h2 className="text-3xl font-black">Curated for You</h2>
                            <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{projects.length} Projects found</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {projects.map((project, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="glass-card border-none overflow-hidden rounded-[3rem] group hover:shadow-2xl transition-all duration-300 border border-transparent hover:border-primary/20">
                                        <CardHeader className="p-8 pb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <Badge className={`rounded-xl px-4 py-1 font-black tracking-widest uppercase ${
                                                    project.difficulty === "Advanced" ? "bg-red-500" :
                                                    project.difficulty === "Intermediate" ? "bg-orange-500" : "bg-emerald-500"
                                                }`}>
                                                    {project.difficulty}
                                                </Badge>
                                                <div className="flex gap-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                                                        <Timer className="h-3 w-3" /> {project.estimatedTime}
                                                    </div>
                                                </div>
                                            </div>
                                            <CardTitle className="text-3xl font-black group-hover:text-primary transition-colors">{project.title}</CardTitle>
                                            <CardDescription className="text-base text-muted-foreground font-medium mt-2 leading-relaxed">
                                                {project.summary}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-6">
                                            <div className="bg-primary/5 rounded-[2rem] p-6 space-y-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                    <CheckCircle2 className="h-3 w-3" /> Gap Addressed
                                                </p>
                                                <p className="text-sm font-bold text-primary/80">
                                                    {project.gapFilled}
                                                </p>
                                                <div className="h-px bg-primary/10" />
                                                <div className="flex flex-wrap gap-2">
                                                    {project.techStack.map(tech => (
                                                        <Badge key={tech} variant="outline" className="bg-background/50 text-foreground border-primary/20">
                                                            {tech}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Lightbulb className="h-3 w-3 text-amber-500" /> Career Impact
                                                </p>
                                                <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                                    {project.careerImpact}
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                {project.keyFeatures.slice(0, 3).map((f, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                        {f}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-8 pt-0">
                                            <Button className="w-full rounded-2xl h-14 font-black text-lg gap-2 group/btn">
                                                Start Project <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-2 transition-transform" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
