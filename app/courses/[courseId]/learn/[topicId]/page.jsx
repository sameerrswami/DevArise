"use client";

import { useState, useEffect } from "react";
import { 
  PlayCircle, 
  CheckCircle, 
  BookMarked, 
  StickyNote, 
  ListChecks, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Zap,
  HelpCircle,
  FileText,
  History,
  Lock,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { useRouter } from "next/navigation";

export default function CoursePlayer({ params }) {
  const { courseId, topicId } = params;
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [quizScore, setQuizScore] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();
      setCourse(data.course);
      
      // Find current topic
      const flatTopics = data.course.modules.flatMap(m => m.topics);
      const topic = flatTopics.find(t => t.id === topicId) || flatTopics[0];
      setCurrentTopic(topic);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
         <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
         <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Knowledge Studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex pt-16 h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-slate-900 border-r border-slate-800 transition-all duration-300 overflow-y-auto hidden lg:block`}>
           <div className="p-6">
              <h2 className="text-xl font-bold mb-1">{course?.title}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">Course Path</p>

              <div className="space-y-6">
                 {course?.modules.map((module, mIdx) => (
                   <div key={module.id} className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-2">
                         <span className="h-4 w-4 rounded bg-slate-800 flex items-center justify-center text-[8px] text-white">{mIdx + 1}</span>
                         {module.title}
                      </h3>
                      <div className="space-y-1">
                         {module.topics.map(topic => (
                            <button 
                              key={topic.id}
                              onClick={() => router.push(`/courses/${courseId}/learn/${topic.id}`)}
                              className={`w-full text-left p-3 rounded-xl text-sm transition-all group border ${
                                topic.id === topicId 
                                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400 font-bold' 
                                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                              }`}
                            >
                               <div className="flex items-center gap-3">
                                  {topic.isCompleted ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <PlayCircle className="h-4 w-4 opacity-50 group-hover:opacity-100" />}
                                  <span className="flex-1 truncate">{topic.title}</span>
                                  {topic.isPremium && <Lock className="h-3 w-3 text-amber-500" />}
                               </div>
                            </button>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 custom-scrollbar p-6 md:p-10">
           <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="flex justify-between items-start">
                 <div>
                    <div className="flex items-center gap-2 text-violet-400 text-[10px] font-black uppercase tracking-widest mb-2">
                       <History className="h-3 w-3" /> Topic: {currentTopic?.order + 1}
                    </div>
                    <h1 className="text-3xl font-black">{currentTopic?.title}</h1>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" className="rounded-2xl border-slate-800 bg-slate-900/50 hover:bg-slate-800">
                       <BookMarked className="h-4 w-4" />
                    </Button>
                    <Button className="rounded-2xl bg-violet-600 hover:bg-violet-500 px-6 font-bold">
                       Complete Topic
                    </Button>
                 </div>
              </div>

              {/* Video Player */}
              <div className="aspect-video bg-black rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl relative group">
                 {currentTopic?.youtubeId ? (
                   <iframe 
                    src={`https://www.youtube.com/embed/${currentTopic.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                    className="w-full h-full"
                    allowFullScreen
                    title={currentTopic.title}
                   />
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <PlayCircle className="h-20 w-20 text-slate-800" />
                      <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Waiting for Media stream...</p>
                   </div>
                 )}
              </div>

              {/* Learning Hub Tabs */}
              <Tabs defaultValue="notes" className="w-full">
                 <div className="flex justify-between items-center mb-6">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-2xl">
                       <TabsTrigger value="notes" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all font-bold">
                          <StickyNote className="h-4 w-4 mr-2" /> Notes
                       </TabsTrigger>
                       <TabsTrigger value="quiz" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all font-bold">
                          <ListChecks className="h-4 w-4 mr-2" /> Quiz
                       </TabsTrigger>
                       <TabsTrigger value="interview" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all font-bold">
                          <Zap className="h-4 w-4 mr-2" /> Interview Qs
                       </TabsTrigger>
                    </TabsList>
                 </div>

                 <TabsContent value="notes" className="space-y-6">
                    <Card className="bg-slate-900/30 border border-slate-800 rounded-[32px] p-8">
                       <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-violet-500" /> AI-Powered Summary
                       </h3>
                       <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed italic">
                          {currentTopic?.summary || "Analyzing topic content to generate concise insights... Master the core logic of this concept through our distilled notes."}
                       </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Card className="bg-slate-900/30 border border-slate-800 rounded-[32px] p-8">
                          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Key Takeaways</h4>
                          <ul className="space-y-3">
                             {[1,2,3].map(i => (
                               <li key={i} className="flex gap-3 text-sm text-slate-400">
                                  <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                                  <span>Dynamic concept highlighting core logic and architectural trade-offs in this computer science fundamental.</span>
                               </li>
                             ))}
                          </ul>
                       </Card>
                       <Card className="bg-slate-900/40 border-2 border-violet-500/20 rounded-[32px] p-8 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                             <Zap className="h-20 w-20 text-white" />
                          </div>
                          <h4 className="text-[10px] font-black uppercase text-violet-400 tracking-widest mb-2">High-Yield Focus</h4>
                          <p className="text-sm font-bold text-white mb-4">Most frequent interview question associated with this topic:</p>
                          <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-violet-500 pl-4 py-2">
                            "Explain the critical difference between this architectural pattern and its traditional counterpart in distributed systems."
                          </p>
                       </Card>
                    </div>
                 </TabsContent>

                 <TabsContent value="quiz" className="space-y-6">
                    <div className="text-center py-12 space-y-6">
                       <div className="h-20 w-20 bg-violet-600/10 border border-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <HelpCircle className="h-10 w-10 text-violet-400" />
                       </div>
                       <h3 className="text-2xl font-black">Active Recall Challenge</h3>
                       <p className="text-slate-500 max-w-md mx-auto">Validate your understanding of this topic through a quick 5-question conceptual drill.</p>
                       <Button className="bg-violet-600 hover:bg-violet-500 px-10 h-14 rounded-2xl font-bold flex gap-2 mx-auto">
                          Start Topic Assessment <ArrowRight className="h-4 w-4" />
                       </Button>
                    </div>
                 </TabsContent>
              </Tabs>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-10 border-t border-slate-900">
                 <Button variant="ghost" className="gap-2 text-slate-500 hover:text-white transition-all">
                    <ChevronLeft className="h-4 w-4" /> Previous Topic
                 </Button>
                 <Button variant="ghost" className="gap-2 text-slate-500 hover:text-white transition-all">
                    Next Topic <ChevronRight className="h-4 w-4" />
                 </Button>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}
