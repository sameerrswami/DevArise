"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Target, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Loader2,
  Clock,
  BookOpen,
  Trophy,
  ArrowRight,
  LayoutDashboard,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PlacementRoadmap() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  
  const [formData, setFormData] = useState({
    year: "3rd Year",
    targetRole: "Software Development Engineer (SDE)",
    targetCompanyType: "Product-Based",
    skillLevel: "Intermediate",
    dailyTime: "4",
    subjects: ["DSA"]
  });

  useEffect(() => {
    fetchActiveRoadmap();
  }, []);

  const fetchActiveRoadmap = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/roadmap/generate");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setRoadmap(data);
          setStep(3);
        }
      }
    } catch (error) {
      console.error("Failed to fetch active roadmap");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
        setStep(3);
      }
    } catch (error) {
      console.error("Roadmap generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskToggle = async (taskId, isCompleted) => {
    try {
      // Optimistic update
      const updatedRoadmap = JSON.parse(JSON.stringify(roadmap));
      updatedRoadmap.phases.forEach(p => {
        p.weeks.forEach(w => {
          w.tasks.forEach(t => {
            if (t.id === taskId) t.isCompleted = isCompleted;
          });
        });
      });
      setRoadmap(updatedRoadmap);

      const res = await fetch("/api/roadmap/task", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, isCompleted })
      });
      
      if (!res.ok) {
          // Revert on failure
          fetchActiveRoadmap();
      }
    } catch (error) {
      console.error("Failed to update task");
      fetchActiveRoadmap();
    }
  };

  const handleAdjustRoadmap = async () => {
    setIsAdjusting(true);
    try {
        const res = await fetch("/api/roadmap/adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
            const data = await res.json();
            setRoadmap(data);
        }
    } catch (error) {
        console.error("Failed to adjust roadmap");
    } finally {
        setIsAdjusting(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient dark:bg-slate-950 transition-colors duration-500">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <AnimatePresence mode="wait">
          {step === 1 && !isLoading && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 py-12"
            >
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight">
                Your Career, <br /><span className="gradient-text">Architected by AI</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Stop guessing. Get a personalized, week-by-week placement roadmap tailored to your specific goals and timeline.
              </p>
              <Button size="lg" className="rounded-full px-12 h-16 text-xl font-bold group" onClick={() => setStep(2)}>
                Start Building Roadmap <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="glass-card border-none shadow-2xl p-8">
                <CardHeader className="px-0 pt-0 mb-8">
                  <CardTitle className="text-3xl font-black">Onboarding Profile</CardTitle>
                  <CardDescription>Tell us about your background to customize your path.</CardDescription>
                </CardHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Academic Year</label>
                        <Select onValueChange={(v) => handleInputChange("year", v)} defaultValue={formData.year}>
                            <SelectTrigger className="rounded-xl h-12">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1st Year">1st Year</SelectItem>
                                <SelectItem value="2nd Year">2nd Year</SelectItem>
                                <SelectItem value="3rd Year">3rd Year</SelectItem>
                                <SelectItem value="Final Year">Final Year</SelectItem>
                                <SelectItem value="Graduated">Graduated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Daily Commitment</label>
                        <Input 
                            type="number" 
                            className="rounded-xl h-12" 
                            placeholder="Hours per day" 
                            value={formData.dailyTime}
                            onChange={(e) => handleInputChange("dailyTime", e.target.value)}
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2"><Briefcase className="h-4 w-4" /> Target Role</label>
                    <Input 
                        className="rounded-xl h-12" 
                        placeholder="e.g. SDE, Frontend Engineer, Data Analyst" 
                        value={formData.targetRole}
                        onChange={(e) => handleInputChange("targetRole", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Company Type</label>
                    <Select onValueChange={(v) => handleInputChange("targetCompanyType", v)} defaultValue={formData.targetCompanyType}>
                        <SelectTrigger className="rounded-xl h-12">
                            <SelectValue placeholder="Target Company" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Product-Based">Product Based (FAANG, Startups)</SelectItem>
                            <SelectItem value="Service-Based">Service Based (TCS, Infosys, etc)</SelectItem>
                            <SelectItem value="FinTech">FinTech / HFT</SelectItem>
                            <SelectItem value="Government">Government / Public Sector</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2">Current Skill Level</label>
                    <div className="grid grid-cols-3 gap-2">
                        {["Beginner", "Intermediate", "Advanced"].map(lvl => (
                            <Button 
                                key={lvl} 
                                variant={formData.skillLevel === lvl ? "default" : "outline"}
                                className="rounded-xl h-12 font-bold"
                                onClick={() => handleInputChange("skillLevel", lvl)}
                            >
                                {lvl}
                            </Button>
                        ))}
                    </div>
                  </div>
                </div>
                <CardFooter className="px-0 pb-0 mt-12">
                  <Button 
                    className="w-full rounded-2xl h-14 text-lg font-black shadow-xl shadow-primary/20"
                    onClick={handleGenerate}
                    disabled={isLoading}
                  >
                    {isLoading ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating Roadmap...</> : "Generate My Plan"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 3 && roadmap && (
             <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
             >
                {/* Roadmap Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-card p-8 rounded-[2.5rem] border gap-8">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                            <Target className="h-4 w-4" /> Roadmap active
                        </div>
                        <h2 className="text-4xl font-black">{roadmap.targetRole}</h2>
                        <p className="text-muted-foreground italic leading-relaxed">"{roadmap.summary}"</p>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            variant="outline" 
                            className="rounded-2xl h-14 px-6 border-primary/20 bg-primary/5 hover:bg-primary/10 gap-2 font-bold"
                            onClick={handleAdjustRoadmap}
                            disabled={isAdjusting}
                        >
                            {isAdjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Sync & Adjust Roadmap
                        </Button>
                        <div className="h-14 w-px bg-border hidden md:block" />
                        <div className="text-center px-4">
                            <div className="text-2xl font-black text-primary">{roadmap.durationWeeks}</div>
                            <div className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Weeks Left</div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">
                        <b>Pro Tip:</b> Our AI monitors your progress. If you miss too many tasks or excel in a phase, click <b>Sync & Adjust</b> to re-optimize your timeline based on your real performance.
                    </p>
                </div>

                {/* Timeline */}
                <div className="space-y-24">
                  {roadmap.phases.map((phase, pIdx) => (
                    <div key={pIdx} className="relative">
                        {pIdx !== roadmap.phases.length - 1 && (
                            <div className="absolute left-8 top-20 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent z-0" />
                        )}
                        
                        <div className="flex gap-8 relative z-10">
                            <div className="h-16 w-16 bg-primary rounded-3xl flex-shrink-0 flex items-center justify-center text-white shadow-xl shadow-primary/40 text-2xl font-black">
                                {pIdx + 1}
                            </div>
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="text-3xl font-black mb-1">{phase.name}</h3>
                                    <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                        <span className="flex items-center gap-1 text-primary"><Clock className="h-3 w-3" /> {phase.duration}</span>
                                        <span>•</span>
                                        <span>{phase.objective}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {phase.weeks.map((week, wIdx) => (
                                        <Card key={wIdx} className="glass-card border-none hover:shadow-xl transition-shadow bg-background/40">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">Week {week.weekNumber}</span>
                                                    <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                                                </div>
                                                <h4 className="font-bold text-lg leading-tight">{week.focus}</h4>
                                                <div className="space-y-4">
                                                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Daily Drill</p>
                                                    <ul className="space-y-3">
                                                        {week.tasks.sort((a,b) => {
                                                            const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                                                            return days.indexOf(a.day) - days.indexOf(b.day);
                                                        }).map((task) => (
                                                            <li key={task.id} className="flex items-start gap-3 group">
                                                                <Checkbox 
                                                                    id={task.id} 
                                                                    checked={task.isCompleted} 
                                                                    onCheckedChange={(checked) => handleTaskToggle(task.id, checked)}
                                                                    className="mt-1 h-5 w-5 rounded-md border-primary/30"
                                                                />
                                                                <div className="space-y-0.5">
                                                                    <label 
                                                                        htmlFor={task.id}
                                                                        className={`text-sm font-medium leading-tight cursor-pointer ${task.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                                                                    >
                                                                        <span className="font-black text-[10px] uppercase text-primary mr-1.5">{task.day}</span>
                                                                        {task.description}
                                                                    </label>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="pt-4 border-t border-border flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase text-pink-500 flex items-center gap-1"><Trophy className="h-3 w-3" /> Goal: {week.practiceGoals}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>

                <div className="text-center py-20">
                     <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-primary transition-colors font-bold" onClick={() => setStep(2)}>
                        Reschedule / Modify Plan
                     </Button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State - Premium Style */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl"
            >
              <div className="relative h-40 w-40 mb-8">
                <div className="absolute inset-0 rounded-[2.5rem] border-4 border-primary/20" />
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-[2.5rem] border-4 border-t-primary"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="h-12 w-12 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-3xl font-black mb-2 tracking-tight">Syncing Roadmap</h3>
              <p className="text-muted-foreground font-medium">Loading your personalized preparation universe...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
