"use client";

import { useState } from "react";
import { Sparkles, Loader2, Map, ChevronRight, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AIRoadmap() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

  const generateRoadmap = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setRoadmap(null);
    try {
      const res = await fetch("/api/ai/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data.roadmap);
      }
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              AI Learning Roadmap
            </CardTitle>
            <CardDescription>Enter a goal and let AI create your path to mastery.</CardDescription>
          </div>
          <Map className="h-8 w-8 text-primary/20" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex gap-2 mb-8">
          <Input
            placeholder="e.g. Become a Senior React Developer or Learn UI Design"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1"
          />
          <Button onClick={generateRoadmap} disabled={loading || !topic}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Target className="h-4 w-4 mr-2" />}
            Generate Path
          </Button>
        </div>

        {roadmap && (
          <div className="space-y-6 relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border z-0" />
            
            {roadmap.map((step, index) => (
              <div key={index} className="flex gap-6 relative z-10 animate-in slide-in-from-left-5 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shrink-0 border-4 border-background">
                  {index + 1}
                </div>
                <div className="flex-1 pb-8">
                  <div className="glass-card p-5 rounded-xl border border-border group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-primary">{step.title}</h4>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        {step.duration}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {step.topics.map((t, ti) => (
                        <span key={ti} className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary px-2.5 py-1 rounded-full border border-primary/10 flex items-center gap-1">
                          <ChevronRight className="h-2 w-2" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!roadmap && !loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
            <Map className="h-16 w-16 mb-4" />
            <p className="text-muted-foreground max-w-sm">
              Your future starts with a single goal. Type it above to visualize your journey.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
