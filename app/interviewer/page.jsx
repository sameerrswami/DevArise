"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, Video, Mic, CheckCircle2, Star, Play, Sparkles } from "lucide-react";
import { AddInterview } from "@/app/dashboard/_components/AddInterview";
import { InterviewList } from "@/app/dashboard/_components/InterviewList";

export default function AIInterviewer() {
  const { data: session } = useSession();
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Next-Gen Career Prep
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
              Master Your Next <br />
              <span className="gradient-text">Interview</span> With AI
            </h1>
            <p className="text-muted-foreground text-xl max-w-xl">
              Get personalized questions, real-time feedback, and step-by-step guidance 
              to land your dream job at top-tier tech companies.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <AddInterview onSuccess={() => setRefresh(!refresh)} />
              <Button variant="outline" size="lg" className="rounded-xl">
                Watch Demo
              </Button>
            </div>
          </div>
          
          <div className="flex-1 relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <Card className="relative glass-card border-none shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
              <div className="bg-primary/20 h-20 w-20 rounded-full flex items-center justify-center animate-pulse">
                <Video className="h-10 w-10 text-primary" />
              </div>
            </Card>
            
            {/* Quick stats floating cards */}
            <div className="absolute -bottom-6 -left-6 bg-background p-4 rounded-xl shadow-xl border border-border/50 animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Confidence</p>
                  <p className="text-lg font-black">+45% Increase</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="glass-card border-none shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Role Specific</CardTitle>
              <CardDescription>Tailored questions for Frontend, Backend, AI, Data Science, and more.</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-card border-none shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                <Mic className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Voice Enabled</CardTitle>
              <CardDescription>Practice with voice or text to simulate a real-life interview environment.</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-card border-none shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Expert Feedback</CardTitle>
              <CardDescription>Get detailed ratings and constructive feedback on every answer you give.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Your Interview History</h2>
          </div>
          <InterviewList 
            onRefresh={() => setRefresh(!refresh)} 
            key={refresh}
          />
        </div>
      </main>
    </div>
  );
}
