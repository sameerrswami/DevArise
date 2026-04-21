"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GraduationCap, 
  BookOpen, 
  Lightbulb, 
  Send, 
  Loader2, 
  Sparkles,
  ArrowRight,
  BrainCircuit,
  HelpCircle,
  History,
  Trophy,
  Mic,
  Volume2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function AITutor() {
  const { data: session } = useSession();
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState([]);
  const [followUp, setFollowUp] = useState("");
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("lesson"); // "lesson" or "quiz"
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, explanation, isLoading]);

  useEffect(() => {
    // Load tutor history from local storage
    const saved = localStorage.getItem("devarise_tutor_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleStartTutor = async (selectedTopic) => {
    const targetTopic = selectedTopic || topic;
    if (!targetTopic.trim() || isLoading) return;

    setIsLoading(true);
    setExplanation("");
    setChat([]);
    setTopic(targetTopic);
    
    try {
      const res = await fetch("/api/tutor/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: targetTopic.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setExplanation(data.explanation);
        setChat([{ role: "assistant", content: data.explanation }]);
        
        // Update history
        const newHistory = [
          { topic: targetTopic, date: new Date().toISOString() },
          ...history.filter(h => h.topic !== targetTopic)
        ].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem("devarise_tutor_history", JSON.stringify(newHistory));

      } else {
        setExplanation("I'm sorry, I couldn't process that topic. Please try another one.");
      }
    } catch (error) {
      setExplanation("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionText) => {
    setFollowUp(actionText);
    // We need to use the actual value immediately because state updates are async
    const userMessage = actionText;
    setChat(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic,
          message: userMessage,
          history: chat 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChat(prev => [...prev, { role: "assistant", content: data.reply }]);
        setFollowUp(""); // Clear after success
      } else {
        setChat(prev => [...prev, { role: "assistant", content: "I'm having trouble responding right now." }]);
      }
    } catch (error) {
      setChat(prev => [...prev, { role: "assistant", content: "An error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUp.trim() || isLoading) return;
    handleQuickAction(followUp.trim());
  };

  const handleSpeak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen mesh-gradient dark:bg-slate-950 flex flex-col transition-colors duration-500">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar - History & Tools */}
        <motion.aside 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-col w-64 gap-6"
        >
          <Card className="glass-card border-none shadow-lg">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {history.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground text-center">Your learning journey starts here.</p>
              ) : (
                history.map((h, i) => (
                  <Button 
                    key={i} 
                    variant="ghost" 
                    className="w-full justify-start text-xs rounded-xl h-10 hover:bg-primary/10 hover:text-primary transition-all overflow-hidden"
                    onClick={() => handleStartTutor(h.topic)}
                  >
                    <BookOpen className="h-3 w-3 mr-2" />
                    <span className="truncate">{h.topic}</span>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-lg overflow-hidden bg-primary/5">
            <div className="p-4 bg-primary text-primary-foreground">
              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Trophy className="h-3 w-3" />
                Active Badge
              </h4>
            </div>
            <CardContent className="p-6 text-center">
              <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">Certified Explorer</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Master 5 more topics to reach Grandmaster lvl.</p>
            </CardContent>
          </Card>
        </motion.aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-8">
          <AnimatePresence mode="wait">
            {!explanation && !isLoading ? (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="text-center py-20"
              >
                <div className="h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float">
                  <BrainCircuit className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-5xl font-black tracking-tight mb-4">
                  Think it. <span className="gradient-text">Learn it.</span>
                </h1>
                <p className="text-muted-foreground text-xl max-w-xl mx-auto mb-12">
                  What complex subject shall we demystify today? Your personal AI Tutor is ready to teach.
                </p>

                <div className="max-w-2xl mx-auto relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-500" />
                  <div className="relative flex items-center bg-background rounded-2xl p-2 shadow-2xl">
                    <Input 
                      placeholder="e.g. Process Synchronization, B+ Trees, Dijkstra's Algorithm..." 
                      className="border-none py-8 text-xl focus-visible:ring-0 shadow-none px-6"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStartTutor()}
                    />
                    <Button 
                      className="h-14 w-14 rounded-xl shadow-lg"
                      size="icon"
                      onClick={() => handleStartTutor()}
                      disabled={isLoading || !topic.trim()}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center mt-12">
                  {["Time Complexity", "SQL Normalization", "OS Scheduling", "Deadlocks"].map(p => (
                    <Button 
                      key={p} 
                      variant="outline" 
                      className="rounded-full px-6 border-primary/20 hover:bg-primary/5 hover:border-primary transition-all font-medium"
                      onClick={() => handleStartTutor(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Lesson Plan */}
                <Card className="lg:col-span-2 glass-card border-none shadow-2xl overflow-hidden flex flex-col">
                  <CardHeader className="border-b bg-muted/30 p-6 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-black gradient-text">
                        {topic}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Interactive Lesson Module</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/10" onClick={() => handleSpeak(explanation)}>
                         <Volume2 className="h-5 w-5" />
                       </Button>
                       <Button className="rounded-xl font-bold px-6" onClick={() => setExplanation("")}>
                         New Subject
                       </Button>
                    </div>
                  </CardHeader>
                  <ScrollArea className="flex-1 max-h-[700px]">
                    <div className="p-8 prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black">
                      <ReactMarkdown>{explanation}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                  <CardFooter className="bg-muted/30 border-t p-4 flex justify-around flex-wrap gap-2">
                    <Button variant="ghost" className="text-xs gap-2 font-bold hover:bg-primary/10" onClick={() => handleQuickAction("Can you give me a deep dive into the technical details of this topic?")}><BrainCircuit className="h-4 w-4" /> Deep Dive</Button>
                    <Button variant="ghost" className="text-xs gap-2 font-bold hover:bg-primary/10" onClick={() => handleQuickAction("Explain this to me in much simpler terms.")}><Sparkles className="h-4 w-4" /> Explain Simpler</Button>
                    <Button variant="ghost" className="text-xs gap-2 font-bold hover:bg-primary/10" onClick={() => handleQuickAction("Give me a real-world application or industry example.")}><Lightbulb className="h-4 w-4" /> Give Real Example</Button>
                    <Button variant="ghost" className="text-xs gap-2 font-bold hover:bg-primary/10 text-indigo-600" onClick={() => handleQuickAction("I am preparing for an interview. Can you ask me a common interview question on this topic and evaluate my answer?")}><GraduationCap className="h-4 w-4" /> Interview Prep</Button>
                  </CardFooter>
                </Card>

                {/* AI Assistant Chat */}
                <Card className="flex flex-col h-[744px] glass-card border-none shadow-2xl overflow-hidden lg:sticky lg:top-24">
                  <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-sm">DevArise CS Mentor</h4>
                    </div>
                  </div>
                  <CardContent className="flex-1 p-0 overflow-hidden bg-background/30 backdrop-blur-sm">
                    <ScrollArea ref={scrollRef} className="h-[580px] p-4">
                      <div className="space-y-4">
                        <div className="flex justify-start">
                          <div className="max-w-[90%] p-4 rounded-3xl rounded-tl-none bg-muted text-foreground border shadow-sm text-sm font-medium">
                            I've generated the core lesson for <b>{topic}</b> above. Feel free to ask me for any clarifications or more specific details!
                          </div>
                        </div>
                        {chat.slice(1).map((msg, i) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={i} 
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[90%] p-4 rounded-3xl text-sm ${
                              msg.role === "user" 
                                ? "bg-primary text-primary-foreground rounded-tr-none shadow-indigo-500/20 shadow-lg" 
                                : "bg-muted text-foreground rounded-tl-none border shadow-sm"
                            }`}>
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </motion.div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-muted p-4 rounded-3xl rounded-tl-none border flex items-center gap-3">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span className="text-xs font-bold text-muted-foreground">Mastering topic...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="p-4 border-t bg-background/50">
                    <div className="flex w-full gap-2 relative">
                      <Input 
                        placeholder="Ask anything about the lesson..." 
                        className="pr-12 py-6 rounded-2xl bg-muted/50 border-none shadow-inner text-sm"
                        value={followUp}
                        onChange={(e) => setFollowUp(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                        disabled={isLoading}
                      />
                      <Button 
                        size="icon" 
                        className="absolute right-1 top-1 h-10 w-10 rounded-xl" 
                        onClick={handleFollowUp} 
                        disabled={isLoading || !followUp.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && !explanation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-xl"
          >
            <div className="relative h-32 w-32 mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-[2rem] border-4 border-indigo-500/20 border-t-indigo-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="h-10 w-10 text-indigo-500 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-black mb-1">Preparing Lesson</h3>
            <p className="text-muted-foreground font-medium animate-pulse">Syncing with neural knowledge base...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
