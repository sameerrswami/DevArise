"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Code2, 
  Sparkles, 
  Zap, 
  Bug, 
  Terminal, 
  Play, 
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  BrainCircuit,
  Loader2,
  RefreshCcw,
  Lightbulb
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function CodeMentor() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("input"); // "input" or "result"
  
  const handleAnalyze = async () => {
    if (!code.trim() || isLoading) return;
    
    setIsLoading(true);
    setExplanation("");
    setActiveTab("result");

    try {
      const res = await fetch("/api/mentor/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });

      if (res.ok) {
        const data = await res.json();
        setExplanation(data.explanation);
      } else {
        setExplanation("Failed to analyze code. Please try again.");
      }
    } catch (error) {
      setExplanation("An error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient dark:bg-slate-950 flex flex-col transition-colors duration-500">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 py-8 md:py-12">
        <div className="flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                <BrainCircuit className="h-3 w-3" />
                AI-Powered Code Mentor
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                Understand Code <br /><span className="gradient-text">Like a Senior Engineer</span>
              </h1>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
            >
                <select 
                    className="bg-background border rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 ring-primary"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                </select>
                <Button 
                    className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20"
                    onClick={handleAnalyze}
                    disabled={isLoading || !code.trim()}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Analyze Code
                </Button>
            </motion.div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-320px)] min-h-[600px]">
            
            {/* Input Panel */}
            <Card className="glass-card border-none shadow-2xl flex flex-col overflow-hidden">
                <CardHeader className="border-b bg-muted/30 p-4 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-muted-foreground ml-2 uppercase tracking-widest flex items-center gap-2">
                            <Terminal className="h-3 w-3" /> Source Code
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => setCode("")}>
                        <RefreshCcw className="h-3 w-3 mr-2" /> Clear
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <textarea 
                        className="w-full h-full p-6 bg-slate-900 text-slate-100 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                        placeholder="// Paste your code here...
function solve(n) {
  let res = 0;
  for(let i=0; i<n; i++) {
    res += i;
  }
  return res;
}"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Analysis Panel */}
            <Card className="glass-card border-none shadow-2xl flex flex-col overflow-hidden relative">
                <CardHeader className="border-b bg-muted/30 p-4">
                     <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Lightbulb className="h-3 w-3 text-amber-500" /> AI Analysis & Insights
                    </span>
                </CardHeader>
                <div className="flex-1 relative">
                    <AnimatePresence mode="wait">
                        {!explanation && !isLoading ? (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                            >
                                <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                                    <Code2 className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Ready for Analysis</h3>
                                <p className="text-muted-foreground mx-auto max-w-xs">
                                    Paste your code and click <b>Analyze</b> to get deep insights, dry-runs, and bug detection.
                                </p>
                            </motion.div>
                        ) : isLoading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-background/50 backdrop-blur-sm z-10"
                            >
                                <div className="relative h-24 w-24 mb-6">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-3xl border-4 border-primary/20 border-t-primary"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-black mb-1">Thinking...</h3>
                                <p className="text-muted-foreground font-medium">Deconstructing logic and simulating execution...</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="h-full"
                            >
                                <ScrollArea className="h-full">
                                    <div className="p-8 prose prose-indigo dark:prose-invert max-w-none prose-headings:font-black prose-p:leading-relaxed">
                                        <ReactMarkdown>{explanation}</ReactMarkdown>
                                    </div>
                                </ScrollArea>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <CardFooter className="bg-muted/10 border-t p-3 flex justify-between gap-2 overflow-x-auto no-scrollbar">
                     <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest gap-2 bg-primary/5 text-primary">
                        <Bug className="h-3 w-3" /> Bug Report
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest gap-2">
                        <Terminal className="h-3 w-3" /> Dry Run
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest gap-2">
                        <Zap className="h-3 w-3" /> Optimization
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest gap-2 ml-auto">
                        <ClipboardCheck className="h-3 w-3" /> Copy Result
                    </Button>
                </CardFooter>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
