"use client";

import React, { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  generateDynamicQuestion, 
  evaluateSession 
} from "@/utils/GeminiAIModal";
import { 
  Mic, 
  StopCircle, 
  Video, 
  Play, 
  Loader2, 
  MessageSquare,
  Sparkles,
  Award,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function DynamicInterview({ params }) {
  const { interviewId } = params;
  const router = useRouter();
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [round, setRound] = useState(1);
  const [mounted, setMounted] = useState(false);

  const {
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    setMounted(true);
    fetchInterviewDetails();
  }, []);

  useEffect(() => {
    results?.forEach((result) => {
      setUserAnswer((prevAns) => prevAns + " " + result.transcript);
    });
  }, [results]);

  const fetchInterviewDetails = async () => {
    try {
      const resp = await fetch(`/api/interview?mockId=${interviewId}`);
      const data = await resp.json();
      if (data.success && data.result) {
        setInterviewData(data.result);
        
        // Generate first question
        const firstQuestion = await generateDynamicQuestion({
          jobPosition: data.result.jobPosition,
          jobExperience: data.result.jobExperience,
          history: []
        });
        setCurrentQuestion(firstQuestion);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to start session.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (userAnswer.trim().length < 10 && history.length > 0) {
      toast.warning("Please provide a more detailed answer.");
      return;
    }

    setIsNextLoading(true);
    const newHistory = [
      ...history,
      { question: currentQuestion, answer: userAnswer }
    ];
    setHistory(newHistory);

    try {
      const nextQuestion = await generateDynamicQuestion({
        jobPosition: interviewData.jobPosition,
        jobExperience: interviewData.jobExperience,
        history: newHistory
      });

      if (nextQuestion === "END_INTERVIEW" || newHistory.length >= 8) {
        // Limit to 8 questions for safety
        handleEndInterview(newHistory);
      } else {
        setCurrentQuestion(nextQuestion);
        setUserAnswer("");
        setResults([]);
        setRound(prev => prev + 1);
      }
    } catch (error) {
      toast.error("Error generating follow-up.");
    } finally {
      setIsNextLoading(false);
    }
  };

  const handleEndInterview = async (finalHistory) => {
    setIsEnding(true);
    try {
      const evaluation = await evaluateSession({ history: finalHistory });
      
      // Store evaluation in DB (Update interview record)
      await fetch("/api/interview/feedback/comprehensive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockIdRef: interviewId,
          evaluation: evaluation,
          fullHistory: finalHistory
        })
      });

      router.push(`/dashboard/interview/${interviewId}/feedback`);
    } catch (error) {
      toast.error("Failed to generate final report.");
    } finally {
      setIsEnding(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      setUserAnswer("");
      startSpeechToText();
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-black tracking-widest uppercase">Initializing AI Recruiter...</h2>
      </div>
    );
  }

  if (isEnding) {
     return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-10 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <Sparkles className="h-20 w-20 text-primary mx-auto animate-pulse" />
            <h1 className="text-4xl font-black">Interview Completed</h1>
            <p className="text-slate-400 max-w-md mx-auto text-lg">
              Our AI is currently analyzing your technical accuracy, communication clarity, and confidence levels. Hang tight!
            </p>
            <div className="flex gap-2 justify-center">
              {[1,2,3].map(i => (
                <div key={i} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />
              ))}
            </div>
          </motion.div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left: AI Interviewer & Question */}
          <div className="flex-1 space-y-6">
            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
               <CardHeader className="bg-primary text-primary-foreground p-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                       <MessageSquare className="h-5 w-5" />
                     </div>
                     <div>
                       <p className="text-xs font-bold uppercase tracking-widest opacity-80">Phase {round}</p>
                       <CardTitle className="text-xl">DevArise AI Interviewer</CardTitle>
                     </div>
                   </div>
                   <Badge variant="secondary" className="bg-white/10 text-white border-white/20">Live Session</Badge>
                 </div>
               </CardHeader>
               <CardContent className="p-8">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={currentQuestion}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <h2 className="text-2xl font-bold leading-tight text-slate-800 dark:text-slate-100">
                        {currentQuestion}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-primary font-bold">
                        <Award className="h-4 w-4" />
                        Analyzing Problem-Solving & Communication
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                       <ShieldCheck className="h-3 w-3" />
                       Your Response
                    </h4>
                    <textarea 
                      className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[150px]"
                      placeholder="Type your answer or use the microphone..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                    />
                  </div>
               </CardContent>
               <CardFooter className="p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <Button 
                    variant="outline" 
                    className="gap-2 rounded-xl"
                    onClick={toggleRecording}
                  >
                    {isRecording ? (
                      <span className="flex items-center gap-2 text-red-500">
                        <StopCircle className="h-5 w-5 animate-pulse" />
                        Stop Recording
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-primary">
                        <Mic className="h-5 w-5" />
                        Voice Mode
                      </span>
                    )}
                  </Button>
                  <Button 
                    className="gap-2 px-8 rounded-xl font-bold"
                    onClick={handleNextQuestion}
                    disabled={isNextLoading || userAnswer.trim().length === 0}
                  >
                    {isNextLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Next Question
                  </Button>
               </CardFooter>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 shadow-none">
                 <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1 uppercase tracking-tighter">
                   <TrendingUp className="h-3 w-3" />
                   Consistency
                 </div>
                 <p className="text-xs text-slate-500 italic">Stay calm, answer clearly, and explain your thought process step-by-step.</p>
              </Card>
              {/* Add more helper cards if needed */}
            </div>
          </div>

          {/* Right: Video & Tips */}
          <div className="w-full lg:w-96 space-y-6">
            <Card className="border-none shadow-xl bg-slate-900 overflow-hidden aspect-square relative flex items-center justify-center">
              <Webcam 
                mirrored={true}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/50 px-2 rounded">REC</span>
              </div>
              {!isRecording && (
                <div className="relative z-10 h-16 w-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                   <Video className="h-8 w-8 text-white/50" />
                </div>
              )}
            </Card>

            <Card className="border-none shadow-md bg-white dark:bg-slate-900 p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Interviewer Tips
              </h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex gap-2">
                   <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</span>
                   <span>Avoid "um" and "uh" – speaking clearly shows more confidence.</span>
                </li>
                <li className="flex gap-2">
                   <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</span>
                   <span>For coding questions, explain the logic before the implementation.</span>
                </li>
              </ul>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
