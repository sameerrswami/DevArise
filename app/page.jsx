"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchBar } from "@/components/search-bar";
import { PlaylistGrid } from "@/components/playlist-grid";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Users, Brain, Zap, PlayCircle, GraduationCap, Briefcase, Target, Code2, Map, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSearch = async (query, language, difficulty) => {
    setIsLoading(true);
    setError("");
    setPlaylist(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query, language, difficulty }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      if (data.playlist) {
        try {
          const saveResponse = await fetch("/api/playlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: `Learning Path: ${query}`,
              description: `AI-curated learning path for ${query} (${language}, ${difficulty})`,
              videos: data.playlist,
            }),
          });
          if (saveResponse.ok) {
            const savedData = await saveResponse.json();
            router.push(`/playlist/${savedData.id}`);
            return;
          } else {
            setPlaylist(data.playlist);
          }
        } catch (err) {
          console.error("Failed to save playlist:", err);
          setPlaylist(data.playlist);
        }
      } else {
        setError(data.message || "No videos found for your search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to search videos. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoPlay = (videoId) => {
    if (typeof window !== 'undefined' && playlist) {
      localStorage.setItem("neuro_playlist", JSON.stringify(playlist));
    }
    router.push(`/watch?v=${videoId}`);
  };

  return (
    <div className="min-h-screen mesh-gradient dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <Navbar
        showAuthButtons={true}
        isAuthenticated={status === "authenticated"}
      />

      <main className="container mx-auto px-4 py-12 relative">
        <AnimatePresence mode="wait">
          {!playlist && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="space-y-20"
            >
              {/* Hero Section */}
              <div className="text-center max-w-5xl mx-auto px-4 relative">
                {/* Decorative elements */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-40 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-delayed" />
                
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold mb-8 backdrop-blur-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Elevate Your Learning with Intelligence
                </motion.div>

                <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
                  Discover Your Next <br />
                  <span className="gradient-text">Learning Odyssey</span>
                </h1>

                <p className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                  DevArise AI bridges the gap between chaos and curriculum. Turn YouTube into your 
                  personal university with AI-curated roadmaps and interactive mentors.
                </p>

                <div className="max-w-3xl mx-auto mb-16 relative z-10">
                  <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  <div className="flex items-center gap-2 font-bold text-xl"><Brain className="h-6 w-6" /> AI-First</div>
                  <div className="flex items-center gap-2 font-bold text-xl"><Zap className="h-6 w-6" /> Instant Path</div>
                  <div className="flex items-center gap-2 font-bold text-xl"><GraduationCap className="h-6 w-6" /> Certifiable</div>
                </div>
              </div>

              {/* Features Quick Access */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20 px-4">
                {[
                  {
                    title: "AI Personal Tutor",
                    desc: "Master any subject with structured AI lessons and deep-dive Q&A.",
                    icon: <Brain className="h-7 w-7" />,
                    path: "/tutor",
                    color: "from-blue-600 to-indigo-600",
                    badge: "Best Seller"
                  },
                  {
                    title: "Skill Assessment",
                    desc: "Validate your expertise with AI-generated tests and earn status.",
                    icon: <Target className="h-7 w-7" />,
                    path: "/assessment",
                    color: "from-purple-600 to-pink-600",
                    badge: "New"
                  },
                  {
                    title: "AI Interviewer",
                    desc: "Practice mock interviews with personalized AI feedback and ratings.",
                    icon: <Users className="h-7 w-7" />,
                    path: "/interviewer",
                    color: "from-amber-500 to-orange-600",
                    badge: "Career"
                  },
                   {
                    title: "Career Job Board",
                    desc: "Find and post opportunities within the DevArise AI global community.",
                    icon: <Briefcase className="h-7 w-7" />,
                    path: "/jobs",
                    color: "from-emerald-500 to-teal-600",
                    badge: "Jobs"
                  },
                  {
                    title: "AI Code Mentor",
                    desc: "Deep code analysis, line-by-line explanation, and bug detection.",
                    icon: <Code2 className="h-7 w-7" />,
                    path: "/code-mentor",
                    color: "from-red-600 to-orange-600",
                    badge: "Elite"
                  },
                  {
                    title: "Placement Roadmap",
                    desc: "Personalized week-by-week prep strategy for top tech companies.",
                    icon: <Map className="h-7 w-7" />,
                    path: "/roadmap",
                    color: "from-cyan-500 to-blue-600",
                    badge: "Goal"
                  },
                   {
                    title: "Project Architect",
                    desc: "Intelligent project recommendations to fill portfolio gaps and impress recruiters.",
                    icon: <Rocket className="h-7 w-7" />,
                    path: "/projects",
                    color: "from-emerald-600 to-teal-700",
                    badge: "Career"
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(item.path)}
                    className="relative group cursor-pointer"
                  >
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.color} rounded-[2rem] blur opacity-20 group-hover:opacity-100 transition duration-500`} />
                    <Card className="relative h-full glass-card border-none overflow-hidden rounded-[2rem] flex flex-col p-6">
                       <div className="flex items-start justify-between mb-4">
                         <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}>
                            {item.icon}
                         </div>
                         <span className="text-[10px] font-black tracking-widest uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">{item.badge}</span>
                       </div>
                       <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                       <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                         {item.desc}
                       </p>
                       <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs font-bold text-primary group-hover:gap-4 transition-all">
                         Start Exploring <ArrowRight className="h-4 w-4" />
                       </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Enhanced Features Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {[
                  {
                    title: "Smart Pathfinding",
                    desc: "Our AI analyzes thousands of videos to build the most efficient learning sequence.",
                    icon: <Sparkles className="h-8 w-8" />,
                    color: "bg-indigo-500",
                    delay: 0.1
                  },
                  {
                    title: "Interactive Mentorship",
                    desc: "Ask follow-up questions to our AI Tutor at any point in your learning journey.",
                    icon: <Users className="h-8 w-8" />,
                    color: "bg-purple-500",
                    delay: 0.2
                  },
                  {
                    title: "Knowledge Validation",
                    desc: "Test your skills with AI-generated quizzes and receive instant diagnostic feedback.",
                    icon: <TrendingUp className="h-8 w-8" />,
                    color: "bg-pink-500",
                    delay: 0.3
                  }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: feature.delay }}
                    whileHover={{ y: -10 }}
                    className="p-8 rounded-3xl glass-card border-none group hover:shadow-2xl transition-all duration-300"
                  >
                    <div className={`${feature.color} h-16 w-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Action Preview Section */}
              <div className="relative py-20 overflow-hidden rounded-[3rem] bg-slate-900 text-white">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 px-8 md:px-20">
                  <div className="flex-1 space-y-6">
                    <h2 className="text-4xl md:text-5xl font-black">Visual Learning, <br /> Redefined.</h2>
                    <p className="text-slate-400 text-lg md:text-xl">
                      Experience learning like never before. From automatic summaries to 
                      in-depth explanations, DevArise AI makes content stick.
                    </p>
                    <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-200 h-14 px-8 font-bold text-lg">
                      Explore Features <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 w-full max-w-xl aspect-video rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl flex items-center justify-center group cursor-pointer overflow-hidden relative">
                    <img 
                      src="/devarise_hero_illustration_1776531634814.png" 
                      alt="DevArise AI Learning" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                    <PlayCircle className="h-20 w-20 text-white/50 group-hover:text-primary group-hover:scale-110 transition-all duration-300 relative z-10" />
                  </div>
                </div>
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
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-t-primary"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="h-12 w-12 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-3xl font-black mb-2 tracking-tight">Curating Your Path</h3>
              <p className="text-muted-foreground font-medium">Analyzing educational resources tailored for you...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 px-4"
            >
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Zap className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-3xl font-black mb-4">Exploration Halted</h3>
                <p className="text-muted-foreground text-lg mb-8">{error}</p>
                <Button size="lg" className="rounded-full px-8" onClick={() => setError("")}>Try Another Topic</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist Results */}
        {playlist && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <PlaylistGrid
              playlist={playlist}
              onVideoPlay={handleVideoPlay}
              onBookmarkPlaylist={() => console.log("Bookmark playlist")}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}

function ArrowRight({ className }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
