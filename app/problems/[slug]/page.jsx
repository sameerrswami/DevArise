"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Send, 
  Lightbulb, 
  ChevronLeft, 
  Settings, 
  MessageSquare,
  Trophy,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  History,
  Code2,
  Sparkles
} from "lucide-react";
import Editor from "@monaco-editor/react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function ProblemDetail({ params }) {
  const { slug } = params;
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [hint, setHint] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    fetchProblem();
  }, [slug]);

  const fetchProblem = async () => {
    try {
      const res = await fetch(`/api/problems/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setProblem(data);
        // Set default starter code
        setDefaultCode(data, language);
      }
    } catch (error) {
      console.error("Failed to fetch problem");
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultCode = (p, lang) => {
    const starter = {
      python: "def solution(nums, target):\n    # Write your code here\n    pass",
      javascript: "function solution(nums, target) {\n    // Write your code here\n}",
      java: "public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};"
    };
    setCode(starter[lang] || starter.python);
  };

  const handleRun = async () => {
    setIsSubmitting(true);
    setTestResult(null);
    setActiveTab("results");
    
    // Simulate run
    setTimeout(() => {
      setTestResult({
        status: "Accepted",
        passed: 2,
        total: 2,
        output: "Case 1: [0, 1]\nCase 2: [1, 2]",
        runtime: "45ms"
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTestResult(null);
    setActiveTab("results");

    try {
      const res = await fetch("/api/problems/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, code, language })
      });
      
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      }
    } catch (error) {
      setTestResult({ status: "Error", message: "Failed to submit solution." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHint = async () => {
    const nextLevel = hintLevel + 1;
    if (nextLevel > 3) return;

    setIsHintLoading(true);
    try {
      const res = await fetch("/api/problems/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, code, level: nextLevel })
      });
      if (res.ok) {
        const data = await res.json();
        setHint(data.hint);
        setHintLevel(nextLevel);
      }
    } catch (error) {
      console.error("Failed to get hint");
    } finally {
      setIsHintLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold">Initializing Sandbox...</h2>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Problem Info */}
        <div className="w-1/2 flex flex-col border-r border-slate-800 bg-slate-900/50">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <Link href="/problems">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
               <Badge className={
                 problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                 problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
               }>
                 {problem.difficulty}
               </Badge>
               <Badge variant="outline" className="text-slate-500 border-slate-800">{problem.category}</Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 bg-slate-900">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger value="description" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-none">
                  Description
                </TabsTrigger>
                <TabsTrigger value="results" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-none">
                  Test Results
                </TabsTrigger>
                <TabsTrigger value="ai-review" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-none">
                  AI Review
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 border-t border-slate-800">
              <TabsContent value="description" className="p-6 m-0 prose prose-invert max-w-none">
                <h1 className="text-2xl font-black mb-4">{problem.title}</h1>
                <ReactMarkdown>{problem.description}</ReactMarkdown>
                
                <h3 className="text-lg font-bold mt-8 mb-4">Examples</h3>
                <div className="space-y-4">
                  {problem.testCases?.slice(0, 2).map((tc, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 font-mono text-sm">
                      <p className="text-slate-500 mb-1 font-sans text-xs uppercase font-black">Input</p>
                      <code className="text-indigo-400">{tc.input}</code>
                      <p className="text-slate-500 mt-3 mb-1 font-sans text-xs uppercase font-black">Output</p>
                      <code className="text-green-400">{tc.output}</code>
                    </div>
                  ))}
                </div>

                {problem.constraints && (
                  <>
                    <h3 className="text-lg font-bold mt-8 mb-2">Constraints</h3>
                    <pre className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed italic">
                      {problem.constraints}
                    </pre>
                  </>
                )}

                <div className="mt-12 p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
                  <h4 className="flex items-center gap-2 font-bold text-indigo-400 mb-2">
                    <Sparkles className="h-4 w-4" />
                    Student Success Tip
                  </h4>
                  <p className="text-sm text-slate-400 italic">
                    Think about edge cases! What happens if the input array is empty or only has one element?
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="results" className="p-6 m-0">
                {!testResult ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <History className="h-12 w-12 mb-4 opacity-20" />
                    <p>Run your code to see results here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className={`p-6 rounded-2xl flex items-center justify-between ${
                      testResult.status === 'Accepted' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <div>
                        <h4 className={`text-2xl font-black mb-1 ${testResult.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                          {testResult.status}
                        </h4>
                        <p className="text-slate-400 font-medium">
                          {testResult.passed}/{testResult.total} cases passed in {testResult.runtime}
                        </p>
                      </div>
                      {testResult.status === 'Accepted' ? (
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                      ) : (
                        <AlertCircle className="h-12 w-12 text-red-500" />
                      )}
                    </div>

                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden font-mono text-sm">
                      <div className="px-4 py-2 bg-slate-900 text-slate-500 text-xs border-b border-slate-800 flex justify-between uppercase font-black">
                        Console Output
                        <span>Runtime: {testResult.runtime}</span>
                      </div>
                      <div className="p-4 overflow-auto max-h-40 whitespace-pre">
                        {testResult.output}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ai-review" className="p-6 m-0">
                {testResult?.aiReview ? (
                  <div className="space-y-6">
                    <Card className="bg-indigo-600/10 border-indigo-500/20 shadow-none rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-black text-indigo-400 flex items-center gap-2">
                          <Code2 className="h-5 w-5" />
                          Performance Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                          <p className="text-xs text-slate-500 font-black uppercase">Time Complexity</p>
                          <p className="text-xl font-black text-white">{testResult.aiReview.timeComplexity}</p>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                          <p className="text-xs text-slate-500 font-black uppercase">Space Complexity</p>
                          <p className="text-xl font-black text-white">{testResult.aiReview.spaceComplexity}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="prose prose-invert max-w-none">
                      <h4 className="text-white font-bold flex items-center gap-2">
                        <sparkles className="h-4 w-4 text-primary" />
                        Expert Feedback
                      </h4>
                      <p className="text-slate-400 leading-relaxed italic">{testResult.aiReview.feedback}</p>
                      
                      <h4 className="text-white font-bold mt-6 mb-3">Suggested Optimizations</h4>
                      <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-emerald-400/80 text-sm">
                        {testResult.aiReview.optimizations}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center px-10">
                    <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                    <p>Submit your solution to get a granular AI code review with complexity analysis.</p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Right Side: Code Editor */}
        <div className="flex-1 flex flex-col bg-slate-950">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select 
                value={language} 
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setDefaultCode(problem, e.target.value);
                }}
                className="bg-slate-800 text-white rounded-lg px-4 py-2 text-sm border-none ring-1 ring-slate-700 focus:ring-primary outline-none"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-800"><Settings className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                fontSize: 16,
                minimap: { enabled: false },
                padding: { top: 20 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                fontFamily: "'JetBrains Mono', monospace"
              }}
            />
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
                onClick={getHint}
                disabled={isHintLoading || hintLevel >= 3}
              >
                {isHintLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Lightbulb className="h-4 w-4 text-yellow-500" />}
                {hintLevel === 0 ? "Get Hint" : `Hint ${hintLevel}/3`}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="gap-2 text-slate-400 hover:bg-slate-800"
                onClick={handleRun}
                disabled={isSubmitting}
              >
                <Play className="h-4 w-4" />
                Run Code
              </Button>
              <Button 
                className="gap-2 font-bold px-8 shadow-lg shadow-indigo-600/20"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hint Alert */}
      <AnimatePresence>
        {hint && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-8 max-w-md z-50 pointer-events-none"
          >
            <Card className="bg-slate-900 border-indigo-500/50 shadow-2xl pointer-events-auto overflow-hidden">
               <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    AI Buddy Hint
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10" onClick={() => setHint("")}>
                    &times;
                  </Button>
               </div>
               <CardContent className="p-6">
                 <p className="text-sm italic text-slate-400 leading-relaxed font-medium">
                    {hint}
                 </p>
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
