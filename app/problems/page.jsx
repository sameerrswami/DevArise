"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Code2, 
  CheckCircle2, 
  Trophy, 
  ChevronRight,
  Filter,
  BarChart3,
  BrainCircuit,
  Layout
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const res = await fetch("/api/problems");
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      }
    } catch (error) {
      console.error("Failed to fetch problems");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || p.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-black tracking-tight flex items-center gap-3"
              >
                <Code2 className="h-10 w-10 text-primary" />
                Problem <span className="gradient-text">Practice</span>
              </motion.h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Master Data Structures and Algorithms with AI-guided practice.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Card className="flex items-center gap-4 px-6 py-3 border-none shadow-md bg-white dark:bg-slate-900">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Points</p>
                  <p className="text-xl font-black">1,250</p>
                </div>
              </Card>
              <Card className="flex items-center gap-4 px-6 py-3 border-none shadow-md bg-white dark:bg-slate-900">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Solved</p>
                  <p className="text-xl font-black">12/50</p>
                </div>
              </Card>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground p-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Difficulty</label>
                  <div className="space-y-1">
                    {["All", "Easy", "Medium", "Hard"].map(d => (
                      <Button 
                        key={d} 
                        variant={filter === d ? "default" : "ghost"} 
                        className="w-full justify-start rounded-xl h-10"
                        onClick={() => setFilter(d)}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Topics</label>
                  <div className="flex flex-wrap gap-2">
                    {["Arrays", "Linked List", "Trees", "DP", "Graphs"].map(t => (
                      <Badge key={t} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1 px-3">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
              <CardContent className="p-6">
                <BrainCircuit className="h-10 w-10 mb-4 opacity-70" />
                <h4 className="font-black text-xl mb-2">AI Recs</h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  Based on your progress, you should try <b>Linked List Cycle II</b> next.
                </p>
                <Button variant="secondary" className="w-full mt-4 rounded-xl font-bold">Start Now</Button>
              </CardContent>
            </Card>
          </aside>

          {/* Problem List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search problems by name..." 
                className="pl-12 py-7 text-lg rounded-2xl border-none shadow-md bg-white dark:bg-slate-900"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Layout className="h-12 w-12 animate-pulse text-muted-foreground" />
                <p className="font-bold text-muted-foreground">Loading expert-curated problems...</p>
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No problems found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProblems.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/problems/${p.slug}`}>
                      <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-sm cursor-pointer group bg-white dark:bg-slate-900 overflow-hidden">
                        <div className={`w-1.5 absolute left-0 top-0 bottom-0 ${
                          p.difficulty === 'Easy' ? 'bg-green-500' : 
                          p.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <CardContent className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${
                              p.difficulty === 'Easy' ? 'bg-green-100 text-green-600' : 
                              p.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {p.title.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                                {p.title}
                                {p.solved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest px-2 py-0 border-primary/20">{p.category}</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  Accuracy: 78%
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <span className={`text-xs font-black uppercase tracking-widest ${
                              p.difficulty === 'Easy' ? 'text-green-500' : 
                              p.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {p.difficulty}
                            </span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
