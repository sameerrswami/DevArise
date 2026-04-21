"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Trophy, 
  BrainCircuit, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles,
  ChevronRight,
  ArrowLeft,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SkillAssessment() {
  const { data: session } = useSession();
  const [topic, setTopic] = useState("");
  const [step, setStep] = useState(1); // 1: Topic, 2: Quiz, 3: Results
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(null);

  const startAssessment = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), count: 5 })
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.quiz);
        setStep(2);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (optionIndex) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    setScore(Math.round((correct / questions.length) * 100));
    setStep(3);
    
    // Update dashboard points via API (simulated)
    fetch("/api/user/add-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: correct * 20 })
    }).catch(console.error);
  };

  return (
    <div className="min-h-screen mesh-gradient dark:bg-slate-950 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-4xl w-full mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-8"
            >
              <div className="h-20 w-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 animate-float">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-black tracking-tight leading-tight">
                Skill <span className="gradient-text">Certification</span>
              </h1>
              <p className="text-muted-foreground text-xl max-w-lg mx-auto">
                Validate your expertise. Pass our AI-generated assessment to earn Skill Points and badges.
              </p>

              <Card className="max-w-md mx-auto glass-card border-none shadow-2xl p-6 mt-12">
                <div className="space-y-4">
                  <div className="text-left space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Specialization Topic</label>
                    <Input 
                      placeholder="e.g. Advanced TypeScript, SEO Strategy..." 
                      className="py-6 rounded-xl border-none bg-muted/50 focus-visible:ring-indigo-500 px-4"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-indigo-500/30 gap-2"
                    onClick={startAssessment}
                    disabled={isLoading || !topic.trim()}
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="h-5 w-5" /> Start Challenge</>}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && questions.length > 0 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Quit</Button>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Topic: {topic}</span>
                  <div className="flex gap-2">
                    {questions.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-2 w-8 rounded-full transition-all duration-300 ${i === currentQuestion ? "bg-indigo-600" : i < currentQuestion ? "bg-indigo-300" : "bg-muted"}`} 
                      />
                    ))}
                  </div>
                </div>
                <div className="font-black text-xl gradient-text">{currentQuestion + 1}/{questions.length}</div>
              </div>

              <Card className="glass-card border-none shadow-2xl overflow-hidden p-8">
                <h3 className="text-2xl font-bold mb-8">{questions[currentQuestion].question}</h3>
                <div className="grid grid-cols-1 gap-4">
                  {questions[currentQuestion].options.map((option, idx) => (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 group flex items-center justify-between ${
                        answers[currentQuestion] === idx 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900" 
                          : "border-muted-foreground/10 hover:border-indigo-300 hover:bg-muted/30"
                      }`}
                    >
                      <span className="font-semibold">{option}</span>
                      {answers[currentQuestion] === idx && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                    </motion.button>
                  ))}
                </div>
              </Card>

              <div className="flex justify-end">
                <Button 
                  size="lg" 
                  className="rounded-full px-10 h-14 font-black text-lg gap-2 shadow-xl"
                  disabled={answers[currentQuestion] === undefined}
                  onClick={nextQuestion}
                >
                  {currentQuestion === questions.length - 1 ? "Finish Assessment" : "Next Question"} <ChevronRight />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-12"
            >
              <div className="relative inline-block">
                <div className="h-40 w-40 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse-subtle">
                  <div className="text-5xl font-black text-white">{score}%</div>
                </div>
                <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border-4 border-indigo-600">
                   <Trophy className="h-8 w-8 text-indigo-600" />
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-black mb-4">Assessment Complete!</h2>
                <p className="text-xl text-muted-foreground">
                  {score >= 80 ? "Outstanding! You've shown masterful understanding of " : "Good effort. You're building a solid foundation in "} 
                  <b>{topic}</b>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="glass-card border-none p-6 text-left flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">Correct Answers</h4>
                    <p className="text-2xl font-black">{Math.round((score/100) * questions.length)} / {questions.length}</p>
                  </div>
                </Card>
                <Card className="glass-card border-none p-6 text-left flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">XP Earned</h4>
                    <p className="text-2xl font-black">+{Math.round((score/100) * 100)} Points</p>
                  </div>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="rounded-full px-12 h-16 font-black text-lg w-full sm:w-auto" onClick={() => setStep(1)}>
                  Try Another Topic
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-12 h-16 font-bold text-lg w-full sm:w-auto" onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
