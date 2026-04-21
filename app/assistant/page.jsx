"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Sparkles, Lightbulb, Briefcase, GraduationCap } from "lucide-react";

export default function CareerAssistant() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([
    {
      role: "model",
      content: "Hey! I'm your DevArise AI Buddy. Think of me as your chill senior who's been through the grind and is here to keep you sane, motivated, and moving forward. Whether it's placement stress, coding struggles, or just needing a consistency boost—I've got your back. What's on your mind?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newHistory = [...messages.map(m => ({ role: m.role, content: m.content }))];
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: newHistory
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "model", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "model", content: "I'm sorry, I'm having trouble connecting to my neural network right now. Please try again later.", isError: true }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "model", content: "I'm sorry, an unexpected error occurred. Please try again.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const promptSuggestions = [
    { title: "Feeling Burned Out", text: "I'm feeling really stressed about placements. How do I stay consistent?", icon: <Sparkles className="h-4 w-4" /> },
    { title: "Daily Goal", text: "Suggest a small actionable goal for me today to stay on track.", icon: <GraduationCap className="h-4 w-4" /> },
    { title: "Explain like a Senior", text: "Can you explain Recursion using a simple college analogy?", icon: <Lightbulb className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 py-8 md:py-12 flex flex-col">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary shadow-glow" />
              DevArise AI Buddy
            </h1>
            <p className="text-muted-foreground mt-2">
              Your chill senior mentor for motivation, consistency, and surviving placement season.
            </p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col glass-card border-none shadow-2xl overflow-hidden min-h-[600px]">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-6 max-w-3xl mx-auto py-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-md ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                  }`}>
                    {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
                  </div>
                  
                  <div className={`group flex flex-col max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-5 py-3.5 rounded-2xl ${
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted/80 backdrop-blur-sm shadow-sm rounded-tl-sm text-foreground"
                    } ${message.isError ? "border-destructive/50 bg-destructive/10 text-destructive" : ""}`}>
                      <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-md">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div className="bg-muted/80 backdrop-blur-sm shadow-sm px-5 py-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/50">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mb-4 max-w-3xl mx-auto">
                {promptSuggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="bg-background/50 hover:bg-primary hover:text-primary-foreground border-border/50 rounded-full transition-all"
                    onClick={() => {
                      setInput(suggestion.text);
                    }}
                  >
                    {suggestion.icon}
                    <span className="ml-2">{suggestion.title}</span>
                  </Button>
                ))}
              </div>
            )}
            
            <div className="max-w-3xl mx-auto relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Chat with your senior buddy... (e.g. 'Feeling stressed', 'Explain DNS like I'm 5')"
                className="pr-14 py-6 rounded-full shadow-inner bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary text-base"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="absolute right-2 rounded-full h-10 w-10 shadow-md hover:scale-105 transition-transform"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              AI can make mistakes. Consider verifying important information.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
